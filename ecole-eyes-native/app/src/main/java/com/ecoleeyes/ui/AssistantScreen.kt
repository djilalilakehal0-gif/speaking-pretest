package com.ecoleeyes.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.ecoleeyes.AppGraph
import com.ecoleeyes.app.R
import com.ecoleeyes.data.ChatLine
import com.ecoleeyes.voice.Screen

@Composable
fun AssistantScreen(graph: AppGraph) {
    val c = graph.controller
    val ui by c.state.collectAsState()
    val lines by c.transcript.collectAsState(initial = emptyList())
    val list = rememberLazyListState()
    LaunchedEffect(lines.size) { if (lines.isNotEmpty()) list.animateScrollToItem(lines.lastIndex) }

    ScreenFrame(stringResource(R.string.screen_assistant), onBack = { c.navigate(Screen.HOME) }) {
        Column(Modifier.fillMaxSize()) {
            if (lines.isEmpty()) {
                Text(stringResource(R.string.empty_conversation), style = MaterialTheme.typography.bodyLarge, color = EeColors.Muted, modifier = Modifier.padding(8.dp).weight(1f))
            } else {
                LazyColumn(Modifier.weight(1f), state = list, verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(lines, key = { it.id }) { Bubble(it) }
                }
            }
            if (ui.partial.isNotEmpty()) Text(ui.partial, color = EeColors.Electric, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.padding(vertical = 6.dp))
            Spacer(Modifier.height(8.dp))
            VoiceButton(ui.phase, onClick = c::onMicTap, size = 140.dp, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth().padding(bottom = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                BigButton(stringResource(R.string.repeat_last), { c.submitText("repeat") }, Modifier.weight(1f), Icons.Filled.Replay, emphasized = false)
                BigButton(stringResource(R.string.stop_speaking), c::stopSpeaking, Modifier.weight(1f), Icons.Filled.Stop, emphasized = false)
            }
            BigButton(stringResource(R.string.clear_history), c::clearHistoryNow, Modifier.fillMaxWidth().padding(bottom = 12.dp), Icons.Filled.DeleteSweep, emphasized = false)
        }
    }
}

@Composable
private fun Bubble(line: ChatLine) {
    val who = stringResource(if (line.fromUser) R.string.you_said else R.string.assistant_said)
    Column(
        Modifier
            .fillMaxWidth()
            .semantics(mergeDescendants = true) { contentDescription = "$who: ${line.text}" },
        horizontalAlignment = if (line.fromUser) Alignment.End else Alignment.Start,
    ) {
        Text(who, style = MaterialTheme.typography.labelLarge, color = EeColors.Electric)
        Text(
            line.text, style = MaterialTheme.typography.bodyLarge, color = EeColors.OnDark,
            textAlign = TextAlign.Start,
            modifier = Modifier
                .background(if (line.fromUser) EeColors.SurfaceHigh else EeColors.Surface, RoundedCornerShape(16.dp))
                .padding(14.dp),
        )
    }
}
