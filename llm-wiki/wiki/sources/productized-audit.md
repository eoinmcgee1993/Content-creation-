---
files: productized/AUDIT.md
commit: ec4767c
sha256: b3dac0e2107ba6e18df255be263e39430de820b667b457ee0bbf023ab2c80295
ingested: 2026-09-29
---

# Code asset audit

An audit of every project in the repo for code mature enough to sell as a
developer asset. It picks the CRF fulfilment backend and the n8n pipeline pack.

## Provenance

- File: `productized/AUDIT.md`, read at `ec4767c`.
- It covers `git log` from 2026-07-13 to 2026-09-10, 135 commits (L3–4), and
  carries two dated corrections, both 2026-09-25 (L63–70, L227–234).

## Summary

Of about 25 side projects, two clear its bar. The CRF order-fulfilment backend
is "the asset" (Asset 1), and the n8n AI pipeline pack is held as SKU #2
(Asset 2). Everything else is rejected in one line each. The audit's headline
evidence for Asset 1 is that the CRF site has taken real live-mode Stripe
payments, and [[sources/crf-deployment-plan]] contradicts that.

## Scope and bar

- The goal is to "find working code — not info-products, not ebooks, not
  prompt packs — mature enough to sell as a developer asset on its own.
  **Bar:** ≥70% functional, meaning it runs, does the thing, and isn't a stub
  with a README describing intent." (L4–7)
- Commits in the last 60 days: the CRF storefront 32 (24%), digital-renaissance
  6, kdp-compiler 3, and n8n-workflows, clearmark, plugins, offload and
  landing 1 each. audits, gridstrike-core, trading and trading-dashboard had
  0. (L13–19)
- "One project got nearly a quarter of all engineering attention in two
  months, almost all of it hardening passes, not new features. That's the
  tell." (L21–22)
- Everything "is graded against what it actually does, not what its README
  claims." (L22–23)

## Verdict

- Asset 1 is "the CRF order-fulfillment backend. A Stripe-to-Supabase
  digital-fulfillment engine with no server to run, security-reviewed across
  ~10 dedicated hardening commits, and **live in production on real, live-mode
  Stripe payments** right now." (L29–33)
- Asset 2 is "the n8n pipeline pack … Real, but shipped once and never
  iterated". (L34–37)

## Asset 1, the fulfillment backend

- "A pattern, not a niche product: sell a digital file … through Stripe, with
  Supabase Postgres + Edge Functions doing 100% of the trusted work and a
  static HTML page doing 0% of it." (L43–46)
- Its source files are six Edge Functions (`stripe-webhook`, `kit-download`,
  `apparel-approval`, `create-apparel-order`, `apparel-notify`,
  `admin-orders`), the schema in `docs/crf/BLUEPRINT.md` §3, and migration
  `003_crf_racewear_order_security.sql`. (L50–61)
- Evidence claimed: "`https://crf-garage.netlify.app` has taken real,
  live-mode Stripe payments — this shipped and got paid, not "should work.""
  (L73–74) Also, 10 of the 32 recent commits are security-narrowing passes.
  (L75–82)
- The author says of the security properties, "I read the source, not just the
  doc" (L83–84):
  - `stripe-webhook` computes HMAC-SHA256 over the raw body, compares in
    constant time, enforces a 300-second replay window, and returns 500 on a
    database write failure so Stripe retries. (L85–87)
  - `kit-download` and `apparel-approval` return an identical 404 for a wrong
    token and a wrong order id. (L88–90)
  - `admin-orders` compares a SHA-256 digest, treats an unset key as no access,
    and omits token columns from its query. (L91–93)
  - RLS and grants enforce the same rule twice, on purpose. (L94–98)
  - A `BEFORE INSERT` trigger overwrites `payment_status` and the artwork-review
    fields. (L99–103)
- Not included out of the box: the `crf_` prefix is everywhere, the approval
  flow has no card payment, email is inert until the buyer adds a Resend key,
  and the code has never had an external review. Say "built with
  defense-in-depth," not "penetration tested". (L105–123)
- "**Verdict: ships as-is, with the prefix rename as the one required step.**"
  (L125)

## Asset 2, the n8n pipeline pack

- Three workflow graphs of 26, 23 and 27 nodes (76 in all), plus a 154-line
  shared Postgres schema (L135–138). They have LLM agent nodes, memory,
  error-trigger branches, schedules, and Postgres, Gmail, Sheets, Telegram and
  RSS integrations (L141–148).
- It is held back for three reasons: "One commit, zero iteration" (L152–159);
  it is not independently runnable and needs the buyer's own n8n instance,
  OpenAI key and per-pipeline credentials (L160–165); and it is a "Crowded
  category, lower price ceiling … typically clear $19–35, not $49"
  (L166–168).
- "**Recommendation:** hold as SKU #2. Package it the same way once Asset 1 is
  live and has sold". (L170–171)

## Rejected candidates

One line each (L179–193):

- `kdp-compiler/` is real and tested, but at 199 lines it is too narrow.
- `audits/` is clean, but it had 0 commits in 60 days and sits in a saturated
  category.
- `plugins/*` are terminal string helpers, not UI components.
- The Clearmark outreach scripts and `sales/` are "operating infrastructure,
  not a template": "Don't productize an active go-to-market tool."
- `gridstrike-core/` was abandoned at bootstrap.
- `digital-renaissance/` is process docs plus a static site, the closest thing
  here to an info-product.
- `offload/`, `landing/`, `mediafetch/` and `digikim/` are "real but thin
  (106–371 lines)", commodity apps.
- `trading/` and `trading-dashboard/` were excluded for liability ("is this
  financial advice"), not code-audited.
- `starter_ai_agents/` and `ai-engineering-from-scratch/` are educational
  scratch.

## Corrections

- 2026-09-25: the first file list named `supabase/migrations/001_initial_schema.sql`,
  "which belongs to a different project (`scraped_signals`, `sales_funnels`)".
  The `crf_orders`, `crf_order_files` and `crf_config` DDL "isn't in
  `supabase/migrations/` at all — it was applied to the live project directly
  and exists in the repo only as the SQL in `docs/crf/BLUEPRINT.md` §3."
  (L63–70)
- 2026-09-25: the first pass over the n8n pack missed four setup values and
  overstated the pack: "only pipelines 01 and 03 have a second, approving
  agent". It also found real defects. Pipeline 02's duplicate check can't
  match, SQL is built by string interpolation from third-party data, and the
  error branches are inert. (L227–234)

## Connections

Feeds [[entities/edgevault]], [[entities/growth-fabric]],
[[entities/crf-storefront]], [[entities/supabase]], [[entities/stripe]],
[[concepts/productization-bar]], [[concepts/claim-by-mechanism]],
[[concepts/browser-can-only-create]], [[concepts/server-owned-state]],
[[concepts/uniform-404]] and [[syntheses/portfolio-map]]. The live-payments
claim is flagged on [[entities/edgevault#The trust line]].
