/**
 * STANDALONE NODE.JS SERVER FOR ANIME EMBED PROVIDER
 * Runs natively on port 3005 (or PORT env)
 */

import http from 'http';
import worker from './worker.js';

const PORT = parseInt(process.env.PORT || '3005', 10);

const server = http.createServer(async (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || `localhost:${PORT}`;
    const url = `${protocol}://${host}${req.url}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
            if (Array.isArray(value)) value.forEach(v => headers.append(key, v));
            else headers.set(key, value);
        }
    }

    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        body = Buffer.concat(chunks);
    }

    const fetchReq = new Request(url, {
        method: req.method,
        headers,
        body
    });

    try {
        const fetchRes = await worker.fetch(fetchReq, {}, {});

        res.statusCode = fetchRes.status;
        for (const [key, value] of fetchRes.headers) {
            res.setHeader(key, value);
        }

        if (fetchRes.body) {
            const reader = fetchRes.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
        }
        res.end();
    } catch (err) {
        console.error('Server error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message }));
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n⚡ AniEmbed Public Provider running at:`);
    console.log(`   - Playground / Docs: http://localhost:${PORT}/`);
    console.log(`   - Sample AniList Embed: http://localhost:${PORT}/embed/ani/21/1`);
    console.log(`   - Sample MAL Embed:     http://localhost:${PORT}/embed/mal/20/1\n`);
});
