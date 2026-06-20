/**
 * @file exercises.ts
 * @description 跟练例程数据：每个建议动作（PostureAction）对应一套引导式训练（保持/放松 × 次数 + 步骤）。
 *   初赛为预置内容；复赛可由模型/记忆个性化生成。被 Desk 建议动作 chip 点击后弹出的 TrainingScreen 消费。
 *
 * [WHO] 导出 `Exercise`、`getExercise`
 * [FROM] 依赖 ./types(PostureAction)、../ui/i18n(tr)
 * [TO] 被 src/ui/screens/TrainingScreen.tsx 消费
 * [HERE] src/posture/exercises.ts · 跟练例程数据
 */
import {tr} from '../ui/i18n';
import {PostureAction} from './types';

export type Exercise = {
  action: PostureAction;
  title: string;
  intro: string;
  /** 重复次数。 */
  reps: number;
  /** 每次保持秒数。 */
  holdSec: number;
  /** 每次之间放松秒数（最后一次后不放松）。 */
  restSec: number;
  steps: string[];
};

/**
 * 例程的「非文案」参数（reps / holdSec / restSec）跟 locale 无关；文案走 i18n。
 *   const e = getExercise('NECK_RETRACTION', locale);
 *   title: tr('exercise.NECK_RETRACTION.title')
 *   steps: Array.from({length: 4}, (_, i) => tr('exercise.NECK_RETRACTION.steps.{i}'))
 */
const PARAMS: Partial<Record<PostureAction, {reps: number; holdSec: number; restSec: number; stepCount: number}>> = {
  NECK_RETRACTION: {reps: 5, holdSec: 5, restSec: 3, stepCount: 4},
  THORACIC_EXTENSION: {reps: 5, holdSec: 6, restSec: 3, stepCount: 4},
  SCAPULAR_RETRACTION: {reps: 6, holdSec: 4, restSec: 2, stepCount: 4},
  WEIGHT_CENTERING: {reps: 4, holdSec: 5, restSec: 3, stepCount: 4},
  STAND_BREAK: {reps: 1, holdSec: 60, restSec: 0, stepCount: 4},
};

export function getExercise(action: PostureAction | null | undefined, locale: 'en' | 'zh' = 'en'): Exercise | null {
  if (!action) {
    return null;
  }
  const p = PARAMS[action];
  if (!p) {
    return null;
  }
  const titleK = `exercise.${action}.title`;
  const introK = `exercise.${action}.intro`;
  return {
    action,
    title: tr(locale, titleK),
    intro: tr(locale, introK),
    reps: p.reps,
    holdSec: p.holdSec,
    restSec: p.restSec,
    steps: Array.from({length: p.stepCount}, (_, i) => tr(locale, `exercise.${action}.steps.${i}`)),
  };
}

/** 兼容旧调用：默认 en。 */
export const EXERCISES: Partial<Record<PostureAction, Exercise>> = new Proxy(
  {} as Partial<Record<PostureAction, Exercise>>,
  {
    get(_t, prop: string) {
      return getExercise(prop as PostureAction, 'en');
    },
  },
);

/** 兼容旧调用：默认 en。 */
export function exerciseFor(action: PostureAction | null | undefined): Exercise | null {
  return getExercise(action, 'en');
}
