# Gumroad listing copy — Growth Fabric

Paste the sections below into the Gumroad product editor. Swap
`[your name/brand]` and `[your support email]` before publishing.

---

## Product name

**Growth Fabric — 3 Production n8n AI Pipelines (Newsletter, Affiliate Social, B2B Outreach)**

## One-line pitch

Three n8n workflows where a second AI agent has to approve the first one's
output before anything ships — plus the shared Postgres schema and
dashboard views to see every run across all three.

## Price

**$39** — one-time. See `PRICING_STRATEGY.md` for the reasoning (and why
it's not $49 — different category, worth reading before you change it).

## Tags / category

`n8n`, `automation`, `ai agents`, `workflow template`, `newsletter automation`,
`affiliate marketing`, `b2b outreach`, `postgres`, `no-code`, `lead generation`

---

## Full description

### The problem with most n8n templates

Open ten "AI agent" templates on any marketplace and eight of them are one
LLM node with a clever prompt, wired straight to an action node — post,
send, publish. Nothing checks the output first. The first time that prompt
drifts, hallucinates a fact, or writes something off-brand, it goes out
anyway.

### What Growth Fabric does differently

Every pipeline in this pack is built the same way: **one agent generates,
a second and separate agent has to approve it, and only then does anything
ship.** Reject, and the pipeline logs why and stops — it doesn't ship a
worse version to be safe, and it doesn't silently retry forever.

Three real pipelines, not three variations on one idea:

- **Newsletter Engine** — pulls RSS + Hacker News daily, an agent drafts the
  issue (with a tool to read full articles, not just RSS summaries), a
  second agent QA's it and can reject with a rewrite instruction, approved
  issues send via Loops.so.
- **Affiliate Social Fabric** — new product row in a Google Sheet →
  real Amazon product data → AI copy + an AI-generated product image →
  posted to Telegram, Instagram and Facebook, with dedup so you never
  double-post the same product.
- **B2B Outreach Fabric** — pulls leads from Apollo.io, scrapes each
  prospect's actual website for context, an agent writes a personalized
  pitch grounded in that context, a dedicated compliance-guardrail agent
  has to pass it before Gmail sends anything, with a randomized delay so
  sends don't land in an identical-timestamp pattern.

### What's included

- 3 importable n8n workflow files (76 nodes combined)
- 1 shared Postgres schema: an execution log every pipeline writes to, one
  table per pipeline sized around its actual dedup query, and 2 ready-to-use
  dashboard views (`v_daily_pipeline_summary`, `v_b2b_outreach_summary`)
- A setup guide that lists every credential, every n8n Variable, and every
  inline placeholder each pipeline needs — checked node-by-node against the
  actual JSON, not written from the workflow names

### Who this is for

Someone already running n8n who wants three correctly-structured, dual-agent
pipelines to import and configure, instead of building the
generate-then-guardrail pattern from scratch three separate times. Solo
operators, small agencies running outreach/content for clients, indie SaaS
founders who want a newsletter that doesn't need daily hand-holding.

### Who this is NOT for

- **You want zero-setup.** You don't get it here or anywhere honest — these
  call 6+ real external services (OpenAI, Postgres, Loops.so, Google
  Sheets, Fal.ai, Telegram, Meta's Graph API, Apollo.io, Gmail, depending on
  which pipeline) and every one needs your own account and key. The setup
  guide is thorough specifically because this step is real.
- **You've never used n8n.** This is importable workflow JSON for n8n's
  editor, not a hosted SaaS tool with a dashboard of its own.
- **You want the agents to run completely unsupervised from day one.** Test
  each pipeline manually before trusting it on a schedule — the setup guide
  walks through exactly how.

### Requirements

- n8n (self-hosted or Cloud), a version recent enough to support AI Agent
  nodes and structured output parsers.
- A Postgres database.
- Your own accounts/keys for whichever external services the pipeline(s)
  you use call — full breakdown per pipeline in the setup guide, so you can
  see the list before you buy.

### FAQ

**Do I need all three pipelines, or can I use just one?**
Each imports and runs independently — only the Postgres schema is shared,
and it degrades fine if you only use one table.

**Does this include the API costs for OpenAI, Apollo, etc.?**
No — those are usage-based costs on your own accounts with those providers,
separate from this purchase.

**Can I modify the prompts / targeting / schedule?**
Yes, and you'll want to — the B2B pipeline in particular ships with sample
industry/location targeting you should point at your own ICP. Every prompt
is a normal n8n node, editable like any other.

**What if a service I need (Meta, Apollo) changes its API?**
This is workflow JSON, not a hosted service — it doesn't auto-update. If a
third-party API changes its contract, the affected HTTP node needs a manual
update, same as it would for any direct integration you built yourself.

**Updates?**
[Confirm your own update/versioning policy before publishing.]

### Suggested assets to capture before publishing (not included here)

- A screenshot of one pipeline's node graph in the n8n editor — this sells
  itself far better than describing "26 nodes" in text.
- A screenshot or short clip of `v_daily_pipeline_summary` returning real
  rows — proves the logging isn't decorative.
- The QA/compliance structured-output schema (`APPROVED`/`REJECTED` with
  reasoning) shown as a real example output — this is the credibility
  screenshot for the "second agent has to approve it" claim.

### Refund / support policy (fill in and confirm before publishing)

Same guidance as any digital-goods listing: state your policy plainly and
keep it consistent with your local consumer-law obligations. Given the real
setup effort here, consider being explicit that refund eligibility isn't
contingent on the buyer's own third-party accounts/API access working —
that's outside what this product controls.
