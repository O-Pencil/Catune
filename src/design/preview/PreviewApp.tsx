/**
 * @file PreviewApp.tsx
 * @description 设计预览沙盒：固定 posture/model/data-source 状态，复用真实 AppShell 做 UI/UX 快速迭代。
 *
 * [WHO] 导出 `PreviewApp`
 * [FROM] 依赖 `react`、`react-native`、`../AppShell`、`../i18n`、`../primitives`、`../theme`、`./states`
 * [TO] 被根 `App.tsx` 在 preview 模式下渲染
 * [HERE] src/design/preview/PreviewApp.tsx · Agent/vibe coding 预览入口
 */
import React, {useMemo, useRef, useState} from 'react';
import {ScrollView, StyleSheet, Text, View, Pressable} from 'react-native';

import {AppShell} from '../AppShell';
import {Locale, LocaleProvider} from '../i18n';
import {theme} from '../theme';
import {createMemoryService} from '../../platform/memory/service';
import {MockScenario} from '../../posture/mock';
import {
  PREVIEW_SCENARIOS,
  PreviewScenarioId,
  createPreviewDashboardState,
  createPreviewGrowthState,
  previewModeForScenario,
} from './states';

const LOCALE_OPTIONS = [
  {value: 'zh', label: '中文'},
  {value: 'en', label: 'EN'},
] satisfies Array<{value: Locale; label: string}>;

const SCENARIO_TO_MOCK: Record<PreviewScenarioId, MockScenario> = {
  normal: 'NORMAL',
  slumped: 'SLUMPED',
  techNeck: 'TECH_NECK',
  leftLean: 'LEFT_LEAN',
  offline: 'OFFLINE',
  streaming: 'SLUMPED',
  fallback: 'TECH_NECK',
};

/** Inline 轻量 SegmentedControl（reusables 没现成的，保留 Catune API 兼容）。 */
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{value: T; label: string}>;
  value: T;
  onChange: (v: T) => void;
}): React.JSX.Element {
  return (
    <View className="bg-muted flex h-9 flex-row items-center rounded-lg p-[3px]">
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={
              'h-[calc(100%-1px)] flex-row items-center justify-center rounded-md px-2 py-1 ' +
              (active ? 'bg-background' : '')
            }>
            <Text
              className={
                'text-sm ' + (active ? 'text-foreground font-semibold' : 'text-muted-foreground')
              }>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PreviewApp(): React.JSX.Element {
  const memory = useRef(createMemoryService()).current;
  const [locale, setLocale] = useState<Locale>('zh');
  const [scenario, setScenario] = useState<PreviewScenarioId>('normal');

  const state = useMemo(() => createPreviewDashboardState(scenario, locale), [locale, scenario]);
  const growth = useMemo(() => createPreviewGrowthState(locale), [locale]);
  const mode = previewModeForScenario(scenario);
  const scenarioOptions = useMemo(
    () =>
      PREVIEW_SCENARIOS.map(item => ({
        value: item.id,
        label: locale === 'zh' ? item.labelZh : item.labelEn,
      })),
    [locale],
  );
  const subtitle =
    locale === 'zh'
      ? `Preview Sandbox · ${mode === 'mock' ? '固定模拟数据' : '离线数据源'}`
      : `Preview Sandbox · ${mode === 'mock' ? 'fixed mock data' : 'offline source'}`;

  const applyScenario = (next: PreviewScenarioId) => {
    setScenario(next);
  };

  return (
    <LocaleProvider locale={locale} onChange={setLocale}>
      <View style={styles.root}>
        <View style={styles.toolbar}>
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <Text style={styles.eyebrow}>CATUNE PREVIEW</Text>
              <Text style={styles.title}>{locale === 'zh' ? '状态沙盒' : 'State sandbox'}</Text>
            </View>
            <View style={styles.localeControl}>
              <SegmentedControl options={LOCALE_OPTIONS} value={locale} onChange={setLocale} />
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scenarioScroller}>
            <View style={styles.scenarioControl}>
              <SegmentedControl options={scenarioOptions} value={scenario} onChange={applyScenario} />
            </View>
          </ScrollView>
        </View>
        <View style={styles.appFrame}>
          <AppShell
            state={state}
            growth={growth}
            memory={memory}
            mode={mode}
            bleStatus={scenario === 'offline' ? 'error' : 'idle'}
            wsStatus={scenario === 'offline' ? 'error' : 'connected'}
            wsSendStatus="idle"
            deskSubtitle={subtitle}
            onUseSensor={() => {}}
            onUseMock={() => applyScenario('normal')}
            onUseBle={() => {}}
            onUseWs={() => {}}
            onUseWsSend={() => {}}
            onCalibrate={() => {}}
            onScenario={mockScenario => {
              const next = PREVIEW_SCENARIOS.find(item => SCENARIO_TO_MOCK[item.id] === mockScenario);
              if (next) {
                applyScenario(next.id);
              }
            }}
            disableOnboarding
          />
        </View>
      </View>
    </LocaleProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  toolbar: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  titleGroup: {
    flexShrink: 1,
  },
  eyebrow: {
    color: theme.colors.textMuted,
    fontFamily: theme.font.bodyBold,
    fontSize: theme.font.sizeXs,
    fontWeight: theme.font.weightBold,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.font.displaySemiBold,
    fontSize: theme.font.sizeXl,
  },
  localeControl: {
    width: 150,
  },
  scenarioScroller: {
    minWidth: '100%',
  },
  scenarioControl: {
    minWidth: 720,
  },
  appFrame: {
    flex: 1,
  },
});
