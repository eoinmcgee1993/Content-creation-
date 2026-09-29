import assert from "node:assert/strict";
import test from "node:test";
import { FORMATS, MODE_RULES, MODELS, NICHES } from "../site/money-machine/banks.js";
import {
  MODES, blueprint, cheaper, decode, degenerate, describe, encode, ideaSpace, markdown, mutate, reelPool, spin, vaultText,
} from "../site/money-machine/engine.js";

const MODE_IDS = MODES.map((m) => m.id);
const NICHE = new Map(NICHES.map((n) => [n.id, n]));
const fits = (f, p, n) => !f.stealOnly && !(f.minWallet && n.wallet < f.minWallet) && !(f.noGentle && n.gentle)
  && (f.needs ? Boolean(p[f.needs]) : f.fits.includes(p.type));

// Every idea a spin can produce, restated from the rules in banks.js.
function baseIdeas() {
  const out = [];
  const blank = { v: 0, sub: -1, geo: -1, w: -1, pr: 0, l: 0, d: 0, g: 1, r: 12345 };
  for (const [m, rule] of Object.entries(MODE_RULES)) {
    if (rule.steal) {
      for (const model of MODELS) for (const t of model.targets) out.push({ m, n: t.niche, p: t.id, f: model.id, ...blank });
      continue;
    }
    for (const f of FORMATS) {
      if (rule.formats !== "all" && !rule.formats.includes(f.id)) continue;
      for (const n of NICHES) {
        if (!rule.sets.includes(n.set)) continue;
        for (const p of n.pains) if (fits(f, p, n)) out.push({ m, n: n.id, p: p.id, f: f.id, ...blank, d: rule.degen || 0 });
      }
    }
  }
  return out;
}

// Generated copy is positioned as Intelligent Automation / Systems
// Infrastructure and never says "AI" (the mode's own name aside).
function assertNoAI(value, where) {
  const text = JSON.stringify(value);
  const at = text.search(/\bAI\b/);
  assert.ok(at < 0, `"AI" in ${where}: ${text.slice(Math.max(0, at - 60), at + 20)}`);
}

// Strings a user sees must never leak template syntax or the raw currency mark.
function assertClean(value, where) {
  const text = JSON.stringify(value);
  const hole = text.search(/\{\w+\}/);
  assert.ok(hole < 0, `unfilled placeholder in ${where}: ${text.slice(Math.max(0, hole - 60), hole + 20)}`);
  assert.ok(!text.includes("¤"), `raw currency mark in ${where}`);
  assert.ok(!text.includes("undefined") && !text.includes("NaN"), `undefined/NaN in ${where}`);
}

test("the user's receipt example reproduces, positioned as Intelligent Automation", () => {
  const g = decode("ai.freelancers.receipt.detective.0....0.0.0.1.1");
  const d = describe(g, "€");
  assert.equal(d.name, "Receipt Detective");
  assert.equal(d.kicker, "INTELLIGENT AUTOMATION: RECEIPT AUDIT INFRASTRUCTURE");
  assert.equal(d.prop, "Automated receipt audit infrastructure for freelancers earning €30k+.");
  assert.match(d.pitch, /^Find forgotten expenses, zombie subscriptions and missed deductions hiding in freelancers'/);
  assert.equal(d.customer, "freelancers earning €30k+");
  assert.equal(d.offer, "€19 audit + €9/month monitoring");
  assert.equal(d.mvp, "landing page + upload form + automated analysis");
  assert.match(d.first, /^post 3 before\/after examples in /);
  assert.deepEqual(Object.fromEntries(d.scores.map((s) => [s.key, s.value])), { fcd: 2, build: 2, cost: 1, clar: 4, auto: 5 });
  assert.equal(d.scores[0].bar, "██░░░");
  assert.equal(d.mvpTime, "4 HOURS");
  assert.equal(d.startCost, "€0–€25");
});

test("every base idea in every mode renders a clean card and blueprint", () => {
  const ideas = baseIdeas();
  assert.ok(ideas.length > 1000, `only ${ideas.length} base ideas`);
  for (const g of ideas) {
    const where = encode(g);
    const d = describe(g, "$");
    for (const k of ["name", "pitch", "customer", "offer", "mvp", "first"]) assert.ok(d[k].length > 3, `${k} empty in ${where}`);
    assertClean(d, where);
    const bp = blueprint(g, "$");
    assert.equal(bp.length, 12);
    assertClean(bp, `${where} blueprint`);
    assertNoAI({ ...d, mode: null }, where);
    assertNoAI(bp, `${where} blueprint`);
  }
});

test("variants reached by every operation stay clean", () => {
  const variants = [
    { sub: 0, geo: 1, w: 0 }, { pr: 1 }, { pr: 2 }, { l: 1 }, { l: 2 }, { l: 3, pr: 1 }, { d: 1 }, { d: 2, l: 3 }, { d: 3, sub: 0 },
  ];
  for (const base of baseIdeas()) {
    const niche = NICHE.get(base.n);
    for (const v of variants) {
      const g = { ...base, ...v };
      if (niche.gentle && g.d > 0) continue;
      if (g.sub >= niche.sub.length || g.w >= niche.when.length) continue;
      assertClean(describe(g, "£"), encode(g));
      assertClean(blueprint(g, "£"), `${encode(g)} blueprint`);
    }
  }
});

test("blueprint sections follow the 12-part build list in order", () => {
  const titles = blueprint(spin("jackpot", 7)).map((s) => s.title);
  assert.deepEqual(titles, [
    "Product name", "One-line proposition", "Target customer", "Pricing model", "Landing-page copy", "MVP specification",
    "Tech stack", "Acquisition plan", "First 10 customers", "Automation workflow", "Monetisation setup", "7-day plan",
  ]);
  const md = markdown(spin("digital", 3), { cur: "$", url: "https://example.test/#code" });
  for (let i = 1; i <= 12; i++) assert.match(md, new RegExp(`^## ${i}\\. `, "m"));
  assert.match(md, /Reopen this idea: https:\/\/example\.test\/#code/);
});

test("spins are deterministic, varied, and respect each mode's rules", () => {
  for (const mode of MODE_IDS) {
    assert.deepEqual(spin(mode, 99), spin(mode, 99));
    const seen = new Set();
    for (let s = 1; s <= 200; s++) {
      const g = spin(mode, s * 2654435761);
      seen.add(`${g.n}|${g.p}|${g.f}`);
      const niche = NICHE.get(g.n);
      const rule = MODE_RULES[mode];
      if (rule.steal) {
        assert.ok(describe(g).stolen, "steal ideas cite the model they copy");
      } else {
        assert.ok(rule.sets.includes(niche.set), `${mode} drew a ${niche.set} niche`);
        if (rule.formats !== "all") assert.ok(rule.formats.includes(g.f), `${mode} drew format ${g.f}`);
      }
      assert.equal(g.d, rule.degen || 0);
    }
    assert.ok(seen.size >= (mode === "steal" ? 30 : 60), `${mode} only produced ${seen.size} distinct ideas in 200 spins`);
  }
});

test("codes round-trip through every operation", () => {
  for (const mode of MODE_IDS) {
    let g = spin(mode, 4242);
    for (const op of [mutate, cheaper, degenerate, mutate, mutate, cheaper, degenerate, mutate, mutate, mutate]) {
      g = op(g).genes;
      assert.deepEqual(decode(encode(g)), g);
    }
  }
});

test("decode rejects tampered and malformed codes", () => {
  const good = encode(spin("cash", 1));
  assert.ok(decode(good));
  for (const bad of [
    "", "x", `${good}.1`, good.replace(/^cash/, "nope"), good.replace(/\.[0-9a-z]+$/, ".!!"),
    "ai.freelancers.receipt.nosuchformat.0....0.0.0.1.1",
    "ai.freelancers.receipt.detective.9....0.0.0.1.1", // name variant out of range
    "ai.freelancers.receipt.detective.0.99...0.0.0.1.1", // sub-niche out of range
    "ai.freelancers.receipt.detective.0....0.4.0.1.1", // lean above 3
    "cash.freelancers.receipt.api.0....0.0.0.1.1", // api isn't a CASH NOW format
    "degen.freelancers.receipt.detective.0....0.0.1.1.1", // freelancers aren't a DEGEN niche
    "sheep.bereaved.accounts.concierge.0....0.0.2.1.1", // grief is never made degenerate
    "steal.vanlife.guitar.carfax.0....0.0.0.1.1", // target belongs to another niche
    "ai.bereaved.legacy.api.0....0.0.0.1.1", // no APIs for grieving families
    null, 42,
  ]) assert.equal(decode(bad), null, `accepted ${bad}`);
});

test("MAKE IT CHEAPER downgrades the stack, lowering cost and build until it hits the floor", () => {
  const notes = [];
  let s = decode("ai.freelancers.invoice.saas.0....0.0.0.1.1");
  for (let i = 0; i < 3; i++) {
    const r = cheaper(s);
    notes.push(r.note);
    s = r.genes;
  }
  assert.deepEqual(notes, [
    "STACK DOWNGRADED: CUSTOM SAAS → MAKE.COM + TALLY FORM",
    "STACK DOWNGRADED: MAKE.COM + TALLY FORM → NOTION TEMPLATE + YOU",
    "STACK DOWNGRADED: NOTION TEMPLATE + YOU → STRIPE LINK PRESALE",
  ]);
  assert.equal(blueprint(s).find((x) => x.id === "stack").items[0].v, "STRIPE LINK PRESALE");

  let g = spin("ai", 31337);
  let prev = describe(g).scores;
  for (let i = 1; i <= 3; i++) {
    const r = cheaper(g);
    assert.ok(!r.maxed);
    assert.match(r.note, /^STACK DOWNGRADED: /);
    g = r.genes;
    const now = describe(g).scores;
    assert.ok(now[1].value <= prev[1].value && now[2].value <= prev[2].value, "build and cost never rise");
    prev = now;
  }
  const last = cheaper(g);
  assert.ok(last.maxed);
  assert.equal(last.genes, g);
  assert.match(describe(g).mvp, /Stripe Payment Link/);
  assert.match(describe(g).offer, /presold at 50% off/);
});

test("MAKE IT DEGENERATE caps at level 3 and refuses gentle niches", () => {
  let g = spin("jackpot", 5);
  if (NICHE.get(g.n).gentle) g = spin("ai", 6);
  for (let i = 1; i <= 3; i++) g = degenerate(g).genes;
  assert.equal(g.d, 3);
  assert.ok(degenerate(g).maxed);
  assert.ok(describe(g).notes.some((n) => n.startsWith("Degen guardrail")));

  const grief = decode("sheep.bereaved.accounts.concierge.0....0.0.0.1.1");
  const r = degenerate(grief);
  assert.ok(r.refused);
  assert.equal(r.genes, grief);
});

test("MUTATE keeps the mechanism and flips the audience", () => {
  let flips = 0, total = 0;
  for (const mode of MODE_IDS) {
    for (let s = 1; s <= 60; s++) {
      const g = spin(mode, s * 7919);
      const r = mutate(g);
      total += 1;
      if (!r.note.startsWith("AUDIENCE FLIPPED: ")) continue;
      flips += 1;
      assert.equal(r.genes.f, g.f, "same format or stolen model");
      assert.equal(r.genes.m, g.m);
      assert.notEqual(r.genes.n, g.n, `${encode(g)} kept its niche`);
      if (mode !== "steal") {
        const type = (n, p) => NICHE.get(n).pains.find((x) => x.id === p).type;
        const fmt = FORMATS.find((f) => f.id === g.f);
        if (!fmt.needs) assert.equal(type(r.genes.n, r.genes.p), type(g.n, g.p), "same kind of problem");
      }
      assert.equal(r.genes.g, g.g + 1);
    }
  }
  assert.ok(flips / total > 0.9, `only ${flips}/${total} mutations flipped the audience`);

  // The PRD's own example: freelancers -> plumbers, same receipt-style audit.
  const receipt = decode("ai.freelancers.receipt.detective.0....0.0.0.1.1");
  const plumbers = Array.from({ length: 3000 }, (_, r) => mutate({ ...receipt, r: r + 1 })).find((x) => x.note === "AUDIENCE FLIPPED: FREELANCERS → PLUMBERS");
  assert.ok(plumbers, "freelancers never flipped to plumbers");
  assert.equal(describe(plumbers.genes).customer, "plumbers running a 1–5 person crew");
  assert.equal(plumbers.genes.f, "detective");
});

test("the PRD's mode examples are on the reels", () => {
  const cases = {
    "jackpot.roasters.supply.saas.0....0.0.0.1.1": [/supply chain/i, /boutique coffee roasters/],
    "degen.situationships.breakup.prompts.0....0.0.1.1.1": [/BREAKUP TEXT/, /college students/],
    "cash.realtors.newsletter.workflow.0....0.0.0.1.1": [/^INTELLIGENT AUTOMATION: NEWSLETTER INFRASTRUCTURE$/, /estate agents/],
    "steal.groomers.mobilegroom.salesforce.0....0.0.0.1.1": [/^SALESFORCE, BUT EXCLUSIVELY FOR MOBILE DOG GROOMERS$/, /mobile dog groomers/],
    "sheep.wastesites.returns.watchdog.0....0.0.0.1.1": [/COMPLIANCE/, /waste-site operators/],
  };
  for (const [code, [kicker, who]] of Object.entries(cases)) {
    const g = decode(code);
    assert.ok(g, `${code} no longer decodes`);
    const d = describe(g);
    assert.match(d.kicker, kicker);
    assert.match(d.prop, who);
  }
});

test("the blueprint names the brand, two price tiers, and a week from domain to launch post", () => {
  for (const mode of MODE_IDS) {
    for (let s = 1; s <= 25; s++) {
      const g = spin(mode, s * 104729);
      const bp = Object.fromEntries(blueprint(g).map((x) => [x.id, x]));
      const brands = bp.name.items.find((i) => i.k === "Brand options").v.split(" · ");
      for (const b of brands) assert.ok(b.split(" ").length <= 3, `brand "${b}" is more than three words`);
      const domain = bp.name.items.find((i) => i.k === "Domain to check").v;
      assert.match(domain, /^[a-z0-9]+\.com$/);
      const keys = bp.pricing.items.map((i) => i.k);
      assert.ok(keys.includes("Tier 1 · Entry") && keys.includes("Tier 2 · Recurring backend"));
      const landing = bp.landing.items.map((i) => i.k);
      for (const k of ["H1", "Subheadline", "Primary CTA"]) assert.ok(landing.includes(k), `landing copy has no ${k}`);
      const days = bp.plan.items.map((i) => i.v);
      assert.equal(days.length, 7);
      assert.ok(days[0].startsWith(`Buy ${domain}`), `day 1 is not the domain: ${days[0]}`);
      assert.match(days[6], /launch post/);
    }
  }
});

test("DEGEN mode starts degenerate; STEAL cites the source model", () => {
  const d = describe(spin("degen", 77));
  assert.equal(d.degen, 1);
  const s = describe(spin("steal", 77));
  assert.ok(s.stolen.source && s.stolen.what);
  assert.equal(s.reels[0].label, "STOLEN MODEL");
});

test("rarity is honest: jackpots are rare on a plain spin", () => {
  const ideas = baseIdeas();
  const share = ideas.filter((g) => describe(g).rarity.id === "jackpot").length / ideas.length;
  assert.ok(share > 0 && share < 0.1, `jackpot share ${share}`);
});

test("vault export lists ideas, links and the footer, and survives retired ideas", () => {
  const a = spin("ai", 1), b = spin("sheep", 2);
  const text = vaultText(
    [{ code: encode(a) }, { code: encode(b) }, { code: "ai.gone.gone.gone.0....0.0.0.1.1", name: "Old Idea", pitch: "It was good." }],
    { cur: "$", date: "28 Sep 2026", linkFor: (c) => `https://x.test/#${c}`, footer: ["Spin your own: https://x.test/"] },
  );
  assert.match(text, /MY MONEY MACHINE VAULT/);
  assert.ok(text.includes(describe(a).name) && text.includes(describe(b).name));
  assert.match(text, /3\. Old Idea \(retired from the machine\)/);
  assert.match(text, /Reopen: https:\/\/x\.test\/#ai\./);
  assert.match(text, /Spin your own/);
});

test("telemetry numbers are real", () => {
  const { base } = ideaSpace();
  assert.equal(base, new Set(baseIdeas().map((g) => `${g.f}|${g.n}|${g.p}`)).size);
  for (const mode of MODE_IDS) for (const strip of reelPool(mode)) assert.ok(strip.length >= 3);
});
