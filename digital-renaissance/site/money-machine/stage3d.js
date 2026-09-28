// The 3D machine: loads money-machine.glb, paints words onto the reels and
// runs the spin choreography (lever pull, staggered reel stops, lights,
// coin burst, camera push). It knows nothing about ideas; app.js tells it
// which words to land on. If WebGL or the CDN is unavailable, createStage
// throws and the page falls back to its 2D reels.

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const SLOTS = 12; // words painted around each reel
const TAU = Math.PI * 2;
const AMBER = "#ffb52e";
const HOME = { pos: new THREE.Vector3(0, 1.45, 4.35), look: new THREE.Vector3(0, 1.22, 0) };
const CLOSE = { pos: new THREE.Vector3(0, 1.56, 2.95), look: new THREE.Vector3(0, 1.48, 0) };

const easeOutCubic = (x) => 1 - (1 - x) ** 3;
const easeInOut = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);

function fitText(ctx, text, maxWidth, size, font) {
  let s = size;
  do ctx.font = `700 ${s}px ${font}`; while (ctx.measureText(text).width > maxWidth && --s > 8);
  return s;
}

// A reel is a cylinder whose texture u runs around the drum and v along the
// axle, so each word is drawn rotated 90° in its own band of the canvas.
class ReelFace {
  constructor(renderer) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1536;
    this.canvas.height = 320;
    this.ctx = this.canvas.getContext("2d");
    this.words = Array(SLOTS).fill("");
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  paint() {
    const { ctx, canvas } = this;
    const band = canvas.width / SLOTS;
    ctx.fillStyle = "#0b0a09";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < SLOTS; i++) {
      ctx.fillStyle = "#1c1915";
      ctx.fillRect(i * band, 0, 2, canvas.height);
      const word = this.words[i];
      if (!word) continue;
      ctx.save();
      ctx.translate((i + 0.5) * band, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      fitText(ctx, word, canvas.height - 36, 62, "ui-monospace, Menlo, Consolas, monospace");
      ctx.fillStyle = AMBER;
      ctx.shadowColor = AMBER;
      ctx.shadowBlur = 18;
      ctx.fillText(word, 0, 0);
      ctx.restore();
    }
    this.texture.needsUpdate = true;
  }
}

function signTexture(renderer, lines, { width = 1024, height = 256, color = AMBER, bg = "#070605" } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const rows = lines.length;
  lines.forEach(([text, weight, family], i) => {
    const y = (height / (rows + 1)) * (i + 1);
    const size = fitText(ctx, text, width * 0.9, Math.floor((height / rows) * weight), family);
    ctx.font = `700 ${size}px ${family}`;
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
// that can't serve a .glb file.
export async function createStage(container, { glb, reduceMotion = false, onPull = () => {} }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-label", "3D slot machine. Tap the lever or use the Spin button.");
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  scene.fog = new THREE.Fog(0x050505, 7, 14);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  // Just enough reflection to make brass and chrome read as metal; any more
  // and the whole cabinet washes out.
  scene.environmentIntensity = 0.16;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.copy(HOME.pos);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(HOME.look);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minAzimuthAngle = -0.7;
  controls.maxAzimuthAngle = 0.7;
  controls.minPolarAngle = 1.1;
  controls.maxPolarAngle = 1.75;
  // Let the page scroll vertically over the canvas; sideways drags still orbit.
  renderer.domElement.style.touchAction = "pan-y";

  scene.add(new THREE.HemisphereLight(0xffe2b0, 0x080604, 0.35));
  const key = new THREE.SpotLight(0xffd9a0, 60, 12, 0.5, 0.6, 1.6);
  key.position.set(-1.8, 4.2, 4.2);
  key.target.position.set(0, 1.2, 0);
  scene.add(key, key.target);
  const rimL = new THREE.PointLight(0xffa21a, 9, 6);
  rimL.position.set(-2.2, 2.2, -1.2);
  const rimR = new THREE.PointLight(0xff2a3a, 7, 6);
  rimR.position.set(2.3, 1.6, -0.8);
  const glow = new THREE.PointLight(0xffb52e, 2.5, 2.2);
  glow.position.set(0, 2.05, 0.9);
  scene.add(rimL, rimR, glow);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(30, 64),
    new THREE.MeshStandardMaterial({ color: 0x0a0806, roughness: 0.92, metalness: 0 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const source = await glb;
  const loader = new GLTFLoader();
  const gltf = typeof source === "string" ? await loader.loadAsync(source) : await loader.parseAsync(source, "");
  const machine = gltf.scene;
  scene.add(machine);
  const part = (name) => machine.getObjectByName(name);
  // The glass catches the key light square-on and hides the reels behind a
  // white glare, so it stays in the model but not in this shot.
  part("Glass").visible = false;

  // Each reel gets its own canvas texture; the GLB ships one shared material.
  const reels = [1, 2, 3].map((i) => {
    const pivot = part(`Reel_${i}`);
    const drum = part(`ReelDrum_${i}`);
    const face = new ReelFace(renderer);
    drum.material = drum.material.clone();
    drum.material.map = face.texture;
    drum.material.emissive = new THREE.Color(0xffffff);
    drum.material.emissiveMap = face.texture;
    drum.material.emissiveIntensity = 1.35;
    return { pivot, face, angle: 0, speed: 0, state: "idle" };
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
    mat.color.set(0xffffff);
    mat.needsUpdate = true;
  };
  setSign("MarqueeSign", [["MONEY MACHINE", 0.62, "Georgia, 'Times New Roman', serif"], ["DIGITAL RENAISSANCE", 0.22, "ui-monospace, Menlo, monospace"]]);
  setSign("LowerSign", [["$ CA$H $", 0.72, "Georgia, 'Times New Roman', serif"]], { color: "#ff3b3b", width: 1024, height: 384 });
  setSign("WindowSign", [["SPIN → DISCOVER → MUTATE → BUILD → CASH", 0.8, "ui-monospace, Menlo, monospace"]], { width: 2048, height: 200 });

  const bulbs = [];
  machine.traverse((o) => {
    if (o.isMesh && o.name.startsWith("Bulb_")) {
      o.material = o.material.clone();
      bulbs.push(o);
    }
  });
  bulbs.sort((a, b) => a.name.localeCompare(b.name));
  const leds = [1, 2, 3, 4, 5].map((i) => {
    const m = part(`LedBar_${i}`);
    m.material = m.material.clone();
    return m;
  });
  const beacon = part("Beacon");
  beacon.material = beacon.material.clone();
  const lever = part("Lever");
  const pullTargets = ["Lever", "LeverRod", "LeverBall", "LeverCollar", "SpinButton", "LeverHub"];

  // Coin burst from the tray on a big win.
  const coinGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.008, 20).rotateX(Math.PI / 2);
  const coinMat = new THREE.MeshStandardMaterial({ color: 0xf2c14e, metalness: 1, roughness: 0.25, emissive: 0x3a2400 });
  const MAX_COINS = 90;
  const coins = new THREE.InstancedMesh(coinGeo, coinMat, MAX_COINS);
  coins.count = 0;
  coins.frustumCulled = false;
  scene.add(coins);
  let coinState = [];
  const dummy = new THREE.Object3D();

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // Threshold above 1 so only emissive parts (bulbs, signs, reel text) glow.
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.35, 1.0);
  composer.addPass(bloom);
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
    // Narrow screens need a little more field of view to keep the lever in frame.
    camera.fov = w / h < 0.9 ? 36 : 32;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // Click the lever, the spin button or the reels to pull.
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function hitPull(event) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - r.left) / r.width) * 2 - 1, -((event.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    return ray.intersectObject(machine, true).some(({ object }) => {
      for (let o = object; o; o = o.parent) if (pullTargets.includes(o.name) || o.name.startsWith("Reel_")) return true;
      return false;
    });
  }
  let downAt = null;
  renderer.domElement.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", (e) => {
    // A drag inspects the machine; only a click pulls the lever.
    if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 6 && hitPull(e)) onPull();
    downAt = null;
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    renderer.domElement.style.cursor = hitPull(e) ? "pointer" : "grab";
  });

  // ------------------------------------------------------------- animation
  let last = performance.now();
  let mode = "idle"; // idle | spinning
  let winUntil = 0;
  let winLevel = 0;
  let camTween = null;
  let leverTween = null;
  let visible = true;

  function tweenCamera(to, ms) {
    return new Promise((resolve) => {
      if (reduceMotion || ms === 0) {
        camera.position.copy(to.pos);
        controls.target.copy(to.look);
        resolve();
        return;
      }
      camTween = { from: { pos: camera.position.clone(), look: controls.target.clone() }, to, t0: performance.now(), ms, resolve };
    });
  }

  function frame() {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t = now / 1000;

    for (const reel of reels) {
      if (reel.state === "spinning") reel.angle += reel.speed * dt;
      else if (reel.state === "stopping") {
        const x = Math.min(1, (now - reel.t0) / reel.ms);
        reel.angle = reel.from + reel.dist * easeOutCubic(x);
        if (x >= 1) {
          reel.state = "bounce";
          reel.t0 = now;
          reel.rest = reel.from + reel.dist;
          reel.done();
        }
      } else if (reel.state === "bounce") {
        const x = (now - reel.t0) / 320;
        reel.angle = reel.rest + 0.07 * Math.sin(x * Math.PI * 2) * Math.exp(-4 * x);
        if (x >= 1) {
          reel.angle = reel.rest;
          reel.state = "idle";
        }
      }
      reel.pivot.rotation.x = reel.angle;
    }

    if (leverTween) {
      // Yank down, hold a beat, spring back.
      const x = Math.min(1, (now - leverTween.t0) / 800);
      const pull = x < 0.3 ? easeOutCubic(x / 0.3) : x < 0.45 ? 1 : 1 - easeOutCubic((x - 0.45) / 0.55);
      lever.rotation.x = 1.15 * pull;
      if (x >= 1) {
        lever.rotation.x = 0;
        leverTween = null;
      }
    }

    if (camTween) {
      const x = Math.min(1, (now - camTween.t0) / camTween.ms);
      const k = easeInOut(x);
      camera.position.lerpVectors(camTween.from.pos, camTween.to.pos, k);
      controls.target.lerpVectors(camTween.from.look, camTween.to.look, k);
      if (x >= 1) {
        const { resolve } = camTween;
        camTween = null;
        resolve();
      }
    }

    // Lights: a slow chase at idle, a fast one while spinning, all flashing on a win.
    const winning = now < winUntil;
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
      if (now > coinsUntil) coins.count = 0;
    }

    // A slow sway at rest shows it's a real object; it settles while spinning.
    const sway = mode === "idle" && !camTween && !reduceMotion ? 0.14 * Math.sin(t * 0.45) : 0;
    machine.rotation.y += (sway - machine.rotation.y) * Math.min(1, dt * 3);
    if (mode === "idle" && !camTween) controls.update();
    // Off screen, keep animating (a spin must still finish) but skip the GPU work.
    if (visible) composer.render();
  }
  let ledLevel = 0;
  let coinsUntil = 0;

  renderer.setAnimationLoop(frame);
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
      controls.enabled = false;
      if (!reduceMotion) leverTween = { t0: performance.now() };
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
        const stopAt = quick ? 120 + i * 110 : 950 + i * 520 + (i === 2 ? 380 : 0);
        setTimeout(() => {
          const base = reel.angle + TAU;
          const dist = base - reel.angle + ((land - (base % TAU)) % TAU + TAU) % TAU;
          // Full spins decelerate from their cruising speed (easeOutCubic
          // starts at 3x average speed); quick ones just snap round.
          const ms = quick ? 520 + i * 90 : ((3 * dist) / reel.speed) * 1000;
          Object.assign(reel, { state: "stopping", from: reel.angle, dist, t0: performance.now(), ms, done: settle });
        }, stopAt);
      }));
      await Promise.all(stops);
      mode = "idle";
      // Full spins hand the camera back after the reveal (see home()).
      if (quick || reduceMotion) controls.enabled = true;
    },

    // Lights and coins scaled to how good the idea is (0..3).
    celebrate(level, score) {
      ledLevel = Math.round((score / 100) * 5);
      if (!level || reduceMotion) return;
      winLevel = level;
      winUntil = performance.now() + 1200 + level * 600;
      const n = [0, 0, 28, 90][level] || 12;
      coinState = Array.from({ length: n }, () => ({
        x: (Math.random() - 0.5) * 0.4, y: 0.32, z: 0.6,
        // Fountain up past the reel window so the close-up camera sees them.
        vx: (Math.random() - 0.5) * 1.6, vy: 3 + Math.random() * 2.2, vz: 0.8 + Math.random() * 1.4,
        spin: Math.random() * TAU, vs: (Math.random() - 0.5) * 20,
      }));
      coins.count = n;
      coinsUntil = performance.now() + 2600;
    },

    // The video-style zoom through the payline before the reveal.
    zoomThrough() {
      return tweenCamera({ pos: new THREE.Vector3(0, 1.52, 1.05), look: new THREE.Vector3(0, 1.52, 0) }, reduceMotion ? 0 : 520);
    },

    home(ms = 0) {
      controls.enabled = true;
      return tweenCamera(HOME, ms);
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
