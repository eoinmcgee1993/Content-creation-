"""Render the one-page sales sheet to PDF, reusing the audits renderer.

Usage:
    python sales/build_sales_sheet.py [LANDING_PAGE_URL]

If a URL is passed it replaces the [LANDING_PAGE_URL] placeholder.
"""

from __future__ import annotations

import os
import sys

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from audits.report import render_pdf  # noqa: E402

SRC = os.path.join(_REPO_ROOT, "sales", "sales-sheet.md")
OUT = os.path.join(_REPO_ROOT, "sales", "sales-sheet.pdf")


def main(argv: list[str] | None = None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    with open(SRC, encoding="utf-8") as fh:
        md = fh.read()
    if argv:
        md = md.replace("[LANDING_PAGE_URL]", argv[0])
    if render_pdf(md, OUT):
        print(f"Sales sheet written to {OUT}")
        return 0
    print("reportlab not installed — run: pip install reportlab", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
