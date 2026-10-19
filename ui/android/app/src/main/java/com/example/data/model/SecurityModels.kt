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

data class FindingRiskDistribution(
    val criticalCount: Int = 0,
    val highCount: Int = 0,
    val mediumCount: Int = 0,
    val lowCount: Int = 0,
    val totalFindings: Int = 0,
    val totalAnalyses: Int = 0
) {
    val isEmpty: Boolean
        get() = totalFindings == 0

    val criticalPercentage: Float
        get() = if (totalFindings > 0) (criticalCount.toFloat() / totalFindings) else 0f

    val highPercentage: Float
        get() = if (totalFindings > 0) (highCount.toFloat() / totalFindings) else 0f

    val mediumPercentage: Float
        get() = if (totalFindings > 0) (mediumCount.toFloat() / totalFindings) else 0f

    val lowPercentage: Float
        get() = if (totalFindings > 0) (lowCount.toFloat() / totalFindings) else 0f

    companion object {
        fun fromAnalyses(analyses: List<AnalysisResult>): FindingRiskDistribution {
            var crit = 0
            var high = 0
            var med = 0
            var low = 0
            analyses.forEach { analysis ->
                analysis.findings.forEach { finding ->
                    when (finding.severity) {
                        RiskLevel.CRITICAL -> crit++
                        RiskLevel.HIGH -> high++
                        RiskLevel.MEDIUM -> med++
                        RiskLevel.LOW -> low++
                    }
                }
            }
            val total = crit + high + med + low
            return FindingRiskDistribution(
                criticalCount = crit,
                highCount = high,
                mediumCount = med,
                lowCount = low,
                totalFindings = total,
                totalAnalyses = analyses.size
            )
        }
    }
}

fun AnalysisResult.generateMarkdownReport(improvedPrompt: String? = null): String {
    val dateStr = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault())
        .format(java.util.Date(timestamp))

    val sb = StringBuilder()
    sb.appendLine("# Vector — Security Diagnosis Report")
    sb.appendLine()
    sb.appendLine("**Date:** $dateStr")
    sb.appendLine("**Analysis ID:** `$id`")
    sb.appendLine("**Engine:** $engineVersion")
    sb.appendLine("**Overall Risk Score:** ${riskScore}/100 (${riskLevel.label})")
    sb.appendLine("**Security Coverage:** ${securityCoverage}%")
    sb.appendLine("**Analyzer Confidence:** ${confidence}%")
    sb.appendLine()
    sb.appendLine("---")
    sb.appendLine()
    sb.appendLine("## 1. Evaluated Prompt")
    sb.appendLine()
    sb.appendLine("```text")
    sb.appendLine(prompt)
    sb.appendLine("```")
    sb.appendLine()
    sb.appendLine("---")
    sb.appendLine()
    sb.appendLine("## 2. Detected AWS Resources")
    sb.appendLine()
    if (detectedResources.isEmpty()) {
        sb.appendLine("*No specific AWS resources detected.*")
    } else {
        detectedResources.forEach { r ->
            sb.appendLine("- **${r.name}** (`${r.shortName}`) — ${r.category}")
        }
    }
    sb.appendLine()
    sb.appendLine("---")
    sb.appendLine()
    sb.appendLine("## 3. Security Findings Summary")
    sb.appendLine()
    sb.appendLine("- **Total Findings:** ${findings.size}")
    sb.appendLine("- **Critical Severity:** ${findings.count { it.severity == RiskLevel.CRITICAL }}")
    sb.appendLine("- **High Severity:** ${findings.count { it.severity == RiskLevel.HIGH }}")
    sb.appendLine("- **Medium Severity:** ${findings.count { it.severity == RiskLevel.MEDIUM }}")
    sb.appendLine("- **Low Severity / Detected:** ${findings.count { it.severity == RiskLevel.LOW }}")
    sb.appendLine()
    sb.appendLine("### Findings Detail")
    sb.appendLine()
    if (findings.isEmpty()) {
        sb.appendLine("*No security findings detected.*")
    } else {
        findings.forEachIndexed { idx, f ->
            sb.appendLine("#### ${idx + 1}. [${f.severity.label.uppercase()}] ${f.title}")
            if (f.affectedResource != null) {
                sb.appendLine("- **Resource:** ${f.affectedResource}")
            }
            sb.appendLine("- **Category:** ${f.type.label}")
            sb.appendLine("- **Diagnosis:** ${f.explanation}")
            sb.appendLine("- **Why It Matters:** ${f.whyItMatters}")
            sb.appendLine("- **Recommended Fix:** ${f.recommendedFix}")
            sb.appendLine("- **Security Clause:**")
            sb.appendLine("  > ${f.securityClause}")
            sb.appendLine()
        }
    }
    sb.appendLine("---")
    sb.appendLine()
    sb.appendLine("## 4. Hardened Infrastructure Prompt")
    sb.appendLine()
    if (!improvedPrompt.isNullOrBlank()) {
        sb.appendLine("```text")
        sb.appendLine(improvedPrompt)
        sb.appendLine("```")
    } else {
        sb.appendLine("*Original prompt with no appended clauses.*")
    }
    sb.appendLine()
    sb.appendLine("---")
    sb.appendLine("*Generated by Vector — Pre-Generation Security Diagnosis tool for AWS cloud prompts.*")
    return sb.toString()
}
