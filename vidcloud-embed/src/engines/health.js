/**
 * VIDCLOUD EDGE & PLAYER HEALTH MONITOR
 * Lightweight health checker monitoring player.anixo.online and metadata upstreams
 */

export async function checkClusterHealth(env = {}) {
    const playerOrigin = env?.PLAYER_ORIGIN || "https://player.anixo.online";
    const start = Date.now();

    const [playerRes, metaRes] = await Promise.allSettled([
        fetch(`${playerOrigin}/health`, { signal: AbortSignal.timeout(3500) })
            .then(r => ({ ok: r.ok, status: r.status, latency: Math.max(1, Date.now() - start) }))
            .catch(e => ({ ok: false, error: e.message, latency: Math.max(1, Date.now() - start) })),
        fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: "{ Page(page: 1, perPage: 1) { media { id } } }" }),
            signal: AbortSignal.timeout(3500)
        })
            .then(r => ({ ok: r.ok, latency: Math.max(1, Date.now() - start) }))
            .catch(e => ({ ok: false, error: e.message, latency: Math.max(1, Date.now() - start) }))
    ]);

    const playerOnline = playerRes.status === "fulfilled" && playerRes.value.ok;
    const metaOnline = metaRes.status === "fulfilled" && metaRes.value.ok;

    return {
        status: playerOnline ? "operational" : "degraded",
        service: "VidCloud Gateway Health",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        playerEngine: {
            endpoint: playerOrigin,
            status: playerOnline ? "operational" : "offline",
            latencyMs: playerRes.value?.latency || 0
        },
        metadataApi: {
            endpoint: "https://graphql.anilist.co",
            status: metaOnline ? "operational" : "degraded",
            latencyMs: metaRes.value?.latency || 0
        }
    };
}
