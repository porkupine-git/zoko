/**
 * VIDCLOUD OPERATOR CONSOLE & ADMIN DASHBOARD
 * Sleek, high-performance developer console for vidcloud.sbs
 * Controls multi-server routing, firewall, monetization, and telemetry.
 */

export function renderAdminHtml(baseUrl = "") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VidCloud Operator Console</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230E1219'/%3E%3Cpolygon points='11,9 23,16 11,23' fill='%233B82F6'/%3E%3C/svg%3E">
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
            --text-primary: #ffffff;
            --text-secondary: #a1a1aa;
            --text-muted: #71717a;
            --status-green: #22c55e;
            --status-red: #ef4444;
            --accent: #3b82f6;
            --radius-sm: 6px;
            --radius-md: 8px;
            --radius-lg: 12px;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background-color: var(--bg);
            color: var(--text-primary);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            min-height: 100vh;
            line-height: 1.5;
        }

        /* ── Login Modal ── */
        .login-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(9, 9, 11, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(8px);
        }

        .login-box {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 32px;
            width: 100%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
        }

        .login-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 6px;
        }

        .login-sub {
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 24px;
        }

        .login-input {
            width: 100%;
            padding: 10px 14px;
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            color: #ffffff;
            font-size: 14px;
            margin-bottom: 16px;
            outline: none;
            transition: border-color 0.15s ease;
        }

        .login-input:focus {
            border-color: var(--accent);
        }

        .login-btn {
            width: 100%;
            padding: 10px;
            background: var(--accent);
            color: #ffffff;
            border: none;
            border-radius: var(--radius-sm);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.15s ease;
        }

        .login-btn:hover {
            opacity: 0.9;
        }

        .login-error {
            color: var(--status-red);
            font-size: 12px;
            margin-top: 12px;
            display: none;
        }

        /* ── Dashboard Layout ── */
        .dashboard-wrap {
            display: none;
            max-width: 1180px;
            margin: 0 auto;
            padding: 30px 24px 60px;
        }

        .dash-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 28px;
        }

        .dash-brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .dash-brand h1 {
            font-size: 20px;
            font-weight: 700;
        }

        .dash-brand-tag {
            font-size: 11px;
            font-family: 'JetBrains Mono', monospace;
            background: var(--surface-elevated);
            padding: 3px 8px;
            border-radius: 4px;
            color: var(--text-muted);
            border: 1px solid var(--border);
        }

        .btn-logout {
            background: var(--surface);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            padding: 6px 12px;
            border-radius: var(--radius-sm);
            font-size: 12px;
            cursor: pointer;
        }

        /* ── Stats Grid ── */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 18px 20px;
        }

        .stat-label {
            font-size: 11.5px;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }

        .stat-val {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
        }

        /* ── Settings Sections ── */
        .card-panel {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 24px;
            margin-bottom: 24px;
        }

        .card-panel-title {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .card-panel-desc {
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 20px;
        }

        .form-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 0;
            border-bottom: 1px solid var(--border);
        }

        .form-row:last-child {
            border-bottom: none;
        }

        .form-label-box {
            max-width: 600px;
        }

        .form-label {
            font-size: 13.5px;
            font-weight: 600;
            margin-bottom: 2px;
        }

        .form-subtext {
            font-size: 12px;
            color: var(--text-muted);
        }

        .form-control-select, .form-control-input {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            color: #ffffff;
            font-size: 13px;
            padding: 8px 12px;
            border-radius: var(--radius-sm);
            outline: none;
        }

        .btn-save {
            background: var(--accent);
            color: #ffffff;
            border: none;
            padding: 9px 18px;
            border-radius: var(--radius-sm);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 14px;
        }

        /* ── Domain Lists ── */
        .domain-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin: 4px 4px 4px 0;
        }

        .domain-remove-btn {
            background: none;
            border: none;
            color: var(--status-red);
            cursor: pointer;
            font-weight: 700;
        }

        .save-toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #10b981;
            color: #ffffff;
            padding: 10px 18px;
            border-radius: var(--radius-sm);
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            display: none;
            z-index: 10000;
        }
    </style>
</head>
<body>
    <!-- ── Login Dialog ── -->
    <div id="login-modal" class="login-overlay">
        <div class="login-box">
            <h2 class="login-title">VidCloud Console</h2>
            <p class="login-sub">Enter master admin passphrase for vidcloud.sbs</p>
            <input type="password" id="admin-pass-input" class="login-input" placeholder="Passphrase..." onkeydown="if (event.key === 'Enter') attemptLogin()">
            <button type="button" class="login-btn" onclick="attemptLogin()">Authorize Session</button>
            <div id="login-error" class="login-error">Invalid credentials.</div>
        </div>
    </div>

    <!-- ── Save Toast ── -->
    <div id="save-toast" class="save-toast">Configuration updated successfully.</div>

    <!-- ── Main Dashboard ── -->
    <div id="dashboard-view" class="dashboard-wrap">
        <header class="dash-header">
            <div class="dash-brand">
                <h1>VidCloud Operator</h1>
                <span class="dash-brand-tag">vidcloud.sbs</span>
            </div>
            <div>
                <button type="button" class="btn-logout" onclick="logout()">Terminate Session</button>
            </div>
        </header>

        <!-- ── Live Metrics ── -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Stream Loads</div>
                <div class="stat-val" id="stat-streams">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Estimated Bandwidth</div>
                <div class="stat-val" id="stat-bandwidth">0 MB</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Blocked Requests</div>
                <div class="stat-val" id="stat-blocked">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Uptime</div>
                <div class="stat-val" id="stat-uptime">0m</div>
            </div>
        </div>

        <!-- ── Streaming Engines ── -->
        <div class="card-panel">
            <div class="card-panel-title">Streaming Engine Routing</div>
            <div class="card-panel-desc">Configure primary resolver priority and failover behavior across cluster nodes.</div>

            <div class="form-row">
                <div class="form-label-box">
                    <div class="form-label">Primary Active Node</div>
                    <div class="form-subtext">The initial server query target before attempting automated failover.</div>
                </div>
                <select id="cfg-primary-server" class="form-control-select">
                    <option value="1">Server 1 (VidCloud Core / MegaPlay)</option>
                    <option value="2">Server 2 (VidCloud Neko)</option>
                    <option value="3">Server 3 (VidCloud Zozo)</option>
                </select>
            </div>

            <button type="button" class="btn-save" onclick="saveServerRouting()">Save Routing Rules</button>
        </div>

        <!-- ── Firewall & Hotlink ── -->
        <div class="card-panel">
            <div class="card-panel-title">Origin Firewall & Anti-Leech</div>
            <div class="card-panel-desc">Restrict embedding to approved domains or block malicious leeches.</div>

            <div class="form-row">
                <div class="form-label-box">
                    <div class="form-label">Firewall Mode</div>
                    <div class="form-subtext">Public allows all sites except blacklisted domains. Whitelist restricts embedding exclusively to listed domains.</div>
                </div>
                <select id="cfg-firewall-mode" class="form-control-select">
                    <option value="public">Public (Open with Blacklist)</option>
                    <option value="whitelist">Whitelist Only</option>
                </select>
            </div>

            <div class="form-row">
                <div class="form-label-box">
                    <div class="form-label">Cloudflare Turnstile Verification</div>
                    <div class="form-subtext">Requires human challenge when requests are flagged or tickets are missing.</div>
                </div>
                <select id="cfg-turnstile-toggle" class="form-control-select">
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                </select>
            </div>

            <button type="button" class="btn-save" onclick="saveFirewallConfig()">Update Firewall</button>
        </div>

        <!-- ── Monetization & Popunders ── -->
        <div class="card-panel">
            <div class="card-panel-title">Ad Monetization & Popunder</div>
            <div class="card-panel-desc">Inject ad scripts and popunder code into the embed player container.</div>

            <div class="form-row">
                <div class="form-label-box">
                    <div class="form-label">Enable Popunder Ads</div>
                    <div class="form-subtext">Inject custom ad tags upon player initialization.</div>
                </div>
                <select id="cfg-ads-enabled" class="form-control-select">
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                </select>
            </div>

            <div style="margin-top: 14px;">
                <div class="form-label">Popunder Script or URL Tag</div>
                <textarea id="cfg-popunder-tag" class="form-control-input" style="width:100%; height:80px; margin-top:6px; font-family:'JetBrains Mono',monospace; font-size:12px;" placeholder='<script src="..."></script>'></textarea>
            </div>

            <button type="button" class="btn-save" onclick="saveMonetization()">Save Ad Settings</button>
        </div>
    </div>

    <!-- ── Admin Scripts ── -->
    <script>
    let authToken = localStorage.getItem('vidcloud_admin_token') || '';

    function showToast() {
        const t = document.getElementById('save-toast');
        t.style.display = 'block';
        setTimeout(() => { t.style.display = 'none'; }, 2000);
    }

    async function attemptLogin() {
        const pass = document.getElementById('admin-pass-input').value;
        const err = document.getElementById('login-error');
        err.style.display = 'none';

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pass })
            });

            if (res.ok) {
                const data = await res.json();
                authToken = data.token;
                localStorage.setItem('vidcloud_admin_token', authToken);
                document.getElementById('login-modal').style.display = 'none';
                document.getElementById('dashboard-view').style.display = 'block';
                loadAdminState();
            } else {
                err.style.display = 'block';
            }
        } catch (e) {
            err.textContent = 'Server connection error';
            err.style.display = 'block';
        }
    }

    function logout() {
        localStorage.removeItem('vidcloud_admin_token');
        location.reload();
    }

    async function loadAdminState() {
        if (!authToken) return;
        try {
            const res = await fetch('/api/admin/state', {
                headers: { 'Authorization': 'Bearer ' + authToken }
            });
            if (res.status === 401) {
                logout();
                return;
            }
            const data = await res.json();
            renderState(data);
        } catch (e) {
            console.error('Failed to load admin state', e);
        }
    }

    function renderState(state) {
        if (!state) return;
        const cfg = state.config || {};
        const tel = state.telemetry || {};

        document.getElementById('stat-streams').textContent = (tel.totalStreams || 0).toLocaleString();
        document.getElementById('stat-bandwidth').textContent = (tel.totalBandwidthMB || 0).toLocaleString() + ' MB';
        document.getElementById('stat-blocked').textContent = (tel.blockedRequests || 0).toLocaleString();
        document.getElementById('stat-uptime').textContent = Math.floor((tel.uptimeSeconds || 0) / 60) + ' min';

        if (cfg.servers?.primary) {
            document.getElementById('cfg-primary-server').value = String(cfg.servers.primary);
        }
        if (cfg.firewall?.mode) {
            document.getElementById('cfg-firewall-mode').value = cfg.firewall.mode;
        }
        document.getElementById('cfg-turnstile-toggle').value = cfg.firewall?.turnstileEnabled ? 'true' : 'false';
        document.getElementById('cfg-ads-enabled').value = cfg.monetization?.adsEnabled ? 'true' : 'false';
        document.getElementById('cfg-popunder-tag').value = cfg.monetization?.popunderUrl || '';
    }

    async function saveServerRouting() {
        const primary = parseInt(document.getElementById('cfg-primary-server').value, 10);
        await postConfig({ servers: { primary } });
    }

    async function saveFirewallConfig() {
        const mode = document.getElementById('cfg-firewall-mode').value;
        const turnstileEnabled = document.getElementById('cfg-turnstile-toggle').value === 'true';
        await postConfig({ firewall: { mode, turnstileEnabled } });
    }

    async function saveMonetization() {
        const adsEnabled = document.getElementById('cfg-ads-enabled').value === 'true';
        const popunderUrl = document.getElementById('cfg-popunder-tag').value;
        await postConfig({ monetization: { adsEnabled, popunderUrl } });
    }

    async function postConfig(patch) {
        try {
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify(patch)
            });
            if (res.ok) {
                showToast();
                loadAdminState();
            }
        } catch (e) {
            alert('Failed to update config: ' + e.message);
        }
    }

    // Auto-check session on load
    if (authToken) {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('dashboard-view').style.display = 'block';
        loadAdminState();
    }
    </script>
</body>
</html>`;
}
