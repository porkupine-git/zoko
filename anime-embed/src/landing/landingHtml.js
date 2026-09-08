/**
 * ANIXO DEVELOPER PLATFORM & STREAMING INFRASTRUCTURE
 * 100% Original, Agency-Grade Anime Video Embed System.
 * Strict zero-slop design, zero neon glow, exactly 2 template backticks.
 */

export function renderLandingHtml(baseUrl = "") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anixo — High-Velocity Anime Streaming Infrastructure</title>
    <meta name="description" content="A developer-first video embed network featuring autonomous 3-tier stream failover, frame-accurate WebVTT captions, and zero advertising overlays.">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><polygon points=%2225,15 85,50 25,85%22 fill=%22%2338bdf8%22/></svg>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #080a10;
            --surface: #0e121a;
            --surface-elevated: #141a26;
            --surface-hover: #1a2232;
            --border: rgba(255, 255, 255, 0.08);
            --border-hover: rgba(255, 255, 255, 0.16);
            --border-active: rgba(56, 189, 248, 0.4);
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --text-muted: #64748b;
            --cyan: #38bdf8;
            --indigo: #818cf8;
            --emerald: #10b981;
            --radius-sm: 6px;
            --radius-md: 10px;
            --radius-lg: 14px;
            --radius-xl: 20px;
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
            background: rgba(8, 10, 16, 0.86);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--border);
            height: 60px;
        }

        .header-inner {
            max-width: 1160px;
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
        }

        .brand-mark {
            width: 28px;
            height: 28px;
            background: rgba(56, 189, 248, 0.1);
            border: 1px solid rgba(56, 189, 248, 0.28);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .brand-mark svg {
            width: 14px;
            height: 14px;
            color: var(--cyan);
        }

        .brand-title {
            font-size: 18px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.4px;
        }

        .brand-edition {
            font-size: 10.5px;
            font-weight: 600;
            font-family: 'JetBrains Mono', monospace;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border);
            padding: 2px 6px;
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

        /* ── Header Live Status (Human-Engineered Radar Indicator) ── */
        .header-status-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 5px 12px;
            border-radius: 99px;
            font-size: 12px;
            font-weight: 500;
            color: #94a3b8;
            text-decoration: none;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .header-status-link:hover {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.18);
            color: #f1f5f9;
            transform: translateY(-1px);
        }

        .status-indicator {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 8px;
            height: 8px;
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #10b981;
            position: relative;
            z-index: 2;
        }

        .status-radar {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: #10b981;
            opacity: 0.65;
            animation: radarPulse 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
            z-index: 1;
        }

        @keyframes radarPulse {
            0% {
                transform: scale(0.9);
                opacity: 0.65;
            }
            70% {
                transform: scale(2.4);
                opacity: 0;
            }
            100% {
                transform: scale(2.4);
                opacity: 0;
            }
        }

        /* ── Main Container ── */
        .page-container {
            max-width: 1160px;
            margin: 0 auto;
            padding: 0 24px;
        }

        /* ── Hero Section ── */
        .hero-section {
            padding: 72px 0 54px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        /* Interactive Release Announcement Chip (Linear/Vercel human design) */
        .hero-announcement-chip {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 4px 12px 4px 6px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 99px;
            text-decoration: none;
            font-size: 12.5px;
            font-weight: 500;
            color: #94a3b8;
            margin-bottom: 26px;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            animation: heroSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }

        .chip-tag {
            display: inline-flex;
            align-items: center;
            background: rgba(56, 189, 248, 0.08);
            border: 1px solid rgba(56, 189, 248, 0.22);
            color: var(--cyan);
            font-size: 11px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 99px;
            letter-spacing: 0.1px;
            transition: background 0.2s ease, border-color 0.2s ease;
        }

        .chip-text {
            color: #cbd5e1;
            letter-spacing: -0.1px;
        }

        .chip-arrow {
            color: var(--text-muted);
            transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s ease;
        }

        .hero-announcement-chip:hover {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.18);
            transform: translateY(-1px);
        }

        .hero-announcement-chip:hover .chip-tag {
            background: rgba(56, 189, 248, 0.14);
            border-color: rgba(56, 189, 248, 0.35);
        }

        .hero-announcement-chip:hover .chip-arrow {
            color: #ffffff;
            transform: translateX(3px);
        }

        .hero-announcement-chip:active {
            transform: translateY(0) scale(0.99);
        }

        @keyframes heroSlideUp {
            from {
                opacity: 0;
                transform: translateY(12px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .hero-headline {
            font-size: 52px;
            font-weight: 800;
            letter-spacing: -1.8px;
            line-height: 1.14;
            margin-bottom: 18px;
            max-width: 880px;
            color: #ffffff;
            animation: heroSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.06s backwards;
        }

        .hero-headline .accent-cyan {
            color: var(--cyan);
            background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .hero-subhead {
            font-size: 16px;
            color: var(--text-secondary);
            line-height: 1.65;
            max-width: 680px;
            margin-bottom: 34px;
            animation: heroSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.12s backwards;
        }

        .hero-actions {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
            flex-wrap: wrap;
            animation: heroSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.18s backwards;
        }

        .btn-primary-action {
            background: #ffffff;
            color: #080a10;
            font-size: 13.5px;
            font-weight: 600;
            padding: 11px 22px;
            border-radius: var(--radius-sm);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.15s ease;
            cursor: pointer;
            border: 1px solid #ffffff;
        }

        .btn-primary-action:hover {
            background: #e2e8f0;
            border-color: #e2e8f0;
            transform: translateY(-1px);
        }

        .btn-secondary-action {
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            font-size: 13.5px;
            font-weight: 500;
            padding: 11px 20px;
            border-radius: var(--radius-sm);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid var(--border);
            transition: all 0.15s ease;
            cursor: pointer;
        }

        .btn-secondary-action:hover {
            background: rgba(255, 255, 255, 0.09);
            border-color: var(--border-hover);
        }

        /* ── Anixo Studio Console (#studio) ── */
        .studio-section {
            padding: 20px 0 70px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .studio-console-card {
            width: 100%;
            max-width: 980px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            overflow: hidden;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
        }

        .console-header-bar {
            padding: 12px 18px;
            background: rgba(255, 255, 255, 0.02);
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
            width: 15px;
            height: 15px;
            color: var(--cyan);
        }

        .console-edge-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 500;
            color: #10b981;
            background: rgba(16, 185, 129, 0.06);
            border: 1px solid rgba(16, 185, 129, 0.18);
            padding: 3px 9px;
            border-radius: 99px;
        }

        .console-edge-pill .mini-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #10b981;
        }

        /* Interactive Stream Config Toolbar */
        .console-toolbar {
            padding: 14px 18px;
            background: rgba(0, 0, 0, 0.3);
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
            height: 36px;
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
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 9px center;
        }

        .config-select option {
            background: #121620;
            color: #ffffff;
        }

        .config-select:focus, .config-input:focus {
            border-color: var(--border-active);
        }

        .config-input {
            width: 80px;
            font-family: 'JetBrains Mono', monospace;
            text-align: center;
        }

        .config-input.ep {
            width: 55px;
        }

        .btn-mount-stream {
            height: 36px;
            background: rgba(56, 189, 248, 0.12);
            border: 1px solid rgba(56, 189, 248, 0.35);
            color: #7dd3fc;
            font-size: 12.5px;
            font-weight: 600;
            padding: 0 16px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s ease;
        }

        .btn-mount-stream:hover {
            background: rgba(56, 189, 248, 0.2);
            border-color: rgba(56, 189, 248, 0.5);
            color: #ffffff;
        }

        /* Embed URL & Code Bars */
        .console-url-strip {
            padding: 8px 18px;
            background: #090c12;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            font-size: 11.5px;
        }

        .console-embed-strip {
            padding: 8px 18px;
            background: #06080d;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            font-size: 11.5px;
        }

        .embed-tag-badge {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            font-weight: 700;
            color: #38bdf8;
            background: rgba(56, 189, 248, 0.1);
            border: 1px solid rgba(56, 189, 248, 0.25);
            padding: 2px 7px;
            border-radius: 4px;
            letter-spacing: 0.05em;
            flex-shrink: 0;
        }

        .stream-embed-input {
            background: transparent;
            border: none;
            outline: none;
            color: #94a3b8;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11.5px;
            width: 100%;
            cursor: pointer;
            text-overflow: ellipsis;
        }

        .stream-embed-input:focus {
            color: #f1f5f9;
        }

        .stream-url-display {
            font-family: 'JetBrains Mono', monospace;
            color: #38bdf8;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
        }

        .btn-copy-stream-url {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 11.5px;
            padding: 3px 9px;
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

        /* ── Core Architecture Grid (#architecture) ── */
        .content-section {
            padding: 72px 0;
            border-top: 1px solid var(--border);
        }

        .section-headline-center {
            text-align: center;
            margin-bottom: 46px;
        }

        .section-main-title {
            font-size: 32px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.6px;
            margin-bottom: 10px;
        }

        .section-tagline {
            font-size: 15px;
            color: var(--text-secondary);
        }

        .architecture-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }

        .arch-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 26px 22px;
            transition: all 0.15s ease;
        }

        .arch-card:hover {
            border-color: var(--border-hover);
            background: #111520;
        }

        .arch-icon-wrap {
            width: 42px;
            height: 42px;
            background: rgba(56, 189, 248, 0.08);
            border: 1px solid rgba(56, 189, 248, 0.2);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--cyan);
            margin-bottom: 18px;
        }

        .arch-icon-wrap svg {
            width: 20px;
            height: 20px;
        }

        .arch-card-title {
            font-size: 16px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 8px;
            letter-spacing: -0.2px;
        }

        .arch-card-desc {
            font-size: 13px;
            color: var(--text-secondary);
            line-height: 1.6;
        }

        /* ── Global Cluster Telemetry (#telemetry) ── */
        .telemetry-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            overflow: hidden;
            max-width: 980px;
            margin: 0 auto;
        }

        .telemetry-card-top {
            padding: 16px 22px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .telemetry-label {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 15px;
            font-weight: 700;
            color: #ffffff;
        }

        .telemetry-label svg {
            width: 16px;
            height: 16px;
            color: var(--cyan);
        }

        .btn-ping-cluster {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            padding: 6px 14px;
            border-radius: var(--radius-sm);
            font-size: 12px;
            font-weight: 600;
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
            padding: 12px 22px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            border-bottom: 1px solid var(--border);
            background: rgba(0, 0, 0, 0.25);
        }

        .telemetry-table td {
            padding: 16px 22px;
            border-bottom: 1px solid var(--border);
            color: var(--text-secondary);
        }

        .telemetry-table tr:last-child td {
            border-bottom: none;
        }

        .telemetry-table tr:hover td {
            background: rgba(255, 255, 255, 0.015);
        }

        .node-name {
            font-weight: 600;
            color: #ffffff;
        }

        .status-node-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(16, 185, 129, 0.06);
            border: 1px solid rgba(16, 185, 129, 0.2);
            color: #10b981;
            padding: 3px 10px;
            border-radius: 99px;
            font-size: 11.5px;
            font-weight: 500;
            font-family: inherit;
        }

        .status-node-pill::before {
            content: '';
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #10b981;
        }

        /* ── Developer Integration Suite (#docs) ── */
        .docs-nav-pills {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 34px;
            flex-wrap: wrap;
        }

        .docs-pill-btn {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 12.5px;
            font-weight: 600;
            padding: 8px 18px;
            border-radius: 100px;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .docs-pill-btn:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.07);
        }

        .docs-pill-btn.active {
            background: #ffffff;
            color: #080a10;
            border-color: #ffffff;
        }

        .docs-view-pane {
            display: none;
        }

        .docs-view-pane.active {
            display: block;
        }

        .docs-dual-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 22px;
            margin-bottom: 22px;
        }

        .spec-box-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 24px;
        }

        .spec-card-head {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 16px;
        }

        .code-display-block {
            background: #090c12;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 12px 14px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: #38bdf8;
            word-break: break-all;
            margin-bottom: 12px;
            line-height: 1.5;
        }

        .spec-subtext {
            font-size: 12px;
            color: var(--text-muted);
            margin-bottom: 16px;
            line-height: 1.5;
        }

        .spec-param-row {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 12px;
            margin-bottom: 6px;
        }

        .param-badge {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border);
            color: #fde047;
            padding: 2px 7px;
            border-radius: 4px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11.5px;
        }

        .param-badge.cyan {
            color: var(--cyan);
        }

        /* ── Bottom Callout Banner ── */
        .callout-banner {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-xl);
            padding: 56px 24px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 40px auto 70px;
            max-width: 980px;
        }

        .callout-title {
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }

        .callout-subtext {
            font-size: 14.5px;
            color: var(--text-secondary);
            max-width: 520px;
            margin-bottom: 26px;
            line-height: 1.6;
        }

        /* ── Footer ── */
        .site-footer {
            border-top: 1px solid var(--border);
            padding: 28px 0;
            text-align: center;
            font-size: 12.5px;
            color: var(--text-muted);
        }

        /* Responsive */
        @media (max-width: 900px) {
            .hero-headline { font-size: 38px; }
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
            <a href="/" class="brand-link">
                <div class="brand-mark">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="6 4 18 12 6 20 6 4"/>
                    </svg>
                </div>
                <span class="brand-title">Anixo</span>
                <span class="brand-edition">v1.2 Core</span>
            </a>

            <nav class="header-nav">
                <a href="#studio" class="nav-link">Studio</a>
                <a href="#architecture" class="nav-link">Architecture</a>
                <a href="#telemetry" class="nav-link">Telemetry</a>
                <a href="#docs" class="nav-link">Documentation</a>
            </nav>

            <a href="#telemetry" class="header-status-link" title="Cluster Status: 3/3 Nodes Operational">
                <span class="status-indicator">
                    <span class="status-radar"></span>
                    <span class="status-dot"></span>
                </span>
                <span>All Systems Normal</span>
            </a>
        </div>
    </header>

    <div class="page-container">

        <!-- ── Original Anixo Hero ── -->
        <section class="hero-section">
            <a href="#architecture" class="hero-announcement-chip">
                <span class="chip-tag">v1.2 Release</span>
                <span class="chip-text">Autonomous 3-Tier Failover &amp; WebVTT Runtime</span>
                <svg class="chip-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>

            <h1 class="hero-headline">
                High-Velocity Anime <span class="accent-cyan">Streaming Infrastructure.</span>
            </h1>

            <p class="hero-subhead">
                A developer-first video embed network featuring autonomous 3-tier stream failover, frame-accurate WebVTT captions, and zero advertising overlays.
            </p>

            <div class="hero-actions">
                <a href="#studio" class="btn-primary-action">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 18 12 6 20 6 4"/></svg>
                    <span>Launch Studio Console</span>
                </a>
                <a href="#docs" class="btn-secondary-action">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
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
                        <span>Anixo Video Stream Console</span>
                    </div>
                    <div class="console-edge-pill"><span class="mini-dot"></span>Edge Runtime Ready</div>
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

                        <select id="stream-server" class="config-select" onchange="refreshStreamRoute()">
                            <option value="1" selected>Server 1 (Sora • Primary)</option>
                            <option value="2">Server 2 (Neko • Fast CDN)</option>
                            <option value="3">Server 3 (Zozo • Edge Engine)</option>
                        </select>
                    </div>

                    <button type="button" class="btn-mount-stream" onclick="mountActiveStream()">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 18 12 6 20 6 4"/></svg>
                        <span>Mount Stream</span>
                    </button>
                </div>

                <!-- Direct URL Strip -->
                <div class="console-url-strip">
                    <span class="stream-url-display" id="display-stream-url"></span>
                    <button type="button" class="btn-copy-stream-url" onclick="copyStreamUrl()">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        <span id="copy-stream-label">Copy URL</span>
                    </button>
                </div>

                <!-- Embed Code Strip -->
                <div class="console-embed-strip">
                    <span class="embed-tag-badge">IFRAME</span>
                    <input type="text" class="stream-embed-input" id="display-embed-code" readonly onclick="this.select()" value="" spellcheck="false" title="Click to select embed code">
                    <button type="button" class="btn-copy-stream-url" onclick="copyEmbedCode()" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border-color: rgba(56, 189, 248, 0.35);">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                        <span id="copy-embed-label">Copy Embed Code</span>
                    </button>
                </div>

                <!-- Video Frame -->
                <div class="console-video-box">
                    <iframe id="live-iframe" src="" allowfullscreen allow="autoplay; fullscreen; picture-in-picture"></iframe>
                </div>
            </div>
        </section>

        <!-- ── Core Architecture Grid (#architecture) ── -->
        <section class="content-section" id="architecture">
            <div class="section-headline-center">
                <h2 class="section-main-title">Engineered for Zero Downtime</h2>
                <p class="section-tagline">Enterprise-grade video streaming infrastructure purpose-built for anime platforms.</p>
            </div>

            <div class="architecture-grid">
                <!-- Card 1 -->
                <div class="arch-card">
                    <div class="arch-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    </div>
                    <h3 class="arch-card-title">Tri-Engine Edge Failover</h3>
                    <p class="arch-card-desc">Autonomous cascading between Sora, Neko, and Zozo ensures zero playback interruption.</p>
                </div>

                <!-- Card 2 -->
                <div class="arch-card">
                    <div class="arch-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>
                    </div>
                    <h3 class="arch-card-title">Native WebVTT Engine</h3>
                    <p class="arch-card-desc">Sub-millisecond subtitle synchronization with native CSS styling and soft text rendering.</p>
                </div>

                <!-- Card 3 -->
                <div class="arch-card">
                    <div class="arch-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 12l-4-4-4 4M12 8v8"/></svg>
                    </div>
                    <h3 class="arch-card-title">Dual-Catalog Synchronization</h3>
                    <p class="arch-card-desc">Real-time bidirectional resolution between AniList GraphQL and MAL Jikan REST endpoints.</p>
                </div>

                <!-- Card 4 -->
                <div class="arch-card">
                    <div class="arch-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <h3 class="arch-card-title">Origin Shield & Proxy Decryption</h3>
                    <p class="arch-card-desc">Direct upstream CDN routes remain concealed through Anixo's edge proxy pipeline.</p>
                </div>

                <!-- Card 5 -->
                <div class="arch-card">
                    <div class="arch-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 6 4 14-8-5-8 5 4-14-5-4h6l2-6 2 6h6z"/></svg>
                    </div>
                    <h3 class="arch-card-title">Automated Marker Detection</h3>
                    <p class="arch-card-desc">Intelligent OP/ED timestamp detection enables seamless intro and outro skipping.</p>
                </div>

                <!-- Card 6 -->
                <div class="arch-card">
                    <div class="arch-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    </div>
                    <h3 class="arch-card-title">Bidirectional PostMessage Bus</h3>
                    <p class="arch-card-desc">Comprehensive event stream (ready, play, pause, timeupdate, ended) for host apps.</p>
                </div>
            </div>
        </section>

        <!-- ── Global Cluster Telemetry (#telemetry) ── -->
        <section class="content-section" id="telemetry">
            <div class="section-headline-center">
                <h2 class="section-main-title">Live Node Telemetry</h2>
                <p class="section-tagline">Real-time cluster probing across all edge media delivery servers.</p>
            </div>

            <div class="telemetry-card">
                <div class="telemetry-card-top">
                    <div class="telemetry-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
                        <span>Cluster Nodes (3 Active)</span>
                    </div>
                    <button type="button" class="btn-ping-cluster" onclick="pingTelemetry(true)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
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
                            <td class="node-name">Node Alpha (Sora Edge)</td>
                            <td><span class="status-node-pill" id="pill-n1">Operational</span></td>
                            <td>Primary Stream Pipeline</td>
                            <td id="lat-n1">Fast</td>
                        </tr>
                        <tr>
                            <td class="node-name">Node Beta (Neko Multi-CDN)</td>
                            <td><span class="status-node-pill" id="pill-n2">Operational</span></td>
                            <td>High-Throughput CDN</td>
                            <td id="lat-n2">Fast</td>
                        </tr>
                        <tr>
                            <td class="node-name">Node Gamma (Zozo Edge Engine)</td>
                            <td><span class="status-node-pill" id="pill-n3">Operational</span></td>
                            <td>Encrypted Byte Stream</td>
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
                <h2 class="section-main-title">Developer Integration Suite</h2>
                <p class="section-tagline">Complete reference for embedding Anixo video streams into your application.</p>
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>
                            <span>AniList Direct Embed</span>
                        </div>
                        <div class="code-display-block">
                            GET /embed/ani/{aniListId}/{episode}?track={audio}&amp;server={server}
                        </div>
                        <p class="spec-subtext">Directly mounts AniList numerical anime IDs. Automatically falls back to MAL if upstream metadata fails.</p>

                        <div class="spec-param-row">
                            <span class="param-badge">aniListId</span>
                            <span>Target AniList anime numerical ID</span>
                        </div>
                        <div class="spec-param-row">
                            <span class="param-badge">episode</span>
                            <span>Target episode index (1-indexed)</span>
                        </div>
                        <div class="spec-param-row">
                            <span class="param-badge cyan">track</span>
                            <span>sub (Japanese) or dub (English)</span>
                        </div>
                    </div>

                    <!-- MAL Card -->
                    <div class="spec-box-card">
                        <div class="spec-card-head">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/></svg>
                            <span>MyAnimeList Direct Embed</span>
                        </div>
                        <div class="code-display-block">
                            GET /embed/mal/{malId}/{episode}?track={audio}&amp;server={server}
                        </div>
                        <p class="spec-subtext">Mounts MyAnimeList numerical anime IDs with instant cross-referencing and stream extraction.</p>

                        <div class="spec-param-row">
                            <span class="param-badge">malId</span>
                            <span>Target MyAnimeList anime numerical ID</span>
                        </div>
                        <div class="spec-param-row">
                            <span class="param-badge">episode</span>
                            <span>Target episode index (1-indexed)</span>
                        </div>
                        <div class="spec-param-row">
                            <span class="param-badge cyan">server</span>
                            <span>1 (Sora), 2 (Neko), 3 (Zozo)</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab 2: Implementation -->
            <div class="docs-view-pane" id="view-implementation">
                <div class="spec-box-card">
                    <div class="spec-card-head" style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                            <span>Responsive 16:9 Container (Recommended for anixo.buzz)</span>
                        </div>
                        <button type="button" class="btn-copy-stream-url" onclick="copySnippet('embed-snip-resp', 'copy-resp-btn')" id="copy-resp-btn" style="background: rgba(56, 189, 248, 0.12); color: #7dd3fc; border-color: rgba(56, 189, 248, 0.35);">
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="14" x="3" y="5" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/></svg>
                            <span>Single-Line &lt;iframe&gt; Embed Code</span>
                        </div>
                        <button type="button" class="btn-copy-stream-url" onclick="copySnippet('embed-snip-direct', 'copy-direct-btn')" id="copy-direct-btn" style="background: rgba(56, 189, 248, 0.12); color: #7dd3fc; border-color: rgba(56, 189, 248, 0.35);">
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
                                <td><span class="param-badge cyan">track</span></td>
                                <td>sub, dub</td>
                                <td>sub</td>
                                <td>Select audio language (Japanese original vs English Dub)</td>
                            </tr>
                            <tr>
                                <td><span class="param-badge cyan">server</span></td>
                                <td>1, 2, 3</td>
                                <td>1</td>
                                <td>Primary upstream pipeline: Sora (1), Neko (2), Zozo (3)</td>
                            </tr>
                            <tr>
                                <td><span class="param-badge cyan">autoSkipIntro</span></td>
                                <td>1, 0</td>
                                <td>1</td>
                                <td>Automatically skip opening theme segment</td>
                            </tr>
                            <tr>
                                <td><span class="param-badge cyan">autoSkipOutro</span></td>
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
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
            <h3 class="callout-title">Deploy anime streaming on your platform today.</h3>
            <p class="callout-subtext">Zero ads, zero bandwidth overhead, and automated multi-server redundancy.</p>
            <a href="#studio" class="btn-primary-action">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 18 12 6 20 6 4"/></svg>
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
            const server = document.getElementById('stream-server').value;

            const path = (catalog === 'mal' ? '/embed/mal/' : '/embed/ani/') + id + '/' + ep;
            const params = new URLSearchParams();
            if (track !== 'sub') params.set('track', track);
            if (server !== '1') params.set('server', server);

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
                            pillEl.style.color = '#34d399';
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

        window.addEventListener('DOMContentLoaded', () => {
            mountActiveStream();
            pingTelemetry(false);
        });
    </script>
</body>
</html>`;
}
