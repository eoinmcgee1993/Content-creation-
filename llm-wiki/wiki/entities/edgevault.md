# EdgeVault

A $49 Stripe + Supabase fulfilment kit, packaged from the CRF storefront's
backend: six Edge Functions, a schema and two reference pages. It is not yet
listed.

## What it is

- "A pattern, not a niche product: sell a digital file … through Stripe, with
  Supabase Postgres + Edge Functions doing 100% of the trusted work and a
  static HTML page doing 0% of it."
  [[sources/productized-audit#Asset 1, the fulfillment backend]]
- It is built from the six Edge Functions and the schema of the
  [[entities/crf-storefront]]
  [[sources/productized-audit#Asset 1, the fulfillment backend]]. Its security
  properties are CRF's: [[concepts/browser-can-only-create]],
  [[concepts/server-owned-state]] and [[concepts/uniform-404]].
- It costs $49, one time [[sources/master-blueprint#Recap and corrections]].
  The audit's verdict: "ships as-is, with the prefix rename as the one
  required step" [[sources/productized-audit#Asset 1, the fulfillment backend]].
- What a buyer doesn't get:
  - Every name still carries the `crf_` prefix.
  - The approval flow has no card payment.
  - Email stays inert until the buyer adds a Resend key.
  - Nobody outside has reviewed the code, so the copy should say "built with
    defense-in-depth," not "penetration tested".

  [[sources/productized-audit#Asset 1, the fulfillment backend]]

## Launch blockers

The master blueprint says "the release build doesn't exist yet"
[[sources/master-blueprint#Launch blockers]]:

1. Copy the functions into a new repository.
2. Rename `crf_` to `{{PREFIX}}_`.
3. Assemble one migration from `docs/crf/BLUEPRINT.md` §3 plus migration 003.
4. Write the two reference pages, with no CRF or Honda copy.
5. Run `SETUP.md` end to end, then make one live purchase and refund it.
6. Fill the listing placeholders.

After that comes the [[entities/gumroad]] listing.

The kit's single migration includes migration 003
[[sources/master-blueprint#Launch blockers]], and the CRF plan says 003 was
never shipped on CRF itself, as of 1 Sep
[[sources/crf-deployment-plan#Hosting]]. So that part of the kit has not run
in production as far as the sources show. The contradiction over the racewear
path is on [[entities/crf-storefront#Racewear order path]].

## The trust line

> [!WARNING]
> **Contradiction.** The audit says the CRF site "has taken real, live-mode
> Stripe payments" and calls the backend "live in production on real,
> live-mode Stripe payments"
> [[sources/productized-audit#Asset 1, the fulfillment backend]]
> [[sources/productized-audit#Verdict]]. The blueprint keeps "extracted from a
> system that has taken real, live-mode Stripe payments" as "the strongest
> trust line in the set", citing `docs/crf/SYSTEM.md`
> [[sources/master-blueprint#Decisions only the owner can make]]. But
> `SYSTEM.md` only says the link is live-mode, "on real sale"
> [[sources/crf-system#Graphics kit]]. And the CRF plan, checked against the
> live Stripe account on 2 Sep, says "Nobody has ever completed a purchase"
> [[sources/crf-deployment-plan#Launch]]. The audit is later (its window runs
> to 10 Sep), so a sale after 2 Sep isn't ruled out, but no source records
> one. Until Stripe shows a completed live payment, the line fails the
> blueprint's own rule that "Every claim traces to a line of source"
> [[sources/master-blueprint#Brand system]]. What the sources do support is
> "extracted from a system running on a live-mode Stripe account".

## Launch order and brand

- Launch EdgeVault first. [[entities/growth-fabric]] waits for its fixes and
  for an EdgeVault sale, and then the two are bundled at $69
  [[sources/master-blueprint#Launch blockers]].
- The mark is a vault door, with a signal-mint accent and a "calm, precise and
  security-literate" voice [[sources/master-blueprint#Brand system]].
- The carousel states the core rule on slide 03: "The browser can create.
  Nothing else." [[sources/master-blueprint#Instagram package]]
