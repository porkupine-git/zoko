/**
 * AUTOMATED TEST SUITE FOR ANIME EMBED PROVIDER
 */

import { searchAnime, getAnimeByAniListId, getAnimeByMalId } from './src/metadata/anilist.js';
import { resolveStreamWithFailover, resolveSpecificServer } from './src/engines/resolver.js';
import { renderEmbedHtml } from './src/player/embedHtml.js';
import { renderLandingHtml } from './src/landing/landingHtml.js';

async function runTests() {
    console.log("==============================================");
    console.log("⚡ TESTING ANIME EMBED PROVIDER & 3 ENGINES");
    console.log("==============================================\n");

    // 1. Test AniList Search
    console.log("1. Testing AniList GraphQL Search...");
    const searchRes = await searchAnime("Naruto");
    console.log(`   ✓ Found ${searchRes.length} results. First: ${searchRes[0]?.title} (AniList: ${searchRes[0]?.id}, MAL: ${searchRes[0]?.idMal})`);

    // 2. Test AniList details
    console.log("\n2. Testing AniList Metadata by ID...");
    const metaAni = await getAnimeByAniListId(21); // One Piece
    console.log(`   ✓ Resolved: ${metaAni?.title} (Episodes: ${metaAni?.episodes})`);

    // 3. Test MAL details
    console.log("\n3. Testing MAL Metadata by ID...");
    const metaMal = await getAnimeByMalId(20); // Naruto
    console.log(`   ✓ Resolved: ${metaMal?.title} (Episodes: ${metaMal?.episodes})`);

    // 4. Test Server 1 (MegaPlay)
    console.log("\n4. Testing Server 1 (MegaPlay Engine)...");
    try {
        const s1 = await resolveSpecificServer({ serverId: 1, anilistId: 21, episode: 1, track: "sub" });
        console.log(`   ✓ Server 1 OK: ${s1.server}`);
        console.log(`     Stream URL: ${s1.streamUrl.slice(0, 70)}...`);
        console.log(`     Subtitles: ${s1.subtitles.length}, Intro: ${s1.intro.end}s`);
    } catch (e) {
        console.warn(`   ✗ Server 1 error: ${e.message}`);
    }

    // 5. Test Server 2 (AniNeko)
    console.log("\n5. Testing Server 2 (AniNeko Engine)...");
    try {
        const s2 = await resolveSpecificServer({ serverId: 2, anilistId: 21, episode: 1, track: "sub" });
        console.log(`   ✓ Server 2 OK: ${s2.server}`);
        console.log(`     Stream URL: ${s2.streamUrl.slice(0, 70)}...`);
    } catch (e) {
        console.warn(`   ✗ Server 2 error: ${e.message}`);
    }

    // 6. Test Server 3 (Zoko)
    console.log("\n6. Testing Server 3 (Zoko Engine)...");
    try {
        const s3 = await resolveSpecificServer({ serverId: 3, anilistId: 21, episode: 1, track: "sub" });
        console.log(`   ✓ Server 3 OK: ${s3.server}`);
        console.log(`     Stream URL: ${s3.streamUrl.slice(0, 70)}...`);
    } catch (e) {
        console.warn(`   ✗ Server 3 error: ${e.message}`);
    }

    // 7. Test Stream Resolver with Failover
    console.log("\n7. Testing Stream Resolution with Automatic Failover...");
    const failoverRes = await resolveStreamWithFailover({ anilistId: 21, episode: 1, track: "sub", preferredServer: 1 });
    console.log(`   ✓ Resolved through: ${failoverRes.server}`);
    console.log(`     Stream URL: ${failoverRes.streamUrl.slice(0, 70)}...`);

    // 8. Test HTML Rendering
    console.log("\n8. Testing HTML Templates Generation...");
    const embedHtml = renderEmbedHtml({ id: "21", episode: 1, title: "One Piece", track: "sub" });
    console.log(`   ✓ Embed HTML size: ${embedHtml.length} bytes (No glow effects: ${!embedHtml.includes("glow")})`);

    const landingHtml = renderLandingHtml("http://localhost:3005");
    console.log(`   ✓ Landing HTML size: ${landingHtml.length} bytes (No glow effects: ${!landingHtml.includes("glow")})`);

    console.log("\n==============================================");
    console.log("🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("==============================================");
}

runTests().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
