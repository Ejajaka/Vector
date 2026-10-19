package com.example.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AnalysisResult
import com.example.data.model.FindingType
import com.example.data.model.RiskLevel
import com.example.data.model.generateMarkdownReport
import com.example.ui.components.AwsResourceChip
import com.example.ui.components.FindingCard
import com.example.ui.components.MetricCard
import com.example.ui.components.RiskScoreBadge
import com.example.ui.theme.VectorCriticalRed
import com.example.ui.theme.VectorDarkTeal
import com.example.ui.theme.VectorHighRisk
import com.example.ui.theme.VectorPrimaryTeal
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun ResultsScreen(
    analysis: AnalysisResult,
    selectedClauseIds: Set<String>,
    improvedPromptText: String = "",
    onToggleSelectClause: (String) -> Unit,
    onSelectAll: () -> Unit,
    onClearAll: () -> Unit,
    onNavigateToImprovedPrompt: () -> Unit,
    onShowSnackbar: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    var showMetricsExplainer by remember { mutableStateOf(false) }

    // Prepare report data for Storage Access Framework download
    val reportContent = remember(analysis, improvedPromptText) {
        analysis.generateMarkdownReport(improvedPrompt = improvedPromptText)
    }

    val defaultFileName = remember(analysis.id, analysis.timestamp) {
        val dateTag = SimpleDateFormat("yyyyMMdd_HHmm", Locale.getDefault()).format(Date(analysis.timestamp))
        "vector-security-report-$dateTag.md"
    }

    val exportLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("text/markdown")
    ) { uri ->
        if (uri != null) {
            try {
                context.contentResolver.openOutputStream(uri)?.use { outputStream ->
                    outputStream.write(reportContent.toByteArray(Charsets.UTF_8))
                    outputStream.flush()
                }
                onShowSnackbar("Security report exported successfully.")
            } catch (e: Exception) {
                onShowSnackbar("Failed to export report: ${e.message}")
            }
        }
    }

    val missingFindings = remember(analysis) {
        analysis.findings.filter { it.type == FindingType.MISSING_CONTROL }
            .sortedBy { if (it.severity == RiskLevel.CRITICAL) 0 else if (it.severity == RiskLevel.HIGH) 1 else 2 }
    }
    val detectedFindings = remember(analysis) {
        analysis.findings.filter { it.type == FindingType.DETECTED_CONTROL }
    }
    val riskyFindings = remember(analysis) {
        analysis.findings.filter { it.type == FindingType.RISKY_STATEMENT }
            .sortedBy { if (it.severity == RiskLevel.CRITICAL) 0 else 1 }
    }

    val displayedFindings = when (selectedTabIndex) {
        0 -> missingFindings
        1 -> detectedFindings
        2 -> riskyFindings
        else -> missingFindings
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Overview Header
        item {
            Spacer(modifier = Modifier.height(4.dp))
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RiskScoreBadge(
                            riskScore = analysis.riskScore,
                            riskLevel = analysis.riskLevel
                        )

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            OutlinedButton(
                                onClick = { exportLauncher.launch(defaultFileName) },
                                modifier = Modifier
                                    .height(34.dp)
                                    .testTag("download_report_button"),
                                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                                shape = RoundedCornerShape(8.dp),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Download,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(15.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "Download Report",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }

                            Spacer(modifier = Modifier.width(6.dp))

                            IconButton(
                                onClick = { showMetricsExplainer = !showMetricsExplainer },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.HelpOutline,
                                    contentDescription = "Explain metrics",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "Evaluated Prompt:",
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = analysis.prompt,
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = MaterialTheme.colorScheme.onSurface,
                            lineHeight = 20.sp
                        )
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Coverage Progress Bar
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Security Controls Coverage",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        )
                        Text(
                            text = "${analysis.securityCoverage}%",
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = VectorPrimaryTeal
                            )
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    LinearProgressIndicator(
                        progress = { (analysis.securityCoverage / 100f).coerceIn(0f, 1f) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp)),
                        color = VectorPrimaryTeal,
                        trackColor = MaterialTheme.colorScheme.surfaceVariant
                    )

                    // Metrics Explainer Collapsible
                    AnimatedVisibility(visible = showMetricsExplainer) {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 14.dp),
                            shape = RoundedCornerShape(10.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "Metric Guidelines:",
                                    style = MaterialTheme.typography.labelMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "• Risk Score (0-100): Calculated deterministically from detected risky configurations and missing security controls.\n" +
                                            "• Security Coverage: Ratio of specified controls versus total expected controls for detected AWS services.\n" +
                                            "• Confidence (${analysis.confidence}%): Reflects completeness of prompt structural parsing. Does not guarantee environment safety.",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontSize = 11.sp,
                                        lineHeight = 16.sp
                                    )
                                )
                            }
                        }
                    }
                }
            }
        }

        // Summary Metric Tiles
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                MetricCard(
                    title = "AWS Services",
                    value = "${analysis.detectedResources.size}",
                    subtitle = "Identified",
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Missing",
                    value = "${analysis.missingControlsCount}",
                    subtitle = "Controls",
                    accentColor = VectorHighRisk,
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Risky Statements",
                    value = "${analysis.riskyStatementsCount}",
                    subtitle = "Flagged",
                    accentColor = VectorCriticalRed,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Detected AWS Resources Chips
        if (analysis.detectedResources.isNotEmpty()) {
            item {
                Column {
                    Text(
                        text = "Detected AWS Infrastructure Resources",
                        style = MaterialTheme.typography.titleSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(analysis.detectedResources) { resource ->
                            AwsResourceChip(resource = resource)
                        }
                    }
                }
            }
        }

        // Findings Tabs & Toolbar
        item {
            Column {
                ScrollableTabRow(
                    selectedTabIndex = selectedTabIndex,
                    containerColor = MaterialTheme.colorScheme.surface,
                    edgePadding = 0.dp,
                    divider = {}
                ) {
                    Tab(
                        selected = selectedTabIndex == 0,
                        onClick = { selectedTabIndex = 0 },
                        text = {
                            Text(
                                text = "Missing Controls (${missingFindings.size})",
                                fontWeight = if (selectedTabIndex == 0) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        modifier = Modifier.testTag("tab_missing_controls")
                    )
                    Tab(
                        selected = selectedTabIndex == 1,
                        onClick = { selectedTabIndex = 1 },
                        text = {
                            Text(
                                text = "Detected Controls (${detectedFindings.size})",
                                fontWeight = if (selectedTabIndex == 1) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        modifier = Modifier.testTag("tab_detected_controls")
                    )
                    Tab(
                        selected = selectedTabIndex == 2,
                        onClick = { selectedTabIndex = 2 },
                        text = {
                            Text(
                                text = "Risky Statements (${riskyFindings.size})",
                                fontWeight = if (selectedTabIndex == 2) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        modifier = Modifier.testTag("tab_risky_statements")
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Selection toolbar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${selectedClauseIds.size} clause(s) selected",
                        style = MaterialTheme.typography.bodySmall.copy(
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = onSelectAll,
                            modifier = Modifier
                                .height(32.dp)
                                .testTag("select_all_recommendations_button"),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Select All", fontSize = 12.sp)
                        }

                        OutlinedButton(
                            onClick = onClearAll,
                            modifier = Modifier
                                .height(32.dp)
                                .testTag("clear_recommendations_button"),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.Clear, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Clear", fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        // Findings List
        if (displayedFindings.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No findings in this category.",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        )
                    }
                }
            }
        } else {
            items(displayedFindings) { finding ->
                FindingCard(
                    finding = finding,
                    isSelectedForPrompt = selectedClauseIds.contains(finding.id),
                    onToggleSelect = { onToggleSelectClause(finding.id) },
                    modifier = Modifier.testTag("finding_card_${finding.id}")
                )
            }
        }

        // Action CTA to Review Improved Prompt
        item {
            Spacer(modifier = Modifier.height(10.dp))
            Button(
                onClick = onNavigateToImprovedPrompt,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .testTag("review_improved_prompt_button"),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = VectorPrimaryTeal,
                    contentColor = Color.White
                )
            ) {
                Text(
                    text = "Review Improved Prompt (${selectedClauseIds.size})",
                    style = MaterialTheme.typography.labelLarge.copy(
                        fontWeight = FontWeight.Bold
                    )
                )
                Spacer(modifier = Modifier.width(8.dp))
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
