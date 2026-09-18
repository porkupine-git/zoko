/**
 * VidBolt Streaming Scraper Core Module
 * 
 * Capabilities:
 * - Movies & TV series streaming extraction
 * - FastVa (ultra-low latency adaptive HLS m3u8)
 * - MovieBoxV2 (1080p high bitrate + multi-audio tracks)
 * - Saffron (Hindi dubbed / Bollywood / Indian multi-audio)
 * - VDRK Subtitles (30-90+ WebVTT subtitle files)
 */

const VIDBOLT_API = 'https://scraper.vidbolt.xyz';
const SHOWBOX_API = 'https://showbox.filmu.in';
const SUBTITLE_API = 'https://sub.vdrk.site/v1';

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer': 'https://vidbolt.pro/'
};

/**
 * Helper to fetch with timeout
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeout);
        return response;
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

/**
 * 1. FastVa Scraper (Ultra Fast HLS)
 */
async function scrapeFastVa({ type, tmdbId, season, episode }) {
    try {
        const path = type === 'tv'
            ? `/scrape/FastVa/tv/tmdb${tmdbId}?tmdbId=${tmdbId}&season=${season}&episode=${episode}`
            : `/scrape/FastVa/movie/tmdb${tmdbId}?tmdbId=${tmdbId}`;

        const res = await fetchWithTimeout(`${VIDBOLT_API}${path}`, { headers: DEFAULT_HEADERS }, 5000);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.sources || []).map(s => ({
            server: `FastVa (${s.name || 'Server'})`,
            provider: 'fastva',
            url: s.url,
            quality: s.quality || 'Auto',
            type: s.type || 'm3u8',
            language: s.language || 'Original',
            priority: 1
        }));
    } catch {
        return [];
    }
}

/**
 * 2. MovieBoxV2 Scraper (1080p + Multi-Audio Dubs)
 */
async function scrapeMovieBox({ type, tmdbId, title, year, season, episode }) {
    try {
        const encodedTitle = encodeURIComponent(title || 'Media');
        const path = type === 'tv'
            ? `/scrape/MovieBoxV2/tv/tmdb${tmdbId}?title=${encodedTitle}&tmdbId=${tmdbId}&season=${season}&episode=${episode}${year ? `&year=${year}` : ''}`
            : `/scrape/MovieBoxV2/movie/tmdb${tmdbId}?title=${encodedTitle}&tmdbId=${tmdbId}${year ? `&year=${year}` : ''}`;

        const res = await fetchWithTimeout(`${SHOWBOX_API}${path}`, { headers: DEFAULT_HEADERS }, 8000);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.sources || []).map(s => ({
            server: s.name || 'MovieBox',
            provider: 'moviebox',
            url: s.url,
            quality: s.quality || '1080p',
            type: s.type || 'm3u8',
            language: s.name?.includes('Hindi') ? 'Hindi' : (s.name?.includes('Spanish') ? 'Spanish' : (s.name?.includes('French') ? 'French' : 'Original')),
            priority: 2
        }));
    } catch {
        return [];
    }
}

/**
 * 3. Saffron Scraper (Hindi / Indian Dubbed Content)
 */
async function scrapeSaffron({ type, tmdbId, title, year, season, episode }) {
    try {
        const encodedTitle = encodeURIComponent(title || 'Media');
        const path = type === 'tv'
            ? `/scrape/Saffron/tv/tmdb${tmdbId}?tmdbId=${tmdbId}&season=${season}&episode=${episode}&title=${encodedTitle}${year ? `&year=${year}` : ''}`
            : `/scrape/Saffron/movie/tmdb${tmdbId}?tmdbId=${tmdbId}&title=${encodedTitle}${year ? `&year=${year}` : ''}`;

        const res = await fetchWithTimeout(`${VIDBOLT_API}${path}`, { headers: DEFAULT_HEADERS }, 6000);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.sources || []).map(s => ({
            server: `Saffron (${s.name || s.quality || 'Server'})`,
            provider: 'saffron',
            url: s.url,
            quality: s.quality || '1080p',
            type: s.type || 'm3u8',
            language: s.name || 'Hindi / Multi',
            priority: 3
        }));
    } catch {
        return [];
    }
}

/**
 * 4. Subtitles Provider (VDRK WebVTT)
 */
async function getSubtitles({ type, tmdbId, season, episode }) {
    try {
        const path = type === 'tv'
            ? `${SUBTITLE_API}/tv/${tmdbId}/${season}/${episode}`
            : `${SUBTITLE_API}/movie/${tmdbId}`;

        const res = await fetchWithTimeout(path, {}, 5000);
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data.map(sub => ({
            label: sub.label,
            url: sub.file,
            kind: 'captions'
        })) : [];
    } catch {
        return [];
    }
}

/**
 * Main Scraper Function
 * Concurrent multi-provider scraping with fallback support
 * 
 * @param {Object} options
 * @param {'movie'|'tv'} options.type - 'movie' or 'tv'
 * @param {number|string} options.tmdbId - TMDB ID (e.g. 550)
 * @param {number|string} [options.season=1] - TV Season number
 * @param {number|string} [options.episode=1] - TV Episode number
 * @param {string} [options.title=''] - Media title (improves MovieBox/Saffron matching)
 * @param {number|string} [options.year=''] - Release year
 */
async function getStreams({
    type = 'movie',
    tmdbId,
    season = 1,
    episode = 1,
    title = '',
    year = ''
} = {}) {
    if (!tmdbId) {
        throw new Error('tmdbId is required');
    }

    const startTime = Date.now();

    const [fastVa, movieBox, saffron, subtitles] = await Promise.all([
        scrapeFastVa({ type, tmdbId, season, episode }),
        scrapeMovieBox({ type, tmdbId, title, year, season, episode }),
        scrapeSaffron({ type, tmdbId, title, year, season, episode }),
        getSubtitles({ type, tmdbId, season, episode })
    ]);

    // Priority ordering: FastVa -> MovieBox -> Saffron
    const sources = [...fastVa, ...movieBox, ...saffron];

    return {
        success: sources.length > 0,
        media: {
            type,
            tmdbId,
            ...(type === 'tv' ? { season: Number(season), episode: Number(episode) } : {}),
            title,
            year
        },
        durationMs: Date.now() - startTime,
        totalSources: sources.length,
        totalSubtitles: subtitles.length,
        sources,
        subtitles
    };
}

module.exports = {
    getStreams,
    scrapeFastVa,
    scrapeMovieBox,
    scrapeSaffron,
    getSubtitles
};
