package com.ecoleeyes.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

object EeColors {
    val Background = Color(0xFF050B1A)   // near-black navy
    val Surface = Color(0xFF0C1A33)      // deep navy
    val SurfaceHigh = Color(0xFF14284D)
    val Electric = Color(0xFF3B8BFF)     // electric blue accent (text/icons on dark: contrast 6.4:1)
    val ElectricDeep = Color(0xFF1B5FD1) // button fill, white text on it: 5.9:1
    val OnDark = Color(0xFFFFFFFF)
    val Muted = Color(0xFFB8C7E0)        // secondary text: 10:1 on Background
    val Error = Color(0xFFFF8A80)
    val Danger = Color(0xFFB3261E)       // emergency button fill, white text on it: 6.5:1
}

private val scheme = darkColorScheme(
    primary = EeColors.ElectricDeep, onPrimary = EeColors.OnDark,
    secondary = EeColors.Electric, onSecondary = Color.Black,
    background = EeColors.Background, onBackground = EeColors.OnDark,
    surface = EeColors.Surface, onSurface = EeColors.OnDark,
    surfaceVariant = EeColors.SurfaceHigh, onSurfaceVariant = EeColors.Muted,
    outline = EeColors.Electric, error = EeColors.Error,
)

// Larger than Material defaults on purpose: this app is for people with low vision too.
private val type = Typography(
    headlineLarge = TextStyle(fontSize = 34.sp, lineHeight = 42.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp),
    headlineMedium = TextStyle(fontSize = 28.sp, lineHeight = 36.sp, fontWeight = FontWeight.Bold),
    titleLarge = TextStyle(fontSize = 24.sp, lineHeight = 32.sp, fontWeight = FontWeight.SemiBold),
    titleMedium = TextStyle(fontSize = 20.sp, lineHeight = 28.sp, fontWeight = FontWeight.SemiBold),
    bodyLarge = TextStyle(fontSize = 20.sp, lineHeight = 30.sp),
    bodyMedium = TextStyle(fontSize = 18.sp, lineHeight = 26.sp),
    labelLarge = TextStyle(fontSize = 18.sp, lineHeight = 24.sp, fontWeight = FontWeight.SemiBold),
)

/** Always dark: high contrast and calm. (Light theme is intentionally not offered.) */
@Composable
fun EcoleEyesTheme(content: @Composable () -> Unit) {
    @Suppress("UNUSED_VARIABLE") val dark = isSystemInDarkTheme()
    MaterialTheme(colorScheme = scheme, typography = type, content = content)
}
