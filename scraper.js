/**
 * ZOKOANIME NATIVE STREAMING SCRAPER ENGINE
 * 100% Pure Video Streaming Resolver for https://zokoanime.video/
 * Decrypts XOR 'otaku-embed-v1' Stream Payloads
 * Note: All catalog/anime cards/metadata are queried directly from AniList in the frontend!
 */

// DNS resolution order (opt-in for environments with native IPv6)
if (process.env.IPV6_FIRST === 'true') {
    try { require('node:dns').setDefaultResultOrder('ipv6first'); } catch {}
}

// --- Persistent Connection Pooling & Keep-Alive ---
try {
    const { setGlobalDispatcher, Agent } = require('undici');
    const globalAgent = new Agent({
        keepAliveTimeout: 30000,
        keepAliveMaxTimeout: 60000,
        pipelining: 0,
        connections: 128
    });
    setGlobalDispatcher(globalAgent);
} catch {}

// --- Ultra-Fast In-Memory LRU Cache Store ---
const memoryCache = new Map();
function getCached(key) {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
        memoryCache.delete(key);
        return null;
    }
    return item.value;
}

// --- Constants & Config ---
const ZOKO_BASE_URL = process.env.ZOKO_BASE_URL || "https://zokoanime.video";
const ANILIST_ENDPOINT = process.env.ANILIST_GRAPHQL_ENDPOINT || "https://graphql.anilist.co";
const CACHE_MAX_ITEMS = parseInt(process.env.CACHE_MAX_ITEMS) || 3000;
const OBF_KEY = 'otaku-embed-v1';

function setCached(key, value, ttlMs = 300000) {
    memoryCache.set(key, { value, expiry: Date.now() + ttlMs });
    if (memoryCache.size > CACHE_MAX_ITEMS) {
        const first = memoryCache.keys().next().value;
        memoryCache.delete(first);
    }
}

const DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Origin": "https://zokoanime.video",
    "Referer": "https://zokoanime.video/",
    "Accept": "*/*"
};

// --- Native Ultra-Fast Buffer XOR Deobfuscation ---
const OBF_KEY_BUF = Buffer.from(OBF_KEY, 'utf-8');
const OBF_KEY_LEN = OBF_KEY_BUF.length;

function deobfuscatePayload(blob) {
    try {
        const buf = Buffer.from(blob, 'base64');
        for (let i = 0; i < buf.length; i++) {
            buf[i] ^= OBF_KEY_BUF[i % OBF_KEY_LEN];
        }
        return JSON.parse(buf.toString('utf-8'));
    } catch (err) {
        throw new Error(`Failed to deobfuscate ZokoAnime payload: ${err.message}`);
    }
}

// --- In-Flight Request Deduplication (Singleflight) ---
const inflightPromises = new Map();
function runSingleflight(key, fn) {
    if (inflightPromises.has(key)) {
        return inflightPromises.get(key);
    }
    const p = Promise.resolve().then(fn).finally(() => {
        inflightPromises.delete(key);
    });
    inflightPromises.set(key, p);
    return p;
}

// --- Fallback Helper: Convert AniList ID to MyAnimeList (MAL) ID ---
// Only used if caller did not provide malId directly
async function getMalIdFromAniList(aniId) {
    const numericId = parseInt(aniId);
    if (!numericId) return null;

    const cacheKey = `mal_map:${numericId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
      }
    }
    `;

    try {
        const res = await fetch(ANILIST_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ query: query.trim(), variables: { id: numericId } }),
            signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
            const json = await res.json();
            const malId = json?.data?.Media?.idMal || numericId;
            setCached(cacheKey, malId, 86400000); // 24h cache
            return malId;
        }
    } catch {}

    return numericId;
}

// --- Core ZokoAnime Stream Extractor ---
async function extractZokoStream({ malId, anilistId, episode = 1, track = 'sub', hostUrl = '' }) {
    let resolvedMalId = malId;

    if (!resolvedMalId && anilistId) {
        resolvedMalId = await getMalIdFromAniList(anilistId);
    }

    if (!resolvedMalId) {
        throw new Error("Cannot extract stream: Neither malId nor anilistId was provided or resolved.");
    }

    const targetTrack = (track || 'sub').toLowerCase() === 'dub' ? 'dub' : 'sub';
    const targetEp = parseInt(episode) || 1;
    const cacheKey = `zoko_stream:${resolvedMalId}:${targetEp}:${targetTrack}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    return runSingleflight(cacheKey, async () => {
        const streamPageUrl = `${ZOKO_BASE_URL}/stream/mal/${resolvedMalId}/${targetEp}/${targetTrack}`;
        
        const res = await fetch(streamPageUrl, {
            headers: DEFAULT_HEADERS,
            signal: AbortSignal.timeout(10000)
        });

        if (!res.ok) {
            throw new Error(`ZokoAnime returned HTTP ${res.status} for ${streamPageUrl}`);
        }

        const html = await res.text();
        const pIdx = html.indexOf('window.__P');
        let rawPayload = null;
        if (pIdx !== -1) {
            const s = html.indexOf('"', pIdx);
            if (s !== -1) {
                const e = html.indexOf('"', s + 1);
                if (e !== -1) rawPayload = html.slice(s + 1, e);
            }
        }

        if (!rawPayload) {
            if (html.includes('Not <span class="stroke">found.</span>') || html.includes('404')) {
                throw new Error(`Episode ${targetEp} (${targetTrack}) not available on ZokoAnime for ID ${resolvedMalId}`);
            }
            throw new Error("Could not find encrypted payload (window.__P) in ZokoAnime page.");
        }

        const data = deobfuscatePayload(rawPayload);
        const rawMasterUrl = data.src;
        const proxiedMasterUrl = hostUrl 
            ? `${hostUrl}/api/proxy/m3u8?url=${encodeURIComponent(rawMasterUrl)}`
            : `/api/proxy/m3u8?url=${encodeURIComponent(rawMasterUrl)}`;

        const subtitles = (data.subtitles || []).map(sub => ({
            lang: sub.lang,
            label: sub.label,
            default: !!sub.default,
            src: sub.src,
            proxied_src: hostUrl ? `${hostUrl}/api/proxy/vtt?url=${encodeURIComponent(sub.src)}` : `/api/proxy/vtt?url=${encodeURIComponent(sub.src)}`
        }));

        const sources = [
            {
                type: targetTrack,
                url: proxiedMasterUrl,
                proxy_m3u8_url: proxiedMasterUrl,
                m3u8_url: proxiedMasterUrl,
                raw_url: rawMasterUrl,
                is_m3u8: true,
                quality: 'auto',
                jump: data.skip || {},
                tracks: subtitles
            }
        ];

        const result = {
            success: true,
            source: 'zokoanime.video',
            malId: resolvedMalId,
            anilistId: anilistId || null,
            episode: targetEp,
            track: targetTrack,
            stream_url: proxiedMasterUrl,
            proxy_m3u8_url: proxiedMasterUrl,
            raw_stream_url: rawMasterUrl,
            download_url: data.download_url ? `${ZOKO_BASE_URL}${data.download_url}` : null,
            sources,
            subtitles,
            skip: data.skip || null,
            chapters: data.chapters || [],
            headers: {
                "Referer": "https://zokoanime.video/",
                "Origin": "https://zokoanime.video"
            }
        };

        setCached(cacheKey, result, 180000);
        return result;
    });
}

// --- Stream Sources Endpoint (Multi-Track Resolution) ---
async function getStreamSources(epId, hostUrl = '') {
    const parts = String(epId).split('-');
    const malId = parseInt(parts[0]);
    const epNum = parts[1] ? parseInt(parts[1]) : 1;
    const requestedTrack = (parts[2] || 'sub').toLowerCase() === 'dub' ? 'dub' : 'sub';
    const altTrack = requestedTrack === 'dub' ? 'sub' : 'dub';

    const [primaryResult, altResult] = await Promise.allSettled([
        extractZokoStream({ malId, episode: epNum, track: requestedTrack, hostUrl }),
        extractZokoStream({ malId, episode: epNum, track: altTrack, hostUrl })
    ]);

    if (primaryResult.status !== 'fulfilled' || !primaryResult.value?.stream_url) {
        if (altResult.status === 'fulfilled' && altResult.value?.stream_url) {
            const fallback = altResult.value;
            return {
                headers: fallback.headers,
                sources: [{
                    type: altTrack,
                    url: fallback.stream_url,
                    proxy_m3u8_url: fallback.stream_url,
                    m3u8_url: fallback.stream_url,
                    raw_url: fallback.raw_stream_url,
                    is_m3u8: true,
                    quality: 'auto',
                    jump: fallback.skip || {},
                    tracks: fallback.subtitles
                }],
                subtitles: fallback.subtitles,
                skip: fallback.skip,
                download: fallback.download_url
            };
        }
        throw primaryResult.reason || new Error(`No stream available for ${epId}`);
    }

    const primaryStream = primaryResult.value;
    const sources = [
        {
            type: requestedTrack,
            url: primaryStream.stream_url,
            proxy_m3u8_url: primaryStream.stream_url,
            m3u8_url: primaryStream.stream_url,
            raw_url: primaryStream.raw_stream_url,
            is_m3u8: true,
            quality: 'auto',
            jump: primaryStream.skip || {},
            tracks: primaryStream.subtitles
        }
    ];

    if (altResult.status === 'fulfilled' && altResult.value?.stream_url) {
        const altStream = altResult.value;
        sources.push({
            type: altTrack,
            url: altStream.stream_url,
            proxy_m3u8_url: altStream.stream_url,
            m3u8_url: altStream.stream_url,
            raw_url: altStream.raw_stream_url,
            is_m3u8: true,
            quality: 'auto',
            jump: altStream.skip || {},
            tracks: altStream.subtitles
        });
    }

    return {
        headers: primaryStream.headers,
        sources,
        subtitles: primaryStream.subtitles,
        skip: primaryStream.skip,
        download: primaryStream.download_url
    };
}

module.exports = {
    DEFAULT_HEADERS,
    ZOKO_BASE_URL,
    OBF_KEY,
    deobfuscatePayload,
    extractZokoStream,
    getStreamSources,
    getMalIdFromAniList
};
