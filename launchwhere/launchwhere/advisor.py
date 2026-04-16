"""Platform recommendation engine.

Given a product description, the advisor scores each platform and returns
a ranked list with reasoning.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Optional

from openai import OpenAI

from .platforms import ALL_PLATFORMS, Platform


@dataclass
class PlatformScore:
    platform: Platform
    score: int          # 1–10
    reasoning: str


class LaunchAdvisor:
    """Recommends launch platforms for a given product."""

    SYSTEM_PROMPT = (
        "You are a startup launch strategist with deep knowledge of online communities. "
        "You help founders choose the right platforms to launch their product and "
        "maximise visibility, traction, and community engagement."
    )

    def __init__(self, client: OpenAI, model: str = "gpt-4o") -> None:
        self.client = client
        self.model = model

    def rank_platforms(
        self,
        product_description: str,
        target_audience: Optional[str] = None,
        stage: str = "early",
    ) -> list[PlatformScore]:
        """Score and rank all platforms for the given product.

        Args:
            product_description: A plain-English description of the product.
            target_audience: Optional description of the ideal customer.
            stage: Product stage — 'idea', 'early', 'growth', or 'scale'.

        Returns:
            List of PlatformScore, sorted best-first.
        """
        platform_list = "\n".join(
            f"- {p.slug}: {p.name} (audience: {p.audience})" for p in ALL_PLATFORMS
        )

        audience_line = f"Target audience: {target_audience}" if target_audience else ""
        prompt = (
            f"Product description: {product_description}\n"
            f"{audience_line}\n"
            f"Product stage: {stage}\n\n"
            f"Available platforms:\n{platform_list}\n\n"
            "Score each platform from 1 to 10 based on fit for this product and stage. "
            "Return a JSON array where each element has keys: "
            "\"slug\" (string), \"score\" (integer 1–10), \"reasoning\" (one sentence). "
            "Return ONLY the JSON array, no markdown fences."
        )

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )

        raw = response.choices[0].message.content or "[]"
        items: list[dict] = json.loads(raw)

        slug_to_platform = {p.slug: p for p in ALL_PLATFORMS}
        scores = [
            PlatformScore(
                platform=slug_to_platform[item["slug"]],
                score=int(item["score"]),
                reasoning=item["reasoning"],
            )
            for item in items
            if item.get("slug") in slug_to_platform
        ]

        return sorted(scores, key=lambda s: s.score, reverse=True)
