/**
 * MINIMALIST CINEMA EMBED PLAYER
 * Strictly NO AI SLOP, NO GLOW, and NO LAST SEEN BANNER.
 * Edge-to-edge cinema design matching Netflix / Apple TV standard.
 * Features:
 * - Edge-to-edge progress bar with white scrubber thumb
 * - Left controls: Circular Volume button + Time capsule pill
 * - Right controls: Unified capsule pill (Cast, Subtitles, Settings with HD badge, PiP, Fullscreen)
 * - From-scratch glassmorphic Settings Popover with custom line icons & iOS toggle
 * - Auto-failover between 3 servers, OP/ED skip timestamps, PostMessage API
 */

export function renderEmbedHtml({
    id,
    idType = "ani",
    anilistId = null,
    malId = null,
    title = "",
    poster = "",
    episode = 1,
    totalEpisodes = 0,
    track = "sub",
    server = 1,
    autoPlay = 1,
    autoNext = 1,
    autoSkip = 1
}) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${escapeHtml(title ? `${title} - Episode ${episode}` : `Episode ${episode}`)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <style>
        :root {
            --bg: #09090b;
            --surface: #121215;
            --border: #27272a;
            --text-primary: #f4f4f5;
            --text-secondary: #a1a1aa;
            --text-muted: #71717a;
            --accent: #ffffff;
            --danger: #ef4444;
            --success: #22c55e;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-tap-highlight-color: transparent;
        }

        html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #000000;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: var(--text-primary);
            user-select: none;
        }

        #player-root {
            position: relative;
            width: 100vw;
            height: 100vh;
            background: #000000;
            overflow: hidden;
        }

        #artplayer {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
        }

        /* =========================================================
           CINEMA DARK PLAYER DESIGN SYSTEM (MATCHING REFERENCE)
           Clean, sleek, zero glow, professional cinema controls
           ========================================================= */

        .art-video-player {
            --art-theme: #ffffff !important;
            --art-font-color: #f4f4f5 !important;
            --art-background-color: #000000 !important;
            --art-text-shadow-color: transparent !important;
            --art-border-radius: 6px !important;
            --art-progress-height: 2.5px !important;
            --art-progress-color: rgba(255, 255, 255, 0.2) !important;
            --art-hover-color: rgba(255, 255, 255, 0.35) !important;
            --art-loaded-color: rgba(255, 255, 255, 0.3) !important;
            --art-indicator-size: 12px !important;
            --art-control-height: 44px !important;
            --art-control-opacity: 0.9 !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            text-shadow: none !important;
        }

        /* STRICTLY REMOVE LAST SEEN BANNER / AUTO-PLAYBACK PROMPT */
        .art-layer-auto-playback,
        .art-video-player .art-layer-auto-playback,
        .art-video-player.art-backdrop .art-layer-auto-playback {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
            visibility: hidden !important;
        }

        /* 1. Full-Width Bottom Vignette */
        .art-bottom {
            background-image: linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%) !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            padding: 0 16px 10px 16px !important;
            transition: opacity 0.2s ease !important;
        }

        .art-bottom-gradient {
            background: none !important;
        }

        /* 2. Edge-to-Edge Progress Bar */
        .art-progress {
            padding: 8px 0 10px 0 !important;
            margin: 0 !important;
            cursor: pointer !important;
        }

        .art-control-progress-inner {
            background-color: rgba(255, 255, 255, 0.2) !important;
            border-radius: 2px !important;
            height: 2.5px !important;
            overflow: visible !important;
            transition: height 0.15s ease !important;
        }

        .art-progress:hover .art-control-progress-inner {
            height: 4px !important;
        }

        .art-progress-loaded {
            background-color: rgba(255, 255, 255, 0.35) !important;
            border-radius: 2px !important;
        }

        .art-progress-played {
            background: #ffffff !important;
            border-radius: 2px !important;
            box-shadow: none !important;
        }

        .art-progress-indicator {
            background: #ffffff !important;
            border: none !important;
            border-radius: 50% !important;
            box-shadow: 0 1px 5px rgba(0, 0, 0, 0.8) !important;
            width: 12px !important;
            height: 12px !important;
            transform: scale(1) !important;
            opacity: 1 !important;
            top: 50% !important;
            margin-top: -6px !important;
            transition: transform 0.15s ease !important;
        }

        .art-progress:hover .art-progress-indicator {
            transform: scale(1.3) !important;
        }

        /* Scrub Tooltip */
        .art-progress-tip {
            background: #111114 !important;
            border: 1px solid #27272a !important;
            color: #f4f4f5 !important;
            font-family: 'JetBrains Mono', monospace !important;
            font-size: 11px !important;
            font-weight: 500 !important;
            border-radius: 4px !important;
            padding: 3px 6px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6) !important;
        }

        /* 3. Controls Row */
        .art-controls {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            height: 40px !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
        }

        .art-controls-center {
            display: none !important;
        }

        /* Hide Bottom Left Play Button (Matches Reference Image Exactly) */
        .art-control-play,
        .art-control-playAndPause,
        .art-controls-left .art-control-play,
        .art-controls-left .art-control-playAndPause,
        .art-controls-left > div:first-child:not(.art-control-volume) {
            display: none !important;
        }

        /* Left Controls: Volume Circle + Time Pill, perfectly aligned */
        .art-controls-left {
            display: inline-flex !important;
            align-items: center !important;
            gap: 8px !important;
            height: 36px !important;
        }

        /* ── Volume Button: Perfect Circle (Pure Sound ON / OFF Toggle) ── */
        .art-video-player .art-bottom .art-controls .art-controls-left .art-control.art-control-volume,
        .art-video-player .art-controls-left .art-control-volume,
        .art-control.art-control-volume,
        .art-control-volume {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            max-width: 36px !important;
            min-height: 36px !important;
            max-height: 36px !important;
            flex: 0 0 36px !important;
            aspect-ratio: 1 / 1 !important;
            border-radius: 50% !important;
            border: 1px solid rgba(255, 255, 255, 0.14) !important;
            background: rgba(255, 255, 255, 0.08) !important;
            backdrop-filter: blur(16px) saturate(180%) !important;
            -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            align-self: center !important;
            box-sizing: border-box !important;
            padding: 0 !important;
            margin: 0 !important;
            color: #ffffff !important;
            cursor: pointer !important;
            position: relative !important;
            overflow: hidden !important;
            transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease !important;
        }

        .art-control-volume:hover {
            background: rgba(255, 255, 255, 0.16) !important;
            border-color: rgba(255, 255, 255, 0.28) !important;
            transform: scale(1.05) !important;
        }

        .art-control-volume:active {
            transform: scale(0.95) !important;
        }

        /* Both volume SVGs: stack on top of each other inside the circle center */
        .art-control-volume > svg {
            width: 18px !important;
            height: 18px !important;
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            pointer-events: none !important;
            flex-shrink: 0 !important;
        }

        /* Sound ON (Default): show speaker waves (first SVG), hide mute X (last SVG) */
        .art-control-volume > svg:first-of-type {
            display: block !important;
        }
        .art-control-volume > svg:last-of-type {
            display: none !important;
        }

        /* Sound OFF (Muted via .is-muted): hide speaker waves, show mute X */
        .art-control-volume.is-muted > svg:first-of-type {
            display: none !important;
        }
        .art-control-volume.is-muted > svg:last-of-type {
            display: block !important;
        }

        /* Volume slider panel completely removed: pure on/off toggle */
        .art-control-volume .art-volume-panel,
        .art-control-volume:hover .art-volume-panel,
        .art-volume-panel {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            transform: none !important;
        }

        /* Time Capsule Pill Badge - Laser-aligned with Volume Button & Inter typography */
        .art-video-player .art-bottom .art-controls .art-controls-left .art-control.art-control-time,
        .art-video-player .art-controls-left .art-control-time,
        .art-control.art-control-time,
        .art-control-time {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            align-self: center !important;
            height: 36px !important;
            min-height: 36px !important;
            max-height: 36px !important;
            padding: 0 14px !important;
            box-sizing: border-box !important;
            border-radius: 9999px !important;
            border: 1px solid rgba(255, 255, 255, 0.14) !important;
            background: rgba(255, 255, 255, 0.08) !important;
            backdrop-filter: blur(16px) saturate(180%) !important;
            -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            font-variant-numeric: tabular-nums !important;
            font-feature-settings: "tnum" 1 !important;
            font-size: 12.5px !important;
            font-weight: 500 !important;
            color: rgba(255, 255, 255, 0.75) !important;
            letter-spacing: 0.15px !important;
            margin: 0 !important;
            white-space: nowrap !important;
            user-select: none !important;
            line-height: normal !important;
        }

        .art-control-time-current {
            color: #ffffff !important;
            font-weight: 600 !important;
            margin-right: 3px !important;
        }

        .art-control-time-duration {
            color: rgba(255, 255, 255, 0.75) !important;
            font-weight: 500 !important;
            margin-left: 3px !important;
        }

        /* Right Controls: Unified Capsule Pill */
        .art-controls-right {
            display: inline-flex !important;
            align-items: center !important;
            gap: 2px !important;
            height: 38px !important;
            padding: 0 4px !important;
            border-radius: 9999px !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            background: rgba(255, 255, 255, 0.08) !important;
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
        }

        /* Strict 32px Circular Buttons (Fixes Oval Hover Bug Permanently) */
        .art-video-player .art-bottom .art-controls .art-controls-right .art-control,
        .art-video-player .art-controls-right .art-control,
        .art-video-player .art-control.art-control-setting {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            max-width: 32px !important;
            min-height: 32px !important;
            max-height: 32px !important;
            flex: 0 0 32px !important;
            aspect-ratio: 1 / 1 !important;
            padding: 0 !important;
            margin: 0 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            align-self: center !important;
            box-sizing: border-box !important;
            border-radius: 50% !important;
            color: rgba(255, 255, 255, 0.82) !important;
            background: transparent !important;
            cursor: pointer !important;
            position: relative !important;
            transition: background 0.15s ease, color 0.15s ease !important;
        }

        /* Circular Disk Hover & Active Effect */
        .art-video-player .art-bottom .art-controls .art-controls-right .art-control:hover,
        .art-video-player .art-controls-right .art-control:hover,
        .art-video-player.art-setting-show .art-control-setting,
        .art-video-player .art-control-setting:hover,
        .art-video-player .art-control-setting.art-active {
            color: #ffffff !important;
            background: rgba(255, 255, 255, 0.16) !important;
            border-radius: 50% !important;
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            max-width: 32px !important;
            min-height: 32px !important;
            max-height: 32px !important;
            aspect-ratio: 1 / 1 !important;
        }

        /* Strict Hollow Line Icons */
        .art-controls-right .art-control svg {
            width: 18px !important;
            height: 18px !important;
            fill: none !important;
            stroke: currentColor !important;
            stroke-width: 1.8px !important;
            stroke-linecap: round !important;
            stroke-linejoin: round !important;
            overflow: visible !important;
            pointer-events: none !important;
        }

        .art-controls-right .art-control svg path,
        .art-controls-right .art-control svg rect,
        .art-controls-right .art-control svg circle,
        .art-controls-right .art-control svg line,
        .art-controls-right .art-control svg polygon {
            fill: none !important;
            stroke: currentColor !important;
            stroke-width: 1.8px !important;
            stroke-linecap: round !important;
            stroke-linejoin: round !important;
        }

        /* PiP mini cutout */
        .art-controls-right .art-control-pip svg rect:last-child {
            fill: #09090b !important;
            stroke: currentColor !important;
        }

        /* HD Badge on Settings Gear */
        .art-control-setting {
            position: relative !important;
            overflow: visible !important;
        }

        .art-control-setting::after {
            display: none !important;
        }

        .art-control-setting .hd-badge {
            position: absolute !important;
            top: 1px !important;
            right: -1px !important;
            background: #ffffff !important;
            color: #09090b !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            font-size: 7px !important;
            font-weight: 800 !important;
            line-height: 1 !important;
            padding: 1.5px 3px !important;
            border-radius: 3px !important;
            pointer-events: none !important;
            letter-spacing: 0.2px !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6) !important;
            z-index: 10 !important;
        }

        /* 4. Volume Slider Removed: Pure On/Off Toggle Button */
        .art-volume-panel,
        .art-control-volume .art-volume-panel,
        .art-control-volume:hover .art-volume-panel,
        .art-volume-inner,
        .art-volume-slider,
        .art-volume-loaded,
        .art-volume-indicator,
        .art-volume-val {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }

        /* =========================================================
           5. ULTRA-PREMIUM CINEMA GLASSMORPHIC SETTINGS POPOVER
           Built completely from scratch: dark frosted glass,
           bespoke line icons, pill chips, iOS toggle, no clipping
           ========================================================= */
        .art-video-player .art-settings {
            background: rgba(13, 13, 17, 0.94) !important;
            backdrop-filter: blur(28px) saturate(190%) !important;
            -webkit-backdrop-filter: blur(28px) saturate(190%) !important;
            border: 1px solid rgba(255, 255, 255, 0.12) !important;
            box-shadow: 0 20px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05) inset !important;
            border-radius: 14px !important;
            padding: 8px !important;
            width: 290px !important;
            min-width: 290px !important;
            max-width: 290px !important;
            height: auto !important;
            min-height: auto !important;
            max-height: 380px !important;
            box-sizing: border-box !important;
            bottom: 58px !important;
            right: 14px !important;
            left: auto !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            text-shadow: none !important;
            animation: artSettingsIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) !important;
            transform-origin: bottom right !important;
            transition: height 0.18s ease !important;
        }

        .art-video-player .art-settings::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
        }

        @keyframes artSettingsIn {
            from {
                opacity: 0;
                transform: translateY(6px) scale(0.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        /* Every setting panel fills container with professional compact spacing */
        .art-video-player .art-settings .art-setting-panel {
            width: 100% !important;
            height: auto !important;
            max-height: 100% !important;
            box-sizing: border-box !important;
            gap: 4px !important; /* Clean professional 4px gap, no giant voids */
            border-radius: 10px !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            display: none !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            padding: 0 !important;
        }

        .art-video-player .art-settings .art-setting-panel.art-current {
            display: flex !important;
        }

        .art-video-player .art-settings .art-setting-panel::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
        }

        /* Main Menu Setting Items: Balanced 38px height with clean padding */
        .art-video-player .art-settings .art-setting-panel .art-setting-item {
            height: 38px !important;
            min-height: 38px !important;
            line-height: normal !important;
            padding: 0 12px !important;
            margin: 0 !important;
            border-radius: 8px !important;
            color: rgba(255, 255, 255, 0.9) !important;
            font-size: 13.5px !important;
            font-weight: 500 !important;
            font-family: 'Inter', sans-serif !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            cursor: pointer !important;
            transition: background 0.15s ease, color 0.15s ease !important;
            border: none !important;
            background: transparent !important;
            flex-shrink: 0 !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item:hover {
            background: rgba(255, 255, 255, 0.08) !important;
            color: #ffffff !important;
        }

        /* Submenus: sequential compact items */
        .art-video-player .art-settings .art-submenu-panel,
        .art-video-player .art-settings .art-setting-panel:has(.art-setting-item-back) {
            justify-content: flex-start !important;
            gap: 2px !important;
            padding: 0 !important;
        }

        /* Submenu Header / Back Button */
        .art-video-player .art-settings .art-setting-panel .art-setting-item-back {
            height: 36px !important;
            min-height: 36px !important;
            padding: 0 10px !important;
            margin-bottom: 4px !important;
            border-radius: 8px !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            background: rgba(255, 255, 255, 0.04) !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            color: #ffffff !important;
            display: flex !important;
            align-items: center !important;
            cursor: pointer !important;
            flex-shrink: 0 !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item-back:hover {
            background: rgba(255, 255, 255, 0.09) !important;
        }

        /* Submenu options: sleek & compact */
        .art-video-player .art-settings .art-submenu-panel .art-setting-item,
        .art-video-player .art-settings .art-setting-panel:has(.art-setting-item-back) .art-setting-item {
            height: 32px !important;
            min-height: 32px !important;
            padding: 0 10px !important;
            margin: 1px 0 !important;
            font-size: 13px !important;
            border-radius: 6px !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item-back .art-setting-item-left-icon {
            margin-right: 4px !important;
            color: rgba(255, 255, 255, 0.8) !important;
        }

        /* Selected Option in Submenu */
        .art-video-player .art-settings .art-setting-panel .art-setting-item.art-current {
            background: rgba(255, 255, 255, 0.08) !important;
            color: #ffffff !important;
            font-weight: 600 !important;
        }

        /* Checkmark in Submenu */
        .art-video-player .art-settings .art-setting-panel .art-setting-item .art-icon-check {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 16px !important;
            height: 16px !important;
            color: #ffffff !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item:not(.art-current) .art-icon-check {
            display: none !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item.art-current .art-icon-check {
            display: inline-flex !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item .art-icon-check svg {
            width: 14px !important;
            height: 14px !important;
            stroke: #ffffff !important;
        }

        /* Left section of Item (Icon + Text) */
        .art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-left {
            display: inline-flex !important;
            align-items: center !important;
            gap: 12px !important;
            font-size: 13.5px !important;
            font-weight: 500 !important;
            color: inherit !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-left .art-setting-item-left-icon {
            width: 18px !important;
            height: 18px !important;
            min-width: 18px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: rgba(255, 255, 255, 0.7) !important;
            transition: color 0.15s ease !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item:hover .art-setting-item-left .art-setting-item-left-icon {
            color: #ffffff !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-left .art-setting-item-left-icon svg {
            width: 18px !important;
            height: 18px !important;
            stroke: currentColor !important;
            fill: none !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-left .art-setting-item-left-text {
            font-family: 'Inter', sans-serif !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            letter-spacing: -0.15px !important;
            color: inherit !important;
        }

        /* Right section of Item (Tooltip pill + Chevron / Switch) */
        .art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-right {
            display: inline-flex !important;
            align-items: center !important;
            gap: 12px !important; /* Clean room between badge and arrow, no cramming */
        }

        /* Sleek Chip Pill for values: compact modern typography (Inter), never crowded */
        .art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-right .art-setting-item-right-tooltip {
            display: inline-flex !important;
            align-items: center !important;
            background: rgba(255, 255, 255, 0.08) !important;
            border: 1px solid rgba(255, 255, 255, 0.12) !important;
            padding: 3px 10px !important;
            border-radius: 6px !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            color: rgba(255, 255, 255, 0.85) !important;
            letter-spacing: -0.1px !important;
            white-space: nowrap !important;
            transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-right .art-setting-item-right-tooltip:empty {
            display: none !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item:hover .art-setting-item-right .art-setting-item-right-tooltip {
            background: rgba(255, 255, 255, 0.14) !important;
            border-color: rgba(255, 255, 255, 0.2) !important;
            color: #ffffff !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item:hover .art-setting-item-right .art-setting-item-right-tooltip:empty {
            display: none !important;
        }

        /* Right Chevron Icon */
        .art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-right .art-setting-item-right-icon {
            width: 14px !important;
            height: 14px !important;
            min-width: 14px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: rgba(255, 255, 255, 0.45) !important;
            transition: color 0.15s ease !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item:hover .art-setting-item-right .art-setting-item-right-icon {
            color: #ffffff !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-right .art-setting-item-right-icon svg {
            stroke: currentColor !important;
        }

        /* Toggle Switch for Auto-Skip: hide redundant ON/OFF text */
        .art-video-player .art-settings .art-setting-panel .art-setting-item[data-name*="skip"] .art-setting-item-right .art-setting-item-right-tooltip,
        .art-video-player .art-settings .art-setting-panel .art-setting-item[data-name*="auto-skip"] .art-setting-item-right .art-setting-item-right-tooltip {
            display: none !important;
        }

        .art-video-player .art-settings .art-setting-panel .art-setting-item .art-setting-item-right .art-setting-item-right-icon:has(svg) {
            width: 36px !important;
            min-width: 36px !important;
            height: 20px !important;
        }

        /* 6. Center Play/Pause Indicator */
        .art-state {
            width: 64px !important;
            height: 64px !important;
            background: rgba(0, 0, 0, 0.6) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 50% !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
            transition: transform 0.15s ease, background 0.15s ease !important;
        }

        .art-state:hover {
            transform: scale(1.06) !important;
            background: rgba(0, 0, 0, 0.8) !important;
            border-color: rgba(255, 255, 255, 0.35) !important;
        }

        .art-state svg {
            fill: #ffffff !important;
            width: 26px !important;
            height: 26px !important;
            margin-left: 3px !important;
        }

        /* 7. Tooltips */
        .art-tip {
            background: #18181b !important;
            border: 1px solid #27272a !important;
            border-radius: 4px !important;
            padding: 3px 6px !important;
            font-size: 11px !important;
            font-weight: 500 !important;
            color: #ffffff !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6) !important;
        }

        /* 8. Notification Toast & Skip Buttons */
        .toast-msg {
            position: absolute;
            top: 16px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(18, 18, 21, 0.95) !important;
            border: 1px solid rgba(255, 255, 255, 0.14) !important;
            backdrop-filter: blur(16px) !important;
            color: var(--text-primary);
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            z-index: 40;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7) !important;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .toast-msg.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }

        .toast-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--text-muted);
        }

        .toast-dot.green { background: var(--success); }
        .toast-dot.red { background: var(--danger); }
        .toast-dot.yellow { background: #eab308; }

        .skip-button {
            position: absolute;
            bottom: 58px;
            right: 16px;
            background: rgba(18, 18, 21, 0.9) !important;
            border: 1px solid rgba(255, 255, 255, 0.18) !important;
            backdrop-filter: blur(16px) !important;
            color: #ffffff !important;
            padding: 6px 14px;
            border-radius: 8px;
            font-family: inherit !important;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            display: none;
            align-items: center;
            gap: 6px;
            z-index: 25;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6) !important;
            transition: background 0.15s ease, border-color 0.15s ease;
        }

        .skip-button:hover {
            background: rgba(255, 255, 255, 0.14) !important;
            border-color: rgba(255, 255, 255, 0.3) !important;
        }

        /* 9. Minimalist Subtitles */
        .art-subtitle {
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9), 0 0 2px #000 !important;
        }

        .art-subtitle-line {
            font-family: 'Inter', sans-serif !important;
            font-size: 20px !important;
            font-weight: 600 !important;
            color: #ffffff !important;
        }

        /* Mobile */
        @media (max-width: 640px) {
            .art-bottom { padding: 0 10px 8px 10px !important; }
            .art-controls { height: 38px !important; }
            .art-controls-left { height: 32px !important; gap: 6px !important; }
            .art-control-time { height: 32px !important; min-height: 32px !important; max-height: 32px !important; padding: 0 10px !important; font-size: 11px !important; }
            .art-control-volume { width: 32px !important; height: 32px !important; min-width: 32px !important; max-width: 32px !important; min-height: 32px !important; max-height: 32px !important; flex: 0 0 32px !important; }
            .skip-button { bottom: 50px; right: 12px; font-size: 11px; padding: 4px 10px; }
            .art-settings { min-width: 240px !important; right: 8px !important; bottom: 50px !important; }
        }
    </style>
</head>
<body>
    <div id="player-root">
        <!-- Notification Toast -->
        <div class="toast-msg" id="toast">
            <div class="toast-dot" id="toast-dot"></div>
            <span id="toast-text">Initializing stream...</span>
        </div>

        <!-- Skip Intro Button -->
        <button class="skip-button" id="btn-skip-intro" onclick="skipTimestamp('intro')">
            ⏩ Skip Intro
        </button>

        <!-- Skip Outro Button -->
        <button class="skip-button" id="btn-skip-outro" onclick="skipTimestamp('outro')">
            ⏩ Skip Outro
        </button>

        <!-- Video Player -->
        <div id="artplayer"></div>
    </div>

    <script>
        const STATE = {
            id: "${escapeJs(id || '')}",
            idType: "${escapeJs(idType || 'ani')}",
            anilistId: ${anilistId ? anilistId : 'null'},
            malId: ${malId ? malId : 'null'},
            title: "${escapeJs(title || '')}",
            currentEp: ${parseInt(episode, 10) || 1},
            totalEpisodes: ${parseInt(totalEpisodes, 10) || 0},
            track: "${escapeJs(track || 'sub')}",
            server: ${parseInt(server, 10) || 1},
            autoPlay: ${autoPlay ? 'true' : 'false'},
            autoNext: ${autoNext ? 'true' : 'false'},
            autoSkip: ${autoSkip ? 'true' : 'false'},
            streamData: null,
            art: null,
            failoverAttempt: 0
        };

        // PostMessage helper to communicate with parent host page
        function postToParent(eventName, payload = {}) {
            try {
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                        source: 'aniembed',
                        event: eventName,
                        animeId: STATE.id,
                        anilistId: STATE.anilistId,
                        malId: STATE.malId,
                        title: STATE.title,
                        episode: STATE.currentEp,
                        track: STATE.track,
                        server: STATE.server,
                        ...payload
                    }, '*');
                }
            } catch (e) {}
        }

        // Listen for parent postMessages
        window.addEventListener('message', (e) => {
            if (!e.data || typeof e.data !== 'object') return;
            const action = e.data.action;
            if (action === 'play' && STATE.art) STATE.art.play();
            else if (action === 'pause' && STATE.art) STATE.art.pause();
            else if (action === 'changeEpisode' && e.data.episode) changeEpisode(parseInt(e.data.episode, 10));
            else if (action === 'changeServer' && e.data.server) onUserSelectServer(parseInt(e.data.server, 10));
            else if (action === 'changeTrack' && e.data.track) {
                STATE.track = e.data.track.toLowerCase();
                initStream();
            }
        });

        function showToast(text, type = 'info', duration = 3000) {
            const toast = document.getElementById('toast');
            const toastText = document.getElementById('toast-text');
            const toastDot = document.getElementById('toast-dot');

            toastText.innerText = text;
            toastDot.className = 'toast-dot ' + (type === 'success' ? 'green' : (type === 'error' ? 'red' : 'yellow'));
            toast.classList.add('show');

            clearTimeout(window.__toastTimer);
            window.__toastTimer = setTimeout(() => {
                toast.classList.remove('show');
            }, duration);
        }

        // Load Stream with Multi-Server Failover
        async function initStream() {
            showToast(\`Connecting to Server \${STATE.server}...\`, 'yellow', 2500);

            const url = new URL('/api/stream/resolve', window.location.origin);
            if (STATE.idType === 'mal' || STATE.malId) {
                url.searchParams.set('malId', STATE.malId || STATE.id);
            }
            if (STATE.idType === 'ani' || STATE.anilistId) {
                url.searchParams.set('anilistId', STATE.anilistId || STATE.id);
            }
            if (STATE.title) url.searchParams.set('title', STATE.title);
            url.searchParams.set('episode', STATE.currentEp);
            url.searchParams.set('track', STATE.track);
            url.searchParams.set('server', STATE.server);

            try {
                const res = await fetch(url.toString());
                if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
                const data = await res.json();

                if (!data.streamUrl) {
                    throw new Error('No playable stream URL returned from resolver');
                }

                STATE.streamData = data;
                STATE.failoverAttempt = 0;

                // Sync resolved meta
                if (data.resolvedTitle && !STATE.title) {
                    STATE.title = data.resolvedTitle;
                    document.title = \`\${STATE.title} - Episode \${STATE.currentEp}\`;
                }
                if (data.resolvedAniId && !STATE.anilistId) STATE.anilistId = data.resolvedAniId;
                if (data.resolvedMalId && !STATE.malId) STATE.malId = data.resolvedMalId;
                if (data.meta?.episodes && !STATE.totalEpisodes) {
                    STATE.totalEpisodes = data.meta.episodes;
                }

                // Sync server
                if (data.serverId && data.serverId !== STATE.server) {
                    STATE.server = data.serverId;
                }

                mountPlayer(data);
                showToast(\`Playing from \${data.server || 'Server ' + STATE.server}\`, 'success', 2500);
                postToParent('aniembed:ready');
            } catch (err) {
                console.warn('Stream failed on server', STATE.server, err);
                attemptFailover(err.message);
            }
        }

        // Seamless Auto-Failover to next available server
        function attemptFailover(errorMsg) {
            STATE.failoverAttempt++;
            const serverCycle = [1, 2, 3];
            const nextServer = serverCycle[STATE.server % 3];

            if (STATE.failoverAttempt < 3) {
                showToast(\`Server \${STATE.server} unavailable. Trying Server \${nextServer}...\`, 'yellow', 3500);
                STATE.server = nextServer;
                setTimeout(initStream, 500);
            } else {
                showToast(\`All stream servers failed: \${errorMsg}\`, 'error', 6000);
            }
        }

        function mountPlayer(data) {
            if (STATE.art) {
                try { STATE.art.destroy(true); } catch (e) {}
                STATE.art = null;
            }

            // Subtitles parsing
            let defaultSub = null;
            const subtitleSettings = [];
            if (Array.isArray(data.subtitles) && data.subtitles.length > 0) {
                defaultSub = data.subtitles.find(s => s.default) || 
                             data.subtitles.find(s => (s.label || '').toLowerCase().includes('english')) || 
                             data.subtitles[0];

                data.subtitles.forEach((s, idx) => {
                    subtitleSettings.push({
                        default: s === defaultSub,
                        html: s.label || \`Subtitle \${idx + 1}\`,
                        url: s.url
                    });
                });
            }

            // Skip Highlights
            const highlights = [];
            if (data.intro && data.intro.end > 0) {
                highlights.push({ time: data.intro.start || 0, text: 'Intro Start' });
                highlights.push({ time: data.intro.end, text: 'Intro End' });
            }
            if (data.outro && data.outro.end > 0) {
                highlights.push({ time: data.outro.start || 0, text: 'Outro Start' });
                highlights.push({ time: data.outro.end, text: 'Outro End' });
            }

            // Bespoke Line Icons for Settings Menu & Controls
            const SETTING_ICONS = {
                speed: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polygon points="10 8 16 12 10 16 10 8"/></svg>',
                server: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="7" rx="2"/><rect x="2" y="14" width="20" height="7" rx="2"/><line x1="6" y1="6.5" x2="6.01" y2="6.5"/><line x1="6" y1="17.5" x2="6.01" y2="17.5"/><line x1="10" y1="6.5" x2="18" y2="6.5"/><line x1="10" y1="17.5" x2="18" y2="17.5"/></svg>',
                subtitles: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><line x1="7" y1="9.5" x2="10" y2="9.5"/><line x1="14" y1="9.5" x2="17" y2="9.5"/><line x1="7" y1="14.5" x2="11" y2="14.5"/><line x1="14" y1="14.5" x2="17" y2="14.5"/></svg>',
                autoSkip: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="4 5 14 12 4 19 4 5"/><polygon points="12 5 22 12 12 19 12 5"/></svg>',
                quality: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M7 15V9"/><path d="M7 12h4"/><path d="M11 15V9"/><path d="M15 9v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2z"/></svg>',
                arrowLeft: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
                arrowRight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
                check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
                switchOn: '<svg width="34" height="18" viewBox="0 0 34 18" fill="none" style="display:block;"><rect width="34" height="18" rx="9" fill="#ffffff"/><circle cx="25" cy="9" r="6.5" fill="#09090b"/></svg>',
                switchOff: '<svg width="34" height="18" viewBox="0 0 34 18" fill="none" style="display:block;"><rect x="0.5" y="0.5" width="33" height="17" rx="8.5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)"/><circle cx="9" cy="9" r="5.5" fill="rgba(255,255,255,0.5)"/></svg>'
            };

            // Artplayer Settings
            const settings = [
                {
                    icon: SETTING_ICONS.server,
                    name: 'server-route',
                    width: 290,
                    html: 'Server Route',
                    tooltip: \`Server \${STATE.server}\`,
                    selector: [
                        { default: STATE.server === 1, html: 'Server 1 (MegaPlay)', value: 1 },
                        { default: STATE.server === 2, html: 'Server 2 (AniNeko)', value: 2 },
                        { default: STATE.server === 3, html: 'Server 3 (Zoko)', value: 3 }
                    ],
                    onSelect: function(item) {
                        onUserSelectServer(item.value);
                        return item.html;
                    }
                }
            ];

            if (subtitleSettings.length > 0) {
                settings.push({
                    icon: SETTING_ICONS.subtitles,
                    name: 'subtitles',
                    width: 290,
                    html: 'Subtitles',
                    tooltip: defaultSub ? defaultSub.label : 'Off',
                    selector: [
                        { html: 'Off', url: '' },
                        ...subtitleSettings
                    ],
                    onSelect: function(item) {
                        if (!item.url) {
                            STATE.art.subtitle.show = false;
                            updateSubtitleIcon(false);
                            return 'Off';
                        }
                        STATE.art.subtitle.show = true;
                        STATE.art.subtitle.switch(item.url, { name: item.html, escape: false });
                        updateSubtitleIcon(true);
                        return item.html;
                    }
                });
            }

            // Auto-Skip OP/ED
            settings.push({
                icon: SETTING_ICONS.autoSkip,
                name: 'auto-skip',
                html: 'Auto-Skip OP/ED',
                tooltip: STATE.autoSkip ? 'ON' : 'OFF',
                switch: STATE.autoSkip,
                onSwitch: function(item) {
                    STATE.autoSkip = !item.switch;
                    return STATE.autoSkip;
                }
            });

            // Stateful Subtitle Icons
            const SUB_ICON_ON = \`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="3" fill="none"/>
                <line x1="7" y1="9.5" x2="10" y2="9.5"/>
                <line x1="14" y1="9.5" x2="17" y2="9.5"/>
                <line x1="7" y1="14.5" x2="11" y2="14.5"/>
                <line x1="14" y1="14.5" x2="17" y2="14.5"/>
            </svg>\`;

            const SUB_ICON_OFF = \`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="3" fill="none"/>
                <line x1="7" y1="9.5" x2="10" y2="9.5"/>
                <line x1="14" y1="9.5" x2="17" y2="9.5"/>
                <line x1="7" y1="14.5" x2="11" y2="14.5"/>
                <line x1="14" y1="14.5" x2="17" y2="14.5"/>
                <line x1="2.5" y1="2.5" x2="21.5" y2="21.5"/>
            </svg>\`;

            function updateSubtitleIcon(isOn) {
                const subBtn = document.querySelector('.art-control-sub-btn');
                if (subBtn) {
                    subBtn.innerHTML = isOn ? SUB_ICON_ON : SUB_ICON_OFF;
                }
            }

            // Standardize Artplayer setting sizing constants
            if (typeof Artplayer !== 'undefined') {
                Artplayer.SETTING_WIDTH = 290;
                Artplayer.SETTING_ITEM_WIDTH = 290;
            }

            // Initialize Artplayer with Hls.js
            STATE.art = new Artplayer({
                container: '#artplayer',
                url: data.streamUrl,
                type: 'm3u8',
                customType: {
                    m3u8: function(video, url, artInstance) {
                        if (Hls.isSupported()) {
                            if (artInstance.hls) artInstance.hls.destroy();
                            const hls = new Hls({
                                enableWorker: true,
                                lowLatencyMode: true,
                                backBufferLength: 90
                            });
                            hls.loadSource(url);
                            hls.attachMedia(video);
                            artInstance.hls = hls;
                            artInstance.on('destroy', () => hls.destroy());

                            hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                                if (data.levels && data.levels.length > 1) {
                                    const qualities = data.levels.map((lvl, idx) => ({
                                        html: \`\${lvl.height}p\`,
                                        level: idx
                                    }));
                                    qualities.unshift({ default: true, html: 'Auto', level: -1 });

                                    artInstance.setting.add({
                                        icon: SETTING_ICONS.quality,
                                        name: 'quality',
                                        html: 'Quality',
                                        tooltip: 'Auto',
                                        selector: qualities,
                                        onSelect: function(q) {
                                            hls.currentLevel = q.level;
                                            return q.html;
                                        }
                                    });
                                }
                            });

                            hls.on(Hls.Events.ERROR, (event, data) => {
                                if (data.fatal) {
                                    console.warn('Fatal HLS Error:', data.type);
                                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                                        hls.startLoad();
                                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                                        hls.recoverMediaError();
                                    } else {
                                        attemptFailover('Playback stream decoded fatal error');
                                    }
                                }
                            });
                        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                            video.src = url;
                        }
                    }
                },
                theme: '#ffffff',
                volume: 0.9,
                isLive: false,
                autoplay: STATE.autoPlay,
                pip: true,
                screenshot: false,
                setting: true,
                loop: false,
                playbackRate: true,
                aspectRatio: false,
                fullscreen: true,
                fullscreenWeb: false,
                miniProgressBar: true,
                mutex: true,
                backdrop: true,
                playsInline: true,
                autoPlayback: false, // STRICTLY FALSE: Removes "Last Seen" / resume prompt completely
                hotkey: true,
                icons: {
                    volume: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
                    volumeClose: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><line x1="20" y1="9" x2="14" y2="15"/><line x1="14" y1="9" x2="20" y2="15"/></svg>',
                    playbackRate: SETTING_ICONS.speed,
                    arrowLeft: SETTING_ICONS.arrowLeft,
                    arrowRight: SETTING_ICONS.arrowRight,
                    check: SETTING_ICONS.check,
                    switchOn: SETTING_ICONS.switchOn,
                    switchOff: SETTING_ICONS.switchOff
                },
                subtitle: defaultSub ? {
                    url: defaultSub.url,
                    type: 'vtt',
                    escape: false,
                    style: {
                        color: '#ffffff',
                        fontSize: '20px'
                    },
                    encoding: 'utf-8',
                    onVttLoad: (vtt) => (vtt || '').replace(/\\{[^}]+\\}/g, '').replace(/<\\/?(c[.\\w-]*|v[^>]*|lang[^>]*|ruby|rt)>/gi, '')
                } : undefined,
                highlight: highlights,
                settings: settings,
                controls: [
                    {
                        name: 'cast-btn',
                        position: 'right',
                        index: 1,
                        html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16.1A5 5 0 0 1 5.9 20"/><path d="M2 12.05A9 9 0 0 1 9.95 20"/><path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/><line x1="2" y1="20" x2="2.01" y2="20"/></svg>',
                        tooltip: 'Cast',
                        click: function() {
                            if (navigator.remotePlayback && STATE.art && STATE.art.video) {
                                STATE.art.video.remote.prompt().catch(() => {
                                    showToast('Cast ready for compatible display', 'info', 2000);
                                });
                            } else {
                                showToast('Cast ready for compatible display', 'info', 2000);
                            }
                        }
                    },
                    {
                        name: 'sub-btn',
                        position: 'right',
                        index: 2,
                        html: defaultSub ? SUB_ICON_ON : SUB_ICON_OFF,
                        tooltip: 'Subtitles',
                        click: function() {
                            if (STATE.art && STATE.art.subtitle) {
                                STATE.art.subtitle.show = !STATE.art.subtitle.show;
                                updateSubtitleIcon(STATE.art.subtitle.show);
                                showToast(STATE.art.subtitle.show ? 'Subtitles ON' : 'Subtitles OFF', 'info', 1500);
                            } else {
                                showToast('No subtitles available', 'info', 1500);
                            }
                        }
                    }
                ]
            });

            // Replace built-in chunky SVGs with ultra-clean line icons
            function applyCleanCinemaIcons() {
                // Remove / hide play button permanently from bottom row
                const playBtns = document.querySelectorAll('.art-control-playAndPause, .art-control-play');
                playBtns.forEach(el => el.style.setProperty('display', 'none', 'important'));

                updateSubtitleIcon(Boolean(STATE.art && STATE.art.subtitle && STATE.art.subtitle.show));

                const settingBtn = document.querySelector('.art-control-setting');
                if (settingBtn && !settingBtn.dataset.customized) {
                    settingBtn.dataset.customized = 'true';
                    settingBtn.innerHTML = \`
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        <span class="hd-badge">HD</span>
                    \`;
                }

                const pipBtn = document.querySelector('.art-control-pip');
                if (pipBtn && !pipBtn.dataset.customized) {
                    pipBtn.dataset.customized = 'true';
                    pipBtn.innerHTML = \`
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="2" y="4" width="16" height="12" rx="2"/>
                            <rect x="10" y="10" width="12" height="10" rx="2" fill="#09090b" stroke="currentColor"/>
                        </svg>
                    \`;
                }

                const fullBtn = document.querySelector('.art-control-fullscreen');
                if (fullBtn && !fullBtn.dataset.customized) {
                    fullBtn.dataset.customized = 'true';
                    fullBtn.innerHTML = \`
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/>
                        </svg>
                    \`;
                }

                const video = (STATE.art && STATE.art.video) || document.querySelector('#artplayer video');
                updateVolumeUI(Boolean((STATE.art && STATE.art.muted) || (video && video.muted)));
            }

            function updateVolumeUI(isMuted) {
                const volBtn = document.querySelector('.art-control-volume');
                if (volBtn) {
                    volBtn.classList.toggle('is-muted', Boolean(isMuted));
                    volBtn.setAttribute('title', isMuted ? 'Unmute' : 'Mute');
                }
            }

            function toggleMute() {
                const video = (STATE.art && STATE.art.video) || document.querySelector('#artplayer video');
                const volBtn = document.querySelector('.art-control-volume');
                const currentlyMuted = volBtn ? volBtn.classList.contains('is-muted') : Boolean((STATE.art && STATE.art.muted) || (video && video.muted));
                const nextMuted = !currentlyMuted;

                if (STATE.art) {
                    STATE.art.muted = nextMuted;
                    if (!nextMuted && STATE.art.volume === 0) {
                        STATE.art.volume = 0.9;
                    }
                }
                if (video) {
                    video.muted = nextMuted;
                    if (!nextMuted && video.volume === 0) {
                        video.volume = 0.9;
                    }
                }

                updateVolumeUI(nextMuted);
            }

            function syncSubmenuPanels() {
                document.querySelectorAll('.art-setting-item-back').forEach(backEl => {
                    const panel = backEl.closest('.art-setting-panel');
                    if (panel && !panel.classList.contains('art-submenu-panel')) {
                        panel.classList.add('art-submenu-panel');
                    }
                });
            }

            STATE.art.on('ready', () => {
                applyCleanCinemaIcons();
                syncSubmenuPanels();
                const video = (STATE.art && STATE.art.video) || document.querySelector('#artplayer video');
                updateVolumeUI(Boolean((STATE.art && STATE.art.muted) || (video && video.muted)));
                if (video && !video.dataset.volListened) {
                    video.dataset.volListened = 'true';
                    video.addEventListener('volumechange', () => {
                        updateVolumeUI(Boolean(video.muted || video.volume === 0));
                    });
                }
                postToParent('aniembed:ready');
            });

            STATE.art.on('video:volumechange', () => {
                const video = (STATE.art && STATE.art.video) || document.querySelector('#artplayer video');
                const isMuted = Boolean((STATE.art && STATE.art.muted) || (video && video.muted) || (STATE.art && STATE.art.volume === 0));
                updateVolumeUI(isMuted);
            });

            STATE.art.on('setting', () => {
                syncSubmenuPanels();
            });

            document.addEventListener('click', (e) => {
                const vol = e.target && e.target.closest && e.target.closest('.art-control-volume');
                if (vol) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMute();
                    return;
                }
                if (e.target && e.target.closest && e.target.closest('.art-settings, .art-control-setting')) {
                    setTimeout(syncSubmenuPanels, 20);
                }
            });

            STATE.art.on('subtitle:show', (show) => {
                updateSubtitleIcon(show);
            });

            setTimeout(() => { applyCleanCinemaIcons(); syncSubmenuPanels(); }, 100);
            setTimeout(() => { applyCleanCinemaIcons(); syncSubmenuPanels(); }, 400);

            STATE.art.on('play', () => {
                postToParent('aniembed:play', { currentTime: STATE.art.currentTime });
            });

            STATE.art.on('pause', () => {
                postToParent('aniembed:pause', { currentTime: STATE.art.currentTime });
            });

            STATE.art.on('video:timeupdate', () => {
                const cur = STATE.art.currentTime;
                postToParent('aniembed:timeupdate', { currentTime: cur, duration: STATE.art.duration });

                const intro = STATE.streamData?.intro;
                const outro = STATE.streamData?.outro;

                // Intro check
                const btnIntro = document.getElementById('btn-skip-intro');
                if (intro && intro.end > 0 && cur >= (intro.start || 0) && cur < (intro.end - 1)) {
                    if (STATE.autoSkip && cur >= (intro.start || 0) && cur <= (intro.start + 2)) {
                        STATE.art.currentTime = intro.end;
                        showToast('Auto-Skipped Intro', 'info', 2000);
                        btnIntro.style.display = 'none';
                    } else {
                        btnIntro.style.display = 'inline-flex';
                    }
                } else {
                    btnIntro.style.display = 'none';
                }

                // Outro check
                const btnOutro = document.getElementById('btn-skip-outro');
                if (outro && outro.end > 0 && cur >= (outro.start || 0) && cur < (outro.end - 1)) {
                    if (STATE.autoSkip && cur >= (outro.start || 0) && cur <= (outro.start + 2)) {
                        STATE.art.currentTime = outro.end;
                        showToast('Auto-Skipped Outro', 'info', 2000);
                        btnOutro.style.display = 'none';
                    } else {
                        btnOutro.style.display = 'inline-flex';
                    }
                } else {
                    btnOutro.style.display = 'none';
                }
            });

            // Autonext episode on video end
            STATE.art.on('video:ended', () => {
                postToParent('aniembed:ended', { episode: STATE.currentEp });
                if (STATE.autoNext) {
                    const nextEp = STATE.currentEp + 1;
                    if (!STATE.totalEpisodes || nextEp <= STATE.totalEpisodes) {
                        showToast(\`Playing Episode \${nextEp} in 3s...\`, 'info', 3000);
                        setTimeout(() => changeEpisode(nextEp), 3000);
                    }
                }
            });
        }

        function skipTimestamp(type) {
            if (!STATE.art || !STATE.streamData) return;
            if (type === 'intro' && STATE.streamData.intro?.end) {
                STATE.art.currentTime = STATE.streamData.intro.end;
                showToast('Skipped Intro', 'info', 2000);
            } else if (type === 'outro' && STATE.streamData.outro?.end) {
                STATE.art.currentTime = STATE.streamData.outro.end;
                showToast('Skipped Outro', 'info', 2000);
            }
        }

        function onUserSelectServer(serverVal) {
            STATE.server = parseInt(serverVal, 10);
            STATE.failoverAttempt = 0;
            initStream();
        }

        function changeEpisode(epNum) {
            if (epNum === STATE.currentEp) return;
            STATE.currentEp = epNum;
            document.title = \`\${STATE.title ? STATE.title + ' - ' : ''}Episode \${epNum}\`;
            initStream();
            postToParent('aniembed:episode_change', { episode: epNum });
        }

        // Initial launch
        document.addEventListener('DOMContentLoaded', () => {
            initStream();
        });
    </script>
</body>
</html>`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeJs(str) {
    if (!str) return '';
    return String(str).replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'").replace(/"/g, '\\\\"').replace(/\\n/g, '\\\\n');
}
