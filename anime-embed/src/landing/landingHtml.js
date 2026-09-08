/**
 * PROFESSIONAL DEVELOPER PORTAL & PLAYGROUND
 * Strictly NO GLOW EFFECTS and NO AI SLOP.
 * Clean, modern utility interface for searching anime, live iframe preview,
 * one-click iframe code generator, and API parameter documentation.
 */

export function renderLandingHtml(baseUrl = "") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AniEmbed — High-Performance Public Anime Embed Provider</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #09090b;
            --surface: #121215;
            --surface-hover: #18181b;
            --border: #27272a;
            --border-light: #3f3f46;
            --text-primary: #f4f4f5;
            --text-secondary: #a1a1aa;
            --text-muted: #71717a;
            --accent: #ffffff;
            --accent-bg: #18181b;
            --success: #22c55e;
            --blue: #3b82f6;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg);
            color: var(--text-primary);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            min-height: 100vh;
            line-height: 1.5;
            padding: 0;
        }

        .container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 32px 24px;
        }

        /* Top Header */
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 24px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 36px;
        }

        .brand-group {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .brand-badge {
            background: #ffffff;
            color: #09090b;
            font-size: 13px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 4px;
            letter-spacing: 0.5px;
        }

        .brand-title {
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
        }

        .engine-status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #18181b;
            border: 1px solid var(--border);
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-family: 'JetBrains Mono', monospace;
            color: var(--text-secondary);
        }

        .status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--success);
        }

        /* Hero / Introduction */
        .hero {
            margin-bottom: 36px;
        }

        .hero h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }

        .hero p {
            color: var(--text-secondary);
            font-size: 15px;
            max-width: 820px;
        }

        /* Main Workspace Grid */
        .workspace-grid {
            display: grid;
            grid-template-columns: 420px 1fr;
            gap: 28px;
            margin-bottom: 48px;
        }

        @media (max-width: 960px) {
            .workspace-grid { grid-template-columns: 1fr; }
        }

        /* Panels */
        .panel {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 24px;
        }

        .panel-title {
            font-size: 15px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        /* Live Anime Search Input */
        .search-container {
            position: relative;
            margin-bottom: 20px;
        }

        .search-input {
            width: 100%;
            background: #18181b;
            border: 1px solid var(--border);
            color: #ffffff;
            padding: 10px 14px;
            border-radius: 6px;
            font-size: 14px;
            font-family: inherit;
            outline: none;
            transition: border-color 0.15s ease;
        }

        .search-input:focus {
            border-color: #52525b;
        }

        .search-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #121215;
            border: 1px solid var(--border);
            border-radius: 6px;
            margin-top: 4px;
            max-height: 320px;
            overflow-y: auto;
            z-index: 100;
            display: none;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
        }

        .search-dropdown.open {
            display: block;
        }

        .search-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-bottom: 1px solid var(--border);
            cursor: pointer;
            transition: background 0.15s ease;
        }

        .search-item:last-child {
            border-bottom: none;
        }

        .search-item:hover {
            background: #18181b;
        }

        .search-item img {
            width: 38px;
            height: 52px;
            object-fit: cover;
            border-radius: 4px;
            background: #27272a;
        }

        .search-item-info {
            flex: 1;
            min-width: 0;
        }

        .search-item-title {
            font-size: 13px;
            font-weight: 600;
            color: #ffffff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .search-item-meta {
            font-size: 11px;
            color: var(--text-muted);
            margin-top: 2px;
            font-family: 'JetBrains Mono', monospace;
        }

        /* Form Fields */
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 14px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .form-group.full {
            grid-column: span 2;
        }

        label {
            font-size: 12px;
            font-weight: 500;
            color: var(--text-secondary);
        }

        input[type="text"], input[type="number"], select {
            background: #18181b;
            border: 1px solid var(--border);
            color: #ffffff;
            padding: 9px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-family: inherit;
            outline: none;
            transition: border-color 0.15s ease;
        }

        input:focus, select:focus {
            border-color: #52525b;
        }

        select option {
            background: #121215;
            color: #ffffff;
        }

        /* Quick Preset Chips */
        .preset-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 20px;
        }

        .chip {
            background: #18181b;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.15s ease, color 0.15s ease;
        }

        .chip:hover {
            background: var(--border);
            color: #ffffff;
        }

        /* Code Snippet Box */
        .snippet-box {
            margin-top: 18px;
            background: #09090b;
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 12px;
            position: relative;
        }

        .snippet-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .snippet-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .btn-copy {
            background: #18181b;
            border: 1px solid var(--border);
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s ease;
        }

        .btn-copy:hover {
            background: #27272a;
        }

        pre {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: var(--text-primary);
            white-space: pre-wrap;
            word-break: break-all;
            line-height: 1.4;
        }

        /* Right Column: Live Player Preview Container */
        .player-preview-card {
            display: flex;
            flex-direction: column;
        }

        .preview-wrapper {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            background: #000000;
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: hidden;
        }

        .preview-iframe {
            width: 100%;
            height: 100%;
            border: none;
        }

        /* Documentation Tables */
        .docs-section {
            margin-top: 36px;
        }

        .docs-section h2 {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 16px;
        }

        .docs-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 28px;
        }

        .docs-table th, .docs-table td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }

        .docs-table th {
            background: #18181b;
            font-weight: 600;
            color: var(--text-primary);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .docs-table tr:last-child td {
            border-bottom: none;
        }

        .docs-table code {
            font-family: 'JetBrains Mono', monospace;
            background: #18181b;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            color: #ffffff;
            border: 1px solid var(--border);
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <header>
            <div class="brand-group">
                <span class="brand-badge">ANIEMBED</span>
                <span class="brand-title">Public Anime Embed Provider</span>
            </div>

            <div class="engine-status">
                <span class="status-dot"></span>
                <span>3 SERVERS OPERATIONAL</span>
            </div>
        </header>

        <!-- Hero Section -->
        <div class="hero">
            <h1>Zero-Ad Anime Streaming Embed API</h1>
            <p>
                Drop-in responsive iframe video player for modern anime web applications. Integrates 3 independent streaming engines (MegaPlay, AniNeko, Zoko) with automated failover, AniList/MAL ID mapping, and zero ads or distractions.
            </p>
        </div>

        <!-- Main Workspace Grid -->
        <div class="workspace-grid">
            <!-- Left Panel: Iframe Generator & Search -->
            <div class="panel">
                <div class="panel-title">
                    <span>Embed Configuration</span>
                </div>

                <!-- AniList Search Input -->
                <div class="search-container">
                    <label style="margin-bottom: 6px; display: block;">Search Anime (AniList / MAL)</label>
                    <input type="text" class="search-input" id="anime-search" placeholder="Type anime title (e.g. Naruto, Solo Leveling)..." autocomplete="off" oninput="onSearchInput(this.value)">
                    <div class="search-dropdown" id="search-dropdown"></div>
                </div>

                <!-- Quick Presets -->
                <div class="preset-bar">
                    <span class="chip" onclick="applyPreset('ani', 21, 1, 'sub', 'One Piece')">One Piece (Ani 21)</span>
                    <span class="chip" onclick="applyPreset('mal', 20, 1, 'sub', 'Naruto')">Naruto (MAL 20)</span>
                    <span class="chip" onclick="applyPreset('ani', 151807, 1, 'sub', 'Solo Leveling S2')">Solo Leveling S2</span>
                    <span class="chip" onclick="applyPreset('ani', 154587, 1, 'sub', 'Frieren')">Frieren</span>
                    <span class="chip" onclick="applyPreset('ani', 113415, 1, 'sub', 'Jujutsu Kaisen')">Jujutsu Kaisen</span>
                </div>

                <!-- Configuration Form -->
                <div class="form-row">
                    <div class="form-group">
                        <label>ID Type</label>
                        <select id="id-type" onchange="updateEmbed()">
                            <option value="ani" selected>AniList ID</option>
                            <option value="mal">MyAnimeList ID</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Anime ID</label>
                        <input type="text" id="anime-id" value="21" oninput="updateEmbed()">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Episode Number</label>
                        <input type="number" id="ep-num" value="1" min="1" oninput="updateEmbed()">
                    </div>

                    <div class="form-group">
                        <label>Audio Track</label>
                        <select id="track-select" onchange="updateEmbed()">
                            <option value="sub" selected>Subbed (Japanese)</option>
                            <option value="dub">Dubbed (English)</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Preferred Engine</label>
                        <select id="server-select" onchange="updateEmbed()">
                            <option value="1" selected>Server 1 (MegaPlay • 1ms Edge)</option>
                            <option value="2">Server 2 (AniNeko • Multi-CDN)</option>
                            <option value="3">Server 3 (Zoko • XOR Engine)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Auto-Play</label>
                        <select id="autoplay-select" onchange="updateEmbed()">
                            <option value="1" selected>Enabled (1)</option>
                            <option value="0">Disabled (0)</option>
                        </select>
                    </div>
                </div>

                <!-- Generated Iframe Code Snippet -->
                <div class="snippet-box">
                    <div class="snippet-header">
                        <span class="snippet-label">Responsive Iframe Code</span>
                        <button class="btn-copy" onclick="copyIframeCode()">Copy Code</button>
                    </div>
                    <pre><code id="snippet-code">&lt;iframe src="" width="100%" height="100%" frameborder="0" allowfullscreen&gt;&lt;/iframe&gt;</code></pre>
                </div>
            </div>

            <!-- Right Panel: Live Player Preview -->
            <div class="panel player-preview-card">
                <div class="panel-title">
                    <span>Live Embed Preview</span>
                    <a id="preview-open-link" href="#" target="_blank" style="font-size: 12px; color: var(--text-secondary); text-decoration: none;">Open Standalone ↗</a>
                </div>

                <div class="preview-wrapper">
                    <iframe class="preview-iframe" id="live-iframe" src="" allowfullscreen allow="autoplay; fullscreen"></iframe>
                </div>

                <div style="margin-top: 14px; font-size: 12px; color: var(--text-muted); display: flex; justify-content: space-between;">
                    <span>Failover: Server 1 &rarr; Server 2 &rarr; Server 3</span>
                    <span id="preview-url-display" style="font-family: 'JetBrains Mono', monospace;"></span>
                </div>
            </div>
        </div>

        <!-- Documentation Section -->
        <div class="docs-section">
            <h2>Embed URL Structure</h2>
            <table class="docs-table">
                <thead>
                    <tr>
                        <th>Route</th>
                        <th>Parameters</th>
                        <th>Example</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>/embed/ani/:anilistId/:episode</code></td>
                        <td>Direct AniList ID path</td>
                        <td><code>${baseUrl}/embed/ani/21/1</code></td>
                    </tr>
                    <tr>
                        <td><code>/embed/mal/:malId/:episode</code></td>
                        <td>Direct MyAnimeList ID path</td>
                        <td><code>${baseUrl}/embed/mal/21/1</code></td>
                    </tr>
                    <tr>
                        <td><code>/embed</code></td>
                        <td>Query parameters (<code>?anilist=21&ep=1</code> or <code>?mal=21&ep=1</code>)</td>
                        <td><code>${baseUrl}/embed?anilist=21&ep=1&track=sub</code></td>
                    </tr>
                </tbody>
            </table>

            <h2>Query Parameters</h2>
            <table class="docs-table">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Type</th>
                        <th>Default</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>track</code></td>
                        <td><code>sub | dub</code></td>
                        <td><code>sub</code></td>
                        <td>Audio track selection. Supports Japanese original (sub) or English dubbed (dub).</td>
                    </tr>
                    <tr>
                        <td><code>server</code></td>
                        <td><code>1 | 2 | 3</code></td>
                        <td><code>1</code></td>
                        <td>Preferred server: 1 (MegaPlay), 2 (AniNeko), 3 (Zoko). Auto-fails over if unavailable.</td>
                    </tr>
                    <tr>
                        <td><code>autoPlay</code></td>
                        <td><code>1 | 0</code></td>
                        <td><code>1</code></td>
                        <td>Whether video begins playback automatically upon loading.</td>
                    </tr>
                    <tr>
                        <td><code>autoNext</code></td>
                        <td><code>1 | 0</code></td>
                        <td><code>1</code></td>
                        <td>Automatically transitions to next episode when current episode finishes.</td>
                    </tr>
                    <tr>
                        <td><code>autoSkip</code></td>
                        <td><code>1 | 0</code></td>
                        <td><code>1</code></td>
                        <td>Automatically skips opening (OP) and ending (ED) credits when timestamps match.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        let searchTimer = null;

        function updateEmbed() {
            const type = document.getElementById('id-type').value;
            const id = document.getElementById('anime-id').value.trim() || '21';
            const ep = document.getElementById('ep-num').value.trim() || '1';
            const track = document.getElementById('track-select').value;
            const server = document.getElementById('server-select').value;
            const autoPlay = document.getElementById('autoplay-select').value;

            const path = type === 'mal' ? \`/embed/mal/\${id}/\${ep}\` : \`/embed/ani/\${id}/\${ep}\`;
            const params = new URLSearchParams();
            if (track !== 'sub') params.set('track', track);
            if (server !== '1') params.set('server', server);
            if (autoPlay !== '1') params.set('autoPlay', autoPlay);

            const queryString = params.toString() ? \`?\${params.toString()}\` : '';
            const fullUrl = window.location.origin + path + queryString;

            document.getElementById('live-iframe').src = fullUrl;
            document.getElementById('preview-open-link').href = fullUrl;
            document.getElementById('preview-url-display').innerText = path + queryString;

            const iframeCode = \`<iframe src="\${fullUrl}" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay; fullscreen"><\/iframe>\`;
            document.getElementById('snippet-code').innerText = iframeCode;
        }

        function applyPreset(type, id, ep, track, title) {
            document.getElementById('id-type').value = type;
            document.getElementById('anime-id').value = id;
            document.getElementById('ep-num').value = ep;
            document.getElementById('track-select').value = track;
            document.getElementById('anime-search').value = title;
            updateEmbed();
        }

        function copyIframeCode() {
            const code = document.getElementById('snippet-code').innerText;
            navigator.clipboard.writeText(code).then(() => {
                alert('Iframe code copied to clipboard!');
            });
        }

        // Live AniList Search
        function onSearchInput(val) {
            clearTimeout(searchTimer);
            const dropdown = document.getElementById('search-dropdown');
            if (!val || val.trim().length < 2) {
                dropdown.classList.remove('open');
                dropdown.innerHTML = '';
                return;
            }

            searchTimer = setTimeout(async () => {
                try {
                    const res = await fetch(\`/api/search?q=\${encodeURIComponent(val.trim())}\`);
                    const results = await res.json();

                    if (!results || results.length === 0) {
                        dropdown.innerHTML = '<div style="padding: 12px; font-size: 13px; color: var(--text-muted);">No anime found.</div>';
                        dropdown.classList.add('open');
                        return;
                    }

                    dropdown.innerHTML = results.slice(0, 8).map(r => \`
                        <div class="search-item" onclick="selectAnime(\${r.id}, \${r.idMal || 'null'}, '\${escapeJs(r.title)}')">
                            <img src="\${r.poster || ''}" alt="\${escapeHtml(r.title)}">
                            <div class="search-item-info">
                                <div class="search-item-title">\${escapeHtml(r.title)}</div>
                                <div class="search-item-meta">
                                    AniList: \${r.id} \${r.idMal ? '• MAL: ' + r.idMal : ''} • \${r.episodes ? r.episodes + ' Eps' : 'Ongoing'}
                                </div>
                            </div>
                        </div>
                    \`).join('');
                    dropdown.classList.add('open');
                } catch (e) {
                    console.error('Search failed', e);
                }
            }, 300);
        }

        function selectAnime(aniId, malId, title) {
            document.getElementById('search-dropdown').classList.remove('open');
            document.getElementById('anime-search').value = title;
            document.getElementById('id-type').value = 'ani';
            document.getElementById('anime-id').value = aniId;
            document.getElementById('ep-num').value = 1;
            updateEmbed();
        }

        // Close search dropdown on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                document.getElementById('search-dropdown').classList.remove('open');
            }
        });

        function escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        function escapeJs(str) {
            if (!str) return '';
            return String(str).replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'").replace(/"/g, '\\\\"');
        }

        document.addEventListener('DOMContentLoaded', updateEmbed);
    </script>
</body>
</html>`;
}
