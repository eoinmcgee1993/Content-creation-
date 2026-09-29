// The Money Machine engine: pure functions from an idea's genes to
// everything the page shows. No DOM, storage or network, so the same module
// runs in the browser, in `node --test`, and later behind a paid AI endpoint.
//
// An idea is a small "genes" object (ids and indexes into banks.js). Every
// view of it (card, scorecard, blueprint, markdown, vault text) is derived
// from the genes, so a share link or vault entry only has to store the code.

import {
  BAND, CUT, DEGEN, FAKE_IT, FORMATS, GENTLE_FIRST, GEOS, HEADLINES, LEAN, LEAN_MAXED, LEAN_STACK,
  MODE_RULES, MODELS, MODES, NICHES, PRICE_POINTS, PRICING, WALLET_WHY,
} from "./banks.js";

const NICHE = new Map(NICHES.map((n) => [n.id, n]));
const FORMAT = new Map(FORMATS.map((f) => [f.id, f]));
const MODEL = new Map(MODELS.map((m) => [m.id, m]));
const MODE = new Map(MODES.map((m) => [m.id, m]));

export const SCORE_LABELS = {
  fcd: "FIRST-CUSTOMER DIFFICULTY",
  build: "BUILD COMPLEXITY",
  cost: "STARTUP COST",
  clar: "MONETISATION CLARITY",
  auto: "AUTOMATION POTENTIAL",
};
const MVP_TIME = [null, "2 HOURS", "4 HOURS", "1 WEEKEND", "2 WEEKS", "6 WEEKS"];
const START_COST = [null, [0, 25], [25, 100], [100, 500], [500, 2000], [2000, null]];
export const RARITY = [
  { id: "jackpot", label: "JACKPOT", min: 95 },
  { id: "epic", label: "EPIC", min: 85 },
  { id: "rare", label: "RARE", min: 75 },
  { id: "common", label: "COMMON", min: 0 },
];
const REACH_WHY = {
  5: "They live online and complain in public. You can find 50 before lunch.",
  4: "They cluster in {hang}. One good post reaches hundreds.",
  3: "Findable, but expect cold outreach before the first yes.",
  2: "Busy and offline. Expect cold calls, walk-ins or a warm intro.",
  1: "Hard to reach. You need an insider.",
};
const COST_WHY = {
  1: "Free tiers cover it until the first sale.",
  2: "Budget for a domain, API calls and a paid tier or two.",
  3: "Stock, insurance or dev tools before revenue.",
  4: "Real money up front. Presell first.",
  5: "Serious capital. Presell or partner.",
};
const LEAN_FLOW = [
  null,
  null,
  ["Customer pays (Stripe Payment Link)", "The Tally form lands in your inbox", "You do the work with Claude open in a tab", "You email the result from a template", "Log every step: it becomes the automation spec"],
  ["Customer pays the presale link", "Stripe emails you", "You deliver by hand within 48 hours", "Automate only after customer 3"],
];
// Seven days, from buying the domain to the launch post.
const PLAN = {
  service: [
    "Buy {domain}. Write the offer (sections 2, 4 and 5) and post it in {hang}: count replies, not likes.",
    "Put the landing page and payment link live on {domain}. Connect the intake form.",
    "Do 3 {frees} by hand. Screenshot everything.",
    "Publish the before/afters in {hang} and {hang2}.",
    "DM 20 {label}. Founder price for the first 10.",
    "Deliver the paid jobs. Every step you repeat is tomorrow's automation.",
    "Publish the launch post in {hang}, {hang2} and on LinkedIn: the before/afters, the price and a real founder deadline. Then count: 3+ paying means keep going, zero means mutate or reroll.",
  ],
  product: [
    "Buy {domain}. Presell: post the outline in {hang} with a founder price.",
    "Build the core asset: {mvp}.",
    "Finish it, package it on Gumroad and write the listing (section 11).",
    "Give away the {free} in {hang2} and collect the emails.",
    "Follow up everyone who took the freebie.",
    "Ship one improvement from buyer feedback and ask for 3 reviews.",
    "Publish the launch post in {hang} and {hang2} with the reviews and a 72-hour launch price. High views and low sales means mutate the angle.",
  ],
  software: [
    "Buy {domain}. Validate: a 30-second mock-up video in {hang}. Collect 20 waitlist emails.",
    "Build the one core flow: {mvp}. No settings page.",
    "Add Stripe and onboarding. Charge from day one (founder price).",
    "Onboard 5 waitlisters by hand, on calls.",
    "Fix the 3 things they tripped over, and record a 60-second demo with a real result.",
    "Line up the launch: the demo, one customer quote and the founder price.",
    "Publish the launch post in {hang} and {hang2}. Then count paying users and churn reasons: double down, mutate or reroll.",
  ],
  presell: [
    "Buy {domain}. Write the offer as a one-page Google Doc. No product yet.",
    "Create a Stripe Payment Link at the founder price.",
    "Send 20 DMs to {label} from {hang}.",
    "Send 20 more and follow up yesterday's.",
    "If 3 people paid: build the smallest version and deliver it by hand.",
    "If nobody paid: rewrite the first line of the offer and send one more round of 20.",
    "Publish the launch post in {hang2} with a real deadline and whatever proof you have. Still zero: mutate or reroll.",
  ],
  gentle: [
    "Buy {domain}. Write the offer (sections 2, 4 and 5) in plain, kind language.",
    "Put the landing page and payment link live.",
    "Meet or call 5 of the {ally}. Offer their clients the first cases free.",
    "Deliver those cases with real care, and ask for honest feedback.",
    "Turn the feedback into a one-page explainer partners can hand over.",
    "Follow up every partner and ask for a standing referral arrangement.",
    "Publish a quiet launch post for partners on LinkedIn and in {hang}, not a hype thread. Count referrals and paid cases: keep going, or mutate the offer.",
  ],
};
// Brand names: two or three words, e.g. ReceiptOps or ClearFlow Systems.
const BRAND = {
  pre: ["Clear", "True", "Swift", "Iron", "North", "Bright", "Prime", "Steady", "Signal", "Open"],
  suf: ["Flow", "Line", "Stack", "Path", "Loop", "Grid", "Gate", "Works"],
  carePre: ["Kind", "Quiet", "Steady", "Clear", "Gentle", "Still"],
  careSuf: ["Path", "Harbour", "Hands", "Light", "Haven"],
};
const DATA_FORMATS = new Set(["detective", "watchdog", "audit", "api", "chatbot", "agent", "saas", "extension"]);

// ---------------------------------------------------------------- helpers

// mulberry32: small, fast, and identical in every JS engine.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (rand, n) => Math.floor(rand() * n);
const pick = (rand, list) => list[int(rand, list.length)];
const nextSeed = (seed) => (rng(seed)() * 4294967296) >>> 0;

function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}
const pickBy = (list, h) => list[h % list.length];

function snap(x) {
  let best = PRICE_POINTS[0];
  for (const p of PRICE_POINTS) if (Math.abs(Math.log(p / x)) < Math.abs(Math.log(best / x))) best = p;
  return best;
}
// "¤" stays in every string until finish() swaps in the viewer's currency.
const money = (n) => (n == null ? undefined : `¤${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`);
const finish = (value, cur) =>
  typeof value === "string" ? value.replaceAll("¤", cur) : Array.isArray(value) ? value.map((v) => finish(v, cur)) : value;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
// "No-Show" -> "no-show", but "SaaS", "PR" and "CPD" keep their capitals.
const lowerNoun = (s) => s.split(" ").map((w) => (/^[A-Z][a-z'’]*(?:-[A-Za-z][a-z'’]*)*$/.test(w) ? w.toLowerCase() : w)).join(" ");
const plural = (w) => (/(ch|sh|x|s)$/.test(w) ? `${w}es` : `${w}s`);
const possessive = (label) => (label.endsWith("s") ? `${label}'` : `${label}'s`);
const clamp = (x) => Math.max(1, Math.min(5, Math.round(x)));
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? m : vars[k]));
const bar = (n) => "█".repeat(n) + "░".repeat(5 - n);

function fits(fmt, pain, niche) {
  if (fmt.stealOnly) return false;
  if ((fmt.minWallet && niche.wallet < fmt.minWallet) || (fmt.noGentle && niche.gentle)) return false;
  if (fmt.needs) return Boolean(pain[fmt.needs]);
  return fmt.fits.includes(pain.type);
}

// Every (format, niche, pain) a spin can land on, per mode, grouped by
// format so each spin picks a format first and formats get equal airtime.
const COMBOS = {};
for (const [mode, rule] of Object.entries(MODE_RULES)) {
  if (rule.steal) continue;
  const byFormat = new Map();
  for (const fmt of FORMATS) {
    if (rule.formats !== "all" && !rule.formats.includes(fmt.id)) continue;
    const list = [];
    for (const niche of NICHES) {
      if (!rule.sets.includes(niche.set)) continue;
      for (const pain of niche.pains) if (fits(fmt, pain, niche)) list.push([niche.id, pain.id]);
    }
    if (list.length) byFormat.set(fmt.id, list);
  }
  COMBOS[mode] = byFormat;
}

// ------------------------------------------------------------------ spin

function sourceOf(g) {
  return g.m === "steal" ? MODEL.get(g.f) : FORMAT.get(g.f);
}

export function spin(mode, seed) {
  const rule = MODE_RULES[mode];
  if (!rule) throw new Error(`Unknown mode: ${mode}`);
  const rand = rng(seed);
  const draw = () => {
    let g;
    if (rule.steal) {
      const model = pick(rand, MODELS);
      const target = pick(rand, model.targets);
      g = { m: mode, n: target.niche, p: target.id, f: model.id };
    } else {
      const byFormat = COMBOS[mode];
      const f = pick(rand, [...byFormat.keys()]);
      const [n, p] = pick(rand, byFormat.get(f));
      g = { m: mode, n, p, f };
    }
    return { ...g, v: int(rand, sourceOf(g).names.length), sub: -1, geo: -1, w: -1, pr: 0, l: 0, d: rule.degen || 0, g: 1 };
  };
  let best = draw();
  if (rule.pick !== "random") {
    for (let i = 1; i < rule.draws; i++) {
      const c = draw();
      if (better(rule.pick, c, best)) best = c;
    }
  }
  best.r = (rand() * 4294967296) >>> 0;
  return best;
}

function better(how, a, b) {
  const ca = context(a), cb = context(b);
  const sa = scoresOf(ca), sb = scoresOf(cb);
  if (how === "upside") return total(sa) + 8 * ca.wallet > total(sb) + 8 * cb.wallet;
  // fastest: easiest first customer, then clearest money, then least to build
  if (sa.fcd !== sb.fcd) return sa.fcd < sb.fcd;
  if (sa.clar !== sb.clar) return sa.clar > sb.clar;
  return sa.build < sb.build;
}

// ------------------------------------------------------------ operations
// Each returns { genes, note } and never mutates its input. `maxed` or
// `refused` means nothing changed and the note explains why.

function pivots(g) {
  if (g.m === "steal") {
    return MODEL.get(g.f).targets.filter((t) => t.id !== g.p).map((t) => ({ p: t.id, n: t.niche, note: `MODEL RE-AIMED → ${t.noun}` }));
  }
  const niche = NICHE.get(g.n);
  const pain = niche.pains.find((x) => x.id === g.p);
  const allowed = MODE_RULES[g.m].formats;
  return FORMATS.filter((f) => f.id !== g.f && (allowed === "all" || allowed.includes(f.id)) && fits(f, pain, niche))
    .map((f) => ({ f: f.id, note: `FORMAT PIVOT → ${f.reel}` }));
}

// Where the same mechanism can go next: the same format (or stolen model)
// and the same kind of problem, aimed at another niche the mode allows.
function audiences(g) {
  // A degenerate idea never lands on grief, care or divorce.
  const allowed = (niche) => !(g.d > 0 && niche.gentle);
  if (g.m === "steal") {
    return MODEL.get(g.f).targets.filter((t) => t.id !== g.p && allowed(NICHE.get(t.niche))).map((t) => ({ n: t.niche, p: t.id }));
  }
  const fmt = FORMAT.get(g.f);
  const pain = NICHE.get(g.n).pains.find((x) => x.id === g.p);
  const rule = MODE_RULES[g.m];
  const out = [];
  for (const niche of NICHES) {
    if (niche.id === g.n || !rule.sets.includes(niche.set) || !allowed(niche)) continue;
    for (const q of niche.pains) if (fits(fmt, q, niche) && (fmt.needs || q.type === pain.type)) out.push({ n: niche.id, p: q.id });
  }
  return out;
}

// The audience in a few words: "plumbers", "mobile dog groomers".
function aimOf(g) {
  const niche = NICHE.get(g.n);
  if (g.sub >= 0) return niche.sub[g.sub];
  if (g.m === "steal") return MODEL.get(g.f).targets.find((t) => t.id === g.p).aim || niche.label;
  return niche.label;
}

// MUTATE keeps the mechanism and flips the audience (freelancers -> plumbers),
// landing on one sharp sub-niche of it. Only when there's nowhere to flip
// does it narrow, reprice or pivot the idea instead.
export function mutate(genes) {
  const g = { ...genes };
  const rand = rng(g.r);
  const flips = audiences(g);
  if (flips.length) {
    const from = aimOf(g);
    Object.assign(g, pick(rand, flips), { sub: -1, w: -1 });
    const niche = NICHE.get(g.n);
    if (g.m !== "steal" && niche.sub.length) g.sub = int(rand, niche.sub.length);
    g.g += 1;
    g.r = (rand() * 4294967296) >>> 0;
    return { genes: g, note: `AUDIENCE FLIPPED: ${from} → ${aimOf(g)}`.toUpperCase() };
  }
  const niche = NICHE.get(g.n);
  const target = g.m === "steal" ? MODEL.get(g.f).targets.find((t) => t.id === g.p) : null;
  const narrow = [];
  if (g.sub < 0 && niche.sub.length && !target?.who) narrow.push("sub");
  if (g.w < 0 && niche.when.length) narrow.push("when");
  if (g.geo < 0) narrow.push("geo");
  let op;
  if (narrow.length) op = pick(rand, narrow);
  else {
    const other = [];
    if (g.pr === 0 && g.d < 2) other.push("price");
    if (pivots(g).length) other.push("pivot");
    if (!other.length) return { genes, note: "FULLY MUTATED. SPIN AGAIN.", maxed: true };
    op = pick(rand, other);
  }
  let note;
  if (op === "sub") {
    g.sub = int(rand, niche.sub.length);
    note = `CUSTOMER NARROWED → ${niche.sub[g.sub]}`;
  } else if (op === "when") {
    g.w = int(rand, niche.when.length);
    note = `TRIGGER ADDED → ${niche.when[g.w]}`;
  } else if (op === "geo") {
    g.geo = int(rand, GEOS.length);
    note = `MARKET LOCKED → ${GEOS[g.geo]}`;
  } else if (op === "price") {
    const kind = FORMAT.get(g.m === "steal" ? MODEL.get(g.f).format : g.f).kind;
    g.pr = kind === "software" ? 1 : 1 + int(rand, 2);
    note = `PRICING FLIPPED → ${PRICING.names[g.pr]}`;
  } else {
    const next = pick(rand, pivots(g));
    note = next.note;
    if (next.f) g.f = next.f;
    if (next.p) {
      if (next.n !== g.n) Object.assign(g, { sub: -1, w: -1 });
      Object.assign(g, { p: next.p, n: next.n });
    }
    g.v = int(rand, sourceOf(g).names.length);
    // The new niche may be one the machine refuses to make degenerate.
    if (NICHE.get(g.n).gentle) g.d = 0;
  }
  g.g += 1;
  g.r = (rand() * 4294967296) >>> 0;
  return { genes: g, note: note.toUpperCase() };
}

const stackTier = (fmt, l) => (l ? LEAN[l].tier[fmt.kind] : fmt.tier);

// MAKE IT CHEAPER downgrades the stack one rung: custom build -> Make.com +
// Tally form -> a Notion template run by hand -> a presale.
export function cheaper(genes) {
  if (genes.l >= 3) return { genes, note: LEAN_MAXED, maxed: true };
  const g = { ...genes, l: genes.l + 1, g: genes.g + 1, r: nextSeed(genes.r) };
  const { fmt } = context(genes);
  return { genes: g, note: `STACK DOWNGRADED: ${stackTier(fmt, genes.l)} → ${stackTier(fmt, g.l)}` };
}

export function degenerate(genes) {
  if (NICHE.get(genes.n).gentle) return { genes, note: DEGEN.refused, refused: true };
  if (genes.d >= 3) return { genes, note: DEGEN.maxed, maxed: true };
  const g = { ...genes, d: genes.d + 1, g: genes.g + 1, r: nextSeed(genes.r) };
  return { genes: g, note: DEGEN.notes[g.d] };
}

// --------------------------------------------------------------- context

function context(g) {
  const niche = NICHE.get(g.n);
  const steal = g.m === "steal";
  const model = steal ? MODEL.get(g.f) : null;
  const fmt = FORMAT.get(steal ? model.format : g.f);
  const pain = steal ? model.targets.find((t) => t.id === g.p) : niche.pains.find((x) => x.id === g.p);
  const label = g.sub >= 0 ? niche.sub[g.sub] : niche.label;
  const h = hash(`${g.n}|${g.p}|${g.f}`);
  const hang = [0, 1, 2].map((i) => niche.hang[(h + i) % niche.hang.length]);
  const wallet = pain.wallet || niche.wallet;
  const band = BAND[wallet];
  const raw = (model?.pay || fmt.pay)(band);
  const p = {};
  for (const [k, x] of Object.entries(raw)) p[k] = k === "take" ? x : snap(x);
  const premium = snap((p.one || p.setup || (p.rec || 0) * 6 || (p.usage || 0) * 3 || 99) * 5);
  const count = fmt.id === "prompts" ? pickBy([30, 50, 75], h) : pickBy([12, 20, 30], h);
  const vars = {
    label, poss: g.sub >= 0 ? possessive(label) : niche.poss || possessive(label),
    thing: pain.thing, find: pain.find || pain.thing, task: pain.task, result: pain.result, Result: cap(pain.result), data: pain.data,
    supply: pain.supply, merch: pain.merch, N: pain.noun, nn: lowerNoun(pain.noun),
    hang: hang[0], hang2: hang[1], hang3: hang[2], ally: niche.ally,
    moment: g.w >= 0 ? niche.when[g.w] : "", geo: g.geo >= 0 ? GEOS[g.geo] : "",
    n: count, one: money(p.one), rec: money(p.rec), setup: money(p.setup), usage: money(p.usage), take: p.take,
    premium: money(premium), anchor: money(p.one ?? p.rec ?? p.setup ?? p.usage ?? 19), free: fmt.free, frees: plural(fmt.free), cur: "¤",
    // Recurring backends for the second pricing tier.
    club: money(snap(Math.max(5, band.rec * 0.6))), care: money(snap(band.rec)), feature: money(snap(band.rec * 3)),
  };
  return { g, niche, steal, model, fmt, pain, label, h, hang, wallet, band, p, premium, vars };
}

function scoresOf(c) {
  const { g, niche, fmt, wallet } = c;
  let fcd = 6 - niche.reach + fmt.fcd + (wallet >= 4 ? 1 : 0) + (niche.trust >= 3 ? 1 : 0);
  if (g.sub >= 0) fcd -= 1;
  if (g.w >= 0) fcd -= 1;
  if (g.geo >= 0 && niche.local) fcd -= 1;
  if (g.pr === 1) fcd -= 1;
  if (g.pr === 2) fcd += 1;
  if (g.d >= 1) fcd -= 1;
  return {
    fcd: clamp(fcd),
    build: clamp(fmt.build - g.l),
    cost: clamp(fmt.cost + (niche.trust >= 3 ? 1 : 0) - g.l),
    clar: clamp(fmt.clar - (g.pr === 1 ? 1 : 0) - (g.d >= 2 ? 1 : 0)),
    auto: clamp(fmt.auto - Math.max(0, g.l - 1)),
  };
}
const total = (s) => 5 * ((5 - s.fcd) + (5 - s.build) + (5 - s.cost) + (s.clar - 1) + (s.auto - 1));

function reasons(c, s) {
  const { g, niche, fmt, vars } = c;
  let fcd = fill(REACH_WHY[niche.reach], vars);
  const extra = g.sub >= 0 ? `Narrowed to ${vars.label}: one message that lands.`
    : g.w >= 0 ? `Timed for ${vars.moment}.`
    : g.geo >= 0 && niche.local ? "Local proof beats national ads."
    : niche.trust >= 3 ? "Regulated buyers want proof before they pay."
    : c.wallet >= 4 ? "Big tickets need a call before the first yes."
    : g.d >= 1 ? "Degen marketing buys attention."
    : fmt.fcd < 0 ? `A ${fmt.free} lowers the barrier.`
    : "";
  if (extra) fcd += ` ${extra}`;
  const cost = COST_WHY[s.cost] + (niche.trust >= 3 && g.l === 0 ? " Insurance and compliance add cost." : "");
  const clar = g.d >= 2 ? "Weird pricing gets attention, and some confusion."
    : g.pr === 1 ? "Pay-when-it-works is an easy yes, but harder to collect."
    : g.pr === 2 ? "Premium done-for-you: fewer buyers, bigger cheques."
    : fmt.why.clar;
  return {
    fcd,
    build: g.l ? LEAN[g.l].why[fmt.kind] : fmt.why.build,
    cost,
    clar,
    auto: g.l >= 2 ? "You are the automation for now. Systemise after customer 10." : fmt.why.auto,
  };
}

function baseName(c, v) {
  const names = sourceOf(c.g).names;
  // "{N} Clip" with the noun "Clip" would print "Clip Clip": use the next name.
  for (let i = 0; i < names.length; i++) {
    const name = fill(names[(v + i) % names.length], c.vars);
    if (!/\b(\w+) \1\b/i.test(name)) return name;
  }
  return fill(names[v], c.vars);
}

function nameOf(c) {
  const { g, h, vars } = c;
  if (g.d >= 2) return fill(pickBy(DEGEN.names[g.d], h), vars);
  const name = baseName(c, g.v);
  if (g.d === 0) return name;
  const adj = pickBy(DEGEN.adjectives, h);
  if (name.startsWith("The ")) return `The ${adj} ${name.slice(4)}`;
  if (name.startsWith(vars.N)) return `${adj} ${name}`;
  return `${name} (${adj} Edition)`;
}

function offerOf(c) {
  const { g, fmt, model, pain, p, vars } = c;
  let text;
  if (g.d >= 2) text = DEGEN.pricing[fmt.kind];
  else if (g.pr === 1) text = pain.type === "leak" ? PRICING.result : p.rec ? PRICING.trial : PRICING.pwyw;
  else if (g.pr === 2) text = p.rec ? PRICING.premium : PRICING.premiumOnce;
  else text = model?.offer || fmt.offer;
  text = fill(text, vars);
  return g.l === 3 ? `${text.replace(/\.$/, "")} (presold at 50% off to the first 10)` : text;
}

function mvpOf(c) {
  const { g, fmt, vars } = c;
  const lean = LEAN[g.l]?.mvp?.[fmt.kind];
  const list = g.l >= 2 ? lean : g.l === 1 ? fmt.nocode || lean || fmt.mvp : fmt.mvp;
  return list.map((x) => fill(x, vars));
}

function firstOf(c, { plain = false } = {}) {
  const { g, niche, fmt, h, vars } = c;
  if (niche.gentle) return fill(GENTLE_FIRST, vars);
  if (g.d >= 1 && !plain) {
    const usable = DEGEN.tactics.filter((t) => !fill(t, vars).includes("{"));
    return fill(pickBy(usable, h + g.d), vars);
  }
  const tactic = fill(c.model?.first || fmt.first, vars);
  return g.w >= 0 ? `${tactic}, timed for ${vars.moment}` : tactic;
}

function customerOf(c) {
  const { g, niche, pain, label, vars } = c;
  const geo = vars.geo ? ` ${vars.geo}` : "";
  if (c.steal && pain.who && g.sub < 0) return `${pain.who}${geo}`;
  return `${label}${geo} ${niche.q}`;
}

// The line the reveal prints: "INTELLIGENT AUTOMATION: NEWSLETTER
// INFRASTRUCTURE", or "SALESFORCE, BUT EXCLUSIVELY FOR MOBILE DOG GROOMERS".
function kickerOf(c) {
  if (c.steal) return `${c.model.source}, but exclusively for ${aimOf(c.g)}`.toUpperCase();
  if (c.niche.gentle) return `CARE INFRASTRUCTURE: ${c.pain.noun} SUPPORT`.toUpperCase();
  return fill(c.fmt.sys, c.vars).toUpperCase();
}

// "X for Y": the one-line proposition.
function propOf(c, who) {
  if (c.steal) return `${c.model.source}, but exclusively for ${aimOf(c.g)}.`;
  if (c.niche.gentle) return `${cap(c.pain.task)}, handled with care, for ${who}.`;
  if (c.fmt.prop) return fill(c.fmt.prop, { ...c.vars, who });
  return `${cap(fill(c.fmt.x, c.vars))} for ${who}.`;
}

function brandsOf(c) {
  const { h, niche, pain } = c;
  if (niche.gentle) return [`${pickBy(BRAND.carePre, h)}${pickBy(BRAND.careSuf, h >>> 3)} Care`];
  const words = pain.noun.split(/[\s-]+/).map((w) => (/^[A-Z][a-z'’]*$/.test(w) || /^[a-z]/.test(w) ? cap(w.toLowerCase()) : w));
  const stem = words.join("").length <= 12 ? words.join("") : words[0];
  return [`${stem.replace(/[^A-Za-z0-9]/g, "")}Ops`, `${pickBy(BRAND.pre, h)}${pickBy(BRAND.suf, h >>> 4)} Systems`];
}

// -------------------------------------------------------------- describe

export function describe(genes, cur = "$") {
  const c = context(genes);
  const { g, niche, fmt, pain, model, vars } = c;
  const s = scoresOf(c);
  const why = reasons(c, s);
  const score = total(s);
  const [lo, hi] = START_COST[s.cost];
  const pitch = (c.steal ? pain.twist : fill(fmt.pitch, vars)) + (g.d >= 1 ? ` ${pickBy(DEGEN.angles[g.d], c.h)}` : "");
  const notes = [];
  if (niche.trust >= 3 || (pain.type === "risk" && niche.trust >= 2)) {
    notes.push("Reality check: this touches regulated territory. Sell information and admin, never professional advice.");
  }
  if (g.d >= 1) notes.push(DEGEN.guardrail);
  const mode = MODE.get(g.m);
  const customer = customerOf(c);
  const out = {
    code: encode(g),
    mode: { id: mode.id, emoji: mode.emoji, label: mode.label },
    gen: g.g, lean: g.l, degen: g.d, gentle: Boolean(niche.gentle),
    name: nameOf(c),
    kicker: kickerOf(c),
    prop: propOf(c, customer),
    pitch,
    customer,
    offer: offerOf(c),
    mvp: mvpOf(c).join(" + "),
    first: firstOf(c),
    stolen: c.steal ? { source: model.source, what: model.what } : null,
    reels: c.steal
      ? [{ label: "STOLEN MODEL", value: model.reel }, { label: "NICHE", value: niche.reel }, { label: "TWIST", value: pain.noun.toUpperCase() }]
      : [{ label: "LEVERAGE", value: fmt.reel }, { label: "NICHE", value: niche.reel }, { label: "PROBLEM", value: pain.reel }],
    scores: Object.keys(SCORE_LABELS).map((key) => ({ key, label: SCORE_LABELS[key], value: s[key], bar: bar(s[key]), why: why[key] })),
    mvpTime: MVP_TIME[s.build],
    startCost: hi == null ? `${money(lo)}+` : `${money(lo)}–${money(hi)}`,
    capital: money(lo),
    total: score,
    rarity: RARITY.find((r) => score >= r.min),
    signal: s.fcd <= 2 ? "STRONG" : s.fcd === 3 ? "ACTIVE" : "FAINT",
    notes,
  };
  for (const k of Object.keys(out)) out[k] = finish(out[k], cur);
  out.scores = out.scores.map((row) => ({ ...row, why: finish(row.why, cur) }));
  return out;
}

// ------------------------------------------------------------- blueprint

// Two tiers: a low-barrier entry and a recurring backend.
function tierPair(c) {
  const src = c.model?.t1 ? c.model : c.fmt;
  return [fill(src.t1, c.vars), fill(src.t2, c.vars)];
}

function tiers(c, offer) {
  const [t1, t2] = tierPair(c);
  return [
    { k: "Headline offer", v: offer },
    { k: "Tier 1 · Entry", v: t1 },
    { k: "Tier 2 · Recurring backend", v: t2 },
    { k: "Founder offer", v: "First 10 customers get 50% off, locked for life. Scarcity that is actually true." },
    { k: "Why this price", v: WALLET_WHY[c.wallet] },
  ];
}

// The exact checkout to set up: Gumroad for downloads, Stripe for the rest.
function checkout(c, name) {
  const { fmt, niche, vars } = c;
  const [t1, t2] = tierPair(c);
  if (fmt.kind === "product") {
    return [
      `Gumroad product "${name}", type: digital product`,
      `Price: ${t1}`,
      "Content: the files, or the Notion duplicate link",
      "Workflow emails on day 1, 3 and 7 (section 10)",
      "Offer code FOUNDER50: 50% off, limited to 10 uses",
      `Membership product for Tier 2: ${t2}`,
    ];
  }
  return [
    `Stripe product "${name}" with two prices`,
    `Price 1: ${t1}`,
    `Price 2 (recurring): ${t2}`,
    `Collect: email${niche.wallet >= 3 ? ", business name and VAT number" : ""}`,
    `After payment: redirect to ${fmt.kind === "software" ? "onboarding (magic-link sign-in)" : "the Tally intake form"}`,
    "Promotion code FOUNDER50: 50% off, 10 redemptions, then it expires",
    `Receipts on; turn on Stripe Tax if you sell to ${vars.geo ? "customers abroad" : "other countries"}`,
  ];
}

function faq(c) {
  const { niche, fmt, pain, label } = c;
  const out = [];
  if (niche.trust >= 3 || (pain.type === "risk" && niche.trust >= 2)) {
    out.push("Is this professional advice? No. It's a tool and a checklist; confirm anything important with a qualified professional.");
  }
  if (DATA_FORMATS.has(fmt.id)) out.push("Is my data safe? It's used only to do the job, never to train models, and deleted on request.");
  if (fmt.kind === "product") out.push(`Isn't this just ChatGPT? It's the part ChatGPT can't do: tested on real problems ${label} have, and packaged so they don't have to figure it out.`);
  if (fmt.kind === "service") out.push("How fast is it? 48 hours from the moment you pay.");
  if (fmt.kind === "software") out.push("Do I need to be technical? No. Setup takes five minutes, and we'll do it with you on a call.");
  out.push("What if it doesn't work for me? Full refund within 14 days. No forms, no guilt trip.");
  return out.slice(0, 3);
}

const guarantee = (c) => (c.pain.type === "leak" ? "If it doesn't find at least its own price, it's free." : "14-day, no-questions refund.");

function acquisition(c) {
  const { g, niche, fmt, pain, h, vars } = c;
  const first = firstOf(c, { plain: true });
  if (niche.gentle) {
    return [
      `Partners first: ${cap(vars.ally)} already have their trust. ${cap(first)}.`,
      `Be findable: a plain, kind page that ranks for "${pain.noun.toLowerCase()} help", listed in ${vars.hang}.`,
      `Answer questions in ${vars.hang2} generously, without pitching.`,
      "Never cold-pitch people who are grieving or struggling. Referrals only.",
    ];
  }
  const rows = [
    `Outreach angle: "I'm giving 3 ${vars.label} a ${fmt.free} this week: it's built for anyone dealing with ${pain.thing}. Want one of the slots?"`,
    `Community: ${first}, then repeat it every week in ${vars.hang2}.`,
    `Direct: DM or email 20 ${vars.label} a day. Lead with the ${fmt.free}, never a pitch.`,
    `Content: a free "${pain.noun} checklist for ${vars.label}" shared in ${vars.hang3}, ending with the offer.`,
    `Partners: offer ${vars.ally} 20% of every sale they refer.`,
  ];
  if (g.d >= 1) {
    const usable = DEGEN.tactics.filter((t) => !fill(t, vars).includes("{"));
    rows.push(`Degen: ${fill(pickBy(usable, h + g.d + 1), vars)}. ${DEGEN.guardrail}`);
  }
  return rows;
}

function firstTen(c, offer) {
  const { g, niche, pain, fmt, vars } = c;
  const geo = vars.geo ? ` ${vars.geo}` : "";
  if (niche.gentle) {
    return [
      `List 20 of the ${vars.ally}${geo}.`,
      "Offer each of them the first 3 cases free for their clients.",
      "Deliver those cases with care, and ask permission to describe them anonymously.",
      "Turn them into a one-page explainer partners can hand over.",
      "Ask every partner who saw the work for a standing referral arrangement.",
      `List the service where people already look for help: ${vars.hang}.`,
      `Answer questions in ${vars.hang2} generously, without pitching.`,
      vars.moment ? `Make sure partners know you exist before ${vars.moment}.` : "Check in with every partner monthly. Referrals follow attention.",
      "Only when it feels right, ask a happy client whether someone they know could use it.",
      "Get customer 10 through the partner who refers most, and thank them properly.",
    ];
  }
  return [
    `List 30 ${vars.label}${geo} from ${vars.hang} and ${vars.hang2} in a spreadsheet.`,
    `Pick the 3 with the loudest problem and give each a ${fmt.free}.`,
    "Turn those 3 into before/after proof: screenshots, numbers, their words (with permission).",
    `${cap(firstOf(c, { plain: true }))}.`,
    `DM everyone who reacts: "Want the same? ${offer}. The first 10 get the founder price."`,
    "Close customers 1 to 3 in the DMs. Save calls for anyone who asks.",
    `Ask every buyer: "Who else do you know who's dealing with ${pain.thing}?"`,
    `Email 5 of the ${vars.ally} with a 20% referral offer.`,
    vars.moment ? `Time the next push for ${vars.moment}. Urgency is free.` : "Run a 72-hour founder-price deadline, and mean it.",
    "Get customer 10 on a 15-minute call. Write down every objection: they become the FAQ.",
  ].map((line) => (g.d >= 1 && line.startsWith("Close") ? `${line} Degen mode: the DMs can be funny, never misleading.` : line));
}

function planOf(c, mvp, domain) {
  const { g, niche, fmt, vars } = c;
  const days = niche.gentle ? PLAN.gentle : g.l === 3 ? PLAN.presell : PLAN[fmt.kind];
  return days.map((d) => fill(d, { ...vars, mvp, domain }));
}

function alternates(c, current) {
  const { g, h, vars } = c;
  const names = sourceOf(g).names.map((_, i) => baseName(c, i));
  if (!c.niche.gentle) names.push(fill(pickBy(DEGEN.names[2], h), vars));
  return [...new Set(names)].filter((n) => n !== current && !current.includes(n));
}

export function blueprint(genes, cur = "$") {
  const c = context(genes);
  const d = describe(genes, "¤");
  const { g, niche, fmt, pain, vars } = c;
  const mvp = mvpOf(c);
  const kind = fmt.kind;
  const stack = g.l ? LEAN_STACK[g.l][kind] : fmt.stack;
  const flow = g.l >= 2 ? LEAN_FLOW[g.l] : fmt.flow.map((x) => fill(x, vars));
  const brands = brandsOf(c);
  const domain = `${brands[0].toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
  const geo = vars.geo ? ` ${vars.geo}` : "";
  // The hyper-specific avatar: the sub-niche they flipped to, or the sharpest one on offer.
  const avatar = g.sub >= 0 || (c.steal && pain.who) || !niche.sub.length ? d.customer : `${pickBy(niche.sub, c.h)}${geo} ${niche.q}`;
  const sections = [
    {
      id: "name", title: "Product name", items: [
        { v: d.name },
        { k: "Brand options", v: brands.join(" · ") },
        { k: "Domain to check", v: domain },
        { k: "Also try", v: alternates(c, d.name).join(" · ") },
      ],
    },
    { id: "pitch", title: "One-line proposition", items: [{ v: d.prop }, { k: "Positioning", v: d.kicker }, { k: "In one breath", v: d.pitch }] },
    {
      id: "customer", title: "Target customer", items: [
        { k: "Avatar", v: cap(avatar) },
        { k: "Market", v: d.customer },
        { k: "Sharper wedges", v: niche.sub.filter((x) => x !== c.label).join(" · ") },
        { k: "Where they gather", v: c.hang.join(" · ") },
        { k: "When they buy", v: niche.when.join(" · ") },
        { k: "Who already serves them", v: cap(niche.ally) },
      ],
    },
    { id: "pricing", title: "Pricing model", items: tiers(c, d.offer) },
    {
      id: "landing", title: "Landing-page copy", items: [
        { k: "H1", v: fill(HEADLINES[pain.type], vars) },
        { k: "Subheadline", v: d.prop },
        { k: "Primary CTA", v: fill(fmt.cta, vars) },
        { k: "Body", v: d.pitch },
        { k: "Bullets", v: fmt.bullets.map((b) => fill(b, vars)) },
        { k: "Proof block", v: `Three before/after results from your first ${vars.frees}. Real numbers, real names (with permission).` },
        { k: "FAQ", v: faq(c) },
        { k: "Guarantee", v: guarantee(c) },
      ],
    },
    {
      id: "mvp", title: "MVP specification", items: [
        { k: "Minimum to collect payment", v: mvp },
        { k: "Fake it for now", v: FAKE_IT[kind] },
        { k: "Cut from v1", v: CUT[kind] },
        { k: "Pass/fail test", v: "3 paying customers within 7 days of launch, or mutate and reroll." },
        ...d.notes.filter((n) => n.startsWith("Reality")).map((v) => ({ k: "Compliance", v })),
      ],
    },
    { id: "stack", title: "Tech stack", items: [{ k: "Stack tier", v: stackTier(fmt, g.l) }, ...stack.map(([k, v]) => ({ k, v }))] },
    { id: "acquisition", title: "Acquisition plan", items: [{ v: acquisition(c) }] },
    { id: "first10", title: "First 10 customers", items: [{ v: firstTen(c, d.offer), ol: true }] },
    { id: "workflow", title: "Automation workflow", items: [{ v: flow, ol: true }] },
    {
      id: "offer", title: "Monetisation setup", items: [
        { k: "Platform", v: kind === "product" ? "Gumroad" : kind === "software" ? "Stripe Checkout (subscription)" : "Stripe Payment Link" },
        { k: "Checkout config", v: checkout(c, d.name) },
        { k: "Listing title", v: `${d.name}: ${vars.Result}` },
        { k: "Price", v: d.offer },
        { k: "Description", v: `${d.prop} ${guarantee(c)}` },
        { k: "What's included", v: fmt.deliver.map((x) => fill(x, vars)) },
        { k: "Delivery", v: kind === "product" ? "Instant download" : kind === "software" ? "Instant access after checkout" : "Within 48 hours, by email" },
        { k: "Upsell", v: kind === "software" ? "Annual plan: two months free" : c.p.rec ? `Monthly plan at ${vars.rec}/month` : `Done-for-you version at ${vars.premium}` },
        { k: "Refunds", v: "14 days, no questions." },
      ],
    },
    { id: "plan", title: "7-day plan", items: planOf(c, mvp.join(" + "), domain).map((v, i) => ({ k: `Day ${i + 1}`, v })) },
  ];
  return sections.map((s, i) => ({
    ...s,
    n: i + 1,
    items: s.items.map((it) => ({ ...it, v: finish(it.v, cur) })),
  }));
}

export function markdown(genes, { cur = "$", url = "" } = {}) {
  const d = describe(genes, cur);
  const lines = [
    `# ${d.name}`,
    "",
    `**${d.kicker}**`,
    "",
    `> ${d.pitch}`,
    "",
    `**${d.mode.emoji} ${d.mode.label}** · Machine score ${d.total}/100 (${d.rarity.label}) · Gen ${d.gen}`,
    "",
    "| Reality Scorecard | |",
    "|---|---|",
    ...d.scores.map((s) => `| ${s.label} | \`${s.bar}\` ${s.value}/5 |`),
    `| EST. MVP TIME | ${d.mvpTime} |`,
    `| EST. START COST | ${d.startCost} |`,
    "",
  ];
  if (d.stolen) lines.push(`**Stolen from:** ${d.stolen.source}, ${d.stolen.what}.`, "");
  for (const s of blueprint(genes, cur)) {
    lines.push(`## ${s.n}. ${s.title}`, "");
    for (const it of s.items) {
      if (Array.isArray(it.v)) {
        if (it.k) lines.push(`**${it.k}**`, "");
        it.v.forEach((x, i) => lines.push(it.ol ? `${i + 1}. ${x}` : `- ${x}`));
        lines.push("");
      } else {
        lines.push(it.k ? `**${it.k}:** ${it.v}` : it.v, "");
      }
    }
  }
  lines.push("---", `Generated by the Digital Renaissance Money Machine${url ? `. Reopen this idea: ${url}` : "."}`);
  return lines.join("\n");
}

// entries: [{ code, name, pitch }] (name and pitch are the saved fallback
// for ideas whose ids were later removed from the banks).
export function vaultText(entries, { cur = "$", date = "", linkFor = () => "", footer = [] } = {}) {
  const out = ["DIGITAL RENAISSANCE // MONEY MACHINE", "MY MONEY MACHINE VAULT", `Exported ${date} · ${entries.length} idea${entries.length === 1 ? "" : "s"}`, ""];
  entries.forEach((e, i) => {
    const genes = decode(e.code);
    if (!genes) {
      out.push(`${i + 1}. ${e.name} (retired from the machine)`, `   ${e.pitch}`, "");
      return;
    }
    const d = describe(genes, cur);
    out.push(
      `${i + 1}. ${d.name}  [${d.rarity.label} · ${d.total}/100 · ${d.mode.label}]`,
      `   ${d.pitch}`,
      `   Customer: ${d.customer}`,
      `   Offer: ${d.offer}`,
      `   MVP: ${d.mvp}`,
      `   First customer: ${d.first}`,
    );
    const link = linkFor(e.code);
    if (link) out.push(`   Reopen: ${link}`);
    out.push("");
  });
  if (footer.length) out.push("---", ...footer);
  return out.join("\n");
}

// ------------------------------------------------------- codes and stats

export function encode(g) {
  const opt = (x) => (x < 0 ? "" : String(x));
  return [g.m, g.n, g.p, g.f, g.v, opt(g.sub), opt(g.geo), opt(g.w), g.pr, g.l, g.d, g.g, g.r.toString(36)].join(".");
}

export function decode(code) {
  if (typeof code !== "string" || code.length > 200) return null;
  const parts = code.split(".");
  if (parts.length !== 13) return null;
  const [m, n, p, f, v, sub, geo, w, pr, l, d, gen, r] = parts;
  const num = (s, lo, hi) => (/^\d{1,4}$/.test(s) && +s >= lo && +s <= hi ? +s : NaN);
  const opt = (s, len) => (s === "" ? -1 : num(s, 0, len - 1));
  const rule = MODE_RULES[m];
  const niche = NICHE.get(n);
  if (!rule || !niche) return null;
  let names;
  if (rule.steal) {
    const model = MODEL.get(f);
    const target = model?.targets.find((t) => t.id === p);
    if (!target || target.niche !== n) return null;
    names = model.names;
  } else {
    const fmt = FORMAT.get(f);
    const pain = niche.pains.find((x) => x.id === p);
    if (!fmt || !pain || !fits(fmt, pain, niche)) return null;
    if (!rule.sets.includes(niche.set) || (rule.formats !== "all" && !rule.formats.includes(f))) return null;
    names = fmt.names;
  }
  const g = {
    m, n, p, f,
    v: num(v, 0, names.length - 1), sub: opt(sub, niche.sub.length), geo: opt(geo, GEOS.length), w: opt(w, niche.when.length),
    pr: num(pr, 0, 2), l: num(l, 0, 3), d: num(d, 0, 3), g: num(gen, 1, 9999),
    r: /^[0-9a-z]{1,7}$/.test(r) ? parseInt(r, 36) >>> 0 : NaN,
  };
  if (Object.values(g).some((x) => Number.isNaN(x))) return null;
  if (niche.gentle && g.d > 0) return null;
  return g;
}

// Distinct ideas a single spin can land on: the telemetry's IDEAS LOADED.
export function ideaSpace() {
  const seen = new Set();
  for (const byFormat of Object.values(COMBOS)) {
    for (const [f, list] of byFormat) for (const [n, p] of list) seen.add(`${f}|${n}|${p}`);
  }
  for (const model of MODELS) for (const t of model.targets) seen.add(`${model.id}|${t.niche}|${t.id}`);
  return { base: seen.size };
}

// Strips of words for the reels to spin through in a given mode.
export function reelPool(mode) {
  const rule = MODE_RULES[mode];
  if (rule.steal) {
    return [
      MODELS.map((m) => m.reel),
      [...new Set(MODELS.flatMap((m) => m.targets.map((t) => NICHE.get(t.niche).reel)))],
      MODELS.flatMap((m) => m.targets.map((t) => t.noun.toUpperCase())),
    ];
  }
  const byFormat = COMBOS[mode];
  const niches = new Set(), pains = new Set();
  for (const list of byFormat.values()) {
    for (const [n, p] of list) {
      const niche = NICHE.get(n);
      niches.add(niche.reel);
      pains.add(niche.pains.find((x) => x.id === p).reel);
    }
  }
  return [[...byFormat.keys()].map((f) => FORMAT.get(f).reel), [...niches], [...pains]];
}

export { MODES };
