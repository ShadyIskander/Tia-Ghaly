const sharp = require('./node_modules/sharp');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function getBg(file) {
  const { data } = await sharp(file)
    .extract({ left: 0, top: 0, width: 5, height: 5 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const r = data[0], g = data[1], b = data[2];
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

async function run() {
  // Step 1: identify background of each TIF
  for (const n of [64, 65, 66, 67]) {
    const bg = await getBg(`Tia Branding-${n}.tif`);
    console.log(`Tia Branding-${n}.tif  bg = ${bg}`);
  }

  // Step 2: convert all 4 TIFs to named PNGs in public/
  const mapping = {
    64: 'blush',
    65: 'yellow',   // will verify below
    66: 'coral',    // will verify below
    67: 'mint',
  };

  for (const [n, name] of Object.entries(mapping)) {
    const dest = `public/name-logo-${name}.png`;
    await sharp(`Tia Branding-${n}.tif`)
      .png({ compressionLevel: 9 })
      .toFile(dest);
    const meta = await sharp(dest).metadata();
    console.log(`Saved ${dest}  ${meta.width}x${meta.height}`);
  }
}

run().catch(e => { console.error(e.message); process.exit(1); });
