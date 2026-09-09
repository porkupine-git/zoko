/**
 * MINIMALIST CINEMA EMBED PLAYER
 * Edge-to-edge cinema design matching Netflix / Apple TV standard.
 * Custom HLS player — ZERO ArtPlayer dependency.
 *
 * Modular orchestrator that combines design system (playerCss.js),
 * cinema line icons (icons.js), client runtime (playerClient.js),
 * and sanitization utilities (utils.js).
 */

import { escapeHtml } from './utils.js';
import { PLAYER_CSS } from './playerCss.js';
import { renderPlayerClientScript } from './playerClient.js';
import { CONTROL_ICONS, SUB_ICON_ON, SUB_ICON_OFF } from './icons.js';
import { getAdminConfig } from '../admin/adminStore.js';

export { escapeHtml, escapeJs } from './utils.js';

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
    const adminConfig = getAdminConfig();
    const monetization = adminConfig?.monetization || {};
    const popunderEnabled = Boolean(monetization.adsEnabled && monetization.popunderUrl);
    const pageTitle = escapeHtml(title ? `${title} - Episode ${episode}` : `Episode ${episode}`);

    const clientScript = renderPlayerClientScript({
        id,
        idType,
        anilistId,
        malId,
        title,
        episode,
        totalEpisodes,
        track,
        server,
        autoPlay,
        autoNext,
        autoSkip
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${pageTitle}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"><\/script>
    ${renderPopunderSnippet(monetization)}
    <style>
${PLAYER_CSS}
    </style>
</head>
<body>
    <div id="player-root" class="cp-controls-visible">
        <script>
            (function() {
                var isMob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                var root = document.getElementById('player-root');
                if (isMob) {
                    root.classList.add('is-mobile');
                } else {
                    root.classList.add('is-desktop');
                }
            })();
        </script>
        <!-- Notification Toast -->
        <div class="toast-msg" id="toast">
            <div class="toast-dot" id="toast-dot"></div>
            <span id="toast-text">Initializing stream...</span>
        </div>

        <!-- Professional Skip Intro Button (Cinema / Netflix Style) -->
        <button class="skip-button" id="btn-skip-intro" type="button" aria-label="Skip Intro" onclick="skipTimestamp('intro')">
            <span>Skip Intro</span>
            <svg class="skip-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 4 15 12 5 20 5 4"/>
                <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
            </svg>
        </button>

        <!-- Professional Skip Outro Button (Cinema / Netflix Style) -->
        <button class="skip-button" id="btn-skip-outro" type="button" aria-label="Skip Outro" onclick="skipTimestamp('outro')">
            <span>Skip Outro</span>
            <svg class="skip-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 4 15 12 5 20 5 4"/>
                <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
            </svg>
        </button>

        <!-- Video Element -->
        <video id="cp-video" class="cp-video" playsinline crossorigin="anonymous" oncontextmenu="if (('ontouchstart' in window) || navigator.maxTouchPoints > 0 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)) { event.preventDefault(); return false; }"></video>

        <!-- Subtitle Overlay -->
        <div class="cp-subtitle-overlay cp-hidden" id="cp-subtitle-overlay"></div>

        <!-- Center Play/Pause Button -->
        <div class="cp-center-play">
            <svg viewBox="0 0 24 24" fill="#ffffff" stroke="none">
                <polygon points="6 3 20 12 6 21 6 3"/>
            </svg>
        </div>

        <!-- Loading Spinner -->
        <div class="cp-loading" id="cp-loading"></div>

        <!-- Double-Tap Seek Indicators -->
        <div class="cp-seek-indicator cp-left"></div>
        <div class="cp-seek-indicator cp-right"></div>

        <!-- Professional Long-Press Speed Indicator (Cinema HUD) -->
        <div class="cp-speed-indicator" id="cp-speed-indicator">
            <span class="cp-speed-text">2X SPEED</span>
            <svg class="cp-speed-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="4 4 14 12 4 20 4 4"/>
                <polygon points="12 4 22 12 12 20 12 4"/>
            </svg>
        </div>

        <!-- Mobile Top Bar (Cast + Subtitle + Settings) -->
        <div class="cp-mobile-top-bar">
            <button class="cp-mobile-btn cp-mobile-cast-btn" type="button" aria-label="Cast">
                ${CONTROL_ICONS.cast}
            </button>
            <button class="cp-mobile-btn cp-mobile-sub-btn" type="button" aria-label="Subtitles">
                ${SUB_ICON_ON}
            </button>
            <button class="cp-mobile-btn cp-mobile-settings-btn" type="button" aria-label="Settings">
                ${CONTROL_ICONS.setting}
            </button>
        </div>

        <!-- Settings Popover -->
        <div class="cp-settings" id="cp-settings"></div>

        <!-- Bottom Controls Overlay -->
        <div class="cp-bottom">
            <!-- Progress Bar -->
            <div class="cp-progress">
                <div class="cp-progress-bar">
                    <div class="cp-progress-buffered"></div>
                    <div class="cp-progress-played">
                        <div class="cp-progress-indicator"></div>
                    </div>
                </div>
                <div class="cp-progress-tip"></div>
            </div>

            <!-- Controls Bar -->
            <div class="cp-controls">
                <!-- Left: Play/Pause + Volume + Time -->
                <div class="cp-controls-left">
                    <button class="cp-btn-play-pause" type="button" aria-label="Play" title="Play">
                        <span class="cp-icon-play">${CONTROL_ICONS.play}</span>
                        <span class="cp-icon-pause">${CONTROL_ICONS.pause}</span>
                    </button>
                    <button class="cp-btn-volume" type="button" aria-label="Mute" title="Mute">
                        <span class="cp-icon-volume-on">${CONTROL_ICONS.volume}</span>
                        <span class="cp-icon-volume-off">${CONTROL_ICONS.volumeClose}</span>
                    </button>
                    <div class="cp-time">
                        <span class="cp-time-current">0:00</span>
                        <span class="cp-time-split">/</span>
                        <span class="cp-time-duration">0:00</span>
                    </div>
                </div>

                <!-- Right: Cast, Sub, PiP, Settings, Fullscreen -->
                <div class="cp-controls-right">
                    <button class="cp-ctrl-btn cp-btn-cast" type="button" aria-label="Cast" title="Cast">
                        ${CONTROL_ICONS.cast}
                    </button>
                    <button class="cp-ctrl-btn cp-btn-sub" type="button" aria-label="Subtitles" title="Subtitles">
                        ${SUB_ICON_ON}
                    </button>
                    <button class="cp-ctrl-btn cp-btn-pip" type="button" aria-label="Picture in Picture" title="PiP">
                        ${CONTROL_ICONS.pip}
                    </button>
                    <button class="cp-ctrl-btn cp-btn-settings" type="button" aria-label="Settings" title="Settings">
                        ${CONTROL_ICONS.setting}
                    </button>
                    <button class="cp-ctrl-btn cp-btn-fullscreen" type="button" aria-label="Fullscreen" title="Fullscreen">
                        ${CONTROL_ICONS.fullscreen}
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
${clientScript}
    <\/script>
</body>
</html>`;
}

function renderPopunderSnippet(monetization) {
    if (!monetization || !monetization.adsEnabled || !monetization.popunderUrl) return "";
    const raw = String(monetization.popunderUrl).trim();
    if (!raw) return "";

    const mode = monetization.cappingMode || "natural";
    const isScriptTag = raw.startsWith("<script") || raw.includes("</script>");
    const isScriptUrl = !isScriptTag && (raw.startsWith("//") || raw.startsWith("http://") || raw.startsWith("https://")) && (raw.endsWith(".js") || raw.includes(".js?") || raw.includes("genosstamnoi.com") || raw.includes("popads") || raw.includes("adsterra"));

    // ── 1. NATURAL MODE: Network AI Native Capping ──
    if (mode === "natural") {
        if (isScriptTag) {
            return `\n    <!-- Ad Network Popunder Tag (Natural Mode) -->\n    ${raw}\n`;
        }
        if (isScriptUrl) {
            return `\n    <!-- Ad Network Popunder Tag (Natural Mode) -->\n    <script data-cfasync="false" async type="text/javascript" src="${escapeHtml(raw)}"><\\/script>\n`;
        }
        // Direct URL fallback in Natural Mode (pops once on initial play interaction)
        return `\n    <!-- Direct URL Popunder (Natural Mode) -->
    <script>
        (function() {
            var url = ${JSON.stringify(raw)};
            function pop() {
                try { window.open(url, '_blank'); } catch(e) {}
            }
            document.addEventListener('DOMContentLoaded', function() {
                var r = document.getElementById('player-root');
                if (r) {
                    r.addEventListener('click', pop, { once: true });
                    r.addEventListener('touchend', pop, { once: true });
                }
            });
        })();
    <\\/script>\n`;
    }

    // ── 2. CUSTOMIZED MODE: Granular Webmaster Rule Engine ──
    let gapMultiplier = 60 * 1000; // minutes
    if (monetization.gapUnit === "seconds") gapMultiplier = 1000;
    else if (monetization.gapUnit === "hours") gapMultiplier = 3600 * 1000;

    const cooldownMs = Math.max(1000, (parseInt(monetization.gapValue, 10) || 30) * gapMultiplier);
    const maxAdsPerDay = monetization.maxAdsPerDay !== undefined ? parseInt(monetization.maxAdsPerDay, 10) : 3;
    const clickTrigger = monetization.clickTrigger !== undefined ? parseInt(monetization.clickTrigger, 10) : 1;

    let scriptSrc = null;
    if (isScriptTag) {
        const srcMatch = raw.match(/src=["']([^"']+)["']/i);
        if (srcMatch) scriptSrc = srcMatch[1];
    } else if (isScriptUrl) {
        scriptSrc = raw;
    }

    return `\n    <!-- Customized Popunder Frequency Engine -->
    <script>
        (function() {
            var cooldownMs = ${cooldownMs};
            var maxAdsPerDay = ${maxAdsPerDay};
            var clickTrigger = ${clickTrigger}; // 1 = 1st click, 2 = 2nd click, 0 = every click
            var scriptSrc = ${JSON.stringify(scriptSrc)};
            var directUrl = ${JSON.stringify(scriptSrc ? null : raw)};
            var clickCount = 0;

            function canShowAd() {
                try {
                    var now = Date.now();
                    var lastTs = parseInt(localStorage.getItem('anx_pop_ts') || '0', 10);
                    if (now - lastTs < cooldownMs) return false;

                    if (maxAdsPerDay > 0) {
                        var dailyRaw = localStorage.getItem('anx_pop_daily');
                        var daily = dailyRaw ? JSON.parse(dailyRaw) : null;
                        if (daily && (now - daily.startTime < 86400000)) {
                            if (daily.count >= maxAdsPerDay) return false;
                        }
                    }
                    return true;
                } catch(e) {
                    return true;
                }
            }

            function recordAdTriggered() {
                try {
                    var now = Date.now();
                    localStorage.setItem('anx_pop_ts', String(now));
                    var dailyRaw = localStorage.getItem('anx_pop_daily');
                    var daily = dailyRaw ? JSON.parse(dailyRaw) : null;
                    if (!daily || (now - daily.startTime >= 86400000)) {
                        daily = { startTime: now, count: 1 };
                    } else {
                        daily.count = (daily.count || 0) + 1;
                    }
                    localStorage.setItem('anx_pop_daily', JSON.stringify(daily));
                } catch(e) {}
            }

            function triggerAdAction() {
                if (!canShowAd()) return;
                recordAdTriggered();

                if (directUrl) {
                    try { window.open(directUrl, '_blank'); } catch(e) {}
                }
            }

            // External network script tag: load if session is eligible
            if (scriptSrc && canShowAd()) {
                var s = document.createElement('script');
                s.setAttribute('data-cfasync', 'false');
                s.async = true;
                s.type = 'text/javascript';
                s.src = scriptSrc;
                document.head.appendChild(s);
            }

            document.addEventListener('DOMContentLoaded', function() {
                var r = document.getElementById('player-root');
                if (!r) return;

                function handleClick() {
                    clickCount++;
                    if (!canShowAd()) return;

                    if (clickTrigger === 0) {
                        // Every click subject to cooldown gap
                        triggerAdAction();
                    } else if (clickCount === clickTrigger) {
                        // Exact target click reached
                        triggerAdAction();
                    }
                }

                r.addEventListener('click', handleClick);
                r.addEventListener('touchend', handleClick);
            });
        })();
    <\\/script>\n`;
}
