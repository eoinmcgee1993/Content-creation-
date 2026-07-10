"""AI copy generator powered by the Kimi K2 cloud model via Ollama.

Ollama exposes an OpenAI-compatible API, so the OpenAI SDK talks to it
unchanged — we only point it at Ollama's endpoint and model. Defaults target a
local Ollama daemon (which proxies `:cloud` models once you've run
`ollama signin`). Override the env vars below to use Ollama Cloud directly
(`https://ollama.com/v1` + an API key) or to fall back to OpenAI.
"""

import os

from openai import OpenAI

from platforms import Platform

# Local Ollama ignores the API key; the placeholder keeps the SDK happy.
MODEL = os.environ.get("LLM_MODEL", "kimi-k2.7-code:cloud")
client = OpenAI(
    base_url=os.environ.get("LLM_BASE_URL", "http://localhost:11434/v1"),
    api_key=os.environ.get("LLM_API_KEY", "ollama"),
)


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
        model=MODEL,
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
