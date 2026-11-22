# Privacy & security
Implemented: default-deny RLS; private bucket (owner folder), magic-byte upload validation, 60 s signed URLs, access log; consent timestamps
(terms, optional AI, optional doc-sharing, withdrawable); GDPR access/portability export, erasure request (soft delete → hard delete after 30 days via `apply_retention()`),
retention jobs; security headers + CSP; zod validation; AI data minimisation; append-only audit log; MFA gate on publishing; role matrix in `lib/rbac.ts`.
**Retention** (`apply_retention`): access logs 24 mo, notifications 12 mo, assessments 24 mo. Schedule it daily (pg_cron).
**Still required before launch**: DPIA; DPA with Supabase/Stripe/OpenAI (+ zero-retention API setting); counsel-reviewed privacy policy/terms; MFA enrolment UI & enforcement for lawyers/staff at login;
CAPTCHA/rate limiting on auth; encrypted backups + restore drill; incident-response runbook; pen-test; app-level OCR consent flow; reviews moderation.
**Incident response (outline)**: contain (rotate keys, disable affected routes) → assess scope via `audit_logs`/`document_access_logs` → notify AEPD within 72 h if personal-data breach → notify affected users → post-mortem.
