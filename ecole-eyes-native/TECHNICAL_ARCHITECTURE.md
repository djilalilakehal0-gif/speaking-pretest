# ÉCOLE EYES — Technical architecture

## 1. Interaction model

```
microphone ─► SpeechListener ─► CommandParser ──► local command ─────────────┐
   (STT)        (+ detected       (offline,        (time, reader, camera,     │
                 language)         AR/FR/EN)        apps, alarms, calls…)     ▼
                                       │                              AssistantController ─► Speaker (TTS)
                                       └─► Ask ─► AssistantBrain ─► backend ─► model      ▲   + earcons/haptics
                                                    ▲   tool calls ▼                      │
                                                    └── ToolExecutor (controller) ────────┘
```

**Speak → understand → execute → respond.** Unambiguous commands are handled on the phone, instantly and offline.
Everything else goes to the multimodal model, which can only act through the tools the app defines; the controller
executes each tool, checks permissions, asks the user to confirm sensitive actions, and turns every failure into a spoken
sentence in the user's language.

## 2. Layers (mapping to the spec's suggested architecture)

| Spec layer / component | Implementation |
|---|---|
| Presentation: Home, VoiceAssistant, CameraAssistant, DocumentReader, LanguageSettings, AccessibilitySettings | `ui/` Compose screens: `HomeScreen`, `AssistantScreen`, `CameraScreen`, `DocumentsScreen` (documents + file search), `SettingsScreen` (language, speech, accessibility, hands-free, auto-language, notification access, backend), `PrivacyScreen` |
| ViewModel / state | `controller/AssistantController` exposes `StateFlow<UiState>` + `SharedFlow<UiEvent>`; screens are stateless renderers |
| VoiceCommandUseCase | `voice/CommandParser` + `controller.handleUtterance/run` |
| ReadDocumentUseCase | `docs/DocumentLoader`, `docs/ReaderSession`, `controller.readFile` |
| AnalyzeSceneUseCase | `ai/Tools.capture_view` + `vision/CameraHub`, `vision/ImageQuality`, `vision/ContinuousAssist` |
| ExecuteDeviceActionUseCase | `device/DeviceActions` (+ `AndroidDeviceActions`), `controller.openApp/setAlarm/setTimer/placeCall/readNotifications/openSystemSettings` |
| ChangeLanguageUseCase | `controller.setLanguage`, `controller.autoSwitchLanguage`, `voice/LanguageDetector` |
| SpeechRepository | `voice/SpeechListener` (Android `SpeechRecognizer`), `voice/Speaker` (Android `TextToSpeech`) |
| VisionRepository | `vision/CameraHub` (CameraX), `vision/OcrEngine` (ML Kit + cloud transcription) |
| DocumentRepository | `docs/DocIndex` (Storage Access Framework grants), `docs/Extractors` |
| AIRepository | `ai/AiClient` → `ClaudeProxyClient` (retry, timeouts, typed errors), `ai/AssistantBrain` (tool loop, memory) |
| SettingsRepository | `core/SettingsStore` (EncryptedSharedPreferences, `StateFlow`) |
| VoiceSessionService | `voice/ListeningService` (user-controlled foreground service, microphone type) |
| CameraAnalysisService | `vision/CameraHub` bound to the camera screen lifecycle (no background camera, by design) |
| TextToSpeechService | `voice/AndroidSpeaker` (sentence queue, interruptible, per-language voice check) |
| AccessibilityIntegrationService | Compose semantics + `a11y/Feedback`; **no AccessibilityService** (deliberate, §6) |
| Room / encrypted storage | `data/` Room DB: history encrypted with an Android-Keystore AES-GCM key, reading positions keyed by SHA-256 of the URI |
| Backend | `backend/worker.js` Cloudflare Worker: app token, model allow-list, field whitelist, size cap, optional rate limit; holds the provider key |

## 3. Phone control (spec 2.6)

All through **public, documented intents and APIs**, each permission requested at the moment of use with a spoken reason:

| Request | Mechanism | Permission | Safeguard |
|---|---|---|---|
| Open an app | `PackageManager.queryIntentActivities(MAIN/LAUNCHER)` + `getLaunchIntentForPackage` | `<queries>` launcher intent only | Fuzzy match (accents, Arabic aliases, typos); asks "did you mean…?" when unsure |
| Alarm / timer | `AlarmClock.ACTION_SET_ALARM` / `ACTION_SET_TIMER`, `EXTRA_SKIP_UI` | `SET_ALARM` (normal) | Unparseable time → asks for it; never guesses |
| Call | `ACTION_CALL`, or `ACTION_DIAL` if refused | `READ_CONTACTS`, `CALL_PHONE` (runtime) | **Spoken yes required**, also for AI-initiated calls; unclear answer = no |
| Read notifications | `NotificationListenerService` | User enables Notification access in Android settings | In-memory only (30 items); offered aloud with a direct link to the setting |
| Battery / date | `BatteryManager`, `DateFormat` | none | — |
| Wi-Fi, Bluetooth, sound… | `Settings.ACTION_*` pages | none | Says that apps cannot toggle these and where the switch is |
| Volume, speech speed | `AudioManager`, TTS rate | none | — |

Not possible without an AccessibilityService (deliberately not used): pressing buttons in other apps, reading other apps'
screens, sending messages through them, toggling system settings.

## 4. Languages

* UI and speech strings exist in English, French and Arabic (`res/values{,-fr,-ar}`), resolved per *assistant* language
  by `core/L10n` (independent of the phone's locale). Arabic layout is RTL.
* Command parsing works on normalized text (`voice/TextNorm`: case, accents, Arabic letter variants, Arabic-Indic digits).
* **Automatic answer language:** on Android 14+ the recognizer is asked to detect and switch between `en-US`, `fr-FR` and
  `ar-SA` (`EXTRA_ENABLE_LANGUAGE_DETECTION`, `EXTRA_ENABLE_LANGUAGE_SWITCH`); a confident detection switches the assistant
  language. Elsewhere `voice/LanguageDetector` switches only on clear sentences (script majority by words, stop-word
  evidence). Explicit "speak French" always works; the feature can be turned off.

## 5. Security and privacy

* No provider secret in the app or repository; the Worker holds `ANTHROPIC_API_KEY`. The embedded app token is a speed
  bump, not authentication (documented in the README with mitigations).
* HTTPS only (`usesCleartextTraffic=false`), `allowBackup=false`, no analytics/ads SDKs, no content logging.
* Consent before any cloud use; spoken notice before photo/document/notification uploads (switchable).
* Contacts are matched on the phone and never uploaded or stored; notifications are kept in memory only.
* Files only via SAF grants — the app holds no storage permission.

## 6. Decisions and deviations from the suggested stack

| Suggested | Chosen | Why |
|---|---|---|
| Hilt | Manual wiring in `AppGraph` | ~20 objects, one process; manual wiring has no annotation processing cost and makes the test graph explicit (`ControllerTest` builds the controller with fakes). Swapping to Hilt is mechanical if the graph grows. |
| DataStore | `EncryptedSharedPreferences` behind a `StateFlow` (`SettingsStore`) | The backend URL/token are sensitive; Jetpack Security encrypts at rest out of the box. The API exposed to the app is already flow-based. |
| Navigation-Compose | Screen enum + back stack in the controller | Voice commands navigate ("go back", "open the camera") from outside the UI; one source of truth in the controller avoids double back stacks. |
| One ViewModel per screen | One controller | Every screen shares one conversation, one reader and one camera session; splitting would mean cross-ViewModel coordination for every voice command. |
| Wake-word engine | `SpeechRecognizer` loop in a foreground service, wake phrase checked in text | No third-party SDK/licence needed and works in 3 languages; trade-off: more battery and recognizer beeps. A low-power engine (e.g. Porcupine) is an open task needing a licence key. |
| AccessibilityService for device control | Public intents only | Play restricts AccessibilityService use and it would give the app control over every screen; the safer surface covers the spec's examples except "press buttons in other apps". |

## 7. External dependencies

| Dependency | Used for | Runs where | Needs |
|---|---|---|---|
| Android `SpeechRecognizer` | Speech-to-text | Phone's recognizer (often Google; may use its cloud unless "prefer on-device") | Recognizer app with AR/FR/EN packs |
| Android `TextToSpeech` | Voice output | On device | TTS voices for AR/FR/EN (app explains if missing) |
| CameraX 1.4 | Camera preview/capture | On device | Camera permission |
| ML Kit Text Recognition (bundled Latin model) | Offline OCR | On device | — (Arabic/handwriting use the cloud model) |
| PdfBox-Android, Android `PdfRenderer` | PDF text extraction / page rendering for OCR | On device | — |
| OkHttp | HTTPS to the backend | Phone → backend | — |
| Cloudflare Worker (`backend/`) | Holds API key, validates and forwards requests | Cloudflare | Cloudflare account, `ANTHROPIC_API_KEY`, `APP_TOKEN` secrets |
| Anthropic Messages API (Claude, multimodal) | Conversation, vision, tool calls, cloud OCR | Anthropic | API key with a spend cap; replaceable through the `AiClient` interface |
| Room, Jetpack Security | Encrypted local data | On device | — |

## 8. Testing strategy

* **Pure logic (JVM):** parser, normalization, language detection, time/duration/number parsing, name matching, document
  extractors, pagination, search ranking, change detection, image-quality checks.
* **Controller end-to-end (Robolectric):** fake speech, AI, camera and device actions; asserts what the user hears and what
  the phone does — permissions with spoken rationale, consent, confirmations, errors in each language, offline fallbacks.
* **AI client:** MockWebServer for protocol, retries, timeouts and every error class.
* **Backend:** Node tests for validation, auth and limits.
* **Instrumented (compiled, not yet executed):** Compose accessibility semantics, voice navigation.
* **Device checklist:** `docs/PLAY_STORE.md`.

## Build environment notes

If Maven Central answers HTTP 429 (shared egress), use Google's mirror without touching the build files:

```groovy
// mirror.gradle — run: ./gradlew -I mirror.gradle testDebugUnitTest
def mirror = { repos ->
    def m = repos.maven { url 'https://maven-central.storage-download.googleapis.com/maven2/'; name 'centralMirror' }
    repos.remove(m); repos.addFirst(m)
}
settingsEvaluated { s -> mirror(s.pluginManagement.repositories); mirror(s.dependencyResolutionManagement.repositories) }
allprojects { tasks.withType(Test).configureEach {
    systemProperty 'robolectric.dependency.repo.url', 'https://maven-central.storage-download.googleapis.com/maven2'
} }
```
