// The 3D machine: loads money-machine.glb, paints words onto the reels and
// runs the spin choreography (lever pull, staggered reel stops, lights,
// coin burst, camera push). It knows nothing about ideas; app.js tells it
// which words to land on. If WebGL or the CDN is unavailable, createStage
// throws and the page falls back to its 2D reels.
//
// Dragging tilts the machine like a toy on a turntable and it springs back
// when let go (a hand-rolled version of drei's PresentationControls), so the
// camera never leaves home and the pre-rendered reveal video can take over
// from the exact same shot.

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const SLOTS = 12; // words painted around each reel
const TAU = Math.PI * 2;
const CYAN = "#00ffff";
const GREEN = "#39ff14";
const FONT = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
const HOME = { pos: new THREE.Vector3(0, 1.45, 4.35), look: new THREE.Vector3(0, 1.22, 0) };
const CLOSE = { pos: new THREE.Vector3(0, 1.56, 2.95), look: new THREE.Vector3(0, 1.48, 0) };
const PIVOT_Y = 1.15; // the machine tilts around its middle, not its feet
const BLUR_SPEED = 9; // rad/s: faster than this, a reel shows its motion-blurred face

const easeOutCubic = (x) => 1 - (1 - x) ** 3;
const easeInOut = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

// Soft chromatic aberration and a vignette, strongest at the edges of the frame.
const Fringe = {
  uniforms: { tDiffuse: { value: null }, amount: { value: 0.006 }, vignette: { value: 0.5 } },
  vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform float vignette;
    varying vec2 vUv;
    void main() {
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);
      vec2 off = d * r2 * amount * 4.0;
      vec4 c = texture2D(tDiffuse, vUv);
      c.r = texture2D(tDiffuse, vUv + off).r;
      c.b = texture2D(tDiffuse, vUv - off).b;
      c.rgb *= 1.0 - vignette * smoothstep(0.08, 0.5, r2);
      gl_FragColor = c;
    }`,
};

function fitText(ctx, text, maxWidth, size) {
  let s = size;
  do ctx.font = `800 ${s}px ${FONT}`; while (ctx.measureText(text).width > maxWidth && --s > 8);
  return s;
}

// A reel is a cylinder whose texture u runs around the drum and v along the
// axle, so each word is drawn rotated 90° in its own band of the canvas.
// A second canvas holds the same strip smeared along u: the drum wears it
// while it spins fast, which reads as motion blur at no per-frame cost.
class ReelFace {
  constructor(renderer) {
    const canvas = () => Object.assign(document.createElement("canvas"), { width: 1536, height: 320 });
    const texture = (c) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    };
    this.canvas = canvas();
    this.blurred = canvas();
    this.ctx = this.canvas.getContext("2d");
    this.words = Array(SLOTS).fill("");
    this.texture = texture(this.canvas);
    this.blurTexture = texture(this.blurred);
  }
  paint() {
    const { ctx, canvas } = this;
    const { width: w, height: h } = canvas;
    const band = w / SLOTS;
    ctx.fillStyle = "#020404";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < SLOTS; i++) {
      ctx.fillStyle = "#0b2626";
      ctx.fillRect(i * band, 0, 2, h);
      const word = this.words[i];
      if (!word) continue;
      // Single symbols ("$") fill the slot like a classic reel icon.
      const symbol = word.length <= 2;
      const color = symbol ? GREEN : CYAN;
      ctx.save();
      ctx.translate((i + 0.5) * band, h / 2);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      fitText(ctx, word, h - 36, symbol ? 118 : 60);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.fillText(word, 0, 0);
      ctx.restore();
    }
    this.texture.needsUpdate = true;

    // Average shifted copies (wrapping round the seam) into the blurred strip.
    const b = this.blurred.getContext("2d");
    const taps = 12;
    const span = 150;
    b.globalCompositeOperation = "source-over";
    b.globalAlpha = 1;
    b.fillStyle = "#000";
    b.fillRect(0, 0, w, h);
    b.globalCompositeOperation = "lighter";
    b.globalAlpha = 1 / taps;
    for (let i = 0; i < taps; i++) {
      const dx = (i / (taps - 1) - 0.5) * span;
      b.drawImage(canvas, dx, 0);
      b.drawImage(canvas, dx - Math.sign(dx || 1) * w, 0);
    }
    b.globalCompositeOperation = "source-over";
    b.globalAlpha = 1;
    this.blurTexture.needsUpdate = true;
  }
}

// lines: [text, share of the sign's height, colour]
function signTexture(renderer, lines, { width = 1024, height = 256, bg = "#010202" } = {}) {
  const canvas = Object.assign(document.createElement("canvas"), { width, height });
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const rows = lines.length;
  lines.forEach(([text, weight, color], i) => {
    const y = (height / (rows + 1)) * (i + 1);
    fitText(ctx, text, width * 0.9, Math.floor((height / rows) * weight));
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 24;
    ctx.fillText(text, width / 2, y);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// `glb` is the model's URL, or its bytes (or a promise of them) for embeds
// that can't serve a .glb file. `video` is the aspect and field of view the
// reveal video was rendered at: the camera widens on narrower screens so the
// machine sits exactly where the video, shown with object-fit: contain, has it.
// `manual` hands the clock to the caller (render-reveal.js renders the video
// frame by frame through renderAt) instead of running on the display.
export async function createStage(container, {
  glb, reduceMotion = false, onPull = () => {}, pixelRatio = Math.min(devicePixelRatio, 1.75), video = { aspect: 1, fov: 32 }, manual = false,
}) {
  let clock = 0;
  const now = () => (manual ? clock : performance.now());
  // Reels and signs are drawn in JetBrains Mono. Don't wait forever for it:
  // paint with the fallback now and repaint if it turns up later.
  const font = document.fonts?.load(`800 64px ${FONT}`).catch(() => {}) ?? Promise.resolve();

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  const canvas = renderer.domElement;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "3D slot machine. Drag to tilt it, tap the lever or use the Spin button.");
  // Let the page scroll vertically over the canvas; sideways drags tilt the machine.
  canvas.style.touchAction = "pan-y";
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 7, 14);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  // Enough reflection for chrome to read as chrome; any more and it washes
  // out the neon.
  scene.environmentIntensity = 0.12;

  const camera = new THREE.PerspectiveCamera(video.fov, 1, 0.1, 50);
  camera.position.copy(HOME.pos);
  const look = HOME.look.clone();
  camera.lookAt(look);

  scene.add(new THREE.HemisphereLight(0xd9ffff, 0x020404, 0.3));
  const key = new THREE.SpotLight(0xf2ffff, 34, 12, 0.5, 0.6, 1.6);
  key.position.set(-1.8, 4.2, 4.2);
  key.target.position.set(0, 1.2, 0);
  scene.add(key, key.target);
  const rimL = new THREE.PointLight(0x00ffff, 4, 6);
  rimL.position.set(-2.2, 2.2, -1.2);
  const rimR = new THREE.PointLight(0x39ff14, 3, 6);
  rimR.position.set(2.3, 1.6, -0.8);
  const glow = new THREE.PointLight(0x00ffff, 1.2, 2.2);
  glow.position.set(0, 2.05, 0.9);
  scene.add(rimL, rimR, glow);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(30, 64),
    new THREE.MeshStandardMaterial({ color: 0x020303, roughness: 0.9, metalness: 0 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const [source] = await Promise.all([glb, Promise.race([font, new Promise((r) => setTimeout(r, 2500))])]);
  const loader = new GLTFLoader();
  const gltf = typeof source === "string" ? await loader.loadAsync(source) : await loader.parseAsync(source, "");
  const machine = gltf.scene;
  const pivot = new THREE.Group();
  pivot.position.y = PIVOT_Y;
  machine.position.y = -PIVOT_Y;
  pivot.add(machine);
  scene.add(pivot);
  const part = (name) => machine.getObjectByName(name);
  // The glass catches the key light square-on and hides the reels behind a
  // white glare, so it stays in the model but not in this shot.
  part("Glass").visible = false;

  // Each reel gets its own canvas texture; the GLB ships one shared material.
  const reels = [1, 2, 3].map((i) => {
    const drum = part(`ReelDrum_${i}`);
    const face = new ReelFace(renderer);
    drum.material = drum.material.clone();
    drum.material.map = face.texture;
    drum.material.emissive = new THREE.Color(0xffffff);
    drum.material.emissiveMap = face.texture;
    drum.material.emissiveIntensity = 1.35;
    return { pivot: part(`Reel_${i}`), drum, face, angle: 0, speed: 0, state: "idle", blurred: false };
  });

  const signs = {};
  for (const name of ["MarqueeSign", "LowerSign", "WindowSign"]) {
    const mesh = part(name);
    mesh.material = mesh.material.clone();
    signs[name] = mesh;
  }
  const setSign = (name, lines, opts) => {
    const mat = signs[name].material;
    mat.map?.dispose();
    const tex = signTexture(renderer, lines, opts);
    mat.map = tex;
    mat.emissiveMap = tex;
    // The sign's own colour stays near-black: lit as well as glowing, the
    // lettering washes out.
    mat.needsUpdate = true;
  };
  const paintSigns = () => {
    setSign("MarqueeSign", [["MONEY MACHINE", 0.6, CYAN], ["DIGITAL RENAISSANCE", 0.2, GREEN]]);
    setSign("LowerSign", [["$ CA$H $", 0.72, GREEN]], { width: 1024, height: 384 });
    setSign("WindowSign", [["SPIN → DISCOVER → MUTATE → BUILD → CASH", 0.8, CYAN]], { width: 2048, height: 200 });
  };
  paintSigns();
  font.then(() => {
    paintSigns();
    reels.forEach((r) => r.face.paint());
  });

  const bulbs = [];
  machine.traverse((o) => {
    if (o.isMesh && o.name.startsWith("Bulb_")) {
      o.material = o.material.clone();
      bulbs.push(o);
    }
  });
  bulbs.sort((a, b) => a.name.localeCompare(b.name));
  bulbs.forEach((b, i) => b.material.emissive.set(i % 2 ? GREEN : CYAN));
  const leds = [1, 2, 3, 4, 5].map((i) => {
    const m = part(`LedBar_${i}`);
    m.material = m.material.clone();
    return m;
  });
  const beacon = part("Beacon");
  beacon.material = beacon.material.clone();
  const lever = part("Lever");
  const pullTargets = ["Lever", "LeverRod", "LeverBall", "LeverCollar", "SpinButton", "LeverHub"];

  // Token burst from the tray on a big win.
  const coinGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.008, 20).rotateX(Math.PI / 2);
  const coinMat = new THREE.MeshStandardMaterial({ color: 0x39ff14, metalness: 0.5, roughness: 0.3, emissive: 0x0f5c05 });
  const MAX_COINS = 90;
  const coins = new THREE.InstancedMesh(coinGeo, coinMat, MAX_COINS);
  coins.count = 0;
  coins.frustumCulled = false;
  scene.add(coins);
  let coinState = [];
  const dummy = new THREE.Object3D();

  // 4x MSAA on the scene target: the canvas's own antialiasing doesn't reach
  // through the post-processing chain.
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  // Threshold above 1 so only emissive parts (neon, bulbs, signs, reel text) glow.
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.35, 1.0));
  composer.addPass(new ShaderPass(Fringe));
  composer.addPass(new OutputPass());

  let width = 0, height = 0;
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h || (w === width && h === height)) return;
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    const half = Math.tan(THREE.MathUtils.degToRad(video.fov / 2)) * Math.max(1, video.aspect / camera.aspect);
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(half));
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // Click the lever, the spin button or the reels to pull; drag to tilt.
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function hitPull(event) {
    const r = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - r.left) / r.width) * 2 - 1, -((event.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    return ray.intersectObject(machine, true).some(({ object }) => {
      for (let o = object; o; o = o.parent) if (pullTargets.includes(o.name) || o.name.startsWith("Reel_")) return true;
      return false;
    });
  }
  const tilt = { yaw: 0, pitch: 0, vYaw: 0, vPitch: 0, toYaw: 0, toPitch: 0, drag: null, on: true };
  let downAt = null;
  canvas.addEventListener("pointerdown", (e) => {
    downAt = [e.clientX, e.clientY];
    if (!tilt.on) return;
    tilt.drag = { x: e.clientX, y: e.clientY, yaw: tilt.toYaw, pitch: tilt.toPitch };
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (tilt.drag) {
      tilt.toYaw = clamp(tilt.drag.yaw + (e.clientX - tilt.drag.x) * 0.006, -0.65, 0.65);
      tilt.toPitch = clamp(tilt.drag.pitch + (e.clientY - tilt.drag.y) * 0.003, -0.12, 0.22);
      canvas.style.cursor = "grabbing";
      return;
    }
    canvas.style.cursor = hitPull(e) ? "pointer" : "grab";
  });
  const release = (e) => {
    // A drag inspects the machine; only a click pulls the lever.
    if (e.type === "pointerup" && downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 6 && hitPull(e)) onPull();
    downAt = null;
    tilt.drag = null;
    tilt.toYaw = 0;
    tilt.toPitch = 0;
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  // ------------------------------------------------------------- animation
  let last = now();
  let mode = "idle"; // idle | spinning
  let winUntil = 0;
  let winLevel = 0;
  let camTween = null;
  let leverTween = null;
  let visible = true;
  let held = false;
  let ledLevel = 0;
  let coinsUntil = 0;

  function tweenCamera(to, ms) {
    return new Promise((resolve) => {
      if (reduceMotion || ms === 0) {
        camera.position.copy(to.pos);
        look.copy(to.look);
        camera.lookAt(look);
        resolve();
        return;
      }
      camTween = { from: { pos: camera.position.clone(), look: look.clone() }, to, t0: now(), ms, resolve };
    });
  }

  function frame() {
    const ms = now();
    const dt = Math.min((ms - last) / 1000, 0.05);
    last = ms;
    const t = ms / 1000;

    for (const reel of reels) {
      const before = reel.angle;
      if (reel.state === "spinning") {
        reel.angle += reel.speed * dt;
        if (ms >= reel.stopAt) reel.brake();
      } else if (reel.state === "stopping") {
        const x = Math.min(1, (ms - reel.t0) / reel.ms);
        // Cubic Hermite from the cruising speed (slope m0) to a standstill.
        reel.angle = reel.from + reel.dist * (reel.m0 * (x ** 3 - 2 * x ** 2 + x) + 3 * x ** 2 - 2 * x ** 3);
        if (x >= 1) {
          reel.state = "bounce";
          reel.t0 = ms;
          reel.rest = reel.from + reel.dist;
          reel.done();
        }
      } else if (reel.state === "bounce") {
        const x = (ms - reel.t0) / 320;
        reel.angle = reel.rest + 0.07 * Math.sin(x * Math.PI * 2) * Math.exp(-4 * x);
        if (x >= 1) {
          reel.angle = reel.rest;
          reel.state = "idle";
        }
      }
      reel.pivot.rotation.x = reel.angle;
      const blur = dt > 0 && Math.abs(reel.angle - before) / dt > BLUR_SPEED;
      if (blur !== reel.blurred) {
        reel.blurred = blur;
        reel.drum.material.map = reel.drum.material.emissiveMap = blur ? reel.face.blurTexture : reel.face.texture;
      }
    }

    if (leverTween) {
      // Yank down, hold a beat, spring back.
      const x = Math.min(1, (ms - leverTween.t0) / 800);
      const pull = x < 0.3 ? easeOutCubic(x / 0.3) : x < 0.45 ? 1 : 1 - easeOutCubic((x - 0.45) / 0.55);
      lever.rotation.x = 1.15 * pull;
      if (x >= 1) {
        lever.rotation.x = 0;
        leverTween = null;
      }
    }

    if (camTween) {
      const x = Math.min(1, (ms - camTween.t0) / camTween.ms);
      const k = easeInOut(x);
      camera.position.lerpVectors(camTween.from.pos, camTween.to.pos, k);
      look.lerpVectors(camTween.from.look, camTween.to.look, k);
      if (x >= 1) {
        const { resolve } = camTween;
        camTween = null;
        resolve();
      }
    }
    camera.lookAt(look);

    // A damped spring: stiff while held, loose (a little overshoot) when let go.
    // At rest a slow sway shows it's a real object.
    const sway = mode === "idle" && tilt.on && !tilt.drag && !camTween && !reduceMotion ? 0.1 * Math.sin(t * 0.45) : 0;
    const [stiff, damp] = tilt.drag ? [220, 28] : [60, 9];
    tilt.vYaw += ((tilt.toYaw + sway - tilt.yaw) * stiff - tilt.vYaw * damp) * dt;
    tilt.vPitch += ((tilt.toPitch - tilt.pitch) * stiff - tilt.vPitch * damp) * dt;
    tilt.yaw += tilt.vYaw * dt;
    tilt.pitch += tilt.vPitch * dt;
    pivot.rotation.set(tilt.pitch, tilt.yaw, 0);

    // Lights: a slow chase at idle, a fast one while spinning, all flashing on a win.
    const winning = ms < winUntil;
    bulbs.forEach((b, i) => {
      let on;
      if (winning) on = winLevel >= 3 ? Math.floor(t * 8) % 2 === 0 : (i + Math.floor(t * 20)) % 2 === 0;
      else if (mode === "spinning") on = (i + Math.floor(t * 18)) % 3 === 0;
      else on = (i + Math.floor(t * 4)) % 4 !== 0;
      b.material.emissiveIntensity = on ? 1.6 : 0.08;
    });
    beacon.material.emissiveIntensity = winning ? (Math.sin(t * 22) > 0 ? 4 : 0.2) : mode === "spinning" ? 1.2 + Math.sin(t * 10) : 0.5 + 0.25 * Math.sin(t * 2);
    leds.forEach((m, i) => {
      const level = mode === "spinning" ? Math.floor((Math.sin(t * 13 + i) + 1) * 3) : ledLevel;
      m.material.emissiveIntensity = i < level ? 2.2 : 0.08;
    });

    if (coins.count) {
      let alive = 0;
      coinState.forEach((c) => {
        c.vy -= 5.2 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.z += c.vz * dt;
        c.spin += c.vs * dt;
        if (c.y < 0.02) {
          c.y = 0.02;
          c.vy *= -0.35;
          c.vx *= 0.7;
          c.vz *= 0.7;
        }
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(c.spin, c.spin * 0.6, 0);
        dummy.updateMatrix();
        coins.setMatrixAt(alive++, dummy.matrix);
      });
      coins.instanceMatrix.needsUpdate = true;
      if (ms > coinsUntil) coins.count = 0;
    }

    // Off screen or under the reveal video, keep animating (a spin must still
    // finish) but skip the GPU work.
    if (visible && !held) composer.render();
  }

  if (!manual) renderer.setAnimationLoop(frame);
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  io.observe(container);

  function paintIdle(words) {
    reels.forEach((reel, i) => {
      const pool = words[i];
      for (let s = 0; s < SLOTS; s++) reel.face.words[s] = pool[s % pool.length];
      reel.face.paint();
      reel.angle = (0.5 / SLOTS) * TAU; // slot 0 facing out
    });
  }

  return {
    paintIdle,

    // Spin all reels and land them on `targets` (one word per reel).
    // Resolves after the last reel stops; onReelStop(i) fires per reel.
    // `quick` is the short re-spin after MUTATE and friends: no camera move.
    async spin({ targets, pools, onReelStop = () => {}, quick = false }) {
      mode = "spinning";
      tilt.on = false;
      tilt.drag = null;
      tilt.toYaw = 0;
      tilt.toPitch = 0;
      if (!reduceMotion) leverTween = { t0: now() };
      if (!quick && !reduceMotion) tweenCamera(CLOSE, 2400);
      const stops = reels.map((reel, i) => new Promise((resolve) => {
        // Keep the words currently on show, repaint the rest of the drum
        // and put the target on the far side so it arrives from above.
        const front = Math.floor(((reel.angle % TAU) + TAU) % TAU / TAU * SLOTS);
        const far = (front + SLOTS / 2) % SLOTS;
        for (let s = 0; s < SLOTS; s++) {
          const offset = (s - front + SLOTS) % SLOTS;
          if (offset <= 2 || offset >= SLOTS - 2) continue;
          reel.face.words[s] = pools[i][Math.floor(Math.random() * pools[i].length)];
        }
        reel.face.words[far] = targets[i];
        reel.face.paint();
        const land = ((far + 0.5) / SLOTS) * TAU;
        const settle = () => {
          onReelStop(i);
          resolve();
        };
        if (reduceMotion) {
          reel.angle = land + Math.ceil(reel.angle / TAU) * TAU;
          reel.state = "idle";
          settle();
          return;
        }
        reel.state = "spinning";
        reel.speed = 18;
        // The last reel hangs on a beat longer: the near-miss moment.
        reel.stopAt = now() + (quick ? 120 + i * 110 : 950 + i * 520 + (i === 2 ? 380 : 0));
        // Every reel brakes for the same time, so the stops stay 0.52s apart
        // (a braking time that grew with the distance to the target let two
        // reels land together). Enough whole turns are added that braking
        // starts at the cruising speed without a jump or an overshoot.
        reel.brake = () => {
          const ms = quick ? 520 + i * 90 : 1300;
          let dist = ((land - (reel.angle % TAU)) % TAU + TAU) % TAU;
          while (dist < (reel.speed * ms) / 3000) dist += TAU;
          const m0 = (reel.speed * ms) / 1000 / dist;
          Object.assign(reel, { state: "stopping", from: reel.angle, dist, m0, t0: now(), ms, done: settle });
        };
      }));
      await Promise.all(stops);
      mode = "idle";
      // Full spins hand the machine back after the reveal (see home()).
      if (quick || reduceMotion) tilt.on = true;
    },

    // Lights and coins scaled to how good the idea is (0..3).
    celebrate(level, score) {
      ledLevel = Math.round((score / 100) * 5);
      if (!level || reduceMotion) return;
      winLevel = level;
      winUntil = now() + 1200 + level * 600;
      const n = [0, 0, 28, 90][level] || 12;
      coinState = Array.from({ length: n }, () => ({
        x: (Math.random() - 0.5) * 0.4, y: 0.32, z: 0.6,
        // Fountain up past the reel window so the close-up camera sees them.
        vx: (Math.random() - 0.5) * 1.6, vy: 3 + Math.random() * 2.2, vz: 0.8 + Math.random() * 1.4,
        spin: Math.random() * TAU, vs: (Math.random() - 0.5) * 20,
      }));
      coins.count = n;
      coinsUntil = now() + 2600;
    },

    // The punch through the payline before the reveal.
    zoomThrough() {
      return tweenCamera({ pos: new THREE.Vector3(0, 1.52, 1.05), look: new THREE.Vector3(0, 1.52, 0) }, reduceMotion ? 0 : 520);
    },

    home(ms = 0) {
      tilt.on = true;
      return tweenCamera(HOME, ms);
    },

    // While the reveal video covers the canvas: square the machine up to the
    // video's first frame, draw that once, then stop drawing until released.
    hold(on) {
      if (on) {
        Object.assign(tilt, { yaw: 0, pitch: 0, vYaw: 0, vPitch: 0, toYaw: 0, toPitch: 0, drag: null });
        pivot.rotation.set(0, 0, 0);
        if (visible) composer.render();
      }
      held = on;
    },

    // Manual clock only: advance to `ms` and draw that frame.
    renderAt(ms) {
      clock = ms;
      frame();
    },

    dispose() {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      io.disconnect();
      composer.dispose();
      renderer.dispose();
      pmrem.dispose();
    },
  };
}
