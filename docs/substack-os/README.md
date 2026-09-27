# Substack OS

Publication analytics with a memory. Substack's own dashboard tells you what
your subscriber count **is**; this tells you what **changed and what caused it**,
because it keeps the daily history Substack does not let you query.

Lives entirely in `substack-os/` — engine, dashboard, and the history itself as
one JSON file per publication in `substack-os/data/`. **There is no database and
no server.**

Read `ARCHITECTURE.md` next — in particular *Why a file and not a database*, and
*Why ingest is not a cron job*, which is the one thing about this system that
surprises people.

---

## What is here

| Piece | File | What it does |
|---|---|---|
| The history | `substack-os/data/<publication>.json` | Daily snapshots and post stats. This is the database |
| Ingest | `substack-os/ingest.js` | Merges a payload into the history file, atomically |
| Validation | `substack-os/payload.js` | Every rule both write paths enforce, in one place |
| Store | `substack-os/store.js` | Upsert merge, and the read envelope the dashboard consumes |
| Analytics engine | `substack-os/engine.js` | Every derived number, computed once. Zero dependencies, no database, runs anywhere |
| Engine tests | `substack-os/engine.test.js` | The arithmetic, including regressions for every defect found in review |
| Portability guard | `substack-os/engine.portability.test.js` | Fails if the engine gains a dependency or a host API |
| Store tests | `substack-os/store.test.js` | The store, the read window, and every refusal by name |
| Sample data | `substack-os/sample-data.js` | Seeded fake publication, for `?demo=1` |
| Dashboard | `substack-os/index.html` | Plain HTML/CSS/JS, no build step |

## See it now

```bash
npx http-server substack-os -p 8127
# the seeded sample publication, through a real history file:
#   http://127.0.0.1:8127/index.html?pub=example-publication
# the same numbers straight from the generator:
#   http://127.0.0.1:8127/index.html?demo=1
```

Both are deliberately, obviously fake, and they agree — which is the fastest way
to see that the file path and the in-memory path compute the same things.

## Wiring it to a real publication

Nothing to provision and no secrets to set. Three steps:

1. **Ingest a snapshot.** Have the assistant read the publication through MCP
   and emit the payload in `ARCHITECTURE.md` § *The ingest contract*, then:

   ```bash
   node substack-os/ingest.js substack-os/data/the-brief.json < payload.json
   ```

   Re-running is the normal case, not an error. It upserts, so refreshing one
   metric cannot null out what an earlier run captured.

2. **Open the dashboard** at `?pub=the-brief`. Nothing to configure — no URL, no
   key, no `localStorage`.

3. **Commit the data file.** That is what makes the history durable and gives
   you `git log -p` over every revision of every number.

Keep `substack-os/data/` out of any public deploy: it is real business data, and
the repository being private is the only thing protecting it.

---

## Validation

There is no lint or build step here, by the same choice the rest of this
repository makes. This is what replaces them.

```bash
# 1. The arithmetic, the engine's runtime independence, and the history file —
#    including every refusal by name. 73 tests.
cd substack-os && npm test
#    There is no install step and no dependency to fetch — package.json exists
#    to name one canonical test command and mark the directory as ESM.
#    Do not use `node --test substack-os` (directory form): it is broken on
#    Node 22.22 and reports a module-resolution error, not a test failure.

# 2. The dashboard renders, with no console errors, at desktop and phone width.
npx http-server substack-os -p 8127   # open /index.html?pub=example-publication
#    Drive ?demo=1 too: the two must show the same figures, or the file path and
#    the in-memory path have diverged.

# 3. A round trip through the real CLI, which is the whole write path.
node substack-os/ingest.js /tmp/t.json <<< '{"publication":"t","daily":[{"metric_date":"2026-03-01","subscribers":1200}]}'
node substack-os/ingest.js /tmp/t.json <<< '{"publication":"t","daily":[{"metric_date":"2026-03-01","paid_subscribers":90}]}'
#    The second must leave subscribers at 1200. If it nulls it, the upsert is broken.
node substack-os/ingest.js /tmp/t.json <<< '{"publication":"t","daily":[{"metric_date":"2026-03-01","arr_cents":19.5}]}'
#    Must exit 1 naming arr_cents — fractional money is refused, not rounded.
```

**What replaces the database invariants.** The hosted route had three SQL checks
(`anon` holds no grant, RLS on with zero policies, the upsert's primary keys
exist). There is no database to check now; the equivalent guarantees are:

- **Nothing can read the history but a process that can read the file.** There is
  no endpoint, no key and no role to misconfigure. What protects it is the
  repository being private — so never publish `substack-os/data/` to a static
  host, and never make this repository public without moving it out first.
- **The upsert cannot go wrong on a missing key**, because the key *is* the
  object key: `daily["2026-03-01"]` either exists or does not. There is no
  `onConflict` target to resolve at runtime and so no way for an ingest to fail
  on one.
- **A refusal stores nothing.** `merge()` returns an error or a whole new store,
  never a partial one, and `store.test.js` asserts it for all 17 refusals — a
  half-applied snapshot would leave a history that looks complete and is not.
