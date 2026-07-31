const PT = 72;

const KDP = {
  TRIM_W_IN: 8.5,
  TRIM_H_IN: 11.0,
  BLEED_IN: 0.125,
  pageSizePts(useBleed) {
    return useBleed
      ? [(this.TRIM_W_IN + this.BLEED_IN) * PT, (this.TRIM_H_IN + this.BLEED_IN * 2) * PT]
      : [this.TRIM_W_IN * PT, this.TRIM_H_IN * PT];
  },
  gutterPts(interiorPageCount) {
    const inches = interiorPageCount <= 150 ? 0.375 :
                   interiorPageCount <= 300 ? 0.500 :
                   interiorPageCount <= 500 ? 0.625 :
                   interiorPageCount <= 700 ? 0.750 : 0.875;
    return inches * PT;
  },
  margins: { outer: 0.5 * PT, top: 0.5 * PT, bottom: 0.625 * PT },
  spineWidthIn(interiorPageCount) { return interiorPageCount * 0.002252; },
  MAX_PAGES_8_5_X_11_WHITE: 590,
  MAX_TITLES_PER_DAY: 3,
};

module.exports = { KDP, PT };
