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

## Wiring

Email capture is **live-wired** to the `gates-unbound` Supabase project. The
`public.waitlist` table has RLS enabled: the publishable key may `insert` (the
form) but cannot `select` (emails stay private). Verified end-to-end (insert
`201`, anon read `[]`).

| Where | Constant | Status |
|-------|----------|--------|
| `index.html` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | ✅ wired to `gates-unbound` project (publishable key) |
| `index.html` | `TRANSMISSION_URL` | ✅ `./intercept/001.html` |
| `intercept/001.html` | `DEPLOY_ARCHITECTURE` link `href` | ⛔ **TODO** — paste the Stripe checkout URL for the Founding Member / Operator tier (Stripe MCP not authorized in this session) |

The full Next.js + Supabase + Stripe + Resend funnel described in the brief is
intentionally **not** built here — these static pages are the shippable first cut.

## Preview locally

```
python3 -m http.server -d gates-unbound 8000
# open http://localhost:8000
```
