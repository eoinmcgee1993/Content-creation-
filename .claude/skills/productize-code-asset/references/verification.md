# Verifying claims against source

These checks caught real overclaims. Run the relevant ones before writing a
doc or a slide, and again before shipping.

- [Any codebase](#any-codebase)
- [n8n workflow exports](#n8n-workflow-exports)
- [Supabase / Postgres](#supabase--postgres)
- [Stripe webhooks](#stripe-webhooks)
- [Cross-check: setup doc vs source](#cross-check-setup-doc-vs-source)

## Any codebase

- **Where the work went:** run
  `git log --since="60 days ago" --oneline -- <path> | wc -l` per area. A
  single commit with no follow-up means "shipped once, never exercised". That
  is weaker evidence than ten hardening commits, and the copy should reflect
  it.
- **Behaviour you name:** read the function that does it. Names and comments
  describe intent; code describes behaviour.
- **Quantifiers:** "every", "all", "never", "only", "each". Enumerate the
  units and check each one. A pattern present in two of three is "two of
  three".
- **File lists in docs:** every file the README says ships must exist in the
  release build, with that name. A listed file that has to be written first
  is a launch blocker.
- **Numbers on images** (node counts, function counts, prices): recompute
  them from source rather than copying them from an earlier doc.

## n8n workflow exports

```python
import json
d = json.load(open("workflow.json"))
for n in d["nodes"]:
    flags = {k: n[k] for k in ("continueOnFail", "onError") if k in n}
    print(n["type"].split(".")[-1], "|", n["name"], "|", list(n.get("credentials", {})), flags)
print("settings:", d.get("settings"))
for src, outs in d["connections"].items():
    for kind, branches in outs.items():
        for i, b in enumerate(branches):
            print(f"{src} [{kind}:{i}] ->", [c["node"] for c in (b or [])])
```

- **Multi-agent claims:** count the `agent` / `chainLlm` nodes per workflow.
  An `if` node that checks a field isn't a reviewing agent.
- **Verdict values:** read the structured output parser's `inputSchema`,
  then compare it with what the database stores (for example `FAILED` from
  the model, stored as `FAILED_FILTER`).
- **Failure behaviour:** a node with `continueOnFail` passes an error item
  downstream, so later steps (for example "mark row LIVE") still run.
  Describe that honestly.
- **Error branches:** an Error Trigger only fires for workflows that name it
  in `settings.errorWorkflow`. If that key is absent, the branch doesn't run
  after import.
- **Configuration:** search the whole file, not just node parameters. This
  includes the `jsCode` in Code nodes and the `__rl` resource locators
  (sheet and document pickers). Look for `$vars.`, `$env.`, `YOUR_`,
  `REPLACE`, `TODO`.
  - Credential-id stubs (`YOUR_*_CRED_ID`) resolve when credentials are
    reselected.
  - `meta.instanceId` is rewritten on import.
- **SQL in Postgres nodes:** `executeQuery` strings with `{{ }}` are string
  interpolation. Note which values are escaped and which come from third
  parties (an injection risk).
- **Logging and dashboards:** check which table each branch writes to. A
  dashboard over a log table shows only what's logged there.
- **Dedup:** compare the lookup key with the stored key. Is it the same
  field, normalized the same way?

## Supabase / Postgres

- **Where DDL lives:** run
  `grep -n -i "create table" supabase/migrations/*.sql`. Tables applied
  directly to a live project exist only in docs or the dashboard, so the
  release build has to assemble the migration.
- **Shared projects:** one `supabase/` often serves several apps. Don't ship
  another app's migration.
- **Access:** check grants (`revoke all …`, `grant insert …`) and RLS
  policies. Say which layer enforces each rule.
- **Server-owned state:** look for `BEFORE INSERT` triggers that overwrite
  payment or approval fields, and quote what they reset.

## Stripe webhooks

- **Signature:** confirm HMAC-SHA256 over `` `${t}.${rawBody}` ``, a
  constant-time compare, and a timestamp tolerance. Read the function; don't
  infer these.
- **Raw body:** it must be read before any JSON parse.
- **Responses:**
  - 400 on a bad signature.
  - 200 with an "ignored" field for events it doesn't act on, so Stripe
    doesn't retry forever.
  - 500 on a database failure, so Stripe retries rather than dropping a
    payment.
- **Linkage:** the Payment Link has to carry `client_reference_id` = the
  order id. Without it, payments succeed and nothing is ever marked paid.

## Cross-check: setup doc vs source

Run this after writing a setup guide. It should print `MISSING: none`.

```python
import re, glob
setup = open("path/to/SETUP.md").read()
missing = []
for f in glob.glob("path/to/workflows/*.json"):
    s = open(f).read()
    tokens = set(re.findall(r"\$vars\.([A-Z0-9_]+)", s)) | set(re.findall(r"(YOUR_[A-Z0-9_]+(?:-\d+)?)", s))
    for t in sorted(tokens):
        if re.search(r"_(CRED|CREDENTIAL)_ID$", t) or t == "YOUR_N8N_INSTANCE_ID":
            continue  # resolved by reselecting credentials / rewritten on import
        if t not in setup:
            missing.append(f"{f}: {t}")
print("MISSING:", missing or "none")
```

For non-n8n code, swap in whatever the product reads its config from, such
as `os.environ[...]`, `Deno.env.get(...)`, config table keys or
`process.env`.
