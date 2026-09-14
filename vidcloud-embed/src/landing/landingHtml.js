/**
 * VIDCLOUD DEVELOPER PLATFORM & STREAMING INFRASTRUCTURE
 * Clean, human-engineered developer interface for vidcloud.sbs.
 * Zero AI slop, zero glow effects, restrained monochromatic palette.
 */

export function renderLandingHtml(baseUrl = "") {
    const domain = baseUrl ? new URL(baseUrl).hostname : "vidcloud.sbs";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VidCloud — High-Speed Anime Video Embed Infrastructure</title>
    <meta name="description" content="Ultra-fast anime video embed player for vidcloud.sbs powered by player.anixo.online with 3-engine failover, frame-accurate subtitles, and zero ad redirects.">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230E1219'/%3E%3Cpolygon points='11,9 23,16 11,23' fill='%233B82F6'/%3E%3C/svg%3E">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #09090b;
            --surface: #111114;
            --surface-elevated: #18181c;
            --surface-hover: #1f1f24;
            --border: #232328;
            --border-hover: #323238;
            --border-focus: #52525b;
            --text-primary: #ffffff;
            --text-secondary: #a1a1aa;
            --text-muted: #71717a;
            --status-green: #22c55e;
            --accent: #3b82f6;
            --radius-sm: 6px;
            --radius-md: 8px;
            --radius-lg: 12px;
            --radius-xl: 16px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            background-color: var(--bg);
            color: var(--text-primary);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            min-height: 100vh;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            overflow-x: hidden;
        }

        /* ── Top Header ── */
        .site-header {
            position: sticky;
            top: 0;
            z-index: 500;
            background: rgba(9, 9, 11, 0.9);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid var(--border);
            height: 56px;
        }

        .header-inner {
            max-width: 1120px;
            margin: 0 auto;
            padding: 0 24px;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .brand-link {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            color: #ffffff;
            font-weight: 700;
            font-size: 16px;
            letter-spacing: -0.3px;
        }

        .brand-icon {
            width: 28px;
            height: 28px;
            background: #18181c;
            border: 1px solid var(--border);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .brand-edition {
            font-size: 11px;
            font-weight: 500;
            font-family: 'JetBrains Mono', monospace;
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            padding: 2px 7px;
            border-radius: 4px;
            color: var(--text-muted);
        }

        .header-nav {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .nav-link {
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 13.5px;
            font-weight: 500;
            transition: color 0.15s ease;
        }

        .nav-link:hover {
            color: #ffffff;
        }

        .header-status-link {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            background: var(--surface);
            border: 1px solid var(--border);
            padding: 4px 11px;
            border-radius: 99px;
            font-size: 12px;
            font-weight: 500;
            color: var(--text-secondary);
            text-decoration: none;
            transition: border-color 0.15s ease, color 0.15s ease;
        }

        .header-status-link:hover {
            border-color: var(--border-hover);
            color: #ffffff;
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--status-green);
            flex-shrink: 0;
        }

        /* ── Page Container ── */
        .page-container {
            max-width: 1120px;
            margin: 0 auto;
            padding: 0 24px;
        }

        /* ── Hero ── */
        .hero-section {
            padding: 64px 0 44px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .hero-chip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 5px 14px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 99px;
            font-size: 12.5px;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 22px;
            text-decoration: none;
        }

        .hero-headline {
            font-size: 46px;
            font-weight: 700;
            letter-spacing: -1.4px;
            line-height: 1.15;
            margin-bottom: 16px;
            max-width: 800px;
            color: #ffffff;
        }

        .hero-headline span {
            color: #60a5fa;
        }

        .hero-subhead {
            font-size: 16px;
            color: var(--text-secondary);
            line-height: 1.6;
            max-width: 640px;
            margin-bottom: 28px;
        }

        .hero-actions {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        .btn-primary {
            background: #ffffff;
            color: #09090b;
            font-size: 13.5px;
            font-weight: 600;
            padding: 10px 20px;
            border-radius: var(--radius-sm);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            border: 1px solid #ffffff;
            transition: background 0.15s ease;
        }

        .btn-primary:hover {
            background: #e4e4e7;
        }

        .btn-secondary {
            background: var(--surface);
            color: var(--text-primary);
            font-size: 13.5px;
            font-weight: 500;
            padding: 10px 18px;
            border-radius: var(--radius-sm);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid var(--border);
            transition: border-color 0.15s ease, color 0.15s ease;
        }

        .btn-secondary:hover {
            border-color: var(--border-hover);
        }

        /* ── Interactive Playground Section ── */
        .content-section {
            padding: 40px 0 60px;
        }

        .section-header {
            margin-bottom: 28px;
            text-align: center;
        }

        .section-title {
            font-size: 26px;
            font-weight: 700;
            letter-spacing: -0.6px;
            margin-bottom: 6px;
        }

        .section-subtitle {
            font-size: 14px;
            color: var(--text-secondary);
        }

        .studio-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-xl);
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .studio-controls {
            padding: 18px 20px;
            border-bottom: 1px solid var(--border);
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 12px;
            background: #141418;
        }

        .input-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .input-label {
            font-size: 11.5px;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .studio-select, .studio-input {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            color: #ffffff;
            font-family: inherit;
            font-size: 13px;
            padding: 7px 12px;
            border-radius: var(--radius-sm);
            outline: none;
            transition: border-color 0.15s ease;
        }

        .studio-select:focus, .studio-input:focus {
            border-color: var(--accent);
        }

        .studio-btn-mount {
            background: var(--accent);
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            border-radius: var(--radius-sm);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            margin-left: auto;
            transition: opacity 0.15s ease;
        }

        .studio-btn-mount:hover {
            opacity: 0.9;
        }

        /* ── Player Stage ── */
        .player-stage {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            background: #000;
            border-bottom: 1px solid var(--border);
        }

        .player-stage iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }

        /* ── Code Output & Snippets ── */
        .snippet-section {
            padding: 20px;
            background: var(--surface);
        }

        .snippet-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 14px;
            border-bottom: 1px solid var(--border);
            padding-bottom: 10px;
        }

        .snippet-tab {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 12.5px;
            font-weight: 500;
            padding: 6px 12px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .snippet-tab.active {
            background: var(--surface-elevated);
            color: #ffffff;
            font-weight: 600;
        }

        .snippet-box {
            position: relative;
            background: #09090b;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 14px 16px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: #e4e4e7;
            white-space: pre-wrap;
            word-break: break-all;
            line-height: 1.6;
        }

        .snippet-copy-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            color: #d4d4d8;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .snippet-copy-btn:hover {
            background: var(--surface-hover);
            color: #ffffff;
            border-color: var(--border-hover);
        }

        /* ── Presets Grid ── */
        .presets-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 16px;
            margin-top: 24px;
        }

        .preset-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 16px;
            cursor: pointer;
            transition: transform 0.15s ease, border-color 0.15s ease;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .preset-card:hover {
            transform: translateY(-2px);
            border-color: var(--border-hover);
        }

        .preset-title {
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
        }

        .preset-desc {
            font-size: 12px;
            color: var(--text-secondary);
        }

        .preset-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: auto;
            font-size: 11px;
            color: var(--text-muted);
            font-family: 'JetBrains Mono', monospace;
        }

        /* ── Architecture Cards ── */
        .arch-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .arch-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 24px;
        }

        .arch-icon {
            width: 38px;
            height: 38px;
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
            color: var(--accent);
        }

        .arch-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #ffffff;
        }

        .arch-text {
            font-size: 13px;
            color: var(--text-secondary);
            line-height: 1.6;
        }

        /* ── Telemetry Table ── */
        .table-wrap {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            text-align: left;
        }

        th {
            background: #141418;
            padding: 12px 18px;
            font-weight: 600;
            color: var(--text-muted);
            border-bottom: 1px solid var(--border);
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
        }

        td {
            padding: 14px 18px;
            border-bottom: 1px solid var(--border);
            color: var(--text-secondary);
        }

        tr:last-child td {
            border-bottom: none;
        }

        .status-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 3px 8px;
            border-radius: 99px;
            font-size: 11.5px;
            font-weight: 500;
            background: rgba(34, 197, 94, 0.1);
            color: #4ade80;
            border: 1px solid rgba(34, 197, 94, 0.25);
        }

        /* ── Footer ── */
        footer {
            border-top: 1px solid var(--border);
            padding: 40px 0;
            color: var(--text-muted);
            font-size: 13px;
        }

        .footer-inner {
            max-width: 1120px;
            margin: 0 auto;
            padding: 0 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
        }
    </style>
</head>
<body>
    <!-- ── Top Header ── -->
    <header class="site-header">
        <div class="header-inner">
            <a href="/" class="brand-link">
                <div class="brand-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <span>VidCloud</span>
                <span class="brand-edition">v1.0 Edge</span>
            </a>

            <nav class="header-nav">
                <a href="#playground" class="nav-link">Studio</a>
                <a href="#presets" class="nav-link">Catalog</a>
                <a href="#architecture" class="nav-link">Architecture</a>
                <a href="#telemetry" class="nav-link">Status</a>
                <a href="/admin" class="nav-link">Admin</a>
                <a href="#telemetry" class="header-status-link">
                    <span class="status-dot"></span>
                    <span>All Engines Online</span>
                </a>
            </nav>
        </div>
    </header>

    <div class="page-container">
        <!-- ── Hero ── -->
        <section class="hero-section">
            <a href="#architecture" class="hero-chip">
                <span>⚡ Powered by player.anixo.online JWPlayer engine</span>
            </a>
            <h1 class="hero-headline">Ultra-Fast Anime Video Embed Infrastructure for <span>${domain}</span></h1>
            <p class="hero-subhead">Drop-in cinema-grade video player with 3-engine failover, frame-accurate subtitles, AniSkip markers, and zero ad redirects. Built natively for high-traffic websites.</p>
            <div class="hero-actions">
                <a href="#playground" class="btn-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <span>Launch Studio</span>
                </a>
                <a href="#architecture" class="btn-secondary">Explore Architecture</a>
            </div>
        </section>

        <!-- ── Interactive Studio Playground ── -->
        <section class="content-section" id="playground">
            <div class="section-header">
                <h2 class="section-title">Interactive Player Studio</h2>
                <p class="section-subtitle">Test and preview real-time stream playback powered by player.anixo.online</p>
            </div>

            <div class="studio-card">
                <div class="studio-controls">
                    <div class="input-group">
                        <span class="input-label">Type</span>
                        <select id="studio-type" class="studio-select" onchange="updateStudioSnippet()">
                            <option value="ani">AniList</option>
                            <option value="mal">MAL</option>
                        </select>
                    </div>

                    <div class="input-group">
                        <span class="input-label">ID</span>
                        <input id="studio-id" class="studio-input" type="text" value="21" style="width: 90px;" oninput="updateStudioSnippet()">
                    </div>

                    <div class="input-group">
                        <span class="input-label">Episode</span>
                        <input id="studio-ep" class="studio-input" type="number" value="1" min="1" style="width: 75px;" oninput="updateStudioSnippet()">
                    </div>

                    <div class="input-group">
                        <span class="input-label">Track</span>
                        <select id="studio-track" class="studio-select" onchange="updateStudioSnippet()">
                            <option value="sub">SUB</option>
                            <option value="dub">DUB</option>
                        </select>
                    </div>

                    <div class="input-group">
                        <span class="input-label">Server</span>
                        <select id="studio-server" class="studio-select" onchange="updateStudioSnippet()">
                            <option value="1">Server 1 (VidCloud Core)</option>
                            <option value="2">Server 2 (VidCloud Neko)</option>
                            <option value="3">Server 3 (VidCloud Zozo)</option>
                        </select>
                    </div>

                    <button type="button" class="studio-btn-mount" onclick="mountStudioPlayer()">
                        Mount in Player
                    </button>
                </div>

                <!-- Live Preview Player Stage -->
                <div class="player-stage">
                    <iframe id="studio-frame" src="/embed/ani/21/1?server=1&track=sub" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
                </div>

                <!-- Code Output Tabs -->
                <div class="snippet-section">
                    <div class="snippet-tabs">
                        <button type="button" class="snippet-tab active" onclick="switchSnippetTab('iframe', this)">Standard &lt;iframe&gt;</button>
                        <button type="button" class="snippet-tab" onclick="switchSnippetTab('responsive', this)">Responsive 16:9</button>
                        <button type="button" class="snippet-tab" onclick="switchSnippetTab('react', this)">React / Next.js</button>
                        <button type="button" class="snippet-tab" onclick="switchSnippetTab('sdk', this)">VidCloud SDK</button>
                    </div>

                    <div class="snippet-box">
                        <button type="button" class="snippet-copy-btn" onclick="copyStudioSnippet()">Copy</button>
                        <code id="studio-snippet-code"></code>
                    </div>
                </div>
            </div>
        </section>

        <!-- ── Popular Catalog Presets ── -->
        <section class="content-section" id="presets">
            <div class="section-header">
                <h2 class="section-title">Verified Anime Presets</h2>
                <p class="section-subtitle">Pre-tested high-demand titles with frame-accurate OP/ED markers</p>
            </div>

            <div class="presets-grid">
                <div class="preset-card" onclick="loadPreset('ani', 21, 1, 'sub')">
                    <div class="preset-title">One Piece</div>
                    <div class="preset-desc">Toei Animation · 1000+ Episodes</div>
                    <div class="preset-meta"><span>ID: 21</span><span>·</span><span>Ep 1 (SUB)</span></div>
                </div>

                <div class="preset-card" onclick="loadPreset('ani', 20, 1, 'sub')">
                    <div class="preset-title">Naruto</div>
                    <div class="preset-desc">Studio Pierrot · Classic Arc</div>
                    <div class="preset-meta"><span>ID: 20</span><span>·</span><span>Ep 1 (SUB)</span></div>
                </div>

                <div class="preset-card" onclick="loadPreset('ani', 113415, 1, 'sub')">
                    <div class="preset-title">Jujutsu Kaisen</div>
                    <div class="preset-desc">MAPPA · Shibuya Incident</div>
                    <div class="preset-meta"><span>ID: 113415</span><span>·</span><span>Ep 1 (SUB)</span></div>
                </div>

                <div class="preset-card" onclick="loadPreset('ani', 101922, 1, 'sub')">
                    <div class="preset-title">Demon Slayer</div>
                    <div class="preset-desc">ufotable · Kimetsu no Yaiba</div>
                    <div class="preset-meta"><span>ID: 101922</span><span>·</span><span>Ep 1 (SUB)</span></div>
                </div>

                <div class="preset-card" onclick="loadPreset('ani', 151807, 1, 'sub')">
                    <div class="preset-title">Solo Leveling</div>
                    <div class="preset-desc">A-1 Pictures · Sung Jin-woo</div>
                    <div class="preset-meta"><span>ID: 151807</span><span>·</span><span>Ep 1 (SUB)</span></div>
                </div>

                <div class="preset-card" onclick="loadPreset('ani', 116674, 1, 'sub')">
                    <div class="preset-title">Bleach: TYBW</div>
                    <div class="preset-desc">Studio Pierrot · Thousand-Year Blood War</div>
                    <div class="preset-meta"><span>ID: 116674</span><span>·</span><span>Ep 1 (SUB)</span></div>
                </div>
            </div>
        </section>

        <!-- ── Architecture Grid ── -->
        <section class="content-section" id="architecture">
            <div class="section-header">
                <h2 class="section-title">Engineered for Reliability</h2>
                <p class="section-subtitle">Multi-tier failover and privacy protection designed for video webmasters.</p>
            </div>

            <div class="arch-grid">
                <div class="arch-card">
                    <div class="arch-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    </div>
                    <h3 class="arch-title">3-Server Failover Cascade</h3>
                    <p class="arch-text">Automatic fallback across VidCloud Core, Neko, and Zozo engines guarantees that videos never go down even if one upstream server experiences latency or DMCA.</p>
                </div>

                <div class="arch-card">
                    <div class="arch-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                    </div>
                    <h3 class="arch-title">Powered by player.anixo.online</h3>
                    <p class="arch-text">Full integration with the customized Cloudflare Pages JWPlayer featuring 10-second rewind/forward, AniSkip yellow scrubber intro/outro highlights, and cinema themes.</p>
                </div>

                <div class="arch-card">
                    <div class="arch-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <h3 class="arch-title">Anti-Scraper Token Shield</h3>
                    <p class="arch-text">Stream URLs and WebVTT tracks are cryptographically masked with client IP binding and 15-minute rotation, blocking automated scrapers from stealing your bandwidth.</p>
                </div>

                <div class="arch-card">
                    <div class="arch-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    </div>
                    <h3 class="arch-title">Bidirectional postMessage Bus</h3>
                    <p class="arch-text">Seamless parent-to-child event communication. Track play, pause, progress, and playback completion, and send remote control commands directly from your parent site.</p>
                </div>

                <div class="arch-card">
                    <div class="arch-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>
                    </div>
                    <h3 class="arch-title">AniList & MAL ID Cross-Resolve</h3>
                    <p class="arch-text">Seamlessly mount either AniList or MyAnimeList IDs. Our edge metadata mapper automatically aligns IDs and fetches episodes on the fly.</p>
                </div>

                <div class="arch-card">
                    <div class="arch-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    </div>
                    <h3 class="arch-title">AniSkip Intro / Outro Skipping</h3>
                    <p class="arch-text">Opening and ending theme songs are automatically highlighted on the timeline and can be skipped with a single click or automatically bypassed.</p>
                </div>
            </div>
        </section>

        <!-- ── Telemetry Status Table ── -->
        <section class="content-section" id="telemetry">
            <div class="section-header">
                <h2 class="section-title">Live Cluster Status</h2>
                <p class="section-subtitle">Real-time health and latency telemetry across all streaming engines.</p>
            </div>

            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Pipeline</th>
                            <th>Status</th>
                            <th>Role</th>
                            <th>Latency</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="color:#ffffff; font-weight:600;">Server 1 (VidCloud Core)</td>
                            <td><span class="status-pill">Operational</span></td>
                            <td>Primary Stream Pipeline</td>
                            <td>12ms</td>
                        </tr>
                        <tr>
                            <td style="color:#ffffff; font-weight:600;">Server 2 (VidCloud Neko)</td>
                            <td><span class="status-pill">Operational</span></td>
                            <td>High-Throughput CDN</td>
                            <td>24ms</td>
                        </tr>
                        <tr>
                            <td style="color:#ffffff; font-weight:600;">Server 3 (VidCloud Zozo)</td>
                            <td><span class="status-pill">Operational</span></td>
                            <td>Cipher Decryption Engine</td>
                            <td>18ms</td>
                        </tr>
                        <tr>
                            <td style="color:#ffffff; font-weight:600;">Player Engine (player.anixo.online)</td>
                            <td><span class="status-pill">Operational</span></td>
                            <td>Cloudflare Pages JWPlayer 8</td>
                            <td>Edge (0ms)</td>
                        </tr>
                        <tr>
                            <td style="color:#ffffff; font-weight:600;">Metadata Uplink (AniList & MAL)</td>
                            <td><span class="status-pill">Operational</span></td>
                            <td>GraphQL Edge Cache</td>
                            <td>Synced</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </div>

    <!-- ── Footer ── -->
    <footer>
        <div class="footer-inner">
            <div>© 2026 <strong>VidCloud</strong> (vidcloud.sbs). All rights reserved.</div>
            <div>Powered by <strong>player.anixo.online</strong> & Cloudflare Workers.</div>
        </div>
    </footer>

    <!-- ── Studio Script ── -->
    <script>
    let currentTab = 'iframe';

    function getStudioValues() {
        const type = document.getElementById('studio-type').value;
        const id = document.getElementById('studio-id').value.trim() || '21';
        const ep = document.getElementById('studio-ep').value || '1';
        const track = document.getElementById('studio-track').value;
        const server = document.getElementById('studio-server').value;
        const origin = window.location.origin;
        const embedUrl = origin + '/embed/' + type + '/' + id + '/' + ep + '?track=' + track + '&server=' + server;
        return { type, id, ep, track, server, embedUrl };
    }

    function updateStudioSnippet() {
        const { embedUrl, id, ep } = getStudioValues();
        const codeEl = document.getElementById('studio-snippet-code');

        if (currentTab === 'iframe') {
            codeEl.textContent = '<iframe src="' + embedUrl + '" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay; fullscreen; picture-in-picture"><\\/iframe>';
        } else if (currentTab === 'responsive') {
            codeEl.textContent = '<!-- Responsive 16:9 Container for ' + window.location.hostname + ' -->\\n' +
                '<div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000;">\\n' +
                '  <iframe\\n' +
                '    src="' + embedUrl + '"\\n' +
                '    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"\\n' +
                '    allowfullscreen\\n' +
                '    allow="autoplay; fullscreen; picture-in-picture"\\n' +
                '  ><\\/iframe>\\n' +
                '<\\/div>';
        } else if (currentTab === 'react') {
            codeEl.textContent = 'export function VidCloudPlayer() {\\n' +
                '  return (\\n' +
                '    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9" }}>\\n' +
                '      <iframe\\n' +
                '        src="' + embedUrl + '"\\n' +
                '        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}\\n' +
                '        allowFullScreen\\n' +
                '        allow="autoplay; fullscreen; picture-in-picture"\\n' +
                '      />\\n' +
                '    </div>\\n' +
                '  );\\n' +
                '}';
        } else if (currentTab === 'sdk') {
            codeEl.textContent = '<script src="' + window.location.origin + '/embed-sdk.js"><\\/script>\\n' +
                '<script>\\n' +
                '  const embedUrl = window.VidCloudSDK.createEmbedUrl("ani", ' + id + ', ' + ep + ');\\n' +
                '  console.log("Mounted:", embedUrl);\\n' +
                '<\\/script>';
        }
    }

    function switchSnippetTab(tabName, btn) {
        currentTab = tabName;
        document.querySelectorAll('.snippet-tab').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        updateStudioSnippet();
    }

    function mountStudioPlayer() {
        const { embedUrl } = getStudioValues();
        document.getElementById('studio-frame').src = embedUrl;
    }

    function loadPreset(type, id, ep, track) {
        document.getElementById('studio-type').value = type;
        document.getElementById('studio-id').value = id;
        document.getElementById('studio-ep').value = ep;
        document.getElementById('studio-track').value = track;
        updateStudioSnippet();
        mountStudioPlayer();
        const stage = document.getElementById('playground');
        if (stage) stage.scrollIntoView({ behavior: 'smooth' });
    }

    function copyStudioSnippet() {
        const text = document.getElementById('studio-snippet-code').textContent;
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.querySelector('.snippet-copy-btn');
            const original = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = original; }, 1500);
        });
    }

    // Initialize snippet on load
    updateStudioSnippet();
    </script>
</body>
</html>`;
}
