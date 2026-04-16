"""Built-in platform definitions."""

from .base import Platform

PRODUCT_HUNT = Platform(
    name="Product Hunt",
    slug="producthunt",
    max_tagline_chars=60,
    max_description_chars=260,
    audience="Early adopters, tech enthusiasts, founders, and investors",
    tips=[
        "Lead with what the product does, not what it is",
        "Tagline must be punchy and jargon-free",
        "Mention the key benefit in the first sentence",
        "Ask a clear call-to-action question at the end",
    ],
)

HACKER_NEWS = Platform(
    name="Hacker News (Show HN)",
    slug="hackernews",
    max_tagline_chars=80,
    audience="Developers, hackers, and technically sophisticated readers",
    tips=[
        "Title must start with 'Show HN:'",
        "Be precise — avoid marketing language",
        "Explain the technical approach briefly",
        "Share the backstory or problem that motivated the build",
        "Mention the tech stack if it is interesting",
    ],
)

TWITTER = Platform(
    name="Twitter / X",
    slug="twitter",
    max_tagline_chars=280,
    audience="General tech-savvy public, startup community",
    tips=[
        "Hook in the first line — make it scroll-stopping",
        "Use a thread for longer announcements",
        "Include a clear link or CTA",
        "Use 2–3 relevant hashtags max",
        "Add an image or GIF if possible",
    ],
)

LINKEDIN = Platform(
    name="LinkedIn",
    slug="linkedin",
    max_description_chars=3000,
    audience="Professionals, recruiters, enterprise buyers, investors",
    tips=[
        "Open with a personal story or strong hook",
        "Use short paragraphs and line breaks",
        "Highlight business value and ROI",
        "End with a question to drive comments",
        "Tag relevant people or companies",
    ],
)

INDIE_HACKERS = Platform(
    name="Indie Hackers",
    slug="indiehackers",
    audience="Bootstrappers, solo founders, and indie makers",
    tips=[
        "Share revenue or traction numbers if you have them",
        "Be transparent about the journey",
        "Explain how you found your first customers",
        "Discuss what worked and what failed",
    ],
)

REDDIT = Platform(
    name="Reddit (r/SideProject or r/startups)",
    slug="reddit",
    audience="Diverse communities — match tone to the subreddit",
    tips=[
        "Read subreddit rules before posting",
        "Lead with value, not promotion",
        "Share a genuine story or insight",
        "Respond to every comment early on",
    ],
)

ALL_PLATFORMS: list[Platform] = [
    PRODUCT_HUNT,
    HACKER_NEWS,
    TWITTER,
    LINKEDIN,
    INDIE_HACKERS,
    REDDIT,
]

PLATFORM_BY_SLUG: dict[str, Platform] = {p.slug: p for p in ALL_PLATFORMS}

__all__ = [
    "Platform",
    "ALL_PLATFORMS",
    "PLATFORM_BY_SLUG",
    "PRODUCT_HUNT",
    "HACKER_NEWS",
    "TWITTER",
    "LINKEDIN",
    "INDIE_HACKERS",
    "REDDIT",
]
