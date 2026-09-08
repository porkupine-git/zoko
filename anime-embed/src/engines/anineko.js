/**
 * SERVER 2 ENGINE: AniNeko Multi-CDN Resolver
 * Failover engine with StreamHG, VidHide, and BibiEmb backends
 */

const ANINEKO_BACKEND_URL = "https://anineko-api.rk18109ry.workers.dev";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function resolveAniNekoStream({ anilistId, malId, title, episode = 1, track = "sub" }, env = {}) {
    const targetId = anilistId || malId;
    if (!targetId && !title) {
        throw new Error("AniNeko requires anilistId, malId, or title");
    }

    let url = `${ANINEKO_BACKEND_URL}/api/watch/${targetId || encodeURIComponent(title)}/${track}/${episode}`;
    if (title) url += `?title=${encodeURIComponent(title)}`;

    const fetcher = env?.ANINEKO_SERVICE?.fetch 
        ? (u, init) => env.ANINEKO_SERVICE.fetch(u, init) 
        : fetch;

    const res = await fetcher(url, {
        headers: { "User-Agent": USER_AGENT }
    });

    if (!res.ok) {
        throw new Error(`AniNeko returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const embedData = data.embed || data;
    const streams = embedData.streams || [];

    if (!streams || streams.length === 0) {
        throw new Error("No streams available on AniNeko");
    }

    const primaryStream = streams[0];

    return {
        success: true,
        server: `Server 2 (AniNeko / ${primaryStream.server || "StreamHG"})`,
        serverId: 2,
        streamUrl: primaryStream.url,
        rawStreamUrl: primaryStream.rawUrl || primaryStream.url,
        fallbackStreams: streams.slice(1).map(s => s.url),
        subtitles: (embedData.subtitles || []).map(s => ({
            url: s.file || s.url,
            label: s.label || "English",
            default: !!s.default,
            kind: s.kind || "captions"
        })),
        intro: { start: 0, end: 0 },
        outro: { start: 0, end: 0 }
    };
}
