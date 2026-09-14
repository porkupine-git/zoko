/**
 * VIDCLOUD DEVELOPER PLATFORM & EMBED STUDIO
 * Clean, Minimalist, High-Fidelity Design
 * Color Palette: Deep Obsidian Black, Warm Charcoal Gray, Rich Coffee Mocha & Caramel
 * Zero AI Slop · No unnecessary badges/pills · Clean professional UI
 */

export function renderLandingHtml(baseUrl = "") {
    const domain = "vidcloud.sbs";

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VidCloud — High-Performance Anime Video Infrastructure</title>
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
            color: var(--text-main);
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
            min-height: 480px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px 40px;
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
            height: 180px;
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
            margin-bottom: 12px;
        }

        .form-row-3col {
            display: grid;
            grid-template-columns: 1.25fr 1fr 0.75fr;
            gap: 12px;
            margin-bottom: 12px;
        }

        @media (max-width: 540px) {
            .form-row-3col {
                grid-template-columns: 1fr 1fr;
            }
            .form-row-3col .field-group:first-child {
                grid-column: span 2;
            }
        }

        .field-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 0;
        }

        .field-label {
            font-size: 11.5px;
            font-weight: 600;
            letter-spacing: 0.02em;
            color: #a1a1aa;
            display: flex;
            align-items: center;
            height: 16px;
        }

        .input-text, .select-input {
            width: 100%;
            height: 38px;
            box-sizing: border-box;
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            color: #ffffff;
            font-size: 13px;
            font-weight: 500;
            padding: 0 12px;
            border-radius: var(--radius-sm);
            font-family: var(--font-sans);
            outline: none;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .input-text:focus, .select-input:focus {
            border-color: var(--coffee-primary);
            box-shadow: 0 0 0 2px var(--coffee-tint);
        }

        .select-input {
            appearance: none;
            -webkit-appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 12px center;
            background-size: 14px;
            padding-right: 32px;
            cursor: pointer;
        }

        /* Minimalist Segmented Pills */
        .segmented-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            height: 38px;
            box-sizing: border-box;
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            border-radius: var(--radius-sm);
            padding: 3px;
            gap: 3px;
        }

        .segment-btn {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: 12px;
            font-weight: 600;
            padding: 0 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.15s ease;
            user-select: none;
        }

        .segment-btn:hover:not(.active) {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.04);
        }

        .segment-btn.active {
            background: var(--coffee-primary);
            color: #ffffff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        }

        /* Toggle Switches */
        .toggles-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 24px;
            margin-bottom: 14px;
            background: #111113;
            border: 1px solid var(--card-border);
            border-radius: var(--radius-sm);
            padding: 12px 16px;
        }

        .toggle-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            cursor: pointer;
            user-select: none;
        }

        .toggle-title {
            font-size: 12.5px;
            font-weight: 500;
            color: #d4d4d8;
        }

        .switch {
            position: relative;
            display: inline-block;
            width: 34px;
            height: 19px;
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
            transition: .2s ease;
            border-radius: 20px;
        }

        .slider:before {
            position: absolute;
            content: "";
            height: 13px;
            width: 13px;
            left: 3px;
            bottom: 3px;
            background-color: #ffffff;
            transition: .2s ease;
            border-radius: 50%;
        }

        input:checked + .slider {
            background-color: var(--coffee-primary);
        }

        input:checked + .slider:before {
            transform: translateX(15px);
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
            font-size: 11.5px;
            color: var(--coffee-cream);
            white-space: pre-wrap;
            word-break: break-all;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }

        /* Right Column Live Preview */
        .preview-player-container {
            width: 100%;
            position: relative;
            padding-bottom: 56.25%; /* 16:9 = 9/16 = 0.5625 */
            height: 0;
            background: #000000;
            border-radius: var(--radius-md);
            overflow: hidden;
            border: 1px solid var(--card-border);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
        }

        .preview-player-container iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }

        .player-placeholder {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            cursor: pointer;
            z-index: 2;
            transition: opacity 0.35s ease;
            overflow: hidden;
        }

        .placeholder-poster {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            filter: blur(2px) brightness(0.35);
            transform: scale(1.05);
            transition: filter 0.4s ease, transform 0.4s ease;
        }

        .player-placeholder:hover .placeholder-poster {
            filter: blur(1px) brightness(0.45);
            transform: scale(1.08);
        }

        .placeholder-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 60%, rgba(10,10,12,0.85) 100%);
        }

        .placeholder-play-btn {
            position: relative;
            z-index: 3;
            width: 68px;
            height: 68px;
            border-radius: 50%;
            background: rgba(198, 139, 89, 0.15);
            border: 2px solid rgba(198, 139, 89, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(8px);
            transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;
        }

        .player-placeholder:hover .placeholder-play-btn {
            transform: scale(1.1);
            background: rgba(198, 139, 89, 0.25);
            border-color: rgba(198, 139, 89, 0.9);
        }

        .placeholder-play-btn svg {
            width: 26px;
            height: 26px;
            margin-left: 3px;
        }

        .placeholder-info {
            position: relative;
            z-index: 3;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }

        .placeholder-title {
            font-size: 14px;
            font-weight: 600;
            color: rgba(255,255,255,0.9);
            letter-spacing: -0.01em;
        }

        .placeholder-text {
            font-size: 12px;
            color: rgba(255,255,255,0.45);
            font-weight: 400;
        }

        .placeholder-badge {
            position: absolute;
            top: 14px;
            left: 14px;
            z-index: 3;
            background: rgba(198, 139, 89, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(198, 139, 89, 0.3);
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            color: var(--coffee-cream, #E8D5B7);
            letter-spacing: 0.02em;
        }

        .player-placeholder.hidden {
            opacity: 0;
            pointer-events: none;
        }



        /* ── Features & Capabilities ── */
        .section-header {
            text-align: center;
            max-width: 600px;
            margin: 0 auto 40px;
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
            padding: 32px 24px;
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
                VidCloud
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
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/blWCPEqDGLBuLB9u89CxP9ORQP4.jpg" alt="One Piece" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/eobAuhCJA8oRp814V67WhezVXtQ.jpg" alt="Hunter x Hunter" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg" alt="Attack on Titan" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/xppeysfvDKVx775MFuH8Z9BlpMk.jpg" alt="Naruto" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/blWCPEqDGLBuLB9u89CxP9ORQP4.jpg" alt="One Piece" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/eobAuhCJA8oRp814V67WhezVXtQ.jpg" alt="Hunter x Hunter" loading="lazy"></div>
                </div>
                <!-- Col 2 -->
                <div class="marquee-col marquee-down">
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/geCRueV3ElhRTr0xtJuEWJt6dJ1.jpg" alt="Solo Leveling" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/6qQzMJG27XOJsyAEEIisoJB45j2.jpg" alt="Jujutsu Kaisen" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg" alt="Demon Slayer" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/npdB6eFzizki0WaZ1OvKcJrWe97.jpg" alt="Chainsaw Man" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/geCRueV3ElhRTr0xtJuEWJt6dJ1.jpg" alt="Solo Leveling" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/6qQzMJG27XOJsyAEEIisoJB45j2.jpg" alt="Jujutsu Kaisen" loading="lazy"></div>
                </div>
                <!-- Col 3 -->
                <div class="marquee-col marquee-up">
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/tCZFfYTIwrR7n94J6G14Y4hAFU6.jpg" alt="Death Note" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/2EewmxXe72ogD0EaWM8gqa0ccIw.jpg" alt="Bleach" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg" alt="Fullmetal Alchemist" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/6qfZAOEUFIrbUH3JvePclx1nXzz.jpg" alt="Dandadan" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/tCZFfYTIwrR7n94J6G14Y4hAFU6.jpg" alt="Death Note" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/2EewmxXe72ogD0EaWM8gqa0ccIw.jpg" alt="Bleach" loading="lazy"></div>
                </div>
                <!-- Col 4 -->
                <div class="marquee-col marquee-down">
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/xppeysfvDKVx775MFuH8Z9BlpMk.jpg" alt="Naruto" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg" alt="Attack on Titan" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/blWCPEqDGLBuLB9u89CxP9ORQP4.jpg" alt="One Piece" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/eobAuhCJA8oRp814V67WhezVXtQ.jpg" alt="Hunter x Hunter" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/xppeysfvDKVx775MFuH8Z9BlpMk.jpg" alt="Naruto" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg" alt="Attack on Titan" loading="lazy"></div>
                </div>
                <!-- Col 5 -->
                <div class="marquee-col marquee-up">
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/6qQzMJG27XOJsyAEEIisoJB45j2.jpg" alt="Jujutsu Kaisen" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/geCRueV3ElhRTr0xtJuEWJt6dJ1.jpg" alt="Solo Leveling" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/npdB6eFzizki0WaZ1OvKcJrWe97.jpg" alt="Chainsaw Man" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg" alt="Demon Slayer" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/6qQzMJG27XOJsyAEEIisoJB45j2.jpg" alt="Jujutsu Kaisen" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/geCRueV3ElhRTr0xtJuEWJt6dJ1.jpg" alt="Solo Leveling" loading="lazy"></div>
                </div>
                <!-- Col 6 -->
                <div class="marquee-col marquee-down">
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/6qfZAOEUFIrbUH3JvePclx1nXzz.jpg" alt="Dandadan" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg" alt="Fullmetal Alchemist" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/tCZFfYTIwrR7n94J6G14Y4hAFU6.jpg" alt="Death Note" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/2EewmxXe72ogD0EaWM8gqa0ccIw.jpg" alt="Bleach" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/6qfZAOEUFIrbUH3JvePclx1nXzz.jpg" alt="Dandadan" loading="lazy"></div>
                    <div class="poster-card"><img src="https://image.tmdb.org/t/p/w500/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg" alt="Fullmetal Alchemist" loading="lazy"></div>
                </div>
            </div>
        </div>

        <div class="hero-content">
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
                    <h2 class="card-title">Player Tester</h2>
                    <p class="card-desc">Tune parameters and verify live playback response.</p>
                </div>

                <!-- Row 1: Content Identifiers (ID Type, Anime ID, Episode) -->
                <div class="form-row form-row-3col">
                    <div class="field-group">
                        <label class="field-label">ID Type</label>
                        <div class="segmented-group">
                            <button type="button" class="segment-btn active" data-idtype="ani" id="btn-idtype-ani">AniList</button>
                            <button type="button" class="segment-btn" data-idtype="mal" id="btn-idtype-mal">MAL</button>
                        </div>
                    </div>
                    <div class="field-group">
                        <label class="field-label" for="cfg-id" id="cfg-id-label">AniList ID</label>
                        <input type="number" id="cfg-id" class="input-text" value="21" min="1">
                    </div>
                    <div class="field-group">
                        <label class="field-label" for="cfg-ep">Episode</label>
                        <input type="number" id="cfg-ep" class="input-text" value="1" min="1">
                    </div>
                </div>

                <!-- Row 2: Stream Configuration (Audio Track & Server) -->
                <div class="form-row">
                    <div class="field-group">
                        <label class="field-label">Audio Track</label>
                        <div class="segmented-group">
                            <button type="button" class="segment-btn active" data-variant="sub" id="btn-variant-sub">Sub</button>
                            <button type="button" class="segment-btn" data-variant="dub" id="btn-variant-dub">Dub</button>
                        </div>
                    </div>
                    <div class="field-group">
                        <label class="field-label" for="cfg-server">Server</label>
                        <select id="cfg-server" class="select-input">
                            <option value="1" selected>Marin (Server 1)</option>
                            <option value="2">Nunu (Server 2)</option>
                            <option value="3">Zexy (Server 3)</option>
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
                        <span class="url-contract-title">Dynamic Embed Iframe</span>
                        <button type="button" class="copy-url-btn" id="btn-copy-url">
                            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            <span id="copy-url-text">Copy Iframe</span>
                        </button>
                    </div>
                    <pre class="url-contract-text" id="display-embed-url">&lt;iframe
  src="https://${domain}/embed/ani/21/1?track=sub&amp;server=1"
  width="100%"
  height="480"
  frameborder="0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen&gt;
&lt;/iframe&gt;</pre>
                </div>

                <button type="button" id="btn-mount-player" class="btn-primary" style="width: 100%; justify-content: center; padding: 10px;">
                    Mount in Player
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
            </div>

            <!-- Right Player Preview Card -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Live Player Preview</h2>
                    <p class="card-desc">Clean JW Player engine without third-party redirects.</p>
                </div>

                <!-- 16:9 Video Frame -->
                <div class="preview-player-container" id="player-preview-wrap">
                    <div class="player-placeholder" id="player-placeholder">
                        <div class="placeholder-poster" style="background-image: url('https://image.tmdb.org/t/p/w1280/2rmK7mnchw9Xr3XdiTFSxTTLXqv.jpg');"></div>
                        <div class="placeholder-overlay"></div>
                        <span class="placeholder-badge">16:9 Preview</span>
                        <div class="placeholder-play-btn">
                            <svg viewBox="0 0 24 24" fill="none"><polygon points="8,5 20,12 8,19" fill="#C68B59"/></svg>
                        </div>
                        <div class="placeholder-info">
                            <span class="placeholder-title">One Piece · Episode 1</span>
                            <span class="placeholder-text">Click to mount player</span>
                        </div>
                    </div>
                    <iframe 
                        id="player-iframe-mount" 
                        allow="autoplay; fullscreen; picture-in-picture" 
                        allowfullscreen
                        style="display:none;">
                    </iframe>
                </div>


            </div>
        </section>

        <!-- ── Features & Capabilities Section ── -->
        <section id="capabilities" class="capabilities-section">
            <div class="section-header">
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
                    <p class="feature-desc">Three independent stream clusters (Marin, Nunu, Zexy) with automatic cascading failover on missing streams.</p>
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
                    <button type="button" class="tab-btn active" data-target="snippet-anilist">AniList &lt;iframe&gt;</button>
                    <button type="button" class="tab-btn" data-target="snippet-mal">MyAnimeList (MAL)</button>
                    <button type="button" class="tab-btn" data-target="snippet-autoskip">AutoSkip &amp; Full Options</button>
                    <button type="button" class="tab-btn" data-target="snippet-responsive">Responsive 16:9 CSS</button>
                    <button type="button" class="tab-btn" data-target="snippet-react">React / Next.js</button>
                    <button type="button" class="tab-btn" data-target="snippet-sdk">JavaScript SDK</button>
                </div>
                <button type="button" class="btn-copy-code" id="btn-copy-active-code">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <span>Copy Snippet</span>
                </button>
            </div>

            <!-- Snippet 1: AniList iframe -->
            <pre class="code-editor-body" id="snippet-anilist"><code>&lt;!-- VidCloud Embed: AniList Integration --&gt;
&lt;!-- Route: /embed/ani/{anilistId}/{episode}?track={sub|dub}&amp;server={1|2|3}&amp;autoSkip=1 --&gt;
&lt;iframe 
  src="https://${domain}/embed/ani/21/1?track=sub&amp;server=1&amp;autoSkip=1" 
  width="100%" 
  height="480" 
  frameborder="0" 
  loading="lazy"
  allow="autoplay; fullscreen; picture-in-picture" 
  allowfullscreen&gt;
&lt;/iframe&gt;

&lt;!-- Configuration Reference:
  • 21        : AniList Anime ID (One Piece)
  • 1         : Episode number
  • track=sub : Japanese audio + English subtitles (or track=dub for English Dub)
  • server=1  : Primary stream engine (Cluster 1: Marin)
  • autoSkip=1: Automatically skips opening &amp; ending credits via AniSkip
  * NOTE: Do NOT include 'sandbox' attribute (strict anti-leech protection will block playback)
--&gt;</code></pre>

            <!-- Snippet 2: MyAnimeList (MAL) iframe -->
            <pre class="code-editor-body" id="snippet-mal" style="display:none;"><code>&lt;!-- VidCloud Embed: MyAnimeList (MAL) Integration --&gt;
&lt;!-- Route: /embed/mal/{malId}/{episode}?track={sub|dub}&amp;server={1|2|3}&amp;autoSkip=1&amp;autoNext=1 --&gt;
&lt;iframe 
  src="https://${domain}/embed/mal/21/1?track=sub&amp;server=1&amp;autoSkip=1&amp;autoNext=1" 
  width="100%" 
  height="480" 
  frameborder="0" 
  loading="lazy"
  allow="autoplay; fullscreen; picture-in-picture" 
  allowfullscreen&gt;
&lt;/iframe&gt;

&lt;!-- Alternative Query Parameter Format for MAL:
&lt;iframe 
  src="https://${domain}/embed?type=mal&amp;id=21&amp;ep=1&amp;track=sub&amp;server=1&amp;autoSkip=1&amp;autoNext=1" 
  width="100%" 
  height="480" 
  frameborder="0" 
  allow="autoplay; fullscreen; picture-in-picture" 
  allowfullscreen&gt;
&lt;/iframe&gt;
--&gt;</code></pre>

            <!-- Snippet 3: Full Feature Stack with AutoSkip -->
            <pre class="code-editor-body" id="snippet-autoskip" style="display:none;"><code>&lt;!-- VidCloud Embed: Full Production Stack (AutoSkip + AutoPlay + AutoNext) --&gt;
&lt;iframe 
  src="https://${domain}/embed/ani/21/1?track=sub&amp;server=1&amp;autoSkip=1&amp;autoPlay=1&amp;autoNext=1" 
  width="100%" 
  height="500" 
  frameborder="0" 
  loading="lazy"
  allow="autoplay; fullscreen; picture-in-picture" 
  allowfullscreen&gt;
&lt;/iframe&gt;

&lt;!-- Parameters Breakdown:
  • autoSkip=1 : Detects AniSkip opening (OP) &amp; ending (ED) cue points and skips automatically
  • autoPlay=1 : Starts playback immediately without requiring an initial user tap
  • autoNext=1 : Auto-advances to the next episode seamlessly when the current episode ends
  • server=1   : Cluster 1: Marin (Set server=2 for Nunu, server=3 for Zexy)
  • track=sub  : Original Japanese with subs (use track=dub for English dub)
--&gt;</code></pre>

            <!-- Snippet 4: Responsive CSS -->
            <pre class="code-editor-body" id="snippet-responsive" style="display:none;"><code>&lt;!-- Responsive 16:9 Aspect Ratio Container (Desktop &amp; Mobile) --&gt;
&lt;style&gt;
  .vidcloud-player-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #09090b;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .vidcloud-player-wrapper iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
&lt;/style&gt;

&lt;div class="vidcloud-player-wrapper"&gt;
  &lt;iframe 
    src="https://${domain}/embed/ani/21/1?track=sub&amp;server=1&amp;autoSkip=1&amp;autoNext=1" 
    loading="lazy"
    allow="autoplay; fullscreen; picture-in-picture" 
    allowfullscreen&gt;
  &lt;/iframe&gt;
&lt;/div&gt;</code></pre>

            <!-- Snippet 5: React / Next.js -->
            <pre class="code-editor-body" id="snippet-react" style="display:none;"><code>import React, { useEffect } from 'react';

interface VidCloudPlayerProps {
  id?: number | string;            // AniList or MAL ID (e.g. 21)
  idType?: 'ani' | 'mal';          // 'ani' for AniList, 'mal' for MyAnimeList
  episode?: number;                // Target episode number
  track?: 'sub' | 'dub';           // Subbed or Dubbed
  server?: 1 | 2 | 3;              // 1: Marin, 2: Nunu, 3: Zexy
  autoSkip?: boolean;              // Auto skip intro / outro
  autoPlay?: boolean;              // Auto play on load
  autoNext?: boolean;              // Auto advance to next episode
  onEnded?: () =&gt; void;            // Callback when episode finishes
}

export function VidCloudPlayer({
  id = 21,
  idType = 'ani',
  episode = 1,
  track = 'sub',
  server = 1,
  autoSkip = true,
  autoPlay = true,
  autoNext = true,
  onEnded
}: VidCloudPlayerProps) {
  useEffect(() =&gt; {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://${domain}") return;
      if (event.data?.event === "ended") {
        onEnded?.();
      }
    }
    window.addEventListener("message", handleMessage);
    return () =&gt; window.removeEventListener("message", handleMessage);
  }, [onEnded]);

  const embedUrl = \`https://${domain}/embed/\\\${idType}/\\\${id}/\\\${episode}?track=\\\${track}&amp;server=\\\${server}&amp;autoSkip=\\\${autoSkip ? 1 : 0}&amp;autoPlay=\\\${autoPlay ? 1 : 0}&amp;autoNext=\\\${autoNext ? 1 : 0}\`;

  return (
    &lt;div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', background: '#000' }}&gt;
      &lt;iframe
        src={embedUrl}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      /&gt;
    &lt;/div&gt;
  );
}</code></pre>

            <!-- Snippet 6: SDK -->
            <pre class="code-editor-body" id="snippet-sdk" style="display:none;"><code>&lt;!-- Load VidCloud Embed SDK --&gt;
&lt;script src="https://${domain}/embed-sdk.js"&gt;&lt;/script&gt;

&lt;script&gt;
  // 1. Generate embed URL for AniList or MAL with AutoSkip
  const anilistUrl = window.VidCloudSDK.createEmbedUrl("ani", 21, 1, "sub");
  console.log("AniList URL:", anilistUrl);
  // Output: https://${domain}/embed/ani/21/1/sub

  const malUrl = window.VidCloudSDK.createEmbedUrl("mal", 21, 1, "sub");
  console.log("MAL URL:", malUrl);
  // Output: https://${domain}/embed/mal/21/1/sub

  // 2. Listen to Bidirectional postMessage Player Events
  window.addEventListener("message", function(event) {
    if (event.origin !== "https://${domain}") return;

    const data = event.data;
    switch(data?.event) {
      case "ready":
        console.log("Player initialized &amp; ready");
        break;
      case "play":
        console.log("Video started playing");
        break;
      case "autoSkip":
        console.log("Skipped intro/outro timestamp:", data.type);
        break;
      case "ended":
        console.log("Episode completed — ready for next episode");
        break;
    }
  });
&lt;/script&gt;</code></pre>
        </section>

        <!-- ── Documentation Reference ── -->
        <section id="docs" class="docs-section">
            <div class="section-header">
                <h2 class="section-title">Embed API Parameters</h2>
                <p class="section-subtitle">Query parameters supported across all embed player endpoints.</p>
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
                            <td>Stream server: <code>1</code> (Marin), <code>2</code> (Nunu), or <code>3</code> (Zexy).</td>
                        </tr>
                        <tr>
                            <td><span class="docs-param">autoSkip</span></td>
                            <td><span class="docs-type">number</span></td>
                            <td><code>1</code></td>
                            <td>Automatically skip opening &amp; ending credits via AniSkip markers: <code>1</code> (enabled) or <code>0</code>.</td>
                        </tr>
                        <tr>
                            <td><span class="docs-param">autoPlay</span></td>
                            <td><span class="docs-type">number</span></td>
                            <td><code>1</code></td>
                            <td>Auto-start playback on load: <code>1</code> for enabled, <code>0</code> for manual click.</td>
                        </tr>
                        <tr>
                            <td><span class="docs-param">autoNext</span></td>
                            <td><span class="docs-type">number</span></td>
                            <td><code>1</code></td>
                            <td>Automatically transition to next episode when current finishes: <code>1</code> or <code>0</code>.</td>
                        </tr>
                        <tr>
                            <td><span class="docs-param">type</span></td>
                            <td><span class="docs-type">string</span></td>
                            <td><code>ani</code></td>
                            <td>ID provider for query route (<code>/embed?type=...</code>): <code>ani</code> (AniList) or <code>mal</code> (MyAnimeList).</td>
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
                </div>
                <div class="search-result-item" data-id="11061" data-title="Hunter x Hunter (2011)">
                    <div><strong>Hunter x Hunter</strong> <span style="color:var(--text-subtle); margin-left:4px;">#11061</span></div>
                </div>
                <div class="search-result-item" data-id="16498" data-title="Attack on Titan">
                    <div><strong>Attack on Titan</strong> <span style="color:var(--text-subtle); margin-left:4px;">#16498</span></div>
                </div>
                <div class="search-result-item" data-id="142838" data-title="Solo Leveling">
                    <div><strong>Solo Leveling</strong> <span style="color:var(--text-subtle); margin-left:4px;">#142838</span></div>
                </div>
                <div class="search-result-item" data-id="113415" data-title="Jujutsu Kaisen">
                    <div><strong>Jujutsu Kaisen</strong> <span style="color:var(--text-subtle); margin-left:4px;">#113415</span></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
        <div>
            © 2026 <strong>VidCloud</strong> · High-performance edge video infrastructure.
        </div>
        <div style="display:flex; gap:18px;">
            <a href="#docs">Docs</a>
            <a href="/admin">Admin</a>
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

            let currentVariant = "sub";
            let currentIdType = "ani";

            const btnIdTypeAni = document.getElementById("btn-idtype-ani");
            const btnIdTypeMal = document.getElementById("btn-idtype-mal");
            const cfgIdLabel = document.getElementById("cfg-id-label");

            btnIdTypeAni.addEventListener("click", () => {
                currentIdType = "ani";
                btnIdTypeAni.classList.add("active");
                btnIdTypeMal.classList.remove("active");
                cfgIdLabel.textContent = "AniList ID";
                inputId.value = "21";
                updateContractUrl();
            });

            btnIdTypeMal.addEventListener("click", () => {
                currentIdType = "mal";
                btnIdTypeMal.classList.add("active");
                btnIdTypeAni.classList.remove("active");
                cfgIdLabel.textContent = "MAL ID";
                inputId.value = "21";
                updateContractUrl();
            });

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

                return "https://" + domain + "/embed/" + currentIdType + "/" + id + "/" + ep + q;
            }

            function buildIframeCode(url) {
                return '<iframe\\n  src="' + url + '"\\n  width="100%"\\n  height="480"\\n  frameborder="0"\\n  allow="autoplay; fullscreen; picture-in-picture"\\n  allowfullscreen>\\n</iframe>';
            }

            function updateContractUrl() {
                const url = buildUrl();
                displayUrl.textContent = buildIframeCode(url);
            }

            [inputId, inputEp, selectServer, toggleAutoplay, toggleMuted, toggleSkipIntro, toggleSkipOutro].forEach(el => {
                el.addEventListener("input", updateContractUrl);
                el.addEventListener("change", updateContractUrl);
            });

            function mountPlayer() {
                const url = buildUrl();
                const placeholder = document.getElementById("player-placeholder");
                playerIframe.style.display = "block";
                playerIframe.src = url;
                if (placeholder) placeholder.classList.add("hidden");
            }

            btnMount.addEventListener("click", mountPlayer);

            // Clicking the placeholder also mounts
            const placeholderEl = document.getElementById("player-placeholder");
            if (placeholderEl) placeholderEl.addEventListener("click", mountPlayer);

            btnCopyUrl.addEventListener("click", () => {
                const text = displayUrl.textContent.trim();
                navigator.clipboard.writeText(text).then(() => {
                    copyUrlText.textContent = "Copied!";
                    setTimeout(() => { copyUrlText.textContent = "Copy Iframe"; }, 2000);
                });
            });


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
                    inputId.value = id;
                    inputEp.value = "1";
                    updateContractUrl();
                    closeSearch();
                    btnMount.click();
                });
            });

            updateContractUrl();
        })();
    </script>
</body>
</html>`;
}
