# AnimeSky Scraper & AS-CDN HLS Streaming Worker

A dedicated, standalone Cloudflare Worker for scraping AnimeSky (`animesky.app`), fetching rich metadata from AniZip/Kitsu/AniList, resolving AS-CDN video streams, and proxying HLS streams with Hindi Dub as default.

---

## 🚀 How to Deploy

From inside this directory (`animesky-worker`):

```bash
cd animesky-worker
npx wrangler deploy
```

Once deployed, Cloudflare will output your live Worker URL (e.g., `https://animesky-api.<your-account>.workers.dev`).

---

## 📡 Available Endpoints

### 1. Catalog & Anime Search
```http
GET /api/search?q=Naruto
```

### 2. Series & Seasons Scraper
```http
GET /api/series?url=https://animesky.app/series/naruto-shippuden/&season=1
```
Or search by name:
```http
GET /api/series?url=Solo%20Leveling&season=2
```

### 3. Season AJAX Episodes
```http
GET /api/series/season?postId=1234&season=2&title=Solo%20Leveling&offset=12
```

### 4. Episode & Server Stream Resolver
```http
GET /api/watch?url=https://animesky.app/episode/naruto-shippuden-1x1/
```

### 5. Master M3U8 Playlist (With Hindi Dub Default Auto-Selected)
```http
GET /api/stream/:hash/master.m3u8?host=as-cdn26.top&ref=https://animesky.app/
```

### 6. Universal HLS & Chunk Proxy (Full CORS)
```http
GET /api/proxy?url=<encoded_upstream_url>
```
