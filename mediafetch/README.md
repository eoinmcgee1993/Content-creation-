# MediaFetch

A small installable web app (PWA) for saving Instagram reels/posts. A mobile
user pastes a link; a Python backend runs `yt-dlp` server-side and streams the
video file back to the phone. Installs to the home screen, so it feels like a
native app without going through an app store.

## Structure

- `app.py` — FastAPI backend. Serves the PWA and exposes `POST /api/download`.
- `static/` — the app shell: `index.html`, `manifest.webmanifest`, `sw.js`, icons.
- `requirements.txt` — backend dependencies.

## Run locally

```bash
cd mediafetch
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Open http://localhost:8000 and paste an Instagram reel/post URL.

## Deploy (Render)

Create a new **Web Service** pointing at this repo with:

- Root directory: `mediafetch`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`

Any host that runs a Python process works (Render, Railway, Fly.io, a VPS).

## Known constraints

- **Instagram blocks datacenter IPs.** From a cloud host, downloads may hit
  403s where they succeed from a residential connection. A production service
  usually needs authenticated cookies and/or a residential/proxy egress. Budget
  for ongoing maintenance as Instagram changes their API.
- **Scope is Instagram-only** by design (`ALLOWED_HOSTS` in `app.py`) to limit
  abuse and legal exposure. `yt-dlp` supports many sites if you widen it.
- **ffmpeg-free by design.** V1 requests a single progressive MP4
  (`best[ext=mp4]/best`) so the host needs no ffmpeg. Add ffmpeg and switch to
  `bestvideo+bestaudio` for higher quality where separate streams exist.

## Selling it — next steps (not built yet)

1. Add a paywall: gate `/api/download` behind auth + a Stripe subscription
   (Stripe Checkout for signup, verify the subscription on each request).
2. Add rate limiting / abuse protection.
3. Terms of Service making clear users may only download content they own or
   have rights to.
