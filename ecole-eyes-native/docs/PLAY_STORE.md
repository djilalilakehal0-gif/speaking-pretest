# Preparing ÉCOLE EYES for Google Play

Status: **prepared, not submitted.** Publishing needs your Play Console account, a hosted privacy policy URL, signing key and
(for the microphone foreground service) a short demo video. Everything below is ready to paste/adapt.

## 1. Build the release bundle

```bash
./gradlew testDebugUnitTest lintDebug bundleRelease \
  -PECOLE_EYES_KEYSTORE=/secure/release.keystore -PECOLE_EYES_KEYSTORE_PASSWORD=… -PECOLE_EYES_KEY_ALIAS=… \
  -PversionCode=<n+1> -PversionName=2.0.0 \
  -PecoleEyesBackendUrl=https://<your-worker> -PecoleEyesAppToken=<token>
```

Enrol in **Play App Signing** (upload the AAB signed with your upload key). If this replaces the earlier web-wrapper build
(`com.ecoleeyes.app`), sign with the same key and use a higher `versionCode` than any previous upload.

## 2. Store listing

**App name:** ÉCOLE EYES — Voice Assistant
**Category:** Tools (or Health & Fitness › accessibility) · **Tags:** accessibility, blind, screen reader, OCR

**Short description (80):**
EN: Talk to your phone: describe surroundings, read documents, ask anything.
FR: Parlez à votre téléphone : décrit l'environnement, lit vos documents.
AR: تحدّث إلى هاتفك: يصف المحيط ويقرأ المستندات ويجيب عن أسئلتك.

**Full description (EN):**
ÉCOLE EYES is a voice-first assistant built for blind and visually impaired people. Tap the big button and speak naturally
in Arabic, French or English.
• Smart camera — ask "what is in front of me?", read signs, menus and letters, identify colors and objects, or let it describe changes as you move.
• Documents — find and read PDFs, Word files, text and photos of documents, aloud. Pause, skip, repeat, jump to a page, or ask for a summary. You choose which folders it can see.
• Ask anything — an AI assistant that remembers the conversation.
• Hands-free navigation — every screen and setting is reachable by voice; works with TalkBack.
Privacy first: cloud features only with your spoken consent, nothing saved from the camera, encrypted history you can erase by voice.
ÉCOLE EYES is not a safety device and cannot guarantee that a path is clear — keep using your cane or guide.

(FR/AR: translate from the in-app strings in `app/src/main/res/values-fr|ar/strings.xml`; the privacy text is already translated.)

**Graphics needed (not generated here):** 512×512 icon (use `ecole-eyes/assets/icon-only.png`), 1024×500 feature graphic,
≥ 2 phone screenshots (take them on a device; include Arabic RTL).

## 3. App content declarations

* **Privacy policy URL:** host `PRIVACY.md` (e.g. GitHub Pages) and fill in contact + date first.
* **Ads:** none. **Target audience:** 13+ (not for children). **App access:** all features reachable without login; the AI
  features need the publisher's backend to be online (tell reviewers; provide nothing else).
* **Accessibility:** declare that the app is designed for TalkBack users (no AccessibilityService is used).
* **Content rating:** questionnaire → expect "Everyone". No user-generated content shared between users.

### Data safety form (answers)

| Data type | Collected | Shared | Purpose | Notes |
|---|---|---|---|---|
| Audio (voice) | **Yes, processed by the device's speech service**; not by the app | No | App functionality | App never records/stores audio. Declare conservatively: *collected, processed ephemerally, not shared*. |
| Photos | Yes (only on user request) | Yes — to AI processing provider (service provider) | App functionality | Not stored. Optional (consent). |
| Files / docs (text) | Yes (only on user request) | Yes — to AI processing provider | App functionality | Optional (consent). |
| App interactions / messages | Yes — the user's request text | Yes — to AI processing provider | App functionality | |
| Approximate/precise location | **Yes, only on request** (emergency "share my location") | No (the user sends it by SMS themselves) | App functionality | Not stored, not sent to the AI service. |
| Contacts | **Yes, only on request** (call by name) | No | App functionality | Processed on device only. |
| Anything else (device IDs, ads, analytics) | No | — | — | |

* Data **encrypted in transit:** yes (HTTPS only). **Users can request deletion:** yes (in-app clear history; nothing stored server-side).
* Processing by Anthropic through your backend counts as a **service provider**; check your final backend/logging setup
  before submitting and amend the form if you add logging.

### Permission declarations

| Permission | Why (use in Console text) |
|---|---|
| `RECORD_AUDIO` | Core feature: voice commands. Requested only after a spoken explanation, when the user taps the voice button. |
| `CAMERA` | Core feature: describe surroundings/read text on request. Not required to install (`uses-feature` optional). |
| `INTERNET`, `ACCESS_NETWORK_STATE` | Reach the AI service; explain "no connection" to the user. |
| `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MICROPHONE` | Optional *hands-free listening* the user turns on; visible notification with a Stop action. **Console requires a declaration and a short video** showing: Settings → turn on hands-free → notification visible → say "Hello École Eyes" → turn off. |
| `POST_NOTIFICATIONS` | Show the hands-free notification (Android 13+). Optional. |
| `VIBRATE`, `MODIFY_AUDIO_SETTINGS` | Haptic confirmations; volume adjust by voice. |
| `CALL_PHONE` | "Call Ahmed" / emergency contact for blind users who cannot use the dialer easily. Always confirmed aloud first; never used for emergency numbers (those only open the dialer). Declined → falls back to the dialer. |
| `READ_CONTACTS` | Find the person to call by spoken name. On-device only. |
| `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | Emergency "share my location": one-time read, put into an SMS the user sends. Foreground only, no background location. |
| `BIND_NOTIFICATION_LISTENER_SERVICE` (service) | Optional "read my notifications". Enabled by the user in system settings; content stays in memory. Mention it in the accessibility-tool description. |

No `READ_EXTERNAL_STORAGE`/`MANAGE_EXTERNAL_STORAGE`/media permissions: files are accessed only via the system picker (SAF),
which also avoids the "all files access" policy review.

## 4. Pre-launch checklist

- [ ] Replace placeholders in `PRIVACY.md`; host it; paste URL in Console.
- [ ] Deploy backend, set a spend cap on the provider key, set `APP_TOKEN`, consider the worker rate limiter.
- [ ] Bump `versionCode`; build signed AAB; upload to **Internal testing** first.
- [ ] Run the device checklist below on ≥ 2 phones (one Android 14+, one older), with and without TalkBack.
- [ ] Recruit blind/low-vision testers (closed testing track) — their feedback outweighs everything here.
- [ ] Record the foreground-service video; fill declarations; complete Data safety + content rating.
- [ ] Play pre-launch report (accessibility checks) reviewed.

## Device test checklist

1. Fresh install: welcome + consent are spoken; refusing consent keeps cloud off and says so.
2. Mic denied → spoken reason, then spoken refusal message. Same for camera.
3. TTS voices: switch to Arabic/French/English by voice; with a voice missing, the spoken English fallback explains.
4. "What is in front of me?" in a lit room, a dark room (should say too dark), with the camera covered.
5. "Read the text" on a French/English page offline; on an Arabic page with cloud on and off.
5b. Airplane mode: "describe what is in front of me" (on-device estimate), "what colour is this" on red/blue/white/brown
    objects, "is there anyone in front of me" with a person and without, "what works offline".
5c. "Emergency École Eyes" with and without an emergency contact: confirm the call happens only after "yes", that 112/your
    number opens the dialer (not a direct call), and "share my location" prepares an SMS with a working maps link.
5d. "Call <contact>", "call 0555…", "open WhatsApp", "take a note …", "read my notes", "remind me in 2 minutes to …"
    (with the screen off and the app in the background), "read my notifications" (before and after granting access).
6. Folder grant → "Find a document named …" → "Read it" → pause / next page / repeat / kill the app / "continue" resumes.
7. Scanned PDF and a photo of a page; a password-protected PDF; a `.doc`; a 100-page PDF (responsiveness).
8. Airplane mode: friendly spoken messages; local reading still works.
9. Hands-free: on/off, notification Stop button, behaviour after screen off and on Android 14+.
10. TalkBack on: every control announces a sensible label; focus order; no double-speaking that hides information.
11. 10-minute continuous description walk: spoken only on change, stops when told, battery/thermal acceptable.
