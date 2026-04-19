// Crops the ت glyph from each logo, fills with bg color, exports as square icon
const sharp = require("./node_modules/sharp");
const path  = require("path");

const THEMES = [
  { label: "blush",  file: "name-logo-blush.png",  bg: { r:253, g:246, b:240 } },
  { label: "mint",   file: "name-logo-mint.png",   bg: { r:157, g:221, b:213 } },
  { label: "yellow", file: "name-logo-yellow.png", bg: { r:255, g:229, b:164 } },
  { label: "coral",  file: "name-logo-coral.png",  bg: { r:245, g:132, b:111 } },
];

async function findTBounds(data, w, h) {
  // Scan from right: find the rightmost column with opaque pixels (right edge of ت)
  let rightEdge = 0;
  for (let x = w - 1; x >= 0; x--) {
    let hasOpaque = false;
    for (let y = 0; y < h; y++) {
      if (data[(y * w + x) * 4 + 3] > 60) { hasOpaque = true; break; }
    }
    if (hasOpaque) { rightEdge = x; break; }
  }

  // Scan left from rightEdge to find first GAP column (gap between ت and prev char)
  // Gap = column where total opaque count drops to near 0
  let gapX = 0;
  for (let x = rightEdge - 1; x >= 0; x--) {
    let opaqueCount = 0;
    for (let y = 0; y < h; y++) {
      if (data[(y * w + x) * 4 + 3] > 60) opaqueCount++;
    }
    if (opaqueCount === 0) {
      gapX = x;
      break;
    }
  }

  // Now find the bounding box of pixels from gapX to rightEdge
  let minX = rightEdge, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = gapX; x <= rightEdge; x++) {
      if (data[(y * w + x) * 4 + 3] > 60) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, maxX, minY, maxY };
}

async function cropT(theme) {
  const src = path.join(__dirname, "public", theme.file);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  const { minX, maxX, minY, maxY } = await findTBounds(data, w, h);
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  // Add 15% padding around the glyph
  const pad = Math.round(Math.max(cropW, cropH) * 0.15);
  const size = Math.max(cropW, cropH) + pad * 2;

  // Build output buffer: bg color everywhere, then stamp the glyph centered
  const out = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    out[i * 4]     = theme.bg.r;
    out[i * 4 + 1] = theme.bg.g;
    out[i * 4 + 2] = theme.bg.b;
    out[i * 4 + 3] = 255;
  }

  // Center the glyph bounding box in the output square
  const offsetX = Math.round((size - cropW) / 2);
  const offsetY = Math.round((size - cropH) / 2);

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((minY + y) * w + (minX + x)) * 4;
      const dstIdx = ((offsetY + y) * size + (offsetX + x)) * 4;
      const alpha  = data[srcIdx + 3] / 255;
      // Composite glyph over bg
      out[dstIdx]     = Math.round(data[srcIdx]     * alpha + theme.bg.r * (1 - alpha));
      out[dstIdx + 1] = Math.round(data[srcIdx + 1] * alpha + theme.bg.g * (1 - alpha));
      out[dstIdx + 2] = Math.round(data[srcIdx + 2] * alpha + theme.bg.b * (1 - alpha));
      out[dstIdx + 3] = 255;
    }
  }

  const outFile = path.join(__dirname, "public", `t-icon-${theme.label}.png`);
  await sharp(out, { raw: { width: size, height: size, channels: 4 } })
    .png()
    .toFile(outFile);

  console.log(`✓ ${theme.label}: cropped (${minX},${minY})→(${maxX},${maxY}) size=${size}  → ${outFile}`);
}

(async () => {
  for (const t of THEMES) await cropT(t);
  console.log("\nAll done.");
})();
