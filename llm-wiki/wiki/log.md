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
