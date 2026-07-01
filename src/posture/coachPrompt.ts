/**
 * @file coachPrompt.ts
 * @description 端侧教练 prompt 的「单一来源」，与微调训练数据 (training/gen_dataset.py / seed_gold.jsonl) **同格式」。
 *   指令 + （可选记忆前缀「已知用户：…。」）+ 姿态信号行（姿态：…；指标约X°；已持续N分钟。）。
 *   纪律：推理 prompt 必须 ≈ 训练 prompt，否则微调迁移会被削弱。
 *
 *   【i18n】按 locale 切换指令与姿态信号文本：
 *   - `zh`：与原训练 prompt 逐字一致（不变）。
 *   - `en`：英文指令 + 英文姿态标签 + "has persisted N minutes" 信号；模型仍可能输出 `[Action:Neck Retraction]` 或
 *     `[动作:xxx]`，由 actionTag.ts 解析端按 locale 选对应词典。
 *
 * [WHO] 导出 `COACH_INSTRUCTION_ZH`（向后兼容别名）、`buildSignalLine`、`buildCoachPrompt`
 * [FROM] 依赖 ./types(DashboardState/PostureName)、../design/i18n(Locale)
 * [TO] 被 adviceOrchestrator 用于生成端侧文案 prompt
 * [HERE] src/posture/coachPrompt.ts · 教练 prompt 单一来源（与训练对齐）
 */
import {DashboardState, PostureName} from './types';
import type {Locale} from '../design/i18n';

/** 与训练 instruction 字段逐字一致（zh）。改这里必须同步 training/gen_dataset.py、compare.py 并重跑生成+训练。 */
const COACH_INSTRUCTION_ZH =
  '你是温和的坐姿教练（一只爱操心的猫）。根据姿态信息，用一句不超过30字、有温度、指向具体动作、' +
  '不做医疗诊断、句尾带「喵～」的中文提醒用户调整坐姿；最后用 [动作:xxx] 标注一个建议动作。';

/** en 指令：与 zh 语义对齐，输出短句英文 + 末尾 [Action:xxx] 标签；不超 30 词、不医疗诊断。 */
const COACH_INSTRUCTION_EN =
  'You are a gentle posture coach (a caring cat). Based on the posture signal, ' +
  'write one warm English reminder under 30 words that points to a specific action, ' +
  'no medical diagnosis, ends with "meow~". End with [Action:xxx] tagging the suggested action.';

const INSTRUCTION_BY_LOCALE: Record<Locale, string> = {
  zh: COACH_INSTRUCTION_ZH,
  en: COACH_INSTRUCTION_EN,
};

/** @deprecated 保留旧常量名以兼容历史 import；恒等于 zh 版本。 */
export const COACH_INSTRUCTION = COACH_INSTRUCTION_ZH;

/** 姿态 → 「本地化标签（ENUM）；主指标约X°」，与训练 input 同格式（zh 与训练一字不差；en 是平行翻译）。 */
const SIGNAL_BY_LOCALE: Record<Locale, Record<PostureName, (s: DashboardState) => string>> = {
  zh: {
    TECH_NECK: s => `头前倾（TECH_NECK）；颈前倾约${Math.round(s.neckPitch)}°`,
    SLUMPED: s => `驼背（SLUMPED）；胸椎后凸约${Math.round(s.thorPitch)}°`,
    LEFT_LEAN: s => `身体左倾（LEFT_LEAN）；腰椎侧倾约${Math.round(s.lumbarRoll)}°`,
    NORMAL: () => '正常（NORMAL）；脊柱接近中立',
    OFFLINE: () => '未连接（OFFLINE）',
  },
  en: {
    TECH_NECK: s => `Head Forward (TECH_NECK); neck pitch ~${Math.round(s.neckPitch)}°`,
    SLUMPED: s => `Slumped (SLUMPED); thoracic kyphosis ~${Math.round(s.thorPitch)}°`,
    LEFT_LEAN: s => `Leaning Left (LEFT_LEAN); lumbar roll ~${Math.round(s.lumbarRoll)}°`,
    NORMAL: () => 'Normal (NORMAL); spine near neutral',
    OFFLINE: () => 'Disconnected (OFFLINE)',
  },
};

/** 姿态信号行：与训练 input 同格式。zh 是「姿态：…；已持续N分钟。」；en 是 `Posture: ...; has persisted N minutes.`。 */
export function buildSignalLine(s: DashboardState, locale: Locale = 'en'): string {
  const min = Math.max(1, Math.round(s.abnormalDurationMinutes));
  const signals = SIGNAL_BY_LOCALE[locale] ?? SIGNAL_BY_LOCALE.en;
  const body = signals[s.posture]?.(s) ?? s.posture;
  if (locale === 'zh') {
    return `姿态：${body}；已持续${min}分钟。`;
  }
  return `Posture: ${body}; has persisted ${min} minutes.`;
}

/**
 * 端侧教练完整 prompt：指令 +（可选记忆前缀）+ 姿态信号。
 * memoryPrefix 形如「已知用户：…。」，与训练混入的记忆前缀同格式。
 */
export function buildCoachPrompt(s: DashboardState, memoryPrefix = '', locale: Locale = 'en'): string {
  const instruction = INSTRUCTION_BY_LOCALE[locale] ?? INSTRUCTION_BY_LOCALE.en;
  return [instruction, memoryPrefix, buildSignalLine(s, locale)].filter(Boolean).join('\n');
}
