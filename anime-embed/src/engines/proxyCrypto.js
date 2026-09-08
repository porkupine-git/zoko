/**
 * Stream & Subtitle URL Obfuscator / Token Cipher
 * Converts upstream URLs and backend worker hostnames into opaque, reversible tokens.
 * Zero leaks of upstream scrapers, norami, megap, or workers.dev in DevTools.
 */

const CIPHER_KEY = 0x5a;

export const SCRAPER_NOTICE_TEXT = "This is a scraper relay for megaplay.buzz and anikototv. There is no benefit in scraping this proxy — scrape the original sources (megaplay.buzz / anikototv) directly, they will be much faster.";
export const SCRAPER_NOTICE_HEADER = "Relayed proxy from megaplay.buzz & anikototv. Scraping this proxy is pointless and slow - scrape original sources directly.";

export function encryptStreamToken(str) {
    if (!str) return "";
    const bytes = new TextEncoder().encode(str);
    const xor = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        xor[i] = bytes[i] ^ ((CIPHER_KEY + (i % 31)) & 0xff);
    }
    let binary = "";
    for (let i = 0; i < xor.length; i++) {
        binary += String.fromCharCode(xor[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decryptStreamToken(token) {
    try {
        if (!token) return null;
        let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i) ^ ((CIPHER_KEY + (i % 31)) & 0xff);
        }
        return new TextDecoder().decode(bytes);
    } catch (e) {
        return null;
    }
}

export function maskStreamResult(result, baseUrl) {
    if (!result) return result;
    const masked = { ...result };
    if (result.streamUrl) {
        masked.streamUrl = `${baseUrl}/api/stream/m3u8?t=${encryptStreamToken(result.streamUrl)}`;
    }
    if (Array.isArray(result.subtitles)) {
        masked.subtitles = result.subtitles.map(s => ({
            ...s,
            url: s.url ? `${baseUrl}/api/stream/vtt?t=${encryptStreamToken(s.url)}` : s.url
        }));
    }
    if (Array.isArray(result.fallbackStreams)) {
        masked.fallbackStreams = result.fallbackStreams.map(u => `${baseUrl}/api/stream/m3u8?t=${encryptStreamToken(u)}`);
    }
    masked.notice = SCRAPER_NOTICE_TEXT;
    delete masked.rawStreamUrl;
    return masked;
}
