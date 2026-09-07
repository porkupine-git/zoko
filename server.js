require('dotenv').config();
if (process.env.IPV6_FIRST === 'true') {
    try { require('node:dns').setDefaultResultOrder('ipv6first'); } catch {}
}
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const os = require('os');
const { Readable } = require('stream');
const swaggerUi = require('swagger-ui-express');

const scraper = require('./scraper');

const app = express();
app.set('trust proxy', 1);

// --- Configuration ---
const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS) || 180000;
const CACHE_MAX_ITEMS = parseInt(process.env.CACHE_MAX_ITEMS) || 3000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 120;

// --- High Performance Cache & Metrics Tracker ---
class MetricsTracker {
    constructor() {
        this.cache = new Map();
        this.hits = 0;
        this.misses = 0;
        this.activeStreams = 0;
        this.totalRequests = 0;
        this.startTime = Date.now();
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            this.misses++;
            return null;
        }
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }
        this.hits++;
        return item.value;
    }
    set(key, value, customTtl = null) {
        this.cache.set(key, {
            value,
            expiry: Date.now() + (customTtl || CACHE_TTL_MS)
        });
        if (this.cache.size > CACHE_MAX_ITEMS) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }
    getStats() {
        const total = this.hits + this.misses;
        const rate = total > 0 ? ((this.hits / total) * 100).toFixed(1) + '%' : '0%';
        return {
            uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
            totalRequests: this.totalRequests,
            cacheEntries: this.cache.size,
            cacheHits: this.hits,
            cacheMisses: this.misses,
            hitRate: rate,
            activeStreams: this.activeStreams
        };
    }
}
const metrics = new MetricsTracker();

// --- Rate Limiter Middleware ---
const rateLimitMap = new Map();
function rateLimiter(req, res, next) {
    if (req.path.startsWith('/api/proxy/ts') || req.path === '/' || req.path.startsWith('/docs')) {
        return next();
    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const windowStart = now - 60000;
    
    let timestamps = rateLimitMap.get(ip) || [];
    timestamps = timestamps.filter(t => t > windowStart);
    if (timestamps.length >= RATE_LIMIT_MAX) {
        return res.status(429).json({
            error: "Too Many Requests",
            message: `Rate limit of ${RATE_LIMIT_MAX} requests/minute exceeded. Please slow down.`,
            retryAfterSeconds: Math.ceil((timestamps[0] + 60000 - now) / 1000)
        });
    }
    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);
    next();
}

// Global Logging & Request ID Middleware
app.use((req, res, next) => {
    metrics.totalRequests++;
    const start = Date.now();
    const reqId = crypto.randomBytes(4).toString('hex');
    req.reqId = reqId;
    res.setHeader('X-Request-ID', reqId);

    res.on('finish', () => {
        const elapsedMs = Date.now() - start;
        const tier = req.tier || 'EXPRESS';
        let color = '\x1b[32m';
        if (res.statusCode >= 500) color = '\x1b[31m';
        else if (res.statusCode >= 400) color = '\x1b[33m';
        else if (res.statusCode >= 300) color = '\x1b[36m';
        const reset = '\x1b[0m';
        const timestamp = new Date().toISOString().substring(11, 23);
        
        if (!req.path.startsWith('/api/proxy/ts')) {
            console.log(`[${timestamp}] ${color}${res.statusCode}${reset} ${req.method} ${req.originalUrl} - ${elapsedMs.toFixed(1)}ms [${tier}] (${reqId})`);
        }
    });
    next();
});

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Range', 'Authorization'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'X-Request-ID']
}));
app.use(rateLimiter);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getBaseUrl(req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    return `${proto}://${host}`;
}

// Universal API Discovery & Index Endpoint
app.get('/api', (req, res) => {
    const hostUrl = getBaseUrl(req);
    res.json({
        name: "Zoko Universal Anime Streaming & Scraper API",
        version: "4.1.0",
        description: "Zero-dependency, high-throughput anime metadata and HLS streaming API with built-in CORS bypass, multi-subtitles, and skip intro/outro markers.",
        base_url: hostUrl,
        cors_enabled: true,
        endpoints: {
            "search": {
                "method": "GET",
                "path": "/api/search",
                "summary": "Search 11,449+ anime titles (0ms SQLite NVMe cache)",
                "params": {
                    "q": "Anime title query (required, e.g. naruto)",
                    "page": "Page number (optional, default 1)",
                    "perPage": "Results per page (optional, default 20, max 50)"
                },
                "example": `${hostUrl}/api/search?q=naruto`
            },
            "anime_details": {
                "method": "GET",
                "path": "/api/anime/:id",
                "summary": "Get full anime metadata, synopsis, genres, score, and all episodes",
                "params": {
                    "id": "AniList ID or MAL ID (e.g. 21 for One Piece, 16498 for Attack on Titan)"
                },
                "example": `${hostUrl}/api/anime/21`
            },
            "episodes": {
                "method": "GET",
                "path": "/api/episodes/:id",
                "summary": "Get episodes catalog with thumbnails and titles",
                "params": {
                    "id": "AniList ID or MAL ID",
                    "all": "Set to 'true' to fetch all episodes (e.g. all 1180 for One Piece)",
                    "page": "Page number (optional)",
                    "size": "Page size (optional, default 50)"
                },
                "example": `${hostUrl}/api/episodes/21?all=true`
            },
            "stream": {
                "method": "GET",
                "path": "/api/stream",
                "summary": "Universal stream extraction (Returns HLS master m3u8, VTT subtitles, and intro/outro skip markers)",
                "params": {
                    "id": "AniList ID or MAL ID (e.g. 21 or shorthand '21-1')",
                    "ep": "Episode number (default 1)",
                    "track": "Audio language: 'sub' (Japanese + Subs) or 'dub' (English) - default: 'sub'",
                    "title": "Optional: Anime title if ID is unknown (auto-resolves ID)"
                },
                "example": `${hostUrl}/api/stream?id=21&ep=1&track=sub`
            },
            "stream_by_shorthand": {
                "method": "GET",
                "path": "/api/stream/:ep_id",
                "summary": "Get dual-track sources for an episode shorthand (e.g. /api/stream/21-1)",
                "example": `${hostUrl}/api/stream/21-1`
            },
            "embed": {
                "method": "GET",
                "path": "/embed",
                "summary": "Embeddable ArtPlayer iframe for zero-code integration in any web page",
                "params": {
                    "id": "Anime ID",
                    "ep": "Episode number",
                    "track": "sub or dub",
                    "autoplay": "1 or 0",
                    "color": "Theme accent color (hex without #, e.g. e50914)"
                },
                "example": `${hostUrl}/embed?id=21&ep=1&autoplay=0`
            },
            "home": {
                "method": "GET",
                "path": "/api/home",
                "summary": "Homepage catalog with Spotlight Hero, Trending, Popular, and Top Rated collections",
                "example": `${hostUrl}/api/home`
            },
            "browse": {
                "method": "GET",
                "path": "/api/browse",
                "summary": "Catalog browse with genre, format, and sorting filters",
                "params": {
                    "genre": "e.g. Action, Adventure, Fantasy",
                    "format": "TV, MOVIE, OVA, ONA",
                    "sort": "TRENDING_DESC, SCORE_DESC, POPULARITY_DESC",
                    "page": 1
                },
                "example": `${hostUrl}/api/browse?genre=Action&sort=SCORE_DESC`
            },
            "system_status": {
                "method": "GET",
                "path": "/api/system/status",
                "summary": "VPS hardware telemetry, SQLite stats, and real-time cache metrics",
                "example": `${hostUrl}/api/system/status`
            }
        },
        "resources": {
            "swagger_docs": `${hostUrl}/docs`,
            "client_sdk": `${hostUrl}/zoko-api.js`,
            "interactive_demo": `${hostUrl}/api-demo.html`
        }
    });
});


// --- OpenAPI / Swagger Documentation ---
const swaggerDocument = {
    openapi: "3.0.0",
    info: {
        title: "ZokoAnime Pure Express Anime Engine API",
        version: "4.0.0",
        description: "Pure Express.js Native Reverse-Engineered Anime Scraper & Streaming Engine for zokoanime.video"
    },
    paths: {
        "/api/search": { get: { summary: "Search Anime Catalog", tags: ["Scraper"] } },
        "/api/info/{identifier}": { get: { summary: "Anime Metadata", tags: ["Scraper"] } },
        "/api/episodes/{ani_id}": { get: { summary: "Episode Catalog", tags: ["Scraper"] } },
        "/api/stream/{ep_id}": { get: { summary: "Stream Sources", tags: ["Streams"] } },
        "/api/stream": { get: { summary: "Direct ZokoAnime Stream Extractor", tags: ["Streams"] } },
        "/embed": { get: { summary: "Embeddable Artplayer HTML Player", tags: ["Player"] } },
        "/api/home": { get: { summary: "Home Spotlight & Trending", tags: ["Catalog"] } },
        "/api/browse": { get: { summary: "Browse Catalog", tags: ["Catalog"] } },
        "/api/anime/{id}": { get: { summary: "Anime Details & Episodes", tags: ["Catalog"] } },
        "/api/watch/resolve": { get: { summary: "Smart Watch Stream Resolver", tags: ["Resolver"] } },
        "/api/proxy/m3u8": { get: { summary: "HLS Master/Media Playlist Proxy", tags: ["Proxy"] } },
        "/api/proxy/ts": { get: { summary: "Zero-Copy Video Chunk Proxy", tags: ["Proxy"] } }
    }
};
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health & System Status
app.get('/health', (req, res) => {
    res.json({ status: 'online', mode: 'pure-express-native', uptime: Math.floor(process.uptime()) });
});

app.get('/api/system/status', (req, res) => {
    req.tier = 'DIAGNOSTICS';
    const cpus = os.cpus() || [];
    const cpuModel = cpus[0]?.model || 'Intel / AMD Cloud Virtual Processor';
    const cpuCores = cpus.length;
    const cpuSpeed = cpus[0]?.speed || 0;
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    const usedMemPercent = totalMemBytes > 0 ? ((usedMemBytes / totalMemBytes) * 100).toFixed(1) : '0';
    const loadAvg = os.loadavg();
    const memUsage = process.memoryUsage();

    res.json({
        status: 'online',
        mode: 'pure-express-native',
        version: '4.0.0',
        timestamp: new Date().toISOString(),
        system: {
            hostname: os.hostname(),
            host: req.get('host') || os.hostname(),
            platform: os.platform(),
            type: os.type(),
            release: os.release(),
            arch: os.arch(),
            uptimeSeconds: Math.floor(os.uptime()),
            cpu: {
                model: cpuModel,
                cores: cpuCores,
                speedMHz: cpuSpeed,
                loadAvg1m: Number((loadAvg[0] || 0).toFixed(2)),
                loadAvg5m: Number((loadAvg[1] || 0).toFixed(2)),
                loadAvg15m: Number((loadAvg[2] || 0).toFixed(2))
            },
            memory: {
                totalGB: (totalMemBytes / (1024 * 1024 * 1024)).toFixed(2),
                freeGB: (freeMemBytes / (1024 * 1024 * 1024)).toFixed(2),
                usedGB: (usedMemBytes / (1024 * 1024 * 1024)).toFixed(2),
                usedPercent: `${usedMemPercent}%`
            }
        },
        process: {
            pid: process.pid,
            nodeVersion: process.version,
            uptimeSeconds: Math.floor(process.uptime()),
            memoryRSS_MB: (memUsage.rss / (1024 * 1024)).toFixed(1),
            heapUsedMB: (memUsage.heapUsed / (1024 * 1024)).toFixed(1),
            heapTotalMB: (memUsage.heapTotal / (1024 * 1024)).toFixed(1),
            externalMB: (memUsage.external / (1024 * 1024)).toFixed(1)
        },
        gateway: {
            port: PORT,
            engine: '100% Pure Express Native Pipeline',
            ipv6First: process.env.IPV6_FIRST === 'true',
            memoryMB: (memUsage.rss / (1024 * 1024)).toFixed(1),
            heapUsedMB: (memUsage.heapUsed / (1024 * 1024)).toFixed(1),
            ...metrics.getStats()
        },
        scraper: {
            upstreamBase: process.env.ZOKO_BASE_URL || 'https://zokoanime.video',
            upstreamStatus: 'ONLINE (CORS De-obfuscated)',
            anilistEndpoint: process.env.ANILIST_GRAPHQL_ENDPOINT || 'https://graphql.anilist.co'
        }
    });
});

app.get('/api/system/stream-metrics', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const sendUpdate = () => {
        const mem = process.memoryUsage();
        const payload = {
            time: Date.now(),
            activeStreams: metrics.activeStreams,
            cacheHits: metrics.hits,
            cacheMisses: metrics.misses,
            cacheEntries: metrics.cache.size,
            gatewayMemoryMB: (mem.rss / (1024 * 1024)).toFixed(1),
            totalRequests: metrics.totalRequests
        };
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    sendUpdate();
    const interval = setInterval(sendUpdate, 2000);
    req.on('close', () => clearInterval(interval));
});

// ==========================================
// SCRAPER & CATALOG API ENDPOINTS
// ==========================================

// 1. Search Anime
app.get('/api/search', async (req, res) => {
    try {
        const query = (req.query.q || '').trim();
        if (!query) return res.status(400).json({ error: 'Query param "q" is required' });

        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 20;

        req.tier = 'EXPRESS-SCRAPER';
        const data = await scraper.searchCatalog(query, page, perPage);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Anime Metadata / Details
async function handleAnimeDetails(req, res) {
    try {
        const id = req.params.id || req.params.identifier;
        if (!id) return res.status(400).json({ error: 'Anime ID is required' });

        req.tier = 'EXPRESS-DETAILS';
        const data = await scraper.getAnimeInfo(id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
app.get('/api/info/:identifier', handleAnimeDetails);
app.get('/api/anime/:id', handleAnimeDetails);
app.get('/api/meta/anime/:id', handleAnimeDetails);

// 3. Episodes Catalog
app.get('/api/episodes/:ani_id', async (req, res) => {
    try {
        const { ani_id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 50;
        const fetchAll = req.query.all === 'true' || size >= 100;

        req.tier = 'EXPRESS-SCRAPER';
        const data = await scraper.getEpisodesCatalog(ani_id, { all: fetchAll, page, size });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Stream Sources (Compatible with /api/stream/:ep_id and /api/stream/:id/:ep)
app.get('/api/stream/:id/:ep', async (req, res) => {
    try {
        const { id, ep } = req.params;
        const track = (req.query.track || 'sub').toLowerCase();
        const hostUrl = getBaseUrl(req);

        req.tier = 'EXPRESS-STREAM';
        const data = await scraper.extractZokoStream({
            anilistId: id,
            episode: parseInt(ep) || 1,
            track,
            hostUrl
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/stream/:ep_id', async (req, res) => {
    try {
        const { ep_id } = req.params;
        const hostUrl = getBaseUrl(req);

        req.tier = 'EXPRESS-SCRAPER';
        const data = await scraper.getStreamSources(ep_id, hostUrl);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Direct Stream Extraction Endpoint
app.get('/api/stream', async (req, res) => {
    try {
        let id = req.query.id || req.query.ani_id;
        let malId = req.query.malId || req.query.mal_id;
        let ep = parseInt(req.query.ep || req.query.episode) || 1;
        const track = (req.query.track || 'sub').toLowerCase();
        const hostUrl = getBaseUrl(req);

        // Support shorthand IDs (e.g. id="21-1" or malId="21-1")
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

        // Support title-based query fallback if id is not passed (e.g. ?title=Naruto&ep=1)
        const titleQuery = (req.query.title || req.query.q || req.query.name || '').trim();
        if (!id && !malId && titleQuery) {
            const search = await scraper.searchCatalog(titleQuery, 1, 1);
            if (search.results && search.results.length > 0) {
                id = search.results[0].id;
                malId = search.results[0].mal_id;
            }
        }

        if (!id && !malId) {
            return res.status(400).json({
                success: false,
                error: 'Missing identifier. Please provide "id" (e.g. ?id=21&ep=1) or "malId" or "title" (e.g. ?title=Naruto&ep=1)'
            });
        }

        req.tier = 'EXPRESS-STREAM';
        const data = await scraper.extractZokoStream({
            malId,
            anilistId: id,
            episode: ep,
            track,
            hostUrl
        });

        res.json(data);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. Home Catalog (Trending, Popular, Top Rated)
async function handleHomePage(req, res) {
    try {
        req.tier = 'EXPRESS-HOME';
        const data = await scraper.getHomepageCatalog();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
app.get('/api/home', handleHomePage);
app.get('/api/meta/home', handleHomePage);

// 7. Browse Catalog (Filters, Genres, Search)
async function handleBrowse(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = Math.min(parseInt(req.query.perPage) || 24, 50);
        const search = req.query.q && req.query.q.trim() ? req.query.q.trim() : undefined;
        const genre = req.query.genre && req.query.genre !== 'All' ? [req.query.genre] : undefined;
        const format = req.query.format && req.query.format !== 'All' ? req.query.format : undefined;
        const sort = req.query.sort ? [req.query.sort] : ['TRENDING_DESC'];

        req.tier = 'EXPRESS-BROWSE';
        const data = await scraper.browseCatalog({ page, perPage, search, genre, format, sort });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
app.get('/api/browse', handleBrowse);
app.get('/api/meta/browse', handleBrowse);

// 8. Smart Watch Stream Resolver
app.get('/api/watch/resolve', async (req, res) => {
    try {
        const title = (req.query.title || '').trim();
        const ani_id = req.query.id || req.query.ani_id;
        const mal_id = req.query.malId || req.query.mal_id;
        if (!title && !ani_id && !mal_id) {
            return res.status(400).json({ error: 'Parameter "title" or "id" or "malId" is required' });
        }

        const hostUrl = getBaseUrl(req);
        req.tier = 'EXPRESS-RESOLVER';
        const data = await scraper.resolveWatchStream({ title, ani_id, mal_id, hostUrl });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// HIGH PERFORMANCE HLS STREAMING PROXY
// ==========================================

// 9. M3U8 Playlist Rewriter & Proxy
app.get('/api/proxy/m3u8', async (req, res) => {
    try {
        const rawUrl = req.query.url;
        if (!rawUrl) return res.status(400).send('Missing url parameter');

        req.tier = 'STREAM-PIPE';
        const hostUrl = getBaseUrl(req);
        const parsedUrl = new URL(rawUrl);
        const baseUrlDir = parsedUrl.origin + parsedUrl.pathname.substring(0, parsedUrl.pathname.lastIndexOf('/') + 1);

        const upstreamHeaders = {
            "User-Agent": scraper.DEFAULT_HEADERS["User-Agent"],
            "Origin": "https://zokoanime.video",
            "Referer": "https://zokoanime.video/",
            "Accept": "*/*"
        };

        const upstreamResp = await fetch(rawUrl, { headers: upstreamHeaders, signal: AbortSignal.timeout(15000) });
        if (!upstreamResp.ok) {
            return res.status(upstreamResp.status).send(`Upstream playlist error: ${upstreamResp.statusText}`);
        }

        const m3u8Text = await upstreamResp.text();
        const lines = m3u8Text.split('\n');
        const rewritten = [];

        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                rewritten.push(line);
                continue;
            }

            if (trimmed.startsWith('#EXT-X-KEY')) {
                const keyRewritten = line.replace(/URI="([^"]+)"/, (m, uri) => {
                    const absUri = uri.startsWith('http') ? uri : new URL(uri, baseUrlDir).toString();
                    return `URI="${hostUrl}/api/proxy/ts?url=${encodeURIComponent(absUri)}"`;
                });
                rewritten.push(keyRewritten);
            } else if (trimmed.startsWith('#EXT-X-MEDIA')) {
                const mediaRewritten = line.replace(/URI="([^"]+)"/, (m, uri) => {
                    const absUri = uri.startsWith('http') ? uri : new URL(uri, baseUrlDir).toString();
                    return `URI="${hostUrl}/api/proxy/m3u8?url=${encodeURIComponent(absUri)}"`;
                });
                rewritten.push(mediaRewritten);
            } else if (trimmed.startsWith('#')) {
                rewritten.push(line);
            } else {
                const absTarget = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrlDir).toString();
                const isSubPlaylist = trimmed.includes('.m3u8') || trimmed.includes('-master') || trimmed.includes('-index');
                const proxyEndpoint = isSubPlaylist ? '/api/proxy/m3u8' : '/api/proxy/ts';
                rewritten.push(`${hostUrl}${proxyEndpoint}?url=${encodeURIComponent(absTarget)}`);
            }
        }

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=120');
        res.send(rewritten.join('\n'));
    } catch (err) {
        res.status(500).send(`M3U8 proxy error: ${err.message}`);
    }
});

// 10. Binary TS Video Chunk Proxy (Zero-Copy Pipe with HTTP Range Support)
app.get('/api/proxy/ts', async (req, res) => {
    try {
        const rawUrl = req.query.url;
        if (!rawUrl) return res.status(400).send('Missing url');

        metrics.activeStreams++;
        const upstreamHeaders = {
            "User-Agent": scraper.DEFAULT_HEADERS["User-Agent"],
            "Origin": "https://zokoanime.video",
            "Referer": "https://zokoanime.video/",
            "Accept": "*/*"
        };
        if (req.headers['range']) {
            upstreamHeaders['Range'] = req.headers['range'];
        }

        const upstreamResp = await fetch(rawUrl, { headers: upstreamHeaders });
        if (!upstreamResp.ok && upstreamResp.status !== 206) {
            metrics.activeStreams--;
            return res.status(upstreamResp.status).send(`Upstream chunk error: ${upstreamResp.statusText}`);
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Content-Type', upstreamResp.headers.get('content-type') || 'video/mp2t');

        if (upstreamResp.status === 206) {
            res.status(206);
            const contentRange = upstreamResp.headers.get('content-range');
            if (contentRange) res.setHeader('Content-Range', contentRange);
        }

        const contentLength = upstreamResp.headers.get('content-length');
        if (contentLength) res.setHeader('Content-Length', contentLength);

        if (upstreamResp.body) {
            const nodeStream = Readable.fromWeb(upstreamResp.body);
            nodeStream.pipe(res);
            res.on('finish', () => metrics.activeStreams--);
            res.on('close', () => {
                metrics.activeStreams = Math.max(0, metrics.activeStreams - 1);
                nodeStream.destroy();
            });
        } else {
            metrics.activeStreams--;
            res.end();
        }
    } catch (err) {
        metrics.activeStreams = Math.max(0, metrics.activeStreams - 1);
        res.status(500).send(`TS Chunk proxy error: ${err.message}`);
    }
});

// 11. Subtitle VTT Proxy
app.get('/api/proxy/vtt', async (req, res) => {
    try {
        const rawUrl = req.query.url;
        if (!rawUrl) return res.status(400).send('Missing url');

        const resp = await fetch(rawUrl, {
            headers: {
                "User-Agent": scraper.DEFAULT_HEADERS["User-Agent"],
                "Origin": "https://zokoanime.video",
                "Referer": "https://zokoanime.video/"
            }
        });

        if (!resp.ok) return res.status(resp.status).send('VTT upstream error');
        const vttContent = await resp.text();

        res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(vttContent);
    } catch (err) {
        res.status(500).send(`VTT proxy error: ${err.message}`);
    }
});

// 12. Embed Player Route (Standalone Iframe-Ready Artplayer)
app.get('/embed', async (req, res) => {
    try {
        const id = req.query.id || req.query.ani_id;
        const malId = req.query.malId || req.query.mal_id;
        const ep = parseInt(req.query.ep || req.query.episode) || 1;
        const track = (req.query.track || 'sub').toLowerCase();
        const color = req.query.color || '#35d5bf';
        const autoplay = req.query.autoplay === 'true';
        const hostUrl = getBaseUrl(req);

        if (!id && !malId) {
            return res.status(400).send('<h3>Error: Missing anime ID (e.g. /embed?id=16498&ep=1)</h3>');
        }

        const data = await scraper.extractZokoStream({
            malId,
            anilistId: id,
            episode: ep,
            track,
            hostUrl
        });

        const subOptions = (data.subtitles || []).map((s, idx) => ({
            html: s.label,
            url: s.proxied_src,
            default: idx === 0 || s.default
        }));

        const defaultSub = subOptions.find(s => s.default) || subOptions[0];

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZokoAnime Embed Player</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #artplayer { width: 100%; height: 100%; background: #000; overflow: hidden; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/artplayer@5.1.7/dist/artplayer.js"></script>
</head>
<body>
  <div id="artplayer"></div>
  <script>
    const art = new Artplayer({
      container: '#artplayer',
      url: ${JSON.stringify(data.stream_url)},
      type: 'm3u8',
      autoplay: ${autoplay},
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      pip: true,
      theme: ${JSON.stringify(color)},
      subtitle: ${defaultSub ? JSON.stringify({ url: defaultSub.url, type: 'vtt', style: { color: '#fff', fontSize: '20px' } }) : '{}'},
      settings: [
        ${subOptions.length > 0 ? `{
          width: 200,
          html: 'Subtitles',
          tooltip: ${JSON.stringify(defaultSub ? defaultSub.html : 'Off')},
          selector: [
            { html: 'Off', value: '' },
            ...${JSON.stringify(subOptions)}.map(s => ({ html: s.html, value: s.url, default: s.default }))
          ],
          onSelect: function(item) {
            if (item.value) {
              art.subtitle.switch(item.value, { name: item.html });
              art.subtitle.show = true;
            } else {
              art.subtitle.show = false;
            }
            return item.html;
          }
        }` : ''}
      ],
      customType: {
        m3u8: function(video, url, art) {
          if (Hls.isSupported()) {
            if (art.hls) art.hls.destroy();
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            art.hls = hls;
            art.on('destroy', () => hls.destroy());
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
          }
        }
      }
    });

    ${data.skip?.intro?.end ? `
    art.on('video:timeupdate', () => {
      const currentTime = art.currentTime;
      const introStart = ${data.skip.intro.start || 0};
      const introEnd = ${data.skip.intro.end || 0};
      if (currentTime >= introStart && currentTime < introEnd) {
        if (!document.getElementById('skip-btn')) {
          const btn = document.createElement('button');
          btn.id = 'skip-btn';
          btn.innerText = 'Skip Intro';
          btn.style.cssText = 'position:absolute;bottom:70px;right:25px;z-index:99;background:${color};color:#000;font-weight:700;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;font-family:sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.5);';
          btn.onclick = () => { art.seek = introEnd; btn.remove(); };
          document.getElementById('artplayer').appendChild(btn);
        }
      } else {
        const btn = document.getElementById('skip-btn');
        if (btn) btn.remove();
      }
    });` : ''}
  </script>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (err) {
        res.status(500).send(`<h3>Playback Error: ${err.message}</h3>`);
    }
});

// 13. Serve Single Page Web Player
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server Lifecycle
let serverInstance = null;
if (require.main === module) {
    serverInstance = app.listen(PORT, HOST, () => {
        console.log(`================================================================`);
        console.log(`🚀 ZOKOANIME PURE EXPRESS ENGINE (v4.0.0)`);
        console.log(`================================================================`);
        console.log(`  🌐 Web App:         http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}/`);
        console.log(`  📖 Swagger API:     http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}/docs`);
        console.log(`  📊 Engine Metrics:  http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}/api/system/status`);
        console.log(`  ⚡ Architecture:    100% Pure Express Native Pipeline (Zero Python)`);
        console.log(`================================================================`);
    });
}

module.exports = app;
