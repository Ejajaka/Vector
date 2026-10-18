package com.example.data.analyzer

/**
 * JavaScript Engine Integration Boundary
 *
 * This documentation outlines the architectural contract and migration path
 * for integrating the upstream JavaScript engine into the native Android application.
 *
 * Upstream JS Core Methods:
 * 1. VectorAnalyzer.analyze(prompt: string, options?: AnalysisOptions): AnalysisOutput
 * 2. VectorAnalyzer.mergeFindings(baseFindings, newFindings): FindingList
 * 3. VectorAnalyzer.project(currentRisk, selectedClauses): ProjectedMetrics
 * 4. VectorAnalyzer.buildImprovedPrompt(originalPrompt: string, selectedClauses: string[]): string
 * 5. VectorAnalyzer.harden(prompt: string): HardenedResult
 *
 * Android Native Boundary Architecture:
 * -----------------------------------------------------------------------------------------
 * | Compose UI Screens (Home, Analyze, Results, ImprovedPrompt, History, Settings)         |
 * -----------------------------------------------------------------------------------------
 *                                     │
 *                                     ▼
 *                     VectorViewModel (StateFlow & M3 UI state)
 *                                     │
 *                                     ▼
 *                  AnalyzerRepository (Clean Kotlin Interface)
 *                     ┌───────────────┴───────────────┐
 *                     ▼                               ▼
 *            VectorRuleAnalyzer (Native)     VectorJsBridgeAdapter (WebView / QuickJS)
 *
 * Integration Strategy for VectorJsBridgeAdapter:
 * - Load `vector_engine.bundle.js` into an offscreen headless Android WebView or embedded
 *   QuickJS / Duktape runtime.
 * - Inject a JavaScript interface (`@JavascriptInterface`) or execute scripts via
 *   `evaluateJavascript("VectorAnalyzer.analyze(" + JSON.quote(prompt) + ")")`.
 * - Map the returned JSON output directly to Kotlin's [AnalysisResult] and [SecurityFinding]
 *   data classes using Moshi / Kotlinx Serialization.
 * - This guarantees that the mobile UI remains completely independent of whether
 *   analysis runs via the embedded JavaScript engine or the native rule-based analyzer.
 */
object JavaScriptBridgeDocumentation {
    const val JS_ENGINE_ENTRY_POINT = "assets/vector_engine.bundle.js"

    val CORE_METHODS = listOf(
        "VectorAnalyzer.analyze(prompt, options)",
        "VectorAnalyzer.mergeFindings(base, delta)",
        "VectorAnalyzer.project(riskScore, clauses)",
        "VectorAnalyzer.buildImprovedPrompt(prompt, clauses)",
        "VectorAnalyzer.harden(prompt)"
    )
}
