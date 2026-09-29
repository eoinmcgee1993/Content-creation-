// Renders site/money-machine/reveal.webm and reveal.mp4: the cinematic
// spin-and-reveal the page plays when SPIN is pressed (VP9 for browsers that
// have it, H.264 for Safari), and reveal-timing.js, which tells the page when
// each reel stops and when the light flare hits.
//
// It is an original render of our own machine (not the VideoHive preview we
// were sent, which is unlicensed and carries Envato branding). The page's
// own stage3d.js runs in headless Chromium on a manual clock, so every frame
// is rendered at leisure and the result plays back smoothly on phones that
// could never render it live. Two sub-frames are averaged into each output
// frame for motion blur; the flash, light streak and fade to black are DOM
// layers driven from the same clock and baked in.
//
// Needs Chromium with WebGL (software rendering is fine, just slow) and
// ffmpeg with libx264:
//   CHROMIUM=/path/to/chrome FFMPEG=/path/to/ffmpeg npm run render:video
// The reels land on "$ $ $"; the page prints the idea over the black end.

import { spawn } from "node:child_process";
import { createReadStream, existsSync, statSync, writeFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url))); // digital-renaissance/
const OUT = path.join(ROOT, "site/money-machine");
const SIZE = 960; // square: with object-fit: contain it fits any stage shape
const FPS = 30;
const SUB = 2; // sub-frames averaged per output frame
const FOV = 32; // must match the `video` option stage3d.js is created with
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".glb": "model/gltf-binary", ".woff2": "font/woff2" };

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  @font-face { font-family: "JetBrains Mono"; font-weight: 800; src: url(/money-machine/node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-800-normal.woff2) format("woff2"); }
  html, body { margin: 0; background: #000; overflow: hidden; }
  #stage { position: relative; width: ${SIZE}px; height: ${SIZE}px; }
  #stage canvas { display: block; width: 100%; height: 100%; }
  .fx { position: absolute; inset: 0; pointer-events: none; opacity: 0; }
  #black { background: #000; }
  #flash { background: radial-gradient(circle at 50% 44%, #fff 0, #fff 10%, rgba(210,255,255,.95) 24%, rgba(0,255,255,.5) 46%, rgba(57,255,20,.12) 64%, transparent 80%); }
  #streak { inset: auto; left: 50%; top: 44%; height: 3px; width: 0; transform: translate(-50%, -50%);
    background: linear-gradient(90deg, transparent, #00ffff 18%, #fff 50%, #39ff14 82%, transparent); box-shadow: 0 0 26px 7px rgba(0,255,255,.5); }
  #bloom { background: radial-gradient(ellipse 60% 18% at 50% 44%, rgba(0,255,255,.22), transparent 70%); }
  /* The page letterboxes the square video on pure black; its edges have to be black too. */
  #edge { opacity: 1; background: radial-gradient(ellipse 72% 70% at 50% 47%, transparent 62%, #000 100%); }
</style>
<script type="importmap">{ "imports": { "three": "/money-machine/node_modules/three/build/three.module.js", "three/addons/": "/money-machine/node_modules/three/examples/jsm/" } }</script>
</head><body>
<div id="stage"><div class="fx" id="edge"></div><div class="fx" id="black"></div><div class="fx" id="bloom"></div><div class="fx" id="flash"></div><div class="fx" id="streak"></div></div>
<script type="module">
  import { createStage } from "/site/money-machine/stage3d.js";
  import { MODES, reelPool } from "/site/money-machine/engine.js";
  const pools = [0, 1, 2].map((i) => [...new Set(MODES.flatMap((m) => reelPool(m.id)[i]))]);
  window.stops = [];
  let now = 0;
  window.ready = createStage(document.getElementById("stage"), {
    glb: "/site/money-machine/money-machine.glb", pixelRatio: 1, video: { aspect: 1, fov: ${FOV} }, manual: true,
  }).then((stage) => {
    stage.paintIdle([["SYSTEMS", ...pools[0]], ["CREATOR", ...pools[1]], ["PROBLEM", ...pools[2]]]);
    window.stage = stage;
    window.pull = () => stage.spin({ targets: ["$", "$", "$"], pools, onReelStop: () => window.stops.push(now) });
    window.frameAt = (ms, sinceFlare) => {
      now = ms;
      window.fx(sinceFlare);
      stage.renderAt(ms);
    };
    // The flash, streak and fade, as a function of seconds since the flare.
    const $ = (id) => document.getElementById(id).style;
    const ramp = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
    window.fx = (s) => {
      $("flash").opacity = s < 0 ? 0 : s < 0.1 ? s / 0.1 : 1 - ramp(s, 0.1, 0.65);
      $("streak").opacity = s < 0 ? 0 : 1 - 0.8 * ramp(s, 0.45, 1.3);
      $("streak").width = s < 0 ? "0" : 175 * Math.min(1, ramp(s, 0, 0.45) ** 0.5) + "%";
      $("black").opacity = 0.985 * ramp(s, 0.28, 0.8);
      $("bloom").opacity = s < 0.3 ? 0 : (0.55 + 0.25 * Math.sin(s * 4)) * ramp(s, 0.3, 0.9);
    };
    return true;
  });
</script>
</body></html>`;

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://x").pathname;
      if (url === "/render") {
        res.writeHead(200, { "content-type": "text/html" });
        return res.end(PAGE);
      }
      const file = path.join(ROOT, decodeURIComponent(url));
      if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
      createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }));
  });
}

const blur = `tmix=frames=${SUB},framestep=${SUB},format=yuv420p`;
const ffmpeg = spawn(process.env.FFMPEG || "ffmpeg", [
  "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS * SUB), "-c:v", "mjpeg", "-i", "-",
  "-vf", blur, "-r", String(FPS), "-an", "-c:v", "libvpx-vp9", "-crf", "34", "-b:v", "0", "-deadline", "good", "-cpu-used", "2", "-row-mt", "1",
  path.join(OUT, "reveal.webm"),
  "-vf", blur, "-r", String(FPS), "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-tune", "film", "-movflags", "+faststart",
  path.join(OUT, "reveal.mp4"),
], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((resolve, reject) => ffmpeg.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)))));
done.catch(() => {}); // reported by the await at the end, not as an unhandled rejection
const write = (buf) => new Promise((resolve) => (ffmpeg.stdin.write(buf) ? resolve() : ffmpeg.stdin.once("drain", resolve)));

const { server, base } = await serve();
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.goto(`${base}/render`);
await page.evaluate(() => window.ready);

const step = 1000 / (FPS * SUB);
let flare = null;
let end = null;
let celebrated = false;
let stops = [];
const t0 = Date.now();
for (let k = 0; end === null || k * step < end * 1000; k++) {
  if (k * step > 20000) throw new Error(`the reels never stopped (stops: ${stops})`);
  const t = (k * step) / 1000;
  // Braces matter: spin() and zoomThrough() return promises that settle only
  // after more frames, and evaluate() would wait for them before drawing one.
  if (k === 0) await page.evaluate(() => { window.pull(); });
  if (stops.length < 3) stops = await page.evaluate(() => window.stops.map((ms) => ms / 1000));
  if (stops.length === 3 && flare === null) {
    // Lights and tokens right after the last reel, the flare half a second later.
    flare = stops[2] + 0.55;
    end = flare + 1.6;
  }
  if (flare !== null && !celebrated && t >= stops[2] + 0.12) {
    celebrated = true;
    await page.evaluate(() => window.stage.celebrate(2, 90));
  }
  if (flare !== null && t >= flare && t - step / 1000 < flare) await page.evaluate(() => { window.stage.zoomThrough(); });
  await page.evaluate(([ms, s]) => window.frameAt(ms, s), [k * step, flare === null ? -1 : t - flare]);
  await write(await page.screenshot({ type: "jpeg", quality: 92 }));
  if (k % 30 === 0) console.log(`t=${t.toFixed(2)}s  frames=${k + 1}  ${((Date.now() - t0) / 1000).toFixed(0)}s elapsed`);
}
ffmpeg.stdin.end();
await done;
await browser.close();
server.close();

const round = (x) => Math.round(x * 1000) / 1000;
writeFileSync(path.join(OUT, "reveal-timing.js"), `// Written by money-machine/render-reveal.js with reveal.webm and reveal.mp4. Seconds into the video.
export default ${JSON.stringify({ stops: stops.map(round), flare: round(flare), duration: round(end) })};
`);
const size = (f) => statSync(path.join(OUT, f)).size;
console.log(`wrote reveal.webm (${size("reveal.webm")} bytes), reveal.mp4 (${size("reveal.mp4")} bytes) and reveal-timing.js`, { stops, flare, end });
