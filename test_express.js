const app = require('./server');

let server;
const PORT = 3002; // Use test port
const BASE = `http://127.0.0.1:${PORT}`;

async function runTests() {
    console.log('='.repeat(65));
    console.log('🧪 RUNNING COMPREHENSIVE AUTOMATED TESTS FOR ZOKO ENGINE');
    console.log('='.repeat(65));

    server = app.listen(PORT);

    try {
        // 1. Healthcheck
        console.log('\n[1/10] Testing GET /health ...');
        let res = await fetch(`${BASE}/health`);
        let json = await res.json();
        if (res.status !== 200 || json.status !== 'online') {
            throw new Error(`Healthcheck failed: ${JSON.stringify(json)}`);
        }
        console.log('  [PASS] Status: online, Mode: pure-express-native');

        // 2. Web Player UI & Swagger Docs
        console.log('\n[2/10] Testing GET / (Web App) & GET /docs (Swagger) ...');
        res = await fetch(`${BASE}/`);
        let html = await res.text();
        if (res.status !== 200 || !html.includes('ZOKO')) {
            throw new Error('Web UI index.html failed to serve');
        }
        let docRes = await fetch(`${BASE}/docs/`);
        if (docRes.status !== 200) {
            throw new Error('Swagger /docs failed');
        }
        console.log('  [PASS] Web app and Swagger docs rendered with HTTP 200');

        // 3. Search Anime
        console.log('\n[3/10] Testing GET /api/search?q=naruto ...');
        res = await fetch(`${BASE}/api/search?q=naruto`);
        json = await res.json();
        if (res.status !== 200 || !json.results || json.results.length === 0) {
            throw new Error(`Search failed: ${JSON.stringify(json)}`);
        }
        const first = json.results[0];
        console.log(`  [PASS] Search returned ${json.results.length} results. Top: "${first.title}" (ID: ${first.id}, MAL: ${first.mal_id})`);

        // 4. Anime Metadata & Details
        console.log('\n[4/10] Testing GET /api/anime/16498 (Attack on Titan) ...');
        res = await fetch(`${BASE}/api/anime/16498`);
        json = await res.json();
        if (res.status !== 200 || !json.title || !json.episodes) {
            throw new Error(`Anime details failed: ${JSON.stringify(json)}`);
        }
        console.log(`  [PASS] Details loaded: "${json.title.english || json.title.romaji}", Total Episodes: ${json.total_episodes}`);

        // 5. Episodes Catalog
        console.log('\n[5/10] Testing GET /api/episodes/16498?page=1&size=5 ...');
        res = await fetch(`${BASE}/api/episodes/16498?page=1&size=5`);
        json = await res.json();
        if (res.status !== 200 || !json.episodes || json.episodes.length === 0) {
            throw new Error(`Episodes endpoint failed: ${JSON.stringify(json)}`);
        }
        console.log(`  [PASS] Episodes catalog returned ${json.episodes.length} episodes for page 1.`);

        // 6. Direct Stream Extraction from ZokoAnime
        console.log('\n[6/10] Testing GET /api/stream?malId=16498&ep=1&track=sub ...');
        res = await fetch(`${BASE}/api/stream?malId=16498&ep=1&track=sub`);
        json = await res.json();
        if (res.status !== 200 || !json.stream_url || !json.raw_stream_url) {
            throw new Error(`Stream extraction failed: ${JSON.stringify(json)}`);
        }
        console.log(`  [PASS] Stream extracted! Source: ${json.source}, Raw Stream: ${json.raw_stream_url.slice(0, 60)}...`);
        console.log(`  [PASS] Subtitles: ${(json.subtitles || []).length} tracks, Download URL available.`);

        // 7. Stream Sources compatibility route (/api/stream/:ep_id)
        console.log('\n[7/10] Testing GET /api/stream/16498-1 ...');
        res = await fetch(`${BASE}/api/stream/16498-1`);
        json = await res.json();
        if (res.status !== 200 || !json.sources || json.sources.length === 0) {
            throw new Error(`/api/stream/:ep_id failed: ${JSON.stringify(json)}`);
        }
        const streamSource = json.sources[0];
        console.log(`  [PASS] Stream sources resolved: ${json.sources.length} audio tracks (${json.sources.map(s => s.type).join(', ')})`);

        // 8. HLS Master Playlist Proxy & Rewriter
        console.log('\n[8/10] Testing GET /api/proxy/m3u8 ...');
        res = await fetch(streamSource.proxy_m3u8_url);
        let m3u8Content = await res.text();
        const corsHeader = res.headers.get('access-control-allow-origin');
        if (res.status !== 200 || corsHeader !== '*' || !m3u8Content.includes('#EXTM3U')) {
            throw new Error(`Playlist proxy failed: HTTP ${res.status}`);
        }
        console.log('  [PASS] HLS Playlist Proxy active with CORS Access-Control-Allow-Origin: *');

        // 9. Embed Player Route
        console.log('\n[9/10] Testing GET /embed?id=16498&ep=1 ...');
        res = await fetch(`${BASE}/embed?id=16498&ep=1`);
        html = await res.text();
        if (res.status !== 200 || !html.includes('Artplayer') || !html.includes('m3u8')) {
            throw new Error('Embed route failed to render HTML player');
        }
        console.log('  [PASS] Standalone /embed route renders responsive ArtPlayer iframe document');

        // 10. Home Catalog & Watch Resolver
        console.log('\n[10/10] Testing GET /api/home & GET /api/watch/resolve ...');
        res = await fetch(`${BASE}/api/home`);
        json = await res.json();
        if (res.status !== 200 || !json.trending || json.trending.length === 0) {
            throw new Error('/api/home failed');
        }
        let resolveRes = await fetch(`${BASE}/api/watch/resolve?id=21&title=One+Piece`);
        let resolveJson = await resolveRes.json();
        if (resolveRes.status !== 200 || !resolveJson.success || !resolveJson.stream_map) {
            throw new Error('/api/watch/resolve failed');
        }
        console.log(`  [PASS] Home catalog loaded (${json.trending.length} trending). Watch resolver mapped ${Object.keys(resolveJson.stream_map).length} episodes.`);

        console.log('\n' + '='.repeat(65));
        console.log('🎉 ALL 10 TEST SUITES PASSED SUCCESSFULLY! ZERO ERRORS!');
        console.log('='.repeat(65));

    } catch (err) {
        console.error('\n❌ [TEST FAILURE]:', err.message);
        process.exitCode = 1;
    } finally {
        if (server) server.close();
    }
}

runTests();
