# ⚡ Embed Stream Resolvers (bibiemb.xyz, otakuhg.site & otakuvid.online)

Reverse-engineered stream extractors for:
1. **bibiemb.xyz** (VibePlayer HLS Engine)
2. **otakuhg.site** (StreamHG / SibSoft XFS Engine with Dean Edwards Unpacker)
3. **otakuvid.online** (VidHide / Multi-CDN HLS Engine with Open CORS)

---

## 🔍 Reverse Engineering Analysis

### 1. `bibiemb.xyz` (VibePlayer)
- **Target URL Structure**: `https://bibiemb.xyz/{16_character_id}` (e.g. `https://bibiemb.xyz/agf104ba92b0cd9d7cdfd4559934189a6f4h`)
- **Backend Architecture**: Nginx + Cloudflare proxying VibePlayer HLS streams.
- **Player Setup**: Embedded JWPlayer 8 with custom Netflix UI.
- **Stream Generation**:
  - Direct Master Playlist: `https://bibiemb.xyz/public/stream/{id}/master.m3u8`
  - Upstream VibePlayer: `https://vibeplayer.site/public/stream/{id}/master.m3u8`
  - Thumbnail Poster: `https://bibiemb.xyz/public/thumb/{id}_1.jpg`
  - Captions/VTT: Extracted from `subtitle` variable and `tracks` array.

### 2. `otakuhg.site` (StreamHG)
- **Target URL Structure**:
  - Embed Player: `https://otakuhg.site/e/{file_code}` (8-16 chars)
  - Direct Watch: `https://otakuhg.site/{file_code}`
  - Download Portal: `https://otakuhg.site/d/{file_code}`
- **Backend Architecture**: Apache + PHP + XFileSharing (XFS) engine behind Cloudflare.
- **Obfuscation**: Video sources are encrypted using **Dean Edwards P.A.C.K.E.R.** (`eval(function(p,a,c,k,e,d)...)`).
- **Resolver Logic**:
  - Automatically fetches embed HTML.
  - Detects if video expired or was deleted.
  - Automatically unpacks obfuscated javascript to uncover raw HLS `.m3u8` and MP4 video links across multiple CDNs (TikTok CDN disguised chunks, SolutionPortal CDN, Centaurus CDN).

### 3. `otakuvid.online` (VidHide)
- **Target URL Structure**:
  - Embed Player: `https://otakuvid.online/embed/{file_code}` (e.g. `7vabw41b15ht`)
  - Direct Watch: `https://otakuvid.online/{file_code}`
  - Download Portal: `https://otakuvid.online/d/{file_code}`
- **Backend Architecture**: VidHide / SibSoft XFS architecture.
- **Resolver Logic**:
  - Unpacks obfuscated Dean Edwards script.
  - Extracts multi-CDN master playlists:
    - **HLS2**: Direct open-CORS 1080p multi-quality master stream on `acek-cdn.com`.
    - **HLS4**: OtakuVid Edge stream.
    - **HLS3**: SolutionPortal CDN stream (`historydocumentary.site`).

---

## 🚀 Quick Start

### 1. Run Local API Server
```bash
node server.js
```
The server runs on **http://localhost:3000** with an interactive **ArtPlayer** Web Playground!

### 2. Run Test Suite
```bash
node test.js
```

---

## 📡 API Endpoints

### 1. 🔍 Anime Search & Catalog
```http
# Search any anime by title
GET /api/anime/search?q=Solo Leveling
GET /api/anime/search?q=One Piece

# Get full episode list for an anime
GET /api/anime/:slug/episodes
Example: GET /api/anime/solo-leveling-season-2-arise-from-the-shadow/episodes

# Get all streaming servers (SUB, DUB, RAW) for an episode
GET /api/anime/:slug/servers/:epId
Example: GET /api/anime/solo-leveling-season-2-arise-from-the-shadow/servers/ep-1

# Auto-resolve playable HLS stream for an episode (ready for ArtPlayer or Anigo2)
GET /api/anime/:slug/watch/:epId?category=SUB
Example: GET /api/anime/solo-leveling-season-2-arise-from-the-shadow/watch/ep-1?category=SUB

# 🔗 AniList & Jikan (MAL) Mapping Engine
GET /api/map?anilistId=151807
GET /api/map?malId=54595
GET /api/map?title=Solo Leveling

# 🎬 Universal Anigo2 Drop-in Watch Route (accepts AniList ID, MAL ID, or Slug!)
GET /api/watch/:id/:lang/:ep
Examples:
- GET /api/watch/151807/sub/1   (Solo Leveling via AniList ID)
- GET /api/watch/21/sub/1       (One Piece via AniList ID 21)
- GET /api/watch/1735/sub/1     (Naruto Shippuden via AniList ID)
```

### 2. Universal Stream Resolver
```http
GET /api/resolve?url=https://otakuvid.online/embed/7vabw41b15ht
GET /api/resolve?url=https://bibiemb.xyz/agf104ba92b0cd9d7cdfd4559934189a6f4h
GET /api/resolve?url=https://otakuhg.site/e/i0ehyeq33i6k
```

### 3. Provider-Specific Endpoints
```http
GET /api/otakuvid/:file_code
GET /api/bibiemb/:id
GET /api/otakuhg/:file_code
```

### 4. Stream Proxy with Full CORS
```http
GET /api/proxy?url=<raw_m3u8_or_ts_url>
```

---

## ☁️ Cloudflare Worker Deployment

A ready-to-deploy `worker.js` is included in this directory.
To deploy to your Cloudflare account:
```bash
npx wrangler deploy worker.js --name embed-resolvers
```
