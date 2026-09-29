# LLM Wiki: schema

The rules this wiki is maintained by. The wiki is a layer of synthesised,
interlinked Markdown pages that sits on an evidence layer it never edits,
and every claim in it traces back to that evidence. These rules apply inside
`llm-wiki/` only. Everywhere else the repository's own rules (root
`CLAUDE.md`) still govern, and ingesting a project's documents never
licenses changing that project.

## Layout

```
llm-wiki/
  CLAUDE.md        this file
  README.md        what the wiki is and how to read it
  lint.py          health check, standard library only
  sources/         raw material from outside the repo; immutable
  wiki/
    index.md       every page, by category, with a one-line description
    log.md         append-only record of ingests, queries and checks
    sources/       one page per source: provenance, summary, quotes
    entities/      projects, products, platforms, services, people
    concepts/      ideas, patterns, rules, decision frameworks
    syntheses/     analysis across sources: maps, matrices, comparisons
```

### Two kinds of source

- **Repository documents**: any file already in this repo, whether docs,
  READMEs, config or code. Cite them **in place**; never copy them into
  `sources/`. The repo is already versioned, and a copy would silently fall
  behind the living file. A source page pins the document by commit and by
  `sha256`, and `lint.py` reports **drift** when the file changes after
  ingest.
- **External material**: PDFs, transcripts, articles, datasets, notes. It
  goes in `llm-wiki/sources/` as `YYYY-MM-DD-short-slug.ext` and is never
  edited or renamed afterwards; a revised version is a new file. `lint.py`
  fails if one changes.

## Pages

File names are lowercase kebab-case: `netlify.md`, `uniform-404.md`. Each page
covers one thing or one idea. It opens with an H1 and a one-sentence summary,
and `index.md` uses that same sentence.

- **Entity and concept pages** say what the thing is, then what the sources
  say about it, grouped by topic.
- **Synthesis pages** state their question at the top, answer it across
  sources (tables are welcome) and flag where the sources disagree.
- **Source pages** start with frontmatter, then `## Provenance` and
  `## Summary`. After that comes one section per part of the source that
  matters, named after the source's own headings where it has them, with
  quotes and line numbers. They end with `## Connections`, which lists the
  pages the source feeds.

Source-page frontmatter is plain `key: value` lines, read by `lint.py`:

```
---
files: productized/AUDIT.md
commit: c359056
sha256: 3f9a…
ingested: 2026-09-29
---
```

- `files`: repo-relative paths. Separate several with commas; globs work
  (`.github/workflows/*.yml`).
- `commit`: the commit whose content the ingest read.
- `sha256`: the output of `python3 llm-wiki/lint.py --digest '<files value>'`.
- `ingested`: the date of the ingest.

## Links and citations

- Links are wikilinks relative to `wiki/`, without `.md`: `[[entities/netlify]]`,
  or `[[concepts/uniform-404#Why it matters]]` to point at a heading. Use
  `[[path|label]]` for display text, and escape the pipe as `\|` inside
  tables.
- **Every factual claim cites its evidence.** Link the source-page section
  that holds it, such as `[[sources/productized-audit#Verdict]]`. That section
  quotes the source with line numbers, so a reader can follow a claim from
  the wiki page to the source page to the file at the pinned commit.
- Attribute judgements to the source that made them ("the audit rates
  …"). When you have checked the code, keep what a document *says*
  separate from what the code *does*.
- Anything beyond what the sources say must be labelled **Inference**.
- Name repository files in code spans (`docs/crf/SYSTEM.md`). They are
  outside the wiki, so they are never wikilinked.

## Flags

Mark contradictions, stale claims and gaps where they occur, using a callout
that renders both on GitHub and in Obsidian:

```
> [!WARNING]
> **Contradiction.** `DEPLOYMENT_GUIDE.md` says … while
> `.github/workflows/netlify-deploy.yml` says … [[sources/deploy-config#…]]
```

- **Contradiction.** Two sources disagree, and neither is clearly the newer
  one.
- **Stale.** A newer source or the code supersedes a claim. Say which
  source is right.
- **Gap.** A question the sources can't answer. Name the source that would
  answer it, and use `[!NOTE]` instead of `[!WARNING]`.

To resolve a flag, fix the claim, delete the callout and log it. Never
drop a flag silently.

## Workflows

### Ingest

1. External material: copy it into `llm-wiki/sources/`. Repository document:
   leave it where it is.
2. Read it in full. Write `wiki/sources/<slug>.md` with its frontmatter.
3. Find the pages it affects: start from `index.md`, then run
   `grep -ril '<term>' llm-wiki/wiki`. Fold the new evidence into those pages,
   and flag anything it contradicts or makes stale.
4. Create a new entity or concept page only when the source gives the
   subject enough to stand alone. Otherwise add a line or a table row to an
   existing page.
5. Register new pages in `index.md` and refresh the one-liners of pages you
   changed.
6. Append a log entry.
7. Run `python3 llm-wiki/lint.py` until it reports no errors.

### Query

1. Read `index.md`, then the pages it points to. Open source pages and the
   raw files only to confirm or quote.
2. Answer from the wiki, citing sources the same way the pages do.
3. If the answer is reusable (an analysis, a comparison, a decision
   framework), offer to save it in `syntheses/`. Saving it counts as an
   ingest: index, log, lint.
4. Log queries that changed the wiki.

### Health check

Run `python3 llm-wiki/lint.py`. It fails on:

- broken links and missing headings
- pages that are not in `index.md`
- orphans, which no other page links to
- dead ends, which link to nothing
- entity, concept or synthesis pages that cite no source
- source pages without provenance, or whose raw file under `sources/` changed

It reports, without failing, **drift** and the open **flags**. For each
drifted source, read the printed `git diff`, update the pages that cite it
and record the new `commit` and `sha256`. Then read for what the script can't
see: claims a later ingest contradicts, and gaps worth a new source. Log the
check.

## Log

Entries are appended at the bottom and never rewritten. Each starts with
`## [YYYY-MM-DD] <kind> | <subject>`, where the kind is `setup`, `ingest`,
`query`, `health` or `refactor`, so `grep '^## \[' llm-wiki/wiki/log.md`
lists them. Under the heading, give a short list: pages created, pages
updated, decisions made, flags raised or resolved.

## When to stop and ask

Ask the user before you settle a contradiction that needs knowledge the
sources don't hold, restructure the categories, delete a page, or adopt a
source whose origin you can't establish. Don't fix the repository from
here. A stale document gets a flag in the wiki and a mention to the user,
not an edit.
