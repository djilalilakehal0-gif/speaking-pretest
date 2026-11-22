# MIGRA ESPAÑA — *Tu camino legal*

Multilingual (AR/ES/FR/EN, RTL) Spanish-immigration information platform: law centre, preliminary eligibility engine,
secure document vault, verified-lawyer marketplace, case tracking, AI assistant (RAG over verified law only), Stripe billing,
admin & lawyer dashboards. **Read `PROJECT_STATUS.md` first — it states exactly what is done, tested and still missing.**

```
migra-espana/
  web/        Next.js 15 + TypeScript (site, dashboards, /api routes)
  supabase/   SQL migrations (schema, RLS, storage) + DB security tests
  mobile/     Flutter scaffold (not built — see docs/MOBILE.md)
  docs/       ARCHITECTURE, PRIVACY_AND_SECURITY, LEGAL_CONTENT_GUIDE, API, USER_GUIDE, ADMIN_GUIDE
```

## Run (works with no credentials — "demo mode", nothing persisted)
```bash
cd web && cp .env.example .env.local && npm ci
npm run dev            # http://localhost:3000  (redirects to your language)
npm test               # 65 unit tests (eligibility, i18n parity, guardrails, RBAC, uploads, plans, cases, slots)
npm run lint && npm run build
```
## Full backend
1. Create a Supabase project; apply `supabase/migrations/*.sql` in order (`supabase db push`). Fill `.env.local`.
2. DB tests (needs local Postgres): `bash supabase/tests/run-local.sh` → must print `ALL RLS / CONSTRAINT TESTS PASSED`.
3. Stripe: create 2 recurring prices, set `STRIPE_PRICE_*`, `NEXT_PUBLIC_PRICE_*_EUR`; webhook → `/api/stripe/webhook`
   (events: `customer.subscription.*`, `invoice.paid`, `charge.refunded`); enable Stripe Tax.
4. OpenAI: set `OPENAI_API_KEY`. FCM: see `.env.example` (sender not yet implemented).
5. Make your first legal editor: insert into `admin_roles` / set `users.role='legal_editor'` via SQL, enrol MFA, then publish rules.
6. Deploy web to Vercel (root dir `migra-espana/web`), set env vars. Run `npm run check:links` from a networked machine before release.

Never commit `.env*`; `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `OPENAI_API_KEY` are server-only.
