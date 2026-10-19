package com.example.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.example.data.model.AnalysisMetrics
import com.example.data.model.AnalysisResult
import com.example.data.model.AwsResource
import com.example.data.model.FindingType
import com.example.data.model.RiskLevel
import com.example.data.model.SecurityFinding
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import org.json.JSONArray
import org.json.JSONObject

class LocalHistoryRepository(context: Context) : HistoryRepository {

    private val prefs: SharedPreferences = context.getSharedPreferences("vector_history_prefs", Context.MODE_PRIVATE)
    private val analysesState = MutableStateFlow<List<AnalysisResult>>(emptyList())

    init {
        loadFromPrefs()
    }

    override fun getAnalyses(includeDemo: Boolean): Flow<List<AnalysisResult>> {
        // Demo/sample records are intentionally not shipped: only real analyses.
        return analysesState
    }

    override fun getMetrics(includeDemo: Boolean): Flow<AnalysisMetrics> {
        return getAnalyses(includeDemo).map { list ->
            if (list.isEmpty()) {
                AnalysisMetrics(0, 0.0, 0.0, 0)
            } else {
                val total = list.size
                val avgRisk = list.map { it.riskScore }.average()
                val avgCoverage = list.map { it.securityCoverage }.average()
                val highRisk = list.count { it.riskLevel == RiskLevel.HIGH || it.riskLevel == RiskLevel.CRITICAL }
                AnalysisMetrics(
                    totalAnalyses = total,
                    averageRiskScore = (avgRisk * 10).toInt() / 10.0,
                    averageCoverage = (avgCoverage * 10).toInt() / 10.0,
                    highRiskCount = highRisk
                )
            }
        }
    }

    override suspend fun saveAnalysis(result: AnalysisResult) {
        val current = analysesState.value.toMutableList()
        // Replace if already exists, else prepend
        current.removeAll { it.id == result.id }
        current.add(0, result)
        analysesState.value = current
        saveToPrefs(current)
    }

    override suspend fun deleteAnalysis(id: String) {
        val current = analysesState.value.toMutableList()
        current.removeAll { it.id == id }
        analysesState.value = current
        saveToPrefs(current)
    }

    override suspend fun clearHistory() {
        analysesState.value = emptyList()
        saveToPrefs(emptyList())
    }

    override suspend fun getAnalysisById(id: String): AnalysisResult? {
        return analysesState.value.find { it.id == id }
    }

    private fun loadFromPrefs() {
        val raw = prefs.getString("saved_analyses_json", null) ?: return
        try {
            val jsonArray = JSONArray(raw)
            val list = mutableListOf<AnalysisResult>()
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                list.add(deserializeAnalysis(obj))
            }
            analysesState.value = list
        } catch (_: Exception) {
            analysesState.value = emptyList()
        }
    }

    private fun saveToPrefs(list: List<AnalysisResult>) {
        try {
            val array = JSONArray()
            list.filter { !it.isDemo }.forEach {
                array.put(serializeAnalysis(it))
            }
            prefs.edit().putString("saved_analyses_json", array.toString()).apply()
        } catch (_: Exception) {
            // Ignore persistence errors
        }
    }

    private fun serializeAnalysis(item: AnalysisResult): JSONObject {
        val obj = JSONObject()
        obj.put("id", item.id)
        obj.put("prompt", item.prompt)
        obj.put("timestamp", item.timestamp)
        obj.put("riskScore", item.riskScore)
        obj.put("riskLevel", item.riskLevel.name)
        obj.put("securityCoverage", item.securityCoverage)
        obj.put("confidence", item.confidence)
        obj.put("engineVersion", item.engineVersion)

        val resArray = JSONArray()
        item.detectedResources.forEach { r ->
            val rObj = JSONObject()
            rObj.put("id", r.id)
            rObj.put("name", r.name)
            rObj.put("shortName", r.shortName)
            rObj.put("category", r.category)
            resArray.put(rObj)
        }
        obj.put("resources", resArray)

        val fArray = JSONArray()
        item.findings.forEach { f ->
            val fObj = JSONObject()
            fObj.put("id", f.id)
            fObj.put("title", f.title)
            fObj.put("explanation", f.explanation)
            fObj.put("severity", f.severity.name)
            fObj.put("type", f.type.name)
            fObj.put("affectedResource", f.affectedResource ?: "")
            fObj.put("whyItMatters", f.whyItMatters)
            fObj.put("recommendedFix", f.recommendedFix)
            fObj.put("securityClause", f.securityClause)
            fObj.put("isSelectable", f.isSelectable)
            fObj.put("isAi", f.isAi)
            fArray.put(fObj)
        }
        obj.put("findings", fArray)

        return obj
    }

    private fun deserializeAnalysis(obj: JSONObject): AnalysisResult {
        val id = obj.getString("id")
        val prompt = obj.getString("prompt")
        val timestamp = obj.getLong("timestamp")
        val riskScore = obj.getInt("riskScore")
        val riskLevel = RiskLevel.valueOf(obj.optString("riskLevel", RiskLevel.fromScore(riskScore).name))
        val coverage = obj.getInt("securityCoverage")
        val confidence = obj.optInt("confidence", 92)
        val engineVersion = obj.optString("engineVersion", "Vector-Core 0.8.0")

        val resList = mutableListOf<AwsResource>()
        val resArray = obj.optJSONArray("resources")
        if (resArray != null) {
            for (i in 0 until resArray.length()) {
                val rObj = resArray.getJSONObject(i)
                resList.add(
                    AwsResource(
                        id = rObj.getString("id"),
                        name = rObj.getString("name"),
                        shortName = rObj.getString("shortName"),
                        category = rObj.optString("category", "AWS Infrastructure")
                    )
                )
            }
        }

        val fList = mutableListOf<SecurityFinding>()
        val fArray = obj.optJSONArray("findings")
        if (fArray != null) {
            for (i in 0 until fArray.length()) {
                val fObj = fArray.getJSONObject(i)
                fList.add(
                    SecurityFinding(
                        id = fObj.getString("id"),
                        title = fObj.getString("title"),
                        explanation = fObj.getString("explanation"),
                        severity = RiskLevel.valueOf(fObj.getString("severity")),
                        type = FindingType.valueOf(fObj.getString("type")),
                        affectedResource = fObj.optString("affectedResource").takeIf { it.isNotBlank() },
                        whyItMatters = fObj.getString("whyItMatters"),
                        recommendedFix = fObj.getString("recommendedFix"),
                        securityClause = fObj.getString("securityClause"),
                        isSelectable = fObj.optBoolean("isSelectable", true),
                        isAi = fObj.optBoolean("isAi", false)
                    )
                )
            }
        }

        return AnalysisResult(
            id = id,
            prompt = prompt,
            timestamp = timestamp,
            riskScore = riskScore,
            riskLevel = riskLevel,
            securityCoverage = coverage,
            confidence = confidence,
            detectedResources = resList,
            findings = fList,
            isDemo = false,
            engineVersion = engineVersion
        )
    }
}
