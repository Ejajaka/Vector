package com.promptlinter.app.data.model

/**
 * Local, project-scoped requirement-engineering data.
 *
 * The web app stores this in Supabase; the mobile client keeps a deliberately
 * small, local-first version so projects, reviews and briefs work offline.
 */
data class Project(
    val id: String,
    val name: String,
    val description: String = "",
    val designSystemId: String = DEFAULT_DESIGN_SYSTEM_ID,
    val createdAt: String = "",
    val updatedAt: String = ""
)

data class RequirementRecord(
    val id: String,
    val projectId: String,
    val code: String,
    val text: String,
    val kind: String = "functional",
    val priority: String = "Medium",
    val status: String = "pending",
    val sourceLabel: String = "",
    val sourcePage: Int? = null,
    val createdAt: String = ""
)

data class RequirementSuggestion(
    val id: String,
    val projectId: String,
    val requirementId: String,
    val requirementCode: String,
    val title: String,
    val detail: String,
    val proposed: String,
    val severity: String = "medium",
    val status: String = "pending_review"
)

data class AcceptanceCriterion(
    val id: String,
    val projectId: String,
    val requirementId: String,
    val requirementCode: String,
    val text: String,
    val status: String = "pending_review"
)

data class RequirementFinding(
    val id: String,
    val projectId: String,
    val type: String,
    val severity: String,
    val title: String,
    val detail: String,
    val requirementCodes: List<String> = emptyList()
)

data class BriefVersion(
    val id: String,
    val projectId: String,
    val createdAt: String,
    val text: String,
    val approvedRequirements: Int,
    val approvedCriteria: Int,
    val designSystemId: String = DEFAULT_DESIGN_SYSTEM_ID
)

data class DesignSystemPreset(
    val id: String,
    val name: String,
    val summary: String,
    val primary: String,
    val secondary: String,
    val accent: String,
    val typography: String,
    val radius: String,
    val spacing: String,
    val navigation: String
)

const val DEFAULT_DESIGN_SYSTEM_ID = "vector-classic"

val DESIGN_SYSTEMS = listOf(
    DesignSystemPreset(
        id = DEFAULT_DESIGN_SYSTEM_ID,
        name = "Vector Classic",
        summary = "Warm ivory canvas, deep teal and mustard.",
        primary = "#49686C",
        secondary = "#30494B",
        accent = "#D1B653",
        typography = "Plus Jakarta Sans / Segoe UI",
        radius = "12 px cards · 10 px controls",
        spacing = "4 / 8 / 12 / 16 / 24",
        navigation = "Top bar + collapsible sidebar"
    ),
    DesignSystemPreset(
        id = "neutral-saas",
        name = "Neutral SaaS",
        summary = "Cool blue product UI with a crisp neutral canvas.",
        primary = "#2563EB",
        secondary = "#0F172A",
        accent = "#F59E0B",
        typography = "Inter / system sans",
        radius = "8 px cards · 8 px controls",
        spacing = "4 / 8 / 12 / 16 / 24",
        navigation = "Top navigation + optional drawer"
    ),
    DesignSystemPreset(
        id = "high-contrast",
        name = "High contrast",
        summary = "Maximum legibility for dense operational screens.",
        primary = "#0F172A",
        secondary = "#334155",
        accent = "#FACC15",
        typography = "System sans · 16 px base",
        radius = "4 px cards · 4 px controls",
        spacing = "4 / 8 / 12 / 16 / 24",
        navigation = "Top bar + persistent drawer"
    )
)

fun designSystemById(id: String?): DesignSystemPreset =
    DESIGN_SYSTEMS.firstOrNull { it.id == id } ?: DESIGN_SYSTEMS.first()
