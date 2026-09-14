/**
 * VIDPLAY / VIDCLOUD DEVELOPER PLATFORM & EMBED STUDIO
 * Authentic AniLink.cc UI/UX clone for vidcloud.sbs
 * Features:
 *  - Vertical anime poster marquee with smooth CSS continuous scroll
 *  - Interactive "Player Tester" (AniList ID, Episode, Sub/Dub, Server, Toggles, Color Pickers)
 *  - Real-time 16:9 Live Player Preview powered by player.anixo.online
 *  - Real-time postMessage event stream monitor
 *  - Embed Contract & One-Click Code Generator (HTML, 16:9 CSS, React, SDK)
 *  - Full Documentation & Parameters Reference
 *  - Quick Search Modal (⌘K / Ctrl+K)
 *  - Dark void palette (#030712), shadcn styling, Geist/Inter typography
 */

export function renderLandingHtml(baseUrl = "") {
    const domain = baseUrl ? new URL(baseUrl).hostname : "vidcloud.sbs";

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VidPlay — The Foundation for Anime Episode Playback</title>
    <meta name="description" content="A focused, high-performance Embeddable Player for host websites that need iframe-ready Episode Playback with 0ms edge delivery.">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230B132B'/%3E%3Cpolygon points='12,9 24,16 12,23' fill='%233B82F6'/%3E%3C/svg%3E">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #030712;
            --bg-elevated: #080d1a;
            --card-bg: rgba(15, 23, 42, 0.65);
            --card-border: rgba(255, 255, 255, 0.08);
            --card-border-hover: rgba(255, 255, 255, 0.16);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --text-subtle: #64748b;
            --primary: #3b82f6;
            --primary-hover: #2563eb;
            --primary-glow: rgba(59, 130, 246, 0.25);
            --accent-green: #22c55e;
            --accent-yellow: #eab308;
            --code-bg: #0b1120;
            --radius-sm: 8px;
            --radius-md: 12px;
            --radius-lg: 16px;
            --radius-xl: 24px;
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

        /* ── Top Navigation Bar ── */
        .header {
            position: sticky;
            top: 0;
            z-index: 100;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            background: rgba(3, 7, 18, 0.75);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid var(--card-border);
        }

        .header-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            color: var(--text-main);
        }

        .brand-logo {
            width: 32px;
            height: 32px;
            border-radius: var(--radius-sm);
            background: linear-gradient(135deg, #1d4ed8, #3b82f6);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 16px var(--primary-glow);
        }

        .brand-logo svg {
            width: 16px;
            height: 16px;
            fill: #ffffff;
            margin-left: 2px;
        }

        .brand-text {
            font-size: 17px;
            font-weight: 700;
            letter-spacing: -0.02em;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .brand-badge {
            font-size: 11px;
            font-weight: 600;
            color: #60a5fa;
            background: rgba(59, 130, 246, 0.12);
            border: 1px solid rgba(59, 130, 246, 0.25);
            padding: 2px 8px;
            border-radius: var(--radius-full);
            font-family: var(--font-mono);
        }

        .nav-links {
            display: flex;
            align-items: center;
            gap: 28px;
        }

        .nav-link {
            font-size: 14px;
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
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--card-border);
            padding: 6px 12px;
            border-radius: var(--radius-full);
            color: var(--text-subtle);
            font-size: 13px;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .search-trigger:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: var(--card-border-hover);
            color: var(--text-muted);
        }

        .kbd-badge {
            font-family: var(--font-mono);
            font-size: 10.5px;
            background: rgba(255, 255, 255, 0.08);
            padding: 2px 6px;
            border-radius: 4px;
            color: var(--text-muted);
        }

        .btn-docs {
            background: #ffffff;
            color: #030712;
            font-size: 13.5px;
            font-weight: 600;
            padding: 7px 16px;
            border-radius: var(--radius-full);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s ease;
        }

        .btn-docs:hover {
            background: #f1f5f9;
            transform: translateY(-1px);
        }

        /* ── Hero Section with Vertical Anime Marquee ── */
        .hero-wrapper {
            position: relative;
            min-height: 580px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 80px 20px 60px;
            overflow: hidden;
            text-align: center;
        }

        /* Background Vertical Marquee */
        .marquee-bg {
            position: absolute;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
            opacity: 0.22;
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
            animation-duration: 45s;
            animation-iteration-count: infinite;
            animation-timing-function: linear;
        }

        .marquee-up {
            animation-name: scrollUp;
        }

        .marquee-down {
            animation-name: scrollDown;
        }

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
            border-radius: var(--radius-lg);
            overflow: hidden;
            background: #0f172a;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }

        .poster-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        /* Ambient Fades on Marquee */
        .mask-top {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 180px;
            background: linear-gradient(to bottom, var(--bg) 0%, rgba(3, 7, 18, 0.8) 50%, transparent 100%);
            z-index: 2;
            pointer-events: none;
        }

        .mask-bottom {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 240px;
            background: linear-gradient(to top, var(--bg) 0%, rgba(3, 7, 18, 0.95) 60%, transparent 100%);
            z-index: 2;
            pointer-events: none;
        }

        .mask-left {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            width: 100px;
            background: linear-gradient(to right, var(--bg), transparent);
            z-index: 2;
            pointer-events: none;
        }

        .mask-right {
            position: absolute;
            top: 0;
            bottom: 0;
            right: 0;
            width: 100px;
            background: linear-gradient(to left, var(--bg), transparent);
            z-index: 2;
            pointer-events: none;
        }

        .hero-glow {
            position: absolute;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            height: 400px;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.08) 40%, transparent 70%);
            filter: blur(60px);
            z-index: 2;
            pointer-events: none;
        }

        /* Hero Content */
        .hero-content {
            position: relative;
            z-index: 10;
            max-width: 860px;
            margin: 0 auto;
        }

        .hero-badge-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-full);
            color: var(--text-muted);
            font-size: 13px;
            font-weight: 500;
            text-decoration: none;
            margin-bottom: 24px;
            transition: all 0.2s ease;
        }

        .hero-badge-link:hover {
            border-color: var(--card-border-hover);
            color: var(--text-main);
            background: rgba(255, 255, 255, 0.08);
        }

        .hero-badge-link svg {
            width: 13px;
            height: 13px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
        }

        .hero-title {
            font-size: 52px;
            font-weight: 800;
            line-height: 1.12;
            letter-spacing: -0.035em;
            color: #ffffff;
            margin-bottom: 20px;
        }

        .hero-title .gradient-text {
            background: linear-gradient(135deg, #ffffff 40%, #93c5fd 80%, #60a5fa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
            font-size: 18px;
            font-weight: 400;
            color: var(--text-muted);
            line-height: 1.6;
            max-width: 680px;
            margin: 0 auto 32px;
        }

        .hero-cta-group {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
        }

        .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--primary);
            color: #ffffff;
            font-size: 14.5px;
            font-weight: 600;
            padding: 10px 22px;
            border-radius: var(--radius-full);
            text-decoration: none;
            box-shadow: 0 0 20px var(--primary-glow);
            transition: all 0.15s ease;
            cursor: pointer;
            border: none;
        }

        .btn-primary:hover {
            background: var(--primary-hover);
            transform: translateY(-1px);
            box-shadow: 0 0 28px rgba(59, 130, 246, 0.4);
        }

        .btn-secondary {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.05);
            color: var(--text-main);
            font-size: 14.5px;
            font-weight: 500;
            padding: 10px 22px;
            border-radius: var(--radius-full);
            border: 1px solid var(--card-border);
            text-decoration: none;
            transition: all 0.15s ease;
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.09);
            border-color: var(--card-border-hover);
        }

        /* ── Main Container ── */
        .main-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 24px 100px;
            width: 100%;
            position: relative;
            z-index: 10;
        }

        /* ── Two-Column Interactive Studio / Player Tester ── */
        .studio-grid {
            display: grid;
            grid-template-columns: 460px 1fr;
            gap: 24px;
            margin-bottom: 80px;
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
            border-radius: var(--radius-xl);
            padding: 24px;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            transition: border-color 0.2s ease;
        }

        .card:hover {
            border-color: var(--card-border-hover);
        }

        .card-header {
            margin-bottom: 20px;
        }

        .card-title {
            font-size: 19px;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #ffffff;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .card-desc {
            font-size: 13.5px;
            color: var(--text-muted);
            line-height: 1.45;
        }

        /* Form Controls */
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
        }

        .field-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 16px;
        }

        .field-label {
            font-size: 12.5px;
            font-weight: 600;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .label-badge {
            font-size: 11px;
            color: #60a5fa;
            font-weight: 500;
            background: rgba(59, 130, 246, 0.1);
            padding: 1px 6px;
            border-radius: 4px;
        }

        .input-text, .select-input {
            width: 100%;
            background: #090e1a;
            border: 1px solid var(--card-border);
            color: #ffffff;
            font-size: 14px;
            padding: 9px 12px;
            border-radius: var(--radius-sm);
            font-family: var(--font-sans);
            outline: none;
            transition: all 0.15s ease;
        }

        .input-text:focus, .select-input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        /* Segmented Pills for Sub / Dub */
        .segmented-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            background: #090e1a;
            border: 1px solid var(--card-border);
            border-radius: var(--radius-sm);
            padding: 3px;
            gap: 3px;
        }

        .segment-btn {
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: 13px;
            font-weight: 600;
            padding: 6px 12px;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .segment-btn.active {
            background: var(--primary);
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
        }

        /* Toggle Switches */
        .toggles-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-md);
            padding: 14px;
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
            font-size: 13px;
            font-weight: 500;
            color: var(--text-main);
        }

        .switch {
            position: relative;
            display: inline-block;
            width: 36px;
            height: 20px;
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
            background-color: #1e293b;
            transition: .2s;
            border-radius: 20px;
            border: 1px solid var(--card-border);
        }

        .slider:before {
            position: absolute;
            content: "";
            height: 14px;
            width: 14px;
            left: 2px;
            bottom: 2px;
            background-color: #ffffff;
            transition: .2s;
            border-radius: 50%;
        }

        input:checked + .slider {
            background-color: var(--primary);
            border-color: var(--primary);
        }

        input:checked + .slider:before {
            transform: translateX(16px);
        }

        /* Color Customizers */
        .colors-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }

        .color-picker-box {
            background: #090e1a;
            border: 1px solid var(--card-border);
            border-radius: var(--radius-sm);
            padding: 8px 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
        }

        .color-picker-box span {
            font-size: 12px;
            font-weight: 500;
            color: var(--text-muted);
        }

        .color-swatch {
            width: 18px;
            height: 18px;
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        }

        .color-swatch input[type="color"] {
            position: absolute;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
        }

        /* Dynamic Route Contract Bar */
        .url-contract-card {
            background: var(--code-bg);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-md);
            padding: 12px 14px;
            margin-bottom: 18px;
        }

        .url-contract-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
        }

        .url-contract-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 700;
            color: var(--text-subtle);
        }

        .copy-url-btn {
            background: transparent;
            border: none;
            color: var(--primary);
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 2px 4px;
        }

        .copy-url-btn:hover {
            text-decoration: underline;
        }

        .url-contract-text {
            font-family: var(--font-mono);
            font-size: 12.5px;
            color: #93c5fd;
            word-break: break-all;
            line-height: 1.4;
        }

        /* Live Preview Card */
        .preview-player-container {
            width: 100%;
            aspect-ratio: 16/9;
            background: #000000;
            border-radius: var(--radius-lg);
            overflow: hidden;
            position: relative;
            border: 1px solid var(--card-border);
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.7);
        }

        .preview-player-container iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }

        /* Live Event Monitor Terminal */
        .event-terminal {
            margin-top: 16px;
            background: var(--code-bg);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-md);
            padding: 12px 16px;
            font-family: var(--font-mono);
            font-size: 12px;
        }

        .event-terminal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            padding-bottom: 8px;
            margin-bottom: 8px;
            color: var(--text-subtle);
        }

        .status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--accent-green);
            display: inline-block;
            box-shadow: 0 0 8px var(--accent-green);
        }

        .event-log-stream {
            max-height: 100px;
            overflow-y: auto;
            display: flex;
            flex-direction: column-reverse;
            gap: 4px;
        }

        .event-entry {
            color: #cbd5e1;
            display: flex;
            align-items: baseline;
            gap: 8px;
        }

        .event-tag {
            color: #38bdf8;
            font-weight: 600;
        }

        .event-time {
            color: #64748b;
            font-size: 10.5px;
        }

        /* ── Features & Capabilities Grid ── */
        .section-header {
            text-align: center;
            max-width: 640px;
            margin: 0 auto 48px;
        }

        .section-badge {
            font-size: 12px;
            font-weight: 600;
            color: var(--primary);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-bottom: 8px;
            display: inline-block;
        }

        .section-title {
            font-size: 34px;
            font-weight: 800;
            letter-spacing: -0.025em;
            color: #ffffff;
            margin-bottom: 12px;
        }

        .section-subtitle {
            font-size: 16px;
            color: var(--text-muted);
            line-height: 1.55;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 80px;
        }

        @media (max-width: 900px) {
            .features-grid {
                grid-template-columns: 1fr;
            }
        }

        .feature-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-xl);
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .feature-icon-box {
            width: 40px;
            height: 40px;
            border-radius: var(--radius-md);
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #60a5fa;
            margin-bottom: 4px;
        }

        .feature-icon-box svg {
            width: 20px;
            height: 20px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
        }

        .feature-title {
            font-size: 17px;
            font-weight: 700;
            color: #ffffff;
        }

        .feature-desc {
            font-size: 14px;
            color: var(--text-muted);
            line-height: 1.5;
        }

        /* ── Code Integration Tabs ── */
        .code-showcase-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-xl);
            overflow: hidden;
            margin-bottom: 80px;
        }

        .code-tabs-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 20px;
            background: rgba(11, 17, 32, 0.85);
            border-bottom: 1px solid var(--card-border);
            overflow-x: auto;
        }

        .tabs-list {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .tab-btn {
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: 13.5px;
            font-weight: 600;
            padding: 6px 14px;
            border-radius: var(--radius-full);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .tab-btn:hover {
            color: #ffffff;
        }

        .tab-btn.active {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
        }

        .btn-copy-code {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid var(--card-border);
            color: var(--text-muted);
            font-size: 12.5px;
            font-weight: 500;
            padding: 5px 12px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .btn-copy-code:hover {
            background: rgba(255, 255, 255, 0.12);
            color: #ffffff;
        }

        .code-editor-body {
            background: var(--code-bg);
            padding: 24px;
            overflow-x: auto;
            font-family: var(--font-mono);
            font-size: 13px;
            line-height: 1.6;
            color: #e2e8f0;
        }

        /* ── Documentation Tables ── */
        .docs-section {
            margin-bottom: 80px;
        }

        .docs-table-wrapper {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-xl);
            overflow: hidden;
        }

        .docs-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 13.5px;
        }

        .docs-table th {
            background: rgba(11, 17, 32, 0.85);
            padding: 14px 20px;
            color: var(--text-muted);
            font-weight: 600;
            border-bottom: 1px solid var(--card-border);
            font-size: 12.5px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .docs-table td {
            padding: 16px 20px;
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
            color: #60a5fa;
        }

        .docs-type {
            font-family: var(--font-mono);
            font-size: 12px;
            color: #f59e0b;
        }

        /* ── Global Search Modal ── */
        .search-modal-backdrop {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            z-index: 1000;
            align-items: flex-start;
            justify-content: center;
            padding-top: 120px;
        }

        .search-modal-backdrop.open {
            display: flex;
        }

        .search-modal {
            width: 100%;
            max-width: 580px;
            background: #0b1329;
            border: 1px solid var(--card-border);
            border-radius: var(--radius-lg);
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.8);
            overflow: hidden;
        }

        .search-modal-input-box {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 20px;
            border-bottom: 1px solid var(--card-border);
        }

        .search-modal-input {
            width: 100%;
            background: transparent;
            border: none;
            color: #ffffff;
            font-size: 16px;
            outline: none;
            font-family: var(--font-sans);
        }

        .search-results-list {
            max-height: 360px;
            overflow-y: auto;
            padding: 8px;
        }

        .search-result-item {
            padding: 12px 14px;
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            color: var(--text-main);
            transition: background 0.15s ease;
        }

        .search-result-item:hover {
            background: rgba(59, 130, 246, 0.15);
        }

        /* ── Footer ── */
        .footer {
            border-top: 1px solid var(--card-border);
            padding: 40px 24px;
            background: #02050e;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13.5px;
            color: var(--text-subtle);
        }

        .footer a {
            color: var(--text-muted);
            text-decoration: none;
            transition: color 0.15s ease;
        }

        .footer a:hover {
            color: var(--text-main);
        }

        .footer-status-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: #22c55e;
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.2);
            padding: 4px 10px;
            border-radius: var(--radius-full);
            font-family: var(--font-mono);
        }

        @media (max-width: 640px) {
            .hero-title { font-size: 36px; }
            .hero-subtitle { font-size: 15px; }
            .marquee-grid { grid-template-columns: repeat(3, 1fr); }
            .footer { flex-direction: column; gap: 16px; text-align: center; }
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
                <span class="brand-badge">v1.0 Edge</span>
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
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>Search anime...</span>
                <span class="kbd-badge">⌘K</span>
            </button>
            <a href="#docs" class="btn-docs">
                Docs
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
        </div>
    </header>

    <!-- Hero Section with Animated Vertical Anime Marquee -->
    <section class="hero-wrapper">
        <div class="marquee-bg">
            <div class="marquee-grid">
                <!-- Col 1 (Up) -->
                <div class="marquee-col marquee-up">
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YJvLbgJQPCoI.jpg" alt="One Piece" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png" alt="Hunter x Hunter" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg" alt="Attack on Titan" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-YJvLbgJQPCoI.jpg" alt="Naruto" loading="lazy"></div>
                    <!-- Duplicate for infinite loop -->
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YJvLbgJQPCoI.jpg" alt="One Piece" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png" alt="Hunter x Hunter" loading="lazy"></div>
                </div>
                <!-- Col 2 (Down) -->
                <div class="marquee-col marquee-down">
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142838-7BqaDkwsHh6n.jpg" alt="Solo Leveling" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg" alt="Jujutsu Kaisen" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg" alt="Demon Slayer" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-NuZzyTFZqFv1.png" alt="Chainsaw Man" loading="lazy"></div>
                    <!-- Duplicate for infinite loop -->
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142838-7BqaDkwsHh6n.jpg" alt="Solo Leveling" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg" alt="Jujutsu Kaisen" loading="lazy"></div>
                </div>
                <!-- Col 3 (Up) -->
                <div class="marquee-col marquee-up">
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-kUgkcrfOrkUM.jpg" alt="Death Note" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx269-KxpvBw0aJj1n.png" alt="Bleach" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-1iHzdQo8A7gP.jpg" alt="Fullmetal Alchemist" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-8JtVpPqR7H3.jpg" alt="Dandadan" loading="lazy"></div>
                    <!-- Duplicate -->
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-kUgkcrfOrkUM.jpg" alt="Death Note" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx269-KxpvBw0aJj1n.png" alt="Bleach" loading="lazy"></div>
                </div>
                <!-- Col 4 (Down) -->
                <div class="marquee-col marquee-down">
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-YJvLbgJQPCoI.jpg" alt="Naruto" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg" alt="Attack on Titan" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YJvLbgJQPCoI.jpg" alt="One Piece" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png" alt="Hunter x Hunter" loading="lazy"></div>
                    <!-- Duplicate -->
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-YJvLbgJQPCoI.jpg" alt="Naruto" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg" alt="Attack on Titan" loading="lazy"></div>
                </div>
                <!-- Col 5 (Up) -->
                <div class="marquee-col marquee-up">
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg" alt="Jujutsu Kaisen" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142838-7BqaDkwsHh6n.jpg" alt="Solo Leveling" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-NuZzyTFZqFv1.png" alt="Chainsaw Man" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg" alt="Demon Slayer" loading="lazy"></div>
                    <!-- Duplicate -->
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg" alt="Jujutsu Kaisen" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142838-7BqaDkwsHh6n.jpg" alt="Solo Leveling" loading="lazy"></div>
                </div>
                <!-- Col 6 (Down) -->
                <div class="marquee-col marquee-down">
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-8JtVpPqR7H3.jpg" alt="Dandadan" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-1iHzdQo8A7gP.jpg" alt="Fullmetal Alchemist" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx269-KxpvBw0aJj1n.png" alt="Bleach" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-kUgkcrfOrkUM.jpg" alt="Death Note" loading="lazy"></div>
                    <!-- Duplicate -->
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-8JtVpPqR7H3.jpg" alt="Dandadan" loading="lazy"></div>
                    <div class="poster-card"><img src="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-1iHzdQo8A7gP.jpg" alt="Fullmetal Alchemist" loading="lazy"></div>
                </div>
            </div>
        </div>

        <div class="mask-top"></div>
        <div class="mask-bottom"></div>
        <div class="mask-left"></div>
        <div class="mask-right"></div>
        <div class="hero-glow"></div>

        <div class="hero-content">
            <a href="#docs" class="hero-badge-link">
                <span>Embed Documentation</span>
                <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
            <h1 class="hero-title">
                The Foundation for<br>
                <span class="gradient-text">Anime Episode Playback</span>
            </h1>
            <p class="hero-subtitle">
                A focused, high-performance Embeddable Player for host websites that need iframe-ready Episode Playback with 0ms edge delivery.
            </p>
            <div class="hero-cta-group">
                <a href="#player-tester" class="btn-primary">
                    Build Your Own
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
                <a href="#docs" class="btn-secondary">
                    View Documentation
                </a>
            </div>
        </div>
    </section>

    <main class="main-container">

        <!-- ── Interactive Studio / Player Tester ── -->
        <section id="player-tester" class="studio-grid">
            
            <!-- Left Configurator Card -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        Player Tester
                        <span class="brand-badge" id="live-anime-title">One Piece</span>
                    </h2>
                    <p class="card-desc">Tune parameters and watch the live embed respond in real time.</p>
                </div>

                <div class="form-row">
                    <div class="field-group">
                        <label class="field-label" for="cfg-id">
                            AniList ID
                            <span class="label-badge">Required</span>
                        </label>
                        <input type="number" id="cfg-id" class="input-text" value="21" min="1">
                    </div>
                    <div class="field-group">
                        <label class="field-label" for="cfg-ep">
                            Episode
                            <span class="label-badge">Min 1</span>
                        </label>
                        <input type="number" id="cfg-ep" class="input-text" value="1" min="1">
                    </div>
                </div>

                <div class="form-row">
                    <div class="field-group">
                        <label class="field-label">Audio Variant</label>
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

                <!-- Theme Colors -->
                <div class="field-group">
                    <label class="field-label">Custom Theme Colors</label>
                    <div class="colors-row">
                        <div class="color-picker-box">
                            <span>Primary</span>
                            <div class="color-swatch" style="background:#3b82f6;">
                                <input type="color" id="cfg-color-primary" value="#3b82f6">
                            </div>
                        </div>
                        <div class="color-picker-box">
                            <span>Secondary</span>
                            <div class="color-swatch" style="background:#1e293b;">
                                <input type="color" id="cfg-color-secondary" value="#1e293b">
                            </div>
                        </div>
                        <div class="color-picker-box">
                            <span>Icons</span>
                            <div class="color-swatch" style="background:#ffffff;">
                                <input type="color" id="cfg-color-icons" value="#ffffff">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Live URL Contract Bar -->
                <div class="url-contract-card">
                    <div class="url-contract-header">
                        <span class="url-contract-title">Dynamic Route Output</span>
                        <button type="button" class="copy-url-btn" id="btn-copy-url">
                            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            <span id="copy-url-text">Copy URL</span>
                        </button>
                    </div>
                    <div class="url-contract-text" id="display-embed-url">
                        https://${domain}/embed/ani/21/1?track=sub&server=1
                    </div>
                </div>

                <button type="button" id="btn-mount-player" class="btn-primary" style="width: 100%; justify-content: center; padding: 12px;">
                    Mount in Player
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
            </div>

            <!-- Right Player Preview Card -->
            <div class="card">
                <div class="card-header" style="display:flex; align-items:center; justify-content:space-between;">
                    <div>
                        <h2 class="card-title">Live Player Preview</h2>
                        <p class="card-desc">Running authentic JW Player 8 engine with zero external player bloat.</p>
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
                            Live postMessage Stream
                        </span>
                        <span style="font-size:11px;">Listening to window.parent</span>
                    </div>
                    <div class="event-log-stream" id="event-stream-container">
                        <div class="event-entry">
                            <span class="event-time">[00:00]</span>
                            <span class="event-tag">ready</span>
                            <span>JWPlayer instance mounted & sources resolved</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ── Features & Capabilities Section ── -->
        <section id="capabilities" style="margin-bottom: 80px;">
            <div class="section-header">
                <span class="section-badge">Architecture & Design</span>
                <h2 class="section-title">Built for Host Websites</h2>
                <p class="section-subtitle">Zero ad popups, zero redirect hijacks, 100% resilient 3-cluster failover with frame-accurate cues.</p>
            </div>

            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon-box">
                        <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    </div>
                    <h3 class="feature-title">Live Events Bridge</h3>
                    <p class="feature-desc">Observe real-time playback state via postMessage (<code>ready</code>, <code>play</code>, <code>pause</code>, <code>ended</code>, <code>timeupdate</code>) for watch progress syncing.</p>
                </div>

                <div class="feature-card">
                    <div class="feature-icon-box">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <h3 class="feature-title">Resume Playback</h3>
                    <p class="feature-desc">Support <code>start={seconds}</code> query parameter to seamlessly resume playback right where your user left off without manual seeking.</p>
                </div>

                <div class="feature-card">
                    <div class="feature-icon-box">
                        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                    </div>
                    <h3 class="feature-title">AniSkip Scrubber Markers</h3>
                    <p class="feature-desc">Dynamic yellow chapter markers on the timeline seekbar and interactive "Skip Intro" & "Skip Outro" buttons fully functional in fullscreen.</p>
                </div>

                <div class="feature-card">
                    <div class="feature-icon-box">
                        <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
                    </div>
                    <h3 class="feature-title">3-Engine Edge Failover</h3>
                    <p class="feature-desc">Server 1 (MegaPlay), Server 2 (AniNeko), and Server 3 (Zoko) operate in an edge mesh. If one cluster suffers CDN lag, the stream automatically falls over.</p>
                </div>

                <div class="feature-card">
                    <div class="feature-icon-box">
                        <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h3 class="feature-title">Shielded Edge Proxy</h3>
                    <p class="feature-desc">Conceals your internal private backend endpoints behind Cloudflare Workers. Prevents direct browser scraping and malicious stream leeching.</p>
                </div>

                <div class="feature-card">
                    <div class="feature-icon-box">
                        <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    </div>
                    <h3 class="feature-title">AniList & MAL Compatible</h3>
                    <p class="feature-desc">Use either <code>/embed/ani/:id/:ep</code> or <code>/embed/mal/:id/:ep</code>. Covers, titles, episodes, and intro timestamps are automatically synchronized.</p>
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

            <!-- Snippet 1: Iframe -->
            <pre class="code-editor-body" id="snippet-iframe"><code>&lt;!-- Standard VidPlay Embed --&gt;
&lt;iframe 
    src="https://${domain}/embed/ani/21/1?track=sub&server=1&autoPlay=1" 
    width="100%" 
    height="500" 
    frameborder="0" 
    scrolling="no" 
    allow="autoplay; fullscreen; picture-in-picture" 
    allowfullscreen&gt;
&lt;/iframe&gt;</code></pre>

            <!-- Snippet 2: Responsive -->
            <pre class="code-editor-body" id="snippet-responsive" style="display:none;"><code>&lt;!-- Responsive 16:9 Cinema Container --&gt;
&lt;style&gt;
  .vidplay-container {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%; /* 16:9 ratio */
    height: 0;
    overflow: hidden;
    border-radius: 12px;
    background: #000;
  }
  .vidplay-container iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
&lt;/style&gt;

&lt;div class="vidplay-container"&gt;
  &lt;iframe 
    src="https://${domain}/embed/ani/21/1?track=sub&server=1" 
    allow="autoplay; fullscreen; picture-in-picture" 
    allowfullscreen&gt;
  &lt;/iframe&gt;
&lt;/div&gt;</code></pre>

            <!-- Snippet 3: React / Next.js -->
            <pre class="code-editor-body" id="snippet-react" style="display:none;"><code>import React, { useEffect, useRef } from 'react';

export function VidPlayer({ anilistId = 21, episode = 1, track = 'sub', server = 1 }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    function handlePlayerEvent(e) {
      if (e.origin !== "https://${domain}") return;
      const data = e.data;
      if (data.event === "timeupdate") {
        // Sync continue watching progress
        console.log("Watch time:", data.currentTime, data.duration);
      } else if (data.event === "ended") {
        // Trigger next episode
        console.log("Episode ended!");
      }
    }
    window.addEventListener("message", handlePlayerEvent);
    return () => window.removeEventListener("message", handlePlayerEvent);
  }, []);

  return (
    &lt;div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}&gt;
      &lt;iframe
        ref={iframeRef}
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
  console.log("Target embed URL:", embedUrl);
&lt;/script&gt;</code></pre>
        </section>

        <!-- ── Documentation Reference ── -->
        <section id="docs" class="docs-section">
            <div class="section-header">
                <span class="section-badge">Reference Manual</span>
                <h2 class="section-title">Embed API Parameters</h2>
                <p class="section-subtitle">Full list of query parameters accepted by the embed player route.</p>
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
                            <td>Audio & subtitle language: <code>sub</code> for original Japanese with English subs, or <code>dub</code> for English dub.</td>
                        </tr>
                        <tr>
                            <td><span class="docs-param">server</span></td>
                            <td><span class="docs-type">number</span></td>
                            <td><code>1</code></td>
                            <td>Primary cluster engine: <code>1</code> (MegaPlay), <code>2</code> (AniNeko), or <code>3</code> (Zoko).</td>
                        </tr>
                        <tr>
                            <td><span class="docs-param">autoPlay</span></td>
                            <td><span class="docs-type">number</span></td>
                            <td><code>1</code></td>
                            <td>Start playback automatically on page load: <code>1</code> for enabled, <code>0</code> for manual click.</td>
                        </tr>
                        <tr>
                            <td><span class="docs-param">autoSkip</span></td>
                            <td><span class="docs-type">number</span></td>
                            <td><code>1</code></td>
                            <td>Automatically skip opening and ending credits when reaching AniSkip markers: <code>1</code> or <code>0</code>.</td>
                        </tr>
                        <tr>
                            <td><span class="docs-param">start</span></td>
                            <td><span class="docs-type">number</span></td>
                            <td><code>0</code></td>
                            <td>Resume playback at specific seconds (e.g. <code>start=507</code> resumes at 8 mins 27 secs).</td>
                        </tr>
                        <tr>
                            <td><span class="docs-param">url</span></td>
                            <td><span class="docs-type">string</span></td>
                            <td><code>none</code></td>
                            <td>Direct URL mode: Play custom direct <code>.m3u8</code> or <code>.mp4</code> video link without anime scrapers.</td>
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
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" class="search-modal-input" id="search-input" placeholder="Search anime title or AniList ID... (e.g. Naruto, One Piece)">
            </div>
            <div class="search-results-list" id="search-results-container">
                <div class="search-result-item" data-id="21" data-title="One Piece">
                    <div><strong>One Piece</strong> (AniList #21)</div>
                    <span class="brand-badge">Select</span>
                </div>
                <div class="search-result-item" data-id="11061" data-title="Hunter x Hunter (2011)">
                    <div><strong>Hunter x Hunter</strong> (AniList #11061)</div>
                    <span class="brand-badge">Select</span>
                </div>
                <div class="search-result-item" data-id="16498" data-title="Attack on Titan">
                    <div><strong>Attack on Titan</strong> (AniList #16498)</div>
                    <span class="brand-badge">Select</span>
                </div>
                <div class="search-result-item" data-id="142838" data-title="Solo Leveling">
                    <div><strong>Solo Leveling</strong> (AniList #142838)</div>
                    <span class="brand-badge">Select</span>
                </div>
                <div class="search-result-item" data-id="113415" data-title="Jujutsu Kaisen">
                    <div><strong>Jujutsu Kaisen</strong> (AniList #113415)</div>
                    <span class="brand-badge">Select</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
        <div>
            © 2026 <strong>VidPlay</strong> / <strong>VidCloud</strong> · High-Performance Anime Video Infrastructure powered by <a href="https://player.anixo.online" target="_blank" style="color:#60a5fa;">player.anixo.online</a>.
        </div>
        <div class="footer-status-badge">
            <span class="status-dot"></span>
            All Systems Operational (Edge Cluster)
        </div>
        <div style="display:flex; gap:20px;">
            <a href="#docs">Documentation</a>
            <a href="/admin">Operator Admin</a>
            <a href="https://github.com/Zayrix-bit/anixo-player" target="_blank">GitHub</a>
        </div>
    </footer>

    <!-- Interactive Client Script -->
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

            // Audio Variant Toggle
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

            // Input Event Listeners
            [inputId, inputEp, selectServer, toggleAutoplay, toggleMuted, toggleSkipIntro, toggleSkipOutro].forEach(el => {
                el.addEventListener("input", updateContractUrl);
                el.addEventListener("change", updateContractUrl);
            });

            // Mount in Player Action
            btnMount.addEventListener("click", () => {
                const url = buildUrl();
                playerIframe.src = url;
                previewStatusIndicator.textContent = "Loading Stream...";
                appendEventLog("action", "Mounted stream: Ani #" + inputId.value + " Ep " + inputEp.value);
            });

            // Copy Embed URL Button
            btnCopyUrl.addEventListener("click", () => {
                const text = displayUrl.textContent.trim();
                navigator.clipboard.writeText(text).then(() => {
                    copyUrlText.textContent = "Copied!";
                    setTimeout(() => { copyUrlText.textContent = "Copy URL"; }, 2000);
                });
            });

            // Real-Time postMessage Event Stream Logger
            window.addEventListener("message", (event) => {
                if (!event.data) return;
                const data = event.data;
                const eventName = data.event || data.type;
                if (!eventName) return;

                if (eventName === "ready") {
                    previewStatusIndicator.textContent = "Player Ready";
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
                    if (time % 10 === 0) { // Throttle log to every 10s
                        appendEventLog("timeupdate", "Current position: " + time + "s / " + dur + "s");
                    }
                } else if (eventName === "ended") {
                    previewStatusIndicator.textContent = "Ended";
                    appendEventLog("ended", "Episode playback ended");
                }
            });

            function appendEventLog(tag, message) {
                const now = new Date();
                const timeStr = "[" + String(now.getMinutes()).padStart(2, '0') + ":" + String(now.getSeconds()).padStart(2, '0') + "]";
                const row = document.createElement("div");
                row.className = "event-entry";
                row.innerHTML = '<span class="event-time">' + timeStr + '</span><span class="event-tag">' + tag + '</span><span>' + message + '</span>';
                eventStreamContainer.appendChild(row);
                if (eventStreamContainer.children.length > 25) {
                    eventStreamContainer.removeChild(eventStreamContainer.firstChild);
                }
            }

            // Code Integration Snippet Tabs
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

            // Quick Search Modal (⌘K)
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

            // Fetch Anime Title dynamically on ID blur
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
