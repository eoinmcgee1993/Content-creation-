# Index

The map of the wiki. It lists every page by category, with the sentence the
page opens with. Read it before anything else. The rules are in
`llm-wiki/CLAUDE.md`, and the history is in [[log]].

Start with [[syntheses/portfolio-map]]. For open contradictions and gaps, run
`python3 llm-wiki/lint.py`, which lists every flag.

## Syntheses

- [[syntheses/portfolio-map]]: every project in the repo in one table (what
  it is, how it's tested, where it deploys, what the audit made of it, and how
  much the wiki knows about it).
- [[syntheses/deploy-matrix]]: every deploy in or around this repo, with its
  target, trigger, shared config and secrets, and where its documents
  disagree with the config.

## Entities

### Projects and products

- [[entities/crf-storefront]]: a static storefront for Honda CRF250L/CRF300L
  owners that sells a graphics-kit SVG, quotes custom racewear and gives away
  an ECU tune template, with Supabase doing all the trusted work.
- [[entities/edgevault]]: a $49 Stripe + Supabase fulfilment kit packaged from
  the CRF storefront's backend (six Edge Functions, a schema and two
  reference pages). Not yet listed.
- [[entities/growth-fabric]]: a $39 pack of three n8n AI pipelines on one
  shared Postgres schema, on hold until its workflow defects are fixed.
- [[entities/landing]]: a Flask lead-capture page that offers a sample ads/SEO
  audit report for an email address, deployed to both Render and Vercel.
- [[entities/digital-renaissance]]: a content project whose static site is
  what the root `netlify.toml` publishes. It deploys to
  digital-renaissance.tech and hosts the Money Machine page.
- [[entities/trading-dashboard]]: a React mock dashboard for trading bots,
  deployed to its own Netlify site and deliberately kept out of the set of
  things to sell.

### Platforms and services

- [[entities/netlify]]: static hosting for Digital Renaissance, the trading
  dashboard and formerly CRF, all constrained by the one root `netlify.toml`.
- [[entities/vercel]]: hosting for the landing app (from this repo) and the
  CRF storefront (from a separate repository).
- [[entities/render]]: three unrelated Python services from one
  `render.yaml` (the audit landing page, Offload and MediaFetch).
- [[entities/supabase]]: Postgres and Deno Edge Functions. The whole trusted
  backend of CRF and EdgeVault, in a schema shared with other projects.
- [[entities/stripe]]: payments for the CRF graphics kit, through a live-mode
  Payment Link and a signature-verified webhook, and optionally MediaFetch's
  paywall.
- [[entities/gumroad]]: the store where EdgeVault and Growth Fabric are to be
  sold. Neither is listed yet.

## Concepts

- [[concepts/browser-can-only-create]]: the browser's key may insert rows and
  nothing else, and every read happens server-side.
- [[concepts/server-owned-state]]: money and approval fields are written only
  by trusted code, and triggers overwrite whatever a client sends for them.
- [[concepts/uniform-404]]: a wrong token gets the same answer as a wrong id,
  so an endpoint can't reveal which ids exist.
- [[concepts/productization-bar]]: code is ready to sell when it is at least
  70% functional, judged by what it does and by its history, not by its
  README.
- [[concepts/claim-by-mechanism]]: describe how a thing works, invent nothing,
  say who it isn't for, and cut any claim that doesn't trace to a line of
  source.
- [[concepts/monorepo-shared-singletons]]: in a repo of unrelated projects,
  anything that exists only once (a root config, a secret, a schema) couples
  them.

## Sources

- [[sources/root-claude-md]]: root `CLAUDE.md`, which covers the repo layout,
  tests and deploy traps (§5) and the CRF rules (§6–10).
- [[sources/deployment-guide]]: root `DEPLOYMENT_GUIDE.md`, a trading-dashboard
  Netlify guide whose secret wiring is now stale.
- [[sources/deploy-config]]: `netlify.toml`, `vercel.json`, `api/index.py`,
  `render.yaml`, `supabase/config.toml` and the seven GitHub workflows.
- [[sources/productized-audit]]: `productized/AUDIT.md`, which audits the repo
  for sellable code and picks the CRF backend and the n8n pack.
- [[sources/master-blueprint]]: `productized/MASTER_BLUEPRINT.md`, with the
  launch blockers, brand, Gumroad and Instagram packages and launch order for
  both products.
- [[sources/crf-deployment-plan]]: `docs/crf/DEPLOYMENT.md`, CRF's plan and
  state, including the move to Vercel and "Nobody has ever completed a
  purchase".
- [[sources/crf-system]]: `docs/crf/SYSTEM.md`, the CRF reference covering
  products, architecture, data model, enforcement and known gaps.
- [[sources/2026-09-29-crf-live-check]]: a dated capture of CRF's routes on
  both hosts, the page titles, and whether the legal facts are set.
