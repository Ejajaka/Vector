package com.promptlinter.app.ui.viewmodel

import android.app.Application
import android.net.Uri
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.gson.Gson
import com.promptlinter.app.BuildConfig
import com.promptlinter.app.data.engine.JsEngine
import com.promptlinter.app.data.engine.RequirementEngine
import com.promptlinter.app.data.model.AcceptanceCriterion
import com.promptlinter.app.data.model.AnalysisPayload
import com.promptlinter.app.data.model.BriefVersion
import com.promptlinter.app.data.model.HistoryItem
import com.promptlinter.app.data.model.Project
import com.promptlinter.app.data.model.RequirementFinding
import com.promptlinter.app.data.model.RequirementRecord
import com.promptlinter.app.data.model.RequirementSuggestion
import com.promptlinter.app.data.model.designSystemById
import com.promptlinter.app.data.repository.HistoryRepository
import com.promptlinter.app.data.repository.WorkspaceRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.UUID

class MainViewModel(app: Application) : AndroidViewModel(app) {
    private val engine = JsEngine(app)
    private val gson = Gson()
    val historyRepo = HistoryRepository(app)
    val workspaceRepo = WorkspaceRepository(app)
    private val prefs = app.getSharedPreferences("prompt_linter_ai", android.content.Context.MODE_PRIVATE)

    // ---- AI settings ----

    var aiEngine by mutableStateOf(prefs.getString("engine_v2", "auto") ?: "auto")
    var aiBaseUrl by mutableStateOf(prefs.getString("base_url", BuildConfig.VECTOR_BASE_URL) ?: BuildConfig.VECTOR_BASE_URL)
    var aiModel by mutableStateOf(prefs.getString("model", BuildConfig.VECTOR_MODEL) ?: BuildConfig.VECTOR_MODEL)
    var aiApiKey by mutableStateOf(prefs.getString("api_key", BuildConfig.VECTOR_API_KEY) ?: BuildConfig.VECTOR_API_KEY)

    fun saveAiSettings(engineName: String, baseUrl: String, model: String, apiKey: String) {
        aiEngine = engineName
        aiBaseUrl = baseUrl
        aiModel = model
        aiApiKey = apiKey
        prefs.edit().putString("engine_v2", engineName).putString("base_url", baseUrl)
            .putString("model", model).putString("api_key", apiKey).apply()
    }

    private fun aiSettings(): Map<String, String> = mapOf(
        "baseUrl" to aiBaseUrl, "model" to aiModel, "apiKey" to aiApiKey
    )

    // ---- Engine state ----

    var engineReady by mutableStateOf(false)
    var engineError by mutableStateOf<String?>(null)

    // ---- Workspace ----

    var projects by mutableStateOf<List<Project>>(emptyList())
    var currentProject by mutableStateOf<Project?>(null)

    // ---- Analysis state ----

    var promptText by mutableStateOf("")
    var analyzing by mutableStateOf(false)
    var payload by mutableStateOf<AnalysisPayload?>(null)
    var answers = mutableStateMapOf<String, String>()
    var clarifyRound by mutableIntStateOf(1)
    var viewingSaved by mutableStateOf(false)
    var savedHistoryId by mutableStateOf<String?>(null)
    var analysisMessage by mutableStateOf<String?>(null)

    // ---- Review state ----

    var requirements by mutableStateOf<List<RequirementRecord>>(emptyList())
    var suggestions by mutableStateOf<List<RequirementSuggestion>>(emptyList())
    var criteria by mutableStateOf<List<AcceptanceCriterion>>(emptyList())
    var findings by mutableStateOf<List<RequirementFinding>>(emptyList())
    var importing by mutableStateOf(false)
    var reviewBusy by mutableStateOf(false)
    var importMessage by mutableStateOf<String?>(null)
    var importError by mutableStateOf<String?>(null)

    // ---- Brief state ----

    var selectedDesignSystemId by mutableStateOf("vector-classic")
    var briefText by mutableStateOf("")
    var briefVersions by mutableStateOf<List<BriefVersion>>(emptyList())
    var briefMessage by mutableStateOf<String?>(null)
    var briefCoverage by mutableStateOf<Map<String, Int>>(emptyMap())

    // ---- History filters ----

    var historySearch by mutableStateOf("")
    var historyRiskFilter by mutableStateOf("ALL")
    var historySort by mutableStateOf("date_desc")

    var selectedTab by mutableStateOf(Tab.OVERVIEW)
    var detailPage by mutableStateOf<DetailPage?>(null)

    fun openDetail(page: DetailPage) {
        detailPage = page
    }

    fun closeDetail() {
        detailPage = null
    }

    init {
        loadWorkspace()
        viewModelScope.launch(Dispatchers.IO) {
            try {
                engine.ensureReady()
                withContext(Dispatchers.Main) { engineReady = true }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) { engineError = e.message ?: "Failed to load engine" }
            }
        }
    }

    private fun loadWorkspace() {
        val project = workspaceRepo.ensureDefaultProject()
        // Adopt analyses saved before projects existed, so the upgrade never
        // hides a user's history.
        historyRepo.assignProject(project.id)
        projects = workspaceRepo.listProjects()
        currentProject = project
        refreshProjectData()
        promptText = workspaceRepo.loadDraft(project.id)
    }

    private fun refreshProjectData() {
        val project = currentProject ?: return
        requirements = workspaceRepo.listRequirements(project.id)
        suggestions = workspaceRepo.listSuggestions(project.id)
        criteria = workspaceRepo.listCriteria(project.id)
        findings = workspaceRepo.listFindings(project.id)
        briefVersions = workspaceRepo.listVersions(project.id)
        selectedDesignSystemId = project.designSystemId
        briefCoverage = RequirementEngine.coverage(requirements, criteria, suggestions)
        historySearch = ""
        historyRiskFilter = "ALL"
        historySort = "date_desc"
    }

    // ---- Projects ----

    fun selectProject(project: Project) {
        workspaceRepo.selectProject(project.id)
        currentProject = workspaceRepo.listProjects().firstOrNull { it.id == project.id } ?: project
        refreshProjectData()
        promptText = workspaceRepo.loadDraft(project.id)
        payload = null
        viewingSaved = false
        savedHistoryId = null
        answers.clear()
        clarifyRound = 1
        importMessage = null
        importError = null
        briefText = ""
        briefMessage = null
    }

    fun createProject(name: String, description: String) {
        val project = workspaceRepo.createProject(name, description)
        projects = workspaceRepo.listProjects()
        currentProject = project
        refreshProjectData()
        promptText = workspaceRepo.loadDraft(project.id)
        payload = null
        viewingSaved = false
        savedHistoryId = null
        briefText = ""
        briefMessage = null
    }

    fun updateProject(name: String, description: String) {
        val project = currentProject ?: return
        workspaceRepo.updateProject(project.id, name, description)
        projects = workspaceRepo.listProjects()
        currentProject = projects.firstOrNull { it.id == project.id }
    }

    fun deleteProject(project: Project) {
        historyRepo.deleteByProject(project.id)
        workspaceRepo.deleteProject(project.id)
        projects = workspaceRepo.listProjects()
        val next = workspaceRepo.currentProject()
        currentProject = next
        if (next != null) {
            selectProject(next)
        } else {
            val fallback = workspaceRepo.ensureDefaultProject()
            projects = workspaceRepo.listProjects()
            selectProject(fallback)
        }
    }

    fun analysisCount(projectId: String): Int = historyRepo.getAll(projectId).size

    fun requirementCount(projectId: String): Int = workspaceRepo.listRequirements(projectId).size

    // ---- Analysis ----

    fun updatePrompt(text: String) {
        promptText = text
        currentProject?.let { workspaceRepo.saveDraft(it.id, text) }
    }

    fun analyzeNew() {
        val text = promptText.trim()
        if (text.isEmpty() || analyzing) return
        val projectId = currentProject?.id
        if (projectId == null) {
            analysisMessage = "Create or select a project before analysing a prompt."
            return
        }
        workspaceRepo.saveDraft(projectId, text)
        answers.clear()
        clarifyRound = 1
        viewingSaved = false
        savedHistoryId = null
        analysisMessage = null
        runAnalysis(text, emptyMap(), false)
    }

    fun submitAnswers(values: Map<String, String>, usePlaceholders: Boolean) {
        val allUnknown = values.values.all { it == "unknown" }
        val stop = usePlaceholders || allUnknown
        val merged = answers.toMutableMap().apply { putAll(values) }
        answers.clear(); answers.putAll(merged)
        val nextRound = clarifyRound + 1
        clarifyRound = nextRound
        val projectId = currentProject?.id
        viewModelScope.launch(Dispatchers.IO) {
            withContext(Dispatchers.Main) { analyzing = true }
            try {
                var p = engine.analyze(promptText.trim(), merged, false, aiEngine, aiSettings())
                if (p.needsClarification && !stop && nextRound <= 4) {
                    withContext(Dispatchers.Main) {
                        payload = p
                        if (projectId != null) historyRepo.save(promptText.trim(), p, projectId)
                        analyzing = false
                    }
                    return@launch
                }
                if (p.needsClarification) {
                    p = engine.analyze(promptText.trim(), merged, true, aiEngine, aiSettings())
                }
                withContext(Dispatchers.Main) {
                    payload = p
                    if (projectId != null) historyRepo.save(promptText.trim(), p, projectId)
                    analyzing = false
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) { engineError = e.message; analyzing = false }
            }
        }
    }

    private fun runAnalysis(text: String, ans: Map<String, String>, finalize: Boolean) {
        val projectId = currentProject?.id
        viewModelScope.launch(Dispatchers.IO) {
            withContext(Dispatchers.Main) { analyzing = true }
            try {
                val p = engine.analyze(text, ans, finalize, aiEngine, aiSettings())
                withContext(Dispatchers.Main) {
                    payload = p
                    if (p.error == null && projectId != null) historyRepo.save(text, p, projectId)
                    analyzing = false
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) { engineError = e.message; analyzing = false }
            }
        }
    }

    fun openFromHistory(item: HistoryItem) {
        promptText = item.prompt
        detailPage = null
        selectedTab = Tab.NEW_ANALYSIS
        answers.clear(); clarifyRound = 1
        viewingSaved = true
        savedHistoryId = item.id
        payload = item.payloadJson?.let {
            runCatching { gson.fromJson(it, AnalysisPayload::class.java) }.getOrNull()
        }
        if (payload == null) {
            // Records created before payload storage are re-run once so the
            // user still gets a full result view.
            viewingSaved = false
            runAnalysis(item.prompt, emptyMap(), false)
        }
    }

    fun analyzeAgain() {
        viewingSaved = false
        savedHistoryId = null
        payload = null
        analyzeNew()
    }

    fun closeSavedAnalysis() {
        viewingSaved = false
        savedHistoryId = null
        payload = null
        selectedTab = Tab.HISTORY
    }

    fun clearAnalysis() {
        promptText = ""
        payload = null
        viewingSaved = false
        savedHistoryId = null
        answers.clear()
        clarifyRound = 1
        analysisMessage = null
        currentProject?.let { workspaceRepo.clearDraft(it.id) }
    }

    // ---- Requirement import ----

    fun importDocument(uri: Uri) {
        val project = currentProject ?: run {
            importError = "Choose a project before importing requirements."
            return
        }
        if (importing) return
        importing = true
        importError = null
        importMessage = null
        val app = getApplication<Application>()
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val label = RequirementEngine.displayName(app, uri)
                val parsed = RequirementEngine.parse(app, uri, label)
                val drafts = RequirementEngine.extractRequirements(parsed)
                if (drafts.isEmpty()) {
                    withContext(Dispatchers.Main) {
                        importError = "No requirement-like statements were found in $label."
                        importing = false
                    }
                    return@launch
                }
                val existing = workspaceRepo.listRequirements(project.id)
                val records = RequirementEngine.buildRecords(
                    projectId = project.id,
                    drafts = drafts,
                    sourceLabel = label,
                    now = workspaceRepo.now(),
                    startIndex = existing.size
                )
                workspaceRepo.replaceRequirements(project.id, existing + records)
                rebuildReviewArtifacts(project.id)
                withContext(Dispatchers.Main) {
                    refreshProjectData()
                    importMessage = "Added ${records.size} requirement(s) from $label."
                    importing = false
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    importError = e.message ?: "Could not import the document."
                    importing = false
                }
            }
        }
    }

    private fun rebuildReviewArtifacts(projectId: String) {
        val reqs = workspaceRepo.listRequirements(projectId)
        workspaceRepo.replaceSuggestions(projectId, RequirementEngine.generateSuggestions(projectId, reqs))
        workspaceRepo.replaceCriteria(projectId, RequirementEngine.generateCriteria(projectId, reqs))
        workspaceRepo.replaceFindings(projectId, RequirementEngine.analyzeFindings(projectId, reqs))
    }

    fun approveRequirement(id: String) {
        workspaceRepo.updateRequirementStatus(id, "approved")
        refreshReview()
    }

    fun rejectRequirement(id: String) {
        workspaceRepo.updateRequirementStatus(id, "rejected")
        refreshReview()
    }

    fun approveAllRequirements() {
        currentProject?.let { workspaceRepo.setAllRequirementStatuses(it.id, "pending", "approved") }
        refreshReview()
    }

    fun rejectAllRequirements() {
        currentProject?.let { workspaceRepo.setAllRequirementStatuses(it.id, "pending", "rejected") }
        refreshReview()
    }

    fun approveSuggestion(id: String) {
        workspaceRepo.updateSuggestionStatus(id, "accepted")
        refreshReview()
    }

    fun rejectSuggestion(id: String) {
        workspaceRepo.updateSuggestionStatus(id, "rejected")
        refreshReview()
    }

    fun approveCriterion(id: String) {
        workspaceRepo.updateCriterionStatus(id, "approved")
        refreshReview()
    }

    fun rejectCriterion(id: String) {
        workspaceRepo.updateCriterionStatus(id, "rejected")
        refreshReview()
    }

    fun regenerateSuggestions() {
        val project = currentProject ?: return
        reviewBusy = true
        workspaceRepo.replaceSuggestions(project.id, RequirementEngine.generateSuggestions(project.id, requirements))
        refreshReview()
        reviewBusy = false
    }

    fun regenerateCriteria() {
        val project = currentProject ?: return
        reviewBusy = true
        workspaceRepo.replaceCriteria(project.id, RequirementEngine.generateCriteria(project.id, requirements))
        refreshReview()
        reviewBusy = false
    }

    fun regenerateFindings() {
        val project = currentProject ?: return
        reviewBusy = true
        workspaceRepo.replaceFindings(project.id, RequirementEngine.analyzeFindings(project.id, requirements))
        refreshReview()
        reviewBusy = false
    }

    private fun refreshReview() {
        val project = currentProject ?: return
        requirements = workspaceRepo.listRequirements(project.id)
        suggestions = workspaceRepo.listSuggestions(project.id)
        criteria = workspaceRepo.listCriteria(project.id)
        findings = workspaceRepo.listFindings(project.id)
        briefCoverage = RequirementEngine.coverage(requirements, criteria, suggestions)
    }

    // ---- Brief / prompt studio ----

    fun selectDesignSystem(id: String) {
        val project = currentProject ?: return
        selectedDesignSystemId = id
        workspaceRepo.setDesignSystem(project.id, id)
        currentProject = workspaceRepo.listProjects().firstOrNull { it.id == project.id }
        if (briefText.isNotBlank()) generateBrief()
    }

    fun generateBrief() {
        val project = currentProject ?: return
        requirements = workspaceRepo.listRequirements(project.id)
        criteria = workspaceRepo.listCriteria(project.id)
        suggestions = workspaceRepo.listSuggestions(project.id)
        briefText = RequirementEngine.generateBrief(project, requirements, criteria, suggestions)
        briefCoverage = RequirementEngine.coverage(requirements, criteria, suggestions)
        briefMessage = null
    }

    fun saveBriefVersion() {
        val project = currentProject ?: return
        if (briefText.isBlank()) generateBrief()
        if (briefText.isBlank()) return
        val version = BriefVersion(
            id = "brf-${UUID.randomUUID().toString().take(8)}",
            projectId = project.id,
            createdAt = workspaceRepo.now(),
            text = briefText,
            approvedRequirements = requirements.count { it.status == "approved" },
            approvedCriteria = criteria.count { it.status == "approved" },
            designSystemId = selectedDesignSystemId
        )
        workspaceRepo.saveVersion(version)
        briefVersions = workspaceRepo.listVersions(project.id)
        briefMessage = "Saved version ${briefVersions.size}."
    }

    fun loadBriefVersion(version: BriefVersion) {
        briefText = version.text
        briefMessage = "Loaded the version from ${version.createdAt.take(16).replace('T', ' ')}."
    }

    fun deleteBriefVersion(id: String) {
        workspaceRepo.deleteVersion(id)
        currentProject?.let { briefVersions = workspaceRepo.listVersions(it.id) }
    }

    fun designSystemSummary(): String {
        val design = designSystemById(selectedDesignSystemId)
        return "${design.name} · ${design.primary} · ${design.typography}"
    }

    fun exportAllJson(): String {
        val project = currentProject ?: return "{}"
        val payload = mapOf(
            "exportedAt" to workspaceRepo.now(),
            "project" to project,
            "requirements" to workspaceRepo.listRequirements(project.id),
            "suggestions" to workspaceRepo.listSuggestions(project.id),
            "criteria" to workspaceRepo.listCriteria(project.id),
            "findings" to workspaceRepo.listFindings(project.id),
            "briefVersions" to workspaceRepo.listVersions(project.id),
            "history" to historyRepo.getAll(project.id)
        )
        return gson.toJson(payload)
    }
}

enum class Tab(val label: String) {
    OVERVIEW("Overview"),
    NEW_ANALYSIS("Analyze"),
    REVIEW("Review"),
    MORE("More"),
    PROJECTS("Projects"),
    PROMPT("Prompt Studio"),
    HISTORY("History"),
    SETTINGS("Settings")
}

enum class DetailPage(val label: String) {
    GUIDELINES("Prompt Guidelines"),
    ABOUT("About"),
    HELP("Help & Manual")
}
