/**
 * @file postureMapping.ts
 * @description 单手机一个朝向 → 颈/胸/腰三节点角度的「几何映射」单一来源。供 sensorSource(直连 IMU) 与
 *   wsSensorSource(WS 接收) 共用，保证两条路径几何一致。
 *
 *   几何约定（与引擎阈值对齐：thor>15=驼背、neck>20=头前倾，正值=前倾）：
 *     - 手机竖直 pitch≈90° = 挺直背     → 前倾量 fwd≈0   → 各节点≈0（好）
 *     - 前倾（pitch 变小、趋向平放）     → fwd 变正、增大 → 驼背/低头（坏）
 *     - 手机平放 pitch≈0°                → fwd≈+90        → 严重前倾（坏）
 *     - 后仰（pitch>90）                 → fwd 负值        → 不罚
 *   即 fwd = baselinePitch − pitch（baselinePitch 默认 90=竖直挺直，可由「坐直校准」覆盖）。
 *   左右 side = roll − baselineRoll（腰椎侧倾，左右对称，基线默认 0）。
 *
 * [WHO] 导出 `UPRIGHT_PITCH_DEG`、`orientationToNodes`
 * [FROM] 依赖 ./utils(clamp)
 * [TO] 被 src/platform/sensorSource.ts、src/platform/wsSensorSource.ts 消费
 * [HERE] src/posture/postureMapping.ts · 朝向→三节点几何映射（单一来源）
 */
import {clamp} from './utils';

/** 手机竖直（pitch≈90°）= 挺直背 的参考角。 */
export const UPRIGHT_PITCH_DEG = 90;

export function orientationToNodes(
  pitchDeg: number,
  rollDeg: number,
  baselinePitch: number = UPRIGHT_PITCH_DEG,
  baselineRoll = 0,
): {neck: number; thor: number; lumbar: number} {
  const fwd = baselinePitch - pitchDeg; // 前倾为正：竖直=0，平放≈+90
  const side = rollDeg - baselineRoll;
  return {
    neck: clamp(fwd, -45, 60), // 颈/头前倾（低头=正）
    thor: clamp(fwd, -20, 45), // 胸/驼背（前倾=正）
    lumbar: clamp(side, -40, 40), // 腰/侧倾
  };
}
