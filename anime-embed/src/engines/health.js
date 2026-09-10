/**
 * MULTI-SERVER CLUSTER HEALTH MONITORING ENGINE
 * Probes and benchmarks all 3 streaming engines and metadata upstreams in parallel
 */

import { getAdminConfig } from '../admin/adminStore.js';

export const SERVERS_CONFIG = [
    {
        id: 1,
        key: "server1",
        name: "Server 1 (Sora Edge)",
        shortName: "Sora Edge",
        endpoint: "https://aniko-backend.rk18109ry.workers.dev/health",
        streamPath: "/api/stream/ani/21/1/sub",
        engine: "Sora Ultra-Fast Edge CDN",
        description: "Direct HLS extraction, VTT subtitles, OP/ED auto-skip markers",
        serviceBinding: "MEGAPLAY_SERVICE"
    },
    {
        id: 2,
        key: "server2",
        name: "Server 2 (Neko Multi-CDN)",
        shortName: "Neko Multi-CDN",
        endpoint: "https://anineko-api.rk18109ry.workers.dev/health",
        streamPath: "/api/watch/21/sub/1",
        engine: "Neko High-Throughput CDN",
        description: "Multi-CDN failover engine with automated upstream recovery",
        serviceBinding: "ANINEKO_SERVICE"
    },
    {
        id: 3,
        key: "server3",
        name: "Server 3 (Zozo Edge Engine)",
        shortName: "Zozo Edge Engine",
        endpoint: "https://zoko-stream.rk18109ry.workers.dev/health",
        streamPath: "/api/stream?id=21&ep=1&track=sub",
        engine: "Zozo Cipher Decryption Engine",
        description: "Deobfuscated master streams with frame-accurate cue sync",
        serviceBinding: "ZOKO_SERVICE"
    }
];

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const HEALTH_CACHE_TTL_MS = 15000; // 15 seconds micro-cache

let cachedHealthData = null;
let lastCacheTimestamp = 0;

/**
 * Probes an individual server with strict timeout and latency measurement
 */
export async function probeServer(serverConfig, env = {}) {
    const start = Date.now();
    const binding = env?.[serverConfig.serviceBinding];
    const fetcher = binding?.fetch ? (u, init) => binding.fetch(u, init) : fetch;

    try {
        const res = await fetcher(serverConfig.endpoint, {
            headers: { "User-Agent": USER_AGENT },
            signal: AbortSignal.timeout(4500)
        });

        const latencyMs = Math.max(1, Date.now() - start);
        let details = null;
        try {
            details = await res.json();
        } catch {
            details = { status: res.ok ? "online" : "error" };
        }

        const isOperational = res.ok && (
            details?.status === "online" ||
            details?.status === "healthy" ||
            res.status === 200
        );

        return {
            id: serverConfig.id,
            key: serverConfig.key,
            name: serverConfig.name,
            shortName: serverConfig.shortName,
            engine: serverConfig.engine,
            description: serverConfig.description,
            endpoint: "/health",
            status: isOperational ? "operational" : (res.ok ? "degraded" : "offline"),
            httpStatus: res.status,
            latencyMs,
            colo: details?.colo || "EDGE",
            plan: details?.plan || details?.tier || "Edge Cloud",
            details: {
                service: details?.service || serverConfig.shortName,
                platform: details?.platform || "cloudflare-workers",
                timestamp: details?.timestamp || new Date().toISOString()
            }
        };
    } catch (err) {
        const latencyMs = Math.max(1, Date.now() - start);
        const isTimeout = err.name === "TimeoutError" || err.message?.includes("timeout");
        return {
            id: serverConfig.id,
            key: serverConfig.key,
            name: serverConfig.name,
            shortName: serverConfig.shortName,
            engine: serverConfig.engine,
            description: serverConfig.description,
            endpoint: "/health",
            status: isTimeout ? "degraded" : "offline",
            httpStatus: 0,
            latencyMs,
            colo: "TIMEOUT",
            error: err.message || "Connection failed",
            details: null
        };
    }
}

/**
 * Checks metadata upstream APIs (Jikan MAL API)
 */
export async function probeMetadataApi() {
    const start = Date.now();
    try {
        const res = await fetch("https://api.jikan.moe/v4/anime/21", {
            headers: { "User-Agent": USER_AGENT },
            signal: AbortSignal.timeout(4000)
        });
        const latencyMs = Math.max(1, Date.now() - start);
        return {
            name: "MyAnimeList (Jikan v4 API)",
            status: res.ok ? "operational" : "degraded",
            httpStatus: res.status,
            latencyMs
        };
    } catch (err) {
        return {
            name: "MyAnimeList (Jikan v4 API)",
            status: "offline",
            httpStatus: 0,
            latencyMs: Math.max(1, Date.now() - start),
            error: err.message
        };
    }
}

/**
 * Checks overall cluster health across all 3 streaming engines
 */
export async function checkClusterHealth(env = {}, forceFresh = false) {
    const now = Date.now();
    if (!forceFresh && cachedHealthData && (now - lastCacheTimestamp < HEALTH_CACHE_TTL_MS)) {
        return {
            ...cachedHealthData,
            cached: true,
            cacheAgeSeconds: Math.floor((now - lastCacheTimestamp) / 1000)
        };
    }

    const [serversResults, metaResult] = await Promise.all([
        Promise.all(SERVERS_CONFIG.map(cfg => probeServer(cfg, env))),
        probeMetadataApi()
    ]);

    const operationalCount = serversResults.filter(s => s.status === "operational").length;
    const degradedCount = serversResults.filter(s => s.status === "degraded").length;
    const totalCount = serversResults.length;

    let clusterStatus = "operational";
    if (operationalCount === 0) {
        clusterStatus = "offline";
    } else if (operationalCount < totalCount || degradedCount > 0) {
        clusterStatus = "degraded";
    }

    const validLatencies = serversResults.filter(s => s.latencyMs > 0).map(s => s.latencyMs);
    const avgLatencyMs = validLatencies.length > 0 
        ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length)
        : 0;

    const adminConfig = getAdminConfig();
    const prim = adminConfig?.servers?.primary || 1;
    const cascadeOrder = [prim, ...[1, 2, 3].filter(s => s !== prim)];
    const cascadeNames = cascadeOrder.map(s => {
        const isMaint = adminConfig?.servers?.maintenance?.[s] === true;
        return `Server ${s}${s === prim ? ' (Primary)' : ''}${isMaint ? ' [Paused]' : ''}`;
    }).join(' -> ');

    const report = {
        status: clusterStatus,
        service: "Anixo Cluster Health Monitor",
        version: "1.2.0",
        timestamp: new Date().toISOString(),
        cluster: {
            status: clusterStatus,
            operationalServers: operationalCount,
            totalServers: totalCount,
            averageLatencyMs: avgLatencyMs,
            failoverReady: operationalCount >= 2,
            strategy: `Failover Cascade (${cascadeNames})`
        },
        servers: serversResults,
        metadata: metaResult,
        cached: false
    };

    cachedHealthData = report;
    lastCacheTimestamp = now;

    return report;
}
