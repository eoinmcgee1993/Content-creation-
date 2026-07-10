# DigiKim

Decide **where** to launch your product and generate platform-optimised copy
with the **Kimi K2 cloud model via Ollama** (`kimi-k2.7-code:cloud`).

Two ways to use it, one product:

```
digikim/
├── app/   # installable web app (PWA) — add to your phone's home screen
└── cli/   # command-line version (Python)
```

- **[app/](app/)** — a static, installable web app. Host the folder, open it on
  your phone, Add to Home Screen. See [app/README.md](app/README.md).
- **[cli/](cli/)** — the Python CLI. `pip install -r cli/requirements.txt` then
  `python cli/main.py --product "…"`. See [cli/README.md](cli/README.md).

Both talk to the same model and endpoint (`https://ollama.com/v1`) via Ollama's
OpenAI-compatible API. Get a key at <https://ollama.com/settings/keys>.
