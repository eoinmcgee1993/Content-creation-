#!/usr/bin/env python3
"""Clearmark batch pipeline — scores campaign rows and marks each CLEAR or HOLD."""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

# Thresholds for a row to earn CLEAR status
MIN_ROAS = 2.0          # revenue / spend must be at least 2×
MIN_CONV_RATE_PCT = 1.0 # conversion rate must be at least 1 %


def _float(value: object) -> float | None:
    try:
        f = float(value)  # type: ignore[arg-type]
        return f if f > 0 else None
    except (TypeError, ValueError):
        return None


def compute_metrics(row: dict) -> dict:
    spend = _float(row.get("monthly_spend"))
    clicks = _float(row.get("clicks"))
    conversions = _float(row.get("conversions"))
    revenue = _float(row.get("revenue"))
    target_cpa = _float(row.get("target_cpa"))

    cpa = round(spend / conversions, 2) if spend and conversions else None
    roas = round(revenue / spend, 2) if revenue and spend else None
    conv_rate_pct = round(conversions / clicks * 100, 2) if conversions and clicks else None

    return {
        "cpa": cpa,
        "roas": roas,
        "conv_rate_pct": conv_rate_pct,
        "target_cpa": target_cpa,
    }


def clearmark(metrics: dict) -> tuple[str, str]:
    """Return (status, reason). Status is CLEAR when all checks pass, else HOLD."""
    issues: list[str] = []

    roas = metrics["roas"]
    if roas is None:
        issues.append("missing revenue/spend data")
    elif roas < MIN_ROAS:
        issues.append(f"ROAS {roas:.2f}× below minimum {MIN_ROAS:.2f}×")

    conv_rate_pct = metrics["conv_rate_pct"]
    if conv_rate_pct is None:
        issues.append("missing conversion/click data")
    elif conv_rate_pct < MIN_CONV_RATE_PCT:
        issues.append(f"conv rate {conv_rate_pct:.2f}% below minimum {MIN_CONV_RATE_PCT:.0f}%")

    target_cpa = metrics["target_cpa"]
    cpa = metrics["cpa"]
    if target_cpa and cpa is not None and cpa > target_cpa:
        issues.append(f"CPA ${cpa:.2f} exceeds target ${target_cpa:.2f}")

    if issues:
        return "HOLD", "; ".join(issues)
    return "CLEAR", "all checks passed"


def run(in_path: Path, out_path: Path, limit: int | None) -> None:
    with in_path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    if limit is not None:
        rows = rows[:limit]

    if not rows:
        print("No rows to process.", file=sys.stderr)
        sys.exit(1)

    out_rows: list[dict] = []
    for row in rows:
        m = compute_metrics(row)
        status, reason = clearmark(m)
        out_row = {
            **row,
            "cpa": m["cpa"] if m["cpa"] is not None else "",
            "roas": m["roas"] if m["roas"] is not None else "",
            "conv_rate_pct": m["conv_rate_pct"] if m["conv_rate_pct"] is not None else "",
            "clearmark_status": status,
            "clearmark_reason": reason,
        }
        out_rows.append(out_row)
        marker = "✓" if status == "CLEAR" else "✗"
        print(f"  {marker} [{status}] {row.get('client', '?')} / {row.get('campaign', '?')} — {reason}")

    fieldnames = list(out_rows[0].keys())
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(out_rows)

    clear_n = sum(1 for r in out_rows if r["clearmark_status"] == "CLEAR")
    hold_n = len(out_rows) - clear_n
    print(f"\nProcessed {len(out_rows)} rows — {clear_n} CLEAR, {hold_n} HOLD")
    print(f"Output → {out_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Clearmark batch pipeline")
    parser.add_argument("--in", dest="input", required=True, metavar="FILE",
                        help="Input batch CSV")
    parser.add_argument("--out", required=True, metavar="FILE",
                        help="Output CSV path")
    parser.add_argument("--limit", type=int, default=None, metavar="N",
                        help="Process only the first N rows")
    args = parser.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        print(f"Error: '{in_path}' not found.", file=sys.stderr)
        sys.exit(1)

    run(in_path, Path(args.out), args.limit)


if __name__ == "__main__":
    main()
