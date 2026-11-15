package com.ecoleeyes

import androidx.compose.material3.Text
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertWidthIsAtLeast
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.unit.dp
import com.ecoleeyes.controller.Phase
import com.ecoleeyes.ui.BigButton
import com.ecoleeyes.ui.EcoleEyesTheme
import com.ecoleeyes.ui.ScreenFrame
import com.ecoleeyes.ui.VoiceButton
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Accessibility checks that need a real device or emulator (run with `./gradlew connectedDebugAndroidTest`).
 * They verify what TalkBack users depend on: labels, roles, touch-target sizes, headings.
 */
class AccessibilityTest {
    @get:Rule val rule = createComposeRule()

    @Test fun voice_button_has_a_meaningful_label_for_every_state_and_is_huge() {
        for (phase in Phase.entries) {
            rule.setContent { EcoleEyesTheme { VoiceButton(phase, onClick = {}) } }
            val node = rule.onAllNodes(hasClickAction()).fetchSemanticsNodes().single()
            val desc = node.config.getOrNull(SemanticsProperties.ContentDescription)?.joinToString(" ").orEmpty()
            assertTrue("state $phase needs a description, got '$desc'", desc.length > 10)
        }
        rule.setContent { EcoleEyesTheme { VoiceButton(Phase.IDLE, onClick = {}) } }
        rule.onAllNodes(hasClickAction())[0].assertWidthIsAtLeast(180.dp).assertHeightIsAtLeast(180.dp).assertHasClickAction()
    }

    @Test fun big_buttons_meet_the_48dp_touch_target_and_expose_their_label() {
        rule.setContent { EcoleEyesTheme { BigButton("Read the text", onClick = {}) } }
        rule.onNodeWithContentDescription("Read the text").assertHasClickAction().assertHeightIsAtLeast(48.dp)
    }

    @Test fun screen_frame_has_a_back_button_and_a_heading() {
        rule.setContent { EcoleEyesTheme { ScreenFrame("Settings", onBack = {}) { Text("content") } } }
        rule.onNodeWithContentDescription("Back").assertHasClickAction().assertHeightIsAtLeast(48.dp).assertWidthIsAtLeast(48.dp)
        val heading = SemanticsMatcher("is heading") { it.config.contains(SemanticsProperties.Heading) }
        rule.onAllNodes(heading).assertCountEquals(1)
    }

    @Test fun every_clickable_element_on_a_screen_has_a_spoken_label() {
        rule.setContent {
            EcoleEyesTheme {
                ScreenFrame("Test", onBack = {}) {
                    BigButton("One", {}); BigButton("Two", {}); VoiceButton(Phase.IDLE, {})
                }
            }
        }
        for (n in rule.onAllNodes(hasClickAction()).fetchSemanticsNodes()) {
            val cd = n.config.getOrNull(SemanticsProperties.ContentDescription)
            val text = n.config.getOrNull(SemanticsProperties.Text)
            assertTrue("clickable node without a label: ${n.config}", !cd.isNullOrEmpty() || !text.isNullOrEmpty())
        }
    }
}
