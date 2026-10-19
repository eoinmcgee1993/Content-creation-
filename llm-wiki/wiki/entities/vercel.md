# Vercel

Serverless and static hosting for two projects. The landing app deploys from
this repo's root `vercel.json`, and the CRF storefront deploys from a separate
repository.

## Landing app

- The root `vercel.json` sends every path to `/api/index`.
- `api/index.py` wraps the Flask app and moves its writable paths to `/tmp`,
  because the runtime bundles the repo read-only.

[[sources/deploy-config#Vercel config]]

Root `CLAUDE.md` counts this as one of "two live deploy targets for one app"
[[sources/root-claude-md#Deploy targets and traps]]. The question of whether
leads survive in `/tmp` is on [[entities/landing#Two deploy targets]].

## CRF storefront

- The storefront moved here from Netlify. It is live at
  `crf-eoins-projects-99ff5888.vercel.app` and deploys on a push to `main` of
  `eoinmcgee1993/crf-builder` [[sources/crf-deployment-plan#Hosting]].
- That project serves plain HTML from `public/`, and its `next.config.mjs`
  keeps the old URLs with rewrites [[sources/crf-deployment-plan#Hosting]].
- All eight routes checked returned 200 on 2026-09-29
  [[sources/2026-09-29-crf-live-check#Status codes]].

See [[entities/crf-storefront#Where it is live]].

## A shared file

The root `vercel.json` sends every path to the landing app
[[sources/deploy-config#Vercel config]]. **Inference:** a second Vercel
project linked to this repo at its root would serve the landing app. That is
the same shape as the Netlify trap in [[concepts/monorepo-shared-singletons]].
