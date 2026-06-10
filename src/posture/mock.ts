/**
 * @file mock.ts
 * @description 跨平台模拟数据源（TS）：10Hz 写入姿态引擎，支持 F7 场景锁定。替代原 Kotlin SpineBluetoothManager 模拟流。
 *   真实蓝牙未来用 react-native-ble-plx（TS，两端通用）替换本文件的数据来源。
 *
 * [WHO] 导出 `SCENARIOS`、`MockScenario`、`createMockSource(engine)`
 * [FROM] 依赖 ./engine、./types
 * [TO] 被 App.tsx 启动；写入 PostureEngine
 * [HERE] src/posture/mock.ts · 模拟数据源（TS）
 */
import { PostureEngine } from './engine';
import { PostureName } from './types';

export type MockScenario = 'NORMAL' | 'SLUMPED' | 'TECH_NECK' | 'LEFT_LEAN' | 'OFFLINE';

export const SCENARIOS: MockScenario[] = ['NORMAL', 'SLUMPED', 'TECH_NECK', 'LEFT_LEAN', 'OFFLINE'];

/** 各场景对应的 (neck, lumbar) 角度（与原 KinematicsModule.setSimulationScenario 一致）。 */
const SCENARIO_ANGLES: Record<Exclude<MockScenario, 'OFFLINE'>, [number, number]> = {
  NORMAL: [5, 2],
  SLUMPED: [10, 25],
  TECH_NECK: [35, 5],
  LEFT_LEAN: [5, -15],
};

/** 纯 TS 角度解算占位（原 MainActivity.calculateSpineAnglesStatic 的等价实现）。 */
function calcAngles(raw: number[]): [number, number] {
  const neck = clamp((raw[0] ?? 0) * 12 + 8, -45, 45);
  const lumbar = clamp((raw[1] ?? 0) * 10 + 4, -30, 30);
  return [neck, lumbar];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export type MockSource = {
  start: () => void;
  stop: () => void;
  /** F7：锁定一个场景（会一直保持，直到切换或 resume）。 */
  setScenario: (scenario: MockScenario) => void;
  /** 解除锁定，回到随机正常态漂移。 */
  resume: () => void;
};

/**
 * 10Hz 模拟源。未锁定时产生「正常态」随机漂移；F7 锁定后持续保持该场景
 * （修复原 Kotlin 版本「F7 设置被随机流立刻覆盖」的问题）。
 */
export function createMockSource(engine: PostureEngine, intervalMs = 100): MockSource {
  let timer: ReturnType<typeof setInterval> | null = null;
  let pinned: MockScenario | null = null;

  function tick() {
    if (pinned === 'OFFLINE') {
      engine.setOffline();
      return;
    }
    if (pinned) {
      const [neck, lumbar] = SCENARIO_ANGLES[pinned];
      engine.update(neck, lumbar);
      return;
    }
    // 未锁定：正常态轻微漂移
    const [neck, lumbar] = calcAngles([Math.random(), Math.random()]);
    engine.update(neck, lumbar);
  }

  return {
    start() {
      if (timer) {return;}
      timer = setInterval(tick, intervalMs);
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    setScenario(scenario: MockScenario) {
      pinned = scenario;
      tick(); // 立即生效，不等下一拍
    },
    resume() {
      pinned = null;
    },
  };
}

/** 当前锁定场景与 UI 高亮对齐用：把引擎 posture 名映射回场景名（同名）。 */
export function postureToScenario(posture: PostureName): MockScenario {
  return posture as MockScenario;
}
