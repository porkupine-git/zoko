/**
 * Cinema Dark Player Design System Styles
 * Edge-to-edge minimalist cinema styling matching Netflix / Apple TV standard
 * Custom Player (.cp-*) — zero third-party dependency
 */

export const PLAYER_CSS = `
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
            --sub-font-size: 19px;
            --sub-font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            --sub-color: #ffffff;
            --sub-font-weight: 600;
            --sub-font-style: normal;
            --sub-text-shadow: 0 1px 3px rgba(0, 0, 0, 0.95), 0 0 2px #000;
            --sub-bg: rgba(0, 0, 0, 0.6);
            --sub-radius: 4px;
            --sub-padding: 3px 10px;
            --sub-bottom: 30px;
            --sub-bottom-controls: 74px;
            --sub-align: center;
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

        /* ── Video Element ── */
        .cp-video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            background: #000000;
            outline: none;
            z-index: 1;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        }

        .cp-video::cue {
            font-family: 'Inter', sans-serif;
            font-size: 20px;
            font-weight: 600;
            color: #ffffff;
            background: transparent;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9), 0 0 2px #000;
        }

        /* ── Center State Play Button ── */
        .cp-center-play {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 80;
            pointer-events: auto;
            cursor: pointer;
            background: rgba(18, 18, 22, 0.7);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 50%;
            width: 64px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
            transition: transform 0.15s ease, background 0.15s ease, opacity 0.2s ease;
            opacity: 1;
        }

        .cp-center-play:hover {
            transform: translate(-50%, -50%) scale(1.1);
            background: rgba(255, 255, 255, 0.2);
        }

        .cp-center-play:active {
            transform: translate(-50%, -50%) scale(0.95);
        }

        .cp-center-play svg {
            width: 24px;
            height: 24px;
            fill: #ffffff;
            margin-left: 3px;
        }

        .cp-center-play.cp-playing {
            opacity: 0;
            pointer-events: none;
        }

        /* ── Loading Spinner ── */
        .cp-loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 85;
            width: 44px;
            height: 44px;
            border: 2.5px solid rgba(255, 255, 255, 0.2);
            border-top-color: #ffffff;
            border-radius: 50%;
            animation: cp-spin 0.8s linear infinite;
            display: none;
            pointer-events: none;
        }

        .cp-loading.cp-show {
            display: block;
        }

        @keyframes cp-spin {
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* ── Bottom Overlay (Vignette + Controls) ── */
        .cp-bottom {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 50;
            background-image: linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%);
            padding: 0 16px 10px 16px;
            pointer-events: none;
            transition: opacity 0.25s ease, visibility 0.25s ease;
            opacity: 1;
            visibility: visible;
        }

        .cp-bottom .cp-progress,
        .cp-bottom .cp-controls {
            pointer-events: auto;
        }

        /* Controls Show / Hide */
        #player-root:not(.cp-controls-visible):not(.cp-settings-open) .cp-bottom,
        #player-root:not(.cp-controls-visible):not(.cp-settings-open) .cp-mobile-top-bar {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition: opacity 0.25s ease, visibility 0.25s ease;
        }

        #player-root.cp-controls-visible .cp-bottom,
        #player-root.cp-settings-open .cp-bottom {
            opacity: 1;
            visibility: visible;
            pointer-events: none;
            transition: opacity 0.25s ease, visibility 0.25s ease;
        }

        #player-root.cp-controls-visible .cp-mobile-top-bar,
        #player-root.cp-settings-open .cp-mobile-top-bar {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transition: opacity 0.25s ease, visibility 0.25s ease;
        }

        /* When controls are hidden, hide mouse cursor */
        #player-root:not(.cp-controls-visible):not(.cp-settings-open),
        #player-root:not(.cp-controls-visible):not(.cp-settings-open) .cp-video {
            cursor: none;
        }

        /* ── Progress Bar ── */
        .cp-progress {
            position: relative;
            width: 100%;
            height: 18px;
            padding: 8px 0 10px 0;
            cursor: pointer;
            display: flex;
            align-items: center;
        }

        .cp-progress-bar {
            position: relative;
            width: 100%;
            height: 2.5px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            overflow: visible;
            transition: height 0.15s ease;
        }

        .cp-progress:hover .cp-progress-bar {
            height: 4px;
        }

        .cp-progress-buffered {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.35);
            border-radius: 2px;
            pointer-events: none;
            z-index: 1;
        }

        /* ── Intro / Outro Timeline Highlight Segments (Yellow) ── */
        .cp-progress-segment {
            position: absolute;
            top: 0;
            height: 100%;
            background-color: #f59e0b;
            background: linear-gradient(90deg, #eab308, #facc15);
            border-radius: 2px;
            pointer-events: none;
            z-index: 2;
            opacity: 0.95;
            box-shadow: 0 0 6px rgba(234, 179, 8, 0.5);
            transition: opacity 0.15s ease, height 0.15s ease;
        }

        .cp-progress:hover .cp-progress-segment {
            opacity: 1;
            box-shadow: 0 0 9px rgba(250, 204, 21, 0.8);
        }

        .cp-progress-segment.cp-segment-intro {
            background: linear-gradient(90deg, #eab308, #facc15);
        }

        .cp-progress-segment.cp-segment-outro {
            background: linear-gradient(90deg, #eab308, #facc15);
        }

        .cp-progress-played {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: #ffffff;
            border-radius: 2px;
            box-shadow: none;
            pointer-events: none;
            z-index: 3;
        }

        .cp-progress-indicator {
            position: absolute;
            top: 50%;
            right: -6px;
            width: 12px;
            height: 12px;
            background: #ffffff;
            border-radius: 50%;
            box-shadow: 0 1px 5px rgba(0, 0, 0, 0.8);
            transform: translateY(-50%);
            transition: transform 0.15s ease;
            pointer-events: none;
        }

        .cp-progress:hover .cp-progress-indicator {
            transform: translateY(-50%) scale(1.25);
        }

        .cp-progress-tip {
            position: absolute;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(18, 18, 22, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #ffffff;
            border-radius: 6px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 600;
            padding: 3px 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
            pointer-events: none;
            display: none;
            white-space: nowrap;
            z-index: 55;
        }

        .cp-progress:hover .cp-progress-tip {
            display: block;
        }

        /* Progress highlight markers */
        .cp-progress-highlight {
            position: absolute;
            top: 0;
            width: 3px;
            height: 100%;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 1px;
            pointer-events: none;
            z-index: 2;
        }

        /* ── Controls Bar ── */
        .cp-controls {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 44px;
            padding: 0;
        }

        /* Left Controls: Volume Button + Time Capsule Pill */
        .cp-controls-left {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            height: 36px;
        }

        /* ── Circular Play/Pause & Volume Buttons ── */
        .cp-btn-play-pause,
        .cp-btn-volume {
            width: 36px;
            height: 36px;
            min-width: 36px;
            max-width: 36px;
            min-height: 36px;
            max-height: 36px;
            flex: 0 0 36px;
            aspect-ratio: 1 / 1;
            padding: 0;
            margin: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.14);
            background: rgba(18, 18, 22, 0.72);
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            color: rgba(255, 255, 255, 0.9);
            cursor: pointer;
            outline: none;
            position: relative;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
            transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease, color 0.15s ease;
        }

        .cp-btn-play-pause:hover,
        .cp-btn-volume:hover {
            background: rgba(255, 255, 255, 0.18);
            border-color: rgba(255, 255, 255, 0.35);
            color: #ffffff;
            transform: scale(1.04);
        }

        .cp-btn-play-pause:active,
        .cp-btn-volume:active {
            transform: scale(0.95);
        }

        .cp-btn-play-pause svg,
        .cp-btn-volume svg {
            width: 17px;
            height: 17px;
            display: block;
            pointer-events: none;
        }

        .cp-btn-play-pause .cp-icon-play { display: inline-flex; }
        .cp-btn-play-pause .cp-icon-pause { display: none; }
        .cp-btn-play-pause.is-playing .cp-icon-play { display: none; }
        .cp-btn-play-pause.is-playing .cp-icon-pause { display: inline-flex; }

        .cp-btn-volume svg {
            fill: none;
            stroke: currentColor;
            stroke-width: 1.8px;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        .cp-btn-volume.is-muted {
            color: rgba(255, 255, 255, 0.45);
            border-color: rgba(255, 255, 255, 0.08);
        }

        .cp-btn-volume .cp-icon-volume-on { display: inline-flex; }
        .cp-btn-volume .cp-icon-volume-off { display: none; }
        .cp-btn-volume.is-muted .cp-icon-volume-on { display: none; }
        .cp-btn-volume.is-muted .cp-icon-volume-off { display: inline-flex; }

        /* ── Time Capsule Pill ── */
        .cp-time {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 36px;
            min-height: 36px;
            max-height: 36px;
            padding: 0 14px;
            margin: 0;
            border-radius: 9999px;
            border: 1px solid rgba(255, 255, 255, 0.14);
            background: rgba(18, 18, 22, 0.72);
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            color: rgba(255, 255, 255, 0.95);
            font-family: 'JetBrains Mono', -apple-system, monospace;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.02em;
            line-height: 36px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
            white-space: nowrap;
            pointer-events: auto;
        }

        .cp-time-current {
            color: #ffffff;
            font-weight: 700;
        }

        .cp-time-split {
            color: rgba(255, 255, 255, 0.35);
            margin: 0 5px;
        }

        .cp-time-duration {
            color: rgba(255, 255, 255, 0.6);
            font-weight: 500;
        }

        /* ── Right Controls: Unified Capsule Pill ── */
        .cp-controls-right {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            height: 36px;
            padding: 0 4px;
            border-radius: 9999px;
            border: 1px solid rgba(255, 255, 255, 0.14);
            background: rgba(18, 18, 22, 0.72);
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
        }

        .cp-controls-right .cp-ctrl-btn {
            width: 32px;
            height: 32px;
            min-width: 32px;
            max-width: 32px;
            min-height: 32px;
            max-height: 32px;
            flex: 0 0 32px;
            aspect-ratio: 1 / 1;
            padding: 0;
            margin: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            border-radius: 50%;
            border: none;
            outline: none;
            color: rgba(255, 255, 255, 0.85);
            background: transparent;
            cursor: pointer;
            position: relative;
            transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
        }

        .cp-controls-right .cp-ctrl-btn:hover,
        .cp-controls-right .cp-ctrl-btn.cp-active {
            background: rgba(255, 255, 255, 0.2);
            color: #ffffff;
            transform: scale(1.06);
        }

        .cp-controls-right .cp-ctrl-btn:active {
            transform: scale(0.92);
        }

        .cp-controls-right .cp-ctrl-btn svg {
            width: 17px;
            height: 17px;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.8px;
            stroke-linecap: round;
            stroke-linejoin: round;
            display: block;
            pointer-events: none;
        }


        /* ── Glassmorphic Settings Popover ── */
        .cp-settings {
            display: none;
            position: absolute;
            bottom: 58px;
            right: 14px;
            left: auto;
            top: auto;
            background: rgba(14, 16, 23, 0.78);
            backdrop-filter: blur(36px) saturate(210%) brightness(105%);
            -webkit-backdrop-filter: blur(36px) saturate(210%) brightness(105%);
            border: 1px solid rgba(255, 255, 255, 0.13);
            box-shadow: 
                0 24px 60px -12px rgba(0, 0, 0, 0.8),
                0 10px 24px -6px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.22),
                inset 0 0 0 1px rgba(255, 255, 255, 0.04);
            border-radius: 18px;
            padding: 7px;
            width: 292px;
            min-width: 292px;
            max-width: 292px;
            max-height: min(340px, calc(100% - 68px));
            box-sizing: border-box;
            overflow: hidden;
            text-shadow: none;
            animation: cpSettingsIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
            transform-origin: bottom right;
            z-index: 110;
            flex-direction: column;
        }

        #player-root.cp-settings-open .cp-settings {
            display: flex;
        }

        @keyframes cpSettingsIn {
            from {
                opacity: 0;
                transform: translateY(8px) scale(0.96);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        /* Settings Panel */
        .cp-settings-panel {
            display: none;
            flex-direction: column;
            width: 100%;
            height: 100%;
            max-height: 100%;
            overflow: hidden;
            box-sizing: border-box;
        }

        .cp-settings-panel.cp-panel-active {
            display: flex;
        }

        /* ── Submenu Header (Fixed outside scroll body) ── */
        .cp-submenu-header {
            display: flex;
            align-items: center;
            gap: 9px;
            height: 34px;
            min-height: 34px;
            padding: 0 4px 6px 4px;
            margin-bottom: 3px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            cursor: pointer;
            flex-shrink: 0;
            user-select: none;
            -webkit-user-select: none;
        }

        .cp-back-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            border-radius: 7px;
            background: rgba(255, 255, 255, 0.07);
            border: 1px solid rgba(255, 255, 255, 0.09);
            color: rgba(255, 255, 255, 0.85);
            transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;
        }

        .cp-submenu-header:hover .cp-back-btn {
            transform: translateX(-2px);
            background: rgba(255, 255, 255, 0.14);
            color: #ffffff;
        }

        .cp-submenu-title {
            font-size: 13px;
            font-weight: 600;
            color: #f1f5f9;
            letter-spacing: -0.01em;
        }

        /* ── Scrollable Body (Only list items scroll) ── */
        .cp-submenu-body {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding-right: 1px;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }

        .cp-submenu-body::-webkit-scrollbar {
            width: 3px;
        }

        .cp-submenu-body::-webkit-scrollbar-track {
            background: transparent;
        }

        .cp-submenu-body::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
        }

        .cp-submenu-body::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.35);
        }

        /* Settings Item */
        .cp-settings-item {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            height: 42px;
            min-height: 42px;
            padding: 0 10px;
            box-sizing: border-box;
            border-radius: 11px;
            color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            font-weight: 500;
            letter-spacing: -0.01em;
            cursor: pointer;
            background: transparent;
            border: 1px solid transparent;
            outline: none;
            text-shadow: none;
            transition: background 0.14s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.14s ease, color 0.14s ease, transform 0.1s ease;
        }

        .cp-settings-item:hover {
            background: rgba(255, 255, 255, 0.075);
            border-color: rgba(255, 255, 255, 0.08);
            color: #ffffff;
        }

        .cp-settings-item:active {
            background: rgba(255, 255, 255, 0.12);
            transform: scale(0.985);
        }

        .cp-settings-item-left {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            flex: 1;
            min-width: 0;
            overflow: hidden;
        }

        .cp-settings-item-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            min-width: 28px;
            flex-shrink: 0;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.75);
            transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .cp-settings-item:hover .cp-settings-item-icon {
            background: rgba(255, 255, 255, 0.11);
            border-color: rgba(255, 255, 255, 0.16);
            color: #ffffff;
            transform: scale(1.05);
        }

        .cp-settings-item-icon svg {
            width: 15px;
            height: 15px;
            display: block;
        }

        .cp-settings-item-text {
            color: inherit;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
        }

        .cp-settings-item-right {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            flex-shrink: 0;
        }

        .cp-settings-item-tooltip {
            font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
            font-size: 11.5px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.65);
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.09);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
            padding: 3px 8px;
            border-radius: 6px;
            letter-spacing: 0.01em;
            display: inline-block;
            max-width: 115px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            transition: background 0.14s ease, border-color 0.14s ease, color 0.14s ease;
        }

        .cp-settings-item-tooltip:empty {
            display: none;
        }

        .cp-settings-item:hover .cp-settings-item-tooltip {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.16);
            color: #ffffff;
        }

        .cp-settings-item-arrow {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            color: rgba(255, 255, 255, 0.35);
            transition: color 0.14s ease, transform 0.14s ease;
        }

        .cp-settings-item:hover .cp-settings-item-arrow {
            color: rgba(255, 255, 255, 0.9);
            transform: translateX(2px);
        }

        .cp-settings-item-arrow svg {
            width: 14px;
            height: 14px;
            display: block;
        }

        /* ── Bespoke Tactile Glass Switch Toggle ── */
        .cp-switch {
            display: inline-flex;
            align-items: center;
            cursor: pointer;
            user-select: none;
            -webkit-user-select: none;
            padding: 2px 0;
        }

        .cp-switch-track {
            position: relative;
            display: block;
            width: 38px;
            height: 22px;
            border-radius: 9999px;
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.16);
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.35);
            transition: background 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.22s ease, box-shadow 0.22s ease;
        }

        .cp-switch-thumb {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.7);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
            transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease, box-shadow 0.2s ease;
        }

        .cp-switch.cp-switch-on .cp-switch-track {
            background: #2563eb;
            border-color: #2563eb;
            box-shadow: none;
        }

        .cp-switch.cp-switch-on .cp-switch-thumb {
            transform: translateX(16px);
            background: #ffffff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
        }

        .cp-settings-item:hover .cp-switch:not(.cp-switch-on) .cp-switch-track {
            background: rgba(255, 255, 255, 0.18);
            border-color: rgba(255, 255, 255, 0.24);
        }

        .cp-settings-item:hover .cp-switch:not(.cp-switch-on) .cp-switch-thumb {
            background: rgba(255, 255, 255, 0.9);
        }

        /* ── Submenu items ── */
        .cp-submenu .cp-settings-item {
            height: 34px;
            min-height: 34px;
            font-size: 12.5px;
            padding: 0 10px 0 32px;
            position: relative;
            border-radius: 8px;
            border: 1px solid transparent;
            flex-shrink: 0;
        }

        /* Selected / current item in submenu */
        .cp-settings-item.cp-selected {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.16);
            font-weight: 600;
        }

        .cp-settings-item.cp-selected:hover {
            background: rgba(255, 255, 255, 0.16);
            border-color: rgba(255, 255, 255, 0.22);
        }

        .cp-settings-item .cp-check-icon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            display: none;
            color: #ffffff;
            filter: none;
        }

        .cp-settings-item:not(.cp-selected) .cp-check-icon {
            display: none;
        }

        .cp-settings-item.cp-selected .cp-check-icon {
            display: inline-flex;
        }

        .cp-settings-item .cp-check-icon svg {
            width: 14px;
            height: 14px;
            stroke-width: 2.5px;
        }

        /* Auto-skip switch hide tooltip */
        .cp-settings-item[data-name="auto-skip"] .cp-settings-item-tooltip {
            display: none;
        }

        /* ── Subtitle Settings UI Components ── */
        .cp-settings-divider {
            height: 1px;
            background: rgba(255, 255, 255, 0.08);
            margin: 4px 6px;
        }

        .cp-settings-section-title {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.4);
            padding: 8px 10px 4px 10px;
            user-select: none;
            -webkit-user-select: none;
        }

        /* Sliders */
        .cp-settings-slider-item {
            display: flex;
            flex-direction: column;
            padding: 6px 10px 8px 10px;
            border-radius: 11px;
            transition: background 0.14s ease;
        }

        .cp-settings-slider-item:hover {
            background: rgba(255, 255, 255, 0.05);
        }

        .cp-settings-slider-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }

        .cp-settings-slider-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
        }

        .cp-settings-range {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 4px;
            border-radius: 99px;
            background: rgba(255, 255, 255, 0.14);
            outline: none;
            cursor: pointer;
            transition: background 0.15s ease;
        }

        .cp-settings-range:hover {
            background: rgba(255, 255, 255, 0.22);
        }

        .cp-settings-range::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #ffffff;
            cursor: pointer;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
            transition: transform 0.1s ease;
        }

        .cp-settings-range::-webkit-slider-thumb:hover {
            transform: scale(1.2);
        }

        .cp-settings-range::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border: none;
            border-radius: 50%;
            background: #ffffff;
            cursor: pointer;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
        }

        /* Stepper for Delay / Sync */
        .cp-stepper-wrap {
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }

        .cp-step-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 22px;
            height: 22px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #ffffff;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            user-select: none;
            -webkit-user-select: none;
            transition: all 0.12s ease;
        }

        .cp-step-btn:hover {
            background: rgba(255, 255, 255, 0.18);
            transform: scale(1.06);
        }

        .cp-step-btn:active {
            transform: scale(0.95);
        }

        /* Native Color Picker Swatch */
        .cp-color-swatch-wrap {
            position: relative;
            display: inline-flex;
            align-items: center;
            cursor: pointer;
        }

        .cp-color-swatch {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.4);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            display: inline-block;
            transition: transform 0.15s ease, border-color 0.15s ease;
        }

        .cp-color-swatch:hover {
            transform: scale(1.15);
            border-color: #ffffff;
        }

        .cp-color-input {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
            padding: 0;
            border: none;
            z-index: 1;
            pointer-events: auto;
        }

        /* Live Preview Card */
        .cp-sub-preview-card {
            background: rgba(0, 0, 0, 0.45);
            border: 1px solid rgba(255, 255, 255, 0.09);
            border-radius: 12px;
            padding: 10px;
            margin: 4px 4px 8px 4px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .cp-sub-preview-badge {
            position: absolute;
            top: 4px;
            left: 8px;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.06em;
            color: rgba(255, 255, 255, 0.4);
            text-transform: uppercase;
        }

        .cp-sub-preview-viewport {
            min-height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 8px;
        }

        .cp-sub-preview-line {
            font-family: var(--sub-font-family, 'Inter', sans-serif);
            font-size: clamp(12px, calc(var(--sub-font-size, 19px) * 0.75), 18px);
            font-weight: var(--sub-font-weight, 600);
            font-style: var(--sub-font-style, normal);
            color: var(--sub-color, #ffffff);
            text-shadow: var(--sub-text-shadow, 0 1px 3px rgba(0, 0, 0, 0.95), 0 0 2px #000);
            line-height: 1.35;
            padding: var(--sub-padding, 3px 10px);
            background: var(--sub-bg, rgba(0, 0, 0, 0.6));
            border-radius: var(--sub-radius, 4px);
            display: inline-block;
        }

        /* ── Notification Toast System ── */
        .toast-msg {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-10px);
            background: rgba(18, 18, 22, 0.88);
            border: 1px solid rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            color: #f4f4f5;
            padding: 8px 16px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 100;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
            white-space: nowrap;
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

        /* ── Premium Skip Buttons (Netflix / Crunchyroll Cinema Style) ── */
        .skip-button {
            position: absolute;
            bottom: 84px;
            right: 20px;
            background: rgba(16, 16, 20, 0.88);
            border: 1px solid rgba(255, 255, 255, 0.22);
            backdrop-filter: blur(24px) saturate(190%);
            -webkit-backdrop-filter: blur(24px) saturate(190%);
            color: #ffffff;
            padding: 7px 16px;
            border-radius: 9999px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.35px;
            cursor: pointer;
            display: none;
            align-items: center;
            gap: 7px;
            z-index: 35;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.15);
            transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
            user-select: none;
            -webkit-user-select: none;
        }

        .skip-button:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.45);
            transform: translateY(-1px);
            box-shadow: 0 10px 28px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }

        .skip-button:active {
            transform: scale(0.96) translateY(0);
            background: rgba(255, 255, 255, 0.25);
        }

        .skip-button .skip-icon {
            display: block;
            transition: transform 0.15s ease;
        }

        .skip-button:hover .skip-icon {
            transform: translateX(1.5px);
        }

        /* ── Subtitle Overlay ── */
        .cp-subtitle-overlay {
            position: absolute;
            bottom: var(--sub-bottom, 30px);
            left: 50%;
            transform: translateX(-50%);
            z-index: 40;
            pointer-events: none;
            text-align: var(--sub-align, center);
            max-width: 85%;
            width: max-content;
            transition: bottom 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease;
        }

        .cp-subtitle-overlay.align-left {
            left: 6%;
            right: auto;
            transform: none;
            text-align: left;
        }

        .cp-subtitle-overlay.align-right {
            right: 6%;
            left: auto;
            transform: none;
            text-align: right;
        }

        .cp-subtitle-overlay.align-center {
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            text-align: center;
        }

        .cp-controls-visible .cp-subtitle-overlay {
            bottom: var(--sub-bottom-controls, 74px);
        }

        .cp-subtitle-overlay.cp-hidden {
            opacity: 0;
            visibility: hidden;
        }

        .cp-subtitle-line {
            font-family: var(--sub-font-family, 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
            font-size: var(--sub-font-size, 19px);
            font-weight: var(--sub-font-weight, 600);
            font-style: var(--sub-font-style, normal);
            color: var(--sub-color, #ffffff);
            text-shadow: var(--sub-text-shadow, 0 1px 3px rgba(0, 0, 0, 0.95), 0 0 2px #000);
            line-height: 1.4;
            padding: var(--sub-padding, 3px 10px);
            background: var(--sub-bg, rgba(0, 0, 0, 0.6));
            border-radius: var(--sub-radius, 4px);
            display: inline-block;
            backdrop-filter: blur(2px);
        }

        /* ── Double-Tap Seek Indicator ── */
        .cp-seek-indicator {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            z-index: 70;
            background: rgba(18, 18, 22, 0.6);
            backdrop-filter: blur(12px);
            border-radius: 50%;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 14px;
            font-weight: 700;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
        }

        .cp-seek-indicator.cp-show {
            opacity: 1;
        }

        .cp-seek-indicator.cp-left {
            left: 20%;
        }

        .cp-seek-indicator.cp-right {
            right: 20%;
        }

        /* ── Long-Press 2X Speed Indicator (Cinema Top HUD) ── */
        .cp-speed-indicator {
            position: absolute;
            top: 18px;
            left: 50%;
            transform: translateX(-50%) translateY(-6px) scale(0.95);
            z-index: 95;
            background: rgba(14, 14, 18, 0.85);
            backdrop-filter: blur(20px) saturate(190%);
            -webkit-backdrop-filter: blur(20px) saturate(190%);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 9999px;
            padding: 5px 16px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }

        .cp-speed-indicator.cp-show {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
        }

        .cp-speed-indicator .cp-speed-icon {
            display: block;
            opacity: 0.95;
            animation: cpSpeedChevrons 0.8s ease-in-out infinite alternate;
        }

        @keyframes cpSpeedChevrons {
            from { transform: translateX(-1px); opacity: 0.7; }
            to { transform: translateX(1px); opacity: 1; }
        }

        /* ── Mobile Top Bar (Subtitle & Settings Capsule) ── */
        .cp-mobile-top-bar {
            display: none !important;
            position: absolute;
            top: max(8px, env(safe-area-inset-top, 8px));
            right: max(8px, env(safe-area-inset-right, 8px));
            align-items: center;
            gap: 2px;
            height: 28px;
            padding: 0 3px;
            border-radius: 9999px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(18, 18, 22, 0.65);
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            z-index: 100;
            pointer-events: auto;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
            transition: opacity 0.25s ease, visibility 0.25s ease;
        }

        .cp-mobile-top-bar .cp-mobile-btn {
            width: 24px;
            height: 24px;
            min-width: 24px;
            max-width: 24px;
            min-height: 24px;
            max-height: 24px;
            flex: 0 0 24px;
            aspect-ratio: 1 / 1;
            padding: 0;
            margin: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            border-radius: 50%;
            border: none;
            outline: none;
            color: rgba(255, 255, 255, 0.85);
            background: transparent;
            cursor: pointer;
            position: relative;
            transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
        }

        .cp-mobile-top-bar .cp-mobile-btn::before {
            content: '';
            position: absolute;
            top: -6px;
            bottom: -6px;
            left: -6px;
            right: -6px;
        }

        .cp-mobile-top-bar .cp-mobile-btn:active,
        .cp-mobile-top-bar .cp-mobile-btn.cp-active {
            background: rgba(255, 255, 255, 0.2);
            color: #ffffff;
            transform: scale(0.92);
        }

        .cp-mobile-top-bar .cp-mobile-btn svg {
            width: 13.5px;
            height: 13.5px;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.8px;
            stroke-linecap: round;
            stroke-linejoin: round;
            pointer-events: none;
        }

        /* ── Mobile Device Only: show top bar, hide bottom cast/sub/settings ── */
        #player-root.is-mobile .cp-mobile-top-bar {
            display: inline-flex !important;
        }

        /* Hide cast, subtitle & setting from bottom-right capsule on mobile devices */
        #player-root.is-mobile .cp-controls-right .cp-btn-cast,
        #player-root.is-mobile .cp-controls-right .cp-btn-sub,
        #player-root.is-mobile .cp-controls-right .cp-btn-settings {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            min-width: 0 !important;
            max-width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
        }

        /* Settings popover positioned from top-right when in mobile mode */
        #player-root.is-mobile .cp-settings {
            top: calc(max(8px, env(safe-area-inset-top, 8px)) + 34px) !important;
            bottom: auto !important;
            right: max(8px, env(safe-area-inset-right, 8px)) !important;
            left: auto !important;
            transform-origin: top right !important;
            min-width: 250px;
            max-width: calc(100vw - 16px);
            max-height: min(252px, calc(100% - 48px));
            padding: 6px;
            overflow: hidden !important;
            border-radius: 16px;
        }

        /* Skip button positioned comfortably above timeline on mobile */
        #player-root.is-mobile .skip-button {
            bottom: 58px;
            right: 14px;
            font-size: 11px;
            padding: 5px 13px;
            gap: 5px;
        }

        /* ── Mobile Viewport Responsive Overrides: <= 768px ── */
        @media (max-width: 768px) {

            .cp-bottom {
                padding: 0 8px 4px 8px;
            }

            .cp-controls {
                height: 28px;
            }

            .cp-controls-left {
                height: 24px;
                gap: 4px;
            }

            .cp-time {
                height: 24px;
                min-height: 24px;
                max-height: 24px;
                padding: 0 7px;
                font-size: 10px;
            }

            .cp-btn-play-pause,
            .cp-btn-volume {
                width: 24px;
                height: 24px;
                min-width: 24px;
                max-width: 24px;
                min-height: 24px;
                max-height: 24px;
                flex: 0 0 24px;
            }

            .cp-btn-play-pause svg,
            .cp-btn-volume svg {
                width: 13px;
                height: 13px;
            }

            .cp-controls-right {
                height: 26px;
                padding: 0 2px;
                gap: 1px;
            }

            .cp-controls-right .cp-ctrl-btn {
                width: 24px;
                height: 24px;
                min-width: 24px;
                max-width: 24px;
                min-height: 24px;
                max-height: 24px;
                flex: 0 0 24px;
            }

            .cp-controls-right .cp-ctrl-btn svg {
                width: 13px;
                height: 13px;
            }

            .cp-controls-right .cp-ctrl-btn::before,
            .cp-btn-play-pause::before,
            .cp-btn-volume::before {
                content: '';
                position: absolute;
                top: -6px;
                bottom: -6px;
                left: -4px;
                right: -4px;
            }

            /* Subtitle on mobile */
            .cp-subtitle-overlay {
                bottom: var(--sub-bottom, 18px);
                max-width: 90%;
            }

            .cp-controls-visible .cp-subtitle-overlay {
                bottom: var(--sub-bottom-controls, 58px);
            }

            .cp-subtitle-line {
                font-size: var(--sub-font-size, 13.5px);
                line-height: 1.35;
                padding: var(--sub-padding, 2px 7px);
            }

            /* Center Play on mobile */
            .cp-center-play {
                width: 44px;
                height: 44px;
                transform: translate(-50%, -50%);
            }
            .cp-center-play:hover {
                transform: translate(-50%, -50%) scale(1.08);
            }
            .cp-center-play:active {
                transform: translate(-50%, -50%) scale(0.92);
            }
            .cp-center-play svg {
                width: 18px;
                height: 18px;
            }

            /* Progress Bar on mobile */
            .cp-progress {
                padding: 4px 0 4px 0;
            }

            .cp-progress-bar {
                height: 2px;
            }

            .cp-progress-indicator {
                width: 8px;
                height: 8px;
            }


            .cp-settings-item {
                height: 38px;
                min-height: 38px;
                font-size: 12.5px;
                padding: 0 9px;
            }

            .cp-settings-item-icon {
                width: 26px;
                height: 26px;
                min-width: 26px;
            }

            .cp-settings-item-icon svg {
                width: 14px;
                height: 14px;
            }

            .skip-button {
                bottom: 58px;
                right: 14px;
                font-size: 11px;
                padding: 5px 13px;
                gap: 5px;
            }
        }

        /* ── Simple Sandbox Blocker Overlay ── */
        .cp-sandbox-overlay {
            position: absolute;
            inset: 0;
            background: #0b0c10;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .cp-sandbox-overlay.cp-hidden {
            display: none !important;
        }

        .cp-sandbox-content {
            max-width: 480px;
            background: #15161e;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            padding: 24px 28px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
        }

        .cp-sandbox-msg {
            font-size: 15px;
            color: #f1f5f9;
            line-height: 1.6;
            font-weight: 500;
        }

        /* ── Turnstile Player Center Overlay (Centered directly over video player) ── */
        .cp-turnstile-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.72);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 20000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            transition: opacity 0.35s ease, visibility 0.35s ease;
        }

        .cp-turnstile-overlay.cp-hidden {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
        }

        .cp-turnstile-card {
            background: #14151a;
            border: 1px solid rgba(255, 255, 255, 0.09);
            border-radius: 12px;
            padding: 12px 14px 14px;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.04);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            width: auto;
            max-width: 330px;
            text-align: center;
            animation: cpTurnstilePop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes cpTurnstilePop {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
        }

        .cp-turnstile-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            font-weight: 500;
            color: #94a3b8;
            letter-spacing: 0.2px;
        }

        .cp-turnstile-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #60a5fa;
            box-shadow: 0 0 8px rgba(96, 165, 250, 0.7);
            animation: cpPulse 1.8s infinite ease-in-out;
            transition: background 0.3s ease, box-shadow 0.3s ease;
        }

        .cp-turnstile-dot.success {
            background: #22c55e !important;
            box-shadow: 0 0 8px rgba(34, 197, 94, 0.8) !important;
            animation: none !important;
        }

        @keyframes cpPulse {
            0% { transform: scale(0.9); opacity: 0.6; }
            50% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.6; }
        }

        .cp-turnstile-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 65px;
            width: 300px;
            border-radius: 6px;
            overflow: hidden;
        }

        .cp-turnstile-container iframe {
            border: none !important;
            outline: none !important;
            border-radius: 6px !important;
        }

        @media (max-width: 480px), (max-height: 420px) {
            .cp-turnstile-card {
                padding: 10px 12px 12px;
                gap: 8px;
                max-width: 310px;
            }
            .cp-turnstile-header {
                font-size: 11.5px;
            }
        }
`;
