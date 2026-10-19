---
files: productized/MASTER_BLUEPRINT.md
commit: ec4767c
sha256: f1a98b4ec232fdb6eccff86b9a5872575cdb848ce91f79252c842e1c50ba6177
ingested: 2026-09-29
---

# Master blueprint: EdgeVault and Growth Fabric

The launch document for the two products the audit chose. It covers what
blocks each one's first sale, the brand system, the Gumroad and Instagram
packages, and the launch order.

## Provenance

- File: `productized/MASTER_BLUEPRINT.md`, read at `ec4767c`. It is marked
  "*Status as of 2026-09-25.*" (L8)
- It builds on [[sources/productized-audit]] and on the two package folders
  under `productized/`, which are not yet ingested.

## Summary

Neither product can be listed yet, and EdgeVault is closer. EdgeVault's
release build doesn't exist. Growth Fabric's workflows have six defects, and
one of them, SQL built from third-party data, is serious. The plan is to launch
EdgeVault first, hold Growth Fabric until its fixes land and EdgeVault has
sold, then sell a $69 bundle. The document's voice rules require every claim to
trace to a line of source, and the trust line in its own §9 fails that rule.

## Recap and corrections

- The recap table (L14–21) lists the audit and the EdgeVault package as merged
  (PR #101), the Growth Fabric package as merged (PR #105), the brand system and
  this blueprint as "This PR", and the Higgsfield cards as queued.
- Prices: EdgeVault **$49** and Growth Fabric **$39**. (L17–18)
- Corrections were made because "some of my earlier copy didn't survive" a
  line-by-line re-check (L23–25):
  - Only Growth Fabric pipelines 01 and 03 have an approving agent. (L27–28)
  - Pipeline 02 can double-post, and can mark a row `LIVE` without a confirmed
    publish. (L29–30)
  - The setup guide missed four required values. (L31–34)
  - "The Growth Fabric listing's "eight of ten templates" line was an invented
    statistic. It's gone." (L35–36)
  - EdgeVault's file list named another project's migration. (L37–39)

## Launch blockers

- "Neither product can be listed today. EdgeVault is closer." (L45)
- For EdgeVault, "the release build doesn't exist yet" (L47–69):
  1. Copy the six functions into a new repo. (L51–53)
  2. Rename `crf_` to `{{PREFIX}}_`, including `kit-download`'s filename
     `crf250l-kit-<id>.svg`. (L54–57)
  3. Assemble one migration, `0001_schema.sql`, from `docs/crf/BLUEPRINT.md` §3
     plus migration 003. (L58–61)
  4. Write the two reference pages. The README lists them, but they "don't
     exist yet", and they must carry "no CRF or Honda copy (trademark
     exposure…)". (L62–65)
  5. Run `SETUP.md` end to end on a fresh Supabase project in test mode, then do
     "one live purchase and a refund". (L66–68)
  6. Fill in the listing placeholders. (L69)
- Growth Fabric's "workflows have defects" (L71–92):
  - Pipeline 02's duplicate check can't match. (L76–78)
  - "SQL is built from interpolated strings" using third-party Apollo data,
    "the most serious item on this list". (L79–83)
  - A row goes `LIVE` after a failed publish. (L84–85)
  - The error branches are inert. (L86–87)
  - `tokens_consumed` is always 0. (L88–89)
  - None of the three has been run end to end. (L90–92)
- "**Sequencing:** launch EdgeVault first. Hold Growth Fabric until its fixes
  land and EdgeVault has sold; that also sets up the $69 bundle". (L94–96)

## Brand system

- "Two products, one studio." They share type (Space Grotesk, Inter,
  JetBrains Mono) and a dark grid background. The fonts are OFL and fetched at
  build time, so "nothing is committed". (L102–114)
- The voice rules apply to both products "and to anything generated later"
  (L116–123):
  - "Claim by mechanism, not by adjective. Write "HMAC-SHA256, constant-time
    compare", not "bank-grade security"."
  - "No invented statistics, testimonials, ratings or user counts."
  - "Say who it's *not* for".
  - "Every claim traces to a line of source. If it can't, cut it."
- EdgeVault uses an ink background, a "Signal mint" accent (`#3CF2B1`), a
  vault-door mark, and a "calm, precise and security-literate" voice.
  (L125–140)
- Growth Fabric uses an aubergine background and coral and violet threads for
  the generating and approving agents. Its mark is two woven threads, and its
  voice is "practical and operator-level, and honest about the setup work".
  (L142–156)

## Gumroad package

- Gumroad recommends a cover of at least 1280×720 and a thumbnail of at least
  600×600. The assets are rendered at twice that. (L162–164)
- Each product gets four images, a thumbnail and three covers. (L166–192)
- The listing checklist covers both products (L194–204):
  - copy pasted from the listing doc
  - covers first, then the thumbnail
  - "Product file: the **release zip**, not a link to this repo"
  - a price "with no fake "was" price"
  - a licence and a plainly worded refund policy
  - a support email that actually reaches you
  - "One test purchase through Gumroad's own checkout before you announce
    anything"

## Instagram package

- Each product gets a seven-slide carousel at 1080×1350. (L210–211)
- EdgeVault's slide 03 reads "The browser can create. Nothing else." and slide
  04 reads "Only Stripe can mark an order paid." (L221–222)
- Growth Fabric's hook is "Your AI agent shouldn't grade its own homework."
  (L250) Its slide 03 is "Agent A writes. Agent B signs off." (L253)
- EdgeVault's caption: "Only a signature-verified Stripe webhook can mark it
  paid. A wrong token gets the same 404 as a wrong order id." (L232)
- Posting plan: "Don't announce a product people can't buy yet." (L278–279)

## Higgsfield cards

- The cards were not generated. The account held 0.25 credits and the CLI
  wasn't logged in, and the planned 14 cards need about 21 credits (L293–296).
  `aplus_endorsement` was skipped because "no testimonials exist, so a
  generated one would be a fake review" (L305).
- "The generation path hasn't been exercised". (L315)

## Launch sequence

1. Build EdgeVault's release.
2. List it and make one test purchase.
3. Announce it.
4. Optionally, generate the Higgsfield images.
5. Fix Growth Fabric and run each pipeline for real.
6. Bundle, "once both have independent sales history".

(L324–334)

## Decisions only the owner can make

(L380–393)

- the Gumroad store name
- the support email, refund policy and licence text
- the Instagram handle
- whether to spend about 21 Higgsfield credits
- "**Whether EdgeVault's "extracted from a system that has taken real,
  live-mode Stripe payments" line stays.** It's true (see `docs/crf/SYSTEM.md`)
  and it's the strongest trust line in the set. It also points at the source
  system, if anyone asks which one." (L389–392)

## Connections

Feeds [[entities/edgevault]], [[entities/growth-fabric]],
[[entities/gumroad]], [[concepts/claim-by-mechanism]],
[[concepts/productization-bar]], [[concepts/browser-can-only-create]] and
[[syntheses/portfolio-map]]. [[sources/crf-deployment-plan]] contradicts its
§9 trust line, and the line that line cites in [[sources/crf-system]] does not
support it. The flag is on [[entities/edgevault#The trust line]].
