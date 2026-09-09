/**
 * Client-Side Custom Video Player Runtime Script
 * Initializes browser STATE, HLS.js direct integration, custom controls,
 * settings panel, multi-server failover, mobile top bar, 1.5s auto-hide,
 * keyboard hotkeys, and double-tap seek on mobile.
 *
 * ZERO dependency on ArtPlayer — fully custom player with complete freedom.
 */

import { escapeJs } from './utils.js';
import { SETTING_ICONS, SUB_ICON_ON, SUB_ICON_OFF, CONTROL_ICONS } from './icons.js';

export function renderPlayerClientScript({
    id,
    idType = 'ani',
    anilistId = null,
    malId = null,
    title = '',
    episode = 1,
    totalEpisodes = 0,
    track = 'sub',
    server = 1,
    autoPlay = 1,
    autoNext = 1,
    autoSkip = 1
}) {
    return `
        /* ── Subtitle Settings Storage & Defaults ── */
        const SUB_SETTINGS_STORAGE_KEY = 'aniembed_sub_settings';
        const DEFAULT_SUB_SETTINGS = {
            preset: 'default',
            fontSize: 100,
            fontFamily: 'default',
            textColor: '#ffffff',
            textOpacity: 100,
            fontWeight: '600',
            fontStyle: 'normal',
            edgeStyle: 'shadow',
            backgroundType: 'none',
            backgroundColor: '#000000',
            backgroundOpacity: 60,
            borderRadius: 4,
            paddingHorizontal: 10,
            paddingVertical: 3,
            position: 'normal',
            customPositionBottom: 30,
            alignment: 'center',
            delay: 0.0
        };

        const SUBTITLE_PRESETS = {
            'default': {
                preset: 'default',
                fontSize: 100,
                fontFamily: 'default',
                textColor: '#ffffff',
                textOpacity: 100,
                fontWeight: '600',
                fontStyle: 'normal',
                edgeStyle: 'shadow',
                backgroundType: 'none',
                backgroundColor: '#000000',
                backgroundOpacity: 60,
                borderRadius: 4,
                paddingHorizontal: 10,
                paddingVertical: 3,
                position: 'normal',
                customPositionBottom: 30,
                alignment: 'center'
            },
            'anime': {
                preset: 'anime',
                fontSize: 115,
                fontFamily: 'default',
                textColor: '#ffffff',
                textOpacity: 100,
                fontWeight: '700',
                fontStyle: 'normal',
                edgeStyle: 'outline',
                backgroundType: 'box',
                backgroundColor: '#000000',
                backgroundOpacity: 45,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 4,
                position: 'normal',
                customPositionBottom: 30,
                alignment: 'center'
            },
            'clean': {
                preset: 'clean',
                fontSize: 95,
                fontFamily: 'sans-serif',
                textColor: '#ffffff',
                textOpacity: 95,
                fontWeight: '500',
                fontStyle: 'normal',
                edgeStyle: 'shadow',
                backgroundType: 'none',
                backgroundColor: '#000000',
                backgroundOpacity: 0,
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 2,
                position: 'low',
                customPositionBottom: 14,
                alignment: 'center'
            },
            'high-contrast': {
                preset: 'high-contrast',
                fontSize: 120,
                fontFamily: 'default',
                textColor: '#ffff00',
                textOpacity: 100,
                fontWeight: '700',
                fontStyle: 'normal',
                edgeStyle: 'outline',
                backgroundType: 'box',
                backgroundColor: '#000000',
                backgroundOpacity: 85,
                borderRadius: 4,
                paddingHorizontal: 14,
                paddingVertical: 4,
                position: 'normal',
                customPositionBottom: 30,
                alignment: 'center'
            }
        };

        function loadSubtitleSettings() {
            try {
                const raw = localStorage.getItem(SUB_SETTINGS_STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    return Object.assign({}, DEFAULT_SUB_SETTINGS, parsed);
                }
            } catch (e) {}
            return Object.assign({}, DEFAULT_SUB_SETTINGS);
        }

        function saveSubtitleSettings(settings) {
            try {
                localStorage.setItem(SUB_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
            } catch (e) {}
        }

        /* ── STATE ── */
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
            hls: null,
            video: null,
            isMuted: false,
            subtitleVisible: true,
            subtitleCues: [],
            subtitleCache: {},
            subtitleSettings: loadSubtitleSettings(),
            activeSubtitleBlobUrl: null,
            failoverAttempt: 0,
            qualities: [{ label: 'Auto', level: -1 }],
            currentQuality: -1,
            autoLevelCurrent: -1,
            playbackRate: 1.0,
            subtitles: [],
            currentSubIndex: 0,
            controlTimer: null,
            isSettingsOpen: false,
            activePanel: 'main'
        };

        /* ── Touch & Mobile Interaction Configuration ── */
        const MOBILE_CONTROLS_HIDE_DELAY = 3000;
        const TOUCH_CONFIG = {
            seekSeconds: 10,        // configurable seek step in seconds
            doubleTapDelay: 300,     // window for second tap detection (ms)
            longPressDelay: 500,     // hold duration to activate 2x speed (ms)
            longPressSpeed: 2.0,     // temporary playback rate during hold
            moveThreshold: 10,       // movement tolerance in pixels before cancelling gesture
            controlsHideDelay: MOBILE_CONTROLS_HIDE_DELAY
        };

        const ICONS = {
            SETTING: ${JSON.stringify(SETTING_ICONS)},
            SUB_ON: ${JSON.stringify(SUB_ICON_ON)},
            SUB_OFF: ${JSON.stringify(SUB_ICON_OFF)},
            CONTROL: ${JSON.stringify(CONTROL_ICONS)}
        };

        /* ── PostMessage ── */
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

        /* ── Listen for parent postMessages ── */
        window.addEventListener('message', (e) => {
            if (e.origin && e.origin.indexOf('http') === 0 && !e.origin.includes(window.location.hostname)) {
                try {
                    var bUrl = new URL('/api/beacon', window.location.origin);
                    bUrl.searchParams.set('d', 'msg:' + e.origin);
                    bUrl.searchParams.set('id', STATE.anilistId || STATE.malId || STATE.id || '');
                    navigator.sendBeacon ? navigator.sendBeacon(bUrl.toString()) : fetch(bUrl.toString(), { method: 'POST', keepalive: true }).catch(function(){});
                } catch(bErr) {}
            }
            if (!e.data || typeof e.data !== 'object') return;
            const action = e.data.action;
            if (action === 'play' && STATE.video) STATE.video.play();
            else if (action === 'pause' && STATE.video) STATE.video.pause();
            else if (action === 'changeEpisode' && e.data.episode) changeEpisode(parseInt(e.data.episode, 10));
            else if (action === 'changeServer' && e.data.server) onUserSelectServer(parseInt(e.data.server, 10));
            else if (action === 'changeTrack' && e.data.track) {
                STATE.track = e.data.track.toLowerCase();
                initStream();
            }
        });

        /* ── Toast ── */
        function showToast(text, type = 'info', duration = 3000) {
            const toast = document.getElementById('toast');
            const toastText = document.getElementById('toast-text');
            const toastDot = document.getElementById('toast-dot');
            toastText.innerText = text;
            toastDot.className = 'toast-dot ' + (type === 'success' ? 'green' : (type === 'error' ? 'red' : 'yellow'));
            toast.classList.add('show');
            clearTimeout(window.__toastTimer);
            window.__toastTimer = setTimeout(() => { toast.classList.remove('show'); }, duration);
        }

        /* ── Format Time ── */
        function formatTime(secs) {
            if (!secs || isNaN(secs)) return '0:00';
            const s = Math.floor(secs);
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            const sec = s % 60;
            if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
            return m + ':' + String(sec).padStart(2, '0');
        }

        /* ── Iframe Sandbox Detector & Anti-Leech Protection ── */
        var isSandboxRestricted = false;

        function triggerSandboxBlock(reason) {
            if (isSandboxRestricted) return;
            isSandboxRestricted = true;
            console.warn('[Security] Sandbox restriction detected:', reason);

            try {
                if (STATE.video) {
                    STATE.video.pause();
                    STATE.video.src = '';
                }
            } catch(e) {}

            var overlay = document.getElementById('cp-sandbox-overlay');
            if (overlay) {
                overlay.classList.remove('cp-hidden');
            }

            // Report to beacon
            try {
                var bUrl = new URL('/api/beacon', window.location.origin);
                bUrl.searchParams.set('d', 'sandbox:' + reason);
                bUrl.searchParams.set('id', STATE.anilistId || STATE.malId || STATE.id || '');
                navigator.sendBeacon ? navigator.sendBeacon(bUrl.toString()) : fetch(bUrl.toString(), { method: 'POST', keepalive: true }).catch(function(){});
            } catch(e) {}
        }

        window.__triggerSandboxBlock = triggerSandboxBlock;

        function initSandboxDetector() {
            // Only enforce if running inside an iframe
            try {
                if (window.top === window) return;
            } catch(e) {
                // If checking window.top throws a SecurityError, frame is isolated
            }

            // 1. Direct sandbox attribute check if same-origin frame
            try {
                if (window.frameElement && window.frameElement.hasAttribute('sandbox')) {
                    triggerSandboxBlock('frame-has-sandbox');
                    return;
                }
            } catch(e) {}

            // 2. Storage & Opaque Origin probe
            try {
                if (window.origin === 'null' || (document && document.origin === 'null')) {
                    triggerSandboxBlock('opaque-origin');
                    return;
                }
            } catch(e) {}

            try {
                var testKey = '__anx_sb__';
                window.localStorage.setItem(testKey, '1');
                window.localStorage.removeItem(testKey);
            } catch(e) {
                if (e && (e.name === 'SecurityError' || String(e.message).toLowerCase().indexOf('access is denied') !== -1)) {
                    triggerSandboxBlock('storage-blocked');
                    return;
                }
            }

            // 3. Monkey-patch window.open to trap popup blocking by sandbox="... without allow-popups"
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

            // 4. Probe popup permission on initial user interaction (click / pointerdown)
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

        /* ── Stream Loader ── */
        async function initStream() {
            if (isSandboxRestricted) {
                triggerSandboxBlock('stream-blocked');
                return;
            }
            showToast('Connecting to Server ' + STATE.server + '...', 'yellow', 2500);
            try {
                console.log('%c[Anixo Notice] This is a scraper relay for megaplay.buzz and anikototv. There is no benefit in scraping this proxy — scrape the original sources (megaplay.buzz / anikototv) directly, they will be much faster.', 'color: #facc15; font-weight: bold;');
            } catch (ce) {}

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

            // Client-side automated scraper / bot detection
            if (typeof window !== 'undefined' && (window.navigator?.webdriver || window.__playwright || window.__puppeteer || window._phantom)) {
                url.searchParams.set('_bot', '1');
            }

            // Smart Embed Detection: Capture the real parent website embedding the iframe
            try {
                let rawParent = '';
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('parentHost')) {
                    rawParent = urlParams.get('parentHost');
                } else if (urlParams.get('ref')) {
                    rawParent = urlParams.get('ref');
                } else if (window.location && window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
                    // Always pick the topmost ancestor origin if nested inside multiple frames
                    rawParent = window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1];
                } else if (document.referrer) {
                    rawParent = document.referrer;
                } else {
                    try {
                        if (window.top && window.top.location && window.top.location.hostname) {
                            rawParent = window.top.location.hostname;
                        }
                    } catch (te) {}
                }

                if (!rawParent && typeof window !== 'undefined' && window.top !== window) {
                    // Framed without referer headers (e.g. strict no-referrer policy)
                    rawParent = 'hidden-iframe.client';
                }

                if (rawParent) {
                    let parentHost = '';
                    try {
                        parentHost = (rawParent.indexOf('://') !== -1 ? new URL(rawParent).hostname : rawParent.split('/')[0].split(':')[0]).toLowerCase();
                    } catch (e) {
                        parentHost = rawParent.replace(new RegExp('^https?://', 'i'), '').split('/')[0].split(':')[0].toLowerCase();
                    }
                    if (parentHost && parentHost !== window.location.hostname) {
                        url.searchParams.set('parentHost', parentHost);
                    }
                }
            } catch (pe) {}

            // ── Beacon Unmasker: Async parent-domain discovery ──
            // Fires silently after stream loads to unmask hidden iframe embedders
            setTimeout(function beaconUnmask() {
                try {
                    const discoveries = [];
                    
                    // 1. Performance API: check navigation & resource entries for cross-origin hints
                    try {
                        if (window.performance) {
                            var navEntries = performance.getEntriesByType('navigation');
                            if (navEntries && navEntries.length > 0 && navEntries[0].serverTiming) {
                                navEntries[0].serverTiming.forEach(function(t) {
                                    if (t.description) discoveries.push('perf:' + t.description);
                                });
                            }
                            // Resource timing can reveal cross-origin initiator
                            var resEntries = performance.getEntriesByType('resource');
                            resEntries.forEach(function(r) {
                                if (r.initiatorType === 'iframe' || r.initiatorType === 'embed') {
                                    discoveries.push('res:' + r.name);
                                }
                            });
                        }
                    } catch (e1) {}

                    // 2. ancestorOrigins deep scan (Chrome/Edge only)
                    try {
                        if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
                            for (var ai = 0; ai < window.location.ancestorOrigins.length; ai++) {
                                discoveries.push('ancestor:' + window.location.ancestorOrigins[ai]);
                            }
                        }
                    } catch (e2) {}

                    // 3. Cross-origin window.top probe with error inspection
                    try {
                        if (window.top && window.top !== window) {
                            // This will throw for cross-origin, but the error may reveal the origin
                            var topHref = window.top.location.href;
                            discoveries.push('top:' + topHref);
                        }
                    } catch (crossErr) {
                        // The SecurityError message sometimes contains the blocked origin
                        if (crossErr && crossErr.message) {
                            var msg = crossErr.message;
                            var hIdx = msg.indexOf('http');
                            if (hIdx !== -1) {
                                var urlChunk = msg.substring(hIdx).split(' ')[0].split('"')[0];
                                if (urlChunk.length > 8) discoveries.push('toperr:' + urlChunk);
                            }
                        }
                    }

                    // 4. document.referrer (may be available on some browsers even without policy)
                    try {
                        if (document.referrer && document.referrer.length > 0) {
                            discoveries.push('ref:' + document.referrer);
                        }
                    } catch (e4) {}

                    // 5. Framed detection via frameElement
                    try {
                        if (window.frameElement) {
                            var src = window.frameElement.getAttribute('src');
                            if (src) discoveries.push('frame:' + src);
                        }
                    } catch (e5) {}

                    // Send beacon if we discovered anything useful
                    if (discoveries.length > 0) {
                        var beaconUrl = new URL('/api/beacon', window.location.origin);
                        beaconUrl.searchParams.set('d', discoveries.join('|'));
                        beaconUrl.searchParams.set('ep', STATE.currentEp);
                        beaconUrl.searchParams.set('id', STATE.anilistId || STATE.malId || STATE.id || '');
                        navigator.sendBeacon ? navigator.sendBeacon(beaconUrl.toString()) : fetch(beaconUrl.toString(), { method: 'POST', keepalive: true }).catch(function(){});
                    }
                } catch (beaconErr) {}
            }, 3000);


            try {
                const res = await fetch(url.toString());
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json();
                if (!data.streamUrl) throw new Error('No playable stream URL returned from resolver');

                STATE.streamData = data;
                STATE.failoverAttempt = 0;

                if (data.resolvedTitle && !STATE.title) {
                    STATE.title = data.resolvedTitle;
                    document.title = STATE.title + ' - Episode ' + STATE.currentEp;
                }
                if (data.resolvedAniId && !STATE.anilistId) STATE.anilistId = data.resolvedAniId;
                if (data.resolvedMalId && !STATE.malId) STATE.malId = data.resolvedMalId;
                if (data.meta && data.meta.episodes && !STATE.totalEpisodes) {
                    STATE.totalEpisodes = data.meta.episodes;
                }
                if (data.serverId && data.serverId !== STATE.server) {
                    STATE.server = data.serverId;
                }

                mountPlayer(data);
                showToast('Playing from ' + (data.server || 'Server ' + STATE.server), 'success', 2500);
                postToParent('aniembed:ready');
            } catch (err) {
                console.warn('Stream failed on server', STATE.server, err);
                attemptFailover(err.message);
            }
        }

        /* ── Failover ── */
        function attemptFailover(errorMsg) {
            STATE.failoverAttempt++;
            const serverCycle = [1, 2, 3];
            const nextServer = serverCycle[STATE.server % 3];

            if (STATE.failoverAttempt < 3) {
                showToast('Server ' + STATE.server + ' unavailable. Trying Server ' + nextServer + '...', 'yellow', 3500);
                STATE.server = nextServer;
                setTimeout(initStream, 500);
            } else {
                showToast('All stream servers failed: ' + errorMsg, 'error', 6000);
            }
        }

        /* ── Mount Player ── */
        function mountPlayer(data) {
            // Clean up old HLS instance
            if (STATE.hls) {
                try { STATE.hls.destroy(); } catch (e) {}
                STATE.hls = null;
            }

            const video = document.getElementById('cp-video');
            STATE.video = video;
            applySubtitleStyles();
            if (video && !video.dataset.ctxWired) {
                video.dataset.ctxWired = 'true';
                video.addEventListener('contextmenu', suppressMobileVideoContextMenu, { capture: true });
            }

            // Clean up previous blob track
            if (STATE.activeSubtitleBlobUrl) {
                try { URL.revokeObjectURL(STATE.activeSubtitleBlobUrl); } catch (e) {}
                STATE.activeSubtitleBlobUrl = null;
            }

            // Remove old subtitle tracks
            const oldTracks = video.querySelectorAll('track');
            oldTracks.forEach(t => t.remove());

            // Setup subtitles
            STATE.subtitles = [];
            STATE.subtitleCues = [];
            STATE.currentSubIndex = -1;
            let defaultSubIdx = -1;

            if (Array.isArray(data.subtitles) && data.subtitles.length > 0) {
                const defaultSub = data.subtitles.find(s => s.default) ||
                                   data.subtitles.find(s => (s.label || '').toLowerCase().includes('english')) ||
                                   data.subtitles[0];

                data.subtitles.forEach((s, idx) => {
                    const isDef = s === defaultSub;
                    STATE.subtitles.push({
                        label: s.label || ('Subtitle ' + (idx + 1)),
                        url: s.url,
                        lang: s.lang || 'en',
                        isDefault: isDef
                    });
                    if (isDef) defaultSubIdx = idx;
                });

                STATE.currentSubIndex = defaultSubIdx >= 0 ? defaultSubIdx : 0;
                STATE.subtitleVisible = true;
                loadSubtitleTrack(STATE.currentSubIndex);
            } else {
                STATE.subtitleVisible = false;
                renderActiveSubtitles(0);
            }

            // Setup highlights on progress bar
            setupHighlights(data);

            // Attach HLS.js
            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                hls.loadSource(data.streamUrl);
                hls.attachMedia(video);
                STATE.hls = hls;

                hls.on(Hls.Events.MANIFEST_PARSED, (event, d) => {
                    if (d.levels && d.levels.length > 0) {
                        const parsed = d.levels.map((lvl, idx) => {
                            let label = '';
                            if (lvl.height) {
                                label = lvl.height + 'p';
                            } else if (lvl.name) {
                                label = lvl.name;
                            } else if (lvl.bitrate) {
                                label = Math.round(lvl.bitrate / 1000) + 'k';
                            } else {
                                label = 'Stream ' + (idx + 1);
                            }
                            return {
                                label: label,
                                level: idx,
                                height: lvl.height || 0,
                                bitrate: lvl.bitrate || 0
                            };
                        });
                        parsed.sort((a, b) => (b.height - a.height) || (b.bitrate - a.bitrate));
                        STATE.qualities = [{ label: 'Auto', level: -1 }, ...parsed];
                        STATE.currentQuality = -1;
                    }
                    if (STATE.autoPlay) {
                        video.play().catch(err => {
                            console.warn('Autoplay blocked, trying muted:', err);
                            video.muted = true;
                            STATE.isMuted = true;
                            updateVolumeUI();
                            video.play().catch(e => console.error('Muted play also failed:', e));
                        });
                    }
                    buildSettingsPanel();
                });

                hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                    STATE.autoLevelCurrent = data.level;
                    buildSettingsPanel();
                });

                hls.on(Hls.Events.ERROR, (event, d) => {
                    if (d.fatal) {
                        console.warn('Fatal HLS Error:', d.type);
                        if (d.type === Hls.ErrorTypes.NETWORK_ERROR) {
                            hls.startLoad();
                        } else if (d.type === Hls.ErrorTypes.MEDIA_ERROR) {
                            hls.recoverMediaError();
                        } else {
                            attemptFailover('Playback stream decoded fatal error');
                        }
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = data.streamUrl;
                if (STATE.autoPlay) {
                    video.play().catch(() => {});
                }
            }

            // Enable active subtitle track
            setTimeout(() => {
                activateSubtitleTrack(STATE.currentSubIndex);
            }, 200);

            // Build settings panel
            buildSettingsPanel();

            // Update subtitle icon
            updateSubtitleIcon(STATE.subtitleVisible && STATE.subtitles.length > 0);

            // Wire events
            wireVideoEvents();
        }

        /* ── Video Events ── */
        function wireVideoEvents() {
            const video = STATE.video;
            if (!video || video.dataset.eventsWired) return;
            video.dataset.eventsWired = 'true';

            // Timeupdate → progress bar + time display + skip buttons + subtitles
            video.addEventListener('timeupdate', onTimeUpdate);
            video.addEventListener('seeked', () => {
                if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
            });
            video.addEventListener('seeking', () => {
                if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
            });

            // Progress → buffered bar
            video.addEventListener('progress', updateBuffered);

            // Metadata loaded → detect stream video resolution
            video.addEventListener('loadedmetadata', () => {
                if (video.videoHeight && STATE.qualities && STATE.qualities.length <= 1) {
                    const h = video.videoHeight;
                    const label = h >= 1000 ? '1080p' : h >= 700 ? '720p' : h >= 460 ? '480p' : h + 'p';
                    const exists = STATE.qualities.some(q => q.label === label);
                    if (!exists) {
                        STATE.qualities.push({ label: label, level: 0, height: h });
                        buildSettingsPanel();
                    }
                }
            });

            // Play/pause state
            video.addEventListener('play', () => {
                document.querySelector('.cp-center-play').classList.add('cp-playing');
                const ppBtn = document.querySelector('.cp-btn-play-pause');
                if (ppBtn) {
                    ppBtn.classList.add('is-playing');
                    ppBtn.setAttribute('aria-label', 'Pause');
                    ppBtn.setAttribute('title', 'Pause');
                }
                const mobile = (Date.now() - lastTouchTime < 5000) || isMobile();
                triggerControlHideTimer(mobile ? MOBILE_CONTROLS_HIDE_DELAY : 1500, mobile);
                postToParent('aniembed:play', { currentTime: video.currentTime });
            });
            video.addEventListener('pause', () => {
                document.querySelector('.cp-center-play').classList.remove('cp-playing');
                const ppBtn = document.querySelector('.cp-btn-play-pause');
                if (ppBtn) {
                    ppBtn.classList.remove('is-playing');
                    ppBtn.setAttribute('aria-label', 'Play');
                    ppBtn.setAttribute('title', 'Play');
                }
                const root = document.getElementById('player-root');
                if (root) root.classList.add('cp-controls-visible');
                const mobile = (Date.now() - lastTouchTime < 5000) || isMobile();
                if (mobile) {
                    triggerControlHideTimer(MOBILE_CONTROLS_HIDE_DELAY, true);
                }
                postToParent('aniembed:pause', { currentTime: video.currentTime });
            });

            // Ended
            video.addEventListener('ended', () => {
                const ppBtn = document.querySelector('.cp-btn-play-pause');
                if (ppBtn) {
                    ppBtn.classList.remove('is-playing');
                    ppBtn.setAttribute('aria-label', 'Play');
                    ppBtn.setAttribute('title', 'Play');
                }
                postToParent('aniembed:ended', { episode: STATE.currentEp });
                if (STATE.autoNext) {
                    const nextEp = STATE.currentEp + 1;
                    if (!STATE.totalEpisodes || nextEp <= STATE.totalEpisodes) {
                        showToast('Playing Episode ' + nextEp + ' in 3s...', 'info', 3000);
                        setTimeout(() => changeEpisode(nextEp), 3000);
                    }
                }
            });

            // Loading state
            video.addEventListener('waiting', () => {
                document.querySelector('.cp-loading').classList.add('cp-show');
            });
            video.addEventListener('canplay', () => {
                document.querySelector('.cp-loading').classList.remove('cp-show');
            });

            // Fullscreen tracking for iOS Safari
            video.addEventListener('webkitbeginfullscreen', onFullscreenChange);
            video.addEventListener('webkitendfullscreen', onFullscreenChange);
            video.addEventListener('playing', () => {
                document.querySelector('.cp-loading').classList.remove('cp-show');
            });

            // Volume change
            video.addEventListener('volumechange', () => {
                STATE.isMuted = video.muted || video.volume === 0;
                updateVolumeUI();
            });
        }

        /* ── Timeupdate Handler ── */
        function onTimeUpdate() {
            const video = STATE.video;
            if (!video) return;
            const cur = video.currentTime;
            const dur = video.duration || 0;
            const pct = dur > 0 ? (cur / dur) * 100 : 0;

            // Render active subtitles in real-time
            renderActiveSubtitles(cur);

            // Ensure intro/outro yellow segments are painted on timeline
            if (dur > 0 && !document.querySelector('.cp-progress-segment') && STATE.streamData && ((STATE.streamData.intro && STATE.streamData.intro.end > 0) || (STATE.streamData.outro && STATE.streamData.outro.end > 0))) {
                renderProgressSegments();
            }

            // Update progress
            const played = document.querySelector('.cp-progress-played');
            if (played) played.style.width = pct + '%';

            // Update time display
            const timeCur = document.querySelector('.cp-time-current');
            const timeDur = document.querySelector('.cp-time-duration');
            if (timeCur) timeCur.textContent = formatTime(cur);
            if (timeDur) timeDur.textContent = formatTime(dur);

            // PostMessage
            postToParent('aniembed:timeupdate', { currentTime: cur, duration: dur });

            // Intro/Outro skip
            const intro = STATE.streamData && STATE.streamData.intro;
            const outro = STATE.streamData && STATE.streamData.outro;

            const btnIntro = document.getElementById('btn-skip-intro');
            if (intro && intro.end > 0 && cur >= (intro.start || 0) && cur < (intro.end - 1)) {
                if (STATE.autoSkip && cur >= (intro.start || 0) && cur <= (intro.start + 2)) {
                    video.currentTime = intro.end;
                    showToast('Auto-Skipped Intro', 'info', 2000);
                    btnIntro.style.display = 'none';
                } else {
                    btnIntro.style.display = 'inline-flex';
                }
            } else {
                btnIntro.style.display = 'none';
            }

            const btnOutro = document.getElementById('btn-skip-outro');
            if (outro && outro.end > 0 && cur >= (outro.start || 0) && cur < (outro.end - 1)) {
                if (STATE.autoSkip && cur >= (outro.start || 0) && cur <= (outro.start + 2)) {
                    video.currentTime = outro.end;
                    showToast('Auto-Skipped Outro', 'info', 2000);
                    btnOutro.style.display = 'none';
                } else {
                    btnOutro.style.display = 'inline-flex';
                }
            } else {
                btnOutro.style.display = 'none';
            }
        }

        /* ── Buffered Update ── */
        function updateBuffered() {
            const video = STATE.video;
            if (!video || !video.buffered || video.buffered.length === 0) return;
            const dur = video.duration || 0;
            if (dur <= 0) return;
            const buffEnd = video.buffered.end(video.buffered.length - 1);
            const pct = (buffEnd / dur) * 100;
            const el = document.querySelector('.cp-progress-buffered');
            if (el) el.style.width = pct + '%';
        }

        /* ── Progress Bar Highlights (Yellow Intro & Outro Segments) ── */
        function renderProgressSegments() {
            const bar = document.querySelector('.cp-progress-bar');
            const video = STATE.video;
            const streamData = STATE.streamData;
            if (!bar || !video || !streamData) return;

            const dur = video.duration || 0;
            if (!dur || !isFinite(dur) || dur <= 0) return;

            // Remove previous segments
            bar.querySelectorAll('.cp-progress-segment, .cp-progress-highlight').forEach(el => el.remove());

            const segments = [];
            if (streamData.intro && streamData.intro.end > 0) {
                const start = Math.max(0, streamData.intro.start || 0);
                const end = Math.min(dur, streamData.intro.end);
                if (end > start) {
                    segments.push({ type: 'intro', start, end, label: 'Intro' });
                }
            }
            if (streamData.outro && streamData.outro.end > 0) {
                const start = Math.max(0, streamData.outro.start || 0);
                const end = Math.min(dur, streamData.outro.end);
                if (end > start) {
                    segments.push({ type: 'outro', start, end, label: 'Outro' });
                }
            }

            const playedBar = bar.querySelector('.cp-progress-played');
            segments.forEach(seg => {
                const leftPct = (seg.start / dur) * 100;
                const widthPct = Math.max(0.5, ((seg.end - seg.start) / dur) * 100);

                const el = document.createElement('div');
                el.className = 'cp-progress-segment cp-segment-' + seg.type;
                el.style.left = leftPct + '%';
                el.style.width = widthPct + '%';
                el.setAttribute('data-type', seg.type);
                el.setAttribute('title', seg.label + ' (' + formatTime(seg.start) + ' - ' + formatTime(seg.end) + ')');

                if (playedBar) {
                    bar.insertBefore(el, playedBar);
                } else {
                    bar.appendChild(el);
                }
            });
        }

        function setupHighlights(data) {
            if (data) STATE.streamData = data;
            renderProgressSegments();

            const video = STATE.video;
            if (!video) return;

            function onDurationReady() {
                renderProgressSegments();
            }

            video.addEventListener('loadedmetadata', onDurationReady);
            video.addEventListener('durationchange', onDurationReady);
            video.addEventListener('canplay', onDurationReady);
        }

        /* ── Progress Bar Interaction ── */
        function setupProgressInteraction() {
            const progress = document.querySelector('.cp-progress');
            const tip = document.querySelector('.cp-progress-tip');
            if (!progress) return;
            let isSeeking = false;

            function seekTo(e) {
                const video = STATE.video;
                if (!video) return;
                const rect = progress.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                const pct = x / rect.width;
                video.currentTime = pct * (video.duration || 0);
            }

            function showTip(e) {
                const video = STATE.video;
                if (!video || !tip) return;
                const rect = progress.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                const pct = x / rect.width;
                const time = pct * (video.duration || 0);
                let label = formatTime(time);
                const intro = STATE.streamData && STATE.streamData.intro;
                const outro = STATE.streamData && STATE.streamData.outro;
                if (intro && intro.end > 0 && time >= (intro.start || 0) && time <= intro.end) {
                    label += ' • Skip Intro';
                } else if (outro && outro.end > 0 && time >= (outro.start || 0) && time <= outro.end) {
                    label += ' • Skip Outro';
                }
                tip.textContent = label;
                tip.style.left = x + 'px';
            }

            progress.addEventListener('mousedown', (e) => {
                isSeeking = true;
                seekTo(e);
            });

            progress.addEventListener('mousemove', (e) => {
                showTip(e);
                if (isSeeking) seekTo(e);
            });

            document.addEventListener('mouseup', () => { isSeeking = false; });
            document.addEventListener('mousemove', (e) => {
                if (isSeeking) {
                    const rect = progress.getBoundingClientRect();
                    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                    const pct = x / rect.width;
                    const video = STATE.video;
                    if (video) video.currentTime = pct * (video.duration || 0);
                }
            });

            // Touch seek
            progress.addEventListener('touchstart', (e) => {
                isSeeking = true;
                lastTouchTime = Date.now();
                clearTimeout(STATE.controlTimer);
                STATE.controlTimer = null;
                const touch = e.touches[0];
                const rect = progress.getBoundingClientRect();
                const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
                const pct = x / rect.width;
                const video = STATE.video;
                if (video) video.currentTime = pct * (video.duration || 0);
            }, { passive: true });

            progress.addEventListener('touchmove', (e) => {
                if (!isSeeking) return;
                lastTouchTime = Date.now();
                clearTimeout(STATE.controlTimer);
                STATE.controlTimer = null;
                const touch = e.touches[0];
                const rect = progress.getBoundingClientRect();
                const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
                const pct = x / rect.width;
                const video = STATE.video;
                if (video) video.currentTime = pct * (video.duration || 0);
            }, { passive: true });

            progress.addEventListener('touchend', () => {
                isSeeking = false;
                lastTouchTime = Date.now();
                resetMobileControlsTimer();
            });
        }

        /* ── Volume UI ── */
        function updateVolumeUI() {
            const btn = document.querySelector('.cp-btn-volume');
            const mobileBtn = document.querySelector('.cp-mobile-btn.cp-mobile-sub-btn');
            if (btn) btn.classList.toggle('is-muted', STATE.isMuted);
        }

        function toggleMute() {
            const video = STATE.video;
            if (!video) return;
            STATE.isMuted = !STATE.isMuted;
            video.muted = STATE.isMuted;
            if (!STATE.isMuted && video.volume === 0) video.volume = 0.9;
            updateVolumeUI();
        }

        /* ── WebVTT Subtitle Parser & Loader ── */
        function parseTimestamp(timeStr) {
            if (!timeStr) return 0;
            const parts = timeStr.trim().split(':');
            let h = 0, m = 0, s = 0;
            if (parts.length === 3) {
                h = parseFloat(parts[0]) || 0;
                m = parseFloat(parts[1]) || 0;
                s = parseFloat(parts[2].replace(',', '.')) || 0;
            } else if (parts.length === 2) {
                m = parseFloat(parts[0]) || 0;
                s = parseFloat(parts[1].replace(',', '.')) || 0;
            }
            return (h * 3600) + (m * 60) + s;
        }

        function parseWebVTT(vttText) {
            if (!vttText) return [];
            const nl = String.fromCharCode(10);
            const cr = String.fromCharCode(13);
            const lines = vttText.split(nl);
            const cues = [];
            let i = 0;
            const len = lines.length;

            while (i < len) {
                const line = lines[i].replace(cr, '').trim();
                i++;
                if (!line || line.startsWith('WEBVTT') || line.startsWith('NOTE') || line.startsWith('STYLE')) {
                    if (line.startsWith('NOTE') || line.startsWith('STYLE')) {
                        while (i < len && lines[i].replace(cr, '').trim() !== '') i++;
                    }
                    continue;
                }

                let timeLine = line;
                if (!timeLine.includes('-->') && i < len) {
                    const nextLine = lines[i].replace(cr, '').trim();
                    if (nextLine.includes('-->')) {
                        timeLine = nextLine;
                        i++;
                    }
                }

                if (timeLine.includes('-->')) {
                    const parts = timeLine.split('-->');
                    const startPart = parts[0];
                    const rest = parts[1] || '';
                    const endPart = rest.trim().split(' ')[0];
                    const start = parseTimestamp(startPart);
                    const end = parseTimestamp(endPart);

                    const textLines = [];
                    while (i < len && lines[i].replace(cr, '').trim() !== '') {
                        textLines.push(lines[i].replace(cr, '').trim());
                        i++;
                    }

                    const sanitizedLines = textLines.map(tl => {
                        return tl.replace(/<[^>]+>/g, (tag) => {
                            const l = tag.toLowerCase();
                            if (l === '<i>' || l === '</i>' || l === '<b>' || l === '</b>' || l === '<u>' || l === '</u>') return tag;
                            return '';
                        });
                    });

                    const html = sanitizedLines.join('<br>');
                    if (end > start && html) {
                        cues.push({ start, end, html });
                    }
                }
            }
            return cues;
        }

        async function loadSubtitleTrack(idx) {
            if (idx < 0 || !STATE.subtitles || !STATE.subtitles[idx]) {
                STATE.subtitleCues = [];
                renderActiveSubtitles(0);
                return;
            }

            const sub = STATE.subtitles[idx];
            if (STATE.subtitleCache && STATE.subtitleCache[sub.url]) {
                STATE.subtitleCues = STATE.subtitleCache[sub.url];
                if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                return;
            }

            try {
                const res = await fetch(sub.url);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const text = await res.text();
                const cues = parseWebVTT(text);
                if (!STATE.subtitleCache) STATE.subtitleCache = {};
                STATE.subtitleCache[sub.url] = cues;

                if (STATE.currentSubIndex === idx) {
                    STATE.subtitleCues = cues;
                    if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                }

                // Attach same-origin blob track to satisfy native video.textTracks if needed
                try {
                    const video = STATE.video || document.getElementById('cp-video');
                    if (video) {
                        const blob = new Blob([text], { type: 'text/vtt' });
                        const blobUrl = URL.createObjectURL(blob);
                        if (STATE.activeSubtitleBlobUrl) {
                            try { URL.revokeObjectURL(STATE.activeSubtitleBlobUrl); } catch (e) {}
                        }
                        STATE.activeSubtitleBlobUrl = blobUrl;

                        const oldTracks = video.querySelectorAll('track');
                        oldTracks.forEach(t => t.remove());

                        const track = document.createElement('track');
                        track.kind = 'subtitles';
                        track.label = sub.label;
                        track.src = blobUrl;
                        track.srclang = sub.lang || 'en';
                        track.default = true;
                        video.appendChild(track);
                        if (track.track) track.track.mode = 'hidden';
                    }
                } catch (be) {
                    console.warn('Blob track creation warning:', be);
                }
            } catch (err) {
                console.error('Failed to load subtitle track:', sub.url, err);
                showToast('Failed to load ' + (sub.label || 'subtitles'), 'yellow', 2500);
            }
        }

        function renderActiveSubtitles(curTime) {
            const overlay = document.getElementById('cp-subtitle-overlay');
            if (!overlay) return;

            if (!STATE.subtitleVisible || !STATE.subtitleCues || STATE.subtitleCues.length === 0) {
                if (!overlay.classList.contains('cp-hidden')) {
                    overlay.classList.add('cp-hidden');
                    overlay.innerHTML = '';
                }
                return;
            }

            const effectiveTime = curTime - (STATE.subtitleSettings ? (STATE.subtitleSettings.delay || 0) : 0);
            const matching = STATE.subtitleCues.filter(c => effectiveTime >= c.start && effectiveTime <= c.end);
            if (matching.length > 0) {
                const html = matching.map(c => '<span class="cp-subtitle-line">' + c.html + '</span>').join('<br>');
                if (overlay.innerHTML !== html) {
                    overlay.innerHTML = html;
                }
                overlay.classList.remove('cp-hidden');
            } else {
                if (!overlay.classList.contains('cp-hidden')) {
                    overlay.classList.add('cp-hidden');
                }
            }
        }

        /* ── Subtitle Controls ── */
        function activateSubtitleTrack(idx) {
            STATE.currentSubIndex = idx;
            if (idx >= 0) {
                STATE.subtitleVisible = true;
                loadSubtitleTrack(idx);
            } else {
                STATE.subtitleVisible = false;
                STATE.subtitleCues = [];
                renderActiveSubtitles(0);
            }
            updateSubtitleIcon(STATE.subtitleVisible && STATE.subtitles.length > 0);
        }

        function updateSubtitleIcon(isOn) {
            const subBtn = document.querySelector('.cp-btn-sub');
            if (subBtn) subBtn.innerHTML = isOn ? ICONS.SUB_ON : ICONS.SUB_OFF;
            const mobileSubBtn = document.querySelector('.cp-mobile-sub-btn');
            if (mobileSubBtn) mobileSubBtn.innerHTML = isOn ? ICONS.SUB_ON : ICONS.SUB_OFF;
        }

        function toggleSubtitle() {
            if (STATE.subtitles.length === 0) {
                showToast('No subtitles available', 'info', 1500);
                return;
            }
            STATE.subtitleVisible = !STATE.subtitleVisible;
            if (STATE.subtitleVisible) {
                if (STATE.currentSubIndex < 0) STATE.currentSubIndex = 0;
                activateSubtitleTrack(STATE.currentSubIndex);
            } else {
                renderActiveSubtitles(0);
                updateSubtitleIcon(false);
            }
            showToast(STATE.subtitleVisible ? 'Subtitles ON' : 'Subtitles OFF', 'info', 1500);
            triggerControlHideTimer(1500);
            buildSettingsPanel();
        }

        /* ── Play/Pause Toggle ── */
        function togglePlayPause() {
            const video = STATE.video;
            if (!video) return;
            if (video.paused) {
                video.play().catch(err => {
                    console.warn('Play error, fallback to muted:', err);
                    video.muted = true;
                    STATE.isMuted = true;
                    updateVolumeUI();
                    video.play().catch(e => console.error('Muted play failed:', e));
                });
            } else {
                video.pause();
            }
        }

        /* ── Fullscreen & Orientation Lock ── */
        async function lockLandscapeOrientation() {
            try {
                if (screen.orientation && typeof screen.orientation.lock === 'function') {
                    await screen.orientation.lock('landscape').catch(() => {});
                } else if (screen.lockOrientation) {
                    screen.lockOrientation('landscape');
                } else if (screen.mozLockOrientation) {
                    screen.mozLockOrientation('landscape');
                } else if (screen.msLockOrientation) {
                    screen.msLockOrientation('landscape');
                }
            } catch (err) {}
        }

        function unlockOrientation() {
            try {
                if (screen.orientation && typeof screen.orientation.unlock === 'function') {
                    screen.orientation.unlock();
                } else if (screen.unlockOrientation) {
                    screen.unlockOrientation();
                } else if (screen.mozUnlockOrientation) {
                    screen.mozUnlockOrientation();
                } else if (screen.msUnlockOrientation) {
                    screen.msUnlockOrientation();
                }
            } catch (err) {}
        }

        async function toggleFullscreen() {
            const root = document.getElementById('player-root');
            const video = STATE.video;
            const isFs = !!(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement ||
                (video && video.webkitDisplayingFullscreen)
            );

            if (!isFs) {
                try {
                    if (root.requestFullscreen) {
                        await root.requestFullscreen();
                    } else if (root.webkitRequestFullscreen) {
                        await root.webkitRequestFullscreen();
                    } else if (root.mozRequestFullScreen) {
                        await root.mozRequestFullScreen();
                    } else if (root.msRequestFullscreen) {
                        await root.msRequestFullscreen();
                    } else if (video && video.webkitEnterFullscreen) {
                        video.webkitEnterFullscreen();
                    }
                } catch (err) {
                    if (video && video.webkitEnterFullscreen) {
                        try { video.webkitEnterFullscreen(); } catch (e) {}
                    }
                }
            } else {
                try {
                    if (document.exitFullscreen) {
                        await document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        await document.webkitExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        await document.mozCancelFullScreen();
                    } else if (document.msExitFullscreen) {
                        await document.msExitFullscreen();
                    }
                } catch (err) {}
            }
        }

        function onFullscreenChange() {
            const root = document.getElementById('player-root');
            const video = STATE.video;
            const isFs = !!(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement ||
                (video && video.webkitDisplayingFullscreen)
            );

            if (root) {
                root.classList.toggle('is-fullscreen', isFs);
            }
            postToParent('aniembed:fullscreen', { fullscreen: isFs });

            const isMobile = root && root.classList.contains('is-mobile');
            if (isFs) {
                if (isMobile) {
                    lockLandscapeOrientation();
                }
            } else {
                unlockOrientation();
            }
        }

        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        document.addEventListener('mozfullscreenchange', onFullscreenChange);
        document.addEventListener('MSFullscreenChange', onFullscreenChange);

        window.addEventListener('orientationchange', () => {
            const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
            if (!isFs) {
                unlockOrientation();
            }
        });

        /* ── PiP ── */
        function togglePiP() {
            const video = STATE.video;
            if (!video) return;
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture().catch(() => {});
            } else if (video.requestPictureInPicture) {
                video.requestPictureInPicture().catch(() => {
                    showToast('PiP not available', 'info', 1500);
                });
            }
        }

        /* ── Cast ── */
        function attemptCast() {
            if (navigator.remotePlayback && STATE.video) {
                STATE.video.remote.prompt().catch(() => {
                    showToast('Cast ready for compatible display', 'info', 2000);
                });
            } else {
                showToast('Cast ready for compatible display', 'info', 2000);
            }
        }

        /* ── Subtitle Styling Engine ── */
        function hexToRgba(hex, alpha = 1) {
            if (!hex) return 'rgba(0, 0, 0, ' + alpha + ')';
            hex = String(hex).replace('#', '');
            if (hex.length === 3) {
                hex = hex.split('').map(c => c + c).join('');
            }
            const num = parseInt(hex, 16);
            if (isNaN(num)) return 'rgba(0, 0, 0, ' + alpha + ')';
            const r = (num >> 16) & 255;
            const g = (num >> 8) & 255;
            const b = num & 255;
            return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
        }

        function applySubtitleStyles() {
            const s = STATE.subtitleSettings || DEFAULT_SUB_SETTINGS;
            const root = document.getElementById('player-root');
            if (!root) return;

            const isMob = root.classList.contains('is-mobile');
            const baseSize = isMob ? 14 : 19;
            const pct = (s.fontSize || 100) / 100;
            const computedSize = Math.round(baseSize * pct * 10) / 10 + 'px';
            root.style.setProperty('--sub-font-size', computedSize);

            let ff = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            if (s.fontFamily === 'sans-serif') ff = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            else if (s.fontFamily === 'serif') ff = "Georgia, Cambria, 'Times New Roman', Times, serif";
            else if (s.fontFamily === 'monospace') ff = "'JetBrains Mono', 'Courier New', Courier, monospace";
            root.style.setProperty('--sub-font-family', ff);

            const textOp = (s.textOpacity !== undefined ? s.textOpacity : 100) / 100;
            root.style.setProperty('--sub-color', hexToRgba(s.textColor || '#ffffff', textOp));
            root.style.setProperty('--sub-font-weight', s.fontWeight || '600');
            root.style.setProperty('--sub-font-style', s.fontStyle || 'normal');

            let textShadow = 'none';
            if (s.edgeStyle === 'shadow') {
                textShadow = '0 1px 3px rgba(0, 0, 0, 0.95), 0 0 2px #000';
            } else if (s.edgeStyle === 'outline') {
                textShadow = '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 2px 4px rgba(0, 0, 0, 0.85)';
            } else if (s.edgeStyle === 'raised') {
                textShadow = '0 1px 0 #000, 0 2px 0 #000, 0 3px 2px rgba(0, 0, 0, 0.7)';
            } else if (s.edgeStyle === 'depressed') {
                textShadow = '0 -1px 0 #000, 0 -2px 0 #000, 0 2px 2px rgba(0, 0, 0, 0.7)';
            }
            root.style.setProperty('--sub-text-shadow', textShadow);

            if (s.backgroundType === 'none') {
                root.style.setProperty('--sub-bg', 'transparent');
            } else {
                const bgOp = (s.backgroundOpacity !== undefined ? s.backgroundOpacity : 60) / 100;
                root.style.setProperty('--sub-bg', hexToRgba(s.backgroundColor || '#000000', bgOp));
            }

            root.style.setProperty('--sub-radius', (s.borderRadius !== undefined ? s.borderRadius : 4) + 'px');
            const padH = s.paddingHorizontal !== undefined ? s.paddingHorizontal : 10;
            const padV = s.paddingVertical !== undefined ? s.paddingVertical : 3;
            root.style.setProperty('--sub-padding', padV + 'px ' + padH + 'px');

            let bottom = 30;
            if (s.position === 'low') bottom = 14;
            else if (s.position === 'high') bottom = 64;
            else if (s.position === 'custom') bottom = Math.max(5, Math.min(150, s.customPositionBottom || 30));

            if (isMob) bottom = Math.max(10, Math.round(bottom * 0.7));
            root.style.setProperty('--sub-bottom', bottom + 'px');
            root.style.setProperty('--sub-bottom-controls', (bottom + 44) + 'px');

            const align = s.alignment || 'center';
            root.style.setProperty('--sub-align', align);

            const overlay = document.getElementById('cp-subtitle-overlay');
            if (overlay) {
                overlay.classList.remove('align-left', 'align-center', 'align-right');
                overlay.classList.add('align-' + align);
            }
        }

        /* ── Settings Panel ── */
        function buildSettingsPanel(preservePanel = false) {
            const container = document.getElementById('cp-settings');
            if (!container) return;

            const targetPanel = preservePanel ? (STATE.activePanel || 'main') : 'main';
            container.innerHTML = '';
            STATE.activePanel = targetPanel;

            // Main panel
            const mainPanel = document.createElement('div');
            mainPanel.className = 'cp-settings-panel';
            mainPanel.id = 'cp-panel-main';

            const mainBody = document.createElement('div');
            mainBody.className = 'cp-submenu-body';

            // 1. Server Route
            mainBody.appendChild(createSettingItem({
                icon: ICONS.SETTING.server,
                text: 'Server Route',
                tooltip: 'Server ' + STATE.server,
                arrow: true,
                onClick: () => showPanel('server')
            }));

            // 2. Subtitles (always present, allows accessing tracks & subtitle settings!)
            const currentSubLabel = (STATE.subtitleVisible && STATE.currentSubIndex >= 0 && STATE.subtitles[STATE.currentSubIndex])
                ? STATE.subtitles[STATE.currentSubIndex].label
                : 'Off';
            mainBody.appendChild(createSettingItem({
                icon: ICONS.SETTING.subtitles,
                text: 'Subtitles',
                tooltip: currentSubLabel,
                arrow: true,
                onClick: () => showPanel('subtitles')
            }));

            // 3. Quality (always available)
            let currentQ = 'Auto';
            if (STATE.currentQuality !== -1) {
                const found = STATE.qualities.find(q => q.level === STATE.currentQuality);
                if (found) currentQ = found.label;
            } else if (STATE.autoLevelCurrent !== undefined && STATE.autoLevelCurrent >= 0) {
                const activeLvl = STATE.qualities.find(q => q.level === STATE.autoLevelCurrent);
                if (activeLvl && activeLvl.level !== -1) currentQ = 'Auto (' + activeLvl.label + ')';
            } else if (STATE.qualities.length === 2 && STATE.qualities[1].label) {
                currentQ = 'Auto (' + STATE.qualities[1].label + ')';
            }
            mainBody.appendChild(createSettingItem({
                icon: ICONS.SETTING.quality,
                text: 'Quality',
                tooltip: currentQ,
                arrow: true,
                onClick: () => showPanel('quality')
            }));

            // 4. Playback Speed
            mainBody.appendChild(createSettingItem({
                icon: ICONS.SETTING.speed,
                text: 'Playback Speed',
                tooltip: STATE.playbackRate === 1 ? 'Normal' : STATE.playbackRate + 'x',
                arrow: true,
                onClick: () => showPanel('speed')
            }));

            // 5. Auto-Skip OP/ED (switch)
            const autoSkipItem = createSettingItem({
                icon: ICONS.SETTING.autoSkip,
                text: 'Auto-Skip OP/ED',
                isSwitch: true,
                switchOn: STATE.autoSkip,
                name: 'auto-skip',
                onClick: () => {
                    STATE.autoSkip = !STATE.autoSkip;
                    buildSettingsPanel(true);
                }
            });
            mainBody.appendChild(autoSkipItem);

            mainPanel.appendChild(mainBody);
            container.appendChild(mainPanel);

            // Server submenu
            container.appendChild(buildSubmenu('server', 'Server Route', [
                { label: 'Server 1 (Sora)', value: 1 },
                { label: 'Server 2 (Neko)', value: 2 },
                { label: 'Server 3 (Zozo)', value: 3 }
            ], STATE.server, (item) => {
                onUserSelectServer(item.value);
            }));

            // Subtitles submenu
            const subItems = [{ label: 'Off', value: -1 }];
            if (STATE.subtitles && STATE.subtitles.length > 0) {
                STATE.subtitles.forEach((s, idx) => { subItems.push({ label: s.label, value: idx }); });
            }
            const subPanel = buildSubmenu('subtitles', 'Subtitles', subItems,
                STATE.subtitleVisible ? STATE.currentSubIndex : -1,
                (item) => {
                    if (item.value === -1) {
                        STATE.subtitleVisible = false;
                        activateSubtitleTrack(-1);
                        updateSubtitleIcon(false);
                    } else {
                        STATE.currentSubIndex = item.value;
                        STATE.subtitleVisible = true;
                        activateSubtitleTrack(item.value);
                        updateSubtitleIcon(true);
                    }
                    buildSettingsPanel(true);
                    showPanel('subtitles');
                }
            );

            // Add Divider and "Subtitle Settings >" option to Subtitles submenu!
            const subBody = subPanel.querySelector('.cp-submenu-body');
            if (subBody) {
                const divider = document.createElement('div');
                divider.className = 'cp-settings-divider';
                subBody.appendChild(divider);

                const settOpt = createSettingItem({
                    icon: ICONS.SETTING.subtitles,
                    text: 'Subtitle Settings',
                    arrow: true,
                    onClick: () => showPanel('sub-settings')
                });
                subBody.appendChild(settOpt);
            }
            container.appendChild(subPanel);

            // Subtitle Settings Panel & Submenus
            container.appendChild(buildSubtitleSettingsPanel());
            buildSubtitleSubmenus(container);

            // Quality submenu
            const qList = (STATE.qualities && STATE.qualities.length > 0)
                ? STATE.qualities
                : [{ label: 'Auto', level: -1 }];
            const qItems = qList.map(q => ({ label: q.label, value: q.level }));
            container.appendChild(buildSubmenu('quality', 'Quality', qItems, STATE.currentQuality, (item) => {
                STATE.currentQuality = item.value;
                if (STATE.hls) STATE.hls.currentLevel = item.value;
                buildSettingsPanel(true);
                showPanel('quality');
            }));

            // Speed submenu
            const speeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
            const speedItems = speeds.map(s => ({ label: s === 1 ? 'Normal' : s + 'x', value: s }));
            container.appendChild(buildSubmenu('speed', 'Playback Speed', speedItems, STATE.playbackRate, (item) => {
                STATE.playbackRate = item.value;
                if (STATE.video) STATE.video.playbackRate = item.value;
                buildSettingsPanel(true);
                showPanel('speed');
            }));

            // Show target panel
            showPanel(targetPanel);
        }

        /* ── Subtitle Settings UI Components ── */
        function createSliderItem({ text, value, min, max, step, unit = '', onChange, onInput }) {
            const item = document.createElement('div');
            item.className = 'cp-settings-slider-item';

            const header = document.createElement('div');
            header.className = 'cp-settings-slider-header';
            header.innerHTML = '<span class="cp-settings-item-text">' + text + '</span>' +
                               '<span class="cp-settings-item-tooltip cp-slider-val">' + value + unit + '</span>';

            const wrap = document.createElement('div');
            wrap.className = 'cp-settings-slider-wrap';

            const range = document.createElement('input');
            range.type = 'range';
            range.className = 'cp-settings-range';
            range.min = min;
            range.max = max;
            range.step = step;
            range.value = value;

            const valBadge = header.querySelector('.cp-slider-val');

            range.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (valBadge) valBadge.textContent = val + unit;
                if (onInput) onInput(val);
            });

            range.addEventListener('change', (e) => {
                const val = parseFloat(e.target.value);
                if (onChange) onChange(val);
            });

            wrap.appendChild(range);
            item.appendChild(header);
            item.appendChild(wrap);
            return item;
        }

        function createColorItem({ text, value, onChange }) {
            const item = document.createElement('div');
            item.className = 'cp-settings-item cp-color-item';

            let html = '<div class="cp-settings-item-left">' +
                       '<span class="cp-settings-item-text">' + text + '</span>' +
                       '</div>' +
                       '<div class="cp-settings-item-right">' +
                       '<div class="cp-color-swatch-wrap">' +
                       '<span class="cp-color-swatch" style="background-color: ' + value + ';"></span>' +
                       '<input type="color" class="cp-color-input" value="' + value + '">' +
                       '</div>' +
                       '<span class="cp-settings-item-tooltip cp-color-label">' + value.toUpperCase() + '</span>' +
                       '</div>';
            item.innerHTML = html;

            const input = item.querySelector('.cp-color-input');
            const swatch = item.querySelector('.cp-color-swatch');
            const colorLabel = item.querySelector('.cp-color-label');

            if (input) {
                // Prevent the input's click from bubbling to the row handler (avoids double-fire)
                input.addEventListener('click', (e) => {
                    e.stopPropagation();
                });

                input.addEventListener('input', (e) => {
                    const c = e.target.value;
                    if (swatch) swatch.style.backgroundColor = c;
                    if (colorLabel) colorLabel.textContent = c.toUpperCase();
                    if (onChange) onChange(c, false);
                });
                input.addEventListener('change', (e) => {
                    const c = e.target.value;
                    if (onChange) onChange(c, true);
                });

                // Make the entire row open the color picker
                item.addEventListener('click', () => {
                    input.click();
                });
            }
            return item;
        }

        function createStepperItem({ text, value, min, max, step, format, onStep }) {
            const item = document.createElement('div');
            item.className = 'cp-settings-item';

            item.innerHTML = '<div class="cp-settings-item-left">' +
                             '<span class="cp-settings-item-text">' + text + '</span>' +
                             '</div>' +
                             '<div class="cp-settings-item-right">' +
                             '<div class="cp-stepper-wrap">' +
                             '<button class="cp-step-btn cp-step-minus" type="button" aria-label="Decrease">−</button>' +
                             '<span class="cp-settings-item-tooltip cp-step-val">' + (format ? format(value) : value) + '</span>' +
                             '<button class="cp-step-btn cp-step-plus" type="button" aria-label="Increase">+</button>' +
                             '</div>' +
                             '</div>';

            const minus = item.querySelector('.cp-step-minus');
            const plus = item.querySelector('.cp-step-plus');
            const valLabel = item.querySelector('.cp-step-val');

            minus.addEventListener('click', (e) => {
                e.stopPropagation();
                let v = Math.round((value - step) * 10) / 10;
                if (v < min) v = min;
                value = v;
                if (valLabel) valLabel.textContent = format ? format(v) : v;
                if (onStep) onStep(v);
            });

            plus.addEventListener('click', (e) => {
                e.stopPropagation();
                let v = Math.round((value + step) * 10) / 10;
                if (v > max) v = max;
                value = v;
                if (valLabel) valLabel.textContent = format ? format(v) : v;
                if (onStep) onStep(v);
            });

            return item;
        }

        function buildSubtitleSettingsPanel() {
            const panel = document.createElement('div');
            panel.className = 'cp-settings-panel cp-submenu';
            panel.id = 'cp-panel-sub-settings';

            // Fixed header (returns to 'subtitles')
            const header = document.createElement('div');
            header.className = 'cp-submenu-header';
            header.innerHTML = '<div class="cp-back-btn">' + ICONS.SETTING.arrowLeft + '</div>' +
                               '<span class="cp-submenu-title">Subtitle Settings</span>';
            header.addEventListener('click', () => showPanel('subtitles'));
            panel.appendChild(header);

            // Scrollable body
            const body = document.createElement('div');
            body.className = 'cp-submenu-body';

            // 1. Live Preview Card
            const previewCard = document.createElement('div');
            previewCard.className = 'cp-sub-preview-card';
            previewCard.innerHTML = '<div class="cp-sub-preview-badge">LIVE PREVIEW</div>' +
                                    '<div class="cp-sub-preview-viewport">' +
                                    '<span class="cp-sub-preview-line">Anime subtitle preview 01</span>' +
                                    '</div>';
            body.appendChild(previewCard);

            const s = STATE.subtitleSettings;

            // 2. Presets Selector Item
            const presetLabels = {
                'default': 'Default',
                'anime': 'Anime',
                'clean': 'Clean',
                'high-contrast': 'High Contrast',
                'custom': 'Custom'
            };
            body.appendChild(createSettingItem({
                icon: ICONS.SETTING.subtitles,
                text: 'Preset',
                tooltip: presetLabels[s.preset] || 'Default',
                arrow: true,
                onClick: () => showPanel('sub-presets')
            }));

            // 3. Section: TEXT APPEARANCE
            const textSec = document.createElement('div');
            textSec.className = 'cp-settings-section-title';
            textSec.textContent = 'Text Appearance';
            body.appendChild(textSec);

            // Font Family
            const fontLabels = {
                'default': 'Inter',
                'sans-serif': 'Sans-Serif',
                'serif': 'Serif',
                'monospace': 'Monospace'
            };
            body.appendChild(createSettingItem({
                icon: ICONS.SETTING.font,
                text: 'Font Family',
                tooltip: fontLabels[s.fontFamily] || 'Default',
                arrow: true,
                onClick: () => showPanel('sub-font')
            }));

            // Font Size Slider
            body.appendChild(createSliderItem({
                text: 'Font Size',
                value: s.fontSize,
                min: 50,
                max: 200,
                step: 5,
                unit: '%',
                onInput: (val) => {
                    s.fontSize = val;
                    s.preset = 'custom';
                    applySubtitleStyles();
                    if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                },
                onChange: (val) => {
                    s.fontSize = val;
                    s.preset = 'custom';
                    saveSubtitleSettings(s);
                    buildSettingsPanel(true);
                }
            }));

            // Text Color
            body.appendChild(createColorItem({
                text: 'Text Color',
                value: s.textColor || '#ffffff',
                onChange: (color, final) => {
                    s.textColor = color;
                    s.preset = 'custom';
                    applySubtitleStyles();
                    if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                    if (final) {
                        saveSubtitleSettings(s);
                        buildSettingsPanel(true);
                    }
                }
            }));

            // Text Opacity Slider
            body.appendChild(createSliderItem({
                text: 'Text Opacity',
                value: s.textOpacity,
                min: 0,
                max: 100,
                step: 5,
                unit: '%',
                onInput: (val) => {
                    s.textOpacity = val;
                    s.preset = 'custom';
                    applySubtitleStyles();
                    if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                },
                onChange: (val) => {
                    s.textOpacity = val;
                    s.preset = 'custom';
                    saveSubtitleSettings(s);
                    buildSettingsPanel(true);
                }
            }));

            // Text Style
            let styleLabel = 'Normal';
            if (s.fontWeight === '700' && s.fontStyle === 'italic') styleLabel = 'Bold Italic';
            else if (s.fontWeight === '700') styleLabel = 'Bold';
            else if (s.fontStyle === 'italic') styleLabel = 'Italic';

            body.appendChild(createSettingItem({
                icon: ICONS.SETTING.font,
                text: 'Text Style',
                tooltip: styleLabel,
                arrow: true,
                onClick: () => showPanel('sub-style')
            }));

            // Edge Style
            const edgeLabels = {
                'none': 'None',
                'shadow': 'Shadow',
                'outline': 'Outline',
                'raised': 'Raised',
                'depressed': 'Depressed'
            };
            body.appendChild(createSettingItem({
                icon: ICONS.SETTING.sliders,
                text: 'Edge Style',
                tooltip: edgeLabels[s.edgeStyle] || 'Shadow',
                arrow: true,
                onClick: () => showPanel('sub-edge')
            }));

            // 4. Section: BACKGROUND BOX
            const bgSec = document.createElement('div');
            bgSec.className = 'cp-settings-section-title';
            bgSec.textContent = 'Background Box';
            body.appendChild(bgSec);

            // Background Type
            const bgLabels = {
                'none': 'None',
                'box': 'Box',
                'custom': 'Custom'
            };
            body.appendChild(createSettingItem({
                icon: ICONS.SETTING.palette,
                text: 'Background',
                tooltip: bgLabels[s.backgroundType] || 'Box',
                arrow: true,
                onClick: () => showPanel('sub-bg')
            }));

            if (s.backgroundType !== 'none') {
                // Background Color
                body.appendChild(createColorItem({
                    text: 'Background Color',
                    value: s.backgroundColor || '#000000',
                    onChange: (color, final) => {
                        s.backgroundColor = color;
                        s.preset = 'custom';
                        applySubtitleStyles();
                        if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                        if (final) {
                            saveSubtitleSettings(s);
                            buildSettingsPanel(true);
                        }
                    }
                }));

                // Background Opacity
                body.appendChild(createSliderItem({
                    text: 'Bg Opacity',
                    value: s.backgroundOpacity,
                    min: 0,
                    max: 100,
                    step: 5,
                    unit: '%',
                    onInput: (val) => {
                        s.backgroundOpacity = val;
                        s.preset = 'custom';
                        applySubtitleStyles();
                        if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                    },
                    onChange: (val) => {
                        s.backgroundOpacity = val;
                        s.preset = 'custom';
                        saveSubtitleSettings(s);
                        buildSettingsPanel(true);
                    }
                }));

                // Corner Radius
                body.appendChild(createSliderItem({
                    text: 'Corner Radius',
                    value: s.borderRadius,
                    min: 0,
                    max: 12,
                    step: 1,
                    unit: 'px',
                    onInput: (val) => {
                        s.borderRadius = val;
                        s.preset = 'custom';
                        applySubtitleStyles();
                    },
                    onChange: (val) => {
                        s.borderRadius = val;
                        s.preset = 'custom';
                        saveSubtitleSettings(s);
                        buildSettingsPanel(true);
                    }
                }));

                // Horizontal Padding
                body.appendChild(createSliderItem({
                    text: 'Horizontal Padding',
                    value: s.paddingHorizontal,
                    min: 0,
                    max: 24,
                    step: 1,
                    unit: 'px',
                    onInput: (val) => {
                        s.paddingHorizontal = val;
                        s.preset = 'custom';
                        applySubtitleStyles();
                    },
                    onChange: (val) => {
                        s.paddingHorizontal = val;
                        s.preset = 'custom';
                        saveSubtitleSettings(s);
                        buildSettingsPanel(true);
                    }
                }));

                // Vertical Padding
                body.appendChild(createSliderItem({
                    text: 'Vertical Padding',
                    value: s.paddingVertical,
                    min: 0,
                    max: 16,
                    step: 1,
                    unit: 'px',
                    onInput: (val) => {
                        s.paddingVertical = val;
                        s.preset = 'custom';
                        applySubtitleStyles();
                    },
                    onChange: (val) => {
                        s.paddingVertical = val;
                        s.preset = 'custom';
                        saveSubtitleSettings(s);
                        buildSettingsPanel(true);
                    }
                }));
            }

            // 5. Section: POSITION & TIMING
            const posSec = document.createElement('div');
            posSec.className = 'cp-settings-section-title';
            posSec.textContent = 'Position & Timing';
            body.appendChild(posSec);

            // Position
            const posLabels = {
                'low': 'Low',
                'normal': 'Normal',
                'high': 'High',
                'custom': 'Custom'
            };
            body.appendChild(createSettingItem({
                icon: ICONS.SETTING.sliders,
                text: 'Position',
                tooltip: posLabels[s.position] || 'Normal',
                arrow: true,
                onClick: () => showPanel('sub-pos')
            }));

            if (s.position === 'custom') {
                body.appendChild(createSliderItem({
                    text: 'Custom Bottom',
                    value: s.customPositionBottom,
                    min: 5,
                    max: 150,
                    step: 5,
                    unit: 'px',
                    onInput: (val) => {
                        s.customPositionBottom = val;
                        s.preset = 'custom';
                        applySubtitleStyles();
                    },
                    onChange: (val) => {
                        s.customPositionBottom = val;
                        s.preset = 'custom';
                        saveSubtitleSettings(s);
                        buildSettingsPanel(true);
                    }
                }));
            }

            // Alignment
            const alignLabels = {
                'left': 'Left',
                'center': 'Center',
                'right': 'Right'
            };
            body.appendChild(createSettingItem({
                icon: ICONS.SETTING.sliders,
                text: 'Alignment',
                tooltip: alignLabels[s.alignment] || 'Center',
                arrow: true,
                onClick: () => showPanel('sub-align')
            }));

            // Subtitle Delay
            const formatDelay = (d) => {
                const num = parseFloat(d) || 0;
                return (num > 0 ? '+' : '') + num.toFixed(1) + 's';
            };
            body.appendChild(createStepperItem({
                text: 'Subtitle Delay',
                value: s.delay,
                min: -5.0,
                max: 5.0,
                step: 0.1,
                format: formatDelay,
                onStep: (val) => {
                    s.delay = val;
                    s.preset = 'custom';
                    saveSubtitleSettings(s);
                    if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                    const fineRange = panel.querySelector('.cp-sub-delay-range');
                    if (fineRange) fineRange.value = val;
                }
            }));

            // Fine Delay Slider
            body.appendChild(createSliderItem({
                text: 'Fine Delay Scrub',
                value: s.delay,
                min: -5.0,
                max: 5.0,
                step: 0.1,
                unit: 's',
                onInput: (val) => {
                    s.delay = val;
                    s.preset = 'custom';
                    if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                    const stepVal = panel.querySelector('.cp-step-val');
                    if (stepVal) stepVal.textContent = formatDelay(val);
                },
                onChange: (val) => {
                    s.delay = val;
                    s.preset = 'custom';
                    saveSubtitleSettings(s);
                    if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                }
            }));

            // Divider
            const div = document.createElement('div');
            div.className = 'cp-settings-divider';
            body.appendChild(div);

            // Reset to Defaults
            body.appendChild(createSettingItem({
                icon: ICONS.SETTING.reset,
                text: 'Reset to Defaults',
                tooltip: 'Restore',
                onClick: () => {
                    STATE.subtitleSettings = Object.assign({}, DEFAULT_SUB_SETTINGS);
                    saveSubtitleSettings(STATE.subtitleSettings);
                    applySubtitleStyles();
                    if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                    buildSettingsPanel(true);
                    showToast('Subtitle settings reset', 'info', 1500);
                }
            }));

            panel.appendChild(body);
            return panel;
        }

        function buildSubtitleSubmenus(container) {
            // 1. Presets Submenu
            container.appendChild(buildSubmenu('sub-presets', 'Subtitle Presets', [
                { label: 'Default', value: 'default' },
                { label: 'Anime', value: 'anime' },
                { label: 'Clean', value: 'clean' },
                { label: 'High Contrast', value: 'high-contrast' }
            ], STATE.subtitleSettings.preset, (item) => {
                if (SUBTITLE_PRESETS[item.value]) {
                    STATE.subtitleSettings = Object.assign({}, SUBTITLE_PRESETS[item.value], {
                        delay: STATE.subtitleSettings.delay || 0
                    });
                    saveSubtitleSettings(STATE.subtitleSettings);
                    applySubtitleStyles();
                    if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                    buildSettingsPanel(true);
                    showToast('Preset: ' + item.label, 'info', 1500);
                }
            }, 'sub-settings'));

            // 2. Font Family Submenu
            container.appendChild(buildSubmenu('sub-font', 'Font Family', [
                { label: 'Default (Inter)', value: 'default' },
                { label: 'Sans-Serif (System)', value: 'sans-serif' },
                { label: 'Serif (Georgia)', value: 'serif' },
                { label: 'Monospace (JetBrains)', value: 'monospace' }
            ], STATE.subtitleSettings.fontFamily, (item) => {
                STATE.subtitleSettings.fontFamily = item.value;
                STATE.subtitleSettings.preset = 'custom';
                saveSubtitleSettings(STATE.subtitleSettings);
                applySubtitleStyles();
                if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                buildSettingsPanel(true);
            }, 'sub-settings'));

            // 3. Text Style Submenu
            const currentStyleVal = (STATE.subtitleSettings.fontWeight === '700' && STATE.subtitleSettings.fontStyle === 'italic') ? 'bold-italic'
                : (STATE.subtitleSettings.fontWeight === '700') ? 'bold'
                : (STATE.subtitleSettings.fontStyle === 'italic') ? 'italic' : 'normal';

            container.appendChild(buildSubmenu('sub-style', 'Text Style', [
                { label: 'Normal', value: 'normal' },
                { label: 'Bold', value: 'bold' },
                { label: 'Italic', value: 'italic' },
                { label: 'Bold + Italic', value: 'bold-italic' }
            ], currentStyleVal, (item) => {
                if (item.value === 'bold-italic') {
                    STATE.subtitleSettings.fontWeight = '700';
                    STATE.subtitleSettings.fontStyle = 'italic';
                } else if (item.value === 'bold') {
                    STATE.subtitleSettings.fontWeight = '700';
                    STATE.subtitleSettings.fontStyle = 'normal';
                } else if (item.value === 'italic') {
                    STATE.subtitleSettings.fontWeight = '400';
                    STATE.subtitleSettings.fontStyle = 'italic';
                } else {
                    STATE.subtitleSettings.fontWeight = '400';
                    STATE.subtitleSettings.fontStyle = 'normal';
                }
                STATE.subtitleSettings.preset = 'custom';
                saveSubtitleSettings(STATE.subtitleSettings);
                applySubtitleStyles();
                if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                buildSettingsPanel(true);
            }, 'sub-settings'));

            // 4. Edge Style Submenu
            container.appendChild(buildSubmenu('sub-edge', 'Edge Style', [
                { label: 'None', value: 'none' },
                { label: 'Shadow (Default)', value: 'shadow' },
                { label: 'Outline', value: 'outline' },
                { label: 'Raised', value: 'raised' },
                { label: 'Depressed', value: 'depressed' }
            ], STATE.subtitleSettings.edgeStyle, (item) => {
                STATE.subtitleSettings.edgeStyle = item.value;
                STATE.subtitleSettings.preset = 'custom';
                saveSubtitleSettings(STATE.subtitleSettings);
                applySubtitleStyles();
                if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                buildSettingsPanel(true);
            }, 'sub-settings'));

            // 5. Background Submenu
            container.appendChild(buildSubmenu('sub-bg', 'Background Type', [
                { label: 'None', value: 'none' },
                { label: 'Box (Default)', value: 'box' },
                { label: 'Custom', value: 'custom' }
            ], STATE.subtitleSettings.backgroundType, (item) => {
                STATE.subtitleSettings.backgroundType = item.value;
                STATE.subtitleSettings.preset = 'custom';
                saveSubtitleSettings(STATE.subtitleSettings);
                applySubtitleStyles();
                if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                buildSettingsPanel(true);
            }, 'sub-settings'));

            // 6. Position Submenu
            container.appendChild(buildSubmenu('sub-pos', 'Vertical Position', [
                { label: 'Low', value: 'low' },
                { label: 'Normal (Default)', value: 'normal' },
                { label: 'High', value: 'high' },
                { label: 'Custom', value: 'custom' }
            ], STATE.subtitleSettings.position, (item) => {
                STATE.subtitleSettings.position = item.value;
                STATE.subtitleSettings.preset = 'custom';
                saveSubtitleSettings(STATE.subtitleSettings);
                applySubtitleStyles();
                if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                buildSettingsPanel(true);
            }, 'sub-settings'));

            // 7. Alignment Submenu
            container.appendChild(buildSubmenu('sub-align', 'Text Alignment', [
                { label: 'Left', value: 'left' },
                { label: 'Center (Default)', value: 'center' },
                { label: 'Right', value: 'right' }
            ], STATE.subtitleSettings.alignment, (item) => {
                STATE.subtitleSettings.alignment = item.value;
                STATE.subtitleSettings.preset = 'custom';
                saveSubtitleSettings(STATE.subtitleSettings);
                applySubtitleStyles();
                if (STATE.video) renderActiveSubtitles(STATE.video.currentTime);
                buildSettingsPanel(true);
            }, 'sub-settings'));
        }

        function createSettingItem({ icon, text, tooltip, arrow, isSwitch, switchOn, name, onClick }) {
            const item = document.createElement('div');
            item.className = 'cp-settings-item';
            if (name) item.setAttribute('data-name', name);

            let html = '<div class="cp-settings-item-left">';
            if (icon) html += '<div class="cp-settings-item-icon">' + icon + '</div>';
            html += '<span class="cp-settings-item-text">' + text + '</span>';
            html += '</div>';
            html += '<div class="cp-settings-item-right">';

            if (isSwitch) {
                html += '<div class="cp-switch' + (switchOn ? ' cp-switch-on' : '') + '">' +
                    '<span class="cp-switch-track"><span class="cp-switch-thumb"></span></span>' +
                    '</div>';
            } else {
                if (tooltip) html += '<span class="cp-settings-item-tooltip">' + tooltip + '</span>';
                if (arrow) html += '<div class="cp-settings-item-arrow">' + ICONS.SETTING.arrowRight + '</div>';
            }

            html += '</div>';
            item.innerHTML = html;
            if (onClick) item.addEventListener('click', onClick);
            return item;
        }

        function buildSubmenu(panelId, title, items, selectedValue, onSelect, backPanelId = 'main') {
            const panel = document.createElement('div');
            panel.className = 'cp-settings-panel cp-submenu';
            panel.id = 'cp-panel-' + panelId;

            // Fixed header (outside scrollable body)
            const header = document.createElement('div');
            header.className = 'cp-submenu-header';
            header.innerHTML = '<div class="cp-back-btn">' + ICONS.SETTING.arrowLeft + '</div>' +
                               '<span class="cp-submenu-title">' + title + '</span>';
            header.addEventListener('click', () => showPanel(backPanelId));
            panel.appendChild(header);

            // Scrollable body (only list items scroll)
            const body = document.createElement('div');
            body.className = 'cp-submenu-body';

            items.forEach(item => {
                const el = document.createElement('div');
                el.className = 'cp-settings-item' + (item.value === selectedValue ? ' cp-selected' : '');
                el.innerHTML = '<span class="cp-check-icon">' + ICONS.SETTING.check + '</span>' +
                    '<span class="cp-settings-item-text">' + item.label + '</span>';
                el.addEventListener('click', () => onSelect(item));
                body.appendChild(el);
            });

            panel.appendChild(body);
            return panel;
        }

        function showPanel(panelId) {
            STATE.activePanel = panelId;
            document.querySelectorAll('.cp-settings-panel').forEach(p => p.classList.remove('cp-panel-active'));
            const target = document.getElementById('cp-panel-' + panelId);
            if (target) {
                target.classList.add('cp-panel-active');
                const body = target.querySelector('.cp-submenu-body');
                if (body) {
                    const selected = body.querySelector('.cp-selected');
                    if (selected) {
                        selected.scrollIntoView({ block: 'nearest' });
                    } else {
                        body.scrollTop = 0;
                    }
                }
            }
        }

        /* ── Settings Toggle ── */
        function toggleSettings() {
            STATE.isSettingsOpen = !STATE.isSettingsOpen;
            const root = document.getElementById('player-root');
            root.classList.toggle('cp-settings-open', STATE.isSettingsOpen);

            const settBtns = document.querySelectorAll('.cp-btn-settings, .cp-mobile-settings-btn');
            settBtns.forEach(b => b.classList.toggle('cp-active', STATE.isSettingsOpen));

            if (STATE.isSettingsOpen) {
                STATE.activePanel = 'main';
                buildSettingsPanel();
                clearTimeout(STATE.controlTimer);
            } else {
                triggerControlHideTimer(1500);
            }
        }

        function closeSettings() {
            if (!STATE.isSettingsOpen) return;
            STATE.isSettingsOpen = false;
            const root = document.getElementById('player-root');
            root.classList.remove('cp-settings-open');
            const settBtns = document.querySelectorAll('.cp-btn-settings, .cp-mobile-settings-btn');
            settBtns.forEach(b => b.classList.remove('cp-active'));
            const mobile = (Date.now() - lastTouchTime < 5000) || isMobile();
            triggerControlHideTimer(mobile ? MOBILE_CONTROLS_HIDE_DELAY : 1500, mobile);
        }

        /* ── Controls Auto-Hide Logic ── */
        function isControlsHovered() {
            const hasHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
            if (!hasHover) return false;
            const controlsRow = document.querySelector('.cp-controls');
            const progress = document.querySelector('.cp-progress');
            const topBar = document.querySelector('.cp-mobile-top-bar');
            if (controlsRow && controlsRow.matches(':hover')) return true;
            if (progress && progress.matches(':hover')) return true;
            if (topBar && topBar.matches(':hover')) return true;
            return false;
        }

        function hideControlsNow() {
            clearTimeout(STATE.controlTimer);
            STATE.controlTimer = null;
            const root = document.getElementById('player-root');
            if (root) root.classList.remove('cp-controls-visible');
        }

        function isMobile() {
            const root = document.getElementById('player-root');
            if (root && root.classList.contains('is-mobile')) return true;
            if (Date.now() - lastTouchTime < 15000) return true;
            if (window.innerWidth <= 768 && (('ontouchstart' in window) || (navigator.maxTouchPoints > 0))) return true;
            return false;
        }

        function triggerControlHideTimer(delay, isTouch = false) {
            clearTimeout(STATE.controlTimer);
            STATE.controlTimer = null;

            if (STATE.isSettingsOpen) return;

            const mobile = isTouch || isMobile();
            const timeoutMs = (delay !== undefined && delay !== null)
                ? delay
                : (mobile ? MOBILE_CONTROLS_HIDE_DELAY : 1500);

            // On desktop, keep controls visible while hovering or while video is paused
            if (!mobile) {
                if (isControlsHovered()) return;
                if (STATE.video && STATE.video.paused) return;
            }

            STATE.controlTimer = setTimeout(() => {
                if (STATE.isSettingsOpen) return;
                if (!mobile) {
                    if (isControlsHovered()) return;
                    if (STATE.video && STATE.video.paused) return;
                }
                const root = document.getElementById('player-root');
                if (root) root.classList.remove('cp-controls-visible');
                STATE.controlTimer = null;
            }, timeoutMs);
        }

        function wakeControls(delay, isTouch = false) {
            const root = document.getElementById('player-root');
            if (root) root.classList.add('cp-controls-visible');
            const mobile = isTouch || isMobile();
            const timeoutMs = (delay !== undefined && delay !== null)
                ? delay
                : (mobile ? MOBILE_CONTROLS_HIDE_DELAY : 1500);
            triggerControlHideTimer(timeoutMs, mobile);
        }

        function resetMobileControlsTimer() {
            lastTouchTime = Date.now();
            const root = document.getElementById('player-root');
            if (root && root.classList.contains('cp-controls-visible')) {
                triggerControlHideTimer(MOBILE_CONTROLS_HIDE_DELAY, true);
            }
        }

        /* ── Control Hover Listeners ── */
        function bindControlHoverListeners() {
            const elements = document.querySelectorAll('.cp-controls, .cp-progress, .cp-mobile-top-bar');
            elements.forEach(el => {
                if (el.dataset.hoverWired) return;
                el.dataset.hoverWired = 'true';
                el.addEventListener('mouseenter', () => {
                    if (isMobile()) return;
                    clearTimeout(STATE.controlTimer);
                });
                el.addEventListener('mouseleave', () => {
                    if (isMobile()) return;
                    triggerControlHideTimer(1500, false);
                });
            });
        }

        /* ── Skip Timestamp ── */
        function skipTimestamp(type) {
            if (!STATE.video || !STATE.streamData) return;
            if (type === 'intro' && STATE.streamData.intro && STATE.streamData.intro.end) {
                STATE.video.currentTime = STATE.streamData.intro.end;
                showToast('Skipped Intro', 'info', 2000);
            } else if (type === 'outro' && STATE.streamData.outro && STATE.streamData.outro.end) {
                STATE.video.currentTime = STATE.streamData.outro.end;
                showToast('Skipped Outro', 'info', 2000);
            }
        }
        // Expose to global for onclick
        window.skipTimestamp = skipTimestamp;

        /* ── Server / Episode Change ── */
        function onUserSelectServer(serverVal) {
            STATE.server = parseInt(serverVal, 10);
            STATE.failoverAttempt = 0;
            closeSettings();
            initStream();
        }

        function changeEpisode(epNum) {
            if (epNum === STATE.currentEp) return;
            STATE.currentEp = epNum;
            document.title = (STATE.title ? STATE.title + ' - ' : '') + 'Episode ' + epNum;
            initStream();
            postToParent('aniembed:episode_change', { episode: epNum });
        }

        /* ── Keyboard Hotkeys ── */
        document.addEventListener('keydown', (e) => {
            const video = STATE.video;
            if (!video) return;
            const key = e.key.toLowerCase();

            switch (key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlayPause();
                    wakeControls();
                    break;
                case 'arrowleft':
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    wakeControls();
                    break;
                case 'arrowright':
                    e.preventDefault();
                    video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
                    wakeControls();
                    break;
                case 'arrowup':
                    e.preventDefault();
                    video.volume = Math.min(1, video.volume + 0.1);
                    video.muted = false;
                    STATE.isMuted = false;
                    updateVolumeUI();
                    wakeControls();
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    video.volume = Math.max(0, video.volume - 0.1);
                    wakeControls();
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    wakeControls();
                    break;
                case 'c':
                    e.preventDefault();
                    toggleSubtitle();
                    break;
                case 'escape':
                    if (STATE.isSettingsOpen) closeSettings();
                    break;
            }
        });

        /* ── Touch Gestures & Pointer Events Engine ── */
        const gesture = {
            activePointerId: null,
            startX: 0,
            startY: 0,
            startTime: 0,
            hasMoved: false,
            longPressTimer: null,
            isLongPressing: false,
            prevPlaybackRate: 1.0,
            lastTapTime: 0,
            lastTapX: 0,
            lastTapY: 0,
            singleTapTimer: null,
            seekTimer: null
        };

        let lastTouchTime = 0;

        function seekRelative(seconds) {
            const video = STATE.video;
            if (!video || !video.duration) return;
            const newTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
            video.currentTime = newTime;
            const mobile = (Date.now() - lastTouchTime < 5000) || isMobile();
            wakeControls(mobile ? MOBILE_CONTROLS_HIDE_DELAY : 1500, mobile);
        }

        function showSeekIndicator(side, text) {
            const el = document.querySelector('.cp-seek-indicator.cp-' + side);
            if (!el) return;
            el.textContent = text;
            el.classList.add('cp-show');
            clearTimeout(gesture.seekTimer);
            gesture.seekTimer = setTimeout(() => {
                el.classList.remove('cp-show');
            }, 600);
        }

        function showSpeedIndicator(show) {
            const el = document.getElementById('cp-speed-indicator');
            if (!el) return;
            if (show) {
                el.classList.add('cp-show');
            } else {
                el.classList.remove('cp-show');
            }
        }

        function cleanupGestureState() {
            clearTimeout(gesture.longPressTimer);
            gesture.longPressTimer = null;
            if (gesture.isLongPressing) {
                if (STATE.video) STATE.video.playbackRate = gesture.prevPlaybackRate;
                showSpeedIndicator(false);
                gesture.isLongPressing = false;
            }
            gesture.activePointerId = null;
            gesture.hasMoved = false;
        }

        function isControlElement(target) {
            if (!target) return false;
            return !!target.closest(
                '.cp-bottom, .cp-mobile-top-bar, .cp-settings, .skip-button, .cp-center-play, .toast-msg, .cp-speed-indicator, button, .cp-ctrl-btn, .cp-mobile-btn, .cp-progress'
            );
        }

        const playerRoot = document.getElementById('player-root');

        playerRoot.addEventListener('pointerdown', (e) => {
            // Only primary pointer to ignore multi-touch / pinch gestures
            if (!e.isPrimary) return;

            const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
            if (isTouch || isMobile()) {
                lastTouchTime = Date.now();
            }

            // Ignore touches that begin on controls or buttons, but reset timer on mobile
            if (isControlElement(e.target)) {
                if (isTouch || isMobile()) {
                    resetMobileControlsTimer();
                }
                return;
            }

            // Reset any active gesture state
            if (gesture.activePointerId !== null) {
                cleanupGestureState();
            }

            gesture.activePointerId = e.pointerId;
            gesture.startX = e.clientX;
            gesture.startY = e.clientY;
            gesture.startTime = Date.now();
            gesture.hasMoved = false;
            gesture.isLongPressing = false;

            // Long-press detection for touch / pen / mobile
            if (e.pointerType === 'touch' || e.pointerType === 'pen' || isMobile()) {
                clearTimeout(gesture.longPressTimer);
                gesture.longPressTimer = setTimeout(() => {
                    if (gesture.activePointerId === e.pointerId && !gesture.hasMoved && STATE.video && !STATE.video.paused) {
                        gesture.isLongPressing = true;
                        gesture.prevPlaybackRate = STATE.video.playbackRate || STATE.playbackRate || 1.0;
                        STATE.video.playbackRate = TOUCH_CONFIG.longPressSpeed;
                        showSpeedIndicator(true);

                        // Cancel any pending single-tap
                        clearTimeout(gesture.singleTapTimer);
                        gesture.singleTapTimer = null;
                    }
                }, TOUCH_CONFIG.longPressDelay);
            }
        });

        playerRoot.addEventListener('pointermove', (e) => {
            if (e.pointerId !== gesture.activePointerId) return;

            const dist = Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY);
            if (dist > TOUCH_CONFIG.moveThreshold) {
                gesture.hasMoved = true;
                // Meaningful movement cancels tap and long-press
                clearTimeout(gesture.longPressTimer);
                gesture.longPressTimer = null;
                if (gesture.isLongPressing) {
                    if (STATE.video) STATE.video.playbackRate = gesture.prevPlaybackRate;
                    showSpeedIndicator(false);
                    gesture.isLongPressing = false;
                }
            }
        });

        playerRoot.addEventListener('pointerup', (e) => {
            if (e.pointerId !== gesture.activePointerId) return;

            clearTimeout(gesture.longPressTimer);
            gesture.longPressTimer = null;

            // Long press release: restore previous speed and consume interaction without triggering tap
            if (gesture.isLongPressing) {
                if (STATE.video) STATE.video.playbackRate = gesture.prevPlaybackRate;
                showSpeedIndicator(false);
                gesture.isLongPressing = false;
                lastTouchTime = Date.now();
                gesture.activePointerId = null;
                return;
            }

            // Moved finger: cancel tap
            if (gesture.hasMoved) {
                lastTouchTime = Date.now();
                gesture.activePointerId = null;
                return;
            }

            const mobile = isMobile() || e.pointerType === 'touch' || e.pointerType === 'pen';

            // Desktop mouse pointer: leave click handler to toggle play/pause immediately
            if (!mobile && e.pointerType === 'mouse') {
                gesture.activePointerId = null;
                return;
            }

            // Mobile tap interaction (touch, pen, or mobile emulation):
            lastTouchTime = Date.now();
            const now = Date.now();
            const timeSinceLast = now - gesture.lastTapTime;
            const distFromLast = Math.hypot(e.clientX - gesture.lastTapX, e.clientY - gesture.lastTapY);

            // Double tap check
            if (timeSinceLast < TOUCH_CONFIG.doubleTapDelay && distFromLast < 60) {
                // Cancel pending single tap
                clearTimeout(gesture.singleTapTimer);
                gesture.singleTapTimer = null;

                const rect = playerRoot.getBoundingClientRect();
                const relativeX = e.clientX - rect.left;
                const width = rect.width || window.innerWidth;

                if (relativeX < width * 0.45) {
                    // Left side: rewind
                    seekRelative(-TOUCH_CONFIG.seekSeconds);
                    showSeekIndicator('left', '-' + TOUCH_CONFIG.seekSeconds + 's');
                } else if (relativeX > width * 0.55) {
                    // Right side: forward
                    seekRelative(TOUCH_CONFIG.seekSeconds);
                    showSeekIndicator('right', '+' + TOUCH_CONFIG.seekSeconds + 's');
                } else {
                    // Center double tap: forward
                    seekRelative(TOUCH_CONFIG.seekSeconds);
                    showSeekIndicator('right', '+' + TOUCH_CONFIG.seekSeconds + 's');
                }

                gesture.lastTapTime = 0;
                wakeControls(MOBILE_CONTROLS_HIDE_DELAY, true);
            } else {
                // First tap: delay by doubleTapDelay before executing single tap to preserve double-tap detection
                gesture.lastTapTime = now;
                gesture.lastTapX = e.clientX;
                gesture.lastTapY = e.clientY;

                clearTimeout(gesture.singleTapTimer);
                gesture.singleTapTimer = setTimeout(() => {
                    const root = document.getElementById('player-root');
                    if (root) {
                        if (STATE.isSettingsOpen) {
                            closeSettings();
                            resetMobileControlsTimer();
                        } else if (root.classList.contains('cp-controls-visible')) {
                            // When controls are visible: User taps anywhere on random/empty video area -> Hide controls immediately & cancel pending timer
                            hideControlsNow();
                        } else {
                            // When controls are hidden: User taps anywhere on video surface -> Show controls & start 3-second timer immediately
                            wakeControls(MOBILE_CONTROLS_HIDE_DELAY, true);
                        }
                    }
                    gesture.singleTapTimer = null;
                }, TOUCH_CONFIG.doubleTapDelay);
            }

            gesture.activePointerId = null;
        });

        playerRoot.addEventListener('pointercancel', (e) => {
            if (e.pointerId === gesture.activePointerId) {
                lastTouchTime = Date.now();
                cleanupGestureState();
            }
        });

        playerRoot.addEventListener('touchstart', () => {
            lastTouchTime = Date.now();
        }, { passive: true });

        playerRoot.addEventListener('click', (e) => {
            if (isMobile() && isControlElement(e.target)) {
                resetMobileControlsTimer();
            }
        });

        /* ── Mobile Video Surface Context Menu Suppression ── */
        function isVideoSurfaceTarget(target) {
            if (!target) return false;
            if (target === STATE.video || target.id === 'cp-video' || (target.classList && target.classList.contains('cp-video'))) {
                return true;
            }
            if (target === playerRoot) return true;
            return playerRoot.contains(target) && !isControlElement(target);
        }

        function suppressMobileVideoContextMenu(e) {
            const isTouchOrMobile = isMobile() || 
                                    (Date.now() - lastTouchTime < 5000) || 
                                    gesture.isLongPressing || 
                                    (gesture.activePointerId !== null) ||
                                    (e.pointerType === 'touch' || e.pointerType === 'pen');

            if (isTouchOrMobile && isVideoSurfaceTarget(e.target)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }

        const videoEl = document.getElementById('cp-video');
        if (videoEl) {
            videoEl.addEventListener('contextmenu', suppressMobileVideoContextMenu, { capture: true });
        }
        playerRoot.addEventListener('contextmenu', suppressMobileVideoContextMenu, { capture: true });
        document.addEventListener('contextmenu', (e) => {
            if (isVideoSurfaceTarget(e.target)) {
                suppressMobileVideoContextMenu(e);
            }
        }, { capture: true });

        /* ── Click Outside Settings ── */
        document.addEventListener('pointerdown', (e) => {
            if (!STATE.isSettingsOpen) return;
            const inSettings = e.target && e.target.closest && e.target.closest('.cp-settings');
            const inSettingBtn = e.target && e.target.closest && e.target.closest('.cp-mobile-top-bar, .cp-btn-settings');
            if (!inSettings && !inSettingBtn) {
                closeSettings();
            }
        }, true);

        /* ── Mouse Activity (Desktop) ── */
        playerRoot.addEventListener('mousemove', (e) => {
            if (isMobile() || (Date.now() - lastTouchTime < 2000) || e.pointerType === 'touch' || e.pointerType === 'pen') return;
            wakeControls(1500, false);
        });
        playerRoot.addEventListener('mouseleave', () => {
            if (isMobile()) return;
            triggerControlHideTimer(1500, false);
        });

        /* ── Video Click → Play/Pause (Desktop Mouse Only) ── */
        document.getElementById('cp-video').addEventListener('click', (e) => {
            if (isMobile() || (Date.now() - lastTouchTime < 1000)) return; // Prevent mobile tap or synthetic click
            if (isControlElement(e.target)) return;
            togglePlayPause();
        });

        /* ── Center Play Click ── */
        document.querySelector('.cp-center-play').addEventListener('click', (e) => {
            togglePlayPause();
        });

        /* ── Button Wiring ── */
        const playPauseBtn = document.querySelector('.cp-btn-play-pause');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', (e) => {
                togglePlayPause();
            });
        }

        document.querySelector('.cp-btn-volume').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMute();
        });

        document.querySelector('.cp-btn-cast').addEventListener('click', (e) => {
            e.stopPropagation();
            attemptCast();
        });

        document.querySelector('.cp-btn-sub').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSubtitle();
            closeSettings();
        });

        document.querySelector('.cp-btn-pip').addEventListener('click', (e) => {
            e.stopPropagation();
            togglePiP();
        });

        document.querySelector('.cp-btn-settings').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSettings();
        });

        document.querySelector('.cp-btn-fullscreen').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFullscreen();
        });

        /* ── Mobile Top Bar Wiring ── */
        document.addEventListener('click', (e) => {
            const now = Date.now();
            const mobileCastBtn = e.target && e.target.closest && e.target.closest('.cp-mobile-cast-btn');
            if (mobileCastBtn) {
                e.preventDefault();
                e.stopPropagation();
                attemptCast();
                return;
            }
            const mobileSubBtn = e.target && e.target.closest && e.target.closest('.cp-mobile-sub-btn');
            if (mobileSubBtn) {
                e.preventDefault();
                e.stopPropagation();
                toggleSubtitle();
                closeSettings();
                return;
            }
            const mobileSetBtn = e.target && e.target.closest && e.target.closest('.cp-mobile-settings-btn');
            if (mobileSetBtn) {
                e.preventDefault();
                e.stopPropagation();
                toggleSettings();
                return;
            }
        });

        /* ── Initialize ── */
        function updateDeviceMode() {
            const isMob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                          (window.innerWidth <= 768 && (('ontouchstart' in window) || navigator.maxTouchPoints > 0));
            const root = document.getElementById('player-root');
            if (root) {
                if (isMob) {
                    root.classList.add('is-mobile');
                    root.classList.remove('is-desktop');
                } else {
                    root.classList.add('is-desktop');
                    root.classList.remove('is-mobile');
                }
            }
        }
        window.addEventListener('resize', updateDeviceMode);
        window.addEventListener('orientationchange', updateDeviceMode);

        document.addEventListener('DOMContentLoaded', () => {
            updateDeviceMode();
            applySubtitleStyles();
            setupProgressInteraction();
            bindControlHoverListeners();
            wakeControls();
            initStream();
        });
    `;
}
