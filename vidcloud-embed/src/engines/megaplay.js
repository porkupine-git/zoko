/**
 * SERVER 1 ENGINE: MegaPlay / Norami / Mikora Multi-CDN
 * High-speed 1ms edge extraction, direct HLS master playlists, VTT subtitles, OP/ED skip timestamps.
 * Includes direct AES-CBC fallback decryption engine.
 */

const MEGAPLAY_BACKEND_URL = "https://aniko-backend.rk18109ry.workers.dev";
const MEGAPLAY_BASE = "https://megaplay.buzz";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const CLUSTER_SECRET = "anixo-cluster-auth-9x82k1";

const MEGAPLAY_AES_KEY = "i?LMTAx0Q6,:}50U";
const MEGAPLAY_AES_IV = "W0;27ToaUpl_P%'c";

function getAesKeyBuffer() {
    const i = new TextEncoder().encode(MEGAPLAY_AES_KEY);
    const o = new Uint8Array(32);
    o.set(i.subarray(0, Math.min(32, i.length)));
    return o;
}

function fromBase64ToUint8(str) {
    let o = String(str).replace(/-/g, '+').replace(/_/g, '/');
    const p = o.length % 4;
    if (p) o += '===='.slice(p);
    const binary = atob(o);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

/**
 * Decrypt MegaPlay AES-CBC payload
 */
export async function decryptEncryptedSources(encToken) {
    if (!encToken) return null;
    try {
        const keyBuf = getAesKeyBuffer();
        const key = await crypto.subtle.importKey('raw', keyBuf, { name: 'AES-CBC' }, false, ['decrypt']);
        const iv = new TextEncoder().encode(MEGAPLAY_AES_IV);
        const cipherBuf = fromBase64ToUint8(encToken);
        const decBuf = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, cipherBuf);
        return JSON.parse(new TextDecoder().decode(decBuf));
    } catch {
        return null;
    }
}

/**
 * Direct scraper fallback when backend service is unreachable
 */
async function scrapeDirectMegaPlay(embedPath) {
    const embedUrl = `${MEGAPLAY_BASE}${embedPath}`;
    const embedRes = await fetch(embedUrl, {
        headers: {
            "User-Agent": USER_AGENT,
            "Referer": "https://megaplay.buzz/"
        }
    });
    if (!embedRes.ok) throw new Error(`Direct MegaPlay embed returned ${embedRes.status}`);

    const html = await embedRes.text();
    const idMatch = html.match(/data-id=["']([^"']+)["']/) || html.match(/data-realid=["']([^"']+)["']/);
    if (!idMatch) throw new Error("Could not find player data-id in MegaPlay embed page");

    const targetId = idMatch[1];
    const apiRes = await fetch(`${MEGAPLAY_BASE}/stream/getSourcesNew?id=${encodeURIComponent(targetId)}&s=tcdn`, {
        headers: {
            "User-Agent": USER_AGENT,
            "X-Requested-With": "XMLHttpRequest",
            "Referer": embedUrl
        }
    });
    if (!apiRes.ok) throw new Error(`Direct MegaPlay getSourcesNew returned ${apiRes.status}`);

    const rawData = await apiRes.json();
    let masterFile = rawData.sources?.file || (Array.isArray(rawData.sources) ? rawData.sources[0]?.file : null);
    if (!masterFile && rawData.enc) {
        const dec = await decryptEncryptedSources(rawData.enc);
        if (dec?.file) masterFile = dec.file;
    }

    if (!masterFile) throw new Error("Failed to extract master stream URL from direct MegaPlay payload");

    return {
        success: true,
        stream_url: masterFile,
        subtitles: (rawData.tracks || []).map(t => ({
            url: t.file,
            label: t.label || "English",
            kind: t.kind || "captions",
            default: !!t.default
        })),
        intro: rawData.intro || { start: 0, end: 0 },
        outro: rawData.outro || { start: 0, end: 0 }
    };
}

export async function resolveMegaPlayStream({ anilistId, malId, episode = 1, track = "sub" }, env = {}) {
    let path = "";
    if (malId) {
        path = `/api/stream/mal/${malId}/${episode}/${track}`;
    } else if (anilistId) {
        path = `/api/stream/ani/${anilistId}/${episode}/${track}`;
    } else {
        throw new Error("MegaPlay requires anilistId or malId");
    }

    let data = null;

    try {
        const targetUrl = `${MEGAPLAY_BACKEND_URL}${path}?s=tcdn`;
        const fetcher = env?.MEGAPLAY_SERVICE?.fetch 
            ? (url, init) => env.MEGAPLAY_SERVICE.fetch(url, init) 
            : fetch;

        const res = await fetcher(targetUrl, {
            headers: { 
                "User-Agent": USER_AGENT,
                "x-cluster-internal": CLUSTER_SECRET
            }
        });

        if (res.ok) {
            const json = await res.json();
            if (json.success && json.stream_url) {
                data = json;
            }
        }
    } catch {
        // Fallback to direct scraping
    }

    if (!data) {
        const embedPath = malId 
            ? `/stream/mal/${malId}/${episode}/${track}`
            : `/stream/ani/${anilistId}/${episode}/${track}`;
        data = await scrapeDirectMegaPlay(embedPath);
    }

    const rawStreamUrl = data.stream_url || "";

    const fallbackStreams = [];
    if (rawStreamUrl.includes("mikora.top")) {
        fallbackStreams.push(rawStreamUrl.replace("mikora.top", "shiora.top"));
        fallbackStreams.push(rawStreamUrl.replace("mikora.top", "norami.top"));
    } else if (rawStreamUrl.includes("norami.top")) {
        fallbackStreams.push(rawStreamUrl.replace("norami.top", "mikora.top"));
        fallbackStreams.push(rawStreamUrl.replace("norami.top", "shiora.top"));
    } else if (rawStreamUrl.includes("shiora.top")) {
        fallbackStreams.push(rawStreamUrl.replace("shiora.top", "mikora.top"));
        fallbackStreams.push(rawStreamUrl.replace("shiora.top", "norami.top"));
    }

    return {
        success: true,
        server: "Server 1 (VidCloud Core)",
        serverId: 1,
        streamUrl: data.proxy_stream_url || data.stream_url,
        rawStreamUrl: data.stream_url,
        fallbackStreams,
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
