const PDFDocument = require('pdfkit');
const fs = require('fs');
const sharp = require('sharp');
const { artBox, fitPreservingAspect } = require('./layout');
const { inspectLineArt, GATES } = require('./qa');
const { KDP } = require('./kdp-constants');

// Must stay even. Art is laid out one page on, one page off, so an even amount
// of front matter is what puts every art page on a recto (odd) page — which is
// what artBox() assumes when it reserves the gutter on the binding edge.
const FRONT_MATTER_PAGES = 2;

const artPageNumber = (index) => FRONT_MATTER_PAGES + index * 2 + 1;

// Runs the compile gate over every page before anything is written, so a bad
// batch fails up front and reports all offenders instead of one per run.
async function assertArtPassesQA(artPaths) {
  const failures = [];
  for (const artPath of artPaths) {
    const report = await inspectLineArt(fs.readFileSync(artPath));
    const verdict = GATES.compile(report);
    if (!verdict.pass) failures.push(`${artPath}: ${verdict.reason}`);
  }
  if (failures.length) {
    throw new Error(
      `QA failed on ${failures.length} of ${artPaths.length} art files:\n  ` +
      failures.join('\n  ')
    );
  }
}

async function buildInterior({ artPaths, outputPath, useBleed = false }) {
  const interiorPages = FRONT_MATTER_PAGES + artPaths.length * 2;
  const maxPages = KDP.MAX_PAGES_8_5_X_11_WHITE;
  if (interiorPages > maxPages) {
    throw new Error(`Interior is ${interiorPages} pages. Max is ${maxPages}.`);
  }

  await assertArtPassesQA(artPaths);

  const box = artBox(interiorPages, useBleed);
  const doc = new PDFDocument({ size: [box.pageW, box.pageH], margin: 0, autoFirstPage: false });
  const out = fs.createWriteStream(outputPath);
  doc.pipe(out);

  for (let i = 0; i < FRONT_MATTER_PAGES; i++) doc.addPage();

  for (const [index, artPath] of artPaths.entries()) {
    const buf = fs.readFileSync(artPath);

    doc.addPage();

    const meta = await sharp(buf).metadata();
    const fitted = fitPreservingAspect(meta.width, meta.height, box.liveW, box.liveH);
    const x = box.x + (box.liveW - fitted.w) / 2;
    const y = box.y + (box.liveH - fitted.h) / 2;

    doc.image(buf, x, y, { width: fitted.w, height: fitted.h });

    const pageNumX = box.pageW - box.outer - 36;
    doc.fontSize(9).fillColor('#999999').text(String(artPageNumber(index)), pageNumX, box.pageH - 40, { width: 36, align: 'center' });

    doc.addPage();
  }

  doc.end();
  await new Promise((res, rej) => { out.on('finish', res); out.on('error', rej); });
  return { outputPath, interiorPages };
}

module.exports = { buildInterior, artPageNumber, FRONT_MATTER_PAGES };
