package com.ecoleeyes

import android.app.Application
import com.ecoleeyes.a11y.Feedback
import com.ecoleeyes.ai.AssistantBrain
import com.ecoleeyes.ai.ClaudeProxyClient
import com.ecoleeyes.ai.Prompt
import com.ecoleeyes.app.BuildConfig
import com.ecoleeyes.controller.AssistantController
import com.ecoleeyes.core.AndroidConnectivity
import com.ecoleeyes.core.KeystoreCipher
import com.ecoleeyes.core.L10n
import com.ecoleeyes.core.SettingsStore
import com.ecoleeyes.data.AppDatabase
import com.ecoleeyes.data.HistoryRepository
import com.ecoleeyes.docs.DocIndex
import com.ecoleeyes.docs.DocumentLoader
import com.ecoleeyes.vision.CameraHub
import com.ecoleeyes.vision.CloudTranscriber
import com.ecoleeyes.vision.OcrEngine
import com.ecoleeyes.voice.AndroidSpeaker
import com.ecoleeyes.voice.AndroidSpeechListener
import com.ecoleeyes.voice.ListeningService
import com.ecoleeyes.voice.VolumeControl
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

/** Manual dependency wiring (small app: no DI framework needed). One instance per process. */
class AppGraph(app: Application) {
    val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    val settings = SettingsStore(app)
    val l10n = L10n(app)
    val connectivity = AndroidConnectivity(app)
    val speaker = AndroidSpeaker(app)
    val listener = AndroidSpeechListener(app)
    val feedback = Feedback(app)
    val camera = CameraHub(app)
    val docs = DocIndex(app)
    private val db = AppDatabase.create(app)
    val history = HistoryRepository(db, KeystoreCipher())
    private val client = ClaudeProxyClient({ settings.value }, connectivity, BuildConfig.AI_MODEL)
    val brain = AssistantBrain(client)
    private val ocr = OcrEngine(CloudTranscriber { jpeg, lang ->
        brain.oneShot("You transcribe text from photographs for a blind reader. Output only the transcription.", Prompt.transcribe(lang), jpeg, 1500)
    })

    val controller = AssistantController(
        context = app,
        scope = scope,
        settings = settings,
        l10n = l10n,
        speaker = speaker,
        stt = listener,
        brain = brain,
        camera = camera,
        ocr = ocr,
        docs = docs,
        history = history,
        feedback = feedback,
        volume = VolumeControl(app),
        connectivity = connectivity,
        loaderFactory = { env -> DocumentLoader(app, ocr, env) },
        serviceControl = { on -> if (on) ListeningService.start(app) else ListeningService.stop(app) },
    )
}
