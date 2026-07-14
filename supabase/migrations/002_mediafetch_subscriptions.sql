-- MediaFetch: per-user subscription status, kept in sync from Stripe webhooks.
-- One row per authenticated user. Reads are user-scoped via RLS; writes happen
-- through the service role (the Stripe webhook), which bypasses RLS.

create table if not exists public.mediafetch_subscriptions (
    user_id                uuid primary key references auth.users(id) on delete cascade,
    stripe_customer_id     text,
    stripe_subscription_id text,
    status                 text not null default 'inactive',
    current_period_end     timestamptz,
    updated_at             timestamptz not null default timezone('utc', now())
);

alter table public.mediafetch_subscriptions enable row level security;

-- A user may read only their own subscription row.
create policy "Users read own subscription"
    on public.mediafetch_subscriptions for select
    using (auth.uid() = user_id);
