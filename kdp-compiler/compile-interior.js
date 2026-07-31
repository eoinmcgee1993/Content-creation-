const PDFDocument = require('pdfkit');
const fs = require('fs');
const sharp = require('sharp');
const { artBox, fitPreservingAspect } = require('./layout');
const { inspectLineArt, GATES } = require('./qa');

async function buildInterior({ artPaths, outputPath, useBleed = false }) {
  const interiorPages = 2 + artPaths.length * 2;
  if (interiorPages > 590) throw new Error(`Interior is ${interiorPages} pages. Max is 590.`);

  const box = artBox(interiorPages, useBleed);
  const doc = new PDFDocument({ size: [box.pageW, box.pageH], margin: 0, autoFirstPage: false });
  const out = fs.createWriteStream(outputPath);
  doc.pipe(out);

  doc.addPage();
  doc.addPage();

  let physicalPage = 2;

  for (const artPath of artPaths) {
    const buf = fs.readFileSync(artPath);
    const report = await inspectLineArt(buf);
    const verdict = GATES.compile(report);
    if (!verdict.pass) {
      console.warn(`[WARNING] QA failed on ${artPath}: ${verdict.reason}`);
    }

    doc.addPage();
    physicalPage += 1;

    const meta = await sharp(buf).metadata();
    const fitted = fitPreservingAspect(meta.width, meta.height, box.liveW, box.liveH);
    const x = box.x + (box.liveW - fitted.w) / 2;
    const y = box.y + (box.liveH - fitted.h) / 2;

    doc.image(artPath, x, y, { width: fitted.w, height: fitted.h });

    const pageNumX = box.pageW - box.outer - 36;
    doc.fontSize(9).fillColor('#999999').text(String(physicalPage), pageNumX, box.pageH - 40, { width: 36, align: 'center' });

    doc.addPage();
    physicalPage += 1;
  }

  doc.end();
  await new Promise((res, rej) => { out.on('finish', res); out.on('error', rej); });
  return { outputPath, interiorPages };
}

module.exports = { buildInterior };
