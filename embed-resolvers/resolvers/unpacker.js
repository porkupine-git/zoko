/**
 * Dean Edwards P.A.C.K.E.R. Deobfuscator
 * Decodes packed javascript used by XFileSharing (StreamHG / otakuhg.site)
 */
function unpack(packedStr) {
    if (!packedStr || typeof packedStr !== 'string') return '';
    
    // Standard Dean Edwards packer regex
    const regex = /eval\(function\(p,a,c,k,e,[rd]\)\s*\{[\s\S]*?\}\s*\(\s*'([\s\S]*?)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([\s\S]*?)'\.split\('\|'\)/;
    let match = packedStr.match(regex);
    
    if (!match) {
        const altRegex = /}\('([\s\S]*?)',\s*(\d+)\s*,\s*(\d+)\s*,\s*'([\s\S]*?)'\.split\('\|'\)/;
        match = packedStr.match(altRegex);
        if (!match) return packedStr;
    }
    
    return runUnpack(match[1], parseInt(match[2], 10), parseInt(match[3], 10), match[4].split('|'));
}

function runUnpack(p, a, c, k) {
    const base = (v) => {
        return (v < a ? '' : base(Math.floor(v / a))) + ((v = v % a) > 35 ? String.fromCharCode(v + 29) : v.toString(36));
    };
    
    const dict = {};
    while (c--) {
        dict[base(c)] = k[c] || base(c);
    }
    
    return p.replace(/\b\w+\b/g, (token) => dict[token] !== undefined ? dict[token] : token);
}

module.exports = { unpack };
