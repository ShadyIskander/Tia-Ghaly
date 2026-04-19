const sharp = require('./node_modules/sharp');

async function diagnose(name) {
  const { data, info } = await sharp('/tmp/hero-' + name + '.png')
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = 4;

  // Sample top-left corner (should be the background color)
  const px = (x, y) => {
    const i = (y * W + x) * C;
    return `rgb(${data[i]},${data[i+1]},${data[i+2]})`;
  };
  console.log(name + ' bg corner (0,0):', px(0,0));
  console.log(name + ' bg corner (10,10):', px(10,10));

  // Scan each row for pixels that differ from the background color
  const bg = { r: data[0], g: data[1], b: data[2] };
  const colDist = (x, y) => {
    const i = (y * W + x) * C;
    const dr = data[i] - bg.r, dg = data[i+1] - bg.g, db = data[i+2] - bg.b;
    return Math.sqrt(dr*dr + dg*dg + db*db);
  };

  // Find first row that has a pixel significantly different from bg (= start of logo)
  for (let y = 0; y < H; y++) {
    let maxDiff = 0;
    for (let x = 100; x < W - 100; x++) {
      const d = colDist(x, y);
      if (d > maxDiff) maxDiff = d;
    }
    if (maxDiff > 30) {
      console.log('  First non-bg row: ' + y + ' (maxDiff=' + maxDiff.toFixed(1) + ')');
      break;
    }
  }

  // Find last row of logo content (from top, searching for non-bg)
  let logoTop = -1, logoBottom = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 100; x < W - 100; x++) {
      if (colDist(x, y) > 30) {
        if (logoTop === -1) logoTop = y;
        logoBottom = y;
        break;
      }
    }
    if (logoTop !== -1 && logoBottom === y) continue;
  }

  // Look for a thin (1-4px) band of LIGHT pixels just before the logo content starts
  // = potential "white line" artifact
  console.log('  Scanning rows around logo top (' + logoTop + ') for near-white...');
  for (let y = Math.max(0, logoTop - 5); y <= Math.min(H-1, logoTop + 10); y++) {
    // Find lightest pixel in this row (highest R+G+B)
    let maxBrightness = 0, maxPixelX = -1;
    for (let x = 50; x < W - 50; x++) {
      const i = (y * W + x) * C;
      const brightness = data[i] + data[i+1] + data[i+2];
      if (brightness > maxBrightness) { maxBrightness = brightness; maxPixelX = x; }
    }
    const i = (y * W + maxPixelX) * C;
    console.log(`    row ${y}: brightest pixel at x=${maxPixelX}: ${px(maxPixelX, y)} (sum=${maxBrightness})`);
  }
}

diagnose('mint').then(() => diagnose('coral')).catch(e => console.error(e.message));
