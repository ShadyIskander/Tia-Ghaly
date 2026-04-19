// BFS flood-fill from image edges + global threshold pass to remove background
const sharp = require('./node_modules/sharp');

async function makeTransparent(inputFile, outputFile) {
  const { data, info } = await sharp(inputFile)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width, H = info.height, C = 4;
  const buf = Buffer.from(data);

  // ALWAYS use top-left corner (0,0) as the bg reference.
  // Averaging corners breaks when the TIF has white canvas margins on some corners.
  const bgR = buf[0], bgG = buf[1], bgB = buf[2];

  function colorDist(bi) {
    const dr = buf[bi]   - bgR;
    const dg = buf[bi+1] - bgG;
    const db = buf[bi+2] - bgB;
    return Math.sqrt(dr*dr + dg*dg + db*db);
  }

  const BFS_TOLERANCE    = 42;  // generous to catch anti-aliased fringe pixels
  const GLOBAL_TOLERANCE = 30;  // removes enclosed background pockets

  // ── Pass 1: BFS from all 4 edges ──────────────────────────
  // Store pixel index (not x,y pairs). Pre-mark visited before enqueue so
  // each pixel enters the queue at most once → queue size W*H is enough.
  const visited = new Uint8Array(W * H);
  const queue   = new Int32Array(W * H);
  let head = 0, tail = 0;

  function enqueue(idx) {
    if (!visited[idx]) {
      visited[idx] = 1;
      queue[tail++] = idx;
    }
  }

  for (let x = 0; x < W; x++) { enqueue(x); enqueue((H-1)*W + x); }
  for (let y = 1; y < H-1; y++) { enqueue(y*W); enqueue(y*W + W-1); }

  while (head < tail) {
    const idx = queue[head++];
    const bi = idx * C;
    if (colorDist(bi) > BFS_TOLERANCE) continue;
    buf[bi + 3] = 0;
    const x = idx % W;
    const y = (idx / W) | 0;
    if (x > 0)   enqueue(idx - 1);
    if (x < W-1) enqueue(idx + 1);
    if (y > 0)   enqueue(idx - W);
    if (y < H-1) enqueue(idx + W);
  }

  // ── Pass 2: global threshold — removes enclosed background pockets ─
  for (let i = 0; i < W * H * C; i += C) {
    if (buf[i+3] === 0) continue;
    if (colorDist(i) <= GLOBAL_TOLERANCE) buf[i+3] = 0;
  }

  // ── Pass 3: remove near-white canvas margins (for TIFs with white edges) ─
  // White margins (R,G,B all > 230) are blank canvas, not design content.
  for (let i = 0; i < W * H * C; i += C) {
    if (buf[i+3] === 0) continue;
    if (buf[i] > 230 && buf[i+1] > 230 && buf[i+2] > 230) buf[i+3] = 0;
  }

  await sharp(buf, { raw: { width: W, height: H, channels: C } })
    .png({ compressionLevel: 9 })
    .toFile(outputFile);

  const meta = await sharp(outputFile).metadata();
  console.log(`✓ ${outputFile}  ${meta.width}×${meta.height}  hasAlpha=${meta.hasAlpha}`);
}

const files = [
  ['Tia Branding-64.tif', 'public/name-logo-blush.png'],
  ['Tia Branding-65.tif', 'public/name-logo-yellow.png'],
  ['Tia Branding-66.tif', 'public/name-logo-coral.png'],
  ['Tia Branding-67.tif', 'public/name-logo-mint.png'],
];

(async () => {
  for (const [src, dest] of files) {
    await makeTransparent(src, dest);
  }
  console.log('\nAll logos updated with transparent backgrounds.');
})().catch(e => { console.error(e.message); process.exit(1); });
