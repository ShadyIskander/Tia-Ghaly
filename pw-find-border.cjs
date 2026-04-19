/**
 * pw-find-border.cjs
 * Walk the entire DOM tree of #hero in WebKit and dump every element
 * that has a non-transparent border, outline, or box-shadow.
 * Also checks for focus rings (outline on focused elements).
 */
const { webkit } = require('./node_modules/@playwright/test/index');
const sharp = require('./node_modules/sharp');

(async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(600);

  // Switch to Coral so the white line is most visible
  await page.locator('button[aria-label="Change background colour"]').click();
  await page.waitForTimeout(120);
  await page.locator('button[title="Coral"]').click();
  await page.waitForTimeout(400);

  // Dump ALL computed styles for every element in or above #hero
  const findings = await page.evaluate(() => {
    const results = [];

    const PROPS = [
      'border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
      'outline', 'boxShadow', 'backgroundColor', 'background',
    ];

    const isVisible = (v) => {
      if (!v) return false;
      if (v === 'none') return false;
      if (v === 'transparent') return false;
      if (v === 'rgba(0, 0, 0, 0)') return false;
      if (/^0px/.test(v)) return false;
      return true;
    };

    const scan = (el, depth) => {
      const cs = window.getComputedStyle(el);
      const issues = {};
      for (const p of PROPS) {
        const v = cs[p];
        if (isVisible(v)) issues[p] = v;
      }
      // Also check :focus  
      const rect = el.getBoundingClientRect();
      const tag = el.tagName.toLowerCase();
      const id = el.id ? '#' + el.id : '';
      const cls = el.className && typeof el.className === 'string' 
        ? '.' + el.className.trim().replace(/\s+/g, '.').slice(0, 60) 
        : '';
      const selector = tag + id + cls;

      if (Object.keys(issues).length > 0) {
        results.push({
          depth,
          selector,
          rect: { l: Math.round(rect.left), t: Math.round(rect.top), w: Math.round(rect.width), h: Math.round(rect.height) },
          issues,
        });
      }

      for (const child of el.children) scan(child, depth + 1);
    };

    // Scan from body down
    scan(document.body, 0);
    return results;
  });

  console.log('=== Elements with borders/outlines/shadows ===');
  findings.forEach(f => {
    console.log(`\n${'  '.repeat(Math.min(f.depth,6))}${f.selector}`);
    console.log(`${'  '.repeat(Math.min(f.depth,6))}  rect: ${f.rect.l},${f.rect.t} ${f.rect.w}×${f.rect.h}`);
    Object.entries(f.issues).forEach(([k,v]) => {
      console.log(`${'  '.repeat(Math.min(f.depth,6))}  ${k}: ${v}`);
    });
  });

  // Also take a screenshot and crop the area around the logo to see the line
  const screenshotBuf = await page.screenshot();
  await sharp(screenshotBuf)
    .extract({ left: 700, top: 200, width: 900, height: 700 })
    .png()
    .toFile('/tmp/coral-logo-area.png');
  console.log('\nSaved crop → /tmp/coral-logo-area.png');

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
