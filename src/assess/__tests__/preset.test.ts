/**
 * @file preset.test.ts
 * @description 预置评估多语测试：保证 zh 保留原 preset 文案，en 是平行英文翻译，
 *   解析层 parseAssessJson 的 fallback summary 按 locale 切换。
 *
 * [WHO] jest 套件 `assess.preset` + `assess.parse`
 * [FROM] 依赖 ../preset、../parse
 * [TO] 被 `npm test` 触发
 * [HERE] src/assess/__tests__/preset.test.ts
 */
import {getPresetResults, pickPreset, PRESET_RESULTS} from '../preset';
import {parseAssessJson, buildAssessSystem, buildAssessUser} from '../parse';

describe('assess.preset.l10n', () => {
  it('zh 预置列表与原 PRESET_RESULTS 一致（向后兼容）', () => {
    const zh = getPresetResults('zh');
    expect(zh).toBe(PRESET_RESULTS);
    expect(zh[0].summary).toContain('头略前倾');
    expect(zh[0].observations[0].label).toBe('头前倾');
  });

  it('zh 预置所有 summary/label/suggestion 含中文', () => {
    for (const r of getPresetResults('zh')) {
      expect(r.summary).toMatch(/[一-鿿]/);
      for (const o of r.observations) {
        expect(o.label).toMatch(/[一-鿿]/);
      }
      for (const s of r.suggestions) {
        expect(s).toMatch(/[一-鿿]/);
      }
    }
  });

  it('en 预置所有 summary/label/suggestion 全英文（无中文）', () => {
    for (const r of getPresetResults('en')) {
      expect(r.summary).not.toMatch(/[一-鿿]/);
      for (const o of r.observations) {
        expect(o.label).not.toMatch(/[一-鿿]/);
      }
      for (const s of r.suggestions) {
        expect(s).not.toMatch(/[一-鿿]/);
      }
    }
  });

  it('en 预置 label 使用英文专业术语（Head Forward / Rounded Shoulders / Pelvis）', () => {
    const en = getPresetResults('en');
    const allLabels = en.flatMap(r => r.observations.map(o => o.label));
    expect(allLabels).toContain('Head Forward');
    expect(allLabels).toContain('Rounded Shoulders');
    expect(allLabels).toContain('Pelvis');
  });

  it('en 预置与 zh 预置数量一致、source 都是 preset', () => {
    expect(getPresetResults('en')).toHaveLength(getPresetResults('zh').length);
    for (const r of getPresetResults('en')) {
      expect(r.source).toBe('preset');
    }
  });

  it('pickPreset 默认 locale=en 时返回 en 内容', () => {
    const r = pickPreset('en', 12345);
    expect(r.source).toBe('preset');
    expect(r.summary).not.toMatch(/[一-鿿]/);
  });

  it('pickPreset 显式 locale=zh 时返回 zh 内容', () => {
    const r = pickPreset('zh', 12345);
    expect(r.summary).toMatch(/[一-鿿]/);
  });

  it('pickPreset 不传 locale 时默认 en（与 App.tsx 初始 locale 对齐）', () => {
    const r = pickPreset(undefined, 12345);
    expect(r.summary).not.toMatch(/[一-鿿]/);
  });

  it('pickPreset 相同 seed 在不同 locale 下选到的索引一致（轮换策略不变）', () => {
    const seed = 99999;
    const enIdx = getPresetResults('en').indexOf(pickPreset('en', seed));
    const zhIdx = getPresetResults('zh').indexOf(pickPreset('zh', seed));
    expect(enIdx).toBe(zhIdx);
  });
});

describe('assess.parse.l10n', () => {
  it('buildAssessSystem zh 保留原文', () => {
    expect(buildAssessSystem('zh')).toContain('你是专业体态评估师');
  });

  it('buildAssessSystem en 是英文、无中文', () => {
    expect(buildAssessSystem('en')).not.toMatch(/[一-鿿]/);
    expect(buildAssessSystem('en')).toMatch(/posture assessor/i);
  });

  it('buildAssessUser zh 含中文字段示例', () => {
    expect(buildAssessUser('zh')).toContain('头前倾');
    expect(buildAssessUser('zh')).toContain('只输出 JSON');
  });

  it('buildAssessUser en 是英文 JSON 模板', () => {
    expect(buildAssessUser('en')).not.toMatch(/[一-鿿]/);
    expect(buildAssessUser('en')).toContain('Head Forward');
    expect(buildAssessUser('en')).toContain('Output JSON only');
  });

  it('parseAssessJson zh 无效 summary 时回退中文', () => {
    const r = parseAssessJson('not json', 'zh');
    expect(r.summary).toBe('已完成体态评估');
  });

  it('parseAssessJson en 无效 summary 时回退英文', () => {
    const r = parseAssessJson('not json', 'en');
    expect(r.summary).toBe('Assessment complete');
    expect(r.summary).not.toMatch(/[一-鿿]/);
  });

  it('parseAssessJson 有效 JSON 时 summary 保留', () => {
    const text = '{"summary":"Head tilted forward","observations":[{"label":"Head Forward","value":"~20°","severity":"mild"}],"suggestions":["Try X"]}';
    const r = parseAssessJson(text, 'en');
    expect(r.summary).toBe('Head tilted forward');
    expect(r.observations[0].label).toBe('Head Forward');
  });

  it('parseAssessJson 从夹带文本里抠 JSON', () => {
    const text = 'Some prefix {"summary":"x","observations":[],"suggestions":[]} suffix';
    const r = parseAssessJson(text, 'en');
    expect(r.summary).toBe('x');
  });
});