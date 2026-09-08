/**
 * ANILIST & MAL METADATA RESOLVER (WITH JIKAN & KITSU FALLBACKS)
 * Multi-provider anime search & ID mapping client with edge memory caching
 */

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";
const ANILIST_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Origin": "https://anilist.co",
    "Referer": "https://anilist.co/"
};

const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const META_CACHE = new Map();
const MAX_CACHE = 500;

function getCache(key) {
    const item = META_CACHE.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
        META_CACHE.delete(key);
        return null;
    }
    return item.data;
}

function setCache(key, data, ttlSeconds = 86400) {
    if (META_CACHE.size >= MAX_CACHE) {
        const oldest = META_CACHE.keys().next().value;
        if (oldest) META_CACHE.delete(oldest);
    }
    META_CACHE.set(key, {
        data,
        expiresAt: Date.now() + (ttlSeconds * 1000)
    });
}

/**
 * Searches anime on AniList (with Jikan & Kitsu fallback)
 */
async function searchAnime(query, page = 1, perPage = 10) {
    if (!query || !query.trim()) return [];
    const cacheKey = `search:${query.trim().toLowerCase()}:${page}:${perPage}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    // 1. Try AniList GraphQL
    const gqlQuery = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
          id
          idMal
          title {
            romaji
            english
            native
            userPreferred
          }
          coverImage {
            large
            extraLarge
          }
          bannerImage
          format
          episodes
          status
          seasonYear
          averageScore
          genres
        }
      }
    }`;

    try {
        const res = await fetch(ANILIST_GRAPHQL_URL, {
            method: "POST",
            headers: ANILIST_HEADERS,
            body: JSON.stringify({
                query: gqlQuery,
                variables: { search: query.trim(), page, perPage }
            })
        });

        if (res.ok) {
            const data = await res.json();
            const mediaList = data?.data?.Page?.media || [];

            if (mediaList.length > 0) {
                const results = mediaList.map(m => ({
                    id: m.id,
                    idMal: m.idMal,
                    title: m.title.english || m.title.romaji || m.title.userPreferred || "Unknown Title",
                    titleRomaji: m.title.romaji,
                    titleNative: m.title.native,
                    poster: m.coverImage.extraLarge || m.coverImage.large,
                    banner: m.bannerImage,
                    episodes: m.episodes || 0,
                    format: m.format || "TV",
                    status: m.status,
                    year: m.seasonYear,
                    score: m.averageScore,
                    genres: m.genres || []
                }));

                setCache(cacheKey, results, 3600);
                return results;
            }
        }
    } catch {}

    // 2. Fallback to Jikan (MyAnimeList Search)
    try {
        const jikanRes = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query.trim())}&page=${page}&limit=${perPage}`, {
            headers: { "User-Agent": DEFAULT_USER_AGENT }
        });
        if (jikanRes.ok) {
            const jikanData = await jikanRes.json();
            const items = jikanData?.data || [];
            if (items.length > 0) {
                const results = items.map(m => ({
                    id: m.mal_id,
                    idMal: m.mal_id,
                    title: m.title_english || m.title || "Unknown Title",
                    titleRomaji: m.title,
                    titleNative: m.title_japanese,
                    poster: m.images?.webp?.large_image_url || m.images?.jpg?.large_image_url,
                    banner: null,
                    episodes: m.episodes || 0,
                    format: m.type || "TV",
                    status: m.status,
                    year: m.year,
                    score: m.score ? Math.round(m.score * 10) : null,
                    genres: (m.genres || []).map(g => g.name)
                }));
                setCache(cacheKey, results, 3600);
                return results;
            }
        }
    } catch {}

    // 3. Fallback to Kitsu API
    try {
        const kitsuRes = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query.trim())}&page[limit]=${perPage}`, {
            headers: { "User-Agent": DEFAULT_USER_AGENT }
        });
        if (kitsuRes.ok) {
            const kitsuData = await kitsuRes.json();
            const items = kitsuData?.data || [];
            const results = items.map(k => ({
                id: parseInt(k.id, 10),
                idMal: null,
                title: k.attributes?.canonicalTitle || "Unknown Title",
                titleRomaji: k.attributes?.titles?.en_jp || k.attributes?.canonicalTitle,
                titleNative: k.attributes?.titles?.ja_jp,
                poster: k.attributes?.posterImage?.large || k.attributes?.posterImage?.original,
                banner: k.attributes?.coverImage?.large,
                episodes: k.attributes?.episodeCount || 0,
                format: k.attributes?.subtype || "TV",
                status: k.attributes?.status,
                year: k.attributes?.startDate ? parseInt(k.attributes.startDate.split('-')[0], 10) : null,
                score: k.attributes?.averageRating ? Math.round(parseFloat(k.attributes.averageRating)) : null,
                genres: []
            }));
            setCache(cacheKey, results, 3600);
            return results;
        }
    } catch {}

    return [];
}

/**
 * Resolves anime metadata by AniList ID
 */
async function getAnimeByAniListId(aniId) {
    const idNum = parseInt(aniId, 10);
    if (!idNum) return null;

    const cacheKey = `ani:${idNum}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    // 1. Try AniList GraphQL
    const gqlQuery = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        title {
          romaji
          english
          native
          userPreferred
        }
        coverImage {
          extraLarge
          large
        }
        bannerImage
        format
        episodes
        status
        seasonYear
        description(asHtml: false)
        averageScore
        genres
        nextAiringEpisode {
          episode
          timeUntilAiring
        }
      }
    }`;

    try {
        const res = await fetch(ANILIST_GRAPHQL_URL, {
            method: "POST",
            headers: ANILIST_HEADERS,
            body: JSON.stringify({
                query: gqlQuery,
                variables: { id: idNum }
            })
        });

        if (res.ok) {
            const data = await res.json();
            const m = data?.data?.Media;
            if (m) {
                const result = {
                    id: m.id,
                    idMal: m.idMal,
                    title: m.title.english || m.title.romaji || m.title.userPreferred || "Unknown Title",
                    titleRomaji: m.title.romaji,
                    titleNative: m.title.native,
                    poster: m.coverImage.extraLarge || m.coverImage.large,
                    banner: m.bannerImage,
                    episodes: m.episodes || 0,
                    format: m.format || "TV",
                    status: m.status,
                    year: m.seasonYear,
                    synopsis: m.description,
                    score: m.averageScore,
                    genres: m.genres || [],
                    nextEpisode: m.nextAiringEpisode?.episode
                };

                setCache(cacheKey, result, 86400);
                if (result.idMal) setCache(`mal:${result.idMal}`, result, 86400);
                return result;
            }
        }
    } catch {}

    // 2. Kitsu Mapping fallback for AniList ID
    try {
        const mapRes = await fetch(`https://kitsu.io/api/edge/mappings?filter[externalSite]=anilist/anime&filter[externalId]=${idNum}`, {
            headers: { "User-Agent": DEFAULT_USER_AGENT }
        });
        if (mapRes.ok) {
            const mapData = await mapRes.json();
            const mapItem = mapData?.data?.[0];
            if (mapItem) {
                const itemRes = await fetch(`https://kitsu.io/api/edge/mappings/${mapItem.id}/item`, {
                    headers: { "User-Agent": DEFAULT_USER_AGENT }
                });
                if (itemRes.ok) {
                    const itemData = await itemRes.json();
                    const anime = itemData?.data;
                    if (anime) {
                        // Find MAL mapping
                        let foundMalId = null;
                        try {
                            const allMapsRes = await fetch(`https://kitsu.io/api/edge/anime/${anime.id}/mappings`, {
                                headers: { "User-Agent": DEFAULT_USER_AGENT }
                            });
                            if (allMapsRes.ok) {
                                const allMapsData = await allMapsRes.json();
                                const malMap = (allMapsData?.data || []).find(m => m.attributes?.externalSite === 'myanimelist/anime');
                                if (malMap?.attributes?.externalId) foundMalId = parseInt(malMap.attributes.externalId, 10);
                            }
                        } catch {}

                        const attr = anime.attributes || {};
                        const result = {
                            id: idNum,
                            idMal: foundMalId || idNum,
                            title: attr.canonicalTitle || "Unknown Title",
                            titleRomaji: attr.titles?.en_jp || attr.canonicalTitle,
                            titleNative: attr.titles?.ja_jp,
                            poster: attr.posterImage?.large || attr.posterImage?.original,
                            banner: attr.coverImage?.large,
                            episodes: attr.episodeCount || 0,
                            format: attr.subtype || "TV",
                            status: attr.status,
                            year: attr.startDate ? parseInt(attr.startDate.split('-')[0], 10) : null,
                            synopsis: attr.synopsis,
                            score: attr.averageRating ? Math.round(parseFloat(attr.averageRating)) : null,
                            genres: []
                        };
                        setCache(cacheKey, result, 86400);
                        if (result.idMal) setCache(`mal:${result.idMal}`, result, 86400);
                        return result;
                    }
                }
            }
        }
    } catch {}

    // 3. If idNum is within standard MAL range (< 60000), try Jikan directly as MAL fallback
    if (idNum <= 60000) {
        return await getAnimeByMalId(idNum);
    }

    return null;
}

/**
 * Resolves anime metadata by MAL ID
 */
async function getAnimeByMalId(malId) {
    const idNum = parseInt(malId, 10);
    if (!idNum) return null;

    const cacheKey = `mal:${idNum}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    // 1. Try Jikan API (Direct MAL database)
    try {
        const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${idNum}`, {
            headers: { "User-Agent": DEFAULT_USER_AGENT }
        });
        if (jikanRes.ok) {
            const jikanData = await jikanRes.json();
            const item = jikanData.data;
            if (item) {
                const result = {
                    id: item.mal_id,
                    idMal: item.mal_id,
                    title: item.title_english || item.title || "Unknown Title",
                    titleRomaji: item.title,
                    titleNative: item.title_japanese,
                    poster: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url,
                    banner: null,
                    episodes: item.episodes || 0,
                    format: item.type || "TV",
                    status: item.status,
                    year: item.year,
                    synopsis: item.synopsis,
                    score: item.score ? Math.round(item.score * 10) : null,
                    genres: (item.genres || []).map(g => g.name)
                };
                setCache(cacheKey, result, 86400);
                return result;
            }
        }
    } catch {}

    // 2. Fallback to Kitsu by MAL ID mapping
    try {
        const mapRes = await fetch(`https://kitsu.io/api/edge/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=${idNum}`, {
            headers: { "User-Agent": DEFAULT_USER_AGENT }
        });
        if (mapRes.ok) {
            const mapData = await mapRes.json();
            const mapItem = mapData?.data?.[0];
            if (mapItem) {
                const itemRes = await fetch(`https://kitsu.io/api/edge/mappings/${mapItem.id}/item`, {
                    headers: { "User-Agent": DEFAULT_USER_AGENT }
                });
                if (itemRes.ok) {
                    const itemData = await itemRes.json();
                    const anime = itemData?.data;
                    if (anime) {
                        const attr = anime.attributes || {};
                        const result = {
                            id: idNum,
                            idMal: idNum,
                            title: attr.canonicalTitle || "Unknown Title",
                            titleRomaji: attr.titles?.en_jp || attr.canonicalTitle,
                            titleNative: attr.titles?.ja_jp,
                            poster: attr.posterImage?.large || attr.posterImage?.original,
                            banner: attr.coverImage?.large,
                            episodes: attr.episodeCount || 0,
                            format: attr.subtype || "TV",
                            status: attr.status,
                            year: attr.startDate ? parseInt(attr.startDate.split('-')[0], 10) : null,
                            synopsis: attr.synopsis,
                            score: attr.averageRating ? Math.round(parseFloat(attr.averageRating)) : null,
                            genres: []
                        };
                        setCache(cacheKey, result, 86400);
                        return result;
                    }
                }
            }
        }
    } catch {}

    return null;
}

export {
    searchAnime,
    getAnimeByAniListId,
    getAnimeByMalId
};
