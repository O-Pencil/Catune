package com.postureai.inference

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class InferencePhase {
    IDLE,
    REQUEST_RECEIVED,
    CAPTURING,
    PREFILL,
    DECODING,
    COMPLETE,
    HEURISTIC,
    ERROR,
}

data class InferenceStatus(
    val phase: InferencePhase = InferencePhase.IDLE,
    val requestId: String? = null,
    val activeTool: String? = null,
    val detail: String = "",
    val ttftMs: Long? = null,
    val decodeTps: Float? = null,
    val prefillMs: Long? = null,
    val decodeMs: Long? = null,
    val tokensGenerated: Int = 0,
    val outputChars: Int = 0,
    val outputPreview: String = "",
    val totalMs: Long? = null,
    val updatedAtMs: Long = System.currentTimeMillis(),
)

object InferenceStatusHub {
    private val _state = MutableStateFlow(InferenceStatus())
    val state: StateFlow<InferenceStatus> = _state.asStateFlow()

    fun reset() {
        _state.value = InferenceStatus()
    }

    fun onRequest(tool: String, requestId: String? = null) {
        _state.value = InferenceStatus(
            phase = InferencePhase.REQUEST_RECEIVED,
            requestId = requestId,
            activeTool = tool,
            detail = "MCP tool invoked",
            outputPreview = "",
            outputChars = 0,
        )
    }

    fun onCapturing(detail: String) {
        _state.value = _state.value.copy(
            phase = InferencePhase.CAPTURING,
            detail = detail,
            updatedAtMs = System.currentTimeMillis(),
        )
    }

    fun onPrefill() {
        _state.value = _state.value.copy(
            phase = InferencePhase.PREFILL,
            detail = "Running vision-language prefillâ€?,
            updatedAtMs = System.currentTimeMillis(),
        )
    }

    fun onDecoding() {
        _state.value = _state.value.copy(
            phase = InferencePhase.DECODING,
            detail = "Generating tokensâ€?,
            updatedAtMs = System.currentTimeMillis(),
        )
    }

    fun onComplete(
        ttftMs: Long?,
        prefillMs: Long?,
        decodeMs: Long?,
        tokensGenerated: Int,
        decodeTps: Float?,
        totalMs: Long,
        heuristic: Boolean,
        rawOutput: String? = null,
    ) {
        val preview = rawOutput?.take(600) ?: ""
        _state.value = InferenceStatus(
            phase = if (heuristic) InferencePhase.HEURISTIC else InferencePhase.COMPLETE,
            requestId = _state.value.requestId,
            activeTool = _state.value.activeTool,
            detail = if (heuristic) "Heuristic analysis (no VL weights)" else "Inference finished",
            ttftMs = ttftMs,
            prefillMs = prefillMs,
            decodeMs = decodeMs,
            tokensGenerated = tokensGenerated,
            outputChars = rawOutput?.length ?: 0,
            outputPreview = preview,
            decodeTps = decodeTps,
            totalMs = totalMs,
        )
    }

    fun onError(message: String) {
        _state.value = _state.value.copy(
            phase = InferencePhase.ERROR,
            detail = message,
            updatedAtMs = System.currentTimeMillis(),
        )
    }

    fun onIdle() {
        _state.value = InferenceStatus(phase = InferencePhase.IDLE)
    }
}
