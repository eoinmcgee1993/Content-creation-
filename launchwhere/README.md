# LaunchWhere

**Find the best platforms to launch your product — and generate the copy to do it.**

LaunchWhere analyses your product description, scores every major launch platform by fit, and writes platform-specific launch content in seconds.

---

## Features

- **Platform advisor** — ranks Product Hunt, Hacker News, Twitter/X, LinkedIn, Indie Hackers, and Reddit for your product and stage
- **Content generator** — writes tailored taglines and post bodies for each platform
- **CLI** — run everything from the terminal

---

## Install

```bash
pip install -e .
```

Set your OpenAI key:

```bash
export OPENAI_API_KEY=sk-...
```

---

## Usage

### Find where to launch

```bash
launchwhere advise "A CLI tool that generates better git commit messages using AI"
```

```
Platform                        Score   Reasoning
--------------------------------------------------------------------------------
Hacker News (Show HN)            9/10   Technically sophisticated audience loves dev-tools.
Product Hunt                     8/10   Great fit for early adopters and maker community.
Indie Hackers                    7/10   Bootstrapper angle resonates well.
Twitter / X                      6/10   Good for viral reach among developers.
Reddit (r/SideProject …)         5/10   Depends on subreddit rules.
LinkedIn                         3/10   Less relevant for developer tools.
```

### Generate launch copy

```bash
# All platforms
launchwhere generate "A CLI tool that generates better git commit messages using AI"

# Single platform
launchwhere generate --platform producthunt "A CLI tool that generates better git commit messages"

# Personalised
launchwhere generate --founder "Alice" --website "https://commitai.dev" \
  "A CLI that writes commit messages from your git diff"
```

### List platform slugs

```bash
launchwhere platforms
```

---

## Python API

```python
from openai import OpenAI
from launchwhere import LaunchAdvisor, ContentGenerator
from launchwhere.platforms import PRODUCT_HUNT, HACKER_NEWS

client = OpenAI()

# Rank platforms
advisor = LaunchAdvisor(client)
scores = advisor.rank_platforms(
    "A CLI tool that generates git commit messages from diffs",
    stage="early",
)
for s in scores:
    print(f"{s.platform.name}: {s.score}/10 — {s.reasoning}")

# Generate content
generator = ContentGenerator(client)
content = generator.generate(
    "A CLI that writes commit messages from your git diff",
    platform=PRODUCT_HUNT,
    founder="Alice",
    website="https://commitai.dev",
)
print(content.render())
```

---

## Development

```bash
pip install -e ".[dev]"
pytest
```

---

## License

MIT
