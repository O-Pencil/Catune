/**
 * @file deviceProfile.ts
 * @description 设备性能探测 + 模型推荐。根据手机 RAM / CPU 架构 / SME2 加速能力 / 可用存储，自动分级并推荐合适的端侧模型。
 *
 * [WHO] 导出 `DeviceProfile` / `DeviceTier` / `ModelRecommendation` / `getDeviceProfile` / `recommendModel`
 * [FROM] 依赖 expo-device（RAM/CPU）、expo-file-system（存储）、NativeModules.CatuneMnn（SME2/CPU 能力检测）
 * [TO] 被 src/design/screens（下载页 / Settings）消费，展示「为你的设备推荐：__，理由：__」
 * [HERE] src/mnn/deviceProfile.ts · 设备自适应模块
 */

import { Platform, NativeModules } from 'react-native';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system/legacy';
import { MODEL_CATALOG, MnnModelDef } from './modelCatalog';
import { tr } from '../design/i18n';

// ─── 类型定义 ────────────────────────────────────────────────────────────────

/** 设备性能档位 */
export type DeviceTier = 'entry' | 'mainstream' | 'high';

/** CatuneMnn 原生模块接口（只取 getStatus 返回的 cpu 部分） */
type CatuneMnnStatus = {
  cpu?: {
    arch?: string;
    sme2Hw?: boolean;
    sme2?: boolean;
    i8mm?: boolean;
    dot?: boolean;
    dotprod?: boolean;
    fp16?: boolean;
  };
};

/** 设备性能快照 */
export interface DeviceProfile {
  /** 当前运行平台；本项目的端侧 MNN 正式路径目前为 Android。 */
  platform: string;
  /** 操作系统版本，如 Android 16。 */
  osVersion: string;
  /** Android API level；非 Android 为 null。 */
  androidApiLevel: number | null;
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
const TIER_RAM_ENTRY_MAX = 6;
const TIER_RAM_HIGH_MIN = 10;
// Android exposes usable physical RAM, so a marketed 12 GB phone is typically
// reported as roughly 11.0-11.2 GiB through /proc/meminfo.
const FLAGSHIP_4B_RAM_MIN = 11;
const ANDROID_MODERN_API = 35;
const GIB = 1024 * 1024 * 1024;

function storageBufferBytes(model: MnnModelDef): number {
  if (model.id === 'qwen3.5-4b') return 2 * GIB;
  if (model.id === 'qwen3.5-2b') return 1.5 * GIB;
  return 1 * GIB;
}

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
      // Android 原生模块使用 sme2Hw / dot；兼容旧桥接曾使用的 sme2 / dotprod。
      sme2: cpu?.sme2Hw ?? cpu?.sme2 ?? false,
      i8mm: cpu?.i8mm ?? false,
      dotprod: cpu?.dot ?? cpu?.dotprod ?? false,
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
  // 非 arm64 或 <6GB → 入门
  if (!isArm64 || totalMemoryGB < TIER_RAM_ENTRY_MAX) {
    return 'entry';
  }
  // >=10GB 且有 SME2/i8mm → 高性能
  if (totalMemoryGB >= TIER_RAM_HIGH_MIN && (hasSme2 || hasI8mm)) {
    return 'high';
  }
  // 其他（6GB+ arm64，或大内存但缺少矩阵指令）→ 主流
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
    platform: Platform.OS,
    osVersion: Device.osVersion ?? 'unknown',
    androidApiLevel: Platform.OS === 'android' ? Device.platformApiLevel ?? null : null,
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
 * - 入门（<6GB、非 arm64 或非 Android）→ Qwen2.5-0.5B，稳定优先
 * - 主流（6-8GB）→ Qwen3.5-0.8B；8GB+ → Qwen3.5-2B
 * - 高性能（>=12GB + SME2 + Android 15+）→ Qwen3.5-4B；否则 Qwen3.5-2B
 * - 存储不足时自动降到仍满足安全余量的较小模型
 *
 * reason/details 按 locale 渲染：locale=en/zh 直接走 tr(locale, key)；
 * locale 省略时走 zh（向后兼容）。
 */
export function recommendModel(profile: DeviceProfile, locale: 'en' | 'zh' = 'zh'): ModelRecommendation {
  const details: string[] = [];
  const isAndroidNative = profile.platform === 'android';
  const isModernAndroid = isAndroidNative && (profile.androidApiLevel ?? 0) >= ANDROID_MODERN_API;
  let preferredIds: string[];
  let reason: string;

  if (!isAndroidNative || !profile.isArm64) {
    preferredIds = ['qwen2.5-0.5b'];
    reason = tr(locale, 'device.recommend.reason.compatible');
    details.push(tr(locale, 'device.recommend.detail.platform', {
      platform: profile.platform,
      version: profile.osVersion,
    }));
  } else switch (profile.tier) {
    case 'entry': {
      preferredIds = ['qwen2.5-0.5b'];
      reason = tr(locale, 'device.recommend.reason.entry');
      if (profile.totalMemoryGB < TIER_RAM_ENTRY_MAX) {
        details.push(
          tr(locale, 'device.recommend.detail.lowRam', {
            ram: profile.totalMemoryGB.toFixed(1),
            threshold: TIER_RAM_ENTRY_MAX.toString(),
          }),
        );
      }
      break;
    }

    case 'mainstream': {
      preferredIds = profile.totalMemoryGB >= 8
        ? ['qwen3.5-2b', 'qwen3.5-0.8b', 'qwen2.5-0.5b']
        : ['qwen3.5-0.8b', 'qwen2.5-0.5b'];
      reason = tr(locale, 'device.recommend.reason.mainstream');
      details.push(
        tr(locale, 'device.recommend.detail.ramArch', {
          ram: profile.totalMemoryGB.toFixed(1),
        }),
      );
      details.push(tr(locale, 'device.recommend.detail.modernBalanced'));
      break;
    }

    case 'high': {
      const canUse4B = profile.totalMemoryGB >= FLAGSHIP_4B_RAM_MIN && profile.hasSme2 && isModernAndroid;
      preferredIds = canUse4B
        ? ['qwen3.5-4b', 'qwen3.5-2b', 'qwen3.5-0.8b', 'qwen2.5-0.5b']
        : ['qwen3.5-2b', 'qwen3.5-0.8b', 'qwen2.5-0.5b'];
      reason = tr(locale, canUse4B ? 'device.recommend.reason.flagship' : 'device.recommend.reason.high');
      details.push(
        tr(locale, 'device.recommend.detail.highRam', {
          ram: profile.totalMemoryGB.toFixed(1),
          threshold: TIER_RAM_HIGH_MIN.toString(),
        }),
      );
      if (profile.hasSme2) {
        details.push(tr(locale, 'device.recommend.detail.sme2'));
      }
      if (profile.hasI8mm) {
        details.push(tr(locale, 'device.recommend.detail.i8mm'));
      }
      break;
    }
  }

  details.unshift(tr(locale, 'device.recommend.detail.os', {
    version: profile.osVersion,
    api: profile.androidApiLevel?.toString() ?? '—',
  }));

  const candidates = preferredIds
    .map(id => MODEL_CATALOG.find(model => model.id === id))
    .filter((model): model is MnnModelDef => Boolean(model));
  const diskKnown = profile.freeDiskBytes > 0;
  const fitsStorage = (candidate: MnnModelDef) =>
    !diskKnown || profile.freeDiskBytes > candidate.estimatedDownloadBytes + storageBufferBytes(candidate);
  const model = candidates.find(fitsStorage) ?? candidates[candidates.length - 1] ?? MODEL_CATALOG[0];
  const requiredStorageBytes = model.estimatedDownloadBytes;
  const hasEnoughStorage = fitsStorage(model);

  if (model.id !== candidates[0]?.id) {
    details.push(tr(locale, 'device.recommend.detail.storageFallback', {name: model.label}));
  }

  if (!hasEnoughStorage) {
    const requiredGb = Math.ceil(requiredStorageBytes / (1024 * 1024 * 1024) * 10) / 10;
    details.push(
      tr(locale, 'device.recommend.detail.storageShort', {
        required: requiredGb.toFixed(1),
        free: profile.freeDiskGB.toFixed(1),
      }),
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
 * 获取设备档位的本地化标签（UI 展示用）。默认 en。
 */
export function getTierLabel(tier: DeviceTier, locale: 'en' | 'zh' = 'en'): string {
  const map: Record<DeviceTier, string> = {
    entry: 'tier.entry',
    mainstream: 'tier.mainstream',
    high: 'tier.high',
  };
  return tr(locale, map[tier]);
}

/**
 * 获取设备档位的简短描述（UI 展示用）。按 locale 走 tr(locale, key)。
 */
export function getTierDescription(tier: DeviceTier, locale: 'en' | 'zh' = 'en'): string {
  const map: Record<DeviceTier, string> = {
    entry: 'device.tier.desc.entry',
    mainstream: 'device.tier.desc.mainstream',
    high: 'device.tier.desc.high',
  };
  return tr(locale, map[tier]);
}
