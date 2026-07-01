/**
 * @file preset.ts
 * @description 预置体态评估结果（离线/无 Key/失败时的兜底，PRD §5.8.1 初赛演示用）。
 *   按 locale 返回对应语言版本的预置：zh 保留原中文文案；en 是平行英文翻译（label/value/suggestion 全英文化）。
 *
 * [WHO] 导出 `getPresetResults(locale)` / `pickPreset(locale?, seed?)`
 * [FROM] 依赖 ./types、../design/i18n(Locale)
 * [TO] 被 src/assess/service.ts 兜底返回
 * [HERE] src/assess/preset.ts · 预置评估结果（多语）
 */
import {type Locale} from '../design/i18n';
import {AssessmentResult} from './types';

/** zh 预置（与原 PRESET_RESULTS 一字不差，向后兼容）。 */
const PRESET_ZH: AssessmentResult[] = [
  {
    source: 'preset',
    summary: '整体不错，主要是头略前倾，注意收下巴。',
    observations: [
      {label: '头前倾', value: '约 16°', severity: 'mild'},
      {label: '圆肩', value: '轻度', severity: 'mild'},
      {label: '骨盆', value: '基本中立', severity: 'ok'},
    ],
    suggestions: ['做几次颈部回缩，让耳朵回到肩膀上方', '每坐 30 分钟起身活动一下'],
  },
  {
    source: 'preset',
    summary: '上背含胸较明显，建议多做胸椎伸展。',
    observations: [
      {label: '头前倾', value: '约 22°', severity: 'warn'},
      {label: '圆肩', value: '中度', severity: 'warn'},
      {label: '骨盆', value: '轻度后倾', severity: 'mild'},
    ],
    suggestions: ['挺胸打开肩膀，做胸椎伸展', '调高屏幕，让视线平视'],
  },
  {
    source: 'preset',
    summary: '坐姿挺端正，保持就好，注意别久坐。',
    observations: [
      {label: '头前倾', value: '约 8°', severity: 'ok'},
      {label: '圆肩', value: '不明显', severity: 'ok'},
      {label: '骨盆', value: '中立', severity: 'ok'},
    ],
    suggestions: ['保持当前姿态', '久坐记得起身喝水'],
  },
];

/** en 预置：与 zh 平行英文翻译（label/value/suggestion 字段）。结构与 severity 与 zh 一致。 */
const PRESET_EN: AssessmentResult[] = [
  {
    source: 'preset',
    summary: 'Overall decent — slight head forward, tuck your chin.',
    observations: [
      {label: 'Head Forward', value: '~16°', severity: 'mild'},
      {label: 'Rounded Shoulders', value: 'mild', severity: 'mild'},
      {label: 'Pelvis', value: 'roughly neutral', severity: 'ok'},
    ],
    suggestions: ['Do a few neck retractions, ears over shoulders', 'Stand up and move every 30 min'],
  },
  {
    source: 'preset',
    summary: 'Upper back looks rounded — try thoracic extensions.',
    observations: [
      {label: 'Head Forward', value: '~22°', severity: 'warn'},
      {label: 'Rounded Shoulders', value: 'moderate', severity: 'warn'},
      {label: 'Pelvis', value: 'slight posterior tilt', severity: 'mild'},
    ],
    suggestions: ['Open chest, do thoracic extensions', 'Raise your screen so eyes look level'],
  },
  {
    source: 'preset',
    summary: 'Posture looks upright — keep it up, watch the long sits.',
    observations: [
      {label: 'Head Forward', value: '~8°', severity: 'ok'},
      {label: 'Rounded Shoulders', value: 'not visible', severity: 'ok'},
      {label: 'Pelvis', value: 'neutral', severity: 'ok'},
    ],
    suggestions: ['Keep current posture', 'Stand and grab a sip of water now and then'],
  },
];

const PRESET_BY_LOCALE: Record<Locale, AssessmentResult[]> = {
  zh: PRESET_ZH,
  en: PRESET_EN,
};

/** @deprecated 保留旧导出做向后兼容（恒等于 zh 版本）。新代码请用 getPresetResults(locale)。 */
export const PRESET_RESULTS: AssessmentResult[] = PRESET_ZH;

/** 按 locale 返回预置评估列表。 */
export function getPresetResults(locale: Locale = 'en'): AssessmentResult[] {
  return PRESET_BY_LOCALE[locale] ?? PRESET_EN;
}

/** 轮换取一个预置结果（演示时多次评估不重复）。 */
export function pickPreset(locale: Locale = 'en', seed = Date.now()): AssessmentResult {
  const list = getPresetResults(locale);
  return list[Math.floor(seed / 1000) % list.length];
}