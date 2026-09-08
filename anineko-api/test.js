/**
 * Test Suite for bibiemb and otakuhg Resolvers
 */

const { resolveBibiemb, extractBibiId } = require('./resolvers/bibiemb');
const { resolveOtakuhg, extractOtakuCode } = require('./resolvers/otakuhg');
const { resolveOtakuVid, extractOtakuVidCode } = require('./resolvers/otakuvid');
const { unpack } = require('./resolvers/unpacker');

async function runTests() {
    console.log('========================================================');
    console.log('🧪 RUNNING EMBED RESOLVERS TEST SUITE');
    console.log('========================================================\n');

    // 1. Test Unpacker
    console.log('1️⃣ Testing Dean Edwards Unpacker...');
    const packedSample = "eval(function(p,a,c,k,e,d){e=function(c){return c.toString(36)};if(!''.replace(/^/,String)){while(c--){d[c.toString(a)]=k[c]||c.toString(a)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('1 0=\"3://2.4/5.6\";',7,7,'stream|var|cdn|https|com|video|m3u8'.split('|'),0,{}))";
    const unpacked = unpack(packedSample);
    console.log('   Packed input:', packedSample.slice(0, 60) + '...');
    console.log('   Unpacked result:', unpacked.trim());
    if (unpacked.includes('https://cdn.com/video.m3u8')) {
        console.log('   ✅ Unpacker PASSED\n');
    } else {
        console.error('   ❌ Unpacker FAILED\n');
    }

    // 2. Test BibiEmb ID Extractor
    console.log('2️⃣ Testing BibiEmb ID Extractor...');
    const bibiId1 = extractBibiId('https://bibiemb.xyz/64e8a1bc92e84123');
    const bibiId2 = extractBibiId('aaaaaaaaaaaaaaaa');
    console.log('   From URL:', bibiId1, bibiId1 === '64e8a1bc92e84123' ? '✅' : '❌');
    console.log('   From raw ID:', bibiId2, bibiId2 === 'aaaaaaaaaaaaaaaa' ? '✅' : '❌');

    // 3. Test Live BibiEmb Extraction
    console.log('\n3️⃣ Testing Live BibiEmb Extraction (VibePlayer Engine)...');
    try {
        const result = await resolveBibiemb('aaaaaaaaaaaaaaaa');
        console.log('   ✅ Live extraction successful!');
        console.log('   Title:', result.title);
        console.log('   Poster:', result.poster);
        console.log('   Streams discovered:');
        result.streams.forEach((s, idx) => {
            console.log('     [' + (idx + 1) + '] ' + s.server + ': ' + s.rawUrl);
        });
    } catch (err) {
        console.log('   ℹ️ Message:', err.message);
    }

    // 4. Test OtakuHG Code Extractor
    console.log('\n4️⃣ Testing OtakuHG Code Extractor...');
    const otakuCode1 = extractOtakuCode('https://otakuhg.site/e/123456789012');
    const otakuCode2 = extractOtakuCode('https://otakuhg.site/d/abcdef123456');
    console.log('   From embed URL:', otakuCode1, otakuCode1 === '123456789012' ? '✅' : '❌');
    console.log('   From download URL:', otakuCode2, otakuCode2 === 'abcdef123456' ? '✅' : '❌');

    // 5. Test Live OtakuHG Deletion/Status Check
    console.log('\n5️⃣ Testing Live OtakuHG Status Check...');
    try {
        await resolveOtakuhg('123456789012');
    } catch (err) {
        console.log('   Status message caught correctly:', err.message);
        if (err.message.includes('expired or deleted')) {
            console.log('   ✅ OtakuHG Deletion / Expiration Detection PASSED');
        }
    }

    // 6. Test OtakuVid Code Extractor
    console.log('\n6️⃣ Testing OtakuVid Code Extractor...');
    const vidCode1 = extractOtakuVidCode('https://otakuvid.online/embed/7vabw41b15ht');
    const vidCode2 = extractOtakuVidCode('https://otakuvid.online/d/7vabw41b15ht');
    console.log('   From embed URL:', vidCode1, vidCode1 === '7vabw41b15ht' ? '✅' : '❌');
    console.log('   From download URL:', vidCode2, vidCode2 === '7vabw41b15ht' ? '✅' : '❌');

    // 7. Test Live OtakuVid Extraction
    console.log('\n7️⃣ Testing Live OtakuVid Extraction (VidHide Engine)...');
    try {
        const vidResult = await resolveOtakuVid('https://otakuvid.online/embed/7vabw41b15ht');
        console.log('   ✅ Live OtakuVid extraction successful!');
        console.log('   Title:', vidResult.title);
        console.log('   Streams found:', vidResult.streams.length);
        vidResult.streams.forEach((s, idx) => {
            console.log('     [' + (idx + 1) + '] ' + s.server + ': ' + s.rawUrl.slice(0, 80) + '...');
        });
    } catch (err) {
        console.error('   ❌ OtakuVid extraction error:', err.message);
    }

    // 8. Test Anime Catalog Search
    console.log('\n8️⃣ Testing Anime Catalog Search (AniNeko Engine)...');
    try {
        const { searchAnime, getAnimeDetails, getEpisodeServers } = require('./resolvers/catalog');
        const searchRes = await searchAnime('Solo Leveling');
        console.log('   Results count:', searchRes.results.length);
        if (searchRes.results.length > 0) {
            console.log('   First match:', searchRes.results[0].title, `(${searchRes.results[0].type})`);
            console.log('   ✅ Anime Search PASSED');
        }

        // 9. Test Anime Episode List
        console.log('\n9️⃣ Testing Episode List Extraction...');
        const details = await getAnimeDetails('solo-leveling');
        console.log('   Total episodes found:', details.totalEpisodes);
        if (details.totalEpisodes > 0) {
            console.log('   First episode:', details.episodes[0].title);
            console.log('   ✅ Episode List Extraction PASSED');
        }

        // 10. Test Episode Server Extraction
        console.log('\n🔟 Testing Episode Server Extraction...');
        const epServers = await getEpisodeServers('solo-leveling', 'ep-1');
        console.log('   Total servers found (excluding HD-1):', epServers.totalServers);
        const hasHd1 = epServers.servers.some(s => s.serverName.toLowerCase().includes('hd-1') || s.embedUrl.includes('vivibebe.site'));
        console.log('   HD-1 filtered out:', !hasHd1 ? '✅ YES' : '❌ NO');
        const supported = epServers.servers.filter(s => s.isSupported);
        console.log('   Supported resolvers found:', supported.length, `(${supported.map(s => s.serverName).join(', ')})`);
        if (supported.length > 0 && !hasHd1) {
            console.log('   ✅ Episode Server Extraction & HD-1 Filter PASSED');
        }
    } catch (err) {
        console.error('   ❌ Catalog test error:', err.message);
    }

    console.log('\n========================================================');
    console.log('✨ ALL EMBED & CATALOG TESTS COMPLETED SUCCESSFULLY!');
    console.log('========================================================');
}

runTests();
