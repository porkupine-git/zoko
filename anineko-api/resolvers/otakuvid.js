/**
 * OTAKUVID.ONLINE (VidHide / VidHideHub) Stream Extractor
 * 
 * Target: https://otakuvid.online
 * Engine: VidHide / SibSoft XVideoSharing
 * Format: https://otakuvid.online/embed/{file_code} or https://otakuvid.online/e/{file_code}
 */

const https = require('https');
const { unpack } = require('./unpacker');

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://otakuvid.online/'
};

/**
 * Normalizes input URL or code to file_code
 */
function extractOtakuVidCode(input) {
    if (!input) return null;
    let trimmed = input.trim();

    // Strip query parameters
    const queryIdx = trimmed.indexOf('?');
    if (queryIdx !== -1) {
        trimmed = trimmed.substring(0, queryIdx);
    }
    
    // Direct code: 8-20 alphanumeric characters
    if (/^[a-zA-Z0-9]{8,20}$/.test(trimmed)) {
        return trimmed;
    }
    
    // URL pattern: https://otakuvid.online/embed/{code} or /e/{code} or /{code}
    const match = trimmed.match(/otakuvid\.online\/(?:embed\/|e\/|v\/|d\/)?([a-zA-Z0-9]{8,20})/i);
    if (match) return match[1];

    // vidhide pattern
    const vhMatch = trimmed.match(/vidhide[a-zA-Z0-9]*\.(?:online|com|net|org|site)\/(?:embed\/|e\/|v\/|d\/)?([a-zA-Z0-9]{8,20})/i);
    if (vhMatch) return vhMatch[1];
    
    return null;
}

/**
 * Fetch helper using native https
 */
function fetchHttp(url, headers = DEFAULT_HEADERS) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const req = https.request({
            hostname: u.hostname,
            port: 443,
            path: u.pathname + u.search,
            method: 'GET',
            headers: { ...headers }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({
                status: res.statusCode,
                headers: res.headers,
                body: data
            }));
        });
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy(new Error('Request timeout after 10000ms'));
        });
        req.end();
    });
}

/**
 * Resolves streams from otakuvid.online (VidHide)
 */
async function resolveOtakuVid(input, options = {}) {
    const fileCode = extractOtakuVidCode(input);
    if (!fileCode) {
        throw new Error('Invalid OtakuVid / VidHide URL or code. Expected 8-20 character file code.');
    }

    // Extract subtitle from query params if present (e.g. caption_1, sub_1, sub)
    let extraCaption = '';
    let extraLabel = 'English';
    try {
        if (input.includes('?')) {
            const urlObj = new URL(input.startsWith('http') ? input : `https://otakuvid.online/embed/${input}`);
            extraCaption = urlObj.searchParams.get('caption_1') || urlObj.searchParams.get('c1_file') || urlObj.searchParams.get('sub') || '';
            extraLabel = urlObj.searchParams.get('sub_1') || urlObj.searchParams.get('c1_label') || 'English';
        }
    } catch {}

    const embedUrl = `https://otakuvid.online/embed/${fileCode}`;
    const response = await fetchHttp(embedUrl);

    if (response.status !== 200) {
        throw new Error(`OtakuVid embed returned HTTP ${response.status}`);
    }

    const html = response.body;

    // Check if file is expired or deleted
    if (html.includes('File is no longer available') || html.includes('expired or has been deleted') || html.includes('File Not Found')) {
        throw new Error('Video is no longer available on OtakuVid (expired or deleted)');
    }

    // 1. Check for Dean Edwards packed script: eval(function(p,a,c,k,e,d)...)
    let unpackedJs = '';
    const scriptRegex = /<script[\s\S]*?>([\s\S]*?)<\/script>/gi;
    const scriptMatches = html.match(scriptRegex) || [];
    for (const s of scriptMatches) {
        if (s.includes('eval(function(p,a,c,k,e,')) {
            unpackedJs += unpack(s) + '\n';
        }
    }

    const searchContext = html + '\n' + unpackedJs;

    // 2. Extract Title
    const titleMatch = searchContext.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) || searchContext.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : `OtakuVid - ${fileCode}`;

    // 3. Extract Poster
    const posterMatch = searchContext.match(/image\s*:\s*["']([^"']+)["']/i);
    const poster = posterMatch ? posterMatch[1] : '';

    // 4. Extract Multi-CDN Streams from unpacked "var links = { ... }"
    const streams = [];
    const proxyBase = options.proxyBase || '';

    // Look for links object
    const linksMatch = searchContext.match(/var\s+links\s*=\s*(\{[\s\S]*?\});/i);
    if (linksMatch) {
        try {
            const parsedLinks = JSON.parse(linksMatch[1]);
            
            // HLS3 (SolutionPortal CDN - 100% reliable 1080p, no ASN/IP token lock)
            if (parsedLinks.hls3) {
                streams.push({
                    server: 'OtakuVid SolutionPortal (1080p / HLS3)',
                    url: proxyBase ? `${proxyBase}/api/proxy?url=${encodeURIComponent(parsedLinks.hls3)}` : parsedLinks.hls3,
                    rawUrl: parsedLinks.hls3,
                    type: 'hls',
                    quality: '1080p Multi-Quality',
                    priority: 1
                });
            }

            // HLS4 (Edge / TikTok CDN backend)
            if (parsedLinks.hls4) {
                const absHls4 = parsedLinks.hls4.startsWith('/') ? `https://otakuvid.online${parsedLinks.hls4}` : parsedLinks.hls4;
                streams.push({
                    server: 'OtakuVid Edge (Backup / HLS4)',
                    url: proxyBase ? `${proxyBase}/api/proxy?url=${encodeURIComponent(absHls4)}` : absHls4,
                    rawUrl: absHls4,
                    type: 'hls',
                    quality: 'auto',
                    priority: 2
                });
            }

            // HLS2 (Fallback only if not dramiyos-cdn)
            if (parsedLinks.hls2 && !parsedLinks.hls2.includes('dramiyos-cdn')) {
                streams.push({
                    server: 'OtakuVid Direct (Backup / HLS2)',
                    url: proxyBase ? `${proxyBase}/api/proxy?url=${encodeURIComponent(parsedLinks.hls2)}` : parsedLinks.hls2,
                    rawUrl: parsedLinks.hls2,
                    type: 'hls',
                    quality: '1080p Multi-Quality',
                    priority: 3
                });
            }
        } catch (e) {}
    }

    // Fallback: check for any m3u8 files in unpacked context
    if (streams.length === 0) {
        const m3u8Matches = [...searchContext.matchAll(/(?:file|src)\s*:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi)];
        for (const m of m3u8Matches) {
            const rawUrl = m[1];
            if (!streams.some(s => s.rawUrl === rawUrl)) {
                streams.push({
                    server: 'OtakuVid HLS',
                    url: proxyBase ? `${proxyBase}/api/proxy?url=${encodeURIComponent(rawUrl)}` : rawUrl,
                    rawUrl,
                    type: 'hls',
                    quality: 'auto',
                    priority: streams.length + 1
                });
            }
        }
    }

    // 5. Extract Subtitles / Tracks
    const subtitles = [];
    if (extraCaption) {
        subtitles.push({
            file: extraCaption,
            label: extraLabel,
            kind: 'captions',
            default: true
        });
    }

    const tracksBlockMatch = searchContext.match(/tracks\s*:\s*\[([\s\S]*?)\]/i);
    if (tracksBlockMatch) {
        const trackItems = [...tracksBlockMatch[1].matchAll(/file\s*:\s*["']([^"']+)["'](?:[\s\S]*?label\s*:\s*["']([^"']+)["'])?/gi)];
        for (const ti of trackItems) {
            if (!ti[1].includes('get_slides') && !subtitles.some(s => s.file === ti[1])) {
                subtitles.push({
                    file: ti[1],
                    label: ti[2] || 'English',
                    kind: 'captions'
                });
            }
        }
    }

    return {
        success: true,
        provider: 'otakuvid',
        serviceName: 'OtakuVid / VidHide',
        fileCode,
        title,
        poster,
        embedUrl,
        downloadPageUrl: `https://otakuvid.online/d/${fileCode}`,
        streams,
        subtitles,
        headers: {
            'Referer': 'https://otakuvid.online/',
            'Origin': 'https://otakuvid.online'
        }
    };
}

module.exports = {
    resolveOtakuVid,
    extractOtakuVidCode
};
