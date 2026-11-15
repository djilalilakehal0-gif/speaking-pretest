package com.ecoleeyes.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.text.KeyboardOptions
import com.ecoleeyes.AppGraph
import com.ecoleeyes.app.R
import com.ecoleeyes.core.Consent
import com.ecoleeyes.core.Lang
import com.ecoleeyes.voice.Screen

@Composable
fun SettingsScreen(graph: AppGraph) {
    val c = graph.controller
    val st by graph.settings.state.collectAsState()
    var backend by remember(st.backendUrl) { mutableStateOf(st.backendUrl) }
    var token by remember(st.appToken) { mutableStateOf(st.appToken) }
    val saved = stringResource(R.string.settings_saved)
    var savedFlag by remember { mutableStateOf(false) }
    var testResult by remember { mutableStateOf<String?>(null) }
    val testingText = stringResource(R.string.settings_ai_testing)

    ScreenFrame(stringResource(R.string.screen_settings), onBack = { c.navigate(Screen.HOME) }) {
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            // AI service: first thing on the page, with a clear status and a real connection test.
            Section(stringResource(R.string.settings_ai_title))
            val statusRes = when {
                !st.backendConfigured -> R.string.settings_ai_status_none
                !st.cloudAllowed -> R.string.settings_ai_status_off
                else -> R.string.settings_ai_status_ready
            }
            val status = testResult ?: stringResource(statusRes)
            Text(status, style = MaterialTheme.typography.bodyLarge, color = EeColors.OnDark, modifier = Modifier.semantics { liveRegion = androidx.compose.ui.semantics.LiveRegionMode.Polite })
            val colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = EeColors.OnDark, unfocusedTextColor = EeColors.OnDark,
                focusedBorderColor = EeColors.Electric, unfocusedBorderColor = EeColors.Electric,
                focusedLabelColor = EeColors.Electric, unfocusedLabelColor = EeColors.Muted, cursorColor = EeColors.OnDark,
            )
            OutlinedTextField(
                backend, { backend = it; savedFlag = false; testResult = null }, label = { Text(stringResource(R.string.settings_backend)) },
                placeholder = { Text(stringResource(R.string.settings_backend_hint)) }, singleLine = true, colors = colors,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri), modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                token, { token = it; savedFlag = false; testResult = null }, label = { Text(stringResource(R.string.settings_token)) }, singleLine = true, colors = colors,
                visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth(),
            )
            SwitchRow(stringResource(R.string.settings_cloud), st.cloudAllowed) { on -> c.setCloudNow(on) }
            BigButton(if (savedFlag) saved else stringResource(R.string.settings_save), {
                graph.settings.update { it.copy(backendUrl = backend, appToken = token) }; savedFlag = true
            }, Modifier.fillMaxWidth(), stateText = if (savedFlag) saved else null)
            BigButton(stringResource(R.string.settings_ai_test), {
                graph.settings.update { it.copy(backendUrl = backend, appToken = token) }; savedFlag = true
                testResult = testingText
                c.testAi { ok, message -> testResult = message }
            }, Modifier.fillMaxWidth(), emphasized = false)

            Section(stringResource(R.string.settings_language))
            Lang.entries.forEach { l ->
                Row(
                    Modifier.fillMaxWidth().heightIn(min = 64.dp)
                        .selectable(selected = st.lang == l, role = Role.RadioButton, onClick = { graph.settings.update { it.copy(lang = l) } })
                        .padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    androidx.compose.material3.RadioButton(selected = st.lang == l, onClick = null)
                    Text(l.nativeName, style = MaterialTheme.typography.bodyLarge, color = EeColors.OnDark, modifier = Modifier.padding(start = 12.dp))
                }
            }

            LabeledSlider(stringResource(R.string.settings_speed), st.speechRate, 0.5f..2.0f, "%.1fx".format(st.speechRate)) { v -> graph.settings.update { it.copy(speechRate = v) } }
            LabeledSlider(stringResource(R.string.settings_volume), st.speechVolume, 0.2f..1.0f, "${(st.speechVolume * 100).toInt()}%") { v -> graph.settings.update { it.copy(speechVolume = v) } }
            LabeledSlider(stringResource(R.string.settings_live_interval, st.liveIntervalSec), st.liveIntervalSec.toFloat(), 4f..30f, "") { v -> graph.settings.update { it.copy(liveIntervalSec = v.toInt()) } }

            SwitchRow(stringResource(R.string.settings_announce), st.announceUploads) { on -> graph.settings.update { it.copy(announceUploads = on) } }
            SwitchRow(stringResource(R.string.settings_offline_stt), st.preferOfflineStt) { on -> graph.settings.update { it.copy(preferOfflineStt = on) } }
            SwitchRow(stringResource(R.string.settings_barge_in), st.bargeIn) { on -> graph.settings.update { it.copy(bargeIn = on) } }
            SwitchRow(stringResource(R.string.settings_handsfree) + ". " + stringResource(R.string.settings_handsfree_desc), st.handsFree) { on -> c.setHandsFree(on) }

            BigButton(stringResource(R.string.clear_history), c::clearHistoryNow, Modifier.fillMaxWidth(), Icons.Filled.DeleteSweep, emphasized = false)
            BigButton(stringResource(R.string.tile_privacy), { c.navigate(Screen.PRIVACY) }, Modifier.fillMaxWidth().padding(bottom = 24.dp), emphasized = false)
        }
    }
}

@Composable
private fun Section(text: String) =
    Text(text, style = MaterialTheme.typography.titleMedium, color = EeColors.Electric, modifier = Modifier.semantics { heading() })

@Composable
private fun SwitchRow(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        Modifier.fillMaxWidth().heightIn(min = 72.dp)
            .toggleable(value = checked, role = Role.Switch, onValueChange = onChange)
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, style = MaterialTheme.typography.bodyLarge, color = EeColors.OnDark, modifier = Modifier.weight(1f).padding(end = 12.dp))
        Switch(checked = checked, onCheckedChange = null)
    }
}

@Composable
private fun LabeledSlider(label: String, value: Float, range: ClosedFloatingPointRange<Float>, valueText: String, onChange: (Float) -> Unit) {
    Column(Modifier.fillMaxWidth()) {
        Text(if (valueText.isBlank()) label else "$label: $valueText", style = MaterialTheme.typography.bodyLarge, color = EeColors.OnDark)
        Slider(
            value = value, onValueChange = onChange, valueRange = range,
            colors = SliderDefaults.colors(thumbColor = EeColors.Electric, activeTrackColor = EeColors.Electric),
            modifier = Modifier.heightIn(min = 56.dp).semantics { contentDescription = label; stateDescription = valueText.ifBlank { label } },
        )
    }
}
