# LLM Wiki

A Markdown knowledge base about the projects in this repository. Claude writes
and maintains it from the repo's own documents, plus any outside material
added to `sources/`. Its pages are synthesised and interlinked. Every claim
links back to the source it came from, and where two documents disagree, the
wiki says so instead of picking one silently.

Start at [`wiki/index.md`](wiki/index.md). The rules it is maintained by are
in [`CLAUDE.md`](CLAUDE.md).

## Layout

- `sources/` holds outside material (PDFs, transcripts, articles). It is
  immutable once added.
- `wiki/` holds the pages: `index.md`, `log.md`, and the folders `sources/`,
  `entities/`, `concepts/` and `syntheses/`.
- `lint.py` is the health check.

## Reading it

Links are `[[wikilinks]]`. GitHub shows them as plain text. To follow them,
open `wiki/` as a vault in Obsidian or another wikilink-aware editor.

## Commands

```
python3 llm-wiki/lint.py                      # health check; exits 1 on errors
python3 llm-wiki/lint.py --digest '<files>'   # sha256 for a new source page
```

This needs Python 3.8 or later and only the standard library.

## Working with Claude

- **Ingest a source:** "Ingest `docs/crf/SYSTEM.md`", or drop a file in
  `sources/` and say so. Claude writes a source page and folds the evidence
  into the pages it affects.
- **Ask a question:** Claude answers from the wiki, with citations, and
  offers to save analysis worth keeping.
- **Run a health check:** Claude runs `lint.py`, then reads through for stale
  claims and gaps.
