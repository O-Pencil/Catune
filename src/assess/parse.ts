/**
 * @file parse.ts
 * @description 评估 prompt 与模型输出 JSON 解析（云端/端侧 VL 共用）。容错从夹带文本里抠出 JSON。
 *   按 locale 切 system/user prompt：zh 是与原训练一致的指令；en 是平行英文指令。
 *
 * [WHO] 导出 `buildAssessSystem(locale)` / `buildAssessUser(locale)` / `parseAssessJson(text, locale?)`
 * [FROM] 依赖 ./types、../ui/i18n(Locale)
 * [TO] 被 src/assess/{cloudClient,localVlClient}.ts 消费
 * [HERE] src/assess/parse.ts · 评估 prompt 与解析
 */
import {type Locale} from '../ui/i18n';
import {AssessObservation, Severity} from './types';

/** zh system 指令：与原 prompt 逐字一致（任何外部脚本/微调数据用到此文本都要同步更新）。 */
const ASSESS_SYSTEM_ZH =
  '你是专业体态评估师。只评估照片中可见的坐姿体态，不做医疗诊断、不提及疾病或治疗。';

/** en system 指令：与 zh 语义对齐，明确只评估可见体态、不做医疗诊断。 */
const ASSESS_SYSTEM_EN =
  'You are a professional posture assessor. Only evaluate posture visible in the photo; ' +
  'no medical diagnosis, no mention of disease or treatment.';

const ASSESS_SYSTEM_BY_LOCALE: Record<Locale, string> = {
  zh: ASSESS_SYSTEM_ZH,
  en: ASSESS_SYSTEM_EN,
};

/** zh user 模板：含 JSON schema 字段名 + 中文示例 label（与 zh 训练数据对齐）。 */
const ASSESS_USER_ZH =
  '看这张侧身坐姿照片，用 JSON 返回评估：' +
  '{"summary":"≤30字一句话总结","observations":[{"label":"头前倾","value":"约18°","severity":"mild"}],"suggestions":["建议1","建议2"]}。' +
  'observations 覆盖 头前倾/圆肩/骨盆/脊柱曲度 中可见的项；severity 取 ok/mild/warn。只输出 JSON，不要解释。';

/** en user 模板：JSON schema 同结构（field 名不变），示例 label 改英文。 */
const ASSESS_USER_EN =
  'Look at this side-view sitting photo, return assessment as JSON: ' +
  '{"summary":"one-sentence summary ≤30 words","observations":[{"label":"Head Forward","value":"~18°","severity":"mild"}],"suggestions":["suggestion 1","suggestion 2"]}. ' +
  'observations should cover visible items among Head Forward / Rounded Shoulders / Pelvis / Spinal Curvature; severity: ok / mild / warn. Output JSON only, no explanation.';

const ASSESS_USER_BY_LOCALE: Record<Locale, string> = {
  zh: ASSESS_USER_ZH,
  en: ASSESS_USER_EN,
};

export function buildAssessSystem(locale: Locale = 'en'): string {
  return ASSESS_SYSTEM_BY_LOCALE[locale] ?? ASSESS_SYSTEM_EN;
}

export function buildAssessUser(locale: Locale = 'en'): string {
  return ASSESS_USER_BY_LOCALE[locale] ?? ASSESS_USER_EN;
}

/** @deprecated 保留旧常量名做向后兼容别名（恒等于 zh 版本）。新代码请用 buildAssessSystem(locale)。 */
export const ASSESS_SYSTEM = ASSESS_SYSTEM_ZH;
/** @deprecated 同上；用 buildAssessUser(locale)。 */
export const ASSESS_USER = ASSESS_USER_ZH;

function normObs(o: unknown): AssessObservation | null {
  if (!o || typeof o !== 'object') {
    return null;
  }
  const rec = o as Record<string, unknown>;
  if (typeof rec.label !== 'string') {
    return null;
  }
  const sev = rec.severity;
  const severity: Severity | undefined = sev === 'ok' || sev === 'mild' || sev === 'warn' ? sev : undefined;
  return {label: String(rec.label), value: String(rec.value ?? ''), severity};
}

/** summary 缺失/无效时的兜底文案，按 locale 切换。 */
const FALLBACK_SUMMARY_BY_LOCALE: Record<Locale, string> = {
  zh: '已完成体态评估',
  en: 'Assessment complete',
};

export function parseAssessJson(
  text: string,
  locale: Locale = 'en',
): {
  summary: string;
  observations: AssessObservation[];
  suggestions: string[];
} {
  const match = text.match(/\{[\s\S]*\}/);
  let obj: Record<string, unknown> = {};
  if (match) {
    try {
      obj = JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      obj = {};
    }
  }
  const observations = Array.isArray(obj.observations)
    ? (obj.observations.map(normObs).filter(Boolean) as AssessObservation[])
    : [];
  const suggestions = Array.isArray(obj.suggestions) ? obj.suggestions.map(String).slice(0, 3) : [];
  const fallbackSummary = FALLBACK_SUMMARY_BY_LOCALE[locale] ?? FALLBACK_SUMMARY_BY_LOCALE.en;
  const summary = typeof obj.summary === 'string' && obj.summary.trim() ? obj.summary.trim() : fallbackSummary;
  return {summary, observations, suggestions};
}