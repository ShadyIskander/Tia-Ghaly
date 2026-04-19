/**
 * pw-webkit-check.cjs
 * Tests with Playwright's WebKit engine (same rendering as Safari)
 * to confirm the white-border issue is Safari-specific.
 */
const { webkit } = require('./node_modules/@playwright/test/index');
const sharp = require('./node_modules/sharp');

const DPR = 2;

async function scan(page, label, hex) {
  if (label !== 'Blush') {
    await page.locator('button[aria-label="Change background colour"]').click();
    await page.waitForTimeout(120);
    await page.locator(`button[title="${label}"]`).click();
    await page.waitForTimeout(300);
  }

  const screenshotBuf = await page.screenshot({ fullPage: false });
  const { data, info } = await sharp(screenshotBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = 4;

  // parse bg from expected hex
  const bgR = parseInt(hex.slice(1,3),16), bgG = parseInt(hex.slice(3,5),16), bgB = parseInt(hex.slice(5,7),16);

  // count every pixel brighter than bg+30 on all channels
  let whiteCount = 0, brightFringe = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y*W+x)*C;
      const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
      if (a < 50) continue;
      // whiter than bg by 40 on all channels
      if (r > bgR+40 && g > bgG+40 && b > bgB+40) brightFringe++;
      if (r > 230 && g > 230 && b > 230) whiteCount++;
    }
  }
  console.log(`[${label}] bg=rgb(${bgR},${bgG},${bgB})  white(>230)px: ${whiteCount}  bright-fringe: ${brightFringe}`);
  await sharp(screenshotBuf).png().toFile(`/tmp/webkit-${label.toLowerCase()}.png`);
}

(async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: DPR });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(800);

  await scan(page, 'Blush',  'fff5f3');
  await scan(page, 'Mint',   '74c9b6');
  await scan(page, 'Coral',  'f5846f');
  await scan(page, 'Yellow', 'ffe5a4');

  await browser.close();
  console.log('Screenshots saved to /tmp/webkit-*.png');
})().catch(e => { console.error(e.message); process.exit(1); });
