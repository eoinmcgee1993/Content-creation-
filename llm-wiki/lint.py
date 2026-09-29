#!/usr/bin/env python3
"""Health check for the LLM Wiki. The rules it enforces are in CLAUDE.md.

    python3 llm-wiki/lint.py                    check the wiki; exit 1 on errors
    python3 llm-wiki/lint.py --digest 'FILES'   print the sha256 a source page records

Errors are defects in the wiki itself. Drift (a repository document changed
after it was ingested) and open flags are printed but don't fail the run:
they are work waiting to be done, not breakage.
"""

import glob
import hashlib
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
WIKI = os.path.join(HERE, "wiki")
REPO = os.path.dirname(HERE)
RAW = os.path.relpath(os.path.join(HERE, "sources"), REPO) + os.sep
CATEGORIES = ("sources", "entities", "concepts", "syntheses")
SPECIAL = {"index", "log"}
PROVENANCE = ("files", "commit", "sha256", "ingested")

LINK = re.compile(r"\[\[([^\]|#]*)(?:#([^\]|]*))?(?:\|[^\]]*)?\]\]")
FENCED = re.compile(r"```.*?```", re.S)
INLINE = re.compile(r"`[^`\n]*`")
HEADING = re.compile(r"^#{1,6}\s+(.+?)\s*$", re.M)
FLAG = re.compile(r"^>\s*\*\*(Contradiction|Stale|Gap)\.\*\*\s*(.*)$", re.M)
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def norm(heading):
    return " ".join(heading.replace("`", "").lower().split())


def frontmatter(text):
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---\n", 4)
    meta = {}
    for line in text[4:end].splitlines() if end != -1 else []:
        key, sep, value = line.partition(":")
        if sep:
            meta[key.strip()] = value.strip()
    return meta


def expand(spec):
    """Comma-separated repo-relative paths or globs -> sorted file list."""
    files = set()
    for part in filter(None, (p.strip() for p in spec.split(","))):
        hits = [h for h in glob.glob(os.path.join(REPO, part)) if os.path.isfile(h)]
        if not hits:
            raise FileNotFoundError(part)
        files.update(os.path.relpath(h, REPO) for h in hits)
    return sorted(files)


def digest(files):
    """sha256 of a sha256sum-style manifest, so an edit, an added file or a
    removed one all change it."""
    manifest = ""
    for path in files:
        with open(os.path.join(REPO, path), "rb") as fh:
            manifest += f"{hashlib.sha256(fh.read()).hexdigest()}  {path}\n"
    return hashlib.sha256(manifest.encode()).hexdigest()


def main(argv):
    if argv[:1] == ["--digest"]:
        print(digest(expand(",".join(argv[1:]))))
        return 0

    pages = {}
    for path in sorted(glob.glob(os.path.join(WIKI, "**", "*.md"), recursive=True)):
        with open(path, encoding="utf-8") as fh:
            pages[os.path.relpath(path, WIKI)[:-3].replace(os.sep, "/")] = fh.read()

    errors, drift = [], []
    errors += [f"{name}.md is missing" for name in sorted(SPECIAL - pages.keys())]
    for pid in pages.keys() - SPECIAL:
        folder, _, name = pid.rpartition("/")
        if folder not in CATEGORIES:
            errors.append(f"{pid}: pages live in {', '.join(CATEGORIES)}/")
        if not SLUG.match(name):
            errors.append(f"{pid}: file names are lowercase kebab-case")

    headings = {p: {norm(h) for h in HEADING.findall(FENCED.sub("", t))} for p, t in pages.items()}
    inbound = {p: set() for p in pages}
    outbound = {p: set() for p in pages}
    links = 0
    for pid, text in pages.items():
        for target, anchor in LINK.findall(INLINE.sub("", FENCED.sub("", text))):
            links += 1
            target = target.strip().rstrip("\\")
            if target not in pages:
                errors.append(f"{pid}: broken link [[{target}]]")
            elif anchor and norm(anchor) not in headings[target]:
                errors.append(f"{pid}: [[{target}#{anchor}]] — no such heading")
            elif target != pid:
                outbound[pid].add(target)
                inbound[target].add(pid)

    for pid in sorted(pages.keys() - SPECIAL):
        if pid not in outbound.get("index", ()):
            errors.append(f"{pid}: not listed in index.md")
        if not inbound[pid] - SPECIAL:
            errors.append(f"{pid}: orphan — no other page links to it")
        if not outbound[pid] - SPECIAL:
            errors.append(f"{pid}: dead end — links to no other page")
        if not pid.startswith("sources/") and not any(t.startswith("sources/") for t in outbound[pid]):
            errors.append(f"{pid}: cites no source")

    for pid in sorted(p for p in pages if p.startswith("sources/")):
        meta = frontmatter(pages[pid])
        missing = [key for key in PROVENANCE if not meta.get(key)]
        if missing:
            errors.append(f"{pid}: frontmatter lacks {', '.join(missing)}")
            continue
        try:
            files = expand(meta["files"])
        except FileNotFoundError as gone:
            drift.append(f"{pid}: {gone} no longer exists (ingested at {meta['commit']})")
            continue
        if digest(files) == meta["sha256"]:
            continue
        if all(f.startswith(RAW) for f in files):
            errors.append(f"{pid}: a raw source under {RAW} was modified; sources are immutable")
        else:
            spec = " ".join(p.strip() for p in meta["files"].split(","))
            drift.append(f"{pid}: changed since {meta['commit']} — re-ingest; see git diff {meta['commit']} -- {spec}")

    flags = sorted((pid, kind, rest) for pid, text in pages.items() for kind, rest in FLAG.findall(text))

    print(f"LLM Wiki health check: {len(pages)} pages, {links} links\n")
    print(f"Errors ({len(errors)})")
    print("".join(f"  {e}\n" for e in errors))
    print(f"Drift ({len(drift)}): re-read these sources and update the pages that cite them")
    print("".join(f"  {d}\n" for d in drift))
    print(f"Open flags ({len(flags)})")
    print("".join(f"  {pid}: {kind}. {rest[:110]}\n" for pid, kind, rest in flags))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
