import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import megaplay from './megaplay.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 4004;

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "*",
    "Content-Type": "application/json"
};

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, CORS_HEADERS);
    res.end(JSON.stringify(data, null, 2));
}

function sendError(res, statusCode, message) {
    sendJson(res, statusCode, { success: false, error: message });
}

function attachProxyUrls(data) {
    if (!data || !data.success) return data;
    if (data.stream_url) {
        data.proxy_stream_url = `/api/proxy/m3u8?url=${encodeURIComponent(data.stream_url)}`;
    }
    if (Array.isArray(data.sources)) {
        data.sources = data.sources.map(s => ({
            ...s,
            proxy_url: `/api/proxy/m3u8?url=${encodeURIComponent(s.url)}`
        }));
    }
    if (Array.isArray(data.subtitles)) {
        data.subtitles = data.subtitles.map(sub => ({
            ...sub,
            proxy_url: sub.url ? `/api/proxy/vtt?url=${encodeURIComponent(sub.url)}` : undefined
        }));
    }
    return data;
}

const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        res.writeHead(204, CORS_HEADERS);
        return res.end();
    }

    const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsed.pathname;
    const query = Object.fromEntries(parsed.searchParams.entries());

    try {
        // 1. Health check
        if (pathname === "/health") {
            return sendJson(res, 200, {
                status: "online",
                service: "megaplay-api",
                timestamp: new Date().toISOString()
            });
        }

        // 2. Stream by MAL ID: /api/stream/mal/:id/:ep/:track
        if (pathname.startsWith("/api/stream/mal")) {
            const parts = pathname.replace('/api/stream/mal', '').split('/').filter(Boolean);
            const malId = parts[0] || query.id;
            const ep = parts[1] || query.ep || 1;
            const track = parts[2] || query.track || "sub";
            const serverOpt = query.s || query.server || "";

            if (!malId) return sendError(res, 400, "Missing MAL ID parameter");

            const data = await megaplay.resolveFromMal(malId, ep, track, serverOpt);
            return sendJson(res, 200, attachProxyUrls(data));
        }

        // 3. Stream by AniList ID: /api/stream/ani/:id/:ep/:track
        if (pathname.startsWith("/api/stream/ani")) {
            const parts = pathname.replace('/api/stream/ani', '').split('/').filter(Boolean);
            const aniId = parts[0] || query.id;
            const ep = parts[1] || query.ep || 1;
            const track = parts[2] || query.track || "sub";
            const serverOpt = query.s || query.server || "";

            if (!aniId) return sendError(res, 400, "Missing AniList ID parameter");

            const data = await megaplay.resolveFromAnilist(aniId, ep, track, serverOpt);
            return sendJson(res, 200, attachProxyUrls(data));
        }

        // 4. Stream by Catalog ID: /api/stream/catalog/:epId/:track
        if (pathname.startsWith("/api/stream/catalog")) {
            const parts = pathname.replace('/api/stream/catalog', '').split('/').filter(Boolean);
            const epId = parts[0] || query.id || query.epId;
            const track = parts[1] || query.track || "sub";
            const serverOpt = query.s || query.server || "";

            if (!epId) return sendError(res, 400, "Missing Catalog Episode ID parameter");

            const data = await megaplay.resolveFromCatalogId(epId, track, serverOpt);
            return sendJson(res, 200, attachProxyUrls(data));
        }

        // 5. Direct embed URL resolver: /api/stream/resolve?url=...
        if (pathname === "/api/stream/resolve") {
            const embedUrl = query.url;
            if (!embedUrl) return sendError(res, 400, "Missing embed url query parameter");
            const serverOpt = query.s || query.server || "";
            const data = await megaplay.resolveFromEmbedUrl(embedUrl, serverOpt);
            return sendJson(res, 200, attachProxyUrls(data));
        }

        // 6. Catalog Recent Anime: /api/catalog/recent?page=1&per_page=20
        if (pathname === "/api/catalog/recent") {
            const page = parseInt(query.page) || 1;
            const perPage = parseInt(query.per_page) || 20;
            const data = await megaplay.getRecentAnime(page, perPage);
            return sendJson(res, 200, data);
        }

        // 7. Catalog Series Details: /api/catalog/series/:id
        if (pathname.startsWith("/api/catalog/series")) {
            const parts = pathname.replace('/api/catalog/series', '').split('/').filter(Boolean);
            const seriesId = parts[0] || query.id;
            if (!seriesId) return sendError(res, 400, "Missing Series ID");
            const data = await megaplay.getSeriesEpisodes(seriesId);
            return sendJson(res, 200, data);
        }

        // 8. HLS M3U8 Stream Proxy: /api/proxy/m3u8?url=...
        if (pathname === "/api/proxy/m3u8") {
            const target = query.url;
            if (!target) return sendError(res, 400, "Missing url query parameter");

            try {
                const upstream = await fetch(target, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                        "Referer": "https://megaplay.buzz/",
                        "Origin": "https://megaplay.buzz"
                    }
                });

                if (!upstream.ok) {
                    res.writeHead(upstream.status, { ...CORS_HEADERS, "Content-Type": "text/plain" });
                    return res.end(`Upstream m3u8 error: ${upstream.status} ${upstream.statusText}`);
                }

                const text = await upstream.text();
                const rewritten = text.split('\n').map(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return line;
                    if (trimmed.startsWith('#')) {
                        return line.replace(/URI=["']([^"']+)["']/g, (m, u) => {
                            const resolved = new URL(u, target).toString();
                            return `URI="/api/proxy/m3u8?url=${encodeURIComponent(resolved)}"`;
                        });
                    }
                    const resolved = new URL(trimmed, target).toString();
                    if (resolved.includes('.m3u8') || resolved.includes('master') || resolved.includes('playlist')) {
                        return `/api/proxy/m3u8?url=${encodeURIComponent(resolved)}`;
                    }
                    return resolved;
                }).join('\n');

                res.writeHead(200, {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                    "Content-Type": "application/vnd.apple.mpegurl",
                    "Cache-Control": "public, max-age=600"
                });
                return res.end(rewritten);
            } catch (err) {
                res.writeHead(502, { ...CORS_HEADERS, "Content-Type": "text/plain" });
                return res.end(`Proxy m3u8 error: ${err.message}`);
            }
        }

        // 9. VTT Subtitle Proxy: /api/proxy/vtt?url=...
        if (pathname === "/api/proxy/vtt") {
            const target = query.url;
            if (!target) return sendError(res, 400, "Missing url query parameter");

            try {
                const upstream = await fetch(target, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                        "Referer": "https://megaplay.buzz/",
                        "Origin": "https://megaplay.buzz"
                    }
                });

                if (!upstream.ok) {
                    res.writeHead(upstream.status, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/plain"
                    });
                    return res.end(`Subtitle fetch error: ${upstream.status}`);
                }

                const vttText = await upstream.text();
                res.writeHead(200, {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                    "Content-Type": "text/vtt; charset=utf-8",
                    "Cache-Control": "public, max-age=86400"
                });
                return res.end(vttText);
            } catch (err) {
                res.writeHead(502, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "text/plain"
                });
                return res.end(`Proxy vtt error: ${err.message}`);
            }
        }

        // 10. Serve Interactive Testbench UI on root (or JSON on /api)
        if (pathname === "/") {
            const indexPath = path.join(__dirname, 'public', 'index.html');
            if (fs.existsSync(indexPath)) {
                const html = fs.readFileSync(indexPath, 'utf8');
                res.writeHead(200, {
                    "Content-Type": "text/html; charset=utf-8",
                    "Access-Control-Allow-Origin": "*"
                });
                return res.end(html);
            }
        }

        if (pathname === "/api" || pathname === "/") {
            return sendJson(res, 200, {
                name: "MegaPlay & Anikoto Reverse-Engineered API Server",
                version: "1.0.0",
                description: "Extract direct HLS master streams, VTT subtitles, and catalog metadata from MegaPlay.buzz without iframe embeds.",
                endpoints: {
                    stream_by_mal: {
                        method: "GET",
                        path: "/api/stream/mal/:malId/:ep/:track",
                        example: "/api/stream/mal/21/1/sub"
                    },
                    stream_by_anilist: {
                        method: "GET",
                        path: "/api/stream/ani/:aniId/:ep/:track",
                        example: "/api/stream/ani/21/1/sub"
                    },
                    stream_by_catalog_id: {
                        method: "GET",
                        path: "/api/stream/catalog/:epId/:track",
                        example: "/api/stream/catalog/2142/sub"
                    },
                    stream_by_embed_url: {
                        method: "GET",
                        path: "/api/stream/resolve?url=https://megaplay.buzz/stream/s-2/2142/sub",
                        params: { s: "optional CDN server (tcdn, bcdn)" }
                    },
                    catalog_recent: {
                        method: "GET",
                        path: "/api/catalog/recent?page=1&per_page=20"
                    },
                    catalog_series: {
                        method: "GET",
                        path: "/api/catalog/series/:id",
                        example: "/api/catalog/series/8935"
                    },
                    health: {
                        method: "GET",
                        path: "/health"
                    }
                }
            });
        }

        return sendError(res, 404, `Route ${pathname} not found.`);
    } catch (err) {
        return sendError(res, 500, err.message);
    }
});

server.listen(PORT, () => {
    console.log(`🚀 MegaPlay Reverse-Engineered API Server running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   API Docs:     http://localhost:${PORT}/`);
});
