---
files: DEPLOYMENT_GUIDE.md
commit: ec4767c
sha256: db1a50801d9e16b5975dee4defb28af7da5e6af26c13e3949465a9add12501b7
ingested: 2026-09-29
---

# Deployment guide (trading dashboard)

A root-level, step-by-step guide to deploying `trading-dashboard/` to
Netlify. Its wiring no longer matches the repo's config.

## Provenance

- File: `DEPLOYMENT_GUIDE.md` at the repo root, read at `ec4767c`. Undated.
  Its title is "Deployment Guide — Trading Dashboard to Netlify" (L1).
- Despite the generic filename, it covers one project.

## Summary

The guide has you connect the whole repository to a Netlify site with base
directory `trading-dashboard`. Then it has you add `NETLIFY_AUTH_TOKEN` and
`NETLIFY_SITE_ID` as repository secrets, so every push to `main` deploys. Both
steps now conflict with the repo's config.

## Quick start

- Step 1 lists files "committed with" the dashboard, including "`netlify.toml`
  — Netlify build configuration" and "`.github/workflows/netlify-deploy.yml` —
  Auto-deployment pipeline". (L7–9)
- Step 2, Method A, imports `eoinmcgee1993/Content-creation-` into Netlify with
  "**Base directory**: `trading-dashboard`", "**Build command**: `npm run
  build`" and "**Publish directory**: `dist`" (L17–25). Method B runs
  `netlify init` inside `trading-dashboard` and selects the GitHub repo
  (L29–35).
- Step 3 creates the repository secrets "Name: NETLIFY_AUTH_TOKEN" (L50) and
  "Name: NETLIFY_SITE_ID" (L55), then says "**Done!** Now every push to `main`
  auto-deploys." (L59)

## Checklist and scope

- The checklist repeats the base directory, build command and publish
  directory, then "GitHub secrets added (NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID)".
  (L63–73)
- It says outright that the dashboard is a mock. It ships mock data and has
  no real broker connections, payments, database or authentication.
  (L79–90)

## Connections

- `.github/workflows/netlify-deploy.yml` contradicts its secret wiring
  ([[sources/deploy-config#Netlify workflows]]). Its "connect the repo" route
  is the trap described in [[concepts/monorepo-shared-singletons]]. The flag
  is on [[entities/trading-dashboard#Deploy]].
- Feeds [[syntheses/deploy-matrix]] and [[entities/netlify]].
