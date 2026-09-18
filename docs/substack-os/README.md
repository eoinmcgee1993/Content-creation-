# Substack OS

Publication analytics with a memory. Substack's own dashboard tells you what
your subscriber count **is**; this tells you what **changed and what caused it**,
because it keeps the daily history Substack does not let you query.

Lives in `substack-os/` (engine + dashboard), `supabase/functions/substack-*`
(ingest + read), `supabase/migrations/005_substack_os.sql` (schema).

Read `ARCHITECTURE.md` next — in particular the section on why ingest is not a
cron job, which is the one thing about this system that surprises people.

---

## What is here

| Piece | File | What it does |
|---|---|---|
| Schema | `supabase/migrations/005_substack_os.sql` | Daily snapshots, post stats, secrets |
| Analytics engine | `substack-os/engine.js` | Every derived number, computed once |
| Engine tests | `substack-os/engine.test.js` | 21 tests over the arithmetic |
| Sample data | `substack-os/sample-data.js` | Seeded fake publication, for `?demo=1` |
| Dashboard | `substack-os/index.html` | Plain HTML/CSS/JS, no build step |
| Ingest | `supabase/functions/substack-ingest/` | Assistant → database, idempotent |
| Read | `supabase/functions/substack-metrics/` | Database → dashboard, service-role |

## See it now

```bash
npx http-server substack-os -p 8127
# then open http://127.0.0.1:8127/index.html?demo=1
```

That renders seeded sample data with no database and no Substack account. It is
the fastest way to see whether this is worth wiring up, and it is deliberately,
obviously fake.

## Wiring it to a real publication

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

4. **Ingest a snapshot.** See `ARCHITECTURE.md` § *The ingest contract*.

5. **Open the dashboard** and give it the `substack-metrics` URL, the dashboard
   key and your publication identifier. They go to `localStorage`, not to the
   repository.

---

## Validation

There is no lint or build step here, by the same choice the rest of this
repository makes. This is what replaces them.

```bash
# 1. The engine's arithmetic. 21 tests.
#    Note the glob: `node --test substack-os` (directory form) is broken on
#    Node 22.22 and reports a module-resolution error, not a test failure.
node --test substack-os/*.test.js

# 2. The dashboard renders, with no console errors, at desktop and phone width.
npx http-server substack-os -p 8127   # open /index.html?demo=1

# 3. The schema's invariants — run against the database after migrating.
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

**Still outstanding:** the two Edge Functions have been driven locally — every
refusal and both happy paths — but not yet over HTTPS against a deployed
project, because this repository has no Supabase credentials in it. Per the
repository's own rule, that means they are not finished being verified. After
`supabase functions deploy`, drive both live:

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
