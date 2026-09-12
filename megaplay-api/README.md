# MegaPlay.buzz & Anikoto Reverse-Engineered API

Complete reverse-engineered API, scraper SDK, and standalone microservice for **MegaPlay.buzz** and **Anikoto** (`anikotoapi.site`).

Extract direct **HLS master playlists (`.m3u8`)**, **VTT subtitles**, and **skip timestamps** directly without needing ad-filled iframe embeds.

---

## 🔍 How MegaPlay Works (Reverse-Engineering Breakdown)

### 1. The Embed Structure
When an iframe URL is requested:
- `https://megaplay.buzz/stream/mal/{mal-id}/{ep-num}/{sub|dub}`
- `https://megaplay.buzz/stream/ani/{ani-id}/{ep-num}/{sub|dub}`
- `https://megaplay.buzz/stream/s-2/{catalog-ep-id}/{sub|dub}`

MegaPlay renders an HTML container with custom data attributes:
```html
<div class="form-area" id="megaplay-player"
    data-id="36396"
    data-realid="2142"
    data-mediaid="1774"
    data-fileversion="0">
</div>
```

### 2. The Internal Endpoint (`/stream/getSourcesNew`)
MegaPlay's internal player script (`newclient.min.js`) extracts `data-id` and makes an asynchronous XMLHttpRequest:
```http
GET https://megaplay.buzz/stream/getSourcesNew?id=36396&s=tcdn
Headers:
  X-Requested-With: XMLHttpRequest
  Referer: https://megaplay.buzz/stream/...
```
CDN server query param:
- `?id=36396&s=tcdn` -> routes to `megap.mikora.top` (Active CDN)
- `?id=36396` -> routes to `fetch.nexabloom.top` (Blocked / 403)

### 3. Decrypting the AES Payload
MegaPlay encrypts the master stream URL inside the `enc` field using **AES-CBC**:
- **AES Key:** `i?LMTAx0Q6,:}50U` (padded to 32 bytes)
- **AES IV:** `W0;27ToaUpl_P%'c` (16 bytes)
- **Format:** Base64URL ciphertext -> JSON `{"file":"https://megap.mikora.top/.../master.m3u8"}`

### 4. Segment Header Stripping (252 Bytes)
Video segments hosted on TikTok CDN (`p19-ad-site-sign-sg.tiktokcdn.com`, `ibyteimg.com`) have an obfuscated 252-byte PNG dummy header prepended.
- The player / proxy strips the first 252 bytes (`buffer.slice(252)`).
- The resulting stream is standard MPEG-TS starting with the `0x47` sync byte at offset 0.

### 5. Anikoto Catalog API (`anikotoapi.site`)
MegaPlay shares its underlying database with Anikoto:
- **Recent Anime:** `GET https://anikotoapi.site/recent-anime?page=1&per_page=20`
- **Series & Episodes:** `GET https://anikotoapi.site/series/{seriesId}`
  - Returns `episode_embed_id` (matches legacy HiAnime/AniWatch `?ep=` catalog IDs) used in `/stream/s-2/{id}/{lang}`.

---

## 🚀 Getting Started

### 1. Run Automated Test Suite
```bash
cd megaplay-api
node test.js
```

### 2. Start the Standalone API Server
```bash
node server.js
```
The server starts on port `4004` (or `process.env.PORT`).

---

## 📡 API Endpoints

### 1. Extract Stream by MAL ID
```http
GET http://localhost:4004/api/stream/mal/:malId/:ep/:track
```
**Example:** `http://localhost:4004/api/stream/mal/21/1/sub`

### 2. Extract Stream by AniList ID
```http
GET http://localhost:4004/api/stream/ani/:aniId/:ep/:track
```
**Example:** `http://localhost:4004/api/stream/ani/21/1/sub`

### 3. Extract Stream by Catalog Episode ID
```http
GET http://localhost:4004/api/stream/catalog/:epId/:track
```
**Example:** `http://localhost:4004/api/stream/catalog/2142/sub`

### 4. Direct Embed URL Resolver
```http
GET http://localhost:4004/api/stream/resolve?url=https://megaplay.buzz/stream/s-2/2142/sub
```

### 5. Catalog Recent Releases
```http
GET http://localhost:4004/api/catalog/recent?page=1&per_page=20
```

### 6. Catalog Series Details & Episode List
```http
GET http://localhost:4004/api/catalog/series/8935
```

---

## 📦 Using as a JavaScript Module / SDK

```javascript
import megaplay from './megaplay.js';

// Resolve from MAL
const stream = await megaplay.resolveFromMal(21, 1, 'sub');
console.log('Direct HLS Stream:', stream.stream_url);
console.log('Subtitles:', stream.subtitles);
console.log('Intro Skip:', stream.intro);

// Resolve with specific CDN
const cdnStream = await megaplay.resolveFromMal(21, 1, 'sub', 'tcdn');

// Browse recent releases
const recent = await megaplay.getRecentAnime(1, 20);
```
