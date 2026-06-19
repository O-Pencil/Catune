/**
 * @file preset.ts
 * @description 预置体态评估结果（离线/无 Key/失败时的兜底，PRD §5.8.1 初赛演示用）。
 *
 * [WHO] 导出 `PRESET_RESULTS`/`pickPreset`
 * [FROM] 依赖 ./types
 * [TO] 被 src/assess/service.ts 兜底返回
 * [HERE] src/assess/preset.ts · 预置评估结果
 */
import {AssessmentResult} from './types';

export const PRESET_RESULTS: AssessmentResult[] = [
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

/** 轮换取一个预置结果（演示时多次评估不重复）。 */
export function pickPreset(seed = Date.now()): AssessmentResult {
  return PRESET_RESULTS[Math.floor(seed / 1000) % PRESET_RESULTS.length];
}
