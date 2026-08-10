const sharp = require('sharp');

async function inspectLineArt(buf) {
  const img = sharp(buf);
  const meta = await img.metadata();
  const { data } = await img.clone().greyscale().raw().toBuffer({ resolveWithObject: true });

  let ink = 0, mid = 0;
  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    if (v < 64) ink++;
    else if (v < 216) mid++;
  }

  let colour = false;
  if (meta.channels >= 3) {
    const rgb = await img.clone().removeAlpha().raw().toBuffer();
    for (let i = 0; i < rgb.length; i += 3) {
      const hi = Math.max(rgb[i], rgb[i + 1], rgb[i + 2]);
      const lo = Math.min(rgb[i], rgb[i + 1], rgb[i + 2]);
      if (hi - lo > 12) { colour = true; break; }
    }
  }

  return {
    width: meta.width,
    height: meta.height,
    channels: meta.channels,
    colour,
    inkRatio: ink / data.length,
    midRatio: mid / data.length,
  };
}

const GATES = {
  generation(r) {
    if (r.colour) return { pass: false, reason: 'colour pixels present' };
    if (r.midRatio > 0.06) return { pass: false, reason: `midtone ratio ${r.midRatio.toFixed(3)} indicates shading` };
    if (r.inkRatio < 0.02) return { pass: false, reason: 'near empty page' };
    if (r.inkRatio > 0.35) return { pass: false, reason: 'too dense to colour' };
    return { pass: true };
  },
  compile(r, minW = 2222, minH = 2963) {
    if (r.colour) return { pass: false, reason: 'colour pixels present' };
    if (r.width < minW || r.height < minH) {
      return { pass: false, reason: `${r.width}x${r.height} below ${minW}x${minH}` };
    }
    return { pass: true };
  }
};

module.exports = { inspectLineArt, GATES };
