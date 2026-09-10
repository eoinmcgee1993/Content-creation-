# Setup

Twenty to thirty minutes if you already have Supabase and Stripe accounts.
Follow the steps in order — later steps depend on earlier ones.

## Before you start

- A Supabase project (free tier is fine to start).
- A Stripe account. Test mode is fine until step 8.
- The [Supabase CLI](https://supabase.com/docs/guides/cli) installed, or
  willingness to run SQL and deploy functions from the dashboard instead.
- Your own short table prefix chosen — used as `{{PREFIX}}` below. Examples:
  `shop`, `kit`, `store`.

**Do this first:** open every file in `supabase/` and replace `{{PREFIX}}`
with your chosen prefix. It appears in the migration and in every function's
table references. One find-and-replace across the folder gets all of it.

## 1. Create the database objects

Run the migration in `supabase/migrations/` against your project (via
`supabase db push`, or paste it into the SQL editor in the dashboard). It
creates:

- `{{prefix}}_orders` — one row per order: id, customer details, a `zones`/
  payload `jsonb` column for whatever you're customizing, and the payment
  block (`payment_status`, `stripe_session_id`, `stripe_payment_intent`,
  `paid_at`, `download_token`).
- `{{prefix}}_order_files` — the deliverable, one row per order,
  `ON DELETE CASCADE` back to the order.
- `{{prefix}}_config` — every secret this system uses, as key/value rows.
  **Nothing goes in an environment variable or a repo file.**

**Verify:** `select count(*) from {{prefix}}_orders;` returns `0`, not an
error.

## 2. Lock down access

Still in the migration (don't skip this — it's the part that matters):

```sql
alter table public.{{prefix}}_orders      enable row level security;
alter table public.{{prefix}}_order_files enable row level security;
alter table public.{{prefix}}_config      enable row level security;

create policy {{prefix}}_orders_anon_insert on public.{{prefix}}_orders
  for insert to anon with check (true);
create policy {{prefix}}_order_files_anon_insert on public.{{prefix}}_order_files
  for insert to anon with check (true);
-- {{prefix}}_config gets NO policy. That is deliberate.

revoke all on public.{{prefix}}_orders, public.{{prefix}}_order_files,
             public.{{prefix}}_config
  from anon, authenticated;

grant insert on public.{{prefix}}_orders      to anon, authenticated;
grant insert on public.{{prefix}}_order_files to anon, authenticated;
```

**Verify** — this query must return exactly two rows, both `INSERT`, and none
for `{{prefix}}_config`:

```sql
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
  and table_name like '{{prefix}}%';
```

If it returns anything else — a `SELECT` grant you didn't expect, a policy on
the config table — stop and fix it before continuing. This is the invariant
the whole kit exists to protect.

## 3. Deploy the Edge Functions

```bash
supabase functions deploy stripe-webhook          --no-verify-jwt
supabase functions deploy kit-download             --no-verify-jwt
supabase functions deploy apparel-approval          --no-verify-jwt
supabase functions deploy create-apparel-order      --no-verify-jwt
supabase functions deploy apparel-notify            --no-verify-jwt
supabase functions deploy admin-orders              --no-verify-jwt
```

(Rename the functions to match whatever you called the flows — the
`--no-verify-jwt` flag is the important part. Stripe cannot present a Supabase
JWT, and your customers aren't signing in, so each function authenticates
itself instead — that's what the token/signature checks in the code are
doing.)

**Verify:** all six report `ACTIVE` in the dashboard. An unsigned `POST` to
`stripe-webhook` returns **400**, not 500 and not 200. A `POST` to
`admin-orders` with any key returns **401** while you haven't set an operator
key yet (step 6).

## 4. Create the Stripe Payment Link

In the Stripe dashboard, create a Payment Link for what you're selling.
Note the link URL — your order page will append
`?client_reference_id=<order id>` to it before sending the customer there.
**This parameter is the only thing connecting a payment back to an order
row.** If your page drops it, payments succeed and nothing ever gets marked
paid.

## 5. Create the webhook endpoint

Stripe dashboard → Developers → Webhooks → add endpoint:

- URL: `https://<your-project>.supabase.co/functions/v1/stripe-webhook`
- Event: `checkout.session.completed`

Copy the signing secret (`whsec_...`) — you need it in the next step.

## 6. Write your secrets into the database

Nowhere else. Not an env var, not a `.env` file, not a CI secret.

```sql
insert into public.{{prefix}}_config (key, value) values
  ('stripe_webhook_secret', 'whsec_...'),
  ('operator_key', '<a long random string you generate yourself>')
on conflict (key) do update set value = excluded.value, updated_at = now();
```

Optional, only if you're using the email-notify function:

```sql
insert into public.{{prefix}}_config (key, value) values
  ('resend_api_key', 're_...'),
  ('notify_from', 'orders@yourdomain.com'),
  ('site_base_url', 'https://yourdomain.com')
on conflict (key) do update set value = excluded.value, updated_at = now();
```

Rotating any secret later is the same `INSERT ... ON CONFLICT` with a new
value. Nothing needs to be redeployed.

**Verify:**
`select 1 from {{prefix}}_config where key = 'stripe_webhook_secret';`
returns a row.

## 7. Wire up your page

In your static page (or wherever you call these from), you need:

- Your Supabase URL and **publishable** key (safe to expose — it can only
  insert).
- The Payment Link URL from step 4.
- The Edge Function URLs (`https://<project>.supabase.co/functions/v1/<name>`).

The order of operations on the client:

1. `INSERT` into `{{prefix}}_orders` with a client-generated
   `download_token` (`crypto.randomUUID()`).
2. `INSERT` the deliverable into `{{prefix}}_order_files`, keyed on the
   order id.
3. Redirect to the Payment Link with `?client_reference_id=<order id>`
   appended.
4. Customer pays. Stripe calls `stripe-webhook`. Order flips to `paid`.
5. Customer returns to your site and calls `kit-download` with
   `{order_id, token}` — it 402s until Stripe has confirmed, then returns the
   file.

`client-pattern/order-form.html` and `client-pattern/download.html` do
exactly this, unstyled, so you can see the calls before you build your own UI
around them.

## 8. Go live and test with a real card

Switch the Stripe Payment Link and webhook to live mode. Buy your own
product with a real card. Then refund it. Confirm:

- The order row shows `payment_status = 'paid'`, a `paid_at` timestamp, and a
  `stripe_session_id`.
- `kit-download` (or your equivalent) returns the file.
- The same call with a wrong token returns 404 — not a different error, not
  a 500, a 404, identical to what a wrong order id returns.

## Standing checks worth running periodically

These three queries should always return zero rows. If any of them ever
return a row, something upstream of them broke:

```sql
-- Paid, but Stripe never actually confirmed it
select id from {{prefix}}_orders
 where payment_status = 'paid' and stripe_session_id is null;

-- Approved, but nobody's review timestamp is attached
select id from {{prefix}}_apparel_orders
 where artwork_status = 'approved' and artwork_reviewed_at is null;

-- Paid, but there's no file to deliver
select o.id from {{prefix}}_orders o
  left join {{prefix}}_order_files f on f.order_id = o.id
 where o.payment_status = 'paid' and f.order_id is null;
```

## Troubleshooting

- **Webhook returns 400 for a real Stripe event.** Almost always the secret
  in `{{prefix}}_config` doesn't match the endpoint you created in step 5 —
  each endpoint gets its own `whsec_`. Re-copy it.
- **Payment succeeds but the order never flips to paid.** Check that
  `client_reference_id` actually made it onto the Payment Link URL (step 4).
  This is the single most common integration mistake with this pattern.
- **`admin-orders` always returns 401.** The operator key is either unset or
  doesn't match what you're sending — by design, an unset key means no
  access, never open access.
