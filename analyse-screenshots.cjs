const sharp = require('./node_modules/sharp');

async function analyseScreenshot(name) {
  const { data, info } = await sharp('/tmp/hero-' + name + '.png')
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = 4;
  console.log(name + ' screenshot: ' + W + 'x' + H);

  // Find rows/cols with white-ish pixels (R>240 G>240 B>240)
  const whiteRows = new Set(), whiteCols = new Set();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240 && data[i+3] > 200) {
        whiteRows.add(y);
        whiteCols.add(x);
      }
    }
  }

  // Look for contiguous bands of white rows (= horizontal white line)
  const sortedRows = Array.from(whiteRows).sort((a,b) => a-b);
  if (sortedRows.length > 0) {
    let bandStart = sortedRows[0], prev = sortedRows[0];
    const bands = [];
    for (let j = 1; j < sortedRows.length; j++) {
      if (sortedRows[j] > prev + 2) {
        bands.push({ start: bandStart, end: prev, size: prev - bandStart + 1 });
        bandStart = sortedRows[j];
      }
      prev = sortedRows[j];
    }
    bands.push({ start: bandStart, end: prev, size: prev - bandStart + 1 });
    console.log('  White row bands:', bands.slice(0, 10));
  } else {
    console.log('  No white rows found!');
  }

  // Sample 5 specific rows and print their pixel colors
  const sampleRows = [0, Math.floor(H*0.1), Math.floor(H*0.3), Math.floor(H*0.5), Math.floor(H*0.7)];
  for (const y of sampleRows) {
    // Find leftmost and rightmost white pixel in this row
    let leftWhite = -1, rightWhite = -1;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240 && data[i+3] > 200) {
        if (leftWhite === -1) leftWhite = x;
        rightWhite = x;
      }
    }
    if (leftWhite !== -1) {
      // Print pixel color at leftWhite-1, leftWhite, leftWhite+1 for context
      const il = (y * W + leftWhite) * C;
      const ir = (y * W + rightWhite) * C;
      console.log(`  row ${y}: leftWhite=${leftWhite} rgb(${data[il]},${data[il+1]},${data[il+2]},a=${data[il+3]})  rightWhite=${rightWhite} rgb(${data[ir]},${data[ir+1]},${data[ir+2]},a=${data[ir+3]})`);
    }
  }
}

analyseScreenshot('mint').then(() => analyseScreenshot('coral')).catch(e => console.error(e.message));
