/**
 * @file nativeDebugClient.ts
 * @description CatuneMnn 原生调试模块的 TS 边界。UI 只调用这里，不直接触达 NativeModules。
 *
 * [WHO] 导出 `isCatuneMnnAvailable` / `getMnnStatus` / `inferMnnText` / `runMnnBenchmark` / `releaseMnnModel`
 * [FROM] 依赖 `react-native` NativeModules
 * [TO] 被 `src/design` 的模型管理和基准测试 UI 调用
 * [HERE] src/mnn/nativeDebugClient.ts · CatuneMnn 原生模块边界
 */
import {NativeModules} from 'react-native';

export type MnnMetrics = {
  ttftMs?: number;
  prefillMs?: number;
  decodeMs?: number;
  tokensGenerated?: number;
  decodeTps?: number;
  backend?: string;
};

export type MnnCpuInfo = {
  sme2Hw?: boolean;
  libSme2?: boolean;
  i8mm?: boolean;
  dot?: boolean;
  fp16?: boolean;
  backend?: string;
  readiness?: string;
};

export type MnnStatus = {
  nativeLibLoaded?: boolean;
  modelLoaded?: boolean;
  modelDir?: string;
  activeModelId?: string;
  configExists?: boolean;
  loadError?: string | null;
  cpu?: MnnCpuInfo;
};

export type MnnInferResult = {rawOutput?: string; inferenceMs?: number; metrics?: MnnMetrics};
export type MnnBenchRun = {run?: number; label?: string; inferenceMs?: number; metrics?: MnnMetrics; rawOutput?: string};
export type MnnBenchResult = {
  runs?: MnnBenchRun[];
  summary?: {avgDecodeTps?: number; backend?: string; readiness?: string; sme2Hw?: boolean; libSme2?: boolean};
};

type CatuneMnnModule = {
  getStatus?: () => Promise<MnnStatus>;
  inferText?: (prompt: string) => Promise<MnnInferResult>;
  runBenchmark?: (prompt: string) => Promise<MnnBenchResult>;
  releaseModel?: () => Promise<boolean>;
};

const CatuneMnn = NativeModules.CatuneMnn as CatuneMnnModule | undefined;

export function isCatuneMnnAvailable(): boolean {
  return Boolean(CatuneMnn);
}

export async function getMnnStatus(): Promise<MnnStatus> {
  if (!CatuneMnn?.getStatus) {
    return {};
  }
  return CatuneMnn.getStatus();
}

export async function inferMnnText(prompt: string): Promise<MnnInferResult> {
  if (!CatuneMnn?.inferText) {
    throw new Error('CatuneMnn unavailable');
  }
  return CatuneMnn.inferText(prompt);
}

export async function runMnnBenchmark(prompt: string): Promise<MnnBenchResult> {
  if (!CatuneMnn?.runBenchmark) {
    throw new Error('CatuneMnn unavailable');
  }
  return CatuneMnn.runBenchmark(prompt);
}

export async function releaseMnnModel(): Promise<void> {
  try {
    await CatuneMnn?.releaseModel?.();
  } catch {
    // Native release is best effort; callers can refresh status separately.
  }
}
