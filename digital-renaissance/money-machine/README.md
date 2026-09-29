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
| `../site/money-machine/index.html` | Page and CSS: the arcade-terminal look, the glass blueprint window. No build step. |
| `../site/money-machine/app.js` | Controller: modes, the spin and reveal, vault, share, export, sound. |
| `../site/money-machine/engine.js` | Pure idea engine: spin, mutations, scorecard, blueprint, codes. No DOM. |
| `../site/money-machine/banks.js` | Everything the machine can say: modes, niches, formats, stolen models. |
| `../site/money-machine/stage3d.js` | three.js stage: loads the model, paints the reels, drag-to-tilt, the live spin. |
| `../site/money-machine/money-machine.glb` | The rigged slot machine (built by `build-glb.js`). |
| `../site/money-machine/reveal.webm`, `reveal.mp4` | The pre-rendered spin and reveal, in VP9 and H.264 (built by `render-reveal.js`). |
| `../site/money-machine/reveal-timing.js` | When the video's reels stop and its flare hits (written with the video). |
| `engine.test.js` | `node --test` suite for the engine and banks. |
| `build-glb.js` | Builds the GLB from parts with three.js + GLTFExporter. |
| `render-reveal.js` | Renders the reveal video from the page's own stage, frame by frame. |

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

# Re-render the reveal video after changing the model or stage3d.js
# (Chromium with WebGL, software rendering is fine; ffmpeg with libx264)
CHROMIUM=/path/to/chrome FFMPEG=/path/to/ffmpeg npm run render:video
```

three.js loads from jsDelivr, pinned to `three@0.186.1` in the page's import
map, and `build-glb.js` uses the same version. If WebGL, the CDN or the model
is unavailable, the page falls back to flat CSS reels and everything else
still works. Fonts come from Google Fonts (JetBrains Mono, with a system
monospace fallback).

**Embedding.** A sandboxed copy (the claude.ai preview, an iframe on another
site) sets `window.MONEY_MACHINE_EMBED = { shareBase, glb }` before `app.js`
loads. Download buttons are hidden and the vault copies to the clipboard.
Share links start with `shareBase`, and `glb` can hold the model's bytes
where a `.glb` file can't be served.

## The spin: a hybrid of live 3D and a rendered video

- **Idle:** the machine is live WebGL. Drag tilts it (it springs back when you
  let go, like drei's PresentationControls); tapping the lever, the spin
  button or the reels pulls the lever.
- **SPIN:** the canvas squares the machine up and crossfades to the reveal
  video (VP9 where the browser has it, H.264 otherwise), a render of the
  same machine from the same camera: lever
  pull, motion-blurred reels, staggered stops on `$ $ $`, a light flare and a
  punch through the payline into black. The page plays the reel sounds and
  fills the formula box from `reveal-timing.js`, and at the flare prints the
  idea over the video with `mix-blend-mode: screen`, so the flare lights the
  words. Then it hands back to the live machine, now showing the idea's words
  on its reels.
- **Fallback:** if the video can't start within 1.5 s, or the visitor prefers
  reduced motion, the live reels spin instead and the same words appear over
  a CSS flash and streak.

The video is square and shown with `object-fit: contain` on black; the live
camera widens its field of view on narrow screens by the same factor, so the
machine sits in the same place in both. `render-reveal.js` runs
`stage3d.js` in headless Chromium on a manual clock (`createStage({ manual:
true })` and `renderAt(ms)`), averages two sub-frames per frame for motion
blur, and bakes in the flash, streak and fade, which are DOM layers driven
from the same clock.

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

- 🎰 JACKPOT takes the best of 8 draws, weighting the scorecard and the customer's wallet (high-leverage systems for lucrative niches).
- 💰 CASH NOW takes the easiest first customer of 3 draws, from formats you can sell this week (done-for-you services, audits, installs, template kits).
- 💀 DEGEN draws weird-but-reachable niches and starts at degen level 1.
- ☠️ BLACK SHEEP draws only unglamorous or uncomfortable niches.
- 🤖 AI MODE and 📦 DIGITAL PRODUCTS restrict the formats.
- 🕵️ STEAL LIKE AN ENGINEER re-aims a proven model at a micro-niche: Carfax, Calendly, Duolingo… and big SaaS scaled down ("Salesforce, but exclusively for mobile dog groomers").

**Operations** return new genes and never mutate:

- MUTATE keeps the mechanism (the same format and kind of problem, or the same stolen model) and flips the audience, landing on one sharp sub-niche of it: freelancers → plumbers. Only when there is nowhere to flip does it narrow, reprice or pivot instead.
- MAKE IT CHEAPER walks the stack down a ladder: the format's own build (a custom SaaS, say) → Make.com + a Tally form → a Notion template run by hand → a presale that builds nothing (3 levels).
- MAKE IT DEGENERATE has 3 levels. It refuses `gentle` niches (grief, care, divorce, HR menopause), and a degenerate idea never flips onto one.

**Positioning.** Generated copy never says "AI": ideas are positioned as
Intelligent Automation or Systems Infrastructure. Each format carries a
positioning line (`sys`, e.g. "INTELLIGENT AUTOMATION: NEWSLETTER
INFRASTRUCTURE"), an "X for Y" mechanism for the one-line proposition, the
stack tier CHEAPER starts from, and a two-tier price. The test suite fails
if "AI" appears anywhere in a card or blueprint (the mode's own name aside).

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
< 85 ≤ EPIC < 95 ≤ JACKPOT. Jackpots are rare on a plain spin, so MUTATE and
MAKE IT CHEAPER are how you climb.

Telemetry numbers are real: IDEAS LOADED is the number of distinct ideas a
spin can land on (1,361).

### The blueprint

Twelve sections, in this order: product name (with 2–3 word brand options
like ReceiptOps and a domain to check), one-line proposition ("X for Y"),
target customer (a hyper-specific avatar), pricing model (low-barrier entry +
recurring backend), landing-page copy (H1, subheadline, primary CTA), MVP
specification, tech stack, acquisition plan (channel and exact outreach
angle), first 10 customers, automation workflow, monetisation setup (the exact
Stripe or Gumroad configuration) and a 7-day plan from buying the domain to
the launch post.

## Adding content

Add niches, pains, formats or stolen models in `banks.js`, then run
`npm test`. The suite renders every base idea and every operation variant,
and fails on any unfilled `{placeholder}` or any "AI" in generated copy. Pain
fields are phrased to slot into templates (`task` and `result` are bare verb
phrases). Add `find` when `thing` is a situation rather than something an
audit can find, and `aim` to a stolen model's target when the niche's own
label isn't who it's for.

## Reverse-engineering notes

- **copyflight.com/game** (behind a bot check, so studied through its vault
  export and its 697-idea PDF): one-line ideas, a vault you export as `.txt`,
  and a UTM-tagged link to the full list at the bottom. We kept the vault →
  export → upsell loop (pointing at the Digital Renaissance Gumroad). The
  PDF's titles are mostly mechanisms ("AI for supply chain visibility",
  "wedding vow writing", "law firm marketing"); those mechanisms seeded the
  niches added after the first release (coffee roasters, nutritionists, law
  firms, physio clinics, job seekers, family historians, craft breweries,
  engaged couples, club promoters, waste sites, couriers, importers), each
  written out with a paying customer, a price and a plan. No titles are
  copied.
- **Meshy "Slot Machine Mini"** (CC0) was the silhouette reference: cabinet,
  striped sides, marquee, reel window, side lever, coin tray, beacon. AI-made
  meshes are one fused shell with baked reels, so the model here is rebuilt
  from parts with its own reel and lever pivots, finished in chrome, black
  and cyan/green neon with the glow baked into emissive materials.
- **The reveal video we were sent** is a VideoHive template preview. It
  carries Envato/VideoHive branding (its logo reveal is the Envato leaf) and
  is not licensed for reuse, so it isn't shipped, and trimming it wouldn't
  change that. The reveal video here is an original render of our own
  machine that follows the same choreography. A licensed render could replace
  it: keep the file names and write a matching `reveal-timing.js`.
- **The PRD's Phase 1 stack** was React/Next.js, Tailwind and React Three
  Fiber. The page stays plain HTML/JS with three.js directly, so it keeps
  deploying with the rest of the site with no build step; the pieces map one
  to one (the banks are the client-side JSON database, the drag-to-tilt is
  PresentationControls).
- **The v1 prototype** (three.js + trimesh GLB, 10 hard-coded ideas) is
  superseded. Its model had no normals, UVs or pivots, so its reels could
  neither show words nor spin in place.

## What plugs in next

The seams are deliberate; none of these exist yet.

- **AI generation**: replace or enrich `blueprint(genes)` with a call that
  takes the same genes and returns the same 12 sections. `engine.js` has no
  DOM, so it can run inside a serverless function.
- **Accounts and a synced vault**: the vault is `localStorage` behind
  `store.get/set` in `app.js`; point those two at an API (Supabase).
- **Paid credits, Gumroad/Stripe**: gate `openBlueprint()` or AI calls (the
  PRD's paywall for AI MODE and DEGEN); the vault export already carries the
  Gumroad link.
- **Affiliate offers**: each format's `stack` lists the tools a buyer would
  sign up for; that's where affiliate links attach.
- **Autonomous builder**: the blueprint's automation workflow and checkout
  config are the spec an n8n or Make webhook would provision.
