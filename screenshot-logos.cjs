const { chromium } = require('./node_modules/@playwright/test/index');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(500);

  // Switch to mint
  const toggle = page.locator('button[aria-label="Change background colour"]');
  await toggle.click();
  await page.waitForTimeout(100);
  const mintSwatch = page.locator('button[title="Mint"]');
  await mintSwatch.click();
  await page.waitForTimeout(200);

  // Screenshot the full hero section
  const hero = page.locator('#hero');
  await hero.screenshot({ path: '/tmp/hero-mint.png' });
  console.log('Hero screenshot saved to /tmp/hero-mint.png');

  // Now screenshot with coral
  await toggle.click();
  await page.waitForTimeout(100);
  const coralSwatch = page.locator('button[title="Coral"]');
  await coralSwatch.click();
  await page.waitForTimeout(200);
  await hero.screenshot({ path: '/tmp/hero-coral.png' });
  console.log('Hero screenshot saved to /tmp/hero-coral.png');

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
