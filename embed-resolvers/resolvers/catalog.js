/**
 * ANIME CATALOG & STREAM SOURCE EXTRACTOR
 * 
 * Provides:
 *  - searchAnime(query): Search anime catalog (titles, posters, slugs, episode count)
 *  - getAnimeDetails(slug): Fetch full episode list for an anime
 *  - getEpisodeServers(slug, episodeId): Extract all video servers (SUB, DUB, RAW)
 *  - resolveEpisodeStream(slug, episodeId, options): Auto-resolve stream for ArtPlayer / Anigo2
 */

const https = require('https');
const { resolveBibiemb } = require('./bibiemb');
const { resolveOtakuhg } = require('./otakuhg');
const { resolveOtakuVid } = require('./otakuvid');

const BASE_URL = 'https://anineko.to';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': BASE_URL + '/'
};

function fetchHttp(url) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const req = https.request({
            hostname: u.hostname,
            port: 443,
            path: u.pathname + u.search,
            method: 'GET',
            headers: HEADERS
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
        req.setTimeout(12000, () => req.destroy(new Error('Catalog request timeout')));
        req.end();
    });
}

/**
 * 1. Search Anime by Keyword (e.g. "Naruto", "Solo Leveling", "One Piece")
 */
async function searchAnime(query) {
    if (!query || typeof query !== 'string') {
        throw new Error('Search query is required.');
    }

    const trimmed = query.trim();
    const url = `${BASE_URL}/browser?keyword=${encodeURIComponent(trimmed)}`;
    const res = await fetchHttp(url);

    if (res.status !== 200) {
        throw new Error(`Search failed with HTTP ${res.status}`);
    }

    const results = [];
    const cardRegex = /<article class="nv-anime-card[^"]*">([\s\S]*?)<\/article>/gi;
    let match;

    while ((match = cardRegex.exec(res.body)) !== null) {
        const cardHtml = match[1];
        const linkMatch = cardHtml.match(/href=["']\/watch\/([a-zA-Z0-9\-]+)["']/i);
        const imgMatch = cardHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']+)["']/i) || 
                         cardHtml.match(/<img[^>]*alt=["']([^"']+)["'][^>]*src=["']([^"']+)["']/i);
        const typeMatch = cardHtml.match(/class=["']nv-badge-new["']>([^<]+)</i);
        const ccMatch = cardHtml.match(/class=["']nv-stat-badge nv-stat-cc["']>([^<]+)</i);
        const dubMatch = cardHtml.match(/class=["']nv-stat-badge nv-stat-dub["']>([^<]+)</i);

        if (linkMatch) {
            const slug = linkMatch[1];
            const title = imgMatch ? (imgMatch[2] || imgMatch[1]) : slug.replace(/-/g, ' ').toUpperCase();
            const poster = imgMatch ? (imgMatch[1].startsWith('http') ? imgMatch[1] : imgMatch[2]) : '';

            // Clean title HTML entities
            const cleanTitle = title.replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

            results.push({
                id: slug,
                slug,
                title: cleanTitle,
                poster,
                type: typeMatch ? typeMatch[1].trim() : 'TV',
                subEpisodes: ccMatch ? ccMatch[1].replace(/CC/i, '').trim() : null,
                dubEpisodes: dubMatch ? dubMatch[1].replace(/DUB/i, '').trim() : null,
                watchUrl: `/watch/${slug}`
            });
        }
    }

    return {
        query: trimmed,
        total: results.length,
        results
    };
}

/**
 * 2. Get Anime Details & Episode List
 */
async function getAnimeDetails(slug) {
    if (!slug) throw new Error('Anime slug is required.');

    const cleanSlug = slug.trim().replace(/^\/watch\//, '');
    const url = `${BASE_URL}/watch/${cleanSlug}`;
    const res = await fetchHttp(url);

    if (res.status !== 200) {
        throw new Error(`Failed to load anime: HTTP ${res.status}`);
    }

    const titleMatch = res.body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : cleanSlug;
    const title = rawTitle.replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

    const posterMatch = res.body.match(/<div class="nv-detail-poster"[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i) ||
                        res.body.match(/<img[^>]*class="[^"]*poster[^"]*"[^>]*src=["']([^"']+)["']/i) ||
                        res.body.match(/<img[^>]*src=["'](https?:\/\/[^"']+\.(?:webp|jpg|png|jpeg))["']/i);
    const poster = posterMatch ? posterMatch[1] : '';

    // Extract all episodes
    const epMap = new Map();
    const epRegex = /href=["'](\/watch\/[a-zA-Z0-9\-]+\/(ep-[0-9]+))["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m;

    while ((m = epRegex.exec(res.body)) !== null) {
        const epId = m[2];
        const rawEpText = m[3].replace(/<[^>]+>/g, ' ').trim().replace(/\s+/g, ' ');
        const cleanEpText = rawEpText.replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

        if (!epMap.has(epId)) {
            const epNumMatch = epId.match(/ep-(\d+)/);
            const epNum = epNumMatch ? parseInt(epNumMatch[1], 10) : 1;
            epMap.set(epId, {
                id: epId,
                episodeNumber: epNum,
                title: cleanEpText.includes('Episode') ? cleanEpText : `Episode ${epNum}`,
                watchUrl: `/watch/${cleanSlug}/${epId}`
            });
        }
    }

    const episodes = Array.from(epMap.values()).sort((a, b) => a.episodeNumber - b.episodeNumber);

    return {
        slug: cleanSlug,
        title,
        poster,
        totalEpisodes: episodes.length,
        episodes
    };
}

/**
 * 3. Get Episode Streaming Servers (SUB, DUB, RAW)
 */
async function getEpisodeServers(slug, episodeId = 'ep-1') {
    if (!slug) throw new Error('Anime slug is required.');

    const cleanSlug = slug.trim().replace(/^\/watch\//, '').split('/')[0];
    const cleanEpId = episodeId.trim().startsWith('ep-') ? episodeId.trim() : `ep-${episodeId.trim()}`;
    const url = `${BASE_URL}/watch/${cleanSlug}/${cleanEpId}`;

    const res = await fetchHttp(url);
    if (res.status !== 200) {
        throw new Error(`Failed to load episode: HTTP ${res.status}`);
    }

    const servers = [];
    const btnRegex = /<button[^>]*class=["']([^"']*server-video[^"']*)["'][^>]*data-video=["']([^"']+)["'][^>]*>([\s\S]*?)<\/button>/gi;
    let m;

    while ((m = btnRegex.exec(res.body)) !== null) {
        const classes = m[1];
        const embedUrl = m[2];
        const labelHtml = m[3];
        const label = labelHtml.replace(/<[^>]+>/g, '').trim();
        const cleanLabel = label.replace(/\s+/g, ' ').trim();

        // Filter out HD-1 server as requested
        if (cleanLabel.toLowerCase().includes('hd-1') || embedUrl.includes('vivibebe.site')) {
            continue;
        }

        // Categorize audio / track
        let category = 'SUB';
        if (embedUrl.includes('dub') || classes.includes('dub') || label.toLowerCase().includes('dub')) {
            category = 'DUB';
        } else if (!embedUrl.includes('sub=') && !embedUrl.includes('caption_') && !embedUrl.includes('c1_file')) {
            category = 'RAW';
        }

        // Identify provider
        let provider = 'unknown';
        if (embedUrl.includes('bibiemb.xyz') || embedUrl.includes('vivibebe.site')) provider = 'bibiemb';
        else if (embedUrl.includes('otakuhg.site')) provider = 'otakuhg';
        else if (embedUrl.includes('otakuvid.online')) provider = 'otakuvid';
        else if (embedUrl.includes('playmogo.com')) provider = 'playmogo';

        // Extract subtitle file if present
        let subtitleUrl = null;
        try {
            const u = new URL(embedUrl);
            subtitleUrl = u.searchParams.get('sub') || u.searchParams.get('caption_1') || u.searchParams.get('c1_file') || null;
        } catch {}

        // Clean display name
        let displayName = cleanLabel;
        if (cleanLabel.startsWith('HD-2')) displayName = 'HD-2 (BibiEmb)';
        else if (cleanLabel.startsWith('StreamHG')) displayName = 'StreamHG (OtakuHG)';
        else if (cleanLabel.startsWith('Earnvids')) displayName = 'Earnvids (OtakuVid)';

        servers.push({
            provider,
            serverName: displayName || provider.toUpperCase(),
            rawLabel: cleanLabel,
            category,
            embedUrl,
            subtitleUrl,
            isSupported: ['bibiemb', 'otakuhg', 'otakuvid'].includes(provider)
        });
    }

    return {
        slug: cleanSlug,
        episodeId: cleanEpId,
        totalServers: servers.length,
        servers
    };
}

/**
 * 4. Resolve Episode to direct Playable Streams
 */
async function resolveEpisodeStream(slug, episodeId = 'ep-1', options = {}) {
    const serverData = await getEpisodeServers(slug, episodeId);
    if (!serverData.servers || serverData.servers.length === 0) {
        throw new Error('No streaming servers found for this episode.');
    }

    // Filter by preferred category if provided (SUB / DUB / RAW)
    const category = (options.category || 'SUB').toUpperCase();
    let candidates = serverData.servers.filter(s => s.isSupported && s.category === category);
    
    // Fallback if preferred category not found
    if (candidates.length === 0) {
        candidates = serverData.servers.filter(s => s.isSupported);
    }

    if (candidates.length === 0) {
        throw new Error('No supported resolver found for this episode.');
    }

    // Sort by priority: OtakuVid (direct 1080p open CORS) > BibiEmb > OtakuHG
    const priorityOrder = { 'otakuvid': 1, 'bibiemb': 2, 'otakuhg': 3 };
    candidates.sort((a, b) => (priorityOrder[a.provider] || 99) - (priorityOrder[b.provider] || 99));

    // Try resolving starting from top candidate
    let lastError = null;
    for (const server of candidates) {
        try {
            let result;
            if (server.provider === 'otakuvid') {
                result = await resolveOtakuVid(server.embedUrl, options);
            } else if (server.provider === 'bibiemb') {
                result = await resolveBibiemb(server.embedUrl, options);
            } else if (server.provider === 'otakuhg') {
                result = await resolveOtakuhg(server.embedUrl, options);
            }

            if (result && result.streams && result.streams.length > 0) {
                // Attach subtitles if server embedUrl had subtitle query parameter
                if (server.subtitleUrl && (!result.subtitles || result.subtitles.length === 0)) {
                    result.subtitles = [{
                        file: server.subtitleUrl,
                        label: 'English',
                        kind: 'captions',
                        default: true
                    }];
                }

                return {
                    ...result,
                    animeSlug: slug,
                    episodeId: serverData.episodeId,
                    category: server.category,
                    allServers: serverData.servers
                };
            }
        } catch (err) {
            lastError = err;
        }
    }

    throw lastError || new Error('Failed to extract stream from episode servers.');
}

module.exports = {
    searchAnime,
    getAnimeDetails,
    getEpisodeServers,
    resolveEpisodeStream
};
