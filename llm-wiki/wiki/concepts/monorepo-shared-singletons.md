# Shared singletons in a monorepo

In a repo of unrelated projects, anything that exists only once couples
projects that otherwise share nothing. That includes a root config file, a
repository secret and a database schema.

## Instances in this repo

| Singleton | What it couples | What goes wrong | Evidence |
|---|---|---|---|
| root `netlify.toml` | every Netlify site linked to the repo | a linked site builds and serves `digital-renaissance/site` | [[sources/root-claude-md#Deploy targets and traps]] [[sources/deploy-config#Netlify root config]] |
| `NETLIFY_SITE_ID` secret | Digital Renaissance and the trading dashboard | the dashboard job would publish over digital-renaissance.tech | [[sources/deploy-config#Netlify workflows]] |
| `NETLIFY_AUTH_TOKEN` secret | all three Netlify workflows | when it was revoked, CRF's deploy workflow was switched off | [[sources/deploy-config#Netlify workflows]] |
| root `vercel.json` | any Vercel project at the repo root | every path goes to the landing app (inference) | [[sources/deploy-config#Vercel config]] |
| `render.yaml` | landing, Offload and MediaFetch | one blueprint holds three products | [[sources/root-claude-md#Deploy targets and traps]] |
| the `supabase/` project | CRF, MediaFetch and a digital-product project | migration numbers and table names can collide, and CRF's tables live outside the migrations | [[sources/root-claude-md#Deploy targets and traps]] [[sources/productized-audit#Corrections]] |
| root `requirements.txt` | several Python projects | "a shared grab-bag", scoped to none of them | [[sources/root-claude-md#Repository structure]] |

## Defences in use

- **Don't link the site.** CRF was deployed by upload, never connected
  [[sources/root-claude-md#CRF task handling and deploying]], and uploads pass
  `--no-build` [[sources/deploy-config#Netlify workflows]].
- **Give each project its own secret.** The trading dashboard uses
  `NETLIFY_TRADING_DASHBOARD_SITE_ID` [[sources/deploy-config#Netlify workflows]].
- **Keep unpublished files outside every publish root.** The legal drafts live
  in `docs/crf/legal-drafts/` [[sources/crf-deployment-plan#Hosting]].
- **Move out.** CRF now deploys from its own repository
  [[sources/crf-deployment-plan#Hosting]].
- **Read before adding.** Check migration numbering and table names first
  [[sources/root-claude-md#Deploy targets and traps]].

## When the docs lag

A stale document can lead someone straight into the trap: see
[[entities/trading-dashboard#Deploy]] and
[[entities/digital-renaissance#Deploy]]. The full map is
[[syntheses/deploy-matrix]]. The platforms involved are [[entities/netlify]],
[[entities/vercel]], [[entities/render]] and [[entities/supabase]].
