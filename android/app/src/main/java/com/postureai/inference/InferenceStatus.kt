/**
 * @file InferenceStatus.kt
 * @description 推理状态机：枚举 8 个阶段（IDLE/REQUEST_RECEIVED/CAPTURING/PREFILL/DECODING/COMPLETE/HEURISTIC/ERROR）+ InferenceStatusHub 全局 StateFlow。
 *
 * [WHO] 提供 `enum InferencePhase`、`data class InferenceStatus`、`object InferenceStatusHub`（`reset()` / `onRequest()` / `onCapturing()` / `onPrefill()` / `onDecoding()` / `onComplete()` / `onError()` / `onIdle()`）
 * [FROM] 依赖 `kotlinx.coroutines.flow.MutableStateFlow`
 * [TO] 被 `DefaultPerceptionEngine.analyze()` 全流程调用推送状态；被 `McpRequestHandler` 标记 `INFERENCE_TOOLS` 进入时调用 `onRequest`；被 `McpRequestHandler` 错误路径 `onError`
 * [HERE] android/app/src/main/java/com/postureai/inference/InferenceStatus.kt · 推理阶段状态机
 */
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
            detail = "Running vision-language prefill�?,
            updatedAtMs = System.currentTimeMillis(),
        )
    }

    fun onDecoding() {
        _state.value = _state.value.copy(
            phase = InferencePhase.DECODING,
            detail = "Generating tokens�?,
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
