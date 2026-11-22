-- MIGRA ESPAÑA — core schema
-- Run with: supabase db push   (or psql -f)
-- All PII tables get RLS in 0002_rls.sql. Nothing here is public by default.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists btree_gist;

-- ───────────────────────── Enums ─────────────────────────
create type app_role        as enum ('user','lawyer','legal_editor','support','admin','super_admin');
create type app_locale      as enum ('ar','es','fr','en');
create type rule_status     as enum ('active','amended','expired','under_review');
create type content_state   as enum ('draft','in_review','published','archived');
create type case_status     as enum (
  'new_case','initial_assessment','waiting_for_documents','documents_received','lawyer_review',
  'application_preparation','ready_for_submission','submitted','under_administrative_review',
  'additional_documents_requested','decision_issued','approved','refused','appeal_in_progress','completed');
create type task_status     as enum ('todo','in_progress','done','blocked');
create type verification_status as enum ('pending','verified','rejected','suspended');
create type appointment_status  as enum ('requested','confirmed','rescheduled','cancelled','completed','no_show');
create type payment_status  as enum ('pending','succeeded','failed','refunded','partially_refunded');
create type payment_kind    as enum ('consultation','document_review','application_preparation','case_management','subscription');
create type subscription_tier   as enum ('free','premium','professional_legal');
create type subscription_status as enum ('active','trialing','past_due','cancelled','incomplete');
create type invoice_status  as enum ('draft','issued','paid','void');
create type ticket_status   as enum ('open','pending','resolved','closed');
create type doc_category    as enum (
  'passport','identity','empadronamiento','historical_registration','employment_contract','payslip',
  'family_document','birth_certificate','marriage_certificate','criminal_record','training_certificate',
  'application_receipt','administrative_decision','other');

-- ───────────────────────── Identity ─────────────────────────
create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  role        app_role not null default 'user',
  locale      app_locale not null default 'es',
  mfa_enrolled boolean not null default false,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table user_profiles (
  user_id     uuid primary key references users(id) on delete cascade,
  full_name   text,
  nationality text,            -- ISO 3166-1 alpha-2; optional (data minimisation)
  phone       text,
  arrival_date date,
  province    text,
  avatar_path text,
  updated_at  timestamptz not null default now()
);

create table user_preferences (
  user_id       uuid primary key references users(id) on delete cascade,
  theme         text not null default 'system' check (theme in ('light','dark','system')),
  notify_push   boolean not null default true,
  notify_email  boolean not null default true,
  notify_deadlines boolean not null default true,
  notify_marketing boolean not null default false,
  -- GDPR: explicit, per-purpose, withdrawable consents with timestamps
  consent_terms_at       timestamptz,
  consent_privacy_at     timestamptz,
  consent_ai_processing_at timestamptz,        -- optional; withdraw => null
  consent_doc_sharing_at   timestamptz,        -- optional
  updated_at    timestamptz not null default now()
);

create table admin_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  role        app_role not null check (role in ('legal_editor','support','admin','super_admin')),
  granted_by  uuid references users(id),
  granted_at  timestamptz not null default now(),
  unique (user_id, role)
);

-- ───────────────────────── Lawyers ─────────────────────────
create table legal_specialties (
  id    serial primary key,
  slug  text not null unique,
  name  jsonb not null            -- {"es":"…","en":"…","fr":"…","ar":"…"}
);

create table lawyers (
  id               uuid primary key references users(id) on delete cascade,
  display_name     text not null,
  bar_association  text not null,           -- Colegio de Abogados de …
  bar_number       text not null,
  languages        app_locale[] not null default '{es}',
  specialty_ids    int[] not null default '{}',
  years_experience int check (years_experience >= 0),
  bio              jsonb not null default '{}'::jsonb,
  photo_path       text,
  consultation_price_cents int check (consultation_price_cents >= 0),
  currency         char(3) not null default 'EUR',
  availability     jsonb not null default '[]'::jsonb,   -- weekly template
  verification     verification_status not null default 'pending',
  listed           boolean not null default false,
  created_at       timestamptz not null default now(),
  -- A lawyer can only be publicly listed when verified. Enforced in DB, not just UI.
  constraint listed_requires_verified check (not listed or verification = 'verified'),
  unique (bar_association, bar_number)
);

create table lawyer_verifications (
  id            uuid primary key default gen_random_uuid(),
  lawyer_id     uuid not null references lawyers(id) on delete cascade,
  submitted_evidence_path text,           -- private storage path (colegiado certificate)
  checked_against text,                   -- registry consulted (e.g. CGAE / Colegio census)
  checked_at    timestamptz,
  reviewer_id   uuid references users(id),
  status        verification_status not null default 'pending',
  notes         text,
  created_at    timestamptz not null default now()
);

-- ───────────────────────── Legal knowledge base ─────────────────────────
create table legal_sources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  issuer      text not null,                         -- BOE, Ministerio de Inclusión…
  url         text not null check (url ~ '^https://'),
  reference   text,                                  -- e.g. "RD 1155/2024, art. 127"
  published_on date,
  effective_on date,
  last_verified_on date,
  link_checked_at timestamptz,
  link_ok     boolean,
  created_at  timestamptz not null default now()
);

create table immigration_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  parent_id   uuid references immigration_categories(id),
  sort_order  int not null default 0,
  icon        text,
  title       jsonb not null,
  summary     jsonb not null default '{}'::jsonb
);

create table legal_rules (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references immigration_categories(id) on delete cascade,
  version      int not null default 1,
  state        content_state not null default 'draft',
  status       rule_status   not null default 'under_review',
  -- structured sections: definition, who_can_apply, eligibility, documents, procedure, fees, …
  -- each is {"es":"…","en":"…","fr":"…","ar":"…"} or arrays thereof
  body         jsonb not null,
  legal_reference text not null,
  source_ids   uuid[] not null default '{}',
  effective_on date,
  last_verified_on date,
  translations_reviewed boolean not null default false,  -- legal review of non-Spanish text
  authored_by  uuid references users(id),
  reviewed_by  uuid references users(id),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  -- Publishing requires a verification date AND a legal reference AND a reviewer.
  constraint publish_requires_verification check (
    state <> 'published' or (last_verified_on is not null and reviewed_by is not null and length(legal_reference) > 0)),
  unique (category_id, version)
);

create table legal_updates (
  id          uuid primary key default gen_random_uuid(),
  rule_id     uuid references legal_rules(id) on delete set null,
  title       jsonb not null,
  summary     jsonb not null,
  source_id   uuid references legal_sources(id),
  state       content_state not null default 'draft',
  published_at timestamptz,
  created_by  uuid references users(id),
  created_at  timestamptz not null default now()
);

-- ───────────────────────── Eligibility ─────────────────────────
create table eligibility_questions (
  id         serial primary key,
  code       text not null unique,
  position   int not null,
  kind       text not null check (kind in ('boolean','choice','country','date','duration')),
  options    jsonb,
  prompt     jsonb not null,
  help       jsonb,
  active     boolean not null default true
);

create table eligibility_assessments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  engine_version text not null,
  rules_snapshot_date date not null,
  result     jsonb not null,          -- {eligible:[…], needs_info:[…], not_met:[…]}
  needs_lawyer_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table eligibility_answers (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references eligibility_assessments(id) on delete cascade,
  question_code text not null,
  answer        jsonb not null,
  unique (assessment_id, question_code)
);

-- ───────────────────────── Cases ─────────────────────────
create table immigration_cases (
  id          uuid primary key default gen_random_uuid(),
  reference   text not null unique default ('ME-' || to_char(now(),'YY') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  user_id     uuid not null references users(id) on delete cascade,
  lawyer_id   uuid references lawyers(id),
  category_id uuid references immigration_categories(id),
  status      case_status not null default 'new_case',
  submitted_on date,
  official_file_number text,                  -- manual entry; no gov integration claimed
  next_deadline date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table case_status_history (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references immigration_cases(id) on delete cascade,
  from_status case_status,
  to_status  case_status not null,
  changed_by uuid references users(id),
  note       text,
  created_at timestamptz not null default now()
);

create table case_tasks (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references immigration_cases(id) on delete cascade,
  title      text not null,
  detail     text,
  status     task_status not null default 'todo',
  due_on     date,
  assigned_to uuid references users(id),
  weight     int not null default 1 check (weight > 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ───────────────────────── Documents ─────────────────────────
create table documents (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references users(id) on delete cascade,
  case_id     uuid references immigration_cases(id) on delete set null,
  category    doc_category not null default 'other',
  file_name   text not null,
  storage_path text not null unique,          -- private bucket 'vault'
  mime_type   text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  size_bytes  bigint not null check (size_bytes > 0 and size_bytes <= 15728640),
  sha256      text,
  expires_on  date,
  ocr_text    text,                           -- only stored if user consented
  created_at  timestamptz not null default now()
);

create table document_permissions (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  grantee_id  uuid not null references users(id) on delete cascade,
  granted_at  timestamptz not null default now(),
  expires_at  timestamptz,
  revoked_at  timestamptz,
  unique (document_id, grantee_id)
);

create table document_access_logs (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  actor_id    uuid references users(id),
  action      text not null check (action in ('view','download','share','revoke','delete')),
  ip          inet,
  created_at  timestamptz not null default now()
);

-- ───────────────────────── Appointments & messaging ─────────────────────────
create table appointments (
  id         uuid primary key default gen_random_uuid(),
  lawyer_id  uuid not null references lawyers(id),
  client_id  uuid not null references users(id),
  case_id    uuid references immigration_cases(id),
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  status     appointment_status not null default 'requested',
  video_url  text check (video_url is null or video_url ~ '^https://'),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
-- No double-booking for a lawyer on active appointments
alter table appointments add constraint no_lawyer_overlap
  exclude using gist (lawyer_id with =, tstzrange(starts_at, ends_at) with &&)
  where (status in ('requested','confirmed','rescheduled'));

create table conversations (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid references immigration_cases(id) on delete cascade,
  client_id  uuid not null references users(id) on delete cascade,
  lawyer_id  uuid references lawyers(id),
  created_at timestamptz not null default now()
);

create table messages (
  id         uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id  uuid not null references users(id),
  body       text not null check (length(body) between 1 and 8000),
  attachment_document_id uuid references documents(id),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Money ─────────────────────────
-- Three fee types are kept strictly separate: platform charge, lawyer fee, government fee (never charged here).
create table payments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id),
  lawyer_id   uuid references lawyers(id),
  case_id     uuid references immigration_cases(id),
  kind        payment_kind not null,
  status      payment_status not null default 'pending',
  amount_cents int not null check (amount_cents >= 0),
  vat_cents    int not null default 0 check (vat_cents >= 0),
  currency    char(3) not null default 'EUR',
  stripe_payment_intent text unique,
  stripe_session_id text unique,
  refunded_cents int not null default 0 check (refunded_cents >= 0),
  created_at  timestamptz not null default now()
);

create table invoices (
  id          uuid primary key default gen_random_uuid(),
  number      text not null unique,
  payment_id  uuid references payments(id),
  issuer_id   uuid not null references users(id),    -- platform or lawyer
  recipient_id uuid not null references users(id),
  net_cents   int not null check (net_cents >= 0),
  vat_cents   int not null default 0,
  status      invoice_status not null default 'draft',
  pdf_path    text,
  issued_at   timestamptz,
  created_at  timestamptz not null default now()
);

create table subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  tier        subscription_tier not null default 'free',
  status      subscription_status not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id)
);

-- ───────────────────────── Engagement ─────────────────────────
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  kind       text not null,
  title      jsonb not null,
  body       jsonb,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create table device_tokens (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references users(id) on delete cascade,
  fcm_token text not null unique,
  platform  text not null check (platform in ('android','ios','web')),
  created_at timestamptz not null default now()
);

create table reviews (
  id         uuid primary key default gen_random_uuid(),
  lawyer_id  uuid not null references lawyers(id) on delete cascade,
  author_id  uuid not null references users(id) on delete cascade,
  case_id    uuid not null references immigration_cases(id),   -- only real engagements can review
  rating     int not null check (rating between 1 and 5),
  comment    text check (length(comment) <= 2000),
  state      content_state not null default 'in_review',        -- moderated before publication
  created_at timestamptz not null default now(),
  unique (author_id, case_id)
);

create table support_tickets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete set null,
  subject    text not null,
  body       text not null,
  status     ticket_status not null default 'open',
  assigned_to uuid references users(id),
  created_at timestamptz not null default now()
);

create table audit_logs (
  id         bigserial primary key,
  actor_id   uuid references users(id),
  action     text not null,                 -- e.g. legal_rule.publish
  entity     text not null,
  entity_id  text,
  before     jsonb,
  after      jsonb,
  ip         inet,
  created_at timestamptz not null default now()
);

create table data_requests (            -- GDPR Art. 15–22 requests
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete set null,
  kind       text not null check (kind in ('access','rectification','erasure','portability','restriction','objection')),
  status     text not null default 'open' check (status in ('open','in_progress','done','rejected')),
  due_on     date not null default (current_date + 30),
  created_at timestamptz not null default now()
);

-- ───────────────────────── Indexes ─────────────────────────
create index on immigration_cases (user_id);
create index on immigration_cases (lawyer_id, status);
create index on case_status_history (case_id, created_at desc);
create index on case_tasks (case_id, status);
create index on documents (owner_id, category);
create index on documents (expires_on) where expires_on is not null;
create index on document_permissions (grantee_id) where revoked_at is null;
create index on document_access_logs (document_id, created_at desc);
create index on appointments (lawyer_id, starts_at);
create index on appointments (client_id, starts_at);
create index on messages (conversation_id, created_at);
create index on notifications (user_id, read_at, created_at desc);
create index on payments (user_id, created_at desc);
create index on legal_rules (category_id, state, status);
create index on legal_rules using gin (body jsonb_path_ops);
create index on audit_logs (entity, entity_id, created_at desc);
create index on audit_logs (actor_id, created_at desc);
create index on eligibility_assessments (user_id, created_at desc);
create index on lawyers (listed) where listed;

-- ───────────────────────── Triggers ─────────────────────────
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger trg_cases_touch before update on immigration_cases for each row execute function touch_updated_at();
create trigger trg_profiles_touch before update on user_profiles for each row execute function touch_updated_at();
create trigger trg_prefs_touch before update on user_preferences for each row execute function touch_updated_at();

-- Auto-create public.users + prefs + free subscription on signup
create or replace function handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into users (id, email, locale)
    values (new.id, new.email, coalesce((new.raw_user_meta_data->>'locale')::app_locale, 'es'));
  insert into user_profiles (user_id) values (new.id);
  -- consent captured at sign-up travels in user metadata; optional consents are only set if ticked
  insert into user_preferences (user_id, consent_terms_at, consent_privacy_at, consent_ai_processing_at)
    values (new.id,
            nullif(new.raw_user_meta_data->>'consent_terms_at','')::timestamptz,
            nullif(new.raw_user_meta_data->>'consent_terms_at','')::timestamptz,
            nullif(new.raw_user_meta_data->>'consent_ai_at','')::timestamptz);
  insert into subscriptions (user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_auth_user();

-- Case status history is written automatically on every status change.
create or replace function log_case_status() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into case_status_history (case_id, from_status, to_status, changed_by) values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into case_status_history (case_id, from_status, to_status, changed_by) values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $$;
create trigger trg_case_status after insert or update of status on immigration_cases
  for each row execute function log_case_status();

-- Legal content: every change to legal_rules is written to the immutable audit log.
create or replace function audit_legal_rules() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into audit_logs (actor_id, action, entity, entity_id, before, after)
  values (auth.uid(), 'legal_rule.' || lower(tg_op), 'legal_rules', coalesce(new.id, old.id)::text,
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
create trigger trg_audit_legal_rules after insert or update or delete on legal_rules
  for each row execute function audit_legal_rules();

-- audit_logs is append-only.
create or replace function block_audit_mutation() returns trigger language plpgsql as $$
begin raise exception 'audit_logs is append-only'; end $$;
create trigger trg_audit_immutable before update or delete on audit_logs
  for each row execute function block_audit_mutation();

-- ───────────────────────── Retention (GDPR storage limitation) ─────────────────────────
-- Run daily via pg_cron / Supabase scheduled function. See docs/PRIVACY_AND_SECURITY.md §Retention.
create or replace function apply_retention() returns void language plpgsql security definer set search_path = public as $$
begin
  delete from document_access_logs where created_at < now() - interval '24 months';
  delete from notifications where created_at < now() - interval '12 months';
  delete from eligibility_assessments where created_at < now() - interval '24 months';
  -- Accounts soft-deleted > 30 days ago are hard-deleted (cascades to owned data).
  delete from users where deleted_at is not null and deleted_at < now() - interval '30 days';
end $$;
