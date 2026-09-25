---
name: productize-code-asset
description: Turn working code into a sellable developer product and its launch kit. Audit a repo for code worth selling, verify every claim against the source, write the product package (README, setup guide, Gumroad listing, pricing strategy), render typeset Gumroad covers, thumbnails and Instagram carousels, queue Higgsfield marketplace cards, and assemble a master launch blueprint with explicit launch blockers. Use this whenever someone wants to find sellable assets in a codebase, package code, templates, n8n workflows or boilerplates for Gumroad or a similar store, write a listing, setup guide or price for a developer product, make cover images or Instagram slides for one, or plan its launch — even when they ask for only one of those pieces, such as a Gumroad description or a carousel.
---

# Productize a code asset

Take working code — a backend, a set of workflows, a CLI — and turn it into
something a stranger can buy, set up, and trust: an audit of what's worth
selling, a product package, a brand pack, and a launch blueprint.

The reference implementation is `productized/` in this repo (EdgeVault and
Growth Fabric). Skim it before producing a new one; matching its shape is
easier than inventing one.

## The rule everything else depends on: every claim traces to source

A listing is a list of promises. Almost everything that goes wrong in this
work is a claim that was true of the docs, the file names, or one example —
and false of the code. When this workflow was first run, the drafts said a
pack had a second approving agent in all three pipelines (two had one), that
a pipeline never double-posted (its dedup compared two different URL
formats), that a setup guide listed every required value (it missed four,
inside Code nodes and sheet pickers), and cited a migration that belonged to
a different project. Each was caught only by re-reading source. Each would
have become a refund or a one-star review.

So, before a sentence goes into a doc or onto an image:

- Read the implementation, not its README, comments or node names.
- Enumerate the units before writing "every", "all", "never" or "only" —
  each pipeline, function, table — and check each one.
- Search whole files for configuration, including code blocks, settings and
  resource pickers, then cross-check that list mechanically against the
  setup doc.
- Check wiring and behaviour flags (connections, continue-on-fail, error
  workflows, triggers) before describing what happens when something fails.
- Find where a schema actually lives. It may not be in the migrations folder.
- Never invent statistics, testimonials, ratings, customer counts or legal
  facts. Leave legal facts as marked placeholders for the user.

`references/verification.md` has concrete checks by technology (n8n,
Supabase/Postgres, Stripe, generic) and the cross-check script.

When an earlier doc overclaims — including one you wrote — fix it in the same
change and tell the user plainly. Defects in the product itself go on the
blueprint's launch-blocker list rather than being patched quietly, unless the
user asked for fixes: the user needs to know the product isn't ready, and a
drive-by rewrite of their code hides that.

## Stages

Do as many as the request calls for. Each builds on the ones before it.

### 1. Audit — what's worth selling

- Start from evidence: commit counts per area over the last ~60 days show
  where real engineering went. Then read the code of the leading candidates.
- The bar is "at least 70% functional": it runs and does the thing, rather
  than a README describing intent. Info-products, ebooks and prompt packs are
  out of scope.
- Group the findings into the product shapes asked for (for example, a
  clone-ready backend or API wrapper versus an automation template), and
  pick one to package first.
- Reject the rest explicitly, one line each with the reason: too thin,
  stale, tied to a live business, liability exposure. The rejects are what
  make the pick credible.
- Output: `productized/AUDIT.md`.

### 2. Package — four docs per product

In `productized/<product-slug>/`: `README.md`, `SETUP.md`,
`GUMROAD_LISTING.md`, `PRICING_STRATEGY.md`. Outlines, and the reasoning
behind each section, are in `references/deliverables.md`. The parts that
earn their keep:

- **Who this is NOT for**, in the listing — the cheapest refund prevention
  there is.
- **A verification step after every setup stage**, so the buyer knows it
  works rather than hoping.
- **A generic product name** when the source is domain-specific. A
  manufacturer's model name as a brand is trademark exposure.
- **Legal facts** (entity, address, governing law, final license) left as
  marked placeholders, never filled in.
- **A price reasoned against comparables** and against the product's actual
  failure mode. Don't reuse another product's price for consistency.
- **A release build.** If the product is a slice of a larger codebase, the
  sellable zip usually doesn't exist yet. Say so; it's a launch blocker.

### 3. Brand pack — Gumroad images and Instagram carousels

Typeset the images in HTML and screenshot them. Don't ask an image model for
text-bearing graphics: every word is product copy, and a model that
misspells "HMAC" or the price hands you an asset you can't ship.

In this repo, `productized/brand/build.py` does this. Palettes live in
`BRANDS`, Gumroad copy in `COPY`, carousel copy in `ig_slides()`, and marks
in `mark()`. To add a product:

1. Add its entries to those four places.
2. Add its branch in `build_gumroad()`.
3. Run `python3 productized/brand/build.py <slug>`.

Outside this repo, port the approach — see *Brand pack* in
`references/deliverables.md`.

- **Sizes:** Gumroad cover 1280×720 and thumbnail 600×600, rendered at 2×;
  Instagram carousel 1080×1350.
- **The build fails on overflow** — text past the canvas, or a clipped code
  line. If you touch the checker, prove it catches a real overflow. A
  synthetic case that doesn't actually overflow will pass and prove nothing.
- **Then look.** Open each `preview.png` contact sheet with the Read tool and
  fix collisions, cramped diagrams, and labels that imply more than the
  product does.
- **Slide copy comes from the verified docs.** Claims on an image follow the
  same rule as claims in a doc.
- **Fonts** (Space Grotesk, Inter, JetBrains Mono; all OFL) come from npm via
  Fontsource, which works even when GitHub raw is blocked by the network
  policy.

### 4. Higgsfield marketplace cards — optional; check before planning

Generative gallery images sit on top of the typeset set; they never replace
it. Before promising any:

1. **CLI login.** Run `higgsfield account status`. The repo installs the CLI
   with `npm install -g @higgsfield/cli@^1.1`. If it isn't logged in, the
   user has to run `higgsfield auth login`.
2. **Credits.** Check with the Higgsfield MCP `balance` tool, then call
   `generate_image` with `get_cost: true` on the model the cards use
   (`nano_banana_2`). Preflight is free; generation isn't.
3. **If either is missing,** write the exact commands into a script (see
   `productized/brand/higgsfield-cards.sh`) and report the gap with the cost.
   Don't spend credits the user hasn't budgeted, and don't opt into their
   unlimited or free-trial generations on their behalf.

For a digital product, skip `aplus_endorsement` (a generated testimonial is
a fake review) and the physical-goods modules (`multi_angle`, `detail_shot`,
`aplus_ingredients`, `aplus_efficacy`). `--enhance-only` previews the
backend prompts for free.

### 5. Master blueprint — `productized/MASTER_BLUEPRINT.md`

This is the doc the user launches from. Put launch blockers near the top,
not in a footnote: a polished brand pack for a product whose release build
doesn't exist is the most common way this work misleads. The section outline
is in `references/deliverables.md`.

## Shipping and reporting

- Work on a branch. The package is additive: leave the source projects alone
  unless asked. Commit the rendered PNGs, since they're the deliverable; keep
  the font and HTML caches out of git.
- Report in this order:
  1. Corrections to earlier claims.
  2. Launch blockers.
  3. What was built.
  4. What was not run or tested, and why (for example, generation blocked on
     credits).
  5. Decisions only the user can make.
