const sharp = require('sharp');

async function inspectLineArt(buf) {
  const img = sharp(buf);
  const meta = await img.metadata();
  // Flatten onto white before measuring. greyscale() alone drops the alpha
  // channel rather than compositing it, so a transparent-background PNG reads
  // as solid black and every ink measurement below comes out at 1.0.
  const { data } = await img.clone()
    .flatten({ background: '#ffffff' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let ink = 0, mid = 0;
  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    if (v < 64) ink++;
    else if (v < 216) mid++;
  }

  let colour = false;
  if (meta.channels >= 3) {
    // Same reason as above: flatten, don't removeAlpha. Dropping alpha exposes
    // whatever RGB sits under fully transparent pixels, so an invisible
    // coloured background would register as colour in the art.
    const rgb = await img.clone().flatten({ background: '#ffffff' }).raw().toBuffer();
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
  // Art is scaled to fit the live box preserving aspect, so print quality
  // depends on the effective DPI after that fit — not on raw pixel counts
  // against a portrait threshold, which rejects landscape art that is well
  // over 300 DPI simply for being shorter than a portrait page.
  compile(r, box, minDpi = 300) {
    if (r.colour) return { pass: false, reason: 'colour pixels present' };
    const ptPerPx = Math.min(box.liveW / r.width, box.liveH / r.height);
    const dpi = 72 / ptPerPx;
    if (dpi < minDpi) {
      return { pass: false, reason: `${r.width}x${r.height} renders at ${Math.round(dpi)} DPI, below ${minDpi}` };
    }
    return { pass: true };
  }
};

module.exports = { inspectLineArt, GATES };
