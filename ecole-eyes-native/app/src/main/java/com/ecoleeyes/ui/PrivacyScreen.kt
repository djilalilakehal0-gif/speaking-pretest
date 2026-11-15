package com.ecoleeyes.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.ecoleeyes.AppGraph
import com.ecoleeyes.app.R
import com.ecoleeyes.voice.Screen

@Composable
fun PrivacyScreen(graph: AppGraph) {
    val c = graph.controller
    val body = stringResource(R.string.privacy_body)
    ScreenFrame(stringResource(R.string.screen_privacy), onBack = { c.navigate(Screen.HOME) }) {
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            BigButton(stringResource(R.string.docs_read, stringResource(R.string.screen_privacy)), { c.readAloud(body) }, Modifier.fillMaxWidth(), Icons.AutoMirrored.Filled.VolumeUp)
            Text(body, style = MaterialTheme.typography.bodyLarge, color = EeColors.OnDark, modifier = Modifier.padding(vertical = 16.dp))
        }
    }
}
