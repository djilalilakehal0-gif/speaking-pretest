# Mobile app — React Native (Expo) — `app/`

Replaced the Flutter prototype (still in git history at commit e4922dd) because the app now **shares the website's TypeScript code directly**:
translations (4 languages), the eligibility engine, questions, legal pathways/sources and help directory are imported from `web/src` via the `@/…` alias
(`app/metro.config.js` watches `../web/src`). One source of truth — no export step, no Dart port to keep in sync.

**Screens:** home (brand design), law centre + pathway pages, eligibility check (results, checklist, lawyer-review reasons), "no papers" start page,
14-step guide, free legal-orientation directory, sign-in/register (timestamped consent), document vault (camera scan, PDF/image picker, expiry, signed-URL
download, delete with in-app confirmation), verified lawyers (booking, secure chat refusing ID numbers, optional phone/WhatsApp), conversations.
Arabic is right-to-left via per-view `direction` (no app restart). Fonts (Cairo, Cinzel) are bundled.

**Verified here:** `npx tsc --noEmit` clean · `npx jest` 8 tests · `npx expo export --platform web` builds; the web build was driven in Chromium
(390 px): Arabic RTL, eligibility flow to results, law pages, vault demo notice, no console errors, no overflow.
**Not verified:** no Android/iOS binary built and nothing run on a device or against a live backend (Expo docs/EAS were not reachable from the build environment).

```
cd app && npm install
cp .env.example .env            # EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY / EXPO_PUBLIC_API_BASE_URL (public values only)
npx expo start                  # scan the QR with Expo Go, or press w for web
npx eas-cli@latest build -p android   # cloud build (Expo account); -p ios needs an Apple developer account, no Mac required
```
Tokens are stored in the device keychain/keystore (expo-secure-store). Without the env values the app shows a demo notice instead of fake data.
Not built yet: case tracking, AI assistant, payments, push notifications, MFA enrolment, OCR.
