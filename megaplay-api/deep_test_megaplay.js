import megaplay, { stripSegmentBytes } from './megaplay.js';

const TEST_ANIME = [
    { name: 'One Piece Ep 1 (Sub)', malId: 21, ep: 1, track: 'sub' },
    { name: 'One Piece Ep 1 (Dub)', malId: 21, ep: 1, track: 'dub' },
    { name: 'Naruto Ep 1 (Sub)', malId: 20, ep: 1, track: 'sub' },
    { name: 'Attack on Titan Ep 1 (Sub)', malId: 16498, ep: 1, track: 'sub' },
    { name: 'Jujutsu Kaisen Ep 1 (Sub)', malId: 40748, ep: 1, track: 'sub' },
    { name: 'Bleach Ep 1 (Sub)', malId: 269, ep: 1, track: 'sub' }
];

async function runDeepMegaPlayTest() {
    console.log('================================================================');
    console.log('🧪 DEEP MEGAPLAY API & TIKTOK CDN VERIFICATION SUITE');
    console.log('================================================================\n');

    let passedCount = 0;
    let failedCount = 0;

    for (const item of TEST_ANIME) {
        console.log(`📌 Testing: ${item.name} [MAL ID: ${item.malId}]`);
        console.log('----------------------------------------------------------------');

        const startTime = Date.now();
        try {
            // 1. Resolve stream from MegaPlay backend
            const stream = await megaplay.resolveFromMal(item.malId, item.ep, item.track);
            const resolveTime = Date.now() - startTime;

            if (!stream.stream_url) {
                console.log(`   ❌ FAILED: No stream_url returned (${resolveTime}ms)`);
                failedCount++;
                continue;
            }

            console.log(`   ✅ Resolved in: ${resolveTime}ms`);
            console.log(`   Master M3U8: ${stream.stream_url.slice(0, 85)}...`);
            console.log(`   Subtitles: ${stream.subtitles?.length || 0} tracks`);
            console.log(`   Intro skip:`, stream.intro || 'None');

            // 2. Fetch Master M3U8
            const mRes = await fetch(stream.stream_url, {
                headers: { 'Referer': 'https://megaplay.buzz/', 'User-Agent': 'Mozilla/5.0' }
            });

            if (!mRes.ok) {
                console.log(`   ❌ Master M3U8 Fetch Failed: HTTP ${mRes.status}`);
                failedCount++;
                continue;
            }

            const mText = await mRes.text();
            const lines = mText.split('\n').map(l => l.trim()).filter(Boolean);
            const subPlaylistPath = lines.find(l => !l.startsWith('#') && l.endsWith('.m3u8'));

            if (!subPlaylistPath) {
                console.log(`   ❌ No variant playlist found in master M3U8`);
                failedCount++;
                continue;
            }

            // 3. Fetch Sub-Playlist
            const subUrl = new URL(subPlaylistPath, stream.stream_url).href;
            const sRes = await fetch(subUrl, {
                headers: { 'Referer': 'https://megaplay.buzz/', 'User-Agent': 'Mozilla/5.0' }
            });

            if (!sRes.ok) {
                console.log(`   ❌ Sub-playlist Fetch Failed: HTTP ${sRes.status}`);
                failedCount++;
                continue;
            }

            const sText = await sRes.text();
            const segLines = sText.split('\n').map(l => l.trim()).filter(Boolean);
            const firstSegUrl = segLines.find(l => !l.startsWith('#'));

            if (!firstSegUrl) {
                console.log(`   ❌ No segments found in sub-playlist`);
                failedCount++;
                continue;
            }

            const isTikTok = firstSegUrl.includes('tiktokcdn.com') || firstSegUrl.includes('ibyteimg.com');
            const cdnType = isTikTok ? 'TikTok CDN (p19-ad-site)' : new URL(firstSegUrl).hostname;
            console.log(`   CDN Host: ${cdnType}`);

            // 4. Download first video segment bytes
            const segStart = Date.now();
            const segRes = await fetch(firstSegUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const segTime = Date.now() - segStart;

            if (!segRes.ok) {
                console.log(`   ❌ Segment Download Failed: HTTP ${segRes.status}`);
                failedCount++;
                continue;
            }

            const segBuffer = await segRes.arrayBuffer();
            const rawBytes = new Uint8Array(segBuffer);

            // 5. Test 252-byte PNG dummy header stripping
            const stripped = stripSegmentBytes(rawBytes);
            const isMpegTs = stripped[0] === 0x47;

            console.log(`   Segment Chunk: ${(rawBytes.length / (1024 * 1024)).toFixed(2)} MB in ${segTime}ms`);
            console.log(`   Raw Header Magic: [${Array.from(rawBytes.slice(0, 4)).map(b => '0x' + b.toString(16)).join(' ')}] (${rawBytes[1] === 0x50 ? 'Disguised PNG' : 'Raw'})`);
            console.log(`   Stripped Sync Byte (offset 252): 0x${stripped[0].toString(16)} (Valid MPEG-TS: ${isMpegTs})`);

            if (isMpegTs) {
                console.log(`   🎉 STATUS: 100% WORKING & PLAYABLE!\n`);
                passedCount++;
            } else {
                console.log(`   ⚠️ WARNING: Stripped byte is not 0x47\n`);
                failedCount++;
            }
        } catch (err) {
            console.log(`   ❌ EXCEPTION: ${err.message}\n`);
            failedCount++;
        }
    }

    console.log('================================================================');
    console.log(`📊 FINAL RESULTS: ${passedCount} PASSED / ${failedCount} FAILED (Total: ${TEST_ANIME.length})`);
    console.log('================================================================\n');
}

runDeepMegaPlayTest();
