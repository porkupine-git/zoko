/**
 * SERVER 1 ENGINE: MegaPlay / Norami / Mikora CDN
 * High-speed 1ms edge extraction, direct HLS master playlists, VTT subtitles, OP/ED skip timestamps
 */

const MEGAPLAY_BACKEND_URL = "https://aniko-backend.rk18109ry.workers.dev";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function resolveMegaPlayStream({ anilistId, malId, episode = 1, track = "sub" }, env = {}) {
    let path = "";
    if (malId) {
        path = `/api/stream/mal/${malId}/${episode}/${track}`;
    } else if (anilistId) {
        path = `/api/stream/ani/${anilistId}/${episode}/${track}`;
    } else {
        throw new Error("MegaPlay requires anilistId or malId");
    }

    const targetUrl = `${MEGAPLAY_BACKEND_URL}${path}`;
    const fetcher = env?.MEGAPLAY_SERVICE?.fetch 
        ? (url, init) => env.MEGAPLAY_SERVICE.fetch(url, init) 
        : fetch;

    const res = await fetcher(targetUrl, {
        headers: { "User-Agent": USER_AGENT }
    });

    if (!res.ok) {
        throw new Error(`MegaPlay returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success || !data.stream_url) {
        throw new Error(data.error || "No stream available on MegaPlay");
    }

    return {
        success: true,
        server: "Server 1 (Sora Edge)",
        serverId: 1,
        streamUrl: data.proxy_stream_url || data.stream_url,
        rawStreamUrl: data.stream_url,
        subtitles: (data.subtitles || []).map(s => ({
            url: s.proxy_url || s.url,
            label: s.label || "English",
            default: !!s.default,
            kind: s.kind || "captions"
        })),
        intro: data.intro || { start: 0, end: 0 },
        outro: data.outro || { start: 0, end: 0 }
    };
}
