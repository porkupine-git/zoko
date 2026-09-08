/**
 * EMBED RESOLVERS API SERVER & ANIME EXPLORER
 * Zero-dependency Native Node.js HTTP Server with ArtPlayer, Anime Catalog & Streaming Proxy
 */

const http = require('http');
const https = require('https');
const { 
    resolveStream, 
    resolveBibiemb, 
    resolveOtakuhg, 
    resolveOtakuVid, 
    searchAnime, 
    getAnimeDetails, 
    getEpisodeServers, 
    resolveEpisodeStream,
    mapToSlug 
} = require('./resolvers');

const PORT = process.env.PORT || 3000;

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, *'
};

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
    });
    res.end(JSON.stringify(data, null, 2));
}

let lastKnownProxyDir = '';

/**
 * Helper to determine if a URL represents an HLS playlist (m3u8, txt disguise, urlset, etc.)
 */
function isPlaylistUrl(urlStr) {
    try {
        const u = new URL(urlStr);
        const p = u.pathname.toLowerCase();
        // Media segment chunk extensions
        if (p.endsWith('.ts') || p.endsWith('.woff2') || p.endsWith('.woff') || 
            p.endsWith('.jpg') || p.endsWith('.jpeg') || p.endsWith('.png') || 
            p.endsWith('.mp4') || p.endsWith('.m4s') || p.endsWith('.vtt')) {
            return false;
        }
        if (p.includes('.m3u8') || p.includes('.txt') || p.includes('.urlset') || p.includes('master') || p.includes('playlist')) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * Intelligently resolve the exact Referer and Origin headers required by upstream CDNs
 */
function resolveTargetReferer(urlStr) {
    try {
        const u = new URL(urlStr);
        const host = u.hostname.toLowerCase();

        if (host.includes('akirax') || host.includes('shiora') || host.includes('vidtube') || host.includes('anizara')) {
            return {
                'Referer': 'https://vidtube.site/',
                'Origin': 'https://vidtube.site'
            };
        }
        if (host.includes('norami') || host.includes('megaplay')) {
            return {
                'Referer': 'https://megaplay.buzz/',
                'Origin': 'https://megaplay.buzz'
            };
        }
        if (host.includes('vibeplayer') || host.includes('bibiemb')) {
            return {
                'Referer': 'https://vibeplayer.site/',
                'Origin': 'https://vibeplayer.site'
            };
        }
        if (host.includes('acek-cdn') || host.includes('historydocumentary') || host.includes('otakuvid') || host.includes('lakesideculinaryatelier') || host.includes('mediadexmora') || host.includes('dramiyos-cdn') || host.includes('.cyou')) {
            return {
                'Referer': 'https://otakuvid.online/',
                'Origin': 'https://otakuvid.online'
            };
        }
        return {
            'Referer': u.origin + '/',
            'Origin': u.origin
        };
    } catch {
        return {
            'Referer': 'https://vidtube.site/',
            'Origin': 'https://vidtube.site'
        };
    }
}

/**
 * Handle M3U8 Playlist Proxy with full relative URL rewriting and upstream Referer spoofing
 */
function handleM3u8Proxy(streamUrl, proxyBase, req, res) {
    const targetParsed = new URL(streamUrl);
    const client = targetParsed.protocol === 'https:' ? https : http;
    const baseDir = targetParsed.origin + targetParsed.pathname.substring(0, targetParsed.pathname.lastIndexOf('/') + 1);
    lastKnownProxyDir = baseDir;
    const refererHeaders = resolveTargetReferer(streamUrl);

    const proxyReq = client.request(streamUrl, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            ...refererHeaders
        }
    }, (proxyRes) => {
        // Handle HTTP 301/302 Redirects
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
            const redirectUrl = new URL(proxyRes.headers.location, streamUrl).toString();
            return handleM3u8Proxy(redirectUrl, proxyBase, req, res);
        }

        if (proxyRes.statusCode !== 200) {
            res.writeHead(proxyRes.statusCode, { ...CORS_HEADERS, 'Content-Type': 'text/plain' });
            return proxyRes.pipe(res);
        }

        let body = '';
        proxyRes.on('data', chunk => body += chunk);
        proxyRes.on('end', () => {
            const lines = body.split('\n');
            const rewritten = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed) return line;

                // Rewrite any URI="..." attribute in ANY #EXT- tag (subtitles, audio, keys, iframes, maps)
                if (trimmed.startsWith('#EXT-') && line.includes('URI="')) {
                    return line.replace(/URI="([^"]+)"/g, (m, uri) => {
                        const abs = uri.startsWith('http') ? uri : (uri.startsWith('/') ? `${targetParsed.origin}${uri}` : `${baseDir}${uri}`);
                        return `URI="${proxyBase}/api/proxy?url=${encodeURIComponent(abs)}"`;
                    });
                }

                // Header / Directive lines
                if (trimmed.startsWith('#')) return line;

                // URL lines (child m3u8, .txt disguised playlists, or .ts / .woff2 / .jpg chunks)
                const absUrl = trimmed.startsWith('http') ? trimmed : (trimmed.startsWith('/') ? `${targetParsed.origin}${trimmed}` : `${baseDir}${trimmed}`);
                return `${proxyBase}/api/proxy?url=${encodeURIComponent(absUrl)}`;
            }).join('\n');

            res.writeHead(200, {
                ...CORS_HEADERS,
                'Content-Type': 'application/vnd.apple.mpegurl',
                'Cache-Control': 'public, max-age=60'
            });
            res.end(rewritten);
        });
    });

    proxyReq.on('error', err => sendJson(res, 502, { error: 'Failed to fetch M3U8', message: err.message }));
    proxyReq.end();
}

/**
 * Handle TS Chunk & Direct Video Proxy with Range Header forwarding and Referer spoofing
 */
function handleChunkProxy(streamUrl, req, res) {
    const targetParsed = new URL(streamUrl);
    const client = targetParsed.protocol === 'https:' ? https : http;
    const refererHeaders = resolveTargetReferer(streamUrl);

    const reqHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        ...refererHeaders
    };

    if (req.headers['range']) {
        reqHeaders['Range'] = req.headers['range'];
    }

    const proxyReq = client.request(streamUrl, {
        method: 'GET',
        headers: reqHeaders
    }, (proxyRes) => {
        // Handle HTTP 301/302 Redirects
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
            const redirectUrl = new URL(proxyRes.headers.location, streamUrl).toString();
            return handleChunkProxy(redirectUrl, req, res);
        }

        let ct = proxyRes.headers['content-type'] || 'video/mp2t';
        if (streamUrl.includes('.jpg') || streamUrl.includes('.jpeg') || streamUrl.includes('.ts') || streamUrl.includes('.woff2') || streamUrl.includes('.woff') || streamUrl.includes('/1080p/') || streamUrl.includes('/720p/')) {
            ct = 'video/mp2t';
        } else if (streamUrl.includes('.vtt')) {
            ct = 'text/vtt; charset=utf-8';
        }

        const respHeaders = {
            ...CORS_HEADERS,
            'Content-Type': ct,
            'Cache-Control': 'public, max-age=86400, immutable'
        };

        if (proxyRes.headers['content-length']) respHeaders['Content-Length'] = proxyRes.headers['content-length'];
        if (proxyRes.headers['content-range']) respHeaders['Content-Range'] = proxyRes.headers['content-range'];
        if (proxyRes.headers['accept-ranges']) respHeaders['Accept-Ranges'] = proxyRes.headers['accept-ranges'];

        res.writeHead(proxyRes.statusCode, respHeaders);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', err => sendJson(res, 502, { error: 'Failed to fetch chunk', message: err.message }));
    proxyReq.end();
}

const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, CORS_HEADERS);
        return res.end();
    }

    const host = req.headers['host'] || ('localhost:' + PORT);
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const parsed = new URL(req.url, `${protocol}://${host}`);
    const pathname = parsed.pathname;
    const proxyBase = `${protocol}://${host}`;

    try {
        if (pathname === '/' || pathname === '/index.html') {
            res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'text/html; charset=utf-8' });
            return res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anime Explorer & Embed Resolvers | ArtPlayer</title>
  <style>
    :root {
      --bg: #0b0f17;
      --card: #151b26;
      --card-hover: #1c2433;
      --accent: #58a6ff;
      --accent-hover: #1f6feb;
      --text: #c9d1d9;
      --text-h: #f0f6fc;
      --border: #30363d;
      --green: #2ea043;
      --purple: #a371f7;
      --orange: #f0883e;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 1.5rem;
    }
    .container { max-width: 1040px; margin: 0 auto; }
    header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 10px; }
    h1 { color: var(--text-h); font-size: 1.6rem; margin: 0; display: flex; align-items: center; gap: 10px; }
    .badge { font-size: 11px; font-weight: 700; background: var(--green); color: white; padding: 3px 8px; border-radius: 12px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    
    .search-row { display: flex; gap: 10px; margin-bottom: 1rem; }
    input[type="text"] {
      flex: 1;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 14px;
      background: #010409;
      border: 1px solid var(--border);
      color: white;
      outline: none;
      transition: border-color 0.2s;
    }
    input[type="text"]:focus { border-color: var(--accent); }
    
    .btn-primary {
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      background: var(--accent);
      color: #0b0f17;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s, transform 0.1s;
    }
    .btn-primary:hover { background: #79c0ff; }
    .btn-primary:active { transform: scale(0.98); }

    .sample-btn {
      background: transparent;
      color: var(--accent);
      border: 1px solid var(--border);
      padding: 6px 12px;
      font-size: 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .sample-btn:hover { background: #21262d; border-color: #8b949e; color: #fff; }

    /* Video Player Box */
    #playerContainer {
      display: none;
      margin-top: 1.5rem;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--border);
      background: #000;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .artplayer-app {
      width: 100%;
      height: 500px;
      max-height: 75vh;
    }
    .player-header {
      padding: 12px 16px;
      background: #161b22;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
    }

    /* Anime Cards Grid */
    .anime-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      margin-top: 1rem;
    }
    .anime-card {
      background: #0d1117;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
      display: flex;
      flex-direction: column;
    }
    .anime-card:hover {
      transform: translateY(-4px);
      border-color: var(--accent);
      box-shadow: 0 6px 16px rgba(88, 166, 255, 0.15);
    }
    .anime-card img {
      width: 100%;
      height: 240px;
      object-fit: cover;
      background: #161b22;
    }
    .anime-info {
      padding: 10px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .anime-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-h);
      line-height: 1.3;
      margin-bottom: 6px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .anime-meta {
      font-size: 11px;
      color: #8b949e;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Episode Selector */
    #episodeSection {
      display: none;
      margin-top: 1.5rem;
      background: #0d1117;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.2rem;
    }
    .ep-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
      margin-top: 10px;
      padding-right: 4px;
    }
    .ep-btn {
      background: #161b22;
      color: var(--text);
      border: 1px solid var(--border);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .ep-btn:hover, .ep-btn.active {
      background: var(--accent);
      color: #0d1117;
      border-color: var(--accent);
      font-weight: 600;
    }

    /* Server list */
    #serversSection {
      display: none;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }
    .server-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    .server-chip {
      background: #161b22;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 7px 14px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .server-chip:hover { border-color: var(--accent); background: #21262d; }
    .server-chip.active { background: var(--green); border-color: var(--green); color: white; font-weight: 600; }
    .server-chip.failed { opacity: 0.55; border-color: #da3633; color: #8b949e; }
    .server-chip.failed:hover { border-color: #f85149; }

    .tag { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 700; }
    .tag-sub { background: #58a6ff22; color: #58a6ff; border: 1px solid #58a6ff44; }
    .tag-dub { background: #f0883e22; color: #ffa657; border: 1px solid #f0883e44; }
    .tag-raw { background: #a371f722; color: #d2a8ff; border: 1px solid #a371f744; }

    pre {
      background: #010409;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
      color: #7ee787;
      font-size: 13px;
      max-height: 240px;
      margin-top: 1.2rem;
    }
    code { background: #21262d; padding: 2px 6px; border-radius: 4px; color: #e6edf3; font-family: ui-monospace, monospace; }
  </style>

  <!-- HLS.js & ArtPlayer CDN -->
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  <script src="https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.js"></script>
</head>
<body>
  <div class="container">
    <header>
      <h1>🎬 Anime Explorer & Resolvers <span class="badge">ArtPlayer Edition</span></h1>
    </header>

    <!-- SECTION 0: ANILIST & MAL ID LIVE TESTER -->
    <div class="card" style="border: 1px solid #1f6feb; background: linear-gradient(180deg, #111827 0%, #151b26 100%);">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
        <h3 style="margin: 0; color: #f0f6fc; display: flex; align-items: center; gap: 8px;">
          <span>🎯 AniList & MAL ID Live Tester</span>
        </h3>
        <span class="badge" style="background: #238636; font-size:11px;">AniClipse + Jikan + AniList Active</span>
      </div>
      <p style="font-size: 13px; color: #8b949e; margin-top: 0; margin-bottom: 12px;">
        Test any random AniList ID or MyAnimeList ID. Automatically tests metadata resolution, AniClipse failover, slug matching, and episode stream playback.
      </p>
      <div class="search-row">
        <select id="idType" style="background:#010409; color:white; border:1px solid var(--border); border-radius:8px; padding:10px 14px; font-size:13px; outline:none; cursor:pointer;">
          <option value="anilist">AniList ID</option>
          <option value="mal">MAL (MyAnimeList) ID</option>
        </select>
        <input id="testIdInput" type="text" placeholder="Enter ID (e.g. 140960, 5114, 171018, 37521)..." value="140960">
        <button class="btn-primary" onclick="testIdMapping()">
          <span>Map & Test Stream</span>
        </button>
      </div>
      <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
        <span style="font-size: 12px; color: #8b949e;">Quick Test Samples:</span>
        <button class="sample-btn" onclick="setTestSample('anilist', '140960')">Spy x Family (Ani: 140960)</button>
        <button class="sample-btn" onclick="setTestSample('anilist', '171018')">Dandadan (Ani: 171018)</button>
        <button class="sample-btn" onclick="setTestSample('anilist', '5114')">Fullmetal Alchemist (Ani: 5114)</button>
        <button class="sample-btn" onclick="setTestSample('mal', '37521')">Vinland Saga (MAL: 37521)</button>
        <button class="sample-btn" onclick="setTestSample('mal', '9253')">Steins;Gate (MAL: 9253)</button>
        <button class="sample-btn" onclick="setTestSample('mal', '52588')">Kaiju No. 8 (MAL: 52588)</button>
        <button class="sample-btn" onclick="setTestSample('anilist', '154587')">Frieren (Ani: 154587)</button>
        <button class="sample-btn" onclick="setTestSample('anilist', '130003')">Bocchi the Rock! (Ani: 130003)</button>
      </div>
      <div id="mapResultBox" style="display:none; margin-top:14px; background:#010409; border:1px solid #30363d; border-radius:8px; padding:14px;"></div>
    </div>

    <!-- SECTION 1: ANIME SEARCH & FINDER -->
    <div class="card">
      <h3 style="margin-top: 0; color: #f0f6fc; display: flex; align-items: center; gap: 8px;">
        <span>🔍 Find Any Anime & Episodes</span>
      </h3>
      <div class="search-row">
        <input id="animeQuery" type="text" placeholder="Search anime by title or ID (e.g. Solo Leveling, 140960, mal:37521)..." value="Solo Leveling">
        <button class="btn-primary" onclick="doAnimeSearch()">
          <span>Search</span>
        </button>
      </div>

      <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 1rem;">
        <span style="font-size: 12px; color: #8b949e;">Quick Animes:</span>
        <button class="sample-btn" onclick="quickSearch('Solo Leveling')">Solo Leveling</button>
        <button class="sample-btn" onclick="quickSearch('One Piece')">One Piece</button>
        <button class="sample-btn" onclick="quickSearch('Naruto Shippuden')">Naruto Shippuden</button>
        <button class="sample-btn" onclick="quickSearch('Jujutsu Kaisen')">Jujutsu Kaisen</button>
        <button class="sample-btn" onclick="quickSearch('Bleach')">Bleach</button>
        <button class="sample-btn" onclick="quickSearch('Demon Slayer')">Demon Slayer</button>
        <button class="sample-btn" onclick="quickSearch('Attack on Titan')">Attack on Titan</button>
      </div>

      <!-- Search results container -->
      <div id="searchLoader" style="display:none; color: var(--accent); padding: 10px 0; font-size: 13px;">Searching anime catalog...</div>
      <div id="animeGrid" class="anime-grid"></div>

      <!-- Episode selector section -->
      <div id="episodeSection">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
          <h4 id="selectedAnimeTitle" style="margin:0; color:#f0f6fc;">Anime Episodes</h4>
          <span id="episodesCountBadge" class="badge">0 Episodes</span>
        </div>
        <div id="episodesList" class="ep-grid"></div>

        <!-- Servers list for selected episode -->
        <div id="serversSection">
          <div style="font-size: 13px; font-weight: 600; color: #f0f6fc; margin-bottom: 6px;">
            Available Streaming Servers (Click to Play):
          </div>
          <div id="serverChips" class="server-chips"></div>
        </div>
      </div>
    </div>

    <!-- SECTION 2: ARTPLAYER VIDEO PLAYER -->
    <div id="playerContainer">
      <div class="player-header">
        <span id="playerTitle" style="color: #f0f6fc; font-weight: 600;">Stream Title</span>
        <span id="playerBadge" class="tag tag-sub">HLS Stream</span>
      </div>
      <div id="artplayer" class="artplayer-app"></div>
    </div>

    <!-- SECTION 3: DIRECT EMBED URL TESTER -->
    <div class="card" style="margin-top: 1.5rem;">
      <h3 style="margin-top: 0; color: #f0f6fc;">⚡ Direct Embed URL Extractor</h3>
      <div class="search-row">
        <input id="testUrl" type="text" placeholder="Paste embed link (e.g. https://otakuvid.online/embed/7vabw41b15ht)" value="https://otakuvid.online/embed/7vabw41b15ht">
        <button class="btn-primary" onclick="resolveAndPlayDirect()">
          <span>Extract & Play</span>
        </button>
      </div>
      <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
        <span style="font-size: 12px; color: #8b949e;">Samples:</span>
        <button class="sample-btn" onclick="setDirect('https://otakuvid.online/embed/7vabw41b15ht')">OtakuVid 1080p</button>
        <button class="sample-btn" onclick="setDirect('https://bibiemb.xyz/agf104ba92b0cd9d7cdfd4559934189a6f4h')">BibiEmb 1080p</button>
        <button class="sample-btn" onclick="setDirect('https://otakuhg.site/e/i0ehyeq33i6k')">OtakuHG (TikTok CDN)</button>
      </div>
      <pre id="output">Output will appear here...</pre>
    </div>

    <!-- SECTION 4: API REFERENCE -->
    <div class="card">
      <h3 style="margin-top: 0; color: #f0f6fc;">📖 Anime & Resolver API Endpoints</h3>
      <ul style="padding-left: 20px; line-height: 2;">
        <li><span class="tag tag-sub">Search</span> <code>GET /api/anime/search?q=&lt;query&gt;</code> - Search any anime</li>
        <li><span class="tag tag-sub">Episodes</span> <code>GET /api/anime/:slug/episodes</code> - Get all episode list</li>
        <li><span class="tag tag-sub">Servers</span> <code>GET /api/anime/:slug/servers/:epId</code> - Get SUB, DUB, RAW servers</li>
        <li><span class="tag tag-sub">Watch</span> <code>GET /api/anime/:slug/watch/:epId?category=SUB</code> - Auto-resolve playable stream</li>
        <li><span class="tag tag-dub">OtakuVid</span> <code>GET /api/otakuvid/:file_code</code></li>
        <li><span class="tag tag-dub">BibiEmb</span> <code>GET /api/bibiemb/:id</code></li>
        <li><span class="tag tag-dub">OtakuHG</span> <code>GET /api/otakuhg/:file_code</code></li>
        <li><span class="tag tag-raw">Proxy</span> <code>GET /api/proxy?url=&lt;stream_url&gt;</code> - Smart CORS proxy</li>
      </ul>
    </div>
  </div>

  <script>
    let art = null;
    let currentAnimeSlug = '';
    let currentEpisodeId = '';
    let currentEpisodeServers = [];
    let currentServerIndex = -1;
    let currentServerStreams = [];
    let currentStreamIndex = -1;
    let failedServerIndices = new Set();
    let isSwitchingServer = false;
    let switchTimeout = null;

    // On initial load, run search for Solo Leveling
    window.addEventListener('DOMContentLoaded', () => {
      doAnimeSearch();
    });

    function setTestSample(type, id) {
      document.getElementById('idType').value = type;
      document.getElementById('testIdInput').value = id;
      testIdMapping();
    }

    async function testIdMapping() {
      const type = document.getElementById('idType').value;
      const rawId = document.getElementById('testIdInput').value.trim();
      const box = document.getElementById('mapResultBox');
      if (!rawId) return;

      box.style.display = 'block';
      box.innerHTML = '<div style="color:var(--accent); font-size:13px;">🔍 Resolving metadata via AniList, AniClipse CDN & Jikan...</div>';

      try {
        const param = type === 'mal' ? ('malId=' + encodeURIComponent(rawId)) : ('anilistId=' + encodeURIComponent(rawId));
        const res = await fetch('/api/map?' + param);
        const data = await res.json();

        if (!data.success || !data.slug) {
          box.innerHTML = '<div style="color:#f85149; font-size:13px;">❌ Mapping Failed: ' + (data.error || 'Anime not found') + '</div>';
          return;
        }

        const scorePct = data.score ? Math.round(data.score * 100) + '%' : '100% (Instant Cache)';
        box.innerHTML = \`
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
            <div>
              <span class="badge" style="background:#238636;">✓ Map Success</span>
              <strong style="color:white; margin-left:8px; font-size:14px;">\${data.matchedTitle || data.slug}</strong>
            </div>
            <button class="btn-primary" style="padding:6px 14px; font-size:12px;" onclick="selectAnime('\${data.slug}', '\${(data.matchedTitle || data.slug).replace(/'/g, "\\\\'")}')">
              ▶ Load Episodes & Stream
            </button>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px; font-size:12px; color:#8b949e;">
            <div><strong>Query:</strong> <span style="color:#f0f6fc;">\${type.toUpperCase()}: \${rawId}</span></div>
            <div><strong>AniNeko Slug:</strong> <code style="color:#7ee787;">\${data.slug}</code></div>
            <div><strong>Match Score:</strong> <span style="color:#58a6ff;">\${scorePct}</span></div>
            <div><strong>Cache Status:</strong> <span style="color:\${data.cached ? '#2ea043' : '#f0883e'};">\${data.cached ? 'Persistent Disk Cache (0ms)' : 'Live Resolved'}</span></div>
          </div>
        \`;

        // Automatically load episodes for this mapped slug!
        selectAnime(data.slug, data.matchedTitle || data.slug);
      } catch (err) {
        box.innerHTML = '<div style="color:#f85149; font-size:13px;">Error: ' + err.message + '</div>';
      }
    }

    function quickSearch(q) {
      document.getElementById('animeQuery').value = q;
      doAnimeSearch();
    }

    async function doAnimeSearch() {
      const q = document.getElementById('animeQuery').value.trim();
      if (!q) return;

      // Smart ID Detection: if user typed pure number or mal:123, route to ID tester automatically!
      if (/^\\d+$/.test(q)) {
        document.getElementById('idType').value = 'anilist';
        document.getElementById('testIdInput').value = q;
        testIdMapping();
        return;
      }
      if (q.toLowerCase().startsWith('mal:')) {
        document.getElementById('idType').value = 'mal';
        document.getElementById('testIdInput').value = q.replace(/^mal:/i, '').trim();
        testIdMapping();
        return;
      }

      const loader = document.getElementById('searchLoader');
      const grid = document.getElementById('animeGrid');
      const epSec = document.getElementById('episodeSection');
      
      loader.style.display = 'block';
      grid.innerHTML = '';
      epSec.style.display = 'none';

      try {
        const res = await fetch('/api/anime/search?q=' + encodeURIComponent(q));
        const data = await res.json();
        loader.style.display = 'none';

        if (!data.results || data.results.length === 0) {
          grid.innerHTML = '<div style="color:#8b949e; grid-column:1/-1;">No anime found matching "' + q + '". Try another keyword.</div>';
          return;
        }

        data.results.forEach(anime => {
          const card = document.createElement('div');
          card.className = 'anime-card';
          card.onclick = () => selectAnime(anime.slug, anime.title);
          
          card.innerHTML = \`
            <img src="\${anime.poster || 'https://via.placeholder.com/200x300?text=No+Cover'}" alt="\${anime.title}" loading="lazy">
            <div class="anime-info">
              <div class="anime-title" title="\${anime.title}">\${anime.title}</div>
              <div class="anime-meta">
                <span class="badge">\${anime.type || 'TV'}</span>
                <span>\${anime.subEpisodes ? 'CC ' + anime.subEpisodes : ''} \${anime.dubEpisodes ? '| DUB ' + anime.dubEpisodes : ''}</span>
              </div>
            </div>
          \`;
          grid.appendChild(card);
        });
      } catch (err) {
        loader.style.display = 'none';
        grid.innerHTML = '<div style="color:#f85149; grid-column:1/-1;">Error: ' + err.message + '</div>';
      }
    }

    async function selectAnime(slug, title) {
      currentAnimeSlug = slug;
      const epSec = document.getElementById('episodeSection');
      const titleSpan = document.getElementById('selectedAnimeTitle');
      const countBadge = document.getElementById('episodesCountBadge');
      const epList = document.getElementById('episodesList');
      const serversSec = document.getElementById('serversSection');

      titleSpan.textContent = title;
      countBadge.textContent = 'Loading episodes...';
      epList.innerHTML = '<div style="color:var(--accent);">Fetching episode list...</div>';
      serversSec.style.display = 'none';
      epSec.style.display = 'block';
      epSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      try {
        const res = await fetch('/api/anime/' + encodeURIComponent(slug) + '/episodes');
        const data = await res.json();
        currentEpisodes = data.episodes || [];
        countBadge.textContent = currentEpisodes.length + ' Episodes';
        epList.innerHTML = '';

        if (currentEpisodes.length === 0) {
          epList.innerHTML = '<div style="color:#8b949e;">No episodes found.</div>';
          return;
        }

        currentEpisodes.forEach(ep => {
          const btn = document.createElement('button');
          btn.className = 'ep-btn';
          btn.id = 'ep-btn-' + ep.id;
          btn.textContent = 'Ep ' + ep.episodeNumber;
          btn.title = ep.title;
          btn.onclick = () => selectEpisode(ep.id);
          epList.appendChild(btn);
        });

        // Auto select episode 1
        selectEpisode(currentEpisodes[0].id);
      } catch (err) {
        epList.innerHTML = '<div style="color:#f85149;">Failed to load episodes: ' + err.message + '</div>';
      }
    }

    async function selectEpisode(epId) {
      currentEpisodeId = epId;
      currentEpisodeServers = [];
      currentServerIndex = -1;
      currentServerStreams = [];
      currentStreamIndex = -1;
      failedServerIndices.clear();
      isSwitchingServer = false;
      if (switchTimeout) clearTimeout(switchTimeout);

      document.querySelectorAll('.ep-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('ep-btn-' + epId);
      if (activeBtn) activeBtn.classList.add('active');

      const serversSec = document.getElementById('serversSection');
      const chipsContainer = document.getElementById('serverChips');
      chipsContainer.innerHTML = '<div style="color:var(--accent);">Checking streaming servers...</div>';
      serversSec.style.display = 'block';

      try {
        const res = await fetch('/api/anime/' + encodeURIComponent(currentAnimeSlug) + '/servers/' + epId);
        const data = await res.json();
        chipsContainer.innerHTML = '';

        if (!data.servers || data.servers.length === 0) {
          chipsContainer.innerHTML = '<div style="color:#8b949e;">No streaming servers found for this episode.</div>';
          return;
        }

        const validServers = data.servers.filter(server => {
          if (!server.isSupported) return false;
          if (server.serverName.toLowerCase().includes('hd-1') || (server.rawLabel && server.rawLabel.toLowerCase().includes('hd-1')) || server.embedUrl.includes('vivibebe.site')) return false;
          return true;
        });

        if (validServers.length === 0) {
          chipsContainer.innerHTML = '<div style="color:#8b949e;">No supported streaming servers for this episode.</div>';
          return;
        }

        currentEpisodeServers = validServers;

        validServers.forEach((server, idx) => {
          const chip = document.createElement('div');
          chip.className = 'server-chip';
          chip.id = 'server-chip-' + idx;
          
          let catClass = 'tag-sub';
          if (server.category === 'DUB') catClass = 'tag-dub';
          if (server.category === 'RAW') catClass = 'tag-raw';

          chip.innerHTML = '<span class="tag ' + catClass + '">' + server.category + '</span><span>' + server.serverName + '</span>';

          chip.onclick = () => {
            isSwitchingServer = false;
            playServerByIndex(idx);
          };

          chipsContainer.appendChild(chip);
        });

        // Automatically play first server
        playServerByIndex(0);
      } catch (err) {
        chipsContainer.innerHTML = '<div style="color:#f85149;">Failed to load servers: ' + err.message + '</div>';
      }
    }

    // Play a server by its index in currentEpisodeServers
    async function playServerByIndex(idx, reason) {
      if (idx < 0 || idx >= currentEpisodeServers.length) {
        if (art) art.notice.show = '❌ No available servers left to play.';
        return;
      }

      currentServerIndex = idx;
      currentServerStreams = [];
      currentStreamIndex = -1;

      // Update chip active styles
      document.querySelectorAll('.server-chip').forEach(c => c.classList.remove('active'));
      const activeChip = document.getElementById('server-chip-' + idx);
      if (activeChip) activeChip.classList.add('active');

      const server = currentEpisodeServers[idx];
      const animeTitle = document.getElementById('selectedAnimeTitle').textContent;
      const titleLabel = animeTitle + ' - ' + currentEpisodeId.toUpperCase() + ' (' + server.category + ') [' + server.serverName + ']';

      if (reason && art) {
        art.notice.show = '🔄 Auto-switching to ' + server.serverName + ' (' + server.category + ')...';
      }

      await playDirectEmbedUrl(server.embedUrl, titleLabel, idx);
    }

    // Play an extracted embed URL
    async function playDirectEmbedUrl(embedUrl, titleLabel, serverIdx = -1) {
      const playerBox = document.getElementById('playerContainer');
      const titleSpan = document.getElementById('playerTitle');
      const badgeSpan = document.getElementById('playerBadge');
      const out = document.getElementById('output');

      playerBox.style.display = 'block';
      titleSpan.textContent = titleLabel || 'Resolving Stream...';
      badgeSpan.textContent = 'CONNECTING';
      playerBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

      try {
        const res = await fetch('/api/resolve?url=' + encodeURIComponent(embedUrl));
        const json = await res.json();
        out.textContent = JSON.stringify(json, null, 2);

        if (json.streams && json.streams.length > 0) {
          titleSpan.textContent = titleLabel || json.title || 'Live Stream';
          badgeSpan.textContent = (json.serviceName || json.provider || 'HLS').toUpperCase();
          currentServerStreams = json.streams;
          currentStreamIndex = 0;
          mountArtPlayer(json);
        } else {
          console.warn('No playable streams for server index ' + serverIdx);
          if (serverIdx !== -1) {
            markServerFailedUI(serverIdx);
            autoSwitchNextServer('Server returned no streams');
          } else {
            alert('No playable streams extracted for this server.');
          }
        }
      } catch (err) {
        console.error('Stream resolution error:', err);
        if (serverIdx !== -1) {
          markServerFailedUI(serverIdx);
          autoSwitchNextServer('Resolution failed: ' + err.message);
        } else {
          alert('Stream resolution error: ' + err.message);
        }
      }
    }

    // Direct Embed Tester functions
    function setDirect(u) {
      document.getElementById('testUrl').value = u;
      resolveAndPlayDirect();
    }

    async function resolveAndPlayDirect() {
      const u = document.getElementById('testUrl').value.trim();
      if (!u) return;
      playDirectEmbedUrl(u, 'Direct Embed Stream');
    }

    // Failover: handle stream failure or server jump
    function handleStreamOrServerFailover(reason) {
      // 1. Try backup stream within the current server if available
      if (currentServerStreams && currentStreamIndex + 1 < currentServerStreams.length) {
        currentStreamIndex++;
        const nextStream = currentServerStreams[currentStreamIndex];
        console.log('Switching to intra-server stream:', nextStream.server, nextStream.url);
        if (art) {
          art.notice.show = '⚠️ Main stream failed. Trying backup (' + nextStream.server + ')...';
          art.switchUrl(nextStream.url);
        }
        return;
      }

      // 2. All streams in current server failed; switch to next available server
      autoSwitchNextServer(reason);
    }

    // Automatically switch to the next available server in the episode
    function autoSwitchNextServer(reason) {
      if (isSwitchingServer) return;
      isSwitchingServer = true;
      if (switchTimeout) clearTimeout(switchTimeout);

      if (currentServerIndex >= 0) {
        failedServerIndices.add(currentServerIndex);
        markServerFailedUI(currentServerIndex);
      }

      // Find next server index not yet marked failed
      let nextIdx = -1;
      for (let i = currentServerIndex + 1; i < currentEpisodeServers.length; i++) {
        if (!failedServerIndices.has(i)) {
          nextIdx = i;
          break;
        }
      }
      // If none found forward, check from beginning
      if (nextIdx === -1) {
        for (let i = 0; i < currentServerIndex; i++) {
          if (!failedServerIndices.has(i)) {
            nextIdx = i;
            break;
          }
        }
      }

      if (nextIdx === -1) {
        isSwitchingServer = false;
        if (art) {
          art.notice.show = '❌ All streaming servers failed for this episode.';
        }
        const badgeSpan = document.getElementById('playerBadge');
        if (badgeSpan) badgeSpan.textContent = 'FAILED';
        return;
      }

      const nextServer = currentEpisodeServers[nextIdx];
      if (art) {
        art.notice.show = '⚠️ Server failed (' + (reason || 'Error') + '). Auto-switching to ' + nextServer.serverName + ' (' + nextServer.category + ')...';
      }

      switchTimeout = setTimeout(() => {
        isSwitchingServer = false;
        playServerByIndex(nextIdx, reason);
      }, 1000);
    }

    function markServerFailedUI(idx) {
      const chip = document.getElementById('server-chip-' + idx);
      if (chip) {
        chip.classList.add('failed');
        chip.title = 'Server stream failed';
        if (!chip.querySelector('.fail-indicator')) {
          const failSpan = document.createElement('span');
          failSpan.className = 'fail-indicator';
          failSpan.style.cssText = 'color:#f85149; font-size:11px; margin-left:4px;';
          failSpan.textContent = '✖';
          chip.appendChild(failSpan);
        }
      }
    }

    // ArtPlayer Mount function
    function mountArtPlayer(data) {
      if (art) {
        art.destroy(false);
        art = null;
      }

      const streams = data.streams || [];
      const primaryStream = streams[currentStreamIndex >= 0 ? currentStreamIndex : 0] || streams[0] || {};
      const streamUrl = primaryStream.url || '';

      const controls = [];
      if (streams.length > 1) {
        controls.push({
          position: 'right',
          html: 'Server: ' + primaryStream.server,
          selector: streams.map((s, idx) => ({
            default: idx === (currentStreamIndex >= 0 ? currentStreamIndex : 0),
            html: s.server,
            url: s.url
          })),
          onSelect: function(item) {
            art.switchUrl(item.url);
            return 'Server: ' + item.html;
          }
        });
      }

      art = new Artplayer({
        container: '#artplayer',
        url: streamUrl,
        poster: data.poster || '',
        title: data.title || '',
        subtitle: (data.subtitles && data.subtitles.length > 0) ? {
          url: data.subtitles[0].file,
          type: 'vtt',
          style: {
            color: '#fff',
            fontSize: '22px',
            textShadow: '0 0 4px #000, 0 0 6px #000'
          }
        } : {},
        volume: 0.8,
        isLive: false,
        muted: false,
        autoplay: true,
        pip: true,
        autoSize: false,
        autoMini: true,
        screenshot: true,
        setting: true,
        loop: false,
        flip: true,
        playbackRate: true,
        aspectRatio: true,
        fullscreen: true,
        fullscreenWeb: true,
        miniProgressBar: true,
        theme: '#58a6ff',
        icons: {
          loading: '<img src="https://artplayer.org/assets/img/ploading.gif">'
        },
        type: primaryStream.type === 'mp4' ? 'mp4' : 'm3u8',
        customType: {
          m3u8: function(video, url, artInstance) {
            if (Hls.isSupported()) {
              if (artInstance.hls) artInstance.hls.destroy();
              const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                manifestLoadingTimeOut: 10000,
                manifestLoadingMaxRetry: 1,
                fragLoadingTimeOut: 15000,
                fragLoadingMaxRetry: 2
              });
              hls.loadSource(url);
              hls.attachMedia(video);
              artInstance.hls = hls;

              hls.on(Hls.Events.MANIFEST_PARSED, function() {
                artInstance.notice.show = '✓ Stream Connected (' + (data.serviceName || 'HLS') + ')';
                video.play().catch(function() {});
              });

              let netRetry = 0;
              hls.on(Hls.Events.ERROR, function(event, errData) {
                console.warn('HLS Error event:', errData);
                if (errData.fatal) {
                  switch (errData.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                      netRetry++;
                      if (netRetry <= 1 && errData.details !== 'manifestLoadError') {
                        artInstance.notice.show = 'Network retry (1/1)...';
                        hls.startLoad();
                      } else {
                        artInstance.notice.show = 'Stream unavailable (Network/404). Auto-switching...';
                        hls.destroy();
                        handleStreamOrServerFailover('HLS Fatal Network: ' + errData.details);
                      }
                      break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                      artInstance.notice.show = 'Media decode glitch, attempting recovery...';
                      try {
                        hls.recoverMediaError();
                      } catch {
                        hls.destroy();
                        handleStreamOrServerFailover('HLS Fatal Media');
                      }
                      break;
                    default:
                      artInstance.notice.show = 'Fatal error (' + errData.details + '). Auto-switching...';
                      hls.destroy();
                      handleStreamOrServerFailover('HLS Error: ' + errData.details);
                      break;
                  }
                }
              });

              video.onerror = function() {
                if (!isSwitchingServer) {
                  handleStreamOrServerFailover('HTML5 Video Error');
                }
              };

              artInstance.on('destroy', function() {
                hls.destroy();
              });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = url;
              video.onerror = function() {
                handleStreamOrServerFailover('Native Safari Video Error');
              };
            } else {
              artInstance.notice.show = 'Unsupported video format';
            }
          }
        },
        controls: controls
      });
    }
  </script>
</body>
</html>`);
        }

        // --- API ROUTES ---

        // 1. Anime Catalog: Search
        if (pathname === '/api/anime/search') {
            const q = parsed.searchParams.get('q') || parsed.searchParams.get('keyword');
            if (!q) return sendJson(res, 400, { error: 'Missing ?q= parameter' });
            const data = await searchAnime(q);
            return sendJson(res, 200, data);
        }

        // 2. Anime Catalog: Episode List (/api/anime/:slug/episodes)
        if (pathname.startsWith('/api/anime/') && pathname.endsWith('/episodes')) {
            const slug = pathname.replace('/api/anime/', '').replace('/episodes', '').split('/')[0];
            if (!slug) return sendJson(res, 400, { error: 'Missing anime slug' });
            const data = await getAnimeDetails(slug);
            return sendJson(res, 200, data);
        }

        // 3. Anime Catalog: Servers for an Episode (/api/anime/:slug/servers/:epId)
        if (pathname.startsWith('/api/anime/') && pathname.includes('/servers/')) {
            const parts = pathname.replace('/api/anime/', '').split('/servers/');
            const slug = parts[0];
            const epId = parts[1] || 'ep-1';
            const data = await getEpisodeServers(slug, epId);
            return sendJson(res, 200, data);
        }

        // 4. Anime Catalog: Auto-resolve Episode Stream (/api/anime/:slug/watch/:epId)
        if (pathname.startsWith('/api/anime/') && pathname.includes('/watch/')) {
            const parts = pathname.replace('/api/anime/', '').split('/watch/');
            const slug = parts[0];
            const epId = parts[1] || 'ep-1';
            const category = parsed.searchParams.get('category') || parsed.searchParams.get('lang') || 'SUB';
            const data = await resolveEpisodeStream(slug, epId, { category, proxyBase });
            return sendJson(res, 200, data);
        }

        // 4b. AniList / MAL ID to Slug Mapping: /api/map?id=... or ?anilistId=... or ?malId=...
        if (pathname === '/api/map') {
            const anilistId = parsed.searchParams.get('anilistId') || parsed.searchParams.get('aniId') || parsed.searchParams.get('id');
            const malId = parsed.searchParams.get('malId') || parsed.searchParams.get('idMal');
            const title = parsed.searchParams.get('title') || parsed.searchParams.get('q');
            if (!anilistId && !malId && !title) {
                return sendJson(res, 400, { error: 'Provide at least one of: ?anilistId=, ?malId=, or ?title=' });
            }
            const mapRes = await mapToSlug({ anilistId, malId, title });
            return sendJson(res, 200, { success: true, ...mapRes });
        }

        // 4c. Anigo2 Compatible Universal Watch Route: /api/watch/:id/:lang/:ep
        if (pathname.startsWith('/api/watch')) {
            const parts = pathname.replace('/api/watch', '').split('/').filter(Boolean);
            const rawId = parts[0] || parsed.searchParams.get('id') || parsed.searchParams.get('anilistId');
            const lang = (parts[1] || parsed.searchParams.get('lang') || 'sub').toLowerCase();
            const epNum = parseInt(parts[2] || parsed.searchParams.get('ep') || '1', 10) || 1;
            const title = parsed.searchParams.get('title') || null;

            if (!rawId) {
                return sendJson(res, 400, { error: 'Missing anime ID or slug in /api/watch/:id/:lang/:ep' });
            }

            // Map AniList ID or MAL ID to slug
            let targetSlug = rawId;
            let mapInfo = null;
            if (/^\d+$/.test(rawId)) {
                mapInfo = await mapToSlug({ anilistId: rawId, malId: rawId, title });
                targetSlug = mapInfo.slug;
            }

            const category = lang === 'dub' ? 'DUB' : 'SUB';
            const epId = `ep-${epNum}`;
            const streamResult = await resolveEpisodeStream(targetSlug, epId, { category, proxyBase });

            // Format compatible with Anigo2 useStreamFetch hook
            const anigoFormatted = {
                "embed": {
                    "streams": streamResult.streams.map(s => ({
                        "url": s.url,
                        "type": s.type || "hls",
                        "server": s.server,
                        "priority": s.priority || 1
                    })),
                    "subtitles": streamResult.subtitles || [],
                    "animeSlug": targetSlug,
                    "episode": epNum,
                    "lang": lang,
                    "provider": streamResult.provider || "embed-resolver",
                    ...(mapInfo ? { "mapping": mapInfo } : {})
                }
            };

            return sendJson(res, 200, anigoFormatted);
        }

        // 5. Anime Details fallback (/api/anime/:slug)
        if (pathname.startsWith('/api/anime/')) {
            const slug = pathname.replace('/api/anime/', '').split('/')[0];
            if (!slug) return sendJson(res, 400, { error: 'Missing anime slug' });
            const data = await getAnimeDetails(slug);
            return sendJson(res, 200, data);
        }

        // 6. Universal Embed Resolver: /api/resolve?url=...
        if (pathname === '/api/resolve') {
            const targetUrl = parsed.searchParams.get('url');
            if (!targetUrl) return sendJson(res, 400, { error: 'Missing ?url= parameter' });
            const data = await resolveStream(targetUrl, { proxyBase });
            return sendJson(res, 200, data);
        }

        // 7. Direct Provider Endpoints
        if (pathname.startsWith('/api/bibiemb/')) {
            const id = pathname.replace('/api/bibiemb/', '').split('/')[0];
            if (!id) return sendJson(res, 400, { error: 'Missing BibiEmb ID' });
            const data = await resolveBibiemb(id, { proxyBase });
            return sendJson(res, 200, data);
        }

        if (pathname.startsWith('/api/otakuhg/')) {
            const code = pathname.replace('/api/otakuhg/', '').split('/')[0];
            if (!code) return sendJson(res, 400, { error: 'Missing OtakuHG code' });
            const data = await resolveOtakuhg(code, { proxyBase });
            return sendJson(res, 200, data);
        }

        if (pathname.startsWith('/api/otakuvid/')) {
            const code = pathname.replace('/api/otakuvid/', '').split('/')[0];
            if (!code) return sendJson(res, 400, { error: 'Missing OtakuVid code' });
            const data = await resolveOtakuVid(code, { proxyBase });
            return sendJson(res, 200, data);
        }

        // 8. Smart CORS Stream Proxy: /api/proxy?url=...
        if (pathname === '/api/proxy') {
            const streamUrl = parsed.searchParams.get('url');
            if (!streamUrl) return sendJson(res, 400, { error: 'Missing ?url= parameter' });

            if (isPlaylistUrl(streamUrl)) {
                return handleM3u8Proxy(streamUrl, proxyBase, req, res);
            } else {
                return handleChunkProxy(streamUrl, req, res);
            }
        }

        // 9. Orphaned relative request handler (e.g. video player requesting /api/index-v1-a1.txt or /api/seg-1.woff2)
        if (pathname.startsWith('/api/') && lastKnownProxyDir) {
            const relPath = pathname.replace(/^\/api\//, '');
            try {
                const targetUrl = new URL(relPath, lastKnownProxyDir).toString();
                if (isPlaylistUrl(targetUrl)) {
                    return handleM3u8Proxy(targetUrl, proxyBase, req, res);
                } else {
                    return handleChunkProxy(targetUrl, req, res);
                }
            } catch (e) {
                // fall through to 404
            }
        }

        return sendJson(res, 404, { error: 'Route not found' });
    } catch (err) {
        return sendJson(res, 500, { error: err.message || 'Internal Server Error' });
    }
});

server.listen(PORT, () => {
    console.log('⚡ Embed Resolvers & Anime Explorer running at http://localhost:' + PORT + '/');
});
