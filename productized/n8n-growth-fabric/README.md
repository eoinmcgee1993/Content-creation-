# Growth Fabric

**Three production n8n workflows that each pair a generating AI agent with a
second, independent guardrail agent — nothing goes out the door (an email, a
post, an outreach message) until the second agent signs off.**

A shared Postgres schema logs every run across all three, so you get one
health dashboard instead of three. No single-purpose "here's a prompt in an
n8n node" template — each pipeline is a real production shape: dedup checks
before spending API credits, an error-trigger branch that fires on any node
failure, and a compliance/QA gate that can reject and redirect before
anything ships.

## The pattern, once, then applied three times

Every pipeline in this pack follows the same shape:

```
trigger → gather/dedup → Agent A generates → Agent B checks → ✅ ship / ❌ log & stop
```

Agent A and Agent B are never the same call. Agent B has its own model, its
own structured-output schema, and the authority to block Agent A's output
outright. That split is the actual product here — it's the difference
between "an LLM posts to your Instagram" and "an LLM's output gets reviewed
before it posts to your Instagram."

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
call, returns `APPROVED` or `REJECTED` with reasoning and either the final
markdown or a rewrite instruction. Approved issues get compiled to HTML and
sent via Loops.so; every run — sent or rejected — is logged to Postgres with
the QA reasoning attached.

### Pipeline 2 — Affiliate Social Multi-Posting Fabric

Triggered by a new row in a Google Sheet (your product queue). Deduplicates
against everything already published, pulls live product data from the
Rainforest API (Amazon product data), writes short-form copy with one LLM
call, generates a product image via Fal.ai's Flux Schnell, then publishes to
Telegram, Instagram and a Facebook Page in parallel — and only marks the
sheet row `LIVE` once the publications are actually confirmed.

### Pipeline 3 — Hyper-Personalized B2B Outreach Fabric

Weekday-morning cron. Pulls leads from Apollo.io, skips anyone already
contacted, **scrapes the prospect's own website** for real context, then
**Agent A** (GPT-4o) writes a personalized pitch grounded in that context.
**Agent B** is a dedicated compliance guardrail — a second model call whose
only job is to return `PASSED` or `FAILED_FILTER` with the reason — before
anything reaches Gmail. A randomized delay before send avoids the "50
identical-timestamp emails" pattern that gets outreach flagged.

## The shared schema

One `system_execution_logs` table every pipeline writes to (pipeline name,
status, tokens consumed, error message), plus one table per pipeline
(`newsletter_campaigns`, `affiliate_publications`, `b2b_outreach_leads`) with
the indexes each pipeline's own dedup query actually needs — not generic
indexes, the ones the hot-path queries use. Two views ship for free:
`v_daily_pipeline_summary` (success/failure/rewrite counts and token spend,
per pipeline, per day) and `v_b2b_outreach_summary` (compliance pass rate and
delivery attempts). Point Metabase, Retool, or just `psql`, at the same
database and you have a dashboard on day one.

## What this pack is NOT

Being direct about this up front, the way we'd want to be told: **these are
not zero-setup.** Every pipeline calls real external services, and every one
of those needs your own account and your own key before the workflow does
anything. `SETUP.md` lists every single one with the exact credential name
n8n expects, because half of "does this work" for an n8n template is whether
the setup doc actually matches the JSON — most don't. This one does; we
checked every node's `parameters` block against a step-by-step to write it.

This also isn't a no-code product for a non-technical buyer to run
unattended — it's for someone comfortable in n8n's editor who wants three
solid, correctly-structured pipelines to import and wire up, instead of
building the same dual-agent-guardrail shape from a blank canvas three
times.

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
