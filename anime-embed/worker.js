/**
 * PUBLIC ANIME EMBED PROVIDER - CLOUDFLARE WORKER
 * Unified Edge router serving the developer playground, cinema embed player,
 * AniList/MAL metadata, and the 3-engine multi-server stream coordinator.
 */

import { renderLandingHtml } from './src/landing/landingHtml.js';
import { renderEmbedHtml } from './src/player/embedHtml.js';
import { searchAnime, getAnimeByAniListId, getAnimeByMalId } from './src/metadata/anilist.js';
import { resolveStreamWithFailover, resolveSpecificServer } from './src/engines/resolver.js';
import { checkClusterHealth } from './src/engines/health.js';
import { maskStreamResult, decryptStreamToken, encryptStreamToken, SCRAPER_NOTICE_HEADER, SCRAPER_NOTICE_TEXT } from './src/engines/proxyCrypto.js';
import { isScraperRequest, getHoneypotStreamResponse, getHoneypotVttContent } from './src/engines/honeypot.js';

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Range, Authorization, *",
    "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length, X-Cluster-Status, *",
    "Access-Control-Max-Age": "86400"
};

export default {
    async fetch(request, env, ctx) {
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: CORS_HEADERS });
        }

        const url = new URL(request.url);
        const baseUrl = url.origin;
        const pathname = url.pathname;

        try {
            // Favicon
            if (pathname === "/favicon.ico") {
                return new Response(null, { status: 204, headers: CORS_HEADERS });
            }

            // 1. Landing Page & Developer Playground (Root /)
            if (pathname === "/") {
                return new Response(renderLandingHtml(baseUrl), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "text/html; charset=utf-8",
                        "Cache-Control": "no-cache, no-store, must-revalidate"
                    }
                });
            }

            // 2. Multi-Server Cluster Health & Telemetry
            if (pathname === "/health" || pathname === "/api/health") {
                const forceFresh = url.searchParams.get("fresh") === "1" || url.searchParams.get("force") === "true";
                const healthReport = await checkClusterHealth(env, forceFresh);
                const statusCode = healthReport.status === "offline" ? 503 : (healthReport.status === "degraded" ? 207 : 200);
                return new Response(JSON.stringify(healthReport, null, 2), {
                    status: statusCode,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                        "Cache-Control": forceFresh ? "no-cache, no-store" : "public, max-age=15",
                        "X-Cluster-Status": healthReport.status
                    }
                });
            }

            // 3. AniList Search Endpoint
            if (pathname === "/api/search") {
                const q = url.searchParams.get("q") || url.searchParams.get("query");
                if (!q) {
                    return new Response(JSON.stringify([]), {
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                    });
                }
                const page = parseInt(url.searchParams.get("page"), 10) || 1;
                const results = await searchAnime(q, page, 10);
                return new Response(JSON.stringify(results, null, 2), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=3600"
                    }
                });
            }

            // 4. Anime Metadata by ID
            if (pathname.startsWith("/api/anime/")) {
                const id = pathname.replace("/api/anime/", "").split("/")[0];
                const type = url.searchParams.get("type") || "ani";
                const meta = type === "mal" ? await getAnimeByMalId(id) : await getAnimeByAniListId(id);
                if (!meta) {
                    return new Response(JSON.stringify({ error: "Anime not found" }), {
                        status: 404,
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                    });
                }
                return new Response(JSON.stringify(meta, null, 2), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=86400"
                    }
                });
            }

            // 5. Embed Route: /embed/ani/:id/:ep
            if (pathname.startsWith("/embed/ani/")) {
                const parts = pathname.replace("/embed/ani/", "").split("/").filter(Boolean);
                const anilistId = parseInt(parts[0], 10);
                const ep = parseInt(parts[1] || "1", 10) || 1;
                const track = (url.searchParams.get("track") || "sub").toLowerCase();
                const server = parseInt(url.searchParams.get("server") || "1", 10) || 1;
                const autoPlay = url.searchParams.get("autoPlay") !== "0" ? 1 : 0;
                const autoNext = url.searchParams.get("autoNext") !== "0" ? 1 : 0;
                const autoSkip = url.searchParams.get("autoSkip") !== "0" ? 1 : 0;

                const meta = await getAnimeByAniListId(anilistId);

                const html = renderEmbedHtml({
                    id: String(anilistId),
                    idType: "ani",
                    anilistId,
                    malId: meta?.idMal || null,
                    title: meta?.title || `Anime #${anilistId}`,
                    poster: meta?.poster || "",
                    episode: ep,
                    totalEpisodes: meta?.episodes || 0,
                    track,
                    server,
                    autoPlay,
                    autoNext,
                    autoSkip
                });

                return new Response(html, {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "text/html; charset=utf-8",
                        "Cache-Control": "no-cache, no-store, must-revalidate"
                    }
                });
            }

            // 6. Embed Route: /embed/mal/:id/:ep
            if (pathname.startsWith("/embed/mal/")) {
                const parts = pathname.replace("/embed/mal/", "").split("/").filter(Boolean);
                const malId = parseInt(parts[0], 10);
                const ep = parseInt(parts[1] || "1", 10) || 1;
                const track = (url.searchParams.get("track") || "sub").toLowerCase();
                const server = parseInt(url.searchParams.get("server") || "1", 10) || 1;
                const autoPlay = url.searchParams.get("autoPlay") !== "0" ? 1 : 0;
                const autoNext = url.searchParams.get("autoNext") !== "0" ? 1 : 0;
                const autoSkip = url.searchParams.get("autoSkip") !== "0" ? 1 : 0;

                const meta = await getAnimeByMalId(malId);

                const html = renderEmbedHtml({
                    id: String(malId),
                    idType: "mal",
                    anilistId: meta?.id || null,
                    malId,
                    title: meta?.title || `Anime MAL #${malId}`,
                    poster: meta?.poster || "",
                    episode: ep,
                    totalEpisodes: meta?.episodes || 0,
                    track,
                    server,
                    autoPlay,
                    autoNext,
                    autoSkip
                });

                return new Response(html, {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "text/html; charset=utf-8",
                        "Cache-Control": "no-cache, no-store, must-revalidate"
                    }
                });
            }

            // 7. General Embed Route: /embed?anilist=... or /embed?mal=... or /embed?id=...
            if (pathname === "/embed") {
                const anilistParam = url.searchParams.get("anilist") || url.searchParams.get("aniId");
                const malParam = url.searchParams.get("mal") || url.searchParams.get("malId");
                const idParam = url.searchParams.get("id");
                const typeParam = (url.searchParams.get("type") || (malParam ? "mal" : "ani")).toLowerCase();

                const ep = parseInt(url.searchParams.get("ep") || url.searchParams.get("episode") || "1", 10) || 1;
                const track = (url.searchParams.get("track") || "sub").toLowerCase();
                const server = parseInt(url.searchParams.get("server") || "1", 10) || 1;
                const autoPlay = url.searchParams.get("autoPlay") !== "0" ? 1 : 0;
                const autoNext = url.searchParams.get("autoNext") !== "0" ? 1 : 0;
                const autoSkip = url.searchParams.get("autoSkip") !== "0" ? 1 : 0;

                let resolvedAniId = anilistParam ? parseInt(anilistParam, 10) : (typeParam === "ani" && idParam ? parseInt(idParam, 10) : null);
                let resolvedMalId = malParam ? parseInt(malParam, 10) : (typeParam === "mal" && idParam ? parseInt(idParam, 10) : null);

                let meta = null;
                if (resolvedAniId) {
                    meta = await getAnimeByAniListId(resolvedAniId);
                    if (meta?.idMal && !resolvedMalId) resolvedMalId = meta.idMal;
                } else if (resolvedMalId) {
                    meta = await getAnimeByMalId(resolvedMalId);
                    if (meta?.id && !resolvedAniId) resolvedAniId = meta.id;
                }

                const effectiveId = resolvedAniId || resolvedMalId || idParam || "21";

                const html = renderEmbedHtml({
                    id: String(effectiveId),
                    idType: resolvedAniId ? "ani" : "mal",
                    anilistId: resolvedAniId,
                    malId: resolvedMalId,
                    title: meta?.title || `Anime #${effectiveId}`,
                    poster: meta?.poster || "",
                    episode: ep,
                    totalEpisodes: meta?.episodes || 0,
                    track,
                    server,
                    autoPlay,
                    autoNext,
                    autoSkip
                });

                return new Response(html, {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "text/html; charset=utf-8",
                        "Cache-Control": "no-cache, no-store, must-revalidate"
                    }
                });
            }

            // 8. Stream Resolver API (Called by embed player with automatic server failover)
            if (pathname === "/api/stream/resolve") {
                // Honeypot & Decoy Stream Poisoning for automated scrapers
                if (isScraperRequest(request)) {
                    const honeypotData = getHoneypotStreamResponse(baseUrl);
                    return new Response(JSON.stringify(honeypotData, null, 2), {
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "application/json",
                            "Cache-Control": "no-cache, no-store",
                            "X-Honeypot-Engaged": "1",
                            "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER
                        }
                    });
                }

                const anilistId = url.searchParams.get("anilistId");
                const malId = url.searchParams.get("malId");
                const title = url.searchParams.get("title");
                const episode = parseInt(url.searchParams.get("episode") || "1", 10) || 1;
                const track = (url.searchParams.get("track") || "sub").toLowerCase();
                const preferredServer = parseInt(url.searchParams.get("server") || "1", 10) || 1;

                const result = await resolveStreamWithFailover({
                    anilistId,
                    malId,
                    title,
                    episode,
                    track,
                    preferredServer
                }, env);

                const maskedResult = maskStreamResult(result, baseUrl);

                return new Response(JSON.stringify(maskedResult, null, 2), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=900",
                        "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER
                    }
                });
            }

            // 9. Specific Server Stream Resolver
            if (pathname.startsWith("/api/stream/server/")) {
                // Honeypot & Decoy Stream Poisoning for automated scrapers
                if (isScraperRequest(request)) {
                    const honeypotData = getHoneypotStreamResponse(baseUrl);
                    return new Response(JSON.stringify(honeypotData, null, 2), {
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "application/json",
                            "Cache-Control": "no-cache, no-store",
                            "X-Honeypot-Engaged": "1",
                            "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER
                        }
                    });
                }

                const serverId = parseInt(pathname.replace("/api/stream/server/", "").split("/")[0], 10) || 1;
                const anilistId = url.searchParams.get("anilistId");
                const malId = url.searchParams.get("malId");
                const title = url.searchParams.get("title");
                const episode = parseInt(url.searchParams.get("episode") || "1", 10) || 1;
                const track = (url.searchParams.get("track") || "sub").toLowerCase();

                const result = await resolveSpecificServer({
                    serverId,
                    anilistId,
                    malId,
                    title,
                    episode,
                    track
                }, env);

                const maskedResult = maskStreamResult(result, baseUrl);

                return new Response(JSON.stringify(maskedResult, null, 2), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=900",
                        "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER
                    }
                });
            }

            // 10. Master & Variant M3U8 Stream Proxy (Completely conceals backend worker & upstream CDNs)
            if (pathname === "/api/stream/m3u8" || pathname === "/api/proxy/m3u8") {
                const isHoneypotParam = url.searchParams.get("h") === "1";
                const isBot = isScraperRequest(request);
                const isHoneypot = isHoneypotParam || isBot;

                const token = url.searchParams.get("t") || url.searchParams.get("token");
                if (!token) {
                    return new Response("Missing stream token", { status: 400, headers: CORS_HEADERS });
                }
                let targetUrl = decryptStreamToken(token);
                if (!targetUrl || !targetUrl.startsWith("http")) {
                    return new Response("Invalid stream token", { status: 403, headers: CORS_HEADERS });
                }

                // If scraper requested directly with a stolen token, poison the stream with decoy HLS
                if (isBot && !isHoneypotParam) {
                    targetUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
                }

                let fetcher = fetch;
                if (targetUrl.includes("aniko-backend") && env?.MEGAPLAY_SERVICE?.fetch) {
                    fetcher = (u, init) => env.MEGAPLAY_SERVICE.fetch(u, init);
                } else if (targetUrl.includes("anineko-api") && env?.ANINEKO_SERVICE?.fetch) {
                    fetcher = (u, init) => env.ANINEKO_SERVICE.fetch(u, init);
                } else if (targetUrl.includes("zoko-stream") && env?.ZOKO_SERVICE?.fetch) {
                    fetcher = (u, init) => env.ZOKO_SERVICE.fetch(u, init);
                }

                const forwardHeaders = {
                    "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/124.0.0.0",
                    "Accept": request.headers.get("Accept") || "*/*"
                };
                if (request.headers.get("Range")) {
                    forwardHeaders["Range"] = request.headers.get("Range");
                }

                const upstreamRes = await fetcher(targetUrl, { headers: forwardHeaders });
                if (!upstreamRes.ok && upstreamRes.status !== 206) {
                    return new Response(upstreamRes.body, {
                        status: upstreamRes.status,
                        headers: CORS_HEADERS
                    });
                }

                const contentType = upstreamRes.headers.get("content-type") || "";
                const isPlaylist = contentType.includes("mpegurl") || contentType.includes("application/x-mpegURL") || contentType.includes("application/vnd.apple.mpegurl") || targetUrl.includes(".m3u8") || targetUrl.includes("/m3u8");

                if (isPlaylist) {
                    const text = await upstreamRes.text();
                    let noticeInjected = false;
                    const rewritten = text.split('\n').map(line => {
                        const trimmed = line.trim();
                        if (!trimmed) return line;

                        if (trimmed.startsWith('#EXTM3U') && !noticeInjected) {
                            noticeInjected = true;
                            return '#EXTM3U\n# NOTICE: ' + SCRAPER_NOTICE_TEXT;
                        }

                        if (trimmed.startsWith('#')) {
                            return line.replace(/URI="([^"]+)"/g, (match, uri) => {
                                const fullUri = new URL(uri, targetUrl).toString();
                                return `URI="${baseUrl}/api/stream/m3u8?t=${encryptStreamToken(fullUri)}${isHoneypot ? '&h=1' : ''}"`;
                            });
                        }

                        const fullUrl = new URL(trimmed, targetUrl).toString();
                        if (fullUrl.includes('.m3u8') || fullUrl.includes('/m3u8') || fullUrl.includes('aniko-backend') || fullUrl.includes('anineko') || fullUrl.includes('zoko') || fullUrl.includes('norami') || fullUrl.includes('megap') || fullUrl.includes('mux.dev')) {
                            return `${baseUrl}/api/stream/m3u8?t=${encryptStreamToken(fullUrl)}${isHoneypot ? '&h=1' : ''}`;
                        }
                        return fullUrl;
                    }).join('\n');

                    return new Response(rewritten, {
                        status: 200,
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "application/vnd.apple.mpegurl",
                            "Cache-Control": isHoneypot ? "no-cache, no-store" : "public, max-age=60",
                            "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER,
                            ...(isHoneypot ? { "X-Honeypot-Engaged": "1" } : {})
                        }
                    });
                }

                const responseHeaders = {
                    ...CORS_HEADERS,
                    "Content-Type": contentType || "video/MP2T",
                    "Cache-Control": isHoneypot ? "no-cache, no-store" : "public, max-age=86400",
                    "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER,
                    ...(isHoneypot ? { "X-Honeypot-Engaged": "1" } : {})
                };
                if (upstreamRes.headers.get("Content-Range")) {
                    responseHeaders["Content-Range"] = upstreamRes.headers.get("Content-Range");
                }
                if (upstreamRes.headers.get("Content-Length")) {
                    responseHeaders["Content-Length"] = upstreamRes.headers.get("Content-Length");
                }
                return new Response(upstreamRes.body, {
                    status: upstreamRes.status,
                    headers: responseHeaders
                });
            }

            // 11. Subtitle WebVTT Proxy (Completely conceals upstream subtitle CDN)
            if (pathname === "/api/stream/vtt" || pathname === "/api/proxy/vtt") {
                if (url.searchParams.get("h") === "1" || isScraperRequest(request)) {
                    return new Response(getHoneypotVttContent(), {
                        status: 200,
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "text/vtt; charset=utf-8",
                            "Cache-Control": "public, max-age=3600",
                            "X-Honeypot-Engaged": "1",
                            "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER
                        }
                    });
                }

                const token = url.searchParams.get("t") || url.searchParams.get("token");
                if (!token) {
                    return new Response("Missing vtt token", { status: 400, headers: CORS_HEADERS });
                }
                const targetUrl = decryptStreamToken(token);
                if (!targetUrl || !targetUrl.startsWith("http")) {
                    return new Response("Invalid vtt token", { status: 403, headers: CORS_HEADERS });
                }

                let fetcher = fetch;
                if (targetUrl.includes("aniko-backend") && env?.MEGAPLAY_SERVICE?.fetch) {
                    fetcher = (u, init) => env.MEGAPLAY_SERVICE.fetch(u, init);
                } else if (targetUrl.includes("anineko-api") && env?.ANINEKO_SERVICE?.fetch) {
                    fetcher = (u, init) => env.ANINEKO_SERVICE.fetch(u, init);
                } else if (targetUrl.includes("zoko-stream") && env?.ZOKO_SERVICE?.fetch) {
                    fetcher = (u, init) => env.ZOKO_SERVICE.fetch(u, init);
                }

                const upstreamRes = await fetcher(targetUrl, {
                    headers: {
                        "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                    }
                });

                const vttText = await upstreamRes.text();
                const noticeVtt = vttText.replace(/^WEBVTT/i, 'WEBVTT\nNOTE Notice: ' + SCRAPER_NOTICE_TEXT + '\n');

                return new Response(noticeVtt, {
                    status: upstreamRes.status,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "text/vtt; charset=utf-8",
                        "Cache-Control": "public, max-age=86400",
                        "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER
                    }
                });
            }

            // 404 Route Not Found
            return new Response(JSON.stringify({ error: "Route not found", path: pathname }), {
                status: 404,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
            });

        } catch (err) {
            console.error("Worker error:", err);
            return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
                status: 500,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
            });
        }
    }
};
