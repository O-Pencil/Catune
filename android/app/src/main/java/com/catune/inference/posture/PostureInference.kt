/**
 * @file PostureInference.kt
 * @description 姿态端侧推理的输入/输出契约 + Prompt 构造 + 结构化输出解析（对齐技术实现文档 §3.3）。
 *
 * [WHO] 提供 `data class PostureSignals`、`enum PostureClass`、`data class PostureClassification`、`object PosturePromptBuilder`、`object PostureOutputParser`
 * [FROM] 依赖 `kotlinx.serialization.json`、`com.catune.inference.mnn.ModelOutputParser.extractJsonPayload`
 * [TO] 被 `PostureClassifier` 用于「角度 → Prompt → 模型 → 结构化分类」；分类再经 `PostureAdvice` 生成文案
 * [HERE] android/app/src/main/java/com/catune/inference/posture/PostureInference.kt · 姿态推理契约与解析
 */
package com.catune.inference.posture

import com.catune.inference.mnn.ModelOutputParser
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.floatOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/** 端侧模型输入信号（来自 KinematicsHub / 角度解算的一个时间窗口）。 */
data class PostureSignals(
    val neckPitchDeg: Float,
    val thorPitchDeg: Float,
    val lumbarRollDeg: Float,
    val durationMin: Int,
    val lastState: String,
    val windowMs: Int = 5000,
)

/** 姿态分类枚举（与 KinematicsHub.Posture 对齐，snake_case 对接模型输出）。 */
enum class PostureClass(val wire: String) {
    NORMAL("normal"),
    TECH_NECK("tech_neck"),
    SLUMPED("slumped"),
    LEFT_LEAN("left_lean"),
    UNKNOWN("unknown");

    companion object {
        fun fromWire(value: String?): PostureClass =
            PostureClass.entries.firstOrNull { it.wire.equals(value?.trim(), ignoreCase = true) } ?: UNKNOWN
    }
}

/** 模型来源：真模型推理 / 规则兜底。 */
enum class InferenceSource { MODEL, RULE_FALLBACK }

/** 结构化分类结果（文案由 PostureAdvice 另行填充）。 */
data class PostureClassification(
    val postureClass: PostureClass,
    val confidence: Float,
    val actionId: String?,
    val severityLevel: Int,
    val source: InferenceSource = InferenceSource.MODEL,
)

object PosturePromptBuilder {
    /**
     * 构造收敛的结构化 Prompt：给模型角度输入，并强约束它只回结构化 JSON。
     * 对齐技术实现文档 §3.3 的输入/输出 schema。
     */
    fun build(signals: PostureSignals): String {
        val input = """
            {"schema_v":1,"window_ms":${signals.windowMs},"neck_pitch_deg":${signals.neckPitchDeg},"thor_pitch_deg":${signals.thorPitchDeg},"lumbar_roll_deg":${signals.lumbarRollDeg},"duration_min":${signals.durationMin},"last_state":"${signals.lastState}"}
        """.trimIndent()
        return buildString {
            append("你是坐姿评估助手。根据以下角度输入判断坐姿类别，只输出一个 JSON，不要解释、不要 markdown。\n")
            append("字段：classification ∈ {normal,tech_neck,slumped,left_lean}；confidence ∈ [0,1]；")
            append("action_id ∈ {none,neck_retraction,thoracic_extension,scapular_retraction}；severity_level ∈ {0,1,2,3}。\n")
            append("输入：")
            append(input)
            append("\n输出：")
        }
    }
}

object PostureOutputParser {
    private val json = Json { ignoreUnknownKeys = true }

    /**
     * 解析模型输出的结构化字段。无法解析时返回 null（调用方应回退规则引擎）。
     */
    fun parse(raw: String): PostureClassification? {
        if (raw.isBlank()) return null
        val payload = ModelOutputParser.extractJsonPayload(raw)
        return try {
            val obj = json.parseToJsonElement(payload).jsonObject
            val classification = PostureClass.fromWire(obj["classification"]?.jsonPrimitive?.content)
            val confidence = obj["confidence"]?.jsonPrimitive?.floatOrNull?.coerceIn(0f, 1f) ?: 0f
            val rawAction = obj["action_id"]?.jsonPrimitive?.content?.trim()
            val actionId = if (rawAction.isNullOrEmpty() || rawAction == "none") null else rawAction
            val severity = (obj["severity_level"]?.jsonPrimitive?.intOrNull ?: 0).coerceIn(0, 3)
            // 关键字段缺失（连分类都识别不出）视为解析失败，交给规则兜底
            if (classification == PostureClass.UNKNOWN && confidence == 0f) return null
            PostureClassification(
                postureClass = classification,
                confidence = confidence,
                actionId = actionId,
                severityLevel = severity,
                source = InferenceSource.MODEL,
            )
        } catch (_: Exception) {
            null
        }
    }
}
