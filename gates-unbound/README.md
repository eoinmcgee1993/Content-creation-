# Gates Unbound — Terminal Funnel

Self-contained, terminal-style landing funnel. Two static HTML files, Tailwind via
CDN, no build step (same pattern as `storefront/index.html`).

## Pages

- `index.html` — public landing page. Black/green CRT aesthetic, glitch headline,
  email capture framed as **"Transmission Intercepted."** On submit it (optionally)
  stores the email in Supabase, then routes the operator to the briefing.
- `intercept/001.html` — the hidden **Transmission 001** intelligence briefing.
  `noindex`, terminal line-by-line decryption reveal, ending in a
  `> DEPLOY_ARCHITECTURE` CTA. Respects `prefers-reduced-motion`.

## Wiring (placeholders)

Everything works as-is for preview. To go live, fill in the placeholders:

| Where | Constant | Purpose |
|-------|----------|---------|
| `index.html` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | persist emails to a `waitlist` table via the public anon key (leave as-is to skip storage) |
| `index.html` | `TRANSMISSION_URL` | where to send operators after capture (default: `./intercept/001.html`) |
| `intercept/001.html` | `DEPLOY_ARCHITECTURE` link `href` | Stripe checkout URL for the Founding Member / Operator tier |

The full Next.js + Supabase + Stripe + Resend funnel described in the brief is
intentionally **not** built here — these static pages are the shippable first cut.

## Preview locally

```
python3 -m http.server -d gates-unbound 8000
# open http://localhost:8000
```
