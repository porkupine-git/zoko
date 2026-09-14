/**
 * AUTOMATED TEST SUITE FOR VIDCLOUD EMBED PROVIDER
 */

import worker from './worker.js';
import { createEmbedTicket, verifyEmbedTicket } from './src/security/ticket.js';
import { checkClusterHealth } from './src/engines/health.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`  ✓ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${testName}`);
        failed++;
    }
}

async function runTests() {
    console.log("\n🧪 Running VidCloud Test Suite...\n");

    const dummyEnv = {
        PLAYER_ORIGIN: "https://player.anixo.online"
    };
    const dummyCtx = {
        waitUntil: () => {}
    };

    // Test 1: Landing Page & Studio HTML
    try {
        const req = new Request("http://vidcloud.sbs/");
        const res = await worker.fetch(req, dummyEnv, dummyCtx);
        const html = await res.text();
        assert(res.status === 200, "GET / returns 200 OK");
        assert(html.includes("VidCloud"), "Landing page contains 'VidCloud'");
    } catch (e) {
        assert(false, `Landing Page test exception: ${e.message}`);
    }

    // Test 2: Client SDK
    try {
        const req = new Request("http://vidcloud.sbs/embed-sdk.js");
        const res = await worker.fetch(req, dummyEnv, dummyCtx);
        const js = await res.text();
        assert(res.status === 200, "GET /embed-sdk.js returns 200 OK");
        assert(js.includes("VidCloudSDK"), "SDK script defines VidCloudSDK");
    } catch (e) {
        assert(false, `Embed SDK test exception: ${e.message}`);
    }

    // Test 3: AniList Embed Route (/embed/ani/21/1)
    try {
        const req = new Request("http://vidcloud.sbs/embed/ani/21/1?server=1&track=sub");
        const res = await worker.fetch(req, dummyEnv, dummyCtx);
        const html = await res.text();
        assert(res.status === 200, "GET /embed/ani/21/1 returns 200 OK");
        assert(html.includes("/player?id=21-1-1-sub"), "Embed HTML loads /player iframe under vidcloud.sbs");
        assert(html.includes("postMessage"), "Embed HTML contains bidirectional postMessage bridge");
        assert(html.includes("vidcloud.sbs"), "Embed HTML has provider identifier");
    } catch (e) {
        assert(false, `AniList Embed test exception: ${e.message}`);
    }

    // Test 4: Direct URL Embed Route (/embed?url=...)
    try {
        const directUrl = "https://example.com/video.m3u8";
        const req = new Request(`http://vidcloud.sbs/embed?url=${encodeURIComponent(directUrl)}&sub=https://example.com/sub.vtt`);
        const res = await worker.fetch(req, dummyEnv, dummyCtx);
        const html = await res.text();
        assert(res.status === 200, "GET /embed?url=... returns 200 OK");
        assert(html.includes("video.m3u8"), "Embed HTML passes direct video URL to player");
    } catch (e) {
        assert(false, `Direct URL Embed test exception: ${e.message}`);
    }

    // Test 5: AniList Search API
    try {
        const req = new Request("http://vidcloud.sbs/api/search?q=naruto");
        const res = await worker.fetch(req, dummyEnv, dummyCtx);
        const data = await res.json();
        assert(res.status === 200, "GET /api/search returns 200 OK");
        assert(Array.isArray(data) && data.length > 0, "Search returns non-empty array for 'naruto'");
        assert(data[0].title && data[0].id, "Search item contains title and ID");
    } catch (e) {
        assert(false, `AniList Search test exception: ${e.message}`);
    }

    // Test 6: Anime Metadata API
    try {
        const req = new Request("http://vidcloud.sbs/api/anime/21?type=ani");
        const res = await worker.fetch(req, dummyEnv, dummyCtx);
        const data = await res.json();
        assert(res.status === 200, "GET /api/anime/21 returns 200 OK");
        assert(data.id === 21, "Anime metadata matches AniList ID 21");
    } catch (e) {
        assert(false, `Anime Metadata test exception: ${e.message}`);
    }

    // Test 7: Security Ticket Cryptography
    try {
        const ticket = await createEmbedTicket({
            ip: "127.0.0.1",
            id: "21",
            idType: "ani",
            episode: 1
        });
        assert(ticket && typeof ticket === "string", "Generated valid ticket string");

        const checkValid = await verifyEmbedTicket(ticket, {
            ip: "127.0.0.1",
            id: "21",
            idType: "ani",
            episode: 1
        });
        assert(checkValid.valid === true, "Ticket verification succeeds for matching session");

        // Nonce reuse should be rejected (replay protection)
        const checkReplay = await verifyEmbedTicket(ticket, {
            ip: "127.0.0.1",
            id: "21",
            idType: "ani",
            episode: 1
        });
        assert(checkReplay.valid === false, "Replay attack rejected for consumed ticket");
    } catch (e) {
        assert(false, `Ticket Cryptography test exception: ${e.message}`);
    }

    // Test 8: Health & Upstream Status Route (/health)
    try {
        const req = new Request("http://vidcloud.sbs/health");
        const res = await worker.fetch(req, dummyEnv, dummyCtx);
        const data = await res.json();
        assert(res.status === 200 || res.status === 503, "GET /health returns valid status code");
        assert(data.playerEngine && data.playerEngine.endpoint, "Health response includes player engine status");
        assert(data.metadataApi && data.metadataApi.endpoint, "Health response includes metadata upstream status");
    } catch (e) {
        assert(false, `Health Route test exception: ${e.message}`);
    }

    console.log(`\n=============================`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log(`=============================\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
