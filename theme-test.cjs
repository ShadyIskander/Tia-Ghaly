const { chromium } = require('./node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  // ── Step 1: measure initial background ──────────────────────────
  const before = await page.evaluate(() => ({
    bodyBg:     window.getComputedStyle(document.body).backgroundColor,
    bodyInline: document.body.style.backgroundColor,
    rootBg:     getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
    rootBgInline: document.documentElement.style.getPropertyValue('--bg').trim(),
  }));
  console.log('\n=== BEFORE CLICK ===');
  console.log(JSON.stringify(before, null, 2));

  // ── Step 2: find and click the palette button ────────────────────
  const paletteBtn = page.locator('button[aria-label="Change background colour"]');
  const paletteBtnCount = await paletteBtn.count();
  console.log('\nPalette button found:', paletteBtnCount);

  if (paletteBtnCount > 0) {
    await paletteBtn.click();
    await page.waitForTimeout(400);

    // ── Step 3: find the swatches ──────────────────────────────────
    const swatches = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      return btns.map(b => ({
        label: b.getAttribute('aria-label') || b.getAttribute('title') || '',
        bg: window.getComputedStyle(b).backgroundColor,
        opacity: window.getComputedStyle(b).opacity,
        pointerEvents: window.getComputedStyle(b).pointerEvents,
        visible: b.offsetParent !== null,
      }));
    });
    console.log('\n=== BUTTONS AFTER PALETTE OPEN ===');
    swatches.forEach((s, i) => console.log(`[${i}]`, JSON.stringify(s)));

    // ── Step 4: click the mint swatch (#74c9b6) ────────────────────
    const mintBtn = page.locator('button[title="Mint"]');
    const mintCount = await mintBtn.count();
    console.log('\nMint swatch found:', mintCount);

    if (mintCount > 0) {
      // Force click to bypass pointer-events:none if any
      await mintBtn.click({ force: true });
      await page.waitForTimeout(600);

      const after = await page.evaluate(() => ({
        bodyBg:        window.getComputedStyle(document.body).backgroundColor,
        bodyInline:    document.body.style.backgroundColor,
        rootBg:        getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
        rootBgInline:  document.documentElement.style.getPropertyValue('--bg').trim(),
        rootBgCss:     getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
        localStorage:  localStorage.getItem('portfolio-bg'),
      }));
      console.log('\n=== AFTER CLICKING MINT ===');
      console.log(JSON.stringify(after, null, 2));

      const changed = after.bodyBg !== before.bodyBg;
      console.log('\n✅ Background changed?', changed);
      if (!changed) {
        console.log('❌ PROBLEM: body background did NOT change');
        console.log('   before:', before.bodyBg);
        console.log('   after: ', after.bodyBg);
        console.log('   --bg CSS var on root:', after.rootBg || '(empty)');
        console.log('   --bg inline on root: ', after.rootBgInline || '(empty)');
        console.log('   body inline style:   ', after.bodyInline || '(empty)');
        console.log('   localStorage value:  ', after.localStorage);
      }
    }
  }

  await page.screenshot({ path: '/tmp/theme-debug.png' });
  console.log('\nScreenshot: /tmp/theme-debug.png');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
