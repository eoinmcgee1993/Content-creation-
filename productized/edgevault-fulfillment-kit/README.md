# EdgeVault

**A zero-backend Stripe + Supabase kit for selling a digital product, or
gating any per-order state, without a server you have to run.**

No Express app. No Next.js API routes. No cron job polling for payments. No
framework, no bundler, no build step on the client. Six Supabase Edge
Functions and one migration do all of the trusted work; your page does none
of it.

Extracted from a system that has taken real, live-mode Stripe payments in
production — not a tutorial project. See `AUDIT.md` in the parent folder for
the evidence.

---

## The one rule everything else follows

**The browser can create, and can do nothing else.**

It holds a Supabase publishable key that can `INSERT` and nothing more — no
`SELECT`, no `UPDATE`, on any table this kit owns. It cannot read an order
back, cannot mark itself paid, cannot approve its own artwork, cannot see
anyone else's order. Every one of those facts is enforced twice — once by a
Postgres grant, once by a row-level security policy — so a single
misconfiguration doesn't undo it.

```
  Browser (static HTML, any framework or none)
      │
      │  INSERT only — anon key, no SELECT/UPDATE grant on any table
      ▼
  Supabase Postgres
      ▲  RLS: insert-only policy for anon
      │  BEFORE INSERT trigger forces payment/approval fields back to their
      │  unpaid/pending defaults on every row, so a crafted insert can't
      │  self-declare "paid" or "approved"
      │
  Edge Functions (Deno, service-role key, verify_jwt = false)
      │
      ├── stripe-webhook   ← Stripe. HMAC-verified. The only thing that can
      │                       ever set an order to "paid."
      ├── kit-download     ← browser. (order_id, token). Paid orders only.
      ├── apparel-approval ← browser. (order_id, token). One-way approval
      │                       state machine; never touches payment state.
      ├── create-apparel-order ← browser. Server-owned pricing + row creation.
      ├── apparel-notify   ← browser. Idempotent transactional email.
      └── admin-orders     ← operator. Shared-secret read view, no tokens
                              in the response.
      │
      ▼
  Stripe Payment Link, carrying client_reference_id = your order id
```

## What's included

```
supabase/
  migrations/
    001_initial_schema.sql          orders + order-files tables, indexes
    003_order_security.sql          RLS policies, grants, BEFORE INSERT triggers
  functions/
    stripe-webhook/index.ts         HMAC-SHA256 verified, constant-time compare,
                                     300s replay window, 500-on-failure so Stripe retries
    kit-download/index.ts           token-gated file release, paid orders only
    apparel-approval/index.ts       token-gated, one-way approval state machine
    create-apparel-order/index.ts   server-owned order creation + pricing
    apparel-notify/index.ts         idempotent transactional email dispatch
    admin-orders/index.ts           SHA-256 shared-secret operator read view
client-pattern/
  order-form.html                   reference static page: insert-only order
                                     creation + Stripe Payment Link handoff
  download.html                     reference static page: token-gated download
```

The Edge Functions are the product. The HTML is a working *pattern* to build
your own page against — plain HTML/CSS/JS, no framework — not a themed
storefront. Swap it for React, Vue, or your existing site; the functions
don't care what called them.

## Security properties, by mechanism (not by claim)

| Property | How it's actually enforced |
|---|---|
| A visitor can create an order | RLS `INSERT` policy, `WITH CHECK (true)`, for `anon` — nothing else |
| A visitor cannot read any order back | No `SELECT` grant to `anon`; no `SELECT` policy exists |
| A visitor cannot mark their own order paid | No `UPDATE` grant, **and** a `BEFORE INSERT` trigger overwrites the payment columns on every insert regardless of what the client sent |
| Only Stripe can mark an order paid | `stripe-webhook` verifies `Stripe-Signature` as HMAC-SHA256 over `${timestamp}.${rawBody}`, compares in constant time, rejects anything older than 300 seconds |
| Only the buyer can download their file | `kit-download` requires the `(order_id, token)` pair **and** `payment_status = 'paid'` |
| An attacker can't tell a wrong order id from a wrong token | Both return an identical 404 — distinguishing them turns the endpoint into an order-id oracle |
| The webhook signing secret never leaks into your repo or env | Stored in one config table with RLS on, zero policies, all grants revoked — readable only by a service-role client inside a function |
| Only the operator can read the order queue | `admin-orders` compares a shared key by SHA-256 digest; an unset key means **no access**, not open access |

Two enforcement layers (grant + RLS) exist for the same rules on purpose:
either one alone is sufficient, and the second is there for the day the first
gets edited by mistake.

## What this kit is good for

Anything shaped like "pay, then unlock a gated action" with no user accounts:
a paid digital download, a print-ready file release, a license-key handoff, a
paid template/dataset unlock, a quote-then-approve-then-invoice flow for
custom work. It is **not** a subscriptions/billing-portal kit and it does not
include user auth — orders are found by a token in a link, not a login.

## What you still have to do

This is honest, not a hedge: two things are on you before this is "yours."

1. **Rename the `{{PREFIX}}` placeholder.** The source this was extracted
   from used a domain-specific table prefix throughout — SQL, every function,
   every comment. This package uses `{{PREFIX}}_orders`,
   `{{PREFIX}}_order_files`, `{{PREFIX}}_config` etc. as the placeholder; do
   one project-wide find-and-replace to your own short prefix (`shop_`,
   `kit_`, whatever) before your first deploy. Ten minutes, covered in
   `SETUP.md`.
2. **Decide what "paid" unlocks.** `kit-download` ships as a working example
   (SVG file release). Swap the table/column names and the response body for
   whatever you're actually delivering — a signed download URL, a license
   key, a webhook to your fulfillment system. The gating pattern (token +
   `payment_status = 'paid'`) is the part that doesn't change.

Full walkthrough: see `SETUP.md`.

## License

Personal and commercial use. Use it in as many of your own or client projects
as you like. You may not resell, sublicense, or redistribute the source code
itself — in whole or in part — as a competing template or boilerplate
product. No attribution required in what you ship. No warranty: you are
responsible for your own Stripe and Supabase configuration, compliance, and
operation. *(Confirm this against your own terms of sale before publishing —
this is a starting license, not legal advice.)*
