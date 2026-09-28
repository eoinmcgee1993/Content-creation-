# Money Machine

A slot machine for business ideas, published with the Digital Renaissance site
at `/money-machine/`. Every spin lands a weird but commercially plausible
opportunity with a customer, an offer, an MVP, a first-customer tactic and a
Reality Scorecard. MAKE IT REAL turns it into a 12-part execution blueprint.

```
SPIN → DISCOVER → MUTATE → BUILD → CASH
```

The slot machine is the front door, not the product. The product is the
blueprint, and the engine behind it is built to be swapped for AI generation
later without touching the page.

## Where things live

| Path | What it is |
|---|---|
| `../site/money-machine/index.html` | Page, CSS, reveal overlay. No build step. |
| `../site/money-machine/app.js` | Controller: modes, spin flow, reveal, vault, share, export, sound. |
| `../site/money-machine/engine.js` | Pure idea engine: spin, mutations, scorecard, blueprint, codes. No DOM. |
| `../site/money-machine/banks.js` | Everything the machine can say: modes, niches, formats, stolen models. |
| `../site/money-machine/stage3d.js` | three.js stage: loads the model, paints reels, runs the choreography. |
| `../site/money-machine/money-machine.glb` | The rigged slot machine (built by `build-glb.js`). |
| `engine.test.js` | `node --test` suite for the engine and banks. |
| `build-glb.js` | Builds the GLB from parts with three.js + GLTFExporter. |

`site/` deploys to Netlify through `.github/workflows/deploy.yml` on every push
to `main` that touches `digital-renaissance/site/**`. This folder is not
published.

## Commands

```bash
# Tests (no install needed)
cd digital-renaissance/money-machine && npm test

# Run the page: ES modules don't load from file://
python3 -m http.server 8080 -d digital-renaissance/site
# then open http://localhost:8080/money-machine/

# Rebuild the 3D model after editing build-glb.js
npm install && npm run build:glb
```

three.js loads from jsDelivr, pinned to `three@0.186.1` in the page's import
map, and `build-glb.js` uses the same version. If WebGL, the CDN or the model
is unavailable, the page falls back to flat CSS reels and everything else
still works.

## How an idea is made

An idea is a small set of **genes**: mode, niche, pain, format (or stolen
model), name variant, sub-niche, market, trigger, pricing variant, lean level,
degen level, generation and an RNG seed. Everything on screen (card,
scorecard, blueprint, markdown, vault text) is derived from the genes, so a
share link or vault entry stores only the code, e.g.
`ai.freelancers.receipt.detective.0....0.0.0.1.1`.

Codes hold ids and list positions, so **treat the banks as append-only**.
Renaming an id or reordering a `sub`, `when` or `GEOS` list changes what old
links open. A code that no longer decodes shows as "retired" in the vault
export.

**Modes** (`MODE_RULES` in `banks.js`) choose which niche sets and formats a
spin can draw from, and how it picks:

- 🎰 JACKPOT takes the best of 8 draws, weighting the scorecard and the customer's wallet.
- 💰 CASH NOW takes the easiest first customer of 3 draws, from formats you can sell this week (done-for-you services, audits, installs, template kits).
- 💀 DEGEN draws weird-but-reachable niches and starts at degen level 1.
- ☠️ BLACK SHEEP draws only uncomfortable niches.
- 🤖 AI MODE and 📦 DIGITAL PRODUCTS restrict the formats.
- 🕵️ STEAL LIKE AN ENGINEER re-aims a proven model (Carfax, Calendly, Duolingo…) at a new niche.

**Operations** return new genes and never mutate:

- MUTATE narrows first (sub-niche, trigger moment, market), then flips pricing or pivots the format.
- MAKE IT CHEAPER goes no-code, then Wizard-of-Oz, then presell (3 levels).
- MAKE IT DEGENERATE has 3 levels. It refuses `gentle` niches (grief, care, divorce, HR menopause).

### The Reality Scorecard

Each row is 1–5 with a reason written from the inputs, not a template score:

| Row | From |
|---|---|
| First-customer difficulty | `6 − niche.reach` + format barrier, +1 each for big wallets, regulated buyers and premium pricing, −1 each for a narrower customer, a trigger moment, a local market (local niches), pay-when-it-works pricing and degen marketing |
| Build complexity | format base − lean level |
| Startup cost | format base (+1 regulated) − lean level |
| Monetisation clarity | format base, −1 for pay-when-it-works, −1 from degen level 2 |
| Automation potential | format base, −1 per lean level past no-code |

Machine score = `5 × [(5 − difficulty) + (5 − build) + (5 − cost) +
(clarity − 1) + (automation − 1)]`, from 0 to 100. Rarity: COMMON < 75 ≤ RARE
< 85 ≤ EPIC < 95 ≤ JACKPOT. About 2% of base ideas are jackpots (5% of
JACKPOT-mode spins), so MUTATE and MAKE IT CHEAPER are how you climb.

Telemetry numbers are real: IDEAS LOADED is the number of distinct spins
(1,134) and MUTATIONS is the number of variants reachable from them.

## Adding content

Add niches, pains, formats or stolen models in `banks.js`, then run
`npm test`. The suite renders every base idea and every operation variant,
and fails on any unfilled `{placeholder}`. Pain fields are phrased to slot
into templates (`task` and `result` are bare verb phrases). Add `find` when
`thing` is a situation rather than something an audit can find.

## Reverse-engineering notes

- **copyflight.com/game** (behind a bot check, so studied through its vault
  export and its 697-idea PDF): one-line ideas, a vault you export as `.txt`,
  and a UTM-tagged link to the full list at the bottom. 87% of its titles are
  "AI for X" / "AI-Powered X", with no customer, price or plan. We kept the
  vault → export → upsell loop (pointing at the Digital Renaissance Gumroad).
  We replaced the idea list with 1,134 fully specified, scored ones.
- **Meshy "Slot Machine Mini"** (CC0) was the silhouette reference: gold
  cabinet, black striped sides, marquee, reel window, side lever, coin tray,
  red beacon. AI-generated meshes are one fused shell with baked reels, so
  the model here is rebuilt from parts with its own reel and lever pivots.
- **The reveal video** is a VideoHive slot-machine logo-reveal template
  preview. It carries Envato/VideoHive branding and placeholder logos and is
  not licensed for reuse, so it isn't shipped. Its choreography is rebuilt
  natively instead: reels stop one by one, flash, horizontal light streak
  while the camera punches through the payline, then the name alone on black
  with one line under it. A licensed render could replace the overlay later.
- **The v1 prototype** (three.js + trimesh GLB, 10 hard-coded ideas) is
  superseded. Its model had no normals, UVs or pivots, so its reels could
  neither show words nor spin in place.

## What plugs in next

The seams are deliberate; none of these exist yet.

- **AI generation**: replace or enrich `blueprint(genes)` with a call that
  takes the same genes and returns the same 12 sections. `engine.js` has no
  DOM, so it can run inside a serverless function.
- **Accounts and a synced vault**: the vault is `localStorage` behind
  `store.get/set` in `app.js`; point those two at an API.
- **Paid credits, Gumroad/Stripe**: gate `openBlueprint()` or AI calls; the
  vault export already carries the Gumroad link.
- **Affiliate offers**: each format's `stack` lists the tools a buyer would
  sign up for; that's where affiliate links attach.
