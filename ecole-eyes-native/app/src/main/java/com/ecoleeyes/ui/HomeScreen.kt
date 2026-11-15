package com.ecoleeyes.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Accessibility
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.PrivacyTip
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.ecoleeyes.AppGraph
import com.ecoleeyes.app.R
import com.ecoleeyes.voice.Screen

@Composable
fun HomeScreen(graph: AppGraph) {
    val c = graph.controller
    val ui by c.state.collectAsState()
    val settings by graph.settings.state.collectAsState()
    Column(
        Modifier
            .fillMaxSize()
            .background(EeColors.Background)
            .windowInsetsPadding(WindowInsets.safeDrawing)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Image(painterResource(R.drawable.logo), contentDescription = null, modifier = Modifier.size(96.dp))
        Text(
            stringResource(R.string.app_name), style = MaterialTheme.typography.headlineLarge, color = EeColors.OnDark,
            modifier = Modifier.semantics { heading() },
        )
        Text(stringResource(R.string.tagline), style = MaterialTheme.typography.bodyMedium, color = EeColors.Muted, textAlign = TextAlign.Center)
        Spacer(Modifier.height(20.dp))
        VoiceButton(ui.phase, onClick = c::onMicTap)
        if (ui.partial.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text(ui.partial, style = MaterialTheme.typography.bodyLarge, color = EeColors.Electric, textAlign = TextAlign.Center)
        } else if (ui.lastSaid.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text(ui.lastSaid, style = MaterialTheme.typography.bodyMedium, color = EeColors.Muted, textAlign = TextAlign.Center, maxLines = 4)
        }
        Spacer(Modifier.height(20.dp))
        TileRow(
            Tile(Icons.AutoMirrored.Filled.Chat, stringResource(R.string.tile_assistant)) { c.navigate(Screen.ASSISTANT) },
            Tile(Icons.Filled.CameraAlt, stringResource(R.string.tile_camera)) { c.navigate(Screen.CAMERA) },
        )
        TileRow(
            Tile(Icons.Filled.Description, stringResource(R.string.tile_documents)) { c.navigate(Screen.DOCUMENTS) },
            Tile(Icons.Filled.Search, stringResource(R.string.tile_files)) { c.navigate(Screen.FILES) },
        )
        val langName = settings.lang.nativeName
        TileRow(
            Tile(Icons.Filled.Language, stringResource(R.string.tile_language) + ": " + langName) { c.cycleLanguage() },
            Tile(Icons.Filled.Accessibility, stringResource(R.string.tile_settings)) { c.navigate(Screen.SETTINGS) },
        )
        TileRow(Tile(Icons.Filled.PrivacyTip, stringResource(R.string.tile_privacy)) { c.navigate(Screen.PRIVACY) }, null)
    }
}

private class Tile(val icon: ImageVector, val label: String, val onClick: () -> Unit)

@Composable
private fun TileRow(a: Tile, b: Tile?) {
    Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        TileCard(a, Modifier.weight(1f))
        if (b != null) TileCard(b, Modifier.weight(1f)) else Spacer(Modifier.weight(1f))
    }
}

@Composable
private fun TileCard(t: Tile, modifier: Modifier) {
    val shape = RoundedCornerShape(20.dp)
    Column(
        modifier
            .heightIn(min = 112.dp)
            .clip(shape)
            .background(EeColors.Surface)
            .border(2.dp, EeColors.Electric, shape)
            .clickable(role = Role.Button, onClick = t.onClick)
            .padding(12.dp)
            .semantics(mergeDescendants = true) { contentDescription = t.label },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(t.icon, contentDescription = null, tint = EeColors.Electric, modifier = Modifier.size(40.dp))
        Spacer(Modifier.height(8.dp))
        Text(t.label, style = MaterialTheme.typography.titleMedium, color = EeColors.OnDark, textAlign = TextAlign.Center)
    }
}
