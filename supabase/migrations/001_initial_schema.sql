-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Raw community signals ingested by Make.com
create table public.scraped_signals (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamptz default timezone('utc', now()) not null,
    source_platform text not null,
    raw_text text not null,
    processing_status text default 'pending'
        check (processing_status in ('pending', 'processed', 'failed'))
);

-- Autonomous funnels: one row per generated digital product
create table public.sales_funnels (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamptz default timezone('utc', now()) not null,
    signal_id uuid references public.scraped_signals(id) on delete cascade,
    slug text unique not null,
    product_name text not null,
    headline text not null,
    transformation_bullets text[] not null,
    price_cents integer default 2700 not null,
    checkout_url text,
    storage_file_path text not null,
    download_access_token uuid default uuid_generate_v4() not null
);

-- Performance indexes
create index idx_signals_state  on public.scraped_signals(processing_status);
create index idx_funnels_lookup on public.sales_funnels(slug);
create index idx_funnels_token  on public.sales_funnels(download_access_token);

-- Row-level security
alter table public.scraped_signals enable row level security;
alter table public.sales_funnels   enable row level security;

create policy "Internal Engine Read/Write Signals"
    on public.scraped_signals for all using (true);

create policy "Public Read Funnel Pages"
    on public.sales_funnels for select using (true);

create policy "Internal Engine Read/Write Funnels"
    on public.sales_funnels for all using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- AFTER running this migration:
--   1. Open Supabase Dashboard → Storage → New bucket
--   2. Name it "digital-assets"
--   3. Set access to Private (signed URLs will be generated per-order)
-- ─────────────────────────────────────────────────────────────────────────────
