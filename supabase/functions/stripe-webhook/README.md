# stripe-webhook

Marks a CRF Garage order paid, but only on a Stripe event whose signature we can verify.

Deployed to Supabase project `ohcclvcjdbftlnyrrzvt` as an Edge Function:

```
https://ohcclvcjdbftlnyrrzvt.supabase.co/functions/v1/stripe-webhook
```

## Why this exists

The kit builder generates the customer's SVG in the browser, so any paywall drawn
around it is decorative. This function is the actual trust boundary: `payment_status`
on `public.crf_orders` can only be set to `paid` here, from an event Stripe signed.

## How it authenticates

`verify_jwt` is **disabled**, because Stripe cannot send a Supabase JWT. The function
authenticates requests itself instead:

- every request must carry a `Stripe-Signature` header
- the signature is recomputed as `HMAC-SHA256(secret, "<timestamp>.<raw body>")` and
  compared in constant time
- events with a timestamp more than 5 minutes old are rejected, so a captured request
  cannot be replayed later

Anything that fails is rejected with `400` before the body is acted on.

## The signing secret

Stored in `public.crf_config` under the key `stripe_webhook_secret`, not in code and
not in an env var. That table has RLS enabled and **no policy**, plus `REVOKE ALL` from
`anon` and `authenticated` — so no browser key can read it. The function reaches it with
the service-role key that Supabase injects into the Edge Function runtime.

To rotate: create a new endpoint secret in Stripe, then

```sql
update public.crf_config
   set value = '<new whsec_...>', updated_at = now()
 where key = 'stripe_webhook_secret';
```

## Behaviour

| Event | Result |
|---|---|
| Bad or missing signature | `400`, nothing written |
| Timestamp older than 5 minutes | `400`, nothing written |
| Type other than `checkout.session.completed` | `200`, ignored |
| `payment_status` not `paid` | `200`, ignored |
| No `client_reference_id` | `200`, ignored and logged |
| Verified and paid | order marked `paid` with session id, payment intent, and `paid_at` |

A database failure returns `500` on purpose, so Stripe retries rather than silently
dropping a real payment.

## Redeploying

Deploy this directory to the `stripe-webhook` function with `verify_jwt` disabled. It
must stay disabled: enabling it would make Stripe's requests fail, since they carry a
Stripe signature rather than a Supabase JWT.
