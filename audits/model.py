"""Shared data structures and scoring for audits."""

from __future__ import annotations

from dataclasses import dataclass, field

SEVERITY_WEIGHT = {"critical": 25, "high": 15, "medium": 8, "low": 3}
SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


@dataclass
class Finding:
    severity: str  # critical | high | medium | low
    title: str
    detail: str
    recommendation: str
    estimated_monthly_leakage: float = 0.0
    # "campaign" leakage is attributed to a specific, disjoint set of campaigns,
    # so such findings add up. "account" leakage restates the whole account's
    # shortfall from the top down and therefore overlaps the campaign-level
    # figures rather than adding to them.
    scope: str = "campaign"

    def __post_init__(self) -> None:
        if self.severity not in SEVERITY_WEIGHT:
            raise ValueError(f"unknown severity: {self.severity}")
        if self.scope not in ("campaign", "account"):
            raise ValueError(f"unknown scope: {self.scope}")


@dataclass
class AuditResult:
    kind: str  # "ads" | "seo"
    summary: dict[str, float | int | str]
    findings: list[Finding] = field(default_factory=list)

    @property
    def total_leakage(self) -> float:
        """Bounded, non-overlapping modelled monthly leakage.

        Campaign-scoped findings each claim a disjoint set of campaigns, so they
        add. Account-scoped findings restate the same money from the top down, so
        the total is the larger of the two views — never their sum. Summing them
        let a loss-making account report more recoverable spend than it spent,
        which is the one number a client will always check.
        """
        campaign = sum(
            f.estimated_monthly_leakage for f in self.findings if f.scope == "campaign"
        )
        account = max(
            (f.estimated_monthly_leakage for f in self.findings if f.scope == "account"),
            default=0.0,
        )
        return round(max(campaign, account), 2)

    @property
    def score(self) -> int:
        """100 minus capped, weighted penalties. Clamped to [0, 100]."""
        penalty = 0.0
        seen: dict[str, int] = {}
        for f in self.findings:
            seen[f.severity] = seen.get(f.severity, 0) + 1
            # Diminishing penalty: repeated findings of the same severity
            # count less so a single noisy category cannot zero the score.
            penalty += SEVERITY_WEIGHT[f.severity] / seen[f.severity]
        return max(0, min(100, round(100 - penalty)))

    def sorted_findings(self) -> list[Finding]:
        return sorted(
            self.findings,
            key=lambda f: (SEVERITY_ORDER[f.severity], -f.estimated_monthly_leakage),
        )
