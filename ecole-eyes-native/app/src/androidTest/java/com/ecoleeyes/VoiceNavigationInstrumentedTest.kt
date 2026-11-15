package com.ecoleeyes

import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import com.ecoleeyes.ui.MainActivity
import com.ecoleeyes.voice.Screen
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Launches the real app on a device and drives it with typed text, which goes through exactly the same
 * path as recognised speech. Run with TalkBack on (adb shell settings put secure enabled_accessibility_services ...)
 * to verify the combined behaviour.
 */
class VoiceNavigationInstrumentedTest {
    private val graph: AppGraph get() = ((InstrumentationRegistry.getInstrumentation().targetContext.applicationContext) as EcoleEyesApp).graph

    @Test fun voice_commands_navigate_the_whole_app() {
        ActivityScenario.launch(MainActivity::class.java).use {
            val c = graph.controller
            for ((phrase, screen) in listOf("open settings" to Screen.SETTINGS, "go home" to Screen.HOME, "open AI assistant" to Screen.ASSISTANT, "ouvre la caméra" to Screen.CAMERA, "افتح الإعدادات" to Screen.SETTINGS)) {
                c.submitText(phrase)
                Thread.sleep(1500)
                assertEquals(phrase, screen, c.state.value.screen)
            }
        }
    }
}
