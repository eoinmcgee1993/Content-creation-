const { KDP, PT } = require('./kdp-constants');

function artBox(interiorPageCount, useBleed = false) {
  const [pageW, pageH] = KDP.pageSizePts(useBleed);
  const gutter = KDP.gutterPts(interiorPageCount);
  const { outer, top, bottom } = KDP.margins;
  const liveW = pageW - gutter - outer;
  const liveH = pageH - top - bottom;
  return { pageW, pageH, gutter, outer, top, bottom, liveW, liveH, x: gutter, y: top };
}

function fitPreservingAspect(srcW, srcH, boxW, boxH) {
  const scale = Math.min(boxW / srcW, boxH / srcH);
  return { w: srcW * scale, h: srcH * scale };
}

module.exports = { artBox, fitPreservingAspect };
