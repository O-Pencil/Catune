/**
 * @file utils.ts
 * @description 跨模块共享的纯工具函数（无外部依赖）。
 *
 * [WHO] 导出 `clamp`、`pad`、`ABNORMAL_POSTURES`
 * [FROM] 无依赖
 * [TO] 被 mock.ts、sensorSource.ts、dailyHistory.ts、growth.ts、adviceOrchestrator.ts、reminder.ts 引用
 * [HERE] src/posture/utils.ts · 共享工具函数
 */

import type {PostureName} from './types';

/** 将数值限制在 [lo, hi] 区间内。 */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** 数字补零：`pad(5)` → `"05"`。 */
export function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** 异常姿态列表（驼背 / 头前倾 / 侧倾），供提醒与建议模块共用。 */
export const ABNORMAL_POSTURES: PostureName[] = ['SLUMPED', 'TECH_NECK', 'LEFT_LEAN'];
