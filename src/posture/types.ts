/**
 * @file types.ts
 * @description 姿态引擎的跨平台 TS 类型定义（iOS/Android 通用）。从 Kotlin 侧 KinematicsHub/PostureInference 迁移而来。
 *
 * [WHO] 导出 `PostureName` / `POSTURE_LABELS` / `InferenceSource` / `PostureSignals` / `KinematicsState` / `PostureFeedback` / `DashboardState`
 * [FROM] 无依赖（纯类型）
 * [TO] 被 src/posture/engine.ts、src/posture/mock.ts、App.tsx 消费
 * [HERE] src/posture/types.ts · 姿态数据契约（TS）
 */

/** 姿态枚举（与原 Kotlin KinematicsHub.Posture 对齐）。 */
export type PostureName = 'NORMAL' | 'SLUMPED' | 'TECH_NECK' | 'LEFT_LEAN' | 'OFFLINE';

export const POSTURE_LABELS: Record<PostureName, string> = {
  NORMAL: 'Normal',
  SLUMPED: 'Slumped (Hunchback)',
  TECH_NECK: 'Tech Neck',
  LEFT_LEAN: 'Leaning Left',
  OFFLINE: 'Disconnected',
};

/** 文案来源：端侧模型 / 规则兜底。 */
export type InferenceSource = 'MODEL' | 'RULE_FALLBACK';

/** 端侧模型输入信号（一个时间窗口的角度 + 上下文）。 */
export interface PostureSignals {
  neckPitchDeg: number;
  thorPitchDeg: number;
  lumbarRollDeg: number;
  durationMin: number;
  lastState: PostureName;
  windowMs: number;
}

/** 姿态状态机的输出状态。 */
export interface KinematicsState {
  neckPitch: number;
  lumbarRoll: number;
  posture: PostureName;
  postureLabel: string;
  score: number;
  abnormalDurationMinutes: number;
}

/** 分类 + 文案反馈。 */
export interface PostureFeedback {
  advice: string;
  source: InferenceSource;
}

/** 推给 UI 的完整仪表盘状态（状态 + 文案）。 */
export interface DashboardState extends KinematicsState {
  advice: string;
  inferenceSource: InferenceSource;
}
