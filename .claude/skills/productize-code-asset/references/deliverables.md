# Deliverables

Outlines for each output, and why each section is there. The worked
examples live in `productized/` in this repo.

- [AUDIT.md](#auditmd)
- [Package docs](#package-docs)
- [Brand pack](#brand-pack)
- [MASTER_BLUEPRINT.md](#master_blueprintmd)

## AUDIT.md

1. **Scope and method:** the window, the commit count, and the bar (≥70%
   functional, no info-products).
2. **Evidence table:** commits per area and share of activity. It shows
   where the real engineering went before anyone reads code.
3. **Verdict:** the two groupings asked for, and which one is packaged
   first.
4. **One section per chosen asset:**
   - What it is, with its source files.
   - Why it clears the bar, backed by quotes from the code rather than
     adjectives.
   - What a buyer does *not* get out of the box.
5. **Rejected candidates:** one line each, with the reason.
6. **Folder index:** keep it current as packages are added.

Date any correction made after merge ("*Corrected YYYY-MM-DD:* …") rather
than silently rewriting history.

## Package docs

**README.md** ships with the product.

- One-sentence promise, then the single architectural rule everything
  follows.
- Diagram, and what's included (a file tree).
- Properties **by mechanism**, as a table of property versus how it's
  enforced.
- What the buyer still has to do.
- *Known limitations*, if any exist. Delete that section when they're fixed,
  not before.
- License, marked "confirm before publishing".

**SETUP.md**

- Prerequisites.
- Ordered steps, each ending in a **Verify:** line the buyer can run.
- Every configuration value, labelled by kind (credential, environment or
  instance variable, or inline placeholder) with where it goes.
- Troubleshooting that points at where the error actually surfaces.

**GUMROAD_LISTING.md**

- Name, one-line pitch, price, tags.
- The problem, stated without invented statistics.
- What it is, and what's included.
- Who it's for, and **who it's NOT for**.
- A "security, honestly" style caveat where one applies.
- Requirements, FAQ, and listing images (point at the brand pack).
- Refund policy placeholder.

**PRICING_STRATEGY.md**

- A comparables table.
- Why this price and not the neighbours: argue against the product's
  failure mode, not the hours spent building it.
- Launch plan: no fake "was" prices; scarcity only when it's real and
  countable.
- A bundle plan for later.
- What to watch after launch: refunds and support questions before the
  price.

## Brand pack

This repo's `productized/brand/build.py` is the working version. To port it
elsewhere:

1. Build one HTML page per asset at the exact canvas size. Embed the fonts
   as base64 `@font-face`, because `file://` pages can't load local font
   files across origins.
2. Screenshot it with headless Chromium:
   `--window-size=W,H --force-device-scale-factor=S --screenshot=out.png --virtual-time-budget=2500`.
   In this environment Playwright's `headless_shell` lives under
   `/opt/pw-browsers`.
3. Inject a script that, after `document.fonts.ready`, marks the body when
   the content box's `scrollHeight` or `scrollWidth` exceeds its client
   size, or when any `pre` is clipped. Read that back with `--dump-dom` and
   fail the build on overflow.
4. Turn off JetBrains Mono's code ligatures (`font-feature-settings: "calt"
   0`) so an excerpt shows `=>` as written.
5. Compose a contact sheet per channel (Pillow). It's quick to QA and gives
   the blueprint an overview image.

**Per product:** a palette with named roles, a mark (a small SVG that
still reads at 46px), cover 1280×720, how-it-works, what's-included,
thumbnail 600×600, and a 7-slide carousel.

**Carousel arc:**

1. Hook
2. Problem
3. The rule or pattern
4. How it works
5. Proof by mechanism
6. What you get
7. Offer, including who it's not for

**Captions:** a hook line; two sentences of mechanism; an arrow list of
what's included; the price; "Link in bio"; about nine relevant hashtags.
Alt text for each slide is its headline.

## MASTER_BLUEPRINT.md

1. **Recap:** a table of steps, where each lives, and its state. Add a
   short list of corrections made in this pass.
2. **Launch blockers:** per product, as an ordered checklist, plus the
   sequencing (which product launches first, and why).
3. **Brand system:** shared type, layout and voice rules; a palette table
   and mark description for each product.
4. **Gumroad package:** an embedded preview, a slot → file → size table, the
   listing checklist, and one test purchase.
5. **Instagram package:** an embedded preview, a slide table (role and
   headline), a copy-paste caption, and a posting plan tied to listings
   that are actually live.
6. **Generative add-ons** (for example, Higgsfield): status, cost, the exact
   commands, what's excluded and why, and what's untested.
7. **Launch sequence.**
8. **Asset inventory:** files and dimensions.
9. **Rebuilding:** where the copy lives, the build command, and what the
   overflow check does.
10. **Decisions only the user can make:** store name, support email, refund
    policy, license, handle, and spend.
