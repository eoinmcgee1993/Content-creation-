# Growth Fabric

A $39 pack of three n8n AI pipelines (a newsletter engine, affiliate social
posting and B2B outreach) on one shared Postgres schema. It is on hold until
its workflow defects are fixed.

## What it is

- Three importable workflow graphs of 26, 23 and 27 nodes, 76 in all, plus a
  154-line shared schema
  [[sources/productized-audit#Asset 2, the n8n pipeline pack]].
- They use LLM agents with structured output, memory, error branches and
  schedules, and connect to Postgres, Gmail, Sheets, Telegram and RSS
  [[sources/productized-audit#Asset 2, the n8n pipeline pack]].
- The pitch is "Your AI agent shouldn't grade its own homework."
  [[sources/master-blueprint#Instagram package]] A second agent approves the
  draft in pipelines 01 and 03 only. Pipeline 02 has one LLM call and a check
  that the copy isn't empty [[sources/master-blueprint#Recap and corrections]].
- It costs $39 [[sources/master-blueprint#Recap and corrections]]. The audit
  notes that n8n template packs "typically clear $19–35, not $49, unless
  bundled or sold with support"
  [[sources/productized-audit#Asset 2, the n8n pipeline pack]]. The reasoning
  behind the price is in `productized/n8n-growth-fabric/PRICING_STRATEGY.md`,
  which is not yet ingested.
- The source workflows are in `n8n-workflows/` (not yet ingested).

## Why it waits

- "One commit, zero iteration": as far as the repo shows, it has never run
  against a failure it didn't anticipate. It also can't run on its own; the
  buyer brings the n8n instance, the OpenAI key and the credentials
  [[sources/productized-audit#Asset 2, the n8n pipeline pack]].
- Six defects must be fixed first [[sources/master-blueprint#Launch blockers]].
  The worst is SQL built by interpolating third-party (Apollo) data. The
  others:
  - the duplicate check can't match
  - a row goes `LIVE` after a failed publish
  - the error branches are inert
  - `tokens_consumed` is always 0
  - no pipeline has been run end to end
- It is held until [[entities/edgevault]] has sold, then sold in a $69 bundle
  [[sources/master-blueprint#Launch blockers]].

## Corrections already made

The first package overstated the product. It said all three pipelines had an
approving agent and that pipeline 02 never double-posts. Its listing carried
an "eight of ten templates" line that was an invented statistic, and its setup
guide missed four values. All of this was corrected on 2026-09-25
[[sources/master-blueprint#Recap and corrections]]
[[sources/productized-audit#Corrections]]. It is the clearest example of why
[[concepts/claim-by-mechanism]] exists.
