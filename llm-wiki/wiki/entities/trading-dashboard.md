# Trading dashboard

A React mock dashboard for trading bots, in `trading-dashboard/`. A GitHub
Action deploys it to its own Netlify site. It is deliberately kept out of the
set of things to sell.

## What it is

- It is built from React components, Tailwind styles and SVG charts, and runs
  on mock data. It has no real broker connections, payments, database or
  authentication [[sources/deployment-guide#Checklist and scope]].
- It had no commits in the audit's 60-day window
  [[sources/productized-audit#Scope and bar]]. It was excluded from selling
  over liability ("is this financial advice"), not after a code audit
  [[sources/productized-audit#Rejected candidates]].

## Deploy

`netlify-deploy.yml` builds it with Node 20 and deploys
`trading-dashboard/dist` to its own Netlify site on pushes under
`trading-dashboard/**` [[sources/deploy-config#Netlify workflows]]. See
[[entities/netlify]].

> [!WARNING]
> **Stale.** The root `DEPLOYMENT_GUIDE.md` tells you to connect the repo to
> Netlify with base directory `trading-dashboard` and to store the site id in
> `NETLIFY_SITE_ID` [[sources/deployment-guide#Quick start]]. The workflow uses
> `NETLIFY_TRADING_DASHBOARD_SITE_ID` instead, because "the shared
> NETLIFY_SITE_ID points at the Digital Renaissance site"
> [[sources/deploy-config#Netlify workflows]]. Following the guide would
> publish the dashboard over digital-renaissance.tech. Connecting the repo
> would also bring in the root `netlify.toml`, which publishes
> `digital-renaissance/site` [[sources/deploy-config#Netlify root config]].
> The general trap is [[concepts/monorepo-shared-singletons]].

> [!NOTE]
> **Gap.** This is the only Netlify workflow that deploys without
> `--no-build` [[sources/deploy-config#Netlify workflows]]. The other two say
> the flag stops the root `netlify.toml` build from running first. No source
> settles whether that matters here, where the root file sets a publish
> directory but no build command. A dashboard deploy log in GitHub Actions
> would settle it.
