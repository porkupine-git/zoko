/**
 * ANIXO DEVELOPER PLATFORM & STREAMING INFRASTRUCTURE
 * Clean, human-engineered developer interface.
 * Zero AI slop, zero glow effects, restrained monochromatic palette, exactly 2 template backticks.
 */

export function renderLandingHtml(baseUrl = "") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anixo — Clean Anime Video Embed Infrastructure</title>
    <meta name="description" content="High-speed anime video embed player with multi-engine failover, frame-accurate subtitles, and zero advertising overlays.">
    <meta name="profiton-domain-verification" content="c73696bb4afe1bbeeeeea1d53c4db5ca727521d399f62952ea4796fbd94fc788" />
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230E1219'/%3E%3Cpath d='M14 6 H18 L25 26 H20.5 L18.5 20 H13.5 L11.5 26 H7 L14 6 Z M16 11 L14.5 17 H17.5 L16 11 Z' fill='%23FFFFFF'/%3E%3Cpolygon points='13,15 22,19.5 13,24' fill='%23E50914'/%3E%3C/svg%3E">
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
            gap: 12px;
            text-decoration: none;
            color: #ffffff;
            transition: opacity 0.15s ease;
        }

        .brand-link:hover {
            opacity: 0.92;
        }

        .brand-navbar-logo {
            height: 28px;
            width: auto;
            display: block;
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
            gap: 24px;
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

        /* Header Status Badge */
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

        /* ── Main Container ── */
        .page-container {
            max-width: 1120px;
            margin: 0 auto;
            padding: 0 24px;
        }

        /* ── Hero Section (Zero AI Slop) ── */
        .hero-section {
            padding: 68px 0 48px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .hero-announcement-chip {
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
            margin-bottom: 24px;
            text-decoration: none;
            transition: border-color 0.15s ease;
        }

        .hero-announcement-chip:hover {
            border-color: var(--border-hover);
            color: #ffffff;
        }

        .hero-headline {
            font-size: 48px;
            font-weight: 700;
            letter-spacing: -1.5px;
            line-height: 1.15;
            margin-bottom: 16px;
            max-width: 780px;
            color: #ffffff;
        }

        .hero-subhead {
            font-size: 16px;
            color: var(--text-secondary);
            line-height: 1.6;
            max-width: 620px;
            margin-bottom: 30px;
        }

        .hero-actions {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        .btn-primary-action {
            background: #ffffff;
            color: #09090b;
            font-size: 13.5px;
            font-weight: 600;
            padding: 10px 20px;
            border-radius: var(--radius-sm);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            transition: background-color 0.15s ease;
            cursor: pointer;
            border: 1px solid #ffffff;
        }

        .btn-primary-action:hover {
            background: #e4e4e7;
            border-color: #e4e4e7;
        }

        .btn-secondary-action {
            background: var(--surface);
            color: var(--text-primary);
            font-size: 13.5px;
            font-weight: 500;
            padding: 10px 18px;
            border-radius: var(--radius-sm);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            border: 1px solid var(--border);
            transition: all 0.15s ease;
            cursor: pointer;
        }

        .btn-secondary-action:hover {
            background: var(--surface-hover);
            border-color: var(--border-hover);
        }

        /* ── Anixo Studio Console (#studio) ── */
        .studio-section {
            padding: 16px 0 64px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .studio-console-card {
            width: 100%;
            max-width: 960px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            overflow: hidden;
        }

        .console-header-bar {
            padding: 12px 18px;
            background: var(--surface-elevated);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .console-title-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
            color: #ffffff;
        }

        .console-title-wrap svg {
            width: 14px;
            height: 14px;
            color: var(--text-secondary);
        }

        .console-edge-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11.5px;
            font-weight: 500;
            color: var(--status-green);
            background: rgba(34, 197, 94, 0.08);
            border: 1px solid rgba(34, 197, 94, 0.2);
            padding: 2px 8px;
            border-radius: 99px;
        }

        .console-edge-pill .mini-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: var(--status-green);
        }

        /* Interactive Stream Config Toolbar */
        .console-toolbar {
            padding: 12px 18px;
            background: var(--bg);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
        }

        .config-group {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .config-select, .config-input {
            height: 34px;
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            color: #ffffff;
            font-family: inherit;
            font-size: 12.5px;
            padding: 0 10px;
            outline: none;
            transition: border-color 0.15s ease;
        }

        .config-select {
            cursor: pointer;
            appearance: none;
            padding-right: 28px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 9px center;
        }

        .config-select option {
            background: #18181c;
            color: #ffffff;
        }

        .config-select:focus, .config-input:focus {
            border-color: var(--border-focus);
        }

        .config-input {
            width: 75px;
            font-family: 'JetBrains Mono', monospace;
            text-align: center;
        }

        .config-input.ep {
            width: 50px;
        }

        .btn-mount-stream {
            height: 34px;
            background: #ffffff;
            border: 1px solid #ffffff;
            color: #09090b;
            font-size: 12.5px;
            font-weight: 600;
            padding: 0 14px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: background-color 0.15s ease;
        }

        .btn-mount-stream:hover {
            background: #e4e4e7;
            border-color: #e4e4e7;
        }

        /* Embed URL & Code Bars */
        .console-url-strip, .console-embed-strip {
            padding: 8px 18px;
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            font-size: 12px;
        }

        .embed-tag-badge {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            font-weight: 600;
            color: var(--text-secondary);
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            padding: 2px 6px;
            border-radius: 4px;
            letter-spacing: 0.05em;
            flex-shrink: 0;
        }

        .stream-embed-input {
            background: transparent;
            border: none;
            outline: none;
            color: var(--text-secondary);
            font-family: 'JetBrains Mono', monospace;
            font-size: 11.5px;
            width: 100%;
            cursor: pointer;
            text-overflow: ellipsis;
        }

        .stream-embed-input:focus {
            color: #ffffff;
        }

        .stream-url-display {
            font-family: 'JetBrains Mono', monospace;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            font-size: 11.5px;
        }

        .btn-copy-stream-url {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 11.5px;
            font-weight: 500;
            padding: 4px 10px;
            border-radius: 4px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            transition: all 0.15s ease;
            flex-shrink: 0;
        }

        .btn-copy-stream-url:hover {
            color: #ffffff;
            border-color: var(--border-hover);
        }

        /* 16:9 Video Player Container */
        .console-video-box {
            width: 100%;
            aspect-ratio: 16 / 9;
            background: #000000;
            position: relative;
        }

        .console-video-box iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }

        /* ── Curated Anime Cards Section (#catalog) ── */
        .catalog-section {
            padding: 56px 0 72px;
            border-top: 1px solid var(--border);
        }

        .catalog-header-wrap {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            margin-bottom: 28px;
            gap: 20px;
            flex-wrap: wrap;
        }

        .catalog-title-group {
            max-width: 600px;
        }

        .catalog-badge-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 600;
            color: var(--text-secondary);
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            padding: 3px 9px;
            border-radius: 4px;
            margin-bottom: 12px;
            letter-spacing: 0.05em;
        }

        .catalog-badge-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #e50914;
        }

        .catalog-heading {
            font-size: 26px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.5px;
            margin-bottom: 6px;
        }

        .catalog-subheading {
            font-size: 13.5px;
            color: var(--text-secondary);
            line-height: 1.5;
        }

        .catalog-filters {
            display: flex;
            gap: 6px;
            background: var(--surface);
            border: 1px solid var(--border);
            padding: 4px;
            border-radius: var(--radius-md);
            flex-wrap: wrap;
        }

        .filter-btn {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            font-family: inherit;
            font-size: 12px;
            font-weight: 600;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .filter-btn:hover {
            color: #ffffff;
            background: var(--surface-hover);
        }

        .filter-btn.active {
            background: #ffffff;
            color: #09090b;
        }

        /* ── Stream Benchmark Manifest Grid (#catalog) ── */
        .anime-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
        }

        @media (max-width: 1160px) {
            .anime-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }

        @media (max-width: 640px) {
            .anime-grid { grid-template-columns: 1fr; gap: 14px; }
            .catalog-header-wrap { flex-direction: column; align-items: flex-start; }
        }

        /* Benchmark Card - Precision Engineered Dark Surface */
        .anime-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            cursor: pointer;
            position: relative;
            text-align: left;
            transition: border-color 0.18s ease, transform 0.18s ease, background 0.18s ease;
        }

        .anime-card:hover {
            border-color: var(--border-hover);
            transform: translateY(-2px);
            background: #141418;
        }

        .anime-card.is-active-stream {
            border-color: #ffffff;
            box-shadow: inset 0 0 0 1px #ffffff;
        }

        /* Card Top Identification Header */
        .card-manifest-head {
            padding: 8px 12px;
            background: var(--surface-elevated);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .manifest-tag {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10.5px;
            font-weight: 600;
            color: var(--text-muted);
            letter-spacing: 0.04em;
        }

        .manifest-status {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            font-weight: 500;
            color: var(--text-secondary);
        }

        .manifest-status-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: var(--status-green);
        }

        /* 16:9 Cinematic Video Viewport */
        .card-viewport-box {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            overflow: hidden;
            background: #000000;
            border-bottom: 1px solid var(--border);
        }

        .card-banner-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            filter: brightness(0.86) contrast(1.04);
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s ease;
        }

        .anime-card:hover .card-banner-img {
            transform: scale(1.04);
            filter: brightness(0.96) contrast(1.04);
        }

        .card-viewport-badge {
            position: absolute;
            bottom: 8px;
            right: 8px;
            background: rgba(9, 9, 11, 0.88);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #ffffff;
            font-family: 'JetBrains Mono', monospace;
            font-size: 9.5px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 4px;
            letter-spacing: 0.3px;
            pointer-events: none;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
        }

        /* Card Specification Body */
        .card-meta-body {
            padding: 12px 14px 14px;
            display: flex;
            flex-direction: column;
            flex: 1;
            justify-content: space-between;
        }

        .card-title-line {
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
            letter-spacing: -0.2px;
            line-height: 1.35;
            margin-bottom: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .anime-card:hover .card-title-line {
            color: #ffffff;
        }

        .card-studio-sub {
            font-size: 11.5px;
            color: var(--text-muted);
            margin-bottom: 10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Technical Specification Chips */
        .card-specs-group {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-bottom: 12px;
        }

        .spec-chip {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            font-weight: 500;
            padding: 2px 6px;
            border-radius: 4px;
            letter-spacing: 0.02em;
        }

        /* Card Action Row */
        .card-action-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 10px;
            border-top: 1px solid var(--border);
        }

        .action-node-id {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10.5px;
            color: var(--text-muted);
        }

        .action-mount-cta {
            font-size: 11.5px;
            font-weight: 500;
            color: var(--text-secondary);
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: color 0.15s ease, transform 0.15s ease;
        }

        .anime-card:hover .action-mount-cta {
            color: #ffffff;
        }

        .anime-card:hover .action-mount-cta svg {
            transform: translateX(2px);
        }

        .action-mount-cta svg {
            width: 12px;
            height: 12px;
            transition: transform 0.15s ease;
        }

        /* ── Core Architecture Grid (#architecture) ── */
        .content-section {
            padding: 64px 0;
            border-top: 1px solid var(--border);
        }

        .section-headline-center {
            text-align: center;
            margin-bottom: 40px;
        }

        .section-main-title {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
        }

        .section-tagline {
            font-size: 14.5px;
            color: var(--text-secondary);
        }

        .architecture-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
        }

        .arch-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 24px 20px;
            transition: border-color 0.15s ease;
        }

        .arch-card:hover {
            border-color: var(--border-hover);
        }

        .arch-icon-wrap {
            width: 36px;
            height: 36px;
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-primary);
            margin-bottom: 16px;
        }

        .arch-icon-wrap svg {
            width: 18px;
            height: 18px;
        }

        .arch-card-title {
            font-size: 15px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 6px;
            letter-spacing: -0.2px;
        }

        .arch-card-desc {
            font-size: 13px;
            color: var(--text-secondary);
            line-height: 1.55;
        }

        /* ── Global Cluster Telemetry (#telemetry) ── */
        .telemetry-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            overflow: hidden;
            max-width: 960px;
            margin: 0 auto;
        }

        .telemetry-card-top {
            padding: 14px 20px;
            background: var(--surface-elevated);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .telemetry-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
        }

        .telemetry-label svg {
            width: 15px;
            height: 15px;
            color: var(--text-secondary);
        }

        .btn-ping-cluster {
            background: var(--surface);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            padding: 5px 12px;
            border-radius: var(--radius-sm);
            font-size: 12px;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .btn-ping-cluster:hover {
            color: #ffffff;
            border-color: var(--border-hover);
        }

        .telemetry-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            text-align: left;
        }

        .telemetry-table th {
            padding: 11px 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            border-bottom: 1px solid var(--border);
            background: var(--bg);
        }

        .telemetry-table td {
            padding: 14px 20px;
            border-bottom: 1px solid var(--border);
            color: var(--text-secondary);
        }

        .telemetry-table tr:last-child td {
            border-bottom: none;
        }

        .telemetry-table tr:hover td {
            background: rgba(255, 255, 255, 0.02);
        }

        .node-name {
            font-weight: 500;
            color: #ffffff;
        }

        .status-node-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(34, 197, 94, 0.08);
            border: 1px solid rgba(34, 197, 94, 0.2);
            color: var(--status-green);
            padding: 2px 8px;
            border-radius: 99px;
            font-size: 11.5px;
            font-weight: 500;
        }

        .status-node-pill::before {
            content: '';
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: var(--status-green);
        }

        /* ── Developer Integration Suite (#docs) ── */
        .docs-nav-pills {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        .docs-pill-btn {
            background: var(--surface);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 12.5px;
            font-weight: 500;
            padding: 7px 16px;
            border-radius: 99px;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .docs-pill-btn:hover {
            color: #ffffff;
            border-color: var(--border-hover);
        }

        .docs-pill-btn.active {
            background: #ffffff;
            border-color: #ffffff;
            color: #09090b;
            font-weight: 600;
        }

        .docs-view-pane {
            display: none;
            max-width: 960px;
            margin: 0 auto;
        }

        .docs-view-pane.active {
            display: block;
        }

        .docs-dual-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        }

        .spec-box-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 20px;
        }

        .spec-card-head {
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .code-display-block {
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 12px 14px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: var(--text-primary);
            overflow-x: auto;
            margin-bottom: 12px;
            line-height: 1.5;
        }

        .spec-subtext {
            font-size: 12.5px;
            color: var(--text-secondary);
            margin-bottom: 14px;
            line-height: 1.5;
        }

        .spec-param-row {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 12px;
            margin-bottom: 6px;
            color: var(--text-secondary);
        }

        .param-badge {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            color: #ffffff;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 500;
        }

        /* ── Bottom Callout Banner ── */
        .callout-banner {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 48px 24px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 32px auto 64px;
            max-width: 960px;
        }

        .callout-title {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 8px;
            letter-spacing: -0.4px;
        }

        .callout-subtext {
            font-size: 14px;
            color: var(--text-secondary);
            max-width: 500px;
            margin-bottom: 24px;
            line-height: 1.55;
        }

        /* ── Footer ── */
        .site-footer {
            border-top: 1px solid var(--border);
            padding: 24px 0;
            text-align: center;
            font-size: 12.5px;
            color: var(--text-muted);
        }

        /* Responsive */
        @media (max-width: 900px) {
            .hero-headline { font-size: 34px; }
            .architecture-grid { grid-template-columns: 1fr; }
            .docs-dual-grid { grid-template-columns: 1fr; }
            .header-nav { display: none; }
        }
    </style>
</head>
<body>

    <!-- ── Top Header ── -->
    <header class="site-header">
        <div class="header-inner">
            <a href="/" class="brand-link" aria-label="Anixo Embed Core">
                <svg class="brand-navbar-logo" viewBox="0 0 250 52" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="anixo-mark" transform="translate(4, 4)">
                        <rect width="44" height="44" rx="10" fill="#141A24" stroke="#2E3B52" stroke-width="1.5"/>
                        <path d="M19 9 H25 L34.5 35 H28 L25.5 27 H18.5 L16 35 H9.5 L19 9 Z M22 16 L19.5 23 H24.5 L22 16 Z" fill="#FFFFFF"/>
                        <polygon points="17,21 30,27 17,33" fill="#FFFFFF"/>
                    </g>
                    <g id="anixo-type" transform="translate(60, 14)">
                        <path d="M 0,24 L 9,0 H 15 L 24,24 H 18.5 L 16.5,18 H 7.5 L 5.5,24 H 0 Z M 9,13.5 H 15 L 12,5 Z" fill="#FFFFFF"/>
                        <path d="M 28,0 H 33.5 L 43.5,16.5 V 0 H 49 V 24 H 43.5 L 33.5,7.5 V 24 H 28 Z" fill="#FFFFFF"/>
                        <path d="M 54,0 H 59.5 V 24 H 54 Z" fill="#FFFFFF"/>
                        <path d="M 64,0 H 70 L 76,9.5 L 82,0 H 88 L 79.5,12 L 88.5,24 H 82.5 L 76,14.5 L 69.5,24 H 63.5 L 72.5,12 Z" fill="#FFFFFF"/>
                        <path d="M 103,0 C 110,0 115,5 115,12 C 115,19 110,24 103,24 C 96,24 91,19 91,12 C 91,5 96,0 103,0 Z M 103,4.8 C 99,4.8 96.2,8 96.2,12 C 96.2,16 99,19.2 103,19.2 C 107,19.2 109.8,16 109.8,12 C 109.8,8 107,4.8 103,4.8 Z" fill="#FFFFFF"/>
                        <text x="124" y="19" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Outfit', monospace" font-size="9.5" font-weight="800" fill="#94A3B8" letter-spacing="2.5">CORE</text>
                    </g>
                </svg>
            </a>

            <nav class="header-nav">
                <a href="#studio" class="nav-link">Studio</a>
                <a href="#catalog" class="nav-link">Catalog</a>
                <a href="#architecture" class="nav-link">Architecture</a>
                <a href="#telemetry" class="nav-link">Telemetry</a>
                <a href="#docs" class="nav-link">Documentation</a>
            </nav>

            <a href="#telemetry" class="header-status-link" title="Cluster Status: 3/3 Nodes Operational">
                <span class="status-dot"></span>
                <span>3 Nodes Operational</span>
            </a>
        </div>
    </header>

    <div class="page-container">

        <!-- ── Clean Hero (Zero AI Slop) ── -->
        <section class="hero-section">
            <a href="#architecture" class="hero-announcement-chip">
                <span class="status-dot"></span>
                <span>3-Server Failover • Zero Ads • Frame-Accurate Subs</span>
            </a>

            <h1 class="hero-headline">
                Clean, high-speed anime embeds.
            </h1>

            <p class="hero-subhead">
                A lightweight iframe player with automatic 3-engine failover, interactive skip markers, and instant playback. Drop into any site or app.
            </p>

            <div class="hero-actions">
                <a href="#studio" class="btn-primary-action">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 18 12 6 20 6 4"/></svg>
                    <span>Launch Studio Console</span>
                </a>
                <a href="#docs" class="btn-secondary-action">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>API Reference</span>
                </a>
            </div>
        </section>

        <!-- ── Anixo Studio Console (#studio) ── -->
        <section class="studio-section" id="studio">
            <div class="studio-console-card">
                <div class="console-header-bar">
                    <div class="console-title-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/></svg>
                        <span>Live Embed Playground</span>
                    </div>
                    <div class="console-edge-pill"><span class="mini-dot"></span>3/3 Nodes Ready</div>
                </div>

                <!-- Interactive Toolbar -->
                <div class="console-toolbar">
                    <div class="config-group">
                        <select id="stream-catalog" class="config-select" onchange="refreshStreamRoute()">
                            <option value="ani" selected>AniList</option>
                            <option value="mal">MyAnimeList</option>
                        </select>

                        <input type="text" id="stream-id" class="config-input" value="21" placeholder="Anime ID" oninput="refreshStreamRoute()" spellcheck="false">

                        <input type="number" id="stream-ep" class="config-input ep" value="1" min="1" placeholder="Ep" oninput="refreshStreamRoute()">

                        <select id="stream-track" class="config-select" onchange="refreshStreamRoute()">
                            <option value="sub" selected>Subbed (JP)</option>
                            <option value="dub">Dubbed (EN)</option>
                        </select>

                        <select id="stream-player" class="config-select" onchange="refreshStreamRoute()">
                            <option value="jw" selected>Player: JW Player (Default)</option>
                            <option value="custom">Player: Cinema (Custom)</option>
                        </select>
                    </div>

                    <button type="button" class="btn-mount-stream" onclick="mountActiveStream()">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 18 12 6 20 6 4"/></svg>
                        <span>Mount Stream</span>
                    </button>
                </div>

                <!-- Direct URL Strip -->
                <div class="console-url-strip">
                    <span class="stream-url-display" id="display-stream-url"></span>
                    <button type="button" class="btn-copy-stream-url" onclick="copyStreamUrl()">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        <span id="copy-stream-label">Copy URL</span>
                    </button>
                </div>

                <!-- Embed Code Strip -->
                <div class="console-embed-strip">
                    <span class="embed-tag-badge">IFRAME</span>
                    <input type="text" class="stream-embed-input" id="display-embed-code" readonly onclick="this.select()" value="" spellcheck="false" title="Click to select embed code">
                    <button type="button" class="btn-copy-stream-url" onclick="copyEmbedCode()">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                        <span id="copy-embed-label">Copy Embed Code</span>
                    </button>
                </div>

                <!-- Video Frame -->
                <div class="console-video-box">
                    <iframe id="live-iframe" src="" allowfullscreen allow="autoplay; fullscreen; picture-in-picture"></iframe>
                </div>
            </div>
        </section>

        <!-- ── Curated Stream Showcase Catalog (#catalog) ── -->
        <section class="catalog-section" id="catalog">
            <div class="catalog-header-wrap">
                <div class="catalog-title-group">
                    <div class="catalog-badge-pill">
                        <span class="catalog-badge-dot"></span>
                        <span>STREAM BENCHMARKS</span>
                    </div>
                    <h2 class="catalog-heading">Stream Engine Test Manifests</h2>
                    <p class="catalog-subheading">Pre-configured 1080p stream manifests verified against Sora and Pahe clusters. Click any benchmark to mount in the studio playground.</p>
                </div>
                <div class="catalog-filters">
                    <button type="button" class="filter-btn active" onclick="filterAnimeCards('all', this)">All (8)</button>
                    <button type="button" class="filter-btn" onclick="filterAnimeCards('action', this)">Action &amp; Shounen</button>
                    <button type="button" class="filter-btn" onclick="filterAnimeCards('fantasy', this)">Fantasy &amp; Adventure</button>
                    <button type="button" class="filter-btn" onclick="filterAnimeCards('supernatural', this)">Dark &amp; Supernatural</button>
                </div>
            </div>

            <div class="anime-grid">
                <!-- 1. Frieren -->
                <div class="anime-card" id="card-154587" data-category="fantasy adventure" onclick="mountAnimePreset(154587, 1, 'Frieren')">
                    <div class="card-manifest-head">
                        <span class="manifest-tag">PRESET #01</span>
                        <span class="manifest-status"><span class="manifest-status-dot"></span>Active Node</span>
                    </div>
                    <div class="card-viewport-box">
                        <img class="card-banner-img" src="https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg" alt="Frieren: Beyond Journey’s End" loading="lazy">
                        <span class="card-viewport-badge">EP 01 • 1080p</span>
                    </div>
                    <div class="card-meta-body">
                        <div>
                            <div class="card-title-line" title="Frieren: Beyond Journey’s End">Frieren: Beyond Journey’s End</div>
                            <div class="card-studio-sub">Madhouse · 2023</div>
                            <div class="card-specs-group">
                                <span class="spec-chip">ID: 154587</span>
                                <span class="spec-chip">WebVTT Subs</span>
                                <span class="spec-chip">Auto-Skip</span>
                            </div>
                        </div>
                        <div class="card-action-row">
                            <span class="action-node-id">Sora · Edge</span>
                            <span class="action-mount-cta">
                                <span>Mount in Studio</span>
                                <svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/></svg>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 2. Jujutsu Kaisen -->
                <div class="anime-card" id="card-113415" data-category="action supernatural" onclick="mountAnimePreset(113415, 1, 'Jujutsu Kaisen')">
                    <div class="card-manifest-head">
                        <span class="manifest-tag">PRESET #02</span>
                        <span class="manifest-status"><span class="manifest-status-dot"></span>Active Node</span>
                    </div>
                    <div class="card-viewport-box">
                        <img class="card-banner-img" src="https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg" alt="JUJUTSU KAISEN" loading="lazy">
                        <span class="card-viewport-badge">EP 01 • 1080p</span>
                    </div>
                    <div class="card-meta-body">
                        <div>
                            <div class="card-title-line" title="JUJUTSU KAISEN">JUJUTSU KAISEN</div>
                            <div class="card-studio-sub">MAPPA · 2020</div>
                            <div class="card-specs-group">
                                <span class="spec-chip">ID: 113415</span>
                                <span class="spec-chip">Multi-Audio</span>
                                <span class="spec-chip">1080p 60fps</span>
                            </div>
                        </div>
                        <div class="card-action-row">
                            <span class="action-node-id">Sora · Edge</span>
                            <span class="action-mount-cta">
                                <span>Mount in Studio</span>
                                <svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/></svg>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 3. Solo Leveling -->
                <div class="anime-card" id="card-151807" data-category="action fantasy adventure" onclick="mountAnimePreset(151807, 1, 'Solo Leveling')">
                    <div class="card-manifest-head">
                        <span class="manifest-tag">PRESET #03</span>
                        <span class="manifest-status"><span class="manifest-status-dot"></span>Active Node</span>
                    </div>
                    <div class="card-viewport-box">
                        <img class="card-banner-img" src="https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-37yfQA3ym8PA.jpg" alt="Solo Leveling" loading="lazy">
                        <span class="card-viewport-badge">EP 01 • 1080p</span>
                    </div>
                    <div class="card-meta-body">
                        <div>
                            <div class="card-title-line" title="Solo Leveling">Solo Leveling</div>
                            <div class="card-studio-sub">A-1 Pictures · 2024</div>
                            <div class="card-specs-group">
                                <span class="spec-chip">ID: 151807</span>
                                <span class="spec-chip">Low Latency</span>
                                <span class="spec-chip">Frame Accurate</span>
                            </div>
                        </div>
                        <div class="card-action-row">
                            <span class="action-node-id">Neko · CDN</span>
                            <span class="action-mount-cta">
                                <span>Mount in Studio</span>
                                <svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/></svg>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 4. One Piece -->
                <div class="anime-card" id="card-21" data-category="action adventure fantasy" onclick="mountAnimePreset(21, 1, 'ONE PIECE')">
                    <div class="card-manifest-head">
                        <span class="manifest-tag">PRESET #04</span>
                        <span class="manifest-status"><span class="manifest-status-dot"></span>Active Node</span>
                    </div>
                    <div class="card-viewport-box">
                        <img class="card-banner-img" src="https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg" alt="ONE PIECE" loading="lazy">
                        <span class="card-viewport-badge">EP 01 • 1080p</span>
                    </div>
                    <div class="card-meta-body">
                        <div>
                            <div class="card-title-line" title="ONE PIECE">ONE PIECE</div>
                            <div class="card-studio-sub">Toei Animation · 1999</div>
                            <div class="card-specs-group">
                                <span class="spec-chip">ID: 21</span>
                                <span class="spec-chip">1100+ Ep Matrix</span>
                                <span class="spec-chip">Adaptive Rate</span>
                            </div>
                        </div>
                        <div class="card-action-row">
                            <span class="action-node-id">Zozo · Cluster</span>
                            <span class="action-mount-cta">
                                <span>Mount in Studio</span>
                                <svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/></svg>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 5. Demon Slayer -->
                <div class="anime-card" id="card-101922" data-category="action supernatural fantasy" onclick="mountAnimePreset(101922, 1, 'Demon Slayer')">
                    <div class="card-manifest-head">
                        <span class="manifest-tag">PRESET #05</span>
                        <span class="manifest-status"><span class="manifest-status-dot"></span>Active Node</span>
                    </div>
                    <div class="card-viewport-box">
                        <img class="card-banner-img" src="https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg" alt="Demon Slayer: Kimetsu no Yaiba" loading="lazy">
                        <span class="card-viewport-badge">EP 01 • 1080p</span>
                    </div>
                    <div class="card-meta-body">
                        <div>
                            <div class="card-title-line" title="Demon Slayer: Kimetsu no Yaiba">Demon Slayer</div>
                            <div class="card-studio-sub">Ufotable · 2019</div>
                            <div class="card-specs-group">
                                <span class="spec-chip">ID: 101922</span>
                                <span class="spec-chip">HDR Master</span>
                                <span class="spec-chip">WebVTT Styled</span>
                            </div>
                        </div>
                        <div class="card-action-row">
                            <span class="action-node-id">Sora · Edge</span>
                            <span class="action-mount-cta">
                                <span>Mount in Studio</span>
                                <svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/></svg>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 6. Attack on Titan -->
                <div class="anime-card" id="card-16498" data-category="action supernatural" onclick="mountAnimePreset(16498, 1, 'Attack on Titan')">
                    <div class="card-manifest-head">
                        <span class="manifest-tag">PRESET #06</span>
                        <span class="manifest-status"><span class="manifest-status-dot"></span>Active Node</span>
                    </div>
                    <div class="card-viewport-box">
                        <img class="card-banner-img" src="https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg" alt="Attack on Titan" loading="lazy">
                        <span class="card-viewport-badge">EP 01 • 1080p</span>
                    </div>
                    <div class="card-meta-body">
                        <div>
                            <div class="card-title-line" title="Attack on Titan">Attack on Titan</div>
                            <div class="card-studio-sub">Wit Studio · 2013</div>
                            <div class="card-specs-group">
                                <span class="spec-chip">ID: 16498</span>
                                <span class="spec-chip">Dolby Stereo</span>
                                <span class="spec-chip">Edge Cached</span>
                            </div>
                        </div>
                        <div class="card-action-row">
                            <span class="action-node-id">Sora · Edge</span>
                            <span class="action-mount-cta">
                                <span>Mount in Studio</span>
                                <svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/></svg>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 7. Chainsaw Man -->
                <div class="anime-card" id="card-127230" data-category="action supernatural" onclick="mountAnimePreset(127230, 1, 'Chainsaw Man')">
                    <div class="card-manifest-head">
                        <span class="manifest-tag">PRESET #07</span>
                        <span class="manifest-status"><span class="manifest-status-dot"></span>Active Node</span>
                    </div>
                    <div class="card-viewport-box">
                        <img class="card-banner-img" src="https://s4.anilist.co/file/anilistcdn/media/anime/banner/127230-o8IRwCGVr9KW.jpg" alt="Chainsaw Man" loading="lazy">
                        <span class="card-viewport-badge">EP 01 • 1080p</span>
                    </div>
                    <div class="card-meta-body">
                        <div>
                            <div class="card-title-line" title="Chainsaw Man">Chainsaw Man</div>
                            <div class="card-studio-sub">MAPPA · 2022</div>
                            <div class="card-specs-group">
                                <span class="spec-chip">ID: 127230</span>
                                <span class="spec-chip">Failover Cluster</span>
                                <span class="spec-chip">1080p Native</span>
                            </div>
                        </div>
                        <div class="card-action-row">
                            <span class="action-node-id">Neko · CDN</span>
                            <span class="action-mount-cta">
                                <span>Mount in Studio</span>
                                <svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/></svg>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 8. Bleach TYBW -->
                <div class="anime-card" id="card-116674" data-category="action supernatural" onclick="mountAnimePreset(116674, 1, 'Bleach: TYBW')">
                    <div class="card-manifest-head">
                        <span class="manifest-tag">PRESET #08</span>
                        <span class="manifest-status"><span class="manifest-status-dot"></span>Active Node</span>
                    </div>
                    <div class="card-viewport-box">
                        <img class="card-banner-img" src="https://s4.anilist.co/file/anilistcdn/media/anime/banner/116674-l2YlIyJzvGSV.jpg" alt="BLEACH: Thousand-Year Blood War" loading="lazy">
                        <span class="card-viewport-badge">EP 01 • 1080p</span>
                    </div>
                    <div class="card-meta-body">
                        <div>
                            <div class="card-title-line" title="BLEACH: Thousand-Year Blood War">Bleach: TYBW</div>
                            <div class="card-studio-sub">Studio Pierrot · 2022</div>
                            <div class="card-specs-group">
                                <span class="spec-chip">ID: 116674</span>
                                <span class="spec-chip">OP/ED Markers</span>
                                <span class="spec-chip">Dual Audio</span>
                            </div>
                        </div>
                        <div class="card-action-row">
                            <span class="action-node-id">Zozo · Cluster</span>
                            <span class="action-mount-cta">
                                <span>Mount in Studio</span>
                                <svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/></svg>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ── Core Architecture Grid (#architecture) ── -->
        <section class="content-section" id="architecture">
            <div class="section-headline-center">
                <h2 class="section-main-title">Engineered for Reliability</h2>
                <p class="section-tagline">Multi-server failover and edge proxying designed for anime platforms.</p>
            </div>

            <div class="architecture-grid">
                <!-- Card 1 -->
                <div class="arch-card">
                    <div class="arch-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    </div>
                    <h3 class="arch-card-title">3-Server Failover</h3>
                    <p class="arch-card-desc">Automatic cascading between Sora, Neko, and Zozo ensures uninterrupted stream playback.</p>
                </div>

                <!-- Card 2 -->
                <div class="arch-card">
                    <div class="arch-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>
                    </div>
                    <h3 class="arch-card-title">Frame-Accurate Subtitles</h3>
                    <p class="arch-card-desc">Low-latency WebVTT subtitle synchronization with clean styling and custom font rendering.</p>
                </div>

                <!-- Card 3 -->
                <div class="arch-card">
                    <div class="arch-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 12l-4-4-4 4M12 8v8"/></svg>
                    </div>
                    <h3 class="arch-card-title">Dual Catalog Sync</h3>
                    <p class="arch-card-desc">Native support for both AniList and MyAnimeList IDs with automatic metadata resolution.</p>
                </div>

                <!-- Card 4 -->
                <div class="arch-card">
                    <div class="arch-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <h3 class="arch-card-title">Private Origin Shield</h3>
                    <p class="arch-card-desc">Upstream CDN origins and raw server links remain protected behind our edge proxy.</p>
                </div>

                <!-- Card 5 -->
                <div class="arch-card">
                    <div class="arch-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                    <h3 class="arch-card-title">Skip Intro & Outro</h3>
                    <p class="arch-card-desc">Interactive yellow timeline skip segments with one-click opening and ending skip buttons.</p>
                </div>

                <!-- Card 6 -->
                <div class="arch-card">
                    <div class="arch-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    </div>
                    <h3 class="arch-card-title">PostMessage API</h3>
                    <p class="arch-card-desc">Complete event bus (ready, play, pause, timeupdate, ended) for host application integration.</p>
                </div>
            </div>
        </section>

        <!-- ── Global Cluster Telemetry (#telemetry) ── -->
        <section class="content-section" id="telemetry">
            <div class="section-headline-center">
                <h2 class="section-main-title">Cluster Telemetry</h2>
                <p class="section-tagline">Real-time status across edge media delivery servers.</p>
            </div>

            <div class="telemetry-card">
                <div class="telemetry-card-top">
                    <div class="telemetry-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
                        <span>Server Nodes (3 Active)</span>
                    </div>
                    <button type="button" class="btn-ping-cluster" onclick="pingTelemetry(true)">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                        <span>Ping Cluster</span>
                    </button>
                </div>

                <table class="telemetry-table">
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
                            <td class="node-name">Server 1 (Sora Edge)</td>
                            <td><span class="status-node-pill" id="pill-n1">Operational</span></td>
                            <td>Primary Stream Pipeline</td>
                            <td id="lat-n1">Fast</td>
                        </tr>
                        <tr>
                            <td class="node-name">Server 2 (Neko CDN)</td>
                            <td><span class="status-node-pill" id="pill-n2">Operational</span></td>
                            <td>High-Throughput CDN</td>
                            <td id="lat-n2">Fast</td>
                        </tr>
                        <tr>
                            <td class="node-name">Server 3 (Zozo Edge)</td>
                            <td><span class="status-node-pill" id="pill-n3">Operational</span></td>
                            <td>Encrypted Stream Engine</td>
                            <td id="lat-n3">Fast</td>
                        </tr>
                        <tr>
                            <td class="node-name">Metadata Uplink (AniList / Jikan)</td>
                            <td><span class="status-node-pill">Operational</span></td>
                            <td>Catalog Resolution</td>
                            <td>Synced</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- ── Developer Integration Suite (#docs) ── -->
        <section class="content-section" id="docs">
            <div class="section-headline-center">
                <h2 class="section-main-title">Developer Integration</h2>
                <p class="section-tagline">Embed Anixo video streams into your web application in seconds.</p>
            </div>

            <!-- Tab Buttons -->
            <div class="docs-nav-pills">
                <button type="button" class="docs-pill-btn active" onclick="switchSuiteTab('endpoints', this)">Embed Endpoints</button>
                <button type="button" class="docs-pill-btn" onclick="switchSuiteTab('implementation', this)">Code Integration</button>
                <button type="button" class="docs-pill-btn" onclick="switchSuiteTab('parameters', this)">Query Parameters</button>
                <button type="button" class="docs-pill-btn" onclick="switchSuiteTab('events', this)">PostMessage Events</button>
            </div>

            <!-- Tab 1: Endpoints -->
            <div class="docs-view-pane active" id="view-endpoints">
                <div class="docs-dual-grid">
                    <!-- AniList Card -->
                    <div class="spec-box-card">
                        <div class="spec-card-head">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>
                            <span>AniList Direct Embed</span>
                        </div>
                        <div class="code-display-block">
                            GET /embed/ani/{aniListId}/{episode}?track={audio}
                        </div>
                        <p class="spec-subtext">Directly mounts AniList numerical anime IDs with automatic 3-server failover.</p>

                        <div class="spec-param-row">
                            <span class="param-badge">aniListId</span>
                            <span>Target AniList anime numerical ID</span>
                        </div>
                        <div class="spec-param-row">
                            <span class="param-badge">episode</span>
                            <span>Target episode number (1-indexed)</span>
                        </div>
                        <div class="spec-param-row">
                            <span class="param-badge">track</span>
                            <span>sub (Japanese) or dub (English)</span>
                        </div>
                    </div>

                    <!-- MAL Card -->
                    <div class="spec-box-card">
                        <div class="spec-card-head">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/></svg>
                            <span>MyAnimeList Direct Embed</span>
                        </div>
                        <div class="code-display-block">
                            GET /embed/mal/{malId}/{episode}?track={audio}
                        </div>
                        <p class="spec-subtext">Mounts MyAnimeList numerical anime IDs with instant cross-referencing.</p>

                        <div class="spec-param-row">
                            <span class="param-badge">malId</span>
                            <span>Target MyAnimeList anime numerical ID</span>
                        </div>
                        <div class="spec-param-row">
                            <span class="param-badge">episode</span>
                            <span>Target episode number (1-indexed)</span>
                        </div>
                        <div class="spec-param-row">
                            <span class="param-badge">failover</span>
                            <span>Automatic across Server 1, 2, 3</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab 2: Implementation -->
            <div class="docs-view-pane" id="view-implementation">
                <div class="spec-box-card">
                    <div class="spec-card-head" style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                            <span>Responsive 16:9 Container (Recommended for anixo.buzz)</span>
                        </div>
                        <button type="button" class="btn-copy-stream-url" onclick="copySnippet('embed-snip-resp', 'copy-resp-btn')" id="copy-resp-btn">
                            Copy Code
                        </button>
                    </div>
                    <div class="code-display-block" id="embed-snip-resp" style="white-space: pre;">&lt;!-- Responsive 16:9 Container for anixo.buzz --&gt;
&lt;div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000;"&gt;
  &lt;iframe
    src="https://anixo.buzz/embed/ani/21/1"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
    allowfullscreen
    allow="autoplay; fullscreen; picture-in-picture"
  &gt;&lt;/iframe&gt;
&lt;/div&gt;</div>
                </div>

                <div class="spec-box-card" style="margin-top: 14px;">
                    <div class="spec-card-head" style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="14" x="3" y="5" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/></svg>
                            <span>Single-Line &lt;iframe&gt; Embed Code</span>
                        </div>
                        <button type="button" class="btn-copy-stream-url" onclick="copySnippet('embed-snip-direct', 'copy-direct-btn')" id="copy-direct-btn">
                            Copy Code
                        </button>
                    </div>
                    <div class="code-display-block" id="embed-snip-direct" style="white-space: pre;">&lt;iframe src="https://anixo.buzz/embed/ani/21/1" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay; fullscreen; picture-in-picture"&gt;&lt;/iframe&gt;</div>
                </div>
            </div>

            <!-- Tab 3: Parameters -->
            <div class="docs-view-pane" id="view-parameters">
                <div class="spec-box-card" style="overflow-x: auto;">
                    <table class="telemetry-table">
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th>Accepted</th>
                                <th>Default</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><span class="param-badge">track</span></td>
                                <td>sub, dub</td>
                                <td>sub</td>
                                <td>Select audio language (Japanese original vs English Dub)</td>
                            </tr>
                            <tr>
                                <td><span class="param-badge">server</span></td>
                                <td>1, 2, 3</td>
                                <td>1</td>
                                <td>Primary upstream server: Sora (1), Neko (2), Zozo (3)</td>
                            </tr>
                            <tr>
                                <td><span class="param-badge">autoSkipIntro</span></td>
                                <td>1, 0</td>
                                <td>1</td>
                                <td>Automatically skip opening theme segment</td>
                            </tr>
                            <tr>
                                <td><span class="param-badge">autoSkipOutro</span></td>
                                <td>1, 0</td>
                                <td>1</td>
                                <td>Automatically skip ending theme segment</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Tab 4: Events -->
            <div class="docs-view-pane" id="view-events">
                <div class="spec-box-card">
                    <div class="spec-card-head">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                        <span>Parent Window PostMessage Listener</span>
                    </div>
                    <div class="code-display-block" style="white-space: pre;">window.addEventListener('message', (e) => {
  if (!e.data || typeof e.data !== 'object') return;
  if (e.data.type === 'aniembed:play') {
    console.log('Playback started at timestamp', e.data.currentTime);
  }
  if (e.data.type === 'aniembed:ended') {
    console.log('Episode ended. Ready to advance episode.');
  }
});</div>
                </div>
            </div>
        </section>

        <!-- ── Bottom Callout Banner ── -->
        <section class="callout-banner">
            <h3 class="callout-title">Fast anime streaming for your application.</h3>
            <p class="callout-subtext">Zero ads, zero bandwidth overhead, and automated multi-server redundancy.</p>
            <a href="#studio" class="btn-primary-action">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 18 12 6 20 6 4"/></svg>
                <span>Launch Studio Console</span>
            </a>
        </section>

        <!-- ── Footer ── -->
        <footer class="site-footer">
            <div>&copy; 2026 Anixo Infrastructure. All rights reserved.</div>
        </footer>

    </div>

    <!-- Client-Side Script (ZERO inner backticks) -->
    <script>
        function refreshStreamRoute() {
            const catalog = document.getElementById('stream-catalog').value;
            const id = document.getElementById('stream-id').value.trim() || '21';
            const ep = document.getElementById('stream-ep').value.trim() || '1';
            const track = document.getElementById('stream-track').value;
            const playerEl = document.getElementById('stream-player');
            const player = playerEl ? playerEl.value : 'jw';

            const path = (catalog === 'mal' ? '/embed/mal/' : '/embed/ani/') + id + '/' + ep;
            const params = new URLSearchParams();
            if (track !== 'sub') params.set('track', track);
            if (player === 'custom') params.set('player', 'custom');

            const qs = params.toString() ? ('?' + params.toString()) : '';
            const fullUrl = window.location.origin + path + qs;

            document.getElementById('display-stream-url').innerText = fullUrl;

            const embedInput = document.getElementById('display-embed-code');
            if (embedInput) {
                embedInput.value = '<iframe src="' + fullUrl + '" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay; fullscreen; picture-in-picture"></iframe>';
            }

            return fullUrl;
        }

        function mountActiveStream() {
            const fullUrl = refreshStreamRoute();
            const iframe = document.getElementById('live-iframe');
            if (iframe) iframe.src = fullUrl;
        }

        function copyStreamUrl() {
            const url = document.getElementById('display-stream-url').innerText;
            const label = document.getElementById('copy-stream-label');
            navigator.clipboard.writeText(url).then(() => {
                if (label) {
                    label.innerText = 'Copied!';
                    setTimeout(() => { label.innerText = 'Copy URL'; }, 2000);
                }
            }).catch(e => {
                console.error('Copy failed:', e);
            });
        }

        function copyEmbedCode() {
            const embedInput = document.getElementById('display-embed-code');
            const code = embedInput ? embedInput.value : '';
            const label = document.getElementById('copy-embed-label');
            if (!code) return;
            navigator.clipboard.writeText(code).then(() => {
                if (label) {
                    label.innerText = 'Copied!';
                    setTimeout(() => { label.innerText = 'Copy Embed Code'; }, 2000);
                }
            }).catch(e => {
                console.error('Copy failed:', e);
            });
        }

        function copySnippet(snippetId, btnId) {
            const el = document.getElementById(snippetId);
            const btn = document.getElementById(btnId);
            if (!el) return;
            const text = el.innerText;
            navigator.clipboard.writeText(text).then(() => {
                if (btn) {
                    const oldText = btn.innerText;
                    btn.innerText = 'Copied!';
                    setTimeout(() => { btn.innerText = oldText; }, 2000);
                }
            }).catch(e => {
                console.error('Copy failed:', e);
            });
        }

        function switchSuiteTab(tabKey, btn) {
            document.querySelectorAll('.docs-pill-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.docs-view-pane').forEach(p => p.classList.remove('active'));

            if (btn) btn.classList.add('active');
            const pane = document.getElementById('view-' + tabKey);
            if (pane) pane.classList.add('active');
        }

        function pingTelemetry(isManual) {
            const p1 = document.getElementById('pill-n1');
            const p2 = document.getElementById('pill-n2');
            const p3 = document.getElementById('pill-n3');

            const l1 = document.getElementById('lat-n1');
            const l2 = document.getElementById('lat-n2');
            const l3 = document.getElementById('lat-n3');

            if (isManual) {
                if (l1) l1.innerText = 'Probing...';
                if (l2) l2.innerText = 'Probing...';
                if (l3) l3.innerText = 'Probing...';
            }

            fetch('/api/health?fresh=1')
                .then(r => r.json())
                .then(d => {
                    const servers = (d && d.servers) ? d.servers : [];
                    function updateNode(srv, pillEl, latEl) {
                        if (!pillEl || !latEl) return;
                        if (!srv || srv.status === 'offline') {
                            pillEl.innerText = 'Offline';
                            pillEl.style.color = '#f87171';
                            latEl.innerText = 'Timeout';
                        } else {
                            pillEl.innerText = 'Operational';
                            pillEl.style.color = '#22c55e';
                            latEl.innerText = srv.latencyMs ? (srv.latencyMs + 'ms') : 'Fast';
                        }
                    }

                    updateNode(servers.find(s => s.id === 1), p1, l1);
                    updateNode(servers.find(s => s.id === 2), p2, l2);
                    updateNode(servers.find(s => s.id === 3), p3, l3);
                })
                .catch(err => {
                    console.warn('Telemetry ping error:', err);
                });
        }

        function mountAnimePreset(aniId, ep, title) {
            const catInput = document.getElementById('stream-catalog');
            const idInput = document.getElementById('stream-id');
            const epInput = document.getElementById('stream-ep');

            if (catInput) catInput.value = 'ani';
            if (idInput) idInput.value = String(aniId);
            if (epInput) epInput.value = String(ep || 1);

            mountActiveStream();

            const studioEl = document.getElementById('studio');
            if (studioEl) {
                studioEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            document.querySelectorAll('.anime-card').forEach(function(c) {
                c.classList.remove('is-active-stream');
            });
            const activeCard = document.getElementById('card-' + aniId);
            if (activeCard) {
                activeCard.classList.add('is-active-stream');
            }
        }

        function filterAnimeCards(category, btn) {
            document.querySelectorAll('.filter-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            if (btn) btn.classList.add('active');

            const cards = document.querySelectorAll('.anime-card');
            cards.forEach(function(c) {
                const cat = c.getAttribute('data-category') || '';
                if (category === 'all' || cat.indexOf(category) !== -1) {
                    c.style.display = 'flex';
                } else {
                    c.style.display = 'none';
                }
            });
        }

        window.addEventListener('DOMContentLoaded', () => {
            mountActiveStream();
            pingTelemetry(false);
        });
    </script>
</body>
</html>`;
}
