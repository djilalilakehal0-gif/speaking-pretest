-- Run after migrations on a scratch DB:  psql -v ON_ERROR_STOP=1 -d <db> -f supabase/tests/rls.test.sql
-- (On Supabase local: `supabase db reset && supabase test db`.) Fails loudly with an exception on any broken guarantee.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
grant usage on schema public, auth, storage to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant select on all tables in schema auth to authenticated;

-- fixtures (as table owner): 4 auth users → trigger creates public rows
insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','a@test.dev','{"locale":"ar","consent_terms_at":"2026-01-01T00:00:00Z"}'),
 ('00000000-0000-0000-0000-00000000000b','b@test.dev','{}'),
 ('00000000-0000-0000-0000-00000000000c','lawyer@test.dev','{}'),
 ('00000000-0000-0000-0000-00000000000d','editor@test.dev','{}');
update users set role = 'lawyer' where email = 'lawyer@test.dev';
update users set role = 'legal_editor' where email = 'editor@test.dev';
insert into lawyers (id, display_name, bar_association, bar_number) values ('00000000-0000-0000-0000-00000000000c','Test Lawyer','Colegio X','123');
insert into documents (id, owner_id, category, file_name, storage_path, mime_type, size_bytes)
 values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','passport','p.pdf','a/p.pdf','application/pdf',100);

do $$ begin
  assert (select locale from users where email='a@test.dev') = 'ar', 'signup trigger must copy locale';
  assert (select consent_terms_at is not null from user_preferences where user_id='00000000-0000-0000-0000-00000000000a'), 'consent captured at signup';
  assert (select consent_ai_processing_at is null from user_preferences where user_id='00000000-0000-0000-0000-00000000000a'), 'AI consent must be opt-in';
  assert (select tier = 'free' from subscriptions where user_id='00000000-0000-0000-0000-00000000000b'), 'free subscription auto-created';
end $$;

-- 1. documents: stranger cannot see; owner can
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
do $$ begin assert (select count(*) from documents) = 0, 'stranger must not read others documents'; end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
do $$ begin assert (select count(*) from documents) = 1, 'owner reads own document'; end $$;

-- 2. grant → lawyer reads; revoke → blocked; expired → blocked
insert into document_permissions (document_id, grantee_id, expires_at) values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000c', now() + interval '1 day');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
do $$ begin assert (select count(*) from documents) = 1, 'granted lawyer can read'; end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
update document_permissions set revoked_at = now();
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
do $$ begin assert (select count(*) from documents) = 0, 'revoked grant must block'; end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
update document_permissions set revoked_at = null, expires_at = now() - interval '1 hour';
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
do $$ begin assert (select count(*) from documents) = 0, 'expired grant must block'; end $$;

-- 3. privilege escalation: user cannot make themselves admin
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
do $$ begin
  begin update users set role = 'super_admin' where id = '00000000-0000-0000-0000-00000000000b'; raise exception 'should have failed';
  exception when insufficient_privilege then null; end;   -- RLS WITH CHECK rejects the escalation
end $$;
-- user cannot insert into admin_roles
do $$ begin
  begin insert into admin_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000b','admin'); raise exception 'should have failed';
  exception when insufficient_privilege or others then if sqlerrm = 'should have failed' then raise; end if; end;
end $$;

-- 4. non-editors cannot write legal rules; plain user sees only published rules
reset role;
insert into immigration_categories (slug, title) values ('t','{"es":"t"}');
insert into legal_rules (category_id, body, legal_reference) select id, '{}', 'RD 1155/2024' from immigration_categories where slug='t';
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
do $$ begin assert (select count(*) from legal_rules) = 0, 'drafts invisible to public'; end $$;
do $$ declare n int; begin update legal_rules set state='published'; get diagnostics n = row_count; assert n = 0, 'user cannot publish'; end $$;

-- 5. publishing requires verification date + reviewer (CHECK) even for editors
reset role;
do $$ begin
  begin update legal_rules set state='published'; raise exception 'should have failed';
  exception when check_violation then null; end;
end $$;
update legal_rules set state='published', status='active', last_verified_on = current_date, reviewed_by = '00000000-0000-0000-0000-00000000000d';
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
do $$ begin assert (select count(*) from legal_rules) = 1, 'published rule becomes public'; end $$;

-- 6. every legal-rule change is audited & audit log is append-only
reset role;
do $$ begin
  assert (select count(*) from audit_logs where entity='legal_rules') >= 2, 'legal_rules changes audited';
  begin delete from audit_logs; raise exception 'should have failed'; exception when others then if sqlerrm = 'should have failed' then raise; end if; end;
end $$;

-- 7. a lawyer cannot be listed unless verified
do $$ begin
  begin update lawyers set listed = true; raise exception 'should have failed'; exception when check_violation then null; end;
end $$;
update lawyers set verification='verified', listed=true;
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
do $$ begin assert (select count(*) from lawyers) = 1, 'verified+listed lawyer visible to public'; end $$;
reset role;
update lawyers set listed=false, verification='pending';
set role authenticated;
do $$ begin assert (select count(*) from lawyers) = 0, 'unverified lawyer invisible to public'; end $$;

-- 8. appointments: no double-booking
reset role;
insert into appointments (lawyer_id, client_id, starts_at, ends_at, status) values ('00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-00000000000a','2030-01-01 10:00+00','2030-01-01 10:30+00','confirmed');
do $$ begin
  begin insert into appointments (lawyer_id, client_id, starts_at, ends_at) values ('00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-00000000000b','2030-01-01 10:15+00','2030-01-01 10:45+00'); raise exception 'should have failed';
  exception when exclusion_violation then null; end;
  insert into appointments (lawyer_id, client_id, starts_at, ends_at) values ('00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-00000000000b','2030-01-01 10:30+00','2030-01-01 11:00+00');
end $$;

-- 9. case status history is automatic
insert into immigration_cases (id, user_id) values ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a');
update immigration_cases set status = 'initial_assessment' where id = '20000000-0000-0000-0000-000000000001';
do $$ begin assert (select count(*) from case_status_history where case_id='20000000-0000-0000-0000-000000000001') = 2, 'status history automatic'; end $$;
-- strangers cannot see someone elses case
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
do $$ begin assert (select count(*) from immigration_cases) = 0, 'case isolation'; assert (select count(*) from case_status_history) = 0, 'history isolation'; end $$;

-- 10. payments: users cannot write (webhook/service role only)
do $$ begin
  begin insert into payments (user_id, kind, amount_cents) values ('00000000-0000-0000-0000-00000000000b','subscription',1); raise exception 'should have failed';
  exception when others then if sqlerrm = 'should have failed' then raise; end if; end;
end $$;
reset role;
select 'ALL RLS / CONSTRAINT TESTS PASSED' as result;

-- ───── 0003: messaging ─────
-- (fixtures: lawyer c is 'pending' again at this point; verify for these tests)
update lawyers set verification='verified', listed=true where id='00000000-0000-0000-0000-00000000000c';
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
-- client cannot open a conversation with an unverified lawyer id / null lawyer
do $$ begin
  begin insert into conversations (client_id, lawyer_id) values ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000d'); raise exception 'should have failed';
  exception when insufficient_privilege then null; end;
end $$;
insert into conversations (id, client_id, lawyer_id) values ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000c');
-- duplicate conversation rejected
do $$ begin
  begin insert into conversations (client_id, lawyer_id) values ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000c'); raise exception 'should have failed';
  exception when unique_violation then null; end;
end $$;
insert into messages (conversation_id, sender_id, body) values ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','hello');
-- spoofed sender is rejected
do $$ begin
  begin insert into messages (conversation_id, sender_id, body) values ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000c','spoof'); raise exception 'should have failed';
  exception when insufficient_privilege then null; end;
end $$;
-- stranger sees nothing and cannot post
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
do $$ begin
  assert (select count(*) from messages) = 0, 'stranger must not read messages';
  assert (select count(*) from conversations) = 0, 'stranger must not see conversations';
  begin insert into messages (conversation_id, sender_id, body) values ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000b','intrude'); raise exception 'should have failed';
  exception when insufficient_privilege then null; end;
end $$;
-- lawyer replies, marks read; cannot edit body
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
insert into messages (conversation_id, sender_id, body) values ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000c','reply');
do $$ declare n int; begin
  update messages set read_at = now() where body = 'hello'; get diagnostics n = row_count; assert n = 1, 'recipient can mark read';
  begin update messages set body = 'tampered' where body = 'hello'; raise exception 'should have failed'; exception when others then if sqlerrm = 'should have failed' then raise; end if; end;
  update messages set read_at = now() where body = 'reply'; get diagnostics n = row_count; assert n = 0, 'sender cannot mark own message read via recipient policy';
end $$;
-- suspended lawyer can no longer post
reset role; update lawyers set verification='suspended', listed=false where id='00000000-0000-0000-0000-00000000000c';
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
do $$ begin
  begin insert into messages (conversation_id, sender_id, body) values ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000c','after suspension'); raise exception 'should have failed';
  exception when insufficient_privilege then null; end;
end $$;
-- self-registration can only create a pending, unlisted profile
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
do $$ begin
  begin insert into lawyers (id, display_name, bar_association, bar_number, verification, listed) values ('00000000-0000-0000-0000-00000000000b','X','Colegio','1','verified',true); raise exception 'should have failed';
  exception when insufficient_privilege or check_violation then null; end;
end $$;
insert into lawyers (id, display_name, bar_association, bar_number) values ('00000000-0000-0000-0000-00000000000b','Self Reg','Colegio Y','999');
reset role;
select 'MESSAGING TESTS PASSED' as result;

-- ───── 0004: lawyer contact ─────
do $$ begin
  begin update lawyers set contact_phone = '+34600111222' where id='00000000-0000-0000-0000-00000000000b'; raise exception 'should have failed';
  exception when check_violation then null; end;                       -- no consent => rejected
  begin update lawyers set contact_phone = '0600 111 222', contact_consent_at = now() where id='00000000-0000-0000-0000-00000000000b'; raise exception 'should have failed';
  exception when check_violation then null; end;                       -- not E.164 => rejected
  update lawyers set contact_phone = '+34600111222', contact_whatsapp = '+212600111222', contact_consent_at = now(), verification='verified', listed=true where id='00000000-0000-0000-0000-00000000000b';
end $$;
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
do $$ begin assert (select contact_whatsapp from lawyers where id='00000000-0000-0000-0000-00000000000b') = '+212600111222', 'verified+listed lawyer contact visible'; end $$;
-- a lawyer can withdraw contact (set null) but cannot self-verify/list
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
update lawyers set contact_phone = null, contact_whatsapp = null where id='00000000-0000-0000-0000-00000000000b';
do $$ begin assert (select contact_phone is null and contact_whatsapp is null from lawyers where id='00000000-0000-0000-0000-00000000000b'), 'contact can be withdrawn'; end $$;
reset role;
-- pending (unlisted) lawyers' contact is not public
update lawyers set contact_phone='+34600111222', contact_consent_at=now(), verification='pending', listed=false where id='00000000-0000-0000-0000-00000000000b';
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
do $$ begin assert (select count(*) from lawyers where id='00000000-0000-0000-0000-00000000000b') = 0, 'unlisted lawyer contact hidden from public'; end $$;
reset role;
select 'CONTACT TESTS PASSED' as result;

-- ───── 0005: payment disclosure acceptances ─────
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
insert into payment_disclosure_acceptances (user_id, tier, disclosure_version, locale) values ('00000000-0000-0000-0000-00000000000b','premium','2026-11-25-v1','es');
do $$ begin assert (select count(*) from payment_disclosure_acceptances) = 1, 'user can record own acceptance'; end $$;
do $$ begin begin insert into payment_disclosure_acceptances (user_id, tier, disclosure_version, locale) values ('00000000-0000-0000-0000-00000000000a','premium','v','es'); raise exception 'should have failed';
  exception when insufficient_privilege then null; end; end $$;
reset role;
do $$ begin begin update payment_disclosure_acceptances set locale = 'en'; raise exception 'should have failed';
  exception when others then if sqlerrm = 'should have failed' then raise; end if; end; end $$;
select 'DISCLOSURE TESTS PASSED' as result;
