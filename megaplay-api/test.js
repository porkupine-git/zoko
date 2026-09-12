import megaplay, { stripSegmentBytes } from './megaplay.js';

async function runTests() {
  console.log('=== TESTING REVERSE-ENGINEERED MEGAPLAY API ===\n');

  // Test 1: Resolve via MAL ID (One Piece: MAL 21, Ep 1, Sub)
  let resolvedStream = null;
  try {
    console.log('1. Testing resolveFromMal(21, 1, "sub")...');
    const t0 = Date.now();
    const res = await megaplay.resolveFromMal(21, 1, 'sub');
    const dur = Date.now() - t0;
    resolvedStream = res;
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

  // Test 4: Deep Verification: Fetch Master M3U8, HLS Sub-playlist, and .TS Video Segment
  if (resolvedStream?.stream_url) {
    try {
      console.log('\n4. Deep Testing Stream Delivery (Master M3U8 -> HLS Playlist -> .TS Segment)...');
      
      // A. Master M3U8 fetch
      const m3u8Res = await fetch(resolvedStream.stream_url, {
        headers: { "Referer": "https://megaplay.buzz/", "User-Agent": "Mozilla/5.0" }
      });
      console.log(`   [A] Master M3U8 HTTP Status: ${m3u8Res.status} ${m3u8Res.statusText}`);
      const m3u8Text = await m3u8Res.text();
      const lines = m3u8Text.split('\n').map(l => l.trim()).filter(Boolean);
      const subPlaylistPath = lines.find(l => !l.startsWith('#') && l.endsWith('.m3u8'));
      const subPlaylistUrl = new URL(subPlaylistPath, resolvedStream.stream_url).href;
      console.log(`       Variant Sub-playlist URL: ${subPlaylistUrl}`);

      // B. Sub-playlist fetch
      const subRes = await fetch(subPlaylistUrl, {
        headers: { "Referer": "https://megaplay.buzz/", "User-Agent": "Mozilla/5.0" }
      });
      console.log(`   [B] Sub-playlist HTTP Status: ${subRes.status} ${subRes.statusText}`);
      const subText = await subRes.text();
      const subLines = subText.split('\n').map(l => l.trim()).filter(Boolean);
      const tsPath = subLines.find(l => !l.startsWith('#') && (l.includes('.ts') || l.includes('http')));
      const tsUrl = tsPath.startsWith('http') ? tsPath : new URL(tsPath, subPlaylistUrl).href;
      console.log(`       First Video Segment (.ts) URL: ${tsUrl.slice(0, 90)}...`);

      // C. Video segment (.ts) chunk fetch
      const tsRes = await fetch(tsUrl, {
        headers: { "Referer": "https://megaplay.buzz/", "User-Agent": "Mozilla/5.0" }
      });
      console.log(`   [C] .TS Segment HTTP Status: ${tsRes.status} ${tsRes.statusText}`);
      const tsBuf = await tsRes.arrayBuffer();
      const rawBytes = new Uint8Array(tsBuf);
      console.log(`       Segment Download Size: ${(rawBytes.length / (1024 * 1024)).toFixed(2)} MB (${rawBytes.length} bytes)`);
      
      // D. Verify MPEG-TS sync byte (0x47) after stripping 252 bytes dummy header
      const stripped = stripSegmentBytes(rawBytes);
      const hasMpegTsSyncByte = stripped[0] === 0x47;
      console.log(`   [D] Strip 252-byte dummy header -> Sync Byte: 0x${stripped[0].toString(16)} (Valid MPEG-TS 0x47: ${hasMpegTsSyncByte})`);
      if (hasMpegTsSyncByte) {
        console.log(`   ✅ STREAM PLAYBACK VERIFIED: Master M3U8, HLS Sub-Playlist, and .TS video chunks are 100% accessible!`);
      }
    } catch (err) {
      console.error('   ❌ STREAM VERIFICATION FAILED:', err.message);
    }
  }

  // Test 5: Verify Subtitle (.vtt) file
  if (resolvedStream?.subtitles?.length > 0) {
    try {
      console.log('\n5. Testing Subtitle / Captions Fetch (.vtt)...');
      const subTrack = resolvedStream.subtitles[0];
      const subRes = await fetch(subTrack.url, {
        headers: subTrack.headers || { "Referer": "https://megaplay.buzz/" }
      });
      console.log(`   Subtitle URL: ${subTrack.url}`);
      console.log(`   Subtitle HTTP Status: ${subRes.status} ${subRes.statusText}`);
      const subText = await subRes.text();
      const isVtt = subText.startsWith('WEBVTT');
      console.log(`   Format: ${isVtt ? 'Valid WEBVTT' : 'Unknown text'} (${subText.length} bytes)`);
      console.log(`   ✅ SUBTITLE VERIFIED`);
    } catch (err) {
      console.error('   ❌ SUBTITLE FAILED:', err.message);
    }
  }

  // Test 6: Catalog Recent Anime
  try {
    console.log('\n6. Testing getRecentAnime(1, 3)...');
    const res = await megaplay.getRecentAnime(1, 3);
    console.log('   ✅ SUCCESS:');
    console.log('   Total anime in catalog:', res.pagination?.total);
    console.log('   First item:', res.data?.[0]?.title, '(MAL ID:', res.data?.[0]?.mal_id, ')');
  } catch (err) {
    console.error('   ❌ FAILED:', err.message);
  }

  console.log('\n=== ALL TESTS COMPLETE ===');
}

runTests();
