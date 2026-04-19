const path = require("path");
const sharp = require("./node_modules/sharp");

async function findHues(filePath, label) {
  const { data } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const blues = [], pinks = [], teals = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 180) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // blue: b dominant
    if (b > r + 30 && b > g + 20) blues.push([r, g, b]);
    // pink/rose: r high, b medium, g low
    if (r > 200 && b > 100 && r > g + 40 && r > b + 20) pinks.push([r, g, b]);
    // teal: g and b similar and > r
    if (g > r + 20 && b > r + 20) teals.push([r, g, b]);
  }
  console.log(`\n=== ${label} ===  blues:${blues.length}  pinks:${pinks.length}  teals:${teals.length}`);
  if (blues.length) { const [r,g,b]=blues[0]; console.log(`  sample blue: #${[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')}`); }
  if (pinks.length) { const [r,g,b]=pinks[0]; console.log(`  sample pink: #${[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')}`); }
  if (teals.length) { const [r,g,b]=teals[0]; console.log(`  sample teal: #${[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')}`); }
}

const pub = path.join(__dirname, "public");
(async () => {
  await findHues(`${pub}/name-logo.png`,    "name-logo (original)");
  await findHues(`${pub}/name-logo-v2.png`, "name-logo-v2");
  await findHues(`${pub}/name-logo-blush.png`,  "Blush");
  await findHues(`${pub}/name-logo-mint.png`,   "Mint");
  await findHues(`${pub}/name-logo-yellow.png`, "Yellow");
  await findHues(`${pub}/name-logo-coral.png`,  "Coral");
})();
