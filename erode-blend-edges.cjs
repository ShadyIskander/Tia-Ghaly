/**
 * erode-blend-edges.cjs
 *
 * Some logo PNGs have "white-blend" fringe pixels at their content boundary:
 * pixels that are a mix between the background colour and white, created when
 * the original TIF had anti-aliased edges against a white canvas.
 *
 * Strategy: for any pixel that:
 *   1. is NOT transparent
 *   2. has at least one transparent neighbour (= it's on the content boundary)
 *   3. when "un-premultiplied" assuming a white backing, the result looks
 *      significantly lighter than the background colour
 *  → erase it.
 *
 * We run 4 passes so multi-pixel fringe is fully stripped.
 */

const sharp = require('./node_modules/sharp');
const path  = require('path');
const fs    = require('fs');

const LOGOS = [
  { name: 'mint',   file: 'public/name-logo-mint.png',   bg: [0x74, 0xc9, 0xb6] },
  { name: 'coral',  file: 'public/name-logo-coral.png',  bg: [0xf5, 0x84, 0x6f] },
  { name: 'yellow', file: 'public/name-logo-yellow.png', bg: [0xff, 0xe5, 0xa4] },
];

const PASSES = 6;

async function erode({ name, file, bg }) {
  const src = path.resolve(file);
  const { data: raw, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = 4;
  const data = Buffer.from(raw);

  const idx  = (x, y) => (y * W + x) * C;
  const alpha = (x, y) => data[idx(x,y) + 3];
  const isTransparent = (x, y) => alpha(x, y) < 10;
  const erase = (x, y) => { const i=idx(x,y); data[i]=data[i+1]=data[i+2]=data[i+3]=0; };

  // A pixel is "white-blend fringe" if it's lighter than the bg colour:
  // i.e. every channel is closer to 255 than to the bg channel.
  // We compare: for each channel, is pixel > (bg + 255) / 2?
  // That means the pixel is in the "white half" of the range.
  const isFringe = (x, y) => {
    const i = idx(x, y);
    const a = data[i+3];
    if (a < 10) return false;
    const r = data[i], g = data[i+1], b = data[i+2];
    // Pixel is lighter than bg on all three channels
    const lighter = r > bg[0] && g > bg[1] && b > bg[2];
    // AND it's towards white (each channel > midpoint between bg and 255)
    const towards_white =
      r > (bg[0] + 255) / 2 - 20 &&
      g > (bg[1] + 255) / 2 - 20 &&
      b > (bg[2] + 255) / 2 - 20;
    return lighter && towards_white;
  };

  let totalErased = 0;
  for (let pass = 0; pass < PASSES; pass++) {
    let erased = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (isTransparent(x, y)) continue;
        if (!isFringe(x, y)) continue;
        // Only on content boundary (has transparent neighbour)
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
    .png()
    .toFile(src + '.tmp');
  fs.renameSync(src + '.tmp', src);
  console.log(`✓ ${name}: erased ${totalErased} fringe pixels over ${PASSES} passes`);
}

Promise.all(LOGOS.map(erode))
  .then(() => console.log('\nDone.'))
  .catch(e => { console.error(e.message); process.exit(1); });
