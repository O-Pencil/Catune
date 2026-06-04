package com.postureai.inference

interface PerceptionEngine {
    val isModelLoaded: Boolean
    val lastInferenceMs: Long
    fun analyze(request: PerceptionRequest): PerceptionResult
    fun lookRaw(prompt: String): RawLookResult
    fun analyzeWatchdogFrame(jpeg: ByteArray, prompt: String, alertRules: String?): WatchdogAnalysis
}

data class WatchdogAnalysis(
    val summary: String,
    val structured: StructuredPerception,
    val anomalyDetected: Boolean,
    val alertKey: String?,
    val inferenceMs: Long,
)
