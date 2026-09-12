/**
 * EPHEMERAL EMBED TICKET & ANTI-SCRAPING CRYPTO ENGINE (V2 HARDENED)
 * Cryptographically binds embed page sessions to API stream resolutions.
 * Blocks all external scrapers, spoofed Referers, residential proxy leeches,
 * 2-step automated HTTP bots, and Cloudflare distributed multi-edge replay attacks.
 * 100% Native Web Crypto API (Works in Cloudflare Workers & Node.js 18+)
 */

const DEFAULT_SECRET = "anixo_edge_shield_secure_ticket_key_2026_v2";
const TICKET_TTL_SECONDS = 120; // 2 minutes to initiate playback

// In-memory replay cache (nonce -> expiry timestamp) for ultra-fast single-isolate hits
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
 * Splits ticket into dynamic fragments to prevent static regex extraction from HTML
 */
export function fragmentTicket(ticket) {
    if (!ticket || typeof ticket !== "string") {
        return { fragA: "", fragB: "", seed: 0 };
    }
    const mid = Math.floor(ticket.length / 2);
    const fragA = ticket.slice(0, mid);
    const rawB = ticket.slice(mid);
    
    // Obfuscate fragB with a dynamic byte shift
    const seed = (Date.now() % 25) + 1;
    let encB = "";
    for (let i = 0; i < rawB.length; i++) {
        encB += String.fromCharCode(rawB.charCodeAt(i) ^ seed);
    }
    const fragB = btoa(encB);

    return { fragA, fragB, seed };
}

/**
 * Validate ticket authenticity, expiration, target match, IP binding,
 * and enforce Global Single-Use Nonce across all Cloudflare edge nodes.
 */
export async function verifyEmbedTicket(ticketStr, {
    ip = "",
    id = "",
    idType = "ani",
    episode = 1,
    secret = DEFAULT_SECRET,
    kv = null,
    ctx = null
}) {
    if (!ticketStr || typeof ticketStr !== "string") {
        return { valid: false, error: "Missing required embed playback ticket (X-Embed-Ticket)" };
    }

    try {
        let raw = "";
        try {
            let base64 = ticketStr.replace(/-/g, "+").replace(/_/g, "/");
            while (base64.length % 4) base64 += "=";
            raw = atob(base64);
        } catch {
            return { valid: false, error: "Malformed embed ticket encoding" };
        }

        const parts = raw.split(":");
        if (parts.length !== 7) {
            return { valid: false, error: "Invalid embed ticket structure" };
        }

        const [tIpH, tIdType, tId, tEp, tExp, tNonce, tSig] = parts;
        const payload = `${tIpH}:${tIdType}:${tId}:${tEp}:${tExp}:${tNonce}`;
        const expNum = parseInt(tExp, 10);
        const now = Math.floor(Date.now() / 1000);

        // 1. Check expiration
        if (isNaN(expNum) || expNum < now) {
            return { valid: false, error: "Embed playback ticket has expired. Reload the player." };
        }

        // 2. Verify HMAC signature
        const key = await getHmacKey(secret);
        const enc = new TextEncoder();
        const expectedSigBuf = fromBase64Url(tSig);
        const isValidSig = await crypto.subtle.verify("HMAC", key, expectedSigBuf, enc.encode(payload));
        if (!isValidSig) {
            return { valid: false, error: "Cryptographic signature validation failed on embed ticket" };
        }

        // 3. Client IP Match Check
        const currentIpH = hashIp(ip);
        if (tIpH !== currentIpH) {
            return { valid: false, error: "Client IP mismatch. Ticket cannot be transferred across proxy or networks." };
        }

        // 4. Target Anime & Episode Match Check
        if (String(tId) !== String(id) || parseInt(tEp, 10) !== parseInt(episode, 10)) {
            return { valid: false, error: "Ticket does not match requested anime episode" };
        }

        // 5. Anti-Replay Nonce Check (In-memory isolate fast cache)
        if (usedNonces.size > 2000) cleanExpiredNonces();
        if (usedNonces.has(tNonce)) {
            return { valid: false, error: "Ticket replay detected. Tickets are single-use per episode resolution." };
        }
        usedNonces.set(tNonce, expNum);

        // 6. Global Cloudflare KV Anti-Replay Check (Across all worldwide edge data centers)
        if (kv) {
            const kvKey = `ticket:nonce:${tNonce}`;
            try {
                const isUsed = await kv.get(kvKey);
                if (isUsed) {
                    return { valid: false, error: "Ticket replay detected (Global KV). Single-use only." };
                }
                const ttl = Math.max(60, expNum - now + 60);
                if (ctx && typeof ctx.waitUntil === "function") {
                    ctx.waitUntil(kv.put(kvKey, "1", { expirationTtl: ttl }).catch(() => {}));
                } else {
                    await kv.put(kvKey, "1", { expirationTtl: ttl }).catch(() => {});
                }
            } catch (kvErr) {
                console.warn("[Ticket] KV replay check warning:", kvErr.message);
            }
        }

        return { valid: true };
    } catch (e) {
        return { valid: false, error: `Ticket verification exception: ${e.message}` };
    }
}

/**
 * Checks if incoming request is from a known scraper library or bot
 */
export function isBotRequest(request) {
    const ua = (request.headers.get("user-agent") || "").toLowerCase();
    if (!ua) return true; // Missing UA is almost always a scraper script

    const botSignatures = [
        "python", "requests", "aiohttp", "urllib", "curl", "wget",
        "httpclient", "axios", "node-fetch", "postman", "go-http-client",
        "scrapy", "headlesschrome", "phantomjs", "selenium", "playwright", "puppeteer"
    ];

    for (const sig of botSignatures) {
        if (ua.includes(sig)) return true;
    }

    // Direct embed requests without HTML Accept headers
    const accept = request.headers.get("accept") || "";
    const url = new URL(request.url);
    if (url.pathname.startsWith("/embed/") && !accept.includes("text/html") && !accept.includes("*/*")) {
        return true;
    }

    return false;
}
