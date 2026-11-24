package com.ecoleeyes.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.LocalHospital
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.ecoleeyes.AppGraph
import com.ecoleeyes.app.R
import com.ecoleeyes.voice.Screen

/**
 * Emergency screen. Everything here is also available by voice ("emergency École Eyes").
 * Calls to the contact are confirmed aloud; emergency numbers open the dialer (the user presses call);
 * location goes into an SMS the user sends. Nothing is sent automatically.
 */
@Composable
fun EmergencyScreen(graph: AppGraph) {
    val c = graph.controller
    val st by graph.settings.state.collectAsState()
    ScreenFrame(stringResource(R.string.screen_emergency), onBack = { c.navigate(Screen.HOME) }) {
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(stringResource(R.string.em_instructions), style = MaterialTheme.typography.bodyLarge, color = EeColors.OnDark)
            BigButton(
                stringResource(R.string.em_btn_services, st.emergencyServices), c::dialEmergencyServicesNow,
                Modifier.fillMaxWidth().heightIn(min = 96.dp), Icons.Filled.LocalHospital, danger = true,
            )
            if (st.hasEmergencyContact) {
                BigButton(stringResource(R.string.em_btn_contact, st.emergencyName.ifBlank { st.emergencyNumber }), c::callEmergencyContactNow, Modifier.fillMaxWidth().heightIn(min = 96.dp), Icons.Filled.Call)
            } else {
                BigButton(stringResource(R.string.em_btn_contact_none), { c.navigate(Screen.SETTINGS) }, Modifier.fillMaxWidth(), Icons.Filled.Settings, emphasized = false)
            }
            BigButton(stringResource(R.string.em_btn_location), c::shareLocationNow, Modifier.fillMaxWidth(), Icons.Filled.LocationOn, emphasized = false)
            VoiceButton(graph.controller.state.collectAsState().value.phase, onClick = c::onMicTap, modifier = Modifier.padding(top = 8.dp), size = 160.dp)
        }
    }
}
