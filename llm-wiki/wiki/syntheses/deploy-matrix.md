# Deploy matrix

Every deploy in or around this repo: its target, its trigger, the shared
config and secrets it depends on, and where its documents disagree with the
config.

**Question:** if a file changes, what redeploys, and what else could it
break?

## The matrix

| Project | Target | Trigger | Config | Shares | Checked live |
|---|---|---|---|---|---|
| [[entities/crf-storefront]] | Vercel | push to `main` of `eoinmcgee1993/crf-builder`, another repository | in that repository | none recorded | 200 on all routes, 2026-09-29 |
| CRF storefront, old site | Netlify `crf-garage` | by hand only | `deploy-ecu-app.yml`: explicit file list, `--no-build` | `NETLIFY_AUTH_TOKEN`, reported revoked | 404 everywhere, 2026-09-29 |
| CRF Edge Functions | [[entities/supabase]] | no workflow deploys them; "live activation requires Supabase deployment" | `supabase/config.toml`, which is incomplete | the shared Supabase project | no |
| [[entities/digital-renaissance]] | Netlify, digital-renaissance.tech | push under `digital-renaissance/site/**`, or by hand | `deploy.yml`, root `netlify.toml` | `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` | no |
| [[entities/trading-dashboard]] | Netlify, its own site | push under `trading-dashboard/**`, or by hand | `netlify-deploy.yml` | `NETLIFY_AUTH_TOKEN` | no |
| [[entities/landing]] | Render, `audit-landing` | auto-deploy | `render.yaml` | the blueprint | no |
| [[entities/landing]] | Vercel | not recorded in the repo | root `vercel.json`, `api/index.py` | root `vercel.json` | no |
| `offload/` | Render, `offload-waitlist` | auto-deploy | `render.yaml` | the blueprint | no |
| `mediafetch/` | Render, `mediafetch` | auto-deploy | `render.yaml` | the blueprint; Supabase if accounts are on | no |
| [[entities/edgevault]], [[entities/growth-fabric]] | [[entities/gumroad]] | by hand, once listed | none | none | not listed |

Sources: [[sources/deploy-config#Netlify workflows]],
[[sources/deploy-config#Netlify root config]],
[[sources/deploy-config#Vercel config]],
[[sources/deploy-config#Render blueprint]],
[[sources/deploy-config#Supabase config]],
[[sources/crf-deployment-plan#Hosting]],
[[sources/crf-deployment-plan#Where it stands]],
[[sources/2026-09-29-crf-live-check#Status codes]] and
[[sources/master-blueprint#Launch blockers]].

The CI workflows for `audits/`, `landing/`, `offload/` and `degen-diaries/`
test or build, and deploy nothing [[sources/deploy-config#CI workflows]].

## What a change can reach

- **Root `netlify.toml`:** every Netlify site linked to the repo. Today that
  is Digital Renaissance's, and would be any other site linked later.
- **`NETLIFY_AUTH_TOKEN`:** all three Netlify workflows.
- **`NETLIFY_SITE_ID`:** Digital Renaissance, and the dashboard if its
  workflow ever pointed there.
- **Root `vercel.json`:** the landing app on Vercel.
- **`render.yaml`:** three services at once.
- **`supabase/migrations/`:** a schema shared by CRF, MediaFetch and a
  digital-product project.

[[concepts/monorepo-shared-singletons]] explains the pattern and the
defences in use.

## Where the docs disagree

Each flag sits on the page about its subject:

- CRF is documented as live on Netlify and deployed by upload, but it now
  runs on Vercel from another repository: [[entities/crf-storefront#Where it is live]].
- `DEPLOYMENT_GUIDE.md` wires the dashboard to the shared site id:
  [[entities/trading-dashboard#Deploy]].
- `deploy.yml` gives an out-of-date reason for `--no-build`:
  [[entities/digital-renaissance#Deploy]].
- `supabase/config.toml` leaves out `verify_jwt = false` for four CRF
  functions: [[entities/supabase#Function settings]].
- Is `NETLIFY_AUTH_TOKEN` still revoked? [[entities/netlify#The auth token]].
- Do leads survive in `/tmp` on Vercel? [[entities/landing#Two deploy targets]].
- Does the dashboard deploy need `--no-build`?
  [[entities/trading-dashboard#Deploy]].

## How to keep this current

Re-run the CRF live check after a hosting change, and save it as a new dated
file in `llm-wiki/sources/`. Re-ingest [[sources/deploy-config]] whenever
`lint.py` reports drift on it. The glob over `.github/workflows/` means a new
workflow is enough to trigger that. The host pages are [[entities/netlify]],
[[entities/vercel]] and [[entities/render]].
