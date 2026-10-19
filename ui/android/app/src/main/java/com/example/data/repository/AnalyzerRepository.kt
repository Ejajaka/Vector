package com.example.data.repository

import com.example.data.model.AnalysisResult
import com.example.data.model.ExamplePrompt

interface AnalyzerRepository {
    /**
     * Analyzes an AWS natural-language prompt for missing security controls and risky configurations.
     */
    suspend fun analyze(prompt: String, isDeepScan: Boolean = false): AnalysisResult

    /**
     * Builds an improved prompt by appending selected security clauses under a clearly labelled section.
     */
    fun buildImprovedPrompt(originalPrompt: String, selectedClauses: List<String>): String

    /**
     * Provides baseline selectable example prompts.
     */
    fun getExamplePrompts(): List<ExamplePrompt>

    /**
     * Returns true if deep scanning is supported / configured.
     */
    fun isDeepScanAvailable(): Boolean
}
