/**
 * PROFESSIONAL DEVELOPER PORTAL & PLAYGROUND
 * Strictly NO GLOW EFFECTS and NO AI SLOP.
 * Engineered to modern Linear / Vercel / Stripe developer platform standards:
 * crisp typography, obsidian surfaces, hairline borders, spotlight search,
 * multi-format code exporter, and comprehensive API documentation.
 */

export function renderLandingHtml(baseUrl = "") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AniEmbed — High-Performance Public Anime Embed Provider</title>
    <meta name="description" content="Production-ready public anime embed provider with 3-engine failover, AniList/MAL mapping, adaptive HLS, custom WebVTT subtitles, and zero ads.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #090a0f;
            --bg-elevated: #0e1117;
            --surface: #12151d;
            --surface-hover: #181d28;
            --surface-active: #1f2533;
            --border: rgba(255, 255, 255, 0.08);
            --border-hover: rgba(255, 255, 255, 0.16);
            --border-strong: rgba(255, 255, 255, 0.22);
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --text-muted: #64748b;
            --accent-blue: #3b82f6;
            --accent-blue-hover: #2563eb;
            --accent-bg: rgba(59, 130, 246, 0.12);
            --success: #10b981;
            --success-bg: rgba(16, 185, 129, 0.12);
            --radius-sm: 6px;
            --radius-md: 10px;
            --radius-lg: 14px;
            --radius-xl: 18px;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
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

        /* ── Header / Navigation Bar ── */
        .site-header {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: rgba(9, 10, 15, 0.85);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid var(--border);
            height: 64px;
        }

        .header-inner {
            max-width: 1320px;
            margin: 0 auto;
            padding: 0 24px;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .brand-group {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
        }

        .brand-logo {
            width: 32px;
            height: 32px;
            background: #ffffff;
            border-radius: 7px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #090a0f;
            flex-shrink: 0;
        }

        .brand-logo svg {
            width: 18px;
            height: 18px;
        }

        .brand-text {
            display: flex;
            align-items: baseline;
            gap: 8px;
        }

        .brand-title {
            font-size: 16px;
            font-weight: 700;
            letter-spacing: -0.3px;
            color: #ffffff;
        }

        .brand-version {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-muted);
            font-family: 'JetBrains Mono', monospace;
            background: rgba(255, 255, 255, 0.05);
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid var(--border);
        }

        .header-nav {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .nav-link {
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary);
            text-decoration: none;
            transition: color 0.15s ease;
        }

        .nav-link:hover {
            color: #ffffff;
        }

        .engine-status-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--surface);
            border: 1px solid var(--border);
            padding: 5px 12px;
            border-radius: 100px;
            font-size: 12px;
            font-family: 'JetBrains Mono', monospace;
            color: var(--text-secondary);
        }

        .status-beacon {
            position: relative;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--success);
        }

        .status-beacon::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.35);
            animation: pulse-beacon 2s ease-in-out infinite;
        }

        @keyframes pulse-beacon {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.6); opacity: 0; }
        }

        /* ── Container Layout ── */
        .container {
            max-width: 1320px;
            margin: 0 auto;
            padding: 40px 24px 80px;
        }

        /* ── Hero Section ── */
        .hero {
            padding-bottom: 36px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 36px;
        }

        .hero-badge-strip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--border);
            padding: 4px 12px;
            border-radius: 100px;
            font-size: 12px;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 16px;
        }

        .hero-badge-strip .tag {
            color: #ffffff;
            font-weight: 600;
        }

        .hero-title {
            font-size: 34px;
            font-weight: 800;
            letter-spacing: -0.8px;
            line-height: 1.2;
            color: #ffffff;
            margin-bottom: 12px;
            max-width: 900px;
        }

        .hero-desc {
            font-size: 15px;
            color: var(--text-secondary);
            line-height: 1.6;
            max-width: 820px;
            margin-bottom: 24px;
        }

        .feature-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .feature-chip {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            background: var(--surface);
            border: 1px solid var(--border);
            padding: 6px 12px;
            border-radius: var(--radius-sm);
            font-size: 12px;
            font-weight: 500;
            color: var(--text-secondary);
        }

        .feature-chip svg {
            width: 14px;
            height: 14px;
            color: var(--text-muted);
        }

        /* ── Main Workspace Grid ── */
        .workspace-grid {
            display: grid;
            grid-template-columns: 460px 1fr;
            gap: 28px;
            align-items: start;
            margin-bottom: 56px;
        }

        @media (max-width: 1080px) {
            .workspace-grid {
                grid-template-columns: 1fr;
            }
        }

        /* ── Unified Surface Card ── */
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
        }

        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            padding-bottom: 14px;
            border-bottom: 1px solid var(--border);
        }

        .card-title-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .card-title-icon {
            width: 26px;
            height: 26px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
        }

        .card-title-icon svg {
            width: 14px;
            height: 14px;
        }

        .card-title {
            font-size: 15px;
            font-weight: 600;
            color: #ffffff;
            letter-spacing: -0.2px;
        }

        /* ── Spotlight Search Input ── */
        .search-box-wrapper {
            position: relative;
            margin-bottom: 18px;
        }

        .search-input-group {
            position: relative;
            display: flex;
            align-items: center;
        }

        .search-input-icon {
            position: absolute;
            left: 14px;
            width: 16px;
            height: 16px;
            color: var(--text-muted);
            pointer-events: none;
        }

        .search-input {
            width: 100%;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            color: #ffffff;
            font-family: inherit;
            font-size: 13.5px;
            padding: 11px 14px 11px 40px;
            border-radius: var(--radius-sm);
            outline: none;
            transition: border-color 0.15s ease, background-color 0.15s ease;
        }

        .search-input:focus {
            border-color: var(--border-strong);
            background: #11141c;
        }

        .search-input::placeholder {
            color: var(--text-muted);
        }

        .search-dropdown {
            position: absolute;
            top: calc(100% + 6px);
            left: 0;
            right: 0;
            background: #0f121a;
            border: 1px solid var(--border-hover);
            border-radius: var(--radius-md);
            max-height: 360px;
            overflow-y: auto;
            z-index: 500;
            display: none;
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
        }

        .search-dropdown.open {
            display: block;
        }

        .search-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 10px 14px;
            border-bottom: 1px solid var(--border);
            cursor: pointer;
            transition: background 0.12s ease;
        }

        .search-item:last-child {
            border-bottom: none;
        }

        .search-item:hover {
            background: var(--surface-hover);
        }

        .search-item-poster {
            width: 36px;
            height: 48px;
            object-fit: cover;
            border-radius: 4px;
            background: #1a1e29;
            flex-shrink: 0;
            border: 1px solid var(--border);
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
            margin-top: 3px;
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
        }

        .search-item-tag {
            font-family: 'JetBrains Mono', monospace;
            background: rgba(255, 255, 255, 0.05);
            padding: 1px 5px;
            border-radius: 3px;
            border: 1px solid var(--border);
        }

        /* ── Preset Chips ── */
        .preset-section {
            margin-bottom: 20px;
        }

        .preset-label {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            margin-bottom: 8px;
            display: block;
        }

        .preset-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .chip {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 12px;
            font-weight: 500;
            padding: 5px 10px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .chip:hover {
            background: var(--surface-hover);
            color: #ffffff;
            border-color: var(--border-hover);
        }

        .chip.active {
            background: #ffffff;
            color: #090a0f;
            border-color: #ffffff;
            font-weight: 600;
        }

        /* ── Form Controls ── */
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .form-group.full {
            grid-column: span 2;
        }

        .field-label {
            font-size: 11.5px;
            font-weight: 500;
            color: var(--text-secondary);
        }

        .form-control {
            width: 100%;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            color: #ffffff;
            font-family: inherit;
            font-size: 13px;
            padding: 9px 12px;
            border-radius: var(--radius-sm);
            outline: none;
            transition: border-color 0.15s ease, background 0.15s ease;
        }

        .form-control:focus {
            border-color: var(--border-strong);
            background: #11141c;
        }

        select.form-control {
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 10px center;
            padding-right: 30px;
        }

        select.form-control option {
            background: #11141c;
            color: #ffffff;
        }

        /* ── Code Export Card ── */
        .code-box {
            background: #08090d;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            overflow: hidden;
        }

        .code-tabs-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--border);
            height: 38px;
        }

        .code-tabs {
            display: flex;
            gap: 2px;
        }

        .code-tab {
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: 11.5px;
            font-weight: 500;
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            transition: color 0.15s ease, background 0.15s ease;
        }

        .code-tab:hover {
            color: var(--text-primary);
        }

        .code-tab.active {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.08);
            font-weight: 600;
        }

        .btn-copy {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid var(--border);
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11.5px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .btn-copy:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: var(--border-hover);
        }

        .btn-copy.copied {
            background: var(--success);
            border-color: var(--success);
            color: #090a0f;
            font-weight: 600;
        }

        .code-display {
            padding: 14px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            line-height: 1.5;
            color: #cbd5e1;
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-all;
        }

        /* ── Right Column: Live Player Preview Window ── */
        .preview-window {
            background: #090a0f;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            overflow: hidden;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
        }

        .preview-window-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 14px;
            background: #11141c;
            border-bottom: 1px solid var(--border);
            gap: 12px;
        }

        .window-dots {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .window-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }

        .window-dot.close { background: #ef4444; opacity: 0.8; }
        .window-dot.min { background: #eab308; opacity: 0.8; }
        .window-dot.max { background: #22c55e; opacity: 0.8; }

        .window-url-bar {
            flex: 1;
            max-width: 520px;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 4px 10px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11.5px;
            color: var(--text-secondary);
            overflow: hidden;
        }

        .url-lock-icon {
            width: 11px;
            height: 11px;
            color: var(--success);
            flex-shrink: 0;
        }

        .window-url-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .window-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .window-action-btn {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: all 0.15s ease;
        }

        .window-action-btn:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.05);
            border-color: var(--border-hover);
        }

        .preview-iframe-wrapper {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            background: #000000;
        }

        .preview-iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }

        .preview-diagnostics {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 16px;
            background: #0d1017;
            border-top: 1px solid var(--border);
            font-size: 11.5px;
            color: var(--text-muted);
            flex-wrap: wrap;
            gap: 8px;
        }

        .preview-diagnostics-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .diagnostic-tag {
            font-family: 'JetBrains Mono', monospace;
            color: var(--text-secondary);
        }

        /* ── Documentation Tables & API Reference ── */
        .docs-section {
            margin-top: 24px;
        }

        .section-header {
            margin-bottom: 20px;
        }

        .section-title {
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.4px;
            margin-bottom: 6px;
        }

        .section-subtitle {
            font-size: 13.5px;
            color: var(--text-secondary);
        }

        .table-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            overflow: hidden;
            margin-bottom: 40px;
        }

        .modern-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }

        .modern-table th {
            background: rgba(255, 255, 255, 0.02);
            padding: 12px 18px;
            text-align: left;
            font-weight: 600;
            color: var(--text-secondary);
            font-size: 11.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid var(--border);
        }

        .modern-table td {
            padding: 14px 18px;
            border-bottom: 1px solid var(--border);
            color: var(--text-primary);
            vertical-align: top;
        }

        .modern-table tr:last-child td {
            border-bottom: none;
        }

        .modern-table tr:hover td {
            background: rgba(255, 255, 255, 0.015);
        }

        .type-badge {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            padding: 2px 7px;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            display: inline-block;
        }

        .default-badge {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            padding: 2px 7px;
            border-radius: 4px;
            background: var(--accent-bg);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #93c5fd;
            display: inline-block;
        }

        .code-inline {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            padding: 2px 6px;
            border-radius: 4px;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            color: #ffffff;
        }

        /* ── PostMessage Events Grid ── */
        .events-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 40px;
        }

        @media (max-width: 860px) {
            .events-grid {
                grid-template-columns: 1fr;
            }
        }

        .event-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 18px;
        }

        .event-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        .event-direction {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
        }

        .event-desc {
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 12px;
            line-height: 1.5;
        }

        /* ── Footer ── */
        footer {
            border-top: 1px solid var(--border);
            padding: 32px 0 0;
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: var(--text-muted);
            font-size: 12.5px;
            flex-wrap: wrap;
            gap: 16px;
        }

        .footer-links {
            display: flex;
            gap: 20px;
        }

        .footer-links a {
            color: var(--text-secondary);
            text-decoration: none;
            transition: color 0.15s ease;
        }

        .footer-links a:hover {
            color: #ffffff;
        }

        /* ── Responsive adjustments ── */
        @media (max-width: 768px) {
            .header-nav { display: none; }
            .hero-title { font-size: 26px; }
            .container { padding: 24px 16px 60px; }
            .form-grid { grid-template-columns: 1fr; }
            .form-group.full { grid-column: span 1; }
        }
    </style>
</head>
<body>
    <!-- Top Navigation -->
    <header class="site-header">
        <div class="header-inner">
            <a href="/" class="brand-group">
                <div class="brand-logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                </div>
                <div class="brand-text">
                    <span class="brand-title">AniEmbed</span>
                    <span class="brand-version">v1.0.0</span>
                </div>
            </a>

            <div class="header-nav">
                <a href="#playground" class="nav-link">Playground</a>
                <a href="#routes" class="nav-link">URL Schema</a>
                <a href="#parameters" class="nav-link">Parameters</a>
                <a href="#events" class="nav-link">Events API</a>
                <div class="engine-status-pill">
                    <span class="status-beacon"></span>
                    <span>3 ENGINES ONLINE</span>
                </div>
            </div>
        </div>
    </header>

    <div class="container">
        <!-- Hero Section -->
        <section class="hero">
            <div class="hero-badge-strip">
                <span class="tag">PUBLIC EDGE API</span>
                <span>•</span>
                <span>Zero-Ad Anime Streaming Service</span>
            </div>
            <h1 class="hero-title">High-Performance Anime Embed Engine</h1>
            <p class="hero-desc">
                Production-grade, ad-free iframe video player with automated 3-server failover (MegaPlay, AniNeko, Zoko), AniList/MAL metadata binding, HLS adaptive bitrate, touch seek gestures, and real-time WebVTT subtitles.
            </p>
            <div class="feature-chips">
                <div class="feature-chip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                    <span>Zero Ads & Distractions</span>
                </div>
                <div class="feature-chip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <span>Automatic Multi-Server Failover</span>
                </div>
                <div class="feature-chip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>
                    <span>WebVTT Subtitles Overlay</span>
                </div>
                <div class="feature-chip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 6 4 14-8-5-8 5 4-14-5-4h6l2-6 2 6h6z"/></svg>
                    <span>Auto-Skip OP / ED Timestamps</span>
                </div>
            </div>
        </section>

        <!-- Main Playground Grid -->
        <div class="workspace-grid" id="playground">
            <!-- Left Column: Embed Generator -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title-group">
                        <div class="card-title-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                        </div>
                        <span class="card-title">Embed Studio</span>
                    </div>
                </div>

                <!-- Spotlight Anime Search Input -->
                <div class="search-box-wrapper">
                    <label class="field-label" style="margin-bottom: 6px; display: block;">Search Anime Title (AniList / MAL)</label>
                    <div class="search-input-group">
                        <svg class="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" class="search-input" id="anime-search" placeholder="Type title (e.g. Naruto, One Piece, Frieren)..." autocomplete="off" oninput="onSearchInput(this.value)">
                    </div>
                    <div class="search-dropdown" id="search-dropdown"></div>
                </div>

                <!-- Preset Quick Picks -->
                <div class="preset-section">
                    <span class="preset-label">Popular Presets</span>
                    <div class="preset-chips">
                        <span class="chip active" onclick="applyPreset('ani', 21, 1, 'sub', 'One Piece', this)">One Piece (Ani 21)</span>
                        <span class="chip" onclick="applyPreset('mal', 20, 1, 'sub', 'Naruto', this)">Naruto (MAL 20)</span>
                        <span class="chip" onclick="applyPreset('ani', 151807, 1, 'sub', 'Solo Leveling S2', this)">Solo Leveling S2</span>
                        <span class="chip" onclick="applyPreset('ani', 154587, 1, 'sub', 'Frieren', this)">Frieren</span>
                        <span class="chip" onclick="applyPreset('ani', 113415, 1, 'sub', 'Jujutsu Kaisen', this)">Jujutsu Kaisen</span>
                    </div>
                </div>

                <!-- Parameters Form Grid -->
                <div class="form-grid">
                    <div class="form-group">
                        <label class="field-label" for="id-type">ID Type</label>
                        <select id="id-type" class="form-control" onchange="updateEmbed()">
                            <option value="ani" selected>AniList ID</option>
                            <option value="mal">MyAnimeList ID</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="field-label" for="anime-id">Anime ID</label>
                        <input type="text" id="anime-id" class="form-control" value="21" oninput="updateEmbed()">
                    </div>

                    <div class="form-group">
                        <label class="field-label" for="ep-num">Episode Number</label>
                        <input type="number" id="ep-num" class="form-control" value="1" min="1" oninput="updateEmbed()">
                    </div>

                    <div class="form-group">
                        <label class="field-label" for="track-select">Audio Track</label>
                        <select id="track-select" class="form-control" onchange="updateEmbed()">
                            <option value="sub" selected>Subbed (Japanese)</option>
                            <option value="dub">Dubbed (English)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="field-label" for="server-select">Preferred Route</label>
                        <select id="server-select" class="form-control" onchange="updateEmbed()">
                            <option value="1" selected>Server 1 (MegaPlay • Primary)</option>
                            <option value="2">Server 2 (AniNeko • Fast CDN)</option>
                            <option value="3">Server 3 (Zoko • XOR Engine)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="field-label" for="autoplay-select">Autoplay</label>
                        <select id="autoplay-select" class="form-control" onchange="updateEmbed()">
                            <option value="1" selected>Enabled (1)</option>
                            <option value="0">Disabled (0)</option>
                        </select>
                    </div>

                    <div class="form-group full">
                        <label class="field-label" for="autoskip-select">Auto-Skip Opening/Ending</label>
                        <select id="autoskip-select" class="form-control" onchange="updateEmbed()">
                            <option value="1" selected>Enabled (1) — Auto-Skip Intro & Outro</option>
                            <option value="0">Disabled (0) — Show Skip Buttons Only</option>
                        </select>
                    </div>
                </div>

                <!-- Code Exporter -->
                <div class="code-box">
                    <div class="code-tabs-bar">
                        <div class="code-tabs">
                            <button class="code-tab active" onclick="switchCodeTab('iframe', this)">HTML Iframe</button>
                            <button class="code-tab" onclick="switchCodeTab('react', this)">React / Next.js</button>
                            <button class="code-tab" onclick="switchCodeTab('url', this)">Direct URL</button>
                        </div>
                        <button class="btn-copy" id="btn-copy" onclick="copyActiveCode()">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            <span id="btn-copy-text">Copy</span>
                        </button>
                    </div>
                    <pre class="code-display"><code id="code-snippet"></code></pre>
                </div>
            </div>

            <!-- Right Column: Live Embed Preview -->
            <div class="card" style="padding: 0; overflow: hidden;">
                <div class="preview-window">
                    <div class="preview-window-topbar">
                        <div class="window-dots">
                            <div class="window-dot close"></div>
                            <div class="window-dot min"></div>
                            <div class="window-dot max"></div>
                        </div>
                        <div class="window-url-bar">
                            <svg class="url-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            <span class="window-url-text" id="window-url-text">/embed/ani/21/1</span>
                        </div>
                        <div class="window-actions">
                            <a class="window-action-btn" id="preview-open-link" href="#" target="_blank" title="Open in new window">
                                <span>Open Full</span>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            </a>
                        </div>
                    </div>

                    <div class="preview-iframe-wrapper">
                        <iframe class="preview-iframe" id="live-iframe" src="" allowfullscreen allow="autoplay; fullscreen; picture-in-picture"></iframe>
                    </div>

                    <div class="preview-diagnostics">
                        <div class="preview-diagnostics-left">
                            <span>Failover: <strong style="color:#ffffff;">1 &rarr; 2 &rarr; 3</strong></span>
                            <span>•</span>
                            <span>Engine: <span class="diagnostic-tag" id="active-engine-tag">Server 1</span></span>
                        </div>
                        <div>
                            <span class="diagnostic-tag" id="active-track-tag">Japanese Audio (Subbed)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Documentation: URL Structure -->
        <section class="docs-section" id="routes">
            <div class="section-header">
                <h2 class="section-title">Embed URL Schema</h2>
                <p class="section-subtitle">AniEmbed exposes both clean path-based endpoints and query-parameter based integration routes.</p>
            </div>
            <div class="table-card">
                <table class="modern-table">
                    <thead>
                        <tr>
                            <th style="width: 32%;">Route Pattern</th>
                            <th style="width: 28%;">Parameters</th>
                            <th>Direct Live Example</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code class="code-inline">/embed/ani/:anilistId/:episode</code></td>
                            <td><span class="type-badge">anilistId: number</span>, <span class="type-badge">episode: number</span></td>
                            <td><a href="${baseUrl}/embed/ani/21/1" target="_blank" style="color:var(--accent-blue); text-decoration:none;">${baseUrl}/embed/ani/21/1 &nearr;</a></td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">/embed/mal/:malId/:episode</code></td>
                            <td><span class="type-badge">malId: number</span>, <span class="type-badge">episode: number</span></td>
                            <td><a href="${baseUrl}/embed/mal/20/1" target="_blank" style="color:var(--accent-blue); text-decoration:none;">${baseUrl}/embed/mal/20/1 &nearr;</a></td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">/embed?anilist=21&ep=1</code></td>
                            <td><span class="type-badge">anilist: number</span>, <span class="type-badge">ep: number</span>, <span class="type-badge">track: sub|dub</span></td>
                            <td><a href="${baseUrl}/embed?anilist=21&ep=1&track=sub" target="_blank" style="color:var(--accent-blue); text-decoration:none;">${baseUrl}/embed?anilist=21&ep=1&track=sub &nearr;</a></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Documentation: Query Parameters -->
        <section class="docs-section" id="parameters">
            <div class="section-header">
                <h2 class="section-title">Query Parameters Reference</h2>
                <p class="section-subtitle">Customize audio, server failover order, autoplay, and automated chapter skips on any embed route.</p>
            </div>
            <div class="table-card">
                <table class="modern-table">
                    <thead>
                        <tr>
                            <th style="width: 18%;">Parameter</th>
                            <th style="width: 14%;">Type</th>
                            <th style="width: 14%;">Default</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code class="code-inline">track</code></td>
                            <td><span class="type-badge">sub | dub</span></td>
                            <td><span class="default-badge">sub</span></td>
                            <td>Audio language track. Supports Japanese original with English subtitles (<code class="code-inline">sub</code>) or English voiceover (<code class="code-inline">dub</code>).</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">server</code></td>
                            <td><span class="type-badge">1 | 2 | 3</span></td>
                            <td><span class="default-badge">1</span></td>
                            <td>Preferred stream server: <strong>1</strong> (MegaPlay / Mikora Edge), <strong>2</strong> (AniNeko / StreamHG), <strong>3</strong> (Zoko / XOR). If the preferred server is unavailable, the player automatically cascades to the next available route without user intervention.</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">autoPlay</code></td>
                            <td><span class="type-badge">1 | 0</span></td>
                            <td><span class="default-badge">1</span></td>
                            <td>Whether video playback commences automatically. If browser restrictions block unmuted autoplay, the player smoothly starts playback muted and presents an unmute toggle.</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">autoNext</code></td>
                            <td><span class="type-badge">1 | 0</span></td>
                            <td><span class="default-badge">1</span></td>
                            <td>Automatically transitions to the subsequent episode when the video completes.</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">autoSkip</code></td>
                            <td><span class="type-badge">1 | 0</span></td>
                            <td><span class="default-badge">1</span></td>
                            <td>Automatically skips opening (OP) and ending (ED) credits when timestamps match. Set to <code class="code-inline">0</code> to show the manual cinema "Skip Intro" button without auto-jumping.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Documentation: PostMessage Event API -->
        <section class="docs-section" id="events">
            <div class="section-header">
                <h2 class="section-title">PostMessage Events API (Parent &harr; Iframe)</h2>
                <p class="section-subtitle">Full bidirectional JavaScript communication between your host application and the embedded player.</p>
            </div>
            <div class="events-grid">
                <div class="event-card">
                    <div class="event-card-header">
                        <code class="code-inline">aniembed:play</code>
                        <span class="event-direction">Iframe &rarr; Parent</span>
                    </div>
                    <p class="event-desc">Fired when the player starts playing video. Contains <code class="code-inline">currentTime</code> and episode metadata.</p>
                </div>
                <div class="event-card">
                    <div class="event-card-header">
                        <code class="code-inline">aniembed:timeupdate</code>
                        <span class="event-direction">Iframe &rarr; Parent</span>
                    </div>
                    <p class="event-desc">Fired continuously during playback with <code class="code-inline">currentTime</code> and <code class="code-inline">duration</code> for progress synchronization in host platform database.</p>
                </div>
                <div class="event-card">
                    <div class="event-card-header">
                        <code class="code-inline">aniembed:ended</code>
                        <span class="event-direction">Iframe &rarr; Parent</span>
                    </div>
                    <p class="event-desc">Fired when an episode finishes. Allows your host platform to mark an episode as watched in user history.</p>
                </div>
                <div class="event-card">
                    <div class="event-card-header">
                        <code class="code-inline">{ action: "play" | "pause" }</code>
                        <span class="event-direction">Parent &rarr; Iframe</span>
                    </div>
                    <p class="event-desc">Send remote control commands to the iframe via <code class="code-inline">iframe.contentWindow.postMessage({ action: 'play' }, '*')</code>.</p>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer>
            <div>
                &copy; ${new Date().getFullYear()} AniEmbed Provider • Zero-Ad Cinema Streaming Engine
            </div>
            <div class="footer-links">
                <a href="#playground">Playground</a>
                <a href="#routes">Routes</a>
                <a href="#parameters">Parameters</a>
                <a href="/health" target="_blank">Engine Health</a>
            </div>
        </footer>
    </div>

    <!-- Client Script -->
    <script>
        let searchTimer = null;
        let activeTab = 'iframe';

        function updateEmbed() {
            const type = document.getElementById('id-type').value;
            const id = document.getElementById('anime-id').value.trim() || '21';
            const ep = document.getElementById('ep-num').value.trim() || '1';
            const track = document.getElementById('track-select').value;
            const server = document.getElementById('server-select').value;
            const autoPlay = document.getElementById('autoplay-select').value;
            const autoSkip = document.getElementById('autoskip-select').value;

            const path = (type === 'mal' ? '/embed/mal/' : '/embed/ani/') + id + '/' + ep;
            const params = new URLSearchParams();
            if (track !== 'sub') params.set('track', track);
            if (server !== '1') params.set('server', server);
            if (autoPlay !== '1') params.set('autoPlay', autoPlay);
            if (autoSkip !== '1') params.set('autoSkip', autoSkip);

            const queryString = params.toString() ? ('?' + params.toString()) : '';
            const fullUrl = window.location.origin + path + queryString;

            document.getElementById('live-iframe').src = fullUrl;
            document.getElementById('preview-open-link').href = fullUrl;
            document.getElementById('window-url-text').innerText = path + queryString;

            // Diagnostics update
            const serverNames = { '1': 'Server 1 (MegaPlay)', '2': 'Server 2 (AniNeko)', '3': 'Server 3 (Zoko)' };
            document.getElementById('active-engine-tag').innerText = serverNames[server] || ('Server ' + server);
            document.getElementById('active-track-tag').innerText = track === 'dub' ? 'English Audio (Dubbed)' : 'Japanese Audio (Subbed)';

            renderCodeSnippet(fullUrl);
        }

        function renderCodeSnippet(fullUrl) {
            const snippetEl = document.getElementById('code-snippet');
            if (activeTab === 'iframe') {
                snippetEl.innerText = '<div style="position: relative; width: 100%; aspect-ratio: 16/9;">\\n' +
                    '  <iframe\\n' +
                    '    src="' + fullUrl + '"\\n' +
                    '    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"\\n' +
                    '    allowfullscreen\\n' +
                    '    allow="autoplay; fullscreen; picture-in-picture"\\n' +
                    '  ></iframe>\\n' +
                    '</div>';
            } else if (activeTab === 'react') {
                snippetEl.innerText = 'export default function AnimePlayer() {\\n' +
                    '  return (\\n' +
                    '    <div className="relative w-full aspect-video">\\n' +
                    '      <iframe\\n' +
                    '        src="' + fullUrl + '"\\n' +
                    '        className="absolute inset-0 w-full h-full border-0"\\n' +
                    '        allowFullScreen\\n' +
                    '        allow="autoplay; fullscreen; picture-in-picture"\\n' +
                    '      />\\n' +
                    '    </div>\\n' +
                    '  );\\n' +
                    '}';
            } else {
                snippetEl.innerText = fullUrl;
            }
        }

        function switchCodeTab(tab, btn) {
            activeTab = tab;
            document.querySelectorAll('.code-tab').forEach(b => b.classList.remove('active'));
            if (btn) btn.classList.add('active');
            updateEmbed();
        }

        function copyActiveCode() {
            const code = document.getElementById('code-snippet').innerText;
            const btn = document.getElementById('btn-copy');
            const btnText = document.getElementById('btn-copy-text');

            navigator.clipboard.writeText(code).then(() => {
                btn.classList.add('copied');
                btnText.innerText = 'Copied!';
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btnText.innerText = 'Copy';
                }, 2000);
            }).catch(err => {
                console.error('Clipboard copy failed:', err);
            });
        }

        function applyPreset(type, id, ep, track, title, element) {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            if (element) element.classList.add('active');

            document.getElementById('id-type').value = type;
            document.getElementById('anime-id').value = id;
            document.getElementById('ep-num').value = ep;
            document.getElementById('track-select').value = track;
            document.getElementById('anime-search').value = title;
            updateEmbed();
        }

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
                    const res = await fetch('/api/search?q=' + encodeURIComponent(val.trim()));
                    const results = await res.json();

                    if (!results || results.length === 0) {
                        dropdown.innerHTML = '<div style="padding: 14px; font-size: 13px; color: var(--text-muted); text-align: center;">No anime found matching query.</div>';
                        dropdown.classList.add('open');
                        return;
                    }

                    dropdown.innerHTML = '';
                    results.slice(0, 8).forEach(r => {
                        const item = document.createElement('div');
                        item.className = 'search-item';
                        item.onclick = () => selectAnime(r.id, r.idMal || null, r.title);

                        const img = document.createElement('img');
                        img.className = 'search-item-poster';
                        img.src = r.poster || '';
                        img.alt = r.title || '';

                        const info = document.createElement('div');
                        info.className = 'search-item-info';

                        const titleEl = document.createElement('div');
                        titleEl.className = 'search-item-title';
                        titleEl.textContent = r.title || '';

                        const meta = document.createElement('div');
                        meta.className = 'search-item-meta';
                        meta.innerHTML = '<span class="search-item-tag">AniList: ' + r.id + '</span>' +
                            (r.idMal ? '<span class="search-item-tag">MAL: ' + r.idMal + '</span>' : '') +
                            '<span>•</span><span>' + (r.format || 'TV') + '</span>' +
                            (r.year ? '<span>•</span><span>' + r.year + '</span>' : '') +
                            '<span>•</span><span>' + (r.episodes ? r.episodes + ' Eps' : 'Ongoing') + '</span>';

                        info.appendChild(titleEl);
                        info.appendChild(meta);
                        item.appendChild(img);
                        item.appendChild(info);
                        dropdown.appendChild(item);
                    });
                    dropdown.classList.add('open');
                } catch (e) {
                    console.error('Search failed', e);
                }
            }, 250);
        }

        function selectAnime(aniId, malId, title) {
            document.getElementById('search-dropdown').classList.remove('open');
            document.getElementById('anime-search').value = title;
            document.getElementById('id-type').value = 'ani';
            document.getElementById('anime-id').value = aniId;
            document.getElementById('ep-num').value = 1;
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            updateEmbed();
        }

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-box-wrapper')) {
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
