# Gumroad listing copy — EdgeVault

Paste the sections below directly into the Gumroad product editor. Swap
`[your name/brand]` and `[your support email]` before publishing.

---

## Product name

**EdgeVault — Zero-Backend Stripe + Supabase Fulfillment Kit**

## One-line pitch (for the Gumroad card / search results)

Sell a digital product through Stripe with no backend to run — six
Supabase Edge Functions handle payment verification, token-gated delivery,
and approval flows, security-hardened over real production use.

## Price

**$49** — one-time. See `PRICING_STRATEGY.md` for the reasoning.

## Tags / category

`developer tools`, `boilerplate`, `supabase`, `stripe`, `serverless`,
`edge functions`, `saas starter`, `no-code alternative`

---

## Full description

### The problem

You want to sell a digital file — or gate literally any action behind "has
this order been paid" — and every path you're looking at is worse than it
should be:

- A Zapier/Make chain that breaks silently and you find out from a refund
  request.
- A full Express/Next.js backend for what is, underneath, three database
  writes and one webhook.
- Rolling your own webhook verification and getting the signature check
  subtly wrong — which is invisible until someone forges a "paid" order.

### What EdgeVault is

A working pattern, extracted from a system that has taken real, live-mode
Stripe payments in production: your customer's browser can **create an
order and nothing else**. It cannot read orders back, cannot mark itself
paid, cannot approve its own submitted artwork. Every one of those
restrictions is enforced in the database itself — not just "the UI doesn't
show a button for it" — so it holds even if someone opens dev tools and
starts calling your API directly.

Stripe pays. A signature-verified webhook is the *only* thing that can ever
flip an order to `paid`. Your customer gets back a link with a token in it —
no login, no account system — and that token is what unlocks their file.

Six Supabase Edge Functions. One migration. Deno, no framework, no build
step. Deploy it and it's the whole backend.

### What's included

- **6 Edge Functions**, fully commented, explaining *why* each check exists,
  not just what it does:
  - `stripe-webhook` — HMAC-SHA256 signature verification, constant-time
    comparison, 5-minute replay window, correct retry behavior on failure.
  - `kit-download` — token + paid-status gated file release.
  - `apparel-approval` — a one-way approval state machine driven entirely
    by a link token, never touches payment state.
  - `create-apparel-order` — server-owned order creation and pricing.
  - `apparel-notify` — idempotent transactional email (sends once, ever).
  - `admin-orders` — a shared-secret operator view that can't leak
    customer download/approval links.
- **1 SQL migration**: tables, indexes, row-level security policies,
  database grants, and `BEFORE INSERT` triggers that make the payment and
  approval columns physically un-forgeable by a client insert.
- **2 reference HTML pages** showing the client-side calls, unstyled —
  a starting point, not a themed storefront to fight with.
- **A setup walkthrough** that takes you from an empty Supabase project to
  a verified live purchase, with the exact verification query for every
  step so you know it's actually locked down, not just "should be."

### Who this is for

Developers shipping a digital product, a paid file release, a license-key
handoff, or any "pay → unlock" flow, who want it done right the first time
instead of finding the hole after launch. Also useful as a reference
implementation if you're learning how to actually secure a Supabase +
Stripe integration — the comments explain the reasoning, not just the code.

### Who this is NOT for

- You need subscriptions, seat-based billing, or a customer billing portal
  — this is single-item, pay-once fulfillment. Wrong tool for recurring
  billing.
- You need user accounts / login — this kit deliberately has none. Access
  is a token in a link, by design.
- You want a themed, ready-to-launch storefront — you're getting the
  backend and a bare-bones reference page, not a landing page template.

### Security, honestly

Every claim above is something you can check yourself — the setup guide
gives you the exact SQL to verify each guarantee (grants, RLS, trigger
behavior) rather than asking you to trust the README. This shipped and took
real payments before being extracted into this kit, and it went through
multiple dedicated hardening passes based on real use. That said: this is
one team's self-directed hardening, not a third-party penetration test.
Treat it as a strong, security-conscious starting point — and if you're
handling anything beyond a low-stakes digital download, get your own review
before launch, same as you would for any payment code.

### Requirements

- A Supabase project (free tier works to start).
- A Stripe account.
- The Supabase CLI, or comfort using the dashboard's SQL editor and
  function deploy UI instead.
- No Node/Express/build tooling required for the backend itself.

### What happens after purchase

You get a zip with the six functions, the migration, the two reference
pages, and the full setup walkthrough (`README.md` + `SETUP.md`). Follow it
top to bottom; each step has a verification check before you move to the
next one.

### FAQ

**Does this include a frontend/storefront design?**
No — two unstyled reference pages showing the exact API calls. The backend
is the product.

**Can I use this for client projects?**
Yes, personal and commercial use is included. You can't resell the source
itself as a competing template.

**Does it handle subscriptions?**
No — one-time payment → one-time unlock. That's the whole scope, and it's
scoped that way on purpose.

**What if I get stuck?**
[your support email] — reasonable setup questions answered. This isn't a
support contract or an SLA.

**Updates?**
Bug fixes and security-relevant updates are free for existing buyers.
[Confirm your own update/versioning policy before publishing.]

---

### Suggested assets to capture before publishing (not included here)

- A screenshot or short screen-recording of the architecture diagram from
  `README.md` (render it, don't ship ASCII art as the hero image).
- A terminal capture of the six verification queries/checks in `SETUP.md`
  actually passing — this is the single most convincing screenshot for a
  security-conscious buyer.
- The two reference HTML pages, rendered, side by side (order form →
  Payment Link → download).

### Refund / support policy (fill in and confirm before publishing)

Gumroad digital goods are commonly sold as no-refund once downloaded, or
case-by-case at the seller's discretion. Pick one, state it plainly on the
listing, and keep it consistent with whatever your local consumer-law
obligations actually require — this doc isn't legal advice on that point.
