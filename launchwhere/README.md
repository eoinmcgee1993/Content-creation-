# LaunchWhere

An AI-powered tool to help you decide **where** to launch your product — and craft the right content for each platform.

## What it does

Given a product description, LaunchWhere recommends the best launch platforms (Product Hunt, Hacker News, Reddit, IndieHackers, etc.) and generates platform-optimised launch copy for each.

## Quick start

```bash
pip install -r requirements.txt
python main.py --product "Your product description here"
```

## Project layout

```
launchwhere/
├── main.py          # CLI entry point
├── platforms.py     # Platform definitions & scoring
├── generator.py     # AI copy generator (OpenAI)
└── requirements.txt
```

## Requirements

- Python 3.10+
- OpenAI API key (`OPENAI_API_KEY` env var)
