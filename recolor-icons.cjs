// Re-generates t-icon-*.png from the clean icon.png source
// Glyph pixels get the theme ink color; background gets the theme bg color
const sharp  = require("./node_modules/sharp");
const path   = require("path");

const THEMES = [
  { label: "blush",  bg: { r:253, g:246, b:240 }, ink: { r:0,   g:0,   b:0   } }, // black on cream
  { label: "mint",   bg: { r:157, g:221, b:213 }, ink: { r:42,  g:171, b:159 } }, // #2aab9f — exact mint logo color
  { label: "yellow", bg: { r:255, g:229, b:164 }, ink: { r:251, g:184, b:100 } }, // #fbb864
  { label: "coral",  bg: { r:245, g:132, b:111 }, ink: { r:239, g:185, b:152 } }, // #efb998
];

async function makeIcon(theme) {
  const src = path.join(__dirname, "icon T.png");
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const out = Buffer.alloc(w * h * 4);

  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4],  g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];

    // "darkness" of the source pixel: 0 = pure white/transparent bg, 1 = pure black glyph
    // We treat low-alpha OR near-white as background
    const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    const opacity   = a / 255;
    const isDark    = opacity * (1 - luminance); // 0=bg, 1=solid dark glyph

    out[i * 4]     = Math.round(theme.ink.r * isDark + theme.bg.r * (1 - isDark));
    out[i * 4 + 1] = Math.round(theme.ink.g * isDark + theme.bg.g * (1 - isDark));
    out[i * 4 + 2] = Math.round(theme.ink.b * isDark + theme.bg.b * (1 - isDark));
    out[i * 4 + 3] = 255; // always fully opaque
  }

  const outFile = path.join(__dirname, "public", `t-icon-${theme.label}.png`);
  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .resize(400, 400, { fit: "contain", background: { r: theme.bg.r, g: theme.bg.g, b: theme.bg.b, alpha: 1 } })
    .png()
    .toFile(outFile);

  console.log(`✓ t-icon-${theme.label}.png`);
}

(async () => {
  for (const t of THEMES) await makeIcon(t);
  console.log("Done.");
})();
