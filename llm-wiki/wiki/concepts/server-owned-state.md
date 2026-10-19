# Server-owned state

Fields that carry money or approval are written only by trusted server code,
and database triggers overwrite whatever a client sends for them on insert.

## The rule

- "`payment_status` is written only by `stripe-webhook` after signature
  verification; `artwork_status` only by the customer through
  `apparel-approval`. `BEFORE INSERT` triggers overwrite both on every insert,
  so a crafted request cannot self-declare."
  [[sources/root-claude-md#CRF architecture rules]]
- "**Money is only ever set by Stripe.**" The browser can't write
  `payment_status`, the trigger overwrites it anyway, and only code that has
  verified a Stripe signature sets it to `paid`
  [[sources/crf-system#Architecture]].

## Mechanisms

- The trigger overwrites `payment_status`, `stripe_session_id`,
  `stripe_payment_intent` and `paid_at`. It forces `artwork_status` to
  `pending`, clears the review fields and clears `approval_email_sent_at`
  [[sources/crf-system#Where each rule is enforced]].
- The trigger functions set `SET search_path TO ''`, so a schema that shadows
  a function name can't subvert them
  [[sources/crf-system#Where each rule is enforced]].
- The webhook checks an HMAC-SHA256 over the timestamp and raw body, compares
  in constant time and allows a 300-second window
  [[sources/crf-system#Where each rule is enforced]]
  [[sources/productized-audit#Asset 1, the fulfillment backend]].
- Approval is one-way: re-approving returns 409, and the approval function
  can write only the artwork fields [[sources/crf-system#Racewear]].

## How it's checked

Three database invariants must return zero rows:

- no paid order without a Stripe session id
- no approved artwork without a review timestamp
- no paid order missing its file

[[sources/root-claude-md#CRF standards and validation]]
[[sources/crf-deployment-plan#Verification and rollback]]

## Where it applies

The [[entities/crf-storefront]] and its [[entities/stripe]] webhook use it,
and [[entities/edgevault]] packages it. It pairs with
[[concepts/browser-can-only-create]].
