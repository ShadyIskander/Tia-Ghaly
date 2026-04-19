const sharp = require('./node_modules/sharp');
const { execSync } = require('child_process');

async function run() {
  // Extract a 200x200 crop from the letter area of the TIF
  await sharp('Tia Branding-64.tif')
    .extract({ left: 400, top: 150, width: 200, height: 200 })
    .png()
    .toFile('/tmp/tif-letter-crop.png');

  // Extract same proportional area from the small PNG, scaled up with nearest-neighbour (shows raw pixels)
  await sharp('Tia colored logo-64.png')
    .extract({ left: 90, top: 30, width: 90, height: 90 })
    .resize(200, 200, { kernel: 'nearest' })
    .png()
    .toFile('/tmp/png-letter-crop.png');

  execSync('open /tmp/tif-letter-crop.png /tmp/png-letter-crop.png /tmp/tif-downscaled.png');
  console.log('Opened 3 files in Preview:');
  console.log('  tif-letter-crop.png  = 200x200 from TIF  -> sharp edges = genuine hi-res');
  console.log('  png-letter-crop.png  = 200x200 from small PNG (nearest) -> shows if source is pixelated');
  console.log('  tif-downscaled.png   = TIF downscaled to 471x204 -> if identical to original PNG, TIF is just upscaled');
}

run().catch(e => { console.error(e.message); process.exit(1); });
