/**
 * @file actionTag.ts
 * @description 解析模型输出尾部的 `[动作:xxx]` 标签 → 结构化 PostureAction，并把动作映射到脊柱节点/中文标签。
 *   让“一份模型输出同时驱动文字 + 视觉”：正文给用户看，动作标签驱动猫点位高亮 / 跟练联动。
 *   规则兜底时也按姿态推导动作，保证无模型也能联动。
 *
 * [WHO] 导出 `parseActionTag`、`actionForPosture`、`ACTION_META`
 * [FROM] 依赖 ./types(PostureAction/PostureName/SpineNode)
 * [TO] 被 engine.ts（setModelAdvice/commit）写入，DeskScreen 读 action 驱动高亮/动作 chip
 * [HERE] src/posture/actionTag.ts · 动作标签解析与映射
 */
import {PostureAction, PostureName, SpineNode} from './types';

/** 中文标签 → 动作枚举（容错同义词）。 */
const ACTION_BY_LABEL: Record<string, PostureAction> = {
  颈部回缩: 'NECK_RETRACTION',
  收下巴: 'NECK_RETRACTION',
  胸椎伸展: 'THORACIC_EXTENSION',
  挺胸: 'THORACIC_EXTENSION',
  肩胛收紧: 'SCAPULAR_RETRACTION',
  重心摆正: 'WEIGHT_CENTERING',
  坐正: 'WEIGHT_CENTERING',
  起身活动: 'STAND_BREAK',
  起身: 'STAND_BREAK',
  保持: 'HOLD',
};

/** 动作 → 目标脊柱节点（用于点位高亮，null=整体）+ 中文标签。 */
export const ACTION_META: Record<PostureAction, {node: SpineNode | null; label: string}> = {
  NECK_RETRACTION: {node: 'c7', label: '颈部回缩'},
  THORACIC_EXTENSION: {node: 't12', label: '胸椎伸展'},
  SCAPULAR_RETRACTION: {node: 't12', label: '肩胛收紧'},
  WEIGHT_CENTERING: {node: 'l5', label: '重心摆正'},
  STAND_BREAK: {node: null, label: '起身活动'},
  HOLD: {node: null, label: '保持'},
};

/** 规则兜底：按姿态推导默认动作（无模型标签时也能驱动高亮）。 */
export function actionForPosture(posture: PostureName): PostureAction | null {
  switch (posture) {
    case 'TECH_NECK':
      return 'NECK_RETRACTION';
    case 'SLUMPED':
      return 'THORACIC_EXTENSION';
    case 'LEFT_LEAN':
      return 'WEIGHT_CENTERING';
    case 'NORMAL':
      return 'HOLD';
    default:
      return null;
  }
}

/**
 * 从模型输出里抽出 `[动作:xxx]` 标签并返回干净正文 + 动作。
 * 兼容中英冒号；流式中未闭合的标签碎片（如 `[动作:颈`）也会被截掉，避免显示半截标签。
 */
export function parseActionTag(raw: string): {text: string; action: PostureAction | null} {
  let action: PostureAction | null = null;
  let text = raw;
  const full = raw.match(/\[动作[:：]\s*([^\]]+?)\s*\]/);
  if (full) {
    action = ACTION_BY_LABEL[full[1].trim()] ?? null;
    text = raw.replace(full[0], '');
  }
  // 流式中标签可能只到一半，截掉尾部未闭合碎片
  text = text.replace(/\s*\[动作[:：]?[^\]]*$/u, '');
  return {text: text.trim(), action};
}
