package com.ecoleeyes.app

import android.Manifest
import android.app.Application
import android.graphics.Bitmap
import android.graphics.Canvas
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.core.app.ApplicationProvider
import com.ecoleeyes.EcoleEyesApp
import com.ecoleeyes.core.Consent
import com.ecoleeyes.core.Lang
import com.ecoleeyes.ui.MainActivity
import com.ecoleeyes.voice.Screen
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/**
 * Renders every screen in every language to PNG for visual review (phone size, 411 x 891 dp).
 * Run on demand:  ./gradlew testDebugUnitTest --tests '*ScreenshotTour*' -Pscreenshots=true
 * Output: app/build/screenshots/
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34], qualifiers = "w411dp-h891dp-xxhdpi")
class ScreenshotTour {
    @get:Rule val compose = createAndroidComposeRule<MainActivity>()

    @Test fun capture_all_screens() {
        assumeTrue("set -Pscreenshots=true", System.getProperty("ecoleeyes.screenshots") == "true")
        val ctx = ApplicationProvider.getApplicationContext<Application>()
        shadowOf(ctx).grantPermissions(Manifest.permission.RECORD_AUDIO)
        val graph = (ctx as EcoleEyesApp).graph
        val out = File(System.getProperty("ecoleeyes.screenshotDir") ?: "build/screenshots").apply { mkdirs() }
        val screens = listOf(Screen.HOME, Screen.ASSISTANT, Screen.CAMERA, Screen.DOCUMENTS, Screen.EMERGENCY, Screen.SETTINGS)
        for (lang in Lang.entries) {
            compose.runOnUiThread {
                graph.settings.update { it.copy(lang = lang, onboardingDone = true, consent = Consent.DENIED, emergencyName = "", emergencyNumber = "") }
            }
            for (screen in screens) {
                compose.runOnUiThread { graph.controller.navigate(Screen.HOME); graph.controller.navigate(screen) }
                compose.waitForIdle()
                var bmp: Bitmap? = null
                compose.runOnUiThread {
                    val root = compose.activity.window.decorView
                    bmp = Bitmap.createBitmap(root.width, root.height, Bitmap.Config.ARGB_8888).also { root.draw(Canvas(it)) }
                }
                val image = bmp!!
                File(out, "${lang.tag}-${screen.name.lowercase()}.png").outputStream().use { image.compress(Bitmap.CompressFormat.PNG, 100, it) }
            }
        }
    }
}
