# ÉCOLE EYES — Development plan

Phases follow Part 8 of the master specification. "Done" means implemented **and** covered by automated tests that pass
in CI; anything that needs a real phone is marked separately, because no device or emulator was available to the
development environment (no KVM). Open items live in [`TASKS.md`](TASKS.md).

Legend: ✅ done and tested · 🟡 implemented, needs device validation · ⬜ not started / out of scope (see reason)

| Phase | Scope (spec) | Status | Notes |
|---|---|---|---|
| 1 — Foundation | Kotlin, Compose, architecture, navigation, visual identity, dependencies | ✅ | Single `:app` module, feature packages, version catalog. Manual DI (`AppGraph`) instead of Hilt — see architecture doc §6. |
| 2 — Voice engine | STT, TTS, command interpretation, pause/resume, multilingual | ✅ / 🟡 | Offline parser for AR/FR/EN (~300 phrases tested); automatic answer language. Real recognizer/TTS behaviour 🟡. |
| 3 — AI assistant | Backend, context, structured tool calls, spoken answers, errors | ✅ | Tool-calling loop with memory; every failure spoken in the user's language. Answer *quality* needs the real backend. |
| 4 — Camera & vision | CameraX, capture, AI vision, scene description, obstacles, optimization | ✅ / 🟡 | Darkness check, change-gated continuous mode, safety wording in prompts. Camera hardware 🟡. |
| 5 — Document reader | PDF, OCR, navigation, multilingual speech, positions | ✅ / 🟡 | PDF/DOCX/DOC/RTF/TXT/images; encrypted reading positions. ML Kit + PdfRenderer OCR 🟡. |
| 6 — Android integration | Launch apps, notifications, calls with confirmation, alarms, volume, secure files | ✅ / 🟡 | Added in this iteration: apps, alarms, timers, calls (spoken yes + dialer fallback), notifications (listener), battery, date, settings pages. Real intents 🟡. |
| 7 — Accessibility | TalkBack, voice-only flows, feedback | ✅ / 🟡 | Semantics, 72 dp targets, earcons/haptics, RTL. Compose a11y tests compiled, **not executed**; no TalkBack session yet. |
| 8 — Testing | Unit, integration, camera, speech, OCR, API errors, offline, battery, permissions, usability | ✅ / ⬜ | 194 JVM/Robolectric tests + 15 backend tests. Battery profiling and usability testing with blind users ⬜ (need devices and people). |
| 9 — Final build | Debug APK, device tests, signed release APK/AAB, docs | ✅ / 🟡 | Debug + R8 release build locally; CI signs APK/AAB on `main`. Physical-device pass 🟡. |

## Order of work for the next iteration

1. **Device validation** (highest value): run [`docs/PLAY_STORE.md` → Device test checklist](docs/PLAY_STORE.md#device-test-checklist)
   on two phones (Android 14+ and an older one), with and without TalkBack. Fix what breaks.
2. **Blind and low-vision testers** on the internal/closed track; prioritise their findings over the backlog.
3. Deploy the backend with a spend cap, measure answer latency and quality for the scene/OCR prompts in all 3 languages.
4. Then the open items in `TASKS.md` (wake-word engine evaluation, plural strings, play-integrity attestation, iOS).

## How each phase was verified

* `./gradlew testDebugUnitTest lintDebug assembleDebug compileDebugAndroidTestKotlin` — the same gate CI runs on every PR.
* `./gradlew assembleRelease` — R8/resource shrinking does not break the app's reflection-free code paths.
* `cd backend && npm test` — proxy validation, auth, limits.
