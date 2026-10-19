---
files: docs/crf/DEPLOYMENT.md
commit: ec4767c
sha256: 417c1357e54bca9fdcc9019858add269989f4a0c73ed84f5513a1d463103b3bc
ingested: 2026-09-29
---

# CRF deployment plan

The CRF site's plan for getting "to a site that can take money from a stranger
without anyone watching it": where it stands, eight phases, verification and
rollback.

## Provenance

- File: `docs/crf/DEPLOYMENT.md`, read at `ec4767c`. It was "Written 1 Sep
  2026" (L3), and Phase 7 was "Checked against the live Stripe account on 2
  Sep" (L186).
- Phase 3 was rewritten after the move to Vercel ("recorded here because the
  old plan is gone", L89). Other sections were not updated, so the document
  contradicts itself. See [[sources/crf-deployment-plan#Internal inconsistencies]].

## Summary

Everything customer-facing works. What remains is the trading name, the legal
pages, the merchant identity, one real purchase, and automation. The plan
records that hosting moved from Netlify to Vercel and now deploys from a
separate repository, and that no purchase has ever completed.

## Where it stands

The state table (L14–31) includes:

- The five builder pages and `/desk` are "Live, 200". (L16–20, L26)
- "`privacy.html`, `terms.html` | Drafts moved to `docs/crf/legal-drafts/`,
  outside any publish root". (L21)
- "Edge Functions | Six CRF functions defined; live activation requires
  Supabase deployment". (L23)
- "Payments — kit | Stripe Payment Link live, webhook verified". Racewear is
  "Manual invoice. No card path". (L24–25)
- "Hosting | **Vercel.** Netlify is gone and `crf-garage.netlify.app` answers
  404 everywhere". (L28)
- "CI deploy | Automatic on push to `main` of `eoinmcgee1993/crf-builder`".
  (L29)
- "Domain | Not purchased" and "Trading name | Not decided". (L30–31)

## Name and legal pages

- Phase 1 is deciding the name. "'CRF' is Honda's model designation. Using it
  as a trading name is not the same as using it descriptively". (L43–47)
  "Blocked on: you." (L52)
- Phase 2 is publishing the legal pages, which four facts hold back: entity,
  address, email and governing law (L58–66). A blank renders red with a banner,
  "so a half-filled version cannot be published by accident" (L68–69). The
  phase is done when both pages are reachable and show no placeholder
  (L84–85).

## Hosting

- "The site moved from Netlify to Vercel. Netlify is not paused, it is gone:
  `crf-garage.netlify.app` returns 404 on every route, which is what finally
  took the placeholder privacy policy off the internet." (L91–93)
- "Live at `https://crf-eoins-projects-99ff5888.vercel.app`, deploying
  automatically on push to `main` of `eoinmcgee1993/crf-builder`. The
  storefront is plain HTML in `public/`; `next.config.mjs` carries
  `beforeFiles` rewrites so `/`, `/apparel`, `/ecu`, `/mods`, `/approve` and
  `/desk` keep the URLs they already had." (L95–99)
- The old "deploy an explicit file list" rule is "now enforced by where the
  files live". The legal drafts sit in `docs/crf/legal-drafts/`, and "Phase 2
  moves them into `public/`, and that move is the deliberate act that publishes
  them." (L101–106)
- "**Still unshipped, and deliberately so:**
  `supabase/functions/create-apparel-order` and
  `supabase/migrations/003_crf_racewear_order_security.sql`. The racewear page
  was reverted to writing through PostgREST because it was calling a function
  that had never been deployed". The two "go out as one unit or not at all."
  (L108–114)

## Racewear email and operator view

- Phase 4: the racewear page promises an approval email that "Nothing sends".
  The minimum fix is `apparel-notify`, keyed on `(order_id, approval_token)`,
  with the provider key kept in `crf_config`. (L116–145)
- Phase 5: an operator page calling `admin-orders` with a shared secret from
  `crf_config`. "Do not give `anon` a `SELECT` grant to make an operator view
  easier — that is the exact regression this design exists to prevent."
  (L149–166)

## Launch

- "The account is in live mode and has been all along". The payment link is
  live at `$39.00 USD`, and the webhook is enabled and subscribed only to
  `checkout.session.completed`. (L192–201) "**Do not rotate
  `crf_config.stripe_webhook_secret` as a launch ritual.**" (L204–207)
- "The Stripe account is **Clearmark**." Buyers see *Clearmark* at checkout and
  on their statements, and unrecognised descriptors cause chargebacks.
  (L211–220)
- Under the heading "Nobody has ever completed a purchase" (L222): "One
  checkout session exists against the kit link, from 8 Aug. It expired
  unpaid. **The payment path has never run end to end with real money**".
  (L224–226)
- What is left (L228–239):
  - "Point the domain at Netlify" (L230)
  - fix the merchant identity (L232)
  - run one real purchase and refund it (L233–236)
  - verify the order row and the file (L237–239)

## Verification and rollback

- Five pages must return 200 on `$SITE_HOST`, and `privacy` and `terms` join
  the list after Phase 2 (L266–275). Three database invariants and the `anon`
  grant query follow (L277–297).
- Rollback:
  - "Netlify → Deploys → the last good one → **Publish deploy**" (L303)
  - Migrations are forward-only, and every change so far is additive
    (L306–310).
  - Deactivate the Payment Link to stop taking money (L312–313).
- Blocked on the owner (L317–324):
  - the trading name and the domain
  - the four legal facts
  - "A fresh `NETLIFY_AUTH_TOKEN`"
  - the 3D model decision and a fender measurement

## Internal inconsistencies

- Hosting is Vercel (L28, L91–99), yet the launch steps say "Point the domain
  at Netlify" (L230), rollback goes through Netlify (L303), and a fresh
  `NETLIFY_AUTH_TOKEN` is still listed as blocked on the owner (L322).
- The four legal facts "live in `crf-builder/legal-details.js`" (L58–59), yet
  the drafts have "moved to `docs/crf/legal-drafts/`" (L21, L101–104).

## Connections

Feeds [[entities/crf-storefront]], [[entities/vercel]], [[entities/netlify]],
[[entities/stripe]], [[entities/edgevault]],
[[concepts/browser-can-only-create]] and [[syntheses/deploy-matrix]]. It
contradicts [[sources/root-claude-md]] and [[sources/productized-audit]] on
hosting and payments.
