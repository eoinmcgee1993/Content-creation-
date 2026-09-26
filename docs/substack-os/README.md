# Substack OS

Publication analytics with a memory. Substack's own dashboard tells you what
your subscriber count **is**; this tells you what **changed and what caused it**,
because it keeps the daily history Substack does not let you query.

Lives in `substack-os/` — engine, dashboard, and the history itself as one JSON
file per publication in `substack-os/data/`. **There is no database.** The
hosted Postgres route (`supabase/functions/substack-*`,
`supabase/migrations/005_substack_os.sql`) still exists and is optional.

Read `ARCHITECTURE.md` next — in particular *Two ways to store the history* for
why a file, and *Why ingest is not a cron job*, which is the one thing about
this system that surprises people.

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
| Function tests | `substack-os/functions.test.js` | Drives both Edge Functions: every refusal and both happy paths |
| Store tests | `substack-os/store.test.js` | The store, plus parity against the hosted route |
| Sample data | `substack-os/sample-data.js` | Seeded fake publication, for `?demo=1` |
| Dashboard | `substack-os/index.html` | Plain HTML/CSS/JS, no build step |
| *Optional:* schema | `supabase/migrations/005_substack_os.sql` | The hosted route's tables and secrets |
| *Optional:* ingest | `supabase/functions/substack-ingest/` | Assistant → Postgres, idempotent |
| *Optional:* read | `supabase/functions/substack-metrics/` | Postgres → dashboard, service-role |

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

No project to provision and no secrets to set. Three steps:

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

### Optional: the hosted route

Worth it only for more than one writer, or a reader with no checkout.

1. **Apply the migration.** `supabase/migrations/005_substack_os.sql`.

2. **Set two secrets.** They live in `substack_config`, never in a file and
   never in an environment variable:

   ```sql
   insert into public.substack_config (key, value) values
     ('ingest_key',    '<long random string>'),
     ('dashboard_key', '<a different long random string>');
   ```

   Two separate keys on purpose: the dashboard key is typed into a browser and
   will eventually leak to whoever borrows the laptop. It must not also be able
   to write.

3. **Deploy the functions.**
   ```bash
   supabase functions deploy substack-ingest
   supabase functions deploy substack-metrics
   ```

4. **Point the dashboard at it** — Settings takes the `substack-metrics` URL and
   the dashboard key, which go to `localStorage`, not the repository. Leave the
   URL blank to go back to the file.

---

## Validation

There is no lint or build step here, by the same choice the rest of this
repository makes. This is what replaces them.

```bash
# 1. The arithmetic, the engine's runtime independence, the history file, and
#    both Edge Functions end to end. 101 tests.
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

# 4. Hosted route only — the schema's invariants, after migrating.
#    All three must hold.
```
```sql
-- anon and authenticated hold NO privilege on any substack_ table. Zero rows.
select grantee, table_name, privilege_type
  from information_schema.role_table_grants
 where table_schema='public' and grantee in ('anon','authenticated')
   and table_name like 'substack%';

-- RLS on, zero policies, on all three tables.
select c.relname, c.relrowsecurity,
       (select count(*) from pg_policies p where p.tablename=c.relname) as policies
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relname like 'substack%' and c.relkind='r';

-- The primary keys the ingest function upserts against must exist, or every
-- ingest fails at runtime on an onConflict it cannot resolve.
select conrelid::regclass, pg_get_constraintdef(oid) from pg_constraint
 where connamespace='public'::regnamespace and contype='p'
   and conrelid::regclass::text like 'substack%';
```

**Still outstanding, and no longer blocking:** the two Edge Functions are
covered by committed tests that drive the real handler against a stubbed
database — every refusal and both happy paths, plus parity with the file store —
but they have still never run over HTTPS against a deployed project. That used
to mean the system was unverifiable end to end; it no longer does, because the
default route has no HTTP in it. If you ever turn the hosted route on, drive
both live first:

```bash
# Must be 401 — an unconfigured or wrong key is never open access.
curl -s -X POST "$INGEST_URL" -H 'content-type: application/json' \
  -d '{"key":"wrong","publication":"p","daily":[]}'

# Must be 400 — fractional money is refused, not rounded.
curl -s -X POST "$INGEST_URL" -H 'content-type: application/json' \
  -d "{\"key\":\"$INGEST_KEY\",\"publication\":\"p\",\"daily\":[{\"metric_date\":\"2026-03-01\",\"arr_cents\":1999.5}]}"

# Must be 400 — a typo'd currency is refused, not silently stored as usd.
curl -s -X POST "$INGEST_URL" -H 'content-type: application/json' \
  -d "{\"key\":\"$INGEST_KEY\",\"publication\":\"p\",\"currency\":\"dollars\",\"daily\":[{\"metric_date\":\"2026-03-01\"}]}"

# Must be 200, and running it twice must not duplicate the row.
curl -s -X POST "$INGEST_URL" -H 'content-type: application/json' \
  -d "{\"key\":\"$INGEST_KEY\",\"publication\":\"p\",\"daily\":[{\"metric_date\":\"2026-03-01\",\"subscribers\":1200}]}"
```
