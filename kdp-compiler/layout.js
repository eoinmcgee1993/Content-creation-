const { KDP, PT } = require('./kdp-constants');

function artBox(interiorPageCount, useBleed = false) {
  const [pageW, pageH] = KDP.pageSizePts(useBleed);
  const gutter = KDP.gutterPts(interiorPageCount);
  const { outer, top, bottom } = KDP.margins;
  // Bleed is added on the outer width edge and on both height edges, so the
  // trim box stays flush to the binding edge and is inset by one bleed
  // vertically. Margins are measured off the trim, never off the bleed —
  // otherwise every margin comes out one bleed tighter than declared.
  const bleed = useBleed ? KDP.BLEED_IN * PT : 0;
  const trimW = KDP.TRIM_W_IN * PT;
  const trimH = KDP.TRIM_H_IN * PT;
  const liveW = trimW - gutter - outer;
  const liveH = trimH - top - bottom;
  return {
    pageW, pageH, gutter, outer, top, bottom,
    trimTop: bleed, trimH,
    liveW, liveH,
    x: gutter,
    y: bleed + top,
  };
}

function fitPreservingAspect(srcW, srcH, boxW, boxH) {
  const scale = Math.min(boxW / srcW, boxH / srcH);
  return { w: srcW * scale, h: srcH * scale };
}

module.exports = { artBox, fitPreservingAspect };
