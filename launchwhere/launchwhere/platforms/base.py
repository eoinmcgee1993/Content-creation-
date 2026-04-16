"""Base class for launch platform definitions."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Platform:
    """Describes a launch platform and its content requirements."""

    name: str
    slug: str
    max_tagline_chars: Optional[int] = None
    max_description_chars: Optional[int] = None
    supports_links: bool = True
    audience: str = ""
    tips: list[str] = field(default_factory=list)

    def prompt_instructions(self) -> str:
        """Return platform-specific instructions for the content generator."""
        parts = [f"Platform: {self.name}"]
        if self.audience:
            parts.append(f"Audience: {self.audience}")
        if self.max_tagline_chars:
            parts.append(f"Tagline limit: {self.max_tagline_chars} characters")
        if self.max_description_chars:
            parts.append(f"Description limit: {self.max_description_chars} characters")
        if self.tips:
            parts.append("Tips:\n" + "\n".join(f"- {t}" for t in self.tips))
        return "\n".join(parts)
