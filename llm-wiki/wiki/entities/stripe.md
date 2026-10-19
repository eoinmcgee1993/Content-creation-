# Stripe

Takes the payments for the CRF graphics kit, through a live-mode Payment Link
and a signature-verified webhook. It can optionally run MediaFetch's paywall.

## CRF

- The kit is a one-time $39.00 USD Payment Link in live mode. The link carries
  the order id as `client_reference_id`, and the webhook subscribes only to
  `checkout.session.completed` [[sources/crf-system#Graphics kit]]
  [[sources/crf-deployment-plan#Launch]].
- Only `stripe-webhook` can mark an order paid. It checks an HMAC-SHA256 over
  the timestamp and raw body, compares in constant time, and rejects anything
  older than 300 seconds [[sources/crf-system#Where each rule is enforced]]. It
  returns 500 when a database write fails, so Stripe retries
  [[sources/productized-audit#Asset 1, the fulfillment backend]]. See
  [[concepts/server-owned-state]].
- The signing secret lives in `crf_config`. "Do not rotate
  `crf_config.stripe_webhook_secret` as a launch ritual"
  [[sources/crf-deployment-plan#Launch]].
- The account is named *Clearmark*, and buyers see that name at checkout and
  on their statements, which is a chargeback risk
  [[sources/crf-system#Graphics kit]] [[sources/crf-deployment-plan#Launch]].
  The naming question is on [[entities/crf-storefront#Trading name]].
- As of 2 Sep, no purchase had completed
  [[sources/crf-deployment-plan#Launch]]. The claim that it has is flagged on
  [[entities/edgevault#The trust line]].
- Racewear has no card payment [[sources/crf-system#Racewear]].

## MediaFetch

It has an optional subscription paywall and webhook, configured through
Render environment variables [[sources/deploy-config#Render blueprint]]. See
[[entities/render]].

## In the products

Stripe is half of what [[entities/edgevault]] sells: "Only a
signature-verified Stripe webhook can mark it paid."
[[sources/master-blueprint#Instagram package]]
