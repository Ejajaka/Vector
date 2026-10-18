package com.example.data.model

import androidx.compose.ui.graphics.Color
import com.example.ui.theme.VectorCriticalRed
import com.example.ui.theme.VectorHighRisk
import com.example.ui.theme.VectorLowRisk
import com.example.ui.theme.VectorMediumRisk

enum class RiskLevel(val label: String, val color: Color) {
    CRITICAL("Critical Risk", VectorCriticalRed),
    HIGH("High Risk", VectorHighRisk),
    MEDIUM("Medium Risk", VectorMediumRisk),
    LOW("Low Risk", VectorLowRisk);

    companion object {
        fun fromScore(score: Int): RiskLevel {
            return when {
                score >= 80 -> CRITICAL
                score >= 60 -> HIGH
                score >= 35 -> MEDIUM
                else -> LOW
            }
        }
    }
}

enum class FindingType(val label: String) {
    MISSING_CONTROL("Missing Controls"),
    DETECTED_CONTROL("Detected Controls"),
    RISKY_STATEMENT("Risky Statements")
}

data class AwsResource(
    val id: String,
    val name: String,
    val shortName: String,
    val category: String = "AWS Infrastructure"
)

data class SecurityFinding(
    val id: String,
    val title: String,
    val explanation: String,
    val severity: RiskLevel,
    val type: FindingType,
    val affectedResource: String? = null,
    val whyItMatters: String,
    val recommendedFix: String,
    val securityClause: String,
    val isSelectable: Boolean = (type != FindingType.DETECTED_CONTROL)
)

data class AnalysisResult(
    val id: String,
    val prompt: String,
    val timestamp: Long = System.currentTimeMillis(),
    val riskScore: Int,
    val riskLevel: RiskLevel = RiskLevel.fromScore(riskScore),
    val securityCoverage: Int,
    val confidence: Int,
    val detectedResources: List<AwsResource>,
    val findings: List<SecurityFinding>,
    val isDemo: Boolean = false,
    val engineVersion: String = "Vector-Core 1.2.0 (Rule-based NLP)"
) {
    val missingControlsCount: Int
        get() = findings.count { it.type == FindingType.MISSING_CONTROL }

    val detectedControlsCount: Int
        get() = findings.count { it.type == FindingType.DETECTED_CONTROL }

    val riskyStatementsCount: Int
        get() = findings.count { it.type == FindingType.RISKY_STATEMENT }
}

data class ExamplePrompt(
    val id: String,
    val title: String,
    val text: String
)

data class AnalysisMetrics(
    val totalAnalyses: Int = 0,
    val averageRiskScore: Double = 0.0,
    val averageCoverage: Double = 0.0,
    val highRiskCount: Int = 0
)
