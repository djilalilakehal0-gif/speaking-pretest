# Mobile app (Flutter) — v0.1

**Done and tested** (`flutter analyze`: 0 errors/warnings; `flutter test`: 13 passing, incl. widget tests in Arabic/RTL):
- Four languages (es/en/fr/ar) with automatic RTL, language + light/dark switcher, preferences remembered.
- Home, "I am in Spain without papers" start page, law centre with per-pathway pages (draft/pending banners, official links),
  14-step guide, and the full eligibility check with results, document checklist and lawyer-review triggers.
- The eligibility engine is a Dart port of `web/src/lib/eligibility/engine.ts`; `test/eligibility_test.dart` mirrors the web tests.
- Dictionaries and legal seed are **generated from the web code** (single source of truth):
  `cd web && npm run export:mobile` writes `mobile/assets/i18n/*.json` and `mobile/assets/legal.json`. Re-run after editing web strings/legal data.

**Not built yet**: login/register, document vault with camera scan, case tracking, lawyer directory/booking, AI assistant, payments,
push notifications (FCM). These call the same `/api/*` + Supabase backend as the website. No Android/iOS binary has been produced:
the Android SDK / Xcode were not available where this was written, so `flutter build apk|ipa` has not been run.

Run: `cd mobile && flutter pub get && flutter run`  ·  Test: `flutter test`  ·  Build: `flutter build apk --release` (Android SDK required) or `flutter build ipa` (macOS + Xcode).
Before store release: app icon/splash, signing keys (never commit), privacy-policy URL, store listings, counsel-reviewed legal texts.
