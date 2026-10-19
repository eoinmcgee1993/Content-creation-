# Netlify

Static hosting for Digital Renaissance and the trading dashboard, and until
its move to Vercel, for the CRF storefront. The repo's single root
`netlify.toml` constrains all three.

## Sites

| Site | Project | How it deploys | State |
|---|---|---|---|
| digital-renaissance.tech, via the shared `NETLIFY_SITE_ID` | [[entities/digital-renaissance]] | `deploy.yml`, on push, with `--no-build` | configured |
| its own site, via `NETLIFY_TRADING_DASHBOARD_SITE_ID` | [[entities/trading-dashboard]] | `netlify-deploy.yml`, on push | configured |
| `crf-garage` | [[entities/crf-storefront]] | `deploy-ecu-app.yml`, by hand only | returns 404 on every route |

Sources: [[sources/deploy-config#Netlify workflows]] and
[[sources/2026-09-29-crf-live-check#Status codes]]. Only the CRF row was
checked live.

## The root netlify.toml

Any Netlify site linked to this repo builds with the root `netlify.toml`,
which publishes `digital-renaissance/site`. A linked site would therefore
serve Digital Renaissance [[sources/root-claude-md#Deploy targets and traps]]
[[sources/deploy-config#Netlify root config]]. That single file explains
several choices:

- CRF was never connected to the repo and was deployed by upload
  [[sources/root-claude-md#CRF task handling and deploying]].
- The CRF and Digital Renaissance workflows pass `--no-build`
  [[sources/deploy-config#Netlify workflows]].
- CRF pull-request deploy previews "sometimes fail for reasons that have
  nothing to do with the change" [[sources/crf-system#Deploy mechanics]].

The general pattern is [[concepts/monorepo-shared-singletons]]. Every Netlify
deploy is listed in [[syntheses/deploy-matrix]].

## The auth token

> [!NOTE]
> **Gap.** `deploy-ecu-app.yml` says `NETLIFY_AUTH_TOKEN` "was revoked, so
> every run since has failed" [[sources/deploy-config#Netlify workflows]].
> `docs/crf/SYSTEM.md` says it "is revoked" [[sources/crf-system#Known gaps]],
> and the CRF plan lists a fresh one as blocked on the owner
> [[sources/crf-deployment-plan#Verification and rollback]]. The Digital
> Renaissance and trading dashboard workflows use the same secret
> [[sources/deploy-config#Netlify workflows]]. If it hasn't been replaced,
> their deploys are failing too. Their recent runs in GitHub Actions would
> show whether it has.
