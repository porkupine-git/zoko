/**
 * EPHEMERAL EMBED TICKET & ANTI-SCRAPING CRYPTO ENGINE
 * Cryptographically binds embed page sessions to API stream resolutions.
 * 100% Native Web Crypto API (Works in Cloudflare Workers & Node.js 18+)
 */

const DEFAULT_SECRET = "vidcloud_edge_shield_secure_ticket_key_2026";
const TICKET_TTL_SECONDS = 120; // 2 minutes to initiate playback

const usedNonces = new Map();

function cleanExpiredNonces() {
    const now = Math.floor(Date.now() / 1000);
    for (const [nonce, exp] of usedNonces.entries()) {
        if (exp <= now) {
            usedNonces.delete(nonce);
        }
    }
}

async function getHmacKey(secretStr) {
    const enc = new TextEncoder();
    return await crypto.subtle.importKey(
        "raw",
        enc.encode(secretStr || DEFAULT_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
}

export function hashIp(ip) {
    if (!ip) return "none";
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        hash = ((hash << 5) - hash) + ip.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

function toBase64Url(buf) {
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Generate a signed one-time playback ticket for an embed session
 */
export async function createEmbedTicket({
    ip = "",
    id = "",
    idType = "ani",
    episode = 1,
    secret = DEFAULT_SECRET,
    ttlSeconds = TICKET_TTL_SECONDS
}) {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + ttlSeconds;
    const ipH = hashIp(ip);
    const nonce = Math.random().toString(36).substring(2, 10);

    const payload = `${ipH}:${idType}:${id}:${episode}:${exp}:${nonce}`;
    const enc = new TextEncoder();
    const key = await getHmacKey(secret);
    const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const sig = toBase64Url(sigBuf);

    return btoa(`${payload}:${sig}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Splits ticket into dynamic fragments to prevent static regex scraping
 */
export function fragmentTicket(ticket) {
    if (!ticket || typeof ticket !== "string") {
        return { fragA: "", fragB: "", seed: 0 };
    }
    const mid = Math.floor(ticket.length / 2);
    const fragA = ticket.slice(0, mid);
    const rawB = ticket.slice(mid);
    
    const seed = Math.floor(Math.random() * 89) + 11;
    let encB = "";
    for (let i = 0; i < rawB.length; i++) {
        encB += String.fromCharCode(rawB.charCodeAt(i) ^ seed);
    }

    return {
        fragA,
        fragB: btoa(encB),
        seed
    };
}

/**
 * Verifies the validity and cryptographic signature of an embed ticket
 */
export async function verifyEmbedTicket(ticketString, {
    ip = "",
    id = "",
    idType = "ani",
    episode = 1,
    secret = DEFAULT_SECRET,
    kv = null,
    ctx = null
}) {
    if (!ticketString || typeof ticketString !== "string") {
        return { valid: false, error: "Missing playback session ticket" };
    }

    try {
        let decoded = "";
        try {
            decoded = atob(ticketString.replace(/-/g, "+").replace(/_/g, "/"));
        } catch {
            return { valid: false, error: "Malformed ticket encoding" };
        }

        const lastColon = decoded.lastIndexOf(":");
        if (lastColon === -1) {
            return { valid: false, error: "Corrupted ticket format" };
        }

        const payload = decoded.substring(0, lastColon);
        const sig = decoded.substring(lastColon + 1);

        const enc = new TextEncoder();
        const key = await getHmacKey(secret);
        const sigBytes = fromBase64Url(sig);

        const isSignatureValid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payload));
        if (!isSignatureValid) {
            return { valid: false, error: "Ticket signature forgery detected" };
        }

        const parts = payload.split(":");
        if (parts.length !== 6) {
            return { valid: false, error: "Invalid ticket payload structure" };
        }

        const [tIpH, tIdType, tId, tEp, tExpStr, tNonce] = parts;
        const exp = parseInt(tExpStr, 10);
        const now = Math.floor(Date.now() / 1000);

        if (isNaN(exp) || now > exp) {
            return { valid: false, error: "Playback ticket expired" };
        }

        if (id && String(id) !== String(tId)) {
            return { valid: false, error: "Ticket content ID mismatch" };
        }

        if (episode && parseInt(episode, 10) !== parseInt(tEp, 10)) {
            return { valid: false, error: "Ticket episode mismatch" };
        }

        // Anti-Replay Nonce Checking
        cleanExpiredNonces();
        if (usedNonces.has(tNonce)) {
            return { valid: false, error: "Replay attack detected: Ticket already consumed" };
        }

        if (kv) {
            try {
                const kvCheck = await kv.get(`nonce:${tNonce}`);
                if (kvCheck) {
                    return { valid: false, error: "Distributed replay attack: Ticket consumed on another edge" };
                }
                const ttl = Math.max(60, exp - now);
                if (ctx && typeof ctx.waitUntil === "function") {
                    ctx.waitUntil(kv.put(`nonce:${tNonce}`, "1", { expirationTtl: ttl }).catch(() => {}));
                } else {
                    await kv.put(`nonce:${tNonce}`, "1", { expirationTtl: ttl }).catch(() => {});
                }
            } catch (kvErr) {
                console.warn("Nonce KV error:", kvErr);
            }
        }

        usedNonces.set(tNonce, exp);
        return { valid: true, id: tId, idType: tIdType, episode: parseInt(tEp, 10) };

    } catch (err) {
        return { valid: false, error: `Ticket verification exception: ${err.message}` };
    }
}

/**
 * Checks if request is an automated bot/scraper
 */
export function isBotRequest(request) {
    const ua = (request.headers.get("User-Agent") || "").toLowerCase();
    const botKeywords = [
        "python-requests", "aiohttp", "urllib", "scrapy", "curl", "wget", "httpie",
        "puppeteer", "playwright", "selenium", "phantomjs", "headlesschrome",
        "postmanruntime", "insomnia", "axios", "node-fetch", "got", "superagent"
    ];
    for (const kw of botKeywords) {
        if (ua.includes(kw)) return true;
    }
    return false;
}
