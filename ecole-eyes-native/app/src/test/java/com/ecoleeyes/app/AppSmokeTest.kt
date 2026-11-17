package com.ecoleeyes.app

import android.Manifest
import android.app.Application
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.test.core.app.ApplicationProvider
import com.ecoleeyes.EcoleEyesApp
import com.ecoleeyes.core.Consent
import com.ecoleeyes.core.L10n
import com.ecoleeyes.core.Lang
import com.ecoleeyes.ui.MainActivity
import com.ecoleeyes.voice.Screen
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

/**
 * Starts the real app (real MainActivity, real AppGraph with TTS, speech recognizer, ML Kit, Room, settings)
 * and opens every screen in every language. Catches crashes at launch, missing resources, broken navigation
 * and screens that render without their main controls.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class AppSmokeTest {
    @get:Rule val compose = createAndroidComposeRule<MainActivity>()

    private val app get() = ApplicationProvider.getApplicationContext<Application>() as EcoleEyesApp

    @Before fun grant() {
        shadowOf(ApplicationProvider.getApplicationContext<Application>()).grantPermissions(Manifest.permission.RECORD_AUDIO)
    }

    private fun open(screen: Screen) {
        compose.runOnUiThread { app.graph.controller.navigate(Screen.HOME); app.graph.controller.navigate(screen) }
        compose.waitForIdle()
        assertEquals(screen, app.graph.controller.state.value.screen)
    }

    @Test fun app_starts_and_every_screen_opens_in_every_language() {
        val l10n = L10n(app)
        for (lang in Lang.entries) {
            compose.runOnUiThread { app.graph.settings.update { it.copy(lang = lang, onboardingDone = true, consent = Consent.DENIED) } }
            compose.waitForIdle()
            fun t(id: Int, vararg a: Any) = l10n.str(lang, id, *a)

            open(Screen.HOME)
            compose.onNodeWithContentDescription(t(R.string.tile_emergency)).assertExists()
            compose.onNodeWithContentDescription(t(R.string.tile_camera)).assertExists()

            open(Screen.ASSISTANT); compose.onAllNodesWithText(t(R.string.screen_assistant))[0].assertExists()
            open(Screen.CAMERA); compose.onNodeWithText(t(R.string.screen_camera)).assertExists()
            open(Screen.DOCUMENTS); compose.onNodeWithText(t(R.string.screen_documents)).assertExists()
            open(Screen.FILES); compose.onNodeWithText(t(R.string.screen_files)).assertExists()
            open(Screen.EMERGENCY)
            compose.onNodeWithText(t(R.string.screen_emergency)).assertExists()
            compose.onNodeWithText(t(R.string.em_btn_services, "112")).assertExists()
            open(Screen.SETTINGS); compose.onNodeWithText(t(R.string.screen_settings)).assertExists()
            open(Screen.PRIVACY); compose.onNodeWithText(t(R.string.screen_privacy)).assertExists()
        }
    }

    @Test fun system_back_returns_home_from_any_screen() {
        open(Screen.EMERGENCY)
        compose.runOnUiThread { assertTrue(app.graph.controller.onSystemBack()) }
        compose.waitForIdle()
        assertEquals(Screen.HOME, app.graph.controller.state.value.screen)
    }
}
