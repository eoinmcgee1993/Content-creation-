"""SEO audit from a Google Search Console queries export (optional period diff)."""

from __future__ import annotations

import re

from .metrics import map_headers, safe_div, to_number
from .model import AuditResult, Finding

ALIASES = {
    "query": ["query", "top queries", "queries", "search query", "keyword"],
    "clicks": ["clicks"],
    "impressions": ["impressions", "impr"],
    "ctr": ["ctr", "click through rate"],
    "position": ["position", "avg. position", "average position"],
}

# Rough organic CTR-by-position benchmark (industry composite).
EXPECTED_CTR = {
    1: 0.28, 2: 0.15, 3: 0.11, 4: 0.08, 5: 0.06,
    6: 0.05, 7: 0.04, 8: 0.032, 9: 0.028, 10: 0.025,
}
_STOP = {"the", "a", "an", "for", "to", "of", "in", "on", "and", "or", "best", "how"}


def _tokens(q: str) -> frozenset[str]:
    return frozenset(t for t in re.findall(r"[a-z0-9]+", q.lower()) if t not in _STOP)


def _expected_ctr(pos: float) -> float:
    if pos <= 0:
        return 0.0
    return EXPECTED_CTR.get(int(round(pos)), 0.01 if pos <= 20 else 0.005)


def run_seo_audit(
    fieldnames: list[str],
    rows: list[dict[str, str]],
    *,
    brand: str | None = None,
    compare: list[dict[str, str]] | None = None,
    compare_fields: list[str] | None = None,
) -> AuditResult:
    cols = map_headers(fieldnames, ALIASES)
    if "query" not in cols or "impressions" not in cols:
        raise ValueError(
            "Expected GSC export with query + impressions columns. Found: "
            + ", ".join(fieldnames)
        )

    recs = []
    for r in rows:
        q = r.get(cols["query"], "").strip()
        if not q:
            continue
        impr = to_number(r.get(cols["impressions"], 0))
        clicks = to_number(r.get(cols.get("clicks", ""), 0))
        recs.append(
            {
                "q": q,
                "clicks": clicks,
                "impr": impr,
                "ctr": to_number(r.get(cols.get("ctr", ""), 0)) or safe_div(clicks, impr),
                "pos": to_number(r.get(cols.get("position", ""), 0)),
            }
        )

    findings: list[Finding] = []
    total_impr = sum(x["impr"] for x in recs)
    total_clicks = sum(x["clicks"] for x in recs)

    striking = sorted(
        [x for x in recs if 10 < x["pos"] <= 20 and x["impr"] >= 100],
        key=lambda x: -x["impr"],
    )
    if striking:
        opp_clicks = sum(x["impr"] * _expected_ctr(10) for x in striking[:25])
        findings.append(
            Finding(
                "high",
                f"{len(striking)} striking-distance queries (pos 11–20)",
                "High-impression queries one push away from page 1, e.g.: "
                + ", ".join(f"'{x['q']}'" for x in striking[:6]),
                "Prioritize on-page optimization and internal links for these "
                f"— modeled upside ≈ {opp_clicks:,.0f} clicks/mo if moved to top 10.",
            )
        )

    underperf = [
        x
        for x in recs
        if 0 < x["pos"] <= 10 and x["impr"] >= 200 and x["ctr"] < 0.5 * _expected_ctr(x["pos"])
    ]
    if underperf:
        findings.append(
            Finding(
                "high",
                f"{len(underperf)} top-10 queries with below-curve CTR",
                "Ranking well but under-clicked (title/meta/SERP-feature issue): "
                + ", ".join(f"'{x['q']}'" for x in sorted(underperf, key=lambda x: -x["impr"])[:6]),
                "Rewrite titles/meta descriptions and add structured data to "
                "recover clicks already being earned in impressions.",
            )
        )

    zero_click = sorted(
        [x for x in recs if x["clicks"] == 0 and x["impr"] >= 300],
        key=lambda x: -x["impr"],
    )
    if zero_click:
        findings.append(
            Finding(
                "medium",
                f"{len(zero_click)} high-impression, zero-click queries",
                "Visible but never clicked — likely intent mismatch or weak SERP "
                "presence: " + ", ".join(f"'{x['q']}'" for x in zero_click[:6]),
                "Create or realign content to the actual search intent behind "
                "these queries.",
            )
        )

    clusters: dict[frozenset[str], list[dict]] = {}
    for x in recs:
        if 0 < x["pos"] <= 20:
            clusters.setdefault(_tokens(x["q"]), []).append(x)
    cannibal = [grp for key, grp in clusters.items() if key and len(grp) > 1]
    if cannibal:
        sample = cannibal[0]
        findings.append(
            Finding(
                "medium",
                f"{len(cannibal)} potential keyword-cannibalization cluster(s)",
                "Multiple ranking queries share the same core terms, e.g.: "
                + ", ".join(f"'{x['q']}'" for x in sample[:4]),
                "Consolidate competing pages or differentiate intent so one "
                "canonical page earns the authority.",
            )
        )

    if brand:
        bt = brand.lower()
        branded = sum(x["impr"] for x in recs if bt in x["q"].lower())
        nonbranded = total_impr - branded
        if total_impr > 0 and safe_div(nonbranded, total_impr) < 0.3:
            findings.append(
                Finding(
                    "high",
                    "Organic visibility is brand-dependent",
                    f"Only {safe_div(nonbranded, total_impr) * 100:.0f}% of "
                    "impressions come from non-branded queries.",
                    "Build topical/non-branded content; brand-only demand does "
                    "not grow the funnel.",
                )
            )

    if compare and compare_fields:
        ccols = map_headers(compare_fields, ALIASES)
        if "query" in ccols and "position" in ccols:
            prev = {
                r.get(ccols["query"], "").strip().lower(): to_number(r.get(ccols["position"], 0))
                for r in compare
                if r.get(ccols["query"], "").strip()
            }
            drops = []
            for x in recs:
                p0 = prev.get(x["q"].lower(), 0)
                if p0 and x["pos"] and x["pos"] - p0 >= 3 and p0 <= 20:
                    drops.append((x["q"], p0, x["pos"], x["impr"]))
            drops.sort(key=lambda d: -d[3])
            if drops:
                findings.append(
                    Finding(
                        "critical",
                        f"{len(drops)} queries with significant ranking drops",
                        "; ".join(
                            f"'{q}' {p0:.0f}→{p1:.0f}" for q, p0, p1, _ in drops[:6]
                        ),
                        "Investigate content decay, lost links, or SERP changes "
                        "on the affected pages; refresh highest-impression first.",
                    )
                )

    summary = {
        "queries": len(recs),
        "total_clicks": round(total_clicks),
        "total_impressions": round(total_impr),
        "avg_ctr": round(safe_div(total_clicks, total_impr), 4),
        "avg_position": round(
            safe_div(sum(x["pos"] for x in recs if x["pos"] > 0),
                     sum(1 for x in recs if x["pos"] > 0)),
            1,
        ),
    }
    return AuditResult("seo", summary, findings)
