package com.promptlinter.app.data.engine

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import com.promptlinter.app.data.model.AcceptanceCriterion
import com.promptlinter.app.data.model.DesignSystemPreset
import com.promptlinter.app.data.model.DESIGN_SYSTEMS
import com.promptlinter.app.data.model.Project
import com.promptlinter.app.data.model.RequirementFinding
import com.promptlinter.app.data.model.RequirementRecord
import com.promptlinter.app.data.model.RequirementSuggestion
import com.promptlinter.app.data.model.designSystemById
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper
import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID
import java.util.zip.ZipInputStream

data class ParsedPage(val page: Int?, val text: String)

data class ParsedDocument(val label: String, val pages: List<ParsedPage>) {
    val text: String get() = pages.joinToString("\n\n") { it.text }
}

data class DraftRequirement(
    val text: String,
    val kind: String,
    val priority: String,
    val page: Int?
)

/**
 * Parses requirement documents and turns them into the lightweight review
 * artefacts used by the mobile client. The heuristics are intentionally
 * transparent: every finding can be traced back to the requirement text.
 */
object RequirementEngine {

    private val cue = Regex(
        """\b(shall|must|should|will|needs?\s+to|required|allow|enable|support|provide|display|show|validate|prevent|ensure|when|if|given|users?\s+can|system|must\s+not|can't|cannot)\b""",
        RegexOption.IGNORE_CASE
    )

    private val vagueTerms = linkedMapOf(
        "fast" to "a measurable response-time target",
        "quick" to "a measurable response-time target",
        "user-friendly" to "specific usability criteria",
        "user friendly" to "specific usability criteria",
        "easy" to "a concrete interaction rule",
        "simple" to "the exact steps and states",
        "secure" to "named security controls",
        "appropriate" to "an explicit rule",
        "etc" to "a complete list",
        "some" to "an exact quantity",
        "several" to "an exact quantity",
        "nice" to "a named visual or interaction token",
        "better" to "a measurable improvement",
        "modern" to "named visual tokens",
        "intuitive" to "specific discoverability rules",
        "flexible" to "the supported configurations",
        "robust" to "the failure conditions to handle",
        "efficient" to "a measurable efficiency target",
        "minimal" to "the exact minimum content",
        "reasonable" to "an explicit threshold",
        "as needed" to "the triggering condition"
    )

    private val nonFunctionalHints = listOf(
        "performance", "security", "accessibility", "responsive", "availability",
        "scalability", "privacy", "offline", "localization", "compliance",
        "latency", "throughput", "uptime", "audit", "encryption"
    )

    private val uiHints = listOf(
        "button", "form", "input", "field", "modal", "dialog", "list", "table",
        "card", "menu", "navbar", "sidebar", "screen", "page", "dropdown", "chart"
    )

    private val stopWords = setOf(
        "the", "and", "for", "with", "that", "this", "from", "into", "when", "then",
        "shall", "must", "should", "will", "have", "has", "are", "was", "were", "been",
        "user", "users", "system", "application", "app", "page", "screen", "their", "there"
    )

    // ---- Document parsing ----

    fun displayName(context: Context, uri: Uri): String {
        var name = uri.lastPathSegment ?: "requirements"
        runCatching {
            context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (index >= 0) name = cursor.getString(index) ?: name
                }
            }
        }
        return name
    }

    fun parse(context: Context, uri: Uri, label: String): ParsedDocument {
        val lower = label.lowercase(Locale.US)
        return when {
            lower.endsWith(".pdf") -> parsePdf(context, uri, label)
            lower.endsWith(".docx") -> parseDocx(context, uri, label)
            lower.endsWith(".md") || lower.endsWith(".markdown") || lower.endsWith(".txt") ->
                parsePlainText(context, uri, label)
            else -> {
                val mime = context.contentResolver.getType(uri) ?: ""
                when {
                    mime.contains("pdf") -> parsePdf(context, uri, label)
                    mime.contains("wordprocessingml") -> parseDocx(context, uri, label)
                    else -> parsePlainText(context, uri, label)
                }
            }
        }
    }

    private fun parsePdf(context: Context, uri: Uri, label: String): ParsedDocument {
        PDFBoxResourceLoader.init(context.applicationContext)
        val pages = mutableListOf<ParsedPage>()
        context.contentResolver.openInputStream(uri)?.use { input ->
            PDDocument.load(input).use { document ->
                val stripper = PDFTextStripper()
                for (page in 1..document.numberOfPages) {
                    stripper.startPage = page
                    stripper.endPage = page
                    val text = runCatching { stripper.getText(document) }.getOrDefault("").trim()
                    if (text.isNotEmpty()) pages += ParsedPage(page, text)
                }
            }
        } ?: throw IllegalArgumentException("Could not open the selected PDF.")
        return ParsedDocument(label, pages)
    }

    private fun parseDocx(context: Context, uri: Uri, label: String): ParsedDocument {
        var xml: String? = null
        context.contentResolver.openInputStream(uri)?.use { input ->
            ZipInputStream(input).use { zip ->
                var entry = zip.nextEntry
                while (entry != null) {
                    if (entry.name == "word/document.xml") {
                        val out = ByteArrayOutputStream()
                        val buffer = ByteArray(8192)
                        while (true) {
                            val read = zip.read(buffer)
                            if (read <= 0) break
                            out.write(buffer, 0, read)
                        }
                        xml = out.toString(Charsets.UTF_8.name())
                        break
                    }
                    entry = zip.nextEntry
                }
            }
        }
        val raw = xml ?: throw IllegalArgumentException("The DOCX file has no word/document.xml.")
        val withBreaks = raw
            .replace("</w:p>", "\n")
            .replace("<w:tab/>", "\t")
            .replace("<w:br/>", "\n")
        val withoutTags = Regex("<[^>]+>").replace(withBreaks, "")
        val text = unescapeXml(withoutTags)
            .lines()
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .joinToString("\n")
        return ParsedDocument(label, listOf(ParsedPage(null, text)))
    }

    private fun parsePlainText(context: Context, uri: Uri, label: String): ParsedDocument {
        val text = context.contentResolver.openInputStream(uri)?.use { input ->
            input.bufferedReader(Charsets.UTF_8).readText()
        } ?: throw IllegalArgumentException("Could not read the selected document.")
        return ParsedDocument(label, listOf(ParsedPage(null, text)))
    }

    private fun unescapeXml(value: String): String = value
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&apos;", "'")
        .replace("&amp;", "&")

    // ---- Requirement extraction ----

    fun extractRequirements(document: ParsedDocument): List<DraftRequirement> {
        val seen = mutableSetOf<String>()
        val result = mutableListOf<DraftRequirement>()
        for (page in document.pages) {
            val lines = page.text.split(Regex("\r?\n"))
            val chunks = lines.flatMap { line ->
                if (line.length > 240) splitSentences(line) else listOf(line)
            }
            for (raw in chunks) {
                val clean = raw
                    .replace(Regex("""^[\s•●▪◦\-–—*]+"""), "")
                    .replace(Regex("""^\(?\d{1,3}[.)]\s+"""), "")
                    .replace(Regex("""\s+"""), " ")
                    .trim()
                if (clean.length !in 18..420) continue
                if (clean.count { it.isLetter() } < 12) continue
                if (clean.endsWith(":") && clean.length < 70) continue
                if (clean == clean.uppercase(Locale.US) && clean.length < 80) continue
                if (!cue.containsMatchIn(clean) && !Regex("""^(the|a|an)\s+""", RegexOption.IGNORE_CASE).containsMatchIn(clean)) continue
                val normalized = clean.lowercase(Locale.US).replace(Regex("""[^a-z0-9]+"""), " ").trim()
                if (normalized.isEmpty() || !seen.add(normalized)) continue
                result += DraftRequirement(
                    text = clean.trimEnd('.', ';'),
                    kind = if (isNonFunctional(clean)) "non_functional" else "functional",
                    priority = priorityOf(clean),
                    page = page.page
                )
                if (result.size >= 180) return result
            }
        }
        return result
    }

    private fun splitSentences(text: String): List<String> =
        text.split(Regex("""(?<=[.!?])\s+""")).map { it.trim() }.filter { it.isNotEmpty() }

    private fun isNonFunctional(text: String): Boolean {
        val lower = text.lowercase(Locale.US)
        return nonFunctionalHints.any { lower.contains(it) }
    }

    private fun priorityOf(text: String): String {
        val lower = text.lowercase(Locale.US)
        return when {
            Regex("""\b(must|shall|critical|required|mandatory)\b""").containsMatchIn(lower) -> "High"
            Regex("""\b(may|could|optional|nice|future)\b""").containsMatchIn(lower) -> "Low"
            else -> "Medium"
        }
    }

    fun buildRecords(
        projectId: String,
        drafts: List<DraftRequirement>,
        sourceLabel: String,
        now: String,
        startIndex: Int = 0
    ): List<RequirementRecord> =
        drafts.mapIndexed { index, draft ->
            RequirementRecord(
                id = "req-${UUID.randomUUID().toString().take(8)}",
                projectId = projectId,
                code = "REQ-${(startIndex + index + 1).toString().padStart(3, '0')}",
                text = draft.text,
                kind = draft.kind,
                priority = draft.priority,
                sourceLabel = sourceLabel,
                sourcePage = draft.page,
                createdAt = now
            )
        }

    // ---- Suggestions ----

    fun generateSuggestions(projectId: String, requirements: List<RequirementRecord>): List<RequirementSuggestion> {
        val out = mutableListOf<RequirementSuggestion>()
        for (requirement in requirements.filter { it.status != "rejected" }) {
            val lower = requirement.text.lowercase(Locale.US)
            val foundVague = vagueTerms.keys.filter { lower.contains(it) }
            if (foundVague.isNotEmpty()) {
                val term = foundVague.first()
                out += suggestion(
                    projectId, requirement,
                    title = "Replace “$term” with a measurable rule",
                    detail = "“${term}” is not testable on its own. The reviewer cannot tell when the requirement is satisfied.",
                    proposed = "Replace “$term” with ${vagueTerms[term]}.",
                    severity = if (foundVague.size > 1) "high" else "medium"
                )
            }
            if (uiHints.any { lower.contains(it) } && listOf("error", "empty", "loading", "disabled", "success").none { lower.contains(it) }) {
                out += suggestion(
                    projectId, requirement,
                    title = "Define the empty, error and loading states",
                    detail = "This requirement names a UI element but never states what the user sees before data loads, when data is missing, or when the action fails.",
                    proposed = "Add explicit empty, loading, success and error states for ${requirement.code}.",
                    severity = "medium"
                )
            }
            if (Regex("""\b(admin|role|permission|owner|member|guest)\b""").containsMatchIn(lower) &&
                !lower.contains("permission") && !lower.contains("role")
            ) {
                out += suggestion(
                    projectId, requirement,
                    title = "Name the role and its permissions",
                    detail = "The requirement mentions an actor but does not say who may perform the action or what is hidden from other roles.",
                    proposed = "Add the allowed roles, the visible controls and the forbidden actions.",
                    severity = "high"
                )
            }
            if (Regex("""\b(save|store|persist|retain|delete)\b""").containsMatchIn(lower) &&
                !Regex("""\b(where|database|retention|expire|backup)\b""").containsMatchIn(lower)
            ) {
                out += suggestion(
                    projectId, requirement,
                    title = "Specify persistence and retention",
                    detail = "The requirement implies stored data but does not define where it lives, how long it is kept or how deletion works.",
                    proposed = "Add storage location, retention period and deletion behaviour.",
                    severity = "medium"
                )
            }
            if (Regex("""\b(responsive|mobile|tablet|desktop)\b""").containsMatchIn(lower) &&
                !Regex("""\b\d+\s?(px|dp|rem|breakpoint)\b""").containsMatchIn(lower)
            ) {
                out += suggestion(
                    projectId, requirement,
                    title = "Name the target breakpoints",
                    detail = "Responsive behaviour is required but no viewport sizes, stacking rules or hidden elements are stated.",
                    proposed = "Add the target breakpoints and what changes at each one.",
                    severity = "medium"
                )
            }
            if (Regex("""\b(login|password|auth|session)\b""").containsMatchIn(lower) &&
                !Regex("""\b(lockout|timeout|expiry|mfa|reset)\b""").containsMatchIn(lower)
            ) {
                out += suggestion(
                    projectId, requirement,
                    title = "Define session and recovery behaviour",
                    detail = "Authentication is mentioned without failure limits, session expiry or account recovery.",
                    proposed = "Add lockout, session timeout and password-reset behaviour.",
                    severity = "high"
                )
            }
            if (out.size >= 80) break
        }
        return out
    }

    private fun suggestion(
        projectId: String,
        requirement: RequirementRecord,
        title: String,
        detail: String,
        proposed: String,
        severity: String
    ) = RequirementSuggestion(
        id = "sug-${UUID.randomUUID().toString().take(8)}",
        projectId = projectId,
        requirementId = requirement.id,
        requirementCode = requirement.code,
        title = title,
        detail = detail,
        proposed = proposed,
        severity = severity
    )

    // ---- Acceptance criteria ----

    fun generateCriteria(projectId: String, requirements: List<RequirementRecord>): List<AcceptanceCriterion> =
        requirements.filter { it.status != "rejected" }.take(180).map { requirement ->
            val action = requirement.text
                .replace(Regex("""^(the\s+)?(system|app|application|ui)\s+(shall|must|should|will)\s+""", RegexOption.IGNORE_CASE), "")
                .trim()
                .trimEnd('.')
                .replaceFirstChar { it.lowercase() }
            val given = if (requirement.kind == "non_functional")
                "Given the system is operating under the stated conditions"
            else
                "Given the relevant UI context is available"
            AcceptanceCriterion(
                id = "ac-${UUID.randomUUID().toString().take(8)}",
                projectId = projectId,
                requirementId = requirement.id,
                requirementCode = requirement.code,
                text = "$given, when $action, then the expected outcome is visible and testable."
            )
        }

    // ---- Intelligence findings ----

    fun analyzeFindings(projectId: String, requirements: List<RequirementRecord>): List<RequirementFinding> {
        val active = requirements.filter { it.status != "rejected" }
        val out = mutableListOf<RequirementFinding>()

        for (requirement in active) {
            val lower = requirement.text.lowercase(Locale.US)
            val terms = vagueTerms.keys.filter { lower.contains(it) }
            if (terms.isNotEmpty()) {
                out += RequirementFinding(
                    id = "fnd-${UUID.randomUUID().toString().take(8)}",
                    projectId = projectId,
                    type = "ambiguity",
                    severity = if (terms.size > 1) "high" else "medium",
                    title = "Ambiguous wording in ${requirement.code}",
                    detail = "The requirement uses ${terms.joinToString(", ") { "“$it”" }} without a measurable definition.",
                    requirementCodes = listOf(requirement.code)
                )
            }
        }

        val pairs = active.take(120)
        for (i in pairs.indices) {
            for (j in i + 1 until pairs.size) {
                val a = pairs[i]
                val b = pairs[j]
                val shared = significantWords(a.text).intersect(significantWords(b.text))
                val opposite = oppositePair(a.text, b.text)
                val negationMismatch = hasNegation(a.text) != hasNegation(b.text)
                if ((shared.size >= 2 && negationMismatch) || opposite != null) {
                    out += RequirementFinding(
                        id = "fnd-${UUID.randomUUID().toString().take(8)}",
                        projectId = projectId,
                        type = "conflict",
                        severity = if (opposite != null) "high" else "medium",
                        title = "Possible conflict between ${a.code} and ${b.code}",
                        detail = opposite?.let { "The requirements use opposing terms: ${it.first} vs ${it.second}." }
                            ?: "One requirement is negative while the other is positive, and both describe ${shared.take(3).joinToString(", ")}.",
                        requirementCodes = listOf(a.code, b.code)
                    )
                }
            }
        }

        for (requirement in active) {
            val lower = requirement.text.lowercase(Locale.US)
            if (!Regex("""\b(after|before|once|following|depends?|requires?|prerequisite|only when)\b""").containsMatchIn(lower)) continue
            val words = significantWords(requirement.text)
            val related = active.firstOrNull {
                it.id != requirement.id && significantWords(it.text).intersect(words).isNotEmpty()
            } ?: continue
            out += RequirementFinding(
                id = "fnd-${UUID.randomUUID().toString().take(8)}",
                projectId = projectId,
                type = "dependency",
                severity = "low",
                title = "Dependency between ${requirement.code} and ${related.code}",
                detail = "${requirement.code} describes an ordering or prerequisite. Confirm that ${related.code} is completed first.",
                requirementCodes = listOf(requirement.code, related.code)
            )
        }

        return out.take(40)
    }

    private fun significantWords(text: String): Set<String> =
        text.lowercase(Locale.US)
            .split(Regex("""[^a-z0-9]+"""))
            .filter { it.length >= 5 && it !in stopWords }
            .toSet()

    private fun hasNegation(text: String): Boolean =
        Regex("""\b(not|never|no|without|disable|hide|prevent|cannot|can't)\b""", RegexOption.IGNORE_CASE).containsMatchIn(text)

    private fun oppositePair(a: String, b: String): Pair<String, String>? {
        val pairs = listOf(
            "light" to "dark", "enable" to "disable", "show" to "hide",
            "allow" to "deny", "add" to "remove", "public" to "private",
            "online" to "offline", "manual" to "automatic"
        )
        val lowerA = a.lowercase(Locale.US)
        val lowerB = b.lowercase(Locale.US)
        return pairs.firstOrNull { (left, right) ->
            (lowerA.contains(left) && lowerB.contains(right)) ||
                (lowerA.contains(right) && lowerB.contains(left))
        }
    }

    // ---- Brief ----

    fun generateBrief(
        project: Project,
        requirements: List<RequirementRecord>,
        criteria: List<AcceptanceCriterion>,
        suggestions: List<RequirementSuggestion>
    ): String {
        val approved = requirements.filter { it.status == "approved" }
        val approvedCriteria = criteria.filter { it.status == "approved" }
        val pending = requirements.filter { it.status == "pending" }
        val rejected = requirements.filter { it.status == "rejected" }
        val unresolved = suggestions.filter { it.status == "pending_review" }
        val design = designSystemById(project.designSystemId)
        val stamp = SimpleDateFormat("d MMM yyyy, HH:mm", Locale.US).format(Date())

        if (approved.isEmpty()) {
            return buildString {
                appendLine("# ${project.name} — UI specification brief")
                appendLine()
                appendLine("Generated $stamp")
                appendLine()
                appendLine("## No approved requirements yet")
                appendLine()
                appendLine("Approve at least one requirement in the Review tab before generating a brief. The mobile client will never build a specification from unreviewed text.")
                appendLine()
                appendLine("Current queue: ${pending.size} pending · ${rejected.size} rejected · ${requirements.size} total.")
            }
        }

        return buildString {
            appendLine("# ${project.name} — UI specification brief")
            appendLine()
            appendLine("Generated $stamp · ${approved.size} approved requirement(s) · ${approvedCriteria.size} approved criterion/criteria")
            appendLine()

            appendLine("## 1. Product context")
            appendLine(project.description.ifBlank { "No project description supplied." })
            appendLine()

            appendLine("## 2. Approved requirements")
            approved.sortedBy { it.code }.forEach { requirement ->
                appendLine("- **${requirement.code}** [${requirement.kind.replace('_', ' ')} · ${requirement.priority}] ${requirement.text}")
            }
            appendLine()

            appendLine("## 3. Acceptance criteria")
            if (approvedCriteria.isEmpty()) {
                appendLine("- No acceptance criteria have been approved yet.")
            } else {
                approvedCriteria.sortedBy { it.requirementCode }.forEach { criterion ->
                    appendLine("- **${criterion.requirementCode}** ${criterion.text}")
                }
            }
            appendLine()

            appendLine("## 4. Design system")
            appendLine("- Name: ${design.name}")
            appendLine("- Primary: ${design.primary}")
            appendLine("- Secondary: ${design.secondary}")
            appendLine("- Accent: ${design.accent}")
            appendLine("- Typography: ${design.typography}")
            appendLine("- Radius: ${design.radius}")
            appendLine("- Spacing: ${design.spacing}")
            appendLine("- Navigation: ${design.navigation}")
            appendLine()

            appendLine("## 5. Constraints and open questions")
            appendLine("- Build only the approved requirements above. Do not invent unsupported flows, fields or screens.")
            if (pending.isNotEmpty()) appendLine("- ${pending.size} requirement(s) are still pending review and must not be treated as confirmed.")
            if (rejected.isNotEmpty()) appendLine("- ${rejected.size} requirement(s) were rejected and are intentionally excluded.")
            if (unresolved.isNotEmpty()) appendLine("- ${unresolved.size} review suggestion(s) remain unresolved; confirm them before implementation.")
            if (pending.isEmpty() && rejected.isEmpty() && unresolved.isEmpty()) {
                appendLine("- No open review items. The brief is ready to hand to a UI generator.")
            }
            appendLine()
            appendLine("## 6. Output instruction")
            appendLine("Produce a responsive interface that satisfies every approved requirement and acceptance criterion. Preserve the design-system tokens above. If a detail is missing, ask instead of inventing it.")
        }
    }

    fun coverage(
        requirements: List<RequirementRecord>,
        criteria: List<AcceptanceCriterion>,
        suggestions: List<RequirementSuggestion>
    ): Map<String, Int> {
        val approved = requirements.count { it.status == "approved" }
        val pendingCriteria = criteria.count { it.status == "pending_review" }
        val approvedCriteria = criteria.count { it.status == "approved" }
        val unresolved = suggestions.count { it.status == "pending_review" }
        val percent = when {
            requirements.isEmpty() -> 0
            else -> ((approved.toDouble() / requirements.size) * 100).toInt()
        }
        return mapOf(
            "approvedRequirements" to approved,
            "totalRequirements" to requirements.size,
            "approvedCriteria" to approvedCriteria,
            "pendingCriteria" to pendingCriteria,
            "unresolvedSuggestions" to unresolved,
            "percent" to percent
        )
    }

    fun designSystems(): List<DesignSystemPreset> = DESIGN_SYSTEMS
}
