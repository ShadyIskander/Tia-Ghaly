const sharp = require('./node_modules/sharp');

async function diagnoseLogoFrame(name) {
  const { data, info } = await sharp('/tmp/hero-' + name + '.png')
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = 4;

  // bg is top-left corner
  const bgR = data[0], bgG = data[1], bgB = data[2];
  const dist = (i) => {
    const dr = data[i]-bgR, dg = data[i+1]-bgG, db = data[i+2]-bgB;
    return Math.sqrt(dr*dr+dg*dg+db*db);
  };

  // Find bounding box of all pixels that differ from background
  let lX=W, rX=0, tY=H, bY=0;
  for (let y=0; y<H; y++) {
    for (let x=0; x<W; x++) {
      if (dist((y*W+x)*C) > 25) {
        if (x<lX) lX=x; if (x>rX) rX=x;
        if (y<tY) tY=y; if (y>bY) bY=y;
      }
    }
  }
  console.log(name+': content bbox x=['+lX+','+rX+'] y=['+tY+','+bY+'] in '+W+'x'+H);

  // But the first "block" of content might be the section header text, not the logo.
  // Scan rows starting from tY to find the logo container.
  // The logo should be wider than text rows.
  let logoTop=-1, logoBottom=-1, logoLeft=-1, logoRight=-1;
  for (let y=tY; y<=bY; y++) {
    let rowLeft=W, rowRight=0, rowPixels=0;
    for (let x=0; x<W; x++) {
      if (dist((y*W+x)*C) > 25) {
        if (x<rowLeft) rowLeft=x;
        if (x>rowRight) rowRight=x;
        rowPixels++;
      }
    }
    const rowWidth = rowRight - rowLeft;
    if (rowWidth > W*0.4) { // logo is wide (>40% of viewport)
      if (logoTop === -1) { logoTop = y; logoLeft = rowLeft; logoRight = rowRight; }
      logoBottom = y;
    } else if (logoTop !== -1 && logoBottom !== -1) {
      break; // ended logo block
    }
  }
  if (logoTop === -1) {
    console.log('  Could not detect logo block.');
    return;
  }
  console.log('  Logo block: y=['+logoTop+','+logoBottom+'] x=['+logoLeft+','+logoRight+']');

  // Check the 3px "frame" just outside the logo block for non-background pixels
  // (= the white line would be HERE)
  let frameIssues = [];
  for (let margin = 1; margin <= 4; margin++) {
    // top edge
    for (let x=logoLeft-margin; x<=logoRight+margin; x++) {
      const y = logoTop - margin;
      if (y<0||x<0||x>=W) continue;
      const d = dist((y*W+x)*C);
      if (d > 15 && d < 200) { // not bg, not content = frame artifact
        const i=(y*W+x)*C;
        frameIssues.push({x,y,margin:'top-'+margin,r:data[i],g:data[i+1],b:data[i+2],d:d.toFixed(1)});
      }
    }
    // bottom edge  
    for (let x=logoLeft-margin; x<=logoRight+margin; x++) {
      const y = logoBottom + margin;
      if (y>=H||x<0||x>=W) continue;
      const d = dist((y*W+x)*C);
      if (d > 15 && d < 200) {
        const i=(y*W+x)*C;
        frameIssues.push({x,y,margin:'bot-'+margin,r:data[i],g:data[i+1],b:data[i+2],d:d.toFixed(1)});
      }
    }
    // left edge
    for (let y=logoTop-margin; y<=logoBottom+margin; y++) {
      const x = logoLeft - margin;
      if (x<0||y<0||y>=H) continue;
      const d = dist((y*W+x)*C);
      if (d > 15 && d < 200) {
        const i=(y*W+x)*C;
        frameIssues.push({x,y,margin:'left-'+margin,r:data[i],g:data[i+1],b:data[i+2],d:d.toFixed(1)});
      }
    }
    // right edge
    for (let y=logoTop-margin; y<=logoBottom+margin; y++) {
      const x = logoRight + margin;
      if (x>=W||y<0||y>=H) continue;
      const d = dist((y*W+x)*C);
      if (d > 15 && d < 200) {
        const i=(y*W+x)*C;
        frameIssues.push({x,y,margin:'right-'+margin,r:data[i],g:data[i+1],b:data[i+2],d:d.toFixed(1)});
      }
    }
  }

  if (frameIssues.length === 0) {
    console.log('  No frame artifacts detected outside logo block.');
  } else {
    console.log('  Frame artifacts found: '+frameIssues.length);
    // Show first 20
    frameIssues.slice(0,20).forEach(f => console.log('    '+JSON.stringify(f)));
  }

  // Also: check for any pixel that is lighter than bg but NOT bg (= intermediate tint = fringe)
  // within 3px of the logo top/bottom boundaries
  let fringeCount = 0;
  const checkFringe = (x, y) => {
    if (x<0||x>=W||y<0||y>=H) return;
    const i=(y*W+x)*C;
    const r=data[i],g=data[i+1],b=data[i+2];
    // Lighter than bg means each channel is higher than bg (brighter)
    const lighterThanBg = r>bgR+10 && g>bgG+10 && b>bgB+10;
    if (lighterThanBg) fringeCount++;
  };
  // top 3px of logo
  for (let y=logoTop; y<=logoTop+3; y++)
    for (let x=logoLeft; x<=logoRight; x++) checkFringe(x,y);
  // bottom 3px
  for (let y=logoBottom-3; y<=logoBottom; y++)
    for (let x=logoLeft; x<=logoRight; x++) checkFringe(x,y);
  // left 3px
  for (let y=logoTop; y<=logoBottom; y++)
    for (let x=logoLeft; x<=logoLeft+3; x++) checkFringe(x,y);
  // right 3px
  for (let y=logoTop; y<=logoBottom; y++)
    for (let x=logoRight-3; x<=logoRight; x++) checkFringe(x,y);

  console.log('  Pixels lighter than bg in logo boundary frame: '+fringeCount);
}

diagnoseLogoFrame('mint').then(() => diagnoseLogoFrame('coral')).catch(e => console.error(e.message));
