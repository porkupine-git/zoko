# 🌟 AnimeHub • Unified Multi-Platform Anime Streaming Portal

Ultra-modern, glassmorphic anime streaming application and reverse-engineered scraper that unifies:
1. ☁️ **[AnimeSky](https://animesky.app/)**
2. 🌍 **[WatchAnimeWorld](https://watchanimeworld.pro/)**
3. 🧂 **[AnimeSalt](https://animesalt.ro/)**

And their proprietary video streaming engines:
- **`as-cdn26.top` (FirePlayer)**: 1080p, 720p, 480p, 360p HLS streams with Multi-Audio (**Hindi, English, Tamil, Telugu, Malayalam, Japanese**).
- **MegaPlay (`vid.megaplay.su`)**: Direct HLS streams with Hindi/Tamil/Telugu dubs.

---

## 🚀 Live Frontend Application

Visit in your web browser:
```
http://localhost:5050/
```

### ✨ Frontend Features
- **Universal Smart URL Input**: Paste ANY series or episode URL from AnimeSky, WatchAnimeWorld, or AnimeSalt — it automatically detects the platform!
- **Interactive Series Episode Drawer**: Displays interactive episode pills (Ep 1, Ep 2...) with live filter search.
- **Embedded Zero-Ads Player (ArtPlayer + HLS.js)**:
  - Multi-Audio Track switcher (`हिन्दी`, `English`, `Tamil`, `Telugu`, `Malayalam`, `Japanese`)
  - Quality selector (1080p, 720p, 480p, 360p, 240p)
  - Fullscreen, Picture-in-Picture, Playback Speed controls
- **One-Click Stream Sharing**:
  - `📋 Copy M3U8`: Copy direct stream URL to clipboard for VLC, MPV, or PotPlayer.
  - `🎬 Open VLC`: Direct launch trigger.
- **Trending Series Quick-Launchers**: Clickable cards for popular series across all 3 sites.

---

## 🛠️ Unified API Endpoints (Port 5050)

| Endpoint | Method | Description |
|---|---|---|
| `/` | `GET` | Web Application UI |
| `/health` | `GET` | Health status and supported platforms |
| `/api/presets` | `GET` | Trending series presets |
| `/api/series?url={seriesUrl}` | `GET` | Scrapes series info & all episodes |
| `/api/watch?url={episodeUrl}` | `GET` | Resolves episode to direct HLS master streams |
| `/api/stream/:hash/master.m3u8` | `GET` | Proxied AS-CDN HLS master playlist |
| `/api/proxy?url={url}` | `GET` | Proxies video chunks and variant playlists |

---

## 🏃 How to Run

```bash
cd c:\Users\Ritesh\Downloads\zoko\anime-portal
node server.js
```
The server will be active at `http://localhost:5050/`.
