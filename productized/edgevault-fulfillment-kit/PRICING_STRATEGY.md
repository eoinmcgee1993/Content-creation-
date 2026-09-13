# Pricing strategy: $49

## Where $49 sits

| Comparable | Typical price |
|---|---|
| n8n / Zapier workflow template packs | $15–35 |
| Landing page / UI kit templates | $19–49 |
| Full SaaS starter kits (auth + billing + dashboard) | $79–199 |
| Single-purpose backend boilerplate (this category) | $39–79 |
| A freelance dev fixing a broken Stripe webhook integration | $150–400+ for a few hours |

$49 sits at the top of "impulse buy for a working developer," and at maybe a
sixth of what fixing this yourself after a bad launch costs in billable time.
That's the position: not the cheapest thing in the category, priced like the
most defensible one.

## Why $49, specifically — not $29, not $99

**Not $29.** This isn't a template or a UI kit — it's payment-adjacent
security code. $29 reads as "script," and it invites the exact buyer who
will file a support ticket for every edge case instead of reading
`SETUP.md`. The commented-and-explained code and the verification-query
setup guide are worth more than template-tier pricing, and pricing it like a
template throws that signal away.

**Not $99+.** At $99+, a solo developer or indie hacker starts comparing
this to a full SaaS starter kit (auth, billing portal, dashboard, the
works) and EdgeVault is deliberately *not* that — it's one thing, done
carefully. $99 also crosses into "needs a demo call" territory for a lot of
Gumroad's audience, which kills impulse conversion for a product with no
sales motion behind it.

**$49 is the point where:**
- A developer can buy it on a card without asking anyone, but it's expensive
  enough that "I'll just build it myself this weekend" stops being the
  obviously cheaper option once their time is worth anything.
- It signals "I took security seriously" pricing without promising more
  scope than the product delivers (still single-purpose: pay → unlock).
- Round, easy to compare, easy to remember — no `$47` or `$52` cuteness that
  reads as A/B-tested rather than confident.

## The value math to put in front of a buyer's hesitation

Don't sell hours saved — sell the cost of the failure mode this prevents:

- A forged "paid" order because a boilerplate trusted client input: lost
  product, plus the time to find and patch the hole.
- A Stripe webhook with no signature check, or one that isn't constant-time:
  same outcome, worse, because it's invisible until it's exploited.
- A chargeback on an unrecognized merchant descriptor or a broken refund
  path: costs more in fees and account-standing risk than the sale itself.

$49 is priced against *that*, not against "how long would this take me to
write." A buyer who's shipped a payment integration before will do that math
themselves; the listing copy in `GUMROAD_LISTING.md` is written to prompt it
("Security, honestly" section) rather than state it as a hard claim.

## Launch plan

1. **Launch at $49. Don't launch at a "discount off" $49** — no listing a
   fake $79 struck through. It's a small, credibility-sensitive market;
   that trick is well-known on Gumroad and costs more trust than the few
   extra conversions it buys.
2. **If you want an early-bird lever, use scarcity, not a discount:** "$39
   for the first 25 buyers" (a real, countable number, publicly true) is
   fine. A permanent "50% off" banner is not — it just resets the anchor to
   whatever the sale price is.
3. **No coupon codes handed out generally.** Reserve them for a specific
   audience touch (e.g., a single relevant community or newsletter mention),
   not blanket distribution — blanket discounting trains your list to wait
   for the next one.
4. **Hold the price once real sales exist.** Raise it later if demand
   supports it (proof: conversion rate holding up, support load staying
   low); don't lower it — a lowered price on an existing product reads as
   "wasn't worth $49" to anyone who paid full price and sees it.

## The upsell path (don't build it yet, plan for it now)

Asset 2 from the audit (`AUDIT.md`) — the n8n automation pipeline pack — is
a natural bundle partner later: different buyer motivation (automation vs.
payments) but the same audience (developers shipping small, real
things). When it's packaged:

- Offer it as a **separate SKU**, not a variant of this one — don't dilute
  what EdgeVault is for.
- Once both exist, a **bundle price below the sum of the two** (e.g., $49 +
  $35 → $69 bundled) gives existing EdgeVault buyers a reason to come back
  and gives new buyers a reason to buy both at once. Don't build the bundle
  discount into the EdgeVault launch — it has nothing to sell against yet.

## What to watch after launch

- **Conversion rate on the listing page.** Gumroad code products in this
  category typically convert in the low single digits from page view; if
  it's tracking well under that after real traffic (not just the first
  week), the listing copy is the first thing to revisit — not the price.
- **Refund rate.** This is the real signal on whether $49 is right, more
  than conversion rate is. A near-zero refund rate with steady sales means
  the price is fine, possibly low. Refunds citing "didn't do what I
  expected" mean a scoping problem in the listing copy (see the "Who this
  is NOT for" section in `GUMROAD_LISTING.md`), not a pricing problem —
  fix the copy before touching the price.
- **Support-question volume.** If the same question keeps coming in, it
  belongs in `SETUP.md`'s troubleshooting section, not answered individually
  forever — every unanswered-by-docs question is a future refund request.
