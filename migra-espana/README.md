# Project status (2026-11-22)

## Honest summary
A working, tested **web foundation** and **database/security layer**. It is **not** the complete ecosystem in the brief:
no native apps, no live backend/Stripe/OpenAI verification, and most legal content still awaits a qualified legal editor.

## Verified here
- `npm test`: 65 passing · `tsc` clean · `next build` OK (87 pages).
- DB: migrations apply on Postgres 16; `rls.test.sql` proves: document isolation, grant/revoke/expiry, no role escalation,
  draft law hidden + publish needs date/reviewer, audit append-only, only verified lawyers listed, no double-booking,
  case history automatic, payments not user-writable, consent captured at signup.
- Browser (Chromium): 14 pages × 4 languages — correct `dir`, no overflow at 390px, no console/hydration errors;
  Arabic eligibility flow end-to-end; assistant disabled without consent.

## Legal content — READ
Only facts I confirmed in BOE (RD 1155/2024 arts. 125, 127; preamble 2-year rule; RD 316/2026 amending art. 132.2.a) are
populated, flagged *draft* until a legal editor publishes. Other pathways show "pending verification"; **no fees, forms, deadlines or
procedure steps were invented** (they display pending). The 2-year continuity wording, art. 126 criminal-record rule, fees (modelo 790) and
extraordinary-regularisation status must be checked by a lawyer. Non-Spanish translations are marked *not legally reviewed*.
URL IDs for LO 4/2000 and Ley 12/2009 and all ministry links are **unverified** (sandbox blocked outbound checks) → run `npm run check:links`.
Privacy/Terms text are templates needing counsel review; a DPIA is required (sensitive data + AI) and not yet done.

## Checklist
- [x] Schema/RLS/storage/retention · [x] 4-language UI + RTL · [x] eligibility engine (17+2 Qs, 3 buckets, no auto-reject)
- [x] Law centre (13 groups) · [x] 14-step guide · [x] vault (upload/sniff/signed URL/share/revoke/log/delete)
- [x] AI assistant w/ guardrails, PII redaction, verified-only retrieval · [x] Stripe checkout+webhook · [x] booking + overlap guard
- [x] Case timeline/progress/transitions · [x] admin: lawyer verification, publish, audit · [x] GDPR export/erasure/consent
- [x] Flutter app v0.1 (info + eligibility, 4 languages/RTL; 13 tests) — no APK/IPA built, no backend screens yet · [ ] OCR/auto-classification · [ ] FCM sender · [ ] secure messaging UI · [ ] invoices/PDFs
- [ ] lawyer onboarding/registration UI & MFA enrolment UI · [ ] admin analytics/user mgmt/CMS editor UI
- [ ] reviews UI · [ ] video consult · [ ] pgvector retrieval · [ ] e2e tests against live Supabase/Stripe · [ ] DPIA, store assets, deploy
