/**
 * Test Suite for vidbolt-scraper
 * Run: node test.js or npm test
 */

const { getStreams } = require('./index.js');

async function runTests() {
    console.log('====================================================');
    console.log('🧪 TESTING VIDBOLT-SCRAPER PACKAGE');
    console.log('====================================================\n');

    try {
        console.log('1️⃣ Testing Movie Scraper (Fight Club)...');
        const movie = await getStreams({
            type: 'movie',
            tmdbId: 550,
            title: 'Fight Club',
            year: 1999
        });
        console.log(`   ✅ Status: ${movie.success ? 'SUCCESS' : 'FAILED'} (${movie.durationMs}ms)`);
        console.log(`   🎬 Sources: ${movie.totalSources} streams`);
        console.log(`   💬 Subtitles: ${movie.totalSubtitles} tracks`);
        if (movie.sources.length > 0) {
            console.log(`   ⚡ Primary Server: ${movie.sources[0].server} [${movie.sources[0].quality}]`);
        }

        console.log('\n2️⃣ Testing TV Show Scraper (Breaking Bad S01E01)...');
        const tv = await getStreams({
            type: 'tv',
            tmdbId: 1396,
            season: 1,
            episode: 1,
            title: 'Breaking Bad',
            year: 2008
        });
        console.log(`   ✅ Status: ${tv.success ? 'SUCCESS' : 'FAILED'} (${tv.durationMs}ms)`);
        console.log(`   📺 Sources: ${tv.totalSources} streams`);
        console.log(`   💬 Subtitles: ${tv.totalSubtitles} tracks`);
        if (tv.sources.length > 0) {
            console.log(`   ⚡ Primary Server: ${tv.sources[0].server} [${tv.sources[0].quality}]`);
        }

        console.log('\n====================================================');
        console.log('🎉 ALL PACKAGE TESTS PASSED!');
        console.log('====================================================\n');
    } catch (err) {
        console.error('❌ Test failed with error:', err);
        process.exit(1);
    }
}

runTests();
