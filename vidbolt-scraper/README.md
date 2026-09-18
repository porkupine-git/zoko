# ⚡ VidBolt Scraper

High-performance video stream scraper reverse-engineered from VidBolt. Extracts direct adaptive HLS (`.m3u8`) playlists, multi-audio language tracks (English, Hindi, French, Spanish, Arabic, etc.), and WebVTT (`.vtt`) subtitles for any Movie or TV series.

---

## 🚀 Features

- **No API Keys Required:** Uses open reverse-engineered endpoints.
- **Ultra-Fast Latency (~500ms):** Prioritizes low-latency FastVa/Nexus cluster.
- **1080p Multi-Audio Streams:** MovieBoxV2 provider with up to 50+ streams per title.
- **Hindi & Regional Dubs:** Saffron provider for Indian and Hollywood Hindi-dubbed content.
- **Comprehensive Subtitles:** VDRK subtitle provider returning 30–90+ language tracks (`.vtt`).
- **Zero External Dependencies:** Built on native Node.js (Node 18+).

---

## 📁 Directory Structure

```
vidbolt-scraper/
├── index.js        # Core library exports (getStreams, scrapeFastVa, etc.)
├── server.js       # Standalone microservice REST API (zero dependencies)
├── test.js         # Automated test runner
├── package.json    # Package configuration
└── README.md       # Documentation
```

---

## 🛠️ Usage

### 1. Library Import (In your app or Next.js API route)

```javascript
const { getStreams } = require('./vidbolt-scraper');

// Scrape Movie
const movie = await getStreams({
    type: 'movie',
    tmdbId: 550,            // e.g. Fight Club
    title: 'Fight Club',    // optional, improves matching
    year: 1999              // optional
});

console.log(movie.sources);   // Array of { server, url, quality, type, language }
console.log(movie.subtitles); // Array of { label, url }

// Scrape TV Series Episode
const tv = await getStreams({
    type: 'tv',
    tmdbId: 1396,           // e.g. Breaking Bad
    season: 1,
    episode: 1,
    title: 'Breaking Bad',
    year: 2008
});
```

---

### 2. Standalone API Server

Start the microservice:

```bash
cd vidbolt-scraper
npm start
# or: node server.js
```

Server runs at `http://localhost:3001` with endpoints:

- **Movie Stream:**
  `GET http://localhost:3001/api/stream?id=550&type=movie&title=Fight+Club`
- **TV Show Stream:**
  `GET http://localhost:3001/api/stream?id=1396&type=tv&season=1&episode=1&title=Breaking+Bad`
- **Health Check:**
  `GET http://localhost:3001/health`

---

### 3. Run Tests

```bash
cd vidbolt-scraper
npm test
```

---

## 📦 Output Data Structure

```json
{
  "success": true,
  "media": {
    "type": "movie",
    "tmdbId": "550",
    "title": "Fight Club",
    "year": "1999"
  },
  "durationMs": 925,
  "totalSources": 49,
  "totalSubtitles": 43,
  "sources": [
    {
      "server": "FastVa (Moscow)",
      "provider": "fastva",
      "url": "https://scraper.vidbolt.xyz/proxy/m3u8/...",
      "quality": "Auto",
      "type": "m3u8",
      "language": "Original",
      "priority": 1
    },
    {
      "server": "MovieBoxV2 (English)",
      "provider": "moviebox",
      "url": "https://dash-hls-bridge...workers.dev/?url=...",
      "quality": "1080p",
      "type": "m3u8",
      "language": "Original",
      "priority": 2
    }
  ],
  "subtitles": [
    {
      "label": "English",
      "url": "https://cache.vdrk.site/v1/vtt/movie/550/English.vtt",
      "kind": "captions"
    }
  ]
}
```

---

## 🛡️ License

MIT
