/**
 * @file index.ts
 * @description i18n 桶文件，统一导出。
 *
 * [WHO] 导出 `Locale` / `Dict` / `format` / `LocaleProvider` / `useLocale` / `useT`
 * [TO] 消费方 `import {useT} from '../i18n'`
 * [HERE] src/ui/i18n/index.ts
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
 * 大多数 UI 文本走 `useT()`；引擎 / 数据层查表（posture label / exercise / 规则文案）
 * 走这个直接查表 + format()，避免在 useEffect 外层订阅 locale。
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
