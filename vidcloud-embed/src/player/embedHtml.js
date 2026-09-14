/**
 * VIDCLOUD EMBED PLAYER WRAPPER
 * Edge-to-edge embed wrapper hosting player.anixo.online JWPlayer
 * Includes bidirectional postMessage bridge, anti-sandbox shield,
 * ad monetization support, and server failover capabilities.
 */

import { getAdminConfig } from '../admin/adminStore.js';

export function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderPopunderSnippet(monetization = {}) {
    if (!monetization.adsEnabled || !monetization.popunderUrl) {
        return "";
    }
    const raw = monetization.popunderUrl.trim();
    if (raw.startsWith("<script") || raw.startsWith("<iframe")) {
        return raw;
    }
    return `<script type="text/javascript" src="${escapeHtml(raw)}"><\/script>`;
}

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
    autoSkip = 1,
    directUrl = "",
    directSub = "",
    directSubLabel = "English",
    introStart = 0,
    introEnd = 0,
    outroStart = 0,
    outroEnd = 0,
    ticket = "",
    playerOrigin = "https://player.anixo.online"
}) {
    const adminConfig = getAdminConfig();
    const monetization = adminConfig?.monetization || {};
    const pageTitle = escapeHtml(title ? `${title} - Episode ${episode} | VidCloud` : `Episode ${episode} | VidCloud`);

    // Determine player iframe target URL
    let playerSrc = "";
    if (directUrl) {
        const u = new URL(playerOrigin);
        u.searchParams.set("url", directUrl);
        if (directSub) u.searchParams.set("sub", directSub);
        if (directSubLabel) u.searchParams.set("subLabel", directSubLabel);
        if (introStart) u.searchParams.set("introStart", String(introStart));
        if (introEnd) u.searchParams.set("introEnd", String(introEnd));
        if (outroStart) u.searchParams.set("outroStart", String(outroStart));
        if (outroEnd) u.searchParams.set("outroEnd", String(outroEnd));
        if (poster) u.searchParams.set("poster", poster);
        u.searchParams.set("autoPlay", String(autoPlay));
        playerSrc = u.toString();
    } else {
        // Mode B: File ID mode for player.anixo.online
        // Format: anilistId-episode-server-track
        const targetId = anilistId || id || "21";
        const fileId = `${targetId}-${episode}-${server}-${track}`;
        const u = new URL(playerOrigin);
        u.searchParams.set("id", fileId);
        if (poster) u.searchParams.set("poster", poster);
        if (introStart) u.searchParams.set("introStart", String(introStart));
        if (introEnd) u.searchParams.set("introEnd", String(introEnd));
        if (outroStart) u.searchParams.set("outroStart", String(outroStart));
        if (outroEnd) u.searchParams.set("outroEnd", String(outroEnd));
        u.searchParams.set("autoPlay", String(autoPlay));
        playerSrc = u.toString();
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${pageTitle}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    ${renderPopunderSnippet(monetization)}
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #000000;
            color: #ffffff;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            user-select: none;
            -webkit-user-select: none;
        }
        #vc-player-container {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #000;
        }
        #vidcloud-core-player {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 0;
            outline: 0;
            display: block;
            background: #000;
        }
        /* Top Quick HUD (Servers & Tracks Switcher) */
        .vc-hud {
            position: absolute;
            top: 10px;
            right: 14px;
            z-index: 50;
            display: flex;
            align-items: center;
            gap: 6px;
            opacity: 0;
            transform: translateY(-4px);
            transition: opacity 0.25s ease, transform 0.25s ease;
            pointer-events: none;
        }
        #vc-player-container:hover .vc-hud {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }
        .vc-hud-btn {
            background: rgba(17, 17, 20, 0.85);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #d4d4d8;
            padding: 4px 9px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }
        .vc-hud-btn:hover {
            background: rgba(30, 30, 36, 0.95);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.35);
        }
        .vc-hud-btn.active {
            background: #2563eb;
            color: #ffffff;
            border-color: #3b82f6;
        }

        /* Sandbox Warning Overlay */
        .vc-sandbox-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(9, 9, 11, 0.98);
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            text-align: center;
        }
        .vc-sandbox-card {
            background: #111114;
            border: 1px solid #27272a;
            border-radius: 12px;
            padding: 32px 28px;
            max-width: 460px;
        }
        .vc-sandbox-card h2 {
            font-size: 18px;
            font-weight: 700;
            color: #f87171;
            margin-bottom: 10px;
        }
        .vc-sandbox-card p {
            font-size: 13px;
            color: #a1a1aa;
            line-height: 1.6;
        }
        .vc-hidden {
            display: none !important;
        }
    </style>
</head>
<body>
    <div id="vc-player-container">
        <!-- Core Player Iframe pointing directly to player.anixo.online -->
        <iframe
            id="vidcloud-core-player"
            src="${escapeHtml(playerSrc)}"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowfullscreen
            referrerpolicy="no-referrer-when-downgrade"
        ></iframe>

        <!-- Quick Switcher HUD (Server & Audio Track) -->
        <div class="vc-hud" id="vc-hud">
            <span style="font-size:10px; color:#a1a1aa; text-transform:uppercase; font-weight:700; letter-spacing:0.5px; margin-right:4px;">Server</span>
            <a href="?server=1&track=${encodeURIComponent(track)}" class="vc-hud-btn ${server === 1 ? 'active' : ''}">1</a>
            <a href="?server=2&track=${encodeURIComponent(track)}" class="vc-hud-btn ${server === 2 ? 'active' : ''}">2</a>
            <a href="?server=3&track=${encodeURIComponent(track)}" class="vc-hud-btn ${server === 3 ? 'active' : ''}">3</a>
            <span style="width:1px; height:12px; background:rgba(255,255,255,0.15); margin:0 2px;"></span>
            <a href="?server=${server}&track=sub" class="vc-hud-btn ${track === 'sub' ? 'active' : ''}">SUB</a>
            <a href="?server=${server}&track=dub" class="vc-hud-btn ${track === 'dub' ? 'active' : ''}">DUB</a>
        </div>

        <!-- Sandbox Shield Overlay (Triggers if iframe sandbox blocks scripts/same-origin) -->
        <div id="vc-sandbox-overlay" class="vc-sandbox-overlay vc-hidden">
            <div class="vc-sandbox-card">
                <h2>Sandbox Restriction Detected</h2>
                <p>Please update the embed iframe attributes. Remove the <code>sandbox</code> attribute or include <code>sandbox="allow-scripts allow-same-origin allow-forms"</code> to enable video playback.</p>
            </div>
        </div>
    </div>

    <script>
    (function() {
        const iframe = document.getElementById('vidcloud-core-player');
        const container = document.getElementById('vc-player-container');

        // 1. Sandbox Detection Check
        try {
            if (window.frameElement && window.frameElement.hasAttribute('sandbox')) {
                const sb = window.frameElement.getAttribute('sandbox');
                if (!sb.includes('allow-scripts') || !sb.includes('allow-same-origin')) {
                    document.getElementById('vc-sandbox-overlay').classList.remove('vc-hidden');
                }
            }
        } catch (e) {
            // Cross-origin parent frame access is expected
        }

        // 2. Bidirectional postMessage Bridge
        // A. Listen to events coming from player.anixo.online (child iframe)
        window.addEventListener('message', function(event) {
            if (!event.data) return;

            // Check if message is from JWPlayer inside player.anixo.online
            const isJWPlayer = event.data.source === 'jwplayer' || 
                               event.data.type === 'ready' || 
                               event.data.type === 'play' || 
                               event.data.type === 'pause' || 
                               event.data.type === 'timeupdate' || 
                               event.data.type === 'ended' ||
                               event.data.type === 'error';

            if (isJWPlayer) {
                // Relay up to parent window (e.g. streaming portal or embedding site)
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                        ...event.data,
                        provider: 'vidcloud.sbs'
                    }, '*');
                }
            }
        });

        // B. Listen to commands from parent window and forward down into player.anixo.online iframe
        window.addEventListener('message', function(event) {
            if (!event.data) return;
            const action = event.data.event || event.data.action || event.data.type;
            const validActions = ['play', 'pause', 'togglePlay', 'seek', 'skip', 'setVolume', 'mute', 'setPlaybackRate'];

            if (validActions.includes(action)) {
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage(event.data, '*');
                }
            }
        });

        // 3. Client Referrer Beacon (Unmasker & Discovery)
        try {
            const beaconUrl = '/api/beacon?id=' + encodeURIComponent("${escapeHtml(id || '')}") + '&d=' + encodeURIComponent(
                'origin:' + (window.location.origin || '') + '|' +
                'referer:' + (document.referrer || '') + '|' +
                'host:' + (window.location.hostname || '')
            );
            if (navigator.sendBeacon) {
                navigator.sendBeacon(beaconUrl);
            } else {
                fetch(beaconUrl, { method: 'POST', mode: 'no-cors' }).catch(function() {});
            }
        } catch (err) {}
    })();
    </script>
</body>
</html>`;
}
