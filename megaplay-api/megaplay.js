/**
 * MegaPlay & Anikoto API Scraper Engine
 * Reverse-engineered for Node.js (Zero-dependency, uses standard Web Fetch)
 */

export const MEGAPLAY_BASE = "https://megaplay.buzz";
export const ANIKOTO_API_BASE = "https://anikotoapi.site";

export const MEGAPLAY_AES_KEY = "i?LMTAx0Q6,:}50U";
export const MEGAPLAY_AES_IV = "W0;27ToaUpl_P%'c";
export const STRIP_URL_RE = /ibyteimg\.com|tiktokcdn\.com|ipstatp\.com|yoot\.akirax\.buzz/i;
export const STRIP_BYTES = 252;

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
 * Decrypt MegaPlay encrypted source token (AES-CBC)
 * @param {string} encToken - Base64/Base64URL encoded AES ciphertext
 * @returns {Promise<{ file: string } | null>}
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
    } catch (e) {
        return null;
    }
}

/**
 * Strip obfuscated dummy bytes (e.g. 252 bytes PNG dummy header on TikTok CDN chunks)
 * @param {ArrayBuffer|Uint8Array} buffer 
 * @param {number} [bytesToStrip=252] 
 * @returns {ArrayBuffer|Uint8Array}
 */
export function stripSegmentBytes(buffer, bytesToStrip = STRIP_BYTES) {
    if (!buffer) return buffer;
    if (buffer instanceof ArrayBuffer) {
        return buffer.byteLength <= bytesToStrip ? buffer : buffer.slice(bytesToStrip);
    }
    if (buffer instanceof Uint8Array) {
        return buffer.length <= bytesToStrip ? buffer : buffer.subarray(bytesToStrip);
    }
    return buffer;
}

const DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://megaplay.buzz/"
};

const AJAX_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://megaplay.buzz/"
};

/**
 * Fetch an embed page and extract player data attributes (data-id, data-realid, data-mediaid)
 * @param {string} embedUrl 
 * @returns {Promise<{ dataId: string, realId: string, mediaId: string }>}
 */
export async function extractPlayerIds(embedUrl) {
    const res = await fetch(embedUrl, {
        headers: {
            ...DEFAULT_HEADERS,
            "Referer": "https://megaplay.buzz/"
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to load MegaPlay embed page: HTTP ${res.status}`);
    }

    const html = await res.text();

    const idMatch = html.match(/data-id=["']([^"']+)["']/);
    const realIdMatch = html.match(/data-realid=["']([^"']+)["']/);
    const mediaIdMatch = html.match(/data-mediaid=["']([^"']+)["']/);

    const dataId = idMatch ? idMatch[1] : null;
    const realId = realIdMatch ? realIdMatch[1] : null;
    const mediaId = mediaIdMatch ? mediaIdMatch[1] : null;

    if (!dataId && !realId) {
        throw new Error("Could not find player data-id or data-realid in MegaPlay embed page HTML");
    }

    return { dataId, realId, mediaId };
}

/**
 * Call the reverse-engineered getSourcesNew endpoint to retrieve the decrypted HLS stream
 * @param {string} id - The data-id or realid extracted from the player page
 * @param {string} [server="tcdn"] - CDN server selector ('tcdn', 'bcdn', etc., default 'tcdn')
 * @param {string} [refererUrl] - Optional referer header
 * @returns {Promise<any>}
 */
export async function getSources(id, server = "bcdn", refererUrl = "") {
    let url = `${MEGAPLAY_BASE}/stream/getSourcesNew?id=${encodeURIComponent(id)}`;
    if (server) {
        url += `&s=${encodeURIComponent(server)}`;
    }

    const headers = {
        ...AJAX_HEADERS,
        "Referer": refererUrl || `${MEGAPLAY_BASE}/stream/`
    };

    const res = await fetch(url, { headers });
    if (!res.ok) {
        // Fallback to legacy getSources
        const fallbackUrl = `${MEGAPLAY_BASE}/stream/getSources?id=${encodeURIComponent(id)}${server ? `&s=${encodeURIComponent(server)}` : ''}`;
        const fbRes = await fetch(fallbackUrl, { headers });
        if (!fbRes.ok) {
            throw new Error(`MegaPlay getSources failed: HTTP ${res.status}`);
        }
        return await fbRes.json();
    }

    return await res.json();
}

/**
 * Resolve direct HLS stream from any MegaPlay embed URL
 * @param {string} embedUrl 
 * @param {string} [server="tcdn"] - 'tcdn' or 'bcdn' (default 'tcdn')
 * @returns {Promise<any>}
 */
export async function resolveFromEmbedUrl(embedUrl, server = "bcdn") {
    const ids = await extractPlayerIds(embedUrl);
    const targetId = ids.dataId || ids.realId;
    let rawData = await getSources(targetId, server, embedUrl);

    let masterFile = rawData.sources?.file || (Array.isArray(rawData.sources) ? rawData.sources[0]?.file : null);
    if (!masterFile && rawData.enc) {
        const dec = await decryptEncryptedSources(rawData.enc);
        if (dec?.file) {
            masterFile = dec.file;
        }
    }

    // Auto-heal blocked MegaPlay CDN domains (fetch.nexabloom.top -> ncdn.imgnex.top)
    if (masterFile && masterFile.includes("fetch.nexabloom.top")) {
        masterFile = masterFile.replace("fetch.nexabloom.top", "ncdn.imgnex.top");
    }

    return {
        success: !!masterFile,
        provider: "megaplay.buzz",
        stream_url: masterFile,
        sources: [
            {
                url: masterFile,
                type: "hls",
                server: `MegaPlay-${rawData.server || server || 'tcdn'}`
            }
        ],
        subtitles: (rawData.tracks || []).map(t => ({
            url: t.file,
            label: t.label || "English",
            kind: t.kind || "captions",
            default: !!t.default,
            headers: {
                "Referer": "https://megaplay.buzz/"
            }
        })),
        intro: rawData.intro || { start: 0, end: 0 },
        outro: rawData.outro || { start: 0, end: 0 },
        segment_info: {
            strip_bytes: STRIP_BYTES,
            strip_url_pattern: STRIP_URL_RE.source
        },
        ids: {
            data_id: ids.dataId,
            real_id: ids.realId,
            media_id: ids.mediaId
        }
    };
}

/**
 * Resolve stream by MyAnimeList ID and Episode
 * @param {number|string} malId 
 * @param {number|string} [episode=1] 
 * @param {string} [track="sub"] - 'sub' or 'dub'
 * @param {string} [server="tcdn"] - 'tcdn' or 'bcdn' (default 'tcdn')
 */
export async function resolveFromMal(malId, episode = 1, track = "sub", server = "bcdn") {
    const lang = track.toLowerCase() === "dub" ? "dub" : "sub";
    const embedUrl = `${MEGAPLAY_BASE}/stream/mal/${malId}/${episode}/${lang}`;
    const data = await resolveFromEmbedUrl(embedUrl, server);
    return {
        ...data,
        mal_id: malId,
        episode: parseInt(episode),
        track: lang,
        embed_url: embedUrl
    };
}

/**
 * Helper to resolve MAL ID from AniList ID (AniList GraphQL -> Kitsu Mapping Fallback)
 * @param {number|string} aniId 
 * @returns {Promise<number|null>}
 */
export async function mapAniToMal(aniId) {
    const numId = parseInt(aniId);
    if (!numId) return null;

    // 1. Try AniList GraphQL
    try {
        const q = `query ($id: Int) { Media(id: $id, type: ANIME) { id idMal } }`;
        const res = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ query: q, variables: { id: numId } })
        });
        if (res.ok) {
            const json = await res.json();
            if (json?.data?.Media?.idMal) return json.data.Media.idMal;
        }
    } catch {}

    // 2. Try Kitsu Mapping if AniList API is blocked / unstable
    try {
        const kRes = await fetch(`https://kitsu.io/api/edge/mappings?filter[externalSite]=anilist/anime&filter[externalId]=${numId}`);
        if (kRes.ok) {
            const kj = await kRes.json();
            const mapId = kj?.data?.[0]?.id;
            if (mapId) {
                const itemRes = await fetch(`https://kitsu.io/api/edge/mappings/${mapId}/item`);
                if (itemRes.ok) {
                    const ij = await itemRes.json();
                    const animeId = ij?.data?.id;
                    if (animeId) {
                        const mRes = await fetch(`https://kitsu.io/api/edge/anime/${animeId}/mappings`);
                        if (mRes.ok) {
                            const mj = await mRes.json();
                            const mal = mj?.data?.find(x => x.attributes?.externalSite === 'myanimelist/anime');
                            if (mal?.attributes?.externalId) return parseInt(mal.attributes.externalId);
                        }
                    }
                }
            }
        }
    } catch {}

    return null;
}

/**
 * Resolve stream by AniList ID and Episode (with automatic MAL fallback)
 * @param {number|string} aniId 
 * @param {number|string} [episode=1] 
 * @param {string} [track="sub"] - 'sub' or 'dub'
 * @param {string} [server="tcdn"] - 'tcdn' or 'bcdn' (default 'tcdn')
 */
export async function resolveFromAnilist(aniId, episode = 1, track = "sub", server = "bcdn") {
    const lang = track.toLowerCase() === "dub" ? "dub" : "sub";
    const embedUrl = `${MEGAPLAY_BASE}/stream/ani/${aniId}/${episode}/${lang}`;
    
    // 1. Try direct MegaPlay AniList endpoint
    try {
        const data = await resolveFromEmbedUrl(embedUrl, server);
        return {
            ...data,
            anilist_id: aniId,
            episode: parseInt(episode),
            track: lang,
            embed_url: embedUrl
        };
    } catch (err) {
        // 2. Automatic Fallback: If MegaPlay hasn't mapped the AniList ID, resolve MAL ID and query MegaPlay
        const malId = await mapAniToMal(aniId);
        if (malId) {
            const malData = await resolveFromMal(malId, episode, lang, server);
            return {
                ...malData,
                anilist_id: aniId,
                fallback_mal_id: malId,
                note: "Resolved via automatic MAL fallback mapping"
            };
        }
        throw err;
    }
}

/**
 * Resolve stream by Catalog / Anikoto Episode ID (legacy HiAnime ID)
 * @param {string|number} catalogEpId 
 * @param {string} [track="sub"] - 'sub' or 'dub'
 * @param {string} [server="tcdn"] - 'tcdn' or 'bcdn' (default 'tcdn')
 */
export async function resolveFromCatalogId(catalogEpId, track = "sub", server = "bcdn") {
    const lang = track.toLowerCase() === "dub" ? "dub" : "sub";
    const embedUrl = `${MEGAPLAY_BASE}/stream/s-2/${catalogEpId}/${lang}`;
    const data = await resolveFromEmbedUrl(embedUrl, server);
    return {
        ...data,
        catalog_ep_id: catalogEpId,
        track: lang,
        embed_url: embedUrl
    };
}

/**
 * Get recent anime catalog list from Anikoto API
 * @param {number} [page=1] 
 * @param {number} [perPage=20] 
 */
export async function getRecentAnime(page = 1, perPage = 20) {
    const url = `${ANIKOTO_API_BASE}/recent-anime?page=${page}&per_page=${perPage}`;
    const res = await fetch(url, { headers: DEFAULT_HEADERS });
    if (!res.ok) throw new Error(`Anikoto recent anime API failed: HTTP ${res.status}`);
    return await res.json();
}

/**
 * Get series details and all episode embed IDs from Anikoto API
 * @param {number|string} seriesId 
 */
export async function getSeriesEpisodes(seriesId) {
    const url = `${ANIKOTO_API_BASE}/series/${seriesId}`;
    const res = await fetch(url, { headers: DEFAULT_HEADERS });
    if (!res.ok) throw new Error(`Anikoto series API failed: HTTP ${res.status}`);
    return await res.json();
}

export default {
    MEGAPLAY_BASE,
    ANIKOTO_API_BASE,
    MEGAPLAY_AES_KEY,
    MEGAPLAY_AES_IV,
    STRIP_URL_RE,
    STRIP_BYTES,
    extractPlayerIds,
    getSources,
    decryptEncryptedSources,
    stripSegmentBytes,
    resolveFromEmbedUrl,
    resolveFromMal,
    resolveFromAnilist,
    resolveFromCatalogId,
    getRecentAnime,
    getSeriesEpisodes
};
