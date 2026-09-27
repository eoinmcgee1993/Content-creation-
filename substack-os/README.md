# Substack OS

Publication analytics with a memory. Substack's dashboard tells you what your
subscriber count **is**; this keeps the daily history that lets you ask what
**changed and why**.

Full documentation is in [`docs/substack-os/`](../docs/substack-os/) —
`README.md` for setup and the validation list, `ARCHITECTURE.md` for the design
and its constraints.

## See it now

```bash
npx http-server . -p 8127
# the seeded sample publication, read from a real history file:
#   http://127.0.0.1:8127/index.html?pub=example-publication
# the same data straight from the generator, no file involved:
#   http://127.0.0.1:8127/index.html?demo=1
```

Both render the same numbers, which is the point — one goes through
`ingest.js` → `data/*.json` → `store.js`, the other does not. Use `?demo=gappy`
to see a publication whose snapshots are not daily, the case where the window
asked for and the span actually compared differ.

## There is no database

A publication's history is one JSON file in `data/`. Ingest a snapshot:

```bash
node ingest.js data/the-brief.json < payload.json
```

No project to provision, no secrets, no endpoint, and re-running is safe — it
upserts, so a refresh of one metric cannot null out what an earlier run
captured. See `data/README.md` for the file shape and
`../docs/substack-os/ARCHITECTURE.md` for why a file rather than Postgres.

## Test

```bash
npm test      # 73 tests: arithmetic, portability, and the file store
```

No install step and no dependencies. `package.json` exists to name one
canonical command and mark the directory as ESM. Do not use
`node --test substack-os` (directory form) — it is broken on Node 22.22 and
reports a module-resolution error rather than a test failure.

## Files

| File | What it is |
|---|---|
| `engine.js` | Every derived number. Zero dependencies, no database, no host APIs |
| `engine.test.js` | The arithmetic: growth, churn, anomalies, attribution |
| `engine.portability.test.js` | Fails if the engine gains a dependency or a runtime |
| `payload.js` | Validates and shapes an ingest payload. Every refusal lives here |
| `store.js` | The history file: upsert merge, and the read window |
| `ingest.js` | CLI. Merges a payload into a history file, atomically |
| `store.test.js` | The store, the read window, and every refusal by name |
| `index.html` | Dashboard. Plain HTML/CSS/JS, no build step |
| `sample-data.js` | Seeded fake publication, for `?demo=1` |
| `data/` | The history itself, one JSON file per publication |

That is the whole system — there are no server pieces anywhere else in the
repository.

The engine is deliberately independent of any runtime, so the same calculation
can run in the dashboard, an n8n Function node, an MCP tool or a server if one
is ever needed, without being reimplemented. That is enforced by
`engine.portability.test.js`, not merely documented.
