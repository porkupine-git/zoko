/**
 * STANDALONE NODE.JS SERVER FOR VIDCLOUD EMBED PROVIDER
 * Runs natively on port 3006 (or PORT env)
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import worker from './worker.js';

const PORT = parseInt(process.env.PORT || '3006', 10);

// Emulated persistent KV store for local node server
const CACHE_FILE = path.resolve('./scratch/admin_persistent_state.json');

const localKv = {
    async get(key, type) {
        try {
            if (fs.existsSync(CACHE_FILE)) {
                const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
                return type === 'json' ? JSON.parse(raw) : raw;
            }
        } catch (e) {
            console.error('Local KV read error:', e);
        }
        return null;
    },
    async put(key, value) {
        try {
            const dir = path.dirname(CACHE_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(CACHE_FILE, typeof value === 'string' ? value : JSON.stringify(value, null, 2), 'utf-8');
        } catch (e) {
            console.error('Local KV write error:', e);
        }
    }
};

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
        const env = {
            VIDCLOUD_ADMIN_STORE: localKv,
            PLAYER_ORIGIN: process.env.PLAYER_ORIGIN || "https://player.anixo.online"
        };
        const ctx = {
            waitUntil(promise) {
                Promise.resolve(promise).catch(err => console.error('ctx.waitUntil error:', err));
            }
        };
        const fetchRes = await worker.fetch(fetchReq, env, ctx);

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
    console.log(`\n⚡ VidCloud Embed Provider running at:`);
    console.log(`   - Playground / Docs: http://localhost:${PORT}/`);
    console.log(`   - Sample AniList Embed: http://localhost:${PORT}/embed/ani/21/1`);
    console.log(`   - Sample MAL Embed:     http://localhost:${PORT}/embed/mal/20/1`);
    console.log(`   - Core Player Origin:   https://player.anixo.online\n`);
});
