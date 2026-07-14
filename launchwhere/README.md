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
├── generator.py     # AI copy generator (Kimi K2 via Ollama)
└── requirements.txt
```

## Requirements

- Python 3.10+
- [Ollama](https://ollama.com) with the Kimi K2 cloud model:

  ```bash
  ollama signin                     # one-time, enables :cloud models
  ollama run kimi-k2.7-code:cloud   # pulls / warms the model
  ```

  With a local Ollama daemon running, no extra config is needed.

### Using Ollama Cloud directly (or another provider)

`generator.py` reads three env vars, so you can point it anywhere
OpenAI-compatible:

| Var            | Default                       | Notes                              |
| -------------- | ----------------------------- | ---------------------------------- |
| `LLM_MODEL`    | `kimi-k2.7-code:cloud`        | Model tag                          |
| `LLM_BASE_URL` | `http://localhost:11434/v1`   | Local Ollama; proxies cloud models |
| `LLM_API_KEY`  | `ollama`                      | Ignored locally                    |

```bash
# Hit Ollama Cloud directly instead of a local daemon:
export LLM_BASE_URL=https://ollama.com/v1
export LLM_API_KEY=<your-ollama-api-key>

# Or fall back to OpenAI:
export LLM_BASE_URL=https://api.openai.com/v1
export LLM_API_KEY=<your-openai-key>
export LLM_MODEL=gpt-4o-mini
```
