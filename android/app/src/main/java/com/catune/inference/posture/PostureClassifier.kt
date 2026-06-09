/**
 * @file PostureClassifier.kt
 * @description 姿态文案生成编排：角度信号 → Prompt → 端侧模型 → 结构化分类 → 本地查表文案；模型不可用/解析失败时回退规则引擎。
 *
 * [WHO] 提供 `data class PostureFeedback`、`object PostureClassifier`（`suspend classify(engine, signals)`、`ruleFallback(signals)`）
 * [FROM] 依赖 `MnnPerceptionEngine.inferText`、`PosturePromptBuilder`、`PostureOutputParser`、`PostureAdvice`
 * [TO] 待接入：RN 桥/状态机在异常坐姿时调用，产出展示文案 + 推理指标（见 docs/端侧模型对接计划.md 阶段 2/4）
 * [HERE] android/app/src/main/java/com/catune/inference/posture/PostureClassifier.kt · 姿态推理编排 + 规则兜底
 *
 * 纪律（PRD §5.10）：分类/提醒以规则为可靠底线；模型只补「文案生成」，超时/崩溃自动回退；输出必过禁词检查。
 */
package com.catune.inference.posture

import com.catune.inference.mnn.InferenceMetrics
import com.catune.inference.mnn.MnnPerceptionEngine
import kotlin.math.abs

/** 最终反馈：分类 + 文案 + 指标（可空）+ 是否降级。 */
data class PostureFeedback(
    val classification: PostureClassification,
    val advice: String,
    val metrics: InferenceMetrics?,
    val degraded: Boolean,
)

object PostureClassifier {
    // 与 KinematicsHub 规则一致的阈值
    private const val NECK_TECH_DEG = 20f
    private const val LUMBAR_SLUMP_DEG = 15f
    private const val LUMBAR_LEAN_DEG = -10f

    /**
     * 端侧模型优先；模型为空/未加载/推理失败/解析失败 → 规则兜底（degraded）。
     * 文案一律本地查表生成并过禁词。
     */
    suspend fun classify(engine: MnnPerceptionEngine?, signals: PostureSignals): PostureFeedback {
        if (engine == null || !engine.isLoaded) return ruleFallback(signals)

        val prompt = PosturePromptBuilder.build(signals)
        val textResult = runCatching { engine.inferText(prompt) }.getOrNull()
            ?: return ruleFallback(signals)

        val parsed = PostureOutputParser.parse(textResult.rawOutput)
            ?: return ruleFallback(signals)

        val advice = PostureAdvice.adviceFor(parsed.actionId, parsed.severityLevel, parsed.postureClass)
        return PostureFeedback(
            classification = parsed,
            advice = advice,
            metrics = textResult.metrics,
            degraded = false,
        )
    }

    /** 纯规则兜底：复用 KinematicsHub 阈值，离线 100% 可用。 */
    fun ruleFallback(signals: PostureSignals): PostureFeedback {
        val (postureClass, actionId) = when {
            signals.neckPitchDeg > NECK_TECH_DEG -> PostureClass.TECH_NECK to "neck_retraction"
            signals.lumbarRollDeg > LUMBAR_SLUMP_DEG -> PostureClass.SLUMPED to "thoracic_extension"
            signals.lumbarRollDeg < LUMBAR_LEAN_DEG -> PostureClass.LEFT_LEAN to "scapular_retraction"
            else -> PostureClass.NORMAL to null
        }
        val severity = severityOf(postureClass, signals)
        val classification = PostureClassification(
            postureClass = postureClass,
            confidence = if (postureClass == PostureClass.NORMAL) 0.9f else 0.7f,
            actionId = actionId,
            severityLevel = severity,
            source = InferenceSource.RULE_FALLBACK,
        )
        return PostureFeedback(
            classification = classification,
            advice = PostureAdvice.adviceFor(actionId, severity, postureClass),
            metrics = null,
            degraded = true,
        )
    }

    private fun severityOf(postureClass: PostureClass, s: PostureSignals): Int {
        if (postureClass == PostureClass.NORMAL) return 0
        val excess = when (postureClass) {
            PostureClass.TECH_NECK -> s.neckPitchDeg - NECK_TECH_DEG
            PostureClass.SLUMPED -> s.lumbarRollDeg - LUMBAR_SLUMP_DEG
            PostureClass.LEFT_LEAN -> abs(s.lumbarRollDeg) - abs(LUMBAR_LEAN_DEG)
            else -> 0f
        }
        val base = when {
            excess >= 20f -> 3
            excess >= 10f -> 2
            else -> 1
        }
        // 久坐叠加严重度
        return if (s.durationMin >= 45) minOf(3, base + 1) else base
    }
}
