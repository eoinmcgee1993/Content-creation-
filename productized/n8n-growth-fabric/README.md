# Growth Fabric

**Three production n8n workflows. In two of them — the newsletter engine and
the B2B outreach pipeline — a generating AI agent is paired with a second,
independent guardrail agent, and nothing goes out until the second agent
signs off.**

A shared Postgres schema gives every pipeline its own ledger table plus one
execution log, so there's one database to look at instead of three. No
single-purpose "here's a prompt in an n8n node" template — each pipeline is
a real production shape: dedup before any model call, an error-trigger
branch, and — in the newsletter and outreach pipelines — a QA or compliance
agent that can reject before anything is sent.

## The pattern, and where it applies

Pipelines 01 and 03 follow the same shape:

```
trigger → gather/dedup → Agent A generates → Agent B checks → ✅ send / ❌ log & stop
```

Agent A and Agent B are never the same call. Agent B has its own model, its
own structured-output schema, and the authority to block Agent A's output
outright. That split is the actual product here — it's the difference
between "an LLM emails your prospects" and "an LLM's draft gets reviewed
before it emails your prospects."

Pipeline 02 (affiliate social) is simpler, and we'd rather say so than
imply otherwise: one LLM call writes the copy, and a deterministic check
(the copy isn't empty) gates publishing. There is no second agent in it.

## What's included

```
pipeline-1-newsletter-engine.json          26 nodes
pipeline-2-affiliate-social-fabric.json    23 nodes
pipeline-3-b2b-outreach-fabric.json        27 nodes
database-schema.sql                        shared Postgres schema + 2 dashboard views
```

### Pipeline 1 — Autonomous Newsletter Engine

Cron-triggered (default 6 AM daily). Pulls TechCrunch, The Verge and Wired
RSS plus Hacker News top stories, dedupes and cleans the merged feed, then
**Agent A** (an n8n AI Agent, not a single prompt — it has a window-buffer
memory and a tool to fetch a story's full page when the RSS summary isn't
enough) drafts the newsletter. **Agent B**, a separate structured-output
call, returns `APPROVED` or `REJECTED`, its reasoning, and the final
markdown. Approved issues get compiled to HTML and sent via Loops.so. A
rejection goes to a fallback rewrite chain and is logged — never sent. Every
run is logged to Postgres; rejections carry Agent B's reasoning.

### Pipeline 2 — Affiliate Social Multi-Posting Fabric

Triggered by a new row in a Google Sheet (your product queue). Checks the
product against everything already published, pulls live product data from
the Rainforest API (Amazon product data), writes short-form copy with one LLM
call, generates a product image via Fal.ai's Flux Schnell, then publishes to
Telegram, Instagram and a Facebook Page in parallel, logs the publication to
Postgres and marks the sheet row `LIVE`. Every publish node is set to
continue on failure, so one channel failing doesn't stop the others — and
doesn't stop the row reaching `LIVE` either. See Known limitations.

### Pipeline 3 — Hyper-Personalized B2B Outreach Fabric

Weekday-morning cron. Pulls leads from Apollo.io, skips anyone already
contacted, **scrapes the prospect's own website** for real context, then
**Agent A** (GPT-4o) writes a personalized pitch grounded in that context.
**Agent B** is a dedicated compliance guardrail — a second model call whose
only job is to return `PASSED` or `FAILED` with the corrective action
required — before anything reaches Gmail. Failures are logged (the lead as
`FAILED_FILTER`, the reason in the execution log) and nothing is sent. A randomized delay before send avoids the "50
identical-timestamp emails" pattern that gets outreach flagged.

## The shared schema

One `system_execution_logs` table (pipeline name, status, tokens consumed,
error message), plus one table per pipeline (`newsletter_campaigns`,
`affiliate_publications`, `b2b_outreach_leads`) with the indexes each
pipeline's own dedup query actually needs — not generic indexes, the ones the
hot-path queries use. Pipeline 01 writes every run to the execution log;
02 and 03 write their failures there and their successes to their own
tables. Two views ship for free: `v_daily_pipeline_summary` (success,
failure and rewrite counts per pipeline per day — the token column reads 0,
because the shipped workflows don't populate `tokens_consumed`) and
`v_b2b_outreach_summary` (compliance pass rate and delivery attempts). Point
Metabase, Retool, or just `psql`, at the same database.

## What this pack is NOT

Being direct about this up front, the way we'd want to be told: **these are
not zero-setup.** Every pipeline calls real external services, and every one
of those needs your own account and your own key before the workflow does
anything. `SETUP.md` lists every single one with the exact credential name
n8n expects, because half of "does this work" for an n8n template is whether
the setup doc actually matches the JSON. Every `$vars` reference and
`YOUR_…` placeholder in the three files is listed there, found by searching
each file end to end — Code nodes and sheet pickers included.

This also isn't a no-code product for a non-technical buyer to run
unattended — it's for someone comfortable in n8n's editor who wants three
solid, correctly-structured pipelines to import and wire up, instead of
building them from a blank canvas.

## Known limitations

Found in a line-by-line pass over the workflow JSON. Fix these before the
first sale, then delete this section.

- **Pipeline 02's duplicate check can't match.** It looks up the sheet's raw
  `product_url`, but stores `https://www.amazon.com/dp/<ASIN>?tag=…` whenever
  the product has an ASIN — so re-adding a product publishes it again.
- **SQL is built by string interpolation.** Several values reach the query
  unescaped, including `prospect_email` and `corporate_website` from Apollo
  (third-party data) and the product URL from the sheet. Move them to the
  Postgres node's query parameters.
- **Pipeline 02 can mark a row `LIVE` after a failed publish** (every publish
  node continues on failure). Gate the sheet update on per-channel success.
- **The error branches are inert until wired.** n8n only fires an Error
  Trigger for workflows that name it as their error workflow; none of the
  three sets one. `SETUP.md` covers the one-line fix.
- **`tokens_consumed` is always 0**, so the dashboard view's token column is
  too.

## Requirements

- A running n8n instance (self-hosted or n8n Cloud), version supporting AI
  Agent nodes and structured output parsers (1.5x or later).
- A Postgres database reachable from that instance.
- Accounts on whichever external services the pipeline(s) you use call —
  full list, and which pipelines need which, in `SETUP.md`.

## License

Personal and commercial use. Import and run these in as many of your own or
client n8n instances as you like. You may not resell, sublicense, or
redistribute the workflow files themselves — in whole or in part — as a
competing template product. No warranty: you're responsible for your own API
usage, costs, and compliance with each third-party service's terms (Meta's
Platform Terms and Apollo.io's usage policy in particular — read them before
pointing pipeline 2 or 3 at real accounts). *(Confirm against your own terms
of sale before publishing — starting point, not legal advice.)*
