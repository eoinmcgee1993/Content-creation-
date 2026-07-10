# Chatting with Kimi K2 on your phone

The `kimi-k2.7-code:cloud` model runs on Ollama's servers, so your phone needs
no local horsepower — just an OpenAI-compatible chat app pointed at Ollama
Cloud. These are the **same** endpoint/key/model values wired into
`generator.py` (`LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL`), so your phone and
the LaunchWhere tool hit the exact same model.

## 1. Get an Ollama API key (once, on any device)

1. Sign in at <https://ollama.com> with the account you used for `ollama signin`.
2. Go to <https://ollama.com/settings/keys> → **Create key** → copy it.
   Treat it like a password.

## 2. Install a chat app

- **Android:** [Chatbox AI](https://chatboxai.app) (Play Store or APK).
  Alternative: the community "Ollama App" by JHubi1.
- **iOS:** Chatbox AI, or [Pal Chat](https://apps.apple.com/app/pal-chat/id6447545085).

## 3. Add a custom OpenAI-compatible provider

In the app's provider settings, choose **OpenAI API Compatible** and enter:

| Field                 | Value                       |
| --------------------- | --------------------------- |
| **API Host / Base URL** | `https://ollama.com/v1`   |
| **API Key**           | *(the key from step 1)*     |
| **Model**             | `kimi-k2.7-code:cloud`      |

Save, start a new chat with that model, and send a message to test.

## Troubleshooting

- **App rejects the model name:** the tag may differ slightly. Run
  `ollama list` on your computer (or check your Ollama models page) and paste
  the exact id — everything else stays the same.
- **401 / auth error:** the API key is wrong or from a different account than
  the one with cloud access. Regenerate it at the keys page above.
