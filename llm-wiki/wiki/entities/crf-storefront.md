# CRF storefront

A static storefront for Honda CRF250L/CRF300L owners. It sells a graphics-kit
SVG, quotes custom racewear and gives away an ECU tune template, and Supabase
does all the trusted work.

## What it sells

| Product | How it's paid for | Evidence |
|---|---|---|
| Graphics kit, a print-ready SVG cut file | Stripe Payment Link, $39.00 USD; the file is released on payment | [[sources/crf-system#Graphics kit]] |
| Club racewear | quote, then artwork approval, then an invoice by hand; no card payment | [[sources/crf-system#Racewear]], [[sources/crf-deployment-plan#Where it stands]] |
| ECU tune template | free; it is the lead product | [[sources/crf-system#What it is]] |

There are no accounts. A customer gets back to an order through a link
carrying a token [[sources/crf-system#What it is]]. "CRF Garage" is a
prototype name, not a trading name [[sources/root-claude-md#CRF overview]],
but see [[#Trading name]].

## How it works

- The browser can insert orders and do nothing else
  ([[concepts/browser-can-only-create]]).
- Money and approval fields are written only by trusted code
  ([[concepts/server-owned-state]]).
- Every customer read needs `(id, token)` and fails uniformly
  ([[concepts/uniform-404]]).
- Every secret lives in one table, `crf_config`, which only service-role code
  can read [[sources/crf-system#Data model]]
  [[sources/root-claude-md#CRF architecture rules]].
- The pages are plain HTML, one file each, with no build step, by design
  [[sources/root-claude-md#CRF standards and validation]].
- It has six Edge Functions: `stripe-webhook`, `kit-download`,
  `apparel-approval`, `apparel-notify`, `create-apparel-order` and
  `admin-orders`. The two other functions in `supabase/functions/` belong to
  a different project [[sources/crf-system#Not part of this system]]. See
  [[entities/supabase]] and [[entities/stripe]].

## Where it is live

> [!WARNING]
> **Stale.** Root `CLAUDE.md` says CRF is live at `crf-garage.netlify.app`,
> hosted on Netlify and deployed by uploading this repo's `crf-builder/`
> [[sources/root-claude-md#CRF overview]]
> [[sources/root-claude-md#CRF task handling and deploying]].
> `docs/crf/SYSTEM.md` §9 and the audit also place it on Netlify
> [[sources/crf-system#Deploy mechanics]]
> [[sources/productized-audit#Asset 1, the fulfillment backend]]. On
> 2026-09-29 every route on `crf-garage.netlify.app` returned 404, and every
> route on `crf-eoins-projects-99ff5888.vercel.app` returned 200
> [[sources/2026-09-29-crf-live-check#Status codes]]. That matches
> `docs/crf/DEPLOYMENT.md`, which says the site moved to Vercel and deploys
> automatically from a separate repository, `eoinmcgee1993/crf-builder`
> [[sources/crf-deployment-plan#Hosting]]. So the validation routine in root
> `CLAUDE.md` §9 checks a host that no longer serves the site, and this
> repo's `crf-builder/` may not be the code that is live.

This repo's deploy workflow still targets the Netlify site, and its push
trigger is off [[sources/deploy-config#Netlify workflows]]. For the other
projects on each host, see [[entities/vercel]] and [[entities/netlify]].

## Legal pages

> [!WARNING]
> **Stale.** Root `CLAUDE.md` says `privacy.html`, `terms.html` and
> `legal-details.js` sit in `crf-builder/`, and that privacy and terms "must
> stay 404 until their four facts exist"
> [[sources/root-claude-md#CRF task handling and deploying]]
> [[sources/root-claude-md#CRF standards and validation]]. The drafts have
> moved to `docs/crf/legal-drafts/`, outside any publish root
> [[sources/deploy-config#Netlify workflows]]
> [[sources/crf-deployment-plan#Hosting]]. On the live host, both pages
> return 200 and all four facts are set
> [[sources/2026-09-29-crf-live-check#Legal facts]]. **Inference:** Phase 2
> of the deployment plan (publishing the legal pages) is done, although no
> document in this repo says so.

The deployment plan also contradicts itself about where the facts live, and
still routes the domain and rollback through Netlify
[[sources/crf-deployment-plan#Internal inconsistencies]].

## Trading name

> [!NOTE]
> **Gap.** Every document in this repo says the trading name is undecided
> [[sources/root-claude-md#CRF overview]]
> [[sources/crf-deployment-plan#Where it stands]]
> [[sources/crf-system#Known gaps]], yet the live pages are titled
> "StreetSweeperCustoms" [[sources/2026-09-29-crf-live-check#Page titles]].
> Is that the decided name? And do the domain and the Stripe merchant name
> follow it yet? As of 2 Sep the merchant name was still *Clearmark*
> [[sources/crf-deployment-plan#Launch]]. Only the owner, or the
> `eoinmcgee1993/crf-builder` repository, can answer this.

Why the name matters:

- "CRF" is Honda's model designation, so a trading name, domain or merchant
  name built on it is exposure
  [[sources/crf-deployment-plan#Name and legal pages]].
- A statement descriptor buyers don't recognise causes chargebacks, "and a
  chargeback on a $39 digital file costs more than the sale"
  [[sources/crf-deployment-plan#Launch]].

## Payments so far

On 2 Sep the plan was checked against the live Stripe account. The account is
in live mode, the $39 link is live and the webhook is enabled, but "Nobody has
ever completed a purchase". The one checkout session, from 8 Aug, expired
unpaid [[sources/crf-deployment-plan#Launch]]. The audit claims the opposite,
and that claim is flagged on [[entities/edgevault#The trust line]].

## Racewear order path

> [!WARNING]
> **Contradiction.** `docs/crf/SYSTEM.md` says racewear orders go through
> `create-apparel-order`: "The browser cannot insert directly into the order
> table" [[sources/crf-system#Racewear]]. The audit counts that function as
> part of the live backend
> [[sources/productized-audit#Asset 1, the fulfillment backend]]. The
> deployment plan says the function and migration 003 were "deliberately"
> never shipped, and that the racewear page was reverted to writing through
> PostgREST [[sources/crf-deployment-plan#Hosting]]. To resolve it, check the
> live Supabase function list and the racewear page in
> `eoinmcgee1993/crf-builder`.

## What is left

- From the plan: fix the merchant identity, then run one real purchase with a
  real card and refund it. Afterwards, verify the order row and the downloaded
  file [[sources/crf-deployment-plan#Launch]].
- The racewear approval email is built but inert until three `crf_config`
  rows exist, and the operator view is built but not switched on
  [[sources/crf-system#Known gaps]]
  [[sources/crf-deployment-plan#Racewear email and operator view]].
- There is no 3D preview. The brief is written but the model is not
  commissioned [[sources/crf-system#Known gaps]].

## As a product

The audit picked this backend as the repo's most sellable code, and it is
being packaged as [[entities/edgevault]]
[[sources/productized-audit#Verdict]].
