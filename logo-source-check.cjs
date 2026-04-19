const sharp = require('./node_modules/sharp');

async function run() {
  // Downscale the TIF-derived PNG to 471x204 - if identical to original small PNG, the TIF was just upscaled
  await sharp('public/name-logo.png')
    .resize(471, 204, { kernel: 'lanczos3' })
    .png()
    .toFile('/tmp/tif-downscaled.png');
  console.log('Downscaled version saved to /tmp/tif-downscaled.png');

  // Compare pixel stats - identical std means same source content
  const tifStats = await sharp('Tia Branding-64.tif').stats();
  const pngStats = await sharp('Tia colored logo-64.png').stats();

  console.log('\n=== PIXEL DETAIL (std = 0 means flat, high = lots of detail) ===');
  console.log('TIF 1960x850:');
  tifStats.channels.forEach((c, i) => console.log(`  ch${i}: mean=${c.mean.toFixed(1)} std=${c.std.toFixed(1)}`));
  console.log('Original PNG 471x204:');
  pngStats.channels.forEach((c, i) => console.log(`  ch${i}: mean=${c.mean.toFixed(1)} std=${c.std.toFixed(1)}`));

  // Check if there's a sharp edge at 1px zoom (extract a 10x10 crop from top-left of the letterform)
  // This tells us if the letters have crisp edges in the TIF
  const crop = await sharp('Tia Branding-64.tif')
    .extract({ left: 200, top: 100, width: 100, height: 100 })
    .png()
    .toFile('/tmp/tif-crop-100px.png');
  console.log('\nCrop of 100x100px from TIF saved to /tmp/tif-crop-100px.png');
  console.log('Open it to see if edges are sharp or blurry at pixel level.');

  // Open all comparison files
  const { execSync } = require('child_process');
  execSync('open /tmp/logo-1x.png /tmp/tif-downscaled.png /tmp/tif-crop-100px.png "Tia colored logo-64.png"');
  console.log('\nAll files opened in Preview for comparison.');
  console.log('If tif-crop-100px.png shows blurry/soft edges → the artwork itself is low-res.');
  console.log('If tif-downscaled.png looks identical to "Tia colored logo-64.png" → TIF is just an upscale.');
}

run().catch(e => { console.error(e.message); process.exit(1); });
