package com.promptlinter.app.ui.screens

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.promptlinter.app.ui.components.ProjectChip
import com.promptlinter.app.ui.theme.LocalVectorColors
import com.promptlinter.app.ui.viewmodel.DetailPage
import com.promptlinter.app.ui.viewmodel.MainViewModel
import com.promptlinter.app.ui.viewmodel.Tab

@Composable
fun MoreScreen(vm: MainViewModel) {
    val ctx = LocalContext.current
    val project = vm.currentProject

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Spacer(Modifier.height(4.dp))
        Text(
            "Workspace",
            style = MaterialTheme.typography.headlineSmall.copy(
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
        )
        Text(
            "Projects, prompts, history and help.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = LocalVectorColors.current.darkTeal),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
        ) {
            Column(Modifier.padding(17.dp)) {
                Text(
                    "CURRENT PROJECT",
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = LocalVectorColors.current.mustard,
                        letterSpacing = 1.sp
                    )
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    project?.name ?: "No project",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    color = androidx.compose.ui.graphics.Color.White,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    project?.description?.ifBlank { "No description" } ?: "Create a project to begin.",
                    style = MaterialTheme.typography.bodySmall,
                    color = androidx.compose.ui.graphics.Color.White.copy(alpha = 0.8f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ProjectChip(name = "${vm.analysisCount(project?.id ?: "")} analyses")
                    ProjectChip(name = "${vm.requirementCount(project?.id ?: "")} requirements")
                }
                Spacer(Modifier.height(12.dp))
                OutlinedButton(
                    onClick = { vm.selectedTab = Tab.PROJECTS },
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, androidx.compose.ui.graphics.Color.White.copy(alpha = 0.4f)),
                    colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(
                        contentColor = androidx.compose.ui.graphics.Color.White
                    )
                ) {
                    Icon(Icons.Default.FolderOpen, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Manage projects", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Text("Work", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
        ) {
            Column {
                MoreRow(
                    icon = Icons.Default.FolderOpen,
                    title = "Projects",
                    subtitle = "Create, switch and delete project workspaces",
                    onClick = { vm.selectedTab = Tab.PROJECTS }
                )
                MoreDivider()
                MoreRow(
                    icon = Icons.Default.Description,
                    title = "Prompt Studio",
                    subtitle = "Approved requirements, coverage and saved briefs",
                    onClick = { vm.selectedTab = Tab.PROMPT }
                )
                MoreDivider()
                MoreRow(
                    icon = Icons.Default.History,
                    title = "Analysis history",
                    subtitle = "Search and reopen saved prompt evaluations",
                    onClick = { vm.selectedTab = Tab.HISTORY }
                )
                MoreDivider()
                MoreRow(
                    icon = Icons.Default.Palette,
                    title = "Review queue",
                    subtitle = "Requirements, suggestions and acceptance criteria",
                    onClick = { vm.selectedTab = Tab.REVIEW }
                )
            }
        }

        Text("Learn & data", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
        ) {
            Column {
                MoreRow(
                    icon = Icons.AutoMirrored.Filled.MenuBook,
                    title = "Help & manual",
                    subtitle = "Projects, review, briefs, engines and troubleshooting",
                    onClick = { vm.openDetail(DetailPage.HELP) }
                )
                MoreDivider()
                MoreRow(
                    icon = Icons.Default.Info,
                    title = "Prompt guidelines",
                    subtitle = "Supported elements, attributes and risk bands",
                    onClick = { vm.openDetail(DetailPage.GUIDELINES) }
                )
                MoreDivider()
                MoreRow(
                    icon = Icons.Default.Info,
                    title = "About Vector",
                    subtitle = "Product overview and responsible use",
                    onClick = { vm.openDetail(DetailPage.ABOUT) }
                )
                MoreDivider()
                MoreRow(
                    icon = Icons.Default.Settings,
                    title = "Settings",
                    subtitle = "Engine, appearance and local data",
                    onClick = { vm.selectedTab = Tab.SETTINGS }
                )
            }
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
        ) {
            Column(Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Share, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(19.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Export project data", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                }
                Spacer(Modifier.height(6.dp))
                Text(
                    "Share a JSON snapshot of this project's analyses, requirements, reviews and brief versions.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(11.dp))
                OutlinedButton(
                    onClick = { shareText(ctx, vm.exportAllJson(), "Vector project export") },
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(15.dp))
                    Spacer(Modifier.width(5.dp))
                    Text("Share JSON export", fontSize = 12.sp)
                }
            }
        }

        Text(
            "Vector stores this workspace on the device. The Rules engine works offline; BERT and the LLM are optional.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun MoreRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Surface(shape = CircleShape, color = MaterialTheme.colorScheme.surfaceVariant) {
            Icon(
                icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(7.dp).size(18.dp)
            )
        }
        Spacer(Modifier.width(11.dp))
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold))
            Text(
                subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2
            )
        }
        Icon(
            Icons.AutoMirrored.Filled.ArrowForward,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(17.dp)
        )
    }
}

@Composable
private fun MoreDivider() {
    androidx.compose.material3.HorizontalDivider(
        modifier = Modifier.padding(horizontal = 16.dp),
        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.55f)
    )
}

private fun shareText(context: Context, text: String, title: String) {
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, text)
    }
    context.startActivity(Intent.createChooser(intent, title))
}
