/**
 * @file coverage.test.ts
 * @description i18n 键对齐 + 完整性：每条 en.ts 键 zh.ts 必有；每条 zh.ts 键 en.ts 必有；
 *   且每个键都对应非空字符串（不允 null/空）。
 *
 * [WHO] jest 套件 `i18n.coverage` 含 3 个 it
 * [FROM] 依赖 ../en、../zh
 * [TO] 被 `npm test` 触发
 * [HERE] src/ui/i18n/__tests__/coverage.test.ts
 */
import {en} from '../en';
import {zh} from '../zh';

function flatDict(o: Record<string, unknown>, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const k of Object.keys(o)) {
    const v = o[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [sub, val] of flatDict(v as Record<string, unknown>, key)) out.set(sub, val as string);
    } else {
      out.set(key, String(v ?? ''));
    }
  }
  return out;
}

const enFlat = flatDict(en as Record<string, unknown>);
const zhFlat = flatDict(zh as Record<string, unknown>);

describe('i18n.coverage', () => {
  it('benchmark.promptDefault exists in both locales and differs', () => {
    const enVal = en['benchmark.promptDefault'] as string;
    const zhVal = zh['benchmark.promptDefault'] as string;
    expect(enVal).toBeTruthy();
    expect(zhVal).toBeTruthy();
    expect(enVal).not.toBe(zhVal);
    // zh 保留原指令关键词
    expect(zhVal).toContain('医疗诊断');
    // en 是纯英文（无 CJK）
    expect(enVal).not.toMatch(/[一-鿿]/);
  });

  it('en 和 zh 键数量完全一致', () => {
    expect(zhFlat.size).toBe(enFlat.size);
  });

  it('en 的每个键 zh 都有', () => {
    const missing: string[] = [];
    for (const k of enFlat.keys()) if (!zhFlat.has(k)) missing.push(k);
    expect(missing).toEqual([]);
  });

  it('zh 的每个键 en 都有', () => {
    const extra: string[] = [];
    for (const k of zhFlat.keys()) if (!enFlat.has(k)) extra.push(k);
    expect(extra).toEqual([]);
  });

  it('每个翻译值都是非空字符串', () => {
    const empty: string[] = [];
    for (const [k, v] of enFlat) if (!v.trim()) empty.push(`en:${k}`);
    for (const [k, v] of zhFlat) if (!v.trim()) empty.push(`zh:${k}`);
    expect(empty).toEqual([]);
  });
});