# Project status (2026-11-22)

## Honest summary
A working, tested **web foundation** and **database/security layer**. It is **not** the complete ecosystem in the brief:
no native apps, no live backend/Stripe/OpenAI verification, and most legal content still awaits a qualified legal editor.

## Verified here
- `npm test`: 74 passing · `tsc` clean · `next build` OK (87 pages).
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
- [x] Mobile app in React Native (Expo), sharing the website's engine/translations/legal data; sign-in, vault with camera scan, lawyers, booking, secure chat, legal centre, eligibility (tsc clean, 8 tests, web build driven in a browser) — no APK/IPA built, not tried on a device or live backend
- [x] Pre-payment disclosure (DRAFT text, 4 languages, versioned): full text + unticked box before checkout; acceptance stored append-only (migration 0005); checkout refuses payment without a recent acceptance of the current version. Verified: DB tests, 83 web tests, pricing UI in a browser. NOT verified against Stripe. Text needs lawyer review; refund terms still placeholders.
- [x] Optional lawyer phone/WhatsApp (E.164, explicit consent, DB-enforced; public only when verified+listed; withdrawable) · [x] free legal-orientation organisations (UNHCR-sourced, numbers unverified by call)
- [x] Lawyer self-registration → admin verification → role grant · [x] secure messaging (DB-enforced: verified lawyers only, immutable messages, suspension cuts access, ID numbers refused) · [ ] OCR/auto-classification · [ ] FCM sender · [ ] invoices/PDFs
- [ ] MFA enrolment UI (lawyers/staff should be forced to enrol before replying/verifying) · [ ] admin analytics/user mgmt/CMS editor UI
- [ ] reviews UI · [ ] video consult · [ ] pgvector retrieval · [ ] e2e tests against live Supabase/Stripe · [ ] DPIA, store assets, deploy
