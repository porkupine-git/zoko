import megaplay from './megaplay.js';

async function runTests() {
  console.log('=== TESTING REVERSE-ENGINEERED MEGAPLAY API ===\n');

  // Test 1: Resolve via MAL ID (One Piece: MAL 21, Ep 1, Sub)
  try {
    console.log('1. Testing resolveFromMal(21, 1, "sub")...');
    const t0 = Date.now();
    const res = await megaplay.resolveFromMal(21, 1, 'sub');
    const dur = Date.now() - t0;
    console.log(`   ✅ SUCCESS (${dur}ms):`);
    console.log('   Master M3U8:', res.stream_url);
    console.log('   Subtitles Count:', res.subtitles.length);
    console.log('   Intro:', res.intro);
    console.log('   Player IDs:', res.ids);
  } catch (err) {
    console.error('   ❌ FAILED:', err.message);
  }

  // Test 2: Resolve via AniList ID (One Piece: AniList 21, Ep 1, Sub)
  try {
    console.log('\n2. Testing resolveFromAnilist(21, 1, "sub")...');
    const t0 = Date.now();
    const res = await megaplay.resolveFromAnilist(21, 1, 'sub');
    const dur = Date.now() - t0;
    console.log(`   ✅ SUCCESS (${dur}ms):`);
    console.log('   Master M3U8:', res.stream_url);
  } catch (err) {
    console.error('   ❌ FAILED:', err.message);
  }

  // Test 3: Resolve via Catalog Episode ID (2142)
  try {
    console.log('\n3. Testing resolveFromCatalogId("2142", "sub")...');
    const t0 = Date.now();
    const res = await megaplay.resolveFromCatalogId('2142', 'sub');
    const dur = Date.now() - t0;
    console.log(`   ✅ SUCCESS (${dur}ms):`);
    console.log('   Master M3U8:', res.stream_url);
  } catch (err) {
    console.error('   ❌ FAILED:', err.message);
  }

  // Test 4: Testing CDN server option (tcdn)
  try {
    console.log('\n4. Testing with CDN server option ("tcdn")...');
    const res = await megaplay.resolveFromMal(21, 1, 'sub', 'tcdn');
    console.log('   ✅ SUCCESS with tcdn:');
    console.log('   Master M3U8:', res.stream_url);
  } catch (err) {
    console.error('   ❌ FAILED:', err.message);
  }

  // Test 5: Catalog Recent Anime
  try {
    console.log('\n5. Testing getRecentAnime(1, 3)...');
    const res = await megaplay.getRecentAnime(1, 3);
    console.log('   ✅ SUCCESS:');
    console.log('   Total anime in catalog:', res.pagination?.total);
    console.log('   First item:', res.data?.[0]?.title, '(MAL ID:', res.data?.[0]?.mal_id, ')');
  } catch (err) {
    console.error('   ❌ FAILED:', err.message);
  }

  console.log('\n=== TEST SUITE COMPLETE ===');
}

runTests();
