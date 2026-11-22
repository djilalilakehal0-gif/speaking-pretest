# Architecture
Next.js (App Router, `[locale]` segment, middleware language negotiation) → `/api/*` route handlers → Supabase (Postgres + RLS + private Storage).
- **Trust model**: browser/RLS-scoped client by default; service role only in server routes that first authorise (documents signed URLs, webhooks, verification).
- **Eligibility** (`lib/eligibility`): pure, deterministic, versioned; emits codes → translated in 4 languages; unanswered ≠ no; sensitive facts → lawyer review, never rejection.
- **Legal content**: `legal_rules` (state/status/verification/reviewer CHECK) + `legal_sources`; trigger audits every change; public sees `published` only. Seed in `lib/legal/pathways.ts` shown with draft banner until DB rows exist.
- **AI**: screen → retrieve verified sections only → redact PII → model → sources & verification date attached by server. No verified context ⇒ model not called.
- **Payments**: Stripe Checkout (subscriptions, Stripe Tax); webhook verifies signature, idempotent upserts; platform fee, lawyer fee, government fee kept separate.
- **Scale-up notes**: replace in-memory rate limiter with Redis; add pgvector; separate dev/staging/prod Supabase projects.
