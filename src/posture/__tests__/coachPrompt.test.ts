/**
 * @file coachPrompt.test.ts
 * @description 教练 prompt 多语测试：保证 zh 版本与训练数据同格式，en 版本是平行英文翻译。
 *   - zh：包含「你是温和的坐姿教练」+「姿态：…」+「已持续N分钟。」+ 含 enum 标签 (TECH_NECK 等)
 *   - en：包含英文关键词（gentle/posture coach）+ "Posture:" + "has persisted N minutes." + [Action:...] 占位说明
 *
 * [WHO] jest 套件 `coachPrompt.l10n`
 * [FROM] 依赖 ../coachPrompt、../types
 * [TO] 被 `npm test` 触发
 * [HERE] src/posture/__tests__/coachPrompt.test.ts
 */
import {buildCoachPrompt, buildSignalLine, COACH_INSTRUCTION} from '../coachPrompt';
import type {DashboardState} from '../types';

const state = (overrides: Partial<DashboardState> = {}): DashboardState => ({
  neckPitch: 22,
  thorPitch: 18,
  lumbarRoll: -12,
  posture: 'TECH_NECK',
  postureLabel: 'Tech Neck',
  score: 60,
  abnormalDurationMinutes: 3,
  advice: '',
  inferenceSource: 'RULE_FALLBACK',
  streaming: false,
  action: null,
  ...overrides,
});

describe('coachPrompt.l10n', () => {
  it('zh version keeps training-aligned instruction verbatim', () => {
    expect(COACH_INSTRUCTION).toContain('你是温和的坐姿教练');
    expect(COACH_INSTRUCTION).toContain('[动作:xxx]');
    const prompt = buildCoachPrompt(state(), '已知用户：偏好鼓励式提醒。', 'zh');
    expect(prompt).toContain('你是温和的坐姿教练');
    expect(prompt).toContain('已知用户：偏好鼓励式提醒。');
    expect(prompt).toContain('姿态：头前倾（TECH_NECK）；颈前倾约22°');
    expect(prompt).toContain('已持续3分钟。');
  });

  it('en version is fully English (no CJK in instruction or signal)', () => {
    const prompt = buildCoachPrompt(state(), '', 'en');
    // 头部不应出现中文（PostureName enum tag TECH_NECK 是英文，保持）
    const headLine = prompt.split('\n')[0] ?? '';
    expect(headLine).not.toMatch(/[一-鿿]/);
    expect(prompt).toMatch(/gentle posture coach/i);
    expect(prompt).toMatch(/\[Action:xxx\]/);
    expect(prompt).toMatch(/Posture: Head Forward \(TECH_NECK\); neck pitch ~22°/);
    expect(prompt).toMatch(/has persisted 3 minutes\./);
  });

  it('buildSignalLine uses zh 「姿态：」prefix in zh, "Posture:" in en', () => {
    const zh = buildSignalLine(state(), 'zh');
    const en = buildSignalLine(state(), 'en');
    expect(zh.startsWith('姿态：')).toBe(true);
    expect(en.startsWith('Posture:')).toBe(true);
  });

  it('defaults locale to en when omitted (backward compat)', () => {
    const prompt = buildCoachPrompt(state());
    expect(prompt).toMatch(/Posture:/);
    expect(prompt).not.toContain('姿态：');
  });

  it('en OFFLINE posture still renders a body (not enum-only)', () => {
    const s = state({posture: 'OFFLINE', lumbarRoll: 0, thorPitch: 0, neckPitch: 0});
    const en = buildSignalLine(s, 'en');
    expect(en).toContain('Disconnected (OFFLINE)');
    const zh = buildSignalLine(s, 'zh');
    expect(zh).toContain('未连接（OFFLINE）');
  });

  it('abnormalDurationMinutes < 1 floors to 1 minute', () => {
    const s = state({abnormalDurationMinutes: 0.2});
    expect(buildSignalLine(s, 'zh')).toContain('已持续1分钟。');
    expect(buildSignalLine(s, 'en')).toContain('has persisted 1 minutes.');
  });
});