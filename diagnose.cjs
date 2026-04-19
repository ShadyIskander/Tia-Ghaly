const sharp = require('./node_modules/sharp');

async function diagnose(tif, name) {
  const { data, info } = await sharp(tif).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  function s(x, y) { const i = (y * W + x) * 4; return [data[i], data[i+1], data[i+2]]; }
  const corners = [s(0,0), s(W-1,0), s(0,H-1), s(W-1,H-1), s(W>>1,0), s(0,H>>1)];
  const bgR = Math.round(corners.reduce((a,c) => a + c[0], 0) / 6);
  const bgG = Math.round(corners.reduce((a,c) => a + c[1], 0) / 6);
  const bgB = Math.round(corners.reduce((a,c) => a + c[2], 0) / 6);
  const hexBg = '#' + [bgR,bgG,bgB].map(v => v.toString(16).padStart(2,'0')).join('');
  console.log(name + ': W=' + W + ' H=' + H + ' computedBg=' + hexBg);
  console.log('  corners: ' + corners.map(c => '#' + c.map(v => v.toString(16).padStart(2,'0')).join('')).join(' '));

  let edgeMatch = 0, edgeTotal = 0;
  for (let x = 0; x < W; x++) {
    for (const y of [0, H-1]) {
      edgeTotal++;
      const i = (y * W + x) * 4;
      const dr = data[i] - bgR, dg = data[i+1] - bgG, db = data[i+2] - bgB;
      if (Math.sqrt(dr*dr + dg*dg + db*db) <= 40) edgeMatch++;
    }
  }
  for (let y = 1; y < H-1; y++) {
    for (const x of [0, W-1]) {
      edgeTotal++;
      const i = (y * W + x) * 4;
      const dr = data[i] - bgR, dg = data[i+1] - bgG, db = data[i+2] - bgB;
      if (Math.sqrt(dr*dr + dg*dg + db*db) <= 40) edgeMatch++;
    }
  }
  console.log('  edge pixels matching bg (tol 40): ' + edgeMatch + '/' + edgeTotal);
}

Promise.all([
  diagnose('Tia Branding-67.tif', 'mint'),
  diagnose('Tia Branding-66.tif', 'coral'),
  diagnose('Tia Branding-64.tif', 'blush'),
  diagnose('Tia Branding-65.tif', 'yellow'),
]).catch(e => console.error(e.message));
