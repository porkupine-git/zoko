/**
 * ANIXO ADMIN STATE & STORAGE ENGINE
 * In-memory edge-compatible store with durable state defaults.
 * Controls multi-node routing, domain firewall, honeypot logs,
 * live telemetry, player branding, and client API keys.
 */

// Global state container
const state = {
    auth: {
        masterPassword: process.env.ADMIN_PASSWORD || "anixo_admin_2026",
        activeSessions: new Set()
    },
    servers: {
        primary: 1, // 1: Sora (MegaPlay), 2: Neko (AniNeko), 3: Zozo (Zoko)
        enabled: {
            1: true,
            2: true,
            3: true
        },
        maintenance: {
            1: false,
            2: false,
            3: false
        },
        lastTested: null
    },
    firewall: {
        mode: "public", // "public" (allow all except blacklist) or "whitelist" (allow only whitelist)
        whitelist: [
            "localhost",
            "127.0.0.1",
            "anixo.buzz",
            "anime-embed.rk18109ry.workers.dev"
        ],
        blacklist: [],
        hotlinkProtection: false, // Block direct stream URL access outside iframe
        blockedRequestsCount: 0
    },
    branding: {
        watermarkEnabled: false,
        watermarkText: "",
        watermarkPosition: "top-right",
        watermarkOpacity: 0,
        watermarkLink: ""
    },
    monetization: {
        adsEnabled: true,
        popunderUrl: '<script data-cfasync="false" async type="text/javascript" src="//pu.genosstamnoi.com/rm4QxPbrFDcmhK/152228"></script>',
        cappingMode: "natural", // "natural" (ad network managed) or "custom" (custom cooldown & caps)
        gapValue: 30,
        gapUnit: "minutes", // "minutes", "hours", or "seconds"
        maxAdsPerDay: 3,
        clickTrigger: 1, // trigger on 1st click, 2nd click, or every click
        popunderFrequencyHours: 24,
        adFreeDomains: []
    },
    apiKeys: [
        {
            key: "anx_live_demo_client_9821",
            name: "Default Demo Partner",
            domain: "all",
            tier: "Partner",
            created: new Date().toISOString().split("T")[0],
            active: true
        }
    ],
    telemetry: {
        startTime: Date.now(),
        totalStreams: 0,
        totalBytesEstimated: 0,
        activeStreamsEstimate: 0,
        referrers: {}, // domain -> count
        topAnime: {},   // titleOrId -> count
        serverRequests: {
            1: 0,
            2: 0,
            3: 0
        }
    },
    securityLog: [] // last 50 bot traps & security events
};

// ── Auth Utilities ──
export function verifyAdminPassword(password) {
    if (!password) return false;
    return password === state.auth.masterPassword;
}

export function createAdminSession() {
    const token = "anx_sess_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    state.auth.activeSessions.add(token);
    // Cleanup old sessions if exceeding 100
    if (state.auth.activeSessions.size > 100) {
        const first = state.auth.activeSessions.values().next().value;
        state.auth.activeSessions.delete(first);
    }
    return token;
}

export function validateAdminSession(token) {
    if (!token) return false;
    const clean = token.replace(/^Bearer\s+/i, "").trim();
    return state.auth.activeSessions.has(clean);
}

export function revokeAdminSession(token) {
    if (!token) return;
    const clean = token.replace(/^Bearer\s+/i, "").trim();
    state.auth.activeSessions.delete(clean);
}

// ── Config Management ──
export function getAdminConfig() {
    return {
        servers: { ...state.servers },
        firewall: {
            mode: state.firewall.mode,
            whitelist: [...state.firewall.whitelist],
            blacklist: [...state.firewall.blacklist],
            hotlinkProtection: state.firewall.hotlinkProtection,
            blockedRequestsCount: state.firewall.blockedRequestsCount
        },
        branding: { ...state.branding },
        monetization: {
            adsEnabled: state.monetization.adsEnabled,
            popunderUrl: state.monetization.popunderUrl,
            cappingMode: state.monetization.cappingMode || "natural",
            gapValue: state.monetization.gapValue !== undefined ? state.monetization.gapValue : 30,
            gapUnit: state.monetization.gapUnit || "minutes",
            maxAdsPerDay: state.monetization.maxAdsPerDay !== undefined ? state.monetization.maxAdsPerDay : 3,
            clickTrigger: state.monetization.clickTrigger !== undefined ? state.monetization.clickTrigger : 1,
            popunderFrequencyHours: state.monetization.popunderFrequencyHours || 24,
            adFreeDomains: [...state.monetization.adFreeDomains]
        },
        apiKeys: [...state.apiKeys]
    };
}

export function updateAdminConfig(patch = {}) {
    if (patch.servers) {
        if (patch.servers.primary) state.servers.primary = parseInt(patch.servers.primary, 10);
        if (patch.servers.enabled) state.servers.enabled = { ...state.servers.enabled, ...patch.servers.enabled };
        if (patch.servers.maintenance) state.servers.maintenance = { ...state.servers.maintenance, ...patch.servers.maintenance };
    }
    if (patch.firewall) {
        if (patch.firewall.mode) state.firewall.mode = patch.firewall.mode;
        if (Array.isArray(patch.firewall.whitelist)) state.firewall.whitelist = patch.firewall.whitelist.map(normalizeHostname).filter(Boolean);
        if (Array.isArray(patch.firewall.blacklist)) state.firewall.blacklist = patch.firewall.blacklist.map(normalizeHostname).filter(Boolean);
        if (typeof patch.firewall.hotlinkProtection === "boolean") state.firewall.hotlinkProtection = patch.firewall.hotlinkProtection;
    }
    if (patch.branding) {
        state.branding = { ...state.branding, ...patch.branding };
    }
    if (patch.monetization) {
        state.monetization = { ...state.monetization, ...patch.monetization };
    }
    return getAdminConfig();
}

// ── Firewall Enforcement ──
function normalizeHostname(str) {
    if (!str) return "";
    let clean = String(str).trim().toLowerCase();
    try {
        if (clean.includes("://")) {
            clean = new URL(clean).hostname;
        } else {
            clean = clean.split("/")[0].split(":")[0];
        }
    } catch {
        clean = clean.split("/")[0].split(":")[0];
    }
    return clean;
}

export function isDomainAllowed(refererOrOrigin = "") {
    if (!refererOrOrigin) {
        // Direct browser visit or curl
        return !state.firewall.hotlinkProtection;
    }

    const host = normalizeHostname(refererOrOrigin);
    if (!host) return true;

    // Check blacklist first
    for (const b of state.firewall.blacklist) {
        if (host === b || host.endsWith("." + b)) {
            state.firewall.blockedRequestsCount++;
            return false;
        }
    }

    // If whitelist mode, domain MUST be explicitly listed
    if (state.firewall.mode === "whitelist") {
        let matched = false;
        for (const w of state.firewall.whitelist) {
            if (host === w || host.endsWith("." + w)) {
                matched = true;
                break;
            }
        }
        if (!matched) {
            state.firewall.blockedRequestsCount++;
            return false;
        }
    }

    return true;
}

export function addFirewallDomain(type, domain) {
    const clean = normalizeHostname(domain);
    if (!clean) return;
    if (type === "whitelist" && !state.firewall.whitelist.includes(clean)) {
        state.firewall.whitelist.push(clean);
        // Remove from blacklist if present
        state.firewall.blacklist = state.firewall.blacklist.filter(d => d !== clean);
    } else if (type === "blacklist" && !state.firewall.blacklist.includes(clean)) {
        state.firewall.blacklist.push(clean);
        // Remove from whitelist if present
        state.firewall.whitelist = state.firewall.whitelist.filter(d => d !== clean);
    }
}

export function removeFirewallDomain(type, domain) {
    const clean = normalizeHostname(domain);
    if (type === "whitelist") {
        state.firewall.whitelist = state.firewall.whitelist.filter(d => d !== clean);
    } else if (type === "blacklist") {
        state.firewall.blacklist = state.firewall.blacklist.filter(d => d !== clean);
    }
}

// ── Telemetry & Metrics Recording ──
export function recordStreamAccess({ domain = "direct", anime = "", serverId = 1, bytes = 0 }) {
    state.telemetry.totalStreams++;
    const estBytes = bytes || (15 * 1024 * 1024); // ~15MB default estimate per video mount
    state.telemetry.totalBytesEstimated += estBytes;

    const normDomain = normalizeHostname(domain) || "direct";
    const existing = state.telemetry.referrers[normDomain];

    if (existing && typeof existing === "object") {
        existing.count = (existing.count || 0) + 1;
        existing.bytes = (existing.bytes || 0) + estBytes;
        existing.lastSeen = Date.now();
        if (anime) {
            existing.animeList = existing.animeList || {};
            existing.animeList[anime] = (existing.animeList[anime] || 0) + 1;
            // update top anime for this domain
            let bestTitle = existing.topAnime || anime;
            let bestCount = existing.animeList[bestTitle] || 0;
            if (existing.animeList[anime] > bestCount) {
                existing.topAnime = anime;
            }
        }
    } else {
        const prevCount = typeof existing === "number" ? existing : 0;
        state.telemetry.referrers[normDomain] = {
            count: prevCount + 1,
            bytes: estBytes,
            lastSeen: Date.now(),
            animeList: anime ? { [anime]: 1 } : {},
            topAnime: anime || ""
        };
    }

    if (anime) {
        state.telemetry.topAnime[anime] = (state.telemetry.topAnime[anime] || 0) + 1;
    }

    if (serverId && state.telemetry.serverRequests[serverId] !== undefined) {
        state.telemetry.serverRequests[serverId]++;
    }
}

export function clearTelemetry() {
    state.telemetry = {
        startTime: Date.now(),
        totalStreams: 0,
        totalBytesEstimated: 0,
        activeStreamsEstimate: 0,
        referrers: {},
        topAnime: {},
        serverRequests: { 1: 0, 2: 0, 3: 0 }
    };
}

export function recordHoneypotTrap({ ip = "unknown", userAgent = "unknown", path = "" }) {
    const entry = {
        id: "trap_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        ip,
        userAgent: userAgent.length > 80 ? userAgent.substring(0, 80) + "..." : userAgent,
        path,
        timestamp: new Date().toISOString()
    };
    state.securityLog.unshift(entry);
    if (state.securityLog.length > 50) {
        state.securityLog.pop();
    }
}

// ── API Key Management ──
export function generateApiKey({ name = "Partner", domain = "all", tier = "Standard" }) {
    const key = "anx_live_" + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const item = {
        key,
        name,
        domain: normalizeHostname(domain) || "all",
        tier,
        created: new Date().toISOString().split("T")[0],
        active: true
    };
    state.apiKeys.push(item);
    return item;
}

export function toggleApiKey(key) {
    const target = state.apiKeys.find(k => k.key === key);
    if (target) {
        target.active = !target.active;
    }
}

export function deleteApiKey(key) {
    state.apiKeys = state.apiKeys.filter(k => k.key !== key);
}

// ── Complete State Snapshot for Admin Dashboard ──
export function getAdminFullState() {
    const whitelist = state.firewall.whitelist || [];
    const blacklist = state.firewall.blacklist || [];

    const topReferrers = Object.entries(state.telemetry.referrers)
        .map(([domain, data]) => {
            const count = typeof data === "number" ? data : (data.count || 1);
            const bytes = (typeof data === "object" && data.bytes) ? data.bytes : (count * 15 * 1024 * 1024);
            const lastSeen = (typeof data === "object" && data.lastSeen) ? data.lastSeen : state.telemetry.startTime;
            const topAnime = (typeof data === "object" && data.topAnime) ? data.topAnime : "";

            let status = "external";
            if (domain === "anixo.buzz" || domain === "localhost" || domain === "127.0.0.1" || domain.includes("workers.dev")) {
                status = "official";
            } else if (blacklist.includes(domain)) {
                status = "blocked";
            } else if (whitelist.includes(domain)) {
                status = "whitelisted";
            }

            return {
                domain,
                count,
                bandwidthMB: Math.round(bytes / (1024 * 1024)),
                lastSeen,
                topAnime,
                status
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 30);

    return {
        config: getAdminConfig(),
        telemetry: {
            uptimeSeconds: Math.floor((Date.now() - state.telemetry.startTime) / 1000),
            totalStreams: state.telemetry.totalStreams,
            totalBandwidthMB: Math.round(state.telemetry.totalBytesEstimated / (1024 * 1024)),
            blockedRequests: state.firewall.blockedRequestsCount,
            topReferrers,
            topAnime: Object.entries(state.telemetry.topAnime)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15)
                .map(([title, count]) => ({ title, count })),
            serverDistribution: { ...state.telemetry.serverRequests }
        },
        securityLog: [...state.securityLog]
    };
}

// ── Cloudflare Workers KV Persistence ──
let kvLoaded = false;
let lastSyncTime = 0;

export async function syncAdminStoreWithKv(kv, force = false) {
    if (!kv) return;
    const now = Date.now();
    if (kvLoaded && !force && (now - lastSyncTime < 3000)) return;
    try {
        const saved = await kv.get("anixo_admin_persistent_state", "json");
        if (saved) {
            if (saved.servers) {
                state.servers = { ...state.servers, ...saved.servers };
            }
            if (saved.firewall) {
                state.firewall = {
                    ...state.firewall,
                    ...saved.firewall,
                    blockedRequestsCount: state.firewall.blockedRequestsCount
                };
            }
            if (saved.monetization) {
                state.monetization = { ...state.monetization, ...saved.monetization };
            }
            if (Array.isArray(saved.apiKeys)) {
                state.apiKeys = saved.apiKeys;
            }
            if (Array.isArray(saved.securityLog)) {
                state.securityLog = saved.securityLog;
            }
            if (Array.isArray(saved.activeSessions)) {
                for (const s of saved.activeSessions) {
                    state.auth.activeSessions.add(s);
                }
            }
            if (saved.telemetry) {
                state.telemetry.totalStreams = Math.max(state.telemetry.totalStreams, saved.telemetry.totalStreams || 0);
                state.telemetry.totalBytesEstimated = Math.max(state.telemetry.totalBytesEstimated, saved.telemetry.totalBytesEstimated || 0);
                if (saved.telemetry.referrers) {
                    for (const [dom, obj] of Object.entries(saved.telemetry.referrers)) {
                        if (!state.telemetry.referrers[dom]) {
                            state.telemetry.referrers[dom] = obj;
                        } else {
                            const cur = state.telemetry.referrers[dom];
                            const curCount = typeof cur === "object" ? cur.count : cur;
                            const newCount = typeof obj === "object" ? obj.count : obj;
                            if (newCount > curCount) {
                                state.telemetry.referrers[dom] = obj;
                            }
                        }
                    }
                }
                if (saved.telemetry.topAnime) {
                    for (const [title, c] of Object.entries(saved.telemetry.topAnime)) {
                        state.telemetry.topAnime[title] = Math.max(state.telemetry.topAnime[title] || 0, c || 0);
                    }
                }
            }
        }
        kvLoaded = true;
        lastSyncTime = now;
    } catch (e) {
        console.error("KV sync error:", e);
    }
}

export async function persistAdminStoreToKv(kv) {
    if (!kv) return;
    try {
        const persistentData = {
            servers: state.servers,
            firewall: {
                mode: state.firewall.mode,
                whitelist: state.firewall.whitelist,
                blacklist: state.firewall.blacklist,
                hotlinkProtection: state.firewall.hotlinkProtection
            },
            monetization: state.monetization,
            apiKeys: state.apiKeys,
            securityLog: state.securityLog.slice(0, 50),
            activeSessions: Array.from(state.auth.activeSessions).slice(-30),
            telemetry: {
                totalStreams: state.telemetry.totalStreams,
                totalBytesEstimated: state.telemetry.totalBytesEstimated,
                referrers: state.telemetry.referrers,
                topAnime: state.telemetry.topAnime,
                serverRequests: state.telemetry.serverRequests
            }
        };
        await kv.put("anixo_admin_persistent_state", JSON.stringify(persistentData));
        kvLoaded = true;
    } catch (e) {
        console.error("KV persist error:", e);
    }
}

