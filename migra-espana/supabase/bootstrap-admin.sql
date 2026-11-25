-- Run ONCE in the Supabase SQL editor after the first admin has signed up through the app.
-- Replace the e-mail. Roles: 'super_admin' (break-glass), 'admin', 'legal_editor', 'support'.
-- Keep super_admin to one or two people. A legal editor should be a qualified lawyer, not a developer.
update public.users set role = 'super_admin' where email = 'CHANGE-ME@example.com';

-- Optional: extra staff roles on top of the primary role (a person can hold several).
-- insert into public.admin_roles (user_id, role)
--   select id, 'legal_editor' from public.users where email = 'editor@example.com';

-- Daily retention job (GDPR storage limitation). Requires the pg_cron extension (Database > Extensions).
-- select cron.schedule('migra-retention', '15 3 * * *', $$ select public.apply_retention(); $$);
