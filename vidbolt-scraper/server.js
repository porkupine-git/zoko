/**
 * VidBolt Scraper Microservice API Server
 * Built with native Node.js HTTP (zero external dependencies required)
 */

const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const { getStreams } = require('./index.js');

const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
    // Enable CORS for all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    try {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const pathname = parsedUrl.pathname;
        const searchParams = parsedUrl.searchParams;

        // Serve Frontend at Root (/)
        if (pathname === '/' || pathname === '/index.html') {
            const htmlPath = path.join(__dirname, 'public', 'index.html');
            if (fs.existsSync(htmlPath)) {
                const html = fs.readFileSync(htmlPath, 'utf8');
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(html);
                return;
            }
        }

        // Health check endpoint
        if (pathname === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'online',
                service: 'vidbolt-scraper-api',
                uptime: process.uptime()
            }, null, 2));
            return;
        }

        // Stream endpoint: /api/stream or /stream
        if (pathname === '/api/stream' || pathname === '/stream') {
            const tmdbId = searchParams.get('id') || searchParams.get('tmdbId');
            if (!tmdbId) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing required query param: "id" or "tmdbId"' }));
                return;
            }

            const type = (searchParams.get('type') || 'movie').toLowerCase();
            const season = searchParams.get('season') || 1;
            const episode = searchParams.get('episode') || 1;
            const title = searchParams.get('title') || '';
            const year = searchParams.get('year') || '';

            const result = await getStreams({
                type,
                tmdbId,
                season,
                episode,
                title,
                year
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result, null, 2));
            return;
        }

        // 404 Route Not Found
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found. Use /api/stream?id={tmdbId}' }));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 VidBolt Scraper API running on http://localhost:${PORT}`);
    console.log(`👉 Example Movie: http://localhost:${PORT}/api/stream?id=550&type=movie&title=Fight+Club`);
    console.log(`👉 Example TV:    http://localhost:${PORT}/api/stream?id=1399&type=tv&season=1&episode=1&title=Game+of+Thrones`);
});
