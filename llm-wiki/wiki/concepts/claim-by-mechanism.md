# Claim by mechanism

The copy rule for these products: describe how a thing works instead of
praising it, invent nothing, say who it isn't for, and cut any claim that
doesn't trace to a line of source.

## The rules

These apply to both products "and to anything generated later"
[[sources/master-blueprint#Brand system]]:

- "Claim by mechanism, not by adjective. Write "HMAC-SHA256, constant-time
  compare", not "bank-grade security"."
- "No invented statistics, testimonials, ratings or user counts."
- "Say who it's *not* for".
- "Every claim traces to a line of source. If it can't, cut it."

## Why it was needed

Re-checking the copy against the source took out several claims
[[sources/master-blueprint#Recap and corrections]]
[[sources/productized-audit#Corrections]]:

- that all three Growth Fabric pipelines have an approving agent
- that pipeline 02 never double-posts
- an invented "eight of ten templates" statistic
- the wrong migration file in EdgeVault's file list

The same discipline shows elsewhere:

- The audit advises saying "built with defense-in-depth," not "penetration
  tested", because nobody outside has reviewed the hardening
  [[sources/productized-audit#Asset 1, the fulfillment backend]].
- The Higgsfield endorsement card was skipped because a generated one "would
  be a fake review" [[sources/master-blueprint#Higgsfield cards]].
- The Gumroad checklist rules out a fake "was" price
  [[sources/master-blueprint#Gumroad package]].

## A line that doesn't pass yet

EdgeVault's "has taken real, live-mode Stripe payments" doesn't pass. See
[[entities/edgevault#The trust line]].

## The same idea elsewhere

CRF's modifications guide tags every claim as `measured`, `vendor`,
`principle` or `unverified`, because "A guide that cannot tell you which of
its numbers were measured is indistinguishable from a forum post."
[[sources/crf-system#ECU template and modifications guide]] See
[[entities/crf-storefront]], [[entities/growth-fabric]] and
[[concepts/productization-bar]].
