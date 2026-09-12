/**
 * AnimeSky Scraper & AS-CDN HLS Streaming Proxy Cloudflare Worker
 * 
 * Standalone Edge Worker for:
 * 1. Searching AnimeSky, Kitsu, AniList & AniZip metadata
 * 2. Scraping Series, Seasons & Episodes from animesky.app
 * 3. Resolving AS-CDN (FirePlayer) direct streams & decrypting video hashes
 * 4. Proxied M3U8 Master Playlist with automatic Hindi Dub priority (DEFAULT=YES)
 * 5. Full CORS-enabled HLS Stream & Segment Proxy
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
   1. METADATA & ANIZIP / KITSU RESOLVER
   ========================================================================== */

function findEpisodeMetadata(episodesMap, season, epNum, offset = 0) {
    if (!episodesMap || Object.keys(episodesMap).length === 0) return null;
    const epsList = Object.values(episodesMap);

    if (season && season > 0) {
        const bySeasonAndEp = epsList.find(e => 
            (e.seasonNumber === season || e.season === season) && 
            (e.episodeNumber === epNum || e.episode === epNum)
        );
        if (bySeasonAndEp) return bySeasonAndEp;
    }

    if (offset > 0) {
        const absNum = (offset + epNum - 1).toString();
        if (episodesMap[absNum]) return episodesMap[absNum];
    }

    if (episodesMap[epNum.toString()]) {
        const direct = episodesMap[epNum.toString()];
        if (!season || direct.seasonNumber === season || (season === 1 && (!direct.seasonNumber || direct.seasonNumber === 1))) {
            return direct;
        }
    }

    const byEp = epsList.find(e => 
        (e.episodeNumber === epNum || e.absoluteEpisodeNumber === epNum) &&
        (!season || e.seasonNumber === season || e.season === season)
    );
    return byEp || null;
}

async function fetchAnimeMetadata(rawTitle, season = null) {
    if (!rawTitle) return null;
    const cleanTitle = rawTitle
        .replace(/-\s*Anime\s*Sky.*$/i, '')
        .replace(/\b(Season\s*\d+|S\d+|Dub|Sub|Part\s*\d+)\b/gi, '')
        .trim();

    const targetSeason = season && parseInt(season, 10) > 1 ? parseInt(season, 10) : null;

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
        const kitsuSearchText = targetSeason ? `${cleanTitle} Season ${targetSeason}` : cleanTitle;
        const kitsuUrl = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(kitsuSearchText)}&include=categories&page[limit]=5`;
        const kRes = await fetch(kitsuUrl, {
            headers: { 'Accept': 'application/vnd.api+json', 'User-Agent': 'Mozilla/5.0' }
        });

        let kitsuId = null;
        if (kRes.ok) {
            const kData = await kRes.json();
            let item = kData.data?.[0];
            if (targetSeason && Array.isArray(kData.data) && kData.data.length > 1) {
                const seasonMatch = kData.data.find(d => {
                    const ct = (d.attributes?.canonicalTitle || '').toLowerCase();
                    return ct.includes(`season ${targetSeason}`) || ct.includes(` ${targetSeason}`);
                });
                if (seasonMatch) item = seasonMatch;
            }

            if (item) {
                kitsuId = item.id;
                const a = item.attributes || {};
                metadata.englishTitle = a.titles?.en || a.canonicalTitle || cleanTitle;
                metadata.romajiTitle = a.titles?.en_jp || a.canonicalTitle || cleanTitle;
                metadata.nativeTitle = a.titles?.ja_jp || '';
                if (a.averageRating) {
                    metadata.rating = (parseFloat(a.averageRating) / 10).toFixed(1);
                }
                metadata.status = a.status ? a.status.toUpperCase() : null;
                metadata.synopsis = a.synopsis || '';
                metadata.poster = a.posterImage?.large || a.posterImage?.original || null;
                metadata.banner = a.coverImage?.large || a.coverImage?.original || null;
                if (a.youtubeVideoId) {
                    metadata.trailerUrl = `https://www.youtube.com/watch?v=${a.youtubeVideoId}`;
                }

                if (Array.isArray(kData.included)) {
                    metadata.genres = kData.included
                        .filter(i => i.type === 'categories')
                        .map(c => c.attributes?.title)
                        .filter(Boolean)
                        .slice(0, 6);
                }
            }
        }

        if (kitsuId) {
            try {
                const azRes = await fetch(`https://api.ani.zip/mappings?kitsu_id=${kitsuId}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
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

                    if (Array.isArray(azData.images)) {
                        const fanartImg = azData.images.find(i => i.coverType === 'Fanart');
                        const bannerImg = azData.images.find(i => i.coverType === 'Banner' || i.image_type === 'banner');
                        const posterImg = azData.images.find(i => i.coverType === 'Poster');

                        if (fanartImg) metadata.fanart = fanartImg.url;
                        if (!metadata.banner && bannerImg) metadata.banner = bannerImg.url || bannerImg.image_url;
                        if (!metadata.poster && posterImg) metadata.poster = posterImg.url;
                    }

                    if (!metadata.nativeTitle && azData.titles?.ja) {
                        metadata.nativeTitle = azData.titles.ja;
                    }
                }
            } catch (azErr) {}
        }
        return metadata;
    } catch (err) {
        return metadata;
    }
}

async function searchAnimeCatalog(query, limit = 8) {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) return [];

    try {
        const kitsuUrl = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(cleanQuery)}&page[limit]=${limit}&include=categories`;
        const kRes = await fetch(kitsuUrl, {
            headers: { 'Accept': 'application/vnd.api+json', 'User-Agent': 'Mozilla/5.0' }
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

            return items.map(item => {
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
                    source: 'kitsu'
                };
            });
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
    const res = await fetch(searchUrl, { headers: DEFAULT_HEADERS });
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

async function getAnimeSkySeasonEpisodes(postId, season, seriesTitle = '', offset = 0) {
    const url = `https://animesky.app/wp-admin/admin-ajax.php?action=action_select_season&season=${season}&post=${postId}`;
    const res = await fetch(url, { headers: DEFAULT_HEADERS });
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
            title: `Episode ${epNum}`,
            watchUrl: u
        };
    }).sort((a, b) => a.episode - b.episode);

    let meta = null;
    if (seriesTitle) {
        try {
            meta = await fetchAnimeMetadata(seriesTitle, season);
        } catch (e) {}
    }

    const enrichedEpisodes = episodes.map(ep => {
        const azEp = findEpisodeMetadata(meta?.episodesMap, ep.season, ep.episode, offset);
        return {
            ...ep,
            title: azEp?.title?.en || azEp?.title?.['x-jat'] || ep.title,
            airdate: azEp?.airDate || azEp?.airdate || null,
            thumbnail: azEp?.image || meta?.fanart || meta?.banner || meta?.poster || null,
            overview: azEp?.overview || azEp?.summary || null
        };
    });

    return {
        success: true,
        season,
        postId,
        totalEpisodes: enrichedEpisodes.length,
        episodes: enrichedEpisodes
    };
}

async function getAnimeSkySeries(seriesUrl, options = {}) {
    const cleanUrl = seriesUrl.trim().replace(/\/+$/, '') + '/';
    const res = await fetch(cleanUrl, { headers: DEFAULT_HEADERS });
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

    // Extract Season Tabs
    const seasonBtns = [...html.matchAll(/class=["'][^"']*season-btn[^"']*["'][^>]*data-post=["'](\d+)["'][^>]*data-season=["'](\d+)["'][\s\S]*?<span[^>]*class=["']season-label["']>([^<]+)<\/span>(?:<span[^>]*class=["']season-episodes["']>([^<]+)<\/span>)?/gi)];
    const seasons = seasonBtns.map(m => ({
        postId: m[1],
        season: parseInt(m[2], 10),
        label: m[3].trim(),
        episodesRange: m[4] ? m[4].trim() : ''
    }));

    // Initial Episodes from DOM
    const linkMatches = [...html.matchAll(/href=["'](https?:\/\/animesky\.app\/episode\/[^"']+)["']/gi)].map(m => m[1]);
    const uniqueLinks = [...new Set(linkMatches)];

    const initialEpisodes = uniqueLinks.map((url, idx) => {
        const match = url.match(/(\d+)x(\d+)\/?$/);
        const season = match ? parseInt(match[1], 10) : 1;
        const epNum = match ? parseInt(match[2], 10) : (idx + 1);

        return {
            episode: epNum,
            season,
            title: `Episode ${epNum}`,
            watchUrl: url
        };
    }).sort((a, b) => a.episode - b.episode);

    let meta = null;
    try {
        meta = await fetchAnimeMetadata(title);
    } catch (e) {}

    const enrichedEpisodes = initialEpisodes.map(ep => {
        const azEp = findEpisodeMetadata(meta?.episodesMap, ep.season, ep.episode, 0);
        return {
            ...ep,
            title: azEp?.title?.en || azEp?.title?.['x-jat'] || ep.title,
            airdate: azEp?.airDate || azEp?.airdate || null,
            thumbnail: azEp?.image || meta?.fanart || meta?.banner || meta?.poster || poster,
            overview: azEp?.overview || azEp?.summary || null
        };
    });

    let activeSeason = 1;
    let finalEpisodes = enrichedEpisodes;
    let finalMeta = meta;

    const targetSeasonNum = parseInt(options.targetSeason, 10) || 1;
    if (targetSeasonNum > 1) {
        const targetSeasonObj = seasons.find(s => s.season === targetSeasonNum);
        if (targetSeasonObj) {
            try {
                let offset = 0;
                if (targetSeasonObj.episodesRange) {
                    const match = targetSeasonObj.episodesRange.match(/(\d+)/);
                    if (match) offset = parseInt(match[1], 10);
                }
                const seasonData = await getAnimeSkySeasonEpisodes(targetSeasonObj.postId, targetSeasonObj.season, title, offset);
                if (seasonData && seasonData.episodes && seasonData.episodes.length > 0) {
                    finalEpisodes = seasonData.episodes;
                    activeSeason = targetSeasonObj.season;
                }
                const sMeta = await fetchAnimeMetadata(title, targetSeasonObj.season);
                if (sMeta) finalMeta = sMeta;
            } catch (sErr) {}
        }
    }

    return {
        success: true,
        source: 'animesky.app',
        seriesUrl: cleanUrl,
        title,
        activeSeason,
        poster: finalMeta?.poster || meta?.poster || poster,
        banner: finalMeta?.fanart || finalMeta?.banner || meta?.fanart || meta?.banner || null,
        meta: finalMeta || meta,
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
        }).toString()
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

async function resolveAnimeSkyEpisode(episodeUrl, hostUrl) {
    const cleanUrl = episodeUrl.trim();
    const res = await fetch(cleanUrl, { headers: DEFAULT_HEADERS });
    if (!res.ok) throw new Error(`AnimeSky episode returned HTTP ${res.status}`);

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
                proxiedMasterM3u8: `${hostUrl}/api/stream/${hash}/master.m3u8?host=${encodeURIComponent(hostDomain)}&ref=${encodeURIComponent(cleanUrl)}`
            };
        } catch (e) {}
    }

    const servers = [];
    if (primaryAsCdn) servers.push(primaryAsCdn);

    if (servers.length === 0) {
        throw new Error('No supported video streams found on this AnimeSky episode page.');
    }

    return {
        success: true,
        source: 'animesky.app',
        watchUrl: cleanUrl,
        totalServers: servers.length,
        servers,
        primaryStream: primaryAsCdn ? {
            ...primaryAsCdn.directHls,
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

    // 3. Video Chunks / Binary Streaming
    const resHeaders = new Headers(CORS_HEADERS);
    ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(h => {
        const val = upstreamRes.headers.get(h);
        if (val) resHeaders.set(h, val);
    });

    if (isChunk) {
        resHeaders.set('Content-Type', 'video/mp2t');
        resHeaders.set('Cache-Control', 'public, max-age=86400, s-maxage=604800, immutable');
    }

    return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: resHeaders
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
                    plan: 'paid-standard',
                    smartPlacement: true,
                    kvCache: !!env.ANIMESKY_CACHE,
                    edge: 'cloudflare-workers',
                    endpoints: {
                        search: '/api/search?q=:query',
                        series: '/api/series?url=:seriesUrl&season=:season',
                        season: '/api/series/season?postId=:id&season=:num&title=:title',
                        watch: '/api/watch?url=:episodeUrl',
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

            // Series Scraper (KV Cached 24h, Edge Cached 24h)
            if (pathname === '/api/series') {
                let seriesUrl = url.searchParams.get('url');
                if (!seriesUrl) return jsonResponse({ success: false, error: 'Missing url parameter.' }, 400);

                if (!seriesUrl.startsWith('http://') && !seriesUrl.startsWith('https://')) {
                    const resolvedUrl = await resolveAnimeSkySeriesUrl(seriesUrl);
                    if (!resolvedUrl) {
                        return jsonResponse({ success: false, error: `No streaming series found for "${seriesUrl}" on AnimeSky.` }, 404);
                    }
                    seriesUrl = resolvedUrl;
                }

                const targetSeason = parseInt(url.searchParams.get('season'), 10) || 1;
                const kvKey = `series:${encodeURIComponent(seriesUrl.toLowerCase())}:s${targetSeason}`;
                let data = await kvGet(env, kvKey);

                if (!data) {
                    data = await getAnimeSkySeries(seriesUrl, { targetSeason });
                    if (data && data.success) {
                        kvPut(env, ctx, kvKey, data, 86400);
                    }
                }

                return sendCachedJson(request, ctx, { ...data, provider: 'animesky' }, 200, 86400);
            }

            // Season AJAX (KV Cached 24h, Edge Cached 24h)
            if (pathname === '/api/series/season') {
                const postId = url.searchParams.get('postId');
                const season = url.searchParams.get('season');
                const title = url.searchParams.get('title') || '';
                const offset = parseInt(url.searchParams.get('offset'), 10) || 0;

                if (!postId || !season) {
                    return jsonResponse({ success: false, error: 'Missing postId or season query parameter' }, 400);
                }

                const kvKey = `season:${postId}:${season}:off${offset}`;
                let data = await kvGet(env, kvKey);

                if (!data) {
                    data = await getAnimeSkySeasonEpisodes(postId, parseInt(season, 10), title, offset);
                    if (data && data.success) {
                        kvPut(env, ctx, kvKey, data, 86400);
                    }
                }

                return sendCachedJson(request, ctx, { ...data, provider: 'animesky' }, 200, 86400);
            }

            // Watch / Episode Resolver (KV Cached 5 min, Edge Cached 2 min)
            if (pathname === '/api/watch') {
                const episodeUrl = url.searchParams.get('url');
                if (!episodeUrl) return jsonResponse({ success: false, error: 'Missing url parameter.' }, 400);

                const kvKey = `watch:${encodeURIComponent(episodeUrl.toLowerCase())}`;
                let data = await kvGet(env, kvKey);

                if (!data) {
                    data = await resolveAnimeSkyEpisode(episodeUrl, hostUrl);
                    if (data && data.success) {
                        kvPut(env, ctx, kvKey, data, 300);
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
