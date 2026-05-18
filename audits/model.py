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

    def __post_init__(self) -> None:
        if self.severity not in SEVERITY_WEIGHT:
            raise ValueError(f"unknown severity: {self.severity}")


@dataclass
class AuditResult:
    kind: str  # "ads" | "seo"
    summary: dict[str, float | int | str]
    findings: list[Finding] = field(default_factory=list)

    @property
    def total_leakage(self) -> float:
        return round(sum(f.estimated_monthly_leakage for f in self.findings), 2)

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
