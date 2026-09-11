/**
 * AS-CDN (FirePlayer / as-cdn26.top) Reverse-Engineered Stream Engine
 */

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': '*/*'
};

async function resolveAsCdn(hash, hostDomain = 'as-cdn26.top', referrer = 'https://animesky.app/', options = {}) {
    const { parsePlaylist = true, timeoutMs = 7000 } = options;
    const cleanHash = hash.trim();
    const cdnBase = `https://${hostDomain}`;

    const apiEndpoint = `${cdnBase}/player/index.php?data=${cleanHash}&do=getVideo`;

    const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': `${cdnBase}/`,
            'Origin': cdnBase,
            'User-Agent': DEFAULT_HEADERS['User-Agent'],
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams({
            hash: cleanHash,
            r: referrer
        }).toString(),
        signal: AbortSignal.timeout(timeoutMs)
    });

    if (!res.ok) {
        throw new Error(`AS-CDN API (${hostDomain}) returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.videoSource) {
        throw new Error(`AS-CDN did not return a valid videoSource: ${JSON.stringify(data)}`);
    }

    let parsedPlaylists = null;
    if (parsePlaylist) {
        try {
            const m3u8Res = await fetch(data.videoSource, {
                headers: {
                    'User-Agent': DEFAULT_HEADERS['User-Agent'],
                    'Referer': `${cdnBase}/`
                },
                signal: AbortSignal.timeout(Math.min(timeoutMs, 4000))
            });

            if (m3u8Res.ok) {
                const m3u8Text = await m3u8Res.text();
                parsedPlaylists = parseMasterM3u8(m3u8Text, data.videoSource);
            }
        } catch (e) {
            console.warn(`[AS-CDN] Could not pre-parse master M3U8:`, e.message);
        }
    }

    return {
        success: true,
        provider: 'AS-CDN (FirePlayer)',
        hash: cleanHash,
        hostDomain,
        poster: data.videoImage || null,
        masterHlsUrl: data.videoSource,
        securedLink: data.securedLink || data.videoSource,
        parsedPlaylists,
        ck: data.ck || null
    };
}

function parseMasterM3u8(m3u8Content, masterUrl) {
    const baseUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1);
    const origin = new URL(masterUrl).origin;

    const audioRegex = /#EXT-X-MEDIA:TYPE=AUDIO[^\n]*/gi;
    const audioTracks = [];
    let aMatch;
    while ((aMatch = audioRegex.exec(m3u8Content)) !== null) {
        const line = aMatch[0];
        const nameMatch = line.match(/NAME="([^"]+)"/i);
        const langMatch = line.match(/LANGUAGE="([^"]+)"/i);
        const uriMatch = line.match(/URI="([^"]+)"/i);
        if (nameMatch && uriMatch) {
            const uri = uriMatch[1].trim();
            const fullUrl = uri.startsWith('http') ? uri : (uri.startsWith('/') ? `${origin}${uri}` : `${baseUrl}${uri}`);
            audioTracks.push({
                name: nameMatch[1],
                language: langMatch ? langMatch[1] : 'und',
                url: fullUrl
            });
        }
    }

    // Parse Subtitle Tracks
    const subtitleRegex = /#EXT-X-MEDIA:TYPE=SUBTITLES[^\n]*/gi;
    const subtitleTracks = [];
    let sMatch;
    while ((sMatch = subtitleRegex.exec(m3u8Content)) !== null) {
        const line = sMatch[0];
        const nameMatch = line.match(/NAME="([^"]+)"/i);
        const langMatch = line.match(/LANGUAGE="([^"]+)"/i);
        const uriMatch = line.match(/URI="([^"]+)"/i);
        if (nameMatch && uriMatch) {
            const uri = uriMatch[1].trim();
            const fullUrl = uri.startsWith('http') ? uri : (uri.startsWith('/') ? `${origin}${uri}` : `${baseUrl}${uri}`);
            subtitleTracks.push({
                name: nameMatch[1],
                language: langMatch ? langMatch[1] : 'en',
                url: fullUrl
            });
        }
    }

    const videoStreamRegex = /#EXT-X-STREAM-INF:[^\n]*RESOLUTION=(\d+x\d+)[^\n]*(?:NAME="([^"]+)")?[^\n]*\n([^\n]+)/gi;
    const videoStreams = [];
    let match;
    while ((match = videoStreamRegex.exec(m3u8Content)) !== null) {
        const resolution = match[1];
        const name = match[2] || `${resolution.split('x')[1]}p`;
        const uri = match[3].trim();
        const fullUrl = uri.startsWith('http') ? uri : (uri.startsWith('/') ? `${origin}${uri}` : `${baseUrl}${uri}`);
        videoStreams.push({
            label: name,
            resolution,
            url: fullUrl
        });
    }

    // Sort audio tracks so Hindi is first, but keep all other languages available
    audioTracks.sort((a, b) => {
        const aHin = (a.language && /hin|hi/i.test(a.language)) || (a.name && /hindi/i.test(a.name));
        const bHin = (b.language && /hin|hi/i.test(b.language)) || (b.name && /hindi/i.test(b.name));
        if (aHin && !bHin) return -1;
        if (!aHin && bHin) return 1;
        return 0;
    });

    return {
        audioTracks,
        subtitleTracks,
        videoStreams: videoStreams.sort((a, b) => parseInt(b.label) - parseInt(a.label))
    };
}

function rewriteM3u8(content, sourceUrl, hostUrl) {
    const origin = new URL(sourceUrl).origin;
    const baseUrl = sourceUrl.substring(0, sourceUrl.lastIndexOf('/') + 1);

    function makeProxyUrl(relativeOrAbsUrl) {
        let fullUrl = relativeOrAbsUrl.trim();
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
            fullUrl = fullUrl.startsWith('/') ? `${origin}${fullUrl}` : `${baseUrl}${fullUrl}`;
        }
        return `${hostUrl}/api/proxy?url=${encodeURIComponent(fullUrl)}`;
    }

    const lines = content.split('\n');

    // Prioritize Hindi audio track as DEFAULT=YES and place it first, while keeping all other languages
    const audioLines = lines.filter(l => l.trim().startsWith('#EXT-X-MEDIA:TYPE=AUDIO'));
    const hindiAudioLines = audioLines.filter(l => /LANGUAGE=["']?(hin|hi)["']?/i.test(l) || /NAME=["'][^"']*hindi[^"']*["']/i.test(l));
    const otherAudioLines = audioLines.filter(l => !(/LANGUAGE=["']?(hin|hi)["']?/i.test(l) || /NAME=["'][^"']*hindi[^"']*["']/i.test(l)));

    let audioIndex = 0;
    let orderedAudioLines = [];

    if (hindiAudioLines.length > 0) {
        orderedAudioLines = [
            ...hindiAudioLines.map((l, idx) => idx === 0 ? l.replace(/DEFAULT=NO/i, 'DEFAULT=YES') : l),
            ...otherAudioLines.map(l => l.replace(/DEFAULT=YES/i, 'DEFAULT=NO'))
        ];
    } else {
        // No Hindi audio: preserve original default track (Japanese/English)
        orderedAudioLines = [...audioLines];
    }

    const rewrittenLines = lines.map(line => {
        let trimmed = line.trim();
        if (!trimmed) return line;

        // Replace audio lines in order with Hindi prioritized first
        if (trimmed.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
            if (orderedAudioLines.length > 0 && audioIndex < orderedAudioLines.length) {
                line = orderedAudioLines[audioIndex++];
            }
        }

        // 1. Rewrite URI="..." in audio, subtitles (#EXT-X-MEDIA) and map (#EXT-X-MAP)
        if (trimmed.startsWith('#EXT') && trimmed.includes('URI="')) {
            return line.replace(/URI="([^"]+)"/g, (match, uri) => {
                return `URI="${makeProxyUrl(uri)}"`;
            });
        }

        // 2. Rewrite non-comment stream/chunk lines
        if (!trimmed.startsWith('#')) {
            return makeProxyUrl(trimmed);
        }

        return line;
    });

    return rewrittenLines.join('\n');
}

async function handleProxyRequest(targetUrl, hostUrl, req, res) {
    try {
        if (!targetUrl) {
            return res.status(400).send('Missing target URL');
        }

        let originHost = 'as-cdn26.top';
        try {
            const parsed = new URL(targetUrl);
            originHost = parsed.hostname;
        } catch (e) {}

        const headers = {
            'User-Agent': DEFAULT_HEADERS['User-Agent'],
            'Referer': `https://${originHost}/`,
            'Origin': `https://${originHost}`
        };

        if (req.headers.range) {
            headers['Range'] = req.headers.range;
        }

        const upstreamRes = await fetch(targetUrl, { headers });

        if (!upstreamRes.ok && upstreamRes.status !== 206) {
            return res.status(upstreamRes.status).send(`Upstream returned HTTP ${upstreamRes.status}`);
        }

        const contentType = (upstreamRes.headers.get('content-type') || '').toLowerCase();

        // 1. Check if subtitle file (.vtt or .srt)
        if (targetUrl.includes('.vtt') || targetUrl.includes('.srt') || contentType.includes('vtt')) {
            const vttText = await upstreamRes.text();
            res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            return res.send(vttText);
        }

        // 2. Check if M3U8 playlist
        const isChunk = targetUrl.includes('/p/') || targetUrl.match(/\.(ts|m4s|mp4)$/i);
        const isM3u8 = !isChunk && (
            targetUrl.includes('.m3u8') || 
            targetUrl.includes('/hls/') || 
            contentType.includes('mpegurl') || 
            contentType.includes('m3u8') ||
            contentType.includes('text/plain')
        );

        if (isM3u8) {
            const text = await upstreamRes.text();
            const rewritten = rewriteM3u8(text, targetUrl, hostUrl);
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=60');
            return res.send(rewritten);
        }

        const forwardHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
        forwardHeaders.forEach(h => {
            const val = upstreamRes.headers.get(h);
            if (val) res.setHeader(h, val);
        });

        // Set proper MPEG-TS content type for disguised chunks (.js, .css, .woff)
        if (isChunk || targetUrl.includes('.js') || targetUrl.includes('.css') || targetUrl.includes('.woff')) {
            res.setHeader('Content-Type', 'video/mp2t');
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Range, Accept, Origin, Content-Type');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

        if (upstreamRes.body) {
            const { Readable } = require('stream');
            const nodeReadable = Readable.fromWeb(upstreamRes.body);
            nodeReadable.on('error', () => {});
            res.on('close', () => nodeReadable.destroy());
            nodeReadable.pipe(res);
        } else {
            res.end();
        }
    } catch (err) {
        if (!res.headersSent) {
            res.status(500).send(`Proxy error: ${err.message}`);
        }
    }
}

module.exports = {
    resolveAsCdn,
    parseMasterM3u8,
    rewriteM3u8,
    handleProxyRequest
};
