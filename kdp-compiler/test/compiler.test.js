const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const sharp = require('sharp');

const { KDP, PT } = require('../kdp-constants');
const { artBox, fitPreservingAspect } = require('../layout');
const { GATES } = require('../qa');
const { buildInterior, artPageNumber, FRONT_MATTER_PAGES } = require('../compile-interior');

const MIN_W = 2222;
const MIN_H = 2963;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdp-test-'));

// Black bars on white: enough ink to read as line art, no shading.
function writeArt(name, { w = MIN_W, h = MIN_H, rgb = [0, 0, 0] } = {}) {
  const raw = Buffer.alloc(w * h * 3, 255);
  for (let y = Math.floor(h * 0.2); y < Math.floor(h * 0.4); y++) {
    for (let x = Math.floor(w * 0.2); x < Math.floor(w * 0.8); x++) {
      const i = (y * w + x) * 3;
      raw[i] = rgb[0]; raw[i + 1] = rgb[1]; raw[i + 2] = rgb[2];
    }
  }
  const file = path.join(tmp, name);
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toFile(file).then(() => file);
}

test('front matter is even so art always lands on a recto page', () => {
  assert.strictEqual(FRONT_MATTER_PAGES % 2, 0);
  for (let i = 0; i < 10; i++) {
    assert.strictEqual(artPageNumber(i) % 2, 1, `art ${i} must be on an odd (recto) page`);
  }
});

test('gutter widens with page count', () => {
  assert.strictEqual(KDP.gutterPts(100), 0.375 * PT);
  assert.strictEqual(KDP.gutterPts(150), 0.375 * PT);
  assert.strictEqual(KDP.gutterPts(151), 0.5 * PT);
  assert.strictEqual(KDP.gutterPts(500), 0.625 * PT);
  assert.strictEqual(KDP.gutterPts(701), 0.875 * PT);
});

test('artBox reserves the gutter on the binding edge', () => {
  const box = artBox(100, false);
  assert.strictEqual(box.pageW, KDP.TRIM_W_IN * PT);
  assert.strictEqual(box.x, box.gutter);
  assert.strictEqual(box.liveW, box.pageW - box.gutter - box.outer);
  assert.ok(box.liveW > 0 && box.liveH > 0);
});

test('fitPreservingAspect fits inside the box without distorting', () => {
  const fitted = fitPreservingAspect(4000, 2000, 600, 600);
  assert.ok(fitted.w <= 600 && fitted.h <= 600);
  assert.ok(Math.abs(fitted.w / fitted.h - 2) < 1e-9);
});

test('compile gate rejects colour and undersized art', () => {
  assert.strictEqual(GATES.compile({ colour: true, width: MIN_W, height: MIN_H }).pass, false);
  assert.strictEqual(GATES.compile({ colour: false, width: 800, height: 1000 }).pass, false);
  assert.strictEqual(GATES.compile({ colour: false, width: MIN_W, height: MIN_H }).pass, true);
});

test('buildInterior writes a PDF with two pages per art file plus front matter', async () => {
  const art = [await writeArt('good-a.png'), await writeArt('good-b.png')];
  const out = path.join(tmp, 'ok.pdf');

  const result = await buildInterior({ artPaths: art, outputPath: out });

  assert.strictEqual(result.interiorPages, FRONT_MATTER_PAGES + art.length * 2);
  assert.ok(fs.statSync(out).size > 0);
  assert.strictEqual(fs.readFileSync(out).subarray(0, 4).toString(), '%PDF');
});

test('QA failures abort the build and report every offender', async () => {
  const art = [
    await writeArt('ok.png'),
    await writeArt('small.png', { w: 800, h: 1000 }),
    await writeArt('colour.png', { rgb: [220, 30, 30] }),
  ];
  const out = path.join(tmp, 'should-not-exist.pdf');

  await assert.rejects(
    () => buildInterior({ artPaths: art, outputPath: out }),
    (err) => {
      assert.match(err.message, /QA failed on 2 of 3/);
      assert.match(err.message, /below 2222x2963/);
      assert.match(err.message, /colour pixels present/);
      return true;
    }
  );

  assert.strictEqual(fs.existsSync(out), false, 'no PDF should be written when QA fails');
});

test('interiors over the KDP page ceiling are rejected', async () => {
  const tooMany = new Array(KDP.MAX_PAGES_8_5_X_11_WHITE).fill('unused.png');
  await assert.rejects(
    () => buildInterior({ artPaths: tooMany, outputPath: path.join(tmp, 'big.pdf') }),
    /Max is 590/
  );
});
