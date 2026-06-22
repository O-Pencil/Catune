/**
 * @file actionTag.test.ts
 * @description 动作标签解析测试：覆盖 zh/en 标签格式、unclosed 碎片、同义词、未识别 fallback。
 *
 * [WHO] jest 套件 `actionTag.l10n`
 * [FROM] 依赖 ../actionTag、../types
 * [TO] 被 `npm test` 触发
 * [HERE] src/posture/__tests__/actionTag.test.ts
 */
import {parseActionTag, actionForPosture, getActionMeta} from '../actionTag';

describe('actionTag.parse', () => {
  it('parses zh `[动作:颈部回缩]` tag', () => {
    const r = parseActionTag('记得收下巴。[动作:颈部回缩]', 'zh');
    expect(r.action).toBe('NECK_RETRACTION');
    expect(r.text).toBe('记得收下巴。');
  });

  it('parses en `[Action:Neck Retraction]` tag', () => {
    const r = parseActionTag('Try this one. [Action:Neck Retraction]', 'en');
    expect(r.action).toBe('NECK_RETRACTION');
    expect(r.text).toBe('Try this one.');
  });

  it('parses en `[Action:Tuck chin]` synonym', () => {
    const r = parseActionTag('Hello meow~ [Action:Tuck chin]', 'en');
    expect(r.action).toBe('NECK_RETRACTION');
    expect(r.text).toBe('Hello meow~');
  });

  it('zh label with en locale: action not resolved, tag still stripped', () => {
    const r = parseActionTag('试试 [动作:颈部回缩]', 'en');
    expect(r.action).toBeNull();
    expect(r.text).toBe('试试');
  });

  it('en label with zh locale: action not resolved, tag still stripped', () => {
    const r = parseActionTag('try [Action:Thoracic Extension]', 'zh');
    expect(r.action).toBeNull();
    expect(r.text).toBe('try');
  });

  it('unclosed `[Action:Neck` fragment is stripped (streaming)', () => {
    const r = parseActionTag('Some prefix [Action:Neck', 'en');
    expect(r.action).toBeNull();
    expect(r.text).toBe('Some prefix');
  });

  it('unclosed `[动作:颈` fragment is stripped (streaming)', () => {
    const r = parseActionTag('一些文字 [动作:颈', 'zh');
    expect(r.action).toBeNull();
    expect(r.text).toBe('一些文字');
  });

  it('unrecognized label yields null but clean text', () => {
    const r = parseActionTag('Hi [Action:Foobar]', 'en');
    expect(r.action).toBeNull();
    expect(r.text).toBe('Hi');
  });

  it('handles English colon `:` and full-width colon `：`', () => {
    expect(parseActionTag('hi [Action:Tuck chin]', 'en').action).toBe('NECK_RETRACTION');
    expect(parseActionTag('hi [Action：Tuck chin]', 'en').action).toBe('NECK_RETRACTION');
    expect(parseActionTag('hi [动作：颈部回缩]', 'zh').action).toBe('NECK_RETRACTION');
  });
});

describe('actionTag.actionForPosture', () => {
  it('maps TECH_NECK → NECK_RETRACTION', () => {
    expect(actionForPosture('TECH_NECK')).toBe('NECK_RETRACTION');
  });
  it('maps SLUMPED → THORACIC_EXTENSION', () => {
    expect(actionForPosture('SLUMPED')).toBe('THORACIC_EXTENSION');
  });
  it('maps NORMAL → HOLD', () => {
    expect(actionForPosture('NORMAL')).toBe('HOLD');
  });
  it('OFFLINE → null', () => {
    expect(actionForPosture('OFFLINE')).toBeNull();
  });
});

describe('actionTag.getActionMeta', () => {
  it('zh label is Chinese via i18n', () => {
    const m = getActionMeta('NECK_RETRACTION', 'zh');
    expect(m.label).toBe('颈部回缩');
    expect(m.node).toBe('c7');
  });
  it('en label is English via i18n', () => {
    const m = getActionMeta('NECK_RETRACTION', 'en');
    expect(m.label).toBe('Neck Retraction');
    expect(m.node).toBe('c7');
  });
});