package com.promptlinter.app.ui.screens

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoStories
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.promptlinter.app.ui.theme.LocalVectorColors

private data class HelpSection(
    val title: String,
    val summary: String,
    val body: List<String>
)

private val helpSections = listOf(
    HelpSection(
        "Quick start",
        "Four steps from an idea to an approved brief.",
        listOf(
            "Create or choose a project in More → Projects.",
            "Analyse a UI prompt in Analyze. Answer clarification questions or use placeholders.",
            "Import requirement documents in Review, then approve the statements you trust.",
            "Open Prompt Studio, check coverage, and copy or share the generated brief."
        )
    ),
    HelpSection(
        "Projects",
        "Every analysis, requirement and brief belongs to one project.",
        listOf(
            "Projects keep unrelated products from mixing their history and approvals.",
            "The current project is shown on Home, Analyze, Review and Prompt Studio.",
            "Deleting a project removes its analyses, requirements, reviews and briefs from this device.",
            "Everything is local-first; use More → Export to share a JSON snapshot."
        )
    ),
    HelpSection(
        "Prompt analysis",
        "Check a UI request before a generator fills the gaps for you.",
        listOf(
            "Describe the screen, elements, colours, placement and behaviour.",
            "Vector detects supported elements and links labels, colours, locations and actions.",
            "Missing or vague details become clarification questions; answers are merged and checked again.",
            "The risk score is a heuristic review aid, not a probability of failure.",
            "Copy or share the validated prompt, then paste it into any UI generator."
        )
    ),
    HelpSection(
        "Requirement inbox",
        "Turn a document into a reviewable queue.",
        listOf(
            "Supported formats: PDF, DOCX, TXT and Markdown.",
            "PDF and DOCX parsing happens on the device; no document is uploaded.",
            "Each statement keeps its source label and PDF page number where available.",
            "Importing adds to the existing queue; codes continue from the last requirement.",
            "If no requirement-like statements are found, rewrite the source as explicit must/shall statements."
        )
    ),
    HelpSection(
        "Review & acceptance",
        "Approve only what is testable.",
        listOf(
            "Requirements can be approved, rejected, or approved/rejected in bulk.",
            "Suggestions point at vague wording, missing states, undefined roles and persistence gaps.",
            "Acceptance criteria use Given/When/Then and are generated from the requirement queue.",
            "Findings surface ambiguity, possible conflicts and ordering dependencies.",
            "Rejected items stay visible for the audit trail but are excluded from the brief."
        )
    ),
    HelpSection(
        "Prompt Studio",
        "A six-section brief from approved inputs.",
        listOf(
            "The brief contains product context, requirements, criteria, design system, constraints and an output instruction.",
            "Only approved requirements and criteria are included.",
            "Coverage shows how much of the queue is approved.",
            "Save a version before a major review so you can load or share the snapshot later.",
            "Copy or share the brief into Base44, Lovable, v0, Bolt or any other generator."
        )
    ),
    HelpSection(
        "Design systems",
        "Token presets travel with every brief.",
        listOf(
            "Vector Classic, Neutral SaaS and High contrast are available on mobile.",
            "The selected preset is stored per project.",
            "Full token editing and version restore stay in the web workspace.",
            "The brief always names colours, typography, radius, spacing and navigation."
        )
    ),
    HelpSection(
        "Analysis history",
        "Saved evaluations, scoped by project.",
        listOf(
            "Search by prompt keyword, filter by risk and sort by date, risk or coverage.",
            "Opening a record shows the saved result instead of silently re-running the engine.",
            "Older records without a stored payload are re-run once and then saved again.",
            "Clear history removes only the current project's records."
        )
    ),
    HelpSection(
        "Engines & privacy",
        "Rules first, learned models optional.",
        listOf(
            "Rules runs offline on the device and is the deterministic baseline.",
            "BERT downloads its model once and runs on-device.",
            "LLM mode calls the endpoint configured in Settings and can write the final explanation.",
            "The Rules engine sends nothing to a server.",
            "API keys are stored in local app preferences; do not share a device with an untrusted user."
        )
    ),
    HelpSection(
        "Troubleshooting",
        "Common issues and what to try.",
        listOf(
            "Engine loading fails: leave the app open for a moment, then retry. The embedded WebView must finish loading.",
            "PDF import fails: confirm the file is text-based, not a scanned image.",
            "No requirements found: make statements explicit with shall/must/should or clear imperative lines.",
            "Brief is empty: approve at least one requirement first.",
            "Nothing appears in history: confirm the analysis belongs to the current project."
        )
    )
)

@Composable
fun HelpScreen() {
    var expanded by remember { mutableStateOf<String?>("Quick start") }
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Spacer(Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.AutoStories, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(22.dp))
                Spacer(Modifier.width(8.dp))
                Column {
                    Text(
                        "Vector manual",
                        style = MaterialTheme.typography.headlineSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    )
                    Text(
                        "Every mobile workflow in one place.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        items(helpSections, key = { it.title }) { section ->
            val open = expanded == section.title
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth().clickable {
                            expanded = if (open) null else section.title
                        }.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(section.title, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                            Text(
                                section.summary,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Icon(
                            if (open) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(19.dp)
                        )
                    }
                    if (open) {
                        Column(
                            modifier = Modifier.padding(start = 14.dp, end = 14.dp, bottom = 14.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            section.body.forEach { line ->
                                Row(verticalAlignment = Alignment.Top) {
                                    Text(
                                        "•",
                                        color = LocalVectorColors.current.mustard,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                    Spacer(Modifier.width(7.dp))
                                    Text(
                                        line,
                                        style = MaterialTheme.typography.bodySmall.copy(lineHeight = 18.sp),
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        item {
            Spacer(Modifier.height(6.dp))
            Text(
                "The web workspace remains the place for document bulk operations, the interactive requirement graph, design-token editing and the embedded builder.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(22.dp))
        }
    }
}
