/**
 * erode-yellow.cjs — targeted fix for yellow logo fringe.
 *
 * Yellow fringe: rgb(255,236,187) vs bg rgb(255,229,164)
 *   R: same, G: +7, B: +23
 * These pixels are NOT towards-white on B (187 < midpoint 209),
 * so the generic eroder missed them.
 *
 * Simpler criterion for yellow: a boundary pixel is fringe if it is
 * lighter than bg on at least 2 of the 3 channels.
 */

const sharp = require('./node_modules/sharp');
const path  = require('path');
const fs    = require('fs');

const BG = [0xff, 0xe5, 0xa4]; // yellow bg
const PASSES = 6;

async function erode() {
  const src = path.resolve('public/name-logo-yellow.png');
  const { data: raw, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = 4;
  const data = Buffer.from(raw);

  const idx  = (x, y) => (y * W + x) * C;
  const isTransparent = (x, y) => data[idx(x,y) + 3] < 10;
  const erase = (x, y) => { const i=idx(x,y); data[i]=data[i+1]=data[i+2]=data[i+3]=0; };

  // Lighter than bg: at least 2 channels are higher than bg+5
  const isFringe = (x, y) => {
    const i = idx(x, y);
    if (data[i+3] < 10) return false;
    let lighterCount = 0;
    if (data[i]   > BG[0] + 5) lighterCount++;
    if (data[i+1] > BG[1] + 5) lighterCount++;
    if (data[i+2] > BG[2] + 5) lighterCount++;
    return lighterCount >= 2;
  };

  let totalErased = 0;
  for (let pass = 0; pass < PASSES; pass++) {
    let erased = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (isTransparent(x, y)) continue;
        if (!isFringe(x, y)) continue;
        const onBoundary =
          (x === 0 || isTransparent(x-1, y)) ||
          (x === W-1 || isTransparent(x+1, y)) ||
          (y === 0 || isTransparent(x, y-1)) ||
          (y === H-1 || isTransparent(x, y+1));
        if (onBoundary) { erase(x, y); erased++; }
      }
    }
    totalErased += erased;
    if (erased === 0) break;
  }

  await sharp(data, { raw: { width: W, height: H, channels: C } })
    .png().toFile(src + '.tmp');
  fs.renameSync(src + '.tmp', src);
  console.log(`✓ yellow: erased ${totalErased} fringe pixels`);
}

erode().catch(e => { console.error(e.message); process.exit(1); });
