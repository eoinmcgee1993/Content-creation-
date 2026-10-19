# Uniform 404

A token-gated endpoint answers a wrong token exactly as it answers a wrong id,
so nobody can use it to find out which ids exist.

## The rule

- "**Every customer-facing read is keyed on `(id, token)`**, and a wrong token
  returns the same 404 as a wrong id — otherwise the endpoint becomes an
  order-id oracle." [[sources/root-claude-md#CRF architecture rules]]
- "An order id alone is worthless." [[sources/crf-system#Architecture]]

## Why it matters

- The audit calls identical 404s "the thing most boilerplates get wrong,
  because it's the difference between "secure" and "an order-id enumeration
  oracle."" [[sources/productized-audit#Asset 1, the fulfillment backend]]
- There are no accounts, so the token link is the customer's only way back to
  an order [[sources/crf-system#What it is]].

## Where it's used

- `kit-download` needs `(order_id, download_token)` and a paid order
  [[sources/crf-system#Where each rule is enforced]].
- `apparel-approval` needs `(order_id, approval_token)` and gives the same 404
  for either being wrong [[sources/crf-system#Racewear]].
- `apparel-notify` was specified to take the same pair, so that it can't be
  used to mail arbitrary addresses
  [[sources/crf-deployment-plan#Racewear email and operator view]].
- The operator view is the exception. It uses a shared secret compared by
  SHA-256 digest, and its query leaves out every token column so it can't be
  used to harvest links
  [[sources/productized-audit#Asset 1, the fulfillment backend]].
- It is part of [[entities/edgevault]]'s pitch: "A wrong token gets the same
  404 as a wrong order id." [[sources/master-blueprint#Instagram package]]

It is part of the [[entities/crf-storefront]] design, alongside
[[concepts/browser-can-only-create]].
