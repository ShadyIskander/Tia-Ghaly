const sharp = require('./node_modules/sharp');

async function checkEdgeWhite(name) {
  const { data, info } = await sharp('public/name-logo-' + name + '.png')
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = 4;

  // Find actual bounding box of non-transparent pixels
  let minX = W, maxX = 0, minY = H, maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      if (data[i + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  console.log(name + ' bounding box: x=[' + minX + ',' + maxX + '] y=[' + minY + ',' + maxY + ']  full: W=' + W + ' H=' + H);

  // Sample the outer 2px of bounding box for white-ish pixels
  let whiteFound = 0, total = 0;
  for (let y = minY; y <= minY + 2; y++) {
    for (let x = minX; x <= maxX; x++) {
      const i = (y * W + x) * C;
      if (data[i + 3] < 10) continue;
      total++;
      if (data[i] > 200 && data[i+1] > 200 && data[i+2] > 200) { whiteFound++; }
    }
  }
  for (let y = maxY - 2; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const i = (y * W + x) * C;
      if (data[i + 3] < 10) continue;
      total++;
      if (data[i] > 200 && data[i+1] > 200 && data[i+2] > 200) { whiteFound++; }
    }
  }
  for (let x = minX; x <= minX + 2; x++) {
    for (let y = minY; y <= maxY; y++) {
      const i = (y * W + x) * C;
      if (data[i + 3] < 10) continue;
      total++;
      if (data[i] > 200 && data[i+1] > 200 && data[i+2] > 200) { whiteFound++; }
    }
  }
  for (let x = maxX - 2; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const i = (y * W + x) * C;
      if (data[i + 3] < 10) continue;
      total++;
      if (data[i] > 200 && data[i+1] > 200 && data[i+2] > 200) { whiteFound++; }
    }
  }
  console.log('  white-ish pixels in outer 2px border: ' + whiteFound + '/' + total);

  // Also check: any non-transparent white pixels ANYWHERE
  let anyWhite = 0;
  for (let i = 0; i < W * H * C; i += C) {
    if (data[i+3] < 10) continue;
    if (data[i] > 230 && data[i+1] > 230 && data[i+2] > 230) anyWhite++;
  }
  console.log('  total non-transparent near-white pixels (R,G,B all>230): ' + anyWhite);
}

Promise.all(['blush', 'mint', 'coral', 'yellow'].map(checkEdgeWhite))
  .catch(e => console.error(e.message));
