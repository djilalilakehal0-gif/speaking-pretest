# دليل إعداد Supabase خطوة بخطوة (Supabase setup guide)

الهدف: تشغيل الخادم الحقيقي (حسابات، مستندات، مراسلة) وتجربته. الأوامر بالإنجليزية كما هي.
Goal: run the real backend and test it end to end. Use a **separate project for testing** (staging) before production.

## 1. Create the project
1. supabase.com → New project. Choose a **EU region** (e.g. Frankfurt / Paris) — personal data of people in Spain should stay in the EU.
2. Save the database password in a password manager. Never put it in the repo.
3. Project settings → API: copy **Project URL**, **anon key** (public) and **service_role key** (SECRET: server only).

## 2. Apply the database
Option A (SQL editor): open `supabase/migrations/0001_schema.sql`, run it; then `0002_rls.sql`; then `0003_messaging.sql`. Run them **in order**, each once.
Option B (CLI): `npm i -g supabase && supabase login && supabase link --project-ref <ref> && supabase db push`.
Check: Table editor shows ~30 tables with the "RLS enabled" badge; Storage shows a **private** bucket `vault`.

## 3. Authentication settings (Authentication → Providers / Settings)
- Email provider **on**; **Confirm email** on; minimum password length **10** (the forms already require 10).
- Site URL = your website URL; add `http://localhost:3000` under Redirect URLs while testing.
- Enable **MFA (TOTP)**. Lawyers and staff must enrol before privileged actions (the enrolment screen is not built yet — see PROJECT_STATUS.md).
- Turn on CAPTCHA / rate limits for sign-up before launch.

## 4. Environment variables
`web/.env.local` (copy `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=...        NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...       # server only, never NEXT_PUBLIC_
OPENAI_API_KEY=...                  # optional, for the assistant
```
Then `cd web && npm ci && npm run dev`. The site leaves demo mode automatically.

## 5. First administrator
1. Register normally in the app with your e-mail and confirm it.
2. Edit the e-mail in `supabase/bootstrap-admin.sql` and run it in the SQL editor.
3. Open `/es/admin` — you should see the admin panel. Give the **legal_editor** role only to a qualified lawyer.

## 6. Smoke test (≈ 15 minutes) — tick each
- [ ] Register user A (confirm e-mail) · log out · log in · reset password.
- [ ] `/documents`: upload a **dummy** PDF (never a real passport); download it; delete it. In SQL editor: `select * from document_access_logs;` shows the entries.
- [ ] Register user B. User B's `/documents` must be empty (isolation).
- [ ] User B opens `/es/lawyer/register`, submits. As admin, `/es/admin` lists B as pending → approve. B now appears in `/es/lawyers`.
- [ ] User A: Lawyers → Message B → send text; B replies at `/es/messages`. Try sending `X1234567L` → must be refused.
- [ ] Admin: suspend B (SQL: `update lawyers set verification='suspended', listed=false where ...`) → B can no longer post.
- [ ] Book an appointment twice for the same time → second must say the slot is taken.
- [ ] GDPR: `/api/gdpr/export` (while logged in) downloads your data.
**Never test with real people's immigration documents.**

## 7. Stripe (optional for first tests)
Use **test mode** keys. Create 2 recurring prices → `STRIPE_PRICE_PREMIUM_MONTHLY`, `STRIPE_PRICE_PROFESSIONAL_MONTHLY`; set display prices in `NEXT_PUBLIC_PRICE_*_EUR`.
Webhook endpoint `https://<site>/api/stripe/webhook` with events `customer.subscription.created|updated|deleted`, `invoice.paid`, `charge.refunded`; put the signing secret in `STRIPE_WEBHOOK_SECRET`. Local: `stripe listen --forward-to localhost:3000/api/stripe/webhook`. Enable Stripe Tax; decide VAT treatment with your accountant.

## 8. Deploy the website (Vercel)
Import the repo → Root Directory `migra-espana/web` → add the env vars above (Production **and** Preview; use staging keys for Preview) → Deploy. Add your domain; update the Supabase Site URL and Stripe webhook URL to it.

## 9. Mobile app against this backend
```
cd mobile && flutter run \
  --dart-define=SUPABASE_URL=https://<ref>.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=<anon key> \
  --dart-define=API_BASE_URL=https://<your site>
```
Android emulator + local web server: use `API_BASE_URL=http://10.0.2.2:3000`.

## 10. Before real users
Legal-editor review of all legal texts · DPIA · counsel-reviewed privacy/terms · DPAs with Supabase/Stripe/OpenAI · backups + a restore drill (Database → Backups, point-in-time recovery on a paid plan) · pg_cron retention (see `bootstrap-admin.sql`) · MFA enforcement · penetration test.
