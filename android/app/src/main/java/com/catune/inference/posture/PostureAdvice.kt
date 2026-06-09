/**
 * @file PostureAdvice.kt
 * @description 安全链「本地查表生成文案 → 禁词检查」：把模型结构化字段(action_id/severity)翻译成中性建议文案，并拦截医疗/承诺/营销禁词。
 *
 * [WHO] 提供 `object PostureAdvice`（`adviceFor(actionId, severity, postureClass)`、`isSafe(text)`、`sanitize(text)`、常量 `SAFE_FALLBACK`/`BANNED_WORDS`）
 * [FROM] 无外部依赖（纯 Kotlin 查表 + 字符串）
 * [TO] 被 `PostureClassifier` 在拿到结构化分类后调用，产出最终展示文案
 * [HERE] android/app/src/main/java/com/catune/inference/posture/PostureAdvice.kt · 文案查表 + 禁词校验
 *
 * 设计：模型只输出结构化字段，自然语言一律本地生成，避免模型直出文案带来的医疗合规风险（对齐技术实现文档 §7.2、PRD §5.10）。
 */
package com.catune.inference.posture

object PostureAdvice {
    const val SAFE_FALLBACK = "注意调整坐姿，让脊柱回到自然中立位，必要时起身活动一下。"

    /** 禁词：诊断 / 治疗 / 承诺 / 营销（技术实现文档 §7.2）。 */
    val BANNED_WORDS = listOf(
        "确诊", "诊断为", "患有", "综合征",
        "治疗", "治愈", "药物", "手术", "注射", "贴片",
        "保证", "一定", "100%", "彻底", "永远",
        "限时", "优惠", "推荐购买", "扫码",
    )

    /** action_id → 基础建议文案（中性、非医疗）。 */
    private val ACTION_TEXT = mapOf(
        "neck_retraction" to "头部有些前倾，试着收下巴、让耳朵回到肩膀正上方，做几次颈部回缩。",
        "thoracic_extension" to "上背有点含胸，挺一下胸椎、打开肩膀，做几次胸椎伸展。",
        "scapular_retraction" to "肩膀略向前，轻轻把肩胛骨向后向下收，做几次肩胛后缩。",
    )

    private val NORMAL_TEXT = "坐姿不错，保持脊柱自然中立，继续加油。"

    /**
     * 本地查表生成文案：action_id 命中查表，否则按分类给中性建议；severity≥3 追加起身提示。
     * 最终一律过禁词检查。
     */
    fun adviceFor(actionId: String?, severityLevel: Int, postureClass: PostureClass): String {
        val base = when {
            actionId != null && ACTION_TEXT.containsKey(actionId) -> ACTION_TEXT.getValue(actionId)
            postureClass == PostureClass.NORMAL -> NORMAL_TEXT
            else -> SAFE_FALLBACK
        }
        val text = if (severityLevel >= 3) "$base 久坐较久了，建议起身走动 1-2 分钟。" else base
        return sanitize(text)
    }

    fun isSafe(text: String): Boolean = BANNED_WORDS.none { text.contains(it) }

    /** 命中禁词则整体替换为中性兜底文案。 */
    fun sanitize(text: String): String = if (isSafe(text)) text else SAFE_FALLBACK
}
