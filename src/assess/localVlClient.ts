/**
 * @file localVlClient.ts
 * @description 端侧 VL 体态评估：调原生 `CatuneMnn.analyzeImage(base64, prompt)`（走已有 C++ analyze 图像路径）。
 *   原生方法未接入时 isLocalVlAvailable()=false，由 service 回退。原生桥见步骤③（待补 analyzeImage RN 方法）。
 *
 * [WHO] 导出 `isLocalVlAvailable`/`localVlAssess`
 * [FROM] 依赖 `react-native`(NativeModules)、./types、./parse
 * [TO] 被 src/assess/service.ts 在 backend=local 且原生可用时调用
 * [HERE] src/assess/localVlClient.ts · 端侧 VL 评估客户端
 */
import {NativeModules} from 'react-native';
import {AssessmentResult} from './types';
import {ASSESS_USER, parseAssessJson} from './parse';

type CatuneMnnVl = {
  analyzeImage?: (imageBase64: string, prompt: string) => Promise<{rawOutput?: string}>;
};
const CatuneMnn = NativeModules.CatuneMnn as CatuneMnnVl | undefined;

export function isLocalVlAvailable(): boolean {
  return Boolean(CatuneMnn?.analyzeImage);
}

export async function localVlAssess(imageBase64: string): Promise<AssessmentResult> {
  if (!CatuneMnn?.analyzeImage) {
    throw new Error('local VL unavailable');
  }
  const res = await CatuneMnn.analyzeImage(imageBase64, ASSESS_USER);
  const text = res?.rawOutput ?? '';
  return {source: 'local', ...parseAssessJson(text), raw: text};
}
