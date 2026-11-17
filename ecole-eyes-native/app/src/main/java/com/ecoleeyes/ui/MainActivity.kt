package com.ecoleeyes.ui

import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import android.provider.ContactsContract
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.lifecycle.lifecycleScope
import com.ecoleeyes.AppGraph
import com.ecoleeyes.EcoleEyesApp
import com.ecoleeyes.controller.UiEvent
import com.ecoleeyes.voice.Screen
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var graph: AppGraph

    private val permissionLauncher = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        lastPermission?.let { graph.controller.onPermissionResult(it, granted) }
    }
    private val folderLauncher = registerForActivityResult(ActivityResultContracts.OpenDocumentTree()) { graph.controller.onFolderPicked(it) }
    private val fileLauncher = registerForActivityResult(ActivityResultContracts.OpenDocument()) { graph.controller.onFolderPicked(it) }
    private var lastPermission: String? = null

    // Emergency contact from the system contact picker: Android grants read access to the one chosen entry only,
    // so no contacts permission is needed for this path.
    private val contactLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
        val uri = res.data?.data ?: return@registerForActivityResult
        runCatching {
            contentResolver.query(uri, arrayOf(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME, ContactsContract.CommonDataKinds.Phone.NUMBER), null, null, null)?.use { c ->
                if (c.moveToFirst()) {
                    val name = c.getString(0).orEmpty(); val number = c.getString(1).orEmpty()
                    graph.settings.update { it.copy(emergencyName = name, emergencyNumber = number) }
                    graph.controller.readAloud(graph.l10n.str(graph.settings.value.lang, com.ecoleeyes.app.R.string.say_em_contact_set, name))
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        graph = (application as EcoleEyesApp).graph
        enableEdgeToEdge()

        lifecycleScope.launch {
            graph.controller.events.collect { ev ->
                when (ev) {
                    is UiEvent.RequestPermission -> { lastPermission = ev.permission; permissionLauncher.launch(ev.permission) }
                    UiEvent.PickFolder -> folderLauncher.launch(null)
                    UiEvent.PickFile -> fileLauncher.launch(arrayOf("*/*"))
                    UiEvent.CloseApp -> finishAffinity()
                }
            }
        }

        setContent {
            EcoleEyesTheme {
                LocalizedRoot(graph) {
                    BackHandler { if (!graph.controller.onSystemBack()) finish() }
                    AppRoot(graph, onPickFolder = { folderLauncher.launch(null) }, onPickFile = { fileLauncher.launch(arrayOf("application/pdf", "text/plain", "application/rtf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png")) }, onPickContact = { contactLauncher.launch(Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI)) })
                }
            }
        }

        if (savedInstanceState == null) {
            if (!graph.settings.value.onboardingDone) graph.controller.startOnboarding() else graph.controller.greetOnStart()
            handleIntent(intent)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        if (intent?.action == Intent.ACTION_VOICE_COMMAND) graph.controller.onMicTap()
    }
}

/** Shows the UI in the assistant's language (and direction), independent of the phone language. */
@Composable
private fun LocalizedRoot(graph: AppGraph, content: @Composable () -> Unit) {
    val lang by graph.settings.state.collectAsState()
    val base = LocalContext.current
    val ctx = remember(lang.lang, base) {
        val cfg = Configuration(base.resources.configuration).apply { setLocale(lang.lang.locale); setLayoutDirection(lang.lang.locale) }
        base.createConfigurationContext(cfg)
    }
    val cfg = remember(lang.lang, base) { Configuration(base.resources.configuration).apply { setLocale(lang.lang.locale); setLayoutDirection(lang.lang.locale) } }
    CompositionLocalProvider(
        LocalContext provides ctx,
        LocalConfiguration provides cfg,
        LocalLayoutDirection provides if (lang.lang.isRtl) LayoutDirection.Rtl else LayoutDirection.Ltr,
        content = content,
    )
}

@Composable
private fun AppRoot(graph: AppGraph, onPickFolder: () -> Unit, onPickFile: () -> Unit, onPickContact: () -> Unit) {
    val ui by graph.controller.state.collectAsState()
    when (ui.screen) {
        Screen.HOME -> HomeScreen(graph)
        Screen.ASSISTANT -> AssistantScreen(graph)
        Screen.CAMERA -> CameraScreen(graph)
        Screen.DOCUMENTS -> DocumentsScreen(graph, files = false, onPickFolder, onPickFile)
        Screen.FILES -> DocumentsScreen(graph, files = true, onPickFolder, onPickFile)
        Screen.EMERGENCY -> EmergencyScreen(graph)
        Screen.SETTINGS -> SettingsScreen(graph, onPickContact)
        Screen.PRIVACY -> PrivacyScreen(graph)
    }
}
