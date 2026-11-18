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
| Emergency flow: call only after a spoken "yes", silence never calls, public numbers only *dialled*, location → SMS the user sends, AI can trigger it | ✅ 10 Robolectric scenario tests |
| Phone control: call by name/number (incl. Arabic "اتصل بأحمد"), dialer fallback when call permission is refused, notes, reminders (relative offline, absolute via AI), open apps, battery/date, notifications (access flow, not stored) | ✅ 14 scenario tests + fuzzy-matching and reminder-parser tests in 3 languages |
| Offline vision logic: colour naming from real pixels, scene/people composition with left/ahead/right in 3 languages, offline routing (no cloud call when offline or consent refused), honest refusal for banknotes offline | ✅ 13 logic tests + 6 scenario tests |
| ~70 new voice phrases (AR/FR/EN) and no regression of existing commands | ✅ `NewCommandsTest` |
| Database v1 → v2 migration keeps existing history | ✅ migration test |
| Provider-agnostic backend (OpenAI-compatible adapter: tool calls, images, errors, retry-after) | ✅ 6 Node tests |
| **Totals** | ✅ **224 JVM/Robolectric tests, 21 backend tests, all passing**; Android Lint clean |
| Debug APK, R8-minified release APKs (one per CPU type), release AAB | ✅ built; release arm64 APK ≈ 32 MB |
| **Real TextToSpeech / SpeechRecognizer / CameraX / ML Kit OCR / PdfRenderer-OCR of scanned pages** | ⚠️ **not run on a device** (no emulator or phone was available) |
| **Real ML Kit object/label/face models, real calls/SMS/contacts/location, notification listener, WorkManager reminders firing** | ⚠️ **not run on a device**; the logic around them is tested with fakes. Accuracy of offline descriptions is unmeasured |
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
* **Emergency** — say *"Emergency École Eyes"* (or *urgence*, *طوارئ*, *SOS*), or press the red tile. Calm spoken guidance,
  then it *offers* to call your emergency contact (placed only after you say "yes"), opens the dialer with your local
  emergency number (112, 14, 17… set in Settings — you press call), and can put your location into an SMS you send.
  The AI also starts this flow if you sound hurt or in danger. Nothing is ever called or sent automatically.
* **Phone control** — "call Ahmed" / "appelle maman" / "اتصل بأحمد" (spoken confirmation first), "call 0555…", "open
  WhatsApp", "take a note …", "read my notes", "remind me in 20 minutes to …" (works offline; absolute times like "at 5 pm"
  go through the AI), "read my notifications" (after you enable notification access), battery level, today's date.
* **Works offline** — on-device ML Kit models (bundled, no download, no Google account needed) give a rough description
  with positions ("Offline estimate: in front of you: table, quite close. On your right: chair."), count and place people
  (never identify them), and name colours from the actual pixels. Say *"what works offline?"* at any time.
* **Privacy by design** — spoken consent before any cloud use, spoken notice before each photo/document upload, nothing
  saved to storage, history encrypted with an Android-Keystore key and clearable by voice, no analytics, no ads.

## Quick start

Requirements: JDK 17+ (21 works), Android SDK 35 (`platforms;android-35`, `build-tools;35.0.0`), Node 20+ for the backend.

```bash
cd ecole-eyes-native
echo "sdk.dir=$ANDROID_HOME" > local.properties
./gradlew testDebugUnitTest lintDebug assembleDebug        # tests + lint + APK
# APKs (one per CPU type): app/build/outputs/apk/debug/app-arm64-v8a-debug.apk  (package com.ecoleeyes.app.debug)
adb install -r app/build/outputs/apk/debug/app-arm64-v8a-debug.apk     # armeabi-v7a for old 32-bit phones, x86_64 for emulators
```

### Make the app work online (automatic, no command line)

GitHub deploys the backend and builds an app connected to it. Once:

1. **AI key** — console.anthropic.com → *API keys* → create a key. In *Settings → Limits* set a monthly spending limit.
2. **Cloudflare token** — dash.cloudflare.com → open *Workers & Pages* once (this creates your `workers.dev` address) →
   *My Profile → API Tokens → Create Token* → template **Edit Cloudflare Workers** → create and copy the token.
3. **GitHub secrets** — this repository → *Settings → Secrets and variables → Actions → New repository secret*:
   | Name | Value |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | the Cloudflare token |
   | `ANTHROPIC_API_KEY` | the AI key |
   | `ECOLE_EYES_APP_TOKEN` | any long random text (the app and the backend share it) |
   | `CLOUDFLARE_ACCOUNT_ID` | only if your Cloudflare login has several accounts |
4. **Run it** — merge to `main`, or *Actions → Build ÉCOLE EYES (native Android) → Run workflow*. The run deploys the
   Worker, stores its secrets, checks it answers (without calling the AI), then builds the app with its address. The
   address appears in the run summary.
5. **Install** — download `EcoleEyes.apk` from *Releases*. On first launch answer "yes" to cloud assistance.

Rotate a key: update the GitHub secret and run the workflow again. Stop all AI spending at once: Cloudflare →
the `ecole-eyes-proxy` Worker → *Settings → Variables* → add `DISABLED` = `true`.

### 1. Deploy the AI backend by hand (alternative)

```bash
cd backend && npm install
npx wrangler login && npx wrangler deploy
npx wrangler secret put ANTHROPIC_API_KEY      # your provider key — lives only on Cloudflare
npx wrangler secret put APP_TOKEN              # any long random string
npm test                                       # 21 tests
# Another provider instead of Anthropic: set PROVIDER=openai, OPENAI_BASE_URL, OPENAI_MODEL and the OPENAI_API_KEY secret
# (all options with comments: backend/.dev.vars.example)
```

The app only ever talks to `https://<your-worker>/v1/messages`; the worker validates requests (token, model allow-list,
only the app's own tools and content types, size and image caps, 20 requests/minute/IP) and adds the key. It logs one line
per request without any content, and `DISABLED=true` stops all AI traffic instantly. Optional: a daily request budget
with Slack/Discord alerts, and Google Play Integrity verification (see `wrangler.toml` and `.dev.vars.example`). Security audit and owner checklist:
[`SECURITY.md`](SECURITY.md). See [`backend/worker.js`](backend/worker.js).
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

### 3. Emergency contact

Settings → Emergency: pick a contact (or say *"set Amina as my emergency contact"*) and set your local emergency number
(default 112; e.g. 14 / 17 in Algeria, 15 / 17 / 18 in France).

### 4. Phone setup for good voices

Settings → System → Text-to-speech → install the **Arabic**, **French** and **English** voice data of your TTS engine.
If a voice is missing the app says so (in English) instead of staying silent.

## Using it

**Voice only (default).** The app never needs the screen: after the greeting it listens (a beep before each listen),
answers, and listens again, on every screen. After two silences, or "stop", it waits quietly for "Hey École Eyes" and
ignores other conversation in the room. A notification is visible while the microphone is on; its *Stop* action turns
the microphone off. Can be switched off in Settings (then the big button is used, and the camera screen alone keeps
listening).

What Android still requires a touch for, by design: the system permission dialogs (microphone, camera, contacts —
the app explains each one aloud first, and TalkBack reads the dialog), choosing a folder for documents, pressing *call*
for emergency numbers and *send* for the location SMS. Some speech recognizers play their own sound at each listen.

| Say | Does |
|---|---|
| "Hello École Eyes" / "What can you do?" | greeting / help |
| "Open the camera" | opens and **at once describes the object in front in detail**; the microphone stays open on the camera screen (sound before each listen, closes after two silences or "stop") |
| "Describe this thing" · "What is this?" · "صف لي هذا الشيء" · "واش هذا" · "Décris cet objet" | detailed description of the object (what it is, colour, material, size, printed text read exactly), no filler |
| "Describe what is in front of me" · "Read the text" | detailed scene layout, OCR |
| "What color is this?" · "Is there a person in front of me?" · "Where is the chair?" | AI vision (uses a fresh photo) |
| "Stay with me and describe what changes" · "Stop" | continuous assistance |
| "Show me my files" · "Find a document named invoice" · "Read my latest PDF" | authorize folder, search, read |
| "Pause" · "Continue" · "Next page" · "Go to page 5" · "Repeat the last paragraph" · "Summarize this document" | reader |
| "Increase the volume" · "Speak faster" · "Speak French / تكلم بالعربية" | speech settings, language |
| "Go back" · "Go home" · "Open settings" · "Repeat the last answer" · "Stop" · "Close the application" | navigation |
| "Clear my history" | wipes conversation + reading positions (not your notes) |
| "Emergency École Eyes" · "Call emergency services" · "Call my emergency contact" · "Share my location" · "Set Amina as my emergency contact" | emergency |
| "Call Ahmed" · "Call 0555 12 34 56" · "Open WhatsApp" | phone (always confirmed before calling) |
| "Take a note buy bread" · "Read my notes" · "Delete my notes" | encrypted notes |
| "Remind me in 10 minutes to take my medicine" · "Remind me at 5 pm to call the bank" (AI) | reminders (notification + spoken) |
| "Read my notifications" · "Battery level" · "What is the date?" | device |
| "What colour is this?" · "Is there anyone in front of me?" · "What works offline?" | on-device vision, status |

### Online vs offline

| Feature | No internet / cloud off | Online with cloud consent |
|---|---|---|
| Voice commands, time/date, battery, language, speed, volume, navigation | ✅ | ✅ |
| Reading PDF/DOCX/TXT/RTF, resume position, search files | ✅ | ✅ (+ AI summaries/explanations) |
| Printed text, Latin script (OCR) | ✅ ML Kit on device | ✅ |
| Arabic script / handwriting | ❌ says it needs the internet | ✅ cloud transcription |
| Describe surroundings | ⚠️ rough on-device estimate (objects, positions, people count) | ✅ detailed AI description, follow-up questions |
| Colours | ✅ on device (always) | ✅ |
| Banknotes / coins | ❌ says it needs the internet (no reliable offline model bundled) | ✅ with stated confidence |
| Calls, notes, relative reminders, notifications, emergency | ✅ | ✅ (+ absolute-time reminders) |
| Free conversation | ❌ says so | ✅ |
| Speech recognition | ✅ if the phone has offline language packs ("Prefer on-device" setting) | ✅ |

Anything else is understood by the AI, including follow-ups ("What is next to the laptop?").

## Architecture

Single Gradle module `:app`, one package per feature area (a modular split into Gradle modules is mechanical because
dependencies already point one way; it was not done to keep builds fast and the project reviewable — see *Technical decisions*):

```
com.ecoleeyes
├─ core/        Lang, L10n (strings in any language), SettingsStore (encrypted), TextCipher (Keystore AES-GCM), Connectivity
├─ voice/       CommandParser + TextNorm (3-language NLU), Speaker/AndroidSpeaker (TTS), SpeechListener/AndroidSpeechListener (STT), ListeningService
├─ ai/          AiClient/ClaudeProxyClient (retry, typed errors), Tools, Prompt, AssistantBrain (tool loop + memory)
├─ vision/      CameraHub (CameraX bridge), OcrEngine (ML Kit + cloud), ContinuousAssist (change detection), ImageQuality,
│               LocalVision/MlKitVision (offline objects+labels+faces), SceneComposer, ColorNamer, LabelDictionary
├─ phone/       Phone/AndroidPhone (calls, dialer, SMS composer, contacts, apps, battery, location), FuzzyMatch,
│               ReminderParser + WorkManager ReminderWorker, NotificationReader (NotificationListenerService)
├─ docs/        DocIndex (SAF grants + scan), DocSearch, Extractors (DOCX/RTF/DOC/TXT), DocumentLoader (PDF/images), Paginator, ReaderSession
├─ data/        Room: encrypted messages, encrypted notes, hashed-key reading positions (v1 → v2 migration)
├─ a11y/        Feedback (earcons + haptics)
├─ controller/  AssistantController — the conductor: listen → understand → act → speak; permissions, consent, errors → words
└─ ui/          Compose screens (Home, Assistant, Camera, Documents/Files, Emergency, Settings, Privacy), theme, components
backend/        Cloudflare Worker proxy (Anthropic or any OpenAI-compatible provider) + tests
```

Data flow: mic → `SpeechListener` → `CommandParser` → *local command* **or** `AssistantBrain` (→ model → tool calls →
`AssistantController.runTool` → camera/doc/navigation → result back to model) → `Speaker`. Every exception is mapped to a
spoken sentence in the user's language (`AssistantController.explain`, `sttMessage`, per-feature messages).

## Technical decisions

* **One Gradle module, packages per feature, manual DI (`AppGraph`).** The requested `feature_*`/`core`/`data` split would
  add build configuration without changing behaviour at this size; dependencies already point one way (ui → controller →
  feature packages → core), so splitting later is mechanical. Hilt was not added for the same reason.
* **ML Kit bundled models** for OCR, objects, labels and faces: work on first launch, offline, and on phones without Google
  Play services (e.g. Huawei). Cost: ~30 MB of native code per CPU type, mitigated by per-CPU APKs and compressed native libs.
* **Android `SpeechRecognizer`, not Vosk.** Modern phones ship offline recognizers for Arabic, French and English (enable
  "Prefer on-device"); Vosk would add ~50 MB per language and its host was not reachable from the build environment.
  `SpeechListener` is an interface, so a Vosk implementation can be dropped in.
* **Wake phrase = continuous recognition in a user-started foreground service**, not a dedicated hot-word engine
  (e.g. Porcupine needs a commercial key and a custom "École Eyes" model). It is honest about Android's limits.
* **No AccessibilityService.** Controlling other apps' UIs is powerful but heavily restricted on Play and risky; the app
  opens apps, dials, and composes SMS through standard intents instead.
* **No on-device LLM.** Free conversation offline would need a ≥1 GB model; offline answers are deliberately scoped and the
  app says what needs the internet.
* **Provider-agnostic backend.** The app speaks one protocol; the Worker forwards to Anthropic (default) or translates for
  any OpenAI-compatible API (`PROVIDER=openai`, see `backend/.dev.vars.example`).

## Privacy, security, permissions

* Permissions asked only at the moment of need, **with a spoken reason first**: microphone (voice), camera (photos on
  request), notifications + foreground-service-microphone (hands-free mode, reminders), contacts (call by name), phone
  (direct calls; refusing falls back to the dialer), location (only for "share my location"). Notification access is
  turned on by the user in Android settings and can be revoked there.
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
* Offline descriptions are coarse: the bundled detector finds at most 5 objects and names them with a generic labeler. It
  does not detect stairs, holes or distances reliably and says it is an estimate. No offline banknote recognition.
* Reminders use WorkManager and may arrive a few minutes late in deep battery saving ("about" is said on purpose).
* Arabic-script OCR/handwriting need the cloud; embedded-text Arabic PDFs may extract in the wrong order (cloud OCR is used when allowed).
* Legacy `.doc` is best effort (user is warned); convert to `.docx` for reliability. Password-protected PDFs are refused.
* Hands-free mode: Android 14+ only starts microphone services while the app is visible, may stop them to save battery, and
  some recognizers beep on each restart. It is a convenience, not an always-on assistant. Android offers no way for an app to
  control other apps or system settings by voice without an AccessibilityService, which this app deliberately does **not** use.
* "Interrupt when I talk" can hear the phone's own voice; best with headphones.
* The embedded app token is extractable (see above).

## Testing

```bash
./gradlew testDebugUnitTest            # 228 JVM + Robolectric tests (first run downloads Robolectric's Android jars;
                                       # behind a rate-limited network add -ProbolectricRepoUrl=<Maven Central mirror>)
./gradlew lintDebug
./gradlew connectedDebugAndroidTest    # needs a device/emulator: Compose accessibility + navigation tests (not run in CI here)
(cd backend && npm test)              # 45 tests
```

For a real TalkBack session: enable TalkBack, open the app, and confirm the home screen reads its heading, the voice button
state and each tile; the assistant's own speech and TalkBack can overlap, so test with TalkBack's speech rate lowered.

## Release

```bash
./gradlew bundleRelease \
  -PECOLE_EYES_KEYSTORE=/path/release.keystore -PECOLE_EYES_KEYSTORE_PASSWORD=… -PECOLE_EYES_KEY_ALIAS=…
# app/build/outputs/bundle/release/app-release.aab (Play splits per device)
# assembleRelease → signed APKs per CPU: app/build/outputs/apk/release/app-arm64-v8a-release.apk (≈32 MB), app-armeabi-v7a-release.apk
```

Never commit the keystore. CI: [`.github/workflows/build-ecole-eyes-native.yml`](../.github/workflows/build-ecole-eyes-native.yml).
Google Play preparation (listing text, Data-safety answers, permission declarations, checklist): [`docs/PLAY_STORE.md`](docs/PLAY_STORE.md).
