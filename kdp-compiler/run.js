const fs = require('fs');
const path = require('path');
const { buildInterior } = require('./compile-interior');

const INPUT_DIR = path.join(__dirname, 'input');
const OUTPUT_FILE = path.join(__dirname, 'output', 'interior-proof.pdf');

async function run() {
  console.log("Starting Phase 0 compilation...");

  if (!fs.existsSync(INPUT_DIR)) fs.mkdirSync(INPUT_DIR);
  if (!fs.existsSync(path.dirname(OUTPUT_FILE))) fs.mkdirSync(path.dirname(OUTPUT_FILE));

  const files = fs.readdirSync(INPUT_DIR)
    .filter(file => file.toLowerCase().endsWith('.png'))
    .sort();

  if (files.length === 0) {
    console.error("No PNG files found in the 'input' directory.");
    process.exit(1);
  }

  const artPaths = files.map(f => path.join(INPUT_DIR, f));
  console.log(`Found ${artPaths.length} art files. Generating ${2 + (artPaths.length * 2)} page interior...`);

  try {
    const result = await buildInterior({ artPaths, outputPath: OUTPUT_FILE, useBleed: false });
    console.log(`\nSUCCESS.\nPDF compiled to: ${result.outputPath}\nTotal Interior Pages: ${result.interiorPages}`);
  } catch (err) {
    console.error("\nCOMPILATION FAILED:\n" + err.message);
  }
}
run();
