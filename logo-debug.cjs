const { chromium } = require('./node_modules/playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto('http://localhost:3000');
  await p.waitForTimeout(1500);

  const result = await p.evaluate(() => {
    const img = document.querySelector('img[src="/name-logo.png"]');
    if (!img) return { error: 'img not found' };
    const rect = img.getBoundingClientRect();
    return {
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      cssWidth: rect.width,
      cssHeight: rect.height,
      complete: img.complete,
      currentSrc: img.currentSrc,
    };
  });

  console.log('=== LOGO DEBUG ===');
  console.log(JSON.stringify(result, null, 2));
  console.log('Retina pixels needed:', result.cssWidth * 2, 'x', result.cssHeight * 2);
  console.log('Pixels available:', result.naturalWidth, 'x', result.naturalHeight);
  console.log('Sharp on Retina?', result.naturalWidth >= result.cssWidth * 2 ? 'YES' : 'NO - NEEDS MORE');

  const box = { x: Math.max(0, result.cssWidth / 2 - 10), y: 200, width: 560, height: 230 };
  await p.screenshot({ path: '/tmp/logo-rendered.png', clip: box });
  console.log('Screenshot: /tmp/logo-rendered.png');
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
