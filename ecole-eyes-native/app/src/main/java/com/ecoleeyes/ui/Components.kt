package com.ecoleeyes.ui

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.RecordVoiceOver
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.ecoleeyes.app.R
import com.ecoleeyes.controller.Phase

/** Screen frame: back button + heading. The heading is announced first by TalkBack. */
@Composable
fun ScreenFrame(title: String, onBack: () -> Unit, content: @Composable () -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .background(EeColors.Background)
            .windowInsetsPadding(WindowInsets.safeDrawing)
            .padding(horizontal = 16.dp),
    ) {
        Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack, modifier = Modifier.size(64.dp)) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.nav_back), tint = EeColors.OnDark, modifier = Modifier.size(36.dp))
            }
            Text(title, style = MaterialTheme.typography.headlineMedium, color = EeColors.OnDark, modifier = Modifier.padding(start = 8.dp).semantics { heading() })
        }
        content()
    }
}

/** Large rectangular button used everywhere (min 72dp tall). Label doubles as the accessibility label. */
@Composable
fun BigButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    emphasized: Boolean = true,
    description: String = label,
    stateText: String? = null,
) {
    val shape = RoundedCornerShape(20.dp)
    Row(
        modifier
            .heightIn(min = 72.dp)
            .clip(shape)
            .background(if (emphasized) EeColors.ElectricDeep else EeColors.Surface)
            .border(BorderStroke(2.dp, EeColors.Electric), shape)
            .clickable(role = Role.Button, onClick = onClick)
            .padding(horizontal = 20.dp, vertical = 14.dp)
            .semantics(mergeDescendants = true) {
                contentDescription = description
                stateText?.let { stateDescription = it }
            },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        if (icon != null) { Icon(icon, contentDescription = null, tint = EeColors.OnDark, modifier = Modifier.size(32.dp)); Spacer(Modifier.size(12.dp)) }
        Text(label, style = MaterialTheme.typography.labelLarge, color = EeColors.OnDark, textAlign = TextAlign.Center)
    }
}

/** The big central voice button. State is conveyed by icon, text and description, never by colour alone. */
@Composable
fun VoiceButton(phase: Phase, onClick: () -> Unit, modifier: Modifier = Modifier, size: androidx.compose.ui.unit.Dp = 220.dp) {
    val pulse = rememberInfiniteTransition(label = "pulse")
    val s by pulse.animateFloat(1f, 1.07f, infiniteRepeatable(tween(900), RepeatMode.Reverse), label = "scale")
    val active = phase == Phase.LISTENING
    val cd = stringResource(when (phase) {
        Phase.IDLE -> R.string.mic_cd_idle
        Phase.LISTENING -> R.string.mic_cd_listening
        Phase.THINKING -> R.string.mic_cd_thinking
        Phase.SPEAKING -> R.string.mic_cd_speaking
    })
    val icon = when (phase) { Phase.IDLE -> Icons.Filled.Mic; Phase.LISTENING -> Icons.Filled.Stop; Phase.THINKING -> Icons.Filled.Psychology; Phase.SPEAKING -> Icons.Filled.RecordVoiceOver }
    val label = stringResource(when (phase) {
        Phase.IDLE -> R.string.mic_idle; Phase.LISTENING -> R.string.mic_listening; Phase.THINKING -> R.string.mic_thinking; Phase.SPEAKING -> R.string.mic_speaking
    })
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            Modifier
                .size(size)
                .scale(if (active) s else 1f)
                .clip(CircleShape)
                .background(Brush.radialGradient(listOf(EeColors.Electric, EeColors.ElectricDeep)))
                .border(BorderStroke(if (active) 8.dp else 4.dp, EeColors.OnDark), CircleShape)
                .clickable(role = Role.Button, onClick = onClick)
                .semantics { contentDescription = cd },
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = EeColors.OnDark, modifier = Modifier.size(size * 0.45f))
        }
        Spacer(Modifier.height(12.dp))
        Text(
            label, style = MaterialTheme.typography.titleLarge, color = EeColors.OnDark, textAlign = TextAlign.Center,
            modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
        )
    }
}
