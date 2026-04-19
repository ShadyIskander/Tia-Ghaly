/**
 * pw-webkit-locate.cjs
 * Uses WebKit (Safari) to find EXACTLY where the white pixels are:
 * - saves edge strips (top/bottom/left/right 20px) as PNGs
 * - prints row-by-row pixel colors so we can see the line
 */
const { webkit } = require('./node_modules/@playwright/test/index');
const sharp = require('./node_modules/sharp');

const DPR = 2;

async function locate(page, label, hexBg) {
  if (label !== 'Blush') {
    await page.locator('button[aria-label="Change background colour"]').click();
    await page.waitForTimeout(120);
    await page.locator(`button[title="${label}"]`).click();
    await page.waitForTimeout(400);
  }

  // get logo rect
  const rect = await page.evaluate(() => {
    const div = document.querySelector('#hero > div:nth-child(2) > div:first-child');
    if (!div) return null;
    const r = div.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  });
  if (!rect) { console.log(label + ': could not find logo wrapper'); return; }

  const screenshotBuf = await page.screenshot();
  const { data, info } = await sharp(screenshotBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = 4;

  const bgR = parseInt(hexBg.slice(0,2),16);
  const bgG = parseInt(hexBg.slice(2,4),16);
  const bgB = parseInt(hexBg.slice(4,6),16);

  const pLeft   = Math.max(0, Math.round(rect.left   * DPR));
  const pTop    = Math.max(0, Math.round(rect.top    * DPR));
  const pRight  = Math.min(W-1, Math.round((rect.left + rect.width)  * DPR));
  const pBottom = Math.min(H-1, Math.round((rect.top  + rect.height) * DPR));
  console.log(`\n[${label}] Logo px rect: L=${pLeft} T=${pTop} R=${pRight} B=${pBottom}  screenshot: ${W}x${H}`);

  const col = (x,y) => { const i=(y*W+x)*C; return [data[i],data[i+1],data[i+2],data[i+3]]; };
  const isWhite = ([r,g,b,a]) => a > 50 && r > 230 && g > 230 && b > 230;
  const isDiff  = ([r,g,b,a]) => {
    if (a < 50) return false;
    const dr=r-bgR,dg=g-bgG,db=b-bgB;
    return Math.sqrt(dr*dr+dg*dg+db*db) > 20;
  };

  // Scan OUTSIDE the logo rect (4px around it) for white  
  console.log('  Scanning 8px frame OUTSIDE logo rect for white pixels...');
  let outsideWhite = 0;
  for (let margin = 1; margin <= 8; margin++) {
    for (let x = pLeft - margin; x <= pRight + margin; x++) {
      for (const y of [pTop - margin, pBottom + margin]) {
        if (x<0||x>=W||y<0||y>=H) continue;
        if (isWhite(col(x,y))) outsideWhite++;
      }
    }
    for (let y = pTop - margin; y <= pBottom + margin; y++) {
      for (const x of [pLeft - margin, pRight + margin]) {
        if (x<0||x>=W||y<0||y>=H) continue;
        if (isWhite(col(x,y))) outsideWhite++;
      }
    }
  }
  console.log('  White px outside logo: ' + outsideWhite);

  // Scan TOP edge strip: rows from pTop-5 to pTop+15
  console.log('  Top edge rows (pTop-5 to pTop+15):');
  for (let y = pTop - 5; y <= pTop + 15; y++) {
    if (y<0||y>=H) continue;
    let whiteCount=0, diffCount=0, samplePx='';
    for (let x = pLeft; x <= pRight; x++) {
      const c = col(x,y);
      if (isWhite(c)) whiteCount++;
      if (isDiff(c)) {
        diffCount++;
        if (!samplePx) samplePx = `rgb(${c[0]},${c[1]},${c[2]})@x=${x}`;
      }
    }
    const marker = whiteCount > 0 ? ' *** WHITE ***' : (diffCount > 0 ? ' (content)' : '');
    console.log(`    row ${y}: ${whiteCount} white px, ${diffCount} diff px ${samplePx}${marker}`);
  }

  // Scan BOTTOM edge  
  console.log('  Bottom edge rows (pBottom-5 to pBottom+5):');
  for (let y = pBottom - 5; y <= pBottom + 5; y++) {
    if (y<0||y>=H) continue;
    let whiteCount=0, diffCount=0, samplePx='';
    for (let x = pLeft; x <= pRight; x++) {
      const c = col(x,y);
      if (isWhite(c)) whiteCount++;
      if (isDiff(c)) {
        diffCount++;
        if (!samplePx) samplePx = `rgb(${c[0]},${c[1]},${c[2]})@x=${x}`;
      }
    }
    const marker = whiteCount > 0 ? ' *** WHITE ***' : (diffCount > 0 ? ' (content)' : '');
    console.log(`    row ${y}: ${whiteCount} white px, ${diffCount} diff px ${samplePx}${marker}`);
  }

  // Save full screenshot for manual inspection
  await sharp(screenshotBuf).png().toFile(`/tmp/wk-full-${label.toLowerCase()}.png`);

  // Save a 40px-tall strip at the top of the logo
  const stripY = Math.max(0, pTop - 10);
  const stripH = Math.min(H - stripY, 60);
  const stripX = Math.max(0, pLeft);
  const stripW = Math.min(W - stripX, pRight - pLeft);
  await sharp(screenshotBuf)
    .extract({ left: stripX, top: stripY, width: stripW, height: stripH })
    .png()
    .toFile(`/tmp/wk-top-${label.toLowerCase()}.png`);

  console.log(`  Saved /tmp/wk-full-${label.toLowerCase()}.png  /tmp/wk-top-${label.toLowerCase()}.png`);
}

(async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: DPR });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(800);

  await locate(page, 'Blush',  'fef4f3');
  await locate(page, 'Mint',   '74c9b6');
  await locate(page, 'Coral',  'f5846f');

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
