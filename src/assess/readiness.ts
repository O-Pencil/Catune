/**
 * @file readiness.ts
 * @description 评估后端「就绪检测 + 设备推荐」：决定当前所选后端能否真跑，以及按设备性能推荐 端侧VL / 云端。
 *   端侧 VL 需原生 analyzeImage 就绪 + 活跃模型是视觉模型；云端需填 Key；预置永远可用。
 *
 *   UI 字符串以 i18n key 返回（`recKey` / `hintKey`），消费方在调用时按当前 locale 翻译。
 *   这是为了与 i18n 解耦：readiness 纯逻辑，不依赖任何 React/UI。
 *
 * [WHO] 导出 `AssessReadiness`、`checkAssessReadiness`
 * [FROM] 依赖 `react-native`(NativeModules)、./types、./localVlClient、../mnn/modelCatalog、../mnn/deviceProfile
 * [TO] 被 AssessScreen（就绪门 + 引导）与 Settings 评估模型卡（推荐）消费
 * [HERE] src/assess/readiness.ts · 评估就绪与设备推荐
 */
import {NativeModules} from 'react-native';
import {AssessBackend, AssessConfig} from './types';
import {isLocalVlAvailable} from './localVlClient';
import {getModelById} from '../mnn/modelCatalog';
import {getDeviceProfile} from '../mnn/deviceProfile';

type CatuneMnnStatus = {getStatus?: () => Promise<{activeModelId?: string; modelLoaded?: boolean}>};
const CatuneMnn = NativeModules.CatuneMnn as CatuneMnnStatus | undefined;

/** 推荐的 i18n key。UI 用 tr(locale, key) 翻译。 */
export type ReadinessHintKey =
  | 'assess.recHigh'
  | 'assess.recMid'
  | 'assess.recLow'
  | 'assess.recFallback'
  | 'assess.cloudHint'
  | 'assess.cloudNotReady'
  | 'assess.localUnavailable'
  | 'assess.localNeedModel';

export type AssessReadiness = {
  backend: AssessBackend;
  /** 所选后端当前是否能真跑（false 时上层引导去设置）。 */
  ready: boolean;
  /** 未就绪时的简短原因（i18n key）。 */
  hintKey?: ReadinessHintKey;
  /** 按设备性能推荐的后端：'local' | 'cloud'。 */
  recommend: AssessBackend;
  /** 推荐原因 i18n key。 */
  recommendKey: ReadinessHintKey;
};

async function deviceRecommendation(): Promise<{recommend: AssessBackend; recommendKey: ReadinessHintKey}> {
  try {
    const p = await getDeviceProfile();
    if (p.tier === 'high') {
      return {recommend: 'local', recommendKey: 'assess.recHigh'};
    }
    if (p.tier === 'mainstream' && p.totalMemoryGB >= 8) {
      return {recommend: 'local', recommendKey: 'assess.recMid'};
    }
    return {recommend: 'cloud', recommendKey: 'assess.recLow'};
  } catch {
    return {recommend: 'cloud', recommendKey: 'assess.recFallback'};
  }
}

export async function checkAssessReadiness(config: AssessConfig): Promise<AssessReadiness> {
  const {recommend, recommendKey} = await deviceRecommendation();
  const base = {recommend, recommendKey};

  if (config.backend === 'preset') {
    return {backend: 'preset', ready: true, ...base};
  }

  if (config.backend === 'cloud') {
    const ready = config.cloud.apiKey.trim().length > 0;
    return {backend: 'cloud', ready, hintKey: ready ? undefined : 'assess.cloudNotReady', ...base};
  }

  // local（手机本地）
  if (!isLocalVlAvailable()) {
    return {backend: 'local', ready: false, hintKey: 'assess.localUnavailable', ...base};
  }
  try {
    const st = await CatuneMnn?.getStatus?.();
    const active = st?.activeModelId ? getModelById(st.activeModelId) : undefined;
    if (!active?.vision) {
      return {backend: 'local', ready: false, hintKey: 'assess.localNeedModel', ...base};
    }
    return {backend: 'local', ready: true, ...base};
  } catch {
    return {backend: 'local', ready: false, hintKey: 'assess.localUnavailable', ...base};
  }
}
