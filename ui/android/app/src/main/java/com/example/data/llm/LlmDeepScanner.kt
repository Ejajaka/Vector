package com.example.data.llm

import com.example.data.model.RiskLevel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/** Deep-scan (LLM) configuration, persisted in SharedPreferences by the ViewModel. */
data class DeepScanSettings(
    val apiKey: String = "",
    val baseUrl: String = "https://generativelanguage.googleapis.com/v1beta/openai",
    val model: String = "gemini-2.5-flash",
    val autoDeepScan: Boolean = true
) {
    val isConfigured: Boolean get() = apiKey.isNotBlank()
}

data class AiFinding(
    val label: String,
    val severity: RiskLevel,
    val description: String,
    val clause: String,
    val isRisky: Boolean
)

data class DeepScanResult(
    val missing: List<AiFinding>,
    val risky: List<AiFinding>,
    val satisfied: List<String>
)

/**
 * Calls an OpenAI-compatible chat completions endpoint. The contract matches
 * engine/src/llm.js so every Vector client asks the model the same question.
 * A configured API key always wins; there is no on-device LLM on Android.
 */
object LlmDeepScanner {

    private const val SYSTEM_PROMPT =
        "You are an AWS cloud security reviewer. Given an infrastructure prompt, " +
            "list security controls that are MISSING from it (do not repeat ones already stated). " +
            "You may also be given a list of controls the rule engine flagged as missing; if the " +
            "prompt actually satisfies any of them, list their EXACT labels in \"satisfied\". " +
            "Reply with STRICT JSON only: " +
            "{\"missing\":[{\"label\":\"\",\"severity\":\"high|medium|low\",\"description\":\"\",\"clause\":\"\"}]," +
            "\"risky\":[{\"label\":\"\",\"severity\":\"high|medium|low\",\"description\":\"\",\"fix\":\"\"}]," +
            "\"satisfied\":[\"exact label from the supplied rule list\"]}. " +
            "If nothing is missing and nothing is risky, return empty arrays. " +
            "At most 10 missing, 5 risky and 10 satisfied. Each clause is one imperative sentence."

    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    private fun userMessage(prompt: String, ruleMissingLabels: List<String>): String {
        var msg = "Infrastructure prompt:\n\n$prompt"
        if (ruleMissingLabels.isNotEmpty()) {
            msg += "\n\nThe rule engine flagged these exact controls as missing:\n" +
                ruleMissingLabels.joinToString("\n") { "- $it" } +
                "\n\nIf the prompt already satisfies any of these exact labels, list those labels in \"satisfied\". " +
                "Only include a label when you are confident."
        }
        return msg
    }

    suspend fun scan(
        prompt: String,
        ruleMissingLabels: List<String>,
        settings: DeepScanSettings
    ): DeepScanResult = withContext(Dispatchers.IO) {
        var baseUrl = settings.baseUrl.trim().trimEnd('/')
        if (baseUrl.contains("generativelanguage.googleapis.com") && !baseUrl.endsWith("/openai")) {
            baseUrl += "/openai"
        }
        if (baseUrl.isBlank()) throw IllegalStateException("Base URL is empty.")
        if (!settings.isConfigured) throw IllegalStateException("No API key set.")

        val body = JSONObject().apply {
            put("model", settings.model.ifBlank { "gemini-2.5-flash" }.removePrefix("models/"))
            put("temperature", 0)
            put(
                "messages",
                JSONArray()
                    .put(JSONObject().put("role", "system").put("content", SYSTEM_PROMPT))
                    .put(JSONObject().put("role", "user").put("content", userMessage(prompt, ruleMissingLabels)))
            )
        }

        val request = Request.Builder()
            .url("$baseUrl/chat/completions")
            .header("Authorization", "Bearer ${settings.apiKey}")
            .post(body.toString().toRequestBody("application/json".toMediaType()))
            .build()

        client.newCall(request).execute().use { response ->
            val raw = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                val detail = runCatching {
                    JSONObject(raw).optJSONObject("error")?.optString("message").orEmpty()
                }.getOrDefault("")
                val suffix = if (detail.isNotBlank()) ": $detail" else ""
                throw IllegalStateException("Deep scan failed (${response.code})$suffix")
            }
            val content = runCatching {
                JSONObject(raw)
                    .optJSONArray("choices")
                    ?.optJSONObject(0)
                    ?.optJSONObject("message")
                    ?.optString("content")
                    .orEmpty()
            }.getOrDefault("")
            parseFindings(content)
        }
    }

    private fun parseFindings(text: String): DeepScanResult {
        val start = text.indexOf('{')
        val end = text.lastIndexOf('}')
        if (start < 0 || end <= start) throw IllegalStateException("Model returned no JSON.")
        val data = JSONObject(text.substring(start, end + 1))

        val missing = mutableListOf<AiFinding>()
        val missingArray = data.optJSONArray("missing") ?: JSONArray()
        for (i in 0 until missingArray.length()) {
            if (missing.size >= 10) break
            val item = missingArray.optJSONObject(i) ?: continue
            val label = item.optString("label").trim()
            if (label.isBlank()) continue
            missing.add(
                AiFinding(
                    label = label,
                    severity = parseSeverity(item.optString("severity"), RiskLevel.MEDIUM),
                    description = item.optString("description", "Identified by deep scan."),
                    clause = item.optString("clause").ifBlank {
                        item.optString("description", label)
                    },
                    isRisky = false
                )
            )
        }

        val risky = mutableListOf<AiFinding>()
        val riskyArray = data.optJSONArray("risky") ?: JSONArray()
        for (i in 0 until riskyArray.length()) {
            if (risky.size >= 5) break
            val item = riskyArray.optJSONObject(i) ?: continue
            val label = item.optString("label").trim()
            if (label.isBlank()) continue
            risky.add(
                AiFinding(
                    label = label,
                    severity = parseSeverity(item.optString("severity"), RiskLevel.HIGH),
                    description = item.optString("description", "Identified by deep scan."),
                    clause = item.optString("fix").ifBlank {
                        item.optString("description", label)
                    },
                    isRisky = true
                )
            )
        }

        val satisfied = mutableListOf<String>()
        val satisfiedArray = data.optJSONArray("satisfied") ?: JSONArray()
        for (i in 0 until satisfiedArray.length()) {
            if (satisfied.size >= 10) break
            val value = satisfiedArray.opt(i)
            val label = when (value) {
                is String -> value
                is JSONObject -> value.optString("label")
                else -> ""
            }.trim()
            if (label.isNotBlank()) satisfied.add(label)
        }

        return DeepScanResult(missing = missing, risky = risky, satisfied = satisfied)
    }

    private fun parseSeverity(value: String, fallback: RiskLevel): RiskLevel {
        return when (value.trim().lowercase()) {
            "critical" -> RiskLevel.CRITICAL
            "high" -> RiskLevel.HIGH
            "medium" -> RiskLevel.MEDIUM
            "low" -> RiskLevel.LOW
            else -> fallback
        }
    }
}
