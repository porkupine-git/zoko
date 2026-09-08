const https = require('https');
const { unpack } = require('./resolvers/unpacker');

https.get('https://otakuhg.site/e/i0ehyeq33i6k', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://anineko.to/'
  }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const scripts = [...d.matchAll(/<script[\s\S]*?<\/script>/gi)].map(m => m[0]);
    console.log('Total scripts:', scripts.length);
    scripts.forEach((s, i) => {
      if (s.includes('eval(function(p,a,c,k,e,') || s.includes('m3u8') || s.includes('sources') || s.includes('jwplayer')) {
        console.log('--- Packed / Player Script [' + i + '] ---');
        console.log('Raw sample:', s.slice(0, 300));
        if (s.includes('eval(function(p,a,c,k,e,')) {
          console.log('--- Unpacked Output ---');
          const unpacked = unpack(s);
          console.log(unpacked);
        }
      }
    });
  });
});
