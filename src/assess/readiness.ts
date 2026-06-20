/**
 * @file readiness.ts
 * @description 评估后端「就绪检测 + 设备推荐」：决定当前所选后端能否真跑，以及按设备性能推荐 端侧VL / 云端。
 *   端侧 VL 需原生 analyzeImage 就绪 + 活跃模型是视觉模型；云端需填 Key；预置永远可用。
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

export type AssessReadiness = {
  backend: AssessBackend;
  /** 所选后端当前是否能真跑（false 时上层引导去设置）。 */
  ready: boolean;
  /** 未就绪时的简短原因。 */
  hint?: string;
  /** 按设备性能推荐的后端：'local' | 'cloud'。 */
  recommend: AssessBackend;
  recommendReason: string;
};

async function deviceRecommendation(): Promise<{recommend: AssessBackend; recommendReason: string}> {
  try {
    const p = await getDeviceProfile();
    if (p.tier === 'high') {
      return {recommend: 'local', recommendReason: `设备较强（${p.totalMemoryGB}GB），推荐端侧 VL，更私密、离线`};
    }
    if (p.tier === 'mainstream' && p.totalMemoryGB >= 8) {
      return {recommend: 'local', recommendReason: '设备主流，可试端侧 VL；吃力就切云端'};
    }
    return {recommend: 'cloud', recommendReason: `设备性能有限（${p.totalMemoryGB}GB），端侧 VL 体积大易卡/OOM，推荐云端`};
  } catch {
    return {recommend: 'cloud', recommendReason: '无法读取设备信息，默认推荐云端'};
  }
}

export async function checkAssessReadiness(config: AssessConfig): Promise<AssessReadiness> {
  const {recommend, recommendReason} = await deviceRecommendation();
  const base = {recommend, recommendReason};

  if (config.backend === 'preset') {
    return {backend: 'preset', ready: true, ...base};
  }

  if (config.backend === 'cloud') {
    const ready = config.cloud.apiKey.trim().length > 0;
    return {backend: 'cloud', ready, hint: ready ? undefined : '云端未填 API Key', ...base};
  }

  // local（端侧 VL）
  if (!isLocalVlAvailable()) {
    return {backend: 'local', ready: false, hint: '端侧 VL 原生未就绪（需带 MNN 的安卓构建）', ...base};
  }
  try {
    const st = await CatuneMnn?.getStatus?.();
    const active = st?.activeModelId ? getModelById(st.activeModelId) : undefined;
    if (!active?.vision) {
      return {backend: 'local', ready: false, hint: '当前活跃模型不是视觉(VL)模型，请在模型管理下载并启用', ...base};
    }
    return {backend: 'local', ready: true, ...base};
  } catch {
    return {backend: 'local', ready: false, hint: '端侧模型状态读取失败', ...base};
  }
}
