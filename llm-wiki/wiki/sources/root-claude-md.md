---
files: CLAUDE.md
commit: ec4767c
sha256: 960af4d7c775cf9443a38eef1dfe16bf8c5b7b7e28a82733521f0c35bf9f4a41
ingested: 2026-09-29
---

# Root CLAUDE.md

The repository's standing instructions to Claude sessions: how the repo is
organised (§5) and the rules for the CRF storefront (§6–10).

## Provenance

- File: `CLAUDE.md` at the repo root, read at `ec4767c`, the commit that added
  this wiki's pointer paragraph (L117–122).
- Kind: operating instructions kept alongside the code. §1–4 are general
  coding guidance and are not summarised here.
- Undated. Several §6–10 facts are contradicted by newer sources (see
  Connections).

## Summary

§5 describes the repo as many independent projects, lists which of them have
tests and CI, and names four cross-cutting deploy traps. §6–10 describe CRF as
a static storefront on Netlify, deployed by upload, with a security model
enforced in the database, and a validation routine that curls the Netlify URL.

## Repository structure

- "This repo hosts many small, independent projects and prototypes, not one
  application — most share no code, stack, or deploy target." (L71–72)
- A project's own `README.md` "is authoritative for that project's purpose and
  commands." (L73–74)
- Session setup installs the root `requirements.txt`, "a shared grab-bag of
  Python deps spanning several unrelated projects", plus `ffmpeg` and the
  Higgsfield CLI. (L74–77)
- Everything outside the named projects "is a standalone script, static page,
  or experiment with no shared build or test process". (L112–115)

## Test suites and CI

| Project | Command | In CI |
|---|---|---|
| `landing/` | `pytest landing/tests -q` | yes |
| `offload/` | `pytest offload/tests -q` | yes |
| `audits/` | `pytest audits/tests -q` | yes |
| `kdp-compiler/` | `npm test` | no |
| `substack-os/` | `npm test` | no |
| `digital-renaissance/money-machine/` | `npm test` | no |

(L79–94.) It describes the three CI workflows as "path-filtered to their own
directory" (L92–93).

## Deploy targets and traps

- `render.yaml` is one Render blueprint that provisions three separate
  services: `landing/` (`audit-landing`), `offload/` (`offload-waitlist`) and
  `mediafetch/` (`mediafetch`). (L97–99)
- "`landing/` *also* deploys to Vercel independently, via `api/index.py` +
  root `vercel.json` — two live deploy targets for one app." (L100–101)
- "The root `netlify.toml` publishes **`digital-renaissance/site`**. Any other
  static project connected to this repo's Netlify site … would be silently
  overridden by that config — this has already shaped how `crf-builder/` and
  `trading-dashboard/` deploy". (L102–106)
- "A single `supabase/` project's migrations serve multiple unrelated apps
  (`crf-builder/`'s racewear/ECU tables, `mediafetch/`'s subscriptions) in one
  shared Postgres schema — check existing migration numbering and table names
  before adding a new one". (L107–110)

## CRF overview

- "a static storefront selling three things to owners of a Honda CRF250L /
  CRF300L — a print-ready graphics-kit SVG, custom club racewear, and a free
  ECU tune template. No accounts, no server, no build step." (L131–133)
- Stack: "Netlify (static hosting, deployed by upload) · Supabase Postgres +
  Edge Functions (Deno) · Stripe Payment Links · Resend for email, when a
  sending domain exists." (L135–137)
- "**Live at:** https://crf-garage.netlify.app" (L139). "'CRF Garage' is a
  prototype name, not a trading name." (L140)
- "**Current focus:** the trading name. It blocks the domain, the legal pages,
  the email sending domain, and the Stripe merchant name". (L142–143)

## CRF architecture rules

- "**The browser can create, and can do nothing else.** It holds only the
  publishable key, and `anon` has `INSERT` and no other grant on any `crf_`
  table. If a task appears to need `SELECT` for `anon`, the task is wrong, not
  the rule". (L150–153)
- Database reads live in `supabase/functions/`. Pages "write directly to
  PostgREST and never read back." (L154–155)
- "**Money and approval state are server-owned.** `payment_status` is written
  only by `stripe-webhook` after signature verification; `artwork_status` only
  by the customer through `apparel-approval`. `BEFORE INSERT` triggers
  overwrite both on every insert". (L156–159)
- "**Every customer-facing read is keyed on `(id, token)`**, and a wrong token
  returns the same 404 as a wrong id — otherwise the endpoint becomes an
  order-id oracle." (L160–162)
- Secrets live only in `public.crf_config`: "RLS on, zero policies, grants
  revoked … Never an environment variable, never a file, never the
  repository." (L163–165)
- Emails go to the address stored on the order row, and links are built from
  configured values, "Never from the request." (L166–167)
- "Schema changes are additive." (L168–169)

## CRF standards and validation

- One plain HTML/CSS/JS file per page: "No framework, no bundler, no build step
  — that is a deliberate constraint". (L173–175)
- "Edge Functions are TypeScript on Deno, `verify_jwt = false` with their own
  authentication in the body … Stripe cannot present a Supabase JWT and
  customers are not signed in." (L176–178)
- Money is integer minor units. (L181)
- "**There is no lint, test, or build command in this project.**" A
  validation checklist replaces them. (L188–190)
- Validation curls every route on `https://crf-garage.netlify.app`, and
  "privacy and terms must stay 404 until their four facts exist" (L196–199).
  `anon` must hold INSERT only (L201–203), and three database invariants must
  return zero rows (L206–208).
- "Changing an Edge Function means driving it over HTTPS". (L210–211)

## CRF task handling and deploying

- "Governing rule: ship before build." (L222)
- "the site is published by uploading `crf-builder/`, and `crf-garage` is
  deliberately **not** connected to this repository. The root `netlify.toml`
  publishes `digital-renaissance/site`, so linking the site would make its next
  build serve a different project on this domain." (L225–228)
- "Deploy an explicit list of files, never the folder — `privacy.html`,
  `terms.html` and `legal-details.js` sit in it and must not ship until their
  four facts exist." (L228–230)

## Connections

- The repo layout feeds [[syntheses/portfolio-map]] and
  [[concepts/monorepo-shared-singletons]].
- The deploy traps feed [[syntheses/deploy-matrix]], [[entities/netlify]],
  [[entities/render]], [[entities/vercel]], [[entities/supabase]],
  [[entities/landing]] and [[entities/digital-renaissance]].
- §6–10 feed [[entities/crf-storefront]], [[entities/stripe]],
  [[concepts/browser-can-only-create]], [[concepts/server-owned-state]] and
  [[concepts/uniform-404]].
- [[sources/crf-deployment-plan]] and [[sources/2026-09-29-crf-live-check]]
  contradict several §6–10 facts: the host, the live URL, the deploy method,
  where the legal drafts live, and the trading name. The flags are on
  [[entities/crf-storefront#Where it is live]].
