const { chromium } = require('./node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  // Scroll to the About Me section
  await page.evaluate(() => {
    const el = document.getElementById('more');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(500);

  const data = await page.evaluate(() => {
    const section = document.getElementById('more');
    const heading = section?.querySelector('h2');
    const subtext = section?.querySelector('p');
    const carousel = section?.querySelector('div[style*="position: relative"]');
    const firstCard = section?.querySelector('div[style*="position: absolute"]');

    const sectionRect  = section?.getBoundingClientRect();
    const headingRect  = heading?.getBoundingClientRect();
    const subtextRect  = subtext?.getBoundingClientRect();
    const carouselRect = carousel?.getBoundingClientRect();
    const cardRect     = firstCard?.getBoundingClientRect();

    return {
      sectionTop:    sectionRect?.top,
      headingTop:    headingRect?.top,
      headingBottom: headingRect?.bottom,
      subtextBottom: subtextRect?.bottom,
      carouselTop:   carouselRect?.top,
      firstCardTop:  cardRect?.top,
      gapHeadingToCarousel: carouselRect && headingRect ? carouselRect.top - headingRect.bottom : null,
      gapSubtextToCarousel: carouselRect && subtextRect ? carouselRect.top - subtextRect.bottom : null,
      sectionPaddingTop: section ? window.getComputedStyle(section).paddingTop : null,
      headerDivMarginBottom: (function() {
        var d = section && section.querySelector('div');
        return d ? window.getComputedStyle(d).marginBottom : null;
      })(),
    };
  });

  console.log('\n=== SPACING MEASUREMENTS ===');
  console.log('Section padding-top:       ', data.sectionPaddingTop);
  console.log('Header div margin-bottom:  ', data.headerDivMarginBottom);
  console.log('Gap: heading bottom → carousel top:', data.gapHeadingToCarousel?.toFixed(1), 'px');
  console.log('Gap: subtext bottom → carousel top:', data.gapSubtextToCarousel?.toFixed(1), 'px');
  console.log('\nAbsolute positions (in viewport):');
  console.log('  Section top:  ', data.sectionTop?.toFixed(1));
  console.log('  Heading top:  ', data.headingTop?.toFixed(1));
  console.log('  Heading bottom:', data.headingBottom?.toFixed(1));
  console.log('  Subtext bottom:', data.subtextBottom?.toFixed(1));
  console.log('  Carousel top:  ', data.carouselTop?.toFixed(1));
  console.log('  First card top:', data.firstCardTop?.toFixed(1));

  await page.screenshot({ path: '/tmp/spacing.png', fullPage: false });
  console.log('\nScreenshot: /tmp/spacing.png');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
