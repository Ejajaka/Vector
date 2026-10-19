package com.example.data.analyzer

import android.content.Context
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import com.example.data.model.AnalysisResult
import com.example.data.model.AwsResource
import com.example.data.model.ExamplePrompt
import com.example.data.model.FindingType
import com.example.data.model.RiskLevel
import com.example.data.model.SecurityFinding
import com.example.data.repository.AnalyzerRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID
import kotlin.coroutines.resume

/**
 * Android adapter for the single shared Vector JavaScript rule engine.
 * The engine files are copied from engine/src into Android assets by
 * tools/sync-engine.ps1, so Android and browser clients execute identical NLP.
 */
class VectorJsAnalyzer(context: Context) : AnalyzerRepository {

    private val webView: WebView = WebView(context.applicationContext)
    private var ready = false
    private var loading: kotlinx.coroutines.CompletableDeferred<Unit>? = null

    init {
        webView.settings.javaScriptEnabled = true
        webView.settings.cacheMode = WebSettings.LOAD_NO_CACHE
        webView.webViewClient = WebViewClient()
    }

    override fun isDeepScanAvailable(): Boolean = false

    override fun getExamplePrompts(): List<ExamplePrompt> = listOf(
        ExamplePrompt("ex_1", "Example 1 (Basic S3)", "Create an S3 bucket for storing application documents."),
        ExamplePrompt("ex_2", "Example 2 (Multi-tier Web App)", "Deploy an EC2 instance running a web application behind a load balancer, connect it to an RDS database, and store uploaded documents in S3."),
        ExamplePrompt("ex_3", "Example 3 (High-Risk Exposed)", "Create a public S3 bucket for customer documents and launch an EC2 instance with SSH open to 0.0.0.0/0.")
    )

    override suspend fun analyze(prompt: String, isDeepScan: Boolean): AnalysisResult {
        val text = prompt.trim()
        require(text.isNotBlank()) { "Please enter an AWS infrastructure prompt or select an example." }
        val encodedPrompt = JSONObject.quote(text)
        val raw = evaluate("JSON.stringify(VectorAnalyzer.analyze($encodedPrompt, {strictMode:false}))")
        return mapReport(JSONObject(raw))
    }

    override fun buildImprovedPrompt(originalPrompt: String, selectedClauses: List<String>): String {
        if (selectedClauses.isEmpty()) return originalPrompt
        return originalPrompt.trimEnd() + "\n\nSecurity requirements:\n" +
            selectedClauses.joinToString("\n") { "- $it" }
    }

    fun close() {
        webView.post { webView.destroy() }
    }

    private suspend fun evaluate(script: String): String = withContext(Dispatchers.Main) {
        ensureReady()
        suspendCancellableCoroutine { continuation ->
            webView.evaluateJavascript(script) { value ->
                if (continuation.isActive) continuation.resume(unquote(value))
            }
        }
    }

    private suspend fun ensureReady() {
        if (ready) return
        val current = loading
        if (current != null) {
            current.await()
            return
        }
        val deferred = kotlinx.coroutines.CompletableDeferred<Unit>()
        loading = deferred
        webView.loadDataWithBaseURL(
            "file:///android_asset/vector_engine/",
            """
            <!doctype html><html><body>
            <script src="taxonomy.js"></script>
            <script src="semantic.js"></script>
            <script src="analyzer.js"></script>
            </body></html>
            """.trimIndent(),
            "text/html",
            "UTF-8",
            null
        )
        // The WebView callback is intentionally polled through JS. This avoids
        // relying on a second WebViewClient instance while loading assets.
        while (!ready) {
            kotlinx.coroutines.delay(10)
            webView.evaluateJavascript("typeof VectorAnalyzer !== 'undefined'") { value ->
                if (value == "true" && !ready) {
                    ready = true
                    deferred.complete(Unit)
                }
            }
        }
    }

    private fun mapReport(report: JSONObject): AnalysisResult {
        val resources = mutableListOf<AwsResource>()
        val resourceLabels = mutableMapOf<String, String>()
        report.optJSONArray("resources").forEachObject { item ->
            val id = item.optString("id")
            val label = item.optString("label", id)
            resourceLabels[id] = label
            resources += AwsResource(id, label, id, "AWS Infrastructure")
        }

        val findings = mutableListOf<SecurityFinding>()
        report.optJSONArray("missing").forEachObject { findings += mapFinding(it, FindingType.MISSING_CONTROL, resourceLabels) }
        report.optJSONArray("mentioned").forEachObject { findings += mapFinding(it, FindingType.DETECTED_CONTROL, resourceLabels) }
        report.optJSONArray("riskyFindings").forEachObject { findings += mapFinding(it, FindingType.RISKY_STATEMENT, resourceLabels) }

        val prompt = report.optString("prompt")
        val riskScore = report.optInt("riskScore", 0)
        return AnalysisResult(
            id = UUID.randomUUID().toString(),
            prompt = prompt,
            timestamp = System.currentTimeMillis(),
            riskScore = riskScore,
            riskLevel = parseRisk(report.optString("riskLevel"), riskScore),
            securityCoverage = report.optInt("coverageScore", 0),
            confidence = report.optInt("confidenceScore", 0),
            detectedResources = resources,
            findings = findings,
            isDemo = false,
            engineVersion = "Vector-Core 0.8.0 (Shared JavaScript)"
        )
    }

    private fun mapFinding(item: JSONObject, type: FindingType, labels: Map<String, String>): SecurityFinding {
        val appliesTo = item.optJSONArray("appliesTo")
            ?.let { array -> (0 until array.length()).map { labels[array.optString(it)] ?: array.optString(it) } }
            ?.joinToString(", ")
            ?.takeIf { it.isNotBlank() }
        val clause = item.optString("clause").ifBlank { item.optString("fix") }
        return SecurityFinding(
            id = item.optString("id", UUID.randomUUID().toString()),
            title = item.optString("label", item.optString("id")),
            explanation = item.optString("description", ""),
            severity = parseRisk(item.optString("severity"), 0),
            type = type,
            affectedResource = appliesTo,
            whyItMatters = item.optString("description", ""),
            recommendedFix = item.optString("tf").ifBlank { clause },
            securityClause = clause,
            isSelectable = type != FindingType.DETECTED_CONTROL,
            isAi = item.optString("source") == "ai"
        )
    }

    private fun parseRisk(value: String, score: Int): RiskLevel {
        return when (value.uppercase()) {
            "CRITICAL" -> RiskLevel.CRITICAL
            "HIGH" -> RiskLevel.HIGH
            "MEDIUM" -> RiskLevel.MEDIUM
            "LOW", "MINIMAL" -> RiskLevel.LOW
            else -> RiskLevel.fromScore(score)
        }
    }

    private fun unquote(value: String): String {
        return if (value.startsWith("\"") && value.endsWith("\"")) {
            runCatching { JSONObject("{\"value\":$value}").getString("value") }.getOrDefault(value)
        } else value
    }

    private fun JSONArray?.forEachObject(action: (JSONObject) -> Unit) {
        if (this == null) return
        for (index in 0 until length()) optJSONObject(index)?.let(action)
    }
}
