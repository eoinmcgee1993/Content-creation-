# Substack OS

Publication analytics with a memory. Substack's dashboard tells you what your
subscriber count **is**; this keeps the daily history that lets you ask what
**changed and why**.

Full documentation is in [`docs/substack-os/`](../docs/substack-os/) —
`README.md` for setup and the validation list, `ARCHITECTURE.md` for the design
and its constraints.

## See it now

```bash
npx http-server . -p 8127     # then open http://127.0.0.1:8127/index.html?demo=1
```

Renders seeded sample data with no database and no Substack account.

## Test

```bash
npm test      # 27 tests: 21 over the arithmetic, 6 guarding portability
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
| `index.html` | Dashboard. Plain HTML/CSS/JS, no build step |
| `sample-data.js` | Seeded fake publication, for `?demo=1` |

The engine is deliberately independent of Supabase and of any runtime, so the
same calculation can run in the dashboard, a Deno Edge Function, an n8n
Function node or an MCP tool without being reimplemented. That is enforced by
`engine.portability.test.js`, not merely documented.

Server pieces live outside this directory: `supabase/migrations/005_substack_os.sql`
and `supabase/functions/substack-{ingest,metrics}/`.
