# L'Excellence — Android & iPhone app

The website in `../` is wrapped with Capacitor. Nothing to install by hand: GitHub Actions builds both apps.

- **Android** — workflow `Build L'Excellence Android APK` → `LExcellence.apk` on GitHub Releases (tag `lexcellence-1.N`).
- **iPhone** — workflow `Build L'Excellence iOS app` → `LExcellence-unsigned.ipa` (install with Sideloadly / AltStore) or a signed IPA when the Apple secrets of the repository are set.
- **No store needed** — the site is also an installable PWA: open it in Chrome (Android) → *Install app*, or in Safari (iPhone) → Share → *Add to Home Screen*.

Local build: `npm install && npm run prepare:web && npx cap add android && npx capacitor-assets generate && npx cap sync`.
The app needs an internet connection for the 3D libraries (three.js from jsDelivr).
