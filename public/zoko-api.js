/**
 * Zoko Universal Anime API Client SDK (v4.1.0)
 * Works in: Browser (<script>), ES6 / Vite / Next.js / React, Vue, Svelte, Node.js
 * Zero dependencies. Built-in CORS handling & automatic endpoint resolution.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ZokoClient = factory();
        // Default instance auto-bound to current origin if in browser
        if (typeof window !== 'undefined') {
            root.zoko = new root.ZokoClient();
        }
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class ZokoClient {
        /**
         * @param {string} [baseUrl] - Base API URL (e.g. 'http://103.190.93.199' or '' for relative)
         */
        constructor(baseUrl) {
            if (baseUrl) {
                this.baseUrl = baseUrl.replace(/\/+$/, '');
            } else if (typeof window !== 'undefined' && window.location) {
                this.baseUrl = window.location.origin;
            } else {
                this.baseUrl = 'http://103.190.93.199';
            }
        }

        async _fetch(endpoint, params = {}) {
            const url = new URL(this.baseUrl + endpoint);
            Object.entries(params).forEach(([key, val]) => {
                if (val !== undefined && val !== null && val !== '') {
                    url.searchParams.append(key, val);
                }
            });

            const res = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!res.ok) {
                let errMessage = `HTTP ${res.status}: ${res.statusText}`;
                try {
                    const errData = await res.json();
                    if (errData.error) errMessage = errData.error;
                } catch {}
                throw new Error(errMessage);
            }

            return await res.json();
        }

        /**
         * Search 11,449+ anime titles (sub-10ms response)
         * @param {string} query - Anime title (e.g. 'Naruto', 'Attack on Titan')
         * @param {number} [page=1]
         * @param {number} [perPage=20]
         */
        async search(query, page = 1, perPage = 20) {
            return this._fetch('/api/search', { q: query, page, perPage });
        }

        /**
         * Get detailed metadata for an anime by AniList ID or MAL ID
         * @param {number|string} id - AniList ID or MAL ID (e.g. 21 for One Piece)
         */
        async getAnime(id) {
            return this._fetch(`/api/anime/${id}`);
        }

        /**
         * Get episodes catalog with thumbnails and titles
         * @param {number|string} id - Anime ID
         * @param {boolean} [all=true] - Fetch all episodes (e.g. 1180 for One Piece)
         * @param {number} [page=1]
         * @param {number} [size=50]
         */
        async getEpisodes(id, all = true, page = 1, size = 50) {
            return this._fetch(`/api/episodes/${id}`, { all: all ? 'true' : 'false', page, size });
        }

        /**
         * Universal Video Stream Extractor
         * Extracts CORS-proxied HLS master playlist, VTT subtitles, and intro/outro timestamps
         * @param {Object} options
         * @param {number|string} [options.id] - AniList ID or MAL ID (or shorthand '21-1')
         * @param {number|string} [options.malId] - MyAnimeList ID
         * @param {string} [options.title] - Anime title fallback
         * @param {number} [options.ep=1] - Episode number
         * @param {'sub'|'dub'} [options.track='sub'] - Audio language
         */
        async getStream(options = {}) {
            let { id, malId, ep = 1, track = 'sub', title } = options;
            return this._fetch('/api/stream', { id, malId, ep, track, title });
        }

        /**
         * Get dual audio streams using episode shorthand ID (e.g. '21-1')
         * @param {string} epId - Shorthand format: '<anime_id>-<episode_number>'
         */
        async getStreamById(epId) {
            return this._fetch(`/api/stream/${epId}`);
        }

        /**
         * Get homepage catalog (Spotlight Carousel, Trending, Popular, Top Rated)
         */
        async getHome() {
            return this._fetch('/api/home');
        }

        /**
         * Browse catalog with genre, format, and sorting filters
         * @param {Object} [params]
         * @param {string} [params.genre] - e.g. 'Action', 'Adventure', 'Fantasy'
         * @param {'TV'|'MOVIE'|'OVA'|'ONA'} [params.format]
         * @param {'TRENDING_DESC'|'SCORE_DESC'|'POPULARITY_DESC'} [params.sort='TRENDING_DESC']
         * @param {number} [params.page=1]
         * @param {number} [params.perPage=24]
         */
        async browse(params = {}) {
            return this._fetch('/api/browse', params);
        }

        /**
         * Generate a drop-in iframe URL for embedding the video player
         * @param {Object} options
         * @param {number|string} options.id - Anime ID
         * @param {number} [options.ep=1] - Episode number
         * @param {'sub'|'dub'} [options.track='sub'] - Audio track
         * @param {boolean} [options.autoplay=false] - Autoplay video
         * @param {string} [options.color='e50914'] - Player accent color hex
         * @returns {string} Ready-to-use iframe URL
         */
        getEmbedUrl(options = {}) {
            const { id, ep = 1, track = 'sub', autoplay = false, color = 'e50914' } = options;
            const params = new URLSearchParams({
                id,
                ep,
                track,
                autoplay: autoplay ? '1' : '0',
                color: color.replace('#', '')
            });
            return `${this.baseUrl}/embed?${params.toString()}`;
        }

        /**
         * Get VPS telemetry, hardware specifications, and SQLite database stats
         */
        async getStatus() {
            return this._fetch('/api/system/status');
        }

        /**
         * Helper: Attach HLS stream to an HTML5 <video> element or Hls.js instance
         * @param {HTMLVideoElement} videoElement
         * @param {string} streamUrl - HLS master playlist URL (from getStream().stream_url)
         */
        attachVideo(videoElement, streamUrl) {
            if (typeof window === 'undefined' || !videoElement) return;

            if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS (Safari, iOS, Mac)
                videoElement.src = streamUrl;
            } else if (typeof window.Hls !== 'undefined' && window.Hls.isSupported()) {
                // Hls.js (Chrome, Firefox, Edge, Android)
                const hls = new window.Hls();
                hls.loadSource(streamUrl);
                hls.attachMedia(videoElement);
                return hls;
            } else {
                console.warn('HLS is not supported natively. Please include hls.js on your page.');
                videoElement.src = streamUrl;
            }
        }
    }

    return ZokoClient;
}));
