/**
 * PUBLIC ANIME EMBED PROVIDER - CLOUDFLARE WORKER
 * Unified Edge router serving the developer playground, cinema embed player,
 * AniList/MAL metadata, and the 3-engine multi-server stream coordinator.
 */

import { renderLandingHtml } from './src/landing/landingHtml.js';
import { renderEmbedHtml } from './src/player/embedHtml.js';
import { searchAnime, getAnimeByAniListId, getAnimeByMalId } from './src/metadata/anilist.js';
import { resolveStreamWithFailover, resolveSpecificServer } from './src/engines/resolver.js';

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Range, Authorization, *",
    "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length, *",
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

            // 2. Health & Engine Status
            if (pathname === "/health" || pathname === "/api/health") {
                return new Response(JSON.stringify({
                    status: "online",
                    service: "AniEmbed Public Provider",
                    version: "1.0.0",
                    engines: {
                        server1: "MegaPlay / Norami / Mikora CDN (Active)",
                        server2: "AniNeko / StreamHG / VidHide (Active)",
                        server3: "Zoko / Otaku XOR Engine (Active)"
                    },
                    colo: request.cf?.colo || "EDGE"
                }, null, 2), {
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
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

                return new Response(JSON.stringify(result, null, 2), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=900"
                    }
                });
            }

            // 9. Specific Server Stream Resolver
            if (pathname.startsWith("/api/stream/server/")) {
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

                return new Response(JSON.stringify(result, null, 2), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=900"
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
