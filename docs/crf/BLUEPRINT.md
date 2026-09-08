# Deployment blueprint

**Audience: a language model or an automation connector.** This file is written
to be pasted into a model's context, or read by an agent, as the complete
specification for standing this system up from nothing. It is self-contained —
it does not assume the reader has seen the repository.

`blueprint.json` alongside this file carries the same plan as structured data:
resources, ordered steps, and post-conditions. Use the JSON to drive execution;
use this file for the exact SQL, function source contracts and the reasoning
behind each constraint.

---

## 0. Instructions to the executing agent

Read this section before doing anything.

1. **Execute in the order given.** Steps 1–7 have real dependencies: the tables
   must exist before the grants, the grants before the functions, the functions
   before the Stripe endpoint, and the webhook secret must be in the database
   before the first payment is possible.
2. **Never weaken the access rules in §3 to make a later step easier.** If a
   step appears to need `SELECT` for the `anon` role, the step is wrong, not the
   rule. Every read of an order happens inside an Edge Function.
3. **Never commit a secret.** Exactly one secret is stored by this system, and
   it is stored in a database row (§3.5), not in a file, an environment
   variable or a CI variable.
4. **Substitute every `${...}` placeholder** from §1 before executing. Do not
   invent values for the legal fields in §6 — leave them blank and report them
   as outstanding. Fabricating a company address or a governing law in a privacy
   policy is a legal misstatement, not a placeholder.
5. **Verify after each step** using that step's assertion in §8. Do not continue
   past a failed assertion.
6. **Stop and ask** if: a table with the same name already exists and is
   non-empty; the Stripe account is in live mode and this is a rebuild; or any
   assertion in §8 fails twice.

---

## 1. Parameters

| Placeholder | Meaning | Where it comes from |
|---|---|---|
| `${SUPABASE_PROJECT_REF}` | Supabase project reference | Supabase dashboard |
| `${SUPABASE_URL}` | `https://${SUPABASE_PROJECT_REF}.supabase.co` | derived |
| `${SUPABASE_PUBLISHABLE_KEY}` | Anon/publishable key. Safe in page source — it can only INSERT | Supabase → Settings → API |
| `${NETLIFY_SITE_ID}` | Target site id | Netlify dashboard |
| `${NETLIFY_AUTH_TOKEN}` | Personal access token, deploy only | Netlify → User settings → Applications |
| `${STRIPE_PAYMENT_LINK}` | Payment Link URL for the digital kit | Stripe dashboard |
| `${STRIPE_WEBHOOK_SECRET}` | `whsec_…` for the endpoint created in step 5 | Stripe → Developers → Webhooks |
| `${SITE_HOST}` | Public hostname | domain registrar / Netlify |

Service-role key: injected into Edge Functions automatically as
`SUPABASE_SERVICE_ROLE_KEY`. Never place it in a page, a repository or a log.

---

## 2. Target architecture

Static pages → Supabase Postgres (insert only) → Edge Functions (service role)
→ Stripe. No server, no framework, no build step, no user accounts.

```
browser ──INSERT──▶ crf_orders, crf_order_files
browser ──POST───▶ /functions/v1/create-apparel-order
browser ──POST───▶ /functions/v1/kit-download        (order_id + download_token, paid only)
browser ──POST───▶ /functions/v1/apparel-approval    (order_id + approval_token, artwork only)
Stripe  ──POST───▶ /functions/v1/stripe-webhook      (HMAC-SHA256 signed)
```

Invariant to preserve at every step: **the browser can create and can do nothing
else.**

---

## 3. Database

Apply as one migration. Postgres 15+, Supabase.

### 3.1 Tables

```sql
create table if not exists public.crf_orders (
  id                    text primary key,
  created_at            timestamptz not null default now(),
  model                 text not null,
  fulfilment            text not null check (fulfilment in ('physical','digital')),
  customer_name         text not null,
  customer_email        text not null,
  notes                 text,
  zones                 jsonb not null default '{}'::jsonb,
  shipping_address      jsonb,
  payment_status        text not null default 'unpaid'
                          check (payment_status in ('unpaid','paid','refunded')),
  stripe_session_id     text,
  stripe_payment_intent text,
  paid_at               timestamptz,
  download_token        uuid
);

create table if not exists public.crf_order_files (
  order_id   text primary key references public.crf_orders(id) on delete cascade,
  svg        text not null,
  bytes      integer,
  created_at timestamptz not null default now()
);

create table if not exists public.crf_apparel_orders (
  id                    text primary key,
  created_at            timestamptz not null default now(),
  garment               text not null,
  club_name             text,
  customer_name         text not null,
  customer_email        text not null,
  notes                 text,
  zones                 jsonb not null default '{}'::jsonb,
  roster                jsonb not null default '[]'::jsonb,
  unit_count            integer not null default 0 check (unit_count >= 0),
  unit_price_cents      integer not null default 0 check (unit_price_cents >= 0),
  total_cents           integer not null default 0 check (total_cents >= 0),
  currency              text not null default 'THB' check (currency in ('THB','USD')),
  fx_usd_per_thb        numeric,
  shipping_address      jsonb,
  payment_status        text not null default 'unpaid'
                          check (payment_status in ('unpaid','paid','refunded')),
  stripe_session_id     text,
  stripe_payment_intent text,
  paid_at               timestamptz,
  artwork_status        text not null default 'pending'
                          check (artwork_status in ('pending','approved','changes_requested')),
  artwork_note          text,
  artwork_reviewed_at   timestamptz,
  approval_token        uuid,
  download_token        uuid
);

create table if not exists public.crf_config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
```

### 3.2 Indexes

```sql
create index  if not exists crf_orders_status_idx          on public.crf_orders (payment_status, created_at desc);
create index  if not exists crf_orders_email_idx           on public.crf_orders (customer_email);
create unique index if not exists crf_orders_download_token_idx
  on public.crf_orders (download_token) where download_token is not null;

create index  if not exists crf_apparel_orders_status_idx   on public.crf_apparel_orders (payment_status, created_at desc);
create index  if not exists crf_apparel_orders_approval_idx on public.crf_apparel_orders (id, approval_token);
create unique index if not exists crf_apparel_orders_token_idx
  on public.crf_apparel_orders (download_token) where download_token is not null;
```

### 3.3 Triggers — the browser cannot set its own state

These exist because a client that can INSERT can choose the values it inserts.
The trigger overwrites them regardless.

```sql
create or replace function public.crf_orders_force_unpaid()
returns trigger language plpgsql set search_path to '' as $$
begin
  new.payment_status        := 'unpaid';
  new.stripe_session_id     := null;
  new.stripe_payment_intent := null;
  new.paid_at               := null;
  return new;
end;
$$;

create trigger crf_orders_force_unpaid_trg
  before insert on public.crf_orders
  for each row execute function public.crf_orders_force_unpaid();

create or replace function public.crf_apparel_force_unpaid()
returns trigger language plpgsql set search_path to '' as $$
begin
  new.payment_status        := 'unpaid';
  new.stripe_session_id     := null;
  new.stripe_payment_intent := null;
  new.paid_at               := null;
  new.artwork_status        := 'pending';
  new.artwork_reviewed_at   := null;
  new.artwork_note          := null;
  return new;
end;
$$;

create trigger crf_apparel_force_unpaid_trg
  before insert on public.crf_apparel_orders
  for each row execute function public.crf_apparel_force_unpaid();
```

`set search_path to ''` is required, not stylistic: without it a schema earlier
on the search path can shadow a referenced function.

### 3.4 RLS and grants — two independent layers

```sql
alter table public.crf_orders         enable row level security;
alter table public.crf_order_files    enable row level security;
alter table public.crf_apparel_orders enable row level security;
alter table public.crf_config         enable row level security;

create policy crf_orders_anon_insert         on public.crf_orders
  for insert to anon with check (true);
create policy crf_order_files_anon_insert    on public.crf_order_files
  for insert to anon with check (true);
-- crf_config gets NO policy. That is the point.

revoke all on public.crf_orders, public.crf_order_files,
              public.crf_apparel_orders, public.crf_config
  from anon, authenticated;

grant insert on public.crf_orders         to anon, authenticated;
grant insert on public.crf_order_files    to anon, authenticated;
-- crf_config: nothing to anon or authenticated, ever.
```

RLS and grants say the same thing twice on purpose. Either alone is sufficient;
the second exists for the day the first is edited by mistake.

### 3.5 Secrets

```sql
insert into public.crf_config (key, value)
values ('stripe_webhook_secret', '${STRIPE_WEBHOOK_SECRET}')
on conflict (key) do update set value = excluded.value, updated_at = now();
```

Rotation is that same statement with a new value. Nothing is redeployed.

The same table holds the rest, all optional and all inert while unset:

| Key | Enables |
|---|---|
| `resend_api_key` | the approval email |
| `notify_from` | its sender — needs a verified sending domain |
| `site_base_url` | the base the emailed approval link is built from |
| `operator_key` | the order desk |

---

## 4. Edge Functions

All three: Deno, `verify_jwt = false`, service-role client, CORS
`Access-Control-Allow-Origin: *` with `content-type` allowed and `POST,OPTIONS`.

`verify_jwt = false` is correct here and must not be "fixed". Stripe cannot
present a Supabase JWT, and customers are not signed in. Each function carries
its own authentication, specified below.

### 4.1 `stripe-webhook`

- **Authentication:** the `Stripe-Signature` header. Parse `t=<ts>,v1=<sig>`
  (there may be several `v1`). Compute HMAC-SHA256 over the exact string
  `` `${t}.${rawBody}` `` with the secret read from
  `crf_config.stripe_webhook_secret`. Compare in **constant time**. Reject if
  `|now − t| > 300` seconds.
- **Read the body as raw text before parsing.** The signature covers the bytes
  as sent; re-serialising the JSON invalidates it.
- **Acts only on** `type = 'checkout.session.completed'` **and**
  `payment_status = 'paid'` **and** a present `client_reference_id`. Anything
  else returns 200 with an `ignored` field — never an error, or Stripe retries
  forever.
- **Effect:** sets `payment_status='paid'`, `stripe_session_id`,
  `stripe_payment_intent`, `paid_at` on the matching `crf_orders` row.
- **On a database write failure return 500**, deliberately, so Stripe retries
  rather than dropping a real payment.

| Response | Meaning |
|---|---|
| 200 `{order, marked_paid}` | Processed |
| 200 `{ignored: …}` | Not an event we act on |
| 400 | Signature missing, malformed, stale, or mismatched |
| 500 | Secret unavailable, or the update failed |

### 4.2 `kit-download`

- **Request:** `POST {order_id: string, token: uuid}`
- **Authentication:** the pair. Select from `crf_orders` on
  `id = order_id AND download_token = token`. Validate the token against a UUID
  regex before querying.
- **Then:** require `payment_status = 'paid'`. Return the SVG from
  `crf_order_files` as `image/svg+xml` with
  `Content-Disposition: attachment` and `Cache-Control: no-store`.

| Response | Meaning |
|---|---|
| 200 | SVG body |
| 400 | Missing order id or malformed token |
| 402 | Order exists and matches, but is not paid |
| 404 | No match — **identical for a wrong token and a wrong order id** |

That last row is a requirement, not an implementation detail. Distinguishing
them turns the endpoint into an order-id oracle.

### 4.3 `apparel-approval`

- **Request:** `POST {order_id, token: uuid, action: 'view'|'approve'|'request_changes', note?: string}`
- **Authentication:** the pair `(id, approval_token)`.
- **`view`** returns the order **without** `approval_token` and without
  `download_token` in the selected columns.
- **`approve` / `request_changes`** write only `artwork_status`,
  `artwork_note` (trimmed to 2000 chars) and `artwork_reviewed_at`. This
  function must never write `payment_status` or any Stripe field.
- **Approval is one-way:** if `artwork_status` is already `approved`, return
  409. `changes_requested` may still be changed.

| Response | Meaning |
|---|---|
| 200 `{order}` | Read or write succeeded |
| 400 | Bad JSON, missing pair, or unknown action |
| 404 | No match |
| 409 | Already approved |

---

### 4.3a `create-apparel-order`

- **Request:** garment key, customer details, artwork metadata and roster.
- **Authentication:** public function endpoint; `anon` has no direct insert
  grant on `crf_apparel_orders`.
- **Then:** validate the garment, roster quantities, email and server-owned
  pricing; insert through the service-role client. The database trigger
  generates the order id, approval token and download token.
- **Response:** `{order_id, approval_token}`. Caller-supplied ids and tokens
  are ignored.

### 4.4 `apparel-notify`

- **Request:** `POST {order_id, token: uuid}`
- **Authentication:** the pair `(id, approval_token)`.
- **Sends** the approval notification to `customer_email` from the
  authenticated order row, never to an address supplied in the request. The
  approval link is also shown on the confirmation page.
- **The link is built from `crf_config.site_base_url`**, never from the
  request, so a link you send cannot be made to point elsewhere.
- **Sends once.** Stamps `approval_email_sent_at`; a second call is a no-op.
  The insert trigger clears that column, so a browser cannot pre-set it to
  suppress the mail.
- With any of the three config rows unset, returns 200 `{sent: false, reason:
  "not_configured"}` and sends nothing.

### 4.5 `admin-orders`

- **Request:** `POST {key: string}`
- **Authentication:** SHA-256 digest comparison against
  `crf_config.operator_key`, so neither contents nor length leak by timing.
  **An unset key means no access, not open access.**
- **Read-only**, and selects no token columns. A queue view is not a place to
  hand out download or approval links.
- Returns both order queues plus counts, newest first, capped at 100 each.

---

## 5. Static site

Six pages plus assets, deployed as a flat archive. No build.

```
crf-builder/
  index.html      # graphics kit builder  → /
  apparel.html    # racewear builder      → /apparel
  ecu.html        # ECU template builder  → /ecu
  mods.html       # modifications guide   → /mods
  approve.html    # artwork approval      → /approve
  desk.html       # operator queue view   → /desk (unlinked, noindex)
  privacy.html    # §6 — hold until filled
  terms.html      # §6 — hold until filled
  legal-details.js
  kits/           # preset artwork + thumbnails
```

Page-level constants to substitute:

| Page | Constant | Value |
|---|---|---|
| `index.html` | `SUPABASE_URL` | `${SUPABASE_URL}` |
| `index.html` | `SUPABASE_KEY` | `${SUPABASE_PUBLISHABLE_KEY}` |
| `index.html` | `STRIPE_LINKS.digital` | `${STRIPE_PAYMENT_LINK}` |
| `index.html` | `DOWNLOAD_FN` | `${SUPABASE_URL}/functions/v1/kit-download` |
| `apparel.html` | Supabase URL / key | as above |
| `apparel.html` | `CREATE_FN` | `${SUPABASE_URL}/functions/v1/create-apparel-order` |
| `approve.html` | `FN` | `${SUPABASE_URL}/functions/v1/apparel-approval` |
| `apparel.html` | `NOTIFY_FN` | `${SUPABASE_URL}/functions/v1/apparel-notify` |
| `desk.html` | `FN` | `${SUPABASE_URL}/functions/v1/admin-orders` |

The publishable key in page source is correct and intended: it can create the
graphics-kit order and call public customer functions, but has no direct
racewear insert grant or CRF table read.

**Checkout linking.** The kit page appends
`?client_reference_id=<order id>` to the Payment Link. That parameter is the
only thing connecting a Stripe payment back to an order row. If it is dropped,
payments succeed and no order is ever marked paid.

### Deploy

```bash
cd crf-builder
zip -r site.zip index.html apparel.html ecu.html approve.html mods.html \
       desk.html kits
curl -X POST "https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/builds" \
  -H "Authorization: Bearer ${NETLIFY_AUTH_TOKEN}" \
  -F "zip=@site.zip;type=application/zip"
```

Field name must be `zip`; endpoint must be `/builds`. `/deploys` is refused.

Deploy an explicit list of files, never the whole folder: `privacy.html`,
`terms.html` and `legal-details.js` live in the same directory and must not be
published until §6 is satisfied.

If the site is connected to a repository rather than deployed by upload, give
it a base directory pointing at the site folder. A `netlify.toml` at the
repository root belonging to another project will otherwise decide what gets
published here.

---

## 6. Legal pages — do not fill these in

`legal-details.js` exports four values: `entity`, `address`, `email`, `law`.
They are facts about a real business. An agent must leave them blank and report
them as outstanding.

The file marks blanks in red and shows a page-wide banner, so a partially
filled version is visibly broken rather than quietly wrong. Do not deploy
`privacy.html` or `terms.html` while that banner shows, and do not link them
from the other pages until they are live.

---

## 7. Ordered execution plan

| # | Step | Depends on | Assertion (§8) |
|---|---|---|---|
| 1 | Create Supabase project, record ref and publishable key | — | A1 |
| 2 | Apply §3.1–3.3 (tables, indexes, triggers) | 1 | A2 |
| 3 | Apply §3.4 (RLS, policies, grants) | 2 | A3 |
| 4 | Deploy the six Edge Functions, `verify_jwt=false` | 3 | A4 |
| 5 | Create the Stripe Payment Link and the webhook endpoint pointing at `${SUPABASE_URL}/functions/v1/stripe-webhook`, subscribed to `checkout.session.completed` | 4 | A5 |
| 6 | Write `${STRIPE_WEBHOOK_SECRET}` into `crf_config` (§3.5) | 5 | A6 |
| 7 | Substitute page constants (§5) and deploy the archive | 6 | A7 |
| 8 | End-to-end purchase with a real card, then refund | 7 | A8 |
| 9 | Legal pages — **human only** (§6) | — | A9 |

---

## 8. Assertions

Each must pass before the next step. A failure is a stop, not a retry loop.

- **A1** — `${SUPABASE_URL}/rest/v1/` responds.
- **A2** — All four tables exist; both trigger functions exist with
  `prosrc` containing `payment_status`; `select count(*) from crf_orders` = 0.
- **A3** — This returns exactly two rows, both `INSERT`, for `crf_orders` and
  `crf_order_files`, and none for `crf_apparel_orders` or `crf_config`:
  ```sql
  select table_name, privilege_type
  from information_schema.role_table_grants
  where table_schema='public' and grantee='anon' and table_name like 'crf%';
  ```
  And `crf_config` has RLS enabled with zero policies.
- **A4** — All six functions report status `ACTIVE`. An unsigned POST to
  `stripe-webhook` returns **400**, not 500 and not 200. A POST to
  `admin-orders` with any key returns **401** while `operator_key` is unset.
- **A5** — Stripe shows the endpoint as enabled and a test delivery reaches the
  function (a test event will be rejected as unsigned or stale — that is the
  correct response and still proves reachability).
- **A6** — `select 1 from crf_config where key='stripe_webhook_secret'` returns
  a row, and the value starts `whsec_`.
- **A7** — Every page returns 200:
  ```bash
  for p in "" apparel ecu mods approve; do
    curl -s -o /dev/null -w "$p %{http_code}\n" "https://${SITE_HOST}/$p"
  done
  ```
- **A8** — After the live purchase, the order row has `payment_status='paid'`,
  a non-null `paid_at` and a non-null `stripe_session_id`; `kit-download`
  returns the SVG; the same call with a wrong token returns 404.
- **A9** — `/privacy` and `/terms` are unreachable until a human has filled
  §6. Reaching them earlier is a failure, not progress.

Standing invariants — all three must always return zero rows:

```sql
select id from crf_orders
 where payment_status='paid' and stripe_session_id is null;

select id from crf_apparel_orders
 where artwork_status='approved' and artwork_reviewed_at is null;

select o.id from crf_orders o
  left join crf_order_files f on f.order_id = o.id
 where o.payment_status='paid' and f.order_id is null;
```

---

## 9. Connector mapping

If you are driving this through tool connectors rather than a shell:

| Step | Connector | Operation |
|---|---|---|
| 1 | Supabase | create project; read publishable key |
| 2–3, 6 | Supabase | apply migration / execute SQL |
| 4 | Supabase | deploy edge function ×3 |
| 5 | Stripe | create payment link; create webhook endpoint |
| 7 | Netlify | deploy site archive |
| 8 | Stripe + Supabase | read checkout session; query order row |
| 9 | — | human. Do not automate |

Supabase's `apply_migration` is for DDL; `execute_sql` for the config insert and
for assertions.

---

## 10. Constraints that must survive any future change

If a later change breaks one of these, the change is wrong.

1. The browser holds `INSERT` and nothing else. No `SELECT` grant to `anon`,
   ever, on any `crf_` table.
2. `payment_status` is written by `stripe-webhook` alone, and only after
   signature verification.
3. Every customer-facing read is keyed on a `(id, token)` pair, and a wrong
   token is indistinguishable from a wrong id.
4. The webhook secret lives in `crf_config` and nowhere else.
5. `crf_config` has RLS on and no policies.
6. Approval is one-way once granted.
7. Schema changes are additive. Ship code before schema narrowing, never
   together.
8. The ECU template never offers an injector that reduces flow while presenting
   itself as an upgrade — and any injector selection must actually rescale the
   fuel map, or must not exist. A map sized for one injector on hardware that
   flows less is a lean condition at wide-open throttle.
9. Anything the system emails goes to an address read from the order row, and
   any link inside it is built from configured values. Never from the request.
