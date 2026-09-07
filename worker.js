/**
 * ZOKO STREAMING SCRAPER & PROXY ENGINE - CLOUDFLARE WORKER (PAID PLAN EDITION)
 * 
 * Optimized for Cloudflare Workers Paid ($5/mo):
 *  - 10M KV Reads & 1M Writes/month: Multi-tier stream and AniList ID caching (ZOKO_CACHE)
 *  - Edge CDN Caching (caches.default + cf options): Video chunks (.ts) & subtitles (.vtt)
 *  - Isolate In-Memory Micro-Cache: 0ms latency, zero CPU time for ultra-hot requests
 *  - ctx.waitUntil: Non-blocking background writes for ultra-fast response dispatch
 *  - Full CORS (*) on all routes
 */

const ZOKO_BASE_URL = "https://zokoanime.video";
const OBF_KEY = 'otaku-embed-v1';
const OBF_KEY_BUF = new TextEncoder().encode(OBF_KEY);

const DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Origin": "https://zokoanime.video",
    "Referer": "https://zokoanime.video/",
    "Accept": "*/*"
};

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Range, Authorization",
    "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length, X-Cache, X-Colo"
};

// -------------------------------------------------------------
// TIER 1: In-Memory Isolate Micro-Cache (0ms, 0 CPU, 0 KV Ops)
// -------------------------------------------------------------
const MEM_CACHE = new Map();
const MAX_MEM_ITEMS = 300;

function getMemCache(key) {
    const item = MEM_CACHE.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
        MEM_CACHE.delete(key);
        return null;
    }
    return item.data;
}

function setMemCache(key, data, ttlSeconds) {
    if (MEM_CACHE.size >= MAX_MEM_ITEMS) {
        const oldestKey = MEM_CACHE.keys().next().value;
        if (oldestKey) MEM_CACHE.delete(oldestKey);
    }
    MEM_CACHE.set(key, {
        data,
        expiresAt: Date.now() + (ttlSeconds * 1000)
    });
}

// -------------------------------------------------------------
// Native Edge XOR Decryption
// -------------------------------------------------------------
function deobfuscatePayload(blob) {
    try {
        const binStr = atob(blob);
        const len = binStr.length;
        const keyLen = OBF_KEY_BUF.length;
        const out = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            out[i] = binStr.charCodeAt(i) ^ OBF_KEY_BUF[i % keyLen];
        }
        return JSON.parse(new TextDecoder().decode(out));
    } catch (err) {
        throw new Error(`Failed to deobfuscate Zoko payload: ${err.message}`);
    }
}

// -------------------------------------------------------------
// Resilient MAL ID mapping with 30-Day KV & Memory Caching
// -------------------------------------------------------------
async function resolveMalId(aniId, title, env, ctx) {
    const numId = parseInt(aniId);
    if (!numId && !title) return null;

    const cacheKey = `ani_mal:${numId || encodeURIComponent(title.toLowerCase())}`;

    // 1. Check Memory Cache
    const memMatch = getMemCache(cacheKey);
    if (memMatch) return memMatch;

    // 2. Check Cloudflare KV (Included in Paid Plan)
    if (env?.ZOKO_CACHE) {
        try {
            const kvMatch = await env.ZOKO_CACHE.get(cacheKey);
            if (kvMatch) {
                const parsed = parseInt(kvMatch);
                setMemCache(cacheKey, parsed, 86400); // 24hr memory
                return parsed;
            }
        } catch {}
    }

    let resolvedId = null;

    // 3. Try AniList GraphQL if numeric ID provided
    if (numId) {
        try {
            const q = `query ($id: Int) { Media(id: $id, type: ANIME) { id idMal } }`;
            const aRes = await fetch("https://graphql.anilist.co", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ query: q, variables: { id: numId } }),
                cf: { cacheEverything: true, cacheTtl: 2592000 }
            });
            if (aRes.ok) {
                const j = await aRes.json();
                if (j?.data?.Media?.idMal) resolvedId = j.data.Media.idMal;
            }
        } catch {}

        // 4. Try Kitsu mapping fallback if AniList is down or missing
        if (!resolvedId) {
            try {
                const kRes = await fetch(`https://kitsu.io/api/edge/mappings?filter[externalSite]=anilist/anime&filter[externalId]=${numId}`, {
                    cf: { cacheEverything: true, cacheTtl: 2592000 }
                });
                if (kRes.ok) {
                    const kj = await kRes.json();
                    const mapId = kj?.data?.[0]?.id;
                    if (mapId) {
                        const itemRes = await fetch(`https://kitsu.io/api/edge/mappings/${mapId}/item`);
                        if (itemRes.ok) {
                            const ij = await itemRes.json();
                            const animeId = ij?.data?.id;
                            if (animeId) {
                                const mRes = await fetch(`https://kitsu.io/api/edge/anime/${animeId}/mappings`);
                                if (mRes.ok) {
                                    const mj = await mRes.json();
                                    const mal = mj?.data?.find(x => x.attributes?.externalSite === 'myanimelist/anime');
                                    if (mal?.attributes?.externalId) resolvedId = parseInt(mal.attributes.externalId);
                                }
                            }
                        }
                    }
                }
            } catch {}
        }
    }

    // 5. Try title search via Kitsu
    if (!resolvedId && title) {
        try {
            const tRes = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(title)}&include=mappings&page[limit]=1`, {
                cf: { cacheEverything: true, cacheTtl: 2592000 }
            });
            if (tRes.ok) {
                const tj = await tRes.json();
                const mappings = tj.included?.filter(x => x.type === 'mappings') || [];
                const mal = mappings.find(m => m.attributes?.externalSite === 'myanimelist/anime');
                if (mal?.attributes?.externalId) resolvedId = parseInt(mal.attributes.externalId);
            }
        } catch {}
    }

    const finalId = resolvedId || numId || null;

    // Cache in Memory and Cloudflare KV for 30 days (Non-blocking write)
    if (finalId) {
        setMemCache(cacheKey, finalId, 86400);
        if (env?.ZOKO_CACHE && ctx?.waitUntil) {
            ctx.waitUntil(
                env.ZOKO_CACHE.put(cacheKey, finalId.toString(), { expirationTtl: 2592000 }).catch(() => {})
            );
        }
    }

    return finalId;
}

// -------------------------------------------------------------
// Edge Stream Extractor (Live Scraper + XOR Decrypt)
// -------------------------------------------------------------
async function extractStream(malId, episode, track, baseUrl) {
    const targetTrack = (track || 'sub').toLowerCase() === 'dub' ? 'dub' : 'sub';
    const targetEp = parseInt(episode) || 1;
    const streamUrl = `${ZOKO_BASE_URL}/stream/mal/${malId}/${targetEp}/${targetTrack}`;

    const res = await fetch(streamUrl, {
        headers: DEFAULT_HEADERS,
        cf: {
            cacheEverything: false
        }
    });

    if (!res.ok) {
        throw new Error(`Upstream mirror returned HTTP ${res.status}`);
    }

    const html = await res.text();
    const pIdx = html.indexOf('window.__P');
    if (pIdx === -1) {
        throw new Error("Could not locate stream payload in mirror response");
    }

    const s = html.indexOf('"', pIdx);
    const e = html.indexOf('"', s + 1);
    const rawPayload = html.slice(s + 1, e);
    const data = deobfuscatePayload(rawPayload);

    const rawMasterUrl = data.src;
    const proxiedMasterUrl = `${baseUrl}/api/proxy/m3u8?url=${encodeURIComponent(rawMasterUrl)}`;

    const subtitles = (data.subtitles || []).map(sub => ({
        lang: sub.lang,
        label: sub.label,
        default: !!sub.default,
        src: sub.src,
        proxied_src: `${baseUrl}/api/proxy/vtt?url=${encodeURIComponent(sub.src)}`
    }));

    return {
        success: true,
        source: 'zokoanime.video',
        malId,
        episode: targetEp,
        track: targetTrack,
        stream_url: proxiedMasterUrl,
        proxy_m3u8_url: proxiedMasterUrl,
        raw_stream_url: rawMasterUrl,
        download_url: `https://zokoanime.video/download/mal/${malId}/${targetEp}/${targetTrack}`,
        sources: [
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
        ],
        subtitles,
        skip: data.skip || null,
        chapters: data.chapters || []
    };
}

// -------------------------------------------------------------
// Edge M3U8 Playlist Rewriter (Cached at Edge for 60s)
// -------------------------------------------------------------
async function handleM3U8Proxy(targetUrl, baseUrl, request, ctx) {
    const cache = caches.default;
    const cacheUrl = new URL(request.url);

    // 1. Check Cloudflare Edge Cache
    const cached = await cache.match(cacheUrl);
    if (cached) {
        const h = new Headers(cached.headers);
        h.set("X-Cache", "EDGE-HIT");
        return new Response(cached.body, { status: cached.status, headers: h });
    }

    const upstreamRes = await fetch(targetUrl, {
        headers: {
            "User-Agent": DEFAULT_HEADERS["User-Agent"],
            "Referer": "https://zokoanime.video/",
            "Origin": "https://zokoanime.video"
        },
        cf: {
            cacheEverything: true,
            cacheTtl: 60
        }
    });

    if (!upstreamRes.ok) {
        return new Response(`Upstream m3u8 failed with status ${upstreamRes.status}`, {
            status: upstreamRes.status,
            headers: CORS_HEADERS
        });
    }

    const playlistText = await upstreamRes.text();
    const parsed = new URL(targetUrl);
    const baseDir = parsed.origin + parsed.pathname.substring(0, parsed.pathname.lastIndexOf('/') + 1);

    const lines = playlistText.split('\n');
    const rewritten = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Subtitle line URI rewriting
        if (trimmed.startsWith('#EXT-X-MEDIA:') && trimmed.includes('TYPE=SUBTITLES')) {
            return line.replace(/URI="([^"]+)"/, (match, uri) => {
                const abs = uri.startsWith('http') ? uri : (uri.startsWith('/') ? `${parsed.origin}${uri}` : `${baseDir}${uri}`);
                return `URI="${baseUrl}/api/proxy/vtt?url=${encodeURIComponent(abs)}"`;
            });
        }

        // Comments & directives
        if (trimmed.startsWith('#')) return line;

        // URL lines
        const absUrl = trimmed.startsWith('http') ? trimmed : (trimmed.startsWith('/') ? `${parsed.origin}${trimmed}` : `${baseDir}${trimmed}`);
        if (absUrl.includes('.m3u8')) {
            return `${baseUrl}/api/proxy/m3u8?url=${encodeURIComponent(absUrl)}`;
        }
        return `${baseUrl}/api/proxy/ts?url=${encodeURIComponent(absUrl)}`;
    }).join('\n');

    const response = new Response(rewritten, {
        headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "public, max-age=60, s-maxage=60",
            "X-Cache": "MISS"
        }
    });

    if (ctx?.waitUntil) {
        ctx.waitUntil(cache.put(cacheUrl, response.clone()));
    }

    return response;
}

// -------------------------------------------------------------
// Edge TS Video Chunk Streamer (Cloudflare CDN Edge Cached for 24h)
// -------------------------------------------------------------
async function handleTsProxy(targetUrl, request, ctx) {
    const rangeHeader = request.headers.get("Range");
    const cache = caches.default;
    const cacheUrl = new URL(request.url);

    // If no range header, check Cloudflare Edge CDN cache
    if (!rangeHeader) {
        const cachedRes = await cache.match(cacheUrl);
        if (cachedRes) {
            const h = new Headers(cachedRes.headers);
            h.set("X-Cache", "EDGE-HIT");
            return new Response(cachedRes.body, { status: cachedRes.status, headers: h });
        }
    }

    const fetchHeaders = {
        "User-Agent": DEFAULT_HEADERS["User-Agent"],
        "Referer": "https://zokoanime.video/",
        "Origin": "https://zokoanime.video"
    };
    if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

    // Use Cloudflare CDN Edge Cache features
    const upstreamRes = await fetch(targetUrl, {
        headers: fetchHeaders,
        cf: {
            cacheEverything: true,
            cacheTtl: 86400, // 24 hours edge cache
            cacheKey: targetUrl
        }
    });

    const responseHeaders = new Headers(CORS_HEADERS);
    responseHeaders.set("Content-Type", upstreamRes.headers.get("Content-Type") || "video/mp2t");
    responseHeaders.set("Cache-Control", "public, max-age=86400, s-maxage=86400, immutable");
    responseHeaders.set("X-Cache", "MISS");

    if (upstreamRes.headers.has("Content-Length")) {
        responseHeaders.set("Content-Length", upstreamRes.headers.get("Content-Length"));
    }
    if (upstreamRes.headers.has("Content-Range")) {
        responseHeaders.set("Content-Range", upstreamRes.headers.get("Content-Range"));
    }
    if (upstreamRes.headers.has("Accept-Ranges")) {
        responseHeaders.set("Accept-Ranges", upstreamRes.headers.get("Accept-Ranges"));
    }

    const response = new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: responseHeaders
    });

    // Cache immutable 200 chunks in Cloudflare Edge Cache
    if (!rangeHeader && upstreamRes.status === 200 && ctx?.waitUntil) {
        ctx.waitUntil(cache.put(cacheUrl, response.clone()));
    }

    return response;
}

// -------------------------------------------------------------
// Edge VTT Subtitle Streamer (Edge Cached for 7 Days)
// -------------------------------------------------------------
async function handleVttProxy(targetUrl, request, ctx) {
    const cache = caches.default;
    const cacheUrl = new URL(request.url);

    const cachedRes = await cache.match(cacheUrl);
    if (cachedRes) {
        const h = new Headers(cachedRes.headers);
        h.set("X-Cache", "EDGE-HIT");
        return new Response(cachedRes.body, { status: cachedRes.status, headers: h });
    }

    const upstreamRes = await fetch(targetUrl, {
        headers: {
            "User-Agent": DEFAULT_HEADERS["User-Agent"],
            "Referer": "https://zokoanime.video/"
        },
        cf: {
            cacheEverything: true,
            cacheTtl: 604800 // 7 days
        }
    });

    const response = new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: {
            ...CORS_HEADERS,
            "Content-Type": "text/vtt; charset=utf-8",
            "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable",
            "X-Cache": "MISS"
        }
    });

    if (upstreamRes.status === 200 && ctx?.waitUntil) {
        ctx.waitUntil(cache.put(cacheUrl, response.clone()));
    }

    return response;
}

// -------------------------------------------------------------
// Cloudflare Worker Fetch Handler
// -------------------------------------------------------------
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const baseUrl = url.origin;
        const colo = request.cf?.colo || "EDGE";

        // Handle CORS Preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: CORS_HEADERS });
        }

        // 1. Health Endpoint
        if (url.pathname === "/health") {
            return new Response(JSON.stringify({
                status: "online",
                platform: "cloudflare-workers-edge",
                plan: "workers-paid",
                colo,
                kv_active: !!env.ZOKO_CACHE,
                mem_cache_items: MEM_CACHE.size
            }), {
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
            });
        }

        // 2. Stream Resolver Endpoint: /api/stream
        if (url.pathname === "/api/stream") {
            try {
                let id = url.searchParams.get("id");
                let malId = url.searchParams.get("malId");
                const title = url.searchParams.get("title");
                let ep = parseInt(url.searchParams.get("ep")) || 1;
                const track = (url.searchParams.get("track") || "sub").toLowerCase();

                // Handle shorthand "id-ep"
                if (typeof id === 'string' && id.includes('-')) {
                    const parts = id.split('-');
                    id = parts[0];
                    ep = parseInt(parts[1]) || ep;
                }
                if (typeof malId === 'string' && malId.includes('-')) {
                    const parts = malId.split('-');
                    malId = parts[0];
                    ep = parseInt(parts[1]) || ep;
                }

                let targetMalId = malId;
                if (!targetMalId) {
                    targetMalId = await resolveMalId(id, title, env, ctx);
                }

                if (!targetMalId) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: "Unable to resolve anime ID. Please provide id, malId, or title."
                    }), {
                        status: 400,
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                    });
                }

                const streamCacheKey = `stream:${targetMalId}:${ep}:${track}`;

                // --- TIER 1: In-Memory Isolate Cache ---
                const memData = getMemCache(streamCacheKey);
                if (memData) {
                    return new Response(JSON.stringify(memData), {
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "application/json",
                            "X-Cache": "MEM-HIT",
                            "X-Colo": colo
                        }
                    });
                }

                // --- TIER 2: Cloudflare Workers KV (10M reads/month included in Paid Plan) ---
                if (env.ZOKO_CACHE) {
                    try {
                        const kvDataStr = await env.ZOKO_CACHE.get(streamCacheKey);
                        if (kvDataStr) {
                            const kvData = JSON.parse(kvDataStr);
                            setMemCache(streamCacheKey, kvData, 1800); // 30min memory cache
                            return new Response(kvDataStr, {
                                headers: {
                                    ...CORS_HEADERS,
                                    "Content-Type": "application/json",
                                    "X-Cache": "KV-HIT",
                                    "X-Colo": colo
                                }
                            });
                        }
                    } catch {}
                }

                // --- CACHE MISS: Scrape Upstream ZokoAnime & Decrypt XOR ---
                const streamData = await extractStream(targetMalId, ep, track, baseUrl);

                // Save in Memory (30 mins)
                setMemCache(streamCacheKey, streamData, 1800);

                // Save in Cloudflare KV asynchronously (3 hours TTL) via ctx.waitUntil
                if (env.ZOKO_CACHE && ctx?.waitUntil) {
                    ctx.waitUntil(
                        env.ZOKO_CACHE.put(streamCacheKey, JSON.stringify(streamData), {
                            expirationTtl: 10800 // 3 hours
                        }).catch(() => {})
                    );
                }

                return new Response(JSON.stringify(streamData), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                        "X-Cache": "MISS",
                        "X-Colo": colo
                    }
                });
            } catch (err) {
                return new Response(JSON.stringify({ success: false, error: err.message }), {
                    status: 500,
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                });
            }
        }

        // 2b. Anigo2 Compatible Watch Route: /api/watch/:id/:lang/:ep
        if (url.pathname.startsWith("/api/watch")) {
            try {
                const parts = url.pathname.replace('/api/watch', '').split('/').filter(Boolean);
                let id = parts[0] || url.searchParams.get("id");
                let lang = (parts[1] || url.searchParams.get("lang") || "sub").toLowerCase();
                let ep = parseInt(parts[2] || url.searchParams.get("ep")) || 1;

                if (!id) {
                    return new Response(JSON.stringify({ error: "Missing anime id in /api/watch/:id/:lang/:ep" }), {
                        status: 400,
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                    });
                }

                let targetMalId = parseInt(id);
                if (!targetMalId || targetMalId > 60000) {
                    targetMalId = await resolveMalId(id, url.searchParams.get("title"), env, ctx);
                }

                if (!targetMalId) {
                    return new Response(JSON.stringify({ error: "Unable to map anime ID to MAL ID" }), {
                        status: 404,
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                    });
                }

                const streamCacheKey = `stream:${targetMalId}:${ep}:${lang}`;
                let streamData = getMemCache(streamCacheKey);
                let cacheStatus = "MEM-HIT";

                if (!streamData && env.ZOKO_CACHE) {
                    try {
                        const kvDataStr = await env.ZOKO_CACHE.get(streamCacheKey);
                        if (kvDataStr) {
                            streamData = JSON.parse(kvDataStr);
                            cacheStatus = "KV-HIT";
                        }
                    } catch {}
                }

                if (!streamData) {
                    streamData = await extractStream(targetMalId, ep, lang, baseUrl);
                    cacheStatus = "MISS";
                    setMemCache(streamCacheKey, streamData, 1800);
                    if (env.ZOKO_CACHE && ctx?.waitUntil) {
                        ctx.waitUntil(
                            env.ZOKO_CACHE.put(streamCacheKey, JSON.stringify(streamData), { expirationTtl: 10800 }).catch(() => {})
                        );
                    }
                }

                // Format expected by Anigo2 useStreamFetch hook
                const anigoFormatted = {
                    "zoko": {
                        "streams": [
                            {
                                "url": streamData.stream_url,
                                "type": "hls",
                                "server": "Zoko-Edge (Direct HLS)",
                                "priority": 1
                            }
                        ],
                        "subtitles": (streamData.subtitles || []).map(s => ({
                            "file": s.proxied_src,
                            "label": s.label || "English",
                            "kind": "captions",
                            "default": !!s.default,
                            "language": s.lang || "en",
                            "format": "vtt"
                        })),
                        "intro": streamData.skip?.intro || { "start": 0, "end": 0 },
                        "outro": streamData.skip?.outro || { "start": 0, "end": 0 },
                        "provider": "zoko-stream-edge"
                    }
                };

                return new Response(JSON.stringify(anigoFormatted), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                        "X-Cache": cacheStatus,
                        "X-Colo": colo
                    }
                });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                });
            }
        }

        // 3. Generic Proxy: /api/proxy (Auto-detects m3u8, vtt, ts for Anigo2)
        if (url.pathname === "/api/proxy") {
            const target = url.searchParams.get("url");
            if (!target) return new Response("Missing target url", { status: 400, headers: CORS_HEADERS });
            if (target.includes(".m3u8")) return handleM3U8Proxy(target, baseUrl, request, ctx);
            if (target.includes(".vtt")) return handleVttProxy(target, request, ctx);
            return handleTsProxy(target, request, ctx);
        }

        // 4. M3U8 Playlist Proxy: /api/proxy/m3u8
        if (url.pathname === "/api/proxy/m3u8") {
            const target = url.searchParams.get("url");
            if (!target) return new Response("Missing target url", { status: 400, headers: CORS_HEADERS });
            return handleM3U8Proxy(target, baseUrl, request, ctx);
        }

        // 4. Video TS Chunk Proxy: /api/proxy/ts (Edge CDN Cached)
        if (url.pathname === "/api/proxy/ts") {
            const target = url.searchParams.get("url");
            if (!target) return new Response("Missing target url", { status: 400, headers: CORS_HEADERS });
            return handleTsProxy(target, request, ctx);
        }

        // 5. Subtitles VTT Proxy: /api/proxy/vtt (Edge CDN Cached)
        if (url.pathname === "/api/proxy/vtt") {
            const target = url.searchParams.get("url");
            if (!target) return new Response("Missing target url", { status: 400, headers: CORS_HEADERS });
            return handleVttProxy(target, request, ctx);
        }

        // 6. Download Portal Resolver: /api/download/:id/:ep or /api/download
        if (url.pathname.startsWith("/api/download")) {
            try {
                const parts = url.pathname.replace('/api/download', '').split('/').filter(Boolean);
                let id = parts[0] || url.searchParams.get("id") || url.searchParams.get("malId");
                let ep = parseInt(parts[1] || url.searchParams.get("ep")) || 1;
                const track = (url.searchParams.get("track") || "sub").toLowerCase();

                let targetMalId = id;
                const num = parseInt(id);
                if (num && num > 60000) {
                    targetMalId = await resolveMalId(id, url.searchParams.get("title"), env, ctx);
                }

                const dlCacheKey = `dl:${targetMalId || id}:${ep}:${track}`;
                const portalUrl = `https://zokoanime.video/download/mal/${targetMalId || id}/${ep}/${track}`;

                if (url.searchParams.get("json") === "true") {
                    const dlData = {
                        success: true,
                        id,
                        malId: targetMalId || id,
                        episode: ep,
                        track,
                        download_url: portalUrl,
                        note: "Powered by AnimePahe / NekoStream CDN"
                    };

                    // Cache in KV for 6 hours
                    if (env.ZOKO_CACHE && ctx?.waitUntil) {
                        ctx.waitUntil(
                            env.ZOKO_CACHE.put(dlCacheKey, JSON.stringify(dlData), { expirationTtl: 21600 }).catch(() => {})
                        );
                    }

                    return new Response(JSON.stringify(dlData), {
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json", "X-Colo": colo }
                    });
                }

                return Response.redirect(portalUrl, 302);
            } catch (err) {
                return new Response(JSON.stringify({ success: false, error: err.message }), {
                    status: 500,
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                });
            }
        }

        // 7. Pure API Discovery & Documentation Index (Root /)
        if (url.pathname === "/" || url.pathname === "/api") {
            return new Response(JSON.stringify({
                name: "Zoko Pure Edge Anime Streaming & Scraper API",
                version: "5.0.0 (Cloudflare Paid Optimized)",
                platform: "Cloudflare Workers Edge (Paid V8 Runtime)",
                cors_enabled: true,
                status: "ONLINE",
                optimizations: {
                    kv_storage: "Cloudflare KV Multi-tier Caching (10M ops/mo)",
                    edge_cdn_cache: "Cloudflare Cache API (caches.default + cf: cacheEverything)",
                    isolate_memory_cache: "V8 Global Scope Micro-Cache (0ms latency)",
                    async_non_blocking_writes: "ctx.waitUntil for maximum throughput",
                    colo: colo
                },
                endpoints: {
                    stream: {
                        method: "GET",
                        path: "/api/stream",
                        summary: "Extract HLS stream, proxy URLs, VTT subtitles, and skip markers (Cached in KV & Edge)",
                        params: {
                            id: "AniList ID or MAL ID (e.g. ?id=21)",
                            malId: "Direct MyAnimeList ID (e.g. ?malId=21)",
                            title: "Anime title fallback (e.g. ?title=Mushoku Tensei)",
                            ep: "Episode number (default 1)",
                            track: "'sub' or 'dub' (default: 'sub')"
                        },
                        example: `${baseUrl}/api/stream?id=21&ep=1`
                    },
                    download: {
                        method: "GET",
                        path: "/api/download/:id/:ep",
                        summary: "Direct 302 redirect or JSON download links (Pahe / NekoStream CDN)",
                        example: `${baseUrl}/api/download/21/1`
                    },
                    proxy_m3u8: {
                        method: "GET",
                        path: "/api/proxy/m3u8?url=...",
                        summary: "HLS Master/Media playlist rewriter with Edge Caching"
                    },
                    proxy_ts: {
                        method: "GET",
                        path: "/api/proxy/ts?url=...",
                        summary: "Zero-copy edge video chunk proxy with 24-hr Cloudflare CDN Edge Cache"
                    },
                    proxy_vtt: {
                        method: "GET",
                        path: "/api/proxy/vtt?url=...",
                        summary: "Subtitle proxy with 7-day Edge Cache"
                    },
                    health: {
                        method: "GET",
                        path: "/health"
                    }
                }
            }, null, 2), {
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({
            error: "Not Found",
            message: `Route ${url.pathname} does not exist on this backend API. See / for API endpoints.`
        }), {
            status: 404,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
    }
};
