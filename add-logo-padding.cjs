/**
 * add-logo-padding.cjs
 * Extends mint, coral, and yellow logo PNGs with 6px transparent padding
 * on all sides, so content never touches the image edge.
 * This eliminates Safari's sub-pixel white fringe artifact.
 */
const sharp = require('./node_modules/sharp');
const path  = require('path');

const LOGOS = [
  { name: 'mint',   file: 'public/name-logo-mint.png'   },
  { name: 'coral',  file: 'public/name-logo-coral.png'  },
  { name: 'yellow', file: 'public/name-logo-yellow.png' },
];

const PAD = 6; // px transparent border on every side

async function padLogo({ name, file }) {
  const src = path.resolve(file);
  const { width, height } = await sharp(src).metadata();
  await sharp(src)
    .extend({
      top:    PAD,
      bottom: PAD,
      left:   PAD,
      right:  PAD,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(src + '.tmp')
    .then(() => require('fs').renameSync(src + '.tmp', src));

  const { width: nw, height: nh } = await sharp(src).metadata();
  console.log(`✓ ${name}: ${width}×${height} → ${nw}×${nh} (padded +${PAD}px each side)`);
}

Promise.all(LOGOS.map(padLogo))
  .then(() => console.log('\nAll done. Content now has a ' + PAD + 'px transparent border.'))
  .catch(e => { console.error(e.message); process.exit(1); });
