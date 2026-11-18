package com.promptlinter.app.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.FactCheck
import androidx.compose.material.icons.filled.FindInPage
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.UploadFile
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.promptlinter.app.data.model.AcceptanceCriterion
import com.promptlinter.app.data.model.RequirementFinding
import com.promptlinter.app.data.model.RequirementRecord
import com.promptlinter.app.data.model.RequirementSuggestion
import com.promptlinter.app.ui.components.EmptyStateCard
import com.promptlinter.app.ui.components.MetricTile
import com.promptlinter.app.ui.components.ProjectChip
import com.promptlinter.app.ui.components.StatusPill
import com.promptlinter.app.ui.theme.LocalVectorColors
import com.promptlinter.app.ui.viewmodel.MainViewModel
import com.promptlinter.app.ui.viewmodel.Tab

private val reviewTabs = listOf("Requirements", "Suggestions", "Acceptance", "Findings")

@Composable
fun ReviewScreen(vm: MainViewModel) {
    val project = vm.currentProject
    var selectedTab by remember { mutableIntStateOf(0) }
    var search by remember { mutableStateOf("") }

    val importLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri != null) vm.importDocument(uri)
    }

    val approved = vm.requirements.count { it.status == "approved" }
    val pending = vm.requirements.count { it.status == "pending" }
    val rejected = vm.requirements.count { it.status == "rejected" }
    val pendingSuggestions = vm.suggestions.count { it.status == "pending_review" }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Spacer(Modifier.height(4.dp))
            Column {
                Text(
                    "Review queue",
                    style = MaterialTheme.typography.headlineSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                )
                Spacer(Modifier.height(3.dp))
                Text(
                    "Turn source documents into approved requirements, testable criteria and a brief.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(8.dp))
                ProjectChip(
                    name = project?.name ?: "No project",
                    onClick = { vm.selectedTab = Tab.PROJECTS }
                )
            }
        }

        if (project == null) {
            item {
                EmptyStateCard(
                    icon = Icons.Default.FactCheck,
                    title = "Choose a project first",
                    body = "Requirements and reviews are scoped per project so unrelated products never mix.",
                    actionLabel = "Open projects",
                    onAction = { vm.selectedTab = Tab.PROJECTS }
                )
            }
            return@LazyColumn
        }

        item { ImportRequirementCard(vm, onPick = { importLauncher.launch(IMPORT_MIME_TYPES) }) }

        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                MetricTile("Approved", approved.toString(), LocalVectorColors.current.low, Modifier.weight(1f))
                MetricTile("Pending", pending.toString(), LocalVectorColors.current.mustard, Modifier.weight(1f))
                MetricTile("Open notes", pendingSuggestions.toString(), LocalVectorColors.current.high, Modifier.weight(1f))
            }
        }

        item {
            ScrollableTabRow(
                selectedTabIndex = selectedTab,
                edgePadding = 0.dp,
                containerColor = Color.Transparent,
                contentColor = MaterialTheme.colorScheme.primary,
                divider = {}
            ) {
                reviewTabs.forEachIndexed { index, label ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = {
                            Text(
                                label,
                                fontSize = 12.sp,
                                fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    )
                }
            }
        }

        when (selectedTab) {
            0 -> {
                item {
                    OutlinedTextField(
                        value = search,
                        onValueChange = { search = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Filter requirements by code or text…") },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp)
                    )
                }
                if (vm.requirements.isNotEmpty()) {
                    item {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { vm.approveAllRequirements() },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp)
                            ) { Text("Approve pending", fontSize = 11.sp) }
                            OutlinedButton(
                                onClick = { vm.rejectAllRequirements() },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = LocalVectorColors.current.critical)
                            ) { Text("Reject pending", fontSize = 11.sp) }
                        }
                    }
                }
                val filtered = vm.requirements.filter {
                    search.isBlank() || it.text.contains(search, true) || it.code.contains(search, true)
                }
                if (filtered.isEmpty()) {
                    item {
                        EmptyStateCard(
                            icon = Icons.Default.Description,
                            title = if (vm.requirements.isEmpty()) "No requirements imported" else "No matches",
                            body = if (vm.requirements.isEmpty())
                                "Import a PDF, DOCX, TXT or Markdown document to build the review queue."
                            else "Try a different code or keyword.",
                            actionLabel = if (vm.requirements.isEmpty()) "Import document" else null,
                            onAction = if (vm.requirements.isEmpty()) {
                                { importLauncher.launch(IMPORT_MIME_TYPES) }
                            } else null
                        )
                    }
                } else {
                    items(filtered, key = { it.id }) { requirement ->
                        RequirementCard(
                            requirement = requirement,
                            onApprove = { vm.approveRequirement(requirement.id) },
                            onReject = { vm.rejectRequirement(requirement.id) }
                        )
                    }
                }
            }

            1 -> {
                item { ReviewSectionHeader("Suggestions", "${vm.suggestions.size} generated", onRefresh = vm::regenerateSuggestions) }
                if (vm.suggestions.isEmpty()) {
                    item {
                        EmptyStateCard(
                            icon = Icons.Default.Lightbulb,
                            title = "No suggestions yet",
                            body = "Import requirements, then generate suggestions for vague wording, missing states and undefined roles.",
                            actionLabel = "Generate suggestions",
                            onAction = vm::regenerateSuggestions
                        )
                    }
                } else {
                    items(vm.suggestions, key = { it.id }) { suggestion ->
                        SuggestionCard(
                            suggestion = suggestion,
                            onAccept = { vm.approveSuggestion(suggestion.id) },
                            onReject = { vm.rejectSuggestion(suggestion.id) }
                        )
                    }
                }
            }

            2 -> {
                item { ReviewSectionHeader("Acceptance criteria", "${vm.criteria.size} generated", onRefresh = vm::regenerateCriteria) }
                if (vm.criteria.isEmpty()) {
                    item {
                        EmptyStateCard(
                            icon = Icons.Default.Check,
                            title = "No acceptance criteria",
                            body = "Generate Given/When/Then criteria from the requirement queue, then approve the ones that are testable.",
                            actionLabel = "Generate criteria",
                            onAction = vm::regenerateCriteria
                        )
                    }
                } else {
                    items(vm.criteria, key = { it.id }) { criterion ->
                        CriterionCard(
                            criterion = criterion,
                            onApprove = { vm.approveCriterion(criterion.id) },
                            onReject = { vm.rejectCriterion(criterion.id) }
                        )
                    }
                }
            }

            else -> {
                item { ReviewSectionHeader("Intelligence findings", "${vm.findings.size} found", onRefresh = vm::regenerateFindings) }
                if (vm.findings.isEmpty()) {
                    item {
                        EmptyStateCard(
                            icon = Icons.Default.FindInPage,
                            title = "No findings",
                            body = "Scan the approved queue for ambiguous wording, possible conflicts and ordering dependencies.",
                            actionLabel = "Run analysis",
                            onAction = vm::regenerateFindings
                        )
                    }
                } else {
                    items(vm.findings, key = { it.id }) { finding ->
                        FindingCard(finding)
                    }
                }
            }
        }

        item { Spacer(Modifier.height(20.dp)) }
    }
}

private val IMPORT_MIME_TYPES = arrayOf(
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/*",
    "text/markdown",
    "text/x-markdown"
)

@Composable
private fun ImportRequirementCard(vm: MainViewModel, onPick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.UploadFile, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Column(Modifier.weight(1f)) {
                    Text("Requirement inbox", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                    Text(
                        "PDF, DOCX, TXT or Markdown · parsed on this device",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Spacer(Modifier.height(10.dp))
            Text(
                "Importing adds the document's requirement-like statements to ${vm.currentProject?.name ?: "the project"}. Existing reviews are kept.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = onPick,
                enabled = !vm.importing,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp)
            ) {
                if (vm.importing) {
                    CircularProgressIndicator(modifier = Modifier.size(17.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                    Spacer(Modifier.width(8.dp))
                    Text("Parsing document…")
                } else {
                    Icon(Icons.Default.UploadFile, contentDescription = null, modifier = Modifier.size(17.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Import requirement document")
                }
            }
            if (vm.importing) {
                Spacer(Modifier.height(10.dp))
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }
            vm.importMessage?.let {
                Spacer(Modifier.height(10.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = LocalVectorColors.current.softGreen.copy(alpha = 0.5f)
                ) {
                    Text(
                        it,
                        style = MaterialTheme.typography.bodySmall,
                        color = LocalVectorColors.current.softGreenText,
                        modifier = Modifier.padding(10.dp)
                    )
                }
            }
            vm.importError?.let {
                Spacer(Modifier.height(10.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = LocalVectorColors.current.warningBg
                ) {
                    Text(
                        it,
                        style = MaterialTheme.typography.bodySmall,
                        color = LocalVectorColors.current.warningText,
                        modifier = Modifier.padding(10.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun ReviewSectionHeader(title: String, count: String, onRefresh: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(title, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
            Text(count, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        TextButton(onClick = onRefresh) {
            Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(15.dp))
            Spacer(Modifier.width(4.dp))
            Text("Regenerate", fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun RequirementCard(
    requirement: RequirementRecord,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    val statusColor = when (requirement.status) {
        "approved" -> LocalVectorColors.current.low
        "rejected" -> LocalVectorColors.current.critical
        else -> LocalVectorColors.current.mustard
    }
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    requirement.code,
                    style = MaterialTheme.typography.labelMedium.copy(
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                )
                Spacer(Modifier.width(8.dp))
                StatusPill(
                    requirement.kind.replace('_', ' ').uppercase(),
                    if (requirement.kind == "non_functional") LocalVectorColors.current.teal else LocalVectorColors.current.minimal
                )
                Spacer(Modifier.width(6.dp))
                StatusPill("${requirement.priority.uppercase()}", statusColor)
                Spacer(Modifier.weight(1f))
                StatusPill(requirement.status.uppercase(), statusColor)
            }
            Spacer(Modifier.height(8.dp))
            Text(requirement.text, style = MaterialTheme.typography.bodyMedium, lineHeight = 20.sp)
            if (requirement.sourceLabel.isNotBlank()) {
                Spacer(Modifier.height(5.dp))
                Text(
                    "${requirement.sourceLabel}${requirement.sourcePage?.let { " · page $it" } ?: ""}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Spacer(Modifier.height(9.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (requirement.status != "approved") {
                    OutlinedButton(
                        onClick = onApprove,
                        shape = RoundedCornerShape(9.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = LocalVectorColors.current.low)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Approve", fontSize = 11.sp)
                    }
                }
                if (requirement.status != "rejected") {
                    OutlinedButton(
                        onClick = onReject,
                        shape = RoundedCornerShape(9.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = LocalVectorColors.current.critical)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Reject", fontSize = 11.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun SuggestionCard(
    suggestion: RequirementSuggestion,
    onAccept: () -> Unit,
    onReject: () -> Unit
) {
    val severityColor = when (suggestion.severity) {
        "high" -> LocalVectorColors.current.critical
        "medium" -> LocalVectorColors.current.high
        else -> LocalVectorColors.current.medium
    }
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                StatusPill(suggestion.severity.uppercase(), severityColor)
                Spacer(Modifier.width(6.dp))
                Text(
                    suggestion.requirementCode,
                    style = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                )
                Spacer(Modifier.weight(1f))
                StatusPill(suggestion.status.replace('_', ' ').uppercase(), severityColor)
            }
            Spacer(Modifier.height(8.dp))
            Text(suggestion.title, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
            Spacer(Modifier.height(3.dp))
            Text(
                suggestion.detail,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(8.dp))
            Text(
                suggestion.proposed,
                style = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f), RoundedCornerShape(8.dp))
                    .padding(9.dp)
            )
            Spacer(Modifier.height(9.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (suggestion.status != "accepted") {
                    OutlinedButton(
                        onClick = onAccept,
                        shape = RoundedCornerShape(9.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = LocalVectorColors.current.low)
                    ) { Text("Accept", fontSize = 11.sp) }
                }
                if (suggestion.status != "rejected") {
                    OutlinedButton(
                        onClick = onReject,
                        shape = RoundedCornerShape(9.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = LocalVectorColors.current.critical)
                    ) { Text("Reject", fontSize = 11.sp) }
                }
            }
        }
    }
}

@Composable
private fun CriterionCard(
    criterion: AcceptanceCriterion,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    val statusColor = when (criterion.status) {
        "approved" -> LocalVectorColors.current.low
        "rejected" -> LocalVectorColors.current.critical
        else -> LocalVectorColors.current.mustard
    }
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    criterion.requirementCode,
                    style = MaterialTheme.typography.labelMedium.copy(
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                )
                Spacer(Modifier.weight(1f))
                StatusPill(criterion.status.uppercase(), statusColor)
            }
            Spacer(Modifier.height(7.dp))
            Text(criterion.text, style = MaterialTheme.typography.bodySmall, lineHeight = 19.sp)
            Spacer(Modifier.height(9.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (criterion.status != "approved") {
                    OutlinedButton(
                        onClick = onApprove,
                        shape = RoundedCornerShape(9.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = LocalVectorColors.current.low)
                    ) { Text("Approve", fontSize = 11.sp) }
                }
                if (criterion.status != "rejected") {
                    OutlinedButton(
                        onClick = onReject,
                        shape = RoundedCornerShape(9.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = LocalVectorColors.current.critical)
                    ) { Text("Reject", fontSize = 11.sp) }
                }
            }
        }
    }
}

@Composable
private fun FindingCard(finding: RequirementFinding) {
    val severityColor = when (finding.severity) {
        "critical", "high" -> LocalVectorColors.current.critical
        "medium" -> LocalVectorColors.current.high
        else -> LocalVectorColors.current.medium
    }
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                StatusPill(finding.severity.uppercase(), severityColor)
                Spacer(Modifier.width(6.dp))
                StatusPill(finding.type.uppercase(), MaterialTheme.colorScheme.primary)
                Spacer(Modifier.weight(1f))
                Text(
                    finding.requirementCodes.joinToString(" · "),
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(Modifier.height(8.dp))
            Text(finding.title, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
            Spacer(Modifier.height(3.dp))
            Text(
                finding.detail,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                lineHeight = 19.sp
            )
        }
    }
}
