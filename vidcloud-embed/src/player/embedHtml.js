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


        /* Sandbox Warning Overlay */
        .vc-sandbox-overlay {
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
        .vc-sandbox-overlay.vc-hidden {
            display: none !important;
        }
        .vc-sandbox-content {
            max-width: 480px;
            background: #15161e;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            padding: 24px 28px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
        }
        .vc-sandbox-msg {
            font-size: 15px;
            color: #f1f5f9;
            line-height: 1.6;
            font-weight: 500;
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

        <!-- Sandbox Shield Overlay -->
        <div id="vc-sandbox-overlay" class="vc-sandbox-overlay vc-hidden">
            <div class="vc-sandbox-content">
                <div class="vc-sandbox-msg">Please remove sandbox from embed code. Sandbox is not allowed.</div>
            </div>
        </div>
    </div>

    <script>
    (function() {
        var iframe = document.getElementById('vidcloud-core-player');
        var container = document.getElementById('vc-player-container');

        /* ── Deep Iframe Sandbox Detector & Anti-Leech Protection ── */
        var isSandboxRestricted = false;

        function triggerSandboxBlock(reason) {
            if (isSandboxRestricted) return;
            isSandboxRestricted = true;
            console.warn('[VidCloud Security] Sandbox restriction detected:', reason);

            // Kill the player iframe to prevent wasted requests
            try {
                if (iframe) {
                    iframe.src = 'about:blank';
                }
            } catch(e) {}

            // Show the sandbox overlay
            var overlay = document.getElementById('vc-sandbox-overlay');
            if (overlay) {
                overlay.classList.remove('vc-hidden');
            }

            // Report to beacon
            try {
                var bUrl = new URL('/api/beacon', window.location.origin);
                bUrl.searchParams.set('d', 'sandbox:' + reason);
                bUrl.searchParams.set('id', '${escapeHtml(id || '')}');
                bUrl.searchParams.set('sb', reason);
                if (navigator.sendBeacon) {
                    navigator.sendBeacon(bUrl.toString());
                } else {
                    fetch(bUrl.toString(), { method: 'POST', keepalive: true }).catch(function(){});
                }
            } catch(e) {}
        }

        window.__triggerSandboxBlock = triggerSandboxBlock;

        function initSandboxDetector() {
            // Only enforce if running inside an iframe
            try {
                if (window.top === window) return;
            } catch(e) {
                // If checking window.top throws SecurityError, frame is isolated
            }

            // 1. Direct sandbox attribute check — ANY sandbox attribute = block
            try {
                if (window.frameElement && window.frameElement.hasAttribute('sandbox')) {
                    triggerSandboxBlock('frame-has-sandbox');
                    return;
                }
            } catch(e) {}

            // 2. Opaque Origin probe
            try {
                if (window.origin === 'null' || (document && document.origin === 'null')) {
                    triggerSandboxBlock('opaque-origin');
                    return;
                }
            } catch(e) {}

            // 3. Storage probe (blocked by sandbox without allow-same-origin)
            try {
                var testKey = '__vc_sb__';
                window.localStorage.setItem(testKey, '1');
                window.localStorage.removeItem(testKey);
            } catch(e) {
                if (e && (e.name === 'SecurityError' || String(e.message).toLowerCase().indexOf('access is denied') !== -1)) {
                    triggerSandboxBlock('storage-blocked');
                    return;
                }
            }

            // 4. Monkey-patch window.open to trap popup blocking by sandbox="... without allow-popups"
            try {
                var rawOpen = window.open;
                window.open = function() {
                    try {
                        return rawOpen.apply(window, arguments);
                    } catch(err) {
                        if (err && (String(err.message).toLowerCase().indexOf('sandbox') !== -1 || String(err.message).toLowerCase().indexOf('allow-popups') !== -1)) {
                            triggerSandboxBlock('missing-allow-popups');
                        }
                        throw err;
                    }
                };
            } catch(e) {}

            // 5. Probe popup permission on initial user interaction (click / pointerdown)
            var interactionChecked = false;
            function testPopupPermission(evt) {
                if (interactionChecked || isSandboxRestricted) return;
                interactionChecked = true;
                try {
                    var testWin = window.open('about:blank', '_blank');
                    if (testWin) {
                        testWin.close();
                    }
                } catch(err) {
                    if (err && (String(err.message).toLowerCase().indexOf('sandbox') !== -1 || String(err.message).toLowerCase().indexOf('allow-popups') !== -1 || err.name === 'SecurityError')) {
                        triggerSandboxBlock('missing-allow-popups');
                        if (evt && evt.preventDefault) evt.preventDefault();
                        if (evt && evt.stopPropagation) evt.stopPropagation();
                    }
                }
            }

            document.addEventListener('pointerdown', testPopupPermission, { capture: true, once: true });
            document.addEventListener('click', testPopupPermission, { capture: true, once: true });
        }

        initSandboxDetector();

        // ── Bidirectional postMessage Bridge ──
        // A. Listen to events from player.anixo.online (child iframe)
        window.addEventListener('message', function(event) {
            if (!event.data) return;

            var isJWPlayer = event.data.source === 'jwplayer' || 
                               event.data.type === 'ready' || 
                               event.data.type === 'play' || 
                               event.data.type === 'pause' || 
                               event.data.type === 'timeupdate' || 
                               event.data.type === 'ended' ||
                               event.data.type === 'error';

            if (isJWPlayer) {
                // Relay up to parent window
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage(
                        Object.assign({}, event.data, { provider: 'vidcloud.sbs' }),
                        '*'
                    );
                }
            }
        });

        // B. Listen to commands from parent and forward to player.anixo.online
        window.addEventListener('message', function(event) {
            if (!event.data) return;
            var action = event.data.event || event.data.action || event.data.type;
            var validActions = ['play', 'pause', 'togglePlay', 'seek', 'skip', 'setVolume', 'mute', 'setPlaybackRate'];

            if (validActions.indexOf(action) !== -1) {
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage(event.data, '*');
                }
            }
        });

        // ── Client Referrer Beacon (Unmasker & Discovery) ──
        try {
            var beaconUrl = '/api/beacon?id=' + encodeURIComponent("${escapeHtml(id || '')}") + '&d=' + encodeURIComponent(
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
