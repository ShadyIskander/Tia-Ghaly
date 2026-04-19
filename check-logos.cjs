const sharp = require('./node_modules/sharp');

async function findLine(name, bgR, bgG, bgB) {
  const { data, info } = await sharp('public/name-logo-'+name+'.png')
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W=info.width, H=info.height, C=4;
  let found = false;
  for (let y=0; y<H; y++) {
    let lightCount=0, total=0;
    for (let x=0; x<W; x++) {
      const i=(y*W+x)*C;
      if (data[i+3] < 10) continue;
      total++;
      const r=data[i], g=data[i+1], b=data[i+2];
      const dist = Math.sqrt((r-bgR)**2+(g-bgG)**2+(b-bgB)**2);
      if (dist < 30) lightCount++;
    }
    if (lightCount > 50) { console.log(name+' y='+y+': '+lightCount+'/'+total+' residual bg pixels'); found=true; }
  }
  if (!found) console.log(name+': CLEAN — no residual bg strips found');
}

Promise.all([
  findLine('blush', 253,243,242),
  findLine('mint',  116,200,181),
  findLine('yellow',255,228,162),
  findLine('coral', 244,131,111),
]).catch(e => console.error(e.message));
