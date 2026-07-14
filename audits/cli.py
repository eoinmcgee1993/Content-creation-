"""Command-line entry point for the audit toolkit."""

from __future__ import annotations

import argparse
import os
import sys

from .ads_audit import run_ads_audit
from .metrics import read_csv
from .report import render_markdown, render_pdf
from .seo_audit import run_seo_audit


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="audits",
        description="Generate a B2B ad-leakage and SEO health audit from CSV exports.",
    )
    p.add_argument("--ads", help="Path to a paid-ads performance CSV export")
    p.add_argument("--seo", help="Path to a Google Search Console queries CSV export")
    p.add_argument(
        "--seo-compare",
        help="Optional prior-period GSC export for ranking-drop detection",
    )
    p.add_argument("--brand", help="Brand term, to split branded vs non-branded SEO")
    p.add_argument("--client", default="Prospect", help="Client name shown on the report")
    p.add_argument("--out", default="audit_report", help="Output path prefix (no extension)")
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if not args.ads and not args.seo:
        print("Provide at least one of --ads or --seo.", file=sys.stderr)
        return 2

    results = []
    if args.ads:
        fields, rows = read_csv(args.ads)
        results.append(run_ads_audit(fields, rows))
    if args.seo:
        fields, rows = read_csv(args.seo)
        cmp_rows = cmp_fields = None
        if args.seo_compare:
            cmp_fields, cmp_rows = read_csv(args.seo_compare)
        results.append(
            run_seo_audit(
                fields,
                rows,
                brand=args.brand,
                compare=cmp_rows,
                compare_fields=cmp_fields,
            )
        )

    md = render_markdown(results, client=args.client)
    md_path = f"{args.out}.md"
    os.makedirs(os.path.dirname(md_path) or ".", exist_ok=True)
    with open(md_path, "w", encoding="utf-8") as fh:
        fh.write(md)

    pdf_ok = render_pdf(md, f"{args.out}.pdf")
    print(f"Markdown report written to {md_path}")
    if pdf_ok:
        print(f"PDF report written to {args.out}.pdf")
    else:
        print("PDF skipped (install 'reportlab' to enable PDF output).")
    for r in results:
        print(f"  {r.kind}: score {r.score}/100, "
              f"{len(r.findings)} finding(s), "
              f"${r.total_leakage:,.0f}/mo modeled leakage")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
