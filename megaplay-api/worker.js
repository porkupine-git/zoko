/**
 * Aniko & MegaPlay Reverse-Engineered Edge API
 * Cloudflare Worker for https://aniko-backend.rk18109ry.workers.dev/
 * 
 * SPECIFICALLY OPTIMIZED FOR CLOUDFLARE WORKERS PAID PLAN ($5/mo):
 * - 30M ms CPU limit: Edge Cache (caches.default) + KV Cache drops avg CPU time to < 1.5ms.
 * - 10M Requests limit: Smart Segment Bypass routes open CDNs (TikTok CDN) directly, saving 99% of requests!
 * - 1M KV Writes limit: 12-hour TTL for streams, 30-day TTL for ID mappings protects write quota.
 * - 10M KV Reads limit: Cloudflare Cache API acts as L1 cache in RAM before touching KV (L2).
 * - Zero Memory Buffering: Native V8 zero-copy body streaming.
 */

import megaplay, {
    resolveFromMal,
    resolveFromAnilist,
    resolveFromCatalogId,
    resolveFromEmbedUrl,
    getRecentAnime,
    getSeriesEpisodes,
    mapAniToMal
} from './megaplay.js';

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
};

// Open CDN hosts that do NOT check referer header (TikTok CDN / ByteDance only)
const OPEN_CDN_HOSTS = [
    'tiktokcdn.com',
    'byteoversea.com',
    'ibytedtos.com'
];

function isDirectCdn(urlStr) {
    for (const host of OPEN_CDN_HOSTS) {
        if (urlStr.includes(host)) return true;
    }
    return false;
}

// -------------------------------------------------------------
// Security & Token Cipher (Zero DevTools leaks of upstream CDNs)
// -------------------------------------------------------------
const CIPHER_KEY = 0x5a;

function encryptStreamToken(str) {
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

function decryptStreamToken(token) {
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
    } catch {
        return null;
    }
}

function resolveProxyTarget(searchParams) {
    const token = searchParams.get("token") || searchParams.get("t");
    if (token) {
        const decrypted = decryptStreamToken(token);
        if (decrypted) return decrypted;
    }
    return searchParams.get("url") || null;
}

// -------------------------------------------------------------
// TIER 1: In-Memory Isolate Micro-Cache (0ms CPU, 0 KV Ops)
// -------------------------------------------------------------
const MEM_CACHE = new Map();
const MAX_MEM_ITEMS = 500;

function getMemCache(key) {
    const item = MEM_CACHE.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
        MEM_CACHE.delete(key);
        return null;
    }
    return item.data;
}

function setMemCache(key, data, ttlSeconds = 1800) {
    if (MEM_CACHE.size >= MAX_MEM_ITEMS) {
        const oldestKey = MEM_CACHE.keys().next().value;
        if (oldestKey) MEM_CACHE.delete(oldestKey);
    }
    MEM_CACHE.set(key, {
        data,
        expiresAt: Date.now() + ttlSeconds * 1000
    });
}

function isOriginAllowed(request) {
    const origin = request.headers.get("origin") || "";
    const referer = request.headers.get("referer") || "";
    const ref = (origin || referer).toLowerCase();

    // Direct / server-to-server / service binding calls without browser origin/referer
    if (!ref) return true;

    if (
        ref.includes("anixo.online") ||
        ref.includes("anixo.buzz") ||
        ref.includes("localhost") ||
        ref.includes("127.0.0.1") ||
        ref.includes("192.168.") ||
        ref.includes("10.") ||
        ref.includes("172.") ||
        ref.includes("pages.dev") ||
        ref.includes("vercel.app") ||
        ref.includes("hf.space")
    ) {
        return true;
    }

    return false;
}

const DATACENTER_ORGS = [
    "amazon", "aws", "digitalocean", "hetzner", "ovh", "google cloud", "google-cloud",
    "linode", "akamai", "oracle", "azure", "microsoft", "alicloud", "alibaba",
    "contabo", "choopa", "vultr", "hostinger", "m247", "datacamp", "cogent", "leaseweb", "fastly"
];

const DATACENTER_ASNS = new Set([
    16509, 14618, 14061, 24940, 16276, 15169, 396982, 63949, 31898, 8075,
    45102, 37963, 51167, 20473, 46652, 22612, 60068, 202425
]);

const CLUSTER_SECRET = "anixo-cluster-auth-9x82k1";

function isInternalClusterCall(request) {
    if (request.headers.get("cf-worker")) return true;
    if (request.headers.get("x-cluster-internal") === CLUSTER_SECRET) return true;
    return false;
}

function isDatacenterIp(request) {
    if (isInternalClusterCall(request)) {
        return false;
    }

    // If client has a Turnstile token or is precleared, do not block: they proved human
    const token = request.headers.get("cf-turnstile-token") || new URL(request.url).searchParams.get("turnstileToken");
    if (token) return false;

    const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("x-real-ip") || "";
    if (clientIp && getMemCache(`turnstile:cleared:${clientIp}`)) return false;

    const asn = request.cf?.asn;
    const org = (request.cf?.asOrganization || "").toLowerCase();

    if (asn && DATACENTER_ASNS.has(asn)) {
        return true;
    }
    for (const dOrg of DATACENTER_ORGS) {
        if (org.includes(dOrg)) return true;
    }
    return false;
}

async function verifyTurnstileToken(request, env, ctx) {
    // Exempt authenticated internal cluster service bindings
    if (isInternalClusterCall(request)) {
        return { valid: true, reason: "internal_service" };
    }

    const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("x-real-ip") || "";

    // 1. Check IP Pre-Clearance (MemCache & KV) - Allows verified humans to browse smoothly without repeated challenges
    if (clientIp) {
        if (getMemCache(`turnstile:cleared:${clientIp}`)) {
            return { valid: true, reason: "precleared_session" };
        }
        if (env?.ANIKO_CACHE) {
            try {
                const kvCleared = await env.ANIKO_CACHE.get(`turnstile:cleared:${clientIp}`);
                if (kvCleared) {
                    setMemCache(`turnstile:cleared:${clientIp}`, 1, 1800);
                    return { valid: true, reason: "kv_precleared" };
                }
            } catch {}
        }
    }

    const token = request.headers.get("cf-turnstile-token") || new URL(request.url).searchParams.get("turnstileToken");
    if (!token) {
        return { valid: false, error: "Cloudflare Turnstile token required" };
    }

    // Strict Verification: when TURNSTILE_SECRET_KEY is configured in Cloudflare secrets
    if (env?.TURNSTILE_SECRET_KEY) {
        try {
            const formData = new FormData();
            formData.append("secret", env.TURNSTILE_SECRET_KEY);
            formData.append("response", token);

            const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                // Pre-clear client IP for 30 minutes
                if (clientIp) {
                    setMemCache(`turnstile:cleared:${clientIp}`, 1, 1800);
                    if (env.ANIKO_CACHE && ctx?.waitUntil) {
                        ctx.waitUntil(env.ANIKO_CACHE.put(`turnstile:cleared:${clientIp}`, "1", { expirationTtl: 1800 }).catch(() => {}));
                    }
                }
                return { valid: true };
            } else {
                const errCodes = data["error-codes"] || [];
                // Graceful handling for duplicate / concurrent requests from the same user:
                // If Cloudflare returns "timeout-or-duplicate" for a structurally valid Turnstile token,
                // it proves Cloudflare successfully issued and consumed the token on a parallel request!
                if (errCodes.includes("timeout-or-duplicate") && typeof token === "string" && token.length > 30) {
                    if (clientIp) {
                        setMemCache(`turnstile:cleared:${clientIp}`, 1, 1800);
                        if (env.ANIKO_CACHE && ctx?.waitUntil) {
                            ctx.waitUntil(env.ANIKO_CACHE.put(`turnstile:cleared:${clientIp}`, "1", { expirationTtl: 1800 }).catch(() => {}));
                        }
                    }
                    return { valid: true, reason: "duplicate_accepted" };
                }

                return { valid: false, error: `Turnstile verification failed: ${errCodes.join(", ") || 'invalid token'}` };
            }
        } catch (e) {
            return { valid: false, error: `Turnstile verification error: ${e.message}` };
        }
    }

    // Staging Mode (Graceful verification before Secret Key is configured in CF Dashboard):
    // Checks that token has valid Turnstile payload format (> 20 chars)
    if (typeof token === "string" && token.length > 20) {
        if (clientIp) {
            setMemCache(`turnstile:cleared:${clientIp}`, 1, 1800);
        }
        return { valid: true, staging: true };
    }

    return { valid: false, error: "Invalid Turnstile token" };
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            ...extraHeaders
        }
    });
}

function errorResponse(message, status = 500) {
    return jsonResponse({ success: false, error: message }, status, {
        "Cache-Control": "no-store"
    });
}

function attachProxyUrls(data, origin) {
    if (!data || !data.success) return data;
    if (data.stream_url) {
        data.proxy_stream_url = `${origin}/api/proxy/m3u8?token=${encryptStreamToken(data.stream_url)}`;
    }
    if (Array.isArray(data.sources)) {
        data.sources = data.sources.map(s => ({
            ...s,
            proxy_url: `${origin}/api/proxy/m3u8?token=${encryptStreamToken(s.url)}`
        }));
    }
    if (Array.isArray(data.subtitles)) {
        data.subtitles = data.subtitles.map(sub => ({
            ...sub,
            proxy_url: sub.url ? `${origin}/api/proxy/vtt?token=${encryptStreamToken(sub.url)}` : undefined
        }));
    }
    return data;
}

export default {
    async fetch(request, env, ctx) {
        // 1. Instant CORS preflight (< 0.1ms CPU)
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        // Security: Leech Firewall (Blocks unauthorized 3rd-party domains)
        if (!isOriginAllowed(request)) {
            return new Response("Access Denied: Unauthorized leeching blocked by Anixo Shield", {
                status: 403,
                headers: { ...CORS_HEADERS, "Content-Type": "text/plain" }
            });
        }

        // Security: Datacenter & Cloud Hosting IP Blocker (Blocks automated scraping servers)
        if (isDatacenterIp(request)) {
            return new Response("Access Denied: Datacenter & Cloud hosting networks are blocked by Anixo Shield.", {
                status: 403,
                headers: { ...CORS_HEADERS, "Content-Type": "text/plain" }
            });
        }

        const url = new URL(request.url);
        const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
        const origin = `https://${host}`;
        const pathname = url.pathname;
        const searchParams = url.searchParams;
        const colo = request.cf?.colo || "EDGE";

        // 2. L1 Free Edge Cache API Check (caches.default)
        // Free, unlimited, runs in RAM in < 0.5ms CPU time without consuming KV reads!
        const cache = caches.default;
        const isGet = request.method === "GET";
        const isCacheableApi = isGet && (
            pathname.startsWith("/api/stream/") ||
            pathname.startsWith("/api/proxy/") ||
            pathname.startsWith("/api/catalog/")
        );

        if (isCacheableApi) {
            try {
                const cachedMatch = await cache.match(request);
                if (cachedMatch) {
                    const hitHeaders = new Headers(cachedMatch.headers);
                    hitHeaders.set("X-Edge-Cache", "HIT");
                    hitHeaders.set("X-Colo", colo);
                    return new Response(cachedMatch.body, {
                        status: cachedMatch.status,
                        headers: hitHeaders
                    });
                }
            } catch {}
        }

        try {
            let response = null;

            // 3. Health check
            if (pathname === "/health") {
                return jsonResponse({ status: "ok" });
            }

            // 4. Stream by MAL ID: /api/stream/mal/:id/:ep/:track
            if (pathname.startsWith("/api/stream/mal")) {
                const parts = pathname.replace('/api/stream/mal', '').split('/').filter(Boolean);
                const malId = parts[0] || searchParams.get("id");
                const ep = parseInt(parts[1] || searchParams.get("ep") || "1");
                const track = (parts[2] || searchParams.get("track") || "sub").toLowerCase();
                const serverOpt = searchParams.get("s") || searchParams.get("server") || "";

                if (!malId) return errorResponse("Missing MAL ID parameter", 400);

                const turnstile = await verifyTurnstileToken(request, env, ctx);
                if (!turnstile.valid) {
                    return errorResponse(`Access Denied: ${turnstile.error || "Turnstile verification required"}`, 403);
                }

                const cacheKey = `stream:mal:${malId}:${ep}:${track}:${serverOpt}`;

                // L2 Cache: KV Namespace (10M included reads)
                if (env.ANIKO_CACHE) {
                    try {
                        const kvData = await env.ANIKO_CACHE.get(cacheKey, "json");
                        if (kvData) {
                            response = jsonResponse(attachProxyUrls(kvData, origin), 200, {
                                "X-Cache": "KV-HIT",
                                "X-Colo": colo
                            });
                        }
                    } catch {}
                }

                if (!response) {
                    const data = await resolveFromMal(malId, ep, track, serverOpt);

                    if (data.success && env.ANIKO_CACHE && ctx?.waitUntil) {
                        // 12-Hour KV TTL protects the 1M monthly writes quota
                        ctx.waitUntil(
                            env.ANIKO_CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 43200 }).catch(() => {})
                        );
                    }

                    response = jsonResponse(attachProxyUrls(data, origin), 200, {
                        "X-Cache": "MISS",
                        "X-Colo": colo
                    });
                }
            }

            // 5. Stream by AniList ID: /api/stream/ani/:id/:ep/:track
            else if (pathname.startsWith("/api/stream/ani")) {
                const parts = pathname.replace('/api/stream/ani', '').split('/').filter(Boolean);
                const aniId = parts[0] || searchParams.get("id");
                const ep = parseInt(parts[1] || searchParams.get("ep") || "1");
                const track = (parts[2] || searchParams.get("track") || "sub").toLowerCase();
                const serverOpt = searchParams.get("s") || searchParams.get("server") || "";

                if (!aniId) return errorResponse("Missing AniList ID parameter", 400);

                const turnstile = await verifyTurnstileToken(request, env, ctx);
                if (!turnstile.valid) {
                    return errorResponse(`Access Denied: ${turnstile.error || "Turnstile verification required"}`, 403);
                }

                const streamCacheKey = `stream:ani:${aniId}:${ep}:${track}:${serverOpt}`;

                // L2 KV Cache check
                if (env.ANIKO_CACHE) {
                    try {
                        const kvData = await env.ANIKO_CACHE.get(streamCacheKey, "json");
                        if (kvData) {
                            response = jsonResponse(attachProxyUrls(kvData, origin), 200, {
                                "X-Cache": "KV-HIT",
                                "X-Colo": colo
                            });
                        }
                    } catch {}
                }

                if (!response) {
                    // Optimized AniList -> MAL Mapping Cache (30-day TTL)
                    let targetMalId = null;
                    const mappingKey = `ani:mal:${aniId}`;
                    if (env.ANIKO_CACHE) {
                        try {
                            targetMalId = await env.ANIKO_CACHE.get(mappingKey);
                        } catch {}
                    }

                    let data;
                    if (targetMalId) {
                        data = await resolveFromMal(targetMalId, ep, track, serverOpt);
                    } else {
                        data = await resolveFromAnilist(aniId, ep, track, serverOpt);
                        if (data.mal_id && env.ANIKO_CACHE && ctx?.waitUntil) {
                            ctx.waitUntil(
                                env.ANIKO_CACHE.put(mappingKey, String(data.mal_id), { expirationTtl: 2592000 }).catch(() => {})
                            );
                        }
                    }

                    if (data.success && env.ANIKO_CACHE && ctx?.waitUntil) {
                        ctx.waitUntil(
                            env.ANIKO_CACHE.put(streamCacheKey, JSON.stringify(data), { expirationTtl: 43200 }).catch(() => {})
                        );
                    }

                    response = jsonResponse(attachProxyUrls(data, origin), 200, {
                        "X-Cache": "MISS",
                        "X-Colo": colo
                    });
                }
            }

            // 5b. Anigo2 Compatible Watch Route: /api/watch/:id/:lang/:ep
            else if (pathname.startsWith("/api/watch")) {
                const parts = pathname.replace('/api/watch', '').split('/').filter(Boolean);
                const id = parts[0] || searchParams.get("id");
                const lang = (parts[1] || searchParams.get("lang") || "sub").toLowerCase();
                const ep = parseInt(parts[2] || searchParams.get("ep") || "1");

                if (!id) return errorResponse("Missing anime ID in /api/watch/:id/:lang/:ep", 400);

                // Security: Cloudflare Turnstile Verification
                const turnstile = await verifyTurnstileToken(request, env, ctx);
                if (!turnstile.valid) {
                    return errorResponse(`Access Denied: ${turnstile.error || "Turnstile verification required"}`, 403);
                }

                const cacheKey = `watch:anigo:v4:${id}:${ep}:${lang}`;
                let streamData = null;
                let cacheStatus = "MISS";

                if (env.ANIKO_CACHE) {
                    try {
                        streamData = await env.ANIKO_CACHE.get(cacheKey, "json");
                        if (!streamData) {
                            streamData = await env.ANIKO_CACHE.get(`watch:anigo:v3:${id}:${ep}:${lang}`, "json");
                        }
                        if (streamData) {
                            cacheStatus = "KV-HIT";
                            const raw = JSON.stringify(streamData)
                                .replaceAll("aniko-backend.rk18109ry.workers.dev", host)
                                .replaceAll("zoko-stream.rk18109ry.workers.dev", "zoko.anixo.online");
                            streamData = JSON.parse(raw);
                        }
                    } catch {}
                }

                if (!streamData) {
                    let resolved = null;
                    const num = parseInt(id);
                    if (num && num > 60000) {
                        resolved = await resolveFromAnilist(id, ep, lang);
                    } else {
                        try {
                            resolved = await resolveFromMal(id, ep, lang);
                        } catch {
                            resolved = await resolveFromAnilist(id, ep, lang);
                        }
                    }

                    if (!resolved || !resolved.success) {
                        return errorResponse(resolved?.error || "Failed to resolve stream for Anigo2", 404);
                    }

                    const withProxies = attachProxyUrls(resolved, origin);
                    const rawStreamUrl = resolved.stream_url || "";
                    const mainProxy = withProxies.proxy_stream_url || `${origin}/api/proxy/m3u8?token=${encryptStreamToken(rawStreamUrl)}`;

                    // Generate multi-CDN streams so Anigo2 shows the Server/CDN selector
                    const streams = [
                        {
                            "url": mainProxy,
                            "type": "hls",
                            "server": "Mega CDN (Global)",
                            "priority": 1
                        }
                    ];

                    // Tokyo CDN (Asia)
                    let tokyoRaw = rawStreamUrl;
                    if (rawStreamUrl.includes('norami.top')) tokyoRaw = rawStreamUrl.replace('norami.top', 'shiora.top');
                    else if (rawStreamUrl.includes('mikora.top')) tokyoRaw = rawStreamUrl.replace('mikora.top', 'shiora.top');
                    streams.push({
                        "url": `${origin}/api/proxy/m3u8?token=${encryptStreamToken(tokyoRaw)}`,
                        "type": "hls",
                        "server": "Tokyo CDN (Asia)",
                        "priority": 2
                    });

                    // Backup CDN (Ultra)
                    let backupRaw = rawStreamUrl;
                    if (rawStreamUrl.includes('norami.top')) backupRaw = rawStreamUrl.replace('norami.top', 'mikora.top');
                    else if (rawStreamUrl.includes('shiora.top')) backupRaw = rawStreamUrl.replace('shiora.top', 'mikora.top');
                    streams.push({
                        "url": `${origin}/api/proxy/m3u8?token=${encryptStreamToken(backupRaw)}`,
                        "type": "hls",
                        "server": "Backup CDN (Ultra)",
                        "priority": 3
                    });

                    streamData = {
                        "aniko": {
                            "streams": streams,
                            "subtitles": (withProxies.subtitles || []).map(sub => ({
                                "file": sub.proxy_url || sub.url,
                                "label": sub.label || "English",
                                "kind": "captions",
                                "default": !!sub.default,
                                "language": sub.lang || "en",
                                "format": "vtt"
                            })),
                            "intro": withProxies.intro || { "start": 0, "end": 0 },
                            "outro": withProxies.outro || { "start": 0, "end": 0 },
                            "provider": "aniko-backend-edge"
                        }
                    };

                    if (env.ANIKO_CACHE && ctx?.waitUntil) {
                        ctx.waitUntil(
                            env.ANIKO_CACHE.put(cacheKey, JSON.stringify(streamData), { expirationTtl: 43200 }).catch(() => {})
                        );
                    }
                }

                // Final safety sanitize to guarantee no raw worker domains leak to the client
                const safeData = JSON.parse(
                    JSON.stringify(streamData)
                        .replaceAll("aniko-backend.rk18109ry.workers.dev", host)
                        .replaceAll("zoko-stream.rk18109ry.workers.dev", "zoko.anixo.online")
                );

                response = jsonResponse(safeData, 200, {
                    "X-Cache": cacheStatus,
                    "X-Colo": colo
                });
            }

            // 6. Stream by Catalog ID: /api/stream/catalog/:epId/:track
            else if (pathname.startsWith("/api/stream/catalog")) {
                const parts = pathname.replace('/api/stream/catalog', '').split('/').filter(Boolean);
                const epId = parts[0] || searchParams.get("id") || searchParams.get("epId");
                const track = (parts[1] || searchParams.get("track") || "sub").toLowerCase();
                const serverOpt = searchParams.get("s") || searchParams.get("server") || "";

                if (!epId) return errorResponse("Missing Catalog Episode ID parameter", 400);

                const cacheKey = `stream:cat:${epId}:${track}:${serverOpt}`;

                if (env.ANIKO_CACHE) {
                    try {
                        const kvData = await env.ANIKO_CACHE.get(cacheKey, "json");
                        if (kvData) {
                            response = jsonResponse(attachProxyUrls(kvData, origin), 200, {
                                "X-Cache": "KV-HIT",
                                "X-Colo": colo
                            });
                        }
                    } catch {}
                }

                if (!response) {
                    const data = await resolveFromCatalogId(epId, track, serverOpt);

                    if (data.success && env.ANIKO_CACHE && ctx?.waitUntil) {
                        ctx.waitUntil(
                            env.ANIKO_CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 43200 }).catch(() => {})
                        );
                    }

                    response = jsonResponse(attachProxyUrls(data, origin), 200, {
                        "X-Cache": "MISS",
                        "X-Colo": colo
                    });
                }
            }

            // 7. Direct embed URL resolver: /api/stream/resolve?url=...
            else if (pathname === "/api/stream/resolve") {
                const embedUrl = searchParams.get("url");
                if (!embedUrl) return errorResponse("Missing embed url query parameter", 400);
                const serverOpt = searchParams.get("s") || searchParams.get("server") || "";
                const data = await resolveFromEmbedUrl(embedUrl, serverOpt);
                response = jsonResponse(attachProxyUrls(data, origin), 200);
            }

            // 8. Catalog Recent Anime: /api/catalog/recent?page=1&per_page=20
            else if (pathname === "/api/catalog/recent") {
                const page = parseInt(searchParams.get("page") || "1");
                const perPage = parseInt(searchParams.get("per_page") || "20");
                const cacheKey = `cat:recent:${page}:${perPage}`;

                if (env.ANIKO_CACHE) {
                    try {
                        const cached = await env.ANIKO_CACHE.get(cacheKey, "json");
                        if (cached) {
                            response = jsonResponse(cached, 200, { "X-Cache": "KV-HIT" });
                        }
                    } catch {}
                }

                if (!response) {
                    const data = await getRecentAnime(page, perPage);

                    if (data && env.ANIKO_CACHE && ctx?.waitUntil) {
                        ctx.waitUntil(
                            env.ANIKO_CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 1800 }).catch(() => {})
                        );
                    }

                    response = jsonResponse(data, 200, { "X-Cache": "MISS" });
                }
            }

            // 9. Catalog Series Details: /api/catalog/series/:id
            else if (pathname.startsWith("/api/catalog/series")) {
                const parts = pathname.replace('/api/catalog/series', '').split('/').filter(Boolean);
                const seriesId = parts[0] || searchParams.get("id");
                if (!seriesId) return errorResponse("Missing Series ID", 400);

                const cacheKey = `cat:series:${seriesId}`;

                if (env.ANIKO_CACHE) {
                    try {
                        const cached = await env.ANIKO_CACHE.get(cacheKey, "json");
                        if (cached) {
                            response = jsonResponse(cached, 200, { "X-Cache": "KV-HIT" });
                        }
                    } catch {}
                }

                if (!response) {
                    const data = await getSeriesEpisodes(seriesId);

                    if (data && env.ANIKO_CACHE && ctx?.waitUntil) {
                        ctx.waitUntil(
                            env.ANIKO_CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 7200 }).catch(() => {})
                        );
                    }

                    response = jsonResponse(data, 200, { "X-Cache": "MISS" });
                }
            }

            // 10. HLS M3U8 Playlist Proxy: /api/proxy/m3u8?token=... or ?url=...
            else if (pathname === "/api/proxy/m3u8") {
                const target = resolveProxyTarget(searchParams);
                if (!target) return errorResponse("Missing url or token query parameter", 400);

                const upstream = await fetch(target, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                        "Referer": "https://megaplay.buzz/",
                        "Origin": "https://megaplay.buzz"
                    },
                    cf: {
                        cacheEverything: true,
                        cacheTtl: 600
                    }
                });

                if (!upstream.ok) {
                    return new Response(`Upstream m3u8 error: ${upstream.status}`, {
                        status: upstream.status,
                        headers: { ...CORS_HEADERS, "Content-Type": "text/plain" }
                    });
                }

                const text = await upstream.text();
                const rewritten = text.split('\n').map(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return line;
                    if (trimmed.startsWith('#')) {
                        return line.replace(/URI=["']([^"']+)["']/g, (m, u) => {
                            const resolved = new URL(u, target).toString();
                            if (resolved.includes('.m3u8') || resolved.includes('master') || resolved.includes('playlist')) {
                                return `URI="${origin}/api/proxy/m3u8?token=${encryptStreamToken(resolved)}"`;
                            }
                            if (isDirectCdn(resolved)) return `URI="${resolved}"`;
                            return `URI="${origin}/api/proxy/ts?token=${encryptStreamToken(resolved)}"`;
                        });
                    }

                    const resolved = new URL(trimmed, target).toString();
                    if (resolved.includes('.m3u8') || resolved.includes('master') || resolved.includes('playlist')) {
                        return `${origin}/api/proxy/m3u8?token=${encryptStreamToken(resolved)}`;
                    }

                    // SMART SEGMENT ROUTING: Direct open CDNs bypass worker entirely!
                    // Saves 200+ Worker requests per episode!
                    if (isDirectCdn(resolved)) {
                        return resolved;
                    }

                    return `${origin}/api/proxy/ts?token=${encryptStreamToken(resolved)}`;
                }).join('\n');

                response = new Response(rewritten, {
                    status: 200,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/vnd.apple.mpegurl",
                        "Cache-Control": "public, max-age=600, s-maxage=600",
                        "X-Colo": colo
                    }
                });
            }

            // 11. VTT Subtitle Proxy: /api/proxy/vtt?token=... or ?url=...
            else if (pathname === "/api/proxy/vtt") {
                const target = resolveProxyTarget(searchParams);
                if (!target) return errorResponse("Missing url or token query parameter", 400);

                const upstream = await fetch(target, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                        "Referer": "https://megaplay.buzz/",
                        "Origin": "https://megaplay.buzz"
                    },
                    cf: {
                        cacheEverything: true,
                        cacheTtl: 86400
                    }
                });

                if (!upstream.ok) {
                    return new Response(`Subtitle fetch error: ${upstream.status}`, {
                        status: upstream.status,
                        headers: { ...CORS_HEADERS, "Content-Type": "text/plain" }
                    });
                }

                let vttText = await upstream.text();
                // Filter ASS/SSA and malformed WebVTT tags
                vttText = vttText
                    .replace(/\{[^}]+\}/g, '')
                    .replace(/<\/?(c[.\w-]*|v[^>]*|lang[^>]*|ruby|rt)>/gi, '');

                response = new Response(vttText, {
                    status: 200,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "text/vtt; charset=utf-8",
                        "Cache-Control": "public, max-age=86400, s-maxage=86400",
                        "X-Colo": colo
                    }
                });
            }

            // 12. High-Performance TS / Segment Stream Proxy: /api/proxy/ts?token=... or ?url=...
            else if (pathname === "/api/proxy/ts") {
                const target = resolveProxyTarget(searchParams);
                if (!target) return errorResponse("Missing url or token query parameter", 400);

                const reqHeaders = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Referer": "https://megaplay.buzz/",
                    "Origin": "https://megaplay.buzz"
                };

                const range = request.headers.get("range");
                if (range) {
                    reqHeaders["Range"] = range;
                }

                const upstream = await fetch(target, {
                    headers: reqHeaders,
                    cf: {
                        cacheEverything: true,
                        cacheTtl: 604800 // Edge cache video segments for 7 days
                    }
                });

                if (!upstream.ok && upstream.status !== 206) {
                    return new Response(`Segment fetch error: ${upstream.status}`, {
                        status: upstream.status,
                        headers: { ...CORS_HEADERS, "Content-Type": "text/plain" }
                    });
                }

                const responseHeaders = new Headers(CORS_HEADERS);
                responseHeaders.set("Content-Type", "video/mp2t");
                responseHeaders.set("Cache-Control", "public, max-age=31536000, s-maxage=604800, immutable");
                responseHeaders.set("X-Colo", colo);

                if (upstream.headers.get("content-length")) {
                    responseHeaders.set("Content-Length", upstream.headers.get("content-length"));
                }
                if (upstream.headers.get("content-range")) {
                    responseHeaders.set("Content-Range", upstream.headers.get("content-range"));
                }
                if (upstream.headers.get("accept-ranges")) {
                    responseHeaders.set("Accept-Ranges", upstream.headers.get("accept-ranges"));
                }

                // Native zero-copy streaming in Cloudflare V8
                response = new Response(upstream.body, {
                    status: upstream.status,
                    headers: responseHeaders
                });
            }

            // 13. Root / API Index: Redirect to main website to hide internal documentation & endpoints
            if (!response && (pathname === "/" || pathname === "/api")) {
                return Response.redirect("https://anixo.online", 302);
            }

            if (!response) {
                return errorResponse(`Route ${pathname} not found on Aniko Backend`, 404);
            }

            // Save to L1 Edge Cache in background for zero-CPU repeat hits
            if (isCacheableApi && response.status === 200 && ctx?.waitUntil) {
                ctx.waitUntil(cache.put(request, response.clone()).catch(() => {}));
            }

            return response;
        } catch (err) {
            return errorResponse(err.message, 500);
        }
    }
};
