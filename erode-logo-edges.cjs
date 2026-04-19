/**
 * erode-logo-edges.cjs
 *
 * The mint/coral/yellow PNGs have semi-transparent fringe pixels at the
 * very edge of their content (right and bottom) where the original TIF's
 * white canvas margin bled in.  Playwright confirmed:
 *   - A 2px-wide vertical line at the right content edge
 *   - A 1px-high horizontal line at the bottom content edge
 *
 * Fix: flood-fill from all four image edges to find non-transparent pixels
 * that are "lighter than background" (the fringe) and erase them.
 * We do this iteratively (3 passes of 1px each) so we only remove the
 * outermost fringe layers, not interior letter strokes.
 */

const sharp = require('./node_modules/sharp');
const path  = require('path');
const fs    = require('fs');

const LOGOS = [
  { name: 'mint',   file: 'public/name-logo-mint.png',   bg: [0x74, 0xc9, 0xb6] },
  { name: 'coral',  file: 'public/name-logo-coral.png',  bg: [0xf5, 0x84, 0x6f] },
  { name: 'yellow', file: 'public/name-logo-yellow.png', bg: [0xff, 0xe5, 0xa4] },
];

// How many passes of erosion to do.
// Each pass removes 1 layer of "bright-edge" pixels.
const ERODE_PASSES = 5;
// A pixel is "brighter than background" if ALL channels are > bg channel + this threshold
const BRIGHTER_THAN_BG = 6;

async function erode({ name, file, bg }) {
  const src = path.resolve(file);
  const { data: raw, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = 4;
  const data = Buffer.from(raw); // mutable copy

  const idx  = (x, y) => (y * W + x) * C;
  const isTransparent = (x, y) => data[idx(x,y) + 3] < 10;
  const isBrightFringe = (x, y) => {
    const i = idx(x,y);
    if (data[i+3] < 10) return false;
    // Brighter than bg on ALL channels = came from white canvas bleed
    return data[i]   > bg[0] + BRIGHTER_THAN_BG
        && data[i+1] > bg[1] + BRIGHTER_THAN_BG
        && data[i+2] > bg[2] + BRIGHTER_THAN_BG;
  };
  const erase = (x, y) => {
    const i = idx(x,y);
    data[i] = data[i+1] = data[i+2] = data[i+3] = 0;
  };

  let totalErased = 0;
  for (let pass = 0; pass < ERODE_PASSES; pass++) {
    let erased = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (isTransparent(x, y)) continue;
        if (!isBrightFringe(x, y)) continue;
        // Only erase if it has at least one transparent neighbour (= it's on the boundary)
        const neighbours = [
          x > 0   && isTransparent(x-1, y),
          x < W-1 && isTransparent(x+1, y),
          y > 0   && isTransparent(x, y-1),
          y < H-1 && isTransparent(x, y+1),
        ];
        if (neighbours.some(Boolean)) {
          erase(x, y);
          erased++;
        }
      }
    }
    totalErased += erased;
    if (erased === 0) break; // converged
  }

  await sharp(data, { raw: { width: W, height: H, channels: C } })
    .png()
    .toFile(src + '.tmp');
  fs.renameSync(src + '.tmp', src);
  console.log(`✓ ${name}: erased ${totalErased} fringe pixels`);
}

Promise.all(LOGOS.map(erode))
  .then(() => console.log('\nDone. Re-run pw-find-fringe.cjs to verify.'))
  .catch(e => { console.error(e.message); process.exit(1); });
