/**
 * ANIXO OPERATOR CONSOLE & ADMIN DASHBOARD
 * World-Class Developer Infrastructure Console (Cloudflare / Linear / Supabase Aesthetic)
 * Sleek left sidebar layout, universal dark custom scrollbars, zero native Windows scrollbar artifacts,
 * interactive server load split bar, live latency pings, zero AI slop, zero glow.
 */

export function renderAdminHtml(baseUrl = "") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anixo Operator Console</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230E1219'/%3E%3Cpolygon points='13,10 22,16 13,22' fill='%23FFFFFF'/%3E%3C/svg%3E">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #09090b;
            --sidebar-bg: #0d0d10;
            --surface: #111114;
            --surface-elevated: #16161a;
            --surface-hover: #1c1c22;
            --border: #232328;
            --border-hover: #323238;
            --border-focus: #52525b;
            --text-primary: #ffffff;
            --text-secondary: #a1a1aa;
            --text-muted: #71717a;
            --status-green: #22c55e;
            --status-red: #ef4444;
            --status-amber: #f59e0b;
            --status-blue: #38bdf8;
            --radius-sm: 6px;
            --radius-md: 8px;
            --radius-lg: 12px;
            --sidebar-width: 250px;
            --topbar-height: 56px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        /* ── Universal Sleek Dark Scrollbar (Eliminates all native Windows white bars) ── */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: #232328;
            border-radius: 99px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #3a3a44;
        }
        * {
            scrollbar-width: thin;
            scrollbar-color: #232328 transparent;
        }

        body {
            background-color: var(--bg);
            color: var(--text-primary);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            height: 100vh;
            overflow: hidden;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
        }

        /* ── Console Layout Shell ── */
        .console-app-shell {
            display: flex;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
        }

        /* ── Pinned Left Sidebar ── */
        .console-sidebar {
            width: var(--sidebar-width);
            height: 100vh;
            background: var(--sidebar-bg);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            flex-shrink: 0;
            z-index: 50;
        }

        .sidebar-brand-box {
            padding: 18px 20px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .brand-logo-group {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            color: #ffffff;
        }

        .brand-logo-title {
            font-size: 15px;
            font-weight: 700;
            letter-spacing: -0.3px;
        }

        .brand-tag-pill {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            font-weight: 600;
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            padding: 2px 6px;
            border-radius: 4px;
            letter-spacing: 0.04em;
        }

        .sidebar-nav {
            padding: 16px 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            flex: 1;
            overflow-y: auto;
        }

        .nav-category-header {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            font-weight: 600;
            color: var(--text-muted);
            letter-spacing: 0.08em;
            padding: 8px 10px 4px;
            text-transform: uppercase;
        }

        .nav-item-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            background: transparent;
            border: 1px solid transparent;
            border-radius: var(--radius-sm);
            padding: 8px 12px;
            color: var(--text-secondary);
            font-family: inherit;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            text-align: left;
            transition: all 0.15s ease;
        }

        .nav-item-btn:hover {
            color: #ffffff;
            background: var(--surface-hover);
        }

        .nav-item-btn.active {
            color: #ffffff;
            background: var(--surface-elevated);
            border-color: var(--border);
            font-weight: 600;
        }

        .nav-icon {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            color: var(--text-muted);
            transition: color 0.15s ease;
        }

        .nav-item-btn:hover .nav-icon,
        .nav-item-btn.active .nav-icon {
            color: #ffffff;
        }

        .sidebar-footer {
            padding: 14px 16px;
            border-top: 1px solid var(--border);
            background: rgba(0, 0, 0, 0.2);
        }

        .sidebar-node-pill {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: var(--text-secondary);
            margin-bottom: 12px;
        }

        .pulse-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--status-green);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
            animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
            70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
            100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        .btn-sidebar-logout {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-family: inherit;
            font-size: 12px;
            font-weight: 500;
            padding: 6px 12px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .btn-sidebar-logout:hover {
            color: var(--status-red);
            border-color: rgba(239, 68, 68, 0.3);
            background: rgba(239, 68, 68, 0.08);
        }

        /* ── Main Content Viewport ── */
        .console-viewport {
            flex: 1;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: var(--bg);
        }

        /* ── Sticky Top Header ── */
        .console-topbar {
            height: var(--topbar-height);
            border-bottom: 1px solid var(--border);
            background: rgba(9, 9, 11, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 28px;
            flex-shrink: 0;
            z-index: 40;
        }

        .topbar-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .topbar-title {
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
            letter-spacing: -0.2px;
        }

        .topbar-right {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .auto-refresh-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: var(--text-secondary);
        }

        .btn-topbar-action {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            color: var(--text-primary);
            font-family: inherit;
            font-size: 12px;
            font-weight: 500;
            padding: 5px 12px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s ease;
        }

        .btn-topbar-action:hover {
            border-color: var(--border-hover);
            background: var(--surface-hover);
        }

        /* ── Scrollable View Container ── */
        .console-scroll-content {
            flex: 1;
            overflow-y: auto;
            padding: 28px 32px 72px;
        }

        /* ── Tab Panes ── */
        .tab-pane {
            display: none;
            max-width: 1440px;
            width: 100%;
            margin: 0 auto;
        }

        .tab-pane.active {
            display: block;
            animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(3px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* ── High Density Metric Cards ── */
        .metrics-quad-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }

        @media (max-width: 1100px) {
            .metrics-quad-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 650px) {
            .metrics-quad-grid { grid-template-columns: 1fr; }
        }

        .metric-tile {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 18px 20px;
            transition: border-color 0.15s ease;
        }

        .metric-tile:hover {
            border-color: var(--border-hover);
        }

        .metric-tile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        .metric-tile-title {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 600;
            color: var(--text-muted);
            letter-spacing: 0.04em;
        }

        .metric-tile-icon {
            width: 15px;
            height: 15px;
            color: var(--text-muted);
        }

        .metric-tile-number {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.8px;
            line-height: 1.2;
            margin-bottom: 4px;
        }

        .metric-tile-desc {
            font-size: 12px;
            color: var(--text-secondary);
        }

        /* ── Server Distribution Progress Bar ── */
        .distribution-box {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 18px 20px;
            margin-bottom: 24px;
        }

        .dist-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }

        .dist-title {
            font-size: 13.5px;
            font-weight: 600;
            color: #ffffff;
        }

        .dist-meter-track {
            height: 8px;
            background: var(--surface-elevated);
            border-radius: 99px;
            overflow: hidden;
            display: flex;
            margin-bottom: 12px;
        }

        .dist-bar-sora { background: #38bdf8; height: 100%; transition: width 0.3s ease; }
        .dist-bar-neko { background: #22c55e; height: 100%; transition: width 0.3s ease; }
        .dist-bar-zozo { background: #f59e0b; height: 100%; transition: width 0.3s ease; }

        .dist-legend {
            display: flex;
            align-items: center;
            gap: 20px;
            font-size: 11.5px;
            font-family: 'JetBrains Mono', monospace;
            color: var(--text-secondary);
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .legend-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
        }

        /* ── Grid Layouts for Panels ── */
        .grid-two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 24px;
        }

        @media (max-width: 960px) {
            .grid-two-col { grid-template-columns: 1fr; }
        }

        .console-panel {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .panel-header-bar {
            padding: 14px 18px;
            background: var(--surface-elevated);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .panel-title-text {
            font-size: 13.5px;
            font-weight: 600;
            color: #ffffff;
            letter-spacing: -0.2px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .panel-content-body {
            padding: 18px;
            flex: 1;
        }

        /* ── Data Tables ── */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12.5px;
        }

        .data-table th {
            text-align: left;
            padding: 9px 14px;
            color: var(--text-muted);
            font-family: 'JetBrains Mono', monospace;
            font-size: 10.5px;
            font-weight: 600;
            border-bottom: 1px solid var(--border);
            background: rgba(255, 255, 255, 0.01);
        }

        .data-table td {
            padding: 11px 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            color: var(--text-primary);
        }

        .data-table tr:hover td {
            background: var(--surface-hover);
        }

        .mono-cell {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11.5px;
        }

        /* ── Buttons, Inputs, Switches ── */
        .form-group {
            margin-bottom: 16px;
        }

        .form-label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 6px;
        }

        .form-input, .form-select {
            width: 100%;
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            color: #ffffff;
            font-family: inherit;
            font-size: 13px;
            padding: 8px 12px;
            border-radius: var(--radius-sm);
            outline: none;
            transition: border-color 0.15s ease;
        }

        .form-input:focus, .form-select:focus {
            border-color: var(--border-focus);
        }

        .btn-primary {
            background: #ffffff;
            color: #09090b;
            border: none;
            font-family: inherit;
            font-size: 12.5px;
            font-weight: 600;
            padding: 8px 16px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: opacity 0.15s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .btn-primary:hover {
            opacity: 0.92;
        }

        .btn-secondary {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            color: var(--text-primary);
            font-family: inherit;
            font-size: 12px;
            font-weight: 500;
            padding: 7px 12px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.15s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .btn-secondary:hover {
            border-color: var(--border-hover);
            background: var(--surface-hover);
        }

        .btn-danger {
            background: rgba(239, 68, 68, 0.12);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
            font-size: 11.5px;
            font-weight: 600;
            padding: 4px 9px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .btn-danger:hover {
            background: #ef4444;
            color: #ffffff;
        }

        /* ── Server Nodes Deck ── */
        .servers-deck {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }

        @media (max-width: 960px) {
            .servers-deck { grid-template-columns: 1fr; }
        }

        .server-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 18px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }

        .server-card.is-primary {
            border-color: #ffffff;
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15);
        }

        .server-card.is-maintenance {
            border-color: rgba(245, 158, 11, 0.4);
            background: rgba(245, 158, 11, 0.02);
        }

        .server-card-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 12px;
        }

        .server-name {
            font-size: 14px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 2px;
        }

        .server-engine-id {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: var(--text-muted);
        }

        .server-status-tag {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10.5px;
            font-weight: 600;
            padding: 2px 7px;
            border-radius: 4px;
        }

        .tag-active { background: rgba(34, 197, 94, 0.12); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.25); }
        .tag-maintenance { background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.25); }
        .tag-disabled { background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); }

        .server-metrics-row {
            display: flex;
            gap: 14px;
            padding: 12px 0;
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            margin-bottom: 14px;
        }

        .server-metric-item {
            flex: 1;
        }

        .server-metric-k {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--text-muted);
            margin-bottom: 2px;
        }

        .server-metric-v {
            font-size: 13px;
            font-weight: 600;
            color: #ffffff;
        }

        .server-actions-row {
            display: flex;
            gap: 8px;
        }

        /* ── Modern Toggles ── */
        .toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .toggle-info h4 {
            font-size: 13px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 2px;
        }

        .toggle-info p {
            font-size: 11.5px;
            color: var(--text-muted);
        }

        .switch-input {
            position: relative;
            display: inline-block;
            width: 38px;
            height: 20px;
            flex-shrink: 0;
        }

        .switch-input input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .slider {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: var(--surface-elevated);
            border: 1px solid var(--border);
            transition: .2s;
            border-radius: 99px;
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
            background-color: #ffffff;
            border-color: #ffffff;
        }

        input:checked + .slider:before {
            transform: translateX(18px);
            background-color: #09090b;
        }

        /* ── Domain Chips ── */
        .chips-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
            min-height: 40px;
        }

        .domain-chip {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            color: var(--text-primary);
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .domain-chip-del {
            cursor: pointer;
            color: var(--text-muted);
            font-size: 13px;
            line-height: 1;
        }

        .domain-chip-del:hover {
            color: #ef4444;
        }

        /* ── Frequency Capping Mode Cards ── */
        .capping-mode-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 6px;
        }

        .capping-card {
            cursor: pointer;
            padding: 12px 14px;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            background: var(--surface-elevated);
            transition: all 0.15s ease;
            display: block;
        }

        .capping-card:hover {
            border-color: var(--border-hover);
        }

        .capping-card.active {
            border-color: #38bdf8;
            background: rgba(56, 189, 248, 0.05);
        }

        /* ── Login Gateway Screen ── */
        .login-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: #09090b;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        }

        .login-box {
            width: 100%;
            max-width: 400px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 32px 28px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .login-header {
            text-align: center;
            margin-bottom: 24px;
        }

        .login-title {
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.3px;
            margin-top: 12px;
            margin-bottom: 4px;
        }

        .login-sub {
            font-size: 12.5px;
            color: var(--text-secondary);
        }

        /* Toast notifications */
        .toast-bubble {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            color: #ffffff;
            font-size: 12.5px;
            padding: 10px 16px;
            border-radius: var(--radius-sm);
            z-index: 9999;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
            display: none;
        }
    </style>
</head>
<body>

    <!-- ── Login Gateway ── -->
    <div id="login-modal" class="login-overlay">
        <div class="login-box">
            <div class="login-header">
                <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="7" fill="#18181C"/>
                    <polygon points="12,9 23,16 12,23" fill="#FFFFFF"/>
                </svg>
                <h2 class="login-title">Anixo Operator Gateway</h2>
                <p class="login-sub">Authenticate to access live routing, firewall, and stream telemetry.</p>
            </div>
            <form onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label class="form-label" for="admin-pass">Master Passphrase</label>
                    <input type="password" id="admin-pass" class="form-input" placeholder="Enter operator password" autocomplete="current-password" required>
                </div>
                <button type="submit" id="btn-login-submit" class="btn-primary" style="width: 100%; justify-content: center;">
                    <span>Authenticate Console</span>
                </button>
                <div id="login-error" style="color: #ef4444; font-size: 12px; margin-top: 10px; display: none; text-align: center;"></div>
            </form>
        </div>
    </div>

    <!-- ── Modern Dual-Pane Dashboard Shell ── -->
    <div id="dashboard-root" class="console-app-shell" style="display: none;">
        <!-- Left Sidebar Navigation -->
        <aside class="console-sidebar">
            <div>
                <div class="sidebar-brand-box">
                    <div class="brand-logo-group">
                        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                            <rect width="32" height="32" rx="6" fill="#18181C"/>
                            <polygon points="12,9 23,16 12,23" fill="#FFFFFF"/>
                        </svg>
                        <span class="brand-logo-title">ANIXO</span>
                    </div>
                    <span class="brand-tag-pill">OPERATOR</span>
                </div>

                <nav class="sidebar-nav">
                    <div class="nav-category-header">PLATFORM SUITE</div>
                    <button type="button" class="nav-item-btn active" onclick="switchNavTab('tab-overview', this)">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        <span>Overview &amp; Stats</span>
                    </button>
                    <button type="button" class="nav-item-btn" onclick="switchNavTab('tab-servers', this)">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
                        <span>Node Routing</span>
                    </button>
                    <button type="button" class="nav-item-btn" onclick="switchNavTab('tab-firewall', this)">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        <span>Domain Firewall</span>
                    </button>
                    <button type="button" class="nav-item-btn" onclick="switchNavTab('tab-honeypot', this)">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="2"/></svg>
                        <span>Honeypot &amp; Traps</span>
                    </button>

                    <div class="nav-category-header" style="margin-top: 12px;">CLIENT CONTROLS</div>
                    <button type="button" class="nav-item-btn" onclick="switchNavTab('tab-branding', this)">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M15 9.5a3.5 3.5 0 0 0-7 0c0 4 7 2 7 6a3.5 3.5 0 0 1-7 0"/></svg>
                        <span>Monetization &amp; Ads</span>
                    </button>
                    <button type="button" class="nav-item-btn" onclick="switchNavTab('tab-keys', this)">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>
                        <span>Client API Keys</span>
                    </button>
                </nav>
            </div>

            <div class="sidebar-footer">
                <div class="sidebar-node-pill">
                    <span style="display: flex; align-items: center; gap: 6px;">
                        <span class="pulse-dot"></span>
                        <span id="sidebar-node-count">3 Nodes Active</span>
                    </span>
                    <span style="color: var(--text-muted);">Global Edge</span>
                </div>
                <button type="button" class="btn-sidebar-logout" onclick="handleLogout()">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                    <span>Log Out Console</span>
                </button>
            </div>
        </aside>

        <!-- Viewport Area -->
        <div class="console-viewport">
            <header class="console-topbar">
                <div class="topbar-left">
                    <span class="topbar-title" id="current-view-title">Overview &amp; Stream Telemetry</span>
                </div>
                <div class="topbar-right">
                    <div class="auto-refresh-toggle">
                        <span>Auto-Refresh:</span>
                        <label class="switch-input" style="width: 32px; height: 18px;">
                            <input type="checkbox" id="chk-auto-refresh" checked onchange="toggleAutoRefresh(this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                    <button type="button" class="btn-topbar-action" onclick="fetchFullState(true)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                        <span>Refresh State</span>
                    </button>
                </div>
            </header>

            <div class="console-scroll-content">
                <!-- ── TAB 1: OVERVIEW & TELEMETRY ── -->
                <section id="tab-overview" class="tab-pane active">
                    <div class="metrics-quad-grid">
                        <div class="metric-tile">
                            <div class="metric-tile-header">
                                <span class="metric-tile-title">TOTAL STREAM REQUESTS</span>
                                <svg class="metric-tile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                            </div>
                            <div class="metric-tile-number" id="stat-total-streams">0</div>
                            <div class="metric-tile-desc">HLS video mounts across all embeds</div>
                        </div>

                        <div class="metric-tile">
                            <div class="metric-tile-header">
                                <span class="metric-tile-title">ESTIMATED EGRESS</span>
                                <svg class="metric-tile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                            </div>
                            <div class="metric-tile-number" id="stat-bandwidth">0 MB</div>
                            <div class="metric-tile-desc">Edge cached &amp; proxy egress bandwidth</div>
                        </div>

                        <div class="metric-tile">
                            <div class="metric-tile-header">
                                <span class="metric-tile-title">BLOCKED LEECHES</span>
                                <svg class="metric-tile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/></svg>
                            </div>
                            <div class="metric-tile-number" id="stat-blocked">0</div>
                            <div class="metric-tile-desc">Unauthorized referrers intercepted</div>
                        </div>

                        <div class="metric-tile">
                            <div class="metric-tile-header">
                                <span class="metric-tile-title">TRAPPED BOT SCRAPERS</span>
                                <svg class="metric-tile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
                            </div>
                            <div class="metric-tile-number" id="stat-honeypot">0</div>
                            <div class="metric-tile-desc">Poisoned with decoy video streams</div>
                        </div>
                    </div>

                    <!-- Server Traffic Split Meter -->
                    <div class="distribution-box">
                        <div class="dist-head">
                            <span class="dist-title">Engine Stream Distribution</span>
                            <span class="mono-cell" id="dist-total-ratio" style="font-size: 11px; color: var(--text-muted);">Sora 100% · Neko 0% · Zozo 0%</span>
                        </div>
                        <div class="dist-meter-track">
                            <div class="dist-bar-sora" id="dist-bar-1" style="width: 100%;"></div>
                            <div class="dist-bar-neko" id="dist-bar-2" style="width: 0%;"></div>
                            <div class="dist-bar-zozo" id="dist-bar-3" style="width: 0%;"></div>
                        </div>
                        <div class="dist-legend">
                            <div class="legend-item">
                                <span class="legend-dot" style="background: #38bdf8;"></span>
                                <span>Server 1 (Sora Edge)</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-dot" style="background: #22c55e;"></span>
                                <span>Server 2 (Neko CDN)</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-dot" style="background: #f59e0b;"></span>
                                <span>Server 3 (Zozo Cluster)</span>
                            </div>
                        </div>
                    </div>

                    <!-- Panel 1: Embedder Intelligence & Referrers (Full Width Left to Right) -->
                    <div class="console-panel" style="margin-bottom: 24px;">
                        <div class="panel-header-bar">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span class="panel-title-text">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="color: #38bdf8;"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                                    Embedder Intelligence &amp; Referrers
                                </span>
                                <span class="mono-cell" id="stat-referrers-count" style="font-size: 11px; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border); color: var(--text-secondary);">0 Domains</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="text" id="ref-search-input" placeholder="Search domains / anime..." oninput="filterReferrersTable(this.value)" style="background: var(--bg); border: 1px solid var(--border); border-radius: 4px; color: #ffffff; padding: 4px 10px; font-size: 11.5px; width: 190px; outline: none;">
                                <button type="button" class="btn-secondary" style="font-size: 11px; padding: 4px 10px;" onclick="clearTelemetryStats()">Reset Stats</button>
                            </div>
                        </div>
                        <div class="panel-content-body" style="padding: 0; overflow-x: auto;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th style="min-width: 250px;">Embedding Domain</th>
                                        <th style="width: 120px;">Status</th>
                                        <th style="width: 95px;">Streams</th>
                                        <th style="width: 120px;">Bandwidth</th>
                                        <th style="min-width: 260px;">Top Content</th>
                                        <th style="width: 140px; text-align: right;">Action</th>
                                    </tr>
                                </thead>
                                <tbody id="table-referrers-body">
                                    <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No referrers logged yet</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Panel 2: Top Streamed Anime (Full Width Below) -->
                    <div class="console-panel">
                        <div class="panel-header-bar">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span class="panel-title-text">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="color: #f59e0b;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                                    Top Streamed Anime
                                </span>
                                <span class="mono-cell" id="stat-anime-count" style="font-size: 11px; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border); color: var(--text-secondary);">0 Titles</span>
                            </div>
                            <span style="font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">Ranked by viewer demand</span>
                        </div>
                        <div class="panel-content-body" style="padding: 0; overflow-x: auto;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th style="width: 80px; text-align: center;">Rank</th>
                                        <th style="min-width: 280px;">Title / ID</th>
                                        <th style="width: 140px;">Streams</th>
                                        <th style="min-width: 250px;">Traffic Share</th>
                                    </tr>
                                </thead>
                                <tbody id="table-anime-body">
                                    <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">No streaming requests recorded yet</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <!-- ── TAB 2: NODE ROUTING & FAILOVER ── -->
                <section id="tab-servers" class="tab-pane">
                    <div class="console-panel" style="margin-bottom: 24px;">
                        <div class="panel-header-bar">
                            <span class="panel-title-text">Multi-Node Stream Engines</span>
                            <button type="button" class="btn-primary" id="btn-cluster-ping" onclick="testClusterHealth(true)">Run Live Cluster Ping Test</button>
                        </div>
                        <div class="panel-content-body">
                            <div class="servers-deck" id="servers-deck-container">
                                <!-- Server 1 -->
                                <div class="server-card is-primary" id="card-srv-1">
                                    <div>
                                        <div class="server-card-top">
                                            <div>
                                                <div class="server-name">Server 1 (Sora)</div>
                                                <div class="server-engine-id">ENGINE: MegaPlay Edge Service</div>
                                            </div>
                                            <span class="server-status-tag tag-active" id="badge-srv-1">PRIMARY</span>
                                        </div>
                                        <div class="server-metrics-row">
                                            <div class="server-metric-item">
                                                <div class="server-metric-k">LATENCY</div>
                                                <div class="server-metric-v" id="ping-srv-1">Live checking...</div>
                                            </div>
                                            <div class="server-metric-item">
                                                <div class="server-metric-k">FAILOVER PRIORITY</div>
                                                <div class="server-metric-v" id="prio-srv-1">#1 (Active Primary)</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="server-actions-row">
                                        <button type="button" class="btn-primary" id="btn-primary-srv-1" style="flex: 1; cursor: default;" onclick="setPrimaryServer(1)">✓ Active Primary</button>
                                        <button type="button" class="btn-danger" id="btn-maint-1" onclick="toggleServerMaintenance(1)">Maintenance</button>
                                    </div>
                                </div>

                                <!-- Server 2 -->
                                <div class="server-card" id="card-srv-2">
                                    <div>
                                        <div class="server-card-top">
                                            <div>
                                                <div class="server-name">Server 2 (Neko)</div>
                                                <div class="server-engine-id">ENGINE: AniNeko Multi-Source CDN</div>
                                            </div>
                                            <span class="server-status-tag tag-active" id="badge-srv-2">STANDBY</span>
                                        </div>
                                        <div class="server-metrics-row">
                                            <div class="server-metric-item">
                                                <div class="server-metric-k">LATENCY</div>
                                                <div class="server-metric-v" id="ping-srv-2">Live checking...</div>
                                            </div>
                                            <div class="server-metric-item">
                                                <div class="server-metric-k">FAILOVER PRIORITY</div>
                                                <div class="server-metric-v" id="prio-srv-2">Fallback</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="server-actions-row">
                                        <button type="button" class="btn-secondary" id="btn-primary-srv-2" style="flex: 1;" onclick="setPrimaryServer(2)">Set as Primary</button>
                                        <button type="button" class="btn-danger" id="btn-maint-2" onclick="toggleServerMaintenance(2)">Maintenance</button>
                                    </div>
                                </div>

                                <!-- Server 3 -->
                                <div class="server-card" id="card-srv-3">
                                    <div>
                                        <div class="server-card-top">
                                            <div>
                                                <div class="server-name">Server 3 (Zozo)</div>
                                                <div class="server-engine-id">ENGINE: Zoko Direct Streaming Node</div>
                                            </div>
                                            <span class="server-status-tag tag-active" id="badge-srv-3">STANDBY</span>
                                        </div>
                                        <div class="server-metrics-row">
                                            <div class="server-metric-item">
                                                <div class="server-metric-k">LATENCY</div>
                                                <div class="server-metric-v" id="ping-srv-3">Live checking...</div>
                                            </div>
                                            <div class="server-metric-item">
                                                <div class="server-metric-k">FAILOVER PRIORITY</div>
                                                <div class="server-metric-v" id="prio-srv-3">Fallback</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="server-actions-row">
                                        <button type="button" class="btn-secondary" id="btn-primary-srv-3" style="flex: 1;" onclick="setPrimaryServer(3)">Set as Primary</button>
                                        <button type="button" class="btn-danger" id="btn-maint-3" onclick="toggleServerMaintenance(3)">Maintenance</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ── TAB 3: DOMAIN FIREWALL & ANTI-LEECH ── -->
                <section id="tab-firewall" class="tab-pane">
                    <div class="grid-two-col">
                        <div class="console-panel">
                            <div class="panel-header-bar">
                                <span class="panel-title-text">Firewall Mode &amp; Leech Rules</span>
                            </div>
                            <div class="panel-content-body">
                                <div class="toggle-row">
                                    <div class="toggle-info">
                                        <h4>Enforce Strict Whitelist Mode</h4>
                                        <p>When enabled, ONLY domains explicitly added to Whitelist can embed your player.</p>
                                    </div>
                                    <label class="switch-input">
                                        <input type="checkbox" id="chk-whitelist-mode" onchange="updateFirewallMode(this.checked)">
                                        <span class="slider"></span>
                                    </label>
                                </div>

                                <div class="toggle-row">
                                    <div class="toggle-info">
                                        <h4>Cloudflare Turnstile Bot Gate</h4>
                                        <p>Enforces dark Turnstile security verification directly over player canvas.</p>
                                    </div>
                                    <label class="switch-input">
                                        <input type="checkbox" id="chk-turnstile-enabled" onchange="updateTurnstileMode(this.checked)">
                                        <span class="slider"></span>
                                    </label>
                                </div>

                                <div class="toggle-row">
                                    <div class="toggle-info">
                                        <h4>Raw M3U8 Hotlink Shield</h4>
                                        <p>Block direct browser visits to stream tokens outside legitimate iframes.</p>
                                    </div>
                                    <label class="switch-input">
                                        <input type="checkbox" id="chk-hotlink-shield" onchange="updateHotlinkShield(this.checked)">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="console-panel">
                            <div class="panel-header-bar">
                                <span class="panel-title-text">Quick Add to Firewall</span>
                            </div>
                            <div class="panel-content-body">
                                <div class="form-group">
                                    <label class="form-label">Domain Name (e.g. anime-site.com)</label>
                                    <input type="text" id="input-firewall-domain" class="form-input" placeholder="domain.com">
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <button type="button" class="btn-secondary" onclick="addDomainRule('whitelist')">Add to Whitelist</button>
                                    <button type="button" class="btn-danger" style="padding: 8px 14px;" onclick="addDomainRule('blacklist')">Add to Blacklist (Ban)</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="grid-two-col">
                        <div class="console-panel">
                            <div class="panel-header-bar">
                                <span class="panel-title-text">Allowed Domains (Whitelist)</span>
                                <span class="mono-cell" id="count-whitelist" style="font-size: 11px; color: var(--text-muted);">0</span>
                            </div>
                            <div class="panel-content-body">
                                <div class="chips-container" id="chips-whitelist"></div>
                            </div>
                        </div>

                        <div class="console-panel">
                            <div class="panel-header-bar">
                                <span class="panel-title-text">Banned Domains (Blacklist)</span>
                                <span class="mono-cell" id="count-blacklist" style="font-size: 11px; color: var(--text-muted);">0</span>
                            </div>
                            <div class="panel-content-body">
                                <div class="chips-container" id="chips-blacklist"></div>
                            </div>
                        </div>
                    </div>

                    <div class="grid-two-col" style="margin-top: 24px;">
                        <div class="console-panel">
                            <div class="panel-header-bar">
                                <span class="panel-title-text">Blocked IP Addresses (Banned Scrapers)</span>
                                <span class="mono-cell" id="count-blocked-ips" style="font-size: 11px; color: var(--text-muted);">0</span>
                            </div>
                            <div class="panel-content-body">
                                <div class="chips-container" id="chips-blocked-ips"></div>
                            </div>
                        </div>

                        <div class="console-panel">
                            <div class="panel-header-bar">
                                <span class="panel-title-text">Manual IP Ban / Firewall Block</span>
                            </div>
                            <div class="panel-content-body">
                                <div class="form-group">
                                    <label class="form-label">Client IP Address</label>
                                    <input type="text" id="input-firewall-ip" class="form-input" placeholder="e.g. 198.51.100.23">
                                </div>
                                <button type="button" class="btn-danger" onclick="manualBlockIp()">Ban IP Address</button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ── TAB 4: HONEYPOT & BOT TRAPS ── -->
                <section id="tab-honeypot" class="tab-pane">
                    <div class="console-panel" style="margin-bottom: 24px;">
                        <div class="panel-header-bar">
                            <span class="panel-title-text">Decoy Stream Poisoning Settings</span>
                        </div>
                        <div class="panel-content-body">
                            <div class="form-group">
                                <label class="form-label">Decoy Video Stream URL (Served to Scrapers &amp; Bots)</label>
                                <input type="text" id="input-decoy-url" class="form-input" value="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8">
                            </div>
                            <button type="button" class="btn-primary" onclick="saveDecoyUrl()">Update Decoy Stream</button>
                        </div>
                    </div>

                    <div class="console-panel">
                        <div class="panel-header-bar">
                            <span class="panel-title-text">Recent Trapped Bot Log (Rolling 50 events)</span>
                            <button type="button" class="btn-secondary" onclick="clearSecurityLogs()">Clear Log</button>
                        </div>
                        <div class="panel-content-body" style="padding: 0;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>IP Address</th>
                                        <th>User-Agent</th>
                                        <th>Requested Route</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody id="table-honeypot-body">
                                    <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No bots intercepted recently</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <!-- ── TAB 5: MONETIZATION & ADS ── -->
                <section id="tab-branding" class="tab-pane">
                    <div class="grid-two-col">
                        <div class="console-panel">
                            <div class="panel-header-bar">
                                <span class="panel-title-text">Popunder Ad Monetization</span>
                            </div>
                            <div class="panel-content-body">
                                <div class="toggle-row" style="margin-bottom: 14px;">
                                    <div class="toggle-info">
                                        <h4>Enable Popunder Delivery</h4>
                                        <p>Triggers a popunder ad tab upon the user's initial play click.</p>
                                    </div>
                                    <label class="switch-input">
                                        <input type="checkbox" id="chk-ads-enabled" onchange="toggleAdsEnabled(this.checked)">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Popunder Ad Code or Script URL</label>
                                    <textarea id="input-popunder-url" class="form-input" rows="3" style="font-family: 'JetBrains Mono', monospace; font-size: 11.5px; resize: vertical; line-height: 1.4;" placeholder='Paste full <script src="..."></script> or //pu.genosstamnoi.com/...'></textarea>
                                    <span style="font-size: 11.5px; color: var(--text-muted); display: block; margin-top: 4px;">Accepts full HTML script tags (e.g. &lt;script src="..."&gt;) or direct script URLs.</span>
                                </div>
                                <div class="form-group">
                                    <label class="form-label" style="display: flex; align-items: center; justify-content: space-between;">
                                        <span>Frequency Capping Mode</span>
                                        <span id="capping-mode-indicator" class="brand-tag-pill" style="font-size: 10.5px; color: var(--status-green); border: 1px solid rgba(34, 197, 94, 0.3);">Natural (Network AI)</span>
                                    </label>
                                    <div class="capping-mode-grid">
                                        <div class="capping-card active" id="card-mode-natural" onclick="selectCappingMode('natural', true)">
                                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                                <input type="radio" name="cappingMode" id="radio-mode-natural" value="natural" checked style="accent-color: #38bdf8; cursor: pointer;" onchange="selectCappingMode('natural', true)">
                                                <strong style="font-size: 12.5px; color: #ffffff;">Natural (Network AI)</strong>
                                            </div>
                                            <p style="font-size: 11px; color: var(--text-muted); margin: 0; line-height: 1.45;">
                                                Let Profiton / Adsterra / PopAds manage frequency natively via their network algorithms. Recommended for maximum CPM.
                                            </p>
                                        </div>

                                        <div class="capping-card" id="card-mode-custom" onclick="selectCappingMode('custom', true)">
                                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                                <input type="radio" name="cappingMode" id="radio-mode-custom" value="custom" style="accent-color: #38bdf8; cursor: pointer;" onchange="selectCappingMode('custom', true)">
                                                <strong style="font-size: 12.5px; color: #ffffff;">Customized Rules</strong>
                                            </div>
                                            <p style="font-size: 11px; color: var(--text-muted); margin: 0; line-height: 1.45;">
                                                Granular webmaster control: customize cooldown gap (minutes/hours/seconds), daily caps, and click triggers.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div id="custom-capping-options" style="display: none; margin-bottom: 16px; padding: 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: rgba(255, 255, 255, 0.015);">
                                    <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                                        <span>Granular Frequency Engine</span>
                                    </div>

                                    <div class="form-group" style="margin-bottom: 12px;">
                                        <label class="form-label">Cooldown Gap Between Ads</label>
                                        <div style="display: flex; gap: 8px;">
                                            <input type="number" id="input-gap-value" class="form-input" value="30" min="1" placeholder="30" style="flex: 1;">
                                            <select id="select-gap-unit" class="form-select" style="width: 140px; cursor: pointer;">
                                                <option value="seconds">Seconds</option>
                                                <option value="minutes" selected>Minutes</option>
                                                <option value="hours">Hours</option>
                                            </select>
                                        </div>
                                        <span style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 4px;">Minimum wait time before another ad can pop for the same visitor (e.g. 15 Minutes or 2 Hours).</span>
                                    </div>

                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                        <div class="form-group" style="margin-bottom: 0;">
                                            <label class="form-label">Daily Limit (24h Max)</label>
                                            <input type="number" id="input-max-ads" class="form-input" value="3" min="0" placeholder="3">
                                            <span style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 4px;">Max popunders in 24h (0 = Unlimited).</span>
                                        </div>

                                        <div class="form-group" style="margin-bottom: 0;">
                                            <label class="form-label">User Click Trigger</label>
                                            <select id="select-click-trigger" class="form-select" style="cursor: pointer;">
                                                <option value="1">1st Click (Play Intent)</option>
                                                <option value="2">2nd Click (Engaged)</option>
                                                <option value="0">Every Click (Per Gap)</option>
                                            </select>
                                            <span style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 4px;">Player interaction that triggers ad.</span>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" class="btn-primary" onclick="saveMonetization()">Save Popunder Settings</button>
                            </div>
                        </div>

                        <div class="console-panel">
                            <div class="panel-header-bar">
                                <span class="panel-title-text">Embed Directives &amp; Policy</span>
                            </div>
                            <div class="panel-content-body">
                                <div class="stat-card" style="margin-bottom: 14px; background: var(--surface-elevated);">
                                    <div class="stat-label">ZERO WATERMARK POLICY ACTIVE</div>
                                    <div style="font-size: 13px; color: var(--text-secondary); margin-top: 6px; line-height: 1.6;">
                                        All video streams and player embeds are running completely watermark-free. No overlay badges, corner logos, or brand stamps are injected into the video viewport.
                                    </div>
                                </div>
                                <div class="stat-card" style="background: var(--surface-elevated);">
                                    <div class="stat-label">POPUNDER ONLY REVENUE POLICY</div>
                                    <div style="font-size: 13px; color: var(--text-secondary); margin-top: 6px; line-height: 1.6;">
                                        VAST video ads are disabled. High-converting Popunders open cleanly in the background on initial play intent without interrupting or pausing the video playback stream.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ── TAB 6: CLIENT API KEYS ── -->
                <section id="tab-keys" class="tab-pane">
                    <div class="console-panel">
                        <div class="panel-header-bar">
                            <span class="panel-title-text">Client Embed API Keys</span>
                            <button type="button" class="btn-primary" onclick="promptCreateApiKey()">Generate New Key</button>
                        </div>
                        <div class="panel-content-body" style="padding: 0;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>API Key</th>
                                        <th>Client / Name</th>
                                        <th>Allowed Domain</th>
                                        <th>Tier</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody id="table-keys-body">
                                    <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">No API keys issued</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast-bubble" class="toast-bubble"></div>

    <script>
        let adminToken = sessionStorage.getItem('anx_admin_token') || '';
        let currentState = null;
        let autoRefreshInterval = null;

        const TAB_TITLES = {
            'tab-overview': 'Overview & Stream Telemetry',
            'tab-servers': 'Node Routing & Failover Configuration',
            'tab-firewall': 'Domain Firewall & Anti-Leech Protection',
            'tab-honeypot': 'Honeypot & Bot Traps Defense Log',
            'tab-branding': 'Monetization & Ad Delivery Network',
            'tab-keys': 'Client Embed API Keys Management'
        };

        function showToast(msg, duration = 2800) {
            const t = document.getElementById('toast-bubble');
            if (!t) return;
            t.textContent = msg;
            t.style.display = 'block';
            setTimeout(() => { t.style.display = 'none'; }, duration);
        }

        async function handleLogin(e) {
            e.preventDefault();
            const pass = document.getElementById('admin-pass').value;
            const errEl = document.getElementById('login-error');
            errEl.style.display = 'none';

            try {
                const res = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: pass })
                });
                const data = await res.json();
                if (res.ok && data.token) {
                    adminToken = data.token;
                    sessionStorage.setItem('anx_admin_token', adminToken);
                    document.getElementById('login-modal').style.display = 'none';
                    document.getElementById('dashboard-root').style.display = 'flex';
                    fetchFullState();
                    startAutoRefresh();
                    showToast('Authenticated as Operator');
                } else {
                    errEl.textContent = data.error || 'Authentication failed. Check your password.';
                    errEl.style.display = 'block';
                }
            } catch (err) {
                errEl.textContent = 'Connection error: ' + err.message;
                errEl.style.display = 'block';
            }
        }

        function handleLogout() {
            sessionStorage.removeItem('anx_admin_token');
            adminToken = '';
            stopAutoRefresh();
            document.getElementById('dashboard-root').style.display = 'none';
            document.getElementById('login-modal').style.display = 'flex';
        }

        function switchNavTab(tabId, btn) {
            document.querySelectorAll('.nav-item-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            if (btn) btn.classList.add('active');
            const target = document.getElementById(tabId);
            if (target) target.classList.add('active');

            const titleEl = document.getElementById('current-view-title');
            if (titleEl && TAB_TITLES[tabId]) {
                titleEl.textContent = TAB_TITLES[tabId];
            }
            if (tabId === 'tab-servers') {
                testClusterHealth(false);
            }
        }

        function toggleAutoRefresh(enabled) {
            if (enabled) startAutoRefresh();
            else stopAutoRefresh();
            showToast('Auto-refresh ' + (enabled ? 'enabled (10s)' : 'disabled'));
        }

        function startAutoRefresh() {
            stopAutoRefresh();
            autoRefreshInterval = setInterval(() => {
                fetchFullState(false, true);
            }, 10000);
        }

        function stopAutoRefresh() {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
            }
        }

        async function fetchFullState(showToastNotice = false, isAutoRefresh = false) {
            if (!adminToken) return;
            try {
                const res = await fetch('/api/admin/state', {
                    headers: { 'Authorization': 'Bearer ' + adminToken }
                });
                if (res.status === 401) {
                    handleLogout();
                    return;
                }
                const data = await res.json();
                if (data && data.config) {
                    if (!currentState) {
                        currentState = data;
                    } else {
                        currentState.telemetry = data.telemetry;
                        currentState.securityLog = data.securityLog;
                        if (!isAutoRefresh) {
                            currentState.config = data.config;
                        } else if (currentState.config && data.config) {
                            if (data.config.servers) {
                                currentState.config.servers = data.config.servers;
                            }
                            if (data.config.firewall) {
                                currentState.config.firewall.whitelist = data.config.firewall.whitelist;
                                currentState.config.firewall.blacklist = data.config.firewall.blacklist;
                                currentState.config.firewall.blockedIps = data.config.firewall.blockedIps;
                                currentState.config.firewall.blockedRequestsCount = data.config.firewall.blockedRequestsCount;
                            }
                            if (data.config.apiKeys) {
                                currentState.config.apiKeys = data.config.apiKeys;
                            }
                        }
                    }
                }
                renderDashboard(currentState, isAutoRefresh);
                if (!isAutoRefresh) {
                    testClusterHealth(false);
                }
                if (showToastNotice) showToast('Dashboard metrics refreshed');
            } catch (err) {
                console.error('State fetch failed:', err);
            }
        }

        function renderDashboard(data, isAutoRefresh = false) {
            if (!data) return;
            const { config, telemetry, securityLog } = data;

            // Overview Metrics
            if (telemetry) {
                document.getElementById('stat-total-streams').textContent = Number(telemetry.totalStreams || 0).toLocaleString();
                document.getElementById('stat-bandwidth').textContent = (telemetry.totalBandwidthMB || 0) + ' MB';
                document.getElementById('stat-blocked').textContent = Number(telemetry.blockedRequests || 0).toLocaleString();
                document.getElementById('stat-honeypot').textContent = (securityLog ? securityLog.length : 0);

                // Server Traffic Split Bar
                const srvDist = telemetry.serverDistribution || { 1: 0, 2: 0, 3: 0 };
                const totalSrvReq = (srvDist[1] || 0) + (srvDist[2] || 0) + (srvDist[3] || 0);
                if (totalSrvReq > 0) {
                    const p1 = Math.round(((srvDist[1] || 0) / totalSrvReq) * 100);
                    const p2 = Math.round(((srvDist[2] || 0) / totalSrvReq) * 100);
                    const p3 = Math.max(0, 100 - p1 - p2);
                    document.getElementById('dist-bar-1').style.width = p1 + '%';
                    document.getElementById('dist-bar-2').style.width = p2 + '%';
                    document.getElementById('dist-bar-3').style.width = p3 + '%';
                    document.getElementById('dist-total-ratio').textContent = 'Sora ' + p1 + '% · Neko ' + p2 + '% · Zozo ' + p3 + '%';
                } else {
                    document.getElementById('dist-bar-1').style.width = '100%';
                    document.getElementById('dist-bar-2').style.width = '0%';
                    document.getElementById('dist-bar-3').style.width = '0%';
                    document.getElementById('dist-total-ratio').textContent = 'Sora 100% · Neko 0% · Zozo 0%';
                }

                // Referrers Table
                const refBody = document.getElementById('table-referrers-body');
                const referrers = telemetry.topReferrers || [];
                document.getElementById('stat-referrers-count').textContent = referrers.length + ' Domains';
                if (referrers.length === 0) {
                    refBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No referrers logged yet</td></tr>';
                } else {
                    refBody.innerHTML = referrers.map(r => {
                        let badge = '';
                        if (r.status === 'official') {
                            badge = '<span class="server-status-tag tag-active" style="font-size: 9.5px;">OFFICIAL</span>';
                        } else if (r.status === 'whitelisted') {
                            badge = '<span class="server-status-tag" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25); font-size: 9.5px;">PARTNER</span>';
                        } else if (r.status === 'blocked') {
                            badge = '<span class="server-status-tag tag-disabled" style="font-size: 9.5px;">BLOCKED</span>';
                        } else {
                            badge = '<span class="server-status-tag tag-maintenance" style="font-size: 9.5px;">EXTERNAL</span>';
                        }

                        const sandboxTag = r.isSandboxed ? ' <span class="server-status-tag tag-disabled" style="font-size: 9px; background: rgba(239, 68, 68, 0.2); color: #f87171; border-color: rgba(239, 68, 68, 0.4); margin-left: 6px;" title="Sandbox Detected: ' + (r.sandboxReason || 'Ad-stripping sandbox') + '">SANDBOXED</span>' : '';

                        const actionBtn = r.status === 'blocked'
                            ? '<button type="button" class="btn-secondary" style="padding: 3px 9px; font-size: 11px;" data-domain="' + r.domain + '" onclick="quickUnbanDomain(this.dataset.domain)">Unban</button>'
                            : '<div style="display: flex; justify-content: flex-end; gap: 6px;">' +
                                '<button type="button" class="btn-danger" style="padding: 3px 9px; font-size: 11px;" data-domain="' + r.domain + '" onclick="quickBanDomain(this.dataset.domain)">Ban</button>' +
                                (r.status === 'external' ? '<button type="button" class="btn-secondary" style="padding: 3px 9px; font-size: 11px;" data-domain="' + r.domain + '" onclick="quickWhitelistDomain(this.dataset.domain)">Trust</button>' : '') +
                              '</div>';

                        return '<tr>' +
                            '<td class="mono-cell" style="color: #38bdf8; font-weight: 600; font-size: 12.5px;">' + r.domain + sandboxTag + '</td>' +
                            '<td>' + badge + '</td>' +
                            '<td class="mono-cell" style="font-size: 13px; font-weight: 700; color: #ffffff;">' + r.count.toLocaleString() + '</td>' +
                            '<td class="mono-cell" style="color: var(--text-secondary); font-size: 12px;">' + (r.bandwidthMB || (r.count * 15)).toLocaleString() + ' MB</td>' +
                            '<td style="font-size: 12px; color: var(--text-primary); font-weight: 500;" title="' + (r.topAnime || 'General') + '">' + (r.topAnime || '<span style="color: var(--text-muted); font-weight: 400;">General Stream</span>') + '</td>' +
                            '<td style="text-align: right;">' + actionBtn + '</td>' +
                        '</tr>';
                    }).join('');

                    const searchInput = document.getElementById('ref-search-input');
                    if (searchInput && searchInput.value) {
                        filterReferrersTable(searchInput.value);
                    }
                }

                // Top Anime Table
                const animeBody = document.getElementById('table-anime-body');
                const topAnime = telemetry.topAnime || [];
                document.getElementById('stat-anime-count').textContent = topAnime.length + ' Titles';
                if (topAnime.length === 0) {
                    animeBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">No streaming requests recorded yet</td></tr>';
                } else {
                    const maxCount = (topAnime[0] && topAnime[0].count) || 1;
                    const totalAnimeStreams = topAnime.reduce((acc, a) => acc + (a.count || 0), 0) || 1;

                    animeBody.innerHTML = topAnime.map((a, idx) => {
                        const rank = idx + 1;
                        const rankStr = rank < 10 ? '0' + rank : String(rank);
                        let rankBadge = '<span class="mono-cell" style="color: var(--text-muted); font-size: 11px; font-weight: 500;">' + rankStr + '</span>';
                        if (rank === 1) {
                            rankBadge = '<span class="mono-cell" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-weight: 700; font-size: 11px; padding: 2px 7px; border-radius: 4px;">01</span>';
                        } else if (rank === 2) {
                            rankBadge = '<span class="mono-cell" style="background: rgba(255, 255, 255, 0.07); color: #f4f4f5; border: 1px solid rgba(255, 255, 255, 0.16); font-weight: 600; font-size: 11px; padding: 2px 7px; border-radius: 4px;">02</span>';
                        } else if (rank === 3) {
                            rankBadge = '<span class="mono-cell" style="background: rgba(255, 255, 255, 0.04); color: #d4d4d8; border: 1px solid rgba(255, 255, 255, 0.1); font-weight: 600; font-size: 11px; padding: 2px 7px; border-radius: 4px;">03</span>';
                        }

                        const pct = Math.round((a.count / totalAnimeStreams) * 100);
                        const barWidth = Math.max(3, Math.round((a.count / maxCount) * 100));

                        return '<tr>' +
                            '<td style="text-align: center;">' + rankBadge + '</td>' +
                            '<td style="font-weight: 600; color: #ffffff; font-size: 13px;">' + a.title + '</td>' +
                            '<td class="mono-cell" style="font-size: 13px; font-weight: 700; color: #38bdf8;">' + a.count.toLocaleString() + ' <span style="font-size: 11px; font-weight: 400; color: var(--text-muted);">plays</span></td>' +
                            '<td>' +
                                '<div style="display: flex; align-items: center; gap: 10px;">' +
                                    '<div style="flex: 1; height: 6px; background: rgba(255, 255, 255, 0.06); border-radius: 99px; overflow: hidden;">' +
                                        '<div style="height: 100%; width: ' + barWidth + '%; background: linear-gradient(90deg, #38bdf8, #818cf8); border-radius: 99px;"></div>' +
                                    '</div>' +
                                    '<span class="mono-cell" style="font-size: 11px; color: var(--text-secondary); width: 38px; text-align: right;">' + pct + '%</span>' +
                                '</div>' +
                            '</td>' +
                        '</tr>';
                    }).join('');
                }
            }

            // Honeypot Bot Traps Log
            renderHoneypotTable(securityLog || []);

            // Firewall Chips & Blocked IPs
            if (config && config.firewall) {
                renderFirewallChips(config.firewall.whitelist, 'chips-whitelist', 'whitelist');
                renderFirewallChips(config.firewall.blacklist, 'chips-blacklist', 'blacklist');
                renderBlockedIpChips(config.firewall.blockedIps || []);
                const cWl = document.getElementById('count-whitelist');
                if (cWl) cWl.textContent = (config.firewall.whitelist || []).length;
                const cBl = document.getElementById('count-blacklist');
                if (cBl) cBl.textContent = (config.firewall.blacklist || []).length;
            }

            // Server Cards
            if (config && config.servers) {
                renderServerCards(config);
            }

            // API Keys Table
            if (!isAutoRefresh && config && config.apiKeys) {
                renderApiKeysTable(config.apiKeys);
            }

            // ── FORM CONTROLS: ONLY updated on initial load (never overwritten during background auto-refresh) ──
            if (!isAutoRefresh && config) {
                if (config.firewall) {
                    const wlMode = document.getElementById('chk-whitelist-mode');
                    if (wlMode) wlMode.checked = (config.firewall.mode === 'whitelist');
                    const tsGate = document.getElementById('chk-turnstile-enabled');
                    if (tsGate) tsGate.checked = (config.firewall.turnstileEnabled !== false);
                    const hlShield = document.getElementById('chk-hotlink-shield');
                    if (hlShield) hlShield.checked = Boolean(config.firewall.hotlinkProtection);
                }

                if (config.honeypot) {
                    const decoyEl = document.getElementById('input-decoy-url');
                    if (decoyEl && config.honeypot.decoyStreamUrl) {
                        decoyEl.value = config.honeypot.decoyStreamUrl;
                    }
                }

                if (config.monetization) {
                    const adsChk = document.getElementById('chk-ads-enabled');
                    if (adsChk) adsChk.checked = Boolean(config.monetization.adsEnabled);
                    const popUrl = document.getElementById('input-popunder-url');
                    if (popUrl) popUrl.value = config.monetization.popunderUrl || '';

                    selectCappingMode(config.monetization.cappingMode || 'natural', false);

                    const gapVal = document.getElementById('input-gap-value');
                    if (gapVal) gapVal.value = config.monetization.gapValue !== undefined ? config.monetization.gapValue : 30;
                    const gapUnit = document.getElementById('select-gap-unit');
                    if (gapUnit) gapUnit.value = config.monetization.gapUnit || 'minutes';
                    const maxAds = document.getElementById('input-max-ads');
                    if (maxAds) maxAds.value = config.monetization.maxAdsPerDay !== undefined ? config.monetization.maxAdsPerDay : 3;
                    const clickTrig = document.getElementById('select-click-trigger');
                    if (clickTrig) clickTrig.value = config.monetization.clickTrigger !== undefined ? String(config.monetization.clickTrigger) : '1';
                }
            }
        }

        function renderServerCards(config) {
            if (!config || !config.servers) return;
            const primarySrv = config.servers.primary || 1;
            [1, 2, 3].forEach(id => {
                const card = document.getElementById('card-srv-' + id);
                const badge = document.getElementById('badge-srv-' + id);
                const prio = document.getElementById('prio-srv-' + id);
                const primBtn = document.getElementById('btn-primary-srv-' + id);
                const maintBtn = document.getElementById('btn-maint-' + id);

                if (card && badge && prio && maintBtn) {
                    const isPrim = (primarySrv === id);
                    const isMaint = Boolean(config.servers.maintenance && config.servers.maintenance[id]);

                    if (isPrim) {
                        card.classList.add('is-primary');
                        if (isMaint) {
                            card.classList.add('is-maintenance');
                            badge.className = 'server-status-tag tag-maintenance';
                            badge.textContent = 'PRIMARY (PAUSED)';
                            prio.textContent = 'Bypassed (In Maintenance)';
                            prio.style.color = 'var(--status-amber)';
                        } else {
                            card.classList.remove('is-maintenance');
                            badge.className = 'server-status-tag tag-active';
                            badge.textContent = 'PRIMARY';
                            prio.textContent = '#1 (Active Primary)';
                            prio.style.color = 'var(--text-primary)';
                        }
                    } else {
                        card.classList.remove('is-primary');
                        if (isMaint) {
                            card.classList.add('is-maintenance');
                            badge.className = 'server-status-tag tag-maintenance';
                            badge.textContent = 'MAINTENANCE';
                            prio.textContent = 'Offline (Excluded)';
                            prio.style.color = 'var(--status-amber)';
                        } else {
                            card.classList.remove('is-maintenance');
                            badge.className = 'server-status-tag tag-active';
                            badge.textContent = 'STANDBY';
                            prio.textContent = 'Fallback';
                            prio.style.color = 'var(--text-secondary)';
                        }
                    }

                    if (primBtn) {
                        if (isPrim && !isMaint) {
                            primBtn.textContent = '✓ Active Primary';
                            primBtn.className = 'btn-primary';
                            primBtn.disabled = true;
                            primBtn.style.cursor = 'default';
                            primBtn.style.opacity = '1';
                        } else if (isPrim && isMaint) {
                            primBtn.textContent = 'Resume & Make Primary';
                            primBtn.className = 'btn-secondary';
                            primBtn.disabled = false;
                            primBtn.style.cursor = 'pointer';
                            primBtn.style.opacity = '1';
                        } else {
                            primBtn.textContent = 'Set as Primary';
                            primBtn.className = 'btn-secondary';
                            primBtn.disabled = false;
                            primBtn.style.cursor = 'pointer';
                            primBtn.style.opacity = isMaint ? '0.7' : '1';
                        }
                    }

                    if (isMaint) {
                        maintBtn.textContent = 'Resume Node';
                        maintBtn.className = 'btn-secondary';
                    } else {
                        maintBtn.textContent = 'Maintenance';
                        maintBtn.className = 'btn-danger';
                    }
                }
            });
        }

        function renderHoneypotTable(securityLog) {
            const hpBody = document.getElementById('table-honeypot-body');
            if (!hpBody) return;
            if (!securityLog || securityLog.length === 0) {
                hpBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No bots intercepted recently</td></tr>';
                return;
            }
            const blockedIps = (currentState && currentState.config && currentState.config.firewall && currentState.config.firewall.blockedIps) || [];
            hpBody.innerHTML = securityLog.map(item => {
                const isBlocked = blockedIps.includes(item.ip);
                const actionBtn = isBlocked
                    ? '<div style="display: flex; align-items: center; gap: 6px;"><span class="brand-tag-pill" style="color: var(--status-red); border-color: rgba(239, 68, 68, 0.4);">BLOCKED</span><button type="button" class="btn-secondary" style="padding: 2px 7px; font-size: 11px;" onclick="unbanIp(this.dataset.ip)" data-ip="' + item.ip + '">Unban</button></div>'
                    : '<button type="button" class="btn-danger" style="padding: 2px 7px; font-size: 11px;" onclick="banIp(this.dataset.ip)" data-ip="' + item.ip + '">Ban IP</button>';
                return '<tr>' +
                    '<td class="mono-cell">' + new Date(item.timestamp).toLocaleTimeString() + '</td>' +
                    '<td class="mono-cell">' + item.ip + '</td>' +
                    '<td style="color: var(--text-secondary);">' + item.userAgent + '</td>' +
                    '<td class="mono-cell">' + item.path + '</td>' +
                    '<td>' + actionBtn + '</td>' +
                '</tr>';
            }).join('');
        }

        function renderBlockedIpChips(list) {
            const el = document.getElementById('chips-blocked-ips');
            const countEl = document.getElementById('count-blocked-ips');
            if (countEl) countEl.textContent = (list ? list.length : 0);
            if (!el) return;
            if (!list || list.length === 0) {
                el.innerHTML = '<span style="font-size: 12px; color: var(--text-muted);">No blocked IPs</span>';
                return;
            }
            el.innerHTML = list.map(ip =>
                '<span class="domain-chip" style="border-color: rgba(239, 68, 68, 0.35); background: rgba(239, 68, 68, 0.08);">' +
                    '<span style="color: #fca5a5;">' + ip + '</span>' +
                    '<span class="domain-chip-del" onclick="unbanIp(this.dataset.ip)" data-ip="' + ip + '" title="Unban IP">&times;</span>' +
                '</span>'
            ).join('');
        }

        function renderFirewallChips(list, containerId, type) {
            const el = document.getElementById(containerId);
            if (!el) return;
            if (!list || list.length === 0) {
                el.innerHTML = '<span style="font-size: 12px; color: var(--text-muted);">No domains configured</span>';
                return;
            }
            el.innerHTML = list.map(d =>
                '<span class="domain-chip">' +
                    '<span>' + d + '</span>' +
                    '<span class="domain-chip-del" onclick="removeDomainRule(this.dataset.type, this.dataset.domain)" data-type="' + type + '" data-domain="' + d + '">&times;</span>' +
                '</span>'
            ).join('');
        }

        function renderApiKeysTable(keys) {
            const body = document.getElementById('table-keys-body');
            if (!body) return;
            if (!keys || keys.length === 0) {
                body.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">No API keys issued</td></tr>';
                return;
            }
            body.innerHTML = keys.map(k =>
                '<tr>' +
                    '<td class="mono-cell" style="color: #38bdf8;">' + k.key + '</td>' +
                    '<td><strong>' + k.name + '</strong></td>' +
                    '<td class="mono-cell">' + k.domain + '</td>' +
                    '<td><span class="brand-tag-pill">' + k.tier + '</span></td>' +
                    '<td><span class="pulse-dot" style="background: ' + (k.active ? 'var(--status-green)' : 'var(--status-red)') + '; display: inline-block; vertical-align: middle; margin-right: 4px;"></span>' + (k.active ? 'Active' : 'Revoked') + '</td>' +
                    '<td>' +
                        '<div style="display: flex; gap: 6px;">' +
                            '<button type="button" class="btn-secondary" style="padding: 3px 8px; font-size: 11px;" onclick="copyApiKey(this.dataset.key)" data-key="' + k.key + '">Copy</button>' +
                            '<button type="button" class="' + (k.active ? 'btn-danger' : 'btn-primary') + '" style="padding: 3px 8px; font-size: 11px;" onclick="toggleApiKeyStatus(this.dataset.key)" data-key="' + k.key + '">' + (k.active ? 'Revoke' : 'Activate') + '</button>' +
                            '<button type="button" class="btn-secondary" style="padding: 3px 8px; font-size: 11px; color: var(--status-red);" onclick="removeApiKey(this.dataset.key)" data-key="' + k.key + '" title="Delete Key">&times;</button>' +
                        '</div>' +
                    '</td>' +
                '</tr>'
            ).join('');
        }

        // ── Actions ──
        async function setPrimaryServer(serverId) {
            const btn = document.getElementById('btn-primary-srv-' + serverId);
            if (btn) {
                btn.textContent = 'Promoting...';
                btn.disabled = true;
            }

            try {
                const isCurrentlyMaint = Boolean(currentState?.config?.servers?.maintenance?.[serverId]);
                const payload = { primary: serverId };
                if (isCurrentlyMaint) {
                    payload.maintenance = { [serverId]: false };
                }

                const res = await fetch('/api/admin/servers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const data = await res.json();
                    showToast('Server ' + serverId + ' promoted to Primary');
                    if (currentState && currentState.config) {
                        currentState.config.servers = data.servers || {
                            ...currentState.config.servers,
                            primary: serverId,
                            maintenance: { ...(currentState.config.servers?.maintenance || {}), [serverId]: false }
                        };
                        renderServerCards(currentState.config);
                    }
                } else {
                    showToast('Failed to promote Server ' + serverId);
                    if (currentState?.config) renderServerCards(currentState.config);
                }
            } catch (e) {
                showToast('Action failed: ' + e.message);
                if (currentState?.config) renderServerCards(currentState.config);
            }
        }

        async function toggleServerMaintenance(serverId) {
            const maintBtn = document.getElementById('btn-maint-' + serverId);
            const isMaint = Boolean(currentState && currentState.config && currentState.config.servers && currentState.config.servers.maintenance && currentState.config.servers.maintenance[serverId]);
            const nextState = !isMaint;
            if (maintBtn) {
                maintBtn.textContent = nextState ? 'Pausing...' : 'Resuming...';
                maintBtn.disabled = true;
            }

            try {
                const res = await fetch('/api/admin/servers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
                    body: JSON.stringify({ maintenance: { [serverId]: nextState } })
                });
                if (res.ok) {
                    const data = await res.json();
                    showToast('Server ' + serverId + (nextState ? ' placed in Maintenance' : ' Resumed to Cluster'));
                    if (currentState && currentState.config) {
                        currentState.config.servers = data.servers || {
                            ...currentState.config.servers,
                            maintenance: { ...(currentState.config.servers?.maintenance || {}), [serverId]: nextState }
                        };
                        renderServerCards(currentState.config);
                    }
                } else {
                    showToast('Failed to update maintenance state');
                    if (currentState?.config) renderServerCards(currentState.config);
                }
            } catch (e) {
                showToast('Action failed: ' + e.message);
                if (currentState?.config) renderServerCards(currentState.config);
            }
        }

        async function testClusterHealth(showToastNotice = true) {
            const pingBtn = document.getElementById('btn-cluster-ping');
            if (pingBtn) {
                pingBtn.disabled = true;
                pingBtn.textContent = 'Probing Nodes...';
            }
            if (showToastNotice) showToast('Running live cluster ping test...');
            try {
                const res = await fetch('/health?fresh=1');
                const health = await res.json();
                if (health && health.servers) {
                    health.servers.forEach(s => {
                        const pingEl = document.getElementById('ping-srv-' + s.id);
                        if (pingEl) {
                            const isHealthy = (s.status === 'operational' || s.status === 'ok');
                            pingEl.textContent = s.latencyMs ? s.latencyMs + 'ms' : (isHealthy ? 'Online' : 'Offline');
                            pingEl.style.color = isHealthy ? 'var(--status-green)' : 'var(--status-red)';
                        }
                    });
                }
                if (showToastNotice) showToast('Cluster health checks completed');
            } catch (e) {
                if (showToastNotice) showToast('Ping failed: ' + e.message);
            } finally {
                if (pingBtn) {
                    pingBtn.disabled = false;
                    pingBtn.textContent = 'Run Live Cluster Ping Test';
                }
            }
        }

        async function updateFirewallMode(isWhitelist) {
            const mode = isWhitelist ? 'whitelist' : 'public';
            if (currentState && currentState.config && currentState.config.firewall) {
                currentState.config.firewall.mode = mode;
            }
            const ok = await sendConfigPatch({ firewall: { mode } });
            if (ok) {
                showToast('Firewall mode set to ' + (isWhitelist ? 'Strict Whitelist' : 'Public'));
            } else {
                const el = document.getElementById('chk-whitelist-mode');
                if (el) el.checked = !isWhitelist;
                if (currentState && currentState.config && currentState.config.firewall) {
                    currentState.config.firewall.mode = !isWhitelist ? 'whitelist' : 'public';
                }
            }
        }

        async function updateTurnstileMode(enabled) {
            if (currentState && currentState.config && currentState.config.firewall) {
                currentState.config.firewall.turnstileEnabled = enabled;
            }
            const ok = await sendConfigPatch({ firewall: { turnstileEnabled: enabled } });
            if (ok) {
                showToast('Turnstile Bot Gate ' + (enabled ? 'Enabled' : 'Disabled'));
            } else {
                const el = document.getElementById('chk-turnstile-enabled');
                if (el) el.checked = !enabled;
                if (currentState && currentState.config && currentState.config.firewall) {
                    currentState.config.firewall.turnstileEnabled = !enabled;
                }
            }
        }

        async function updateHotlinkShield(enabled) {
            if (currentState && currentState.config && currentState.config.firewall) {
                currentState.config.firewall.hotlinkProtection = enabled;
            }
            const ok = await sendConfigPatch({ firewall: { hotlinkProtection: enabled } });
            if (ok) {
                showToast('Hotlink protection ' + (enabled ? 'Enabled' : 'Disabled'));
            } else {
                const el = document.getElementById('chk-hotlink-shield');
                if (el) el.checked = !enabled;
                if (currentState && currentState.config && currentState.config.firewall) {
                    currentState.config.firewall.hotlinkProtection = !enabled;
                }
            }
        }

        async function toggleAdsEnabled(enabled) {
            if (currentState && currentState.config && currentState.config.monetization) {
                currentState.config.monetization.adsEnabled = enabled;
            }
            const ok = await sendConfigPatch({ monetization: { adsEnabled: enabled } });
            if (ok) {
                showToast('Popunder ads ' + (enabled ? 'Enabled' : 'Disabled'));
            } else {
                const el = document.getElementById('chk-ads-enabled');
                if (el) el.checked = !enabled;
                if (currentState && currentState.config && currentState.config.monetization) {
                    currentState.config.monetization.adsEnabled = !enabled;
                }
            }
        }

        async function addDomainRule(type) {
            const input = document.getElementById('input-firewall-domain');
            const domain = input ? input.value.trim().toLowerCase() : '';
            if (!domain) return;
            try {
                const res = await fetch('/api/admin/firewall', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
                    body: JSON.stringify({ action: 'add', type, domain })
                });
                if (res.ok) {
                    input.value = '';
                    showToast('Added ' + domain + ' to ' + type);
                    if (currentState && currentState.config && currentState.config.firewall) {
                        const targetList = type === 'whitelist' ? currentState.config.firewall.whitelist : currentState.config.firewall.blacklist;
                        if (!targetList.includes(domain)) targetList.push(domain);
                        renderFirewallChips(currentState.config.firewall.whitelist, 'chips-whitelist', 'whitelist');
                        renderFirewallChips(currentState.config.firewall.blacklist, 'chips-blacklist', 'blacklist');
                        document.getElementById('count-whitelist').textContent = currentState.config.firewall.whitelist.length;
                        document.getElementById('count-blacklist').textContent = currentState.config.firewall.blacklist.length;
                    }
                }
            } catch (e) { showToast('Add failed: ' + e.message); }
        }

        async function removeDomainRule(type, domain) {
            try {
                const res = await fetch('/api/admin/firewall', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
                    body: JSON.stringify({ action: 'remove', type, domain })
                });
                if (res.ok) {
                    showToast('Removed ' + domain + ' from ' + type);
                    if (currentState && currentState.config && currentState.config.firewall) {
                        if (type === 'whitelist') {
                            currentState.config.firewall.whitelist = currentState.config.firewall.whitelist.filter(d => d !== domain);
                        } else {
                            currentState.config.firewall.blacklist = currentState.config.firewall.blacklist.filter(d => d !== domain);
                        }
                        renderFirewallChips(currentState.config.firewall.whitelist, 'chips-whitelist', 'whitelist');
                        renderFirewallChips(currentState.config.firewall.blacklist, 'chips-blacklist', 'blacklist');
                        document.getElementById('count-whitelist').textContent = currentState.config.firewall.whitelist.length;
                        document.getElementById('count-blacklist').textContent = currentState.config.firewall.blacklist.length;
                    }
                }
            } catch (e) { showToast('Remove failed: ' + e.message); }
        }

        async function quickBanDomain(domain) {
            if (!confirm('Immediately ban ' + domain + ' from embedding your player?')) return;
            try {
                const res = await fetch('/api/admin/firewall', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
                    body: JSON.stringify({ action: 'add', type: 'blacklist', domain })
                });
                if (res.ok) {
                    showToast('Banned ' + domain);
                    fetchFullState(false, false);
                }
            } catch (e) { showToast('Ban failed: ' + e.message); }
        }

        async function quickUnbanDomain(domain) {
            removeDomainRule('blacklist', domain);
        }

        async function quickWhitelistDomain(domain) {
            try {
                const res = await fetch('/api/admin/firewall', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
                    body: JSON.stringify({ action: 'add', type: 'whitelist', domain })
                });
                if (res.ok) {
                    showToast('Added ' + domain + ' to whitelist');
                    fetchFullState(false, false);
                }
            } catch (e) { showToast('Action failed: ' + e.message); }
        }

        async function clearTelemetryStats() {
            if (!confirm('Are you sure you want to reset all telemetry and domain request stats?')) return;
            try {
                const res = await fetch('/api/admin/clear-telemetry', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + adminToken }
                });
                if (res.ok) {
                    showToast('Telemetry stats cleared successfully');
                    fetchFullState(false, false);
                }
            } catch (e) { showToast('Reset failed: ' + e.message); }
        }

        function filterReferrersTable(query) {
            const term = (query || '').toLowerCase().trim();
            const rows = document.querySelectorAll('#table-referrers-body tr');
            rows.forEach(row => {
                if (row.children.length <= 1) return;
                if (!term) {
                    row.style.display = '';
                } else {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(term) ? '' : 'none';
                }
            });
        }

        async function manualBlockIp() {
            const input = document.getElementById('input-firewall-ip');
            const ip = input ? input.value.trim() : '';
            if (!ip) return;
            await banIp(ip);
            if (input) input.value = '';
        }

        async function banIp(ip) {
            if (!ip) return;
            try {
                const res = await fetch('/api/admin/ban-ip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
                    body: JSON.stringify({ ip })
                });
                if (res.ok) {
                    showToast('IP ' + ip + ' added to blocked list');
                    if (currentState && currentState.config && currentState.config.firewall) {
                        if (!currentState.config.firewall.blockedIps) currentState.config.firewall.blockedIps = [];
                        if (!currentState.config.firewall.blockedIps.includes(ip)) currentState.config.firewall.blockedIps.push(ip);
                        renderBlockedIpChips(currentState.config.firewall.blockedIps);
                        renderHoneypotTable(currentState.securityLog || []);
                    }
                }
            } catch (e) { showToast('Ban failed: ' + e.message); }
        }

        async function unbanIp(ip) {
            if (!ip) return;
            try {
                const res = await fetch('/api/admin/unban-ip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
                    body: JSON.stringify({ ip })
                });
                if (res.ok) {
                    showToast('IP ' + ip + ' unblocked');
                    if (currentState && currentState.config && currentState.config.firewall && currentState.config.firewall.blockedIps) {
                        currentState.config.firewall.blockedIps = currentState.config.firewall.blockedIps.filter(x => x !== ip);
                        renderBlockedIpChips(currentState.config.firewall.blockedIps);
                        renderHoneypotTable(currentState.securityLog || []);
                    }
                }
            } catch (e) { showToast('Unban failed: ' + e.message); }
        }

        async function clearSecurityLogs() {
            try {
                const res = await fetch('/api/admin/clear-logs', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + adminToken }
                });
                if (res.ok) {
                    showToast('Security logs cleared');
                    if (currentState) currentState.securityLog = [];
                    renderHoneypotTable([]);
                }
            } catch (e) { showToast('Action failed: ' + e.message); }
        }

        async function saveDecoyUrl() {
            const input = document.getElementById('input-decoy-url');
            const url = input ? input.value.trim() : '';
            if (!url) return;
            const ok = await sendConfigPatch({ honeypot: { decoyStreamUrl: url } });
            if (ok) {
                showToast('Decoy stream URL updated successfully');
            }
        }

        function selectCappingMode(mode, userInitiated = false) {
            const isCustom = (mode === 'custom');
            const rNat = document.getElementById('radio-mode-natural');
            const rCust = document.getElementById('radio-mode-custom');
            const cardNat = document.getElementById('card-mode-natural');
            const cardCust = document.getElementById('card-mode-custom');
            const customPanel = document.getElementById('custom-capping-options');
            const indicator = document.getElementById('capping-mode-indicator');

            if (rNat) rNat.checked = !isCustom;
            if (rCust) rCust.checked = isCustom;

            if (isCustom) {
                if (cardCust) cardCust.classList.add('active');
                if (cardNat) cardNat.classList.remove('active');
                if (customPanel) customPanel.style.display = 'block';
                if (indicator) {
                    indicator.textContent = 'Custom Rules Active';
                    indicator.style.color = '#38bdf8';
                    indicator.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                }
            } else {
                if (cardNat) cardNat.classList.add('active');
                if (cardCust) cardCust.classList.remove('active');
                if (customPanel) customPanel.style.display = 'none';
                if (indicator) {
                    indicator.textContent = 'Natural (Network AI)';
                    indicator.style.color = 'var(--status-green)';
                    indicator.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                }
            }

            if (userInitiated) {
                sendConfigPatch({ monetization: { cappingMode: mode } }).then(ok => {
                    if (ok) showToast('Capping mode set to ' + (isCustom ? 'Custom' : 'Natural AI'));
                });
            }
        }

        async function saveMonetization() {
            const adsEnabled = document.getElementById('chk-ads-enabled').checked;
            const popunderUrl = document.getElementById('input-popunder-url').value.trim();
            const rCust = document.getElementById('radio-mode-custom');
            const cappingMode = (rCust && rCust.checked) ? 'custom' : 'natural';
            const gapValEl = document.getElementById('input-gap-value');
            const gapUnitEl = document.getElementById('select-gap-unit');
            const maxAdsEl = document.getElementById('input-max-ads');
            const clickTriggerEl = document.getElementById('select-click-trigger');

            const gapValue = gapValEl ? Math.max(1, parseInt(gapValEl.value, 10) || 30) : 30;
            const gapUnit = gapUnitEl ? gapUnitEl.value : 'minutes';
            const maxAdsPerDay = maxAdsEl ? Math.max(0, parseInt(maxAdsEl.value, 10) || 0) : 3;
            const clickTrigger = clickTriggerEl ? parseInt(clickTriggerEl.value, 10) : 1;

            let popunderFrequencyHours = 24;
            if (gapUnit === 'hours') popunderFrequencyHours = gapValue;
            else if (gapUnit === 'minutes') popunderFrequencyHours = Math.max(1, Math.round(gapValue / 60));
            else if (gapUnit === 'seconds') popunderFrequencyHours = 1;

            const ok = await sendConfigPatch({
                monetization: {
                    adsEnabled,
                    popunderUrl,
                    cappingMode,
                    gapValue,
                    gapUnit,
                    maxAdsPerDay,
                    clickTrigger,
                    popunderFrequencyHours
                }
            });
            if (ok) {
                showToast('Popunder settings saved successfully');
            }
        }

        async function promptCreateApiKey() {
            const name = prompt('Enter Client / Partner Name:', 'New Partner');
            if (!name) return;
            const domain = prompt('Allowed Domain (or type "all"):', 'all') || 'all';

            try {
                const res = await fetch('/api/admin/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
                    body: JSON.stringify({
                        newApiKey: { name, domain, tier: 'Partner' }
                    })
                });
                if (res.ok) {
                    showToast('Client API key generated successfully');
                    const data = await res.json();
                    if (data && data.config && data.config.apiKeys) {
                        if (!currentState) currentState = {};
                        if (!currentState.config) currentState.config = {};
                        currentState.config.apiKeys = data.config.apiKeys;
                        renderApiKeysTable(currentState.config.apiKeys);
                    }
                }
            } catch (e) { showToast('Key generation failed: ' + e.message); }
        }

        function copyApiKey(key) {
            navigator.clipboard.writeText(key).then(() => showToast('Copied API Key to clipboard'));
        }

        async function toggleApiKeyStatus(key) {
            try {
                const res = await fetch('/api/admin/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
                    body: JSON.stringify({ toggleApiKey: key })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.config && data.config.apiKeys) {
                        if (!currentState) currentState = {};
                        if (!currentState.config) currentState.config = {};
                        currentState.config.apiKeys = data.config.apiKeys;
                        renderApiKeysTable(currentState.config.apiKeys);
                    }
                    showToast('API Key status updated');
                }
            } catch (e) { showToast('Action failed: ' + e.message); }
        }

        async function removeApiKey(key) {
            if (!confirm('Are you sure you want to permanently delete API key ' + key + '?')) return;
            try {
                const res = await fetch('/api/admin/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
                    body: JSON.stringify({ deleteApiKey: key })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.config && data.config.apiKeys) {
                        if (!currentState) currentState = {};
                        if (!currentState.config) currentState.config = {};
                        currentState.config.apiKeys = data.config.apiKeys;
                        renderApiKeysTable(currentState.config.apiKeys);
                    }
                    showToast('API Key deleted');
                }
            } catch (e) { showToast('Delete failed: ' + e.message); }
        }

        async function sendConfigPatch(patch) {
            try {
                const res = await fetch('/api/admin/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
                    body: JSON.stringify(patch)
                });
                if (res.ok) {
                    const data = await res.json().catch(() => ({}));
                    if (data && data.config) {
                        if (!currentState) currentState = {};
                        currentState.config = {
                            ...currentState.config,
                            ...data.config,
                            firewall: { ...(currentState.config ? currentState.config.firewall : {}), ...data.config.firewall },
                            monetization: { ...(currentState.config ? currentState.config.monetization : {}), ...data.config.monetization }
                        };
                    }
                    return true;
                }
                return false;
            } catch (err) {
                showToast('Save failed: ' + err.message);
                return false;
            }
        }

        // Init on load
        window.addEventListener('DOMContentLoaded', () => {
            if (adminToken) {
                document.getElementById('login-modal').style.display = 'none';
                document.getElementById('dashboard-root').style.display = 'flex';
                fetchFullState(false, false);
                startAutoRefresh();
            } else {
                document.getElementById('login-modal').style.display = 'flex';
                document.getElementById('dashboard-root').style.display = 'none';
            }
        });
    </script>
</body>
</html>`;
}
