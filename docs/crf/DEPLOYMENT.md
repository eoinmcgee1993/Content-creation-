# Deployment plan

Written 1 Sep 2026. Companion to `SYSTEM.md` (what exists) and `BLUEPRINT.md`
(how to rebuild it).

This is the plan from here to a site that can take money from a stranger
without anyone watching it. It is ordered so that the things that would force
rework if done late come first.

---

## 0. Where it stands today

| Piece | State |
|---|---|
| `/` graphics kit builder | Live, 200 |
| `/apparel` racewear builder | Live, 200 |
| `/ecu` ECU template builder | Live, 200 |
| `/mods` modifications guide | Repository-ready; live route currently 404 until bundle deploy |
| `/approve` artwork approval | Repository-ready; live route currently 404 until bundle deploy |
| `privacy.html`, `terms.html` | Written, **not deployed**, not linked |
| Database | 4 tables, RLS on, grants narrowed, triggers in place |
| Edge Functions | Six CRF functions defined; live activation requires Supabase deployment |
| Payments — kit | Stripe Payment Link live, webhook verified |
| Payments — racewear | Manual invoice. No card path |
| `/desk` order desk | Repository-ready; live route currently 404 until bundle deploy |
| Approval email | Built; inert until three `crf_config` rows exist and function is deployed |
| CI deploy | **Not automated.** `NETLIFY_AUTH_TOKEN` revoked, so the Action's push trigger stays off. Deploys work on request through the Netlify connector |
| Domain | Not purchased |
| Trading name | Not decided |

Everything on that list works. The plan below is about the things around it.

---

## Phase 1 — Decide the name (blocks almost everything)

**Why first.** The name is on every page, in the Stripe account, in the domain,
in the terms, and in the email address the privacy policy has to name. Deciding
it late means redoing all of that. Deciding it now costs one afternoon.

**The constraint worth stating plainly.** "CRF" is Honda's model designation.
Using it as a trading name is not the same as using it descriptively ("graphics
kits for the Honda CRF250L"), which is normal and defensible. A trading name,
a domain and a Stripe merchant name built on it are exposure — and the cost is
not a lawsuit, it is being told to stop after you have spent money on the name.

**Done when:** a name is chosen, the domain is bought, and the Stripe account's
public-facing name matches it.

**Blocked on:** you. Nothing else in this plan can be automated past it.

---

## Phase 2 — Publish the legal pages

Two pages are written and tested. They are held back by four facts, which live
in `crf-builder/legal-details.js`:

```js
entity   // the name you actually trade as
address  // a service address — see below
email    // the contact address in the privacy policy
law      // the governing law of the terms
```

`legal-details.js` renders any blank in red and shows a banner across the page,
so a half-filled version cannot be published by accident.

**On the address.** An online-only business still needs one. Under both PDPA and
GDPR a privacy policy names a data controller, and a controller with no address
is not a controller anyone can complain to. It does not have to be premises —
a registered agent, an accountant's address, or a virtual office is normal and
sufficient.

**Steps**

1. Fill the four values in `legal-details.js`.
2. Confirm no banner and no red text on either page.
3. Add both to the deploy bundle and link them in the footer of all five pages.
4. Deploy. Verify `/privacy` and `/terms` return 200.

**Done when:** both pages are reachable from every page and neither shows a
placeholder.

---

## Phase 3 — Restore automated deploys

Manual deploys are fine for one person shipping occasionally and stop being fine
the moment anything is urgent.

1. Netlify → User settings → Applications → new personal access token.
2. Store it as the GitHub repository secret `NETLIFY_AUTH_TOKEN`.
3. Uncomment the push trigger in `.github/workflows/deploy-ecu-app.yml`, scoped
   to `crf-builder/**` so the other project in this repository does not trigger
   it.
4. Push a trivial change and confirm the workflow deploys it.

**The workflow publishes an explicit list of files, not the folder.** It used
to deploy `crf-builder/` wholesale, which would have put `privacy.html`,
`terms.html` and their placeholder banner live the moment the trigger was
re-enabled. It now stages the six intended pages plus `kits/` and deploys
that. When Phase 2 is done, add the two pages and `legal-details.js` to that
list — the same list the manual command above uses.

**Do not connect `crf-garage` to the repository.** It is deployed by upload
only, and that is deliberate: the root `netlify.toml` publishes
`digital-renaissance/site`, a different project here, so linking the site
would make its next build serve the wrong project on this domain. If it ever
must be linked, give it a base directory of `crf-builder` first.

Until then, the manual path is:

```bash
cd crf-builder
zip -r site.zip index.html apparel.html ecu.html approve.html mods.html \
       desk.html _redirects kits

curl -X POST "https://api.netlify.com/api/v1/sites/$NETLIFY_SITE_ID/builds" \
  -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  -F "zip=@site.zip;type=application/zip"
```

The multipart field must be named `zip`, and the endpoint is `/builds` —
`/deploys` is refused.

**Done when:** a push to `crf-builder/**` deploys without anyone opening a
terminal.

The current manual deploy must also include `_redirects`; it maps `/mods`,
`/approve` and `/desk` to the staged HTML files. After uploading, verify those
three extensionless routes explicitly. Deploy the new
`supabase/functions/create-apparel-order` function and apply
`supabase/migrations/003_crf_racewear_order_security.sql` before enabling the
updated racewear page. The migration intentionally removes `anon` insert on
`crf_apparel_orders`; without both steps, the page cannot create orders.

---

## Phase 4 — Close the racewear promise

The racewear page says *"We check your artwork at print size and email you to
approve it."* Nothing sends that email. Right now that sentence is true only
because a human is watching the table.

This is the one gap that will produce a complaint rather than a bug report, so
it is the highest-value automation left.

**Minimum version — one approval email, triggered from the database:**

1. **To the customer email stored on the order:** the approval link and order
   summary. The destination is read from the authenticated order row, never
   from the request.

**How.** A new Edge Function (`apparel-notify`), called from the browser
immediately after the order insert, sending through an email provider. It needs
no new privileges — it is a send, not a read — but it should take the same
`(order_id, approval_token)` pair so it cannot be used to mail arbitrary
addresses.

Add the provider's API key to `crf_config` alongside the Stripe secret rather
than to a function environment variable: one place to rotate, nothing in the
repository.

**Optional, same phase:** a third mail to the operator when the customer
approves, fired from `apparel-approval` on the state transition.

**Done when:** placing a racewear order notifies the customer and leaves a
durable approval link on screen without anyone doing anything.

---

## Phase 5 — Operator view

Orders are currently read by running SQL. That is workable and honest at low
volume; it stops being workable at the point where you would rather not open a
SQL console on a phone.

The testing panel that used to list orders was removed before launch, correctly:
it read the orders table from the browser, and the whole security model rests on
the browser not being able to do that.

**The shape that does not reintroduce the hole:** an operator page served at an
unguessable path, calling a new `admin-orders` Edge Function that requires a
shared secret held in `crf_config`. Service-role reads happen inside the
function, never in the page. Do not give `anon` a `SELECT` grant to make an
operator view easier — that is the exact regression this design exists to
prevent.

**Done when:** you can see pending, paid and approval-waiting orders on a phone.

---

## Phase 6 — Pre-launch cleanup

Small, all mechanical, all safe to batch:

- Delete the test order `CRF-MT39C8P7` from `crf_orders`.
- Remove the unreachable physical-fulfilment confirmation branch in
  `index.html`.
- Drop the duplicate CHECK constraint on `crf_apparel_orders`
  (`crf_apparel_artwork_status_chk` and `crf_apparel_orders_artwork_status_check`
  are identical; keep one).
- Re-run the live check (below) and confirm every page still returns 200.

---

## Phase 7 — Launch

Checked against the live Stripe account on 2 Sep. Two of the five steps were
already done, one is now known to be a different problem than it looked, and
the remaining two are yours.

### Already true — there is no test-to-live switch to make

An earlier version of this plan told you to move Stripe from test to live and
create a live webhook endpoint. **That work is done.** The account is in live
mode and has been all along:

| | |
|---|---|
| Payment link | live, active, `$39.00 USD` |
| Product | *CRF250L Custom Graphics Kit — Digital File* |
| Webhook endpoint | live, **enabled**, pointing at the `stripe-webhook` function |
| Subscribed events | `checkout.session.completed`, and only that |

So the failure this plan warned about — a test-mode signing secret left behind
a live-mode switch — cannot happen, because there is no switch. **Do not
rotate `crf_config.stripe_webhook_secret` as a launch ritual.** The secret in
the database is the one that endpoint was created with; replacing it without
cause would break a path that is currently correct.

### The real blocker nobody had written down

The Stripe account is **Clearmark**.

A customer buying a graphics kit sees *Clearmark* on the checkout page and
*Clearmark* on their card statement. They will not recognise it. Unrecognised
statement descriptors are one of the most reliable causes of chargebacks, and
a chargeback on a $39 digital file costs more than the sale.

This is the naming decision in Phase 1 arriving with a bill attached. It needs
either a Stripe account in the trading name, or at minimum a statement
descriptor that matches whatever the site is called.

### Nobody has ever completed a purchase

One checkout session exists against the kit link, from 8 Aug. It expired
unpaid. **The payment path has never run end to end with real money** — which
is exactly why the step below is not optional.

### What is left

1. **Point the domain at Netlify.** Confirm HTTPS on both apex and `www`.
   Blocked on Phase 1.
2. **Fix the merchant identity**, per above. Blocked on Phase 1.
3. **Run one real purchase with a real card**, for a small amount: design →
   order → pay → webhook → download. Refund it afterwards. This needs a human
   with a card; it cannot be automated, and it is the only test that exercises
   the layers in sequence.
4. **Verify the row:** `payment_status='paid'`, `paid_at` set,
   `stripe_session_id` populated.
5. **Confirm the file that downloads is the design that was ordered.**

Step 3 is also the only proof that the stored signing secret matches the
endpoint. Every other layer has been tested on its own; a signature can only
be verified by a real signed delivery.

---

## Phase 8 — After launch

Not a phase so much as a standing list, roughly in the order it will start to
matter:

- **Watch for paid orders with no download.** A `paid` row whose customer never
  successfully called `kit-download` means either they closed the tab or
  something failed. Either way it is a person who paid and got nothing.
- **Watch Edge Function logs for signature failures.** A burst of them means
  the signing secret drifted from Stripe. A steady trickle is the internet.
- **The 3D preview** (brief written, not commissioned) is the biggest
  differentiator left and the biggest single cost.
- **Card payment for racewear**, once the manual quote flow has proved the
  pricing.

---

## Verification

Run after every deploy. Five pages, all 200:

```bash
for p in "" apparel ecu mods approve; do
  printf '%-10s %s\n' "/$p" \
    "$(curl -s -o /dev/null -w '%{http_code}' "https://$SITE_HOST/$p")"
done
```

After Phase 2, add `privacy` and `terms` to that list.

Database invariants — all three must return zero rows:

```sql
-- nothing paid without Stripe having said so
select id from crf_orders where payment_status = 'paid' and stripe_session_id is null;

-- nothing approved without a recorded review time
select id from crf_apparel_orders where artwork_status = 'approved' and artwork_reviewed_at is null;

-- no paid order missing its file
select o.id from crf_orders o left join crf_order_files f on f.order_id = o.id
where o.payment_status = 'paid' and f.order_id is null;
```

Grants — `anon` must hold `INSERT` and nothing else, on exactly the two order
tables and never on `crf_config`:

```sql
select table_name, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'anon' and table_name like 'crf%';
```

---

## Rollback

**Site.** Netlify → Deploys → the last good one → **Publish deploy**. Seconds,
no rebuild.

**Database.** Migrations are forward-only; there is no down-migration. Every
change so far has been additive — new columns, tightened grants — so rolling
the site back never requires rolling the database back. Keep it that way: if a
future change must drop or narrow a column, ship it as two deploys, the code
first and the schema change after it has been live long enough to be sure.

**Stripe.** Payment Links can be deactivated in the dashboard without a deploy.
That is the fastest way to stop taking money if something is wrong.

---

## What is blocked on you, in one list

1. The trading name.
2. The domain, once the name exists.
3. Entity, address, contact email and governing law for the legal pages.
4. A fresh `NETLIFY_AUTH_TOKEN`.
5. Whether to commission the 3D model, and at what budget.
6. The measured front-fender width, if the model is commissioned.

Phases 4, 5 and 6 need none of the above and can proceed in parallel.
