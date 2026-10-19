# The browser can only create

A security rule for a static site with a database behind it. The browser's
key may insert rows and do nothing else, and every read happens server-side
under a key the browser never sees.

## The rule

- "**The browser can create, and can do nothing else.** It cannot read an
  order back, cannot update one, cannot see anyone else's."
  [[sources/crf-system#Architecture]]
- In CRF, `anon` holds INSERT and no other grant on any `crf_` table. "If a
  task appears to need `SELECT` for `anon`, the task is wrong, not the rule —
  put the read in an Edge Function under the service-role key."
  [[sources/root-claude-md#CRF architecture rules]]

## How it's enforced

- It is enforced twice, on purpose: by an insert-only RLS policy and by the
  table grants. "Either one alone would do the job; the second is there for
  the day the first is misconfigured."
  [[sources/crf-system#Where each rule is enforced]] The audit singles this
  out as care that buyers can't check for themselves
  [[sources/productized-audit#Asset 1, the fulfillment backend]].
- Reads live in Edge Functions, and pages never read back
  [[sources/root-claude-md#CRF architecture rules]].
- A query on table grants checks that `anon` holds INSERT and nothing else
  [[sources/root-claude-md#CRF standards and validation]]
  [[sources/crf-deployment-plan#Verification and rollback]].

## Pressure it has held against

A testing panel that listed orders from the browser was removed before
launch, because "the whole security model rests on the browser not being able
to do that". The operator view goes through `admin-orders` and a shared
secret instead, and "Do not give `anon` a `SELECT` grant to make an operator
view easier" [[sources/crf-deployment-plan#Racewear email and operator view]].

## Where it applies

- The [[entities/crf-storefront]] is built on it, on [[entities/supabase]].
- It is [[entities/edgevault]]'s headline rule. Carousel slide 03 reads "The
  browser can create. Nothing else."
  [[sources/master-blueprint#Instagram package]]
- It works alongside [[concepts/server-owned-state]], so even an insert can't
  set a sensitive field, and [[concepts/uniform-404]], so a read needs a
  token.
