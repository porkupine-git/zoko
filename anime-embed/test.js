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

    // 9. Test Honeypot & Decoy Stream Poisoning System
    console.log("\n9. Testing Honeypot & Decoy Stream Poisoning System...");
    const { default: worker } = await import('./worker.js');

    // 9a. Python Scraper Simulation
    console.log("   -> Testing python-requests bot detection...");
    const botReq = new Request("http://localhost:3005/api/stream/resolve?anilistId=21&episode=1&track=sub", {
        headers: { "User-Agent": "python-requests/2.31.0" }
    });
    const botRes = await worker.fetch(botReq, {}, {});
    const botJson = await botRes.json();
    if (botJson._hp === 1 && botRes.headers.get("X-Honeypot-Engaged") === "1") {
        console.log(`      ✓ Python scraper trapped! Received Decoy stream: ${botJson.streamUrl.slice(0, 60)}...`);
        console.log(`      ✓ English Scraper Notice: "${botJson.notice.slice(0, 60)}..."`);
    } else {
        throw new Error("Honeypot failed to trap Python scraper!");
    }

    // 9b. Curl Bot Simulation
    console.log("   -> Testing curl bot detection...");
    const curlReq = new Request("http://localhost:3005/api/stream/resolve?anilistId=21&episode=1&track=sub", {
        headers: { "User-Agent": "curl/8.4.0" }
    });
    const curlRes = await worker.fetch(curlReq, {}, {});
    const curlJson = await curlRes.json();
    if (curlJson._hp === 1) {
        console.log("      ✓ Curl scraper trapped in honeypot decoy successfully.");
    } else {
        throw new Error("Honeypot failed to trap curl!");
    }

    // 9c. Decoy WebVTT Subtitle Warning
    console.log("   -> Testing Decoy WebVTT subtitle delivery...");
    const vttReq = new Request("http://localhost:3005/api/stream/vtt?h=1");
    const vttRes = await worker.fetch(vttReq, {}, {});
    const vttText = await vttRes.text();
    if (vttText.includes("WEBVTT") && vttText.includes("NOTICE TO VIEWERS") && vttText.includes("megaplay.buzz")) {
        console.log("      ✓ Decoy WebVTT subtitle generated with on-screen viewer notice!");
    } else {
        throw new Error("Decoy WebVTT content verification failed!");
    }

    // 9d. Legitimate Browser Request
    console.log("   -> Testing legitimate human browser request...");
    const legitReq = new Request("http://localhost:3005/api/stream/resolve?anilistId=21&episode=1&track=sub", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/124.0.0.0",
            "Accept": "application/json"
        }
    });
    const legitRes = await worker.fetch(legitReq, {}, {});
    const legitJson = await legitRes.json();
    if (legitJson._hp !== 1 && !legitRes.headers.get("X-Honeypot-Engaged")) {
        console.log(`      ✓ Legitimate user bypassed honeypot and received real stream! Server: ${legitJson.server}`);
    } else {
        throw new Error("Honeypot falsely flagged a legitimate browser user!");
    }

    console.log("\n==============================================");
    console.log("🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("==============================================");
}

runTests().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
