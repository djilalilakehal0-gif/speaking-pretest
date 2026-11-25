-- Records which pre-payment disclosure text a user accepted, before each purchase. Append-only, owner-readable.
create table if not exists payment_disclosure_acceptances (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  tier         subscription_tier not null check (tier <> 'free'),
  disclosure_version text not null,          -- e.g. '2026-11-25-v1'
  locale       app_locale not null,
  accepted_at  timestamptz not null default now(),
  ip           inet
);
create index if not exists pda_user_idx on payment_disclosure_acceptances (user_id, accepted_at desc);
alter table payment_disclosure_acceptances enable row level security;
create policy pda_self_read on payment_disclosure_acceptances for select using (user_id = auth.uid());
create policy pda_self_insert on payment_disclosure_acceptances for insert with check (user_id = auth.uid());
-- no update/delete policy: acceptances are evidence and cannot be edited by users
create or replace function pda_immutable() returns trigger language plpgsql as $$
begin raise exception 'payment disclosure acceptances are append-only'; end $$;
create trigger trg_pda_immutable before update or delete on payment_disclosure_acceptances
  for each row execute function pda_immutable();
