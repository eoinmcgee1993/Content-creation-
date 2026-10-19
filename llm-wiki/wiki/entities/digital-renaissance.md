# Digital Renaissance

A content project. Its static site in `digital-renaissance/site/` is what the
repo's root `netlify.toml` publishes, and it deploys to
digital-renaissance.tech. It also hosts the Money Machine page.

## What it is

- The root `netlify.toml` publishes `digital-renaissance/site`
  [[sources/deploy-config#Netlify root config]]
  [[sources/root-claude-md#Deploy targets and traps]]. Its Netlify site is
  the one the shared `NETLIFY_SITE_ID` secret points at, digital-renaissance.tech
  [[sources/deploy-config#Netlify workflows]].
- The Money Machine page lives in `digital-renaissance/site/money-machine/`.
  Its tests and 3D-model build are in `digital-renaissance/money-machine/`
  (`npm test`), outside CI [[sources/root-claude-md#Test suites and CI]].
- It had six commits in the audit's window
  [[sources/productized-audit#Scope and bar]]. The audit judged it "a content
  workflow spec … plus a static site", closer to an info-product than to
  sellable code [[sources/productized-audit#Rejected candidates]].
- Its own docs (`CONTENT_OS.md`, `EDITORIAL_SYSTEM.md`, the Money Machine
  README) are not yet ingested.

## Deploy

`deploy.yml` runs on a push to `main` under `digital-renaissance/site/**`. It
uploads the folder with `--no-build`, using `NETLIFY_AUTH_TOKEN` and
`NETLIFY_SITE_ID` [[sources/deploy-config#Netlify workflows]]. The root
`netlify.toml` is this project's config, so any other Netlify site linked to
the repo would serve this project instead
[[sources/root-claude-md#Deploy targets and traps]]. See
[[concepts/monorepo-shared-singletons]] and [[entities/netlify]].

> [!WARNING]
> **Stale.** `deploy.yml` explains its `--no-build` flag by saying the root
> `netlify.toml` build is "(trading-dashboard)"
> [[sources/deploy-config#Netlify workflows]]. The file now publishes
> `digital-renaissance/site` and has no build command
> [[sources/deploy-config#Netlify root config]]. The flag is still right;
> only the stated reason is out of date.
