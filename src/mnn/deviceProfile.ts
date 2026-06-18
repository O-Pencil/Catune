/**
 * @file deviceProfile.ts
 * @description 设备性能探测 + 模型推荐。根据手机 RAM / CPU 架构 / SME2 加速能力 / 可用存储，自动分级并推荐合适的端侧模型。
 *
 * [WHO] 导出 `DeviceProfile` / `DeviceTier` / `ModelRecommendation` / `getDeviceProfile` / `recommendModel`
 * [FROM] 依赖 expo-device（RAM/CPU）、expo-file-system（存储）、NativeModules.CatuneMnn（SME2/CPU 能力检测）
 * [TO] 被 src/ui/screens（下载页 / Settings）消费，展示「为你的设备推荐：__，理由：__」
 * [HERE] src/mnn/deviceProfile.ts · 设备自适应模块
 */

import { Platform, NativeModules } from 'react-native';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system/legacy';
import { MODEL_CATALOG, MnnModelDef } from './modelCatalog';

// ─── 类型定义 ────────────────────────────────────────────────────────────────

/** 设备性能档位 */
export type DeviceTier = 'entry' | 'mainstream' | 'high';

/** CatuneMnn 原生模块接口（只取 getStatus 返回的 cpu 部分） */
type CatuneMnnStatus = {
  cpu?: {
    arch?: string;
    sme2?: boolean;
    i8mm?: boolean;
    dotprod?: boolean;
    fp16?: boolean;
  };
};

/** 设备性能快照 */
export interface DeviceProfile {
  /** 总内存（字节） */
  totalMemoryBytes: number;
  /** 总内存（GB，四舍五入 1 位） */
  totalMemoryGB: number;
  /** CPU 架构列表（如 ['arm64-v8a']） */
  cpuArchitectures: string[];
  /** 是否 arm64 */
  isArm64: boolean;
  /** SME2 支持 */
  hasSme2: boolean;
  /** i8mm 支持 */
  hasI8mm: boolean;
  /** dotprod 支持 */
  hasDotprod: boolean;
  /** fp16 支持 */
  hasFp16: boolean;
  /** 可用存储（字节） */
  freeDiskBytes: number;
  /** 可用存储（GB，四舍五入 1 位） */
  freeDiskGB: number;
  /** 设备性能档位 */
  tier: DeviceTier;
  /** 探测时间戳 */
  timestamp: number;
}

/** 模型推荐结果 */
export interface ModelRecommendation {
  /** 推荐的模型定义 */
  model: MnnModelDef;
  /** 推荐理由（简短，UI 直接展示） */
  reason: string;
  /** 推荐详情（用于展开查看） */
  details: string[];
  /** 是否有足够空间下载 */
  hasEnoughStorage: boolean;
  /** 模型所需存储（字节，估算） */
  requiredStorageBytes: number;
  /** 设备档位 */
  tier: DeviceTier;
  /** 可用存储（字节） */
  freeDiskBytes: number;
  /** 可用存储（GB） */
  freeDiskGB: number;
}

// ─── 常量 ──────────────────────────────────────────────────────────────────────

/** 档位阈值（GB） */
const TIER_RAM_ENTRY_MAX = 4;
const TIER_RAM_MAINSTREAM_MAX = 8;

/** 模型估算大小（字节） */
const MODEL_SIZE_ESTIMATE: Record<string, number> = {
  'qwen2.5-0.5b': 550 * 1024 * 1024,      // ~550MB
  'qwen3-1.7b': 1200 * 1024 * 1024,        // ~1.2GB
};

/** 最低存储余量（500MB 安全边际） */
const MIN_STORAGE_BUFFER = 500 * 1024 * 1024;

// ─── 设备信号采集 ──────────────────────────────────────────────────────────────

/**
 * 从 CatuneMnn 原生模块获取 CPU 能力信息。
 * 若模块不可用（如 iOS、模拟器未接入），返回空对象。
 */
async function fetchCpuInfo(): Promise<{
  sme2: boolean;
  i8mm: boolean;
  dotprod: boolean;
  fp16: boolean;
}> {
  try {
    const CatuneMnn = NativeModules.CatuneMnn as {
      getStatus?: () => Promise<CatuneMnnStatus>;
    } | undefined;

    if (!CatuneMnn?.getStatus) {
      return { sme2: false, i8mm: false, dotprod: false, fp16: false };
    }

    const status = await CatuneMnn.getStatus();
    const cpu = status?.cpu;
    return {
      sme2: cpu?.sme2 ?? false,
      i8mm: cpu?.i8mm ?? false,
      dotprod: cpu?.dotprod ?? false,
      fp16: cpu?.fp16 ?? false,
    };
  } catch {
    return { sme2: false, i8mm: false, dotprod: false, fp16: false };
  }
}

/**
 * 获取可用磁盘空间（字节）。
 */
async function getFreeDiskBytes(): Promise<number> {
  try {
    return await FileSystem.getFreeDiskStorageAsync();
  } catch {
    return 0;
  }
}

/**
 * 根据设备信号判定性能档位。
 */
function classifyTier(
  totalMemoryGB: number,
  isArm64: boolean,
  hasSme2: boolean,
  hasI8mm: boolean,
): DeviceTier {
  // 非 arm64 或 <4GB → 入门
  if (!isArm64 || totalMemoryGB < TIER_RAM_ENTRY_MAX) {
    return 'entry';
  }
  // >8GB 且有 SME2/i8mm → 高性能
  if (totalMemoryGB > TIER_RAM_MAINSTREAM_MAX && (hasSme2 || hasI8mm)) {
    return 'high';
  }
  // 其他（4-8GB arm64）→ 主流
  return 'mainstream';
}

// ─── 公开 API ──────────────────────────────────────────────────────────────────

/**
 * 探测当前设备性能并返回完整 DeviceProfile。
 * 会并行调用原生模块，首次调用约 100-200ms。
 */
export async function getDeviceProfile(): Promise<DeviceProfile> {
  const [cpuInfo, freeDiskBytes] = await Promise.all([
    fetchCpuInfo(),
    getFreeDiskBytes(),
  ]);

  const totalMemoryBytes = Device.totalMemory ?? 0;
  const totalMemoryGB = Math.round((totalMemoryBytes / (1024 * 1024 * 1024)) * 10) / 10;
  const freeDiskGB = Math.round((freeDiskBytes / (1024 * 1024 * 1024)) * 10) / 10;

  const cpuArchitectures = Device.supportedCpuArchitectures ?? [];
  const isArm64 =
    cpuArchitectures.some(a => a.includes('arm64') || a.includes('aarch64')) ||
    // 兜底：Android 模拟器可能返回空，但真机通常 arm64
    (Platform.OS === 'android' && cpuArchitectures.length === 0);

  const tier = classifyTier(totalMemoryGB, isArm64, cpuInfo.sme2, cpuInfo.i8mm);

  return {
    totalMemoryBytes,
    totalMemoryGB,
    cpuArchitectures,
    isArm64,
    hasSme2: cpuInfo.sme2,
    hasI8mm: cpuInfo.i8mm,
    hasDotprod: cpuInfo.dotprod,
    hasFp16: cpuInfo.fp16,
    freeDiskBytes,
    freeDiskGB,
    tier,
    timestamp: Date.now(),
  };
}

/**
 * 根据设备档案推荐最合适的模型。
 *
 * 推荐逻辑（对齐 AGENTS.md §1）：
 * - 入门（<4GB 或非 arm64）→ 仅 0.5B，大模型置灰
 * - 主流（4-8GB arm64）→ 默认 0.5B，1.7B 可选
 * - 高性能（>8GB + SME2/i8mm）→ 推荐 1.7B，标「可启 SME2 加速」
 */
export function recommendModel(profile: DeviceProfile): ModelRecommendation {
  const details: string[] = [];
  let recommendedId: string;
  let reason: string;

  switch (profile.tier) {
    case 'entry': {
      recommendedId = 'qwen2.5-0.5b';
      reason = '适合轻量设备';
      if (!profile.isArm64) {
        details.push('设备非 arm64 架构，仅支持轻量模型');
      }
      if (profile.totalMemoryGB < TIER_RAM_ENTRY_MAX) {
        details.push(`RAM ${profile.totalMemoryGB}GB < ${TIER_RAM_ENTRY_MAX}GB，运行大模型可能 OOM`);
      }
      break;
    }

    case 'mainstream': {
      recommendedId = 'qwen2.5-0.5b';
      reason = '主流配置，默认推荐';
      details.push(`RAM ${profile.totalMemoryGB}GB，arm64 架构`);
      details.push('1.7B 模型可选，但 0.5B 更稳定');
      break;
    }

    case 'high': {
      recommendedId = 'qwen3-1.7b';
      reason = '高性能设备，推荐大模型';
      details.push(`RAM ${profile.totalMemoryGB}GB > ${TIER_RAM_MAINSTREAM_MAX}GB`);
      if (profile.hasSme2) {
        details.push('✓ SME2 加速已就绪，可提升推理速度');
      }
      if (profile.hasI8mm) {
        details.push('✓ i8mm 指令集支持，INT4 推理更快');
      }
      break;
    }
  }

  const model = MODEL_CATALOG.find(m => m.id === recommendedId) ?? MODEL_CATALOG[0];
  const requiredStorageBytes = MODEL_SIZE_ESTIMATE[model.id] ?? 600 * 1024 * 1024;
  const hasEnoughStorage = profile.freeDiskBytes > requiredStorageBytes + MIN_STORAGE_BUFFER;

  if (!hasEnoughStorage) {
    details.push(
      `⚠ 存储不足：需要约 ${Math.ceil(requiredStorageBytes / (1024 * 1024 * 1024) * 10) / 10}GB，` +
      `当前可用 ${profile.freeDiskGB}GB`
    );
  }

  return {
    model,
    reason,
    details,
    hasEnoughStorage,
    requiredStorageBytes,
    tier: profile.tier,
    freeDiskBytes: profile.freeDiskBytes,
    freeDiskGB: profile.freeDiskGB,
  };
}

/**
 * 获取设备档位的中文标签（UI 展示用）。
 */
export function getTierLabel(tier: DeviceTier): string {
  switch (tier) {
    case 'entry':
      return '入门';
    case 'mainstream':
      return '主流';
    case 'high':
      return '高性能';
  }
}

/**
 * 获取设备档位的简短描述（UI 展示用）。
 */
export function getTierDescription(tier: DeviceTier): string {
  switch (tier) {
    case 'entry':
      return '轻量模型，稳定优先';
    case 'mainstream':
      return '平衡性能与体验';
    case 'high':
      return '大模型 + 硬件加速';
  }
}
