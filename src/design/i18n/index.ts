/**
 * @file index.ts
 * @description i18n 桶文件 + 完整双语能力说明。
 *   支持 zh / en 双语，UI + prompt + 模型输出解析全链路 locale-aware。
 *
 *   【i18n 矩阵（locale 切换时哪些路径会跟着变）】
 *   ┌──────────────────────────────┬────────────────────────────────────────┐
 *   │ 路径                         │ 行为                                    │
 *   ├──────────────────────────────┼────────────────────────────────────────┤
 *   │ UI 文本（useT）              │ 字典查表 + format；缺 key dev warn      │
 *   │ engine postureLabel / advice │ setLocale() 立即 emit 新 locale         │
 *   │ App 初始 state               │ buildInitialState(locale) 走 tr(common) │
 *   │ coachPrompt / buildSignalLine│ 接 locale 切指令+姿态标签（zh 一字不差）│
 *   │ adviceOrchestrator           │ opts.getLocale → prompt 用 locale       │
 *   │ actionTag.parseActionTag     │ 按 locale 选 zh/en 同义词词典；         │
 *   │                              │ TAG_RE 接受 [动作:xxx]/[Action:xxx]     │
 *   │ assess parse / cloud / local │ buildAssessSystem(locale)+              │
 *   │                              │ buildAssessUser(locale) + parseAssessJson│
 *   │                              │ (text, locale) fallback summary 按 locale │
 *   │ assess preset                │ getPresetResults(locale) + pickPreset    │
 *   │ deviceProfile.recommendModel │ (profile, locale) reason/details 走 tr  │
 *   │ BenchmarkScreen              │ DEFAULT_PROMPT 按 locale 切；            │
 *   │                              │ PREVIEW_STATUS 字段按 locale 渲染        │
 *   │ DeskScreen greeting name     │ 从 memory 抽 entity 名字；无则          │
 *   │                              │ tr('desk.fallbackName') = friend/朋友   │
 *   │ mnn/                         │ modelCatalog.emulatorNoteKey；          │
 *   │                              │ deviceProfile.getTierDescription 走 tr  │
 *   └──────────────────────────────┴────────────────────────────────────────┘
 *
 *   【字典对齐保证】 `coverage.test.ts` 5 个 it 守门：键数一致、en→zh 覆盖、zh→en 覆盖、
 *   值非空、关键双语 key（如 benchmark.promptDefault）互异。
 *
 *   【缺失 key 处理】 `t.ts` 中 dev 模式 console.warn + 返回 key.path；prod 静默返回 key。
 *   覆盖测试见 `missing-key.test.ts`。
 *
 * [WHO] 导出 `Locale` / `Dict` / `format` / `LocaleProvider` / `useLocale` / `useT` / `getDict` / `tr`
 * [TO] 消费方 `import {useT, useLocale} from '../i18n'`
 * [HERE] src/design/i18n/index.ts
 */
import type {Dict} from './types';
export type {Locale, Dict, TVars} from './types';
export {format, makeT} from './t';
export {LocaleProvider, useLocale, useT} from './LocaleContext';
export {en} from './en';
export {zh} from './zh';

import {en} from './en';
import {zh} from './zh';
import type {Locale} from './types';
import {format} from './t';

const DICTS: Record<Locale, Dict> = {en, zh};

/**
 * 非 React 上下文里用：拿当前 locale 对应的 dict 自己做模板替换。
 * 大多数 UI 文本走 `useT()`；引擎 / 数据层查表（posture label / exercise / 规则文案 / 设备推荐）
 * 走这个直接查表 + format()，避免在 useEffect 外层订阅 locale。
 *
 * 典型用法：
 *   const advice = tr(locale, 'advice.action.thoracic_extension');
 *   const prompt = buildCoachPrompt(state, memoryPrefix, locale); // coachPrompt 内部走 tr()
 */
export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? en;
}

export function tr(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const dict = getDict(locale);
  const tmpl = dict[key];
  if (tmpl === undefined) {
    return key;
  }
  return vars ? format(tmpl, vars) : tmpl;
}