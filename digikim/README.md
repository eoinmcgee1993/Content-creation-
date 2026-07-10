# DigiKim

An installable web app (PWA) that recommends where to launch your product and
generates platform-optimised copy with the **Kimi K2 cloud model via Ollama**.

It's the [LaunchWhere](../launchwhere/) flow, rebuilt as a phone-installable
web app that talks to the same model (`kimi-k2.7-code:cloud`) and endpoint
(`https://ollama.com/v1`).

## What's here

```
digikim/
├── index.html     # the whole app (UI + platform scoring + Kimi K2 calls)
├── manifest.json  # PWA manifest (installable)
├── sw.js          # service worker (offline app shell)
├── icon.svg       # app icon
└── README.md
```

No build step, no dependencies — just static files.

## Run / host it

Serve the folder over **HTTPS** (PWAs require it; `localhost` also works):

```bash
cd digikim
python3 -m http.server 8000      # then open http://localhost:8000
```

To use it from your phone, host the folder anywhere static (Netlify drop,
GitHub Pages, Cloudflare Pages, Vercel) and open the URL.

## Install on your phone

1. Open the hosted URL in the phone browser (Chrome on Android, Safari on iOS).
2. **Android:** menu → *Add to Home screen* / *Install app*.
   **iPhone:** Share → *Add to Home Screen*.
3. Launch it from the home-screen icon — it opens full-screen like a native app.

## First-time setup (in the app)

1. Open **⚙︎ Settings**.
2. Paste your Ollama API key (from
   <https://ollama.com/settings/keys>). It's stored **only in this device's
   local storage** — never sent anywhere except the API base URL, never
   committed.
3. Model and base URL are pre-filled (`kimi-k2.7-code:cloud`,
   `https://ollama.com/v1`).

## CORS note (important)

The app calls Ollama Cloud directly from the browser. If Ollama Cloud doesn't
send CORS headers, the browser blocks the request and you'll see a CORS error
on each card. If that happens, put a tiny proxy in front and set its URL as the
**API base URL** in Settings.

Example Cloudflare Worker proxy (deploy separately, keep your key server-side):

```js
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const target = "https://ollama.com/v1" + url.pathname.replace(/^\/v1/, "");
    const res = await fetch(target, {
      method: req.method,
      headers: { "Content-Type": "application/json",
                 "Authorization": "Bearer " + env.OLLAMA_API_KEY },
      body: req.method === "POST" ? await req.text() : undefined,
    });
    const out = new Response(res.body, res);
    out.headers.set("Access-Control-Allow-Origin", "*");
    return out;
  },
};
```

Then set the API base URL to `https://<your-worker>.workers.dev/v1` and leave
the app's key field blank (the proxy holds the key).
