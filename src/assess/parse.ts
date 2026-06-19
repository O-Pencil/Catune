/**
 * @file parse.ts
 * @description 评估 prompt 与模型输出 JSON 解析（云端/端侧 VL 共用）。容错从夹带文本里抠出 JSON。
 *
 * [WHO] 导出 `ASSESS_SYSTEM`/`ASSESS_USER`/`parseAssessJson`
 * [FROM] 依赖 ./types
 * [TO] 被 src/assess/{cloudClient,localVlClient}.ts 消费
 * [HERE] src/assess/parse.ts · 评估 prompt 与解析
 */
import {AssessObservation, Severity} from './types';

export const ASSESS_SYSTEM = '你是专业体态评估师。只评估照片中可见的坐姿体态，不做医疗诊断、不提及疾病或治疗。';

export const ASSESS_USER =
  '看这张侧身坐姿照片，用 JSON 返回评估：' +
  '{"summary":"≤30字一句话总结","observations":[{"label":"头前倾","value":"约18°","severity":"mild"}],"suggestions":["建议1","建议2"]}。' +
  'observations 覆盖 头前倾/圆肩/骨盆/脊柱曲度 中可见的项；severity 取 ok/mild/warn。只输出 JSON，不要解释。';

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

export function parseAssessJson(text: string): {
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
  const summary = typeof obj.summary === 'string' && obj.summary.trim() ? obj.summary.trim() : '已完成体态评估';
  return {summary, observations, suggestions};
}
