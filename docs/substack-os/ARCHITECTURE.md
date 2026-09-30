# Substack OS — architecture

## The shape

```
Substack  ──MCP──▶  AI assistant  ──▶  ingest.js  ──▶  data/<publication>.json
                    (Claude / ChatGPT)                            │
                                                              store.js
                                                                  │
                                            ┌─────────────────────┤
                                            ▼                     ▼
                                   substack-os/engine.js    (same engine)
                                            │                     │
                                       dashboard          a future ChatGPT app
                                                          or Claude artifact
```

One engine, any number of front ends. That is the whole idea, and everything
below is in service of it.

There is no server anywhere in it, and no database. *Why a file and not a
database* below explains how it got that way.

---

## Why ingest is not a cron job

This is the part of the original plan that does not survive contact, so it is
worth being exact.

The natural design is a 06:00 scheduler that pulls yesterday's numbers from
Substack's MCP endpoint and writes them to the database. **That cannot be
built**, for a reason that is structural rather than a matter of effort:

- MCP is a protocol spoken by an **AI assistant acting for a signed-in user**.
  Authorisation comes from that user's session.
- Substack's official MCP is **read-only** and documents **no server-to-server
  token flow**. There is no API key to put in a scheduler.
- So an n8n cron, a Supabase scheduled function, or a GitHub Action has nothing
  to authenticate *with*. It is not that it is hard; there is no credential.

The honest resolution is to move the schedule up a layer. **The assistant is
the ingest agent.** A scheduled assistant session reads the publication through
MCP and pipes the result into `ingest.js`. The store, the engine and the
dashboard never talk to Substack at all.

This costs little and buys a lot: the boundary is a plain JSON payload, so if
Substack ever ships a token-authenticated HTTP API, a real scheduler emits the
*same* payload and nothing downstream changes.

### Two access limits to plan around

- **Substack's official MCP requires a Bestseller publication.** If yours is
  not eligible yet, everything here still works — ingest from a CSV export
  with `"source": "manual_csv"`, and the rest of the system cannot tell the
  difference.
- **Third-party Substack MCP servers are not the official one.** If you connect
  one, keep it isolated and narrowly permissioned. It is not covered here.

---

## Why a file and not a database

This was Postgres — a Supabase project, a migration, two Edge Functions and two
shared secrets. Moving off it was a deliberate correction rather than a
workaround, so it is worth being exact about the reason.

**One publication writing one snapshot a day is about 365 rows a year.** Postgres
was never here for scale; it was here to keep the history Substack will not let
you query. A JSON file in a private repository does that, and adds an audit trail
for free: `git log -p substack-os/data/<publication>.json` is every revision of
every number, which the database version would have needed a schema change to
get.

What it removes matters more than what it adds:

| | Before | Now |
|---|---|---|
| Setup | project, migration, two secrets, two deploys | none |
| Secrets | `ingest_key`, `dashboard_key` | none |
| Failure modes | project unreachable, key unset, RLS misconfigured, `onConflict` target missing | the file is not there |
| Verification | drive two endpoints over HTTPS | `npm test` |
| History | `captured_at`, and whatever you add | `git log` on the data file |

That "project unreachable" row is not hypothetical. The hosted route spent a week
returning fourteen consecutive connection timeouts from a project that reported
`ACTIVE_HEALTHY` throughout, and in that week nothing about the system could be
verified end to end. A file has no equivalent failure.

### What was given up

Honestly: a file is **single-writer and local.** Two people ingesting at once
would race, and a reader with no checkout — a phone — cannot see it at all.
Neither is true here, and paying a database's operational cost against the day
one of them might be is how a system ends up with infrastructure nobody can
justify.

If that day comes, the seam is `store.js`: `merge()` takes a plain payload and
`read()` returns plain rows. A server implementing those two functions changes
nothing above it, and `payload.js` — which holds every validation rule, and is
where all of this system's shipped defects lived — moves across untouched.

---

## The ingest contract

Pipe this JSON to `ingest.js`. There is no key: permission to write the file is
the whole of the authorisation.

```bash
node substack-os/ingest.js substack-os/data/the-brief.json < payload.json
```

```jsonc
{
  "publication": "the-brief",
  "currency": "usd",              // optional, defaults to usd
  "source": "substack_mcp",       // optional, defaults to substack_mcp
  "daily": [
    {
      "metric_date": "2026-03-01",   // required, YYYY-MM-DD
      "subscribers": 12304,
      "paid_subscribers": 749,
      "free_subscribers": 11555,
      "new_subscribers": 38,
      "unsubscribes": 6,
      "views": 3120,
      "arr_cents": 7190400           // integer minor units. Never a float.
    }
  ],
  "posts": [
    {
      "post_id": "the-ai-revolution",  // required
      "title": "The AI Revolution",
      "published_at": "2026-03-01T09:00:00Z",
      "views": 18604, "likes": 558, "comments": 74, "shares": 111,
      "free_signups": 512, "paid_signups": 27,
      "revenue_cents": 259200,
      "traffic_source": "substack_network",
      "category": "AI"
    }
  ]
}
```

Rules `payload.js` enforces, rather than trusting the caller. Every one of them
is a defect that shipped once, and in each case the value was accepted and
quietly altered rather than refused:

- **Upsert, never append, and only the fields you sent.** Re-running a day is
  normal — Substack revises recent numbers, and a half-finished ingest has to be
  safe to repeat. A row carries only the fields its caller supplied, so
  refreshing one metric cannot null out everything an earlier run captured. An
  explicit `null` still clears a field; an absent key leaves it alone.
- **A duplicate key inside one payload is refused by name.** Two rows sharing a
  date are a caller bug, and silently letting the second win would make which
  number survived depend on array order.
- **Counts are non-negative integers.** A float in a money field is refused, not
  rounded. A typo'd currency is refused, not silently stored as `usd` — which
  relabelled a publication's revenue and still answered `{ok:true}`.
- **Only known fields are written.** A payload cannot set `captured_at`, cannot
  change which publication's file it is writing into, and cannot smuggle an
  unrecognised key into a row.
- **A present-but-invalid value is refused, never silently replaced.** An
  over-long category, a `daily` that is an object rather than an array: each
  names the offending field rather than becoming a quiet null.
- **A refusal stores nothing at all.** `merge()` returns an error or a whole new
  store, never a partial one — a half-applied snapshot leaves a history that
  looks complete and is not.
- **An omitted metric is absent, never `0`.** A day with no snapshot did not have
  zero subscribers, and a chart that draws it as zero is lying.

## Security posture

Most of the question dissolves: there is no endpoint to authenticate, no secret
to leak, no role to misconfigure and no grant to get wrong. The rest of this
repository runs on "the browser can do nothing"; here the browser cannot even
reach a write path, because there isn't one to reach.

What remains is one rule, and it is the important one: **`substack-os/data/` is
real business data.** Subscriber counts and revenue for a live publication sit in
plain JSON in the repository. What protects them is that the repository is
private and the checkout is yours — so:

- Never publish `substack-os/data/` to a static host. Serve the dashboard from a
  local checkout, not from a public deploy.
- Never make this repository public without moving that directory out first.
- Note the root `netlify.toml` publishes `digital-renaissance/site`, so this
  directory is not in any current deploy — do not add it to one.

That is a weaker guarantee than RLS with zero policies, and worth saying plainly
rather than dressing up. It is the right trade for one person's own numbers on
their own machine; it would not be for a multi-tenant product.

## Why the front ends do no arithmetic

`store.js` returns rows. Growth, conversion, churn, anomalies and attribution
are all computed in `substack-os/engine.js`, by whichever front end asked.

The alternative — computing in the store *and* in the dashboard — gives two
implementations to keep in agreement, and the first time they disagree nobody
knows which is lying. A Claude artifact and a ChatGPT app importing the same
module cannot tell the user different stories about the same week.

## The engine knows nothing about where its rows came from

`engine.js` imports nothing, references no host API, and contains no mention of
a database. It takes plain arrays of plain objects and returns plain objects.
It does not know whether its rows came from a history file, a CSV export, an MCP
tool result or a fixture — and it must not learn.

That is what lets the same calculation run in all of these without a rewrite:

| Where | How it consumes the engine |
|---|---|
| The dashboard | `import { brief } from "./engine.js"` in a `<script type="module">` |
| A history file | `read()` in `store.js` hands it rows; neither knows about the other |
| A server, if one is ever needed | Copy the file in and `import` it — no npm, no bundler |
| An n8n Function node | Paste the module, or fetch it from the deployed static host |
| An MCP tool | `import` it in the tool's handler and return `brief()` as the result |
| Node / CI | `node --test *.test.js` |

A rule like this decays quietly: someone adds one `import` for convenience and
nothing breaks until the day the engine is needed somewhere that cannot resolve
it. So it is enforced rather than documented — `engine.portability.test.js`
fails if the engine acquires a dependency, touches a host global, or mentions a
database.

It has already earned its place: it caught a local variable named `window`
inside `summarise()`, which shadowed the browser global in a file that runs in
browsers.

A few decisions inside the engine that are easy to get wrong, and are tested:

- **Growth from zero is `null`, not infinity.** A dashboard printing `Infinity%`
  has a bug, not a great week.
- **A reported window says the span actually compared.** The baseline is an
  array position, so on a history with gaps it can sit far further back than
  the days requested; `summarise` returns `span_days` and `baseline_date` so a
  front end cannot label a 120-day delta "30d".
- **A rate needs a denominator worth trusting.** `best_converting` excludes
  posts below a floor scaled to the publication's median, or a single-view
  post is quoted as converting at 100%.
- **An anomaly needs a baseline with enough real points**, not merely enough
  array positions — two values among twelve nulls otherwise yield a confident
  9σ.
- **Churn is measured against yesterday's subscriber count**, not today's.
  Using today's flatters the number on a growing publication.
- **An anomaly is scored against the days *before* it**, excluding itself —
  otherwise a genuine spike drags up the baseline it is measured against and
  partly hides. A flat baseline reports nothing rather than infinite surprise.
- **Post performance compares to the *median* post, not the mean.** View counts
  are long-tailed; one post that went wide makes every ordinary post look like
  a failure against a mean.
- **Attribution shares exclude ungrouped posts**, so an uncategorised post
  cannot quietly inflate everyone else's percentage.

---

## Deliberately not built yet

Each of these was in the original plan. None is blocked by the work here — all
of them consume the same engine and the same endpoint.

| Deferred | Why |
|---|---|
| ChatGPT Apps SDK app | Needs the data spine first; full MCP support is also plan-gated (Business/Enterprise for write, Pro read-only in developer mode) |
| Claude artifact front end | Same engine, ~an afternoon, once there is real data to point it at |
| Growth / Content / Revenue / Strategy agents | These are prompts over `brief()`, not code. Worth writing when the numbers are real, or they get tuned against fiction |
| Daily brief to email | Needs a sending domain and a scheduled assistant session. The `brief()` payload it would send already exists |
| Content engine (V2: ideas → draft → approve → publish) | Substack's MCP is read-only, so the last step has no API. `digital-renaissance/CONTENT_OS.md` is where that half of the loop lives |

The dashboard's "Ask your publication" box is the honest version of the
conversational feature for now: it copies your question plus the computed brief
for pasting into an assistant. No model is wired in behind it, and it does not
pretend otherwise.
