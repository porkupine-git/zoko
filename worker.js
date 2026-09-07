/**
 * ZOKO STREAMING SCRAPER & PROXY ENGINE - CLOUDFLARE WORKER
 * Optimized for Cloudflare Workers (Paid Plan / Edge V8 Runtime)
 * Handles:
 *  - /api/stream            : Decrypts upstream XOR payload and resolves HLS streams
 *  - /api/proxy/m3u8        : Rewrites HLS playlists at edge wire-speed
 *  - /api/proxy/ts          : Streams video chunks zero-buffer with CORS bypass
 *  - /api/proxy/vtt         : Subtitle proxy
 *  - /api/download/*        : AnimePahe / NekoStream download portal resolver
 *  - Static Assets          : Serves frontend (public/ index.html, app.js, style.css)
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
    "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length"
};

// Native Edge XOR Decryption
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

// Resilient MAL ID mapping (AniList -> Kitsu Fallback)
async function resolveMalId(aniId, title) {
    const numId = parseInt(aniId);
    if (!numId && !title) return null;

    // 1. Try AniList GraphQL if numeric ID provided
    if (numId) {
        try {
            const q = `query ($id: Int) { Media(id: $id, type: ANIME) { id idMal } }`;
            const aRes = await fetch("https://graphql.anilist.co", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ query: q, variables: { id: numId } })
            });
            if (aRes.ok) {
                const j = await aRes.json();
                if (j?.data?.Media?.idMal) return j.data.Media.idMal;
            }
        } catch {}

        // 2. Try Kitsu mapping fallback if AniList is down
        try {
            const kRes = await fetch(`https://kitsu.io/api/edge/mappings?filter[externalSite]=anilist/anime&filter[externalId]=${numId}`);
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
                                if (mal?.attributes?.externalId) return parseInt(mal.attributes.externalId);
                            }
                        }
                    }
                }
            }
        } catch {}
    }

    // 3. Try title search via Kitsu
    if (title) {
        try {
            const tRes = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(title)}&include=mappings&page[limit]=1`);
            if (tRes.ok) {
                const tj = await tRes.json();
                const mappings = tj.included?.filter(x => x.type === 'mappings') || [];
                const mal = mappings.find(m => m.attributes?.externalSite === 'myanimelist/anime');
                if (mal?.attributes?.externalId) return parseInt(mal.attributes.externalId);
            }
        } catch {}
    }

    return numId || null;
}

// Edge Stream Extractor
async function extractStream(malId, episode, track, baseUrl) {
    const targetTrack = (track || 'sub').toLowerCase() === 'dub' ? 'dub' : 'sub';
    const targetEp = parseInt(episode) || 1;
    const streamUrl = `${ZOKO_BASE_URL}/stream/mal/${malId}/${targetEp}/${targetTrack}`;

    const res = await fetch(streamUrl, { headers: DEFAULT_HEADERS });
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

// Edge M3U8 Playlist Rewriter
async function handleM3U8Proxy(targetUrl, baseUrl) {
    const upstreamRes = await fetch(targetUrl, {
        headers: {
            "User-Agent": DEFAULT_HEADERS["User-Agent"],
            "Referer": "https://zokoanime.video/",
            "Origin": "https://zokoanime.video"
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

    return new Response(rewritten, {
        headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "public, max-age=60"
        }
    });
}

// Edge TS Video Chunk Streamer
async function handleTsProxy(targetUrl, request) {
    const rangeHeader = request.headers.get("Range");
    const fetchHeaders = {
        "User-Agent": DEFAULT_HEADERS["User-Agent"],
        "Referer": "https://zokoanime.video/",
        "Origin": "https://zokoanime.video"
    };
    if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

    const upstreamRes = await fetch(targetUrl, { headers: fetchHeaders });
    const responseHeaders = new Headers(CORS_HEADERS);
    responseHeaders.set("Content-Type", upstreamRes.headers.get("Content-Type") || "video/mp2t");
    responseHeaders.set("Cache-Control", "public, max-age=86400, immutable");

    if (upstreamRes.headers.has("Content-Length")) {
        responseHeaders.set("Content-Length", upstreamRes.headers.get("Content-Length"));
    }
    if (upstreamRes.headers.has("Content-Range")) {
        responseHeaders.set("Content-Range", upstreamRes.headers.get("Content-Range"));
    }
    if (upstreamRes.headers.has("Accept-Ranges")) {
        responseHeaders.set("Accept-Ranges", upstreamRes.headers.get("Accept-Ranges"));
    }

    return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: responseHeaders
    });
}

// Edge VTT Subtitle Streamer
async function handleVttProxy(targetUrl) {
    const upstreamRes = await fetch(targetUrl, {
        headers: {
            "User-Agent": DEFAULT_HEADERS["User-Agent"],
            "Referer": "https://zokoanime.video/"
        }
    });

    return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: {
            ...CORS_HEADERS,
            "Content-Type": "text/vtt; charset=utf-8",
            "Cache-Control": "public, max-age=86400"
        }
    });
}

// Cloudflare Worker Fetch Handler
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const baseUrl = url.origin;

        // Handle CORS Preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: CORS_HEADERS });
        }

        // 1. Health Endpoint
        if (url.pathname === "/health") {
            return new Response(JSON.stringify({ status: "online", platform: "cloudflare-workers-edge" }), {
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
                const track = url.searchParams.get("track") || "sub";

                // Handle shorthand
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
                    targetMalId = await resolveMalId(id, title);
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

                const streamData = await extractStream(targetMalId, ep, track, baseUrl);
                return new Response(JSON.stringify(streamData), {
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                });
            } catch (err) {
                return new Response(JSON.stringify({ success: false, error: err.message }), {
                    status: 500,
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                });
            }
        }

        // 3. M3U8 Playlist Proxy: /api/proxy/m3u8
        if (url.pathname === "/api/proxy/m3u8") {
            const target = url.searchParams.get("url");
            if (!target) return new Response("Missing target url", { status: 400, headers: CORS_HEADERS });
            return handleM3U8Proxy(target, baseUrl);
        }

        // 4. Video TS Chunk Proxy: /api/proxy/ts
        if (url.pathname === "/api/proxy/ts") {
            const target = url.searchParams.get("url");
            if (!target) return new Response("Missing target url", { status: 400, headers: CORS_HEADERS });
            return handleTsProxy(target, request);
        }

        // 5. Subtitles VTT Proxy: /api/proxy/vtt
        if (url.pathname === "/api/proxy/vtt") {
            const target = url.searchParams.get("url");
            if (!target) return new Response("Missing target url", { status: 400, headers: CORS_HEADERS });
            return handleVttProxy(target);
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
                    targetMalId = await resolveMalId(id, url.searchParams.get("title"));
                }

                const portalUrl = `https://zokoanime.video/download/mal/${targetMalId || id}/${ep}/${track}`;
                if (url.searchParams.get("json") === "true") {
                    return new Response(JSON.stringify({
                        success: true,
                        id,
                        malId: targetMalId || id,
                        episode: ep,
                        track,
                        download_url: portalUrl,
                        note: "Powered by AnimePahe / NekoStream CDN"
                    }), {
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
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
                version: "4.2.0",
                platform: "Cloudflare Workers Edge (V8 Runtime)",
                cors_enabled: true,
                status: "ONLINE",
                description: "Zero-dependency pure backend scraper API. Call this from any frontend, mobile app, or client with full CORS enabled.",
                endpoints: {
                    stream: {
                        method: "GET",
                        path: "/api/stream",
                        summary: "Extract HLS stream, proxy URLs, VTT subtitles, and skip markers",
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
                        summary: "HLS Master/Media playlist rewriter with CORS"
                    },
                    proxy_ts: {
                        method: "GET",
                        path: "/api/proxy/ts?url=...",
                        summary: "Zero-copy edge video chunk proxy"
                    },
                    proxy_vtt: {
                        method: "GET",
                        path: "/api/proxy/vtt?url=...",
                        summary: "Subtitle proxy"
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
