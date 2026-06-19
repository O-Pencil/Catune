/**
 * @file service.ts
 * @description 评估服务（后端无关）：按配置分派 端侧VL / 云端 / 预置，统一过安全链，失败回退预置。
 *   纪律（PRD §5.10）：模型输出经禁词链；核心闭环离线可用、云端可降级、现场不依赖网络。
 *
 * [WHO] 导出 `AssessService`/`createAssessService`
 * [FROM] 依赖 ./config、./preset、./cloudClient、./localVlClient、./types、../posture/engine(sanitize)
 * [TO] 被 AssessScreen 调用（拍/选图 → assess）
 * [HERE] src/assess/service.ts · 评估分派服务
 */
import {sanitize} from '../posture/engine';
import {loadAssessConfig} from './config';
import {pickPreset} from './preset';
import {cloudAssess} from './cloudClient';
import {isLocalVlAvailable, localVlAssess} from './localVlClient';
import {AssessmentResult} from './types';

function safety(result: AssessmentResult): AssessmentResult {
  return {
    ...result,
    summary: sanitize(result.summary),
    suggestions: result.suggestions.map(sanitize),
  };
}

export type AssessService = {
  /** 传 base64 图片做评估；无图/失败/无后端时回退预置。 */
  assess: (imageBase64: string | null) => Promise<AssessmentResult>;
};

export function createAssessService(): AssessService {
  return {
    async assess(imageBase64) {
      const cfg = await loadAssessConfig();
      try {
        if (imageBase64) {
          if (cfg.backend === 'cloud' && cfg.cloud.apiKey.trim()) {
            return safety(await cloudAssess(cfg.cloud, imageBase64));
          }
          if (cfg.backend === 'local' && isLocalVlAvailable()) {
            return safety(await localVlAssess(imageBase64));
          }
        }
      } catch {
        // 网络/原生/解析失败 → 落到预置
      }
      return safety(pickPreset());
    },
  };
}
