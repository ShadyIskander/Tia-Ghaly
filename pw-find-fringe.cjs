/**
 * pw-find-fringe.cjs
 * Locate and print all FULL-HEIGHT or FULL-WIDTH content strips — i.e., columns
 * or rows that span the majority of the logo height/width.  These are the
 * "line artefacts", not individual letter strokes.
 * Also saves a 10px-wide crop of the rightmost content column for inspection.
 */
const { webkit } = require('./node_modules/@playwright/test/index');
const sharp = require('./node_modules/sharp');

const DPR = 2;

async function run(page, label, hexBg) {
  if (label !== 'Blush') {
    await page.locator('button[aria-label="Change background colour"]').click();
    await page.waitForTimeout(120);
    await page.locator(`button[title="${label}"]`).click();
    await page.waitForTimeout(400);
  }

  const rect = await page.evaluate(() => {
    const div = document.querySelector('#hero > div:nth-child(2) > div:first-child');
    if (!div) return null;
    const r = div.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  });

  const screenshotBuf = await page.screenshot();
  const { data, info } = await sharp(screenshotBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = 4;

  const bgR = parseInt(hexBg.slice(0,2),16);
  const bgG = parseInt(hexBg.slice(2,4),16);
  const bgB = parseInt(hexBg.slice(4,6),16);

  const pLeft   = Math.round(rect.left   * DPR);
  const pTop    = Math.round(rect.top    * DPR);
  const pRight  = Math.round((rect.left + rect.width)  * DPR);
  const pBottom = Math.round((rect.top  + rect.height) * DPR);
  const pH = pBottom - pTop;
  const pW = pRight - pLeft;

  const col = (x,y) => { const i=(y*W+x)*C; return [data[i],data[i+1],data[i+2],data[i+3]]; };
  const isDiff = ([r,g,b,a]) => {
    if (a < 20) return false;
    const dr=r-bgR,dg=g-bgG,db=b-bgB;
    return Math.sqrt(dr*dr+dg*dg+db*db) > 12;
  };

  // For each column in the logo, count how many rows have a "diff" pixel
  const colCoverage = [];
  for (let x = pLeft; x <= pRight; x++) {
    let count = 0;
    for (let y = pTop; y <= pBottom; y++) count += isDiff(col(x,y)) ? 1 : 0;
    colCoverage.push({ x, count, frac: count / pH });
  }

  // Find columns that span >80% of the logo height (= line artefacts)
  const lineColumns = colCoverage.filter(c => c.frac > 0.80);
  console.log(`\n[${label}] bg=rgb(${bgR},${bgG},${bgB})  logo: ${pW}x${pH}px`);
  if (lineColumns.length === 0) {
    console.log('  No full-height column artefacts found.');
  } else {
    console.log(`  Full-height column artefacts (${lineColumns.length}):`);
    lineColumns.forEach(c => {
      const sample = col(c.x, pTop + Math.floor(pH/2));
      console.log(`    x=${c.x} (CSS ${(c.x/DPR).toFixed(1)}) coverage=${(c.frac*100).toFixed(0)}%  mid-pixel rgb(${sample[0]},${sample[1]},${sample[2]})`);
    });
  }

  // Same for rows spanning >80% of logo width
  const rowCoverage = [];
  for (let y = pTop; y <= pBottom; y++) {
    let count = 0;
    for (let x = pLeft; x <= pRight; x++) count += isDiff(col(x,y)) ? 1 : 0;
    rowCoverage.push({ y, count, frac: count / pW });
  }
  const lineRows = rowCoverage.filter(r => r.frac > 0.80);
  if (lineRows.length === 0) {
    console.log('  No full-width row artefacts found.');
  } else {
    console.log(`  Full-width row artefacts (${lineRows.length}):`);
    lineRows.forEach(r => {
      const sample = col(pLeft + Math.floor(pW/2), r.y);
      console.log(`    y=${r.y} (CSS ${(r.y/DPR).toFixed(1)}) coverage=${(r.frac*100).toFixed(0)}%  mid-pixel rgb(${sample[0]},${sample[1]},${sample[2]})`);
    });
  }

  // Save a 20px-wide strip at the rightmost content column
  if (lineColumns.length > 0) {
    const lx = lineColumns[lineColumns.length - 1].x;
    const cropX = Math.max(0, lx - 10);
    const cropY = pTop;
    const cropW = Math.min(W - cropX, 30);
    const cropH = Math.min(H - cropY, pBottom - pTop);
    await sharp(screenshotBuf)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .resize(cropW * 8, cropH, { kernel: 'nearest' }) // zoom 8x horizontally so we can see the pixels
      .png()
      .toFile(`/tmp/fringe-col-${label.toLowerCase()}.png`);
    console.log(`  Saved zoomed strip → /tmp/fringe-col-${label.toLowerCase()}.png`);
  }
}

(async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: DPR });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(800);

  await run(page, 'Blush',  'fef4f3');
  await run(page, 'Mint',   '74c9b6');
  await run(page, 'Coral',  'f5846f');
  await run(page, 'Yellow', 'ffe5a4');

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
