-- SOI DOG PRO — Initial Schema
-- Run this in your Supabase SQL editor or via `supabase db push`

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Missions table
create table if not exists missions (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  description   text,
  lat           numeric(9, 6) not null,
  lng           numeric(9, 6) not null,
  target_amount numeric(10, 2) not null default 0,
  current_raised numeric(10, 2) not null default 0,
  status        text not null default 'active'
                  check (status in ('active', 'completed', 'paused')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Logs table (dog verification records)
create table if not exists logs (
  id                uuid primary key default uuid_generate_v4(),
  mission_id        uuid references missions(id) on delete cascade,
  user_id           uuid not null,
  photo_url         text,
  confidence_score  numeric(5, 4) not null default 0,
  dog_verified_at   timestamptz not null default now()
);

-- RPC: increment mission funding atomically
create or replace function increment_mission_funding(mission_id uuid, amount numeric)
returns void
language plpgsql
as $$
begin
  update missions
  set current_raised = current_raised + amount,
      status = case
        when current_raised + amount >= target_amount then 'completed'
        else status
      end,
      updated_at = now()
  where id = mission_id;
end;
$$;

-- RLS
alter table missions enable row level security;
alter table logs enable row level security;

-- Public read on missions
create policy "missions_public_read" on missions
  for select using (true);

-- Authenticated insert on logs
create policy "logs_auth_insert" on logs
  for insert with check (auth.uid() = user_id);

-- Authenticated read own logs
create policy "logs_auth_read" on logs
  for select using (auth.uid() = user_id);

-- Seed: Pattaya dummy missions
insert into missions (title, description, lat, lng, target_amount, current_raised, status) values
  ('Soi 6 Rescue Point',        'Emergency rescue and care on Soi 6',         12.9236, 100.8825, 5000.00, 3600.00, 'active'),
  ('Beach Road Feeding Station','Daily feeding run along Beach Road',          12.9315, 100.8741, 2000.00,  900.00, 'active'),
  ('Dark Side Shelter',         'Shelter build on the Dark Side',              12.9182, 100.8863, 8000.00, 8000.00, 'completed'),
  ('North Pattaya Vet Run',     'Mobile vet for northern district strays',     12.9401, 100.8798, 3500.00,  700.00, 'active'),
  ('Jomtien Spay Clinic',       'Spay/neuter program in Jomtien',             12.9089, 100.8912, 6000.00, 3600.00, 'active')
on conflict do nothing;
