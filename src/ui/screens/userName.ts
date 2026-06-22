/**
 * @file userName.ts
 * @description 从语义记忆中抽取用户的称呼名字（独立 helper，便于测试）。
 *   memory 文本格式随 locale 不同：
 *     zh: 称呼他「{name}」/ 叫她「{name}」等
 *     en: Call them "{name}"
 *   通用正则抓任意中英引号（「」『』""''）中的内容作为名字。
 *
 * [WHO] 导出 `extractUserName`
 * [FROM] 依赖 ../../platform/memory/types(MemoryItem)
 * [TO] 被 src/ui/screens/DeskScreen.tsx 调用
 * [HERE] src/ui/screens/userName.ts · 用户称呼抽取
 */
import {MemoryItem} from '../../platform/memory/types';

/** 抓 entity type + 'name' tag 的记忆，返回纯名字（中英文都行）；找不到返回 null。 */
export function extractUserName(items: MemoryItem[]): string | null {
  const nameItem = items.find(it => it.type === 'entity' && Array.isArray(it.tags) && it.tags.includes('name'));
  if (!nameItem) {
    return null;
  }
  const text = nameItem.text;
  // 抓任意引号/书名号内的内容（捕获组要求至少 1 字符，避免空引号被匹配）
  const m = text.match(/[「『"']([^」』"']+)[」』"']/);
  const trimmed = m?.[1]?.trim();
  if (trimmed) {
    return trimmed;
  }
  // fallback: 整段 text（去掉前后"称呼/Call them"等修饰）
  const v = text.trim();
  return v || null;
}