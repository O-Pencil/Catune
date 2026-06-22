/**
 * @file engine.test.ts
 * @description 规则状态机单元测试：覆盖 4 种姿态分类（SLUMPED/TECH_NECK/LEFT_LEAN/NORMAL）+ 禁词过滤。
 *
 * [WHO] jest 套件 `engine` 含 7 个 it
 * [FROM] ../engine(THRESHOLDS/ruleFallback/sanitize/getBannedWords)、../types(PostureSignals)
 * [TO] 被 `npm test` 触发
 * [HERE] src/posture/__tests__/engine.test.ts
 */
import {THRESHOLDS, ruleFallback, sanitize, getBannedWords, createPostureEngine} from '../engine';
import type {PostureSignals} from '../types';

const sig = (overrides: Partial<PostureSignals> = {}): PostureSignals => ({
  neckPitchDeg: 0,
  thorPitchDeg: 0,
  lumbarRollDeg: 0,
  durationMin: 0,
  lastState: 'NORMAL',
  windowMs: 5000,
  ...overrides,
});

describe('engine.thresholds', () => {
  it('exposes PRD-aligned 3-node thresholds', () => {
    expect(THRESHOLDS.thorSlumpDeg).toBe(15);
    expect(THRESHOLDS.neckTechDeg).toBe(20);
    expect(THRESHOLDS.lumbarLeanDeg).toBe(-10);
  });
});

describe('engine.classification', () => {
  it('SLUMPED when thor > 15°', () => {
    const r = ruleFallback(sig({thorPitchDeg: 18}), 'en');
    expect(r.advice).toBeTruthy();
  });

  it('TECH_NECK when neck > 20° (and thor ok)', () => {
    const r = ruleFallback(sig({neckPitchDeg: 25}), 'en');
    expect(r.advice).toBeTruthy();
  });

  it('LEFT_LEAN when lumbar < -10° (and thor/neck ok)', () => {
    const r = ruleFallback(sig({lumbarRollDeg: -15}), 'en');
    expect(r.advice).toBeTruthy();
  });

  it('NORMAL when all nodes within thresholds', () => {
    const r = ruleFallback(sig(), 'en');
    expect(r.advice).toBeTruthy();
  });
});

describe('engine.banned-words', () => {
  it('zh banned list includes 确诊 / 治疗 / 100%', () => {
    const words = getBannedWords('zh');
    expect(words).toContain('确诊');
    expect(words).toContain('治疗');
    expect(words).toContain('100%');
  });

  it('en banned list includes cure / guarantee / 100%', () => {
    const words = getBannedWords('en');
    expect(words).toContain('cure');
    expect(words).toContain('guarantee');
    expect(words).toContain('100%');
  });

  it('sanitize replaces zh text containing banned word', () => {
    const out = sanitize('确诊为驼背综合征', 'zh');
    expect(out).not.toContain('确诊');
  });

  it('sanitize replaces en text containing banned word', () => {
    const out = sanitize('This is a cure for slouching', 'en');
    expect(out).not.toContain('cure');
  });
});

describe('engine.locale-emits', () => {
  it('initial state postureLabel reflects current locale (no hardcoded English)', () => {
    const enEngine = createPostureEngine({getLocale: () => 'en'});
    const zhEngine = createPostureEngine({getLocale: () => 'zh'});
    expect(enEngine.getState().postureLabel).toBe('Normal');
    expect(zhEngine.getState().postureLabel).toBe('正常');
  });

  it('setLocale triggers immediate emit with new locale label (not waiting for next update)', () => {
    let current: 'en' | 'zh' = 'en';
    const engine = createPostureEngine({getLocale: () => current});
    const seen: string[] = [];
    engine.subscribe(s => seen.push(s.postureLabel));
    // 订阅时立刻收到 en label
    expect(seen[0]).toBe('Normal');
    current = 'zh';
    engine.setLocale('zh');
    // setLocale 后立刻收到 zh label（不等 update）
    expect(seen[seen.length - 1]).toBe('正常');
  });

  it('setLocale re-renders RULE_FALLBACK advice to new locale', () => {
    let current: 'en' | 'zh' = 'en';
    const engine = createPostureEngine({getLocale: () => current});
    // 触发一次 SLUMPED 走规则
    engine.update(0, 20, 0); // thor > 15
    expect(engine.getState().inferenceSource).toBe('RULE_FALLBACK');
    expect(engine.getState().posture).toBe('SLUMPED');
    const enAdvice = engine.getState().advice;
    current = 'zh';
    engine.setLocale('zh');
    const zhAdvice = engine.getState().advice;
    expect(zhAdvice).not.toBe(enAdvice);
    // zh advice 含中文动作关键词
    expect(zhAdvice).toMatch(/[一-鿿]/);
  });

  it('setLocale does not clobber MODEL advice (粘性 preserved)', () => {
    let current: 'en' | 'zh' = 'en';
    const engine = createPostureEngine({getLocale: () => current});
    // 先 SET model advice
    engine.setModelAdvice('Hello from model [Action:Neck Retraction]', {streaming: false});
    expect(engine.getState().inferenceSource).toBe('MODEL');
    expect(engine.getState().advice).toContain('Hello from model');
    // 切 locale
    engine.setLocale('zh');
    // model advice 不应被重算覆盖
    expect(engine.getState().inferenceSource).toBe('MODEL');
    expect(engine.getState().advice).toContain('Hello from model');
  });
});
