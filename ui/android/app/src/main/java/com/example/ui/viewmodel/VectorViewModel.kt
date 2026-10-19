package com.example.ui.viewmodel

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.analyzer.VectorRuleAnalyzer
import com.example.data.model.AnalysisMetrics
import com.example.data.model.AnalysisResult
import com.example.data.model.FindingType
import com.example.data.model.RiskLevel
import com.example.data.repository.AnalyzerRepository
import com.example.data.repository.HistoryRepository
import com.example.data.repository.LocalHistoryRepository
import com.example.util.NetworkMonitor
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

enum class Screen {
    ONBOARDING,
    HOME,
    ANALYZE,
    RESULTS,
    IMPROVED_PROMPT,
    HISTORY,
    SETTINGS,
    ABOUT
}

enum class ThemeMode {
    SYSTEM,
    LIGHT,
    DARK
}

enum class HistorySort {
    NEWEST,
    HIGHEST_RISK
}

class VectorViewModel(application: Application) : AndroidViewModel(application) {

    private val prefs = application.getSharedPreferences("vector_app_prefs", Context.MODE_PRIVATE)
    private val analyzerRepository: AnalyzerRepository = VectorRuleAnalyzer()
    private val historyRepository: HistoryRepository = LocalHistoryRepository(application)
    private val networkMonitor = NetworkMonitor(application)

    // Network Connectivity
    val isOnline: StateFlow<Boolean> = networkMonitor.isOnline
    private val _isNetworkSimulated = MutableStateFlow(networkMonitor.isSimulated())
    val isNetworkSimulated: StateFlow<Boolean> = _isNetworkSimulated.asStateFlow()

    // Onboarding
    private val _isOnboardingCompleted = MutableStateFlow(prefs.getBoolean("onboarding_completed", false))
    val isOnboardingCompleted: StateFlow<Boolean> = _isOnboardingCompleted.asStateFlow()

    // Navigation
    private val initialScreen = if (_isOnboardingCompleted.value) Screen.HOME else Screen.ONBOARDING
    private val _currentScreen = MutableStateFlow(initialScreen)
    val currentScreen: StateFlow<Screen> = _currentScreen.asStateFlow()

    private val screenStack = mutableListOf(initialScreen)

    // Theme & Settings
    private val _themeMode = MutableStateFlow(ThemeMode.SYSTEM)
    val themeMode: StateFlow<ThemeMode> = _themeMode.asStateFlow()

    private val _demoMode = MutableStateFlow(true)
    val demoMode: StateFlow<Boolean> = _demoMode.asStateFlow()

    // Prompt Input
    private val _promptInput = MutableStateFlow("")
    val promptInput: StateFlow<String> = _promptInput.asStateFlow()

    private val _inputError = MutableStateFlow<String?>(null)
    val inputError: StateFlow<String?> = _inputError.asStateFlow()

    private val _isAnalyzing = MutableStateFlow(false)
    val isAnalyzing: StateFlow<Boolean> = _isAnalyzing.asStateFlow()

    // Current Analysis
    private val _currentAnalysis = MutableStateFlow<AnalysisResult?>(null)
    val currentAnalysis: StateFlow<AnalysisResult?> = _currentAnalysis.asStateFlow()

    // Selected Clauses for Improved Prompt
    private val _selectedClauseIds = MutableStateFlow<Set<String>>(emptySet())
    val selectedClauseIds: StateFlow<Set<String>> = _selectedClauseIds.asStateFlow()

    // Editable Improved Prompt Preview
    private val _improvedPromptText = MutableStateFlow("")
    val improvedPromptText: StateFlow<String> = _improvedPromptText.asStateFlow()

    // History Filter & Search
    private val _historySearch = MutableStateFlow("")
    val historySearch: StateFlow<String> = _historySearch.asStateFlow()

    private val _historyFilterRisk = MutableStateFlow<RiskLevel?>(null)
    val historyFilterRisk: StateFlow<RiskLevel?> = _historyFilterRisk.asStateFlow()

    private val _historySort = MutableStateFlow(HistorySort.NEWEST)
    val historySort: StateFlow<HistorySort> = _historySort.asStateFlow()

    // Snackbar / Feedback Message
    private val _snackbarMessage = MutableStateFlow<String?>(null)
    val snackbarMessage: StateFlow<String?> = _snackbarMessage.asStateFlow()

    // Filtered History
    val historyList: StateFlow<List<AnalysisResult>> = combine(
        historyRepository.getAnalyses(includeDemo = true),
        _demoMode,
        _historySearch,
        _historyFilterRisk,
        _historySort
    ) { all, isDemo, query, riskFilter, sort ->
        var filtered = all.filter { if (isDemo) true else !it.isDemo }
        if (query.isNotBlank()) {
            filtered = filtered.filter { it.prompt.contains(query, ignoreCase = true) }
        }
        if (riskFilter != null) {
            filtered = filtered.filter { it.riskLevel == riskFilter }
        }
        when (sort) {
            HistorySort.NEWEST -> filtered.sortedByDescending { it.timestamp }
            HistorySort.HIGHEST_RISK -> filtered.sortedByDescending { it.riskScore }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Metrics
    val metrics: StateFlow<AnalysisMetrics> = combine(
        _demoMode,
        historyRepository.getMetrics(includeDemo = true),
        historyRepository.getMetrics(includeDemo = false)
    ) { isDemo, demoMetrics, liveMetrics ->
        if (isDemo) demoMetrics else liveMetrics
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), AnalysisMetrics())

    val examplePrompts = analyzerRepository.getExamplePrompts()

    fun navigateTo(screen: Screen) {
        if (_currentScreen.value != screen) {
            screenStack.add(screen)
            _currentScreen.value = screen
        }
    }

    fun handleBack(): Boolean {
        if (screenStack.size > 1) {
            screenStack.removeAt(screenStack.size - 1)
            _currentScreen.value = screenStack.last()
            return true
        }
        return false
    }

    fun finishOnboarding() {
        _isOnboardingCompleted.value = true
        prefs.edit().putBoolean("onboarding_completed", true).apply()
        screenStack.clear()
        screenStack.add(Screen.HOME)
        _currentScreen.value = Screen.HOME
    }

    fun startOnboarding() {
        navigateTo(Screen.ONBOARDING)
    }

    fun setSimulatedOffline(offline: Boolean?) {
        networkMonitor.setSimulatedOffline(offline)
        _isNetworkSimulated.value = networkMonitor.isSimulated()
        val statusText = if (networkMonitor.isOnline.value) "Switched to Online mode." else "Switched to Offline mode."
        _snackbarMessage.value = statusText
    }

    fun onPromptChange(newText: String) {
        _promptInput.value = newText
        if (_inputError.value != null && newText.isNotBlank()) {
            _inputError.value = null
        }
    }

    fun clearPrompt() {
        _promptInput.value = ""
        _inputError.value = null
    }

    fun selectExample(text: String) {
        _promptInput.value = text
        _inputError.value = null
    }

    fun analyzePrompt(isDeepScan: Boolean = false) {
        val text = _promptInput.value.trim()
        if (text.isBlank()) {
            _inputError.value = "Please enter an AWS infrastructure prompt or select an example."
            return
        }

        val effectiveDeepScan = if (isDeepScan && !networkMonitor.isOnline.value) {
            _snackbarMessage.value = "Deep Scan is unavailable while offline. Executing on-device Rule-Based Analysis."
            false
        } else {
            isDeepScan
        }

        viewModelScope.launch {
            _isAnalyzing.value = true
            _inputError.value = null
            try {
                val result = analyzerRepository.analyze(text, effectiveDeepScan)
                _currentAnalysis.value = result
                // Auto-select missing controls and risky statements by default for easy improvement
                val eligibleIds = result.findings
                    .filter { it.isSelectable && it.type != FindingType.DETECTED_CONTROL }
                    .map { it.id }
                    .toSet()
                _selectedClauseIds.value = eligibleIds

                // Update improved prompt preview
                val clauses = result.findings
                    .filter { eligibleIds.contains(it.id) }
                    .map { it.securityClause }
                _improvedPromptText.value = analyzerRepository.buildImprovedPrompt(result.prompt, clauses)

                historyRepository.saveAnalysis(result)
                navigateTo(Screen.RESULTS)
            } catch (e: Exception) {
                _snackbarMessage.value = "Analysis failed: ${e.message}"
            } finally {
                _isAnalyzing.value = false
            }
        }
    }

    fun toggleClauseSelection(findingId: String) {
        val current = _selectedClauseIds.value.toMutableSet()
        if (current.contains(findingId)) {
            current.remove(findingId)
        } else {
            current.add(findingId)
        }
        _selectedClauseIds.value = current
        updateImprovedPromptPreview()
    }

    fun selectAllRecommendations() {
        val analysis = _currentAnalysis.value ?: return
        val allIds = analysis.findings
            .filter { it.isSelectable && it.type != FindingType.DETECTED_CONTROL }
            .map { it.id }
            .toSet()
        _selectedClauseIds.value = allIds
        updateImprovedPromptPreview()
    }

    fun clearAllRecommendations() {
        _selectedClauseIds.value = emptySet()
        updateImprovedPromptPreview()
    }

    private fun updateImprovedPromptPreview() {
        val analysis = _currentAnalysis.value ?: return
        val selectedIds = _selectedClauseIds.value
        val clauses = analysis.findings
            .filter { selectedIds.contains(it.id) }
            .map { it.securityClause }
        _improvedPromptText.value = analyzerRepository.buildImprovedPrompt(analysis.prompt, clauses)
    }

    fun onImprovedPromptTextChange(newText: String) {
        _improvedPromptText.value = newText
    }

    fun resetToOriginalPrompt() {
        val analysis = _currentAnalysis.value ?: return
        _improvedPromptText.value = analysis.prompt
        _selectedClauseIds.value = emptySet()
    }

    fun reanalyzeImprovedPrompt() {
        val revisedPrompt = _improvedPromptText.value.trim()
        if (revisedPrompt.isBlank()) return
        _promptInput.value = revisedPrompt
        analyzePrompt(isDeepScan = false)
    }

    fun reopenAnalysis(analysis: AnalysisResult) {
        _currentAnalysis.value = analysis
        _promptInput.value = analysis.prompt
        val eligibleIds = analysis.findings
            .filter { it.isSelectable && it.type != FindingType.DETECTED_CONTROL }
            .map { it.id }
            .toSet()
        _selectedClauseIds.value = eligibleIds
        val clauses = analysis.findings
            .filter { eligibleIds.contains(it.id) }
            .map { it.securityClause }
        _improvedPromptText.value = analyzerRepository.buildImprovedPrompt(analysis.prompt, clauses)
        navigateTo(Screen.RESULTS)
    }

    fun deleteAnalysis(id: String) {
        viewModelScope.launch {
            historyRepository.deleteAnalysis(id)
            _snackbarMessage.value = "Analysis deleted from history."
        }
    }

    fun clearHistory() {
        viewModelScope.launch {
            historyRepository.clearHistory()
            _snackbarMessage.value = "All analysis history cleared."
        }
    }

    fun setHistorySearch(query: String) {
        _historySearch.value = query
    }

    fun setHistoryFilterRisk(risk: RiskLevel?) {
        _historyFilterRisk.value = risk
    }

    fun setHistorySort(sort: HistorySort) {
        _historySort.value = sort
    }

    fun setThemeMode(mode: ThemeMode) {
        _themeMode.value = mode
    }

    fun setDemoMode(enabled: Boolean) {
        _demoMode.value = enabled
    }

    fun showSnackbar(message: String) {
        _snackbarMessage.value = message
    }

    fun clearSnackbar() {
        _snackbarMessage.value = null
    }
}
