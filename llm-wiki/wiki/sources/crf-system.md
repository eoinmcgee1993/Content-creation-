---
files: docs/crf/SYSTEM.md
commit: ec4767c
sha256: 7a385dced70cf8eb58da6bf843919c59b55f4db7a9fc4ba70cc54ffa6136aa03
ingested: 2026-09-29
---

# CRF system reference

The reference description of the CRF site. It covers the three products, the
architecture, the data model, where each security rule is enforced, deploy
mechanics and the known gaps.

## Provenance

- File: `docs/crf/SYSTEM.md`, read at `ec4767c`. Undated.
- It calls itself "the reference document" and points to `DEPLOYMENT.md` for
  the plan and `BLUEPRINT.md` for the spec. (L3–7)
- Its deploy section (§9) predates the move to Vercel recorded in
  [[sources/crf-deployment-plan]].

## Summary

A static site with no accounts sells three things. The graphics-kit SVG is
paid through Stripe and released on payment. Racewear goes through quote,
approval and invoice. The ECU template is free. The browser can only insert,
only Stripe can mark an order paid, and every read needs `(id, token)`. The
document says the kit is on a live-mode link. It does not say anyone has
bought one.

## What it is

- It sells three products (L16–22):
  - The graphics kit: "Stripe, up front, file released on payment".
  - Racewear: "Quote → artwork approval → invoice. No card payment on the site
    yet".
  - The ECU template: "Free download. It is the lead product".
- It also has a modifications guide. (L24–25)
- "There is no login. Nobody has an account. Everything a customer needs to get
  back to their order is a link with a token in it." (L27–28)

## Architecture

- The browser posts to `crf_orders` and `crf_order_files` with the anon key,
  and can only insert. RLS has an insert-only policy for anon, the grants give
  anon INSERT and nothing else, and a `BEFORE INSERT` trigger "forces
  payment_status='unpaid'". The Edge Functions use the service-role key and
  `verify_jwt=false`. (L34–56)
- Three properties, "and everything else follows from them" (L58–67):
  1. "**The browser can create, and can do nothing else.** It cannot read an
     order back, cannot update one, cannot see anyone else's. Both the
     row-level policy and the table grant say so, independently." (L60–62)
  2. "**Money is only ever set by Stripe.** The browser physically cannot write
     `payment_status`; the insert trigger overwrites it even if it tries; and
     the only code that sets it to `paid` runs after verifying a Stripe
     signature." (L63–65)
  3. "**Getting back to your order needs a secret you were given once.** An
     order id alone is worthless. Every read is keyed on `(id, token)`."
     (L66–67)

## Graphics kit

- The hard part is geometry. There are 15 real cut pieces, grouped into six
  zones, each clipped separately and never rasterised (L73–96). "A zone is
  **not** one sticker. That distinction has bitten this project twice"
  (L91–92).
- Ordering (L129–138):
  1. Insert the order with a `download_token` the browser generates.
  2. Insert the SVG.
  3. Show the Payment Link with a `client_reference_id`.
  4. Stripe calls `stripe-webhook`, which marks the order paid.
  5. `kit-download` returns the SVG only if the order is paid and the token
     matches.
- "It is **$39.00 USD**, one-time, on a **live-mode** link — the kit has been
  on real sale, not in test mode, since the link was made." (L140–142)
- "the Stripe account is named **Clearmark**. That is the name a customer sees
  at checkout and on their card statement". (L144–146)

## Racewear

- Racewear is priced in satang, with USD shown alongside, and quantity tiers
  lower the unit price. Every upload is checked against `MIN_DPI = 150` at its
  physical print size. (L156–175)
- "On order, `create-apparel-order` validates the request and generates the
  order id plus both tokens under the service-role key. The browser cannot
  insert directly into the order table." (L187–189)
- `apparel-approval` authenticates on `(order_id, approval_token)` "and returns
  the same 404 for a wrong token as for a wrong order, so the endpoint cannot
  be used to discover which order ids exist". It can write only the artwork
  fields, and approval is one-way: re-approving returns 409. (L192–200)

## ECU template and modifications guide

- The template covers launch control, decel pops and a bounce limiter. Each
  comes with the conditions that make it safe (L209–230).
- The builder used to offer a "PCX150 injector upgrade", which "was wrong in
  the most dangerous direction": it advertised an increase but delivered about
  40% less fuel. It was removed (L239–251).
- The modifications guide tags every claim `measured`, `vendor`, `principle` or
  `unverified`. "A guide that cannot tell you which of its numbers were
  measured is indistinguishable from a forum post." (L257–269)

## Data model

- There are four `crf_` tables (L275):
  - `crf_orders`, with the payment block (L277–281)
  - `crf_order_files` (L283–284)
  - `crf_apparel_orders`, with the artwork block (L286–290)
  - `crf_config`
- `crf_config` is "a key/value table holding every secret this system has …
  RLS on, **no policies at all**, and every grant revoked from `anon` and
  `authenticated`". So a secret "is rotatable with one UPDATE and never
  appears in a repository, an environment file or a deploy log". (L292–297)

## Where each rule is enforced

- ""the UI won't let you" is not enforcement." (L307–308) The rule-by-rule
  table (L310–322) includes:
  - "Only Stripe can mark an order paid | `stripe-webhook` verifies
    `Stripe-Signature` as HMAC-SHA256 over `<timestamp>.<raw body>`, compares
    in constant time, and rejects anything older than 300 seconds" (L316)
  - "Only the operator can read the queues | `admin-orders` compares a key
    against `crf_config.operator_key` by SHA-256 digest; unset means no access,
    not open access" (L322)
- The trigger functions set `SET search_path TO ''` (L324–325). "The two
  layers — grants and RLS — are redundant on purpose. Either one alone would do
  the job; the second is there for the day the first is misconfigured."
  (L327–328)

## Deploy mechanics

- The site is "five HTML files and a `kits/` image folder, zipped and posted
  to Netlify" (L334–335). The GitHub Action's push trigger is commented out
  "because `NETLIFY_AUTH_TOKEN` was revoked", so deploys are manual
  (L337–340).
- "The repository root `netlify.toml` publishes `digital-renaissance/site` …
  That is why deploy previews on CRF pull requests sometimes fail for reasons
  that have nothing to do with the change." (L345–348)

## Not part of this system

- "`supabase/functions/build-digital-asset` and
  `supabase/functions/fulfill-order` belong to the digital-product project
  that shares this repository. They call Gemini, Resend and Lemon Squeezy and
  touch `scraped_signals` / `sales_funnels`." (L354–357)
- "The CRF Edge Functions are exactly six". (L359–361)

## Known gaps

In order of importance (L365–399):

1. There is no trading name, and "CRF" is Honda's. (L367–370)
2. The merchant name is *Clearmark*. (L371–375)
3. The legal pages are written but not published. (L376–380)
4. The approval email is built but inert until three `crf_config` rows exist.
   (L381–385)
5. The operator view is built but neither switched on nor deployed.
   (L386–389)
6. There is no 3D preview. (L390–394)
7. Deploys are manual because `NETLIFY_AUTH_TOKEN` is revoked. (L395–399)

## Connections

Feeds [[entities/crf-storefront]], [[entities/supabase]], [[entities/stripe]],
[[entities/edgevault]], [[entities/netlify]],
[[concepts/browser-can-only-create]], [[concepts/server-owned-state]] and
[[concepts/uniform-404]]. [[sources/crf-deployment-plan]] and
[[sources/2026-09-29-crf-live-check]] supersede its §9 and §11 on hosting.
