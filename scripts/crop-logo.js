const sharp = require('sharp');
const src = '/Users/tiaghaly/Desktop/School/Senior semester 2/Design Identity/Final Color pallete/TiaGhaly-39.png';

sharp(src).raw().toBuffer({ resolveWithObject: true }).then(({ data, info }) => {
  const { width, height, channels } = info;
  let top = height, bottom = 0, left = width, right = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      // Detect dark logo pixels — background is #fff5f3 (255,245,243), very light
      const isBg = r > 200 && g > 200 && b > 200;
      if (!isBg && a > 10) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }

  const pad = 60;
  const cropLeft = Math.max(0, left - pad);
  const cropTop = Math.max(0, top - pad);
  const cropWidth = Math.min(width, right + pad + 1) - cropLeft;
  const cropHeight = Math.min(height, bottom + pad + 1) - cropTop;

  console.log('Content bounds:', { top, bottom, left, right });
  console.log('Cropping to:', { cropLeft, cropTop, cropWidth, cropHeight });

  sharp(src)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .toFile('./public/name-logo.png')
    .then(i => console.log('Done:', i))
    .catch(err => console.error(err));
});
