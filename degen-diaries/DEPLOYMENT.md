# DEGEN DIARIES deployment

## Runtime
Next.js on Vercel with Neon Postgres.

## Required environment
DATABASE_URL
NEXT_PUBLIC_APP_URL
STRIPE_SECRET_KEY
STRIPE_PRICE_ID
STRIPE_WEBHOOK_SECRET
ADMIN_TOKEN
ANTHROPIC_API_KEY
RESEND_API_KEY
RESEND_FROM
GOTENBERG_URL

## Stripe
Create a recurring EUR price for the €3.99/month product and put its price ID in STRIPE_PRICE_ID. Configure the webhook endpoint at /api/stripe/webhook for checkout.session.completed and customer.subscription.deleted.

## Editorial
Use /newsroom with ADMIN_TOKEN. Feed researched source material into /api/ingest, or use /api/editorial/draft first and then save the verified draft through /api/stories.

## PDF
POST HTML to /api/render/pdf. Set GOTENBERG_URL to a reachable Gotenberg service.

## Email
POST an issueId to /api/email/issue after editorial QA and composition.

## Security
Do not commit environment values. ADMIN_TOKEN protects editorial mutation routes. Stripe webhook signatures are verified. BIOHACK coverage is editorial/research coverage and must not become dosing, procurement or unsafe medical guidance.
