const sharp = require('./node_modules/sharp');

async function sharpness(file, label) {
  const { data, info } = await sharp(file)
    .greyscale()
    .resize(500, null, { kernel: 'lanczos3' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let sum = 0, count = 0;
  for (let i = 0; i < data.length - info.width; i++) {
    const diff = Math.abs(data[i] - data[i + 1]);
    sum += diff * diff;
    count++;
  }
  const score = Math.sqrt(sum / count);
  console.log(label + ': ' + score.toFixed(2) + ' (higher = sharper edges)');
}

Promise.all([
  sharpness('Tia Branding-64.tif', 'TIF 1960px (current on site)'),
  sharpness('Tia colored logo-64.png', 'Original PNG 471px'),
  sharpness('/tmp/Tia Branding.ai.png', 'AI vector render 3000px'),
]).catch(e => { console.error(e.message); process.exit(1); });
