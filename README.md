# ⚡ Zoko - Universal Anime Scraper & Streaming Engine

A high-performance reverse-engineered anime streaming and scraping engine built with **100% Pure Node.js & Express.js** (zero Python, zero external scraper dependencies).

Ready for 1-click cloud deployment on **Render, Railway, Koyeb, Docker, or any PaaS**.

---

## 🚀 Deploy to Render in 1 Click

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Zayrix-bit/zoko)

### Manual Render Setup:
1. Go to [Render Dashboard](https://dashboard.render.com/) -> **New Web Service**.
2. Connect your GitHub repository: `https://github.com/Zayrix-bit/zoko`.
3. Configure service:
   - **Runtime**: `Node`
   - **Build Command**: `npm install --omit=dev`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
4. Add Environment Variables:
   - `NODE_VERSION`: `22.12.0`
   - `HOST`: `0.0.0.0`
   - `RATE_LIMIT_MAX`: `300`
   - `CACHE_TTL_MS`: `300000`
5. Click **Create Web Service**! Render will automatically build and provide your free HTTPS API URL (e.g. `https://zoko-anime-api.onrender.com`).

---

## 🌟 Key Features

- ⚡ **Pure Node.js / Express 5:** Zero Python, zero external scraper daemons. Lightweight memory footprint (~40 MB).
- 🔓 **Reverse-Engineered Stream Decryption:** XOR cipher deobfuscation (`otaku-embed-v1`) extracting master HLS playlists, multi-language subtitles (`.vtt`), and auto-skip intro/outro timestamps.
- 🛡️ **Zero-CORS HLS Proxy:** Rewrites master & variant playlists on the fly with `Access-Control-Allow-Origin: *` to bypass upstream CORS and 403 hotlink blocks.
- ⚡ **Zero-Copy Video Piping:** Video TS chunks stream directly from upstream CDN to browser with HTTP Range 206 partial content support.
- 📦 **Pure Streaming API for Any Frontend:** Works seamlessly with custom frontends powered by AniList or MyAnimeList (MAL).
- 🎬 **Drop-in Embed Route (`/embed`):** Iframe support for embedding directly into any external website or mobile webview.
- 📖 **Interactive Swagger UI & Playground:** OpenAPI 3.0 specs available at `/docs` and interactive playground at `/api-demo.html`.

---

## 📋 Pure Streaming API Reference

Use these endpoints in your custom frontend (React, Next.js, Vue, Flutter, React Native, iOS, Android):

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/stream?id={id}&ep={ep}&track={sub\|dub}` | Universal stream link (AniList ID or MAL ID) |
| `GET` | `/api/stream/:id/:ep` | Clean REST route (e.g. `/api/stream/21/1`) |
| `GET` | `/embed?id={id}&ep={ep}&track={sub\|dub}` | Drop-in responsive ArtPlayer iframe |
| `GET` | `/api/search?q={query}` | Search 11,449+ anime titles (0ms SQLite cache) |
| `GET` | `/api/anime/{id}` | Full metadata, synopsis, and all episodes |
| `GET` | `/health` | Server status and healthcheck |
| `GET` | `/api` | Interactive API Directory (JSON) |
| `GET` | `/docs` | Interactive Swagger OpenAPI Specs |

### 💡 Example: Stream Extraction from an AniList Frontend
```javascript
// Example in React / Next.js / Vanilla JS:
const res = await fetch('https://your-app.onrender.com/api/stream?id=21&ep=1&track=sub');
const data = await res.json();

console.log(data.stream_url); // Pass directly to Hls.js / Video.js / ArtPlayer
console.log(data.subtitles);  // VTT English Subtitles
console.log(data.skip.intro); // { start: 31, end: 111 }
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` (or dynamic in Render) | Server listen port |
| `HOST` | `0.0.0.0` | Network binding interface |
| `RATE_LIMIT_MAX` | `300` | Max requests per minute per IP |
| `CACHE_TTL_MS` | `300000` | In-memory cache TTL in milliseconds (5 min) |
| `CACHE_MAX_ITEMS` | `5000` | Max entries in memory cache |
| `ZOKO_BASE_URL` | `https://zokoanime.video` | Upstream streaming target base URL |
| `ANILIST_GRAPHQL_ENDPOINT` | `https://graphql.anilist.co` | AniList metadata GraphQL API endpoint |

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run locally
npm run dev

# 3. Run automated test suite
npm test
```

- 🌐 **Web Player:** `http://localhost:3000/`
- 🧪 **API Playground:** `http://localhost:3000/api-demo.html`
- 📖 **Swagger API Docs:** `http://localhost:3000/docs`

---

## 🐳 Docker & Container Deployment

```bash
docker compose up -d --build
```
Or run directly:
```bash
docker build -t zoko-anime-api .
docker run -p 3000:3000 zoko-anime-api
```

---

## 📄 License
MIT License.
