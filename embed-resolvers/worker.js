/**
 * EMBED STREAM RESOLVER ENGINE - CLOUDFLARE WORKER
 * 
 * Extracts HLS/MP4 streams from bibiemb.xyz (VibePlayer) & otakuhg.site (StreamHG)
 * Ready to deploy on Cloudflare Workers ($0 Free or $5 Paid Plan)
 */

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400"
};

function unpack(packedStr) {
    if (!packedStr || typeof packedStr !== 'string') return '';
    const regex = /eval\(function\(p,a,c,k,e,[rd]\)\s*\{[\s\S]*?\}\s*\(\s*'([\s\S]*?)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([\s\S]*?)'\.split\('\|'\)/;
    let match = packedStr.match(regex);
    if (!match) {
        const altRegex = /}\('([\s\S]*?)',\s*(\d+)\s*,\s*(\d+)\s*,\s*'([\s\S]*?)'\.split\('\|'\)/;
        match = packedStr.match(altRegex);
        if (!match) return packedStr;
    }
    const p = match[1], a = parseInt(match[2], 10), k = match[4].split('|');
    let c = parseInt(match[3], 10);
    const base = (v) => (v < a ? '' : base(Math.floor(v / a))) + ((v = v % a) > 35 ? String.fromCharCode(v + 29) : v.toString(36));
    const dict = {};
    while (c--) dict[base(c)] = k[c] || base(c);
    return p.replace(/\b\w+\b/g, token => dict[token] !== undefined ? dict[token] : token);
}

async function resolveBibiemb(input, baseUrl) {
    let id = input.trim();
    const urlMatch = id.match(/bibiemb\.xyz\/(?:e\/|v\/|embed\/)?([a-zA-Z0-9_-]{16})/i);
    if (urlMatch) id = urlMatch[1];

    const res = await fetch('https://bibiemb.xyz/' + id, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://bibiemb.xyz/"
        }
    });

    if (!res.ok) throw new Error('BibiEmb returned HTTP ' + res.status);
    const html = await res.text();

    if (html.includes('account not found') || html.includes('invalid')) {
        throw new Error('Video not found on BibiEmb');
    }

    const srcMatch = html.match(/const\s+src\s*=\s*["']([^"']+)["']/i);
    const rawSrc = srcMatch ? srcMatch[1] : ('https://bibiemb.xyz/public/stream/' + id + '/master.m3u8');
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const posterMatch = html.match(/const\s+poster\s*=\s*["']([^"']+)["']/i);

    const bibiUrl = 'https://bibiemb.xyz/public/stream/' + id + '/master.m3u8';
    return {
        success: true,
        provider: 'bibiemb',
        serviceName: 'VibePlayer / BibiEmb',
        id,
        title: titleMatch ? titleMatch[1] : 'BibiEmb Stream',
        poster: posterMatch ? posterMatch[1] : '',
        streams: [
            {
                server: 'BibiEmb Edge (Primary)',
                url: baseUrl + '/api/proxy?url=' + encodeURIComponent(bibiUrl),
                rawUrl: bibiUrl,
                type: 'hls',
                priority: 1
            },
            {
                server: 'VibePlayer Direct (Backup)',
                url: baseUrl + '/api/proxy?url=' + encodeURIComponent(rawSrc),
                rawUrl: rawSrc,
                type: 'hls',
                priority: 2
            }
        ]
    };
}

async function resolveOtakuhg(input, baseUrl) {
    let code = input.trim();
    const match = code.match(/otakuhg\.site\/(?:e\/|v\/|d\/|embed-)?([a-zA-Z0-9]{8,16})/i);
    if (match) code = match[1];

    const res = await fetch('https://otakuhg.site/e/' + code, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://otakuhg.site/"
        }
    });

    if (!res.ok) throw new Error('OtakuHG returned HTTP ' + res.status);
    const html = await res.text();

    if (html.includes('File is no longer available') || html.includes('expired or has been deleted')) {
        throw new Error('Video is no longer available on OtakuHG (expired or deleted)');
    }

    let unpackedJs = '';
    const scriptRegex = /<script[\s\S]*?>([\s\S]*?)<\/script>/gi;
    const scriptMatches = html.match(scriptRegex) || [];
    for (const s of scriptMatches) {
        if (s.includes('eval(function(p,a,c,k,e,')) {
            unpackedJs += unpack(s) + '\n';
        }
    }

    const searchContext = html + '\n' + unpackedJs;
    const streams = [];

    const m3u8Matches = [...searchContext.matchAll(/(?:file|src)\s*:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi)];
    for (const m of m3u8Matches) {
        streams.push({
            server: 'StreamHG HLS',
            url: baseUrl + '/api/proxy?url=' + encodeURIComponent(m[1]),
            rawUrl: m[1],
            type: 'hls',
            priority: 1
        });
    }

    return {
        success: true,
        provider: 'otakuhg',
        serviceName: 'StreamHG',
        fileCode: code,
        embedUrl: 'https://otakuhg.site/e/' + code,
        streams
    };
}

async function resolveOtakuVid(input, baseUrl) {
    let code = input.trim();
    const match = code.match(/otakuvid\.online\/(?:embed\/|e\/|v\/|d\/)?([a-zA-Z0-9]{8,20})/i) || code.match(/vidhide[a-zA-Z0-9]*\.(?:online|com|net|org|site)\/(?:embed\/|e\/|v\/|d\/)?([a-zA-Z0-9]{8,20})/i);
    if (match) code = match[1];

    const res = await fetch('https://otakuvid.online/embed/' + code, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://otakuvid.online/"
        }
    });

    if (!res.ok) throw new Error('OtakuVid returned HTTP ' + res.status);
    const html = await res.text();

    if (html.includes('File is no longer available') || html.includes('expired or has been deleted') || html.includes('File Not Found')) {
        throw new Error('Video is no longer available on OtakuVid (expired or deleted)');
    }

    let unpackedJs = '';
    const scriptRegex = /<script[\s\S]*?>([\s\S]*?)<\/script>/gi;
    const scriptMatches = html.match(scriptRegex) || [];
    for (const s of scriptMatches) {
        if (s.includes('eval(function(p,a,c,k,e,')) {
            unpackedJs += unpack(s) + '\n';
        }
    }

    const searchContext = html + '\n' + unpackedJs;
    const streams = [];

    const linksMatch = searchContext.match(/var\s+links\s*=\s*(\{[\s\S]*?\});/i);
    if (linksMatch) {
        try {
            const parsedLinks = JSON.parse(linksMatch[1]);
            if (parsedLinks.hls2) {
                streams.push({
                    server: 'OtakuVid Direct (1080p / HLS2)',
                    url: baseUrl ? `${baseUrl}/api/proxy?url=${encodeURIComponent(parsedLinks.hls2)}` : parsedLinks.hls2,
                    rawUrl: parsedLinks.hls2,
                    type: 'hls',
                    quality: '1080p Multi-Quality',
                    priority: 1
                });
            }
            if (parsedLinks.hls4) {
                const absHls4 = parsedLinks.hls4.startsWith('/') ? `https://otakuvid.online${parsedLinks.hls4}` : parsedLinks.hls4;
                streams.push({
                    server: 'OtakuVid Edge (Backup / HLS4)',
                    url: baseUrl ? `${baseUrl}/api/proxy?url=${encodeURIComponent(absHls4)}` : absHls4,
                    rawUrl: absHls4,
                    type: 'hls',
                    quality: 'auto',
                    priority: 2
                });
            }
            if (parsedLinks.hls3) {
                streams.push({
                    server: 'SolutionPortal CDN (Backup / HLS3)',
                    url: baseUrl ? `${baseUrl}/api/proxy?url=${encodeURIComponent(parsedLinks.hls3)}` : parsedLinks.hls3,
                    rawUrl: parsedLinks.hls3,
                    type: 'hls',
                    quality: 'auto',
                    priority: 3
                });
            }
        } catch (e) {}
    }

    if (streams.length === 0) {
        const m3u8Matches = [...searchContext.matchAll(/(?:file|src)\s*:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi)];
        for (const m of m3u8Matches) {
            streams.push({
                server: 'OtakuVid HLS',
                url: baseUrl ? `${baseUrl}/api/proxy?url=${encodeURIComponent(m[1])}` : m[1],
                rawUrl: m[1],
                type: 'hls',
                priority: streams.length + 1
            });
        }
    }

    const titleMatch = searchContext.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) || searchContext.match(/<title>([^<]+)<\/title>/i);
    const posterMatch = searchContext.match(/image\s*:\s*["']([^"']+)["']/i);

    return {
        success: true,
        provider: 'otakuvid',
        serviceName: 'OtakuVid / VidHide',
        fileCode: code,
        title: titleMatch ? titleMatch[1].trim() : `OtakuVid - ${code}`,
        poster: posterMatch ? posterMatch[1] : '',
        embedUrl: 'https://otakuvid.online/embed/' + code,
        streams
    };
}

export default {
    async fetch(request, env, ctx) {
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: CORS_HEADERS });
        }

        const url = new URL(request.url);
        const baseUrl = url.origin;

        try {
            if (url.pathname === "/api/resolve") {
                const target = url.searchParams.get("url");
                if (!target) return new Response(JSON.stringify({ error: "Missing ?url=" }), { status: 400, headers: CORS_HEADERS });
                
                let data;
                if (target.includes("bibiemb.xyz") || target.includes("vibeplayer.site")) {
                    data = await resolveBibiemb(target, baseUrl);
                } else if (target.includes("otakuvid.online") || target.includes("vidhide")) {
                    data = await resolveOtakuVid(target, baseUrl);
                } else {
                    data = await resolveOtakuhg(target, baseUrl);
                }
                return new Response(JSON.stringify(data, null, 2), {
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                });
            }

            if (url.pathname.startsWith("/api/bibiemb/")) {
                const id = url.pathname.replace("/api/bibiemb/", "").split("/")[0];
                const data = await resolveBibiemb(id, baseUrl);
                return new Response(JSON.stringify(data, null, 2), {
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                });
            }

            if (url.pathname.startsWith("/api/otakuhg/")) {
                const code = url.pathname.replace("/api/otakuhg/", "").split("/")[0];
                const data = await resolveOtakuhg(code, baseUrl);
                return new Response(JSON.stringify(data, null, 2), {
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                });
            }

            if (url.pathname.startsWith("/api/otakuvid/")) {
                const code = url.pathname.replace("/api/otakuvid/", "").split("/")[0];
                const data = await resolveOtakuVid(code, baseUrl);
                return new Response(JSON.stringify(data, null, 2), {
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
                });
            }

            if (url.pathname === "/api/proxy") {
                const streamUrl = url.searchParams.get("url");
                if (!streamUrl) return new Response("Missing target url", { status: 400, headers: CORS_HEADERS });
                const upstreamRes = await fetch(streamUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Referer": new URL(streamUrl).origin + "/"
                    }
                });
                return new Response(upstreamRes.body, {
                    status: upstreamRes.status,
                    headers: {
                        ...CORS_HEADERS,
                        "Content-Type": upstreamRes.headers.get("content-type") || "application/vnd.apple.mpegurl"
                    }
                });
            }

            return new Response(JSON.stringify({ message: "Embed Resolvers Worker Active", routes: ["/api/resolve?url=", "/api/bibiemb/:id", "/api/otakuhg/:code", "/api/otakuvid/:code", "/api/proxy?url="] }), {
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
            });
        }
    }
};
