# Stripe integration
Planner-approved shape: €3.99/month flat-rate subscription, Stripe-hosted Checkout, no trial, Stripe Customer Portal, Smart Retries and automated recovery.
Required env: STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_APP_URL.
Live products, prices and charges are not created automatically. Create/configure the product and price in Stripe, set STRIPE_PRICE_ID, then configure the webhook endpoint for subscription lifecycle events.