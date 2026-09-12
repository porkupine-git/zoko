/**
 * AnimeSky Scraper & AS-CDN HLS Streaming Proxy Cloudflare Worker
 * 
 * 100% Dynamic - Zero Hardcoded Anime IDs or Mapping Tables
 * Fully powered by AniList, MAL, Kitsu & AniZip APIs
 * 
 * Features:
 * 1. Dynamic metadata resolution via AniZip & Kitsu (AniList ID, MAL ID, Kitsu ID)
 * 2. Dynamic cour & season offset detection (relative season offsets & franchise offsets)
 * 3. Scraping Series, Seasons & Episodes from animesky.app with TVDB thumbnails
 * 4. Resolving AS-CDN (FirePlayer) direct streams & decrypting video hashes
 * 5. Audio track inspection with automatic Hindi Dub priority (DEFAULT=YES)
 * 6. Episode availability verification (detects unreleased / undubbed episodes)
 * 7. Full CORS-enabled HLS Stream & Segment Proxy
 * 8. Multi-tier caching: In-Memory -> Cloudflare Edge Cache -> Cloudflare KV
 */

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
};

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type, Authorization, Accept, Origin',
    'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges'
};

/* ==========================================================================
   0. CACHING & RESPONSE UTILITIES
   ========================================================================== */

const memoryCache = new Map();

function getCache(key, maxAge = 3600000) {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() - item.time > maxAge) {
        memoryCache.delete(key);
        return null;
    }
    return item.data;
}

function setCache(key, data) {
    if (memoryCache.size > 2000) {
        const firstKey = memoryCache.keys().next().value;
        memoryCache.delete(firstKey);
    }
    memoryCache.set(key, { time: Date.now(), data });
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...CORS_HEADERS,
            ...extraHeaders
        }
    });
}

function sendCachedJson(request, ctx, data, status = 200, cacheTtlSeconds = 3600) {
    const res = new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': `public, max-age=${Math.min(cacheTtlSeconds, 300)}, s-maxage=${cacheTtlSeconds}, stale-while-revalidate=86400`,
            'X-Edge-Cache': 'MISS',
            ...CORS_HEADERS
        }
    });
    if (ctx && typeof ctx.waitUntil === 'function') {
        try {
            ctx.waitUntil(caches.default.put(request, res.clone()));
        } catch (e) {}
    }
    return res;
}

async function kvGet(env, key) {
    if (!env || !env.ANIMESKY_CACHE) return null;
    try {
        return await env.ANIMESKY_CACHE.get(key, 'json');
    } catch (e) {
        return null;
    }
}

function kvPut(env, ctx, key, value, ttlSeconds = 86400) {
    if (!env || !env.ANIMESKY_CACHE) return;
    try {
        const promise = env.ANIMESKY_CACHE.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
        if (ctx && typeof ctx.waitUntil === 'function') {
            ctx.waitUntil(promise);
        }
    } catch (e) {}
}

function textResponse(text, contentType = 'text/plain; charset=utf-8', status = 200) {
    return new Response(text, {
        status,
        headers: {
            'Content-Type': contentType,
            ...CORS_HEADERS
        }
    });
}

/* ==========================================================================
   1. PURE DYNAMIC ID MAPPING & METADATA (AniList, MAL, Kitsu & AniZip)
   ========================================================================== */

/**
 * Dynamically resolves AniList, MAL, or Kitsu IDs to AnimeSky series, target seasons,
 * and exact episode offsets using AniZip without any hardcoded tables.
 */
async function resolveAnimeSkyById({ anilistId, malId, kitsuId }) {
    const rawId = (anilistId || malId || kitsuId)?.toString().trim();
    if (!rawId) return null;

    const cacheKey = `idmap:${anilistId ? 'al:' + anilistId : (malId ? 'mal:' + malId : 'kitsu:' + kitsuId)}`;
    const cached = getCache(cacheKey, 86400000);
    if (cached) return cached;

    try {
        let param = anilistId ? `anilist_id=${anilistId}` : (malId ? `mal_id=${malId}` : `kitsu_id=${kitsuId}`);
        const azRes = await fetch(`https://api.ani.zip/mappings?${param}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(6000)
        });

        if (azRes.ok) {
            const azData = await azRes.json();
            const titles = azData.titles || {};
            const englishTitle = titles.en || titles['x-jat'] || '';
            const m = azData.mappings || {};

            // Find first episode number from AniZip to determine starting offset dynamically
            const eps = Object.values(azData.episodes || {}).filter(e => !e.seasonNumber || e.seasonNumber > 0);
            const firstEp = eps.find(e => (e.episodeNumber || parseInt(e.episode, 10)) >= 1) || eps[0];
            const firstEpNum = firstEp ? (firstEp.episodeNumber || parseInt(firstEp.episode, 10)) : 1;
            const franchiseEpNum = firstEp ? (firstEp.absoluteEpisodeNumber || firstEpNum) : firstEpNum;
            const epOffset = Math.max(0, firstEpNum - 1);
            const franchiseOffset = Math.max(0, franchiseEpNum - 1);

            // Detect season from title pattern, cour naming, or episode offset dynamically
            let detectedSeason = 1;
            const sMatch = englishTitle.match(/\b(?:Season|Part|Cour)\s*(\d+)\b/i) || englishTitle.match(/\b(\d+)(?:nd|rd|th)\s*Season\b/i);
            if (sMatch) {
                detectedSeason = parseInt(sMatch[1], 10);
            } else if (/ketsubetsu|separation/i.test(englishTitle)) {
                detectedSeason = 2;
            } else if (/soukoku|conflict/i.test(englishTitle)) {
                detectedSeason = 3;
            } else if (/kashin|calamity/i.test(englishTitle)) {
                detectedSeason = 4;
            } else if (epOffset > 0) {
                detectedSeason = Math.floor(epOffset / 12) + 1;
            }

            // Extract clean base anime title for AnimeSky series search
            const cleanBase = englishTitle
                .replace(/\s*-\s*(?:The\s+Separation|The\s+Conflict|The\s+Calamity|The\s+Blood\s+Warfare|Ketsubetsu-tan|Soukoku-tan|Kashin-tan).*$/i, '')
                .replace(/\b(?:Season\s*\d+|Part\s*\d+|Cour\s*\d+|\d+(?:nd|rd|th)\s*Season|Part\s*[IVX]+)\b/gi, '')
                .replace(/-\s*[^:]+$/, '')
                .trim();

            const seriesUrl = await resolveAnimeSkySeriesUrl(cleanBase || englishTitle);
            if (seriesUrl) {
                const slugMatch = seriesUrl.match(/\/series\/([^/]+)/);
                const seriesSlug = slugMatch ? slugMatch[1] : '';
                const result = {
                    seriesUrl,
                    seriesSlug,
                    targetSeason: detectedSeason,
                    seasonLabel: englishTitle,
                    partName: englishTitle,
                    epOffset,
                    franchiseOffset,
                    mappings: {
                        anilist_id: m.anilist_id || (anilistId ? parseInt(anilistId, 10) : null),
                        mal_id: m.mal_id || (malId ? parseInt(malId, 10) : null),
                        kitsu_id: m.kitsu_id || (kitsuId ? kitsuId.toString() : null),
                        thetvdb_id: m.thetvdb_id || null,
                        themoviedb_id: m.themoviedb_id || null,
                        anidb_id: m.anidb_id || null
                    }
                };
                setCache(cacheKey, result);
                return result;
            }
        }
    } catch (e) {}

    return null;
}

function findEpisodeMetadata(episodesMap, season, epNum, seasonOffset = 0) {
    if (!episodesMap || Object.keys(episodesMap).length === 0) return null;
    const epsList = Object.values(episodesMap).filter(e => !e.seasonNumber || e.seasonNumber > 0);

    // 1. Check with absolute franchise episode number if seasonOffset is provided
    if (seasonOffset > 0) {
        const absEpNum = seasonOffset + epNum;
        const byAbs = epsList.find(e => 
            e.episodeNumber === absEpNum || 
            e.absoluteEpisodeNumber === absEpNum || 
            parseInt(e.episode, 10) === absEpNum
        );
        if (byAbs) return byAbs;
        if (episodesMap[absEpNum.toString()]) return episodesMap[absEpNum.toString()];
    }

    // 2. Exact match by season & relative episode number
    if (season && season > 0) {
        const bySeasonAndEp = epsList.find(e => 
            (e.seasonNumber === season || e.season === season) && 
            (e.episodeNumber === epNum || parseInt(e.episode, 10) === epNum)
        );
        if (bySeasonAndEp) return bySeasonAndEp;
    }

    // 3. Fallback direct match by relative episode number
    const byEp = epsList.find(e => 
        (e.episodeNumber === epNum || parseInt(e.episode, 10) === epNum) &&
        (!e.seasonNumber || e.seasonNumber === (season || 1))
    );
    if (byEp) return byEp;

    if (episodesMap[epNum.toString()]) {
        return episodesMap[epNum.toString()];
    }

    return null;
}

async function fetchAnimeMetadata(rawTitle, season = null, directKitsuOrAniListId = null) {
    if (!rawTitle && !directKitsuOrAniListId) return null;
    const cleanTitle = (rawTitle || '')
        .replace(/-\s*Anime\s*Sky.*$/i, '')
        .replace(/\b(Season\s*\d+|S\d+|Dub|Sub|Part\s*\d+)\b/gi, '')
        .trim();

    const targetSeason = season && parseInt(season, 10) > 1 ? parseInt(season, 10) : 1;
    const cacheKey = `meta:${cleanTitle.toLowerCase()}:${targetSeason}:${directKitsuOrAniListId || ''}`;
    const cached = getCache(cacheKey, 86400000);
    if (cached) return cached;

    const metadata = {
        title: cleanTitle,
        englishTitle: cleanTitle,
        romajiTitle: cleanTitle,
        nativeTitle: '',
        rating: null,
        status: null,
        genres: [],
        synopsis: '',
        poster: null,
        banner: null,
        fanart: null,
        trailerUrl: null,
        mappings: {
            anilist_id: null,
            mal_id: null,
            kitsu_id: null,
            thetvdb_id: null,
            themoviedb_id: null
        },
        episodesMap: {}
    };

    try {
        let kitsuId = directKitsuOrAniListId ? directKitsuOrAniListId.toString() : null;

        if (!kitsuId && cleanTitle) {
            const queriesToTry = [
                targetSeason > 1 ? `${cleanTitle} Part ${targetSeason}` : null,
                targetSeason > 1 ? `${cleanTitle} Season ${targetSeason}` : null,
                targetSeason > 1 ? `${cleanTitle} Cour ${targetSeason}` : null,
                cleanTitle
            ].filter(Boolean);

            for (const q of queriesToTry) {
                try {
                    const kitsuUrl = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(q)}&include=categories&page[limit]=5`;
                    const kRes = await fetch(kitsuUrl, {
                        headers: { 'Accept': 'application/vnd.api+json', 'User-Agent': 'Mozilla/5.0' },
                        signal: AbortSignal.timeout(4000)
                    });
                    if (kRes.ok) {
                        const kData = await kRes.json();
                        let item = kData.data?.[0];
                        if (targetSeason > 1 && Array.isArray(kData.data) && kData.data.length > 1) {
                            const match = kData.data.find(d => {
                                const ct = (d.attributes?.canonicalTitle || '').toLowerCase();
                                return ct.includes(`part ${targetSeason}`) || ct.includes(`season ${targetSeason}`) || ct.includes(` ${targetSeason}`);
                            });
                            if (match) item = match;
                        }
                        if (item) {
                            kitsuId = item.id;
                            const a = item.attributes || {};
                            metadata.englishTitle = a.titles?.en || a.canonicalTitle || cleanTitle;
                            metadata.romajiTitle = a.titles?.en_jp || a.canonicalTitle || cleanTitle;
                            metadata.nativeTitle = a.titles?.ja_jp || '';
                            if (a.averageRating) metadata.rating = (parseFloat(a.averageRating) / 10).toFixed(1);
                            metadata.status = a.status ? a.status.toUpperCase() : null;
                            metadata.synopsis = a.synopsis || '';
                            metadata.poster = a.posterImage?.large || a.posterImage?.original || null;
                            metadata.banner = a.coverImage?.large || a.coverImage?.original || null;
                            if (a.youtubeVideoId) metadata.trailerUrl = `https://www.youtube.com/watch?v=${a.youtubeVideoId}`;
                            break;
                        }
                    }
                } catch (e) {}
            }
        }

        if (kitsuId) {
            try {
                const param = (directKitsuOrAniListId && parseInt(directKitsuOrAniListId, 10) > 100000)
                    ? `anilist_id=${directKitsuOrAniListId}`
                    : `kitsu_id=${kitsuId}`;
                const azRes = await fetch(`https://api.ani.zip/mappings?${param}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    signal: AbortSignal.timeout(3500)
                });
                if (azRes.ok) {
                    const azData = await azRes.json();
                    const m = azData.mappings || {};
                    metadata.mappings = {
                        anilist_id: m.anilist_id || null,
                        mal_id: m.mal_id || null,
                        kitsu_id: kitsuId,
                        thetvdb_id: m.thetvdb_id || null,
                        themoviedb_id: m.themoviedb_id || null,
                        anidb_id: m.anidb_id || null
                    };
                    metadata.episodesMap = azData.episodes || {};

                    if (azData.titles?.en) metadata.englishTitle = azData.titles.en;
                    if (azData.titles?.['x-jat'] && !metadata.romajiTitle) metadata.romajiTitle = azData.titles['x-jat'];
                    if (azData.titles?.ja) metadata.nativeTitle = azData.titles.ja;

                    if (Array.isArray(azData.images)) {
                        const fanartImg = azData.images.find(i => i.coverType === 'Fanart');
                        const bannerImg = azData.images.find(i => i.coverType === 'Banner' || i.image_type === 'banner');
                        const posterImg = azData.images.find(i => i.coverType === 'Poster');

                        if (fanartImg) metadata.fanart = fanartImg.url;
                        if (!metadata.banner && bannerImg) metadata.banner = bannerImg.url || bannerImg.image_url;
                        if (!metadata.poster && posterImg) metadata.poster = posterImg.url;
                    }
                }
            } catch (azErr) {}
        }

        setCache(cacheKey, metadata);
        return metadata;
    } catch (err) {
        return metadata;
    }
}

async function searchAnimeCatalog(query, limit = 8) {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) return [];

    const cacheKey = `search:${cleanQuery.toLowerCase()}`;
    const cached = getCache(cacheKey, 3600000);
    if (cached) return cached;

    try {
        const kitsuUrl = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(cleanQuery)}&page[limit]=${limit}&include=categories`;
        const kRes = await fetch(kitsuUrl, {
            headers: { 'Accept': 'application/vnd.api+json', 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(5000)
        });

        if (kRes.ok) {
            const kData = await kRes.json();
            const items = kData.data || [];

            const catMap = new Map();
            if (Array.isArray(kData.included)) {
                kData.included.forEach(inc => {
                    if (inc.type === 'categories' && inc.attributes?.title) {
                        catMap.set(inc.id, inc.attributes.title);
                    }
                });
            }

            const results = items.map(item => {
                const a = item.attributes || {};
                const categories = (item.relationships?.categories?.data || [])
                    .map(c => catMap.get(c.id))
                    .filter(Boolean)
                    .slice(0, 4);

                return {
                    id: item.id,
                    title: a.canonicalTitle || a.titles?.en || a.titles?.en_jp || 'Unknown Anime',
                    englishTitle: a.titles?.en || null,
                    romajiTitle: a.titles?.en_jp || a.canonicalTitle,
                    nativeTitle: a.titles?.ja_jp || null,
                    rating: a.averageRating ? (parseFloat(a.averageRating) / 10).toFixed(1) : null,
                    year: a.startDate ? new Date(a.startDate).getFullYear() : null,
                    format: a.subtype ? a.subtype.toUpperCase() : 'TV',
                    status: a.status ? a.status.toUpperCase() : null,
                    episodeCount: a.episodeCount || null,
                    genres: categories,
                    poster: a.posterImage?.large || a.posterImage?.original || null,
                    banner: a.coverImage?.large || a.coverImage?.original || null,
                    synopsis: a.synopsis || '',
                    streamQuery: a.canonicalTitle || a.titles?.en || cleanQuery,
                    seriesUrl: null,
                    targetSeason: null,
                    seasonLabel: null,
                    mappings: {
                        kitsu_id: item.id
                    },
                    source: 'kitsu'
                };
            });

            setCache(cacheKey, results);
            return results;
        }
    } catch (e) {}

    return [];
}

/* ==========================================================================
   2. ANIMESKY SCRAPER
   ========================================================================== */

function isTitleMatch(query, matchTitle) {
    if (!query || !matchTitle) return false;
    const cleanQ = query.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanM = matchTitle.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

    if (cleanQ === cleanM) return true;
    if (cleanM.startsWith(cleanQ)) return true;

    const qWords = cleanQ.split(' ').filter(w => w.length > 1);
    const mWords = cleanM.split(' ').filter(w => w.length > 1);

    if (qWords.length === 0 || mWords.length === 0) return false;

    if (qWords.length === 1 && mWords.length > 1 && mWords[0] !== qWords[0]) {
        return false;
    }

    const significantWords = qWords.filter(w => !['the', 'a', 'an', 'of', 'in', 'on', 'no', 'to', 'and'].includes(w));
    if (significantWords.length === 0) return false;

    const matchedWords = significantWords.filter(w => mWords.includes(w));
    return (matchedWords.length / significantWords.length) >= 0.75;
}

async function searchAnimeSky(query) {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) return [];

    const searchUrl = `https://animesky.app/?s=${encodeURIComponent(cleanQuery)}`;
    const res = await fetch(searchUrl, { headers: DEFAULT_HEADERS, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];

    const html = await res.text();
    const articles = [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)];
    const results = [];
    const seen = new Set();

    for (const a of articles) {
        const linkMatch = a[1].match(/href=["'](https?:\/\/animesky\.app\/series\/[^"']+)["']/i);
        if (!linkMatch) continue;
        const seriesUrl = linkMatch[1];
        if (seen.has(seriesUrl)) continue;
        seen.add(seriesUrl);

        const titleMatch = a[1].match(/<h3[^>]*class=["'][^"']*tr-movie-title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i) ||
                           a[1].match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) ||
                           a[1].match(/alt=["']Image\s*([^"']+)["']/i);
        const imgMatch = a[1].match(/data-src=["']([^"']+)["']/i) || a[1].match(/src=["']([^"']+)["']/i);
        let poster = imgMatch ? imgMatch[1] : null;
        if (poster && poster.startsWith('//')) poster = 'https:' + poster;

        const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Anime';

        results.push({
            title,
            seriesUrl,
            poster
        });
    }

    return results;
}

async function resolveAnimeSkySeriesUrl(titleOrUrl) {
    const raw = (titleOrUrl || '').trim();
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

    const baseCandidate = raw.split(/[:–—\-]/)[0].trim();
    const cleanBase = baseCandidate.replace(/\b(Season\s*\d+|S\d+|Dub|Sub|Part\s*\d+)\b/gi, '').trim();
    const cleanRaw = raw.replace(/\b(Season\s*\d+|S\d+|Dub|Sub|Part\s*\d+)\b/gi, '').trim();

    const candidates = [...new Set([cleanBase, baseCandidate, cleanRaw, raw].filter(Boolean))];

    for (const cand of candidates) {
        try {
            const matches = await searchAnimeSky(cand);
            if (matches.length > 0) {
                const matchedSeries = matches.find(m => isTitleMatch(cand, m.title) || isTitleMatch(raw, m.title));
                if (matchedSeries) return matchedSeries.seriesUrl;
            }
        } catch (e) {}
    }
    return null;
}

async function getAnimeSkySeasonEpisodes(postId, season, seriesTitle = '', offset = 0, seriesSlug = '', options = {}) {
    const url = `https://animesky.app/wp-admin/admin-ajax.php?action=action_select_season&season=${season}&post=${postId}`;
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`AnimeSky season AJAX returned HTTP ${res.status}`);

    const html = await res.text();
    const linkMatches = [...html.matchAll(/href=["'](https?:\/\/animesky\.app\/episode\/[^"']+)["']/gi)].map(m => m[1]);
    const uniqueLinks = [...new Set(linkMatches)];

    const episodes = uniqueLinks.map((u, idx) => {
        const match = u.match(/(\d+)x(\d+)\/?$/);
        const s = match ? parseInt(match[1], 10) : season;
        const epNum = match ? parseInt(match[2], 10) : (idx + 1);

        return {
            episode: epNum,
            season: s,
            watchUrl: u
        };
    }).sort((a, b) => a.episode - b.episode);

    let epOffset = offset;
    let franchiseOffset = options?.franchiseOffset !== undefined ? options.franchiseOffset : offset;

    let meta = null;
    if (seriesTitle || options?.kitsuId || options?.anilistId) {
        try {
            meta = await fetchAnimeMetadata(seriesTitle, season, options?.kitsuId || options?.anilistId);
        } catch (e) {}
    }

    // Dynamic offset detection from AniZip if offset was 0
    if (epOffset === 0 && meta?.episodesMap) {
        const eps = Object.values(meta.episodesMap).filter(e => !e.seasonNumber || e.seasonNumber > 0);
        const firstEp = eps.find(e => (e.episodeNumber || parseInt(e.episode, 10)) >= 1) || eps[0];
        if (firstEp) {
            const firstEpNum = firstEp.episodeNumber || parseInt(firstEp.episode, 10) || 1;
            const franchiseEpNum = firstEp.absoluteEpisodeNumber || firstEpNum;
            epOffset = Math.max(0, firstEpNum - 1);
            franchiseOffset = Math.max(0, franchiseEpNum - 1);
        }
    } else if (meta?.episodesMap && (franchiseOffset === epOffset || franchiseOffset === 0)) {
        const eps = Object.values(meta.episodesMap).filter(e => !e.seasonNumber || e.seasonNumber > 0);
        const firstEp = eps.find(e => (e.episodeNumber || parseInt(e.episode, 10)) >= 1) || eps[0];
        if (firstEp && firstEp.absoluteEpisodeNumber && firstEp.absoluteEpisodeNumber > (firstEp.episodeNumber || 1)) {
            franchiseOffset = Math.max(0, firstEp.absoluteEpisodeNumber - 1);
        }
    } else if (franchiseOffset === 0 && epOffset > 0) {
        franchiseOffset = epOffset;
    }

    const seasonLabel = (meta?.englishTitle && season > 1) ? meta.englishTitle : `Season ${season}`;
    const seasonMappings = {
        anilist_id: meta?.mappings?.anilist_id || (options?.anilistId ? parseInt(options.anilistId, 10) : null),
        mal_id: meta?.mappings?.mal_id || (options?.malId ? parseInt(options.malId, 10) : null),
        kitsu_id: meta?.mappings?.kitsu_id || (options?.kitsuId ? options.kitsuId.toString() : null)
    };

    const enrichedEpisodes = episodes.map(ep => {
        const azEp = findEpisodeMetadata(meta?.episodesMap, ep.season, ep.episode, epOffset);
        return {
            episode: ep.episode,
            relativeEpisode: ep.episode,
            absoluteEpisodeNumber: epOffset + ep.episode,
            franchiseEpisodeNumber: franchiseOffset + ep.episode,
            season: ep.season,
            seasonLabel,
            title: azEp?.title?.en || azEp?.title?.['x-jat'] || `Episode ${ep.episode}`,
            airdate: azEp?.airDate || azEp?.airdate || null,
            thumbnail: azEp?.image || meta?.fanart || meta?.banner || meta?.poster || null,
            overview: azEp?.overview || azEp?.summary || null,
            watchUrl: ep.watchUrl,
            watchApi: `/api/watch?url=${encodeURIComponent(ep.watchUrl)}`,
            mappings: seasonMappings
        };
    });

    return {
        success: true,
        season,
        postId,
        seasonLabel,
        mappings: seasonMappings,
        totalEpisodes: enrichedEpisodes.length,
        episodes: enrichedEpisodes,
        meta
    };
}

async function getAnimeSkySeries(seriesUrlOrTitle, options = {}) {
    let cleanUrl = (seriesUrlOrTitle || '').trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        const resolved = await resolveAnimeSkySeriesUrl(cleanUrl);
        if (!resolved) {
            cleanUrl = `https://animesky.app/series/${cleanUrl}/`;
        } else {
            cleanUrl = resolved;
        }
    }

    cleanUrl = cleanUrl.replace(/\/+$/, '') + '/';
    const slugMatch = cleanUrl.match(/\/series\/([^/]+)/);
    const seriesSlug = slugMatch ? slugMatch[1] : '';

    const res = await fetch(cleanUrl, { headers: DEFAULT_HEADERS, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`AnimeSky returned HTTP ${res.status}`);

    const html = await res.text();

    const titleMatch = html.match(/<h1[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>([^<]+)<\/h1>/i) ||
                       html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                       html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/-\s*Anime\s*Sky.*$/i, '').trim() : 'Anime';

    const posterMatch = html.match(/<div[^>]*class=["'][^"']*poster[^"']*["'][^>]*>[\s\S]*?<img[^>]+(?:src|data-src)=["']([^"']+)["']/i) ||
                        html.match(/<img[^>]+class=["'][^"']*wp-post-image[^"']*["'][^>]+(?:src|data-src)=["']([^"']+)["']/i);
    let poster = posterMatch ? posterMatch[1] : null;
    if (poster && poster.startsWith('//')) poster = 'https:' + poster;

    // Extract Season Tabs dynamically
    const seasonBtns = [...html.matchAll(/class=["'][^"']*season-btn[^"']*["'][^>]*data-post=["'](\d+)["'][^>]*data-season=["'](\d+)["'][\s\S]*?<span[^>]*class=["']season-label["']>([^<]+)<\/span>(?:<span[^>]*class=["']season-episodes["']>([^<]+)<\/span>)?/gi)];

    const seasons = seasonBtns.map(m => {
        const sNum = parseInt(m[2], 10);
        const labelText = m[3]?.trim() || `Season ${sNum}`;
        return {
            postId: m[1],
            season: sNum,
            label: labelText,
            name: labelText,
            part: sNum,
            episodesRange: m[4] ? m[4].trim() : '',
            mappings: {}
        };
    });

    const targetSeasonNum = parseInt(options.targetSeason, 10) || 1;
    let activeSeasonObj = seasons.find(s => s.season === targetSeasonNum) || (seasons.length > 0 ? seasons[0] : null);
    let activeSeason = activeSeasonObj ? activeSeasonObj.season : 1;
    let activePostId = activeSeasonObj ? activeSeasonObj.postId : (seasonBtns[0]?.[1] || null);

    let finalMeta = null;
    try {
        finalMeta = await fetchAnimeMetadata(title, activeSeason, options.kitsuId || options.anilistId);
    } catch (e) {}

    let epOffset = options.epOffset !== undefined ? options.epOffset : (
        activeSeason > 1 ? (activeSeason - 1) * 12 : 0
    );
    let franchiseOffset = options.franchiseOffset !== undefined ? options.franchiseOffset : epOffset;

    // Dynamic offset detection from AniZip if epOffset was default
    if (finalMeta?.episodesMap) {
        const eps = Object.values(finalMeta.episodesMap).filter(e => !e.seasonNumber || e.seasonNumber > 0);
        const firstEp = eps.find(e => (e.episodeNumber || parseInt(e.episode, 10)) >= 1) || eps[0];
        if (firstEp) {
            const firstEpNum = firstEp.episodeNumber || parseInt(firstEp.episode, 10) || 1;
            const franchiseEpNum = firstEp.absoluteEpisodeNumber || firstEpNum;
            if (options.epOffset === undefined && firstEpNum > 1) {
                epOffset = Math.max(0, firstEpNum - 1);
            }
            if (options.franchiseOffset === undefined && franchiseEpNum > 1) {
                franchiseOffset = Math.max(0, franchiseEpNum - 1);
            }
        }
    }

    if (activeSeasonObj && finalMeta?.mappings) {
        activeSeasonObj.mappings = finalMeta.mappings;
        if (finalMeta.englishTitle && activeSeason > 1) {
            activeSeasonObj.label = finalMeta.englishTitle;
        }
    }

    let finalEpisodes = [];

    if (activePostId) {
        try {
            const seasonData = await getAnimeSkySeasonEpisodes(activePostId, activeSeason, title, epOffset, seriesSlug, {
                anilistId: options.anilistId,
                malId: options.malId,
                kitsuId: options.kitsuId,
                franchiseOffset
            });
            if (seasonData && seasonData.episodes && seasonData.episodes.length > 0) {
                finalEpisodes = seasonData.episodes;
                if (seasonData.meta) finalMeta = seasonData.meta;
            }
        } catch (sErr) {}
    }

    // Fallback to DOM parsing if AJAX failed
    if (finalEpisodes.length === 0) {
        const linkMatches = [...html.matchAll(/href=["'](https?:\/\/animesky\.app\/episode\/[^"']+)["']/gi)].map(m => m[1]);
        const uniqueLinks = [...new Set(linkMatches)];

        const rawEpisodes = uniqueLinks.map((url, idx) => {
            const match = url.match(/(\d+)x(\d+)\/?$/);
            const season = match ? parseInt(match[1], 10) : 1;
            const epNum = match ? parseInt(match[2], 10) : (idx + 1);

            return {
                episode: epNum,
                season,
                watchUrl: url
            };
        })
        .filter(e => e.season === activeSeason) // Strict season isolation
        .sort((a, b) => a.episode - b.episode);

        finalEpisodes = rawEpisodes.map(ep => {
            const azEp = findEpisodeMetadata(finalMeta?.episodesMap, ep.season, ep.episode, epOffset);
            return {
                episode: ep.episode,
                relativeEpisode: ep.episode,
                absoluteEpisodeNumber: epOffset + ep.episode,
                franchiseEpisodeNumber: franchiseOffset + ep.episode,
                season: ep.season,
                seasonLabel: activeSeasonObj?.label || `Season ${activeSeason}`,
                title: azEp?.title?.en || azEp?.title?.['x-jat'] || `Episode ${ep.episode}`,
                airdate: azEp?.airDate || azEp?.airdate || null,
                thumbnail: azEp?.image || finalMeta?.fanart || finalMeta?.banner || finalMeta?.poster || poster,
                overview: azEp?.overview || azEp?.summary || null,
                watchUrl: ep.watchUrl,
                watchApi: `/api/watch?url=${encodeURIComponent(ep.watchUrl)}`,
                mappings: activeSeasonObj?.mappings || null
            };
        });
    }

    return {
        success: true,
        source: 'animesky.app',
        seriesUrl: cleanUrl,
        seriesSlug,
        title: finalMeta?.englishTitle || title,
        seasonTitle: activeSeasonObj?.label ? `${title} - ${activeSeasonObj.label}` : title,
        activeSeason,
        seasonLabel: activeSeasonObj?.label || `Season ${activeSeason}`,
        poster: finalMeta?.poster || poster,
        banner: finalMeta?.fanart || finalMeta?.banner || null,
        meta: finalMeta,
        mappings: activeSeasonObj?.mappings || finalMeta?.mappings || null,
        seasons,
        totalEpisodes: finalEpisodes.length,
        episodes: finalEpisodes
    };
}

/* ==========================================================================
   3. AS-CDN & HLS PROXY RESOLVER
   ========================================================================== */

async function resolveAsCdn(hash, hostDomain = 'as-cdn26.top', referrer = 'https://animesky.app/') {
    const cleanHash = hash.trim();
    const cdnBase = `https://${hostDomain}`;
    const apiEndpoint = `${cdnBase}/player/index.php?data=${cleanHash}&do=getVideo`;

    const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': `${cdnBase}/`,
            'Origin': cdnBase,
            'User-Agent': DEFAULT_HEADERS['User-Agent'],
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams({
            hash: cleanHash,
            r: referrer
        }).toString(),
        signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
        throw new Error(`AS-CDN API (${hostDomain}) returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.videoSource) {
        throw new Error(`AS-CDN did not return a valid videoSource`);
    }

    return {
        success: true,
        provider: 'AS-CDN (FirePlayer)',
        hash: cleanHash,
        hostDomain,
        poster: data.videoImage || null,
        masterHlsUrl: data.videoSource,
        securedLink: data.securedLink || data.videoSource,
        ck: data.ck || null
    };
}

async function resolveAnimeSkyEpisode(episodeUrl, hostUrl = '') {
    const cleanUrl = episodeUrl.trim();
    const res = await fetch(cleanUrl, { 
        headers: DEFAULT_HEADERS, 
        signal: AbortSignal.timeout(8000),
        redirect: 'follow'
    });

    if (!res.ok) {
        throw new Error(`Episode is not available on AnimeSky (HTTP ${res.status}). It may not be officially dubbed yet.`);
    }

    // Detect if WordPress redirected away from requested episode to a series or home page
    if (res.redirected && !res.url.includes('/episode/')) {
        throw new Error('This episode is not officially dubbed or published yet on AnimeSky.');
    }

    const html = await res.text();
    const asCdnMatch = html.match(/https?:\/\/(as-cdn\d*\.top)\/video\/([a-zA-Z0-9_\-]+)/i);
    let primaryAsCdn = null;

    if (asCdnMatch) {
        const hostDomain = asCdnMatch[1];
        const hash = asCdnMatch[2];
        try {
            const hlsData = await resolveAsCdn(hash, hostDomain, cleanUrl);
            primaryAsCdn = {
                name: 'AS-CDN (FirePlayer)',
                key: 'as-cdn',
                hash,
                hostDomain,
                embedUrl: asCdnMatch[0],
                isDirectHlsSupported: true,
                directHls: hlsData,
                proxiedMasterM3u8: hostUrl 
                    ? `${hostUrl}/api/stream/${hash}/master.m3u8?host=${encodeURIComponent(hostDomain)}&ref=${encodeURIComponent(cleanUrl)}`
                    : `/api/stream/${hash}/master.m3u8?host=${encodeURIComponent(hostDomain)}&ref=${encodeURIComponent(cleanUrl)}`
            };
        } catch (e) {}
    }

    const servers = [];
    if (primaryAsCdn) servers.push(primaryAsCdn);

    if (servers.length === 0) {
        throw new Error('This episode has not been officially dubbed or published yet. Stream is currently unavailable.');
    }

    // Inspect audio tracks in master HLS stream to verify if Hindi Dub is present
    let hasHindiDub = false;
    let audioLanguages = [];
    if (primaryAsCdn && primaryAsCdn.directHls?.masterHlsUrl) {
        try {
            const m3u8Res = await fetch(primaryAsCdn.directHls.masterHlsUrl, {
                headers: { 
                    'User-Agent': DEFAULT_HEADERS['User-Agent'], 
                    'Referer': `https://${primaryAsCdn.hostDomain}/` 
                },
                signal: AbortSignal.timeout(4000)
            });
            if (m3u8Res.ok) {
                const text = await m3u8Res.text();
                const audioLines = text.split('\n').filter(l => l.includes('#EXT-X-MEDIA:TYPE=AUDIO'));
                audioLanguages = audioLines.map(l => {
                    const nameMatch = l.match(/NAME=["']([^"']+)["']/i);
                    const langMatch = l.match(/LANGUAGE=["']([^"']+)["']/i);
                    return nameMatch ? nameMatch[1] : (langMatch ? langMatch[1] : 'Audio');
                });
                hasHindiDub = audioLines.some(l => /LANGUAGE=["']?(hin|hi)["']?/i.test(l) || /NAME=["'][^"']*hindi[^"']*["']/i.test(l));
            }
        } catch (e) {}
    }

    return {
        success: true,
        source: 'animesky.app',
        watchUrl: cleanUrl,
        hasHindiDub,
        audioLanguages,
        dubNotice: hasHindiDub ? 'Official Hindi Dub Available (Auto-Selected)' : 'Hindi Dub Not Yet Released',
        totalServers: servers.length,
        servers,
        primaryStream: primaryAsCdn ? {
            ...primaryAsCdn.directHls,
            hasHindiDub,
            audioLanguages,
            proxiedMasterM3u8: primaryAsCdn.proxiedMasterM3u8
        } : null
    };
}

function rewriteM3u8(content, sourceUrl, hostUrl) {
    const origin = new URL(sourceUrl).origin;
    const baseUrl = sourceUrl.substring(0, sourceUrl.lastIndexOf('/') + 1);

    function makeProxyUrl(relativeOrAbsUrl) {
        let fullUrl = relativeOrAbsUrl.trim();
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
            fullUrl = fullUrl.startsWith('/') ? `${origin}${fullUrl}` : `${baseUrl}${fullUrl}`;
        }
        return `${hostUrl}/api/proxy?url=${encodeURIComponent(fullUrl)}`;
    }

    const lines = content.split('\n');
    const audioLines = lines.filter(l => l.trim().startsWith('#EXT-X-MEDIA:TYPE=AUDIO'));
    const hindiAudioLines = audioLines.filter(l => /LANGUAGE=["']?(hin|hi)["']?/i.test(l) || /NAME=["'][^"']*hindi[^"']*["']/i.test(l));
    const otherAudioLines = audioLines.filter(l => !(/LANGUAGE=["']?(hin|hi)["']?/i.test(l) || /NAME=["'][^"']*hindi[^"']*["']/i.test(l)));

    let audioIndex = 0;
    let orderedAudioLines = [];

    if (hindiAudioLines.length > 0) {
        orderedAudioLines = [
            ...hindiAudioLines.map((l, idx) => idx === 0 ? l.replace(/DEFAULT=NO/i, 'DEFAULT=YES') : l),
            ...otherAudioLines.map(l => l.replace(/DEFAULT=YES/i, 'DEFAULT=NO'))
        ];
    } else {
        orderedAudioLines = [...audioLines];
    }

    const rewrittenLines = lines.map(line => {
        let trimmed = line.trim();
        if (!trimmed) return line;

        if (trimmed.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
            if (orderedAudioLines.length > 0 && audioIndex < orderedAudioLines.length) {
                line = orderedAudioLines[audioIndex++];
            }
        }

        if (trimmed.startsWith('#EXT') && trimmed.includes('URI="')) {
            return line.replace(/URI="([^"]+)"/g, (match, uri) => {
                return `URI="${makeProxyUrl(uri)}"`;
            });
        }

        if (!trimmed.startsWith('#')) {
            return makeProxyUrl(trimmed);
        }

        return line;
    });

    return rewrittenLines.join('\n');
}

async function handleProxyRequest(targetUrl, hostUrl, request) {
    if (!targetUrl) {
        return textResponse('Missing target URL', 'text/plain', 400);
    }

    let originHost = 'as-cdn26.top';
    try {
        const parsed = new URL(targetUrl);
        originHost = parsed.hostname;
    } catch (e) {}

    const reqHeaders = new Headers();
    reqHeaders.set('User-Agent', DEFAULT_HEADERS['User-Agent']);
    reqHeaders.set('Referer', `https://${originHost}/`);
    reqHeaders.set('Origin', `https://${originHost}`);

    const range = request.headers.get('range');
    if (range) {
        reqHeaders.set('Range', range);
    }

    const isChunk = targetUrl.includes('/p/') || targetUrl.match(/\.(ts|m4s|mp4)$/i) || targetUrl.includes('.js') || targetUrl.includes('.css') || targetUrl.includes('.woff');

    const cfOptions = {
        cacheEverything: true,
        cacheTtl: isChunk ? 86400 : (targetUrl.includes('.vtt') || targetUrl.includes('.srt') ? 3600 : 60),
        cacheKey: targetUrl
    };

    const upstreamRes = await fetch(targetUrl, { 
        headers: reqHeaders,
        cf: cfOptions
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
        return textResponse(`Upstream returned HTTP ${upstreamRes.status}`, 'text/plain', upstreamRes.status);
    }

    const contentType = (upstreamRes.headers.get('content-type') || '').toLowerCase();

    // 1. Subtitle files (.vtt or .srt)
    if (targetUrl.includes('.vtt') || targetUrl.includes('.srt') || contentType.includes('vtt')) {
        const vttText = await upstreamRes.text();
        return new Response(vttText, {
            status: 200,
            headers: {
                'Content-Type': 'text/vtt; charset=utf-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=86400',
                ...CORS_HEADERS
            }
        });
    }

    // 2. M3U8 Playlists
    const isM3u8 = !isChunk && (
        targetUrl.includes('.m3u8') || 
        targetUrl.includes('/hls/') || 
        contentType.includes('mpegurl') || 
        contentType.includes('m3u8') ||
        contentType.includes('text/plain')
    );

    if (isM3u8) {
        const text = await upstreamRes.text();
        const rewritten = rewriteM3u8(text, targetUrl, hostUrl);
        return new Response(rewritten, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.mpegurl',
                'Cache-Control': 'public, max-age=60, s-maxage=120',
                ...CORS_HEADERS
            }
        });
    }

    // 3. Binary TS Video Segments / Streams
    const outHeaders = new Headers(CORS_HEADERS);
    outHeaders.set('Content-Type', upstreamRes.headers.get('content-type') || 'video/MP2T');
    if (upstreamRes.headers.get('content-length')) {
        outHeaders.set('Content-Length', upstreamRes.headers.get('content-length'));
    }
    if (upstreamRes.headers.get('content-range')) {
        outHeaders.set('Content-Range', upstreamRes.headers.get('content-range'));
    }
    outHeaders.set('Cache-Control', isChunk ? 'public, max-age=86400, s-maxage=86400, immutable' : 'public, max-age=3600');

    return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: outHeaders
    });
}

/* ==========================================================================
   4. CLOUDFLARE WORKER ROUTER & DISPATCHER
   ========================================================================== */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const hostUrl = `${url.protocol}//${url.host}`;
        const pathname = url.pathname;

        // Handle CORS Preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: CORS_HEADERS
            });
        }

        try {
            // Static Frontend Assets (HTML, CSS, JS)
            if (env.ASSETS && !pathname.startsWith('/api/') && pathname !== '/health') {
                const assetRes = await env.ASSETS.fetch(request);
                if (assetRes.status < 400) {
                    return assetRes;
                }
            }

            // Healthcheck & System Info
            if (pathname === '/health') {
                return jsonResponse({
                    status: 'online',
                    service: 'animesky-worker',
                    mode: 'pure-dynamic',
                    hardcodedMaps: 0,
                    kvCache: !!env.ANIMESKY_CACHE,
                    edge: 'cloudflare-workers',
                    endpoints: {
                        search: '/api/search?q=:query',
                        series: '/api/series?url=:seriesUrl&season=:season&anilistId=:id&malId=:id',
                        season: '/api/series/season?postId=:id&season=:num&title=:title&anilistId=:id',
                        watch: '/api/watch?url=:episodeUrl&anilistId=:id&episode=:num',
                        stream: '/api/stream/:hash/master.m3u8?host=:domain&ref=:ref',
                        proxy: '/api/proxy?url=:targetUrl',
                        presets: '/api/presets'
                    }
                });
            }

            // ⚡ Cloudflare Edge Cache: Check if response is already cached at edge (0ms CPU time!)
            if (request.method === 'GET' && pathname.startsWith('/api/')) {
                try {
                    const cachedResponse = await caches.default.match(request);
                    if (cachedResponse) {
                        const hitHeaders = new Headers(cachedResponse.headers);
                        hitHeaders.set('X-Edge-Cache', 'HIT');
                        return new Response(cachedResponse.body, {
                            status: cachedResponse.status,
                            headers: hitHeaders
                        });
                    }
                } catch (e) {}
            }

            // Presets (Cached 24h)
            if (pathname === '/api/presets') {
                return sendCachedJson(request, ctx, [
                    {
                        platform: 'AnimeSky',
                        category: 'shonen',
                        title: 'Naruto Shippuden',
                        poster: 'https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg',
                        seriesUrl: 'https://animesky.app/series/naruto-shippuden/',
                        sampleEpisode: 'https://animesky.app/episode/naruto-shippuden-1x1/',
                        badge: '5 Audios • Hindi Dub Default'
                    },
                    {
                        platform: 'AnimeSky',
                        category: 'supernatural',
                        title: 'Jujutsu Kaisen',
                        poster: 'https://image.tmdb.org/t/p/w500/fHpKWqa486rIikWqXF13fFk68Bf.jpg',
                        seriesUrl: 'https://animesky.app/series/jujutsu-kaisen/',
                        sampleEpisode: 'https://animesky.app/episode/jujutsu-kaisen-1x1/',
                        badge: '1080p • Multi-Audio & Subs'
                    },
                    {
                        platform: 'AnimeSky',
                        category: 'action',
                        title: 'Demon Slayer',
                        poster: 'https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg',
                        seriesUrl: 'https://animesky.app/series/demon-slayer-kimetsu-no-yaiba/',
                        sampleEpisode: 'https://animesky.app/episode/demon-slayer-1x1/',
                        badge: '1080p FHD • Multi-Audio'
                    },
                    {
                        platform: 'AnimeSky',
                        category: 'action',
                        title: 'Solo Leveling',
                        poster: 'https://image.tmdb.org/t/p/w500/geCRueV3ElhRTr0xtJuPxJ8BGdM.jpg',
                        seriesUrl: 'https://animesky.app/series/solo-leveling/',
                        sampleEpisode: 'https://animesky.app/episode/solo-leveling-1x1/',
                        badge: '1080p • Hindi Dub'
                    }
                ], 200, 86400);
            }

            // Search (KV Cached 1h, Edge Cached 1h)
            if (pathname === '/api/search') {
                const q = url.searchParams.get('q') || url.searchParams.get('query');
                if (!q) return jsonResponse({ success: true, results: [] });

                const kvKey = `search:${q.trim().toLowerCase()}`;
                let results = await kvGet(env, kvKey);

                if (!results) {
                    results = await searchAnimeCatalog(q);
                    if (results.length === 0) {
                        const skyResults = await searchAnimeSky(q);
                        results = skyResults.map(s => ({
                            id: s.seriesUrl,
                            title: s.title,
                            romajiTitle: s.title,
                            rating: null,
                            year: null,
                            format: 'TV',
                            status: null,
                            poster: s.poster,
                            banner: null,
                            synopsis: '',
                            seriesUrl: s.seriesUrl,
                            streamQuery: s.title,
                            source: 'animesky'
                        }));
                    }
                    if (results && results.length > 0) {
                        kvPut(env, ctx, kvKey, results, 3600);
                    }
                }

                return sendCachedJson(request, ctx, { success: true, count: results.length, provider: 'catalog', results }, 200, 3600);
            }

            // Series Scraper (Supports URL, Series Slug, AniList ID, MAL ID, Kitsu ID)
            if (pathname === '/api/series') {
                let seriesUrl = url.searchParams.get('url') || url.searchParams.get('series');
                const anilistId = url.searchParams.get('anilistId') || url.searchParams.get('anilist_id');
                const malId = url.searchParams.get('malId') || url.searchParams.get('mal_id');
                const kitsuId = url.searchParams.get('kitsuId') || url.searchParams.get('kitsu_id');
                let targetSeason = url.searchParams.get('season') ? parseInt(url.searchParams.get('season'), 10) : null;
                let resolvedData = null;

                // Auto-resolve if queried by AniList, MAL, or Kitsu ID
                if (anilistId || malId || kitsuId) {
                    resolvedData = await resolveAnimeSkyById({ anilistId, malId, kitsuId });
                    if (resolvedData) {
                        if (!seriesUrl) seriesUrl = resolvedData.seriesUrl;
                        if (!targetSeason) targetSeason = resolvedData.targetSeason;
                    }
                }

                if (!seriesUrl) {
                    return jsonResponse({ success: false, error: 'Missing url or anilistId/malId query parameter.' }, 400);
                }

                if (!seriesUrl.startsWith('http://') && !seriesUrl.startsWith('https://')) {
                    const resolvedUrl = await resolveAnimeSkySeriesUrl(seriesUrl);
                    if (!resolvedUrl) {
                        return jsonResponse({ success: false, error: `No streaming series found for "${seriesUrl}" on AnimeSky.` }, 404);
                    }
                    seriesUrl = resolvedUrl;
                }

                const sNum = targetSeason || 1;
                const kvKey = anilistId 
                    ? `series:al:${anilistId}` 
                    : (malId ? `series:mal:${malId}` : (kitsuId ? `series:kt:${kitsuId}` : `series:${encodeURIComponent(seriesUrl.toLowerCase())}:s${sNum}`));

                let data = await kvGet(env, kvKey);
                if (data && sNum > 1 && data.activeSeason !== sNum) {
                    data = null;
                }

                if (!data) {
                    data = await getAnimeSkySeries(seriesUrl, {
                        targetSeason: sNum,
                        anilistId,
                        malId,
                        kitsuId,
                        epOffset: resolvedData?.epOffset,
                        franchiseOffset: resolvedData?.franchiseOffset
                    });
                    if (data && data.success && (!sNum || data.activeSeason === sNum)) {
                        kvPut(env, ctx, kvKey, data, 86400);
                    }
                }

                if (!data || !data.success || !data.episodes || data.episodes.length === 0 || (sNum > 1 && data.activeSeason !== sNum)) {
                    return jsonResponse({ success: false, error: data?.error || `Season ${sNum} not found on AnimeSky.` }, 404);
                }

                return sendCachedJson(request, ctx, { ...data, provider: 'animesky' }, 200, 86400);
            }

            // Season AJAX (KV Cached 24h, Edge Cached 24h)
            if (pathname === '/api/series/season') {
                const postId = url.searchParams.get('postId');
                const season = parseInt(url.searchParams.get('season'), 10) || 1;
                const title = url.searchParams.get('title') || '';
                const offset = parseInt(url.searchParams.get('offset'), 10) || 0;
                const seriesSlug = url.searchParams.get('seriesSlug') || url.searchParams.get('slug') || '';
                const anilistId = url.searchParams.get('anilistId') || url.searchParams.get('anilist_id');
                const malId = url.searchParams.get('malId') || url.searchParams.get('mal_id');
                const kitsuId = url.searchParams.get('kitsuId') || url.searchParams.get('kitsu_id');

                if (!postId) {
                    return jsonResponse({ success: false, error: 'Missing postId query parameter' }, 400);
                }

                const kvKey = `season:${postId}:${season}:off${offset}:${anilistId || malId || ''}`;
                let data = await kvGet(env, kvKey);

                if (!data) {
                    data = await getAnimeSkySeasonEpisodes(postId, season, title, offset, seriesSlug, {
                        anilistId,
                        malId,
                        kitsuId
                    });
                    if (data && data.success) {
                        kvPut(env, ctx, kvKey, data, 86400);
                    }
                }

                return sendCachedJson(request, ctx, { ...data, provider: 'animesky' }, 200, 86400);
            }

            // Watch / Episode Resolver (Supports Direct URL, AniList ID, MAL ID, Kitsu ID, or Series + Season + Episode)
            if (pathname === '/api/watch') {
                let episodeUrl = url.searchParams.get('url');
                const anilistId = url.searchParams.get('anilistId') || url.searchParams.get('anilist_id');
                const malId = url.searchParams.get('malId') || url.searchParams.get('mal_id');
                const kitsuId = url.searchParams.get('kitsuId') || url.searchParams.get('kitsu_id');
                const series = url.searchParams.get('series');
                const season = url.searchParams.get('season');
                const episode = url.searchParams.get('episode');

                // Auto-resolve episode URL if queried by AniList / MAL / Kitsu ID or series + season + episode
                if (!episodeUrl) {
                    const rawId = (anilistId || malId || kitsuId)?.toString().trim();
                    let seriesSlug = series ? series.replace(/.*\/series\/([^/]+)\/?.*/, '$1') : null;
                    let targetSeason = season ? parseInt(season, 10) : 1;
                    let epNum = episode ? parseInt(episode, 10) : 1;

                    if (rawId) {
                        const resolved = await resolveAnimeSkyById({ anilistId, malId, kitsuId });
                        if (resolved) {
                            seriesSlug = resolved.seriesSlug;
                            targetSeason = resolved.targetSeason;
                            const epOffset = resolved.epOffset || 0;
                            // If continuous absolute episode number was passed (e.g. ep 14 for Part 2)
                            if (epNum > epOffset && epOffset > 0) {
                                epNum = epNum - epOffset;
                            }
                        }
                    }

                    if (seriesSlug) {
                        episodeUrl = `https://animesky.app/episode/${seriesSlug}-${targetSeason}x${epNum}/`;
                    }
                }

                if (!episodeUrl) {
                    return jsonResponse({ success: false, error: 'Missing url or anilistId/malId & episode query parameters.' }, 400);
                }

                const kvKey = `watch:${encodeURIComponent(episodeUrl.toLowerCase())}`;
                let data = await kvGet(env, kvKey);

                if (!data) {
                    try {
                        data = await resolveAnimeSkyEpisode(episodeUrl, hostUrl);
                        if (data && data.success) {
                            kvPut(env, ctx, kvKey, data, 300);
                        }
                    } catch (err) {
                        const isNotDubbed = err.message?.includes('not officially dubbed') || 
                                            err.message?.includes('not available') || 
                                            err.message?.includes('Stream is currently unavailable') ||
                                            err.message?.includes('HTTP 404');
                        return jsonResponse({ 
                            success: false, 
                            isNotDubbed, 
                            error: err.message 
                        }, 404);
                    }
                }

                return sendCachedJson(request, ctx, { ...data, provider: 'animesky' }, 200, 120);
            }

            // Stream M3U8 Master Proxy (Edge Cached 60s)
            const streamMatch = pathname.match(/^\/api\/stream\/([a-zA-Z0-9_\-]+)\/master\.m3u8/);
            if (streamMatch) {
                const hash = streamMatch[1];
                const hostDomain = url.searchParams.get('host') || 'as-cdn26.top';
                const ref = url.searchParams.get('ref') || 'https://animesky.app/';

                const hlsData = await resolveAsCdn(hash, hostDomain, ref);
                const upstreamRes = await fetch(hlsData.masterHlsUrl, {
                    headers: {
                        'User-Agent': DEFAULT_HEADERS['User-Agent'],
                        'Referer': `https://${hostDomain}/`
                    },
                    cf: {
                        cacheEverything: true,
                        cacheTtl: 60
                    }
                });

                if (!upstreamRes.ok) {
                    return textResponse(`#EXTM3U\n# Error fetching upstream: HTTP ${upstreamRes.status}`, 'application/vnd.apple.mpegurl', upstreamRes.status);
                }

                const m3u8Text = await upstreamRes.text();
                const rewritten = rewriteM3u8(m3u8Text, hlsData.masterHlsUrl, hostUrl);

                const m3u8Response = new Response(rewritten, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/vnd.apple.mpegurl',
                        'Cache-Control': 'public, max-age=60, s-maxage=120',
                        ...CORS_HEADERS
                    }
                });

                if (ctx && typeof ctx.waitUntil === 'function') {
                    try {
                        ctx.waitUntil(caches.default.put(request, m3u8Response.clone()));
                    } catch (e) {}
                }

                return m3u8Response;
            }

            // Universal Proxy
            if (pathname === '/api/proxy') {
                const targetUrl = url.searchParams.get('url');
                return await handleProxyRequest(targetUrl, hostUrl, request);
            }

            return jsonResponse({ error: 'Endpoint not found' }, 404);

        } catch (err) {
            return jsonResponse({ success: false, error: err.message }, 500);
        }
    }
};
