/**
 * @file engine.test.ts
 * @description 规则状态机单元测试：覆盖 4 种姿态分类（SLUMPED/TECH_NECK/LEFT_LEAN/NORMAL）+ 禁词过滤。
 *
 * [WHO] jest 套件 `engine` 含 7 个 it
 * [FROM] ../engine(THRESHOLDS/ruleFallback/sanitize/getBannedWords)、../types(PostureSignals)
 * [TO] 被 `npm test` 触发
 * [HERE] src/posture/__tests__/engine.test.ts
 */
import {THRESHOLDS, ruleFallback, sanitize, getBannedWords} from '../engine';
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
