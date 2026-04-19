const { chromium } = require('./node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  // Scroll to projects list
  await page.evaluate(() => {
    const el = document.getElementById('projects-list');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(600);

  // Click first project
  const items = await page.locator('li').all();
  console.log('Total <li> items:', items.length);
  for (let i = 0; i < Math.min(items.length, 6); i++) {
    const txt = await items[i].textContent();
    console.log('  li[' + i + ']:', txt?.trim().substring(0, 60));
  }

  // Try clicking the first li
  if (items.length > 0) {
    await items[0].click();
    await page.waitForTimeout(800);
  }

  // Check what appeared
  const allFixed = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const results = [];
    for (const el of all) {
      const cs = window.getComputedStyle(el);
      if (cs.position === 'fixed') {
        const r = el.getBoundingClientRect();
        results.push({
          tag: el.tagName,
          id: el.id,
          className: el.className?.toString().substring(0, 80),
          style: el.getAttribute('style')?.substring(0, 120),
          rect: { top: r.top, left: r.left, width: r.width, height: r.height }
        });
      }
    }
    return results;
  });

  console.log('\nFixed elements after click:', allFixed.length);
  for (const el of allFixed) {
    console.log(' -', el.tag, el.id ? '#' + el.id : '', el.className ? '.' + el.className.split(' ')[0] : '');
    console.log('   style:', el.style);
    console.log('   rect:', JSON.stringify(el.rect));
  }

  // Also check absolute positioned inside fixed
  const absoluteInFixed = await page.evaluate(() => {
    const results = [];
    const fixed = [...document.querySelectorAll('*')].filter(el => window.getComputedStyle(el).position === 'fixed');
    for (const f of fixed) {
      const children = [...f.querySelectorAll('*')].filter(el => {
        const cs = window.getComputedStyle(el);
        return cs.position === 'absolute';
      });
      for (const c of children) {
        const r = c.getBoundingClientRect();
        results.push({
          tag: c.tagName,
          style: c.getAttribute('style')?.substring(0, 150),
          computed: {
            top: window.getComputedStyle(c).top,
            left: window.getComputedStyle(c).left,
            right: window.getComputedStyle(c).right,
            bottom: window.getComputedStyle(c).bottom,
            inset: window.getComputedStyle(c).inset,
          },
          rect: { top: r.top, left: r.left, width: r.width, height: r.height }
        });
      }
    }
    return results;
  });

  console.log('\nAbsolute elements inside fixed:', absoluteInFixed.length);
  for (const el of absoluteInFixed) {
    console.log(' -', el.tag, 'style:', el.style);
    console.log('   computed inset/tlrb:', JSON.stringify(el.computed));
    console.log('   rect:', JSON.stringify(el.rect));
  }

  await page.screenshot({ path: '/tmp/modal-open.png' });
  console.log('\nScreenshot saved to /tmp/modal-open.png');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
