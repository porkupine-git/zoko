/**
 * Universal Stream Resolver
 * Auto-detects and resolves:
 *  - bibiemb.xyz (VibePlayer)
 *  - otakuhg.site (StreamHG)
 */

const { resolveBibiemb, extractBibiId } = require('./bibiemb');
const { resolveOtakuhg, extractOtakuCode } = require('./otakuhg');
const { resolveOtakuVid, extractOtakuVidCode } = require('./otakuvid');
const { searchAnime, getAnimeDetails, getEpisodeServers, resolveEpisodeStream } = require('./catalog');
const { mapToSlug } = require('./mapper');

async function resolveStream(input, options = {}) {
    if (!input || typeof input !== 'string') {
        throw new Error('Input URL or ID is required.');
    }

    const trimmed = input.trim();

    // 1. Detect BibiEmb
    if (trimmed.includes('bibiemb.xyz') || trimmed.includes('vibeplayer.site')) {
        return await resolveBibiemb(trimmed, options);
    }

    // 2. Detect OtakuHG
    if (trimmed.includes('otakuhg.site') || trimmed.includes('streamhg.com')) {
        return await resolveOtakuhg(trimmed, options);
    }

    // 3. Detect OtakuVid / VidHide
    if (trimmed.includes('otakuvid.online') || trimmed.includes('vidhide')) {
        return await resolveOtakuVid(trimmed, options);
    }

    // 4. Fallback by length/pattern heuristics
    // 16 alphanumeric characters -> Try BibiEmb first, then OtakuVid
    if (/^[a-zA-Z0-9_-]{16}$/.test(trimmed)) {
        try {
            return await resolveBibiemb(trimmed, options);
        } catch (e) {
            try {
                return await resolveOtakuVid(trimmed, options);
            } catch (e2) {
                return await resolveOtakuhg(trimmed, options);
            }
        }
    }

    // 8-15 alphanumeric characters -> Try OtakuHG, then OtakuVid
    if (/^[a-zA-Z0-9]{8,15}$/.test(trimmed)) {
        try {
            return await resolveOtakuhg(trimmed, options);
        } catch (e) {
            return await resolveOtakuVid(trimmed, options);
        }
    }

    throw new Error('Could not identify embed provider for input. Provide a bibiemb.xyz, otakuhg.site, or otakuvid.online link.');
}

module.exports = {
    resolveStream,
    resolveBibiemb,
    extractBibiId,
    resolveOtakuhg,
    extractOtakuCode,
    resolveOtakuVid,
    extractOtakuVidCode,
    searchAnime,
    getAnimeDetails,
    getEpisodeServers,
    resolveEpisodeStream,
    mapToSlug
};
