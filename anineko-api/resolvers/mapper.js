/**
 * ANIME ID TO SLUG MAPPER
 * 
 * Maps AniList ID, MyAnimeList (MAL / Jikan) ID, or Anime Title
 * to the exact AniNeko slug used by embed resolvers (OtakuVid, BibiEmb, OtakuHG).
 * 
 * Includes:
 *  - Two-tier Caching (Memory + Persistent Local JSON)
 *  - AniList GraphQL resolver (supports AniList ID & MAL ID)
 *  - Jikan (MAL) API fallback
 *  - Multi-title fuzzy match scoring
 *  - Common alias / manual overrides
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { searchAnime } = require('./catalog');

// Cache file path for persistent learned mappings
const CACHE_FILE = path.join(__dirname, '..', 'mappings_cache.json');

// In-memory cache
const MAP_CACHE = new Map();

// Hardcoded instant aliases for mega-popular anime (0ms lookup)
const INSTANT_ALIASES = {
    // One Piece
    '21': 'one-piece',
    'ani:21': 'one-piece',
    'mal:21': 'one-piece',

    // Solo Leveling
    '151807': 'solo-leveling-season-2-arise-from-the-shadow',
    'ani:151807': 'solo-leveling-season-2-arise-from-the-shadow',
    'mal:54595': 'solo-leveling-season-2-arise-from-the-shadow',
    '142838': 'solo-leveling',
    'ani:142838': 'solo-leveling',
    'mal:52299': 'solo-leveling',

    // Naruto
    '20': 'naruto',
    'ani:20': 'naruto',
    'mal:20': 'naruto',
    '1735': 'naruto-shippuden',
    'ani:1735': 'naruto-shippuden',
    'mal:1735': 'naruto-shippuden',

    // Jujutsu Kaisen
    '113415': 'jujutsu-kaisen-tv',
    'ani:113415': 'jujutsu-kaisen-tv',
    'mal:40748': 'jujutsu-kaisen-tv',
    '145064': 'jujutsu-kaisen-2nd-season',
    'ani:145064': 'jujutsu-kaisen-2nd-season',
    'mal:51009': 'jujutsu-kaisen-2nd-season',

    // Bleach
    '269': 'bleach',
    'ani:269': 'bleach',
    'mal:269': 'bleach',
    '116674': 'bleach-thousand-year-blood-war',
    'ani:116674': 'bleach-thousand-year-blood-war',
    'mal:41467': 'bleach-thousand-year-blood-war',

    // Demon Slayer
    '101922': 'demon-slayer-kimetsu-no-yaiba',
    'ani:101922': 'demon-slayer-kimetsu-no-yaiba',
    'mal:38000': 'demon-slayer-kimetsu-no-yaiba',

    // Attack on Titan
    '16498': 'attack-on-titan',
    'ani:16498': 'attack-on-titan',
    'mal:16498': 'attack-on-titan'
};

// Initialize cache from disk
function initCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const raw = fs.readFileSync(CACHE_FILE, 'utf8');
            const data = JSON.parse(raw);
            for (const [k, v] of Object.entries(data)) {
                MAP_CACHE.set(k, v);
            }
        }
    } catch {}
    // Seed with instant aliases
    for (const [k, v] of Object.entries(INSTANT_ALIASES)) {
        if (!MAP_CACHE.has(k)) MAP_CACHE.set(k, v);
    }
}

initCache();

function saveCache() {
    try {
        const obj = {};
        for (const [k, v] of MAP_CACHE.entries()) {
            obj[k] = v;
        }
        fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch {}
}

async function fetchJson(url, options = {}) {
    try {
        const res = await fetch(url, {
            method: options.method || 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                ...(options.headers || {})
            },
            body: options.body,
            signal: AbortSignal.timeout(8000)
        });
        const data = await res.json().catch(() => null);
        return { status: res.status, data };
    } catch {
        return { status: 500, data: null };
    }
}

/**
 * Fetch Anime metadata from AniList GraphQL with AniClipse CDN fallback
 */
async function fetchAniListMetadata({ anilistId, malId }) {
    const isMalQuery = !anilistId && !!malId;
    const query = `
        query ($id: Int, $idMal: Int) {
            Media (${isMalQuery ? 'idMal: $idMal' : 'id: $id'}, type: ANIME) {
                id
                idMal
                title {
                    romaji
                    english
                    userPreferred
                }
                synonyms
                format
                seasonYear
                episodes
            }
        }
    `;

    const variables = isMalQuery 
        ? { idMal: parseInt(malId, 10) } 
        : { id: parseInt(anilistId, 10) };

    // 1. Try AniList GraphQL first
    try {
        const res = await fetchJson('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables })
        });

        if (res.data?.data?.Media) {
            return res.data.data.Media;
        }
    } catch {}

    // 2. Fallback to AniClipse CDN (Full AniList database mirror, zero 403s)
    if (anilistId) {
        try {
            const res = await fetchJson(`https://cdn.aniclipse.com/v1/anime/${parseInt(anilistId, 10)}`);
            if (res.status === 200 && res.data && (res.data.title || res.data.english)) {
                const d = res.data;
                const titles = [];
                if (d.title?.english) titles.push(d.title.english);
                if (d.title?.romaji) titles.push(d.title.romaji);
                if (d.title?.user_preferred) titles.push(d.title.user_preferred);
                if (d.title?.native) titles.push(d.title.native);
                if (d.synonyms && Array.isArray(d.synonyms)) titles.push(...d.synonyms);

                return {
                    id: d.anilist_id || parseInt(anilistId, 10),
                    idMal: d.mal_id || null,
                    title: {
                        english: d.title?.english || d.title?.user_preferred || "",
                        romaji: d.title?.romaji || d.title?.english || "",
                        userPreferred: d.title?.user_preferred || d.title?.english || ""
                    },
                    synonyms: Array.from(new Set(titles)),
                    format: d.format || "TV",
                    seasonYear: d.season_year || null,
                    episodes: d.episodes_total || d.episodes || null
                };
            }
        } catch {}
    }

    return null;
}

/**
 * Fetch Anime metadata from Jikan (MyAnimeList v4 API) fallback
 */
async function fetchJikanMetadata(malId) {
    if (!malId) return null;
    try {
        const res = await fetchJson(`https://api.jikan.moe/v4/anime/${malId}`);
        if (res.status === 200 && res.data?.data) {
            const item = res.data.data;
            const titles = [];
            if (item.title_english) titles.push(item.title_english);
            if (item.title) titles.push(item.title);
            if (item.title_japanese) titles.push(item.title_japanese);
            (item.titles || []).forEach(t => { if (t.title && !titles.includes(t.title)) titles.push(t.title); });

            return {
                idMal: item.mal_id,
                title: {
                    english: item.title_english || item.title,
                    romaji: item.title,
                    userPreferred: item.title_english || item.title
                },
                synonyms: titles,
                format: item.type,
                episodes: item.episodes
            };
        }
    } catch {}
    return null;
}

function cleanTitle(str) {
    return (str || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractSeason(str) {
    const m = str.match(/(?:season|s)\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : 1;
}

function computeSimilarity(target, candidate) {
    const t = cleanTitle(target);
    const c = cleanTitle(candidate);

    if (t === c) return 1.0;

    // Season penalty: avoid matching Season 1 to Season 2/3 and vice versa
    const tHasSeason = /(?:season|s\s*\d+)/i.test(target);
    const cHasSeason = /(?:season|s\s*\d+)/i.test(candidate);
    if (tHasSeason || cHasSeason) {
        const tSeason = extractSeason(target);
        const cSeason = extractSeason(candidate);
        if (tSeason !== cSeason) return 0.15;
    }

    if (t.includes(c) || c.includes(t)) {
        const ratio = Math.min(t.length, c.length) / Math.max(t.length, c.length);
        return 0.75 + (0.24 * ratio);
    }

    const tWords = new Set(t.split(' ').filter(w => w.length > 2));
    const cWords = new Set(c.split(' ').filter(w => w.length > 2));
    if (tWords.size === 0 || cWords.size === 0) return 0;

    let match = 0;
    for (const w of tWords) {
        if (cWords.has(w)) match++;
    }

    return match / Math.max(tWords.size, cWords.size);
}

/**
 * Main Mapping Function: Maps AniList ID, MAL ID, or Title to AniNeko Slug
 * 
 * @param {Object} params
 * @param {string|number} [params.anilistId] - AniList Media ID
 * @param {string|number} [params.malId] - MyAnimeList ID
 * @param {string} [params.title] - Anime title string (fallback/override)
 * @returns {Promise<{slug: string, title: string, anilistId: number, malId: number}>}
 */
async function mapToSlug({ anilistId, malId, title } = {}) {
    // 1. Direct Slug Input Check
    if (typeof anilistId === 'string' && anilistId.includes('-') && isNaN(Number(anilistId))) {
        return { slug: anilistId, title: anilistId, anilistId: null, malId: null, cached: true };
    }

    const cacheKey = anilistId ? `ani:${anilistId}` : (malId ? `mal:${malId}` : `title:${cleanTitle(title)}`);

    // 2. Check Memory / Disk Cache
    if (MAP_CACHE.has(cacheKey)) {
        const cachedSlug = MAP_CACHE.get(cacheKey);
        return { slug: cachedSlug, cached: true };
    }

    // 3. Fetch Metadata from AniList or Jikan
    let meta = null;
    if (anilistId || malId) {
        try {
            meta = await fetchAniListMetadata({ anilistId, malId });
        } catch {}

        if (!meta && malId) {
            try {
                meta = await fetchJikanMetadata(malId);
            } catch {}
        }
    }

    // 4. Build Title Candidates
    const candidates = [];
    if (meta) {
        if (meta.title?.english) candidates.push(meta.title.english);
        if (meta.title?.userPreferred && !candidates.includes(meta.title.userPreferred)) candidates.push(meta.title.userPreferred);
        if (meta.title?.romaji && !candidates.includes(meta.title.romaji)) candidates.push(meta.title.romaji);
        if (meta.synonyms) {
            for (const s of meta.synonyms) {
                if (!candidates.includes(s)) candidates.push(s);
            }
        }
    }

    if (title && !candidates.includes(title)) {
        candidates.unshift(title);
    }

    if (candidates.length === 0) {
        throw new Error('Could not determine anime title for mapping. Provide anilistId, malId, or title.');
    }

    // 5. Search Catalog & Find Best Fuzzy Match
    for (const candTitle of candidates) {
        try {
            const searchKeyword = candTitle.replace(/[^\w\s]/g, ' ').split(/\s+/).slice(0, 4).join(' ');
            const searchRes = await searchAnime(searchKeyword);

            if (searchRes && searchRes.results && searchRes.results.length > 0) {
                let bestMatch = null;
                let maxScore = 0;

                for (const item of searchRes.results) {
                    for (const t of candidates) {
                        const score = computeSimilarity(t, item.title);
                        if (score > maxScore) {
                            maxScore = score;
                            bestMatch = item;
                        }
                    }
                }

                if (bestMatch && maxScore >= 0.35) {
                    const resolvedSlug = bestMatch.slug;

                    // Save to Cache for 0ms future lookup
                    if (anilistId) {
                        MAP_CACHE.set(`ani:${anilistId}`, resolvedSlug);
                        MAP_CACHE.set(String(anilistId), resolvedSlug);
                    }
                    if (meta?.idMal || malId) {
                        const mId = meta?.idMal || malId;
                        MAP_CACHE.set(`mal:${mId}`, resolvedSlug);
                    }
                    if (title) {
                        MAP_CACHE.set(`title:${cleanTitle(title)}`, resolvedSlug);
                    }
                    saveCache();

                    return {
                        slug: resolvedSlug,
                        matchedTitle: bestMatch.title,
                        score: maxScore,
                        anilistId: anilistId || meta?.id || null,
                        malId: malId || meta?.idMal || null,
                        cached: false
                    };
                }
            }
        } catch {}
    }

    // Fallback: slugify primary title
    const fallbackSlug = cleanTitle(candidates[0]).replace(/\s+/g, '-');
    return {
        slug: fallbackSlug,
        matchedTitle: candidates[0],
        score: 0.1,
        anilistId: anilistId || meta?.id || null,
        malId: malId || meta?.idMal || null,
        fallback: true
    };
}

module.exports = {
    mapToSlug,
    fetchAniListMetadata,
    fetchJikanMetadata
};
