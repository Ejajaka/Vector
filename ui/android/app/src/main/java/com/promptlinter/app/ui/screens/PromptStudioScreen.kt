package com.promptlinter.app.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.promptlinter.app.data.model.DESIGN_SYSTEMS
import com.promptlinter.app.data.model.designSystemById
import com.promptlinter.app.ui.components.EmptyStateCard
import com.promptlinter.app.ui.components.MetricTile
import com.promptlinter.app.ui.components.ProjectChip
import com.promptlinter.app.ui.theme.LocalVectorColors
import com.promptlinter.app.ui.viewmodel.MainViewModel
import com.promptlinter.app.ui.viewmodel.Tab

@Composable
fun PromptStudioScreen(vm: MainViewModel) {
    val ctx = LocalContext.current
    val project = vm.currentProject
    val approved = vm.requirements.count { it.status == "approved" }
    val coverage = vm.briefCoverage
    var copied by remember { mutableStateOf(false) }

    LaunchedEffect(project?.id) {
        if (vm.briefText.isBlank() && vm.requirements.any { it.status == "approved" }) {
            vm.generateBrief()
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Spacer(Modifier.height(4.dp))
            Column {
                Text(
                    "Prompt Studio",
                    style = MaterialTheme.typography.headlineSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                )
                Spacer(Modifier.height(3.dp))
                Text(
                    "A six-section design brief built only from approved requirements and criteria.",
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
                    icon = Icons.Default.Description,
                    title = "Choose a project first",
                    body = "A brief is generated per project from its approved requirements.",
                    actionLabel = "Open projects",
                    onAction = { vm.selectedTab = Tab.PROJECTS }
                )
            }
            return@LazyColumn
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Column(Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Palette, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(19.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Design system", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        DESIGN_SYSTEMS.forEach { design ->
                            FilterChip(
                                selected = vm.selectedDesignSystemId == design.id,
                                onClick = { vm.selectDesignSystem(design.id) },
                                label = { Text(design.name, fontSize = 11.sp, maxLines = 1) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = MaterialTheme.colorScheme.primary,
                                    selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                                )
                            )
                        }
                    }
                    val design = designSystemById(vm.selectedDesignSystemId)
                    Spacer(Modifier.height(7.dp))
                    Text(
                        "${design.primary} · ${design.secondary} · ${design.accent}",
                        style = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        "${design.typography} · ${design.radius} · ${design.navigation}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                MetricTile("Approved", "$approved/${vm.requirements.size}", LocalVectorColors.current.low, Modifier.weight(1f))
                MetricTile("Criteria", "${coverage["approvedCriteria"] ?: 0}/${vm.criteria.size}", LocalVectorColors.current.teal, Modifier.weight(1f))
                MetricTile("Coverage", "${coverage["percent"] ?: 0}%", LocalVectorColors.current.mustard, Modifier.weight(1f))
            }
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = vm::generateBrief,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(5.dp))
                    Text("Generate", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                OutlinedButton(
                    onClick = vm::saveBriefVersion,
                    enabled = vm.briefText.isNotBlank(),
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(5.dp))
                    Text("Save version", fontSize = 12.sp)
                }
            }
        }

        if (approved == 0) {
            item {
                EmptyStateCard(
                    icon = Icons.Default.Description,
                    title = "No approved requirements",
                    body = "Approve at least one requirement in Review. The brief will never be generated from unreviewed text.",
                    actionLabel = "Open review queue",
                    onAction = { vm.selectedTab = Tab.REVIEW }
                )
            }
        } else if (vm.briefText.isNotBlank()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                ) {
                    Column(Modifier.padding(15.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Generated brief", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                            Row {
                                IconButton(onClick = {
                                    copyToClipboard(ctx, vm.briefText)
                                    copied = true
                                }) {
                                    Icon(
                                        Icons.Default.ContentCopy,
                                        contentDescription = "Copy brief",
                                        tint = if (copied) LocalVectorColors.current.low else MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(19.dp)
                                    )
                                }
                                IconButton(onClick = { shareText(ctx, vm.briefText, "Vector brief") }) {
                                    Icon(
                                        Icons.Default.Share,
                                        contentDescription = "Share brief",
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(19.dp)
                                    )
                                }
                            }
                        }
                        if (copied) {
                            Text(
                                "Copied to the clipboard.",
                                style = MaterialTheme.typography.labelSmall,
                                color = LocalVectorColors.current.low
                            )
                            Spacer(Modifier.height(6.dp))
                        }
                        SelectionContainer {
                            Text(
                                vm.briefText,
                                style = MaterialTheme.typography.bodySmall.copy(
                                    fontFamily = FontFamily.Monospace,
                                    lineHeight = 18.sp
                                ),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                                    .padding(12.dp)
                            )
                        }
                        Spacer(Modifier.height(10.dp))
                        Text(
                            "Coverage: ${coverage["approvedRequirements"] ?: 0}/${coverage["totalRequirements"] ?: 0} requirements · " +
                                "${coverage["approvedCriteria"] ?: 0} approved criteria · " +
                                "${coverage["unresolvedSuggestions"] ?: 0} unresolved suggestions",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Saved versions", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                Text(
                    "${vm.briefVersions.size} saved",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        if (vm.briefVersions.isEmpty()) {
            item {
                Text(
                    "No versions saved yet. Generate a brief, then save it to keep an auditable snapshot.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            items(vm.briefVersions, key = { it.id }) { version ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(13.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                ) {
                    Column(Modifier.padding(13.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(
                                    version.createdAt.take(16).replace('T', ' '),
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    "${version.approvedRequirements} requirements · ${version.approvedCriteria} criteria · ${designSystemById(version.designSystemId).name}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                            IconButton(onClick = { shareText(ctx, version.text, "Vector brief") }) {
                                Icon(Icons.Default.Share, contentDescription = "Share version", modifier = Modifier.size(17.dp))
                            }
                            IconButton(onClick = { vm.deleteBriefVersion(version.id) }) {
                                Icon(
                                    Icons.Default.Delete,
                                    contentDescription = "Delete version",
                                    tint = LocalVectorColors.current.critical.copy(alpha = 0.8f),
                                    modifier = Modifier.size(17.dp)
                                )
                            }
                        }
                        TextButton(onClick = { vm.loadBriefVersion(version) }) {
                            Text("Load this version", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        vm.briefMessage?.let { message ->
            item {
                Text(
                    message,
                    style = MaterialTheme.typography.bodySmall,
                    color = LocalVectorColors.current.low
                )
            }
        }

        item { Spacer(Modifier.height(20.dp)) }
    }
}

private fun copyToClipboard(context: Context, text: String) {
    val manager = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    manager.setPrimaryClip(ClipData.newPlainText("Vector brief", text))
}

private fun shareText(context: Context, text: String, title: String) {
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, text)
    }
    context.startActivity(Intent.createChooser(intent, title))
}
