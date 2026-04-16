"""Platform definitions and scoring heuristics for LaunchWhere."""

from dataclasses import dataclass


@dataclass
class Platform:
    name: str
    url: str
    audience: str
    best_for: list[str]
    copy_style: str
    max_title_len: int
    max_tagline_len: int


PLATFORMS: list[Platform] = [
    Platform(
        name="Product Hunt",
        url="https://www.producthunt.com",
        audience="early adopters, tech enthusiasts, investors",
        best_for=["SaaS", "mobile apps", "developer tools", "productivity"],
        copy_style="catchy, benefit-driven, emoji-friendly",
        max_title_len=60,
        max_tagline_len=120,
    ),
    Platform(
        name="Hacker News (Show HN)",
        url="https://news.ycombinator.com",
        audience="developers, engineers, technical founders",
        best_for=["developer tools", "open source", "infrastructure", "AI/ML"],
        copy_style="honest, technical, minimal hype",
        max_title_len=80,
        max_tagline_len=300,
    ),
    Platform(
        name="IndieHackers",
        url="https://www.indiehackers.com",
        audience="bootstrappers, indie founders, solopreneurs",
        best_for=["SaaS", "no-code", "side projects", "B2B tools"],
        copy_style="story-driven, revenue-focused, authentic",
        max_title_len=70,
        max_tagline_len=200,
    ),
    Platform(
        name="Reddit",
        url="https://www.reddit.com",
        audience="niche communities, power users",
        best_for=["consumer apps", "games", "hobby tools", "community products"],
        copy_style="conversational, community-first, no hard sell",
        max_title_len=100,
        max_tagline_len=400,
    ),
]


def score_platforms(product_description: str) -> list[tuple[Platform, int]]:
    """Return platforms sorted by relevance score (simple keyword heuristic)."""
    keywords = product_description.lower().split()
    scored = []
    for platform in PLATFORMS:
        score = sum(
            1
            for kw in keywords
            if any(kw in tag.lower() for tag in platform.best_for)
        )
        scored.append((platform, score))
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored
