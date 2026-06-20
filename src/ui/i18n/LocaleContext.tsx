/**
 * @file LocaleContext.tsx
 * @description Locale Provider：根注入当前 Locale + 字典切换能力。
 *   组件用 useT() 拿翻译函数；useLocale() 拿当前 locale + setter。
 *
 * [WHO] 导出 `LocaleProvider` / `useLocale` / `useT`
 * [FROM] 依赖 react、./en、./zh、./t、./types
 * [TO] 被 App.tsx 包裹；各屏/组件调用 useT()
 * [HERE] src/ui/i18n/LocaleContext.tsx · Locale React 上下文
 */
import React, {createContext, useCallback, useContext, useMemo} from 'react';

import type {Locale} from './types';
import {en} from './en';
import {zh} from './zh';
import {makeT} from './t';

const DICTS = {en, zh} as const;

type LocaleCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
};

const Ctx = createContext<LocaleCtx | null>(null);

export type LocaleProviderProps = {
  locale: Locale;
  onChange: (l: Locale) => void;
  children: React.ReactNode;
};

export function LocaleProvider({locale, onChange, children}: LocaleProviderProps): React.JSX.Element {
  const setLocale = useCallback((l: Locale) => onChange(l), [onChange]);
  const value = useMemo(() => ({locale, setLocale}), [locale, setLocale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error('useLocale must be used inside <LocaleProvider>');
  }
  return v;
}

const IS_DEV =
  (globalThis as {__DEV__?: boolean}).__DEV__ ??
  (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');

/**
 * 翻译函数。返回 (key, vars?) => string。
 *   const t = useT();
 *   <Text>{t('desk.feedback.tech_neck')}</Text>
 */
export function useT(): (key: string, vars?: Record<string, string | number>) => string {
  const {locale} = useLocale();
  return useMemo(() => makeT(DICTS[locale], locale, IS_DEV), [locale]);
}
