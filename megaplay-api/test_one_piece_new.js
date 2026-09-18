import megaplay, { ANIKOTO_API_BASE } from './megaplay.js';

async function checkCatalogAndEps() {
    console.log('--- 1. CHECKING ANIKOTO ONE PIECE CATALOG ENTRY ---');
    try {
        // Search Anikoto or check series details for One Piece
        const recent = await megaplay.getRecentAnime(1, 10);
        console.log('Recent releases from Anikoto:');
        recent.forEach(r => console.log(` - ${r.title} (Ep: ${r.episode}, MAL: ${r.mal_id})`));
    } catch (e) {
        console.log('Recent error:', e.message);
    }

    console.log('\n--- 2. SCANNING ONE PIECE EPISODES 1135 TO 1160 ---');
    for (let ep = 1135; ep <= 1160; ep++) {
        try {
            const res = await megaplay.resolveFromMal(21, ep, 'sub');
            if (res.stream_url) {
                const mRes = await fetch(res.stream_url, { headers: { 'Referer': 'https://megaplay.buzz/' } });
                console.log(`Ep ${ep}: Resolved -> Master HTTP ${mRes.status}`);
            } else {
                console.log(`Ep ${ep}: No stream URL`);
            }
        } catch (e) {
            console.log(`Ep ${ep}: ❌ ${e.message}`);
        }
    }
}

checkCatalogAndEps();
