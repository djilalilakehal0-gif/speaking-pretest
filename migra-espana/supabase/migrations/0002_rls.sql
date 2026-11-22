-- MIGRA ESPAÑA — Row Level Security. Default-deny: every table has RLS on; only listed policies grant access.
-- Service-role (server only) bypasses RLS and is used solely in audited API routes.

-- ───────── helpers (security definer to avoid recursive policy evaluation) ─────────
create or replace function auth_role() returns app_role language sql stable security definer set search_path = public as
$$ select role from users where id = auth.uid() $$;

create or replace function has_staff_role(variadic roles app_role[]) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from admin_roles where user_id = auth.uid() and role = any(roles))
       or (select role = any(roles) from users where id = auth.uid()) $$;

create or replace function is_case_lawyer(p_case uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from immigration_cases c where c.id = p_case and c.lawyer_id = auth.uid()) $$;

create or replace function can_read_document(p_doc uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from documents d where d.id = p_doc and d.owner_id = auth.uid())
       or exists (select 1 from document_permissions p
                   where p.document_id = p_doc and p.grantee_id = auth.uid()
                     and p.revoked_at is null and (p.expires_at is null or p.expires_at > now())) $$;

-- enable RLS everywhere
do $$ declare t text; begin
  for t in select unnest(array[
    'users','user_profiles','user_preferences','admin_roles','legal_specialties','lawyers','lawyer_verifications',
    'legal_sources','immigration_categories','legal_rules','legal_updates','eligibility_questions',
    'eligibility_assessments','eligibility_answers','immigration_cases','case_status_history','case_tasks',
    'documents','document_permissions','document_access_logs','appointments','conversations','messages',
    'payments','invoices','subscriptions','notifications','device_tokens','reviews','support_tickets',
    'audit_logs','data_requests']) loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ───────── identity ─────────
create policy users_self_read   on users for select using (id = auth.uid() or has_staff_role('admin','super_admin','support'));
-- Users may change locale only; role / mfa flags are never user-writable.
create policy users_self_update on users for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from users where id = auth.uid()));
create policy users_admin_all   on users for all using (has_staff_role('super_admin')) with check (has_staff_role('super_admin'));

create policy profiles_self on user_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy profiles_staff_read on user_profiles for select using (has_staff_role('admin','super_admin','support'));
create policy prefs_self on user_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy admin_roles_super on admin_roles for all using (has_staff_role('super_admin')) with check (has_staff_role('super_admin'));
create policy admin_roles_self_read on admin_roles for select using (user_id = auth.uid());

-- ───────── lawyers (public directory only exposes verified + listed) ─────────
create policy specialties_read on legal_specialties for select using (true);
create policy specialties_admin on legal_specialties for all using (has_staff_role('admin','super_admin')) with check (has_staff_role('admin','super_admin'));
create policy lawyers_public_read on lawyers for select using (listed and verification = 'verified');
create policy lawyers_self_read on lawyers for select using (id = auth.uid());
create policy lawyers_self_write on lawyers for update using (id = auth.uid())
  with check (id = auth.uid() and verification = (select verification from lawyers where id = auth.uid()) and listed = (select listed from lawyers where id = auth.uid()));
create policy lawyers_self_insert on lawyers for insert with check (id = auth.uid() and verification = 'pending' and not listed);
create policy lawyers_admin on lawyers for all using (has_staff_role('admin','super_admin')) with check (has_staff_role('admin','super_admin'));
create policy lawyer_ver_self on lawyer_verifications for select using (lawyer_id = auth.uid());
create policy lawyer_ver_self_insert on lawyer_verifications for insert with check (lawyer_id = auth.uid() and status = 'pending');
create policy lawyer_ver_admin on lawyer_verifications for all using (has_staff_role('admin','super_admin')) with check (has_staff_role('admin','super_admin'));

-- ───────── legal knowledge: published = public read; writes = legal_editor+ ─────────
create policy sources_read on legal_sources for select using (true);
create policy sources_write on legal_sources for all using (has_staff_role('legal_editor','admin','super_admin')) with check (has_staff_role('legal_editor','admin','super_admin'));
create policy categories_read on immigration_categories for select using (true);
create policy categories_write on immigration_categories for all using (has_staff_role('legal_editor','admin','super_admin')) with check (has_staff_role('legal_editor','admin','super_admin'));
create policy rules_public_read on legal_rules for select using (state = 'published');
create policy rules_editor_read on legal_rules for select using (has_staff_role('legal_editor','admin','super_admin'));
create policy rules_editor_write on legal_rules for insert with check (has_staff_role('legal_editor','super_admin'));
create policy rules_editor_update on legal_rules for update using (has_staff_role('legal_editor','super_admin')) with check (has_staff_role('legal_editor','super_admin'));
-- Only legal editors can publish — admins can read but not publish legal content.
create policy updates_public_read on legal_updates for select using (state = 'published');
create policy updates_editor on legal_updates for all using (has_staff_role('legal_editor','super_admin')) with check (has_staff_role('legal_editor','super_admin'));

-- ───────── eligibility ─────────
create policy elq_read on eligibility_questions for select using (active);
create policy elq_write on eligibility_questions for all using (has_staff_role('legal_editor','admin','super_admin')) with check (has_staff_role('legal_editor','admin','super_admin'));
create policy ela_self on eligibility_assessments for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy elans_self on eligibility_answers for all
  using (exists (select 1 from eligibility_assessments a where a.id = assessment_id and a.user_id = auth.uid()))
  with check (exists (select 1 from eligibility_assessments a where a.id = assessment_id and a.user_id = auth.uid()));

-- ───────── cases ─────────
create policy cases_client on immigration_cases for select using (user_id = auth.uid());
create policy cases_client_insert on immigration_cases for insert with check (user_id = auth.uid() and status = 'new_case' and lawyer_id is null);
create policy cases_lawyer on immigration_cases for select using (lawyer_id = auth.uid());
create policy cases_lawyer_update on immigration_cases for update using (lawyer_id = auth.uid()) with check (lawyer_id = auth.uid());
create policy cases_admin on immigration_cases for all using (has_staff_role('admin','super_admin')) with check (has_staff_role('admin','super_admin'));
create policy csh_read on case_status_history for select using (
  exists (select 1 from immigration_cases c where c.id = case_id and (c.user_id = auth.uid() or c.lawyer_id = auth.uid())) or has_staff_role('admin','super_admin'));
create policy tasks_client_read on case_tasks for select using (exists (select 1 from immigration_cases c where c.id = case_id and c.user_id = auth.uid()));
create policy tasks_lawyer_all on case_tasks for all using (is_case_lawyer(case_id)) with check (is_case_lawyer(case_id));
create policy tasks_client_update on case_tasks for update
  using (exists (select 1 from immigration_cases c where c.id = case_id and c.user_id = auth.uid()) and assigned_to = auth.uid());

-- ───────── documents: owner, or explicit unexpired unrevoked grant ─────────
create policy docs_owner on documents for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy docs_granted_read on documents for select using (can_read_document(id));
create policy docperm_owner on document_permissions for all
  using (exists (select 1 from documents d where d.id = document_id and d.owner_id = auth.uid()))
  with check (exists (select 1 from documents d where d.id = document_id and d.owner_id = auth.uid()));
create policy docperm_grantee_read on document_permissions for select using (grantee_id = auth.uid());
create policy doclog_owner_read on document_access_logs for select using (exists (select 1 from documents d where d.id = document_id and d.owner_id = auth.uid()));
create policy doclog_admin_read on document_access_logs for select using (has_staff_role('admin','super_admin'));
-- inserts into document_access_logs happen server-side with the service role only.

-- ───────── appointments & messaging ─────────
create policy appt_party_read on appointments for select using (client_id = auth.uid() or lawyer_id = auth.uid() or has_staff_role('admin','super_admin','support'));
create policy appt_client_insert on appointments for insert with check (client_id = auth.uid() and status = 'requested');
create policy appt_party_update on appointments for update using (client_id = auth.uid() or lawyer_id = auth.uid());
create policy conv_party on conversations for select using (client_id = auth.uid() or lawyer_id = auth.uid());
create policy conv_client_insert on conversations for insert with check (client_id = auth.uid());
create policy msg_party_read on messages for select using (exists (select 1 from conversations c where c.id = conversation_id and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())));
create policy msg_party_insert on messages for insert with check (sender_id = auth.uid() and exists (select 1 from conversations c where c.id = conversation_id and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())));

-- ───────── money (writes only by service role via Stripe webhook) ─────────
create policy pay_self_read on payments for select using (user_id = auth.uid() or lawyer_id = auth.uid() or has_staff_role('admin','super_admin'));
create policy inv_party_read on invoices for select using (issuer_id = auth.uid() or recipient_id = auth.uid() or has_staff_role('admin','super_admin'));
create policy inv_issuer_write on invoices for insert with check (issuer_id = auth.uid() and has_staff_role('lawyer'));
create policy sub_self_read on subscriptions for select using (user_id = auth.uid() or has_staff_role('admin','super_admin'));

-- ───────── engagement ─────────
create policy notif_self on notifications for select using (user_id = auth.uid());
create policy notif_self_update on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy devtok_self on device_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reviews_public on reviews for select using (state = 'published');
create policy reviews_author_insert on reviews for insert with check (
  author_id = auth.uid() and state = 'in_review'
  and exists (select 1 from immigration_cases c where c.id = case_id and c.user_id = auth.uid() and c.lawyer_id = reviews.lawyer_id));
create policy reviews_admin on reviews for all using (has_staff_role('admin','super_admin','support')) with check (has_staff_role('admin','super_admin','support'));
create policy tickets_self on support_tickets for select using (user_id = auth.uid() or has_staff_role('support','admin','super_admin'));
create policy tickets_insert on support_tickets for insert with check (user_id = auth.uid());
create policy tickets_staff_update on support_tickets for update using (has_staff_role('support','admin','super_admin'));
create policy audit_admin_read on audit_logs for select using (has_staff_role('admin','super_admin'));
create policy dreq_self on data_requests for select using (user_id = auth.uid() or has_staff_role('admin','super_admin'));
create policy dreq_insert on data_requests for insert with check (user_id = auth.uid());

-- ───────── Storage: private 'vault' bucket, owner-folder only. Lawyers never read storage directly;
-- they receive short-lived signed URLs minted by /api/documents/[id]/signed-url after a permission check + log row.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vault','vault', false, 15728640, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy vault_owner_rw on storage.objects for all
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);
