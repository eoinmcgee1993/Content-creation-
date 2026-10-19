# Log

Append-only. The newest entry is at the bottom, and old entries are never
rewritten. `grep '^## \[' llm-wiki/wiki/log.md` lists every entry.

## [2026-09-29] setup | Wiki scaffold

- Created `llm-wiki/` with the three layers: `CLAUDE.md` (the schema),
  `sources/` (raw, immutable), and `wiki/` (`index.md`, this log, and the
  `sources/`, `entities/`, `concepts/` and `syntheses/` folders). Added
  `lint.py`, the health check.
- Decision: the wiki is its own project directory rather than living at the
  repo root, because this repo is many independent projects (root
  `CLAUDE.md` §5). A pointer in that section makes it findable.
- Decision: repository documents are cited in place, pinned by commit and
  `sha256`, and never copied into `sources/`. A copy would fall behind the
  living file, and the pin lets `lint.py` report drift instead.
  `sources/` is for material from outside the repo.
- Decision: links are `[[wikilinks]]` relative to `wiki/`, following the
  brief's own examples. GitHub shows them as plain text; Obsidian follows
  them.
- Decision: the first ingest uses the repo's own cross-project documents,
  because no outside sources were supplied.

## [2026-09-29] ingest | Batch 1: cross-project documents and CRF

- Sources: [[sources/root-claude-md]], [[sources/deployment-guide]],
  [[sources/deploy-config]], [[sources/productized-audit]],
  [[sources/master-blueprint]], [[sources/crf-deployment-plan]],
  [[sources/crf-system]] and [[sources/2026-09-29-crf-live-check]]. The
  repository documents are pinned at `ec4767c`.
- Created 12 entity pages, 6 concept pages and 2 syntheses
  ([[syntheses/portfolio-map]], [[syntheses/deploy-matrix]]). All are
  registered in [[index]].
- Decision: the batch grew from five sources to eight. `docs/crf/DEPLOYMENT.md`
  contradicted four of the first five on hosting and payments, so leaving it
  out would have had the wiki repeat stale claims with confidence.
  `docs/crf/SYSTEM.md` came in because both sides of the payments question
  cite it.
- Decision: hosting was settled with evidence, not a guess. The live check is
  the first external raw source: a dated `curl` capture of both hosts, run
  with the route list root `CLAUDE.md` §9 prescribes. It records whether each
  legal fact is set, never the values, because they are a person's name,
  address and email.
- Decision: each flag sits once, on the page about its subject, and other
  pages link to it. Added to the schema.
- Decision: heading anchors avoid colons and paths, so they resolve in
  Obsidian. `lint.py` now accepts same-page `[[#Heading]]` links.
- Flags raised (11):
  - contradictions: the EdgeVault trust line, the racewear order path, and
    `verify_jwt` in `supabase/config.toml`
  - stale: CRF hosting, the CRF legal pages, `DEPLOYMENT_GUIDE.md`'s secret
    wiring, and `deploy.yml`'s `--no-build` comment
  - gaps: the trading name, `NETLIFY_AUTH_TOKEN`, landing leads in `/tmp` on
    Vercel, and the dashboard deploy's missing `--no-build`
- Verified: `lint.py` reports no errors. A scratch suite seeded 15 kinds of
  defect, and `lint.py` caught every one.
