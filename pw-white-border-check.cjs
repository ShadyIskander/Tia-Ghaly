/**
 * pw-white-border-check.cjs
 * 
 * Takes a full 2x-DPR screenshot for each theme, finds the logo <img> element
 * bounding rect, crops that exact region from the screenshot, then:
 *  1. Reports every near-white pixel (R,G,B > 200) with alpha > 50
 *  2. Saves an annotated "zoomed edge" crop so we can see the fringe
 *  3. Tells us what computed CSS the logo container/images have
 */
const { chromium } = require('./node_modules/@playwright/test/index');
const sharp = require('./node_modules/sharp');
const fs = require('fs');

const DPR = 2;

async function diagnoseTheme(page, label) {
  // ── switch theme ──────────────────────────────────────────
  if (label !== 'Blush') {
    const toggle = page.locator('button[aria-label="Change background colour"]');
    await toggle.click();
    await page.waitForTimeout(120);
    const swatch = page.locator(`button[title="${label}"]`);
    await swatch.click();
    await page.waitForTimeout(300);
  }

  // ── grab computed styles ──────────────────────────────────
  const styles = await page.evaluate((lbl) => {
    const imgs = document.querySelectorAll('#hero img');
    const result = [];
    imgs.forEach(img => {
      const cs = window.getComputedStyle(img);
      result.push({
        src: img.src.split('/').pop(),
        opacity: cs.opacity,
        background: cs.backgroundColor,
        outline: cs.outline,
        border: cs.border,
        boxShadow: cs.boxShadow,
        imageRendering: cs.imageRendering,
      });
    });
    // Also check the wrapper div
    const wrapper = document.querySelector('#hero > div:nth-child(2) > div:first-child');
    if (wrapper) {
      const cs = window.getComputedStyle(wrapper);
      result.push({
        src: 'WRAPPER',
        background: cs.backgroundColor,
        overflow: cs.overflow,
        border: cs.border,
        boxShadow: cs.boxShadow,
        outline: cs.outline,
      });
    }
    return result;
  }, label);

  console.log(`\n=== ${label} computed styles ===`);
  styles.forEach(s => {
    const issues = [];
    if (s.background && s.background !== 'rgba(0, 0, 0, 0)' && s.background !== 'transparent') issues.push('BG:' + s.background);
    if (s.outline && s.outline !== 'none' && !s.outline.includes('0px')) issues.push('OUTLINE:' + s.outline);
    if (s.border && s.border !== 'none' && !s.border.includes('0px')) issues.push('BORDER:' + s.border);
    if (s.boxShadow && s.boxShadow !== 'none') issues.push('SHADOW:' + s.boxShadow);
    const line = `  ${s.src}: opacity=${s.opacity} bg=${s.background}${issues.length ? ' ⚠ '+issues.join(' | ') : ''}`;
    console.log(line);
  });

  // ── get bounding rect of the active logo img ──────────────
  const logoRect = await page.evaluate((lbl) => {
    const imgs = document.querySelectorAll('#hero img');
    for (const img of imgs) {
      if (img.style.opacity === '1' || parseFloat(window.getComputedStyle(img).opacity) > 0.5) {
        const r = img.getBoundingClientRect();
        return { left: r.left, top: r.top, width: r.width, height: r.height };
      }
    }
    // fallback: first img
    const r = imgs[0].getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }, label);

  // ── full-page screenshot ──────────────────────────────────
  const screenshotBuf = await page.screenshot({ fullPage: false });
  const { data, info } = await sharp(screenshotBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = 4;

  // Convert CSS rect → physical pixels (DPR)
  const px = {
    left:   Math.max(0, Math.floor(logoRect.left   * DPR)),
    top:    Math.max(0, Math.floor(logoRect.top    * DPR)),
    right:  Math.min(W-1, Math.ceil((logoRect.left + logoRect.width)  * DPR)),
    bottom: Math.min(H-1, Math.ceil((logoRect.top  + logoRect.height) * DPR)),
  };
  console.log(`  Logo physical rect in screenshot: left=${px.left} top=${px.top} right=${px.right} bottom=${px.bottom} (${W}x${H} @ ${DPR}x)`);

  // ── scan a 4px-wide frame AROUND the logo rect for non-bg pixels ──
  const bgIdx = 0; // corner
  const bgR = data[bgIdx], bgG = data[bgIdx+1], bgB = data[bgIdx+2];
  console.log(`  Background colour: rgb(${bgR},${bgG},${bgB})`);

  const col = (x, y) => {
    const i = (y * W + x) * C;
    return { r: data[i], g: data[i+1], b: data[i+2], a: data[i+3] };
  };
  const diff = (x, y) => {
    const c = col(x, y);
    const dr = c.r - bgR, dg = c.g - bgG, db = c.b - bgB;
    return Math.sqrt(dr*dr + dg*dg + db*db);
  };

  let whitePixels = 0, nearWhitePixels = 0, fringePixels = 0;

  // Scan 6px outside the logo rect
  for (let margin = 1; margin <= 6; margin++) {
    for (let x = px.left - margin; x <= px.right + margin; x++) {
      for (const y of [px.top - margin, px.bottom + margin]) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const c = col(x, y);
        const d = diff(x, y);
        if (c.a > 50 && d > 10) {
          fringePixels++;
          if (c.r > 230 && c.g > 230 && c.b > 230) whitePixels++;
          else if (c.r > 200 && c.g > 200 && c.b > 200) nearWhitePixels++;
          if (fringePixels <= 5) console.log(`  FRINGE at (${x},${y}) margin=${margin}: rgb(${c.r},${c.g},${c.b}) diff=${d.toFixed(1)}`);
        }
      }
    }
    for (let y = px.top - margin; y <= px.bottom + margin; y++) {
      for (const x of [px.left - margin, px.right + margin]) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const c = col(x, y);
        const d = diff(x, y);
        if (c.a > 50 && d > 10) {
          fringePixels++;
          if (c.r > 230 && c.g > 230 && c.b > 230) whitePixels++;
          else if (c.r > 200 && c.g > 200 && c.b > 200) nearWhitePixels++;
          if (fringePixels <= 5) console.log(`  FRINGE at (${x},${y}) margin=${margin}: rgb(${c.r},${c.g},${c.b}) diff=${d.toFixed(1)}`);
        }
      }
    }
  }

  // ── also scan INSIDE the logo rect, 6px from each edge ──
  let insideWhite = 0;
  const EDGE = 6;
  const checkInside = (x, y) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const c = col(x, y);
    if (c.r > 235 && c.g > 235 && c.b > 235 && c.a > 50) insideWhite++;
  };
  for (let y = px.top; y <= px.top + EDGE; y++)
    for (let x = px.left; x <= px.right; x++) checkInside(x, y);
  for (let y = px.bottom - EDGE; y <= px.bottom; y++)
    for (let x = px.left; x <= px.right; x++) checkInside(x, y);
  for (let x = px.left; x <= px.left + EDGE; x++)
    for (let y = px.top; y <= px.bottom; y++) checkInside(x, y);
  for (let x = px.right - EDGE; x <= px.right; x++)
    for (let y = px.top; y <= px.bottom; y++) checkInside(x, y);

  console.log(`  White pixels (>230) OUTSIDE logo: ${whitePixels}, near-white (>200): ${nearWhitePixels}, total fringe: ${fringePixels}`);
  console.log(`  White-ish pixels (>235) on logo INNER-edge (6px frame): ${insideWhite}`);

  // ── save a zoomed crop of the top-left quadrant of the logo ──
  const cropX = Math.max(0, px.left - 10);
  const cropY = Math.max(0, px.top  - 10);
  const cropW = Math.min(W - cropX, 200);
  const cropH = Math.min(H - cropY, 200);

  await sharp(screenshotBuf)
    .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
    .png()
    .toFile(`/tmp/logo-edge-${label.toLowerCase()}.png`);
  console.log(`  Saved crop → /tmp/logo-edge-${label.toLowerCase()}.png`);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: DPR });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(600);

  await diagnoseTheme(page, 'Blush');
  await diagnoseTheme(page, 'Mint');
  await diagnoseTheme(page, 'Coral');

  await browser.close();
  console.log('\nDone.');
})().catch(e => { console.error(e.message); process.exit(1); });
