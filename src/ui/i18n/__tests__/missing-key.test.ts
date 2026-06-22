/**
 * @file missing-key.test.ts
 * @description t() 缺 key 行为测试：dev 模式 console.warn + 返回 key.path；prod 静默返回 key。
 *   format() 测试覆盖占位符替换与转义。
 *
 * [WHO] jest 套件 `i18n.missing-key` + `i18n.format`
 * [FROM] 依赖 ../t、../en
 * [TO] 被 `npm test` 触发
 * [HERE] src/ui/i18n/__tests__/missing-key.test.ts
 */
import {format, makeT} from '../t';

describe('i18n.missing-key', () => {
  it('dev mode: returns key.path and console.warns', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const t = makeT({existing: 'ok'}, 'zh', true);
    expect(t('does.not.exist')).toBe('does.not.exist');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('does.not.exist');
    expect(warn.mock.calls[0]?.[0]).toContain('zh');
    warn.mockRestore();
  });

  it('prod mode: returns key.path silently (no warn)', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const t = makeT({}, 'en', false);
    expect(t('some.missing.key')).toBe('some.missing.key');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('existing key: returns value without warn', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const t = makeT({hi: 'Hello'}, 'en', true);
    expect(t('hi')).toBe('Hello');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('dev mode with vars: warn still fires on missing key, vars not interpolated', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const t = makeT({}, 'zh', true);
    expect(t('missing.key', {name: 'X'})).toBe('missing.key');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe('i18n.format', () => {
  it('replaces named placeholders', () => {
    expect(format('Hello, {name}!', {name: 'Ada'})).toBe('Hello, Ada!');
  });

  it('coerces non-string values', () => {
    expect(format('{n} pts', {n: 12})).toBe('12 pts');
  });

  it('leaves missing placeholders intact (e.g. {x} when x not in vars)', () => {
    expect(format('Hi {name}, score {n}', {name: 'A'})).toBe('Hi A, score {n}');
  });

  it('escapes literal braces with backslash', () => {
    expect(format('Escaped \\{name}', {})).toBe('Escaped {name}');
  });

  it('does not double-escape', () => {
    expect(format('Plain {a} {b}', {a: '1', b: '2'})).toBe('Plain 1 2');
  });
});