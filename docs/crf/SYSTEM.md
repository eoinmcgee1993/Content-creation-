# The CRF site — what it is, and how it works

This describes the whole system as it stands: the three things a customer can
do, the code behind each, the database they write to, and the rules that stop
them writing anything they should not. It is the reference document. The
deployment plan is in `DEPLOYMENT.md`; the machine-readable specification is in
`BLUEPRINT.md` and `blueprint.json`.

**Working name.** "CRF Garage" is the prototype name and appears in the page
copy. It is not the trading name and is not registered. See §11.

---

## 1. What it is

A static site that sells three things to owners of a Honda CRF250L / CRF300L:

| # | Product | What the customer gets | How they pay |
|---|---|---|---|
| 1 | **Graphics kit** | A print-ready SVG cut file for their own design, laid out on the real vinyl outlines | Stripe, up front, file released on payment |
| 2 | **Racewear** | Custom club jerseys / pants, quoted per roster | Quote → artwork approval → invoice. No card payment on the site yet |
| 3 | **ECU template** | A JSON tune template for launch control, decel pops and a bounce limiter | Free download. It is the lead product, not a paid one |

Plus a **modifications guide** that exists to stop people hurting their engines,
and which is the reason the ECU builder no longer offers an injector choice.

There is no login. Nobody has an account. Everything a customer needs to get
back to their order is a link with a token in it.

---

## 2. Architecture in one page

```
  Browser (static HTML, no framework, no build step)
      │
      │  1. POST /rest/v1/crf_orders           (anon key, INSERT only)
      │  2. POST /rest/v1/crf_order_files      (anon key, INSERT only)
      │
      ▼
  Supabase Postgres ──────────────────────────────────────────────┐
      ▲                                                            │
      │  RLS: INSERT-only policy for anon                          │
      │  GRANTs: anon holds INSERT and nothing else                │
      │  BEFORE INSERT trigger: forces payment_status='unpaid'     │
      │                                                            │
      │                                                            │
  Edge Functions (Deno, service-role key, verify_jwt=false)        │
      │                                                            │
      ├── stripe-webhook    ← Stripe. HMAC-verified. Marks paid ───┘
      ├── kit-download      ← browser. (order_id, token). Paid only
      └── apparel-approval  ← browser. (order_id, token). Artwork only
      │
      ▼
  Stripe Payment Link, carrying client_reference_id = order id
```

Three properties fall out of that shape and everything else follows from them:

1. **The browser can create, and can do nothing else.** It cannot read an
   order back, cannot update one, cannot see anyone else's. Both the row-level
   policy and the table grant say so, independently.
2. **Money is only ever set by Stripe.** The browser physically cannot write
   `payment_status`; the insert trigger overwrites it even if it tries; and the
   only code that sets it to `paid` runs after verifying a Stripe signature.
3. **Getting back to your order needs a secret you were given once.** An order
   id alone is worthless. Every read is keyed on `(id, token)`.

---

## 3. The graphics kit builder — `index.html`

The hard part of this product is not the UI; it is that the artwork has to land
in the right place on a piece of vinyl that will later be cut.

### The geometry

`PATHS` holds the real cut outlines — **15 pieces**, all in one shared
coordinate space, so their positions relative to each other are already
correct. `ZONES` groups them into the six parts a person actually thinks in:

| Zone id | Label | Cut pieces |
|---|---|---|
| `front-fender` | Front Fender | 1 |
| `left-shroud` | Left Shroud | 5 |
| `right-shroud` | Right Shroud | 5 |
| `rear-fender` | Rear Fender / Tail | 2 |
| `left-fork-guard` | Left Fork Guard | 1 |
| `right-fork-guard` | Right Fork Guard | 1 |

A zone is **not** one sticker. That distinction has bitten this project twice
and is repeated in the 3D modeller's brief for the same reason.

Each zone is rendered as an SVG `<g>` with a `clipPath` built from its own
paths. The customer's image goes inside the clip. Nothing is rasterised — what
is previewed is what is exported.

### Placing a design

Two routes:

- **Kit-wide.** `applyKitwideImage()` takes one photo and lays it across all
  six zones at once. It computes `kitBBox()` — the bounding box of every zone
  together — then gives every zone the same `baseScale` and offsets each one's
  pan so all six sample the *same* point of the image. The result is one
  continuous design running across the bike rather than six copies of a photo.
  This is the route the product is actually sold on.
- **Per zone.** The customer can still pick a zone and adjust pan, scale and
  rotation on it alone.

`PRESETS` (race, rally, retro, splatter) are pre-built kit-wide designs, applied
through the same path, so a preset and an upload behave identically afterwards.

Uploads are downscaled client-side to 1800 px before use. A 12 MP phone photo
would otherwise be embedded verbatim into the SVG and into the database row.

### The on-bike preview

`BIKE_SIDE` is a set of side-profile silhouettes of the same six parts, drawn in
their own coordinate space. `buildBikePreview()` renders a simple chassis and
fills each silhouette with the corresponding zone's design. It is a preview, not
a render: it answers "does my design read from three metres away", which is the
question people actually ask.

Two earlier attempts tried to rotate the flat cut geometry into a side view.
Both looked wrong, because a cut file is a flattened shell — it does not project
back to a side elevation. The separate silhouette set is the fix.

### Ordering

1. Insert into `crf_orders`: model, fulfilment (`digital`), name, email, notes,
   zone state, and a `download_token` the browser generates with
   `crypto.randomUUID()`.
2. Insert the finished SVG into `crf_order_files`, keyed on the order id.
3. Show a Stripe Payment Link with `?client_reference_id=<order id>` appended.
4. The customer pays. Stripe calls `stripe-webhook`, which marks the order paid.
5. The customer presses **Check payment**. `kit-download` returns the SVG —
   only if `payment_status = 'paid'` and the token matches.

The price lives in the Stripe Payment Link, not in the page. Changing it does
not require a deploy. It is **$39.00 USD**, one-time, on a **live-mode** link
— the kit has been on real sale, not in test mode, since the link was made.

Worth knowing, because it is invisible from the code: the Stripe account is
named **Clearmark**. That is the name a customer sees at checkout and on their
card statement, and it is not the name of this site. See the gaps below.

Physical fulfilment is **off**. There is one fulfilment radio (`digital`), and
`STRIPE_LINKS` has one entry. The physical confirmation branch further down the
file is now unreachable — see §11.

---

## 4. The racewear builder — `apparel.html`

Four garments, priced in satang (THB minor units), with USD shown alongside
because a Thai price is unreadable to an overseas buyer:

| Garment | Base | Kind |
|---|---|---|
| MX Race Jersey | ฿1,290 | top |
| MX Race Pants | ฿2,890 | bottom |
| BMX Race Jersey | ฿1,090 | top |
| Adventure Shirt | ฿1,490 | top |

Quantity tiers multiply the unit price: 1× at 1, 0.92 at 5, 0.84 at 10, 0.75 at
20, 0.68 at 50. The page shows the total computed from the exact unit price, not
from the rounded one on screen — otherwise the line items would not add up to
the total and that is the sort of thing a club treasurer notices.

Placement zones carry a real print area in centimetres (chest 28×20, back 30×34,
sleeve 12×12, thigh 22×26, seat 26×22). Every upload is checked against
`MIN_DPI = 150` for that physical size, and the customer is told before ordering
if their logo will print soft. This is the only honest way to sell print from a
web upload.

The garment silhouettes were redrawn once already: the first set rendered as
dresses because the jersey had no sleeves below the shoulder and the pants had
no legs. They are now a long-sleeve jersey and full-length pants.

### Approval, and why it needed a server

The page promises "you pay after approval, not before", and the terms say we
produce from the approved artwork. That promise has to be recorded somewhere the
customer cannot forge and we cannot quietly change.

On order the browser generates a second UUID, `approval_token`, stores it with
the order, and shows the customer their approval URL —
`approve.html?order=…&token=…`. That link is the only way back.

`approve.html` calls the `apparel-approval` Edge Function, which:

- authenticates on the pair `(order_id, approval_token)`, and returns the same
  404 for a wrong token as for a wrong order, so the endpoint cannot be used to
  discover which order ids exist;
- can write `artwork_status`, `artwork_note` and `artwork_reviewed_at`, and
  **nothing else** — it never touches `payment_status`;
- treats approval as one-way. Once approved, re-approving returns 409. Changes
  requested can still be revisited.

There is no card payment on this flow yet. It produces a quote and a recorded
approval; the invoice is sent by hand.

---

## 5. The ECU template builder — `ecu.html`

Produces a JSON tune template for a standalone or flashed ECU. Three features,
each with the conditions that make it safe rather than just the numbers that
make it loud:

**Launch control.** Holds RPM (5500–8000, default 6500) on ignition cut, with
−5° retard and 10% enrichment. Critically it emits `activation_conditions`:
clutch in, first gear, under 5 km/h. Without those three, an "activation RPM" is
just a rev limiter in every gear, which is how people discover their tune on a
motorway on-ramp.

**Decel pops and flames.** Closed throttle (TPS 0–3%), 4500–8500 rpm, −2° timing,
+15% fuel — and `disable_dfco: true`. Deceleration fuel cut-off must be off or
there is no fuel to enrich and the feature does nothing. That flag was missing
from the first version and the template was silently inert.

**Bounce limiter.** A soft limiter below the hard one. Default 9500 rpm against a
hard limit of 10500. The cut type matters: on **ignition cut** the extra
enrichment and retard keys are emitted, because that is what makes the noise; on
**fuel cut** they are omitted, because enriching a cylinder that is not being
fired is how you wash a bore and fill an exhaust with raw fuel. The generator
only writes those keys in the ignition-cut branch. `must_stay_below_rpm` records
that it never replaces the hard limiter.

The base fuel and ignition maps ship as corrections against the stock map for an
intake-and-exhaust bike on 91–95 octane, dyno-tested. AFR targets are 13.2–13.5
cruise and 12.8–13.1 at wide-open throttle.

The saved template lives in the repo at
`ecu-templates/honda-crf250-300-na-pumpgas.json`, with its own README.

### The injector

The builder used to offer a "PCX150 injector upgrade". It was wrong in the most
dangerous direction. A PCX150 injector flows around 140 cc/min; the CRF's stock
injector flows more than that, and genuine upgrades are in the 235–270 cc/min
range. Selecting it advertised an increase while delivering roughly a 40%
**reduction** — and it changed no fuel number in the output, so the map stayed
sized for the stock injector while the hardware could not supply it. Lean, at
wide-open throttle, is what puts holes in pistons.

The option is gone. The dropdown is stock-only, the warning is in the page, in
the downloaded file's `build_profile.injector` string, in the template JSON and
in the README. §1 of the modifications guide explains it in full.

---

## 6. The modifications guide — `mods.html`

Written after the injector defect, and structured to make its own reliability
visible. Every claim carries an evidence tag:

- `measured` — from the dyno or from a part in hand
- `vendor` — a manufacturer's published figure
- `principle` — follows from how the engine works, not from a measurement
- `unverified` — repeated widely, not confirmed

Four sections: the injector mistake in full, what actually needs the map
changed, the baseline and what to expect from it, and seven cited sources.

The tags are the point. A guide that cannot tell you which of its numbers were
measured is indistinguishable from a forum post.

---

## 7. Data model

Four tables, all prefixed `crf_`.

**`crf_orders`** — graphics kit orders. Text primary key (`CRF-XXXXXXXX`),
`model`, `fulfilment` (`physical`|`digital`), customer name and email, notes,
`zones` jsonb, `shipping_address` jsonb, `download_token` uuid, and the payment
block: `payment_status` (`unpaid`|`paid`|`refunded`), `stripe_session_id`,
`stripe_payment_intent`, `paid_at`.

**`crf_order_files`** — the finished SVG, one row per order, `order_id` primary
key with `ON DELETE CASCADE` back to `crf_orders`.

**`crf_apparel_orders`** — racewear orders. Same shape plus `garment`,
`club_name`, `roster` jsonb, `unit_count`, `unit_price_cents`, `total_cents`,
`currency` (`THB`|`USD`), `fx_usd_per_thb`, and the artwork block:
`artwork_status` (`pending`|`approved`|`changes_requested`), `artwork_note`,
`artwork_reviewed_at`, `approval_token` uuid, `approval_email_sent_at`.

**`crf_config`** — a key/value table holding every secret this system has:
the Stripe webhook signing secret, the email sending key and addresses, and
the operator key. RLS on, **no policies at all**, and every grant revoked from
`anon` and `authenticated`. Only a service-role key inside an Edge Function can
read it. That is deliberate: it means the secret is rotatable with one UPDATE
and never appears in a repository, an environment file or a deploy log.

Indexes: `(payment_status, created_at DESC)` on both order tables for the
operator's queue view, unique partial indexes on the tokens, `(id,
approval_token)` for the approval lookup, and `customer_email` on `crf_orders`.

---

## 8. Where each rule is actually enforced

This is the part worth checking against, because "the UI won't let you" is not
enforcement.

| Rule | Enforced by |
|---|---|
| A visitor can create an order | RLS `INSERT` policy `WITH CHECK (true)`, for `anon` |
| A visitor cannot read any order | No `SELECT` grant to `anon`, and no `SELECT` policy |
| A visitor cannot mark their own order paid | No `UPDATE` grant; **and** a `BEFORE INSERT` trigger that overwrites `payment_status`, `stripe_session_id`, `stripe_payment_intent`, `paid_at` on every insert |
| A visitor cannot pre-approve their own artwork | Same trigger, which also forces `artwork_status='pending'` and clears the review fields |
| Only Stripe can mark an order paid | `stripe-webhook` verifies `Stripe-Signature` as HMAC-SHA256 over `<timestamp>.<raw body>`, compares in constant time, and rejects anything older than 300 seconds |
| Only the buyer can download their file | `kit-download` requires `(order_id, download_token)` **and** `payment_status='paid'` |
| Only the customer can approve artwork | `apparel-approval` requires `(order_id, approval_token)`; can write only artwork fields |
| The webhook secret never leaks | `crf_config`: RLS on, zero policies, grants revoked — service-role only |
| A customer cannot be mailed repeatedly | `apparel-notify` stamps `approval_email_sent_at` and no-ops on a second call; the insert trigger clears it so a browser cannot pre-set it |
| The approval link we email cannot be redirected | Built from `crf_config.site_base_url`, never from the request |
| Only the operator can read the queues | `admin-orders` compares a key against `crf_config.operator_key` by SHA-256 digest; unset means no access, not open access |

Both trigger functions are `SET search_path TO ''`, so they cannot be subverted
by a schema shadowing a function name.

The two layers — grants and RLS — are redundant on purpose. Either one alone
would do the job; the second is there for the day the first is misconfigured.

---

## 9. Deploy mechanics

The site is static. There is no build step, no bundler and no framework: five
HTML files and a `kits/` image folder, zipped and posted to Netlify.

The GitHub Action that used to do this (`.github/workflows/deploy-ecu-app.yml`)
has its push trigger commented out because `NETLIFY_AUTH_TOKEN` was revoked. It
is still callable by `workflow_dispatch`. Deploys are currently manual — the
exact command is in the private infrastructure sheet and in `DEPLOYMENT.md`.

Note the endpoint: `POST /api/v1/sites/{id}/builds` with the archive in a
multipart field named `zip`. `/deploys` is refused.

The repository root `netlify.toml` publishes `digital-renaissance/site`, which
belongs to a different project in the same repository. That is why deploy
previews on CRF pull requests sometimes fail for reasons that have nothing to do
with the change.

---

## 10. What is in the repository but not part of this system

`supabase/functions/build-digital-asset` and `supabase/functions/fulfill-order`
belong to the digital-product project that shares this repository. They call
Gemini, Resend and Lemon Squeezy and touch `scraped_signals` / `sales_funnels`.
They are not part of the CRF site and nothing here calls them.

The CRF Edge Functions are exactly five: `stripe-webhook`, `kit-download`,
`apparel-approval`, `apparel-notify` and `admin-orders`.

---

## 11. Known gaps, in order of how much they matter

1. **No trading name, and "CRF" is Honda's.** The prototype name is on every
   page. Using a manufacturer's model designation as a trading name is real
   trademark exposure, and a domain bought under it is money spent on a name
   that may have to change.
2. **The merchant name does not match the site.** Payments run through a
   Stripe account called *Clearmark*, so that is what a buyer sees at checkout
   and on their statement. Unrecognised descriptors are a leading cause of
   chargebacks, and a chargeback on a $39 file costs more than the sale. This
   is the naming decision arriving with a bill attached.
3. **The legal pages are written but not published.** `privacy.html` and
   `terms.html` are complete except for four facts held in `legal-details.js`:
   entity, address, contact email, governing law. The file marks blanks in red
   and shows a banner, so it cannot be published half-filled by accident. They
   are not linked from any page and not in the deploy bundle.
4. **The approval email is built but not switched on.** `apparel-notify`
   sends the customer their approval link and the operator a heads-up, and it
   is deployed. It stays inert until four `crf_config` rows exist — a sending
   key, a from address, an operator address and the site base URL — and the
   from address needs a verified sending domain, which needs the name. Until
   then the order still saves and the link is still on screen.
5. **The operator view is built but not switched on.** `desk.html` and
   `admin-orders` are done; set `crf_config.operator_key` to enable it. The
   page is unlinked and carries a noindex tag. It is not deployed yet — see
   below.
6. **No 3D preview.** The on-bike preview is a 2D silhouette. The real
   thing needs a commissioned model — brief written, not commissioned. Stock
   and AI-generated models fail on the UV layout, which is the one requirement
   that matters, and their licences generally forbid serving the file to
   visitors, which a web viewer does by definition.
7. **The site is behind the repository.** `apparel.html`, `index.html` and
   the new `desk.html` are committed but not deployed, because
   `NETLIFY_AUTH_TOKEN` is revoked. The server side — all five Edge Functions
   and the schema — is live and current.
