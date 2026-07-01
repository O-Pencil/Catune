/**
 * @file states.ts
 * @description Preview Sandbox 固定状态：让 UI/UX 调整无需等待传感器、BLE 或端侧模型。
 *
 * [WHO] 导出 `PREVIEW_SCENARIOS` / `createPreviewDashboardState` / `createPreviewGrowthState` / `previewModeForScenario`
 * [FROM] 依赖 `../i18n`、`../../posture/types`、`../../posture/growth`、`../screens/SettingsScreen`
 * [TO] 被 `PreviewApp.tsx` 消费
 * [HERE] src/design/preview/states.ts · 设计预览状态工厂
 */
import {tr, type Locale} from '../i18n';
import {DataMode} from '../screens/SettingsScreen';
import {DashboardState, PostureAction, PostureName, getPostureLabel} from '../../posture/types';
import {GrowthState} from '../../posture/growth';

export type PreviewScenarioId =
  | 'normal'
  | 'slumped'
  | 'techNeck'
  | 'leftLean'
  | 'offline'
  | 'streaming'
  | 'fallback';

export type PreviewScenario = {
  id: PreviewScenarioId;
  labelZh: string;
  labelEn: string;
};

type DashboardPatch = {
  posture: PostureName;
  neckPitch: number;
  thorPitch: number;
  lumbarRoll: number;
  score: number;
  abnormalDurationMinutes: number;
  adviceZh: string;
  adviceEn: string;
  inferenceSource: DashboardState['inferenceSource'];
  streaming: boolean;
  action: PostureAction | null;
};

export const PREVIEW_SCENARIOS: PreviewScenario[] = [
  {id: 'normal', labelZh: '正常', labelEn: 'Normal'},
  {id: 'slumped', labelZh: '驼背', labelEn: 'Slumped'},
  {id: 'techNeck', labelZh: '头前倾', labelEn: 'Tech neck'},
  {id: 'leftLean', labelZh: '左倾', labelEn: 'Left lean'},
  {id: 'offline', labelZh: '离线', labelEn: 'Offline'},
  {id: 'streaming', labelZh: '生成中', labelEn: 'Streaming'},
  {id: 'fallback', labelZh: '兜底', labelEn: 'Fallback'},
];

const DASHBOARD_PATCHES: Record<PreviewScenarioId, DashboardPatch> = {
  normal: {
    posture: 'NORMAL',
    neckPitch: 2,
    thorPitch: 4,
    lumbarRoll: 1,
    score: 96,
    abnormalDurationMinutes: 0,
    adviceZh: '现在坐姿很稳，保持肩颈放松和均匀呼吸。',
    adviceEn: 'Your posture is steady. Keep your shoulders soft and breathing even.',
    inferenceSource: 'RULE_FALLBACK',
    streaming: false,
    action: 'HOLD',
  },
  slumped: {
    posture: 'SLUMPED',
    neckPitch: 9,
    thorPitch: 23,
    lumbarRoll: 3,
    score: 68,
    abnormalDurationMinutes: 6,
    adviceZh: '胸椎有点塌，试着把胸口轻轻向上打开 20 秒。',
    adviceEn: 'Your upper back is collapsing a bit. Lift the chest gently for 20 seconds.',
    inferenceSource: 'MODEL',
    streaming: false,
    action: 'THORACIC_EXTENSION',
  },
  techNeck: {
    posture: 'TECH_NECK',
    neckPitch: 24,
    thorPitch: 8,
    lumbarRoll: 2,
    score: 72,
    abnormalDurationMinutes: 4,
    adviceZh: '头部在往前探，收下巴，让后颈变长一点。',
    adviceEn: 'Your head is drifting forward. Tuck the chin and lengthen the back of the neck.',
    inferenceSource: 'MODEL',
    streaming: false,
    action: 'NECK_RETRACTION',
  },
  leftLean: {
    posture: 'LEFT_LEAN',
    neckPitch: 5,
    thorPitch: 7,
    lumbarRoll: -14,
    score: 76,
    abnormalDurationMinutes: 3,
    adviceZh: '身体重心偏左，把坐骨平均放回椅面。',
    adviceEn: 'Your weight is drifting left. Bring both sitting bones evenly onto the chair.',
    inferenceSource: 'MODEL',
    streaming: false,
    action: 'WEIGHT_CENTERING',
  },
  offline: {
    posture: 'OFFLINE',
    neckPitch: 0,
    thorPitch: 0,
    lumbarRoll: 0,
    score: 0,
    abnormalDurationMinutes: 0,
    adviceZh: '暂时没有姿态数据，先检查传感器或切回模拟数据。',
    adviceEn: 'No posture signal is available. Check the sensor or switch back to mock data.',
    inferenceSource: 'RULE_FALLBACK',
    streaming: false,
    action: null,
  },
  streaming: {
    posture: 'SLUMPED',
    neckPitch: 10,
    thorPitch: 20,
    lumbarRoll: 2,
    score: 64,
    abnormalDurationMinutes: 8,
    adviceZh: '正在生成更贴合你的建议',
    adviceEn: 'Generating a more personal coaching cue',
    inferenceSource: 'MODEL',
    streaming: true,
    action: 'SCAPULAR_RETRACTION',
  },
  fallback: {
    posture: 'TECH_NECK',
    neckPitch: 21,
    thorPitch: 10,
    lumbarRoll: 1,
    score: 70,
    abnormalDurationMinutes: 5,
    adviceZh: '模型暂不可用。先做 3 次缓慢收下巴，保持视线平直。',
    adviceEn: 'The model is unavailable. Do three slow chin tucks and keep your gaze level.',
    inferenceSource: 'RULE_FALLBACK',
    streaming: false,
    action: 'NECK_RETRACTION',
  },
};

function pick(locale: Locale, zh: string, en: string): string {
  return locale === 'zh' ? zh : en;
}

export function createPreviewDashboardState(id: PreviewScenarioId, locale: Locale): DashboardState {
  const patch = DASHBOARD_PATCHES[id];
  return {
    neckPitch: patch.neckPitch,
    thorPitch: patch.thorPitch,
    lumbarRoll: patch.lumbarRoll,
    posture: patch.posture,
    postureLabel: getPostureLabel(patch.posture, locale),
    score: patch.score,
    abnormalDurationMinutes: patch.abnormalDurationMinutes,
    advice: pick(locale, patch.adviceZh, patch.adviceEn),
    inferenceSource: patch.inferenceSource,
    streaming: patch.streaming,
    action: patch.action,
  };
}

export function createPreviewGrowthState(locale: Locale): GrowthState {
  return {
    points: 118,
    stage: 3,
    stageName: tr(locale, 'plant.stageNames.bud'),
    log: [
      {
        id: 3,
        time: '07-02 09:42',
        action: pick(locale, '连续 8 分钟保持好坐姿', 'Held good posture for 8 minutes'),
        delta: 5,
        score: 118,
      },
      {
        id: 2,
        time: '07-02 09:21',
        action: pick(locale, '头前倾提醒', 'Forward-head reminder'),
        delta: -4,
        score: 113,
      },
      {
        id: 1,
        time: '07-02 09:08',
        action: pick(locale, '完成胸椎伸展', 'Completed thoracic extension'),
        delta: 8,
        score: 117,
      },
    ],
  };
}

export function previewModeForScenario(id: PreviewScenarioId): DataMode {
  if (id === 'offline') {
    return 'ws';
  }
  return 'mock';
}
