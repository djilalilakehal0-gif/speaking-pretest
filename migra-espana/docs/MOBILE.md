# Mobile app status — NOT DELIVERED YET

The Flutter project in `mobile/` is a **scaffold only** (theme, 4 locales/RTL, Supabase init). The Flutter SDK was
not available where this was authored, so nothing in `mobile/` has been compiled or run.

Remaining work: port the screens (onboarding, eligibility, law centre, vault with camera scan, case, lawyers, assistant),
FCM registration into `device_tokens`, store listing assets, signing. Business logic to port 1:1 from `web/src/lib`:
`eligibility/engine.ts`, `case/progress.ts`, `documents/validation.ts`. Everything else is server-side (Supabase RLS + `/api/*`),
so the app is a thin client. Run: `flutter pub get && flutter run --dart-define=SUPABASE_URL=… --dart-define=SUPABASE_ANON_KEY=…`.
