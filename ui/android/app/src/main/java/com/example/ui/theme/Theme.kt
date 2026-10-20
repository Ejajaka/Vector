package com.example.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

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
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            if (window != null) {
                val insetsController = WindowCompat.getInsetsController(window, view)
                insetsController.isAppearanceLightStatusBars = !darkTheme
                insetsController.isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
