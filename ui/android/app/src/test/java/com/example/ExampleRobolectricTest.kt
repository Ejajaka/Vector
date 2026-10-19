package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.analyzer.VectorRuleAnalyzer
import com.example.data.model.FindingType
import com.example.data.model.RiskLevel
import com.example.data.model.generateMarkdownReport
import com.example.data.repository.LocalHistoryRepository
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class ExampleRobolectricTest {

    @Test
    fun `read string from context`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val appName = context.getString(R.string.app_name)
        assertEquals("Vector", appName)
    }

    @Test
    fun `test vector analyzer detects high risk public s3 and open ssh`() = runBlocking {
        val analyzer = VectorRuleAnalyzer()
        val prompt = "Create a public S3 bucket for customer documents and launch an EC2 instance with SSH open to 0.0.0.0/0."
        val result = analyzer.analyze(prompt)

        assertEquals(RiskLevel.CRITICAL, result.riskLevel)
        assertTrue("Risk score should be >= 80 for exposed infrastructure", result.riskScore >= 80)
        assertTrue("Should detect S3", result.detectedResources.any { it.id == "s3" })
        assertTrue("Should detect EC2", result.detectedResources.any { it.id == "ec2" })
        assertTrue("Should detect public S3 finding", result.findings.any { it.id == "risk_public_s3" })
        assertTrue("Should detect open SSH finding", result.findings.any { it.id == "risk_open_ssh" })
    }

    @Test
    fun `test build improved prompt appends security requirements correctly`() {
        val analyzer = VectorRuleAnalyzer()
        val original = "Create an S3 bucket for storing application documents."
        val clauses = listOf(
            "S3 bucket must enforce server-side encryption with AWS KMS (SSE-KMS).",
            "Enforce S3 Block Public Access on the bucket."
        )

        val improved = analyzer.buildImprovedPrompt(original, clauses)

        assertTrue(improved.startsWith(original))
        assertTrue(improved.contains("Security requirements:"))
        assertTrue(improved.contains("- S3 bucket must enforce server-side encryption with AWS KMS (SSE-KMS)."))
        assertTrue(improved.contains("- Enforce S3 Block Public Access on the bucket."))
    }

    @Test
    fun `test local history repository saves and computes metrics`() = runBlocking {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val repository = LocalHistoryRepository(context)

        val analyzer = VectorRuleAnalyzer()
        val analysis = analyzer.analyze("Create an S3 bucket for application documents.")
        repository.saveAnalysis(analysis)

        val retrieved = repository.getAnalysisById(analysis.id)
        assertNotNull(retrieved)
        assertEquals(analysis.id, retrieved?.id)

        val metrics = repository.getMetrics(includeDemo = false).first()
        assertTrue(metrics.totalAnalyses >= 1)
    }

    @Test
    fun `test network monitor tracks simulated offline state`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val monitor = com.example.util.NetworkMonitor(context)

        monitor.setSimulatedOffline(true)
        assertFalse(monitor.isOnline.value)
        assertTrue(monitor.isSimulated())

        monitor.setSimulatedOffline(false)
        assertTrue(monitor.isOnline.value)
        assertTrue(monitor.isSimulated())

        monitor.setSimulatedOffline(null)
        assertFalse(monitor.isSimulated())
    }

    @Test
    fun `test finding risk distribution aggregates real saved findings`() = runBlocking {
        val analyzer = VectorRuleAnalyzer()
        val criticalAnalysis = analyzer.analyze("Create a public S3 bucket and open SSH to 0.0.0.0/0.")
        val standardAnalysis = analyzer.analyze("Create an S3 bucket with encryption enabled.")

        val distribution = com.example.data.model.FindingRiskDistribution.fromAnalyses(
            listOf(criticalAnalysis, standardAnalysis)
        )

        assertFalse(distribution.isEmpty)
        assertTrue("Critical count should be >= 2", distribution.criticalCount >= 2)
        assertEquals(2, distribution.totalAnalyses)
        assertTrue("Total findings should exceed 0", distribution.totalFindings > 0)
        assertTrue(distribution.criticalPercentage > 0f)
    }

    @Test
    fun `test markdown report generation contains all required fields`() = runBlocking {
        val analyzer = VectorRuleAnalyzer()
        val prompt = "Create a public S3 bucket for customer documents."
        val analysis = analyzer.analyze(prompt)
        val improved = analyzer.buildImprovedPrompt(prompt, listOf("Enable Block Public Access on S3."))

        val report = analysis.generateMarkdownReport(improved)

        assertTrue(report.contains("# Vector — Security Diagnosis Report"))
        assertTrue(report.contains("Overall Risk Score:"))
        assertTrue(report.contains("Security Coverage:"))
        assertTrue(report.contains("1. Evaluated Prompt"))
        assertTrue(report.contains(prompt))
        assertTrue(report.contains("2. Detected AWS Resources"))
        assertTrue(report.contains("3. Security Findings Summary"))
        assertTrue(report.contains("4. Hardened Infrastructure Prompt"))
        assertTrue(report.contains("Enable Block Public Access on S3."))
    }
}
