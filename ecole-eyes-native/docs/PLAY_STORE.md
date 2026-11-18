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
* **Accessibility:** declare that the app is designed for TalkBack users (no AccessibilityService is used; phone control
  uses public intents only — opening apps, alarms, calls with confirmation, notification access the user enables).
* **Content rating:** questionnaire → expect "Everyone". No user-generated content shared between users.

### Data safety form (answers)

| Data type | Collected | Shared | Purpose | Notes |
|---|---|---|---|---|
| Audio (voice) | **Yes, processed by the device's speech service**; not by the app | No | App functionality | App never records/stores audio. Declare conservatively: *collected, processed ephemerally, not shared*. |
| Photos | Yes (only on user request) | Yes — to AI processing provider (service provider) | App functionality | Not stored. Optional (consent). |
| Files / docs (text) | Yes (only on user request) | Yes — to AI processing provider | App functionality | Optional (consent). |
| App interactions / messages | Yes — the user's request text | Yes — to AI processing provider | App functionality | |
| Contacts | **Read on the device only**, when the user says "call <name>" | No | App functionality | Names/numbers are matched on the phone and never uploaded or stored. If the user asks the *AI* to call someone, only the name they said is sent. |
| Notifications (in-app messages from other apps) | Only if the user enables notification access, and only when they ask | Yes — to AI processing provider **only** when the user asks the AI about them (the local command "read my notifications" stays on the phone) | App functionality | Kept in memory (30 most recent), never written to disk. |
| Anything else (location, device IDs, ads) | No | — | — | |

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
| `CALL_PHONE` | "Call Mum": places the call after the user says **yes** to a spoken confirmation. Requested only at the first call, with a spoken reason; if refused, the app opens the dialer instead. Core accessibility use: a blind user cannot easily find the call button. |
| `READ_CONTACTS` | Find the contact the user named. Requested only at the first call-by-name, with a spoken reason. Read on the device, never uploaded or stored. |
| `SET_ALARM` (normal) | "Set an alarm for 7" / timers through the clock app (`AlarmClock` intents). |
| `<queries>` launcher intent | "Open WhatsApp": lists launcher apps only. **No `QUERY_ALL_PACKAGES`.** |
| Notification listener (`BIND_NOTIFICATION_LISTENER_SERVICE`) | "Read my notifications". Inactive until the user enables it in Android settings (the app explains how, aloud). Play allows notification access for accessibility apps; describe this use in the listing and the Data safety form. |

**Policy note — `CALL_PHONE` / `READ_CONTACTS`:** not in Play's restricted SMS/Call-Log group, so no permission declaration form is
needed, but reviewers check that use matches the listing. Mention "call your contacts by voice" in the full description.
The app does **not** request `READ_CALL_LOG`, `SEND_SMS`, `READ_SMS` or `ANSWER_PHONE_CALLS`.

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
6. Folder grant → "Find a document named …" → "Read it" → pause / next page / repeat / kill the app / "continue" resumes.
7. Scanned PDF and a photo of a page; a password-protected PDF; a `.doc`; a 100-page PDF (responsiveness).
8. Airplane mode: friendly spoken messages; local reading still works.
9. Hands-free: on/off, notification Stop button, behaviour after screen off and on Android 14+.
10. TalkBack on: every control announces a sensible label; focus order; no double-speaking that hides information.
11. 10-minute continuous description walk: spoken only on change, stops when told, battery/thermal acceptable.
12. Phone control, in each language: "open WhatsApp" / "ouvre YouTube" / "افتح الخرائط"; an app that is not installed.
13. "Set an alarm for 7:30 pm", "réveille-moi à 6 heures", "اضبط منبه الساعة 7" → alarm visible in the Clock app, **not
    shown on screen** (EXTRA_SKIP_UI; some clock apps ignore it). "Set a timer for 2 minutes" → timer rings.
14. "Call <contact>" → contacts permission reason → spoken confirmation → "no" cancels, "yes" calls. Refuse the phone
    permission → dialer opens and the spoken hint locates the call button. "Call 0555 …" spoken as digits.
15. "Read my notifications" without access → offer → settings page opens on École Eyes → enable → ask again → read.
16. "Battery level", "what's the date", "turn on Wi-Fi" (settings page opens, spoken explanation).
17. Android 14+: with the app in English, speak French → transcribed in French and answered in French (recognizer
    language detection; depends on the installed recognizer). Turn the setting off → no switching.
