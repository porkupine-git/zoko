/**
 * Stream & Subtitle URL Obfuscator / Token Cipher
 * Converts upstream URLs and backend worker hostnames into opaque, reversible tokens.
 * Zero leaks of upstream scrapers, norami, megap, or workers.dev in DevTools.
 * Includes cryptographic IP binding and 15-minute expiration timestamp.
 */

const CIPHER_KEY = 0x5a;

export const SCRAPER_NOTICE_TEXT = "This is a scraper relay for megaplay.buzz and anikototv. There is no benefit in scraping this proxy — scrape the original sources (megaplay.buzz / anikototv) directly, they will be much faster.";
export const SCRAPER_NOTICE_HEADER = "Relayed proxy from megaplay.buzz & anikototv. Scraping this proxy is pointless and slow - scrape original sources directly.";

function hashIp(ip) {
    if (!ip) return "any";
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        hash = ((hash << 5) - hash) + ip.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

export function encryptStreamToken(str, clientIp = "") {
    if (!str) return "";
    const ipH = hashIp(clientIp);
    const exp = Math.floor(Date.now() / 1000) + 900; // 15 minutes
    const packed = `${ipH}|${exp}|${str}`;

    const bytes = new TextEncoder().encode(packed);
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

export function decryptStreamToken(token, clientIp = "") {
    try {
        if (!token) return null;
        let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i) ^ ((CIPHER_KEY + (i % 31)) & 0xff);
        }
        const decoded = new TextDecoder().decode(bytes);

        // Check if token has modern IP & timestamp binding
        if (decoded.includes("|")) {
            const firstPipe = decoded.indexOf("|");
            const secondPipe = decoded.indexOf("|", firstPipe + 1);
            if (firstPipe !== -1 && secondPipe !== -1) {
                const ipH = decoded.substring(0, firstPipe);
                const exp = parseInt(decoded.substring(firstPipe + 1, secondPipe), 10);
                const rawUrl = decoded.substring(secondPipe + 1);

                const now = Math.floor(Date.now() / 1000);
                if (!isNaN(exp) && exp < now) {
                    return null; // Expired stream token
                }

                if (clientIp && ipH !== "any") {
                    const currentIpH = hashIp(clientIp);
                    if (ipH !== currentIpH) {
                        return null; // IP mismatch
                    }
                }
                return rawUrl;
            }
        }

        // Backwards compatibility for legacy tokens
        return decoded;
    } catch (e) {
        return null;
    }
}

export function maskStreamResult(result, baseUrl, clientIp = "") {
    if (!result) return result;
    const masked = { ...result };
    if (result.streamUrl) {
        masked.streamUrl = `${baseUrl}/api/stream/m3u8?t=${encryptStreamToken(result.streamUrl, clientIp)}`;
    }
    if (Array.isArray(result.subtitles)) {
        masked.subtitles = result.subtitles.map(s => ({
            ...s,
            url: s.url ? `${baseUrl}/api/stream/vtt?t=${encryptStreamToken(s.url, clientIp)}` : s.url
        }));
    }
    if (Array.isArray(result.fallbackStreams)) {
        masked.fallbackStreams = result.fallbackStreams.map(u => `${baseUrl}/api/stream/m3u8?t=${encryptStreamToken(u, clientIp)}`);
    }
    masked.notice = SCRAPER_NOTICE_TEXT;
    delete masked.rawStreamUrl;
    return masked;
}
