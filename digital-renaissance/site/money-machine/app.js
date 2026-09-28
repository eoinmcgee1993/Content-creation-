// Page controller: wires the engine (what the idea is) to the machine (how
// it's revealed) and to the vault, share links and blueprint export.
// Everything is local to the browser; there is no server.

import {
  MODES, blueprint, cheaper, decode, degenerate, describe, ideaSpace, markdown, mutate, reelPool, spin, vaultText,
} from "./engine.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const GUMROAD = "https://digitalrena1ssance.gumroad.com";
const TIER = { common: 0, rare: 1, epic: 2, jackpot: 3 };
const SPACE = ideaSpace();
const CUR = currency();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Embedded copies (a sandboxed preview, an iframe on another site) set
// window.MONEY_MACHINE_EMBED before this module runs: they can't start
// downloads, their own URL isn't the one people should share, and they may
// pass the model's bytes as `glb` where a .glb file can't be served.
const EMBED = globalThis.MONEY_MACHINE_EMBED || null;
const HOME_URL = () => EMBED?.shareBase || `${location.origin}${location.pathname}`;
// Sandboxed frames can refuse history updates; the idea still shows.
const setHash = (hash) => {
  try {
    history.replaceState(null, "", hash || location.pathname);
  } catch {}
};

// localStorage can be missing or throw (private mode, blocked storage); the
// machine still works, it just forgets.
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

let mode = MODES.some((m) => m.id === store.get("mm.mode")) ? store.get("mm.mode") : "jackpot";
let genes = null;
let lineage = [];
let steps = new Set();
let busy = false;
let stage = null;
let soundOn = store.get("mm.sound", true) !== false;
let vault = Array.isArray(store.get("mm.vault")) ? store.get("mm.vault") : [];
const stats = { spins: 0, jackpots: 0, day: "", streak: 0, ...store.get("mm.stats", {}) };

// Prices follow the visitor: € across the eurozone, £ in the UK, $ elsewhere.
function currency() {
  const tag = String((navigator.languages && navigator.languages[0]) || navigator.language || "en-US");
  const [lang, region = ""] = tag.split("-");
  const r = region.toUpperCase();
  if (r === "GB") return "£";
  const euro = ["IE", "DE", "FR", "ES", "IT", "NL", "BE", "AT", "PT", "FI", "GR", "SK", "SI", "EE", "LV", "LT", "LU", "MT", "CY", "HR"];
  if (euro.includes(r)) return "€";
  if (!region && ["de", "fr", "es", "it", "nl", "pt", "fi", "el", "sk", "sl", "et", "lv", "lt", "ga", "mt", "hr"].includes(lang.toLowerCase())) return "€";
  return "$";
}

// ------------------------------------------------------------------ sound
// Synthesised on the fly: no audio files to load.
const sfx = (() => {
  let ctx = null;
  function tone(freq, dur, { type = "square", vol = 0.03, at = 0, slide = 0 } = {}) {
    if (!soundOn) return;
    try {
      ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      const t0 = ctx.currentTime + at;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t0 + dur);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch {}
  }
  return {
    tick: () => tone(1800, 0.018, { vol: 0.012 }),
    clunk: () => { tone(110, 0.16, { type: "sine", vol: 0.14, slide: 0.55 }); tone(2600, 0.03, { vol: 0.01 }); },
    lever: () => tone(190, 0.28, { type: "sawtooth", vol: 0.035, slide: 0.35 }),
    win(level) {
      const notes = [[], [523, 659], [523, 659, 784, 1047], [523, 659, 784, 1047, 1319, 1568, 2093]][level];
      notes.forEach((f, i) => tone(f, 0.18, { type: "triangle", vol: 0.05, at: i * 0.075 }));
    },
    blip: () => tone(880, 0.05, { vol: 0.02 }),
    buzz: () => tone(68, 0.32, { type: "sawtooth", vol: 0.05, slide: 0.8 }),
    coin: () => { tone(1320, 0.06, { vol: 0.03 }); tone(1760, 0.12, { vol: 0.03, at: 0.05 }); },
  };
})();
const haptic = (pattern) => {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
};
function ticker() {
  if (REDUCED) return { stop() {} };
  let delay = 45;
  let timer;
  const loop = () => {
    sfx.tick();
    delay = Math.min(delay * 1.035, 140);
    timer = setTimeout(loop, delay);
  };
  loop();
  return { stop: () => clearTimeout(timer) };
}

// ------------------------------------------------------------------ stage

function webgl() {
  try {
    const gl = document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl");
    // Hand the probe context straight back: browsers cap live WebGL contexts.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

// Same interface as stage3d.js, drawn with DOM reels.
function flatStage(el) {
  const wrap = el.querySelector("#reels2d");
  wrap.hidden = false;
  const strips = [...wrap.querySelectorAll(".strip")];
  const set = (strip, words) => {
    strip.replaceChildren(...words.map((w) => Object.assign(document.createElement("div"), { className: "sym", textContent: w })));
  };
  return {
    paintIdle(words) {
      strips.forEach((s, i) => {
        s.style.transition = "none";
        s.style.transform = "none";
        set(s, [words[i][0]]);
      });
    },
    spin({ targets, pools, onReelStop, quick }) {
      return Promise.all(strips.map((strip, i) => new Promise((resolve) => {
        const n = quick ? 7 : 16 + i * 5;
        const filler = Array.from({ length: n }, () => pools[i][Math.floor(Math.random() * pools[i].length)]);
        set(strip, [strip.lastElementChild?.textContent || "", ...filler, targets[i]]);
        const h = strip.firstElementChild.offsetHeight;
        strip.style.transition = "none";
        strip.style.transform = "translateY(0)";
        strip.getBoundingClientRect();
        const ms = REDUCED ? 0 : (quick ? 420 : 1000) + i * (quick ? 140 : 480);
        strip.style.transition = `transform ${ms}ms cubic-bezier(.12,.7,.2,1.02)`;
        strip.style.transform = `translateY(${-(n + 1) * h}px)`;
        setTimeout(() => {
          onReelStop(i);
          resolve();
        }, ms);
      })));
    },
    celebrate() {},
    zoomThrough: async () => {},
    home: async () => {},
  };
}

async function initStage() {
  const el = $("#stage");
  try {
    if (!webgl()) throw new Error("WebGL is not available");
    const { createStage } = await import("./stage3d.js");
    stage = await createStage(el, {
      glb: EMBED?.glb || new URL("./money-machine.glb", import.meta.url).href,
      reduceMotion: REDUCED,
      onPull: () => spinNow(),
    });
    el.classList.add("is-3d");
  } catch (err) {
    console.info("Money Machine: 3D unavailable, using flat reels.", err?.message || err);
    // A failure after the renderer attached (say, the model 404s) leaves a dead canvas.
    el.querySelector("canvas")?.remove();
    stage = flatStage(el);
    el.classList.add("is-2d");
  }
  const pools = reelPool(mode);
  stage.paintIdle([["AI", ...pools[0]], ["CREATOR", ...pools[1]], ["PROBLEM", ...pools[2]]]);
}

// ------------------------------------------------------------ rendering

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter((c) => c != null));
  return node;
};

function renderModes() {
  const list = $("#modes");
  list.replaceChildren(...MODES.map((m) => {
    const b = el("button", { type: "button", className: "mode", textContent: `${m.emoji} ${m.label}`, onclick: () => setMode(m.id) });
    b.setAttribute("aria-pressed", String(m.id === mode));
    return b;
  }));
  $("#blurb").textContent = MODES.find((m) => m.id === mode).blurb;
}

function setMode(id) {
  if (busy) return;
  mode = id;
  store.set("mm.mode", id);
  sfx.blip();
  renderModes();
  renderTelemetry();
}

function renderLoop() {
  const order = ["spin", "discover", "mutate", "build", "cash"];
  const next = order.find((s) => !steps.has(s));
  $$("#loop li").forEach((li) => {
    li.classList.toggle("on", steps.has(li.dataset.step));
    li.classList.toggle("next", li.dataset.step === next && steps.size > 0);
  });
}

const compact = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));

function renderTelemetry(d = genes && describe(genes, CUR)) {
  const rows = [
    ["IDEAS LOADED", SPACE.base.toLocaleString("en-US")],
    ["MUTATIONS", compact(SPACE.variants)],
    ["MARKET SIGNAL", d ? d.signal : "ACTIVE"],
    ["DEGEN MODE", d?.degen ? `ON · LVL ${d.degen}` : mode === "degen" ? "ON" : "OFF"],
    ["CAPITAL REQUIRED", d ? d.capital : `${CUR}0`],
  ];
  const line = ([k, v]) => `${k} ${".".repeat(Math.max(2, 20 - k.length))} ${v}`;
  $("#telemetry").replaceChildren(
    el("span", { className: "hi", textContent: "MONEY MACHINE v1.0" }),
    `\n${rows.map(line).join("\n")}\n`,
    `SPINS ${stats.spins} · STREAK ${stats.streak}D · JACKPOTS ${stats.jackpots} · VAULT ${vault.length}`,
  );
}

function setReadout(i, reel) {
  const cells = $$("#readout > div:not(.x)");
  cells[i].querySelector(".val").textContent = reel.value;
  cells[i].querySelector(".lab").textContent = reel.label;
}

function renderResult(d) {
  const card = $("#result");
  card.hidden = false;
  $("#rarity").textContent = d.rarity.label;
  $("#rarity").dataset.tier = d.rarity.id;
  $("#total-row").dataset.tier = d.rarity.id;
  $("#meta").textContent = `${d.mode.emoji} ${d.mode.label} · GEN ${d.gen}`;
  $("#idea-name").textContent = d.name;
  $("#pitch").textContent = d.pitch;
  const stolen = $("#stolen");
  stolen.hidden = !d.stolen;
  if (d.stolen) stolen.replaceChildren("STOLEN FROM ", el("b", { textContent: d.stolen.source }), `: ${d.stolen.what}.`);
  $("#f-customer").textContent = d.customer;
  $("#f-offer").textContent = d.offer;
  $("#f-mvp").textContent = d.mvp;
  $("#f-first").textContent = d.first;
  $("#lineage").replaceChildren(...lineage.map((n) => el("li", { textContent: n })));
  $("#scores").replaceChildren(...d.scores.map((s) => el("li", { className: "score-row" },
    el("span", { className: "k", textContent: s.label }),
    el("span", { className: "b", textContent: s.bar, ariaHidden: "true" }),
    el("span", { className: "v", textContent: `${s.value}/5` }),
    el("span", { className: "why", textContent: s.why }),
  )));
  $("#est-time").textContent = d.mvpTime;
  $("#est-cost").textContent = d.startCost;
  $("#total").textContent = `${d.total}/100 · ${d.rarity.label}`;
  $("#notes").replaceChildren(...d.notes.map((n) => el("li", { textContent: n })));
  $("#vault-it").textContent = vault.some((v) => v.code === d.code) ? "★ IN THE VAULT" : "★ VAULT IT";
}

function renderBlueprint() {
  const d = describe(genes, CUR);
  $("#bp-name").textContent = d.name;
  const sections = blueprint(genes, CUR).map((s) => {
    const body = el("div", { className: "bp-body" });
    for (const it of s.items) {
      const value = Array.isArray(it.v)
        ? el(it.ol ? "ol" : "ul", {}, ...it.v.map((x) => el("li", { textContent: x })))
        : el("div", { className: it.k ? "v" : "v bp-lead", textContent: it.v });
      body.append(el("div", { className: "bp-row" }, it.k ? el("div", { className: "k", textContent: it.k }) : null, value));
    }
    const summary = el("summary", {}, el("span", { className: "n", textContent: String(s.n).padStart(2, "0") }), el("span", { textContent: s.title }));
    return el("details", { open: true }, summary, body);
  });
  $("#bp-sections").replaceChildren(...sections);
}

function renderVault() {
  $("#vault-count").textContent = vault.length ? `(${vault.length})` : "";
  $("#vault-empty").hidden = vault.length > 0;
  $("#vault-export").hidden = vault.length === 0;
  $("#vault-list").replaceChildren(...vault.map((v) => el("li", {},
    el("button", { type: "button", className: "open", onclick: () => openCode(v.code, { scroll: true }) },
      el("span", { className: "nm", textContent: v.name }),
      el("span", { className: "mt", textContent: `${v.rarity} · ${v.total}/100 · ${v.mode}` })),
    el("button", { type: "button", className: "rm", textContent: "✕", ariaLabel: `Remove ${v.name}`, onclick: () => removeFromVault(v.code) }),
  )));
}

let toastTimer;
function toast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

function setBusy(on) {
  busy = on;
  const b = $("#spin");
  b.disabled = on;
  b.textContent = on ? "SPINNING…" : "SPIN THE MACHINE";
  $$(".ops button").forEach((x) => { x.disabled = on; });
}

// ------------------------------------------------------------ the loop

const shareUrl = (code = genes && describe(genes).code) => `${HOME_URL()}#${code}`;

function show(g, { scroll = true, slam = true } = {}) {
  genes = g;
  const d = describe(g, CUR);
  renderResult(d);
  renderTelemetry(d);
  renderLoop();
  if (!$("#blueprint").hidden) renderBlueprint();
  setHash(`#${d.code}`);
  const card = $("#result");
  card.classList.remove("slam", "glitch");
  void card.offsetWidth;
  card.classList.add(slam ? "slam" : "glitch");
  if (scroll) {
    card.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
    $("#idea-name").focus({ preventScroll: true });
  }
  $("#announce").textContent = `${d.name}. ${d.rarity.label}, ${d.total} out of 100.`;
}

async function runReels(g, { quick = false } = {}) {
  const d = describe(g, CUR);
  sfx.lever();
  haptic(12);
  const tick = ticker();
  await stage.spin({
    targets: d.reels.map((r) => r.value),
    pools: reelPool(g.m),
    quick,
    onReelStop: (i) => {
      sfx.clunk();
      haptic(8);
      setReadout(i, d.reels[i]);
    },
  });
  tick.stop();
  return d;
}

function countSpin() {
  const day = (offset = 0) => new Date(Date.now() - offset).toLocaleDateString("en-CA");
  if (stats.day !== day()) stats.streak = stats.day === day(864e5) ? stats.streak + 1 : 1;
  stats.day = day();
  stats.spins += 1;
  store.set("mm.stats", stats);
}

function waitOrSkip(ms, node) {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      node.removeEventListener("click", done);
      removeEventListener("keydown", done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    node.addEventListener("click", done);
    addEventListener("keydown", done);
  });
}

// The reveal copies the choreography of a casino logo-reveal: stop, flash,
// a horizontal light streak while the camera punches through the payline,
// then the name alone on black with one line underneath.
async function reveal(d) {
  const level = TIER[d.rarity.id];
  stage.celebrate(level, d.total);
  if (level) sfx.win(level);
  if (level === 3) haptic([30, 40, 30, 40, 90]);
  if (REDUCED) return;
  // Let a big win land on the machine (coins, bulbs) before the overlay.
  if (level >= 2) await wait(level === 3 ? 1100 : 650);
  const ov = $("#reveal");
  $("#rv-rarity").textContent = d.rarity.label;
  $("#rv-rarity").dataset.tier = d.rarity.id;
  $("#rv-name").textContent = d.name;
  $("#rv-line").textContent = `${d.customer} · ${d.offer}`;
  ov.hidden = false;
  ov.className = "reveal play";
  stage.zoomThrough();
  await waitOrSkip(level === 3 ? 3400 : 2600, ov);
  ov.classList.add("out");
  await stage.home(0);
  await wait(360);
  ov.hidden = true;
  ov.className = "reveal";
}

async function spinNow() {
  if (busy || !stage) return;
  setBusy(true);
  try {
    // REROLL is pressed down on the result card; bring the machine back into view to watch it.
    const cabinet = $(".cabinet").getBoundingClientRect();
    if (cabinet.top < 0 || cabinet.bottom > innerHeight) $(".cabinet").scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const g = spin(mode, seed);
    countSpin();
    steps = new Set(["spin"]);
    renderLoop();
    const d = await runReels(g);
    lineage = [];
    steps.add("discover");
    if (d.rarity.id === "jackpot") {
      stats.jackpots += 1;
      store.set("mm.stats", stats);
    }
    await reveal(d);
    show(g);
  } finally {
    setBusy(false);
  }
}

async function applyOp(op) {
  if (busy || !genes) return;
  if (op === "reroll") return spinNow();
  const r = { mutate, cheaper, degenerate }[op](genes);
  if (r.maxed || r.refused) {
    sfx.buzz();
    toast(r.note.replaceAll("¤", CUR));
    return;
  }
  setBusy(true);
  try {
    const before = describe(genes, CUR);
    const after = describe(r.genes, CUR);
    if (after.reels.some((x, i) => x.value !== before.reels[i].value)) await runReels(r.genes, { quick: true });
    ({ mutate: sfx.blip, cheaper: sfx.coin, degenerate: sfx.buzz })[op]();
    lineage.push(r.note);
    steps.add("mutate");
    const up = TIER[after.rarity.id] - TIER[before.rarity.id];
    if (up > 0) {
      stage.celebrate(TIER[after.rarity.id], after.total);
      sfx.win(TIER[after.rarity.id]);
      if (after.rarity.id === "jackpot") {
        stats.jackpots += 1;
        store.set("mm.stats", stats);
      }
      toast(`UPGRADED TO ${after.rarity.label} · ${after.total}/100`);
    } else {
      stage.celebrate(0, after.total);
      toast(r.note);
    }
    show(r.genes, { scroll: false, slam: false });
  } finally {
    setBusy(false);
  }
}

function openBlueprint() {
  if (!genes) return;
  steps.add("build");
  renderLoop();
  renderBlueprint();
  const bp = $("#blueprint");
  bp.hidden = false;
  sfx.coin();
  bp.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
  $("#bp-title").focus({ preventScroll: true });
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function download(name, text, type = "text/markdown") {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = el("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function cashed() {
  steps.add("cash");
  renderLoop();
}

async function exportMarkdown(how) {
  if (!genes) return;
  const d = describe(genes, CUR);
  const md = markdown(genes, { cur: CUR, url: shareUrl(d.code) });
  if (how === "download") {
    download(`money-machine-${slug(d.name)}.md`, md);
    toast("BLUEPRINT DOWNLOADED. NOW GO GET CUSTOMER #1.");
  } else {
    try {
      await navigator.clipboard.writeText(md);
      toast("BLUEPRINT COPIED. PASTE IT SOMEWHERE YOU'LL ACT ON IT.");
    } catch {
      download(`money-machine-${slug(d.name)}.md`, md);
      toast("CLIPBOARD BLOCKED, SO IT'S DOWNLOADED INSTEAD.");
    }
  }
  sfx.coin();
  cashed();
}

function vaultIt() {
  if (!genes) return;
  const d = describe(genes, CUR);
  if (vault.some((v) => v.code === d.code)) {
    toast("ALREADY IN THE VAULT.");
    return;
  }
  vault.unshift({ code: d.code, name: d.name, pitch: d.pitch, rarity: d.rarity.label, total: d.total, mode: d.mode.label, t: Date.now() });
  vault = vault.slice(0, 100);
  store.set("mm.vault", vault);
  renderVault();
  renderTelemetry();
  $("#vault-it").textContent = "★ IN THE VAULT";
  sfx.coin();
  haptic(10);
  toast(`★ VAULTED · ${vault.length} IN THE VAULT`);
}

function removeFromVault(code) {
  vault = vault.filter((v) => v.code !== code);
  store.set("mm.vault", vault);
  renderVault();
  renderTelemetry();
  if (genes) $("#vault-it").textContent = vault.some((v) => v.code === describe(genes).code) ? "★ IN THE VAULT" : "★ VAULT IT";
}

function exportVault() {
  const text = vaultText(vault, {
    cur: CUR,
    date: new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }),
    linkFor: (code) => shareUrl(code),
    footer: [`Spin your own: ${HOME_URL()}`, `The systems behind these ideas: ${GUMROAD}`],
  });
  if (EMBED) {
    navigator.clipboard.writeText(text).then(
      () => { toast("VAULT COPIED. PASTE IT SOMEWHERE SAFE."); cashed(); },
      () => toast("YOUR BROWSER BLOCKED THE CLIPBOARD HERE."),
    );
    return;
  }
  download("my-money-machine-vault.txt", text, "text/plain");
  toast("VAULT EXPORTED.");
  cashed();
}

async function share() {
  if (!genes) return;
  const d = describe(genes, CUR);
  const url = shareUrl(d.code);
  try {
    if (!EMBED && navigator.share && matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ title: `${d.name} // Money Machine`, text: d.pitch, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast("LINK COPIED. IT OPENS THIS EXACT IDEA.");
  } catch (err) {
    if (err?.name !== "AbortError") toast(url);
  }
}

// Open an idea from a share link or the vault without spinning.
function openCode(code, { scroll = true } = {}) {
  const g = decode(code);
  if (!g) {
    toast("THAT IDEA WAS RETIRED FROM THE MACHINE.");
    return false;
  }
  const d = describe(g, CUR);
  mode = g.m;
  renderModes();
  lineage = [];
  steps = new Set(["spin", "discover"]);
  d.reels.forEach((r, i) => setReadout(i, r));
  const pools = reelPool(g.m);
  stage.paintIdle(d.reels.map((r, i) => [r.value, ...pools[i]]));
  show(g, { scroll });
  return true;
}

// ------------------------------------------------------------------ wiring

function wire() {
  if (EMBED) {
    $$("[data-md=download]").forEach((b) => { b.hidden = true; });
    $("#vault-export").textContent = "COPY MY VAULT";
  }
  $("#spin").addEventListener("click", spinNow);
  $$(".ops button").forEach((b) => b.addEventListener("click", () => applyOp(b.dataset.op)));
  $("#make-real").addEventListener("click", openBlueprint);
  $$("[data-md]").forEach((b) => b.addEventListener("click", () => exportMarkdown(b.dataset.md)));
  $("#vault-it").addEventListener("click", vaultIt);
  $("#vault-export").addEventListener("click", exportVault);
  $("#share").addEventListener("click", share);
  const sound = $("#sound");
  const paintSound = () => {
    sound.textContent = soundOn ? "SOUND ON" : "SOUND OFF";
    sound.setAttribute("aria-pressed", String(soundOn));
  };
  sound.addEventListener("click", () => {
    soundOn = !soundOn;
    store.set("mm.sound", soundOn);
    paintSound();
    sfx.blip();
  });
  paintSound();

  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input, textarea, select, [contenteditable]")) return;
    if (!$("#reveal").hidden) return;
    const k = e.key.toLowerCase();
    if (k === " " || k === "enter") {
      if (e.target === document.body) {
        e.preventDefault();
        spinNow();
      }
      return;
    }
    const ops = { m: "mutate", c: "cheaper", d: "degenerate", r: "reroll" };
    if (ops[k]) applyOp(ops[k]);
    else if (k === "b") openBlueprint();
    else if (k === "v") vaultIt();
    else if (k === "s") share();
  });

  addEventListener("hashchange", () => {
    const code = decodeURIComponent(location.hash.slice(1));
    if (code && (!genes || code !== describe(genes).code) && !busy) openCode(code);
  });
}

async function main() {
  renderModes();
  renderTelemetry();
  renderVault();
  renderLoop();
  wire();
  await initStage();
  const code = decodeURIComponent(location.hash.slice(1));
  if (code && !openCode(code, { scroll: false })) setHash("");
}

main();
