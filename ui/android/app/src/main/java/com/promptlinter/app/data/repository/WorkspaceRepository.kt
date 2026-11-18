package com.promptlinter.app.data.repository

import android.content.Context
import com.google.gson.Gson
import com.google.gson.JsonParser
import com.promptlinter.app.data.model.AcceptanceCriterion
import com.promptlinter.app.data.model.BriefVersion
import com.promptlinter.app.data.model.DEFAULT_DESIGN_SYSTEM_ID
import com.promptlinter.app.data.model.Project
import com.promptlinter.app.data.model.RequirementFinding
import com.promptlinter.app.data.model.RequirementRecord
import com.promptlinter.app.data.model.RequirementSuggestion
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

/**
 * Local-first workspace storage for projects, requirement reviews, findings,
 * brief versions and prompt drafts. Everything is scoped by project id.
 */
class WorkspaceRepository(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences("prompt_linter_workspace", Context.MODE_PRIVATE)
    private val gson = Gson()

    private val projectsKey = "projects_v1"
    private val requirementsKey = "requirements_v1"
    private val suggestionsKey = "suggestions_v1"
    private val criteriaKey = "criteria_v1"
    private val findingsKey = "findings_v1"
    private val versionsKey = "brief_versions_v1"
    private val currentProjectKey = "current_project_id"
    private val draftPrefix = "draft_"

    fun now(): String = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())

    // ---- Projects ----

    fun listProjects(): List<Project> = readList(projectsKey)

    fun ensureDefaultProject(): Project {
        val existing = listProjects()
        if (existing.isNotEmpty()) {
            val currentId = prefs.getString(currentProjectKey, null)
            return existing.firstOrNull { it.id == currentId } ?: existing.first().also { selectProject(it.id) }
        }
        val project = Project(
            id = "prj-${UUID.randomUUID().toString().take(8)}",
            name = "My first project",
            description = "A home for your UI requirements, reviews and briefs.",
            createdAt = now(),
            updatedAt = now()
        )
        writeList(projectsKey, listOf(project))
        selectProject(project.id)
        return project
    }

    fun currentProject(): Project? {
        val all = listProjects()
        if (all.isEmpty()) return null
        val currentId = prefs.getString(currentProjectKey, null)
        return all.firstOrNull { it.id == currentId } ?: all.first()
    }

    fun selectProject(id: String) {
        prefs.edit().putString(currentProjectKey, id).apply()
    }

    fun createProject(name: String, description: String): Project {
        val project = Project(
            id = "prj-${UUID.randomUUID().toString().take(8)}",
            name = name.trim().ifEmpty { "Untitled project" },
            description = description.trim(),
            createdAt = now(),
            updatedAt = now()
        )
        writeList(projectsKey, listProjects() + project)
        selectProject(project.id)
        return project
    }

    fun updateProject(id: String, name: String, description: String) {
        val updated = listProjects().map {
            if (it.id == id) it.copy(name = name.trim().ifEmpty { it.name }, description = description.trim(), updatedAt = now())
            else it
        }
        writeList(projectsKey, updated)
    }

    fun setDesignSystem(projectId: String, designSystemId: String) {
        writeList(
            projectsKey,
            listProjects().map {
                if (it.id == projectId) it.copy(designSystemId = designSystemId, updatedAt = now()) else it
            }
        )
    }

    fun deleteProject(id: String) {
        val remaining = listProjects().filterNot { it.id == id }
        writeList(projectsKey, remaining)
        writeList(requirementsKey, readList<RequirementRecord>(requirementsKey).filterNot { it.projectId == id })
        writeList(suggestionsKey, readList<RequirementSuggestion>(suggestionsKey).filterNot { it.projectId == id })
        writeList(criteriaKey, readList<AcceptanceCriterion>(criteriaKey).filterNot { it.projectId == id })
        writeList(findingsKey, readList<RequirementFinding>(findingsKey).filterNot { it.projectId == id })
        writeList(versionsKey, readList<BriefVersion>(versionsKey).filterNot { it.projectId == id })
        prefs.edit().remove(draftKey(id)).apply()
        if (prefs.getString(currentProjectKey, null) == id) {
            remaining.firstOrNull()?.let { selectProject(it.id) } ?: prefs.edit().remove(currentProjectKey).apply()
        }
    }

    // ---- Requirements ----

    fun listRequirements(projectId: String): List<RequirementRecord> =
        readList<RequirementRecord>(requirementsKey).filter { it.projectId == projectId }

    fun replaceRequirements(projectId: String, items: List<RequirementRecord>) {
        val others = readList<RequirementRecord>(requirementsKey).filterNot { it.projectId == projectId }
        writeList(requirementsKey, others + items)
    }

    fun updateRequirementStatus(id: String, status: String) {
        writeList(requirementsKey, readList<RequirementRecord>(requirementsKey).map {
            if (it.id == id) it.copy(status = status) else it
        })
    }

    fun setAllRequirementStatuses(projectId: String, from: String, to: String) {
        writeList(requirementsKey, readList<RequirementRecord>(requirementsKey).map {
            if (it.projectId == projectId && it.status == from) it.copy(status = to) else it
        })
    }

    // ---- Suggestions ----

    fun listSuggestions(projectId: String): List<RequirementSuggestion> =
        readList<RequirementSuggestion>(suggestionsKey).filter { it.projectId == projectId }

    fun replaceSuggestions(projectId: String, items: List<RequirementSuggestion>) {
        val others = readList<RequirementSuggestion>(suggestionsKey).filterNot { it.projectId == projectId }
        writeList(suggestionsKey, others + items)
    }

    fun updateSuggestionStatus(id: String, status: String) {
        writeList(suggestionsKey, readList<RequirementSuggestion>(suggestionsKey).map {
            if (it.id == id) it.copy(status = status) else it
        })
    }

    // ---- Acceptance criteria ----

    fun listCriteria(projectId: String): List<AcceptanceCriterion> =
        readList<AcceptanceCriterion>(criteriaKey).filter { it.projectId == projectId }

    fun replaceCriteria(projectId: String, items: List<AcceptanceCriterion>) {
        val others = readList<AcceptanceCriterion>(criteriaKey).filterNot { it.projectId == projectId }
        writeList(criteriaKey, others + items)
    }

    fun updateCriterionStatus(id: String, status: String) {
        writeList(criteriaKey, readList<AcceptanceCriterion>(criteriaKey).map {
            if (it.id == id) it.copy(status = status) else it
        })
    }

    // ---- Findings ----

    fun listFindings(projectId: String): List<RequirementFinding> =
        readList<RequirementFinding>(findingsKey).filter { it.projectId == projectId }

    fun replaceFindings(projectId: String, items: List<RequirementFinding>) {
        val others = readList<RequirementFinding>(findingsKey).filterNot { it.projectId == projectId }
        writeList(findingsKey, others + items)
    }

    // ---- Brief versions ----

    fun listVersions(projectId: String): List<BriefVersion> =
        readList<BriefVersion>(versionsKey).filter { it.projectId == projectId }.sortedByDescending { it.createdAt }

    fun saveVersion(version: BriefVersion) {
        val combined = readList<BriefVersion>(versionsKey).filterNot { it.id == version.id } + version
        // Keep the most recent 20 versions per project.
        val trimmed = combined.groupBy { it.projectId }.flatMap { (_, items) ->
            items.sortedByDescending { it.createdAt }.take(20)
        }
        writeList(versionsKey, trimmed)
    }

    fun deleteVersion(id: String) {
        writeList(versionsKey, readList<BriefVersion>(versionsKey).filterNot { it.id == id })
    }

    // ---- Drafts ----

    fun saveDraft(projectId: String, text: String) {
        prefs.edit().putString(draftKey(projectId), text).apply()
    }

    fun loadDraft(projectId: String): String = prefs.getString(draftKey(projectId), "") ?: ""

    fun clearDraft(projectId: String) {
        prefs.edit().remove(draftKey(projectId)).apply()
    }

    private fun draftKey(projectId: String) = "$draftPrefix$projectId"

    // ---- Export ----

    fun exportJson(projectId: String): String {
        val payload = mapOf(
            "project" to currentProject(),
            "requirements" to listRequirements(projectId),
            "suggestions" to listSuggestions(projectId),
            "criteria" to listCriteria(projectId),
            "findings" to listFindings(projectId),
            "versions" to listVersions(projectId)
        )
        return gson.toJson(payload)
    }

    // ---- Storage helpers ----

    private inline fun <reified T> readList(key: String): List<T> {
        val raw = prefs.getString(key, null) ?: return emptyList()
        return try {
            val parsed = JsonParser.parseString(raw)
            if (!parsed.isJsonArray) return emptyList()
            parsed.asJsonArray.mapNotNull { element ->
                runCatching { gson.fromJson(element, T::class.java) }.getOrNull()
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun <T> writeList(key: String, items: List<T>) {
        prefs.edit().putString(key, gson.toJson(items)).apply()
    }
}
