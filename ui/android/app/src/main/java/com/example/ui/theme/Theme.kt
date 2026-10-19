package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = VectorPrimaryTeal,
    onPrimary = Color.White,
    primaryContainer = VectorSoftGreen,
    onPrimaryContainer = VectorDarkTeal,
    secondary = VectorMustardYellow,
    onSecondary = VectorDarkTeal,
    secondaryContainer = Color(0xFFFBF8EE),
    onSecondaryContainer = VectorPrimaryText,
    tertiary = VectorDarkTeal,
    onTertiary = Color.White,
    background = VectorBackground,
    onBackground = VectorPrimaryText,
    surface = VectorCardBackground,
    onSurface = VectorPrimaryText,
    surfaceVariant = Color(0xFFEFECE2),
    onSurfaceVariant = VectorSecondaryText,
    outline = VectorBorder,
    outlineVariant = Color(0xFFECE9DF),
    error = VectorCriticalRed,
    onError = Color.White
)

private val DarkColorScheme = darkColorScheme(
    primary = VectorDarkPrimaryTeal,
    onPrimary = VectorDarkBackground,
    primaryContainer = VectorDarkDarkTeal,
    onPrimaryContainer = Color(0xFFE6EFE6),
    secondary = VectorDarkMustardYellow,
    onSecondary = VectorDarkBackground,
    secondaryContainer = Color(0xFF33301E),
    onSecondaryContainer = Color(0xFFF9ECA8),
    tertiary = VectorDarkMustardYellow,
    onTertiary = VectorDarkBackground,
    background = VectorDarkBackground,
    onBackground = VectorDarkText,
    surface = VectorDarkSurface,
    onSurface = VectorDarkText,
    surfaceVariant = VectorDarkSurfaceVariant,
    onSurfaceVariant = VectorDarkSecondaryText,
    outline = VectorDarkBorder,
    outlineVariant = Color(0xFF3B4B4F),
    error = VectorDarkCriticalRed,
    onError = VectorDarkBackground
)

@Composable
fun VectorTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}

