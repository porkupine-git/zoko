/**
 * Unified Anime Portal & Stream Engine
 * Powered by: AnimeSky (animesky.app) + AS-CDN + Kitsu / AniList / AniZip Metadata
 * Serves Ultra-Modern Web Application on Port 5050
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const { getAnimeSkySeries, resolveAnimeSkyEpisode, searchAnimeSky, getAnimeSkySeasonEpisodes, resolveAnimeSkySeriesUrl } = require('./engines/animesky');
const { searchAnimeCatalog } = require('./engines/metadata');
const { resolveAsCdn, handleProxyRequest, rewriteM3u8 } = require('./engines/asCdn');

const app = express();
const PORT = parseInt(process.env.PORT) || 5050;
const HOST = process.env.HOST || '0.0.0.0';

process.on('uncaughtException', (err) => console.warn('[PORTAL GUARD] uncaughtException:', err.message));
process.on('unhandledRejection', (reason) => console.warn('[PORTAL GUARD] unhandledRejection:', reason));

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getBaseUrl(req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    return `${proto}://${host}`;
}

// 1. Healthcheck
app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'animesky-portal',
        port: PORT,
        uptime: Math.floor(process.uptime()),
        platform: 'animesky.app'
    });
});

// 2. Anime Search API (Powered by Kitsu, AniList, MAL/Jikan & AnimeSky)
app.get('/api/search', async (req, res) => {
    try {
        const q = req.query.q || req.query.query;
        if (!q) return res.json({ success: true, results: [] });

        // First query fast catalog (Kitsu, AniList, MAL)
        let results = await searchAnimeCatalog(q);

        // If catalog returned nothing, fallback to direct AnimeSky search
        if (results.length === 0) {
            const skyResults = await searchAnimeSky(q);
            results = skyResults.map(s => ({
                id: s.seriesUrl,
                title: s.title,
                romajiTitle: s.title,
                rating: null,
                year: null,
                format: 'TV',
                status: null,
                poster: s.poster,
                banner: null,
                synopsis: '',
                seriesUrl: s.seriesUrl,
                streamQuery: s.title,
                source: 'animesky'
            }));
        }

        res.json({ success: true, count: results.length, provider: 'catalog', results });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Preset Top-Tier Trending Series on AnimeSky
app.get('/api/presets', (req, res) => {
    res.json([
        {
            platform: 'AnimeSky',
            category: 'shonen',
            title: 'Naruto Shippuden',
            poster: 'https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg',
            seriesUrl: 'https://animesky.app/series/naruto-shippuden/',
            sampleEpisode: 'https://animesky.app/episode/naruto-shippuden-1x1/',
            badge: '5 Audios • Hindi Dub Default'
        },
        {
            platform: 'AnimeSky',
            category: 'supernatural',
            title: 'Jujutsu Kaisen',
            poster: 'https://image.tmdb.org/t/p/w500/fHpKWqa486rIikWqXF13fFk68Bf.jpg',
            seriesUrl: 'https://animesky.app/series/jujutsu-kaisen/',
            sampleEpisode: 'https://animesky.app/episode/jujutsu-kaisen-1x1/',
            badge: '1080p • Multi-Audio & Subs'
        },
        {
            platform: 'AnimeSky',
            category: 'action',
            title: 'Demon Slayer',
            poster: 'https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg',
            seriesUrl: 'https://animesky.app/series/demon-slayer-kimetsu-no-yaiba/',
            sampleEpisode: 'https://animesky.app/episode/demon-slayer-1x1/',
            badge: '1080p FHD • Multi-Audio'
        },
        {
            platform: 'AnimeSky',
            category: 'action',
            title: 'Solo Leveling',
            poster: 'https://image.tmdb.org/t/p/w500/geCRueV3ElhRTr0xtJuPxJ8BGdM.jpg',
            seriesUrl: 'https://animesky.app/series/solo-leveling/',
            sampleEpisode: 'https://animesky.app/episode/solo-leveling-1x1/',
            badge: '1080p • Hindi Dub'
        },
        {
            platform: 'AnimeSky',
            category: 'shonen',
            title: 'Naruto (Original)',
            poster: 'https://image.tmdb.org/t/p/w500/xppeysfvDKVx775MFuH8Z9BlpMk.jpg',
            seriesUrl: 'https://animesky.app/series/naruto/',
            sampleEpisode: 'https://animesky.app/episode/naruto-1x1/',
            badge: 'Classic Anime • Complete Series'
        }
    ]);
});

// 4. Universal Series Scraper
app.get('/api/series', async (req, res) => {
    try {
        let url = req.query.url;
        if (!url) return res.status(400).json({ success: false, error: 'Missing url parameter.' });

        // If user typed a search term or title instead of a direct URL, auto-resolve with smart candidate matching
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            const resolvedUrl = await resolveAnimeSkySeriesUrl(url);
            if (!resolvedUrl) {
                return res.status(404).json({ success: false, error: `No streaming series found for "${url}" on AnimeSky.` });
            }
            url = resolvedUrl;
        }

        const targetSeason = parseInt(req.query.season, 10) || 1;
        const data = await getAnimeSkySeries(url, { targetSeason });
        res.json({ ...data, provider: 'animesky' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4b. AnimeSky Season Episodes AJAX
app.get('/api/series/season', async (req, res) => {
    try {
        const { postId, season, title, offset } = req.query;
        if (!postId || !season) {
            return res.status(400).json({ success: false, error: 'Missing postId or season query parameter' });
        }
        const data = await getAnimeSkySeasonEpisodes(
            postId, 
            parseInt(season, 10), 
            title || '', 
            parseInt(offset, 10) || 0
        );
        res.json({ ...data, provider: 'animesky' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Universal Episode Resolver
app.get('/api/watch', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).json({ success: false, error: 'Missing url parameter.' });

        const hostUrl = getBaseUrl(req);
        const data = await resolveAnimeSkyEpisode(url);

        const enhancedServers = data.servers.map(s => {
            if (s.key === 'as-cdn') {
                const domain = s.hostDomain || 'as-cdn26.top';
                return {
                    ...s,
                    proxiedMasterM3u8: `${hostUrl}/api/stream/${s.hash}/master.m3u8?host=${encodeURIComponent(domain)}&ref=${encodeURIComponent(url)}`
                };
            }
            return {
                ...s,
                proxiedMasterM3u8: s.directHls?.masterHlsUrl
            };
        });

        const primary = enhancedServers[0];

        res.json({
            ...data,
            provider: 'animesky',
            servers: enhancedServers,
            primaryStream: primary ? {
                ...primary.directHls,
                proxiedMasterM3u8: primary.proxiedMasterM3u8
            } : null
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. AS-CDN Master M3U8 Playlist Proxy
app.get('/api/stream/:hash/master.m3u8', async (req, res) => {
    try {
        const { hash } = req.params;
        const hostUrl = getBaseUrl(req);
        const hostDomain = req.query.host || 'as-cdn26.top';
        const ref = req.query.ref || 'https://animesky.app/';

        const hlsData = await resolveAsCdn(hash, hostDomain, ref, { parsePlaylist: false });

        const upstreamRes = await fetch(hlsData.masterHlsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': `https://${hostDomain}/`
            }
        });

        if (!upstreamRes.ok) {
            return res.status(upstreamRes.status).send(`#EXTM3U\n# Error fetching upstream: HTTP ${upstreamRes.status}`);
        }

        const m3u8Text = await upstreamRes.text();
        const rewritten = rewriteM3u8(m3u8Text, hlsData.masterHlsUrl, hostUrl);

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.send(rewritten);
    } catch (err) {
        res.status(500).send(`#EXTM3U\n# Error: ${err.message}`);
    }
});

// 6. Universal Proxy for AS-CDN Playlists & Chunks
app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    const hostUrl = getBaseUrl(req);
    await handleProxyRequest(targetUrl, hostUrl, req, res);
});

// All other routes serve index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
    app.listen(PORT, HOST, () => {
        console.log(`================================================================`);
        console.log(`🌟 UNIFIED ANIME PORTAL ACTIVE AT http://localhost:${PORT}`);
        console.log(`================================================================`);
        console.log(`  🔗 Dedicated Engine: AnimeSky (animesky.app)`);
        console.log(`  🚀 Player Web UI:    http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}/`);
        console.log(`================================================================`);
    });
}

module.exports = app;
