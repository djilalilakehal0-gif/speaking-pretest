# API (all JSON, `Cache-Control: no-store`, errors `{error: code}`)
| Route | Auth | Notes |
|---|---|---|
| POST `/api/assistant` | optional | `{question, locale, consent:true}` → `{answer, sources, verifiedOn, escalate}`; `refused`/`noSources` cases; 15 req/min |
| GET/POST `/api/documents` | user | multipart `file, category, expires_on`; PDF/JPG/PNG ≤15 MB, content sniffed |
| GET `/api/documents/:id/signed-url` | owner/grantee | 60 s URL, logged |
| DELETE `/api/documents/:id` | owner | |
| POST/DELETE `/api/documents/:id/share` | owner | needs doc-sharing consent; verified lawyers only; `?lawyerId=` to revoke |
| POST/PATCH `/api/cases` | user/lawyer | PATCH validates transitions |
| GET `/api/lawyers` | public | verified+listed only |
| POST/PATCH `/api/appointments` | user / parties | 409 `slot_taken` on overlap |
| POST/DELETE `/api/gdpr/request`, POST `/api/gdpr/consent`, GET `/api/gdpr/export` | user | |
| POST `/api/stripe/checkout` · `/api/stripe/webhook` | user · Stripe signature | |
| POST `/api/admin/lawyers` · `/api/admin/legal-publish` | admin · legal editor+MFA | audited |
| GET/POST `/api/conversations` | user | list mine / open with a **verified** lawyer (DB policy enforces) |
| GET/POST `/api/conversations/:id/messages` | parties | rejects ID-number-like text (`identifier_in_message`); notifies the other party; 30 msg/min |
| POST `/api/lawyers/register` | user | creates a PENDING, unlisted profile only; admin verification grants the `lawyer` role |

All routes accept `Authorization: Bearer <Supabase access token>` (mobile) or the session cookie (web).
| PATCH `/api/lawyers/me` | lawyer | edit or withdraw public phone/WhatsApp (E.164; consent required; no numbers = removal) |
