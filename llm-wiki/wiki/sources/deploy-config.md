---
files: netlify.toml, vercel.json, api/index.py, render.yaml, supabase/config.toml, .github/workflows/*.yml
commit: ec4767c
sha256: 62eb662537e2d3e3e8a89fb064b2091724fac871d44f02efe2102858a1044b13
ingested: 2026-09-29
---

# Deploy configuration

The config files that decide what deploys where: the root `netlify.toml`,
`vercel.json` with `api/index.py`, `render.yaml`, `supabase/config.toml`, and
the seven GitHub Actions workflows.

## Provenance

- Read at `ec4767c`: `netlify.toml`, `vercel.json`, `api/index.py`,
  `render.yaml` and `supabase/config.toml`, plus `audits.yml`,
  `degen-diaries-build.yml`, `deploy-ecu-app.yml`, `deploy.yml`,
  `landing.yml`, `netlify-deploy.yml` and `offload.yml` in
  `.github/workflows/`. The workflows are matched by a glob, so a new one
  shows up as drift.
- Config is what actually runs, so it is the stronger evidence where it
  disagrees with prose about *this repo*. It says nothing about a site that
  deploys from somewhere else (see [[sources/2026-09-29-crf-live-check]]).
- Line numbers are per file.

## Summary

This repo wires four platforms. Netlify has the root `netlify.toml`, two
active workflows and a disabled one. Vercel serves the landing app through
`vercel.json` and `api/index.py`. Render runs three services from one
blueprint. Supabase gets function settings. CI tests `audits`, `landing` and
`offload`, and builds `degen-diaries`. Several comments record lessons about
shared config, and one of those comments has gone stale.

## Netlify root config

- The whole file is `[build]` / `publish = "digital-renaissance/site"`
  (`netlify.toml` L1–2). There is no build command and no base directory.

## Netlify workflows

- `deploy.yml`, "Deploy Digital Renaissance to Netlify" (L1), runs on a push
  to `main` under `digital-renaissance/site/**`, or by hand (L3–9). It uses
  `secrets.NETLIFY_AUTH_TOKEN` and `secrets.NETLIFY_SITE_ID` (L20–21) and
  deploys `--dir=digital-renaissance/site … --prod --no-build` (L26–31). Its
  reason for `--no-build`: "Without it the CLI runs the root netlify.toml build
  (trading-dashboard) before uploading" (L22–24).
- `netlify-deploy.yml`, "Deploy Trading Dashboard to Netlify" (L1), runs on a
  push under `trading-dashboard/**`, or by hand (L3–8). It builds with Node 20
  (`npm ci`, `npm run build`; L16–28), then runs `npx netlify-cli@latest deploy
  --dir=trading-dashboard/dist --prod`, **without** `--no-build` (L34). It uses
  `NETLIFY_AUTH_TOKEN` and its own `NETLIFY_TRADING_DASHBOARD_SITE_ID`
  (L36–37), because "the shared NETLIFY_SITE_ID points at the Digital
  Renaissance site, so this job would publish the dashboard over
  digital-renaissance.tech" (L31–33).
- `deploy-ecu-app.yml` is "Deploy CRF Builder site to Netlify" (L1). "The push
  trigger is deliberately off. NETLIFY_AUTH_TOKEN was revoked, so every run
  since has failed … Deploys are being done by hand in the meantime." (L3–5)
  Only `workflow_dispatch` remains (L11–17).
  - It stages an explicit file list from `crf-builder/` (L37–50). Its reason:
    "privacy.html, terms.html and legal-details.js used to sit in crf-builder
    and reached production that way, serving [LEGAL ENTITY NAME] placeholders
    on a live URL. They now live in docs/crf/legal-drafts/, outside any publish
    root" (L28–33).
  - It deploys with `--no-build`, because "without it the CLI would run the
    build in the root netlify.toml, which publishes digital-renaissance/site"
    (L53–56). It adds: "crf-garage is deliberately not connected to the
    repository; it is deployed by upload only" (L58–61).
  - The site id is written inline (L65).

## Vercel config

- The root `vercel.json` rewrites every path to `/api/index` (L3).
- `api/index.py` is the "Vercel serverless entrypoint for the landing app"
  (L1). "Vercel's Python runtime bundles the repo read-only and only /tmp is
  writable, so point the generated freebie report and the leads log at /tmp"
  (L3–5). It sets `FREEBIE_OUT=/tmp/freebie` and `LEADS_PATH=/tmp/leads.csv`
  (L10–11).

## Render blueprint

One blueprint defines three `starter` web services, each with
`autoDeploy: true` (`render.yaml` L4–99).

| Service | Runs | Storage | Notes |
|---|---|---|---|
| `audit-landing` | `landing.app` on gunicorn (L5–10) | 1 GB disk at `/data`, `LEADS_PATH=/data/leads.csv` (L13–21) | `EMAIL_PROVIDER` is empty by default: "set to "mailchimp" or "mailerlite" to enable" (L22–23) |
| `offload-waitlist` | `offload.app` on gunicorn (L36–41) | 1 GB disk, `SIGNUPS_PATH=/data/signups.csv` (L44–52) | "Offload — waitlist landing page (separate product, separate service)" (L35); brand set by `OFFLOAD_BRAND` (L53–54) |
| `mediafetch` | `app:app` on uvicorn, root `mediafetch` (L69–75) | none | "MediaFetch — installable reel-downloader PWA (optional Stripe paywall)" (L68); paywall keys (L83–88); optional accounts tier "via Supabase + Stripe", with the Supabase URL, anon key, JWT secret and service-role key (L89–99) |

## Supabase config

- `project_id` is a placeholder, `"<YOUR_SUPABASE_PROJECT_ID>"` (L3).
- It sets `verify_jwt = false` for four functions only: `build-digital-asset`
  ("Called by database webhook", L5–6), `fulfill-order` ("Called by checkout
  platform webhook", L8–9), `create-apparel-order` (L11–12) and
  `apparel-notify` (L14–15). `stripe-webhook`, `kit-download`,
  `apparel-approval` and `admin-orders` are absent.

## CI workflows

- `audits.yml` runs on changes under `audits/**` (L3–11). It runs pytest
  (L26–27), then a smoke run that must write a Markdown report and a PDF
  report (L28–35).
- `landing.yml` runs on `landing/**` **and** `audits/**` (L4–12). It runs
  `pytest landing/tests -q` (L28–29), then smoke-tests the freebie:
  `build_freebie(...)` must produce `landing/static/sample-audit-report.pdf`
  (L30–34).
- `offload.yml` runs pytest on changes under `offload/**` (L3–11, L26–27).
- `degen-diaries-build.yml` runs `npm run typecheck` and `npm run build` on
  changes under `degen-diaries/**` (L2–7, L21–23).

## Connections

Feeds [[syntheses/deploy-matrix]], [[entities/netlify]], [[entities/vercel]],
[[entities/render]], [[entities/supabase]], [[entities/landing]],
[[entities/trading-dashboard]], [[entities/digital-renaissance]],
[[entities/crf-storefront]] and [[concepts/monorepo-shared-singletons]].
