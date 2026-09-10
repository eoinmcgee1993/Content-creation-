-- ECU tune email capture, moved off the host.
--
-- ecu.html collected these through Netlify Forms: a hidden <form netlify> stub
-- in the served HTML, and a POST to "/" that only means anything because
-- Netlify intercepts it. That works exactly as long as the site is hosted on
-- Netlify, and fails silently the moment it is not — recordLead() is
-- fire-and-forget with .catch(() => {}), so the download keeps working and the
-- leads just stop arriving with nothing to notice.
--
-- This is the same shape as crf_orders: the browser may INSERT and may do
-- nothing else. There is no server-owned state to protect here, so no trigger —
-- every column is the customer's own answer.

create table if not exists public.crf_ecu_leads (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email      text not null,
  model      text
);

alter table public.crf_ecu_leads enable row level security;

-- INSERT only, and no SELECT grant. Reading the list back is an Edge Function's
-- job under the service-role key, the same rule the order tables follow: a
-- SELECT grant to anon cannot be given to one page, it is given to everyone who
-- views source.
revoke all on public.crf_ecu_leads from anon, authenticated;
grant insert on public.crf_ecu_leads to anon, authenticated;

drop policy if exists crf_ecu_leads_anon_insert on public.crf_ecu_leads;
create policy crf_ecu_leads_anon_insert
  on public.crf_ecu_leads
  for insert
  to anon, authenticated
  with check (true);
