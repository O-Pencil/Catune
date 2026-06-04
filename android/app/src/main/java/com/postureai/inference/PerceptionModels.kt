package com.postureai.inference

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Serializable
data class StructuredPerception(
    val scene: String,
    val objects: List<PerceivedObject> = emptyList(),
    val anomalies: List<String> = emptyList(),
    val confidence: String = "medium",
)

@Serializable
data class PerceivedObject(
    val label: String,
    val state: String,
)

data class PerceptionRequest(
    val prompt: String,
    val includeThumbnail: Boolean = false,
    val audioDurationSec: Int = 3,
    val mode: Mode,
) {
    enum class Mode { LOOK, LISTEN, PERCEIVE }
}

@Serializable
data class PerceptionResult(
    val summary: String,
    val structured: StructuredPerception,
    val capturedAtMs: Long = System.currentTimeMillis(),
    val inferenceMs: Long = 0,
    val transcriptHint: String? = null,
    val thumbnailBase64: String? = null,
    val degradedMode: Boolean = false,
    val modelLoaded: Boolean = false,
    /** Raw text from the VL model (for debugging truncated or markdown-wrapped JSON). */
    val rawModelOutput: String? = null,
    val parseWarning: String? = null,
) {
    fun toJson(): String = Json.encodeToString(serializer(), this)
}

@Serializable
data class RawLookResult(
    val prompt: String,
    val thumbnailBase64: String,
    val degradedMode: Boolean = true,
    val message: String,
) {
    fun toJson(): String = Json.encodeToString(this)
}
