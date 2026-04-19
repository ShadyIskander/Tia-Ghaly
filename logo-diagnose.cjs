const { chromium } = require('./node_modules/playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Test 1: Standard 1x viewport
  const page1x = await browser.newPage();
  await page1x.setViewportSize({ width: 1440, height: 900 });
  await page1x.goto('http://localhost:3000');
  await page1x.waitForTimeout(2000);

  const info = await page1x.evaluate(() => {
    const img = document.querySelector('img[src="/name-logo.png"]');
    if (!img) return { error: 'not found' };
    const rect = img.getBoundingClientRect();
    const cs = window.getComputedStyle(img);
    const parent = img.parentElement;
    const parentCs = window.getComputedStyle(parent);
    return {
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      cssWidth: Math.round(rect.width),
      cssHeight: Math.round(rect.height),
      complete: img.complete,
      // Check for any CSS transforms or filters that could cause blur
      transform: cs.transform,
      filter: cs.filter,
      imageRendering: cs.imageRendering,
      willChange: cs.willChange,
      opacity: cs.opacity,
      // Check parent for transforms (ScrollReveal might be applying these)
      parentTransform: parentCs.transform,
      parentFilter: parentCs.filter,
      parentWillChange: parentCs.willChange,
      // Walk up 5 levels looking for any transform that could cause blur
      ancestorTransforms: (() => {
        const transforms = [];
        let el = img.parentElement;
        for (let i = 0; i < 8; i++) {
          if (!el) break;
          const s = window.getComputedStyle(el);
          const t = s.transform;
          const f = s.filter;
          const w = s.willChange;
          const ta = s.transformOrigin;
          if (t !== 'none' || f !== 'none' || w !== 'auto') {
            transforms.push({ level: i + 1, tag: el.tagName, id: el.id, class: el.className.substring(0, 40), transform: t, filter: f, willChange: w });
          }
          el = el.parentElement;
        }
        return transforms;
      })(),
    };
  });

  console.log('\n=== IMAGE INFO ===');
  console.log(JSON.stringify(info, null, 2));

  // Screenshot the logo at its actual position - 1x
  const imgBox = await page1x.$eval('img[src="/name-logo.png"]', el => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  await page1x.screenshot({
    path: '/tmp/logo-1x.png',
    clip: { x: imgBox.x - 5, y: imgBox.y - 5, width: imgBox.width + 10, height: imgBox.height + 10 }
  });
  console.log('\nScreenshot 1x saved: /tmp/logo-1x.png');

  // Test 2: 2x device pixel ratio (Retina)
  const page2x = await browser.newPage();
  await page2x.setViewportSize({ width: 1440, height: 900 });
  await page2x.goto('http://localhost:3000');
  await page2x.waitForTimeout(2000);
  await page2x.screenshot({
    path: '/tmp/logo-2x.png',
    clip: { x: imgBox.x - 5, y: imgBox.y - 5, width: imgBox.width + 10, height: imgBox.height + 10 },
    scale: 'device'
  });
  console.log('Screenshot 2x saved: /tmp/logo-2x.png');

  // Check what HTTP headers the server sends for the image
  const response = await page1x.evaluate(async () => {
    const r = await fetch('/name-logo.png', { cache: 'no-store' });
    return {
      status: r.status,
      contentType: r.headers.get('content-type'),
      cacheControl: r.headers.get('cache-control'),
      contentLength: r.headers.get('content-length'),
    };
  });
  console.log('\n=== HTTP HEADERS for /name-logo.png ===');
  console.log(JSON.stringify(response, null, 2));

  // Check if ScrollReveal or any animation class is on an ancestor
  const revealCheck = await page1x.evaluate(() => {
    const img = document.querySelector('img[src="/name-logo.png"]');
    const results = [];
    let el = img;
    for (let i = 0; i < 10; i++) {
      if (!el) break;
      results.push({ tag: el.tagName, id: el.id || '', class: (el.className || '').substring(0, 60) });
      el = el.parentElement;
    }
    return results;
  });
  console.log('\n=== DOM ANCESTORS ===');
  revealCheck.forEach(a => console.log(a.tag, a.id, a.class));

  await browser.close();
  console.log('\nOpen screenshots: open /tmp/logo-1x.png /tmp/logo-2x.png');
})().catch(e => { console.error(e.message); process.exit(1); });
