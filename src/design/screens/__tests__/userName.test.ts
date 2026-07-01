/**
 * @file userName.test.ts
 * @description extractUserName 测试：覆盖 zh/en 模板、无 name 记忆、跨 type/无 tag、兜底。
 *
 * [WHO] jest 套件 `userName.extract`
 * [FROM] 依赖 ../userName、../../../platform/memory/types(MemoryItem)
 * [TO] 被 `npm test` 触发
 * [HERE] src/design/screens/__tests__/userName.test.ts
 */
import {extractUserName} from '../userName';
import {MemoryItem} from '../../../platform/memory/types';

const item = (overrides: Partial<MemoryItem>): MemoryItem => ({
  id: overrides.id ?? 'x',
  type: overrides.type ?? 'entity',
  text: overrides.text ?? '',
  tags: overrides.tags ?? ['name'],
  importance: overrides.importance ?? 0.5,
  createdAt: 0,
  lastUsedAt: 0,
  uses: 0,
  source: overrides.source ?? 'onboarding',
});

describe('userName.extract', () => {
  it('extracts name from zh 称呼他「{name}」template', () => {
    const items = [item({text: '称呼他「小雨」'})];
    expect(extractUserName(items)).toBe('小雨');
  });

  it('extracts name from en Call them "{name}" template', () => {
    const items = [item({text: 'Call them "Xiao Yu"'})];
    expect(extractUserName(items)).toBe('Xiao Yu');
  });

  it('returns null when no entity+name item exists', () => {
    expect(extractUserName([])).toBeNull();
    // type 不是 entity
    expect(extractUserName([item({type: 'preference', text: 'prefer X'})])).toBeNull();
    // 没 name tag
    expect(extractUserName([item({type: 'entity', tags: ['other']})])).toBeNull();
    // tags 为空数组
    expect(extractUserName([item({type: 'entity', tags: []})])).toBeNull();
  });

  it('ignores non-name entity items (e.g. 称呼 tag)', () => {
    const items = [item({type: 'entity', tags: ['其他'], text: '「无关」'})];
    expect(extractUserName(items)).toBeNull();
  });

  it('returns first match when multiple name entries (defensive)', () => {
    const items = [
      item({id: '1', text: '称呼他「第一」'}),
      item({id: '2', text: 'Call them "second"'}),
    ];
    expect(extractUserName(items)).toBe('第一');
  });

  it('falls back to trimmed text when no quotes found', () => {
    const items = [item({text: 'XiaoYu'})];
    expect(extractUserName(items)).toBe('XiaoYu');
  });

  it('handles English double quotes and CJK quotes', () => {
    expect(extractUserName([item({text: '叫她「Alice」'})])).toBe('Alice');
    expect(extractUserName([item({text: "Call them 'Bob'"})])).toBe('Bob');
    expect(extractUserName([item({text: '称『小王』'})])).toBe('小王');
  });

  it('returns null for empty / whitespace text', () => {
    expect(extractUserName([item({text: ''})])).toBeNull();
    expect(extractUserName([item({text: '   '})])).toBeNull();
  });
});