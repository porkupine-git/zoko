/**
 * BIBIEMB.XYZ (VibePlayer) Stream Extractor
 * 
 * Target: https://bibiemb.xyz
 * Engine: VibePlayer HLS Edge Mirror / Cloudflare Worker Backend
 */

const https = require('https');

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://bibiemb.xyz/'
};

/**
 * Normalizes input URL or file code to an ID
 */
function extractBibiId(input) {
    if (!input) return null;
    let trimmed = input.trim();

    // Strip query parameters
    const queryIdx = trimmed.indexOf('?');
    if (queryIdx !== -1) {
        trimmed = trimmed.substring(0, queryIdx);
    }
    
    // Direct ID (e.g. 16 chars or 36 chars like agf104ba92b0cd9d7cdfd4559934189a6f4h)
    if (/^[a-zA-Z0-9_-]{10,64}$/.test(trimmed)) {
        return trimmed;
    }
    
    // URL pattern: https://bibiemb.xyz/{id} or https://bibiemb.xyz/e/{id} or /v/{id}
    const urlMatch = trimmed.match(/bibiemb\.xyz\/(?:e\/|v\/|embed\/)?([a-zA-Z0-9_-]{10,64})/i);
    if (urlMatch) return urlMatch[1];
    
    // VibePlayer pattern
    const vibeMatch = trimmed.match(/vibeplayer\.site\/(?:public\/stream\/|e\/)?([a-zA-Z0-9_-]{10,64})/i);
    if (vibeMatch) return vibeMatch[1];
    
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
            headers
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
 * Resolves streams from bibiemb.xyz / VibePlayer
 */
async function resolveBibiemb(input, options = {}) {
    const id = extractBibiId(input);
    if (!id) {
        throw new Error('Invalid BibiEmb URL or ID.');
    }

    // Extract subtitle from query if present in input
    let subtitleUrl = '';
    try {
        if (input.includes('?')) {
            const urlObj = new URL(input.startsWith('http') ? input : `https://bibiemb.xyz/${input}`);
            subtitleUrl = urlObj.searchParams.get('sub') || '';
        }
    } catch {}

    const embedUrl = `https://bibiemb.xyz/${id}`;
    const response = await fetchHttp(embedUrl);

    if (response.status !== 200) {
        throw new Error(`BibiEmb returned HTTP ${response.status}`);
    }

    const html = response.body;

    // Check for error messages
    if (html.includes('account not found') || html.includes('invalid')) {
        throw new Error('Video or account not found on BibiEmb');
    }

    // 1. Extract Master Stream URL
    // Pattern: const src = "https://morning-credit-3bcc.vibevibe.workers.dev/.../master.m3u8";
    const srcMatch = html.match(/const\s+src\s*=\s*["']([^"']+)["']/i);
    const rawSrc = srcMatch ? srcMatch[1] : `https://bibiemb.xyz/public/stream/${id}/master.m3u8`;

    // 2. Extract Title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i) || html.match(/const\s+title\s*=\s*["']([^"']+)["']/i);
    const title = titleMatch ? titleMatch[1].trim() : 'BibiEmb Stream';

    // 3. Extract Poster / Thumbnail
    const posterMatch = html.match(/const\s+poster\s*=\s*["']([^"']+)["']/i);
    const poster = (posterMatch && posterMatch[1]) ? posterMatch[1] : `https://bibiemb.xyz/public/thumb/${id}_1.jpg`;

    // 4. Extract Subtitles / Tracks
    const tracks = [];
    const subMatch = html.match(/const\s+subtitle\s*=\s*["']([^"']+)["']/i);
    const foundSub = subtitleUrl || (subMatch ? subMatch[1] : '');
    if (foundSub) {
        tracks.push({
            file: foundSub,
            kind: 'captions',
            label: 'English',
            default: true
        });
    }

    // 5. Build Multi-CDN Stream List
    const proxyBase = options.proxyBase || '';
    const streams = [];

    // Upstream Cloudflare Worker / Direct Master
    if (rawSrc) {
        streams.push({
            server: 'VibePlayer Worker (Direct / 1080p)',
            url: proxyBase ? `${proxyBase}/api/proxy?url=${encodeURIComponent(rawSrc)}` : rawSrc,
            rawUrl: rawSrc,
            type: 'hls',
            quality: 'auto',
            priority: 1
        });
    }

    // BibiEmb Edge Mirror
    const bibiStreamUrl = `https://bibiemb.xyz/public/stream/${id}/master.m3u8`;
    if (bibiStreamUrl !== rawSrc) {
        streams.push({
            server: 'BibiEmb Edge Mirror (Backup)',
            url: proxyBase ? `${proxyBase}/api/proxy?url=${encodeURIComponent(bibiStreamUrl)}` : bibiStreamUrl,
            rawUrl: bibiStreamUrl,
            type: 'hls',
            quality: 'auto',
            priority: 2
        });
    }

    return {
        success: true,
        provider: 'bibiemb',
        serviceName: 'VibePlayer / BibiEmb',
        id,
        title,
        poster,
        embedUrl,
        streams,
        subtitles: tracks,
        headers: {
            'Referer': 'https://bibiemb.xyz/',
            'Origin': 'https://bibiemb.xyz'
        }
    };
}

module.exports = {
    resolveBibiemb,
    extractBibiId
};
