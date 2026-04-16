"""Launch content generator.

Produces platform-specific launch copy for a given product.
"""

from __future__ import annotations

from dataclasses import dataclass

from openai import OpenAI

from .platforms import Platform


@dataclass
class LaunchContent:
    platform: Platform
    tagline: str
    body: str

    def render(self) -> str:
        lines = [
            f"=== {self.platform.name} ===",
            f"Tagline: {self.tagline}",
            "",
            self.body,
        ]
        return "\n".join(lines)


class ContentGenerator:
    """Generates launch content tailored to each platform."""

    SYSTEM_PROMPT = (
        "You are an expert startup copywriter specialising in product launches. "
        "Write compelling, authentic launch copy that fits each platform's culture "
        "and conventions. Never use buzzwords like 'revolutionise' or 'game-changer'."
    )

    def __init__(self, client: OpenAI, model: str = "gpt-4o") -> None:
        self.client = client
        self.model = model

    def generate(
        self,
        product_description: str,
        platform: Platform,
        founder_name: str = "",
        website: str = "",
    ) -> LaunchContent:
        """Generate tagline + body copy for a single platform.

        Args:
            product_description: Plain-English description of the product.
            platform: Target platform definition.
            founder_name: Optional — personalises first-person copy.
            website: Optional — included in CTAs where appropriate.

        Returns:
            LaunchContent with tagline and body fields.
        """
        extras = []
        if founder_name:
            extras.append(f"Founder name: {founder_name}")
        if website:
            extras.append(f"Website: {website}")

        prompt = (
            f"Product description:\n{product_description}\n\n"
            + ("\n".join(extras) + "\n\n" if extras else "")
            + f"Platform instructions:\n{platform.prompt_instructions()}\n\n"
            "Write the launch content. Return a JSON object with two keys:\n"
            "  \"tagline\": a short, punchy headline (follow the platform character limit)\n"
            "  \"body\": the main launch post body\n"
            "Return ONLY the JSON object, no markdown fences."
        )

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
        )

        import json
        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)

        return LaunchContent(
            platform=platform,
            tagline=data.get("tagline", ""),
            body=data.get("body", ""),
        )

    def generate_for_platforms(
        self,
        product_description: str,
        platforms: list[Platform],
        founder_name: str = "",
        website: str = "",
    ) -> list[LaunchContent]:
        """Generate content for multiple platforms.

        Args:
            product_description: Plain-English description of the product.
            platforms: List of target platforms.
            founder_name: Optional founder name for personalisation.
            website: Optional website URL.

        Returns:
            List of LaunchContent, one per platform.
        """
        return [
            self.generate(product_description, p, founder_name, website)
            for p in platforms
        ]
