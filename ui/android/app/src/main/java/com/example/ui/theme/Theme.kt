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
    secondaryContainer = Color(0xFFF9F5E6),
    onSecondaryContainer = VectorPrimaryText,
    tertiary = VectorDarkTeal,
    onTertiary = Color.White,
    background = VectorBackground,
    onBackground = VectorPrimaryText,
    surface = VectorCardBackground,
    onSurface = VectorPrimaryText,
    surfaceVariant = Color(0xFFF0EEE5),
    onSurfaceVariant = VectorSecondaryText,
    outline = VectorBorder,
    error = VectorCriticalRed,
    onError = Color.White
)

private val DarkColorScheme = darkColorScheme(
    primary = VectorDarkPrimaryTeal,
    onPrimary = VectorDarkBackground,
    primaryContainer = VectorDarkTeal,
    onPrimaryContainer = Color(0xFFE4EBDD),
    secondary = VectorMustardYellow,
    onSecondary = VectorDarkBackground,
    secondaryContainer = Color(0xFF3B3928),
    onSecondaryContainer = Color(0xFFF7ECC2),
    tertiary = VectorSoftGreen,
    onTertiary = VectorDarkBackground,
    background = VectorDarkBackground,
    onBackground = VectorDarkText,
    surface = VectorDarkCardBackground,
    onSurface = VectorDarkText,
    surfaceVariant = Color(0xFF263336),
    onSurfaceVariant = VectorDarkSecondaryText,
    outline = VectorDarkBorder,
    error = Color(0xFFE26D62),
    onError = Color.White
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
