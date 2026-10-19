package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import com.example.ui.components.PersistentNetworkIndicator
import com.example.ui.components.VectorBottomBar
import com.example.ui.components.VectorTopBar
import com.example.ui.screens.AboutScreen
import com.example.ui.screens.AnalyzeScreen
import com.example.ui.screens.HistoryScreen
import com.example.ui.screens.HomeScreen
import com.example.ui.screens.ImprovedPromptScreen
import com.example.ui.screens.OnboardingScreen
import com.example.ui.screens.ResultsScreen
import com.example.ui.screens.SettingsScreen
import com.example.ui.theme.VectorTheme
import com.example.ui.viewmodel.Screen
import com.example.ui.viewmodel.ThemeMode
import com.example.ui.viewmodel.VectorViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: VectorViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val themeMode by viewModel.themeMode.collectAsState()
            val isDarkTheme = when (themeMode) {
                ThemeMode.SYSTEM -> isSystemInDarkTheme()
                ThemeMode.LIGHT -> false
                ThemeMode.DARK -> true
            }

            VectorTheme(darkTheme = isDarkTheme) {
                VectorApp(viewModel = viewModel)
            }
        }
    }
}

@Composable
fun VectorApp(viewModel: VectorViewModel) {
    val currentScreen by viewModel.currentScreen.collectAsState()
    val isOnline by viewModel.isOnline.collectAsState()
    val isNetworkSimulated by viewModel.isNetworkSimulated.collectAsState()
    val isOnboardingCompleted by viewModel.isOnboardingCompleted.collectAsState()
    val metrics by viewModel.metrics.collectAsState()
    val historyList by viewModel.historyList.collectAsState()
    val demoMode by viewModel.demoMode.collectAsState()
    val promptInput by viewModel.promptInput.collectAsState()
    val inputError by viewModel.inputError.collectAsState()
    val isAnalyzing by viewModel.isAnalyzing.collectAsState()
    val currentAnalysis by viewModel.currentAnalysis.collectAsState()
    val selectedClauseIds by viewModel.selectedClauseIds.collectAsState()
    val improvedPromptText by viewModel.improvedPromptText.collectAsState()
    val historySearch by viewModel.historySearch.collectAsState()
    val historyFilterRisk by viewModel.historyFilterRisk.collectAsState()
    val historySort by viewModel.historySort.collectAsState()
    val themeMode by viewModel.themeMode.collectAsState()
    val snackbarMessage by viewModel.snackbarMessage.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(snackbarMessage) {
        snackbarMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearSnackbar()
        }
    }

    val canNavigateBack = currentScreen == Screen.RESULTS ||
            currentScreen == Screen.IMPROVED_PROMPT ||
            currentScreen == Screen.ABOUT ||
            (currentScreen == Screen.ONBOARDING && isOnboardingCompleted)

    BackHandler(enabled = currentScreen != Screen.HOME && currentScreen != Screen.ONBOARDING) {
        if (!viewModel.handleBack()) {
            viewModel.navigateTo(Screen.HOME)
        }
    }

    if (currentScreen == Screen.ONBOARDING) {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            snackbarHost = { SnackbarHost(snackbarHostState) }
        ) { innerPadding ->
            OnboardingScreen(
                onFinishOnboarding = { viewModel.finishOnboarding() },
                modifier = Modifier.padding(innerPadding)
            )
        }
        return
    }

    val screenTitle = when (currentScreen) {
        Screen.HOME -> "Vector"
        Screen.ANALYZE -> "Analyze Prompt"
        Screen.RESULTS -> "Security Findings"
        Screen.IMPROVED_PROMPT -> "Improved Prompt"
        Screen.HISTORY -> "Analysis History"
        Screen.SETTINGS -> "Settings"
        Screen.ABOUT -> "About Vector"
        Screen.ONBOARDING -> "Onboarding"
    }

    val screenSubtitle = when (currentScreen) {
        Screen.HOME -> "AWS Cloud Security Diagnosis"
        Screen.RESULTS -> "Pre-generation evaluation"
        Screen.IMPROVED_PROMPT -> "Hardened requirements preview"
        Screen.ABOUT -> "Architecture security diagnosis"
        else -> null
    }

    val showBottomBar = currentScreen != Screen.IMPROVED_PROMPT

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            VectorTopBar(
                title = screenTitle,
                subtitle = screenSubtitle,
                canNavigateBack = canNavigateBack,
                onBackClick = { viewModel.handleBack() }
            )
        },
        bottomBar = {
            if (showBottomBar) {
                VectorBottomBar(
                    currentScreen = currentScreen,
                    onNavigate = { destination -> viewModel.navigateTo(destination) }
                )
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Persistent Online/Offline indicator on main screens (Home, Analyze, History)
            if (currentScreen == Screen.HOME || currentScreen == Screen.ANALYZE || currentScreen == Screen.HISTORY) {
                PersistentNetworkIndicator(
                    isOnline = isOnline,
                    isSimulated = isNetworkSimulated,
                    onToggleSimulatedOffline = { viewModel.setSimulatedOffline(it) }
                )
            }

            val screenModifier = Modifier.weight(1f)

            when (currentScreen) {
                Screen.HOME -> {
                    HomeScreen(
                        metrics = metrics,
                        recentAnalyses = historyList,
                        demoModeActive = demoMode,
                        onStartAnalysis = { viewModel.navigateTo(Screen.ANALYZE) },
                        onReopenAnalysis = { analysis -> viewModel.reopenAnalysis(analysis) },
                        onNavigateToHistory = { viewModel.navigateTo(Screen.HISTORY) },
                        onNavigateToAbout = { viewModel.navigateTo(Screen.ABOUT) },
                        modifier = screenModifier
                    )
                }
                Screen.ANALYZE -> {
                    AnalyzeScreen(
                        promptInput = promptInput,
                        inputError = inputError,
                        isAnalyzing = isAnalyzing,
                        examplePrompts = viewModel.examplePrompts,
                        onPromptChange = { viewModel.onPromptChange(it) },
                        onClearPrompt = { viewModel.clearPrompt() },
                        onSelectExample = { viewModel.selectExample(it) },
                        onAnalyze = { isDeepScan -> viewModel.analyzePrompt(isDeepScan) },
                        modifier = screenModifier
                    )
                }
                Screen.RESULTS -> {
                    val analysis = currentAnalysis
                    if (analysis != null) {
                        ResultsScreen(
                            analysis = analysis,
                            selectedClauseIds = selectedClauseIds,
                            improvedPromptText = improvedPromptText,
                            onToggleSelectClause = { viewModel.toggleClauseSelection(it) },
                            onSelectAll = { viewModel.selectAllRecommendations() },
                            onClearAll = { viewModel.clearAllRecommendations() },
                            onNavigateToImprovedPrompt = { viewModel.navigateTo(Screen.IMPROVED_PROMPT) },
                            onShowSnackbar = { viewModel.showSnackbar(it) },
                            modifier = screenModifier
                        )
                    } else {
                        viewModel.navigateTo(Screen.ANALYZE)
                    }
                }
                Screen.IMPROVED_PROMPT -> {
                    val analysis = currentAnalysis
                    if (analysis != null) {
                        ImprovedPromptScreen(
                            analysis = analysis,
                            improvedPromptText = improvedPromptText,
                            selectedClauseCount = selectedClauseIds.size,
                            onTextChanged = { viewModel.onImprovedPromptTextChange(it) },
                            onResetToOriginal = { viewModel.resetToOriginalPrompt() },
                            onReanalyze = { viewModel.reanalyzeImprovedPrompt() },
                            onShowSnackbar = { viewModel.showSnackbar(it) },
                            modifier = screenModifier
                        )
                    } else {
                        viewModel.navigateTo(Screen.ANALYZE)
                    }
                }
                Screen.HISTORY -> {
                    HistoryScreen(
                        analyses = historyList,
                        searchQuery = historySearch,
                        filterRisk = historyFilterRisk,
                        sortOrder = historySort,
                        onSearchChange = { viewModel.setHistorySearch(it) },
                        onFilterRiskChange = { viewModel.setHistoryFilterRisk(it) },
                        onSortChange = { viewModel.setHistorySort(it) },
                        onReopenAnalysis = { analysis -> viewModel.reopenAnalysis(analysis) },
                        onDeleteAnalysis = { id -> viewModel.deleteAnalysis(id) },
                        onClearHistory = { viewModel.clearHistory() },
                        onNavigateToAnalyze = { viewModel.navigateTo(Screen.ANALYZE) },
                        modifier = screenModifier
                    )
                }
                Screen.SETTINGS -> {
                    SettingsScreen(
                        themeMode = themeMode,
                        demoMode = demoMode,
                        isOnline = isOnline,
                        isSimulated = isNetworkSimulated,
                        onThemeModeChange = { viewModel.setThemeMode(it) },
                        onDemoModeChange = { viewModel.setDemoMode(it) },
                        onToggleSimulatedOffline = { viewModel.setSimulatedOffline(it) },
                        onOpenOnboarding = { viewModel.startOnboarding() },
                        onOpenAbout = { viewModel.navigateTo(Screen.ABOUT) },
                        modifier = screenModifier
                    )
                }
                Screen.ABOUT -> {
                    AboutScreen(
                        onAnalyzePrompt = { viewModel.navigateTo(Screen.ANALYZE) },
                        modifier = screenModifier
                    )
                }
                Screen.ONBOARDING -> {
                    // Handled above
                }
            }
        }
    }
}
