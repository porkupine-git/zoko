/**
 * AnimeSky Scraper Engine
 */

const { resolveAsCdn } = require('./asCdn');
const { fetchAnimeMetadata, findEpisodeMetadata } = require('./metadata');

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
};

async function getAnimeSkySeries(seriesUrl, options = {}) {
    const { timeoutMs = 8000 } = options;
    const cleanUrl = seriesUrl.trim().replace(/\/+$/, '') + '/';

    const res = await fetch(cleanUrl, {
        headers: DEFAULT_HEADERS,
        signal: AbortSignal.timeout(timeoutMs)
    });

    if (!res.ok) throw new Error(`AnimeSky returned HTTP ${res.status}`);

    const html = await res.text();

    const titleMatch = html.match(/<h1[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>([^<]+)<\/h1>/i) ||
                       html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                       html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/-\s*Anime\s*Sky.*$/i, '').trim() : 'Anime';

    const posterMatch = html.match(/<div[^>]*class=["'][^"']*poster[^"']*["'][^>]*>[\s\S]*?<img[^>]+(?:src|data-src)=["']([^"']+)["']/i) ||
                        html.match(/<img[^>]+class=["'][^"']*wp-post-image[^"']*["'][^>]+(?:src|data-src)=["']([^"']+)["']/i);
    let poster = posterMatch ? posterMatch[1] : null;
    if (poster && poster.startsWith('//')) poster = 'https:' + poster;

    // Extract Season Tabs/Buttons
    const seasonBtns = [...html.matchAll(/class=["'][^"']*season-btn[^"']*["'][^>]*data-post=["'](\d+)["'][^>]*data-season=["'](\d+)["'][\s\S]*?<span[^>]*class=["']season-label["']>([^<]+)<\/span>(?:<span[^>]*class=["']season-episodes["']>([^<]+)<\/span>)?/gi)];
    const seasons = seasonBtns.map(m => ({
        postId: m[1],
        season: parseInt(m[2], 10),
        label: m[3].trim(),
        episodesRange: m[4] ? m[4].trim() : ''
    }));

    // Extract Initial Episodes
    const linkMatches = [...html.matchAll(/href=["'](https?:\/\/animesky\.app\/episode\/[^"']+)["']/gi)].map(m => m[1]);
    const uniqueLinks = [...new Set(linkMatches)];

    const initialEpisodes = uniqueLinks.map((url, idx) => {
        const match = url.match(/(\d+)x(\d+)\/?$/);
        const season = match ? parseInt(match[1], 10) : 1;
        const epNum = match ? parseInt(match[2], 10) : (idx + 1);

        return {
            episode: epNum,
            season,
            title: `Episode ${epNum}`,
            watchUrl: url
        };
    }).sort((a, b) => a.episode - b.episode);

    // Fetch rich metadata from Kitsu & AniZip
    let meta = null;
    try {
        meta = await fetchAnimeMetadata(title);
    } catch (e) {
        console.warn('[AnimeSky] Metadata fetch failed:', e.message);
    }

    // Enrich episodes with official titles and thumbnails
    const enrichedEpisodes = initialEpisodes.map(ep => {
        const azEp = findEpisodeMetadata(meta?.episodesMap, ep.season, ep.episode, 0);
        return {
            ...ep,
            title: azEp?.title?.en || azEp?.title?.['x-jat'] || ep.title,
            airdate: azEp?.airDate || azEp?.airdate || null,
            thumbnail: azEp?.image || meta?.fanart || meta?.banner || meta?.poster || poster,
            overview: azEp?.overview || azEp?.summary || null
        };
    });

    let activeSeason = 1;
    let finalEpisodes = enrichedEpisodes;
    let finalMeta = meta;

    const targetSeasonNum = parseInt(options.targetSeason, 10) || 1;
    if (targetSeasonNum > 1) {
        const targetSeasonObj = seasons.find(s => s.season === targetSeasonNum);
        if (targetSeasonObj) {
            try {
                let offset = 0;
                if (targetSeasonObj.episodesRange) {
                    const match = targetSeasonObj.episodesRange.match(/(\d+)/);
                    if (match) offset = parseInt(match[1], 10);
                }
                const seasonData = await getAnimeSkySeasonEpisodes(targetSeasonObj.postId, targetSeasonObj.season, title, offset, options);
                if (seasonData && seasonData.episodes && seasonData.episodes.length > 0) {
                    finalEpisodes = seasonData.episodes;
                    activeSeason = targetSeasonObj.season;
                }
                const sMeta = await fetchAnimeMetadata(title, targetSeasonObj.season);
                if (sMeta) finalMeta = sMeta;
            } catch (sErr) {
                console.warn(`[AnimeSky] Auto-loading targetSeason ${targetSeasonNum} failed:`, sErr.message);
            }
        }
    }

    return {
        success: true,
        source: 'animesky.app',
        seriesUrl: cleanUrl,
        title,
        activeSeason,
        poster: finalMeta?.poster || meta?.poster || poster,
        banner: finalMeta?.fanart || finalMeta?.banner || meta?.fanart || meta?.banner || null,
        meta: finalMeta || meta,
        seasons,
        totalEpisodes: finalEpisodes.length,
        episodes: finalEpisodes
    };
}

async function resolveAnimeSkyEpisode(episodeUrl, options = {}) {
    const { timeoutMs = 8000 } = options;
    const cleanUrl = episodeUrl.trim();

    const res = await fetch(cleanUrl, {
        headers: DEFAULT_HEADERS,
        signal: AbortSignal.timeout(timeoutMs)
    });

    if (!res.ok) throw new Error(`AnimeSky episode returned HTTP ${res.status}`);

    const html = await res.text();

    const asCdnMatch = html.match(/https?:\/\/(as-cdn\d*\.top)\/video\/([a-zA-Z0-9_\-]+)/i);
    let primaryAsCdn = null;

    if (asCdnMatch) {
        const hostDomain = asCdnMatch[1];
        const hash = asCdnMatch[2];
        try {
            const hlsData = await resolveAsCdn(hash, hostDomain, cleanUrl, { timeoutMs: 6000 });
            primaryAsCdn = {
                name: 'AS-CDN (FirePlayer)',
                key: 'as-cdn',
                hash,
                hostDomain,
                embedUrl: asCdnMatch[0],
                isDirectHlsSupported: true,
                directHls: hlsData
            };
        } catch (e) {
            console.warn(`[AnimeSky] AS-CDN resolve failed:`, e.message);
        }
    }

    const servers = [];
    if (primaryAsCdn) servers.push(primaryAsCdn);

    if (servers.length === 0) {
        throw new Error('No supported video streams found on this AnimeSky episode page.');
    }

    return {
        success: true,
        source: 'animesky.app',
        watchUrl: cleanUrl,
        totalServers: servers.length,
        servers,
        primaryStream: primaryAsCdn ? primaryAsCdn.directHls : null
    };
}

async function searchAnimeSky(query, options = {}) {
    const { timeoutMs = 8000 } = options;
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const searchUrl = `https://animesky.app/?s=${encodeURIComponent(cleanQuery)}`;
    const res = await fetch(searchUrl, {
        headers: DEFAULT_HEADERS,
        signal: AbortSignal.timeout(timeoutMs)
    });

    if (!res.ok) return [];
    const html = await res.text();

    const articles = [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)];
    const results = [];
    const seen = new Set();

    for (const a of articles) {
        const linkMatch = a[1].match(/href=["'](https?:\/\/animesky\.app\/series\/[^"']+)["']/i);
        if (!linkMatch) continue;
        const seriesUrl = linkMatch[1];
        if (seen.has(seriesUrl)) continue;
        seen.add(seriesUrl);

        const titleMatch = a[1].match(/<h3[^>]*class=["'][^"']*tr-movie-title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i) ||
                           a[1].match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) ||
                           a[1].match(/alt=["']Image\s*([^"']+)["']/i);
        const imgMatch = a[1].match(/data-src=["']([^"']+)["']/i) || a[1].match(/src=["']([^"']+)["']/i);
        let poster = imgMatch ? imgMatch[1] : null;
        if (poster && poster.startsWith('//')) poster = 'https:' + poster;

        const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Anime';

        results.push({
            title,
            seriesUrl,
            poster
        });
    }

    return results;
}

async function getAnimeSkySeasonEpisodes(postId, season, seriesTitle = '', offset = 0, options = {}) {
    const { timeoutMs = 8000 } = options;
    const url = `https://animesky.app/wp-admin/admin-ajax.php?action=action_select_season&season=${season}&post=${postId}`;

    const res = await fetch(url, {
        headers: DEFAULT_HEADERS,
        signal: AbortSignal.timeout(timeoutMs)
    });

    if (!res.ok) throw new Error(`AnimeSky season AJAX returned HTTP ${res.status}`);

    const html = await res.text();
    const linkMatches = [...html.matchAll(/href=["'](https?:\/\/animesky\.app\/episode\/[^"']+)["']/gi)].map(m => m[1]);
    const uniqueLinks = [...new Set(linkMatches)];

    const episodes = uniqueLinks.map((u, idx) => {
        const match = u.match(/(\d+)x(\d+)\/?$/);
        const s = match ? parseInt(match[1], 10) : season;
        const epNum = match ? parseInt(match[2], 10) : (idx + 1);

        return {
            episode: epNum,
            season: s,
            title: `Episode ${epNum}`,
            watchUrl: u
        };
    }).sort((a, b) => a.episode - b.episode);

    let meta = null;
    if (seriesTitle) {
        try {
            meta = await fetchAnimeMetadata(seriesTitle, season);
        } catch (e) {}
    }

    const enrichedEpisodes = episodes.map(ep => {
        const azEp = findEpisodeMetadata(meta?.episodesMap, ep.season, ep.episode, offset);
        return {
            ...ep,
            title: azEp?.title?.en || azEp?.title?.['x-jat'] || ep.title,
            airdate: azEp?.airDate || azEp?.airdate || null,
            thumbnail: azEp?.image || meta?.fanart || meta?.banner || meta?.poster || null,
            overview: azEp?.overview || azEp?.summary || null
        };
    });

    return {
        success: true,
        season,
        postId,
        totalEpisodes: enrichedEpisodes.length,
        episodes: enrichedEpisodes
    };
}

function isTitleMatch(query, matchTitle) {
    if (!query || !matchTitle) return false;
    const cleanQ = query.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanM = matchTitle.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

    if (cleanQ === cleanM) return true;
    if (cleanM.startsWith(cleanQ)) return true;

    const qWords = cleanQ.split(' ').filter(w => w.length > 1);
    const mWords = cleanM.split(' ').filter(w => w.length > 1);

    if (qWords.length === 0 || mWords.length === 0) return false;

    // Guard against wrong prefix (e.g. "Monster" vs "Re:Monster")
    if (qWords.length === 1 && mWords.length > 1 && mWords[0] !== qWords[0]) {
        return false;
    }

    const significantWords = qWords.filter(w => !['the', 'a', 'an', 'of', 'in', 'on', 'no', 'to', 'and'].includes(w));
    if (significantWords.length === 0) return false;

    const matchedWords = significantWords.filter(w => mWords.includes(w));
    return (matchedWords.length / significantWords.length) >= 0.75;
}

async function resolveAnimeSkySeriesUrl(titleOrUrl, options = {}) {
    const raw = (titleOrUrl || '').trim();
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

    // Generate smart candidates
    const baseCandidate = raw.split(/[:–—\-]/)[0].trim();
    const cleanBase = baseCandidate.replace(/\b(Season\s*\d+|S\d+|Dub|Sub|Part\s*\d+)\b/gi, '').trim();
    const cleanRaw = raw.replace(/\b(Season\s*\d+|S\d+|Dub|Sub|Part\s*\d+)\b/gi, '').trim();

    const candidates = [...new Set([cleanBase, baseCandidate, cleanRaw, raw].filter(Boolean))];

    for (const cand of candidates) {
        try {
            const matches = await searchAnimeSky(cand, options);
            if (matches.length > 0) {
                // Find a match that actually matches the candidate or raw title
                const matchedSeries = matches.find(m => isTitleMatch(cand, m.title) || isTitleMatch(raw, m.title));
                if (matchedSeries) {
                    return matchedSeries.seriesUrl;
                }
            }
        } catch (e) {
            console.warn(`[AnimeSky] Candidate search error for "${cand}":`, e.message);
        }
    }
    return null;
}

module.exports = {
    getAnimeSkySeries,
    resolveAnimeSkyEpisode,
    searchAnimeSky,
    getAnimeSkySeasonEpisodes,
    resolveAnimeSkySeriesUrl
};
