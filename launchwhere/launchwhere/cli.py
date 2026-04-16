"""Command-line interface for LaunchWhere."""

from __future__ import annotations

import os
import sys

from openai import OpenAI

from .advisor import LaunchAdvisor
from .generator import ContentGenerator
from .platforms import ALL_PLATFORMS, PLATFORM_BY_SLUG


def _get_client() -> OpenAI:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)
    return OpenAI(api_key=api_key)


def cmd_advise(args: list[str]) -> None:
    """launchwhere advise <product description>"""
    if not args:
        print("Usage: launchwhere advise <product description>")
        sys.exit(1)

    description = " ".join(args)
    client = _get_client()
    advisor = LaunchAdvisor(client)

    print("Analysing your product...\n")
    scores = advisor.rank_platforms(description)

    print(f"{'Platform':<30} {'Score':>5}   Reasoning")
    print("-" * 80)
    for s in scores:
        print(f"{s.platform.name:<30} {s.score:>5}/10   {s.reasoning}")


def cmd_generate(args: list[str]) -> None:
    """launchwhere generate [--platform SLUG] <product description>"""
    platforms = list(ALL_PLATFORMS)
    founder = ""
    website = ""
    remaining: list[str] = []

    i = 0
    while i < len(args):
        if args[i] == "--platform" and i + 1 < len(args):
            slug = args[i + 1]
            if slug not in PLATFORM_BY_SLUG:
                print(f"Unknown platform: {slug}")
                print(f"Available: {', '.join(PLATFORM_BY_SLUG)}")
                sys.exit(1)
            platforms = [PLATFORM_BY_SLUG[slug]]
            i += 2
        elif args[i] == "--founder" and i + 1 < len(args):
            founder = args[i + 1]
            i += 2
        elif args[i] == "--website" and i + 1 < len(args):
            website = args[i + 1]
            i += 2
        else:
            remaining.append(args[i])
            i += 1

    if not remaining:
        print("Usage: launchwhere generate [--platform SLUG] [--founder NAME] [--website URL] <description>")
        sys.exit(1)

    description = " ".join(remaining)
    client = _get_client()
    generator = ContentGenerator(client)

    print(f"Generating content for {len(platforms)} platform(s)...\n")
    contents = generator.generate_for_platforms(description, platforms, founder, website)
    for content in contents:
        print(content.render())
        print()


def cmd_platforms(_args: list[str]) -> None:
    """launchwhere platforms"""
    print(f"{'Slug':<18} Platform")
    print("-" * 50)
    for p in ALL_PLATFORMS:
        print(f"{p.slug:<18} {p.name}")


COMMANDS = {
    "advise": cmd_advise,
    "generate": cmd_generate,
    "platforms": cmd_platforms,
}


def main() -> None:
    argv = sys.argv[1:]
    if not argv or argv[0] in ("-h", "--help"):
        print("LaunchWhere — find where and how to launch your product\n")
        print("Commands:")
        print("  advise <description>        Score platforms for your product")
        print("  generate <description>      Generate launch copy for all platforms")
        print("    --platform SLUG           Generate for a single platform")
        print("    --founder NAME            Personalise with founder name")
        print("    --website URL             Include website URL in copy")
        print("  platforms                   List available platform slugs")
        return

    command = argv[0]
    if command not in COMMANDS:
        print(f"Unknown command: {command}")
        print(f"Available commands: {', '.join(COMMANDS)}")
        sys.exit(1)

    COMMANDS[command](argv[1:])


if __name__ == "__main__":
    main()
