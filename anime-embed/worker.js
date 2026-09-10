/**
 * PUBLIC ANIME EMBED PROVIDER - CLOUDFLARE WORKER
 * Unified Edge router serving the developer playground, cinema embed player,
 * AniList/MAL metadata, and the 3-engine multi-server stream coordinator.
 */

import { renderLandingHtml } from './src/landing/landingHtml.js';
import { renderEmbedHtml } from './src/player/embedHtml.js';
import { renderAdminHtml } from './src/admin/adminHtml.js';
import { renderTestHtml } from './src/player/testHtml.js';
import { searchAnime, getAnimeByAniListId, getAnimeByMalId } from './src/metadata/anilist.js';
import { resolveStreamWithFailover, resolveSpecificServer } from './src/engines/resolver.js';
import { checkClusterHealth } from './src/engines/health.js';
import { maskStreamResult, decryptStreamToken, encryptStreamToken, SCRAPER_NOTICE_HEADER, SCRAPER_NOTICE_TEXT } from './src/engines/proxyCrypto.js';
import { isScraperRequest, getHoneypotStreamResponse, getHoneypotVttContent } from './src/engines/honeypot.js';
import {
    verifyAdminPassword,
    createAdminSession,
    validateAdminSession,
    revokeAdminSession,
    getAdminConfig,
    updateAdminConfig,
    getAdminFullState,
    isDomainAllowed,
    addFirewallDomain,
    removeFirewallDomain,
    recordStreamAccess,
    clearTelemetry,
    unmaskReferrer,
    markReferrerSandboxed,
    recordHoneypotTrap,
    generateApiKey,
    syncAdminStoreWithKv,
    persistAdminStoreToKv
} from './src/admin/adminStore.js';

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Range, Authorization, *",
    "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length, X-Cluster-Status, *",
    "Access-Control-Max-Age": "86400"
};

const CLUSTER_SECRET = "anixo-cluster-auth-9x82k1";

const DATACENTER_ORGS = [
    "amazon", "aws", "digitalocean", "hetzner", "ovh", "google cloud", "google-cloud",
    "linode", "akamai", "oracle", "azure", "microsoft", "alicloud", "alibaba",
    "contabo", "choopa", "vultr", "hostinger", "m247", "datacamp", "cogent", "leaseweb", "fastly"
];

const DATACENTER_ASNS = new Set([
    16509, 14618, 14061, 24940, 16276, 15169, 396982, 63949, 31898, 8075,
    45102, 37963, 51167, 20473, 46652, 22612, 60068, 202425
]);

function isDatacenterIp(request) {
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

function getBlockedLeechResponse() {
    return new Response(
        `<!DOCTYPE html>
<html>
<head>
    <title>403 Forbidden - Leech Protection Engaged</title>
    <style>
        body { background: #09090b; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .box { background: #111114; border: 1px solid #232328; border-radius: 12px; padding: 32px 28px; max-width: 440px; text-align: center; }
        h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #ef4444; }
        p { font-size: 13.5px; color: #a1a1aa; line-height: 1.5; margin-bottom: 16px; }
        .tag { font-family: monospace; font-size: 11px; background: #18181c; border: 1px solid #232328; padding: 4px 8px; border-radius: 4px; color: #71717a; }
    </style>
</head>
<body>
    <div class="box">
        <h1>403 Leech Block Engaged</h1>
        <p>This domain is not authorized to embed the Anixo video stream player. Direct unauthorized embedding is restricted by the operator firewall.</p>
        <span class="tag">ANIXO EDGE SHIELD · 403 FORBIDDEN</span>
    </div>
</body>
</html>`,
        {
            status: 403,
            headers: {
                ...CORS_HEADERS,
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-cache, no-store"
            }
        }
    );
}

function extractClientReferer(request, url) {
    const parentParam = url.searchParams.get("parentHost") || url.searchParams.get("ref");
    let domain = parentParam || request.headers.get("referer") || request.headers.get("origin") || "";
    if (!domain) {
        const secFetchDest = request.headers.get("sec-fetch-dest");
        const secFetchSite = request.headers.get("sec-fetch-site");
        if (secFetchDest === "iframe" || secFetchSite === "cross-site") {
            const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
            domain = `masked-iframe-${clientIp.replace(/[:.]/g, "-").slice(0, 16)}.leech`;
        }
    }
    return domain;
}

export default {
    async fetch(request, env, ctx) {
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: CORS_HEADERS });
        }

        const url = new URL(request.url);
        const baseUrl = url.origin;
        const pathname = url.pathname;

        // ── Cloudflare KV Admin State Synchronization ──
        const kv = env?.ANIXO_ADMIN_STORE;
        if (kv) {
            const isAdminRoute = pathname.startsWith("/api/admin") || pathname === "/admin" || pathname === "/dashboard";
            await syncAdminStoreWithKv(kv, isAdminRoute);
        }

        try {
            // Favicon
            if (pathname === "/favicon.ico") {
                return new Response(null, { status: 204, headers: CORS_HEADERS });
            }

            // Profiton Domain Verification File
            if (pathname === "/pftn_190b6fc8c45bcb368836833bb05766f0.txt" || (pathname.startsWith("/pftn_") && pathname.endsWith(".txt"))) {
                return new Response("Profiton check: e96572bb947a0444ecbf3de926348b42", {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "text/plain; charset=utf-8",
                        "Cache-Control": "public, max-age=3600"
                    }
                });
            }

            // Embed SDK for third-party websites (e.g. AniCult, partner integrations)
            if (pathname === "/embed-sdk.js") {
                const sdkCode = `/** Anixo Player Embed SDK */
(function(window) {
    window.AniXoSDK = {
        version: "2.1.0",
        init: function(opts) {
            console.log("[AniXo SDK] Initialized", opts);
        },
        createEmbedUrl: function(type, id, ep, track) {
            var host = "";
            try { host = window.location.hostname; } catch(e) {}
            var q = host ? ("?parentHost=" + encodeURIComponent(host)) : "";
            return "${baseUrl}/embed/" + (type || "ani") + "/" + id + "/" + (ep || 1) + (track ? ("/" + track) : "") + q;
        }
    };
})(window);`;
                return new Response(sdkCode, {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/javascript; charset=utf-8",
                        "Cache-Control": "public, max-age=86400"
                    }
                });
            }

            // 1. Landing Page & Developer Playground (Root /)
            if (pathname === "/") {
                return new Response(renderLandingHtml(baseUrl), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "text/html; charset=utf-8",
                        "Cache-Control": "no-cache, no-store, must-revalidate"
                    }
                });
            }

            // ── Operator Console & Admin Dashboard ──
            if (pathname === "/admin" || pathname === "/dashboard") {
                return new Response(renderAdminHtml(baseUrl), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "text/html; charset=utf-8",
                        "Cache-Control": "no-cache, no-store, must-revalidate"
                    }
                });
            }

            // ── Simple Embed Tester Frontend ──
            if (pathname === "/test" || pathname === "/tester" || pathname === "/preview") {
                return new Response(renderTestHtml(baseUrl), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "text/html; charset=utf-8",
                        "Cache-Control": "no-cache, no-store, must-revalidate"
                    }
                });
            }

            // Admin API: Login
            if (pathname === "/api/admin/login" && request.method === "POST") {
                const body = await request.json().catch(() => ({}));
                if (verifyAdminPassword(body.password)) {
                    const token = createAdminSession();
                    if (kv) await persistAdminStoreToKv(kv);
                    return new Response(JSON.stringify({ success: true, token }), {
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                    });
                }
                return new Response(JSON.stringify({ error: "Invalid master passphrase" }), {
                    status: 401,
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                });
            }

            // ── Beacon Unmasker Endpoint (Public Client Discovery Endpoint) ──
            // Receives client-side discoveries and updates masked-iframe telemetry with real domains
            if (pathname === "/api/beacon" || pathname === "/api/admin/beacon") {
                try {
                    let rawDiscoveries = url.searchParams.get("d") || "";
                    let animeId = url.searchParams.get("id") || "";
                    if (request.method === "POST") {
                        const postData = await request.text().catch(() => "");
                        if (postData && postData.includes("=")) {
                            const postParams = new URLSearchParams(postData);
                            rawDiscoveries = rawDiscoveries || postParams.get("d") || "";
                            animeId = animeId || postParams.get("id") || "";
                        }
                    }

                    const discoveries = rawDiscoveries.split("|").filter(Boolean);
                    const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
                    
                    // Extract real hostnames from discoveries
                    let realHost = "";
                    for (const d of discoveries) {
                        const [type, ...valueParts] = d.split(":");
                        const value = valueParts.join(":");
                        if (!value || value === "hidden-iframe.client") continue;
                        
                        try {
                            let host = "";
                            if (value.includes("://")) {
                                host = new URL(value).hostname;
                            } else {
                                host = value.split("/")[0].split(":")[0];
                            }
                            // Skip our own domain and local/empty values
                            if (host && host !== url.hostname && host !== "localhost" && !host.endsWith(".leech")) {
                                realHost = host.toLowerCase();
                                break; // First valid discovery wins
                            }
                        } catch (parseErr) {}
                    }

                    if (realHost) {
                        const maskedPrefix = `masked-iframe-${clientIp.replace(/[:.]/g, "-").slice(0, 16)}`;
                        const unmasked = unmaskReferrer(maskedPrefix, realHost);
                        if (unmasked) {
                            if (kv) await persistAdminStoreToKv(kv);
                            console.log(`[Beacon] Unmasked ${maskedPrefix} → ${realHost}`);
                        } else {
                            recordStreamAccess({ domain: realHost, anime: animeId ? `Anime #${animeId}` : "", serverId: 1 });
                            if (kv) await persistAdminStoreToKv(kv);
                            console.log(`[Beacon] Discovered embedder: ${realHost} (IP: ${clientIp}, anime: ${animeId})`);
                        }
                    }

                    // Check for sandbox reports
                    const sandboxReport = discoveries.find(d => d.startsWith("sandbox:")) || (url.searchParams.get("sb") ? ("sandbox:" + url.searchParams.get("sb")) : null);
                    if (sandboxReport) {
                        const targetDomain = realHost || (clientIp ? `masked-iframe-${clientIp.replace(/[:.]/g, "-").slice(0, 16)}.leech` : "unknown");
                        markReferrerSandboxed(targetDomain, sandboxReport.replace("sandbox:", ""));
                        if (kv) await persistAdminStoreToKv(kv);
                        console.log(`[Beacon] Sandbox flagged for ${targetDomain}: ${sandboxReport}`);
                    }
                } catch (beaconErr) {
                    console.warn("[Beacon] Error processing:", beaconErr);
                }
                return new Response("ok", { status: 200, headers: CORS_HEADERS });
            }

            // Admin API: Protected Endpoints
            if (pathname.startsWith("/api/admin/")) {
                const authHeader = request.headers.get("Authorization") || "";
                if (!validateAdminSession(authHeader)) {
                    return new Response(JSON.stringify({ error: "Unauthorized operator session" }), {
                        status: 401,
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                    });
                }

                if (pathname === "/api/admin/state" && request.method === "GET") {
                    return new Response(JSON.stringify(getAdminFullState(), null, 2), {
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json", "Cache-Control": "no-cache, no-store" }
                    });
                }

                if (pathname === "/api/admin/config" && request.method === "POST") {
                    const body = await request.json().catch(() => ({}));
                    if (body.newApiKey) {
                        generateApiKey(body.newApiKey);
                    }
                    const updated = updateAdminConfig(body);
                    if (kv) await persistAdminStoreToKv(kv);
                    return new Response(JSON.stringify({ success: true, config: updated }), {
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                    });
                }

                if (pathname === "/api/admin/firewall" && request.method === "POST") {
                    const body = await request.json().catch(() => ({}));
                    if (body.action === "add" && body.domain && body.type) {
                        addFirewallDomain(body.type, body.domain);
                    } else if (body.action === "remove" && body.domain && body.type) {
                        removeFirewallDomain(body.type, body.domain);
                    }
                    if (kv) await persistAdminStoreToKv(kv);
                    return new Response(JSON.stringify({ success: true, firewall: getAdminConfig().firewall }), {
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                    });
                }

                if (pathname === "/api/admin/servers" && request.method === "POST") {
                    const body = await request.json().catch(() => ({}));
                    const updated = updateAdminConfig({ servers: body });
                    if (kv) await persistAdminStoreToKv(kv);
                    return new Response(JSON.stringify({ success: true, servers: updated.servers }), {
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                    });
                }

                if (pathname === "/api/admin/clear-logs" && request.method === "POST") {
                    const stateObj = getAdminFullState();
                    if (stateObj.securityLog) stateObj.securityLog.length = 0;
                    if (kv) await persistAdminStoreToKv(kv);
                    return new Response(JSON.stringify({ success: true }), {
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                    });
                }

                if (pathname === "/api/admin/clear-telemetry" && request.method === "POST") {
                    clearTelemetry();
                    if (kv) await persistAdminStoreToKv(kv);
                    return new Response(JSON.stringify({ success: true }), {
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                    });
                }
            }

            // 2. Multi-Server Cluster Health & Telemetry
            if (pathname === "/health" || pathname === "/api/health") {
                const forceFresh = url.searchParams.get("fresh") === "1" || url.searchParams.get("force") === "true";
                const healthReport = await checkClusterHealth(env, forceFresh);
                const statusCode = healthReport.status === "offline" ? 503 : (healthReport.status === "degraded" ? 207 : 200);
                return new Response(JSON.stringify(healthReport, null, 2), {
                    status: statusCode,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                        "Cache-Control": forceFresh ? "no-cache, no-store" : "public, max-age=15",
                        "X-Cluster-Status": healthReport.status
                    }
                });
            }

            // 3. AniList Search Endpoint
            if (pathname === "/api/search") {
                const q = url.searchParams.get("q") || url.searchParams.get("query");
                if (!q) {
                    return new Response(JSON.stringify([]), {
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                    });
                }
                const page = parseInt(url.searchParams.get("page"), 10) || 1;
                const results = await searchAnime(q, page, 10);
                return new Response(JSON.stringify(results, null, 2), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=3600"
                    }
                });
            }

            // 4. Anime Metadata by ID
            if (pathname.startsWith("/api/anime/")) {
                const id = pathname.replace("/api/anime/", "").split("/")[0];
                const type = url.searchParams.get("type") || "ani";
                const meta = type === "mal" ? await getAnimeByMalId(id) : await getAnimeByAniListId(id);
                if (!meta) {
                    return new Response(JSON.stringify({ error: "Anime not found" }), {
                        status: 404,
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                    });
                }
                return new Response(JSON.stringify(meta, null, 2), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=86400"
                    }
                });
            }

            // 5. Embed Route: /embed/ani/:id/:ep
            if (pathname.startsWith("/embed/ani/")) {
                const clientReferer = extractClientReferer(request, url);
                if (!isDomainAllowed(clientReferer)) {
                    return getBlockedLeechResponse();
                }

                const parts = pathname.replace("/embed/ani/", "").split("/").filter(Boolean);
                const anilistId = parseInt(parts[0], 10);
                const ep = parseInt(parts[1] || "1", 10) || 1;
                const track = ((parts[2] && (parts[2] === "sub" || parts[2] === "dub")) ? parts[2] : (url.searchParams.get("track") || "sub")).toLowerCase();
                const server = parseInt(url.searchParams.get("server") || "1", 10) || 1;
                const autoPlay = url.searchParams.get("autoPlay") !== "0" ? 1 : 0;
                const autoNext = url.searchParams.get("autoNext") !== "0" ? 1 : 0;
                const autoSkip = url.searchParams.get("autoSkip") !== "0" ? 1 : 0;

                const meta = await getAnimeByAniListId(anilistId);
                recordStreamAccess({ domain: clientReferer, anime: meta?.title || `AniList #${anilistId}`, serverId: server });
                if (kv && ctx && typeof ctx.waitUntil === "function") {
                    ctx.waitUntil(persistAdminStoreToKv(kv));
                }

                const html = renderEmbedHtml({
                    id: String(anilistId),
                    idType: "ani",
                    anilistId,
                    malId: meta?.idMal || null,
                    title: meta?.title || `Anime #${anilistId}`,
                    poster: meta?.poster || "",
                    episode: ep,
                    totalEpisodes: meta?.episodes || 0,
                    track,
                    server,
                    autoPlay,
                    autoNext,
                    autoSkip
                });

                return new Response(html, {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "text/html; charset=utf-8",
                        "Cache-Control": "no-cache, no-store, must-revalidate"
                    }
                });
            }

            // 6. Embed Route: /embed/mal/:id/:ep
            if (pathname.startsWith("/embed/mal/")) {
                const clientReferer = extractClientReferer(request, url);
                if (!isDomainAllowed(clientReferer)) {
                    return getBlockedLeechResponse();
                }

                const parts = pathname.replace("/embed/mal/", "").split("/").filter(Boolean);
                const malId = parseInt(parts[0], 10);
                const ep = parseInt(parts[1] || "1", 10) || 1;
                const track = ((parts[2] && (parts[2] === "sub" || parts[2] === "dub")) ? parts[2] : (url.searchParams.get("track") || "sub")).toLowerCase();
                const server = parseInt(url.searchParams.get("server") || "1", 10) || 1;
                const autoPlay = url.searchParams.get("autoPlay") !== "0" ? 1 : 0;
                const autoNext = url.searchParams.get("autoNext") !== "0" ? 1 : 0;
                const autoSkip = url.searchParams.get("autoSkip") !== "0" ? 1 : 0;

                const meta = await getAnimeByMalId(malId);
                recordStreamAccess({ domain: clientReferer, anime: meta?.title || `MAL #${malId}`, serverId: server });
                if (kv && ctx && typeof ctx.waitUntil === "function") {
                    ctx.waitUntil(persistAdminStoreToKv(kv));
                }

                const html = renderEmbedHtml({
                    id: String(malId),
                    idType: "mal",
                    anilistId: meta?.id || null,
                    malId,
                    title: meta?.title || `Anime MAL #${malId}`,
                    poster: meta?.poster || "",
                    episode: ep,
                    totalEpisodes: meta?.episodes || 0,
                    track,
                    server,
                    autoPlay,
                    autoNext,
                    autoSkip
                });

                return new Response(html, {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "text/html; charset=utf-8",
                        "Cache-Control": "no-cache, no-store, must-revalidate"
                    }
                });
            }

            // 7. General Embed Route: /embed?anilist=... or /embed?mal=... or /embed?id=...
            if (pathname === "/embed" || (pathname.startsWith("/embed/") && !pathname.startsWith("/embed/ani/") && !pathname.startsWith("/embed/mal/"))) {
                const clientReferer = extractClientReferer(request, url);
                if (!isDomainAllowed(clientReferer)) {
                    return getBlockedLeechResponse();
                }

                const anilistParam = url.searchParams.get("anilist") || url.searchParams.get("aniId");
                const malParam = url.searchParams.get("mal") || url.searchParams.get("malId");
                const idParam = url.searchParams.get("id");
                const typeParam = (url.searchParams.get("type") || (malParam ? "mal" : "ani")).toLowerCase();

                const ep = parseInt(url.searchParams.get("ep") || url.searchParams.get("episode") || "1", 10) || 1;
                const track = (url.searchParams.get("track") || "sub").toLowerCase();
                const server = parseInt(url.searchParams.get("server") || "1", 10) || 1;
                const autoPlay = url.searchParams.get("autoPlay") !== "0" ? 1 : 0;
                const autoNext = url.searchParams.get("autoNext") !== "0" ? 1 : 0;
                const autoSkip = url.searchParams.get("autoSkip") !== "0" ? 1 : 0;

                let resolvedAniId = anilistParam ? parseInt(anilistParam, 10) : (typeParam === "ani" && idParam ? parseInt(idParam, 10) : null);
                let resolvedMalId = malParam ? parseInt(malParam, 10) : (typeParam === "mal" && idParam ? parseInt(idParam, 10) : null);

                let meta = null;
                if (resolvedAniId) {
                    meta = await getAnimeByAniListId(resolvedAniId);
                    if (meta?.idMal && !resolvedMalId) resolvedMalId = meta.idMal;
                } else if (resolvedMalId) {
                    meta = await getAnimeByMalId(resolvedMalId);
                    if (meta?.id && !resolvedAniId) resolvedAniId = meta.id;
                }

                const effectiveId = resolvedAniId || resolvedMalId || idParam || "21";
                recordStreamAccess({ domain: clientReferer, anime: meta?.title || `Anime #${effectiveId}`, serverId: server });
                if (kv && ctx && typeof ctx.waitUntil === "function") {
                    ctx.waitUntil(persistAdminStoreToKv(kv));
                }

                const html = renderEmbedHtml({
                    id: String(effectiveId),
                    idType: resolvedAniId ? "ani" : "mal",
                    anilistId: resolvedAniId,
                    malId: resolvedMalId,
                    title: meta?.title || `Anime #${effectiveId}`,
                    poster: meta?.poster || "",
                    episode: ep,
                    totalEpisodes: meta?.episodes || 0,
                    track,
                    server,
                    autoPlay,
                    autoNext,
                    autoSkip
                });

                return new Response(html, {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "text/html; charset=utf-8",
                        "Cache-Control": "no-cache, no-store, must-revalidate"
                    }
                });
            }

            // 8. Stream Resolver API (Called by embed player with automatic server failover)
            if (pathname === "/api/stream/resolve") {
                const parentParam = url.searchParams.get("parentHost") || url.searchParams.get("ref");
                if (parentParam && parentParam !== url.hostname) {
                    const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
                    if (clientIp) {
                        const maskedPrefix = `masked-iframe-${clientIp.replace(/[:.]/g, "-").slice(0, 16)}`;
                        unmaskReferrer(maskedPrefix, parentParam);
                    }
                }

                const clientReferer = extractClientReferer(request, url);
                if (!isDomainAllowed(clientReferer)) {
                    return getBlockedLeechResponse();
                }

                // Honeypot & Decoy Stream Poisoning for automated scrapers and datacenter bots
                if (isScraperRequest(request) || isDatacenterIp(request)) {
                    const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "127.0.0.1";
                    const userAgent = request.headers.get("user-agent") || "automated-scraper";
                    recordHoneypotTrap({ ip: clientIp, userAgent, path: pathname });

                    const honeypotData = getHoneypotStreamResponse(baseUrl);
                    return new Response(JSON.stringify(honeypotData, null, 2), {
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "application/json",
                            "Cache-Control": "no-cache, no-store",
                            "X-Honeypot-Engaged": "1",
                            "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER
                        }
                    });
                }

                const anilistId = url.searchParams.get("anilistId");
                const malId = url.searchParams.get("malId");
                const title = url.searchParams.get("title");
                const episode = parseInt(url.searchParams.get("episode") || "1", 10) || 1;
                const track = (url.searchParams.get("track") || "sub").toLowerCase();
                const preferredServer = parseInt(url.searchParams.get("server") || "1", 10) || 1;

                const result = await resolveStreamWithFailover({
                    anilistId,
                    malId,
                    title,
                    episode,
                    track,
                    preferredServer
                }, env);

                const maskedResult = maskStreamResult(result, baseUrl);

                recordStreamAccess({
                    domain: clientReferer,
                    anime: title || (anilistId ? `AniList #${anilistId}` : (malId ? `MAL #${malId}` : "")),
                    serverId: result.serverId || preferredServer
                });
                if (kv && ctx && typeof ctx.waitUntil === "function") {
                    ctx.waitUntil(persistAdminStoreToKv(kv));
                }

                return new Response(JSON.stringify(maskedResult, null, 2), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=900",
                        "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER
                    }
                });
            }

            // 9. Specific Server Stream Resolver
            if (pathname.startsWith("/api/stream/server/")) {
                const clientReferer = extractClientReferer(request, url);
                if (!isDomainAllowed(clientReferer)) {
                    return getBlockedLeechResponse();
                }

                // Honeypot & Decoy Stream Poisoning for automated scrapers and datacenter bots
                if (isScraperRequest(request) || isDatacenterIp(request)) {
                    const honeypotData = getHoneypotStreamResponse(baseUrl);
                    return new Response(JSON.stringify(honeypotData, null, 2), {
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "application/json",
                            "Cache-Control": "no-cache, no-store",
                            "X-Honeypot-Engaged": "1",
                            "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER
                        }
                    });
                }

                const serverId = parseInt(pathname.replace("/api/stream/server/", "").split("/")[0], 10) || 1;
                const anilistId = url.searchParams.get("anilistId");
                const malId = url.searchParams.get("malId");
                const title = url.searchParams.get("title");
                const episode = parseInt(url.searchParams.get("episode") || "1", 10) || 1;
                const track = (url.searchParams.get("track") || "sub").toLowerCase();

                const result = await resolveSpecificServer({
                    serverId,
                    anilistId,
                    malId,
                    title,
                    episode,
                    track
                }, env);

                const maskedResult = maskStreamResult(result, baseUrl);

                recordStreamAccess({
                    domain: clientReferer,
                    anime: title || (anilistId ? `AniList #${anilistId}` : (malId ? `MAL #${malId}` : "")),
                    serverId
                });
                if (kv && ctx && typeof ctx.waitUntil === "function") {
                    ctx.waitUntil(persistAdminStoreToKv(kv));
                }

                return new Response(JSON.stringify(maskedResult, null, 2), {
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=900",
                        "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER
                    }
                });
            }

            // 10. Master & Variant M3U8 Stream Proxy (Completely conceals backend worker & upstream CDNs)
            if (pathname === "/api/stream/m3u8" || pathname === "/api/proxy/m3u8") {
                const clientReferer = extractClientReferer(request, url);
                if (clientReferer && !isDomainAllowed(clientReferer)) {
                    return new Response("Leech domain blocked by Anixo Shield", { status: 403, headers: CORS_HEADERS });
                }
                const isHoneypotParam = url.searchParams.get("h") === "1";
                const isBot = isScraperRequest(request) || isDatacenterIp(request);
                const isHoneypot = isHoneypotParam || isBot;

                const token = url.searchParams.get("t") || url.searchParams.get("token");
                if (!token) {
                    return new Response("Missing stream token", { status: 400, headers: CORS_HEADERS });
                }
                let targetUrl = decryptStreamToken(token);
                if (!targetUrl || !targetUrl.startsWith("http")) {
                    return new Response("Invalid stream token", { status: 403, headers: CORS_HEADERS });
                }

                // If scraper requested directly with a stolen token, poison the stream with decoy HLS
                if (isBot && !isHoneypotParam) {
                    targetUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
                }

                let fetcher = fetch;
                if (targetUrl.includes("aniko-backend") && env?.MEGAPLAY_SERVICE?.fetch) {
                    fetcher = (u, init) => env.MEGAPLAY_SERVICE.fetch(u, init);
                } else if (targetUrl.includes("anineko-api") && env?.ANINEKO_SERVICE?.fetch) {
                    fetcher = (u, init) => env.ANINEKO_SERVICE.fetch(u, init);
                } else if (targetUrl.includes("zoko-stream") && env?.ZOKO_SERVICE?.fetch) {
                    fetcher = (u, init) => env.ZOKO_SERVICE.fetch(u, init);
                }

                const forwardHeaders = {
                    "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/124.0.0.0",
                    "Accept": request.headers.get("Accept") || "*/*",
                    "x-cluster-internal": CLUSTER_SECRET
                };
                if (request.headers.get("Range")) {
                    forwardHeaders["Range"] = request.headers.get("Range");
                }

                const upstreamRes = await fetcher(targetUrl, { headers: forwardHeaders });
                if (!upstreamRes.ok && upstreamRes.status !== 206) {
                    return new Response(upstreamRes.body, {
                        status: upstreamRes.status,
                        headers: CORS_HEADERS
                    });
                }

                const contentType = upstreamRes.headers.get("content-type") || "";
                const isPlaylist = contentType.includes("mpegurl") || contentType.includes("application/x-mpegURL") || contentType.includes("application/vnd.apple.mpegurl") || targetUrl.includes(".m3u8") || targetUrl.includes("/m3u8");

                if (isPlaylist) {
                    const text = await upstreamRes.text();
                    let noticeInjected = false;
                    const rewritten = text.split('\n').map(line => {
                        const trimmed = line.trim();
                        if (!trimmed) return line;

                        if (trimmed.startsWith('#EXTM3U') && !noticeInjected) {
                            noticeInjected = true;
                            return '#EXTM3U\n# NOTICE: ' + SCRAPER_NOTICE_TEXT;
                        }

                        if (trimmed.startsWith('#')) {
                            return line.replace(/URI="([^"]+)"/g, (match, uri) => {
                                const fullUri = new URL(uri, targetUrl).toString();
                                return `URI="${baseUrl}/api/stream/m3u8?t=${encryptStreamToken(fullUri)}${isHoneypot ? '&h=1' : ''}"`;
                            });
                        }

                        const fullUrl = new URL(trimmed, targetUrl).toString();
                        if (fullUrl.includes('.m3u8') || fullUrl.includes('/m3u8') || fullUrl.includes('aniko-backend') || fullUrl.includes('anineko') || fullUrl.includes('zoko') || fullUrl.includes('norami') || fullUrl.includes('megap') || fullUrl.includes('mux.dev')) {
                            return `${baseUrl}/api/stream/m3u8?t=${encryptStreamToken(fullUrl)}${isHoneypot ? '&h=1' : ''}`;
                        }
                        return fullUrl;
                    }).join('\n');

                    return new Response(rewritten, {
                        status: 200,
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "application/vnd.apple.mpegurl",
                            "Cache-Control": isHoneypot ? "no-cache, no-store" : "public, max-age=60",
                            "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER,
                            ...(isHoneypot ? { "X-Honeypot-Engaged": "1" } : {})
                        }
                    });
                }

                const responseHeaders = {
                    ...CORS_HEADERS,
                    "Content-Type": contentType || "video/MP2T",
                    "Cache-Control": isHoneypot ? "no-cache, no-store" : "public, max-age=86400",
                    "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER,
                    ...(isHoneypot ? { "X-Honeypot-Engaged": "1" } : {})
                };
                if (upstreamRes.headers.get("Content-Range")) {
                    responseHeaders["Content-Range"] = upstreamRes.headers.get("Content-Range");
                }
                if (upstreamRes.headers.get("Content-Length")) {
                    responseHeaders["Content-Length"] = upstreamRes.headers.get("Content-Length");
                }
                return new Response(upstreamRes.body, {
                    status: upstreamRes.status,
                    headers: responseHeaders
                });
            }

            // 11. Subtitle WebVTT Proxy (Completely conceals upstream subtitle CDN)
            if (pathname === "/api/stream/vtt" || pathname === "/api/proxy/vtt") {
                if (url.searchParams.get("h") === "1" || isScraperRequest(request)) {
                    return new Response(getHoneypotVttContent(), {
                        status: 200,
                        headers: {
                            ...CORS_HEADERS,
                            "Content-Type": "text/vtt; charset=utf-8",
                            "Cache-Control": "public, max-age=3600",
                            "X-Honeypot-Engaged": "1",
                            "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER
                        }
                    });
                }

                const token = url.searchParams.get("t") || url.searchParams.get("token");
                if (!token) {
                    return new Response("Missing vtt token", { status: 400, headers: CORS_HEADERS });
                }
                const targetUrl = decryptStreamToken(token);
                if (!targetUrl || !targetUrl.startsWith("http")) {
                    return new Response("Invalid vtt token", { status: 403, headers: CORS_HEADERS });
                }

                let fetcher = fetch;
                if (targetUrl.includes("aniko-backend") && env?.MEGAPLAY_SERVICE?.fetch) {
                    fetcher = (u, init) => env.MEGAPLAY_SERVICE.fetch(u, init);
                } else if (targetUrl.includes("anineko-api") && env?.ANINEKO_SERVICE?.fetch) {
                    fetcher = (u, init) => env.ANINEKO_SERVICE.fetch(u, init);
                } else if (targetUrl.includes("zoko-stream") && env?.ZOKO_SERVICE?.fetch) {
                    fetcher = (u, init) => env.ZOKO_SERVICE.fetch(u, init);
                }

                const upstreamRes = await fetcher(targetUrl, {
                    headers: {
                        "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                        "x-cluster-internal": CLUSTER_SECRET
                    }
                });

                const vttText = await upstreamRes.text();
                const noticeVtt = vttText.replace(/^WEBVTT/i, 'WEBVTT\nNOTE Notice: ' + SCRAPER_NOTICE_TEXT + '\n');

                return new Response(noticeVtt, {
                    status: upstreamRes.status,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": "text/vtt; charset=utf-8",
                        "Cache-Control": "public, max-age=86400",
                        "X-Scraper-Advisory": SCRAPER_NOTICE_HEADER
                    }
                });
            }

            // 404 Route Not Found
            return new Response(JSON.stringify({ error: "Route not found", path: pathname }), {
                status: 404,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
            });

        } catch (err) {
            console.error("Worker error:", err);
            return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
                status: 500,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
            });
        }
    }
};
