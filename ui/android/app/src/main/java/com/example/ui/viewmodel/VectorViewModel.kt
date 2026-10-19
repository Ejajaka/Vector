package com.example.ui.viewmodel

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.analyzer.VectorJsAnalyzer
import com.example.data.llm.DeepScanResult
import com.example.data.llm.DeepScanSettings
import com.example.data.llm.LlmDeepScanner
import com.example.data.model.AnalysisMetrics
import com.example.data.model.AnalysisResult
import com.example.data.model.FindingType
import com.example.data.model.RiskLevel
import com.example.data.model.SecurityFinding
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
    // Android executes the same engine/src JavaScript as the web clients.
    private val analyzerRepository: AnalyzerRepository = VectorJsAnalyzer(application)
    private val historyRepository: HistoryRepository = LocalHistoryRepository(application)
    private val networkMonitor = NetworkMonitor(application)

    // Deep scan (LLM) settings
    private val _deepScanSettings = MutableStateFlow(loadDeepScanSettings())
    val deepScanSettings: StateFlow<DeepScanSettings> = _deepScanSettings.asStateFlow()

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

    // Filtered History (real analyses only)
    val historyList: StateFlow<List<AnalysisResult>> = combine(
        historyRepository.getAnalyses(includeDemo = false),
        _historySearch,
        _historyFilterRisk,
        _historySort
    ) { all, query, riskFilter, sort ->
        var filtered = all
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

    // Metrics (real analyses only)
    val metrics: StateFlow<AnalysisMetrics> = historyRepository.getMetrics(includeDemo = false)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), AnalysisMetrics())

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

        viewModelScope.launch {
            _isAnalyzing.value = true
            _inputError.value = null
            try {
                // Rules always run first. The LLM only adds controls (and confirms
                // low-priority ones) so its result can be merged before we show it.
                var result = analyzerRepository.analyze(text, false)
                val settings = _deepScanSettings.value
                val lowConfidence = result.securityCoverage < 50 || result.confidence < 75
                val wantsDeepScan = isDeepScan || (settings.autoDeepScan && settings.isConfigured && lowConfidence)

                if (wantsDeepScan) {
                    when {
                        !settings.isConfigured -> {
                            if (isDeepScan) {
                                _snackbarMessage.value = "Deep Scan needs an API key (Settings). Showing rule-based findings."
                            }
                        }
                        !networkMonitor.isOnline.value -> {
                            if (isDeepScan) {
                                _snackbarMessage.value = "Deep Scan is unavailable while offline. Showing rule-based findings."
                            }
                        }
                        else -> {
                            try {
                                val missingLabels = result.findings
                                    .filter { it.type == FindingType.MISSING_CONTROL }
                                    .map { it.title }
                                val scan = LlmDeepScanner.scan(text, missingLabels, settings)
                                result = mergeDeepScan(result, scan)
                            } catch (e: Exception) {
                                _snackbarMessage.value =
                                    "Deep scan failed: ${e.message ?: "unknown error"}. Showing rule-based findings."
                            }
                        }
                    }
                }

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

    fun updateDeepScanSettings(settings: DeepScanSettings) {
        _deepScanSettings.value = settings
        prefs.edit()
            .putString("deep_scan_api_key", settings.apiKey)
            .putString("deep_scan_base_url", settings.baseUrl)
            .putString("deep_scan_model", settings.model)
            .putBoolean("deep_scan_auto", settings.autoDeepScan)
            .apply()
    }

    private fun loadDeepScanSettings(): DeepScanSettings {
        return DeepScanSettings(
            apiKey = prefs.getString("deep_scan_api_key", "") ?: "",
            baseUrl = prefs.getString("deep_scan_base_url", DeepScanSettings().baseUrl)
                ?: DeepScanSettings().baseUrl,
            model = prefs.getString("deep_scan_model", DeepScanSettings().model)
                ?: DeepScanSettings().model,
            autoDeepScan = prefs.getBoolean("deep_scan_auto", true)
        )
    }

    /**
     * Mirrors engine/src/analyzer.js mergeFindings:
     * - append AI-only findings (deduplicated),
     * - let "satisfied" move a non-critical rule finding to detected,
     * - recompute risk and coverage with the same formula as the rule engine.
     */
    private fun mergeDeepScan(base: AnalysisResult, scan: DeepScanResult): AnalysisResult {
        val detected = base.findings
            .filter { it.type == FindingType.DETECTED_CONTROL }
            .toMutableList()
        val missing = base.findings
            .filter { it.type == FindingType.MISSING_CONTROL }
            .toMutableList()
        val risky = base.findings
            .filter { it.type == FindingType.RISKY_STATEMENT }
            .toMutableList()

        val satisfied = scan.satisfied.map { it.trim().lowercase() }.filter { it.isNotBlank() }.toSet()
        if (satisfied.isNotEmpty()) {
            val kept = mutableListOf<SecurityFinding>()
            missing.forEach { finding ->
                // Critical controls are core: never dropped on the model's word.
                if (finding.severity != RiskLevel.CRITICAL && satisfied.contains(finding.title.lowercase())) {
                    detected.add(
                        finding.copy(
                            id = "ai_confirmed_${finding.id}",
                            type = FindingType.DETECTED_CONTROL,
                            severity = RiskLevel.LOW,
                            isSelectable = false,
                            isAi = true,
                            explanation = "Deep scan confirmed this control is already stated in the prompt."
                        )
                    )
                } else {
                    kept.add(finding)
                }
            }
            missing.clear()
            missing.addAll(kept)
        }

        val seen = (missing + risky + detected).map { it.title.lowercase() }.toMutableSet()
        scan.missing.forEachIndexed { index, ai ->
            if (seen.add(ai.label.lowercase())) {
                missing.add(
                    SecurityFinding(
                        id = "ai_missing_$index",
                        title = ai.label,
                        explanation = ai.description,
                        severity = ai.severity,
                        type = FindingType.MISSING_CONTROL,
                        affectedResource = "Deep scan",
                        whyItMatters = ai.description,
                        recommendedFix = ai.clause,
                        securityClause = ai.clause,
                        isSelectable = true,
                        isAi = true
                    )
                )
            }
        }
        scan.risky.forEachIndexed { index, ai ->
            if (seen.add(ai.label.lowercase())) {
                risky.add(
                    SecurityFinding(
                        id = "ai_risky_$index",
                        title = ai.label,
                        explanation = ai.description,
                        severity = ai.severity,
                        type = FindingType.RISKY_STATEMENT,
                        affectedResource = "Deep scan",
                        whyItMatters = ai.description,
                        recommendedFix = ai.clause,
                        securityClause = ai.clause,
                        isSelectable = true,
                        isAi = true
                    )
                )
            }
        }

        val missingCount = missing.size
        val detectedCount = detected.size
        val riskyCount = risky.size
        var rawRisk = 12 + (riskyCount * 36) + (missingCount * 14) - (detectedCount * 12)
        if (riskyCount > 0 && rawRisk < 75) {
            rawRisk = 75 + (riskyCount * 8)
        }
        val riskScore = rawRisk.coerceIn(5, 98)
        val totalControls = missingCount + detectedCount
        val coverage = if (totalControls > 0) {
            ((detectedCount.toDouble() / totalControls) * 100).toInt().coerceIn(0, 100)
        } else {
            0
        }

        return base.copy(
            riskScore = riskScore,
            riskLevel = RiskLevel.fromScore(riskScore),
            securityCoverage = coverage,
            findings = detected + missing + risky,
            engineVersion = "Vector DeepScan 0.8.0 (Rules + LLM)"
        )
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

    override fun onCleared() {
        (analyzerRepository as? VectorJsAnalyzer)?.close()
        super.onCleared()
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

    fun showSnackbar(message: String) {
        _snackbarMessage.value = message
    }

    fun clearSnackbar() {
        _snackbarMessage.value = null
    }
}
