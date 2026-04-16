"""AI copy generator powered by the OpenAI API."""

import os

from openai import OpenAI

from platforms import Platform

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])


def generate_copy(product_description: str, platform: Platform) -> dict[str, str]:
    """Generate a title and tagline for *platform* given the product description."""
    prompt = (
        f"You are a launch copywriter expert.\n\n"
        f"Product: {product_description}\n\n"
        f"Platform: {platform.name}\n"
        f"Audience: {platform.audience}\n"
        f"Copy style: {platform.copy_style}\n\n"
        f"Write a launch title (max {platform.max_title_len} chars) and a tagline "
        f"(max {platform.max_tagline_len} chars) for this product on {platform.name}.\n\n"
        f"Respond in this exact format:\n"
        f"TITLE: <title>\n"
        f"TAGLINE: <tagline>"
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=300,
        temperature=0.7,
    )

    raw = response.choices[0].message.content or ""
    title, tagline = "", ""
    for line in raw.splitlines():
        if line.startswith("TITLE:"):
            title = line.removeprefix("TITLE:").strip()
        elif line.startswith("TAGLINE:"):
            tagline = line.removeprefix("TAGLINE:").strip()

    return {"title": title, "tagline": tagline}
