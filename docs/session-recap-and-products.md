# Session Recap & Product Description

**Date:** 2026-09-25 · **Repo:** `eoinmcgee1993/Content-creation-`

---

# Part 1 — Recap: what was done

## 1. Deployed the landing page (after Render kept failing)

**Diagnosis.** `render.yaml` declares a persistent `/data` disk for the leads CSV
and `plan: starter`. Render's free tier provides neither, which is the most
likely cause of the repeated deploy failures.

**Path taken.** Three hosts were attempted, in order:

| Host | Outcome |
|---|---|
| Vercel | Prepared a serverless target (`vercel.json`, `api/index.py`, env-gated `GEN_DIR`), verified locally under read-only-FS conditions. Deploy blocked: the connected token returned **403 — "You don't have permission to create a project."** |
| Netlify | **Shipped.** Static build + **Netlify Forms** for lead capture. |
| Container hosts (Fly/Railway) | Not used — would need interactive auth unavailable in this session. |

**Why Netlify won.** Vercel's serverless filesystem is ephemeral (`/tmp`), so
leads would have needed Mailchimp/MailerLite credentials wired up *before* the
page could safely take traffic. Netlify Forms stores every submission
server-side with built-in email notification — fewer moving parts, and leads
cannot evaporate.

**Live:** https://clearmark-pro.netlify.app — verified end-to-end: all routes
200, form `clearmark-verify` registered (email + source, honeypot on), and a
real test submission was captured then deleted.

**Also found:** four Clearmark sites already exist on the account, including
**`clearmark.pro` (site `clearmark-v2`) which is live production**. It was left
untouched — overwriting it is one-way and needs an explicit decision.

## 2. Reviewed and fixed two open pull requests

### PR #60 — KDP interior compiler
Seven findings. The KDP spec constants themselves were verified correct (gutter
tiers, 0.002252″/page spine, 590-page cap, bleed geometry). Three had already
been fixed on `main`; **four were fixed and pushed:**

- **Page ordering.** Bare `.sort()` is lexicographic: `page-1, page-10, page-11,
  page-2…`. Art was bound out of sequence and every folio after the ninth was
  wrong. Now collates numerically. *This was the worst failure mode — it ships a
  wrong book with no error.*
- **Alpha handling.** `greyscale()` drops the alpha channel instead of
  compositing it, so a transparent-background PNG measured as a solid black page
  (`inkRatio` 1.0) and valid line art was rejected as "too dense to colour". Now
  flattens onto white. The colour check had the same defect via `removeAlpha()`.
- **Bleed margins.** With `useBleed`, margins were subtracted from the
  bleed-inclusive page size, making every margin one bleed tighter than declared
  and leaving art off-centre on the trim. Margins are now measured off the trim.
- **DPI gate.** The compile gate tested raw pixel dimensions against a fixed
  portrait threshold, rejecting landscape art well above 300 DPI. It now scores
  effective DPI after the aspect-preserving fit.

Tests extended to cover each fix: **11/11 pass.**

### PR #56 — Higgsfield CLI documentation
Every command in the doc was checked by installing `@higgsfield/cli` 1.1.26 and
running `--help`. **Seven documented invocations exited non-zero; all fixed and
pushed.** Six were the same mistake — the Websites section was written in a
positional-argument style the CLI uses nowhere:

- `website create` — `--category` missing from both examples; `--type app` also
  requires `--template`.
- `website secrets set/delete` — required `--name`; **the positional form set no
  secret and reported nothing.** (Correcting the review: there is no `--value`
  flag; the value comes from a prompt or `--value-stdin`.)
- `website db rows/schema` — require `--table`; `db query` requires `--sql`.
- `account` — is a parent command; the balance is under `account status`.
- Global flags — only `--json`/`--no-color` are global. `--wait` is per-command
  and the timeout flag is `--wait-timeout` on `generate` but `--timeout` on
  `dtc-ads`.
- `soul-id create` — "5+ photos" omitted the CLI's 5–20 cap.

## 3. Reviewed the audit engine — found a critical costing bug

`total_leakage` was a plain `sum()` over all findings. The account-wide
ROAS-below-breakeven finding models `(spend − revenue)` — the *same money* the
zero-conversion and CPA-outlier findings already claim campaign by campaign.

**Reproduced:** a 4-campaign account spending \$8,000 at 0.15x ROAS reported
**\$12,700 recoverable — 159% of spend.** You cannot recover more than you
spent, and it is the first number any client checks.

**Fixed.** Findings now carry a `scope`. Campaign-scoped findings cover disjoint
campaign sets and still add; account-scoped findings restate the same shortfall
top-down, so the total is the larger of the two views rather than their sum. The
figure is now bounded by spend by construction (85% on the case above).

**The sample report is unchanged at \$15,619** — that account runs 1.93x ROAS, so
the account-scoped finding never fired and the bug was invisible in the freebie.
Regression test added.

## 4. Health check — all green

| Suite | Result |
|---|---|
| `audits/` | **8/8 pass** (incl. new leakage-bound regression test) |
| `landing/` | **12/12 pass** (the stale `test_index_renders` assertion has since been fixed on `main`) |
| `kdp-compiler/` | **11/11 pass** (on PR #60's branch) |
| Live routes | `/`, `/thanks.html`, PDF, `clearmark.pro` — all **200** |
| Audit CLI | Generates Markdown + PDF end-to-end |

## 5. Commits pushed

| Branch | Commit |
|---|---|
| `claude/kdp-compiler-setup-nq5v2i` | `3ac06c1` — page ordering, alpha, bleed, DPI gate |
| `claude/install-higgsfield-cli-XymEl` | `32be5bf` — corrected CLI commands |
| `claude/ai-product-reverse-engineering-p6nvlx` | `fc24e4c` product description · `842b599` leakage fix |

---

# Part 2 — Products & services

> **Read this first.** There are **two distinct products** here, and only one has
> a working engine. Keeping them straight is the most commercially important
> thing in this document.

## Service A — Account Audit & Health Check ✅ **built and working**

**What it is.** A diagnostic that ingests a client's own platform exports and
returns a scored, prioritised, client-ready report with modelled monetary impact
per finding. This is the engine that actually exists (`audits/`), it is
dependency-light, and it runs offline from CSV exports — no API access, no
account linking, no onboarding friction.

**Inputs.** Two CSV exports the client can pull themselves:
- Google/Meta Ads campaign performance export
- Google Search Console query export

Header aliases are handled (`cost`/`spend`/`amount spent`, `conv.`/`purchases`/
`results`, etc.), so exports from different platforms and locales work without
reformatting.

**What it detects.**

*Paid-ads leakage:*
| Finding | Severity | Models money? |
|---|---|---|
| Campaigns spending with zero conversions | Critical | Yes — wasted spend |
| No conversion tracking present | Critical | — |
| Account ROAS below break-even | Critical | Yes — account-scoped |
| Campaigns at >2× median CPA | High | Yes — excess over median |
| Account CTR below 1% benchmark | High | — |
| Budget over-concentrated in an underperformer | Medium | — |

*SEO / Search Console:* high-impression low-CTR pages, position-vs-CTR
underperformance against an expected-CTR curve, branded-vs-non-branded mix, and
ranking drops when a prior period is supplied for comparison.

**Outputs.**
- **Health score /100** per discipline plus an overall score. Weighted by
  severity with a diminishing penalty, so one noisy category cannot zero it.
- **Modelled recoverable spend per month** — now bounded by actual spend.
- **Ranked findings**, each with detail, monetary impact, and a specific
  recommendation.
- **Markdown + PDF**, client-ready, with a methodology-and-limitations section.

**Positioning.** The monetary model is the whole product. "Your CTR is low" is
free advice available anywhere; "\$7,200/month is going to two campaigns that
have never converted, here is the list" is a diagnosis that justifies a fee and
survives scrutiny — which is exactly why the double-counting bug mattered.

**Delivery.** `python -m audits --ads ads.csv --seo gsc.csv --client "Name"`

## Service B — Clearmark, Answer Engine Presence (AEP) ⚠️ **marketing only**

**What it is positioned as.** Monitoring whether AI answer engines cite your
brand. Three pillars: **citation coverage** (which engines cite you, per query),
**hallucination detection** (whether what they say about you is true, scored
separately from coverage), and **competitive gap analysis** (who is named instead
of you, by topic cluster). Output is an AEP score /100.

**Plans as advertised:** Starter free (1 domain, 4 engines, 10 query patterns,
monthly) · Pro \$49/mo per domain (5 domains, 12+ engines, 40 patterns, weekly,
hallucination alerts, gap analysis, API) · Enterprise custom.

**The gap.** A repo-wide grep for `aep|answer engine|perplexity|citation` across
all Python/TS/SQL returns **nothing but a test file**. No answer-engine querying
is implemented. The landing page sells AEP monitoring, and the lead magnet it
hands prospects is the **Service A** report — a Google Ads spend audit. A
prospect who signs up to "Verify Your Answer Engine Presence" receives CPA and
ROAS figures. Different product, at the exact moment trust is being established.

**Also outstanding on Clearmark:** the three testimonials (Synthex AI, Foundry
Labs, Orbital) read as placeholders and are stripped from the deployed page;
"400+ teams" is unsubstantiated; and the AEP score needs a published methodology
before teams will report it internally.

## Supporting tooling (internal, not sold)

- **KDP interior compiler** (`kdp-compiler/`) — compiles colouring-book interiors
  to KDP print spec: gutter tiers by page count, bleed geometry, recto placement,
  folio stamping, and a QA gate for colour/resolution. Phase 0, PR #60.
- **Landing / lead capture** (`landing/`) — Flask app, CSV log plus optional
  Mailchimp/MailerLite sync; also deployable as a static site with Netlify Forms.
- **Higgsfield CLI docs** (`docs/higgsfield-cli.md`) — generation tooling
  reference, PR #56.
- **CRF storefront** (`crf-builder/`) — separate project with its own conventions
  and deploy target; see `docs/crf/`.

---

## Recommended next steps

1. **Fix the funnel mismatch.** Either build the AEP scanner so Clearmark
   delivers what it sells, or swap the lead magnet to a real sample AEP report.
   Until then the page converts prospects into confused recipients.
2. **Decide on `clearmark.pro`.** It already serves a live page. Options:
   replace it with the new page (snapshot first), or keep it and iterate on
   `clearmark-pro.netlify.app`.
3. **Turn on Netlify form notifications** so leads reach an inbox rather than
   sitting in the dashboard.
4. **Sell Service A now.** It works, it is verified, and the monetary model is
   defensible. It needs no further engineering to invoice against.
5. **Real testimonials** before the social-proof section goes back up.
