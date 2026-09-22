# Pricing strategy: $39 (not $49)

The original audit priced Asset 1 at $49 because the user's brief set that
price point for the single highest-value asset. This is Asset 2, a
different product in a different category — the honest call is a different
price, not the same number for consistency's sake. Here's the reasoning;
override it if you'd rather match the two listings for a cleaner bundle
story, but do it deliberately, not by default.

## Where this sits

| Comparable | Typical price |
|---|---|
| A single n8n workflow template | $15–35 |
| A themed pack of 3–5 related templates | $29–49 |
| A hosted/managed automation SaaS (monthly) | $29–99/mo |
| EdgeVault (Asset 1 — hardened payment backend) | $49 |

Growth Fabric is a 3-in-1 pack, which argues for pricing above a single
template — but it's still n8n workflow JSON, not a hardened backend with
its own security audit trail. It doesn't carry the same "this prevents a
five-figure mistake" argument EdgeVault does. The value story here is time
saved building three non-trivial pipelines from scratch, not risk avoided.
That's a real value, just a different — and in the current market, lower —
ceiling.

## Why $39, specifically

**Above a single template ($15–35),** because this is genuinely three
production-shaped pipelines plus a shared schema and two dashboard views,
not one workflow with a different prompt copy-pasted three times — the
dedup logic, the error-trigger branch, and the dual-agent guardrail pattern
are each implemented three separate times with real per-pipeline variation
(different trigger types, different structured-output schemas, different
downstream actions).

**Below EdgeVault's $49,** for two honest reasons: the setup burden is
heavier (six-plus external services across the pack vs. two for EdgeVault),
and the failure mode is lower-stakes (a rejected newsletter draft vs. a
forgeable payment). Pricing it at $49 anyway would be pricing on effort
put into the audit and docs, not on what the buyer is actually weighing it
against.

**Not lower than $39.** Undercutting the $29 template-pack midpoint reads as
"three thin templates," which undersells the dual-agent pattern that's the
actual differentiator. $39 keeps it above the single-template ceiling while
staying credibly below EdgeVault.

## Launch plan

Same discipline as EdgeVault's:

1. Launch at $39, no crossed-out "was $59" anchor.
2. If you want a scarcity lever, use a real, countable one ("$29 for the
   first 20 buyers"), not a permanent-looking discount.
3. Don't blanket-distribute coupon codes — reserve them for one deliberate
   audience touch.

## The bundle, once both exist

This is where the two products actually reinforce each other. Once
Growth Fabric has its own sales history:

- Offer **EdgeVault + Growth Fabric bundled at $69** (vs. $88 bought
  separately) — a genuine discount, not a fake one, because both prices are
  real standalone prices first.
- Pitch the bundle to *existing* EdgeVault buyers specifically (they've
  already paid once, already trust the audit-driven approach) before
  advertising it broadly — that's the highest-intent audience for a second
  purchase.
- Keep the two products' individual listings and prices exactly as they are
  even after the bundle exists — the bundle should look like a discount
  against real prices, not the default way either product is bought.

## What to watch after launch

- **Refund rate tied to setup friction specifically** — if refunds cite "too
  much to set up" rather than "didn't work as described," that's a scoping
  problem the listing's "Who this is NOT for" section should already be
  managing; tighten that copy before considering a price cut.
- **Which of the three pipelines buyers actually activate.** If it's
  consistently one out of three, that's a signal the pack should eventually
  split into standalone $19–25 listings plus a $39–49 bundle, rather than
  staying one $39 SKU — worth revisiting after real usage data, not before.
