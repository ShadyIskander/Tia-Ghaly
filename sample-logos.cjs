const path = require("path");
const { createCanvas, loadImage } = require("./node_modules/canvas");

async function sample(file, label) {
  const img = await loadImage(file);
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const row = Math.floor(img.height / 2);
  const d = ctx.getImageData(0, row, img.width, 1).data;
  const opaque = [];
  for (let x = 0; x < img.width; x++) {
    const a = d[x * 4 + 3];
    if (a > 180) opaque.push([d[x * 4], d[x * 4 + 1], d[x * 4 + 2]]);
  }
  if (!opaque.length) { console.log(label, ": no opaque pixels in centre row"); return; }
  const avg = opaque.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]).map(v => Math.round(v / opaque.length));
  const hex = "#" + avg.map(v => v.toString(16).padStart(2, "0")).join("");
  console.log(label, "-> avg visible pixel:", hex, "  RGB:", avg.join(","));
}

(async () => {
  const pub = path.join(__dirname, "public");
  await sample(pub + "/name-logo-blush.png", "blush");
  await sample(pub + "/name-logo-mint.png",  "mint");
  await sample(pub + "/name-logo-yellow.png","yellow");
  await sample(pub + "/name-logo-coral.png", "coral");
})();
