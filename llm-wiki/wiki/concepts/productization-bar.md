# Productization bar

A test for whether code in this repo is ready to sell as a developer asset.
It must be at least 70% functional, judged by what the code does and by its
history, not by its README.

## The bar

- "≥70% functional, meaning it runs, does the thing, and isn't a stub with a
  README describing intent." Info-products, ebooks and prompt packs are out of
  scope [[sources/productized-audit#Scope and bar]].
- Everything "is graded against what it actually does, not what its README
  claims." [[sources/productized-audit#Scope and bar]]

## The evidence it weighs

- **Commit history as a signal.** One project took nearly a quarter of two
  months' commits, "almost all of it hardening passes, not new features.
  That's the tell." [[sources/productized-audit#Scope and bar]] Ten of the
  CRF backend's 32 commits were security-narrowing passes
  [[sources/productized-audit#Asset 1, the fulfillment backend]].
- **Iteration after real use.** "One commit, zero iteration" is a weaker
  evidence base, even for code that is structurally sound
  [[sources/productized-audit#Asset 2, the n8n pipeline pack]].
- **The source, not the doc.** The auditor read the functions themselves
  [[sources/productized-audit#Asset 1, the fulfillment backend]].

## What disqualified the rest

[[sources/productized-audit#Rejected candidates]]

- too small to carry a flagship price (`kdp-compiler/`)
- untouched recently, in a saturated category (`audits/`)
- a name that promises more than the code does (`plugins/`)
- infrastructure for a live business: "Don't productize an active
  go-to-market tool" (the Clearmark scripts, `sales/`)
- legal exposure (the trading code)
- thin commodity apps, abandoned scaffolds and educational scratch

## Its limit

The bar grades code, not claims. The audit's own headline evidence for its
top pick is disputed; see [[entities/edgevault#The trust line]]. Pair it with
[[concepts/claim-by-mechanism]].

The results are in [[syntheses/portfolio-map]]. The two picks are
[[entities/edgevault]] and [[entities/growth-fabric]].
