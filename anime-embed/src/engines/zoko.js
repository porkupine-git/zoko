/**
 * SERVER 3 ENGINE: ZokoAnime / Otaku XOR Cipher Engine
 * Decrypted native master streams with skip markers and multi-language subtitles
 */

const ZOKO_BACKEND_URL = "https://zoko-stream.rk18109ry.workers.dev";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const CLUSTER_SECRET = "anixo-cluster-auth-9x82k1";

export async function resolveZokoStream({ anilistId, malId, title, episode = 1, track = "sub" }, env = {}) {
    const targetId = malId || anilistId;
    if (!targetId && !title) {
        throw new Error("Zoko requires anilistId, malId, or title");
    }

    let url = `${ZOKO_BACKEND_URL}/api/stream?ep=${episode}&track=${track}`;
    if (malId) url += `&malId=${malId}`;
    if (anilistId) url += `&id=${anilistId}`;
    if (title) url += `&title=${encodeURIComponent(title)}`;

    const fetcher = env?.ZOKO_SERVICE?.fetch 
        ? (u, init) => env.ZOKO_SERVICE.fetch(u, init) 
        : fetch;

    const res = await fetcher(url, {
        headers: { 
            "User-Agent": USER_AGENT,
            "x-cluster-internal": CLUSTER_SECRET
        }
    });

    if (!res.ok) {
        throw new Error(`Zoko returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success || !data.stream_url) {
        throw new Error(data.error || "No stream available on Zoko");
    }

    return {
        success: true,
        server: "Server 3 (Zozo Edge)",
        serverId: 3,
        streamUrl: data.stream_url,
        rawStreamUrl: data.stream_url,
        subtitles: (data.subtitles || []).map(s => ({
            url: s.proxied_src || s.src,
            label: s.label || "English",
            default: !!s.default,
            kind: "captions"
        })),
        intro: data.skip?.intro || { start: 0, end: 0 },
        outro: data.skip?.outro || { start: 0, end: 0 }
    };
}
