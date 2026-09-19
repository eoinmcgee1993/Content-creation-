# Substack OS — architecture

## The shape

```
Substack  ──MCP──▶  AI assistant  ──HTTPS──▶  substack-ingest  ──▶  Postgres
                    (Claude / ChatGPT)                                  │
                                                             substack-metrics
                                                                        │
                                            ┌───────────────────────────┤
                                            ▼                           ▼
                                   substack-os/engine.js        (same engine)
                                            │                           │
                                       dashboard              a future ChatGPT app
                                                              or Claude artifact
```

One engine, any number of front ends. That is the whole idea, and everything
below is in service of it.

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
MCP and POSTs the result to `substack-ingest`. The database, the engine and the
dashboard never talk to Substack at all.

This costs little and buys a lot: the boundary is a plain JSON endpoint, so if
Substack ever ships a token-authenticated HTTP API, a real scheduler posts to
the *same* endpoint and nothing downstream changes.

### Two access limits to plan around

- **Substack's official MCP requires a Bestseller publication.** If yours is
  not eligible yet, everything here still works — ingest from a CSV export
  with `"source": "manual_csv"`, and the rest of the system cannot tell the
  difference.
- **Third-party Substack MCP servers are not the official one.** If you connect
  one, keep it isolated and narrowly permissioned. It is not covered here.

---

## The ingest contract

`POST` to the `substack-ingest` function URL:

```jsonc
{
  "key": "<ingest_key from substack_config>",
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

Rules the endpoint enforces, rather than trusting the caller:

- **Upsert, never insert.** Re-running a day is normal — Substack revises recent
  numbers, and a half-finished ingest has to be safe to repeat.
- **Counts are non-negative integers.** A float in a money field is refused, not
  rounded. A typo'd currency is refused, not silently stored as `usd`.
- **Only whitelisted columns are written.** A payload cannot set `captured_at`,
  cannot override the authenticated `publication`, and cannot smuggle an
  unrecognised key into the row.
- **An omitted metric is stored as `NULL`, never `0`.** A day with no snapshot
  did not have zero subscribers, and a chart that draws it as zero is lying.
- **No CORS headers.** Every caller is a server or an assistant's HTTP client.
  No browser page should be able to reach a write endpoint at all.

## Security posture

The same rule the rest of this repository runs on: **the browser can do
nothing**. `anon` and `authenticated` hold no grant of any kind on any
`substack_` table — not even `INSERT`, which the storefront tables do grant,
because here there is no customer and nothing worth exposing.

Reads leave through `substack-metrics` under the service-role key, behind a
shared secret, with constant-time comparison. Writes arrive through
`substack-ingest` behind a **different** secret. An unconfigured key means no
access, not open access.

The two keys are separate because the dashboard key gets typed into a browser
and will eventually leak. It must not also be able to write.

## Why the front ends do no arithmetic

`substack-metrics` returns rows. Growth, conversion, churn, anomalies and
attribution are all computed in `substack-os/engine.js`, by whichever front end
asked.

The alternative — computing in the function *and* in the dashboard — gives two
implementations to keep in agreement, and the first time they disagree nobody
knows which is lying. A Claude artifact and a ChatGPT app importing the same
module cannot tell the user different stories about the same week.

## The engine knows nothing about Supabase

`engine.js` imports nothing, references no host API, and contains no mention of
a database. It takes plain arrays of plain objects and returns plain objects.
It does not know whether its rows came from PostgREST, a CSV export, an MCP
tool result or a fixture — and it must not learn.

That is what lets the same calculation run in all of these without a rewrite:

| Where | How it consumes the engine |
|---|---|
| The dashboard | `import { brief } from "./engine.js"` in a `<script type="module">` |
| A Deno Edge Function | Copy the file in and `import` it — no npm, no bundler |
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
