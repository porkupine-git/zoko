/**
 * HONEYPOT & DECOY STREAM POISONING SYSTEM
 * State-of-the-art anti-scraping defense for VidCloud Anime Infrastructure.
 * 
 * Traps bots, headless automators, and python scrapers with a decoy HLS stream.
 */

import { encryptStreamToken, SCRAPER_NOTICE_TEXT, SCRAPER_NOTICE_HEADER } from './proxyCrypto.js';

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

export function isScraperRequest(request) {
    if (!request || !request.headers) return false;

    const ua = request.headers.get("User-Agent") || "";
    if (!ua || ua.trim().length === 0) {
        return true;
    }

    for (const pattern of SCRAPER_UA_PATTERNS) {
        if (pattern.test(ua)) {
            return true;
        }
    }

    const url = new URL(request.url);
    if (url.searchParams.get("_bot") === "1" || url.searchParams.get("_h") === "1") {
        return true;
    }

    return false;
}

export function getHoneypotStreamResponse(baseUrl) {
    const honeypotM3u8 = `${baseUrl}/api/stream/m3u8?t=${encryptStreamToken(DECOY_HLS_URL)}&h=1`;
    const honeypotVtt = `${baseUrl}/api/stream/vtt?h=1`;

    return {
        success: true,
        server: "Server 1 (VidCloud Core)",
        serverId: 1,
        streamUrl: honeypotM3u8,
        subtitles: [
            {
                url: honeypotVtt,
                label: "English",
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

export function getHoneypotVttContent() {
    return `WEBVTT
NOTE Notice: ${SCRAPER_NOTICE_TEXT}

00:00:01.000 --> 00:00:10.000
VidCloud Protection: Scraping this proxy stream is restricted.

00:00:10.500 --> 00:00:20.000
Please use the official VidCloud embed player at vidcloud.sbs.
`;
}
