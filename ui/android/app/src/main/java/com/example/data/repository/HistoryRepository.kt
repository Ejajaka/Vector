package com.example.data.repository

import com.example.data.model.AnalysisMetrics
import com.example.data.model.AnalysisResult
import kotlinx.coroutines.flow.Flow

interface HistoryRepository {
    fun getAnalyses(includeDemo: Boolean): Flow<List<AnalysisResult>>
    fun getMetrics(includeDemo: Boolean): Flow<AnalysisMetrics>
    suspend fun saveAnalysis(result: AnalysisResult)
    suspend fun deleteAnalysis(id: String)
    suspend fun clearHistory()
    suspend fun getAnalysisById(id: String): AnalysisResult?
}
