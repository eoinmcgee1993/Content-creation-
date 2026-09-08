-- Racewear orders must be created by the service-role order function.
-- The browser must not be able to mint order ids or approval/download tokens.
revoke insert on public.crf_apparel_orders from anon, authenticated;
alter table public.crf_apparel_orders
  add column if not exists approval_email_sent_at timestamptz;

create or replace function public.crf_apparel_force_server_fields()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  new.id := 'CRFA-' || upper(replace(public.uuid_generate_v4()::text, '-', ''));
  new.approval_token := public.uuid_generate_v4();
  new.download_token := public.uuid_generate_v4();
  new.payment_status := 'unpaid';
  new.stripe_session_id := null;
  new.stripe_payment_intent := null;
  new.paid_at := null;
  new.artwork_status := 'pending';
  new.artwork_reviewed_at := null;
  new.artwork_note := null;
  new.approval_email_sent_at := null;
  return new;
end;
$$;

drop trigger if exists crf_apparel_force_unpaid_trg on public.crf_apparel_orders;
create trigger crf_apparel_force_server_fields_trg
before insert on public.crf_apparel_orders
for each row execute function public.crf_apparel_force_server_fields();
