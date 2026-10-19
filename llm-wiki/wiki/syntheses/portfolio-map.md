# Portfolio map

Every project in the repo in one table: what it is, how it's tested, where it
deploys, what the audit made of it, and how much the wiki knows about it.

**Question:** what is in this repo, how far along is each part, and where
should the next reading go?

## The map

| Project | What it is | Tests and CI | Deploys to | Audit verdict | Wiki |
|---|---|---|---|---|---|
| CRF storefront (`crf-builder/`, `supabase/`, `docs/crf/`) | storefront for CRF250L/300L owners: graphics kit, racewear, ECU template | no test suite, by design; a validation checklist instead | Vercel, from `eoinmcgee1993/crf-builder` | "the asset" | [[entities/crf-storefront]] |
| EdgeVault (`productized/edgevault-fulfillment-kit/`) | the CRF backend packaged as a $49 kit | none | Gumroad, not yet listed | Asset 1, packaged | [[entities/edgevault]] |
| Growth Fabric (`productized/n8n-growth-fabric/`, `n8n-workflows/`) | three n8n AI pipelines as a $39 pack | none | Gumroad, not yet listed | Asset 2, on hold | [[entities/growth-fabric]] |
| `landing/` | Flask lead-capture app | pytest, in CI | Render and Vercel | real but thin | [[entities/landing]] |
| `offload/` | Flask waitlist app | pytest, in CI | Render | real but thin | none |
| `mediafetch/` | installable reel-downloader PWA, optional paywall | none | Render | real but thin | none |
| `audits/` | ads/SEO audit report generator | pytest, in CI | none recorded | clean, but no commits in 60 days | none |
| `kdp-compiler/` | Node PDF interior compiler | `npm test`, not in CI | none recorded | tested, but too narrow | none |
| `substack-os/` | Substack analytics engine | `npm test`, not in CI | none recorded | not assessed | none |
| `digital-renaissance/` | content workflow, static site, Money Machine | Money Machine `npm test`, not in CI | Netlify | process docs, near an info-product | [[entities/digital-renaissance]] |
| `trading-dashboard/` | React mock trading dashboard | none | Netlify, its own site | excluded (liability) | [[entities/trading-dashboard]] |
| `trading/` | trading strategy scripts | none | none recorded | excluded (liability) | none |
| `degen-diaries/` | not yet ingested | typecheck and build, in CI | none recorded | not assessed | none |
| Clearmark scripts, `sales/` | outreach engine for the Clearmark business | none | none recorded | "Don't productize an active go-to-market tool" | none |
| `plugins/` | terminal string-formatting helpers | none | none recorded | not the UI components the names suggest | none |
| `gridstrike-core/` | Next.js scaffold with one checkout route | none | none recorded | abandoned at bootstrap | none |
| `digikim/` | small single-purpose app | none | none recorded | real but thin | none |
| `starter_ai_agents/`, `ai-engineering-from-scratch/` | single-file demos | none | none recorded | educational scratch | none |
| everything else (`gates-unbound/`, `launchwhere/`, `local-downloader/` and more) | standalone scripts, pages, experiments | no shared build or test process | none recorded | not assessed | none |

Sources for each column:

- **What it is:** [[sources/root-claude-md#Test suites and CI]],
  [[sources/root-claude-md#CRF overview]],
  [[sources/root-claude-md#Repository structure]],
  [[sources/deploy-config#Render blueprint]] and
  [[sources/productized-audit#Rejected candidates]].
- **Tests and CI:** [[sources/root-claude-md#Test suites and CI]],
  [[sources/root-claude-md#CRF standards and validation]] and
  [[sources/deploy-config#CI workflows]].
- **Deploys to:** [[syntheses/deploy-matrix]]. "None recorded" means no
  deploy config in the sources ingested so far.
- **Audit verdict:** [[sources/productized-audit#Verdict]] and
  [[sources/productized-audit#Rejected candidates]].

## What stands out

- **Attention is concentrated.** In the audit's 60 days, CRF took 32 of 135
  commits. Most other projects had zero or one
  [[sources/productized-audit#Scope and bar]].
- **Few projects are tested in CI.** Three projects run tests in CI, three
  more have suites outside it, and the storefront has none by design
  [[sources/root-claude-md#Test suites and CI]]
  [[sources/root-claude-md#CRF standards and validation]].
- **Clearmark appears twice.** The outreach scripts serve the Clearmark
  business [[sources/productized-audit#Rejected candidates]], and the CRF
  storefront takes payment through a Stripe account named Clearmark
  [[sources/crf-deployment-plan#Launch]]. So one business's merchant account
  fronts another's checkout. See [[entities/stripe]].
- **The docs lag most where the work moved fastest.** The most active project,
  CRF, carries four of the wiki's flags. Its docs in this repo describe a host,
  a deploy path and a legal status that the live site no longer matches
  ([[entities/crf-storefront]]).

## Where to read next

The wiki covers the cross-project documents and CRF. These are the gaps,
roughly in order of value:

1. **Outside the repo, to settle open flags.**
   - The Stripe payments list, for [[entities/edgevault#The trust line]].
   - Recent GitHub Actions runs, for [[entities/netlify#The auth token]].
   - The Vercel project settings, for [[entities/landing#Two deploy targets]].
   - The `eoinmcgee1993/crf-builder` repository, for what is live and which
     name it trades under.
2. **CRF depth:** `docs/crf/BLUEPRINT.md`, which holds the schema and
   contracts that EdgeVault's migration is built from.
3. **The product packages:** the README, `SETUP.md`, `GUMROAD_LISTING.md` and
   `PRICING_STRATEGY.md` for each product under `productized/`.
4. **Projects not yet covered at all:** `substack-os/` with
   `docs/substack-os/`, `degen-diaries/`, the 29 documents in `ai-marketing/`,
   `docs/clearmark-product-description.md`, `sales/`, and the remaining
   READMEs.

The test for sellability is [[concepts/productization-bar]].
