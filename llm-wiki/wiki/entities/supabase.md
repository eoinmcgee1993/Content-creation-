# Supabase

Postgres plus Deno Edge Functions. It is the whole trusted backend of the CRF
storefront, and therefore of EdgeVault, and its one schema is shared with
other projects in this repo.

## CRF's backend

- CRF has four `crf_` tables, with RLS, table grants, `BEFORE INSERT`
  triggers, and a `crf_config` table for secrets
  [[sources/crf-system#Data model]]
  [[sources/crf-system#Where each rule is enforced]].
- Its six Edge Functions run with the service-role key and do their own
  authentication in the request body
  [[sources/crf-system#Architecture]]
  [[sources/root-claude-md#CRF standards and validation]].
- The DDL for the CRF tables is not in `supabase/migrations/`. It was
  applied to the live project directly, and exists in the repo only as SQL in
  `docs/crf/BLUEPRINT.md` §3 [[sources/productized-audit#Corrections]]. So the
  live CRF schema can't be rebuilt from the migrations alone.
  [[entities/edgevault]]'s release build has to assemble it from there.
- The rules it enforces are described in [[concepts/browser-can-only-create]]
  and [[concepts/server-owned-state]].

## Shared with other projects

- One Supabase project's migrations serve CRF's racewear and ECU tables and
  MediaFetch's subscriptions [[sources/root-claude-md#Deploy targets and traps]].
- `001_initial_schema.sql` belongs to a digital-product project
  (`scraped_signals`, `sales_funnels`)
  [[sources/productized-audit#Corrections]]. So do the `build-digital-asset`
  and `fulfill-order` functions, which call Gemini, Resend and Lemon Squeezy
  [[sources/crf-system#Not part of this system]].
- MediaFetch's optional accounts tier connects with the URL, anon key, JWT
  secret and service-role key [[sources/deploy-config#Render blueprint]].
- Before adding a migration, check the existing numbering and table names
  [[sources/root-claude-md#Deploy targets and traps]]. See
  [[concepts/monorepo-shared-singletons]].

## Function settings

> [!WARNING]
> **Contradiction.** Root `CLAUDE.md` says the Edge Functions run with
> `verify_jwt = false`, because "Stripe cannot present a Supabase JWT"
> [[sources/root-claude-md#CRF standards and validation]], and
> `docs/crf/SYSTEM.md` agrees [[sources/crf-system#Architecture]]. But
> `supabase/config.toml` sets it for only four functions, two of which aren't
> CRF's. It leaves out `stripe-webhook`, `kit-download`, `apparel-approval`
> and `admin-orders` [[sources/deploy-config#Supabase config]].
> **Inference:** a deploy that relies on this file would give those four
> Supabase's default JWT check, and Stripe's webhook calls would be refused.
> `productized/edgevault-fulfillment-kit/SETUP.md` covers how the kit's
> functions are deployed, and is the next source to read on this.

The file's `project_id` is also a placeholder
[[sources/deploy-config#Supabase config]].
