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

## Access tiers (selling access)

The app auto-selects a tier from its env vars — most capable first:

### 1. Open (default)
No config. Downloads are unrestricted. Good for local development.

### 2. Paywall (Stripe only, per-device)
Gate downloads behind a Stripe Checkout subscription, tracked by a signed
cookie — **no database**.

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_…` / `sk_test_…`) |
| `STRIPE_PRICE_ID` | recurring price id for the subscription |
| `APP_SECRET` | random string used to sign access cookies |
| `ACCESS_DAYS` | access granted per activation (default 31) |
| `APP_BASE_URL` | public URL for Checkout redirects (else request origin) |

Flow: **Unlock → Subscribe** → Checkout → on return the app sets a signed,
expiring cookie. Access is per-device.

### 3. Accounts (Supabase + Stripe, cross-device)
Real logins via **Supabase magic link**, with a per-user subscription so a
customer pays once and uses it on any device. Enabled when the Stripe vars
above **and** all of these are set:

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | public anon key (sent to the browser for login) |
| `SUPABASE_JWT_SECRET` | verifies user access tokens (Project Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | writes subscription rows from the webhook |
| `STRIPE_WEBHOOK_SECRET` | signing secret for `POST /api/stripe/webhook` |

Setup:
1. Apply the migration `supabase/migrations/002_mediafetch_subscriptions.sql`
   (creates `public.mediafetch_subscriptions` with per-user RLS).
2. In Stripe, add a webhook to `https://<your-app>/api/stripe/webhook` for
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`; put its signing secret in
   `STRIPE_WEBHOOK_SECRET`.
3. In Supabase Auth, add your app URL to the allowed redirect URLs.

Flow: user enters email → magic-link login → **Subscribe** → Checkout. The
webhook writes the subscription to Supabase; `/api/download` allows the user
while their subscription is active. The browser loads `@supabase/supabase-js`
from a CDN, so the deployed host needs outbound access to `cdn.jsdelivr.net`.

## Deploy

Any host that runs a Python process or a container works.

**Render / Railway / Fly (buildpack):**

- Root directory: `mediafetch`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- Add the Stripe env vars above to enable the paywall.

**Docker** (portable to any container host):

```bash
cd mediafetch
docker build -t mediafetch .
docker run -p 8000:8000 -e APP_SECRET=... -e STRIPE_SECRET_KEY=... -e STRIPE_PRICE_ID=... mediafetch
```

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
