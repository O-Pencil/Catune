/**
 * @file actionTag.ts
 * @description 解析模型输出尾部的 `[动作:xxx]` / `[Action:xxx]` 标签 → 结构化 PostureAction，并把动作映射到脊柱节点/本地化标签。
 *   让"一份模型输出同时驱动文字 + 视觉"：正文给用户看，动作标签驱动猫点位高亮 / 跟练联动。
 *   规则兜底时也按姿态推导动作，保证无模型也能联动。
 *
 *   【i18n】按 locale 选不同语言的同义词词典：zh 解析 `[动作:颈部回缩]`，en 解析 `[Action:Neck Retraction]`。
 *   标签前缀正则同时接受 `动作` / `Action`（兼容英文 prompt 的输出）。
 *
 * [WHO] 导出 `parseActionTag`、`actionForPosture`、`getActionMeta`
 * [FROM] 依赖 ./types(PostureAction/PostureName/SpineNode)、../ui/i18n(Locale/tr)
 * [TO] 被 engine.ts（setModelAdvice/commit）写入，DeskScreen/TrainingScreen 读 action 驱动高亮/动作 chip
 * [HERE] src/posture/actionTag.ts · 动作标签解析与映射
 */
import {tr, type Locale} from '../ui/i18n';
import {PostureAction, PostureName, SpineNode} from './types';

/** 标签前缀（接受中英文 + 中英冒号），与训练 prompt 中 `[动作:xxx]` / `[Action:xxx]` 兼容。 */
const TAG_RE = /\[(动作|Action)[:：]\s*([^\]]+?)\s*\]/u;

/** 未闭合碎片：`[动作:xxx`（流式中只到一半）需要截掉，避免显示半截标签。 */
const UNCLOSED_TAG_RE = /\s*\[(动作|Action)[:：]?[^\]]*$/u;

/** zh 同义词词典（容错）。仅模型输出解析使用。 */
const ACTION_BY_LABEL_ZH: Record<string, PostureAction> = {
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

/** en 同义词词典（与 zh 平行）。模型在英文 prompt 下可能输出 "Neck Retraction"/"Tuck chin" 等不同表达。 */
const ACTION_BY_LABEL_EN: Record<string, PostureAction> = {
  'Neck Retraction': 'NECK_RETRACTION',
  'Tuck chin': 'NECK_RETRACTION',
  'Chin tuck': 'NECK_RETRACTION',
  'Thoracic Extension': 'THORACIC_EXTENSION',
  'Open chest': 'THORACIC_EXTENSION',
  'Scapular Retraction': 'SCAPULAR_RETRACTION',
  'Shoulder blades down': 'SCAPULAR_RETRACTION',
  'Weight Centering': 'WEIGHT_CENTERING',
  'Center weight': 'WEIGHT_CENTERING',
  'Stand Up': 'STAND_BREAK',
  'Stand up': 'STAND_BREAK',
  'Stand break': 'STAND_BREAK',
  Hold: 'HOLD',
};

const ACTION_BY_LABEL_BY_LOCALE: Record<Locale, Record<string, PostureAction>> = {
  zh: ACTION_BY_LABEL_ZH,
  en: ACTION_BY_LABEL_EN,
};

/** 动作 → 目标脊柱节点（用于点位高亮，null=整体）。节点映射与 locale 无关。 */
const ACTION_NODE: Record<PostureAction, SpineNode | null> = {
  NECK_RETRACTION: 'c7',
  THORACIC_EXTENSION: 't12',
  SCAPULAR_RETRACTION: 't12',
  WEIGHT_CENTERING: 'l5',
  STAND_BREAK: null,
  HOLD: null,
};

/**
 * locale 感知的动作元数据：node 用于点位高亮，label 用于 UI 展示。
 * 旧字段 `ACTION_META` 已废弃，DeskScreen 改用 getActionMeta(action, locale)。
 */
export function getActionMeta(action: PostureAction, locale: 'en' | 'zh' = 'en'): {node: SpineNode | null; label: string} {
  const k = `action.${action}`;
  const label = tr(locale, k);
  return {node: ACTION_NODE[action] ?? null, label: label === k ? action : label};
}

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
 * 从模型输出里抽出 `[动作:xxx]` / `[Action:xxx]` 标签并返回干净正文 + 动作。
 * 兼容中英冒号；按 locale 选不同同义词词典；流式中未闭合的标签碎片也会被截掉，避免显示半截标签。
 *
 * Backward compat：不传 locale 时默认 `en`（旧调用点零改动，但解析 zh 文本会失败 → caller 可显式传 'zh'）。
 */
export function parseActionTag(raw: string, locale: Locale = 'en'): {text: string; action: PostureAction | null} {
  const dict = ACTION_BY_LABEL_BY_LOCALE[locale] ?? ACTION_BY_LABEL_EN;
  let action: PostureAction | null = null;
  let text = raw;
  const full = raw.match(TAG_RE);
  if (full) {
    const label = full[2].trim();
    action = dict[label] ?? null;
    text = raw.replace(full[0], '');
  }
  // 流式中标签可能只到一半，截掉尾部未闭合碎片
  text = text.replace(UNCLOSED_TAG_RE, '');
  return {text: text.trim(), action};
}