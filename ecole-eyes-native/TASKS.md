# ÉCOLE EYES — Tasks

Keep this file current: move items to **Done** only when implemented *and* tested; record device-only checks separately.

## Done (implemented + automated tests pass)

- [x] Project foundation: Kotlin 2.0, Compose/Material 3, version catalog, feature packages, visual identity, RTL
- [x] Voice loop: STT → offline 3-language parser → AI tool loop → interruptible TTS; pause/resume; barge-in option
- [x] Wake phrase "Hello École Eyes" in an optional, user-controlled foreground service
- [x] AI backend proxy (Cloudflare Worker) with token, allow-list, size and rate limits; secret never in the app
- [x] Conversation memory and follow-up questions; history encrypted with a Keystore key; "clear my history"
- [x] Camera: describe, read text (ML Kit offline + cloud for Arabic/handwriting), darkness check, continuous mode
- [x] Documents via SAF: PDF (text + scanned), DOCX, DOC, RTF, TXT, images; search; paging; saved positions; summaries
- [x] Spoken consent, spoken permission rationale, spoken errors in AR/FR/EN; offline fallbacks
- [x] **Phone control:** open apps (fuzzy + Arabic/French aliases), alarms, timers, calls with spoken yes and dialer
      fallback, read notifications (listener + one-time access offer), battery, date, open settings pages
- [x] **AI tools for phone control** (`open_app`, `set_alarm`, `set_timer`, `phone_call`, `read_notifications`,
      `device_status`, `open_system_settings`); calls stay gated by the spoken yes
- [x] **Automatic answer language** (Android 14 recognizer detection + text fallback), switchable in Settings
- [x] Settings: notification access status/button, auto-language switch
- [x] Planning docs: DEVELOPMENT_PLAN.md, TECHNICAL_ARCHITECTURE.md, this file; README, PRIVACY, PLAY_STORE updated
- [x] Build gate green locally: 194 unit/Robolectric tests, lint (0 errors), debug APK, R8 release APK, androidTest compile

## Needs a physical device (implemented, not yet observed working)

- [ ] Run `docs/PLAY_STORE.md` device checklist items 1–17 on an Android 14+ phone and an older phone
- [ ] Execute `app/src/androidTest` (Compose accessibility + voice navigation)
- [ ] TalkBack session: labels, focus order, overlap between TalkBack and the assistant's voice
- [ ] Clock apps honouring `EXTRA_SKIP_UI` (Google Clock, Samsung Clock); behaviour when none is installed
- [ ] Android 14 recognizer language detection with Google's on-device and online recognizers
- [ ] Battery/thermal: 10-minute continuous description; 1 hour of hands-free listening
- [ ] Usability sessions with blind and low-vision users (closed testing track)

## Open (not implemented — reason)

- [ ] Low-power wake-word engine (e.g. Porcupine): needs a third-party SDK and licence key; current loop costs more battery
- [ ] Android plurals for counts ("%d notifications") — Arabic number agreement above 10 is approximate today
      (durations already handle Arabic dual/plural in code)
- [ ] Per-install attestation (Play Integrity) on the backend, replacing the embedded app token
- [ ] Send messages by voice (would need SMS permissions with Play policy review, or app-specific share intents)
- [ ] Traffic-light / currency recognition beyond what the general vision model says (no dedicated models; prompts only)
- [ ] iOS version (spec: future platform)
- [ ] Remove three pre-existing unused strings flagged by lint (`say_cam_wait`, `say_doc_scanned_offline`, `say_which_doc`)
