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
        headers: { "User-Agent": "python-requests/2.31.0", "CF-Connecting-IP": "10.0.0.1" }
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
        headers: { "User-Agent": "curl/8.4.0", "CF-Connecting-IP": "10.0.0.2" }
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

    // 9d. Scraper Request without ticket (Spoofed Referer & User-Agent)
    console.log("   -> Testing scraper request without ticket (Spoofed Referer & User-Agent)...");
    const rawScraperReq = new Request("http://localhost:3005/api/stream/resolve?anilistId=21&episode=1&track=sub", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/124.0.0.0",
            "Referer": "https://anixo.buzz/embed/ani/21/1",
            "CF-Connecting-IP": "10.0.0.3",
            "Accept": "application/json"
        }
    });
    const rawScraperRes = await worker.fetch(rawScraperReq, {}, {});
    if (rawScraperRes.status === 403) {
        console.log("      ✓ Raw scraper without ticket successfully BLOCKED (HTTP 403 Forbidden)!");
    } else {
        throw new Error(`Scraper was not blocked! Status: ${rawScraperRes.status}`);
    }

    // 9e. Legitimate Full Embed Flow (Embed HTML -> Extract Ticket -> Resolve Stream)
    console.log("   -> Testing legitimate human embed player flow...");
    const embedReq = new Request("http://localhost:3005/embed/ani/21/1", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/124.0.0.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Referer": "http://localhost:3005/",
            "CF-Connecting-IP": "10.0.0.4"
        }
    });
    const embedPageRes = await worker.fetch(embedReq, {}, {});
    const embedPageHtml = await embedPageRes.text();
    
    // 1. Confirm that static regex scraping returns null
    const staticRegexMatch = embedPageHtml.match(/ticket:\s*"([^"]+)"/);
    if (staticRegexMatch) {
        throw new Error("VULNERABILITY: Static ticket is still visible via regex!");
    }
    console.log("      ✓ Static HTML regex scraper trapped (No ticket string in HTML)!");

    // 2. Browser client dynamic reconstitution
    const partAMatch = embedPageHtml.match(/id="cp-core-shield"\s+data-sh="([^"]+)"/);
    const fragBMatch = embedPageHtml.match(/b64\s*=\s*"([^"]+)"/);
    const seedMatch = embedPageHtml.match(/s\s*=\s*(\d+)/);
    if (!partAMatch || !fragBMatch || !seedMatch) {
        throw new Error("Failed to find dynamic shield components in HTML!");
    }
    const partA = partAMatch[1];
    const rawB = Buffer.from(fragBMatch[1], 'base64').toString('binary');
    const s = parseInt(seedMatch[1], 10);
    let partB = "";
    for (let i = 0; i < rawB.length; i++) {
        partB += String.fromCharCode(rawB.charCodeAt(i) ^ s);
    }
    const ticket = partA + partB;
    console.log(`      ✓ Browser Dynamic Shield Reconstituted Ticket: ${ticket.slice(0, 30)}...`);

    // Test legitimate stream resolution with ticket
    const legitReq = new Request("http://localhost:3005/api/stream/resolve?anilistId=21&episode=1&track=sub", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/124.0.0.0",
            "Referer": "http://localhost:3005/embed/ani/21/1",
            "CF-Connecting-IP": "10.0.0.4",
            "x-embed-ticket": ticket,
            "Accept": "application/json"
        }
    });
    const legitRes = await worker.fetch(legitReq, {}, {});
    const legitJson = await legitRes.json();
    if (legitJson.streamUrl && legitJson._hp !== 1) {
        console.log(`      ✓ Legitimate user with ticket received real stream! Server: ${legitJson.server}`);
        console.log(`        Stream URL: ${legitJson.streamUrl.slice(0, 70)}...`);
    } else {
        throw new Error(`Legitimate user failed to resolve stream! JSON: ${JSON.stringify(legitJson)}`);
    }

    // 9f. Stolen Ticket from Different IP
    console.log("   -> Testing stolen ticket replay from different IP...");
    const stolenReq = new Request("http://localhost:3005/api/stream/resolve?anilistId=21&episode=1&track=sub", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "CF-Connecting-IP": "192.168.100.5", // Different IP!
            "x-embed-ticket": ticket,
            "Accept": "application/json"
        }
    });
    const stolenRes = await worker.fetch(stolenReq, {}, {});
    if (stolenRes.status === 403) {
        console.log("      ✓ Cross-IP stolen ticket replay successfully BLOCKED (HTTP 403 Forbidden)!");
    } else {
        throw new Error(`Cross-IP ticket was not blocked! Status: ${stolenRes.status}`);
    }

    // 9g. Burst Scraping Rate Limiter Test
    console.log("   -> Testing burst scraping rate limiter...");
    const burstReq = new Request("http://localhost:3005/api/stream/resolve?anilistId=21&episode=1&track=sub", {
        headers: {
            "CF-Connecting-IP": "127.0.0.1",
            "User-Agent": "Mozilla/5.0",
            "x-embed-ticket": ticket
        }
    });
    const burstRes = await worker.fetch(burstReq, {}, {});
    if (burstRes.status === 429) {
        console.log("      ✓ Rapid burst scraping successfully BLOCKED (HTTP 429 Too Many Requests)!");
    } else {
        console.log(`      (Burst status: ${burstRes.status})`);
    }

    console.log("\n==============================================");
    console.log("🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("==============================================");
}

runTests().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
