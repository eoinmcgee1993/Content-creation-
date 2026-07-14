"""Paid-ads leakage audit from a campaign performance CSV export."""

from __future__ import annotations

from statistics import median

from .metrics import map_headers, safe_div, to_number
from .model import AuditResult, Finding

ALIASES = {
    "campaign": ["campaign", "campaign name", "ad set name", "adgroup"],
    "impressions": ["impressions", "impr", "impr."],
    "clicks": ["clicks", "link clicks"],
    "cost": ["cost", "spend", "amount spent", "amount spent (usd)"],
    "conversions": ["conversions", "conv", "conv.", "results", "purchases"],
    "revenue": [
        "conversion value",
        "conv. value",
        "revenue",
        "purchase conversion value",
        "total conversion value",
    ],
}

LOW_CTR = 0.01  # 1%


def run_ads_audit(fieldnames: list[str], rows: list[dict[str, str]]) -> AuditResult:
    cols = map_headers(fieldnames, ALIASES)
    if "cost" not in cols:
        raise ValueError(
            "Could not find a cost/spend column. Found headers: " + ", ".join(fieldnames)
        )

    campaigns = []
    for r in rows:
        cost = to_number(r.get(cols.get("cost", ""), 0))
        if cost <= 0 and not r.get(cols.get("campaign", ""), "").strip():
            continue
        campaigns.append(
            {
                "name": r.get(cols.get("campaign", ""), "(unnamed)").strip() or "(unnamed)",
                "impr": to_number(r.get(cols.get("impressions", ""), 0)),
                "clicks": to_number(r.get(cols.get("clicks", ""), 0)),
                "cost": cost,
                "conv": to_number(r.get(cols.get("conversions", ""), 0)),
                "rev": to_number(r.get(cols.get("revenue", ""), 0)),
            }
        )

    total_cost = sum(c["cost"] for c in campaigns)
    total_conv = sum(c["conv"] for c in campaigns)
    total_rev = sum(c["rev"] for c in campaigns)
    total_clicks = sum(c["clicks"] for c in campaigns)
    total_impr = sum(c["impr"] for c in campaigns)

    findings: list[Finding] = []

    if total_conv == 0 and "conversions" not in cols:
        findings.append(
            Finding(
                "critical",
                "No conversion tracking detected",
                "No conversions/results column was present in the export, so "
                "return on ad spend cannot be measured.",
                "Implement conversion tracking (pixel / offline conversions) "
                "before scaling spend. Without it, optimization is guesswork.",
            )
        )

    zero_conv_waste = sum(c["cost"] for c in campaigns if c["conv"] == 0 and c["cost"] > 0)
    dead = [c["name"] for c in campaigns if c["conv"] == 0 and c["cost"] > 0]
    if zero_conv_waste > 0 and "conversions" in cols:
        findings.append(
            Finding(
                "critical",
                f"{len(dead)} campaign(s) spending with zero conversions",
                f"${zero_conv_waste:,.0f} spent on campaigns returning no "
                f"conversions: {', '.join(dead[:8])}"
                + (" …" if len(dead) > 8 else ""),
                "Pause or restructure zero-conversion campaigns and reallocate "
                "budget to converting campaigns.",
                estimated_monthly_leakage=zero_conv_waste,
            )
        )

    if total_rev > 0 and total_cost > 0:
        roas = safe_div(total_rev, total_cost)
        if roas < 1:
            loss = total_cost - total_rev
            findings.append(
                Finding(
                    "critical",
                    f"Account-wide ROAS below break-even ({roas:.2f}x)",
                    f"${total_cost:,.0f} spent returned ${total_rev:,.0f} in "
                    f"tracked value.",
                    "Cut spend on sub-1.0x ROAS campaigns and rebuild bidding "
                    "around profitable segments.",
                    estimated_monthly_leakage=max(0.0, loss),
                )
            )

    cpas = [safe_div(c["cost"], c["conv"]) for c in campaigns if c["conv"] > 0]
    if len(cpas) >= 3:
        med = median(cpas)
        outliers = [
            c
            for c in campaigns
            if c["conv"] > 0 and safe_div(c["cost"], c["conv"]) > 2 * med and med > 0
        ]
        if outliers:
            waste = sum(c["cost"] - c["conv"] * med for c in outliers)
            findings.append(
                Finding(
                    "high",
                    f"{len(outliers)} campaign(s) with CPA >2x account median",
                    f"Median CPA is ${med:,.0f}; outliers: "
                    + ", ".join(c["name"] for c in outliers[:6]),
                    "Reallocate budget toward median-or-better CPA campaigns; "
                    "audit targeting/creative on the outliers.",
                    estimated_monthly_leakage=max(0.0, waste),
                )
            )

    acct_ctr = safe_div(total_clicks, total_impr)
    if total_impr > 0 and acct_ctr < LOW_CTR:
        findings.append(
            Finding(
                "high",
                f"Account CTR below benchmark ({acct_ctr * 100:.2f}%)",
                f"{total_clicks:,.0f} clicks on {total_impr:,.0f} impressions.",
                "Refresh creative and tighten audience/keyword match — low CTR "
                "inflates CPC and depresses quality/relevance scores.",
            )
        )

    if campaigns and total_cost > 0:
        top = max(campaigns, key=lambda c: c["cost"])
        share = safe_div(top["cost"], total_cost)
        top_roas = safe_div(top["rev"], top["cost"])
        if share > 0.6 and total_rev > 0 and top_roas < safe_div(total_rev, total_cost):
            findings.append(
                Finding(
                    "medium",
                    "Budget over-concentrated in an underperformer",
                    f"'{top['name']}' is {share * 100:.0f}% of spend at "
                    f"{top_roas:.2f}x ROAS, below the account average.",
                    "Diversify budget; cap the dominant campaign until its "
                    "efficiency matches or beats the account.",
                )
            )

    summary = {
        "campaigns": len(campaigns),
        "total_spend": round(total_cost, 2),
        "total_conversions": round(total_conv, 2),
        "total_revenue": round(total_rev, 2),
        "account_roas": round(safe_div(total_rev, total_cost), 2),
        "account_ctr": round(acct_ctr, 4),
        "blended_cpa": round(safe_div(total_cost, total_conv), 2),
    }
    return AuditResult("ads", summary, findings)
