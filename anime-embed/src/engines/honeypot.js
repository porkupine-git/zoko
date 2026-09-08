/**
 * HONEYPOT & DECOY STREAM POISONING SYSTEM
 * State-of-the-art anti-scraping defense for Anixo Anime Infrastructure.
 * 
 * Instead of 403 Forbidden (which alerts scrapers to adapt), this traps bots,
 * headless automators, and python scripts with a decoy HLS stream and warning subtitles.
 */

import { encryptStreamToken, SCRAPER_NOTICE_TEXT, SCRAPER_NOTICE_HEADER } from './proxyCrypto.js';

// List of known automated scraper / bot user-agent signatures
const SCRAPER_UA_PATTERNS = [
    /python/i,
    /requests/i,
    /aiohttp/i,
    /httpx/i,
    /scrapy/i,
    /curl\//i,
    /wget\//i,
    /yt-dlp/i,
    /youtube-dl/i,
    /postman/i,
    /node-fetch/i,
    /axios/i,
    /libwww/i,
    /pycurl/i,
    /java\//i,
    /apache-httpclient/i,
    /headlesschrome/i,
    /phantomjs/i,
    /selenium/i,
    /playwright/i,
    /puppeteer/i,
    /go-http-client/i
];

export const DECOY_HLS_URL = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

/**
 * Classify if an incoming request originates from an automated scraper or bot
 */
export function isScraperRequest(request) {
    if (!request || !request.headers) return false;

    const ua = request.headers.get("User-Agent") || "";
    if (!ua || ua.trim().length === 0) {
        return true; // No user agent at all
    }

    // Check against scraper patterns
    for (const pattern of SCRAPER_UA_PATTERNS) {
        if (pattern.test(ua)) {
            return true;
        }
    }

    const url = new URL(request.url);

    // Client-side bot detector signal (from playerClient)
    if (url.searchParams.get("_bot") === "1" || url.searchParams.get("_h") === "1") {
        return true;
    }

    return false;
}

/**
 * Generate a complete Honeypot Stream payload that mimics a real anime stream
 */
export function getHoneypotStreamResponse(baseUrl) {
    const honeypotM3u8 = `${baseUrl}/api/stream/m3u8?t=${encryptStreamToken(DECOY_HLS_URL)}&h=1`;
    const honeypotVtt = `${baseUrl}/api/stream/vtt?h=1`;

    return {
        success: true,
        server: "Server 1 (Sora Edge)",
        serverId: 1,
        streamUrl: honeypotM3u8,
        subtitles: [
            {
                url: honeypotVtt,
                label: "English [Warning]",
                default: true,
                kind: "captions"
            }
        ],
        intro: { start: 0, end: 0 },
        outro: { start: 0, end: 0 },
        notice: SCRAPER_NOTICE_TEXT,
        _hp: 1
    };
}

/**
 * Generates the Honeypot WebVTT Subtitle file that displays an on-screen warning
 * across the entire decoy video when played on the scraper's site/app.
 */
export function getHoneypotVttContent() {
    return `WEBVTT
NOTE Notice: ${SCRAPER_NOTICE_TEXT}

00:00:00.000 --> 00:05:00.000
<c.yellow><b>⚠️ NOTICE TO VIEWERS:</b></c>
This stream was scraped from an unauthorized proxy.
Please visit <u>https://anixo.buzz</u> to watch the real anime, or scrape megaplay.buzz directly!
`;
}
