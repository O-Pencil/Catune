/**
 * @file sensorSource.ts
 * @description 共享数据源：用 expo-sensors 的 DeviceMotion 读手机真实姿态，喂给 PostureEngine（3 节点：颈/胸/腰）。
 *   单手机一个 IMU 无法物理分离 3 个脊柱节点——把手机一个朝向映射成 3 路演示值；真实 3 节点来自决赛 BLE 姿态带。
 *   web 上 DeviceMotion 多数不可用 → start() 返回 false，调用方回退 mock。
 *
 * [WHO] 导出 `SensorSource`、`createSensorSource(engine, intervalMs)`
 * [FROM] 依赖 `expo-sensors`(DeviceMotion)、`./engine`(PostureEngine 类型)
 * [TO] 被 App.tsx 启动；不可用时由 App 回退到 mock
 * [HERE] src/posture/sensorSource.ts · 手机 IMU 数据源（3 节点映射，iOS/Android）
 */
import {DeviceMotion} from 'expo-sensors';
import type {PostureEngine} from './engine';

const RAD2DEG = 180 / Math.PI;

export type SensorSource = {
  /** 返回 true=传感器可用并已开始；false=不可用（调用方应回退 mock）。 */
  start: () => Promise<boolean>;
  stop: () => void;
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function createSensorSource(engine: PostureEngine, intervalMs = 100): SensorSource {
  let sub: {remove: () => void} | null = null;

  return {
    async start(): Promise<boolean> {
      try {
        const available = await DeviceMotion.isAvailableAsync();
        if (!available) {
          return false;
        }
        const perm = await DeviceMotion.requestPermissionsAsync();
        if (perm.status !== 'granted') {
          return false;
        }
        DeviceMotion.setUpdateInterval(intervalMs);
        sub = DeviceMotion.addListener(data => {
          const r = data.rotation;
          if (!r) {
            return;
          }
          const pitchDeg = r.beta * RAD2DEG; // 前后俯仰
          const rollDeg = r.gamma * RAD2DEG; // 左右翻滚
          // 单手机一个朝向 → 颈/胸共用前后轴（无法分离），腰用左右轴
          const neck = clamp(pitchDeg, -45, 60);
          const thor = clamp(pitchDeg, -20, 45);
          const lumbar = clamp(rollDeg, -40, 40);
          engine.update(neck, thor, lumbar);
        });
        return true;
      } catch {
        return false;
      }
    },
    stop() {
      sub?.remove();
      sub = null;
    },
  };
}
