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
        // or /api/stream/mal?id=21&ep=1&track=sub
        if (pathname.startsWith("/api/stream/mal")) {
            const parts = pathname.replace('/api/stream/mal', '').split('/').filter(Boolean);
            const malId = parts[0] || query.id;
            const ep = parts[1] || query.ep || 1;
            const track = parts[2] || query.track || "sub";
            const serverOpt = query.s || query.server || "";

            if (!malId) return sendError(res, 400, "Missing MAL ID parameter");

            const data = await megaplay.resolveFromMal(malId, ep, track, serverOpt);
            return sendJson(res, 200, data);
        }

        // 3. Stream by AniList ID: /api/stream/ani/:id/:ep/:track
        // or /api/stream/ani?id=21&ep=1&track=sub
        if (pathname.startsWith("/api/stream/ani")) {
            const parts = pathname.replace('/api/stream/ani', '').split('/').filter(Boolean);
            const aniId = parts[0] || query.id;
            const ep = parts[1] || query.ep || 1;
            const track = parts[2] || query.track || "sub";
            const serverOpt = query.s || query.server || "";

            if (!aniId) return sendError(res, 400, "Missing AniList ID parameter");

            const data = await megaplay.resolveFromAnilist(aniId, ep, track, serverOpt);
            return sendJson(res, 200, data);
        }

        // 4. Stream by Catalog ID: /api/stream/catalog/:epId/:track
        // or /api/stream/catalog?id=2142&track=sub
        if (pathname.startsWith("/api/stream/catalog")) {
            const parts = pathname.replace('/api/stream/catalog', '').split('/').filter(Boolean);
            const epId = parts[0] || query.id || query.epId;
            const track = parts[1] || query.track || "sub";
            const serverOpt = query.s || query.server || "";

            if (!epId) return sendError(res, 400, "Missing Catalog Episode ID parameter");

            const data = await megaplay.resolveFromCatalogId(epId, track, serverOpt);
            return sendJson(res, 200, data);
        }

        // 5. Direct embed URL resolver: /api/stream/resolve?url=...
        if (pathname === "/api/stream/resolve") {
            const embedUrl = query.url;
            if (!embedUrl) return sendError(res, 400, "Missing embed url query parameter");
            const serverOpt = query.s || query.server || "";
            const data = await megaplay.resolveFromEmbedUrl(embedUrl, serverOpt);
            return sendJson(res, 200, data);
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

        // 8. Serve Interactive Testbench UI on root (or JSON on /api)
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
