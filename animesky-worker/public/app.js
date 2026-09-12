/**
 * AnimeHub Unified Frontend Engine
 */

let art = null;
let currentHls = null;
let currentStreamData = null;
let currentSeriesEpisodes = [];
let allPresets = [];

// DOM Elements
const urlInput = document.getElementById('urlInput');
const clearBtn = document.getElementById('clearBtn');
const presetsContainer = document.getElementById('presetsContainer');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingMessage = document.getElementById('loadingMessage');
const currentEpisodeTitle = document.getElementById('currentEpisodeTitle');
const providerTag = document.getElementById('providerTag');
const qualityTag = document.getElementById('qualityTag');
const qualityPillsContainer = document.getElementById('qualityPillsContainer');
const audioPillsContainer = document.getElementById('audioPillsContainer');
const subtitlePillsContainer = document.getElementById('subtitlePillsContainer');
const serverPillsContainer = document.getElementById('serverPillsContainer');
const seriesName = document.getElementById('seriesName');
const episodeCountBadge = document.getElementById('episodeCountBadge');
const episodesGrid = document.getElementById('episodesGrid');
const toast = document.getElementById('toast');

// Search Elements
const searchWrapper = document.querySelector('.search-wrapper');
const searchSpinner = document.getElementById('searchSpinner');
const searchDropdown = document.getElementById('searchDropdown');
const dropdownHeaderTitle = document.getElementById('dropdownHeaderTitle');
const dropdownContent = document.getElementById('dropdownContent');
const dropdownFooter = document.getElementById('dropdownFooter');
const searchResultsSection = document.getElementById('searchResultsSection');
const searchResultsHeading = document.getElementById('searchResultsHeading');
const searchResultsSubtext = document.getElementById('searchResultsSubtext');
const searchResultsGrid = document.getElementById('searchResultsGrid');

// Popular Anime Searches
const POPULAR_SEARCHES = [
  { title: 'Solo Leveling', tag: '👑 Solo Leveling' },
  { title: 'Demon Slayer', tag: '🗡️ Demon Slayer' },
  { title: 'Naruto Shippuden', tag: '⚡ Naruto Shippuden' },
  { title: 'Jujutsu Kaisen', tag: '🔮 Jujutsu Kaisen' },
  { title: 'One Piece', tag: '🏴‍☠️ One Piece' },
  { title: 'Bleach', tag: '⚔️ Bleach' },
  { title: 'Naruto', tag: '🌀 Naruto (Original)' },
  { title: 'Attack on Titan', tag: '🛡️ Attack on Titan' },
  { title: 'Chainsaw Man', tag: '🪚 Chainsaw Man' }
];

let searchDebounceTimer = null;
let currentSearchResults = [];
let selectedSuggestIndex = -1;

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  loadPresets();

  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    urlInput.focus();
    showTrendingDropdown();
  });

  // Search input events
  urlInput.addEventListener('focus', () => {
    const val = urlInput.value.trim();
    if (!val || (!val.startsWith('http://') && !val.startsWith('https://'))) {
      if (!val) {
        showTrendingDropdown();
      } else {
        fetchLiveSuggestions(val);
      }
    }
  });

  urlInput.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    const query = urlInput.value.trim();

    if (!query) {
      showTrendingDropdown();
      return;
    }

    if (query.startsWith('http://') || query.startsWith('https://')) {
      hideSearchDropdown();
      return;
    }

    if (searchSpinner) searchSpinner.style.display = 'block';
    searchDebounceTimer = setTimeout(() => {
      fetchLiveSuggestions(query);
    }, 260);
  });

  // Keyboard navigation inside search input
  urlInput.addEventListener('keydown', (e) => {
    const items = dropdownContent ? dropdownContent.querySelectorAll('.search-suggest-item') : [];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length > 0) {
        selectedSuggestIndex = (selectedSuggestIndex + 1) % items.length;
        updateSelectedSuggestion(items);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length > 0) {
        selectedSuggestIndex = (selectedSuggestIndex - 1 + items.length) % items.length;
        updateSelectedSuggestion(items);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestIndex >= 0 && items[selectedSuggestIndex]) {
        items[selectedSuggestIndex].click();
      } else {
        handleLoad();
      }
    } else if (e.key === 'Escape') {
      hideSearchDropdown();
    }
  });

  // Close search dropdown on click outside
  document.addEventListener('click', (e) => {
    if (searchWrapper && !searchWrapper.contains(e.target)) {
      hideSearchDropdown();
    }
  });

  // Global hotkey '/' to focus search
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== urlInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      urlInput.focus();
      urlInput.select();
      showTrendingDropdown();
    }
  });

  // Auto load initial URL if provided
  if (urlInput.value.trim()) {
    handleLoad();
  }
});

// Update keyboard selected suggestion item
function updateSelectedSuggestion(items) {
  items.forEach((item, idx) => {
    item.classList.toggle('selected', idx === selectedSuggestIndex);
    if (idx === selectedSuggestIndex) {
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

// Show Trending Searches in Dropdown
function showTrendingDropdown() {
  if (!searchDropdown || !dropdownContent) return;
  dropdownHeaderTitle.textContent = '🔥 Popular & Trending Searches';
  selectedSuggestIndex = -1;

  let html = '<div class="trending-tags-grid">';
  POPULAR_SEARCHES.forEach(item => {
    html += `<button type="button" class="trending-tag-pill" data-title="${item.title}">${item.tag}</button>`;
  });
  html += '</div>';

  dropdownContent.innerHTML = html;
  dropdownContent.querySelectorAll('.trending-tag-pill').forEach(btn => {
    btn.onclick = () => {
      urlInput.value = btn.dataset.title;
      hideSearchDropdown();
      handleLoad();
    };
  });

  if (dropdownFooter) dropdownFooter.style.display = 'none';
  searchDropdown.style.display = 'block';
}

// Live Search Autocomplete via API
async function fetchLiveSuggestions(query) {
  if (!searchDropdown || !dropdownContent) return;
  selectedSuggestIndex = -1;

  try {
    const res = await fetch('/api/search?q=' + encodeURIComponent(query));
    const data = await res.json();
    if (searchSpinner) searchSpinner.style.display = 'none';

    if (!data.success || !data.results || data.results.length === 0) {
      dropdownHeaderTitle.textContent = 'No Matches Found';
      dropdownContent.innerHTML = `
        <div style="padding: 12px; color: var(--text-dim); text-align: center; font-size: 0.85rem;">
          No anime found for "<strong>${escapeHtml(query)}</strong>".<br>
          Try searching:
          <div class="trending-tags-grid" style="justify-content: center; margin-top: 8px;">
            <button type="button" class="trending-tag-pill" onclick="quickSearch('Solo Leveling')">Solo Leveling</button>
            <button type="button" class="trending-tag-pill" onclick="quickSearch('Demon Slayer')">Demon Slayer</button>
            <button type="button" class="trending-tag-pill" onclick="quickSearch('Naruto')">Naruto</button>
          </div>
        </div>
      `;
      if (dropdownFooter) dropdownFooter.style.display = 'none';
      searchDropdown.style.display = 'block';
      return;
    }

    currentSearchResults = data.results;
    dropdownHeaderTitle.textContent = `⚡ Top Matches (${data.results.length}) • Kitsu / MAL`;

    const topMatches = data.results.slice(0, 6);
    dropdownContent.innerHTML = '';

    topMatches.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'search-suggest-item';
      row.dataset.query = item.streamQuery || item.title;
      row.dataset.idx = idx;

      const posterUrl = item.poster || 'https://via.placeholder.com/44x60/0f172a/38bdf8?text=Anime';
      const scoreBadge = item.rating ? `<span style="color: #f59e0b; font-weight: 700;">⭐ ${item.rating}</span>` : '';
      const metaParts = [
        scoreBadge,
        item.format || 'TV',
        item.year || '',
        item.episodes ? `${item.episodes} Eps` : ''
      ].filter(Boolean).join(' • ');

      row.innerHTML = `
        <img class="suggest-poster" src="${posterUrl}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/44x60/0f172a/38bdf8?text=Anime'" />
        <div class="suggest-info">
          <span class="suggest-title">${highlightMatch(item.title, query)}</span>
          <span class="suggest-meta">${metaParts || 'Anime Series'}</span>
          ${item.genres && item.genres.length > 0 ? `<span style="font-size: 0.7rem; color: var(--text-dim);">${item.genres.slice(0, 3).join(', ')}</span>` : ''}
        </div>
        <span class="suggest-action">Stream ▶</span>
      `;

      row.onclick = () => {
        const target = item.streamQuery || item.title || item.seriesUrl;
        const targetSeason = item.targetSeason || 1;
        urlInput.value = target;
        hideSearchDropdown();
        closeSearchResults();
        loadSeries(target, { targetSeason, cardMeta: item });
      };

      dropdownContent.appendChild(row);
    });

    if (dropdownFooter) {
      dropdownFooter.style.display = 'flex';
      dropdownFooter.querySelector('span').textContent = `🔍 View all ${data.results.length} titles in Grid View`;
    }

    searchDropdown.style.display = 'block';
  } catch (e) {
    if (searchSpinner) searchSpinner.style.display = 'none';
    console.warn('Search suggestion error:', e);
  }
}

function hideSearchDropdown() {
  if (searchDropdown) searchDropdown.style.display = 'none';
  if (searchSpinner) searchSpinner.style.display = 'none';
  selectedSuggestIndex = -1;
}

function quickSearch(title) {
  urlInput.value = title;
  hideSearchDropdown();
  handleLoad();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escapeHtml(text).replace(regex, '<span style="color: var(--primary-cyan); text-decoration: underline;">$1</span>');
}

// Trigger Full Grid View from Dropdown Footer
function triggerFullSearch() {
  hideSearchDropdown();
  const query = urlInput.value.trim();
  if (currentSearchResults.length > 0) {
    displaySearchResults(currentSearchResults, query);
  } else {
    handleLoad();
  }
}

// Helper to detect season from query or text
function detectSeasonFromText(text) {
  if (!text) return 1;
  const t = text.toLowerCase();
  const sMatch = t.match(/\b(?:season|s)\s*0*(\d+)\b/i);
  if (sMatch) return parseInt(sMatch[1], 10);
  const ordMatch = t.match(/\b(\d+)(?:st|nd|rd|th)\s+season\b/i);
  if (ordMatch) return parseInt(ordMatch[1], 10);
  if (/\b(?:season\s+)?iv\b/i.test(t)) return 4;
  if (/\b(?:season\s+)?iii\b/i.test(t)) return 3;
  if (/\b(?:season\s+)?ii\b/i.test(t)) return 2;
  return 1;
}

// Display Full Search Results Grid Section
function displaySearchResults(results, query) {
  if (!searchResultsSection || !searchResultsGrid) return;

  searchResultsHeading.textContent = `🔍 Search Results for "${query}"`;
  searchResultsSubtext.textContent = `Found ${results.length} series • Powered by Kitsu, AniList & AnimeSky`;
  searchResultsGrid.innerHTML = '';

  results.forEach(r => {
    const card = document.createElement('div');
    card.className = 'search-result-card';
    const posterUrl = r.poster || 'https://via.placeholder.com/200x300/0f172a/38bdf8?text=Anime';
    const target = r.streamQuery || r.title || r.seriesUrl;

    card.innerHTML = `
      <div class="result-poster-box">
        <img class="result-poster" src="${posterUrl}" alt="${escapeHtml(r.title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300/0f172a/38bdf8?text=Anime'" />
        ${r.rating ? `<span style="position: absolute; top: 6px; left: 6px; background: rgba(3,7,18,0.85); color: #f59e0b; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 800; border: 1px solid rgba(245,158,11,0.3);">⭐ ${r.rating}</span>` : ''}
        ${r.targetSeason > 1 ? `<span style="position: absolute; bottom: 6px; left: 6px; background: rgba(56,189,248,0.95); color: #020617; padding: 2px 7px; border-radius: 4px; font-size: 0.68rem; font-weight: 800; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">SEASON ${r.targetSeason}</span>` : ''}
        ${r.format ? `<span style="position: absolute; bottom: 6px; right: 6px; background: rgba(3,7,18,0.85); color: var(--text-muted); padding: 2px 6px; border-radius: 4px; font-size: 0.68rem; font-weight: 700;">${r.format}</span>` : ''}
        <div class="result-play-overlay">
          <div class="play-circle">▶</div>
        </div>
      </div>
      <div class="result-info">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="result-platform">${r.year || 'Anime'}</span>
          ${r.status ? `<span style="font-size: 0.68rem; color: #10b981; font-weight: 700;">${r.status}</span>` : ''}
        </div>
        <h4 class="result-title" title="${escapeHtml(r.title)}">${escapeHtml(r.title)}</h4>
        ${r.romajiTitle && r.romajiTitle !== r.title ? `<span style="font-size: 0.74rem; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(r.romajiTitle)}</span>` : ''}
        ${r.genres && r.genres.length > 0 ? `<div style="display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap;">${r.genres.slice(0, 2).map(g => `<span class="genre-pill" style="font-size: 0.68rem; padding: 1px 6px;">${g}</span>`).join('')}</div>` : ''}
      </div>
    `;

    card.onclick = () => {
      urlInput.value = target;
      closeSearchResults();
      loadSeries(target, { targetSeason: r.targetSeason || 1, cardMeta: r });
      const playerEl = document.getElementById('playerSection');
      if (playerEl) playerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    searchResultsGrid.appendChild(card);
  });

  searchResultsSection.style.display = 'block';
  searchResultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeSearchResults() {
  if (searchResultsSection) searchResultsSection.style.display = 'none';
}

// Load Presets
async function loadPresets() {
  try {
    const res = await fetch('/api/presets');
    allPresets = await res.json();
    renderPresets(allPresets);
  } catch (e) {
    console.error('Could not load presets:', e);
  }
}

function renderPresets(presets) {
  presetsContainer.innerHTML = '';
  presets.forEach(p => {
    const card = document.createElement('div');
    card.className = 'preset-card';
    card.dataset.category = p.category || 'all';

    card.innerHTML = `
      <img class="preset-poster" src="${p.poster}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/55x75/0f172a/38bdf8?text=Anime'">
      <div class="preset-details">
        <span class="preset-platform" style="color: #38bdf8">⚡ AnimeSky</span>
        <span class="preset-title">${p.title}</span>
        <span class="preset-badge">${p.badge}</span>
      </div>
    `;
    card.onclick = () => {
      closeSearchResults();
      urlInput.value = p.seriesUrl;
      handleLoad();
    };
    presetsContainer.appendChild(card);
  });
}

function filterPresets(filter) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  if (filter === 'all') {
    renderPresets(allPresets);
  } else {
    renderPresets(allPresets.filter(p => p.category === filter));
  }
}

// Show/Hide Loading
function setLoading(show, msg = 'Resolving stream & decrypting HLS...') {
  loadingOverlay.style.display = show ? 'flex' : 'none';
  loadingMessage.textContent = msg;
}

// Main Load Handler
async function handleLoad() {
  hideSearchDropdown();
  const inputUrl = urlInput.value.trim();
  if (!inputUrl) return;

  const isSeriesUrl = inputUrl.includes('/series/') || inputUrl.includes('/anime/');
  const isDirectEpisode = inputUrl.includes('/episode/');

  if (isSeriesUrl) {
    closeSearchResults();
    await loadSeries(inputUrl);
  } else if (isDirectEpisode) {
    closeSearchResults();
    await loadEpisodeDirect(inputUrl);
  } else {
    // Professional Search Query
    await executeAnimeSearch(inputUrl);
  }
}

async function executeAnimeSearch(query) {
  setLoading(true, `Searching AnimeSky for "${query}"...`);
  try {
    const res = await fetch('/api/search?q=' + encodeURIComponent(query));
    const data = await res.json();
    setLoading(false);

    if (!data.success || !data.results || data.results.length === 0) {
      showToast(`No anime found matching "${query}" on AnimeSky`, 4000);
      return;
    }

    const querySeason = detectSeasonFromText(query);
    const bestMatch = (querySeason > 1 ? data.results.find(r => r.targetSeason === querySeason) : null) || data.results[0];
    const target = bestMatch.streamQuery || bestMatch.title || bestMatch.seriesUrl;
    const targetSeason = bestMatch.targetSeason || (querySeason > 1 ? querySeason : 1);

    if (data.results.length === 1) {
      closeSearchResults();
      showToast(`⚡ Found: ${bestMatch.title}`);
      urlInput.value = target;
      await loadSeries(target, { targetSeason, cardMeta: bestMatch });
    } else {
      // Multiple matches: show grid and load best match
      displaySearchResults(data.results, query);
      urlInput.value = target;
      await loadSeries(target, { targetSeason, cardMeta: bestMatch });
      showToast(`⚡ Found ${data.results.length} titles for "${query}"`);
    }
  } catch (err) {
    setLoading(false);
    showToast(`Search: ${err.message}`, 4000);
  }
}

let currentSeriesData = null;
let currentActiveEpisodeUrl = '';
let currentSeason = 1;
let episodeViewMode = 'rich'; // 'rich' or 'compact'

// View mode switcher
function setEpisodeViewMode(mode) {
  episodeViewMode = mode;
  const richBtn = document.getElementById('richViewBtn');
  const compactBtn = document.getElementById('compactViewBtn');
  if (richBtn) richBtn.classList.toggle('active', mode === 'rich');
  if (compactBtn) compactBtn.classList.toggle('active', mode === 'compact');
  episodesGrid.className = `episodes-grid ${mode}-grid`;
  renderEpisodeGrid(currentSeriesEpisodes, currentActiveEpisodeUrl);
}

// Render Hero Showcase Card with AniList, MAL, Kitsu & AniZip Data
function renderHeroShowcase(data) {
  const heroCard = document.getElementById('animeHeroCard');
  if (!heroCard) return;

  const meta = data.meta || {};
  const bannerImg = data.banner || meta.banner || meta.fanart || meta.poster || data.poster;
  const posterImg = meta.poster || data.poster;

  // Backdrop
  const heroBackdrop = document.getElementById('heroBackdrop');
  if (heroBackdrop && bannerImg) {
    heroBackdrop.style.backgroundImage = `url('${bannerImg}')`;
  }

  // Poster
  const heroPoster = document.getElementById('heroPoster');
  if (heroPoster && posterImg) {
    heroPoster.src = posterImg;
    heroPoster.alt = data.title;
  }

  // Status
  const statusBadge = document.getElementById('heroStatusBadge');
  if (statusBadge) {
    statusBadge.textContent = meta.status || 'ANIME';
  }

  // Titles
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) heroTitle.textContent = meta.englishTitle || data.title;

  const heroRomaji = document.getElementById('heroRomaji');
  if (heroRomaji) {
    heroRomaji.textContent = meta.romajiTitle || meta.nativeTitle || '';
    heroRomaji.style.display = (meta.romajiTitle || meta.nativeTitle) ? 'block' : 'none';
  }

  // Rating
  const scoreBox = document.getElementById('heroScoreBox');
  const scoreVal = document.getElementById('heroScoreVal');
  if (scoreBox && scoreVal) {
    if (meta.rating) {
      scoreVal.textContent = meta.rating;
      scoreBox.style.display = 'inline-flex';
    } else {
      scoreBox.style.display = 'none';
    }
  }

  // Genres
  const genresList = document.getElementById('heroGenresList');
  if (genresList) {
    genresList.innerHTML = '';
    const genres = meta.genres && meta.genres.length > 0 ? meta.genres : ['Anime', 'Series'];
    genres.forEach(g => {
      const pill = document.createElement('span');
      pill.className = 'genre-pill';
      pill.textContent = g;
      genresList.appendChild(pill);
    });
  }

  // Synopsis
  const heroSynopsis = document.getElementById('heroSynopsis');
  if (heroSynopsis) {
    heroSynopsis.textContent = meta.synopsis || 'No synopsis available for this anime series.';
    heroSynopsis.classList.remove('expanded');
    heroSynopsis.title = 'Click to read full synopsis';
    heroSynopsis.onclick = () => heroSynopsis.classList.toggle('expanded');
  }

  // Cross-Platform Mappings (AniList, MAL, Kitsu, AniZip)
  const mappingsDiv = document.getElementById('heroMappings');
  if (mappingsDiv) {
    mappingsDiv.innerHTML = '';
    const m = meta.mappings || {};
    if (m.anilist_id) {
      mappingsDiv.innerHTML += `<a href="https://anilist.co/anime/${m.anilist_id}" target="_blank" rel="noopener" class="mapping-badge badge-anilist" title="View on AniList">📊 AniList #${m.anilist_id}</a>`;
    }
    if (m.mal_id) {
      mappingsDiv.innerHTML += `<a href="https://myanimelist.net/anime/${m.mal_id}" target="_blank" rel="noopener" class="mapping-badge badge-mal" title="View on MyAnimeList">⭐ MAL #${m.mal_id}</a>`;
    }
    if (m.kitsu_id) {
      mappingsDiv.innerHTML += `<a href="https://kitsu.io/anime/${m.kitsu_id}" target="_blank" rel="noopener" class="mapping-badge badge-kitsu" title="View on Kitsu">🦊 Kitsu #${m.kitsu_id}</a>`;
    }
    mappingsDiv.innerHTML += `<span class="mapping-badge badge-anizip" title="AniZip Episode Mapping Verified">⚡ AniZip Mapped</span>`;
  }

  // Trailer Link
  const trailerBtn = document.getElementById('heroTrailerBtn');
  if (trailerBtn) {
    if (meta.trailerUrl) {
      trailerBtn.href = meta.trailerUrl;
      trailerBtn.style.display = 'inline-flex';
    } else {
      trailerBtn.style.display = 'none';
    }
  }

  heroCard.style.display = 'block';
}

// Render Season Tabs
function renderSeasonTabs(seasons, currentActiveSeason = 1) {
  const container = document.getElementById('seasonTabsContainer');
  const list = document.getElementById('seasonTabsList');
  if (!container || !list) return;

  if (!seasons || seasons.length <= 1) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  list.innerHTML = '';

  seasons.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.season = s.season.toString();
    btn.className = 'season-pill' + (s.season === currentActiveSeason ? ' active' : '');
    btn.innerHTML = `
      <span>${s.label}</span>
      ${s.episodesRange ? `<span class="season-range-badge">(${s.episodesRange})</span>` : ''}
    `;
    btn.onclick = () => selectSeason(s, true);
    list.appendChild(btn);
  });
}

// Switch Seasons Dynamically via AJAX
async function selectSeason(seasonObj, autoPlayFirst = true) {
  if (!seasonObj) return;
  currentSeason = seasonObj.season;

  // Update active pill UI
  document.querySelectorAll('.season-pill').forEach(btn => {
    const isThisSeason = btn.dataset.season === seasonObj.season.toString() || btn.textContent.includes(seasonObj.label);
    btn.classList.toggle('active', isThisSeason);
  });

  // Calculate starting episode offset from episodesRange (e.g. "33 - 53" -> 33)
  let offset = 0;
  if (seasonObj.episodesRange) {
    const match = seasonObj.episodesRange.match(/(\d+)/);
    if (match) offset = parseInt(match[1], 10);
  }

  setLoading(true, `Loading episodes for ${seasonObj.label}...`);
  try {
    const title = currentSeriesData?.title || '';
    const res = await fetch(`/api/series/season?postId=${seasonObj.postId}&season=${seasonObj.season}&title=${encodeURIComponent(title)}&offset=${offset}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch season episodes');

    currentSeriesEpisodes = data.episodes;
    episodeCountBadge.textContent = `${data.totalEpisodes} Episodes (${seasonObj.label})`;

    if (data.episodes && data.episodes.length > 0 && autoPlayFirst) {
      const firstEp = data.episodes[0];
      currentActiveEpisodeUrl = firstEp.watchUrl;
      renderEpisodeGrid(data.episodes, firstEp.watchUrl);
      const epDisplay = firstEp.title ? `${title} - ${firstEp.title}` : `${title} - Season ${seasonObj.season} Ep ${firstEp.episode}`;
      await loadEpisodeDirect(firstEp.watchUrl, epDisplay);
      showToast(`⚡ Now Playing: ${seasonObj.label} Episode ${firstEp.episode}`);
    } else {
      renderEpisodeGrid(data.episodes, currentActiveEpisodeUrl);
      setLoading(false);
    }
  } catch (err) {
    setLoading(false);
    showToast(`Season Load Error: ${err.message}`, 4000);
  }
}

// Date Formatter Helper
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

// Load Series & First Episode
async function loadSeries(seriesUrl, options = {}) {
  const targetSeason = options.targetSeason || 1;
  setLoading(true, `Loading ${targetSeason > 1 ? `Season ${targetSeason}` : 'series'} & fetching metadata...`);
  try {
    const queryParams = new URLSearchParams({
      url: seriesUrl,
      season: targetSeason.toString()
    });
    const res = await fetch('/api/series?' + queryParams.toString());
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load series');

    currentSeriesData = data;
    currentSeason = data.activeSeason || targetSeason || 1;
    seriesName.textContent = data.title;
    episodeCountBadge.textContent = `${data.totalEpisodes} Episodes (${data.seasons?.find(s => s.season === currentSeason)?.label || `Season ${currentSeason}`})`;
    currentSeriesEpisodes = data.episodes;

    // Render Hero Showcase Card
    renderHeroShowcase(data);

    // Render Season Tabs with active season highlighted
    renderSeasonTabs(data.seasons, currentSeason);

    // Render Episode Grid
    const firstEp = data.episodes.length > 0 ? data.episodes[0] : null;
    const firstEpUrl = firstEp ? firstEp.watchUrl : '';
    currentActiveEpisodeUrl = firstEpUrl;
    renderEpisodeGrid(data.episodes, firstEpUrl);

    // Play first episode of the selected season
    if (firstEp) {
      const epDisplay = firstEp.title ? `${data.title} - ${firstEp.title}` : `${data.title} - Season ${currentSeason} Ep ${firstEp.episode}`;
      await loadEpisodeDirect(firstEp.watchUrl, epDisplay);
    }
  } catch (err) {
    setLoading(false);
    showToast(`Error: ${err.message}`, 4000);
    console.error(err);
  }
}

// Render Episode Grid (Rich Cards or Compact Buttons)
function renderEpisodeGrid(episodes, activeUrl = '') {
  episodesGrid.innerHTML = '';
  if (!episodes || episodes.length === 0) {
    episodesGrid.innerHTML = '<div style="color: var(--text-dim); padding: 20px; text-align: center;">No episodes found.</div>';
    return;
  }

  if (episodeViewMode === 'compact') {
    episodes.forEach(ep => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ep-btn' + (ep.watchUrl === activeUrl ? ' active' : '');
      btn.textContent = `Ep ${ep.episode}`;
      btn.title = ep.title || `Episode ${ep.episode}`;
      btn.onclick = () => {
        document.querySelectorAll('.ep-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentActiveEpisodeUrl = ep.watchUrl;
        loadEpisodeDirect(ep.watchUrl, `${seriesName.textContent} - ${ep.title}`);
      };
      episodesGrid.appendChild(btn);
    });
  } else {
    // Rich Card View
    const fallbackPoster = currentSeriesData?.poster || 'https://via.placeholder.com/320x180/0f172a/38bdf8?text=Episode';
    episodes.forEach(ep => {
      const card = document.createElement('div');
      card.className = 'ep-card' + (ep.watchUrl === activeUrl ? ' active' : '');
      card.dataset.url = ep.watchUrl;
      card.dataset.ep = ep.episode;

      const thumbUrl = ep.thumbnail || fallbackPoster;
      const formattedDate = formatDate(ep.airdate);

      card.innerHTML = `
        <div class="ep-card-thumb-box">
          <img class="ep-card-thumb" src="${thumbUrl}" alt="Episode ${ep.episode}" loading="lazy" onerror="this.src='${fallbackPoster}'" />
          <span class="ep-card-badge">EP ${ep.episode}</span>
          ${formattedDate ? `<span class="ep-card-date">${formattedDate}</span>` : ''}
          <div class="ep-card-play-overlay">
            <div class="play-circle">▶</div>
          </div>
          <div class="ep-card-now-playing">
            <div class="equalizer-bar"></div>
            <div class="equalizer-bar"></div>
            <div class="equalizer-bar"></div>
            <span>PLAYING</span>
          </div>
        </div>
        <div class="ep-card-body">
          <span class="ep-card-num">Season ${ep.season || currentSeason} • Ep ${ep.episode}</span>
          <h4 class="ep-card-name" title="${ep.title}">${ep.title}</h4>
        </div>
      `;

      card.onclick = () => {
        document.querySelectorAll('.ep-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        currentActiveEpisodeUrl = ep.watchUrl;
        loadEpisodeDirect(ep.watchUrl, `${seriesName.textContent} - ${ep.title}`);
      };

      episodesGrid.appendChild(card);
    });
  }
}

function filterEpisodesList() {
  const query = document.getElementById('episodeSearchInput').value.trim().toLowerCase();
  const filtered = currentSeriesEpisodes.filter(ep => 
    ep.episode.toString().includes(query) || (ep.title && ep.title.toLowerCase().includes(query))
  );
  renderEpisodeGrid(filtered, currentActiveEpisodeUrl);
}

// Load and Play an Episode
async function loadEpisodeDirect(episodeUrl, customTitle = null) {
  setLoading(true, 'Resolving direct 1080p HLS stream...');
  currentActiveEpisodeUrl = episodeUrl;
  try {
    const res = await fetch('/api/watch?url=' + encodeURIComponent(episodeUrl));
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to resolve episode stream');

    currentStreamData = data;
    currentEpisodeTitle.textContent = customTitle || data.watchUrl;

    // Update tags
    providerTag.textContent = data.provider.toUpperCase();
    providerTag.className = `tag tag-${data.provider}`;
    
    // Highlight active in both rich and compact views
    document.querySelectorAll('.ep-card').forEach(c => {
      c.classList.toggle('active', c.dataset.url === episodeUrl);
    });
    document.querySelectorAll('.ep-btn').forEach(b => {
      b.classList.toggle('active', b.dataset?.url === episodeUrl || b.textContent === `Ep ${data.episode}`);
    });

    // Populate Server Pills
    renderServerPills(data.servers);

    // Play Primary Stream
    const primary = data.servers[0];
    initArtPlayer(primary.proxiedMasterM3u8);

    setLoading(false);
  } catch (err) {
    setLoading(false);
    showToast(`Playback Error: ${err.message}`, 4000);
    console.error(err);
  }
}

// Populate Server Selector
function renderServerPills(servers) {
  serverPillsContainer.innerHTML = '';
  servers.forEach((s, idx) => {
    const btn = document.createElement('button');
    btn.className = 'server-pill' + (idx === 0 ? ' active' : '');
    btn.textContent = s.name;
    btn.onclick = () => {
      document.querySelectorAll('.server-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      initArtPlayer(s.proxiedMasterM3u8);
    };
    serverPillsContainer.appendChild(btn);
  });
}

// Global Subtitle & Player Settings State
let subtitleState = {
  activeTrackIndex: -1, // -1 = off
  activeTrackName: 'Off',
  fontSize: '20px',
  color: '#ffffff',
  background: 'transparent',
  tracks: [], // list of HLS tracks
  customSubBlobUrl: null,
  customSubFileName: null
};

function getColorLabel(colorHex) {
  switch (colorHex) {
    case '#ffffff': return '⚪ White';
    case '#facc15': return '🟡 Yellow';
    case '#38bdf8': return '🔵 Cyan';
    case '#4ade80': return '🟢 Green';
    case '#f472b6': return '🟣 Pink';
    default: return colorHex;
  }
}

function getBgLabel(bgVal) {
  if (bgVal === 'transparent') return 'None';
  if (bgVal.includes('0.65')) return 'Translucent';
  return 'Solid Black';
}

function applySubtitleStyles() {
  let styleEl = document.getElementById('dynamic-sub-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-sub-styles';
    document.head.appendChild(styleEl);
  }

  const bgStyle = subtitleState.background === 'transparent' ? 'transparent' : subtitleState.background;
  styleEl.textContent = `
    video::cue {
      font-family: 'Outfit', sans-serif !important;
      font-size: ${subtitleState.fontSize} !important;
      color: ${subtitleState.color} !important;
      background-color: ${bgStyle} !important;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.95), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000 !important;
    }
    .art-video-player .art-subtitle {
      font-family: 'Outfit', sans-serif !important;
      font-size: ${subtitleState.fontSize} !important;
      color: ${subtitleState.color} !important;
      background-color: ${bgStyle} !important;
      border-radius: 4px !important;
      padding: ${subtitleState.background !== 'transparent' ? '4px 10px' : '0'} !important;
    }
  `;

  if (art && art.subtitle) {
    try {
      art.subtitle.style({
        fontSize: subtitleState.fontSize,
        color: subtitleState.color,
        backgroundColor: bgStyle
      });
    } catch (e) {}
  }
}

function handleCustomSubtitleUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  loadCustomSubtitleFile(file);
}

function loadCustomSubtitleFile(file) {
  if (!file) return;
  const objectUrl = URL.createObjectURL(file);
  const ext = file.name.split('.').pop().toLowerCase();

  subtitleState.customSubBlobUrl = objectUrl;
  subtitleState.customSubFileName = file.name;

  if (art && art.subtitle) {
    try {
      art.subtitle.switch(objectUrl, {
        name: file.name,
        type: ext === 'srt' ? 'srt' : 'vtt'
      });
      art.subtitle.show = true;
    } catch (e) {
      console.warn('Subtitle switch error:', e);
    }
  }

  if (currentHls) {
    currentHls.subtitleTrack = -1;
  }

  subtitleState.activeTrackIndex = 'custom';
  subtitleState.activeTrackName = file.name;

  applySubtitleStyles();
  updateActiveSubtitleUI();
  if (currentHls && art) {
    renderSubtitles(currentHls, art);
  }
  showToast(`💬 Subtitle loaded: ${file.name}`);
}

function selectSubtitleTrack(index, hls = currentHls, artInstance = art) {
  subtitleState.activeTrackIndex = index;

  if (index === -1) {
    // Turn Off
    if (hls) hls.subtitleTrack = -1;
    if (artInstance && artInstance.subtitle) {
      try { artInstance.subtitle.show = false; } catch (e) {}
    }
    subtitleState.activeTrackName = 'Off';
  } else if (index === 'custom') {
    // Custom file
    if (hls) hls.subtitleTrack = -1;
    if (artInstance && artInstance.subtitle && subtitleState.customSubBlobUrl) {
      try {
        const ext = subtitleState.customSubFileName.split('.').pop().toLowerCase();
        artInstance.subtitle.switch(subtitleState.customSubBlobUrl, {
          name: subtitleState.customSubFileName,
          type: ext === 'srt' ? 'srt' : 'vtt'
        });
        artInstance.subtitle.show = true;
      } catch (e) {}
    }
    subtitleState.activeTrackName = subtitleState.customSubFileName || 'Custom';
  } else {
    // HLS embedded track
    if (artInstance && artInstance.subtitle) {
      try { artInstance.subtitle.show = false; } catch (e) {}
    }
    if (hls) {
      hls.subtitleTrack = index;
      const track = hls.subtitleTracks ? hls.subtitleTracks[index] : null;
      subtitleState.activeTrackName = track?.name || track?.lang || `Track ${index + 1}`;
    }
  }

  applySubtitleStyles();
  updateActiveSubtitleUI();
  updateInPlayerSubtitleSettings(subtitleState.tracks, hls, artInstance);
  showToast(`💬 Subtitles: ${subtitleState.activeTrackName}`);
}

function toggleSubtitlesQuick() {
  if (subtitleState.activeTrackIndex !== -1) {
    selectSubtitleTrack(-1);
  } else {
    if (subtitleState.customSubBlobUrl) {
      selectSubtitleTrack('custom');
    } else if (subtitleState.tracks && subtitleState.tracks.length > 0) {
      selectSubtitleTrack(0);
    } else {
      showToast('No embedded subtitles. Click "Upload Subtitle" to pick a .srt/.vtt file!');
      const input = document.getElementById('subFileInput');
      if (input) input.click();
    }
  }
}

function updateActiveSubtitleUI() {
  // Update on-page pills
  if (subtitlePillsContainer) {
    document.querySelectorAll('.subtitle-pill').forEach(b => {
      const bIdx = b.dataset.index;
      if (bIdx === 'custom') {
        b.classList.toggle('active', subtitleState.activeTrackIndex === 'custom');
      } else {
        b.classList.toggle('active', parseInt(bIdx, 10) === subtitleState.activeTrackIndex);
      }
    });
  }

  // Update CC button in player control bar
  const ccBadge = document.getElementById('artCcBadge');
  if (ccBadge) {
    ccBadge.classList.toggle('active', subtitleState.activeTrackIndex !== -1);
  }
}

// Initialize ArtPlayer with HLS.js
function initArtPlayer(streamUrl) {
  if (art) {
    art.destroy();
    art = null;
  }

  art = new Artplayer({
    container: '#artplayer',
    url: streamUrl,
    type: 'm3u8',
    autoplay: true,
    fullscreen: true,
    fullscreenWeb: true,
    playbackRate: true,
    aspectRatio: true,
    setting: true,          // <--- ⚙️ Settings Menu enabled!
    subtitleOffset: true,   // <--- Subtitle Offset sync slider enabled!
    screenshot: true,
    pip: true,
    theme: '#0ea5e9',
    subtitle: {
      url: '',
      type: 'vtt',
      style: {
        color: subtitleState.color,
        fontSize: subtitleState.fontSize,
        fontWeight: '600',
        textShadow: '0 2px 6px rgba(0,0,0,0.95), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
      },
      encoding: 'utf-8'
    },
    controls: [
      {
        name: 'cc-toggle-btn',
        position: 'right',
        index: 10,
        html: `<span id="artCcBadge" class="art-cc-badge ${subtitleState.activeTrackIndex !== -1 ? 'active' : ''}">CC</span>`,
        tooltip: 'Subtitles (CC)',
        click: function () {
          toggleSubtitlesQuick();
        }
      }
    ],
    customType: {
      m3u8: function (video, url, artInstance) {
        if (Hls.isSupported()) {
          if (artInstance.hls) artInstance.hls.destroy();
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false
          });
          hls.loadSource(url);
          hls.attachMedia(video);
          artInstance.hls = hls;
          currentHls = hls;

          hls.on(Hls.Events.MANIFEST_PARSED, function () {
            renderQualities(hls, artInstance);
            renderAudioTracks(hls, artInstance);
            renderSubtitles(hls, artInstance);
            applySubtitleStyles();
          });

          hls.on(Hls.Events.LEVEL_SWITCHED, function (event, data) {
            updateActiveQuality(data.level);
          });

          hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, function (event, data) {
            updateActiveAudio(data.id);
          });

          hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, function (event, data) {
            subtitleState.activeTrackIndex = data.id;
            updateActiveSubtitleUI();
          });

          hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.warn('[HLS] Network error encountered, attempting recovery...', data);
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.warn('[HLS] Media error encountered, attempting recovery...', data);
                  hls.recoverMediaError();
                  break;
                default:
                  console.error('[HLS] Fatal HLS error:', data);
                  hls.destroy();
                  break;
              }
            }
          });

          artInstance.on('destroy', () => hls.destroy());
          artInstance.on('ready', () => {
            applySubtitleStyles();
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
        }
      }
    }
  });
}

// 1. Render Video Qualities (1080p, 720p, 480p, 360p, Auto)
function renderQualities(hls, artInstance) {
  if (!qualityPillsContainer) return;
  qualityPillsContainer.innerHTML = '';

  const levels = hls.levels || [];
  if (levels.length === 0) {
    qualityPillsContainer.innerHTML = '<span class="quality-pill active">Auto HD</span>';
    return;
  }

  const qualityOptions = [
    { label: 'Auto HD', level: -1 },
    ...levels.map((lvl, idx) => ({
      label: lvl.height ? `${lvl.height}p` : `Stream ${idx + 1}`,
      level: idx
    }))
  ];

  qualityOptions.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quality-pill' + (hls.currentLevel === opt.level ? ' active' : '');
    btn.textContent = opt.label;
    btn.dataset.level = opt.level;
    btn.onclick = () => {
      hls.currentLevel = opt.level;
      updateActiveQuality(opt.level, opt.label);
      showToast(`🎬 Video Quality: ${opt.label}`);
    };
    qualityPillsContainer.appendChild(btn);
  });

  // Add Quality Setting inside ArtPlayer controls
  try {
    if (artInstance && artInstance.setting) {
      artInstance.setting.update({
        name: 'video-quality',
        width: 200,
        html: '🎬 Video Quality',
        tooltip: hls.currentLevel === -1 ? 'Auto HD' : `${levels[hls.currentLevel]?.height}p`,
        selector: qualityOptions.map(opt => ({
          default: hls.currentLevel === opt.level,
          html: opt.label,
          level: opt.level
        })),
        onSelect: function (item) {
          hls.currentLevel = item.level;
          updateActiveQuality(item.level, item.html);
          showToast(`🎬 Quality: ${item.html}`);
          return item.html;
        }
      });
    }
  } catch (e) {
    console.warn('Error adding video quality setting:', e);
  }
}

function updateActiveQuality(level, customLabel = null) {
  if (!qualityPillsContainer) return;
  document.querySelectorAll('.quality-pill').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.level, 10) === level);
  });
  if (qualityTag) {
    if (customLabel) {
      qualityTag.textContent = customLabel;
    } else if (currentHls && currentHls.levels && currentHls.levels[level]) {
      qualityTag.textContent = `${currentHls.levels[level].height}p HD`;
    } else {
      qualityTag.textContent = 'Auto HD';
    }
  }
}

// 2. Render Audio Tracks (Hindi Dub default, English, Japanese, Tamil, etc.)
function renderAudioTracks(hls, artInstance) {
  if (!audioPillsContainer) return;
  audioPillsContainer.innerHTML = '';

  const tracks = hls.audioTracks || [];
  if (tracks.length === 0) {
    audioPillsContainer.innerHTML = '<span class="audio-pill active">🇮🇳 Hindi Dub (Default)</span>';
    return;
  }

  // Find Hindi track index so it defaults to Hindi
  const hindiIdx = tracks.findIndex(t => 
    (t.lang && /hin|hi/i.test(t.lang)) || 
    (t.name && /hindi/i.test(t.name))
  );

  // Auto-switch to Hindi track immediately if present
  if (hindiIdx !== -1 && hls.audioTrack !== hindiIdx) {
    hls.audioTrack = hindiIdx;
  }

  tracks.forEach((track, idx) => {
    const isHindi = (track.lang && /hin|hi/i.test(track.lang)) || (track.name && /hindi/i.test(track.name));
    const isJap = (track.lang && /jpn|ja/i.test(track.lang)) || (track.name && /japanese/i.test(track.name));
    const isEng = (track.lang && /eng|en/i.test(track.lang)) || (track.name && /english/i.test(track.name));
    const isTam = (track.lang && /tam|ta/i.test(track.lang)) || (track.name && /tamil/i.test(track.name));
    const isTel = (track.lang && /tel|te/i.test(track.lang)) || (track.name && /telugu/i.test(track.name));

    let flag = '🎵 ';
    if (isHindi) flag = '🇮🇳 ';
    else if (isJap) flag = '🇯🇵 ';
    else if (isEng) flag = '🇬🇧 ';
    else if (isTam) flag = '🇮🇳 ';
    else if (isTel) flag = '🇮🇳 ';

    let displayName = track.name || track.lang || `Track ${idx + 1}`;
    if (isHindi && !displayName.toLowerCase().includes('hindi')) displayName += ' (Hindi)';

    const btn = document.createElement('button');
    const isActive = (hls.audioTrack === idx) || (hindiIdx !== -1 && idx === hindiIdx && (hls.audioTrack === -1 || hls.audioTrack === 0));
    btn.className = 'audio-pill' + (isActive ? ' active' : '');
    btn.dataset.index = idx;
    btn.innerHTML = `${flag}${displayName}`;

    btn.onclick = () => {
      hls.audioTrack = idx;
      updateActiveAudio(idx);
      showToast(`🎧 Audio switched to: ${displayName}`);
    };
    audioPillsContainer.appendChild(btn);
  });

  // Add Audio Setting inside ArtPlayer controls
  try {
    if (artInstance && artInstance.setting) {
      artInstance.setting.update({
        name: 'audio-language',
        width: 220,
        html: '🎧 Audio Language',
        tooltip: tracks[hls.audioTrack]?.name || 'Hindi Dub',
        selector: tracks.map((t, i) => ({
          default: hls.audioTrack === i,
          html: t.name || t.lang || `Audio ${i + 1}`,
          index: i
        })),
        onSelect: function (item) {
          hls.audioTrack = item.index;
          updateActiveAudio(item.index);
          showToast(`🎧 Audio: ${item.html}`);
          return item.html;
        }
      });
    }
  } catch (e) {
    console.warn('Error adding audio language setting:', e);
  }
}

function updateActiveAudio(index) {
  if (!audioPillsContainer) return;
  document.querySelectorAll('.audio-pill').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.index, 10) === index);
  });
}

// 3. Render Subtitles (On/Off, Language Tracks)
function renderSubtitles(hls, artInstance) {
  if (!subtitlePillsContainer) return;
  subtitlePillsContainer.innerHTML = '';

  const tracks = (hls && hls.subtitleTracks) ? hls.subtitleTracks : [];
  subtitleState.tracks = tracks;

  // Off Button
  const offBtn = document.createElement('button');
  offBtn.className = 'subtitle-pill' + (subtitleState.activeTrackIndex === -1 ? ' active' : '');
  offBtn.textContent = 'Off';
  offBtn.dataset.index = -1;
  offBtn.onclick = () => {
    selectSubtitleTrack(-1, hls, artInstance);
  };
  subtitlePillsContainer.appendChild(offBtn);

  // Custom uploaded subtitle pill if present
  if (subtitleState.customSubFileName) {
    const customBtn = document.createElement('button');
    customBtn.className = 'subtitle-pill' + (subtitleState.activeTrackIndex === 'custom' ? ' active' : '');
    customBtn.textContent = `📁 ${subtitleState.customSubFileName}`;
    customBtn.dataset.index = 'custom';
    customBtn.onclick = () => {
      selectSubtitleTrack('custom', hls, artInstance);
    };
    subtitlePillsContainer.appendChild(customBtn);
  }

  // Tracks from HLS
  tracks.forEach((track, idx) => {
    const btn = document.createElement('button');
    btn.className = 'subtitle-pill' + (subtitleState.activeTrackIndex === idx ? ' active' : '');
    btn.textContent = track.name || track.lang || `Sub ${idx + 1}`;
    btn.dataset.index = idx;
    btn.onclick = () => {
      selectSubtitleTrack(idx, hls, artInstance);
    };
    subtitlePillsContainer.appendChild(btn);
  });

  if (tracks.length === 0 && !subtitleState.customSubFileName) {
    const hint = document.createElement('span');
    hint.className = 'empty-hint';
    hint.textContent = 'No embedded CC (Upload .srt/.vtt above)';
    subtitlePillsContainer.appendChild(hint);
  }

  // Update In-Player ⚙️ Settings Menu Items
  updateInPlayerSubtitleSettings(tracks, hls, artInstance);
}

// In-Player Subtitle Settings Configuration
function updateInPlayerSubtitleSettings(tracks, hls, artInstance) {
  if (!artInstance || !artInstance.setting) return;

  try {
    // 1. Subtitle Track Selector Setting
    const trackOptions = [
      {
        default: subtitleState.activeTrackIndex === -1,
        html: 'Off (No Subtitles)',
        index: -1
      },
      ...tracks.map((t, idx) => ({
        default: subtitleState.activeTrackIndex === idx,
        html: t.name || t.lang || `Track ${idx + 1}`,
        index: idx
      }))
    ];

    if (subtitleState.customSubFileName) {
      trackOptions.push({
        default: subtitleState.activeTrackIndex === 'custom',
        html: `📁 ${subtitleState.customSubFileName}`,
        index: 'custom'
      });
    }

    artInstance.setting.update({
      name: 'subtitle-track',
      width: 240,
      html: '💬 Subtitle Track',
      tooltip: subtitleState.activeTrackName,
      selector: trackOptions,
      onSelect: function (item) {
        selectSubtitleTrack(item.index, hls, artInstance);
        return item.html;
      }
    });

    // 2. Subtitle Font Size Setting
    artInstance.setting.update({
      name: 'subtitle-size',
      width: 220,
      html: '🔤 Subtitle Size',
      tooltip: subtitleState.fontSize,
      selector: [
        { default: subtitleState.fontSize === '16px', html: 'Small (16px)', size: '16px' },
        { default: subtitleState.fontSize === '20px', html: 'Normal (20px)', size: '20px' },
        { default: subtitleState.fontSize === '24px', html: 'Large (24px)', size: '24px' },
        { default: subtitleState.fontSize === '28px', html: 'X-Large (28px)', size: '28px' },
        { default: subtitleState.fontSize === '34px', html: 'Massive (34px)', size: '34px' },
      ],
      onSelect: function (item) {
        subtitleState.fontSize = item.size;
        applySubtitleStyles();
        showToast(`🔤 Subtitle Size: ${item.html}`);
        return item.html;
      }
    });

    // 3. Subtitle Font Color Setting
    artInstance.setting.update({
      name: 'subtitle-color',
      width: 220,
      html: '🎨 Subtitle Color',
      tooltip: getColorLabel(subtitleState.color),
      selector: [
        { default: subtitleState.color === '#ffffff', html: '⚪ Pure White', color: '#ffffff' },
        { default: subtitleState.color === '#facc15', html: '🟡 Anime Yellow', color: '#facc15' },
        { default: subtitleState.color === '#38bdf8', html: '🔵 Sky Cyan', color: '#38bdf8' },
        { default: subtitleState.color === '#4ade80', html: '🟢 Bright Green', color: '#4ade80' },
        { default: subtitleState.color === '#f472b6', html: '🟣 Neon Pink', color: '#f472b6' },
      ],
      onSelect: function (item) {
        subtitleState.color = item.color;
        applySubtitleStyles();
        showToast(`🎨 Subtitle Color: ${item.html}`);
        return item.html;
      }
    });

    // 4. Subtitle Background Box Setting
    artInstance.setting.update({
      name: 'subtitle-bg',
      width: 220,
      html: '🔲 Subtitle Box',
      tooltip: getBgLabel(subtitleState.background),
      selector: [
        { default: subtitleState.background === 'transparent', html: 'Outline Only (None)', bg: 'transparent' },
        { default: subtitleState.background === 'rgba(0, 0, 0, 0.65)', html: 'Translucent Dark', bg: 'rgba(0, 0, 0, 0.65)' },
        { default: subtitleState.background === 'rgba(0, 0, 0, 0.92)', html: 'Solid Black', bg: 'rgba(0, 0, 0, 0.92)' },
      ],
      onSelect: function (item) {
        subtitleState.background = item.bg;
        applySubtitleStyles();
        showToast(`🔲 Subtitle Box: ${item.html}`);
        return item.html;
      }
    });

    // 5. Upload Custom Subtitle Button in Settings
    artInstance.setting.update({
      name: 'subtitle-upload',
      width: 220,
      html: '📂 Upload Subtitle (.srt/.vtt)',
      tooltip: subtitleState.customSubFileName || 'Choose file',
      click: function () {
        const input = document.getElementById('subFileInput');
        if (input) input.click();
      }
    });
  } catch (e) {
    console.warn('Error updating subtitle settings:', e);
  }
}

// Copy M3U8 URL
function copyStreamUrl() {
  if (!currentStreamData || !currentStreamData.primaryStream) {
    showToast('No active stream to copy');
    return;
  }
  const streamUrl = currentStreamData.primaryStream.proxiedMasterM3u8;
  navigator.clipboard.writeText(streamUrl).then(() => {
    showToast('📋 Stream M3U8 copied to clipboard!');
  }).catch(() => {
    prompt('Copy Stream M3U8 URL:', streamUrl);
  });
}

// Open in External Player
function openExternalPlayer() {
  if (!currentStreamData || !currentStreamData.primaryStream) return;
  const streamUrl = currentStreamData.primaryStream.proxiedMasterM3u8;
  window.open(`vlc://${streamUrl}`, '_blank');
  showToast('Opening in VLC player...');
}

// Show Toast
function showToast(message, duration = 2500) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}
