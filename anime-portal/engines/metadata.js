/**
 * Anime Metadata & AniZip / AniList / MAL / Kitsu Cross-Mapping Engine
 * Enriches AnimeSky series with official HD covers, fanart backdrops, synopsis, ratings, and episode thumbnails
 */

const metaCache = new Map();

/**
 * Robust Anime Season Detector
 */
function detectTargetSeason(title) {
    if (!title) return 1;
    const t = title.toLowerCase();

    // 1. Explicit Season X / S X (e.g., "Season 2", "Season 3", "S02")
    const sMatch = t.match(/\b(?:season|s)\s*0*(\d+)\b/i);
    if (sMatch) return parseInt(sMatch[1], 10);

    // 2. Ordinal Season: "1st season", "2nd season", "3rd season", "4th season"
    const ordMatch = t.match(/\b(\d+)(?:st|nd|rd|th)\s+season\b/i);
    if (ordMatch) return parseInt(ordMatch[1], 10);

    // 3. Roman Numerals following title or "Season"
    if (/\b(?:season\s+)?iv\b/i.test(t)) return 4;
    if (/\b(?:season\s+)?iii\b/i.test(t)) return 3;
    if (/\b(?:season\s+)?ii\b/i.test(t)) return 2;

    // 4. Common Japanese anime arc naming
    if (/entertainment\s*district/i.test(t) || /mugen\s*train/i.test(t) || /yuukaku/i.test(t)) return 2;
    if (/swordsmith\s*village/i.test(t) || /katanakaji/i.test(t)) return 3;
    if (/hashira\s*training/i.test(t)) return 4;
    if (/final\s*season/i.test(t)) return 4;

    return 1;
}

async function fetchAnimeMetadata(rawTitle, season = null) {
    if (!rawTitle) return null;
    const cleanTitle = rawTitle
        .replace(/-\s*Anime\s*Sky.*$/i, '')
        .replace(/\b(Season\s*\d+|S\d+|Dub|Sub|Part\s*\d+)\b/gi, '')
        .trim();

    const targetSeason = season && parseInt(season, 10) > 1 ? parseInt(season, 10) : null;
    const cacheKey = targetSeason ? `${cleanTitle.toLowerCase()}_s${targetSeason}` : cleanTitle.toLowerCase();
    if (metaCache.has(cacheKey)) {
        return metaCache.get(cacheKey);
    }

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
        // 1. Query Kitsu API for Fast Canonical Metadata, Categories & Banners
        const kitsuSearchText = targetSeason ? `${cleanTitle} Season ${targetSeason}` : cleanTitle;
        const kitsuUrl = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(kitsuSearchText)}&include=categories&page[limit]=5`;
        const kRes = await fetch(kitsuUrl, {
            headers: { 'Accept': 'application/vnd.api+json', 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(8000)
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

                // Categories / Genres from Kitsu
                if (Array.isArray(kData.included)) {
                    metadata.genres = kData.included
                        .filter(i => i.type === 'categories')
                        .map(c => c.attributes?.title)
                        .filter(Boolean)
                        .slice(0, 6);
                }
            }
        }

        // 2. Query AniZip Cross-Mapping API
        if (kitsuId) {
            try {
                const azRes = await fetch(`https://api.ani.zip/mappings?kitsu_id=${kitsuId}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    signal: AbortSignal.timeout(8000)
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

                    // High-res Backdrops / Banners from AniZip
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
            } catch (azErr) {
                console.warn('[Metadata] AniZip fetch failed:', azErr.message);
            }
        }

        metaCache.set(cacheKey, metadata);
        return metadata;
    } catch (err) {
        console.warn('[Metadata] Error fetching anime metadata:', err.message);
        return metadata;
    }
}

/**
 * Finds best episode metadata match from AniZip episodesMap with strict season isolation
 */
function findEpisodeMetadata(episodesMap, season, epNum, offset = 0) {
    if (!episodesMap || Object.keys(episodesMap).length === 0) return null;
    const epsList = Object.values(episodesMap);

    // 1. Exact match by season & episode number
    if (season && season > 0) {
        const bySeasonAndEp = epsList.find(e => 
            (e.seasonNumber === season || e.season === season) && 
            (e.episodeNumber === epNum || e.episode === epNum)
        );
        if (bySeasonAndEp) return bySeasonAndEp;
    }

    // 2. Try absolute episode calculation if offset provided
    if (offset > 0) {
        const absNum = (offset + epNum - 1).toString();
        if (episodesMap[absNum]) return episodesMap[absNum];
    }

    // 3. Direct key lookup by epNum only if season matches or season is 1
    if (episodesMap[epNum.toString()]) {
        const direct = episodesMap[epNum.toString()];
        if (!season || direct.seasonNumber === season || (season === 1 && (!direct.seasonNumber || direct.seasonNumber === 1))) {
            return direct;
        }
    }

    // 4. Fallback search by episodeNumber only for matching season
    const byEp = epsList.find(e => 
        (e.episodeNumber === epNum || e.absoluteEpisodeNumber === epNum) &&
        (!season || e.seasonNumber === season || e.season === season)
    );
    if (byEp) return byEp;

    return null;
}

/**
 * Universal Anime Catalog Search
 * Queries Kitsu, AniList, and MAL/Jikan for rich anime titles, covers, ratings & metadata
 */
const searchCache = new Map();

async function searchAnimeCatalog(query, options = {}) {
    const { limit = 8, timeoutMs = 6000 } = options;
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) return [];

    const cacheKey = `${cleanQuery.toLowerCase()}_${limit}`;
    if (searchCache.has(cacheKey)) {
        return searchCache.get(cacheKey);
    }

    let results = [];

    // 1. Query Kitsu API (Primary: Fast & Reliable)
    try {
        const kitsuUrl = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(cleanQuery)}&page[limit]=${limit}&include=categories`;
        const kRes = await fetch(kitsuUrl, {
            headers: { 'Accept': 'application/vnd.api+json', 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(timeoutMs)
        });

        if (kRes.ok) {
            const kData = await kRes.json();
            const items = kData.data || [];
            
            // Build categories lookup map
            const catMap = new Map();
            if (Array.isArray(kData.included)) {
                kData.included.forEach(inc => {
                    if (inc.type === 'categories' && inc.attributes?.title) {
                        catMap.set(inc.id, inc.attributes.title);
                    }
                });
            }

            results = items.map(item => {
                const a = item.attributes || {};
                const mainTitle = a.titles?.en || a.canonicalTitle || a.titles?.en_jp || 'Anime';
                const romaji = a.titles?.en_jp || a.canonicalTitle || '';
                const native = a.titles?.ja_jp || '';
                const rating = a.averageRating ? (parseFloat(a.averageRating) / 10).toFixed(1) : null;
                const year = a.startDate ? a.startDate.slice(0, 4) : null;
                const poster = a.posterImage?.medium || a.posterImage?.large || a.posterImage?.original || null;
                const banner = a.coverImage?.large || a.coverImage?.original || null;

                // Extract genres
                const itemCatIds = item.relationships?.categories?.data?.map(c => c.id) || [];
                const genres = itemCatIds.map(id => catMap.get(id)).filter(Boolean).slice(0, 4);

                // Smart stream query: clean subtitle after colon or dash
                const cleanStreamQuery = mainTitle
                    .split(/[:–—\-]/)[0]
                    .replace(/\b(Season\s*\d+|S\d+|Dub|Sub|Part\s*\d+)\b/gi, '')
                    .trim();

                const targetSeason = detectTargetSeason(mainTitle || a.canonicalTitle || '');

                return {
                    id: item.id,
                    kitsuId: item.id,
                    title: mainTitle,
                    romajiTitle: romaji,
                    nativeTitle: native,
                    targetSeason,
                    rating,
                    year,
                    format: (a.subtype || 'TV').toUpperCase(),
                    status: a.status ? a.status.toUpperCase() : null,
                    episodes: a.episodeCount,
                    genres,
                    poster,
                    banner,
                    synopsis: a.synopsis || '',
                    streamQuery: cleanStreamQuery || mainTitle,
                    source: 'kitsu'
                };
            });
        }
    } catch (e) {
        console.warn('[SearchCatalog] Kitsu error:', e.message);
    }

    // 2. Try AniList GraphQL (if Kitsu returned 0 or as alternative)
    if (results.length === 0) {
        try {
            const queryGql = `query ($search: String, $limit: Int) {
              Page(page: 1, perPage: $limit) {
                media(search: $search, type: ANIME) {
                  id
                  title { english romaji native }
                  averageScore
                  seasonYear
                  format
                  status
                  episodes
                  genres
                  coverImage { large extraLarge }
                  bannerImage
                  description
                }
              }
            }`;
            const alRes = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ query: queryGql, variables: { search: cleanQuery, limit } }),
                signal: AbortSignal.timeout(timeoutMs)
            });
            if (alRes.ok) {
                const alData = await alRes.json();
                const media = alData.data?.Page?.media || [];
                results = media.map(m => {
                    const mainTitle = m.title?.english || m.title?.romaji || 'Anime';
                    const rating = m.averageScore ? (m.averageScore / 10).toFixed(1) : null;
                    const targetSeason = detectTargetSeason(mainTitle || m.title?.romaji || '');
                    return {
                        id: m.id.toString(),
                        anilistId: m.id,
                        title: mainTitle,
                        romajiTitle: m.title?.romaji || '',
                        nativeTitle: m.title?.native || '',
                        targetSeason,
                        rating,
                        year: m.seasonYear ? m.seasonYear.toString() : null,
                        format: m.format || 'TV',
                        status: m.status || null,
                        episodes: m.episodes,
                        genres: m.genres ? m.genres.slice(0, 4) : [],
                        poster: m.coverImage?.extraLarge || m.coverImage?.large || null,
                        banner: m.bannerImage || null,
                        synopsis: m.description ? m.description.replace(/<[^>]+>/g, '') : '',
                        streamQuery: mainTitle.split(/[:–—\-]/)[0].trim(),
                        source: 'anilist'
                    };
                });
            }
        } catch (e) {
            console.warn('[SearchCatalog] AniList error:', e.message);
        }
    }

    // 3. Try Jikan MAL API if still 0
    if (results.length === 0) {
        try {
            const jRes = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(cleanQuery)}&limit=${limit}`, {
                signal: AbortSignal.timeout(timeoutMs)
            });
            if (jRes.ok) {
                const jData = await jRes.json();
                const items = jData.data || [];
                results = items.map(m => {
                    const mainTitle = m.title_english || m.title || 'Anime';
                    const targetSeason = detectTargetSeason(mainTitle || m.title || '');
                    return {
                        id: m.mal_id.toString(),
                        malId: m.mal_id,
                        title: mainTitle,
                        romajiTitle: m.title || '',
                        nativeTitle: m.title_japanese || '',
                        targetSeason,
                        rating: m.score ? m.score.toFixed(1) : null,
                        year: m.year ? m.year.toString() : null,
                        format: (m.type || 'TV').toUpperCase(),
                        status: m.status ? m.status.toUpperCase() : null,
                        episodes: m.episodes,
                        genres: m.genres ? m.genres.map(g => g.name).slice(0, 4) : [],
                        poster: m.images?.webp?.large_image_url || m.images?.jpg?.large_image_url || null,
                        banner: null,
                        synopsis: m.synopsis || '',
                        streamQuery: mainTitle.split(/[:–—\-]/)[0].trim(),
                        source: 'jikan_mal'
                    };
                });
            }
        } catch (e) {
            console.warn('[SearchCatalog] Jikan error:', e.message);
        }
    }

    searchCache.set(cacheKey, results);
    return results;
}

module.exports = {
    fetchAnimeMetadata,
    findEpisodeMetadata,
    searchAnimeCatalog,
    detectTargetSeason
};
