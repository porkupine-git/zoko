/**
 * VIDPLAY / VIDCLOUD DEVELOPER PLATFORM & EMBED STUDIO
 * Clean, Minimalist, High-Fidelity Design
 * Color Palette: Deep Obsidian Black, Warm Charcoal Gray, Rich Coffee Mocha & Caramel
 * Zero AI Slop · No unnecessary badges · Tasteful editorial typography
 */

export function renderLandingHtml(baseUrl = "") {
    const domain = baseUrl ? new URL(baseUrl).hostname : "vidcloud.sbs";

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VidPlay — High-Performance Anime Video Infrastructure</title>
    <meta name="description" content="A focused, ultra-fast embeddable player for anime host platforms. Zero bloat, multi-CDN resiliency, and 0ms edge delivery.">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23141416'/%3E%3Cpolygon points='12,9 24,16 12,23' fill='%23C68B59'/%3E%3C/svg%3E">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            /* Black & Charcoal Dark Gray Base */
            --bg: #09090b;
            --bg-elevated: #111113;
            --card-bg: #141416;
            --card-border: rgba(255, 255, 255, 0.07);
            --card-border-hover: rgba(198, 139, 89, 0.35);
            --input-bg: #18181b;
            --input-border: rgba(255, 255, 255, 0.08);
            --code-bg: #0c0c0e;

            /* Coffee & Caramel Palette */
            --coffee-primary: #c68b59;
            --coffee-hover: #b07545;
            --coffee-light: #d4a373;
            --coffee-cream: #e6ccb2;
            --coffee-tint: rgba(198, 139, 89, 0.1);
            --coffee-border: rgba(198, 139, 89, 0.25);
            --coffee-glow: rgba(198, 139, 89, 0.16);

            /* Typography Colors */
            --text-main: #f5f3ef;
            --text-muted: #9c9a95;
            --text-subtle: #666460;

            /* Accent Status */
            --accent-green: #10b981;
            --green-tint: rgba(16, 185, 129, 0.12);

            /* Dimensions & Radius */
            --radius-sm: 6px;
            --radius-md: 10px;
            --radius-lg: 14px;
            --radius-xl: 18px;
            --radius-full: 9999px;

            --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
            background-color: var(--bg);
            color: var(--text-main);
            font-family: var(--font-sans);
            -webkit-font-smoothing: antialiased;
        }

        body {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
            background: var(--bg);
        }

        /* ── Top Navigation ── */
        .header {
            position: sticky;
            top: 0;
            z-index: 100;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 28px;
            background: rgba(9, 9, 11, 0.85);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid var(--card-border);
        }

        .header-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            color: var(--text-main);
        }

        .brand-logo {
            width: 28px;
            height: 28px;
            border-radius: var(--radius-sm);
            background: linear-gradient(135deg, #8c5932, #c68b59);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 12px var(--coffee-glow);
        }

        .brand-logo svg {
            width: 14px;
            height: 14px;
            fill: #ffffff;
            margin-left: 2px;
        }

        .brand-text {
            font-size: 16px;
            font-weight: 700;
            letter-spacing: -0.02em;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-main);
        }

        .brand-badge {
            font-size: 10.5px;
            font-weight: 600;
            color: var(--coffee-light);
            background: var(--coffee-tint);
            border: 1px solid var(--coffee-border);
            padding: 2px 7px;
            border-radius: var(--radius-full);
            font-family: var(--font-mono);
        }

        .nav-links {
            display: flex;
            align-items: center;
            gap: 24px;
        }

        .nav-link {
            font-size: 13.5px;
            font-weight: 500;
            color: var(--text-muted);
            text-decoration: none;
            transition: color 0.15s ease;
        }

        .nav-link:hover {
            color: var(--text-main);
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .search-trigger {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--input-bg);
            border: 1px solid var(--card-border);
            padding: 6px 12px;
            border-radius: var(--radius-full);
            color: var(--text-subtle);
            font-size: 12.5px;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .search-trigger:hover {
            border-color: var(--coffee-border);
            color: var(--text-muted);
        }

        .kbd-badge {
            font-family: var(--font-mono);
            font-size: 10px;
            background: rgba(255, 255, 255, 0.06);
            padding: 1px 5px;
            border-radius: 3px;
            color: var(--text-muted);
        }

        .btn-docs {
            background: var(--input-bg);
            color: var(--text-main);
            border: 1px solid var(--card-border);
            font-size: 13px;
            font-weight: 600;
            padding: 6px 14px;
            border-radius: var(--radius-full);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s ease;
        }

        .btn-docs:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: var(--card-border-hover);
        }

        /* ── Hero Section with Vertical Anime Marquee ── */
        .hero-wrapper {
            position: relative;
            min-height: 520px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 70px 20px 50px;
            overflow: hidden;
            text-align: center;
        }

        /* Ambient Warm Coffee Ember */
        .hero-glow {
            position: absolute;
            top: 25%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 580px;
            height: 380px;
            background: radial-gradient(circle, rgba(198, 139, 89, 0.12) 0%, rgba(138, 85, 45, 0.04) 50%, transparent 70%);
            filter: blur(64px);
            z-index: 2;
            pointer-events: none;
        }

        /* Background Anime Poster Marquee */
        .marquee-bg {
            position: absolute;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
            opacity: 0.14;
            z-index: 1;
        }

        .marquee-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 16px;
            padding: 0 16px;
            width: 100%;
            height: 100%;
        }

        .marquee-col {
            display: flex;
            flex-direction: column;
            gap: 16px;
            animation-duration: 50s;
            animation-iteration-count: infinite;
            animation-timing-function: linear;
        }

        .marquee-up { animation-name: scrollUp; }
        .marquee-down { animation-name: scrollDown; }

        @keyframes scrollUp {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
        }

        @keyframes scrollDown {
            0% { transform: translateY(-50%); }
            100% { transform: translateY(0); }
        }

        .poster-card {
            width: 100%;
            aspect-ratio: 0.72;
            border-radius: var(--radius-md);
            overflow: hidden;
            background: #18181b;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .poster-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        /* Subtle Edge Masks */
        .mask-top {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 140px;
            background: linear-gradient(to bottom, var(--bg) 0%, rgba(9, 9, 11, 0.8) 60%, transparent 100%);
            z-index: 2;
            pointer-events: none;
        }

        .mask-bottom {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 200px;
            background: linear-gradient(to top, var(--bg) 0%, rgba(9, 9, 11, 0.9) 65%, transparent 100%);
            z-index: 2;
            pointer-events: none;
        }

        /* Hero Content */
        .hero-content {
            position: relative;
            z-index: 10;
            max-width: 820px;
            margin: 0 auto;
        }

        .hero-badge-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 12px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-full);
            color: var(--text-muted);
            font-size: 12.5px;
            font-weight: 500;
            text-decoration: none;
            margin-bottom: 20px;
            transition: all 0.15s ease;
        }

        .hero-badge-link:hover {
            border-color: var(--coffee-border);
            color: var(--coffee-light);
        }

        .hero-title {
            font-size: 46px;
            font-weight: 700;
            line-height: 1.15;
            letter-spacing: -0.03em;
            color: #ffffff;
            margin-bottom: 16px;
        }

        .hero-title .gradient-text {
            background: linear-gradient(135deg, #ffffff 40%, var(--coffee-cream) 80%, var(--coffee-light) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
            font-size: 16.5px;
            font-weight: 400;
            color: var(--text-muted);
            line-height: 1.6;
            max-width: 620px;
            margin: 0 auto 28px;
        }

        .hero-cta-group {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }

        .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--coffee-primary);
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            padding: 9px 20px;
            border-radius: var(--radius-md);
            text-decoration: none;
            box-shadow: 0 4px 14px var(--coffee-glow);
            transition: all 0.15s ease;
            cursor: pointer;
            border: none;
        }

        .btn-primary:hover {
            background: var(--coffee-hover);
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(198, 139, 89, 0.28);
        }

        .btn-secondary {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--input-bg);
            color: var(--text-main);
            font-size: 14px;
            font-weight: 500;
            padding: 9px 20px;
            border-radius: var(--radius-md);
            border: 1px solid var(--card-border);
            text-decoration: none;
            transition: all 0.15s ease;
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.06);
            border-color: var(--card-border-hover);
        }

        /* ── Main Container ── */
        .main-container {
            max-width: 1240px;
            margin: 0 auto;
            padding: 0 24px 90px;
            width: 100%;
            position: relative;
            z-index: 10;
        }

        /* ── Two-Column Interactive Studio / Player Tester ── */
        .studio-grid {
            display: grid;
            grid-template-columns: 440px 1fr;
            gap: 22px;
            margin-bottom: 70px;
            align-items: start;
        }

        @media (max-width: 1024px) {
            .studio-grid {
                grid-template-columns: 1fr;
            }
        }

        .card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-lg);
            padding: 22px;
            transition: border-color 0.2s ease;
        }

        .card:hover {
            border-color: var(--card-border-hover);
        }

        .card-header {
            margin-bottom: 18px;
        }

        .card-title {
            font-size: 17px;
            font-weight: 700;
            letter-spacing: -0.015em;
            color: #ffffff;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .anime-pill {
            font-size: 11.5px;
            font-weight: 500;
            color: var(--coffee-light);
            background: var(--coffee-tint);
            border: 1px solid var(--coffee-border);
            padding: 2px 8px;
            border-radius: var(--radius-full);
        }

        .card-desc {
            font-size: 13px;
            color: var(--text-muted);
            line-height: 1.4;
        }

        /* Clean Form Controls */
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 14px;
        }

        .field-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 14px;
        }

        .field-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .input-text, .select-input {
            width: 100%;
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            color: #ffffff;
            font-size: 13.5px;
            padding: 8px 12px;
            border-radius: var(--radius-sm);
            font-family: var(--font-sans);
            outline: none;
            transition: all 0.15s ease;
        }

        .input-text:focus, .select-input:focus {
            border-color: var(--coffee-primary);
            box-shadow: 0 0 0 2px var(--coffee-tint);
        }

        /* Minimalist Segmented Pills */
        .segmented-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            border-radius: var(--radius-sm);
            padding: 3px;
            gap: 3px;
        }

        .segment-btn {
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: 12.5px;
            font-weight: 600;
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .segment-btn.active {
            background: var(--coffee-primary);
            color: #ffffff;
        }

        /* Toggle Switches */
        .toggles-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 16px;
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            border-radius: var(--radius-md);
            padding: 12px;
        }

        .toggle-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            cursor: pointer;
            user-select: none;
        }

        .toggle-title {
            font-size: 12px;
            font-weight: 500;
            color: var(--text-main);
        }

        .switch {
            position: relative;
            display: inline-block;
            width: 32px;
            height: 18px;
            flex-shrink: 0;
        }

        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .slider {
            position: absolute;
            cursor: pointer;
            inset: 0;
            background-color: #27272a;
            transition: .2s;
            border-radius: 20px;
        }

        .slider:before {
            position: absolute;
            content: "";
            height: 12px;
            width: 12px;
            left: 3px;
            bottom: 3px;
            background-color: #ffffff;
            transition: .2s;
            border-radius: 50%;
        }

        input:checked + .slider {
            background-color: var(--coffee-primary);
        }

        input:checked + .slider:before {
            transform: translateX(14px);
        }

        /* Dynamic Route Box */
        .url-contract-card {
            background: var(--code-bg);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-sm);
            padding: 12px 14px;
            margin-bottom: 16px;
        }

        .url-contract-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
        }

        .url-contract-title {
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 700;
            color: var(--text-subtle);
        }

        .copy-url-btn {
            background: transparent;
            border: none;
            color: var(--coffee-light);
            font-size: 11.5px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 2px 4px;
        }

        .copy-url-btn:hover {
            color: var(--coffee-cream);
        }

        .url-contract-text {
            font-family: var(--font-mono);
            font-size: 12px;
            color: var(--coffee-cream);
            word-break: break-all;
            line-height: 1.45;
        }

        /* Right Column Live Preview */
        .preview-player-container {
            width: 100%;
            aspect-ratio: 16/9;
            background: #000000;
            border-radius: var(--radius-md);
            overflow: hidden;
            position: relative;
            border: 1px solid var(--card-border);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
        }

        .preview-player-container iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }

        /* Minimal Event Monitor Terminal */
        .event-terminal {
            margin-top: 14px;
            background: var(--code-bg);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-sm);
            padding: 10px 14px;
            font-family: var(--font-mono);
            font-size: 11.5px;
        }

        .event-terminal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 6px;
            margin-bottom: 6px;
            color: var(--text-subtle);
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--accent-green);
            display: inline-block;
        }

        .event-log-stream {
            max-height: 90px;
            overflow-y: auto;
            display: flex;
            flex-direction: column-reverse;
            gap: 3px;
        }

        .event-entry {
            color: #d4d4d8;
            display: flex;
            align-items: baseline;
            gap: 8px;
        }

        .event-tag {
            color: var(--coffee-light);
            font-weight: 600;
        }

        .event-time {
            color: var(--text-subtle);
            font-size: 10px;
        }

        /* ── Features & Capabilities ── */
        .section-header {
            text-align: center;
            max-width: 600px;
            margin: 0 auto 40px;
        }

        .section-badge {
            font-size: 11px;
            font-weight: 600;
            color: var(--coffee-light);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 8px;
            display: inline-block;
        }

        .section-title {
            font-size: 30px;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #ffffff;
            margin-bottom: 10px;
        }

        .section-subtitle {
            font-size: 15px;
            color: var(--text-muted);
            line-height: 1.5;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 70px;
        }

        @media (max-width: 900px) {
            .features-grid {
                grid-template-columns: 1fr;
            }
        }

        .feature-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-md);
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            transition: border-color 0.2s ease;
        }

        .feature-card:hover {
            border-color: var(--card-border-hover);
        }

        .feature-icon-box {
            width: 36px;
            height: 36px;
            border-radius: var(--radius-sm);
            background: var(--coffee-tint);
            border: 1px solid var(--coffee-border);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--coffee-light);
            margin-bottom: 2px;
        }

        .feature-icon-box svg {
            width: 18px;
            height: 18px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
        }

        .feature-title {
            font-size: 15.5px;
            font-weight: 600;
            color: #ffffff;
        }

        .feature-desc {
            font-size: 13px;
            color: var(--text-muted);
            line-height: 1.5;
        }

        /* ── Code Integration Tabs ── */
        .code-showcase-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-lg);
            overflow: hidden;
            margin-bottom: 70px;
        }

        .code-tabs-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 18px;
            background: var(--bg-elevated);
            border-bottom: 1px solid var(--card-border);
            overflow-x: auto;
        }

        .tabs-list {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .tab-btn {
            background: transparent;
            border: 1px solid transparent;
            color: var(--text-muted);
            font-size: 12.5px;
            font-weight: 500;
            padding: 5px 12px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .tab-btn:hover {
            color: var(--text-main);
        }

        .tab-btn.active {
            background: var(--coffee-tint);
            border-color: var(--coffee-border);
            color: var(--coffee-light);
            font-weight: 600;
        }

        .btn-copy-code {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: var(--input-bg);
            border: 1px solid var(--card-border);
            color: var(--text-muted);
            font-size: 12px;
            font-weight: 500;
            padding: 4px 10px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .btn-copy-code:hover {
            border-color: var(--coffee-border);
            color: var(--text-main);
        }

        .code-editor-body {
            background: var(--code-bg);
            padding: 20px;
            overflow-x: auto;
            font-family: var(--font-mono);
            font-size: 12.5px;
            line-height: 1.6;
            color: #e4e4e7;
        }

        /* ── Documentation Tables ── */
        .docs-section {
            margin-bottom: 70px;
        }

        .docs-table-wrapper {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-lg);
            overflow: hidden;
        }

        .docs-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 13px;
        }

        .docs-table th {
            background: var(--bg-elevated);
            padding: 12px 18px;
            color: var(--text-muted);
            font-weight: 600;
            border-bottom: 1px solid var(--card-border);
            font-size: 11.5px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .docs-table td {
            padding: 14px 18px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            color: var(--text-muted);
            vertical-align: top;
        }

        .docs-table tr:last-child td {
            border-bottom: none;
        }

        .docs-param {
            font-family: var(--font-mono);
            font-weight: 600;
            color: var(--coffee-light);
        }

        .docs-type {
            font-family: var(--font-mono);
            font-size: 11.5px;
            color: var(--text-subtle);
        }

        /* ── Global Search Modal ── */
        .search-modal-backdrop {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            z-index: 1000;
            align-items: flex-start;
            justify-content: center;
            padding-top: 100px;
        }

        .search-modal-backdrop.open {
            display: flex;
        }

        .search-modal {
            width: 100%;
            max-width: 540px;
            background: var(--bg-elevated);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-lg);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
            overflow: hidden;
        }

        .search-modal-input-box {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 18px;
            border-bottom: 1px solid var(--card-border);
        }

        .search-modal-input {
            width: 100%;
            background: transparent;
            border: none;
            color: #ffffff;
            font-size: 14.5px;
            outline: none;
            font-family: var(--font-sans);
        }

        .search-results-list {
            max-height: 320px;
            overflow-y: auto;
            padding: 6px;
        }

        .search-result-item {
            padding: 10px 12px;
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            color: var(--text-main);
            font-size: 13.5px;
            transition: background 0.15s ease;
        }

        .search-result-item:hover {
            background: var(--coffee-tint);
        }

        /* ── Footer ── */
        .footer {
            border-top: 1px solid var(--card-border);
            padding: 36px 24px;
            background: var(--bg);
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            color: var(--text-subtle);
        }

        .footer a {
            color: var(--text-muted);
            text-decoration: none;
            transition: color 0.15s ease;
        }

        .footer a:hover {
            color: var(--coffee-light);
        }

        .footer-status-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11.5px;
            color: var(--accent-green);
            background: var(--green-tint);
            border: 1px solid rgba(16, 185, 129, 0.2);
            padding: 3px 8px;
            border-radius: var(--radius-full);
            font-family: var(--font-mono);
        }

        @media (max-width: 640px) {
            .hero-title { font-size: 34px; }
            .hero-subtitle { font-size: 14.5px; }
            .marquee-grid { grid-template-columns: repeat(3, 1fr); }
            .footer { flex-direction: column; gap: 14px; text-align: center; }
        }
    </style>
</head>
<body>

    <!-- Header Navigation -->
    <header class="header">
        <a href="/" class="header-brand">
            <div class="brand-logo">
                <svg viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20"/></svg>
            </div>
            <div class="brand-text">
                VidPlay
                <span class="brand-badge">Edge</span>
            </div>
        </a>

        <nav class="nav-links">
            <a href="#player-tester" class="nav-link">Player Tester</a>
            <a href="#capabilities" class="nav-link">Capabilities</a>
            <a href="#code-snippets" class="nav-link">Integration</a>
            <a href="#docs" class="nav-link">Docs</a>
            <a href="/admin" class="nav-link">Admin</a>
        </nav>

        <div class="header-actions">
            <button class="search-trigger" id="btn-search-trigger">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>Search anime...</span>
                <span class="kbd-badge">⌘K</span>
            </button>
            <a href="#docs" class="btn-docs">
                Docs
            </a>
        </div>
    </header>

    <!-- Hero Section with Background Anime Marquee -->
    <section class="hero-wrapper">
        <div class="hero-glow"></div>
        <div class="mask-top"></div>
        <div class="mask-bottom"></div>

        <div class="marquee-bg">
            <div class="marquee-grid">
                <!-- Col 1 -->
                <div class="marquee-col marquee-up">
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YJvLbgJQPCoI.jpg" alt="One Piece" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png" alt="Hunter x Hunter" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg" alt="Attack on Titan" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-YJvLbgJQPCoI.jpg" alt="Naruto" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YJvLbgJQPCoI.jpg" alt="One Piece" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png" alt="Hunter x Hunter" loading="lazy"></div>
                </div>
                <!-- Col 2 -->
                <div class="marquee-col marquee-down">
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142838-7BqaDkwsHh6n.jpg" alt="Solo Leveling" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg" alt="Jujutsu Kaisen" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg" alt="Demon Slayer" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-NuZzyTFZqFv1.png" alt="Chainsaw Man" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142838-7BqaDkwsHh6n.jpg" alt="Solo Leveling" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg" alt="Jujutsu Kaisen" loading="lazy"></div>
                </div>
                <!-- Col 3 -->
                <div class="marquee-col marquee-up">
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-kUgkcrfOrkUM.jpg" alt="Death Note" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx269-KxpvBw0aJj1n.png" alt="Bleach" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-1iHzdQo8A7gP.jpg" alt="Fullmetal Alchemist" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-8JtVpPqR7H3.jpg" alt="Dandadan" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-kUgkcrfOrkUM.jpg" alt="Death Note" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx269-KxpvBw0aJj1n.png" alt="Bleach" loading="lazy"></div>
                </div>
                <!-- Col 4 -->
                <div class="marquee-col marquee-down">
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-YJvLbgJQPCoI.jpg" alt="Naruto" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg" alt="Attack on Titan" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YJvLbgJQPCoI.jpg" alt="One Piece" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png" alt="Hunter x Hunter" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-YJvLbgJQPCoI.jpg" alt="Naruto" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg" alt="Attack on Titan" loading="lazy"></div>
                </div>
                <!-- Col 5 -->
                <div class="marquee-col marquee-up">
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg" alt="Jujutsu Kaisen" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142838-7BqaDkwsHh6n.jpg" alt="Solo Leveling" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-NuZzyTFZqFv1.png" alt="Chainsaw Man" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg" alt="Demon Slayer" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg" alt="Jujutsu Kaisen" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142838-7BqaDkwsHh6n.jpg" alt="Solo Leveling" loading="lazy"></div>
                </div>
                <!-- Col 6 -->
                <div class="marquee-col marquee-down">
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-8JtVpPqR7H3.jpg" alt="Dandadan" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-1iHzdQo8A7gP.jpg" alt="Fullmetal Alchemist" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-kUgkcrfOrkUM.jpg" alt="Death Note" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx269-KxpvBw0aJj1n.png" alt="Bleach" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-8JtVpPqR7H3.jpg" alt="Dandadan" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-1iHzdQo8A7gP.jpg" alt="Fullmetal Alchemist" loading="lazy"></div>
                </div>
            </div>
        </div>

        <div class="hero-content">
            <a href="#player-tester" class="hero-badge-link">
                <span>Multi-Engine Stream Mesh</span>
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>

            <h1 class="hero-title">
                The Foundation for <br>
                <span class="gradient-text">Anime Episode Playback</span>
            </h1>

            <p class="hero-subtitle">
                A focused, high-performance embeddable video player for host platforms that need reliable, zero-buffer playback without bloated scripts.
            </p>

            <div class="hero-cta-group">
                <a href="#player-tester" class="btn-primary">
                    Open Player Tester
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
                <a href="#code-snippets" class="btn-secondary">
                    Integration Code
                </a>
            </div>
        </div>
    </section>

    <!-- Main Content Area -->
    <main class="main-container">

        <!-- ── Interactive Studio / Player Tester ── -->
        <section id="player-tester" class="studio-grid">
            
            <!-- Left Configurator Card -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        Player Tester
                        <span class="anime-pill" id="live-anime-title">One Piece</span>
                    </h2>
                    <p class="card-desc">Tune parameters and verify live playback response.</p>
                </div>

                <div class="form-row">
                    <div class="field-group">
                        <label class="field-label" for="cfg-id">AniList ID</label>
                        <input type="number" id="cfg-id" class="input-text" value="21" min="1">
                    </div>
                    <div class="field-group">
                        <label class="field-label" for="cfg-ep">Episode</label>
                        <input type="number" id="cfg-ep" class="input-text" value="1" min="1">
                    </div>
                </div>

                <div class="form-row">
                    <div class="field-group">
                        <label class="field-label">Audio Track</label>
                        <div class="segmented-group">
                            <button type="button" class="segment-btn active" data-variant="sub" id="btn-variant-sub">Sub</button>
                            <button type="button" class="segment-btn" data-variant="dub" id="btn-variant-dub">Dub</button>
                        </div>
                    </div>
                    <div class="field-group">
                        <label class="field-label" for="cfg-server">Stream Cluster</label>
                        <select id="cfg-server" class="select-input">
                            <option value="1" selected>Server 1 (MegaPlay)</option>
                            <option value="2">Server 2 (AniNeko)</option>
                            <option value="3">Server 3 (Zoko)</option>
                        </select>
                    </div>
                </div>

                <!-- Feature Toggles -->
                <div class="toggles-grid">
                    <label class="toggle-item">
                        <span class="toggle-title">Autoplay</span>
                        <div class="switch">
                            <input type="checkbox" id="cfg-autoplay" checked>
                            <span class="slider"></span>
                        </div>
                    </label>
                    <label class="toggle-item">
                        <span class="toggle-title">Muted</span>
                        <div class="switch">
                            <input type="checkbox" id="cfg-muted">
                            <span class="slider"></span>
                        </div>
                    </label>
                    <label class="toggle-item">
                        <span class="toggle-title">Skip Intro</span>
                        <div class="switch">
                            <input type="checkbox" id="cfg-skipintro" checked>
                            <span class="slider"></span>
                        </div>
                    </label>
                    <label class="toggle-item">
                        <span class="toggle-title">Skip Outro</span>
                        <div class="switch">
                            <input type="checkbox" id="cfg-skipoutro" checked>
                            <span class="slider"></span>
                        </div>
                    </label>
                </div>

                <!-- Live URL Contract Bar -->
                <div class="url-contract-card">
                    <div class="url-contract-header">
                        <span class="url-contract-title">Dynamic Embed Route</span>
                        <button type="button" class="copy-url-btn" id="btn-copy-url">
                            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            <span id="copy-url-text">Copy URL</span>
                        </button>
                    </div>
                    <div class="url-contract-text" id="display-embed-url">
                        https://${domain}/embed/ani/21/1?track=sub&server=1
                    </div>
                </div>

                <button type="button" id="btn-mount-player" class="btn-primary" style="width: 100%; justify-content: center; padding: 10px;">
                    Mount in Player
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
            </div>

            <!-- Right Player Preview Card -->
            <div class="card">
                <div class="card-header" style="display:flex; align-items:center; justify-content:space-between;">
                    <div>
                        <h2 class="card-title">Live Player Preview</h2>
                        <p class="card-desc">Clean JW Player engine without third-party redirects.</p>
                    </div>
                    <div class="footer-status-badge">
                        <span class="status-dot"></span>
                        <span id="preview-status-indicator">Player Ready</span>
                    </div>
                </div>

                <!-- 16:9 Video Frame -->
                <div class="preview-player-container">
                    <iframe 
                        id="player-iframe-mount" 
                        src="/embed/ani/21/1?track=sub&server=1&autoPlay=1" 
                        allow="autoplay; fullscreen; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>

                <!-- Real-Time postMessage Monitor Terminal -->
                <div class="event-terminal">
                    <div class="event-terminal-header">
                        <span style="display:flex; align-items:center; gap:6px;">
                            <span class="status-dot"></span>
                            postMessage Event Stream
                        </span>
                        <span>window.parent</span>
                    </div>
                    <div class="event-log-stream" id="event-stream-container">
                        <div class="event-entry">
                            <span class="event-time">[00:00]</span>
                            <span class="event-tag">ready</span>
                            <span>Stream resolved & player ready</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ── Features & Capabilities Section ── -->
        <section id="capabilities" class="capabilities-section">
            <div class="section-header">
                <span class="section-badge">Architecture</span>
                <h2 class="section-title">Built for Host Websites</h2>
                <p class="section-subtitle">A focused, ultra-resilient embed engine engineered for anime streaming platforms.</p>
            </div>

            <div class="features-grid">
                <!-- Card 1 -->
                <div class="feature-card">
                    <div class="feature-icon-box">
                        <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>
                    </div>
                    <h3 class="feature-title">Bilingual Audio Tracks</h3>
                    <p class="feature-desc">Switch between Sub (Original Japanese with English subtitles) and English Dub with parameter pass-through.</p>
                </div>

                <!-- Card 2 -->
                <div class="feature-card">
                    <div class="feature-icon-box">
                        <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
                    </div>
                    <h3 class="feature-title">Multi-Engine Resiliency</h3>
                    <p class="feature-desc">Three independent stream clusters (MegaPlay, AniNeko, Zoko) with automatic cascading failover on missing streams.</p>
                </div>

                <!-- Card 3 -->
                <div class="feature-card">
                    <div class="feature-icon-box">
                        <svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    </div>
                    <h3 class="feature-title">Zero-Buffer HLS Streaming</h3>
                    <p class="feature-desc">Multi-bitrate adaptive HLS playlists with concealed origin proxies for instant first-frame video start.</p>
                </div>

                <!-- Card 4 -->
                <div class="feature-card">
                    <div class="feature-icon-box">
                        <svg viewBox="0 0 24 24"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                    </div>
                    <h3 class="feature-title">AniSkip Integration</h3>
                    <p class="feature-desc">Accurate opening and ending timestamps with automatic skip capability so your users never sit through intros.</p>
                </div>

                <!-- Card 5 -->
                <div class="feature-card">
                    <div class="feature-icon-box">
                        <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <h3 class="feature-title">Smart Resume State</h3>
                    <p class="feature-desc">Save and resume exact playback positions with localStorage sync across episodes and sessions.</p>
                </div>

                <!-- Card 6 -->
                <div class="feature-card">
                    <div class="feature-icon-box">
                        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                    </div>
                    <h3 class="feature-title">Bidirectional postMessage</h3>
                    <p class="feature-desc">Listen to playback events and issue commands (play, pause, seek) directly from your parent site application.</p>
                </div>
            </div>
        </section>

        <!-- ── Code Integration Tabs ── -->
        <section id="code-snippets" class="code-showcase-card">
            <div class="code-tabs-bar">
                <div class="tabs-list">
                    <button type="button" class="tab-btn active" data-target="snippet-iframe">Standard &lt;iframe&gt;</button>
                    <button type="button" class="tab-btn" data-target="snippet-responsive">Responsive 16:9 CSS</button>
                    <button type="button" class="tab-btn" data-target="snippet-react">React / Next.js</button>
                    <button type="button" class="tab-btn" data-target="snippet-sdk">JavaScript SDK</button>
                </div>
                <button type="button" class="btn-copy-code" id="btn-copy-active-code">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <span>Copy Snippet</span>
                </button>
            </div>

            <!-- Snippet 1: Standard iframe -->
            <pre class="code-editor-body" id="snippet-iframe"><code>&lt;iframe 
  src="https://${domain}/embed/ani/21/1?track=sub&server=1" 
  width="100%" 
  height="480" 
  frameborder="0" 
  allow="autoplay; fullscreen; picture-in-picture" 
  allowfullscreen&gt;
&lt;/iframe&gt;</code></pre>

            <!-- Snippet 2: Responsive CSS -->
            <pre class="code-editor-body" id="snippet-responsive" style="display:none;"><code>&lt;style&gt;
  .vidplay-frame {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%; /* 16:9 ratio */
    height: 0;
    overflow: hidden;
    border-radius: 10px;
    background: #000;
  }
  .vidplay-frame iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
&lt;/style&gt;

&lt;div class="vidplay-frame"&gt;
  &lt;iframe 
    src="https://${domain}/embed/ani/21/1?track=sub&server=1" 
    allow="autoplay; fullscreen; picture-in-picture" 
    allowfullscreen&gt;
  &lt;/iframe&gt;
&lt;/div&gt;</code></pre>

            <!-- Snippet 3: React / Next.js -->
            <pre class="code-editor-body" id="snippet-react" style="display:none;"><code>import React, { useEffect } from 'react';

export function VidPlayer({ anilistId = 21, episode = 1, track = 'sub', server = 1 }) {
  useEffect(() => {
    function handleEvent(e) {
      if (e.origin !== "https://${domain}") return;
      if (e.data?.event === "ended") {
        console.log("Episode ended, advance to next episode.");
      }
    }
    window.addEventListener("message", handleEvent);
    return () => window.removeEventListener("message", handleEvent);
  }, []);

  return (
    &lt;div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 10 }}&gt;
      &lt;iframe
        src={\`https://${domain}/embed/ani/\${anilistId}/\${episode}?track=\${track}&server=\${server}\`}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      /&gt;
    &lt;/div&gt;
  );
}</code></pre>

            <!-- Snippet 4: SDK -->
            <pre class="code-editor-body" id="snippet-sdk" style="display:none;"><code>&lt;!-- Include VidPlay Embed SDK --&gt;
&lt;script src="https://${domain}/embed-sdk.js"&gt;&lt;/script&gt;

&lt;script&gt;
  // Initialize client SDK with AniList ID and target episode
  const embedUrl = window.VidCloudSDK.createEmbedUrl("ani", 21, 1, "sub");
  console.log("Embed URL:", embedUrl);
&lt;/script&gt;</code></pre>
        </section>

        <!-- ── Documentation Reference ── -->
        <section id="docs" class="docs-section">
            <div class="section-header">
                <span class="section-badge">Reference Manual</span>
                <h2 class="section-title">Embed API Parameters</h2>
                <p class="section-subtitle">Query parameters supported by the embed player endpoint.</p>
            </div>

            <div class="docs-table-wrapper">
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
                            <td><span class="docs-param">track</span></td>
                            <td><span class="docs-type">string</span></td>
                            <td><code>sub</code></td>
                            <td>Audio language: <code>sub</code> for Japanese with subtitles, or <code>dub</code> for English dub.</td>
                        </tr>
                        <tr>
                            <td><span class="docs-param">server</span></td>
                            <td><span class="docs-type">number</span></td>
                            <td><code>1</code></td>
                            <td>Primary stream cluster: <code>1</code> (MegaPlay), <code>2</code> (AniNeko), or <code>3</code> (Zoko).</td>
                        </tr>
                        <tr>
                            <td><span class="docs-param">autoPlay</span></td>
                            <td><span class="docs-type">number</span></td>
                            <td><code>1</code></td>
                            <td>Auto-start playback: <code>1</code> for enabled, <code>0</code> for manual click.</td>
                        </tr>
                        <tr>
                            <td><span class="docs-param">autoSkip</span></td>
                            <td><span class="docs-type">number</span></td>
                            <td><code>1</code></td>
                            <td>Skip opening & ending credits via AniSkip markers: <code>1</code> or <code>0</code>.</td>
                        </tr>
                        <tr>
                            <td><span class="docs-param">start</span></td>
                            <td><span class="docs-type">number</span></td>
                            <td><code>0</code></td>
                            <td>Seek to initial second on playback load (e.g. <code>start=300</code>).</td>
                        </tr>
                        <tr>
                            <td><span class="docs-param">url</span></td>
                            <td><span class="docs-type">string</span></td>
                            <td><code>none</code></td>
                            <td>Direct URL mode: Stream custom <code>.m3u8</code> or <code>.mp4</code> video link directly.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

    </main>

    <!-- Global Search Modal (⌘K) -->
    <div class="search-modal-backdrop" id="search-modal">
        <div class="search-modal">
            <div class="search-modal-input-box">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" class="search-modal-input" id="search-input" placeholder="Search anime title or AniList ID... (e.g. Naruto, One Piece)">
            </div>
            <div class="search-results-list" id="search-results-container">
                <div class="search-result-item" data-id="21" data-title="One Piece">
                    <div><strong>One Piece</strong> <span style="color:var(--text-subtle); margin-left:4px;">#21</span></div>
                    <span class="brand-badge">Select</span>
                </div>
                <div class="search-result-item" data-id="11061" data-title="Hunter x Hunter (2011)">
                    <div><strong>Hunter x Hunter</strong> <span style="color:var(--text-subtle); margin-left:4px;">#11061</span></div>
                    <span class="brand-badge">Select</span>
                </div>
                <div class="search-result-item" data-id="16498" data-title="Attack on Titan">
                    <div><strong>Attack on Titan</strong> <span style="color:var(--text-subtle); margin-left:4px;">#16498</span></div>
                    <span class="brand-badge">Select</span>
                </div>
                <div class="search-result-item" data-id="142838" data-title="Solo Leveling">
                    <div><strong>Solo Leveling</strong> <span style="color:var(--text-subtle); margin-left:4px;">#142838</span></div>
                    <span class="brand-badge">Select</span>
                </div>
                <div class="search-result-item" data-id="113415" data-title="Jujutsu Kaisen">
                    <div><strong>Jujutsu Kaisen</strong> <span style="color:var(--text-subtle); margin-left:4px;">#113415</span></div>
                    <span class="brand-badge">Select</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
        <div>
            © 2026 <strong>VidPlay</strong> / <strong>VidCloud</strong> · High-performance edge video infrastructure powered by <a href="https://player.anixo.online" target="_blank">player.anixo.online</a>.
        </div>
        <div class="footer-status-badge">
            <span class="status-dot"></span>
            Operational (Edge Mesh)
        </div>
        <div style="display:flex; gap:18px;">
            <a href="#docs">Docs</a>
            <a href="/admin">Admin</a>
            <a href="https://github.com/Zayrix-bit/anixo-player" target="_blank">GitHub</a>
        </div>
    </footer>

    <!-- Client Script -->
    <script>
        (function() {
            const domain = "${domain}";
            const inputId = document.getElementById("cfg-id");
            const inputEp = document.getElementById("cfg-ep");
            const selectServer = document.getElementById("cfg-server");
            const toggleAutoplay = document.getElementById("cfg-autoplay");
            const toggleMuted = document.getElementById("cfg-muted");
            const toggleSkipIntro = document.getElementById("cfg-skipintro");
            const toggleSkipOutro = document.getElementById("cfg-skipoutro");
            const btnVariantSub = document.getElementById("btn-variant-sub");
            const btnVariantDub = document.getElementById("btn-variant-dub");
            const displayUrl = document.getElementById("display-embed-url");
            const btnCopyUrl = document.getElementById("btn-copy-url");
            const copyUrlText = document.getElementById("copy-url-text");
            const btnMount = document.getElementById("btn-mount-player");
            const playerIframe = document.getElementById("player-iframe-mount");
            const liveAnimeTitle = document.getElementById("live-anime-title");
            const eventStreamContainer = document.getElementById("event-stream-container");
            const previewStatusIndicator = document.getElementById("preview-status-indicator");

            let currentVariant = "sub";

            btnVariantSub.addEventListener("click", () => {
                currentVariant = "sub";
                btnVariantSub.classList.add("active");
                btnVariantDub.classList.remove("active");
                updateContractUrl();
            });

            btnVariantDub.addEventListener("click", () => {
                currentVariant = "dub";
                btnVariantDub.classList.add("active");
                btnVariantSub.classList.remove("active");
                updateContractUrl();
            });

            function buildUrl() {
                const id = inputId.value.trim() || "21";
                const ep = inputEp.value.trim() || "1";
                const server = selectServer.value;
                const autoPlay = toggleAutoplay.checked ? "1" : "0";
                const muted = toggleMuted.checked ? "1" : "0";
                const autoSkip = toggleSkipIntro.checked ? "1" : "0";

                let q = "?track=" + currentVariant + "&server=" + server;
                if (autoPlay === "0") q += "&autoPlay=0";
                if (muted === "1") q += "&muted=1";
                if (autoSkip === "0") q += "&autoSkip=0";

                return "https://" + domain + "/embed/ani/" + id + "/" + ep + q;
            }

            function updateContractUrl() {
                const url = buildUrl();
                displayUrl.textContent = url;
            }

            [inputId, inputEp, selectServer, toggleAutoplay, toggleMuted, toggleSkipIntro, toggleSkipOutro].forEach(el => {
                el.addEventListener("input", updateContractUrl);
                el.addEventListener("change", updateContractUrl);
            });

            btnMount.addEventListener("click", () => {
                const url = buildUrl();
                playerIframe.src = url;
                previewStatusIndicator.textContent = "Loading...";
                appendEventLog("action", "Mounted stream: Ani #" + inputId.value + " Ep " + inputEp.value);
            });

            btnCopyUrl.addEventListener("click", () => {
                const text = displayUrl.textContent.trim();
                navigator.clipboard.writeText(text).then(() => {
                    copyUrlText.textContent = "Copied!";
                    setTimeout(() => { copyUrlText.textContent = "Copy URL"; }, 2000);
                });
            });

            window.addEventListener("message", (event) => {
                if (!event.data) return;
                const data = event.data;
                const eventName = data.event || data.type;
                if (!eventName) return;

                if (eventName === "ready") {
                    previewStatusIndicator.textContent = "Ready";
                    appendEventLog("ready", "Player initialized and ready");
                } else if (eventName === "play") {
                    previewStatusIndicator.textContent = "Playing";
                    appendEventLog("play", "Playback started");
                } else if (eventName === "pause") {
                    previewStatusIndicator.textContent = "Paused";
                    appendEventLog("pause", "Playback paused");
                } else if (eventName === "timeupdate") {
                    const time = Math.floor(data.currentTime || 0);
                    const dur = Math.floor(data.duration || 0);
                    if (time % 10 === 0) {
                        appendEventLog("timeupdate", "Position: " + time + "s / " + dur + "s");
                    }
                } else if (eventName === "ended") {
                    previewStatusIndicator.textContent = "Ended";
                    appendEventLog("ended", "Episode ended");
                }
            });

            function appendEventLog(tag, message) {
                const now = new Date();
                const timeStr = "[" + String(now.getMinutes()).padStart(2, '0') + ":" + String(now.getSeconds()).padStart(2, '0') + "]";
                const row = document.createElement("div");
                row.className = "event-entry";
                row.innerHTML = '<span class="event-time">' + timeStr + '</span><span class="event-tag">' + tag + '</span><span>' + message + '</span>';
                eventStreamContainer.appendChild(row);
                if (eventStreamContainer.children.length > 20) {
                    eventStreamContainer.removeChild(eventStreamContainer.firstChild);
                }
            }

            const tabButtons = document.querySelectorAll(".tab-btn");
            const codeSnippets = document.querySelectorAll(".code-editor-body");
            const btnCopyActiveCode = document.getElementById("btn-copy-active-code");

            tabButtons.forEach(btn => {
                btn.addEventListener("click", () => {
                    tabButtons.forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    const targetId = btn.getAttribute("data-target");
                    codeSnippets.forEach(snippet => {
                        snippet.style.display = snippet.id === targetId ? "block" : "none";
                    });
                });
            });

            btnCopyActiveCode.addEventListener("click", () => {
                const activeSnippet = Array.from(codeSnippets).find(s => s.style.display !== "none") || codeSnippets[0];
                navigator.clipboard.writeText(activeSnippet.textContent.trim()).then(() => {
                    btnCopyActiveCode.querySelector("span").textContent = "Copied!";
                    setTimeout(() => { btnCopyActiveCode.querySelector("span").textContent = "Copy Snippet"; }, 2000);
                });
            });

            const searchModal = document.getElementById("search-modal");
            const searchTrigger = document.getElementById("btn-search-trigger");
            const searchInput = document.getElementById("search-input");
            const searchResults = document.querySelectorAll(".search-result-item");

            function openSearch() {
                searchModal.classList.add("open");
                searchInput.focus();
            }

            function closeSearch() {
                searchModal.classList.remove("open");
            }

            searchTrigger.addEventListener("click", openSearch);
            searchModal.addEventListener("click", (e) => {
                if (e.target === searchModal) closeSearch();
            });

            document.addEventListener("keydown", (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                    e.preventDefault();
                    searchModal.classList.contains("open") ? closeSearch() : openSearch();
                } else if (e.key === "Escape") {
                    closeSearch();
                }
            });

            searchResults.forEach(item => {
                item.addEventListener("click", () => {
                    const id = item.getAttribute("data-id");
                    const title = item.getAttribute("data-title");
                    inputId.value = id;
                    inputEp.value = "1";
                    liveAnimeTitle.textContent = title;
                    updateContractUrl();
                    closeSearch();
                    btnMount.click();
                });
            });

            inputId.addEventListener("blur", async () => {
                const id = inputId.value.trim();
                if (!id) return;
                try {
                    const res = await fetch("/api/anime/" + id);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.title) liveAnimeTitle.textContent = data.title;
                    }
                } catch {}
            });

            updateContractUrl();
        })();
    </script>
</body>
</html>`;
}
