# ÉCOLE EYES — AI voice assistant for blind and visually impaired people

Native Android app (Kotlin, Jetpack Compose, Material 3). The user speaks; the app understands, acts and answers aloud in
**Arabic, French or English**. It describes the surroundings through the camera, reads signs and documents, finds and reads
files the user has authorized, answers questions, and can be navigated entirely by voice.

> This is the native successor of the web/Capacitor prototype in [`../ecole-eyes`](../ecole-eyes) (same `applicationId`,
> `com.ecoleeyes.app`, so signing with the same key makes it update in place).

## Verification status — please read

| Area | Status |
|---|---|
| Voice-command understanding (3 languages, language switching, ambiguity handling) | ✅ 27 unit tests covering ~200 spoken phrases |
| AI client: backend protocol, retries, timeouts, offline, auth/rate-limit/server errors | ✅ tested against a mock server |
| AI tool-calling loop, conversation memory, follow-up context | ✅ tested with a scripted model |
| Controller behaviour end to end (permissions → spoken rationale, consent, errors in AR/FR/EN, navigation, hands-free wake phrase) | ✅ 29 Robolectric tests with fake speech/AI/camera |
| Reading real PDF / DOCX / RTF / DOC / TXT files, paging, resume position, pause/skip/repeat | ✅ real generated files through the real loader |
| File search ranking (accents, Arabic, typos), SAF-only access model | ✅ tested (ranking); folder scan itself is **not** device-tested |
| Encrypted history, hashed reading positions, settings persistence, all strings × 3 languages | ✅ tested |
| Backend proxy (auth, validation, model allow-list, size/rate limits) | ✅ 15 Node tests |
| Debug APK, R8-minified release APK, release AAB; Android Lint | ✅ build and lint clean |
| **Real TextToSpeech / SpeechRecognizer / CameraX / ML Kit OCR / PdfRenderer-OCR of scanned pages** | ⚠️ **not run on a device** (no emulator or phone was available) |
| Compose accessibility tests, TalkBack session | ⚠️ written (`app/src/androidTest`) and compiled, **not executed** |
| Foreground "hands-free" service on Android 14+, battery behaviour | ⚠️ not run on a device |
| Quality of real AI answers | ⚠️ needs your backend + API key; prompts are designed, answers unmeasured |

Treat the ⚠️ rows as the first things to test on a real phone (checklist in [`docs/PLAY_STORE.md`](docs/PLAY_STORE.md#device-test-checklist)).
Nothing here claims a feature "works" beyond the ✅ rows.

## Features

* **Voice engine** — `SpeechRecognizer` → local command parser (offline, 3 languages) → otherwise the AI (tool calling) →
  `TextToSpeech`, sentence by sentence, interruptible. Tap the big button while it speaks to interrupt; optional
  "interrupt when I talk" mode; optional hands-free wake phrase "Hello École Eyes" (foreground service, user-controlled).
* **Smart camera** — CameraX; "what is in front of me", colors, doors/chairs, people, "is there an obstacle", reading text,
  continuous mode ("stay with me…") that only calls the AI when the picture really changed and the assistant is quiet.
  The assistant states uncertainty, never claims safety, and says so when the photo is too dark.
* **OCR** — on-device ML Kit for Latin text (offline); Arabic script and handwriting use the cloud transcriber when allowed
  (ML Kit has no Arabic model). The assistant says clearly when it cannot read something.
* **Documents** — only folders/files the user grants through the Android Storage Access Framework (revocable in the app).
  PDF (text + scanned pages via OCR), DOC (best effort), DOCX, TXT, RTF, JPG/JPEG/PNG. Search by name (typo/accents/Arabic
  tolerant), "read my latest PDF", pause/resume/skip/repeat/page jumps, remembered position, AI summaries.
* **Accessibility first** — every control labelled, roles/states, headings, ≥ 72 dp targets, 220 dp voice button, haptics and
  earcons, high-contrast dark theme, large type, RTL for Arabic, nothing conveyed by colour alone.
* **Privacy by design** — spoken consent before any cloud use, spoken notice before each photo/document upload, nothing
  saved to storage, history encrypted with an Android-Keystore key and clearable by voice, no analytics, no ads.

## Quick start

Requirements: JDK 17+ (21 works), Android SDK 35 (`platforms;android-35`, `build-tools;35.0.0`), Node 20+ for the backend.

```bash
cd ecole-eyes-native
echo "sdk.dir=$ANDROID_HOME" > local.properties
./gradlew testDebugUnitTest lintDebug assembleDebug        # tests + lint + APK
# APK: app/build/outputs/apk/debug/app-debug.apk   (package com.ecoleeyes.app.debug)
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 1. Deploy the AI backend (keeps the API key off the phone)

```bash
cd backend && npm install
npx wrangler login && npx wrangler deploy
npx wrangler secret put ANTHROPIC_API_KEY      # your provider key — lives only on Cloudflare
npx wrangler secret put APP_TOKEN              # any long random string
npm test                                       # 15 tests
```

The app only ever talks to `https://<your-worker>/v1/messages`; the worker validates requests (token, model allow-list,
whitelisted fields, size cap, optional rate limit) and adds the key. See [`backend/worker.js`](backend/worker.js).
The provider is an interface in the app (`AiClient`), so another multimodal model/backend can replace
`ClaudeProxyClient`.

### 2. Point the app at it

Either bake it in at build time (`gradle.properties` or `-P` flags):

```properties
ecoleEyesBackendUrl=https://ecole-eyes-proxy.<you>.workers.dev
ecoleEyesAppToken=<same value as APP_TOKEN>
ecoleEyesModel=claude-sonnet-5-5          # optional
```

…or enter the address/token in **Settings → AI backend** on the phone (stored in EncryptedSharedPreferences).
Without a backend the app still works for everything local (commands, documents, Latin OCR) and *says* what is unavailable.

> The app token ships inside the APK, so it is a **speed bump, not real authentication**: someone who unpacks the APK can
> read it. Use the worker's rate limit, keep a spend cap on the API key, rotate the token, and add per-install attestation
> (Play Integrity) before a large public launch.

### 3. Phone setup for good voices

Settings → System → Text-to-speech → install the **Arabic**, **French** and **English** voice data of your TTS engine.
If a voice is missing the app says so (in English) instead of staying silent.

## Using it

| Say | Does |
|---|---|
| "Hello École Eyes" / "What can you do?" | greeting / help |
| "Open the camera" · "Describe what is in front of me" · "Read the text" | camera, scene description, OCR |
| "What color is this?" · "Is there a person in front of me?" · "Where is the chair?" | AI vision (uses a fresh photo) |
| "Stay with me and describe what changes" · "Stop" | continuous assistance |
| "Show me my files" · "Find a document named invoice" · "Read my latest PDF" | authorize folder, search, read |
| "Pause" · "Continue" · "Next page" · "Go to page 5" · "Repeat the last paragraph" · "Summarize this document" | reader |
| "Increase the volume" · "Speak faster" · "Speak French / تكلم بالعربية" | speech settings, language |
| "Go back" · "Go home" · "Open settings" · "Repeat the last answer" · "Stop" · "Close the application" | navigation |
| "Clear my history" | wipes conversation + reading positions |

Anything else is understood by the AI, including follow-ups ("What is next to the laptop?").

## Architecture

Single Gradle module `:app`, one package per feature area (a modular split into Gradle modules is mechanical because
dependencies already point one way; it was not done to keep builds fast and the project reviewable):

```
com.ecoleeyes
├─ core/        Lang, L10n (strings in any language), SettingsStore (encrypted), TextCipher (Keystore AES-GCM), Connectivity
├─ voice/       CommandParser + TextNorm (3-language NLU), Speaker/AndroidSpeaker (TTS), SpeechListener/AndroidSpeechListener (STT), ListeningService
├─ ai/          AiClient/ClaudeProxyClient (retry, typed errors), Tools, Prompt, AssistantBrain (tool loop + memory)
├─ vision/      CameraHub (CameraX bridge), OcrEngine (ML Kit + cloud), ContinuousAssist (change detection), ImageQuality
├─ docs/        DocIndex (SAF grants + scan), DocSearch, Extractors (DOCX/RTF/DOC/TXT), DocumentLoader (PDF/images), Paginator, ReaderSession
├─ data/        Room: encrypted messages + hashed-key reading positions
├─ a11y/        Feedback (earcons + haptics)
├─ controller/  AssistantController — the conductor: listen → understand → act → speak; permissions, consent, errors → words
└─ ui/          Compose screens (Home, Assistant, Camera, Documents/Files, Settings, Privacy), theme, components
backend/        Cloudflare Worker proxy + tests
```

Data flow: mic → `SpeechListener` → `CommandParser` → *local command* **or** `AssistantBrain` (→ model → tool calls →
`AssistantController.runTool` → camera/doc/navigation → result back to model) → `Speaker`. Every exception is mapped to a
spoken sentence in the user's language (`AssistantController.explain`, `sttMessage`, per-feature messages).

## Privacy, security, permissions

* Permissions asked only at the moment of need, **with a spoken reason first**: microphone (voice), camera (photos on
  request), notifications + foreground-service-microphone (only for the optional hands-free mode).
* Files: **no storage permission at all** — SAF grants only. Grants are Android persisted URI permissions.
* Cloud use needs explicit consent (spoken yes/no on first run; toggle in Settings). Photos are downscaled, sent once, never
  saved. Document text is sent only when you ask for a summary/explanation. A spoken notice precedes each upload (switchable).
* Local storage: history = AES-256-GCM (Keystore key, never exported); reading positions keyed by SHA-256 of the URI;
  settings/token = EncryptedSharedPreferences; `allowBackup=false`; cleartext traffic off; no logging of content.
* Speech recognition is done by the phone's recognizer, which may send audio to its provider unless "prefer on-device" is
  on — disclosed in the in-app policy ([`PRIVACY.md`](PRIVACY.md)).
* DOCX parsing hardened (no DTD/entities, size cap); PDFs copied to cache only while open, then deleted.

## Limits you should know (and the app tells the user)

* Camera descriptions can be wrong; it is **not a safety device** and never says a path is safe.
* Arabic-script OCR/handwriting need the cloud; embedded-text Arabic PDFs may extract in the wrong order (cloud OCR is used when allowed).
* Legacy `.doc` is best effort (user is warned); convert to `.docx` for reliability. Password-protected PDFs are refused.
* Hands-free mode: Android 14+ only starts microphone services while the app is visible, may stop them to save battery, and
  some recognizers beep on each restart. It is a convenience, not an always-on assistant. Android offers no way for an app to
  control other apps or system settings by voice without an AccessibilityService, which this app deliberately does **not** use.
* "Interrupt when I talk" can hear the phone's own voice; best with headphones.
* The embedded app token is extractable (see above).

## Testing

```bash
./gradlew testDebugUnitTest            # 160 JVM + Robolectric tests (first run downloads Robolectric's Android jars)
./gradlew lintDebug
./gradlew connectedDebugAndroidTest    # needs a device/emulator: Compose accessibility + navigation tests (not run in CI here)
(cd backend && npm test)
```

For a real TalkBack session: enable TalkBack, open the app, and confirm the home screen reads its heading, the voice button
state and each tile; the assistant's own speech and TalkBack can overlap, so test with TalkBack's speech rate lowered.

## Release

```bash
./gradlew bundleRelease \
  -PECOLE_EYES_KEYSTORE=/path/release.keystore -PECOLE_EYES_KEYSTORE_PASSWORD=… -PECOLE_EYES_KEY_ALIAS=…
# app/build/outputs/bundle/release/app-release.aab (Play)  ·  assembleRelease → signed APK
```

Never commit the keystore. CI: [`.github/workflows/build-ecole-eyes-native.yml`](../.github/workflows/build-ecole-eyes-native.yml).
Google Play preparation (listing text, Data-safety answers, permission declarations, checklist): [`docs/PLAY_STORE.md`](docs/PLAY_STORE.md).
