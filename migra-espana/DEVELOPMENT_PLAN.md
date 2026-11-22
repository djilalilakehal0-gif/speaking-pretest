# Development plan
| Phase | Scope | State |
|---|---|---|
| 1 Architecture | monorepo, schema, env | done |
| 2 Brand/UI | navy/gold system, logo, light/dark, RTL, 4 languages | done (web); mobile not started |
| 3 Backend | schema, RLS, storage, auth, APIs | done, DB-tested on Postgres 16; **not run against a live Supabase project** |
| 4 Legal system | law centre, engine, guides, versioning/audit | engine+UI done; **content only partly verified** (see status) |
| 5 Marketplace | verification, booking, lawyer dashboard | basic flows done; messaging/invoicing/tasks UI pending |
| 6 AI | RAG over verified rules, guardrails, redaction | done; needs OPENAI key; keyword retrieval (pgvector later) |
| 7 Payments | Stripe checkout/webhook/tiers | coded, **untested against Stripe** |
| 8 Admin | lawyer verification, legal publish, audit view | basic; analytics/user mgmt pending |
| 9 Testing | unit + DB + browser smoke | done for what exists |
| 10 Deploy | CI, docs | CI written; no deployment performed; mobile builds pending |
