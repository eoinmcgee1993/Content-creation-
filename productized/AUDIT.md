# Code asset audit — what's actually sellable in this repo

**Scope:** every project directory in this monorepo, plus `git log --since="60 days ago"`
(2026-07-13 → 2026-09-10, 135 commits total). **Goal:** find working code — not
info-products, not ebooks, not prompt packs — mature enough to sell as a
developer asset on its own. **Bar:** ≥70% functional, meaning it runs, does the
thing, and isn't a stub with a README describing intent.

This repo holds ~25 unrelated side projects at wildly different stages. Most of
them are early scaffolding. Two are not. The commit history makes the gap
obvious before you even read the code:

| Area | Commits, last 60 days | Share of repo activity |
|---|---:|---:|
| **CRF storefront** (`supabase/functions/`, `crf-builder/`, `supabase/migrations/`, `docs/crf/`) | **32** | 24% |
| digital-renaissance | 6 | 4% |
| kdp-compiler | 3 | 2% |
| n8n-workflows, clearmark, plugins, offload, landing | 1 each | <1% each |
| audits, gridstrike-core, trading, trading-dashboard | 0 | — |

One project got nearly a quarter of all engineering attention in two months,
almost all of it hardening passes, not new features. That's the tell. Everything
below is graded against what it actually does, not what its README claims.

---

## Verdict

1. **Micro-SaaS / API Wrapper → the CRF order-fulfillment backend.** A
   Stripe-to-Supabase digital-fulfillment engine with no server to run,
   security-reviewed across ~10 dedicated hardening commits, and **live in
   production on real, live-mode Stripe payments** right now. This is the
   asset. Fully packaged below.
2. **Developer/Automation Template → the n8n pipeline pack.** Three
   non-trivial AI-agent automation graphs (76 nodes combined) plus a shared
   Postgres schema. Real, but shipped once and never iterated — see caveats.
   Grouped and scoped below; not fully packaged this round.

---

## Asset 1 — Micro-SaaS / API Wrapper: the fulfillment backend

**What it is.** A pattern, not a niche product: sell a digital file (or gate
any per-order state change) through Stripe, with Supabase Postgres + Edge
Functions doing 100% of the trusted work and a static HTML page doing 0% of
it. No Express server, no cron, no queue, nothing to patch at 2am.

**Source files (repo-current):**

```
supabase/functions/stripe-webhook/index.ts        HMAC-verified Stripe webhook receiver
supabase/functions/kit-download/index.ts          token-gated file release, paid-only
supabase/functions/apparel-approval/index.ts       token-gated state machine, one-way approval
supabase/functions/create-apparel-order/index.ts   server-owned order creation + pricing
supabase/functions/apparel-notify/index.ts         idempotent transactional email
supabase/functions/admin-orders/index.ts           operator read view, shared-secret auth
docs/crf/BLUEPRINT.md §3                           crf_ tables, indexes, triggers, RLS, grants (exact SQL)
supabase/migrations/003_crf_racewear_order_security.sql   the racewear order trigger
crf-builder/*.html                                 reference client pattern (insert-only browser)
docs/crf/BLUEPRINT.md, docs/crf/SYSTEM.md           the spec this was built and re-verified against
```

*Corrected 2026-09-25:* the first version of this list named
`supabase/migrations/001_initial_schema.sql`, which belongs to a different
project (`scraped_signals`, `sales_funnels`). The `crf_orders`,
`crf_order_files` and `crf_config` DDL isn't in `supabase/migrations/` at
all — it was applied to the live project directly and exists in the repo
only as the SQL in `docs/crf/BLUEPRINT.md` §3. The release build assembles
the kit's single migration from there.

**Why it clears the 70% bar, with evidence, not vibes:**

- It's not a demo. `https://crf-garage.netlify.app` has taken real, live-mode
  Stripe payments — this shipped and got paid, not "should work."
- 10 of the 32 recent commits are dedicated security-narrowing passes, not
  feature work: *"Narrow the browser's database grants, and drop the testing
  panel," "Harden CRF racewear order flow," "Withhold the kit file until
  Stripe confirms payment," "Add Stripe webhook that verifies payment before
  marking an order paid," "Persist kit orders to Supabase instead of the
  artifact runtime."* That's a team finding and closing real holes, which is
  exactly the trust signal a $49 boilerplate buyer has no way to verify
  themselves unless the seller already did it.
- The security properties are real, not asserted — I read the source, not
  just the doc:
  - `stripe-webhook`: HMAC-SHA256 over `t.rawBody`, **constant-time** compare
    (manual XOR-accumulate, not `===`), 300-second replay window, 500 on a DB
    write failure so Stripe retries instead of silently dropping a payment.
  - `kit-download` / `apparel-approval`: identical 404 for a wrong token
    *and* a wrong order id — the thing most boilerplates get wrong, because
    it's the difference between "secure" and "an order-id enumeration oracle."
  - `admin-orders`: SHA-256 digest compare for the operator key, unset key =
    no access (not open access) — and the query explicitly omits every
    token column, so a queue view can't double as a link-harvesting endpoint.
  - Two independent enforcement layers on the database side (RLS policy +
    table grant) for the same rule, on purpose, documented as "either one
    alone would do the job; the second is there for the day the first is
    misconfigured." That's a level of paranoia most boilerplate sellers don't
    bother with and most buyers can't audit for themselves.
- Belt-and-braces state ownership: a `BEFORE INSERT` trigger forcibly
  overwrites `payment_status` and the artwork-review fields on every insert,
  so even a maliciously crafted client payload can't self-declare "paid" or
  "approved." That's enforced in the database, independent of the Edge
  Function code.

**What a buyer does NOT get out of the box, and I'm not going to pretend
otherwise:**

- The extracted code still says `crf_` everywhere (table names, function
  comments). It has to be find-replaced to a generic prefix before it reads
  as "yours" — mechanical, ten minutes, covered in `SETUP.md` below, but real.
- No card payment on the "approval" flow yet (racewear orders are quote →
  approve → invoice by hand) — fine as a documented example of the
  approval-gate pattern, not fine if you market it as a full checkout.
  The graphics-kit flow (`stripe-webhook` + `kit-download`) *is* full,
  automatic, checkout-to-delivery.
- Email notifications (`apparel-notify`) are wired but inert until the buyer
  supplies their own Resend key — correct architecture (nothing hardcoded),
  but it means "email on approval" isn't turnkey without five minutes of
  config.
- It has never been through a second team's eyes. All the hardening is
  self-directed. Worth an external review before calling it "audited" in
  marketing copy — I'd say "built with defense-in-depth," not "penetration
  tested," and I address this in the Gumroad copy below.

**Verdict: ships as-is, with the prefix rename as the one required step.**
This is the asset. Full package below.

---

## Asset 2 — Developer/Automation Template: n8n AI pipeline pack

**Source files:**

```
n8n-workflows/pipeline-1-newsletter-engine.json          26 nodes
n8n-workflows/pipeline-2-affiliate-social-fabric.json     23 nodes
n8n-workflows/pipeline-3-b2b-outreach-fabric.json         27 nodes
n8n-workflows/database-schema.sql                         154 lines, 1 shared schema
```

**What it is.** Three import-ready n8n workflow graphs, added in one commit
(*"Add 3 production-ready n8n automation workflow engines + infrastructure,"*
7dd8f88) and genuinely non-trivial once opened: LLM agent nodes with
structured-output parsers, buffered chat memory, error-trigger branches,
scheduled triggers, and live integrations (Postgres, Gmail, Google Sheets,
Telegram, RSS). A single Postgres schema (`system_execution_logs` plus one
table per pipeline, all with `CHECK` constraints) backs all three, which is
the detail that makes this a *pack* instead of three unrelated exports.

**What keeps it out of the top slot:**

- **One commit, zero iteration.** The CRF backend earned its "production-ready"
  claim through ten hardening commits after real use. This pack claims it in
  the commit message on day one and has never been touched since — meaning
  never run against a failure it didn't anticipate, as far as this repo shows.
  That's not disqualifying for an n8n template (buyers expect to wire their
  own credentials and iterate), but it's a materially weaker evidence base
  than Asset 1, and the marketing copy for this one should not claim
  "battle-tested."
- **Not independently runnable.** These are n8n graph exports — the product
  *is* the graph, not a service; a buyer needs their own n8n instance, OpenAI
  key, and (per pipeline) Gmail/Sheets/Telegram credentials before anything
  executes. Normal for this category, but it means "70% functional" here
  means "the graph and schema are structurally sound and complete," not
  "runs out of the box" the way the CRF functions do once deployed.
- **Crowded category, lower price ceiling.** n8n template packs are a known
  Gumroad/marketplace genre and typically clear $19–35, not $49, unless
  bundled or sold with support — worth knowing before pricing this one.

**Recommendation:** hold as SKU #2. Package it the same way once Asset 1 is
live and has sold — reuse the buyer, don't split attention now. If you want
this one instead of a wait, the packaging pass would be: pull the three JSON
files + schema into their own repo, write an import walkthrough (n8n
credential wiring is the part buyers actually get stuck on), and be explicit
in the listing that it ships once and gets iterated by the buyer, not by you.

---

## Rejected, and why — the ruthless part

Everything else in the repo, in one line each:

| Candidate | Why it's not a top-2 asset right now |
|---|---|
| `kdp-compiler/` | Real, tested (gutter math, recto-page invariant, line-art QA gates all under `node --test`), but **199 lines total** — too narrow to be the flagship at $49; better as a future micro-SKU or a bundled bonus with a books/print-on-demand asset. |
| `audits/` | Clean CLI (671 lines, MD+PDF report output, sample data included), but **0 commits in 60 days** — untouched, unvalidated recently, and "SEO/ads audit generator" is a saturated agency-tool category. |
| `plugins/atlas_ui`, `plugins/pacifio_ui`, `plugins/openai_codex` | Named like UI component libraries, are actually 81–161 lines of terminal string-formatting helpers each. Not what a buyer pictures when a listing says "UI components." |
| `clearmark_outreach.py`, `clearmark_pipeline.py`, `clearmark_voice.py`, `sales/` | Functionally the most complete outreach engine in the repo, but it's wired to one specific live business (Clearmark) and its own prospect batches — this is operating infrastructure, not a template, and reselling it raises "whose leads are these" questions it doesn't need to raise. Don't productize an active go-to-market tool. |
| `gridstrike-core/` | A Next.js scaffold with one checkout route — 0 commits in 60 days, reads as abandoned-at-bootstrap, not ≥70% functional. |
| `digital-renaissance/` | Mostly a content workflow spec (`CONTENT_OS.md`, `EDITORIAL_SYSTEM.md`) plus a static site — process documentation, not an automation script or connector; also the closest thing here to an "info-product," which is explicitly out of scope. |
| `offload/`, `landing/`, `mediafetch/`, `digikim/` | Each real but thin (106–371 lines), single-purpose lead-capture or utility apps. Commodity category (waitlist page clones), low differentiation, low willingness-to-pay. |
| `trading/strategies/*.py`, `trading-dashboard/` | Not code-audited for this pass — excluded on a business-judgment call, not a technical one: packaging and selling trading strategy code plus a dashboard invites "is this financial advice" exposure that a payment-fulfillment kit or an automation template doesn't carry. Not worth the liability surface at this price point. |
| `starter_ai_agents/`, `ai-engineering-from-scratch/` | Single-file demo scripts, clearly educational/scratch in intent, not shippable products. |

---

## What's in this folder

```
productized/
  AUDIT.md                              — this file
  MASTER_BLUEPRINT.md                   — launch doc: blockers, brand system, Gumroad + Instagram packages
  brand/                                — rendered assets, build.py, queued Higgsfield script
  edgevault-fulfillment-kit/
    README.md                           — the product README, ships with the code
    SETUP.md                            — buyer-facing setup walkthrough
    GUMROAD_LISTING.md                  — the Gumroad product page copy
    PRICING_STRATEGY.md                 — the $49 pricing rationale and launch plan
  n8n-growth-fabric/
    README.md                           — the product README, ships with the workflows
    SETUP.md                            — per-pipeline credential/variable/placeholder walkthrough
    GUMROAD_LISTING.md                  — the Gumroad product page copy
    PRICING_STRATEGY.md                 — why $39, not $49 — and the later bundle plan
```

The four files under `edgevault-fulfillment-kit/` are the complete package for
Asset 1, written to ship alongside a copy of the six Edge Functions and the
migration pulled out of `supabase/`. Nothing in `supabase/` or `crf-builder/`
was changed to produce this — the source keeps running exactly as it does
today; extraction is copy-out, not rewrite-in-place.

The four files under `n8n-growth-fabric/` are the complete package for
Asset 2, written against `n8n-workflows/*.json` and `database-schema.sql`.
Nothing in `n8n-workflows/` was changed; the three JSON files and the schema
ship as-is.

*Corrected 2026-09-25:* the first pass read node parameters but not Code
nodes or sheet pickers, and missed four setup values (`TELEGRAM_CHANNEL_ID`,
the Amazon affiliate tag, two sheet ids). It also overstated the pack: only
pipelines 01 and 03 have a second, approving agent. A line-by-line pass
turned up real workflow defects too — pipeline 02's duplicate check can't
match, SQL is built by string interpolation from third-party data, and the
error branches are inert until wired. The package docs now say so; the fixes
are launch blockers in `MASTER_BLUEPRINT.md`.
