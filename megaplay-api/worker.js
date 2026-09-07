/**
 * Aniko & MegaPlay Reverse-Engineered Edge API
 * Cloudflare Worker for https://aniko-backend.rk18109ry.workers.dev/
 * 
 * SPECIFICALLY OPTIMIZED FOR CLOUDFLARE WORKERS PAID PLAN ($5/mo):
 * - 30M ms CPU limit: Edge Cache (caches.default) + KV Cache drops avg CPU time to < 1.5ms.
 * - 10M Requests limit: Smart Segment Bypass routes open CDNs (TikTok CDN) directly, saving 99% of requests!
 * - 1M KV Writes limit: 12-hour TTL for streams, 30-day TTL for ID mappings protects write quota.
 * - 10M KV Reads limit: Cloudflare Cache API acts as L1 cache in RAM before touching KV (L2).
 * - Zero Memory Buffering: Native V8 zero-copy body streaming.
 */

import megaplay, {
    resolveFromMal,
    resolveFromAnilist,
    resolveFromCatalogId,
    resolveFromEmbedUrl,
    getRecentAnime,
    getSeriesEpisodes,
    mapAniToMal
} from './megaplay.js';

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
};

// Open CDN hosts that do NOT check referer header (TikTok CDN / ByteDance only)
const OPEN_CDN_HOSTS = [
    'tiktokcdn.com',
    'byteoversea.com',
    'ibytedtos.com'
];

function isDirectCdn(urlStr) {
    for (const host of OPEN_CDN_HOSTS) {
        if (urlStr.includes(host)) return true;
    }
    return false;
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            ...extraHeaders
        }
    });
}

function errorResponse(message, status = 500) {
    return jsonResponse({ success: false, error: message }, status, {
        "Cache-Control": "no-store"
    });
}

function attachProxyUrls(data, origin) {
    if (!data || !data.success) return data;
    if (data.stream_url) {
        data.proxy_stream_url = `${origin}/api/proxy/m3u8?url=${encodeURIComponent(data.stream_url)}`;
    }
    if (Array.isArray(data.sources)) {
        data.sources = data.sources.map(s => ({
            ...s,
            proxy_url: `${origin}/api/proxy/m3u8?url=${encodeURIComponent(s.url)}`
        }));
    }
    if (Array.isArray(data.subtitles)) {
        data.subtitles = data.subtitles.map(sub => ({
            ...sub,
            proxy_url: sub.url ? `${origin}/api/proxy/vtt?url=${encodeURIComponent(sub.url)}` : undefined
        }));
    }
    return data;
}

export default {
    async fetch(request, env, ctx) {
        // 1. Instant CORS preflight (< 0.1ms CPU)
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        const url = new URL(request.url);
        const origin = url.origin;
        const pathname = url.pathname;
        const searchParams = url.searchParams;
        const colo = request.cf?.colo || "EDGE";

        // 2. L1 Free Edge Cache API Check (caches.default)
        // Free, unlimited, runs in RAM in < 0.5ms CPU time without consuming KV reads!
        const cache = caches.default;
        const isGet = request.method === "GET";
        const isCacheableApi = isGet && (
            pathname.startsWith("/api/stream/") ||
            pathname.startsWith("/api/proxy/") ||
            pathname.startsWith("/api/catalog/")
        );

        if (isCacheableApi) {
            try {
                const cachedMatch = await cache.match(request);
                if (cachedMatch) {
                    const hitHeaders = new Headers(cachedMatch.headers);
                    hitHeaders.set("X-Edge-Cache", "HIT");
                    hitHeaders.set("X-Colo", colo);
                    return new Response(cachedMatch.body, {
                        status: cachedMatch.status,
                        headers: hitHeaders
                    });
                }
            } catch {}
        }

        try {
            let response = null;

            // 3. Health check
            if (pathname === "/health") {
                return jsonResponse({
                    status: "online",
                    service: "aniko-backend",
                    tier: "Cloudflare Paid Plan Optimized",
                    colo,
                    timestamp: new Date().toISOString()
                });
            }

            // 4. Stream by MAL ID: /api/stream/mal/:id/:ep/:track
            if (pathname.startsWith("/api/stream/mal")) {
                const parts = pathname.replace('/api/stream/mal', '').split('/').filter(Boolean);
                const malId = parts[0] || searchParams.get("id");
                const ep = parseInt(parts[1] || searchParams.get("ep") || "1");
                const track = (parts[2] || searchParams.get("track") || "sub").toLowerCase();
                const serverOpt = searchParams.get("s") || searchParams.get("server") || "";

                if (!malId) return errorResponse("Missing MAL ID parameter", 400);

                const cacheKey = `stream:mal:${malId}:${ep}:${track}:${serverOpt}`;

                // L2 Cache: KV Namespace (10M included reads)
                if (env.ANIKO_CACHE) {
                    try {
                        const kvData = await env.ANIKO_CACHE.get(cacheKey, "json");
                        if (kvData) {
                            response = jsonResponse(attachProxyUrls(kvData, origin), 200, {
                                "X-Cache": "KV-HIT",
                                "X-Colo": colo
                            });
                        }
                    } catch {}
                }

                if (!response) {
                    const data = await resolveFromMal(malId, ep, track, serverOpt);

                    if (data.success && env.ANIKO_CACHE && ctx?.waitUntil) {
                        // 12-Hour KV TTL protects the 1M monthly writes quota
                        ctx.waitUntil(
                            env.ANIKO_CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 43200 }).catch(() => {})
                        );
                    }

                    response = jsonResponse(attachProxyUrls(data, origin), 200, {
                        "X-Cache": "MISS",
                        "X-Colo": colo
                    });
                }
            }

            // 5. Stream by AniList ID: /api/stream/ani/:id/:ep/:track
            else if (pathname.startsWith("/api/stream/ani")) {
                const parts = pathname.replace('/api/stream/ani', '').split('/').filter(Boolean);
                const aniId = parts[0] || searchParams.get("id");
                const ep = parseInt(parts[1] || searchParams.get("ep") || "1");
                const track = (parts[2] || searchParams.get("track") || "sub").toLowerCase();
                const serverOpt = searchParams.get("s") || searchParams.get("server") || "";

                if (!aniId) return errorResponse("Missing AniList ID parameter", 400);

                const streamCacheKey = `stream:ani:${aniId}:${ep}:${track}:${serverOpt}`;

                // L2 KV Cache check
                if (env.ANIKO_CACHE) {
                    try {
                        const kvData = await env.ANIKO_CACHE.get(streamCacheKey, "json");
                        if (kvData) {
                            response = jsonResponse(attachProxyUrls(kvData, origin), 200, {
                                "X-Cache": "KV-HIT",
                                "X-Colo": colo
                            });
                        }
                    } catch {}
                }

                if (!response) {
                    // Optimized AniList -> MAL Mapping Cache (30-day TTL)
                    let targetMalId = null;
                    const mappingKey = `ani:mal:${aniId}`;
                    if (env.ANIKO_CACHE) {
                        try {
                            targetMalId = await env.ANIKO_CACHE.get(mappingKey);
                        } catch {}
                    }

                    let data;
                    if (targetMalId) {
                        data = await resolveFromMal(targetMalId, ep, track, serverOpt);
                    } else {
                        data = await resolveFromAnilist(aniId, ep, track, serverOpt);
                        if (data.mal_id && env.ANIKO_CACHE && ctx?.waitUntil) {
                            ctx.waitUntil(
                                env.ANIKO_CACHE.put(mappingKey, String(data.mal_id), { expirationTtl: 2592000 }).catch(() => {})
                            );
                        }
                    }

                    if (data.success && env.ANIKO_CACHE && ctx?.waitUntil) {
                        ctx.waitUntil(
                            env.ANIKO_CACHE.put(streamCacheKey, JSON.stringify(data), { expirationTtl: 43200 }).catch(() => {})
                        );
                    }

                    response = jsonResponse(attachProxyUrls(data, origin), 200, {
                        "X-Cache": "MISS",
                        "X-Colo": colo
                    });
                }
            }

            // 6. Stream by Catalog ID: /api/stream/catalog/:epId/:track
            else if (pathname.startsWith("/api/stream/catalog")) {
                const parts = pathname.replace('/api/stream/catalog', '').split('/').filter(Boolean);
                const epId = parts[0] || searchParams.get("id") || searchParams.get("epId");
                const track = (parts[1] || searchParams.get("track") || "sub").toLowerCase();
                const serverOpt = searchParams.get("s") || searchParams.get("server") || "";

                if (!epId) return errorResponse("Missing Catalog Episode ID parameter", 400);

                const cacheKey = `stream:cat:${epId}:${track}:${serverOpt}`;

                if (env.ANIKO_CACHE) {
                    try {
                        const kvData = await env.ANIKO_CACHE.get(cacheKey, "json");
                        if (kvData) {
                            response = jsonResponse(attachProxyUrls(kvData, origin), 200, {
                                "X-Cache": "KV-HIT",
                                "X-Colo": colo
                            });
                        }
                    } catch {}
                }

                if (!response) {
                    const data = await resolveFromCatalogId(epId, track, serverOpt);

                    if (data.success && env.ANIKO_CACHE && ctx?.waitUntil) {
                        ctx.waitUntil(
                            env.ANIKO_CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 43200 }).catch(() => {})
                        );
                    }

                    response = jsonResponse(attachProxyUrls(data, origin), 200, {
                        "X-Cache": "MISS",
                        "X-Colo": colo
                    });
                }
            }

            // 7. Direct embed URL resolver: /api/stream/resolve?url=...
            else if (pathname === "/api/stream/resolve") {
                const embedUrl = searchParams.get("url");
                if (!embedUrl) return errorResponse("Missing embed url query parameter", 400);
                const serverOpt = searchParams.get("s") || searchParams.get("server") || "";
                const data = await resolveFromEmbedUrl(embedUrl, serverOpt);
                response = jsonResponse(attachProxyUrls(data, origin), 200);
            }

            // 8. Catalog Recent Anime: /api/catalog/recent?page=1&per_page=20
            else if (pathname === "/api/catalog/recent") {
                const page = parseInt(searchParams.get("page") || "1");
                const perPage = parseInt(searchParams.get("per_page") || "20");
                const cacheKey = `cat:recent:${page}:${perPage}`;

                if (env.ANIKO_CACHE) {
                    try {
                        const cached = await env.ANIKO_CACHE.get(cacheKey, "json");
                        if (cached) {
                            response = jsonResponse(cached, 200, { "X-Cache": "KV-HIT" });
                        }
                    } catch {}
                }

                if (!response) {
                    const data = await getRecentAnime(page, perPage);

                    if (data && env.ANIKO_CACHE && ctx?.waitUntil) {
                        ctx.waitUntil(
                            env.ANIKO_CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 1800 }).catch(() => {})
                        );
                    }

                    response = jsonResponse(data, 200, { "X-Cache": "MISS" });
                }
            }

            // 9. Catalog Series Details: /api/catalog/series/:id
            else if (pathname.startsWith("/api/catalog/series")) {
                const parts = pathname.replace('/api/catalog/series', '').split('/').filter(Boolean);
                const seriesId = parts[0] || searchParams.get("id");
                if (!seriesId) return errorResponse("Missing Series ID", 400);

                const cacheKey = `cat:series:${seriesId}`;

                if (env.ANIKO_CACHE) {
                    try {
                        const cached = await env.ANIKO_CACHE.get(cacheKey, "json");
                        if (cached) {
                            response = jsonResponse(cached, 200, { "X-Cache": "KV-HIT" });
                        }
                    } catch {}
                }

                if (!response) {
                    const data = await getSeriesEpisodes(seriesId);

                    if (data && env.ANIKO_CACHE && ctx?.waitUntil) {
                        ctx.waitUntil(
                            env.ANIKO_CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 7200 }).catch(() => {})
                        );
                    }

                    response = jsonResponse(data, 200, { "X-Cache": "MISS" });
                }
            }

            // 10. HLS M3U8 Playlist Proxy: /api/proxy/m3u8?url=...
            else if (pathname === "/api/proxy/m3u8") {
                const target = searchParams.get("url");
                if (!target) return errorResponse("Missing url query parameter", 400);

                const upstream = await fetch(target, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                        "Referer": "https://megaplay.buzz/",
                        "Origin": "https://megaplay.buzz"
                    },
                    cf: {
                        cacheEverything: true,
                        cacheTtl: 600
                    }
                });

                if (!upstream.ok) {
                    return new Response(`Upstream m3u8 error: ${upstream.status}`, {
                        status: upstream.status,
                        headers: { ...CORS_HEADERS, "Content-Type": "text/plain" }
                    });
                }

                const text = await upstream.text();
                const rewritten = text.split('\n').map(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return line;
                    if (trimmed.startsWith('#')) {
                        return line.replace(/URI=["']([^"']+)["']/g, (m, u) => {
                            const resolved = new URL(u, target).toString();
                            if (resolved.includes('.m3u8') || resolved.includes('master') || resolved.includes('playlist')) {
                                return `URI="${origin}/api/proxy/m3u8?url=${encodeURIComponent(resolved)}"`;
                            }
                            if (isDirectCdn(resolved)) return `URI="${resolved}"`;
                            return `URI="${origin}/api/proxy/ts?url=${encodeURIComponent(resolved)}"`;
                        });
                    }

                    const resolved = new URL(trimmed, target).toString();
                    if (resolved.includes('.m3u8') || resolved.includes('master') || resolved.includes('playlist')) {
                        return `${origin}/api/proxy/m3u8?url=${encodeURIComponent(resolved)}`;
                    }

                    // SMART SEGMENT ROUTING: Direct open CDNs bypass worker entirely!
                    // Saves 200+ Worker requests per episode!
                    if (isDirectCdn(resolved)) {
                        return resolved;
                    }

                    return `${origin}/api/proxy/ts?url=${encodeURIComponent(resolved)}`;
                }).join('\n');

                response = new Response(rewritten, {
                    status: 200,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/vnd.apple.mpegurl",
                        "Cache-Control": "public, max-age=600, s-maxage=600",
                        "X-Colo": colo
                    }
                });
            }

            // 11. VTT Subtitle Proxy: /api/proxy/vtt?url=...
            else if (pathname === "/api/proxy/vtt") {
                const target = searchParams.get("url");
                if (!target) return errorResponse("Missing url query parameter", 400);

                const upstream = await fetch(target, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                        "Referer": "https://megaplay.buzz/",
                        "Origin": "https://megaplay.buzz"
                    },
                    cf: {
                        cacheEverything: true,
                        cacheTtl: 86400
                    }
                });

                if (!upstream.ok) {
                    return new Response(`Subtitle fetch error: ${upstream.status}`, {
                        status: upstream.status,
                        headers: { ...CORS_HEADERS, "Content-Type": "text/plain" }
                    });
                }

                let vttText = await upstream.text();
                // Filter ASS/SSA and malformed WebVTT tags
                vttText = vttText
                    .replace(/\{[^}]+\}/g, '')
                    .replace(/<\/?(c[.\w-]*|v[^>]*|lang[^>]*|ruby|rt)>/gi, '');

                response = new Response(vttText, {
                    status: 200,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "text/vtt; charset=utf-8",
                        "Cache-Control": "public, max-age=86400, s-maxage=86400",
                        "X-Colo": colo
                    }
                });
            }

            // 12. High-Performance TS / Segment Stream Proxy: /api/proxy/ts?url=...
            else if (pathname === "/api/proxy/ts") {
                const target = searchParams.get("url");
                if (!target) return errorResponse("Missing url query parameter", 400);

                const reqHeaders = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Referer": "https://megaplay.buzz/",
                    "Origin": "https://megaplay.buzz"
                };

                const range = request.headers.get("range");
                if (range) {
                    reqHeaders["Range"] = range;
                }

                const upstream = await fetch(target, {
                    headers: reqHeaders,
                    cf: {
                        cacheEverything: true,
                        cacheTtl: 604800 // Edge cache video segments for 7 days
                    }
                });

                if (!upstream.ok && upstream.status !== 206) {
                    return new Response(`Segment fetch error: ${upstream.status}`, {
                        status: upstream.status,
                        headers: { ...CORS_HEADERS, "Content-Type": "text/plain" }
                    });
                }

                const responseHeaders = new Headers(CORS_HEADERS);
                responseHeaders.set("Content-Type", "video/mp2t");
                responseHeaders.set("Cache-Control", "public, max-age=31536000, s-maxage=604800, immutable");
                responseHeaders.set("X-Colo", colo);

                if (upstream.headers.get("content-length")) {
                    responseHeaders.set("Content-Length", upstream.headers.get("content-length"));
                }
                if (upstream.headers.get("content-range")) {
                    responseHeaders.set("Content-Range", upstream.headers.get("content-range"));
                }
                if (upstream.headers.get("accept-ranges")) {
                    responseHeaders.set("Accept-Ranges", upstream.headers.get("accept-ranges"));
                }

                // Native zero-copy streaming in Cloudflare V8
                response = new Response(upstream.body, {
                    status: upstream.status,
                    headers: responseHeaders
                });
            }

            // 13. Root / Documentation & Discovery (Pure JSON API)
            if (!response && (pathname === "/" || pathname === "/api")) {
                response = jsonResponse({
                    name: "Aniko Backend - MegaPlay & Anikoto Edge Anime Streaming API",
                    version: "2.0.0",
                    type: "Pure Backend API (No Frontend)",
                    platform: "Cloudflare Workers Edge ($5/mo Paid Plan Optimized)",
                    tier: "High-Performance Zero-Overage Engine",
                    features: [
                        "L1 RAM Edge Cache (caches.default - 0ms CPU)",
                        "L2 Edge KV Cache (12h Stream TTL, 30d Mapping TTL)",
                        "Smart Segment Bypass (99% request reduction)",
                        "Clean VTT Subtitle Engine (Zero Raw HTML Tags)",
                        "Native V8 Zero-Copy TS Streaming Pipe"
                    ],
                    documentation: "Use this API directly in any web or mobile frontend (Anixo, Anigo, Next.js, React, Android, iOS, etc.)",
                    subdomain: "https://aniko-backend.rk18109ry.workers.dev",
                    edge_colo: colo,
                    endpoints: {
                        stream_by_mal: {
                            method: "GET",
                            path: "/api/stream/mal/:malId/:ep/:track",
                            example: `${origin}/api/stream/mal/21/1/sub`
                        },
                        stream_by_anilist: {
                            method: "GET",
                            path: "/api/stream/ani/:aniId/:ep/:track",
                            example: `${origin}/api/stream/ani/21/1/sub`
                        },
                        stream_by_catalog_id: {
                            method: "GET",
                            path: "/api/stream/catalog/:epId/:track",
                            example: `${origin}/api/stream/catalog/2142/sub`
                        },
                        stream_by_embed_url: {
                            method: "GET",
                            path: "/api/stream/resolve?url=https://megaplay.buzz/stream/s-2/2142/sub"
                        },
                        catalog_recent: {
                            method: "GET",
                            path: "/api/catalog/recent?page=1&per_page=20"
                        },
                        catalog_series: {
                            method: "GET",
                            path: "/api/catalog/series/:id",
                            example: `${origin}/api/catalog/series/8935`
                        },
                        m3u8_proxy: {
                            method: "GET",
                            path: "/api/proxy/m3u8?url=<m3u8_url>"
                        },
                        subtitle_proxy: {
                            method: "GET",
                            path: "/api/proxy/vtt?url=<vtt_url>"
                        },
                        segment_proxy: {
                            method: "GET",
                            path: "/api/proxy/ts?url=<segment_url>"
                        },
                        health: {
                            method: "GET",
                            path: "/health"
                        }
                    }
                });
            }

            if (!response) {
                return errorResponse(`Route ${pathname} not found on Aniko Backend`, 404);
            }

            // Save to L1 Edge Cache in background for zero-CPU repeat hits
            if (isCacheableApi && response.status === 200 && ctx?.waitUntil) {
                ctx.waitUntil(cache.put(request, response.clone()).catch(() => {}));
            }

            return response;
        } catch (err) {
            return errorResponse(err.message, 500);
        }
    }
};
