-- Substack OS: historical publication metrics.
--
-- Substack's own analytics page answers "what is my subscriber count". It does
-- not answer "what changed, and what caused it", because it keeps no history
-- you can query — you get the current state and a graph. This schema exists to
-- hold the daily snapshots that make the second question answerable.
--
-- Nothing in the browser touches these tables. That is a stronger rule than the
-- crf_ tables follow: those grant anon INSERT because a customer has to be able
-- to place an order. Here there is no customer and no insert worth exposing —
-- writes arrive from an Edge Function under the service-role key, reads leave
-- through another one. So anon gets nothing at all, and there is no policy to
-- get wrong later.

create table if not exists public.substack_daily_metrics (
  publication      text    not null,
  metric_date      date    not null,
  subscribers      integer,
  paid_subscribers integer,
  free_subscribers integer,
  new_subscribers  integer,
  unsubscribes     integer,
  views            integer,
  -- Substack reports annualised revenue, not revenue booked that day. Naming
  -- this arr_cents rather than revenue_cents stops someone summing a column of
  -- run-rates into a "total" that means nothing.
  arr_cents        bigint,
  currency         text    not null default 'usd',
  captured_at      timestamptz not null default now(),
  source           text    not null default 'substack_mcp',
  primary key (publication, metric_date)
);

-- net_growth and paid_conversion are deliberately absent. Both are pure
-- functions of columns already here, and a stored copy is a second source of
-- truth that drifts the first time a snapshot is corrected. The analytics
-- engine derives them.

create table if not exists public.substack_posts (
  publication    text not null,
  post_id        text not null,
  title          text,
  published_at   timestamptz,
  views          integer,
  likes          integer,
  comments       integer,
  shares         integer,
  free_signups   integer,
  paid_signups   integer,
  -- Revenue attributed to this post, as a period amount. Unlike the daily
  -- table's arr_cents this one does sum.
  revenue_cents  bigint,
  currency       text not null default 'usd',
  traffic_source text,
  category       text,
  captured_at    timestamptz not null default now(),
  primary key (publication, post_id)
);

create index if not exists substack_posts_published_idx
  on public.substack_posts (publication, published_at desc);

-- Secrets for this project live here, in the same shape crf_config uses: RLS
-- on, zero policies, every grant revoked, so only a service-role client inside
-- a function can read a row. It is a separate table rather than a shared one
-- because a storefront's Stripe secret and a publication's ingest key have no
-- reason to sit in the same blast radius.
create table if not exists public.substack_config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.substack_daily_metrics enable row level security;
alter table public.substack_posts         enable row level security;
alter table public.substack_config        enable row level security;

revoke all on public.substack_daily_metrics from anon, authenticated;
revoke all on public.substack_posts         from anon, authenticated;
revoke all on public.substack_config        from anon, authenticated;
