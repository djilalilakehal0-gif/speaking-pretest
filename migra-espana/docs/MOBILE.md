# Mobile app (Flutter) — v0.2

**Done and tested** (`flutter analyze`: 0 errors/warnings; `flutter test`: 23 passing, incl. widget tests in Arabic/RTL):
- Four languages (es/en/fr/ar) with automatic RTL, language + light/dark switcher, preferences remembered.
- Home, "I am in Spain without papers" start page, law centre with per-pathway pages (draft/pending banners, official links),
  14-step guide, and the full eligibility check with results, document checklist and lawyer-review triggers.
- The eligibility engine is a Dart port of `web/src/lib/eligibility/engine.ts`; `test/eligibility_test.dart` mirrors the web tests.
- Dictionaries and legal seed are **generated from the web code** (single source of truth):
  `cd web && npm run export:mobile` writes `mobile/assets/i18n/*.json` and `mobile/assets/legal.json`. Re-run after editing web strings/legal data.

**Added in v0.2 (needs a configured backend):**
- Sign-in / register / password reset with timestamped consent (terms; optional AI) carried in user metadata → copied to `user_preferences` by the DB trigger.
- Document vault: camera scan (`image_picker`), PDF/JPG/PNG picker, category, expiry date (60-day warning), missing-document notice, 60-second signed-URL download, delete with confirmation. The server re-validates real file bytes.
- Lawyers: verified lawyers only (from `/api/lawyers`), booking (date/time picker; `slot_taken` / `too_soon` handled), secure messaging (8 s polling) that refuses ID/passport numbers.
- All calls go to the website's `/api/*` with `Authorization: Bearer <Supabase token>` (the web server accepts cookies or Bearer).
- Without `--dart-define` config the app shows a demo notice instead of fake data.

**Run with a backend:** `flutter run --dart-define=SUPABASE_URL=https://xxx.supabase.co --dart-define=SUPABASE_ANON_KEY=... --dart-define=API_BASE_URL=https://your-site`

**Not built yet**: case tracking screens, AI assistant, payments, push notifications (FCM), lawyer-side screens (lawyers use the website), MFA enrolment UI, OCR.
**Never verified**: these screens have only been tested against fakes (unit/widget tests), not against a live Supabase project. No Android/iOS binary has been produced:
the Android SDK / Xcode were not available where this was written, so `flutter build apk|ipa` has not been run.

Run: `cd mobile && flutter pub get && flutter run`  ·  Test: `flutter test`  ·  Build: `flutter build apk --release` (Android SDK required) or `flutter build ipa` (macOS + Xcode).
Before store release: app icon/splash, signing keys (never commit), privacy-policy URL, store listings, counsel-reviewed legal texts.
