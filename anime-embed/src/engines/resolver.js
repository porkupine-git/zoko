/**
 * MASTER STREAM RESOLUTION & FAILOVER COORDINATOR
 * Dynamically resolves streams across the 3 engines with graceful multi-server fallbacks
 */

import { resolveMegaPlayStream } from './megaplay.js';
import { resolveAniNekoStream } from './anineko.js';
import { resolveZokoStream } from './zoko.js';
import { getAnimeByAniListId, getAnimeByMalId } from '../metadata/anilist.js';

export async function resolveStreamWithFailover({
    anilistId,
    malId,
    title,
    episode = 1,
    track = "sub",
    preferredServer = 1
}, env = {}) {
    let resolvedAniId = anilistId;
    let resolvedMalId = malId;
    let resolvedTitle = title;
    let meta = null;

    if (resolvedAniId && !resolvedMalId) {
        meta = await getAnimeByAniListId(resolvedAniId);
        if (meta) {
            resolvedMalId = meta.idMal;
            if (!resolvedTitle) resolvedTitle = meta.title;
        }
    } else if (resolvedMalId && !resolvedAniId) {
        meta = await getAnimeByMalId(resolvedMalId);
        if (meta) {
            resolvedAniId = meta.id;
            if (!resolvedTitle) resolvedTitle = meta.title;
        }
    }

    const order = [preferredServer];
    [1, 2, 3].forEach(s => {
        if (!order.includes(s)) order.push(s);
    });

    const errors = [];

    for (const serverId of order) {
        try {
            let result = null;
            if (serverId === 1) {
                result = await resolveMegaPlayStream({
                    anilistId: resolvedAniId,
                    malId: resolvedMalId,
                    episode,
                    track
                }, env);
            } else if (serverId === 2) {
                result = await resolveAniNekoStream({
                    anilistId: resolvedAniId,
                    malId: resolvedMalId,
                    title: resolvedTitle,
                    episode,
                    track
                }, env);
            } else if (serverId === 3) {
                result = await resolveZokoStream({
                    anilistId: resolvedAniId,
                    malId: resolvedMalId,
                    title: resolvedTitle,
                    episode,
                    track
                }, env);
            }

            if (result && result.streamUrl) {
                return {
                    ...result,
                    resolvedAniId,
                    resolvedMalId,
                    resolvedTitle,
                    episode,
                    track,
                    meta: meta ? {
                        title: meta.title,
                        poster: meta.poster,
                        episodes: meta.episodes,
                        year: meta.year
                    } : null
                };
            }
        } catch (err) {
            errors.push({ serverId, error: err.message });
        }
    }

    throw new Error(`All 3 stream engines failed: ${errors.map(e => `Server ${e.serverId} (${e.error})`).join("; ")}`);
}

export async function resolveSpecificServer({
    serverId,
    anilistId,
    malId,
    title,
    episode = 1,
    track = "sub"
}, env = {}) {
    let resolvedAniId = anilistId;
    let resolvedMalId = malId;
    let resolvedTitle = title;

    if (resolvedAniId && !resolvedMalId) {
        const meta = await getAnimeByAniListId(resolvedAniId);
        if (meta?.idMal) resolvedMalId = meta.idMal;
        if (meta?.title && !resolvedTitle) resolvedTitle = meta.title;
    } else if (resolvedMalId && !resolvedAniId) {
        const meta = await getAnimeByMalId(resolvedMalId);
        if (meta?.id) resolvedAniId = meta.id;
        if (meta?.title && !resolvedTitle) resolvedTitle = meta.title;
    }

    if (serverId === 1) {
        return await resolveMegaPlayStream({ anilistId: resolvedAniId, malId: resolvedMalId, episode, track }, env);
    }
    if (serverId === 2) {
        return await resolveAniNekoStream({ anilistId: resolvedAniId, malId: resolvedMalId, title: resolvedTitle, episode, track }, env);
    }
    if (serverId === 3) {
        return await resolveZokoStream({ anilistId: resolvedAniId, malId: resolvedMalId, title: resolvedTitle, episode, track }, env);
    }
    throw new Error(`Invalid serverId: ${serverId}`);
}
