/**
 * JW PLAYER 8 EMBED ENGINE
 * Ultra-fast, authentic JW Player 8 embed implementation for Anixo.
 * Features custom cinema dark skin, AniSkip intro/outro integration,
 * 10s rewind/forward buttons, parent postMessage bridge, and player switcher.
 */

import { escapeHtml, escapeJs } from './utils.js';
import { getAdminConfig } from '../admin/adminStore.js';

function renderPopunderSnippet(monetization = {}) {
    if (!monetization.adsEnabled || !monetization.popunderUrl) return '';
    const raw = String(monetization.popunderUrl).trim();
    if (!raw) return '';
    if (raw.startsWith('<script') || raw.startsWith('<iframe')) {
        return raw;
    }
    return `<script type="text/javascript" src="${escapeHtml(raw)}"><\/script>`;
}

export function renderJwPlayerHtml({
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
    ticket = ""
}) {
    const adminConfig = getAdminConfig();
    const monetization = adminConfig?.monetization || {};
    const pageTitle = escapeHtml(title ? `${title} - Episode ${episode} | JW Player` : `Episode ${episode} | JW Player`);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${pageTitle}</title>
    <link rel="preconnect" href="https://player.anixo.online">
    ${renderPopunderSnippet(monetization)}
    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #000000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        .anixo-player-wrapper {
            width: 100% !important;
            height: 100% !important;
            position: relative;
            background: #000;
        }
        #jwplayer-container {
            width: 100% !important;
            height: 100% !important;
        }
        .jwplayer {
            width: 100% !important;
            height: 100% !important;
        }
        .jw-rightclick {
            display: none !important;
        }
        /* Hide default left rewind button */
        .jw-controlbar .jw-icon-rewind,
        .jw-display-icon-rewind {
            display: none !important;
        }
        /* Invisible controlbar backdrop */
        .jw-controls-backdrop {
            display: none !important;
            background: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
        }
        .jw-controlbar,
        .jw-controlbar-left,
        .jw-controlbar-right,
        .jw-controlbar-center,
        .jw-background-color {
            background: transparent !important;
            background-color: transparent !important;
            background-image: none !important;
            box-shadow: none !important;
        }
        /* Crisp Solid White Controls */
        .jw-controlbar .jw-icon,
        .jw-controlbar .jw-button-color {
            color: #ffffff !important;
            fill: #ffffff !important;
            opacity: 0.9;
            filter: none !important;
            transition: opacity 0.15s ease, color 0.15s ease, transform 0.15s ease;
        }
        .jw-controlbar .jw-svg-icon,
        .jw-controlbar svg {
            color: #ffffff !important;
            fill: #ffffff !important;
            filter: none !important;
            transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .jw-controlbar .jw-icon:hover,
        .jw-controlbar .jw-button-color:hover {
            opacity: 1 !important;
        }
        .jw-controlbar .jw-icon:hover .jw-svg-icon,
        .jw-controlbar .jw-icon:hover svg,
        .jw-controlbar .jw-button-color:hover svg {
            transform: scale(1.15);
            opacity: 1 !important;
        }

        /* 10s Rewind & Forward Button Sizing */
        [button="custom-rewind-10"] .jw-svg-icon,
        [button="custom-forward-10"] .jw-svg-icon,
        [button="custom-switch-cinema"] .jw-svg-icon,
        .jw-svg-icon-rewind,
        .jw-svg-icon-forward {
            width: 27px !important;
            height: 27px !important;
            transition: transform 0.15s ease, opacity 0.15s ease;
        }
        [button="custom-rewind-10"]:hover .jw-svg-icon,
        [button="custom-forward-10"]:hover .jw-svg-icon,
        [button="custom-switch-cinema"]:hover .jw-svg-icon {
            transform: scale(1.15) !important;
        }

        /* Seekbar styling (authentic teal/cyan accent) */
        .jw-slider-time .jw-progress {
            background-color: #008da7 !important;
            opacity: 1 !important;
        }
        .jw-slider-time .jw-knob {
            background-color: #ffffff !important;
            border-radius: 50% !important;
            box-shadow: 0 0 6px rgba(0, 0, 0, 0.7) !important;
            opacity: 1 !important;
        }
        .jw-slider-time .jw-buffer {
            background-color: rgba(255, 255, 255, 0.35) !important;
            opacity: 1 !important;
        }
        .jw-slider-time .jw-rail {
            background-color: rgba(255, 255, 255, 0.22) !important;
            opacity: 1 !important;
        }

        /* Yellow Seekbar Markers (AniSkip Intro/Outro) */
        .jw-slider-container .jw-intro-marker,
        .jw-slider-container .jw-outro-marker {
            position: absolute;
            height: 4px;
            top: calc(50% - 2px);
            background: #facc15 !important;
            border-radius: 1px;
            z-index: 4;
            pointer-events: none;
            opacity: 0.95;
        }
        .jw-slider-time:hover .jw-intro-marker,
        .jw-slider-time:hover .jw-outro-marker {
            height: 6px;
            top: calc(50% - 3px);
        }

        /* Floating Skip Intro / Outro Button */
        .botright {
            position: absolute !important;
            z-index: 2147483647 !important;
            bottom: 78px;
            right: 24px;
            display: flex;
            pointer-events: auto;
        }
        .jwplayer.jw-flag-fullscreen .botright,
        :fullscreen .botright,
        :-webkit-full-screen .botright {
            position: absolute !important;
            z-index: 2147483647 !important;
            bottom: 84px !important;
            right: 32px !important;
            display: flex;
        }
        .jwplayer.jw-flag-fullscreen.jw-flag-user-inactive .botright {
            bottom: 40px !important;
            transition: bottom 0.25s ease !important;
        }
        .botright .zbtn {
            background: rgba(0, 0, 0, 0.7) !important;
            color: #ffffff !important;
            border: 2px solid #ffffff !important;
            border-radius: 6px !important;
            padding: 8px 18px !important;
            font-size: 14px !important;
            font-weight: 700 !important;
            font-family: inherit !important;
            cursor: pointer !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            outline: none !important;
            line-height: 1.2 !important;
            letter-spacing: 0.3px !important;
            text-shadow: 0 0 5px rgba(0, 0, 0, 0.95), 0 0 2px #000 !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4) !important;
            transition: background-color 0.15s ease, transform 0.1s ease !important;
            user-select: none !important;
        }
        .botright .zbtn:hover {
            background: rgba(255, 255, 255, 0.25) !important;
        }
        .botright .zbtn:active {
            transform: scale(0.96);
        }

        /* Loading Spinner Overlay */
        .loading-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #000000;
            z-index: 100;
            transition: opacity 0.3s ease;
        }
        .spinner {
            width: 44px;
            height: 44px;
            border: 3.5px solid rgba(255, 255, 255, 0.18);
            border-top-color: #008da7;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Error Overlay */
        .error-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #09090b;
            color: #ffffff;
            z-index: 101;
            padding: 20px;
            text-align: center;
        }
        .error-box {
            max-width: 440px;
            background: #111114;
            border: 1px solid #232328;
            border-radius: 12px;
            padding: 28px 24px;
        }
        .error-title {
            font-size: 18px;
            font-weight: 700;
            color: #ef4444;
            margin-bottom: 8px;
        }
        .error-desc {
            font-size: 13.5px;
            color: #a1a1aa;
            line-height: 1.5;
            margin-bottom: 16px;
        }
        .error-btn {
            background: #2563eb;
            color: #ffffff;
            border: none;
            padding: 8px 18px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s ease;
        }
        .error-btn:hover { background: #1d4ed8; }
    </style>
</head>
<body>

<div class="anixo-player-wrapper">
    <!-- JW Player Target Container -->
    <div id="jwplayer-container"></div>

    <!-- Fast Loading Spinner -->
    <div class="loading-overlay" id="loading-overlay">
        <div class="spinner"></div>
    </div>

    <!-- Clean Error Overlay -->
    <div class="error-overlay" id="error-overlay">
        <div class="error-box">
            <div class="error-title">Stream Offline</div>
            <div class="error-desc" id="error-desc">Unable to connect to the video streaming cluster. Please try again or switch server.</div>
            <button class="error-btn" onclick="window.location.reload()">Retry Stream</button>
        </div>
    </div>

    <!-- AniSkip Floating Overlay Button -->
    <div class="botright" id="aniskip-container" style="display:none;">
        <button class="zbtn" id="aniskip-btn">
            <span id="aniskip-text">Skip Intro</span>
        </button>
    </div>
</div>

<!-- JW Player 8 Global Edge Assets -->
<script src="https://player.anixo.online/js/jwplayer/jwplayer.core.controls.js"></script>
<script src="https://player.anixo.online/js/jwplayer/jwplayer.js"></script>

<script>
(async function initJWPlayerEngine() {
    const loadingOverlay = document.getElementById("loading-overlay");
    const errorOverlay = document.getElementById("error-overlay");
    const errorDesc = document.getElementById("error-desc");
    const aniskipContainer = document.getElementById("aniskip-container");
    const aniskipBtn = document.getElementById("aniskip-btn");
    const aniskipText = document.getElementById("aniskip-text");

    function showError(msg) {
        if (loadingOverlay) loadingOverlay.style.display = "none";
        if (errorDesc && msg) errorDesc.textContent = msg;
        if (errorOverlay) errorOverlay.style.display = "flex";
    }

    const urlParams = new URLSearchParams(window.location.search);
    const anilistId = "${escapeJs(String(anilistId || ''))}";
    const malId = "${escapeJs(String(malId || ''))}";
    const animeTitle = "${escapeJs(title || '')}";
    const episode = parseInt(urlParams.get("ep") || urlParams.get("episode") || "${episode}", 10) || 1;
    const track = (urlParams.get("track") || "${escapeJs(track)}").toLowerCase();
    const server = parseInt(urlParams.get("server") || "${server}", 10) || 1;
    const autoPlay = ${autoPlay ? 'true' : 'false'};
    const startTime = parseFloat(urlParams.get("time")) || parseFloat(urlParams.get("t")) || 0;
    const ticket = "${escapeJs(ticket)}";

    try {
        // ── Resolve Stream via Ultra-Fast Endpoint ──
        const resolveUrl = new URL('/api/stream/resolve', window.location.origin);
        if (malId) resolveUrl.searchParams.set('malId', malId);
        if (anilistId) resolveUrl.searchParams.set('anilistId', anilistId);
        if (animeTitle) resolveUrl.searchParams.set('title', animeTitle);
        resolveUrl.searchParams.set('episode', String(episode));
        resolveUrl.searchParams.set('track', track);
        resolveUrl.searchParams.set('server', String(server));

        // Parent website discovery
        const parentHost = urlParams.get('parentHost') || urlParams.get('ref');
        if (parentHost) resolveUrl.searchParams.set('parentHost', parentHost);

        const res = await fetch(resolveUrl.toString(), {
            headers: {
                'x-embed-ticket': ticket
            }
        });

        if (!res.ok) {
            throw new Error('Streaming cluster returned HTTP ' + res.status);
        }

        const data = await res.json();
        const primaryUrl = data.streamUrl || (data.sources && data.sources[0] && (data.sources[0].file || data.sources[0]));
        if (!data || (!primaryUrl && (!data.sources || !data.sources.length))) {
            throw new Error(data?.error || 'No playable streams found for this episode.');
        }

        // Format Sources for JW Player
        let formattedSources = [];
        if (data.streamUrl) {
            formattedSources.push({
                file: data.streamUrl,
                type: 'hls',
                label: data.server || '1080p Full HD',
                default: true
            });
            if (Array.isArray(data.fallbackStreams)) {
                data.fallbackStreams.forEach(function(fb, idx) {
                    if (fb && typeof fb === 'string') {
                        formattedSources.push({
                            file: fb,
                            type: 'hls',
                            label: 'Fallback CDN ' + (idx + 1),
                            default: false
                        });
                    }
                });
            }
        } else if (Array.isArray(data.sources)) {
            formattedSources = data.sources.map(function(s, idx) {
                return {
                    file: s.file || s,
                    type: s.type || 'hls',
                    label: s.label || (idx === 0 ? '1080p Full HD' : ('Server ' + (idx + 1))),
                    default: idx === 0
                };
            });
        }

        // Format Subtitles / VTT Tracks (data.subtitles or data.tracks)
        const rawTracks = data.subtitles || data.tracks || [];
        const formattedTracks = rawTracks.map(function(t) {
            return {
                file: t.file || t.url,
                label: t.label || t.name || 'English',
                kind: t.kind || 'captions',
                default: !!t.default
            };
        });

        let intro = data.intro || { start: 0, end: 0 };
        let outro = data.outro || { start: 0, end: 0 };

        // Hide loading spinner
        if (loadingOverlay) loadingOverlay.style.display = 'none';

        // ── Setup JW Player 8 Instance ──
        const player = jwplayer("jwplayer-container").setup({
            playlist: [{
                image: "${escapeJs(poster)}" || undefined,
                sources: formattedSources,
                tracks: formattedTracks
            }],
            autostart: autoPlay,
            width: "100%",
            height: "100%",
            aspectratio: "16:9",
            stretching: "uniform",
            preload: "auto",
            playbackRateControls: true,
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
            displaydescription: false,
            displaytitle: false,
            floating: { mode: "never" },
            cast: {},
            skin: {
                controlbar: {
                    background: "transparent",
                    icons: "#ffffff",
                    iconsActive: "#008da7",
                    text: "#ffffff"
                }
            }
        });

        // ── Custom SVGs for Controlbar ──
        const rewindSvg = '<svg class="jw-svg-icon jw-svg-icon-rewind" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" focusable="false"><path d="M113.2,131.078a21.589,21.589,0,0,0-17.7-10.6,21.589,21.589,0,0,0-17.7,10.6,44.769,44.769,0,0,0,0,46.3,21.589,21.589,0,0,0,17.7,10.6,21.589,21.589,0,0,0,17.7-10.6,44.769,44.769,0,0,0,0-46.3Zm-17.7,47.2c-7.8,0-14.4-11-14.4-24.1s6.6-24.1,14.4-24.1,14.4,11,14.4,24.1S103.4,178.278,95.5,178.278Zm-43.4,9.7v-51l-4.8,4.8-6.8-6.8,13-13a4.8,4.8,0,0,1,8.2,3.4v62.7l-9.6-.1Zm162-130.2v125.3a4.867,4.867,0,0,1-4.8,4.8H146.6v-19.3h48.2v-96.4H79.1v19.3c0,5.3-3.6,7.2-8,4.3l-41.8-27.9a6.013,6.013,0,0,1-2.7-8,5.887,5.887,0,0,1,2.7-2.7l41.8-27.9c4.4-2.9,8-1,8,4.3v19.3H209.2A4.974,4.974,0,0,1,214.1,57.778Z"></path></svg>';
        const forwardSvg = '<svg class="jw-svg-icon jw-svg-icon-forward" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" focusable="false"><g transform="scale(-1, 1) translate(-240, 0)"><path d="M214.1,57.778v125.3a4.867,4.867,0,0,1-4.8,4.8H146.6v-19.3h48.2v-96.4H79.1v19.3c0,5.3-3.6,7.2-8,4.3l-41.8-27.9a6.013,6.013,0,0,1-2.7-8,5.887,5.887,0,0,1,2.7-2.7l41.8-27.9c4.4-2.9,8-1,8,4.3v19.3H209.2A4.974,4.974,0,0,1,214.1,57.778Z"></path></g><g transform="translate(74, 0)"><path d="M113.2,131.078a21.589,21.589,0,0,0-17.7-10.6,21.589,21.589,0,0,0-17.7,10.6,44.769,44.769,0,0,0,0,46.3,21.589,21.589,0,0,0,17.7,10.6,21.589,21.589,0,0,0,17.7-10.6,44.769,44.769,0,0,0,0-46.3Zm-17.7,47.2c-7.8,0-14.4-11-14.4-24.1s6.6-24.1,14.4-24.1,14.4,11,14.4,24.1S103.4,178.278,95.5,178.278Zm-43.4,9.7v-51l-4.8,4.8-6.8-6.8,13-13a4.8,4.8,0,0,1,8.2,3.4v62.7l-9.6-.1Z"></path></g></svg>';
        const cinemaSwitcherSvg = '<svg class="jw-svg-icon jw-svg-icon-switcher" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>';

        function ensureAniSkipInPlayer() {
            try {
                const jwContainer = (typeof player.getContainer === 'function' ? player.getContainer() : null) ||
                                    document.querySelector('.jwplayer') ||
                                    document.getElementById('jwplayer-container');
                if (jwContainer && aniskipContainer && aniskipContainer.parentElement !== jwContainer) {
                    jwContainer.appendChild(aniskipContainer);
                }
            } catch(e) {}
        }

        player.on('ready', function() {
            ensureAniSkipInPlayer();

            // Register custom buttons in control bar
            try {
                player.addButton(forwardSvg, "Forward 10s", function() {
                    player.seek(player.getPosition() + 10);
                }, "custom-forward-10");

                player.addButton(rewindSvg, "Rewind 10s", function() {
                    player.seek(Math.max(0, player.getPosition() - 10));
                }, "custom-rewind-10");
            } catch(e) {
                console.warn("[JWPlayer] Custom buttons init error:", e);
            }

            // Seek to initial time if resume param present
            if (startTime > 0) {
                player.once('play', function() {
                    player.seek(startTime);
                });
            }
        });

        player.on('fullscreen', function() {
            ensureAniSkipInPlayer();
        });

        // ── Seekbar Intro / Outro Yellow Highlights ──
        let markersRendered = false;
        function updateTimelineMarkers() {
            const dur = player.getDuration();
            if (!dur || dur <= 0) return;
            const slider = document.querySelector('.jw-slider-time .jw-slider-container');
            if (!slider) return;

            slider.querySelectorAll('.jw-intro-marker, .jw-outro-marker').forEach(function(el) { el.remove(); });

            if (intro && intro.end > intro.start) {
                const im = document.createElement('div');
                im.className = 'jw-intro-marker';
                im.style.left = ((intro.start / dur) * 100) + '%';
                im.style.width = (((intro.end - intro.start) / dur) * 100) + '%';
                slider.appendChild(im);
            }

            if (outro && outro.end > outro.start) {
                const om = document.createElement('div');
                om.className = 'jw-outro-marker';
                om.style.left = ((outro.start / dur) * 100) + '%';
                om.style.width = (((outro.end - outro.start) / dur) * 100) + '%';
                slider.appendChild(om);
            }
            markersRendered = true;
        }

        player.on('time', function() {
            if (!markersRendered) updateTimelineMarkers();
        });
        player.on('meta', updateTimelineMarkers);

        // ── AniSkip Interactive Skip Intro / Outro Button ──
        let currentSkipTarget = null;
        player.on('time', function(e) {
            const pos = e.position;
            if (intro && intro.end > 0 && pos >= intro.start && pos < intro.end) {
                ensureAniSkipInPlayer();
                aniskipText.textContent = "Skip Intro";
                aniskipContainer.style.display = "flex";
                currentSkipTarget = intro.end;
            } else if (outro && outro.end > 0 && pos >= outro.start && pos < outro.end) {
                ensureAniSkipInPlayer();
                aniskipText.textContent = "Skip Outro";
                aniskipContainer.style.display = "flex";
                currentSkipTarget = outro.end;
            } else {
                aniskipContainer.style.display = "none";
                currentSkipTarget = null;
            }
        });

        aniskipBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            if (currentSkipTarget !== null) {
                player.seek(currentSkipTarget);
                aniskipContainer.style.display = "none";
            }
        });

        // ── Universal Parent Communication Bridge (postMessage) ──
        player.on('ready', function() {
            window.parent.postMessage({ event: 'ready', type: 'ready', source: 'jwplayer' }, '*');
        });

        player.on('play', function() {
            window.parent.postMessage({ event: 'play', type: 'play', source: 'jwplayer' }, '*');
        });

        player.on('pause', function() {
            window.parent.postMessage({ event: 'pause', type: 'pause', source: 'jwplayer' }, '*');
        });

        player.on('complete', function() {
            window.parent.postMessage({ event: 'ended', type: 'ended', source: 'jwplayer' }, '*');
        });

        let lastSentTime = 0;
        player.on('time', function(e) {
            const now = Date.now();
            if (now - lastSentTime > 1000) {
                lastSentTime = now;
                window.parent.postMessage({
                    event: 'timeupdate',
                    type: 'timeupdate',
                    currentTime: e.position,
                    duration: e.duration,
                    position: e.position,
                    percentage: e.duration ? (e.position / e.duration) * 100 : 0,
                    source: 'jwplayer'
                }, '*');
            }
        });

        player.on('error', function(err) {
            console.warn("[JWPlayer] Playback error:", err);
            window.parent.postMessage({
                event: 'error',
                type: 'error',
                message: err.message || "Playback error",
                source: 'jwplayer'
            }, '*');
            showError("Video stream disconnected. Please retry or switch servers.");
        });

        // ── Parent Command Dispatcher ──
        window.addEventListener('message', function(event) {
            if (!event.data) return;
            const d = event.data;
            const action = d.event || d.action || d.type;

            if (action === 'play') player.play();
            else if (action === 'pause') player.pause();
            else if (action === 'togglePlay') player.getState() === 'playing' ? player.pause() : player.play();
            else if (action === 'seek' && typeof d.time === 'number') player.seek(d.time);
            else if (action === 'skip') player.seek(Math.max(0, player.getPosition() + (d.amount || 10)));
            else if (action === 'setVolume' && typeof d.volume === 'number') player.setVolume(d.volume);
            else if (action === 'mute') player.setMute(typeof d.mute === 'boolean' ? d.mute : true);
            else if (action === 'setPlaybackRate' && typeof d.rate === 'number') player.setPlaybackRate(d.rate);
        });

    } catch (err) {
        console.error("[JWPlayer] Init error:", err);
        showError(err.message || "Could not load video source.");
    }
})();
</script>

</body>
</html>`;
}
