/**
 * ZOKO ANIME ENGINE - SINGLE PAGE APPLICATION (SPA)
 * 100% Client-Side Metadata: Direct AniList GraphQL API (https://graphql.anilist.co)
 * Streaming: Backend Scraper Resolver API (/api/stream)
 * Player: ArtPlayer v5 with Hls.js & Auto Skip Intro/Outro
 * Aesthetic: Razor-Sharp, Matte Dark Mode, ZERO GLOW
 */

(function () {
    'use strict';

    // AniList Public GraphQL Endpoint
    const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

    // App State Store
    const state = {
        currentView: 'home',
        heroIndex: 0,
        heroItems: [],
        heroInterval: null,

        browse: {
            page: 1,
            totalPages: 1,
            query: '',
            genre: 'All',
            format: 'All',
            sort: 'TRENDING_DESC'
        },

        watch: {
            anilistId: null,
            malId: null,
            title: '',
            meta: null,
            episodes: [],
            activeEpisodeIndex: 1,
            activeEpisodeData: null,
            streamData: null,
            audioMode: 'sub', // 'sub' or 'dub'
            autoSkip: true,
            currentSegment: 0,
            playerInstance: null
        }
    };

    // Client In-Memory Cache Store
    const apiCache = new Map();

    // DOM Cache
    const dom = {
        navHome: document.getElementById('nav-home'),
        navBrowse: document.getElementById('nav-browse'),
        navWatch: document.getElementById('nav-watch'),

        viewHome: document.getElementById('view-home'),
        viewBrowse: document.getElementById('view-browse'),
        viewWatch: document.getElementById('view-watch'),

        globalSearch: document.getElementById('global-search-input'),
        searchDropdown: document.getElementById('search-dropdown'),

        // Home elements
        heroCarousel: document.getElementById('hero-carousel'),
        heroIndicators: document.getElementById('hero-indicators'),
        trendingGrid: document.getElementById('trending-grid'),
        popularGrid: document.getElementById('popular-grid'),
        topRatedGrid: document.getElementById('toprated-grid'),

        // Browse elements
        browseSearch: document.getElementById('browse-search-input'),
        formatSelect: document.getElementById('filter-format'),
        sortSelect: document.getElementById('filter-sort'),
        genreChips: document.getElementById('genre-chips-container'),
        browseGrid: document.getElementById('browse-grid'),
        browseCount: document.getElementById('browse-count'),
        prevPageBtn: document.getElementById('btn-prev-page'),
        nextPageBtn: document.getElementById('btn-next-page'),
        pageInfo: document.getElementById('page-info-display'),

        // Watch elements
        artContainer: document.getElementById('artplayer-container'),
        currentAnimeTitle: document.getElementById('current-anime-title'),
        currentEpTitle: document.getElementById('current-ep-title'),
        btnPrevEp: document.getElementById('btn-prev-ep'),
        btnNextEp: document.getElementById('btn-next-ep'),
        btnSub: document.getElementById('btn-audio-sub'),
        btnDub: document.getElementById('btn-audio-dub'),
        skipToggle: document.getElementById('skip-intro-toggle'),
        btnDownloadEp: document.getElementById('btn-download-ep'),
        rangeSelector: document.getElementById('ep-range-selector'),
        epSearchInput: document.getElementById('ep-search-input'),
        epListContainer: document.getElementById('ep-list-container'),
        epCountPill: document.getElementById('ep-count-pill'),
        watchPoster: document.getElementById('watch-poster-thumb'),
        watchTitle: document.getElementById('watch-details-title'),
        watchMetaRow: document.getElementById('watch-meta-row'),
        watchSynopsis: document.getElementById('watch-synopsis-text'),
        relationsSection: document.getElementById('relations-section'),
        relationsChips: document.getElementById('relations-chips-wrap'),
        recommendationsSection: document.getElementById('recommendations-section'),
        recommendationsGrid: document.getElementById('recommendations-grid'),
        toastContainer: document.getElementById('toast-container')
    };

    // --- Utility Helpers ---

    function showToast(message, type = 'info') {
        if (!dom.toastContainer) return;
        dom.toastContainer.innerHTML = '';
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'warn' ? '⚠️' : 'ℹ️'}</span> <span>${message}</span>`;
        dom.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 250);
        }, 3200);
    }

    // Dynamic Backend API Base (defaults to port 5000 if frontend is served on port 3000)
    function resolveApiUrl(url) {
        if (!url || typeof url !== 'string') return url;
        const base = window.__API_BASE__ !== undefined ? window.__API_BASE__ : (window.location.port === '3000' ? `${window.location.protocol}//${window.location.hostname}:5000` : '');
        if (url.startsWith('/api') && base) {
            return `${base}${url}`;
        }
        return url;
    }

    async function fetchJson(url) {
        const fullUrl = resolveApiUrl(url);
        if (apiCache.has(fullUrl)) {
            return apiCache.get(fullUrl);
        }
        const resp = await fetch(fullUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        apiCache.set(fullUrl, data);
        return data;
    }

    // Direct Browser Client for AniList GraphQL (Zero Backend Middleman)
    async function queryAniList(query, variables = {}) {
        const cacheKey = `anilist:${JSON.stringify({ query: query.trim(), variables })}`;
        if (apiCache.has(cacheKey)) {
            return apiCache.get(cacheKey);
        }
        const resp = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ query: query.trim(), variables })
        });
        if (!resp.ok) throw new Error(`AniList GraphQL Error: HTTP ${resp.status}`);
        const json = await resp.json();
        if (json.errors && json.errors.length > 0) {
            throw new Error(json.errors[0].message || 'AniList query failed');
        }
        const data = json.data;
        apiCache.set(cacheKey, data);
        return data;
    }

    // --- Kitsu Fallback Adapter (Instant failover if AniList is disabled or down) ---

    function normalizeKitsuAnime(item, mappings = []) {
        if (!item || !item.attributes) return null;
        const attr = item.attributes;
        const aniMapping = mappings.find(m => m.attributes?.externalSite === 'anilist/anime');
        const malMapping = mappings.find(m => m.attributes?.externalSite === 'myanimelist/anime');

        const titleRomaji = attr.titles?.en_jp || attr.canonicalTitle || 'Untitled';
        const titleEnglish = attr.titles?.en || attr.canonicalTitle || titleRomaji;
        const titleNative = attr.titles?.ja_jp || '';

        const cover = attr.posterImage?.large || attr.posterImage?.original || attr.posterImage?.medium || '';
        const banner = attr.coverImage?.large || attr.coverImage?.original || cover;

        return {
            id: aniMapping?.attributes?.externalId || item.id,
            idMal: malMapping?.attributes?.externalId ? parseInt(malMapping.attributes.externalId) : null,
            kitsuId: item.id,
            title: {
                romaji: titleRomaji,
                english: titleEnglish,
                native: titleNative
            },
            coverImage: {
                extraLarge: attr.posterImage?.original || cover,
                large: cover,
                medium: attr.posterImage?.medium || cover,
                color: '#e50914'
            },
            bannerImage: banner,
            description: attr.synopsis || attr.description || '',
            episodes: attr.episodeCount || 12,
            duration: attr.episodeLength || 24,
            genres: [],
            averageScore: Math.round(parseFloat(attr.averageRating || 80)),
            status: attr.status === 'finished' ? 'FINISHED' : (attr.status === 'current' ? 'RELEASING' : 'NOT_YET_RELEASED'),
            seasonYear: attr.startDate ? parseInt(attr.startDate.substring(0, 4)) : null,
            format: (attr.subtype || 'TV').toUpperCase()
        };
    }

    async function fetchKitsuHomePage() {
        try {
            const [tRes, pRes, trRes] = await Promise.all([
                fetch('https://kitsu.io/api/edge/trending/anime?include=mappings'),
                fetch('https://kitsu.io/api/edge/anime?sort=-userCount&page[limit]=12&include=mappings'),
                fetch('https://kitsu.io/api/edge/anime?sort=-averageRating&page[limit]=12&include=mappings')
            ]);
            const [tJson, pJson, trJson] = await Promise.all([tRes.json(), pRes.json(), trRes.json()]);

            const mapKitsu = (json) => {
                const mappings = json.included?.filter(x => x.type === 'mappings') || [];
                return (json.data || []).map(item => normalizeKitsuAnime(item, mappings)).filter(Boolean);
            };

            const trending = mapKitsu(tJson);
            const popular = mapKitsu(pJson);
            const topRated = mapKitsu(trJson);

            return {
                hero: { media: trending.slice(0, 6) },
                trending: { media: trending },
                popular: { media: popular },
                topRated: { media: topRated }
            };
        } catch (e) {
            console.error('Kitsu home load error:', e);
            return null;
        }
    }

    async function fetchKitsuBrowse({ page = 1, query = '', sort = 'TRENDING_DESC' }) {
        try {
            const limit = 24;
            const offset = (page - 1) * limit;
            let sortParam = '-userCount';
            if (sort === 'SCORE_DESC') sortParam = '-averageRating';
            if (sort === 'POPULARITY_DESC') sortParam = '-userCount';

            let url = `https://kitsu.io/api/edge/anime?page[limit]=${limit}&page[offset]=${offset}&include=mappings`;
            if (query) {
                url += `&filter[text]=${encodeURIComponent(query)}`;
            } else {
                url += `&sort=${sortParam}`;
            }

            const res = await fetch(url);
            if (!res.ok) return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1 } };
            const json = await res.json();
            const mappings = json.included?.filter(x => x.type === 'mappings') || [];
            const media = (json.data || []).map(item => normalizeKitsuAnime(item, mappings)).filter(Boolean);
            const total = json.meta?.count || media.length;
            const lastPage = Math.ceil(total / limit) || 1;

            return {
                media,
                pageInfo: {
                    total,
                    currentPage: page,
                    lastPage,
                    hasNextPage: page < lastPage
                }
            };
        } catch (e) {
            console.error('Kitsu browse error:', e);
            return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1 } };
        }
    }

    async function fetchKitsuAnimeDetails(aniId, title) {
        try {
            let animeItem = null;
            let mappings = [];

            if (aniId) {
                const mRes = await fetch(`https://kitsu.io/api/edge/mappings?filter[externalSite]=anilist/anime&filter[externalId]=${aniId}`);
                if (mRes.ok) {
                    const mJson = await mRes.json();
                    const mapId = mJson?.data?.[0]?.id;
                    if (mapId) {
                        const itemRes = await fetch(`https://kitsu.io/api/edge/mappings/${mapId}/item`);
                        if (itemRes.ok) {
                            const itemJson = await itemRes.json();
                            const animeId = itemJson?.data?.id;
                            if (animeId) {
                                const aRes = await fetch(`https://kitsu.io/api/edge/anime/${animeId}?include=mappings`);
                                if (aRes.ok) {
                                    const aJson = await aRes.json();
                                    animeItem = aJson.data;
                                    mappings = aJson.included?.filter(x => x.type === 'mappings') || [];
                                }
                            }
                        }
                    }
                }
            }

            if (!animeItem && title) {
                const tRes = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(title)}&include=mappings&page[limit]=1`);
                if (tRes.ok) {
                    const tJson = await tRes.json();
                    animeItem = tJson.data?.[0];
                    mappings = tJson.included?.filter(x => x.type === 'mappings') || [];
                }
            }

            if (!animeItem) return null;
            return normalizeKitsuAnime(animeItem, mappings);
        } catch (e) {
            console.error('fetchKitsuAnimeDetails error:', e);
            return null;
        }
    }

    async function searchKitsu(q) {
        try {
            const res = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(q)}&page[limit]=6&include=mappings`);
            if (!res.ok) return [];
            const json = await res.json();
            const mappings = json.included?.filter(x => x.type === 'mappings') || [];
            return (json.data || []).map(item => normalizeKitsuAnime(item, mappings)).filter(Boolean);
        } catch (e) {
            return [];
        }
    }

    function getAnimeTitle(item) {
        if (!item) return 'Unknown Title';
        if (typeof item.title === 'string') return item.title;
        return item.title?.english || item.title?.romaji || item.title?.native || 'Untitled';
    }

    function getAnimeCover(item) {
        if (!item) return '';
        if (typeof item.coverImage === 'string') return item.coverImage;
        return item.coverImage?.extraLarge || item.coverImage?.large || item.coverImage?.medium || '';
    }

    // --- Routing System (URL Hash Support) ---

    function navigateTo(viewName, params = {}) {
        state.currentView = viewName;

        // Update nav tabs
        [dom.navHome, dom.navBrowse, dom.navWatch].forEach(btn => btn?.classList.remove('active'));
        [dom.viewHome, dom.viewBrowse, dom.viewWatch].forEach(v => v?.classList.remove('active'));

        if (viewName === 'home') {
            dom.navHome?.classList.add('active');
            dom.viewHome?.classList.add('active');
            window.location.hash = '#home';
            loadHomePage();
        } else if (viewName === 'browse') {
            dom.navBrowse?.classList.add('active');
            dom.viewBrowse?.classList.add('active');
            window.location.hash = '#browse';
            if (params.genre) state.browse.genre = params.genre;
            if (params.q) state.browse.query = params.q;
            loadBrowsePage();
        } else if (viewName === 'watch') {
            dom.navWatch?.classList.add('active');
            dom.viewWatch?.classList.add('active');
            if (params.title || params.id) {
                initWatchPage(params);
            }
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function parseHash() {
        const hash = window.location.hash.substring(1);
        if (!hash || hash === 'home') {
            navigateTo('home');
        } else if (hash === 'browse') {
            navigateTo('browse');
        } else if (hash.startsWith('watch')) {
            const queryPart = hash.includes('?') ? hash.split('?')[1] : '';
            const searchParams = new URLSearchParams(queryPart);
            navigateTo('watch', {
                id: searchParams.get('id'),
                title: searchParams.get('title'),
                ep: parseInt(searchParams.get('ep')) || 1
            });
        }
    }

    window.addEventListener('hashchange', parseHash);

    // --- HOME PAGE CONTROLLER (100% DIRECT ANILIST GRAPHQL) ---

    async function loadHomePage() {
        try {
            const homeQuery = `
            query {
              hero: Page(page: 1, perPage: 6) {
                media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
                  id idMal title { romaji english native } bannerImage coverImage { extraLarge large color }
                  description(asHtml: false) averageScore genres format episodes seasonYear status
                }
              }
              trending: Page(page: 1, perPage: 12) {
                media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
                  id idMal title { romaji english native } coverImage { extraLarge large medium color }
                  bannerImage averageScore format episodes genres seasonYear
                }
              }
              popular: Page(page: 1, perPage: 12) {
                media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
                  id idMal title { romaji english native } coverImage { extraLarge large medium color }
                  bannerImage averageScore format episodes genres seasonYear
                }
              }
              topRated: Page(page: 1, perPage: 12) {
                media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
                  id idMal title { romaji english native } coverImage { extraLarge large medium color }
                  bannerImage averageScore format episodes genres seasonYear
                }
              }
            }
            `;

            let data = null;
            try {
                data = await queryAniList(homeQuery);
            } catch (aniErr) {
                console.warn('AniList home query failed, seamlessly falling back to Kitsu:', aniErr.message);
                data = await fetchKitsuHomePage();
            }

            if (!data) throw new Error('Catalog service temporarily unavailable');

            // 1. Render Spotlight Hero
            if (data.hero?.media && data.hero.media.length > 0) {
                state.heroItems = data.hero.media;
                renderHeroCarousel();
            }

            // 2. Render Trending Now
            if (data.trending?.media) {
                renderAnimeGrid(dom.trendingGrid, data.trending.media, { showRank: true });
            }

            // 3. Render Popular This Season
            if (data.popular?.media) {
                renderAnimeGrid(dom.popularGrid, data.popular.media);
            }

            // 4. Render Top Rated Masterpieces
            if (data.topRated?.media) {
                renderAnimeGrid(dom.topRatedGrid, data.topRated.media);
            }
        } catch (err) {
            console.error('Home AniList load error:', err);
            showToast('Unable to load AniList metadata directly from browser.', 'warn');
        }
    }

    function renderHeroCarousel() {
        dom.heroCarousel.innerHTML = '';
        dom.heroIndicators.innerHTML = '';

        state.heroItems.forEach((item, idx) => {
            const title = getAnimeTitle(item);
            const banner = item.bannerImage || getAnimeCover(item);
            const score = item.averageScore ? (item.averageScore / 10).toFixed(1) : '8.5';
            const episodes = item.episodes ? `${item.episodes} Episodes` : (item.format || 'TV');
            const genres = (item.genres || []).slice(0, 4);
            const synopsis = item.description || 'No description available for this anime series.';

            const slide = document.createElement('div');
            slide.className = `hero-slide ${idx === 0 ? 'active' : ''}`;
            slide.dataset.index = idx;
            slide.innerHTML = `
                <img class="hero-backdrop" src="${banner}" alt="${title}">
                <div class="hero-gradient"></div>
                <div class="hero-content">
                    <div class="hero-badges">
                        <span class="badge badge-crimson">SPOTLIGHT #${idx + 1}</span>
                        <span class="badge badge-score">★ ${score}</span>
                        <span class="badge badge-format">${item.format || 'TV'}</span>
                        <span class="badge badge-status">${item.status || 'AIRING'}</span>
                    </div>
                    <h1 class="hero-title">${title}</h1>
                    <div class="hero-genres">
                        ${genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                    </div>
                    <p class="hero-synopsis">${synopsis}</p>
                    <div class="hero-actions">
                        <button class="btn-primary" onclick="window.ZokoApp.startWatching('${item.id}', '${encodeURIComponent(title)}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            Watch Episode 1
                        </button>
                        <button class="btn-secondary" onclick="window.ZokoApp.viewAnimeDetails('${item.id}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                            View Details
                        </button>
                    </div>
                </div>
            `;
            dom.heroCarousel.appendChild(slide);

            const dot = document.createElement('div');
            dot.className = `hero-dot ${idx === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => setHeroSlide(idx));
            dom.heroIndicators.appendChild(dot);
        });

        if (state.heroInterval) clearInterval(state.heroInterval);
        state.heroInterval = setInterval(() => {
            const next = (state.heroIndex + 1) % state.heroItems.length;
            setHeroSlide(next);
        }, 6000);
    }

    function setHeroSlide(idx) {
        state.heroIndex = idx;
        const slides = dom.heroCarousel.querySelectorAll('.hero-slide');
        const dots = dom.heroIndicators.querySelectorAll('.hero-dot');
        slides.forEach((s, i) => s.classList.toggle('active', i === idx));
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    }

    window.heroNav = function (dir) {
        if (!state.heroItems.length) return;
        let next = state.heroIndex + dir;
        if (next < 0) next = state.heroItems.length - 1;
        if (next >= state.heroItems.length) next = 0;
        setHeroSlide(next);
    };

    function renderAnimeGrid(container, items, options = {}) {
        container.innerHTML = '';
        items.forEach((item, idx) => {
            const title = getAnimeTitle(item);
            const cover = getAnimeCover(item);
            const score = item.averageScore ? (item.averageScore / 10).toFixed(1) : (item.rating || '8.2');
            const epBadge = item.episodes ? `${item.episodes} Ep` : (item.format || 'TV');
            const year = item.seasonYear || '';

            const card = document.createElement('div');
            card.className = 'anime-card';
            card.onclick = () => window.ZokoApp.startWatching(item.id, encodeURIComponent(title));

            card.innerHTML = `
                <div class="card-poster-wrap">
                    <img class="card-poster" src="${cover}" alt="${title}" loading="lazy" onerror="this.src='https://placehold.co/300x450/0e1219/94a3b8?text=Anime'">
                    ${options.showRank ? `<span class="card-rank-badge">#${idx + 1}</span>` : ''}
                    <div class="card-top-badges">
                        <span class="card-score">★ ${score}</span>
                        <span class="card-episodes">${epBadge}</span>
                    </div>
                    <div class="card-overlay">
                        <div class="card-play-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                        <span style="font-size: 0.8rem; font-weight: 700; color: #fff;">WATCH NOW</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-title" title="${title}">${title}</div>
                    <div class="card-footer-meta">
                        <span>${item.format || 'TV'}</span>
                        <span>${year}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // --- BROWSE PAGE CONTROLLER (100% DIRECT ANILIST GRAPHQL) ---

    async function loadBrowsePage() {
        try {
            dom.browseGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-muted);">
                    <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Loading Anime Catalog...</div>
                    <div style="font-size: 0.85rem;">Fetching real-time entries directly from AniList</div>
                </div>
            `;

            const browseQuery = `
            query ($page: Int, $perPage: Int, $search: String, $genre: [String], $format: MediaFormat, $sort: [MediaSort]) {
              Page(page: $page, perPage: $perPage) {
                pageInfo {
                  total
                  currentPage
                  lastPage
                  hasNextPage
                }
                media(search: $search, genre_in: $genre, format: $format, sort: $sort, type: ANIME, isAdult: false) {
                  id
                  idMal
                  title { romaji english native }
                  coverImage { extraLarge large medium color }
                  bannerImage
                  format
                  episodes
                  averageScore
                  genres
                  seasonYear
                  status
                }
              }
            }
            `;

            const variables = {
                page: state.browse.page,
                perPage: 24,
                sort: [state.browse.sort || 'TRENDING_DESC']
            };
            if (state.browse.query) variables.search = state.browse.query;
            if (state.browse.genre && state.browse.genre !== 'All') variables.genre = [state.browse.genre];
            if (state.browse.format && state.browse.format !== 'All') variables.format = state.browse.format;

            let media = [];
            let pageInfo = {};

            try {
                const data = await queryAniList(browseQuery, variables);
                media = data?.Page?.media || [];
                pageInfo = data?.Page?.pageInfo || {};
            } catch (aniErr) {
                console.warn('AniList browse query failed, falling back to Kitsu:', aniErr.message);
                const kData = await fetchKitsuBrowse({
                    page: state.browse.page,
                    query: state.browse.query,
                    sort: state.browse.sort
                });
                media = kData.media || [];
                pageInfo = kData.pageInfo || {};
            }

            state.browse.totalPages = pageInfo.lastPage || 1;

            dom.browseCount.innerText = pageInfo.total ? `${pageInfo.total.toLocaleString()} anime found` : `${media.length} results`;
            dom.pageInfo.innerText = `Page ${pageInfo.currentPage || 1} of ${pageInfo.lastPage || 1}`;
            dom.prevPageBtn.disabled = (pageInfo.currentPage || 1) <= 1;
            dom.nextPageBtn.disabled = !pageInfo.hasNextPage;

            if (media.length === 0) {
                dom.browseGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
                        <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">No Anime Found</div>
                        <div>Try adjusting your filters or search keywords.</div>
                    </div>
                `;
                return;
            }

            renderAnimeGrid(dom.browseGrid, media);
        } catch (err) {
            console.error('Browse load error:', err);
            dom.browseGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--accent-crimson);">Failed to load AniList results.</div>`;
        }
    }

    const GENRE_LIST = [
        'All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
        'Mystery', 'Romance', 'Sci-Fi', 'Supernatural', 'Slice of Life', 'Sports', 'Thriller'
    ];

    function initGenreChips() {
        dom.genreChips.innerHTML = '';
        GENRE_LIST.forEach(genre => {
            const chip = document.createElement('button');
            chip.className = `genre-chip ${state.browse.genre === genre ? 'active' : ''}`;
            chip.innerText = genre;
            chip.onclick = () => {
                state.browse.genre = genre;
                state.browse.page = 1;
                document.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                loadBrowsePage();
            };
            dom.genreChips.appendChild(chip);
        });
    }

    let browseSearchTimer = null;
    dom.browseSearch?.addEventListener('input', (e) => {
        clearTimeout(browseSearchTimer);
        browseSearchTimer = setTimeout(() => {
            state.browse.query = e.target.value.trim();
            state.browse.page = 1;
            loadBrowsePage();
        }, 350);
    });

    dom.formatSelect?.addEventListener('change', (e) => {
        state.browse.format = e.target.value;
        state.browse.page = 1;
        loadBrowsePage();
    });

    dom.sortSelect?.addEventListener('change', (e) => {
        state.browse.sort = e.target.value;
        state.browse.page = 1;
        loadBrowsePage();
    });

    dom.prevPageBtn?.addEventListener('click', () => {
        if (state.browse.page > 1) {
            state.browse.page--;
            loadBrowsePage();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    dom.nextPageBtn?.addEventListener('click', () => {
        state.browse.page++;
        loadBrowsePage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- WATCH PAGE CONTROLLER (ANILIST METADATA + BACKEND STREAMING) ---

    async function initWatchPage(params) {
        const incomingId = params.id ? String(params.id) : null;
        const incomingTitle = params.title ? decodeURIComponent(params.title) : '';
        const targetEp = parseInt(params.ep) || 1;

        const isSameAnime = state.watch.meta && (
            (incomingId && String(state.watch.anilistId) === incomingId) ||
            (incomingTitle && state.watch.title && state.watch.title.toLowerCase() === incomingTitle.toLowerCase())
        );

        if (isSameAnime && state.watch.episodes.length > 0) {
            if (state.watch.activeEpisodeIndex !== targetEp) {
                const epToPlay = state.watch.episodes.find(e => e.episode_number === targetEp) || state.watch.episodes[0];
                playEpisode(epToPlay);
            }
            return;
        }

        state.watch.anilistId = incomingId;
        state.watch.malId = null;
        state.watch.title = incomingTitle;
        state.watch.meta = null;
        state.watch.episodes = [];
        state.watch.activeEpisodeIndex = targetEp;
        state.watch.activeEpisodeData = null;
        state.watch.currentSegment = Math.floor((targetEp - 1) / 50);

        if (state.watch.playerInstance) {
            try { state.watch.playerInstance.destroy(); } catch { }
            state.watch.playerInstance = null;
        }

        dom.currentAnimeTitle.innerText = state.watch.title || 'Loading Anime...';
        dom.currentEpTitle.innerText = `Loading Episode ${targetEp}...`;
        dom.epCountPill.innerText = `Loading AniList...`;
        dom.epListContainer.innerHTML = `
            <div style="padding:2.5rem 1rem; text-align:center; color:var(--text-muted); font-size:0.84rem;">
                Fetching official anime metadata directly from AniList...
            </div>
        `;
        dom.artContainer.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-secondary);">
                <div style="color:var(--accent-crimson); font-weight:900; font-size:1.6rem; letter-spacing:2px; margin-bottom:8px;">ZOKO</div>
                <div style="font-size:0.86rem; color:var(--text-muted);">Connecting secure video stream pipe...</div>
            </div>
        `;

        // 1. STEP ONE: Fetch 100% pure metadata & episodes directly from AniList GraphQL
        let meta = null;
        try {
            const animeDetailsQuery = `
            query ($id: Int, $search: String) {
              Media(id: $id, search: $search, type: ANIME) {
                id
                idMal
                title { romaji english native }
                coverImage { extraLarge large color }
                bannerImage
                description(asHtml: false)
                episodes
                duration
                genres
                averageScore
                status
                seasonYear
                format
                relations {
                  edges {
                    relationType
                    node {
                      id
                      idMal
                      title { romaji english }
                      format
                      status
                      coverImage { medium }
                    }
                  }
                }
                recommendations(limit: 6, sort: RATING_DESC) {
                  nodes {
                    mediaRecommendation {
                      id
                      idMal
                      title { romaji english }
                      coverImage { large medium }
                      averageScore
                      format
                    }
                  }
                }
              }
            }
            `;
            const vars = state.watch.anilistId ? { id: parseInt(state.watch.anilistId) } : { search: state.watch.title };
            const data = await queryAniList(animeDetailsQuery, vars);
            meta = data?.Media;
        } catch (err) {
            console.warn('AniList meta fetch error, falling back to Kitsu:', err.message);
        }

        if (!meta) {
            meta = await fetchKitsuAnimeDetails(state.watch.anilistId, state.watch.title);
        }

        if (meta) {
            state.watch.meta = meta;
            state.watch.anilistId = String(meta.id);
            state.watch.malId = meta.idMal ? String(meta.idMal) : null;
            state.watch.title = getAnimeTitle(meta) || state.watch.title;
            dom.currentAnimeTitle.innerText = state.watch.title;
            renderWatchMetadata(meta);

            // Populate episodes from AniList total episodes
            state.watch.episodes = [];
            const epCount = meta.episodes || 1;
            dom.epCountPill.innerText = `${epCount} Episodes`;

            for (let i = 1; i <= epCount; i++) {
                state.watch.episodes.push({
                    episode_number: i,
                    title: `Episode ${i}`,
                    thumbnail: meta.bannerImage || getAnimeCover(meta)
                });
            }

            buildEpisodeRangeSelector();
        } else {
            dom.epCountPill.innerText = `0 Episodes`;
            dom.epListContainer.innerHTML = `
                <div style="padding:2.5rem 1rem; text-align:center; color:var(--accent-crimson); font-size:0.84rem;">
                    Failed to fetch anime catalog from AniList.
                </div>
            `;
        }

        // 2. STEP TWO: Play Target Episode via Backend Scraper
        const targetEpObj = state.watch.episodes.find(e => e.episode_number === targetEp) || state.watch.episodes[0] || {
            episode_number: targetEp,
            title: `Episode ${targetEp}`
        };

        playEpisode(targetEpObj);
    }

    function buildEpisodeRangeSelector() {
        const total = state.watch.episodes.length;
        const SEGMENT_SIZE = 50;
        dom.rangeSelector.innerHTML = '';

        if (total <= SEGMENT_SIZE) {
            dom.rangeSelector.style.display = 'none';
            renderEpisodeList();
            return;
        }

        dom.rangeSelector.style.display = 'flex';
        const numSegments = Math.ceil(total / SEGMENT_SIZE);

        for (let i = 0; i < numSegments; i++) {
            const start = i * SEGMENT_SIZE + 1;
            const end = Math.min((i + 1) * SEGMENT_SIZE, total);
            const btn = document.createElement('button');
            btn.className = `range-tab-btn ${i === state.watch.currentSegment ? 'active' : ''}`;
            btn.innerText = `${start}-${end}`;
            btn.onclick = () => {
                state.watch.currentSegment = i;
                document.querySelectorAll('.range-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderEpisodeList();
            };
            dom.rangeSelector.appendChild(btn);
        }

        renderEpisodeList();
    }

    function renderEpisodeList(filterQuery = '') {
        const SEGMENT_SIZE = 50;
        const total = state.watch.episodes.length;
        let episodesToRender = state.watch.episodes;

        if (filterQuery) {
            const qLower = filterQuery.toLowerCase();
            episodesToRender = state.watch.episodes.filter(e =>
                String(e.episode_number).includes(qLower) ||
                (e.title && e.title.toLowerCase().includes(qLower))
            );
        } else if (total > SEGMENT_SIZE) {
            const startIdx = state.watch.currentSegment * SEGMENT_SIZE;
            episodesToRender = state.watch.episodes.slice(startIdx, startIdx + SEGMENT_SIZE);
        }

        dom.epListContainer.innerHTML = '';
        episodesToRender.forEach(ep => {
            const isActive = state.watch.activeEpisodeData?.episode_number === ep.episode_number;
            const item = document.createElement('div');
            item.className = `ep-item ${isActive ? 'active' : ''}`;
            item.id = `ep-item-${ep.episode_number}`;
            item.onclick = () => playEpisode(ep);

            item.innerHTML = `
                <div class="ep-item-left">
                    <span class="ep-number">${ep.episode_number}</span>
                    <span class="ep-name" title="${ep.title || `Episode ${ep.episode_number}`}">${ep.title || `Episode ${ep.episode_number}`}</span>
                </div>
                <div class="ep-item-right">
                    <span style="font-size:0.65rem; background:#1c2433; padding:1px 4px; border-radius:2px; color:#93c5fd;">SUB</span>
                    <span style="font-size:0.65rem; background:#1c2433; padding:1px 4px; border-radius:2px; color:#fca5a5;">DUB</span>
                    <div class="playing-bars">
                        <div class="playing-bar"></div>
                        <div class="playing-bar"></div>
                        <div class="playing-bar"></div>
                    </div>
                </div>
            `;
            dom.epListContainer.appendChild(item);
        });
    }

    dom.epSearchInput?.addEventListener('input', (e) => {
        renderEpisodeList(e.target.value.trim());
    });

    function showUnmirroredNotice(epNum) {
        if (state.watch.playerInstance) {
            try { state.watch.playerInstance.destroy(); } catch { }
            state.watch.playerInstance = null;
        }
        dom.btnSub.style.display = 'none';
        dom.btnDub.style.display = 'none';
        if (dom.btnDownloadEp) dom.btnDownloadEp.style.display = 'none';

        const meta = state.watch.meta;
        const isNotYetReleased = meta?.status === 'NOT_YET_RELEASED';

        dom.artContainer.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-secondary); text-align:center; padding:2rem;">
                <div style="font-size:2.2rem; margin-bottom:10px;">${isNotYetReleased ? '⏳' : '🎞️'}</div>
                <div style="font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:6px;">${isNotYetReleased ? 'Upcoming / Not Yet Aired' : `Episode ${epNum} Stream Unmirrored`}</div>
                <div style="font-size:0.84rem; max-width:460px; line-height:1.5; color:var(--text-muted); margin-bottom:18px;">
                    This episode could not be resolved from the upstream video mirror.
                </div>
                <button class="btn-secondary" onclick="window.ZokoApp.navigateTo('browse')">Browse Other Anime</button>
            </div>
        `;
    }

    // Play Episode: Sends Request to Backend Scraper API ONLY FOR STREAMING!
    async function playEpisode(ep) {
        if (!ep) return;
        state.watch.activeEpisodeData = ep;
        state.watch.activeEpisodeIndex = ep.episode_number;

        dom.currentEpTitle.innerText = `Episode ${ep.episode_number}: ${ep.title || ''}`;

        const newHash = `#watch?id=${state.watch.anilistId || ''}&title=${encodeURIComponent(state.watch.title)}&ep=${ep.episode_number}`;
        if (window.location.hash !== newHash) {
            history.replaceState(null, '', newHash);
        }

        const currentIndex = state.watch.episodes.findIndex(e => e.episode_number === ep.episode_number);
        dom.btnPrevEp.disabled = currentIndex <= 0;
        dom.btnNextEp.disabled = currentIndex < 0 || currentIndex >= state.watch.episodes.length - 1;

        document.querySelectorAll('.ep-item').forEach(el => el.classList.remove('active'));
        const activeElem = document.getElementById(`ep-item-${ep.episode_number}`);
        if (activeElem) {
            activeElem.classList.add('active');
            activeElem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }

        dom.artContainer.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-secondary);">
                <div style="color:var(--accent-crimson); font-weight:900; font-size:1.6rem; letter-spacing:2px; margin-bottom:8px;">ZOKO</div>
                <div style="font-size:0.86rem; color:var(--text-muted);">Resolving video stream for Episode ${ep.episode_number}...</div>
            </div>
        `;

        try {
            // CALL BACKEND SCRAPER API (ONLY FOR STREAMING)
            const malIdParam = state.watch.malId ? `&malId=${state.watch.malId}` : '';
            const titleParam = state.watch.title ? `&title=${encodeURIComponent(state.watch.title)}` : '';
            const streamUrl = `/api/stream?id=${state.watch.anilistId || ''}${malIdParam}${titleParam}&ep=${ep.episode_number}&track=${state.watch.audioMode}`;
            const streamData = await fetchJson(streamUrl);
            state.watch.streamData = streamData;

            if (!streamData.stream_url) {
                showToast(`Episode ${ep.episode_number} has no available stream.`, 'warn');
                showUnmirroredNotice(ep.episode_number);
                return;
            }

            dom.btnSub.style.display = 'inline-block';
            dom.btnDub.style.display = 'inline-block';
            dom.btnSub.classList.toggle('active', state.watch.audioMode === 'sub');
            dom.btnDub.classList.toggle('active', state.watch.audioMode === 'dub');

            if (dom.btnDownloadEp) {
                const dlUrl = streamData.download_url || `/api/download/${state.watch.malId || state.watch.anilistId}/${ep.episode_number}?track=${state.watch.audioMode}`;
                dom.btnDownloadEp.href = dlUrl;
                dom.btnDownloadEp.style.display = 'inline-flex';
            }

            mountArtPlayer({
                proxy_m3u8_url: streamData.stream_url,
                tracks: streamData.subtitles || [],
                jump: streamData.skip || {}
            }, streamData);

        } catch (err) {
            console.error('Stream load error:', err);
            showToast(`Failed to load video stream: ${err.message}`, 'warn');
            showUnmirroredNotice(ep.episode_number);
        }
    }

    dom.btnPrevEp?.addEventListener('click', () => {
        const curIdx = state.watch.episodes.findIndex(e => e.episode_number === state.watch.activeEpisodeData?.episode_number);
        if (curIdx > 0) playEpisode(state.watch.episodes[curIdx - 1]);
    });

    dom.btnNextEp?.addEventListener('click', () => {
        const curIdx = state.watch.episodes.findIndex(e => e.episode_number === state.watch.activeEpisodeData?.episode_number);
        if (curIdx >= 0 && curIdx < state.watch.episodes.length - 1) {
            playEpisode(state.watch.episodes[curIdx + 1]);
        }
    });

    dom.btnSub?.addEventListener('click', () => {
        state.watch.audioMode = 'sub';
        if (state.watch.activeEpisodeData) playEpisode(state.watch.activeEpisodeData);
    });

    dom.btnDub?.addEventListener('click', () => {
        state.watch.audioMode = 'dub';
        if (state.watch.activeEpisodeData) playEpisode(state.watch.activeEpisodeData);
    });

    dom.skipToggle?.addEventListener('click', () => {
        state.watch.autoSkip = !state.watch.autoSkip;
        dom.skipToggle.classList.toggle('active', state.watch.autoSkip);
        showToast(`Auto Skip Intro/Outro: ${state.watch.autoSkip ? 'ENABLED' : 'DISABLED'}`, 'info');
    });

    // --- ARTPLAYER V5 ENGINE & HLS.JS INTEGRATION ---

    function mountArtPlayer(source, streamData) {
        if (!source || !source.proxy_m3u8_url) return;

        const container = dom.artContainer;
        if (state.watch.playerInstance) {
            try { state.watch.playerInstance.destroy(); } catch { }
            state.watch.playerInstance = null;
        }

        container.innerHTML = '';

        const jump = source.jump || {};
        const intro = jump.intro || null;
        const outro = jump.outro || null;

        const tracks = source.tracks || streamData?.subtitles || [];
        const defaultSub = tracks.find(t => t.default) || tracks[0];
        const subtitleOption = defaultSub ? {
            url: resolveApiUrl(defaultSub.proxied_src || defaultSub.src),
            type: 'vtt',
            style: { color: '#ffffff', fontSize: '20px' }
        } : {};

        const settings = [];
        if (tracks.length > 0) {
            settings.push({
                width: 200,
                html: 'Subtitles',
                tooltip: defaultSub?.label || 'English',
                selector: [
                    { html: 'Off', value: '' },
                    ...tracks.map(t => ({
                        html: t.label || t.lang || 'Sub',
                        value: resolveApiUrl(t.proxied_src || t.src),
                        default: !!t.default
                    }))
                ],
                onSelect: function (item) {
                    if (item.value) {
                        art.subtitle.switch(item.value, { name: item.html });
                        art.subtitle.show = true;
                    } else {
                        art.subtitle.show = false;
                    }
                    return item.html;
                }
            });
        }

        const art = new Artplayer({
            container: container,
            url: resolveApiUrl(source.proxy_m3u8_url),
            type: 'm3u8',
            customType: {
                m3u8: function (video, url, artInstance) {
                    if (window.Hls && Hls.isSupported()) {
                        if (artInstance.hls) artInstance.hls.destroy();
                        const hls = new Hls({
                            maxBufferLength: 30,
                            maxMaxBufferLength: 60,
                            enableWorker: true
                        });
                        hls.loadSource(url);
                        hls.attachMedia(video);
                        artInstance.hls = hls;
                        artInstance.on('destroy', () => hls.destroy());
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    }
                }
            },
            theme: '#e50914',
            autoplay: true,
            playbackRate: true,
            aspectRatio: true,
            fullscreen: true,
            fullscreenWeb: true,
            pip: true,
            autoOrientation: true,
            subtitle: subtitleOption,
            settings: settings,
            controls: [
                {
                    name: 'download',
                    position: 'right',
                    html: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-top:7px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
                    tooltip: 'Download Episode (Pahe / NekoStream)',
                    click: function () {
                        const dlUrl = state.watch.streamData?.download_url || `/api/download/${state.watch.malId || state.watch.anilistId}/${state.watch.activeEpisodeIndex}?track=${state.watch.audioMode}`;
                        window.open(dlUrl, '_blank');
                    }
                }
            ]
        });

        // Intro / Outro Skip Markers
        art.on('video:timeupdate', () => {
            if (!state.watch.autoSkip) return;
            const cur = art.currentTime;

            if (intro && intro.end > 0 && cur >= intro.start && cur < intro.end) {
                if (!document.getElementById('art-skip-intro-btn')) {
                    const btn = document.createElement('button');
                    btn.id = 'art-skip-intro-btn';
                    btn.className = 'art-skip-pill';
                    btn.innerHTML = `<span>Skip Intro</span> <span style="opacity:0.7;">⇥</span>`;
                    btn.onclick = () => {
                        art.seek = intro.end;
                        btn.remove();
                        showToast('Skipped Opening Theme', 'info');
                    };
                    art.template.$container.appendChild(btn);
                }
            } else {
                const introBtn = document.getElementById('art-skip-intro-btn');
                if (introBtn) introBtn.remove();
            }

            if (outro && outro.end > 0 && cur >= outro.start && cur < outro.end) {
                if (!document.getElementById('art-skip-outro-btn')) {
                    const btn = document.createElement('button');
                    btn.id = 'art-skip-outro-btn';
                    btn.className = 'art-skip-pill';
                    btn.innerHTML = `<span>Skip Outro</span> <span style="opacity:0.7;">⇥</span>`;
                    btn.onclick = () => {
                        art.seek = outro.end;
                        btn.remove();
                        showToast('Skipped Ending Theme', 'info');
                    };
                    art.template.$container.appendChild(btn);
                }
            } else {
                const outroBtn = document.getElementById('art-skip-outro-btn');
                if (outroBtn) outroBtn.remove();
            }
        });

        art.on('video:ended', () => {
            showToast('Episode finished. Playing next episode...', 'info');
            const curIdx = state.watch.episodes.findIndex(e => e.episode_number === state.watch.activeEpisodeData?.episode_number);
            if (curIdx >= 0 && curIdx < state.watch.episodes.length - 1) {
                playEpisode(state.watch.episodes[curIdx + 1]);
            }
        });

        state.watch.playerInstance = art;
    }

    // --- WATCH METADATA, RELATIONS & RECOMMENDATIONS ---

    function renderWatchMetadata(meta) {
        if (!meta) return;
        const title = getAnimeTitle(meta);
        const cover = getAnimeCover(meta);
        const score = meta.averageScore ? (meta.averageScore / 10).toFixed(1) : '8.5';
        const format = meta.format || 'TV';
        const year = meta.seasonYear || '';

        dom.watchPoster.src = cover;
        dom.watchTitle.innerText = title;
        dom.watchSynopsis.innerHTML = meta.description || 'No synopsis provided.';

        dom.watchMetaRow.innerHTML = `
            <span class="badge badge-score">★ ${score}</span>
            <span class="badge badge-format">${format}</span>
            <span class="badge badge-status">${meta.status || 'FINISHED'}</span>
            <span style="font-size:0.8rem; color:var(--text-muted);">${year}</span>
        `;

        if (meta.relations?.edges && meta.relations.edges.length > 0) {
            dom.relationsSection.style.display = 'block';
            dom.relationsChips.innerHTML = '';
            meta.relations.edges.slice(0, 8).forEach(edge => {
                const rel = edge.node;
                const relTitle = getAnimeTitle(rel);
                const chip = document.createElement('button');
                chip.className = 'relation-chip';
                chip.innerHTML = `
                    <span class="relation-type-tag">${edge.relationType || 'RELATED'}</span>
                    <span>${relTitle}</span>
                `;
                chip.onclick = () => window.ZokoApp.startWatching(rel.id, encodeURIComponent(relTitle));
                dom.relationsChips.appendChild(chip);
            });
        } else {
            dom.relationsSection.style.display = 'none';
        }

        if (meta.recommendations?.nodes && meta.recommendations.nodes.length > 0) {
            dom.recommendationsSection.style.display = 'block';
            const recList = meta.recommendations.nodes.map(n => n.mediaRecommendation).filter(Boolean);
            renderAnimeGrid(dom.recommendationsGrid, recList);
        } else {
            dom.recommendationsSection.style.display = 'none';
        }
    }

    // --- GLOBAL SEARCH (DIRECT ANILIST GRAPHQL AUTOCOMPLETE) ---

    let searchDebounceTimer = null;
    dom.globalSearch?.addEventListener('input', (e) => {
        const q = e.target.value.trim();
        clearTimeout(searchDebounceTimer);
        if (q.length < 2) {
            dom.searchDropdown.classList.remove('open');
            dom.searchDropdown.innerHTML = '';
            return;
        }

        searchDebounceTimer = setTimeout(async () => {
            try {
                let results = [];
                try {
                    const searchQuery = `
                    query ($search: String) {
                      Page(page: 1, perPage: 6) {
                        media(search: $search, type: ANIME, isAdult: false) {
                          id idMal title { romaji english native } coverImage { medium large }
                          format seasonYear averageScore
                        }
                      }
                    }
                    `;
                    const data = await queryAniList(searchQuery, { search: q });
                    results = data?.Page?.media || [];
                } catch (aniErr) {
                    results = await searchKitsu(q);
                }

                if (results.length === 0) {
                    dom.searchDropdown.innerHTML = `<div style="padding:12px; font-size:0.82rem; color:var(--text-muted); text-align:center;">No anime found matching "${q}"</div>`;
                } else {
                    dom.searchDropdown.innerHTML = '';
                    results.forEach(item => {
                        const title = getAnimeTitle(item);
                        const cover = getAnimeCover(item);
                        const score = item.averageScore ? (item.averageScore / 10).toFixed(1) : '';
                        const el = document.createElement('div');
                        el.className = 'search-item';
                        el.innerHTML = `
                            <img class="search-thumb" src="${cover}" alt="${title}" onerror="this.src='https://placehold.co/40x50/141a24/94a3b8?text='">
                            <div class="search-info">
                                <div class="search-title">${title}</div>
                                <div class="search-meta">
                                    <span>${item.format || 'TV'}</span>
                                    <span>${item.seasonYear || ''}</span>
                                    ${score ? `<span style="color:#fbbf24;">★ ${score}</span>` : ''}
                                </div>
                            </div>
                        `;
                        el.onclick = () => {
                            dom.searchDropdown.classList.remove('open');
                            dom.globalSearch.value = '';
                            window.ZokoApp.startWatching(item.id, encodeURIComponent(title));
                        };
                        dom.searchDropdown.appendChild(el);
                    });
                }
                dom.searchDropdown.classList.add('open');
            } catch (err) {
                console.warn('Search autocomplete error:', err);
            }
        }, 250);
    });

    document.addEventListener('click', (e) => {
        if (!dom.globalSearch.contains(e.target) && !dom.searchDropdown.contains(e.target)) {
            dom.searchDropdown.classList.remove('open');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== dom.globalSearch && document.activeElement !== dom.browseSearch) {
            e.preventDefault();
            dom.globalSearch.focus();
        }
    });

    // --- PUBLIC EXPORTS (FOR INLINE ACTIONS) ---

    window.ZokoApp = {
        navigateTo,
        startWatching: (id, encodedTitle) => {
            navigateTo('watch', { id, title: encodedTitle });
        },
        viewAnimeDetails: (id) => {
            const item = state.heroItems.find(h => String(h.id) === String(id));
            const title = item ? getAnimeTitle(item) : 'Anime';
            window.ZokoApp.startWatching(id, encodeURIComponent(title));
        }
    };

    // --- APP INITIALIZATION ---

    function init() {
        initGenreChips();

        dom.navHome?.addEventListener('click', () => navigateTo('home'));
        dom.navBrowse?.addEventListener('click', () => navigateTo('browse'));
        dom.navWatch?.addEventListener('click', () => {
            if (state.watch.title) navigateTo('watch');
            else navigateTo('browse');
        });

        parseHash();
    }

    document.addEventListener('DOMContentLoaded', init);

})();
