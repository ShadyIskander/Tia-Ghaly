/**
 * pw-line-detect.cjs
 *
 * WebKit screenshot → scan every row and column for "straight lines":
 * rows/columns that are >60% a single colour AND that colour differs
 * from the background.  Reports the y/x, length, colour, and which
 * DOM element's boundary it coincides with.
 */
const { webkit } = require('./node_modules/@playwright/test/index');
const sharp = require('./node_modules/sharp');

const DPR = 2;
const THEMES = [
  { label: 'Coral',  hex: 'f5846f' },
  { label: 'Mint',   hex: '74c9b6' },
];

async function detect(page, label, hexBg) {
  if (label !== 'Blush') {
    await page.locator('button[aria-label="Change background colour"]').click();
    await page.waitForTimeout(120);
    await page.locator(`button[title="${label}"]`).click();
    await page.waitForTimeout(400);
  }

  const buf = await page.screenshot({ fullPage: false });
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = 4;

  const bgR = parseInt(hexBg.slice(0,2),16);
  const bgG = parseInt(hexBg.slice(2,4),16);
  const bgB = parseInt(hexBg.slice(4,6),16);

  const px = (x,y) => { const i=(y*W+x)*C; return [data[i],data[i+1],data[i+2],data[i+3]]; };
  const dist = ([r,g,b]) => Math.sqrt((r-bgR)**2+(g-bgG)**2+(b-bgB)**2);

  // Find horizontal lines: rows where >60% of pixels are the same non-bg color
  const hLines = [];
  for (let y = 0; y < H; y++) {
    const hist = {};
    let total = 0;
    for (let x = 0; x < W; x++) {
      const [r,g,b,a] = px(x,y);
      if (a < 50) continue;
      total++;
      const key = `${Math.round(r/8)*8},${Math.round(g/8)*8},${Math.round(b/8)*8}`;
      hist[key] = (hist[key]||0) + 1;
    }
    if (total < 10) continue;
    const [topKey, topCount] = Object.entries(hist).sort((a,b)=>b[1]-a[1])[0];
    const frac = topCount / total;
    if (frac > 0.7) {
      const [r,g,b] = topKey.split(',').map(Number);
      const d = dist([r,g,b]);
      if (d > 15) { // differs from bg
        hLines.push({ y, frac: frac.toFixed(2), color: `rgb(${r},${g},${b})`, diff: d.toFixed(1), count: topCount });
      }
    }
  }

  // Find vertical lines: columns where >60% of pixels are same non-bg color  
  const vLines = [];
  for (let x = 0; x < W; x++) {
    const hist = {};
    let total = 0;
    for (let y = 0; y < H; y++) {
      const [r,g,b,a] = px(x,y);
      if (a < 50) continue;
      total++;
      const key = `${Math.round(r/8)*8},${Math.round(g/8)*8},${Math.round(b/8)*8}`;
      hist[key] = (hist[key]||0) + 1;
    }
    if (total < 10) continue;
    const [topKey, topCount] = Object.entries(hist).sort((a,b)=>b[1]-a[1])[0];
    const frac = topCount / total;
    if (frac > 0.7) {
      const [r,g,b] = topKey.split(',').map(Number);
      const d = dist([r,g,b]);
      if (d > 15) {
        vLines.push({ x, frac: frac.toFixed(2), color: `rgb(${r},${g},${b})`, diff: d.toFixed(1), count: topCount });
      }
    }
  }

  console.log(`\n=== ${label} bg=rgb(${bgR},${bgG},${bgB}) ${W}x${H} ===`);

  // Group contiguous line coords
  const groupContiguous = (lines, key) => {
    if (!lines.length) return [];
    const groups = [];
    let g = [lines[0]];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i][key] <= lines[i-1][key] + 3) g.push(lines[i]);
      else { groups.push(g); g = [lines[i]]; }
    }
    groups.push(g);
    return groups;
  };

  const hGroups = groupContiguous(hLines, 'y');
  const vGroups = groupContiguous(vLines, 'x');

  if (hGroups.length === 0 && vGroups.length === 0) {
    console.log('  No non-background lines found. ✓');
  }

  hGroups.forEach(g => {
    const y0 = g[0].y, y1 = g[g.length-1].y;
    const cssY0 = (y0/DPR).toFixed(1), cssY1 = (y1/DPR).toFixed(1);
    console.log(`  HORIZONTAL LINE y=${y0}-${y1} (CSS ${cssY0}-${cssY1}) color=${g[0].color} diff=${g[0].diff} ${g[0].count}px`);
  });
  vGroups.forEach(g => {
    const x0 = g[0].x, x1 = g[g.length-1].x;
    const cssX0 = (x0/DPR).toFixed(1), cssX1 = (x1/DPR).toFixed(1);
    console.log(`  VERTICAL   LINE x=${x0}-${x1} (CSS ${cssX0}-${cssX1}) color=${g[0].color} diff=${g[0].diff} ${g[0].count}px`);
  });

  // Check DOM element boundaries at line positions
  if (hGroups.length || vGroups.length) {
    const positions = [
      ...hGroups.map(g => ({ axis: 'h', v: (g[0].y + g[g.length-1].y)/2/DPR })),
      ...vGroups.map(g => ({ axis: 'v', v: (g[0].x + g[g.length-1].x)/2/DPR })),
    ];
    for (const pos of positions) {
      const elInfo = await page.evaluate(({ axis, v }) => {
        const x = axis === 'v' ? v : window.innerWidth/2;
        const y = axis === 'h' ? v : window.innerHeight/2;
        const el = document.elementFromPoint(x, y);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          id: el.id,
          cls: el.className,
          rect: { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) },
          bg: window.getComputedStyle(el).backgroundColor,
        };
      }, pos);
      console.log(`  Element at ${pos.axis}=${pos.v.toFixed(0)}:`, JSON.stringify(elInfo));
    }
  }

  // Save annotated screenshot
  await sharp(buf).png().toFile(`/tmp/line-detect-${label.toLowerCase()}.png`);
  console.log(`  Saved → /tmp/line-detect-${label.toLowerCase()}.png`);
}

(async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: DPR });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(800);

  for (const t of THEMES) await detect(page, t.label, t.hex);

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
