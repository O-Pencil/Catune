/**
 * @file LogConsole.tsx
 * @description 运行日志面板（演示用）：订阅 logBus，实时展示 传感器/模型/推理/流程 事件，支持分类筛选与清空。
 *   用于赛事「必须展示：模型本地加载 / 推理输入输出 / 核心交互流程」的现场/录像证据。
 *   UI 文案全部走 useT()：标题/清空/副标题/empty/4 个分类标签/5 个 filter 全部 t()。
 *   颜色（badge 颜色）保持硬编码 — 视觉属性不是文案。
 *
 * [WHO] 导出 `LogConsole`
 * [FROM] 依赖 `react`、`react-native`、`../../debug/logBus`、`../theme`、`../primitives/Card`、`../i18n`
 * [TO] 被 SettingsScreen 渲染
 * [HERE] src/design/components/LogConsole.tsx · 运行日志面板
 */
import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {theme} from '../theme';
import {Card} from '@/design/primitives';
import {clearLog, LogCategory, LogEntry, subscribeLog} from '../../debug/logBus';
import {useT} from '../i18n';

/** 分类颜色（视觉属性，与 locale 无关，硬编码）。 */
const CAT_COLOR: Record<LogCategory, string> = {
  sensor: '#3A9E1F',
  model: '#FB4B00',
  infer: '#0A66C2',
  flow: '#8A5A00',
};

/** 分类 i18n key。 */
const CAT_KEY: Record<LogCategory, string> = {
  sensor: 'logConsole.cat.sensor',
  model: 'logConsole.cat.model',
  infer: 'logConsole.cat.infer',
  flow: 'logConsole.cat.flow',
};

function hms(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function LogConsole({maxHeight = 220}: {maxHeight?: number}): React.JSX.Element {
  const t = useT();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | LogCategory>('all');

  useEffect(() => subscribeLog(setEntries), []);

  const shown = useMemo(
    () => (filter === 'all' ? entries : entries.filter(e => e.category === filter)).slice(0, 80),
    [entries, filter],
  );

  // Filter 列表在组件内构造（依赖 t()）；type 不变。
  const filters: Array<{key: 'all' | LogCategory; label: string}> = [
    {key: 'all', label: t('logConsole.filter.all')},
    {key: 'sensor', label: t('logConsole.filter.sensor')},
    {key: 'model', label: t('logConsole.filter.model')},
    {key: 'infer', label: t('logConsole.filter.infer')},
    {key: 'flow', label: t('logConsole.filter.flow')},
  ];

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{t('logConsole.title')}</Text>
        <Pressable hitSlop={8} onPress={clearLog}>
          <Text style={styles.clear}>{t('logConsole.clear')}</Text>
        </Pressable>
      </View>
      <Text style={styles.sub}>{t('logConsole.sub')}</Text>

      <View style={styles.filters}>
        {filters.map(f => (
          <Pressable key={f.key} style={[styles.pill, filter === f.key && styles.pillActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.pillText, filter === f.key && styles.pillTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={[styles.box, {maxHeight}]} nestedScrollEnabled>
        {shown.length === 0 ? (
          <Text style={styles.empty}>{t('logConsole.empty')}</Text>
        ) : (
          shown.map(e => (
            <View key={e.id} style={styles.row}>
              <Text style={styles.time}>{hms(e.ts)}</Text>
              <Text style={[styles.badge, {color: CAT_COLOR[e.category]}]}>{t(CAT_KEY[e.category])}</Text>
              <Text style={styles.text} numberOfLines={3}>
                {e.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {marginBottom: theme.spacing.md},
  head: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  title: {color: theme.colors.textPrimary, fontSize: theme.font.sizeMd, fontWeight: theme.font.weightBold},
  clear: {color: theme.colors.primary, fontSize: theme.font.sizeXs, fontWeight: theme.font.weightBold},
  sub: {color: theme.colors.textMuted, fontSize: theme.font.sizeXs, marginTop: theme.spacing.sm, lineHeight: 16},
  filters: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.md},
  pill: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillActive: {borderColor: theme.colors.primary, backgroundColor: '#FCEAE0'},
  pillText: {color: theme.colors.textMuted, fontSize: theme.font.sizeXs},
  pillTextActive: {color: theme.colors.primary, fontWeight: theme.font.weightBold},
  box: {
    marginTop: theme.spacing.md,
    maxHeight: 220,
    backgroundColor: '#0E0E0E',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  row: {flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm2, paddingVertical: 3},
  time: {color: '#6B6B6B', fontSize: 10, fontVariant: ['tabular-nums'], width: 54},
  badge: {fontSize: 10, fontWeight: theme.font.weightBold, width: 36},
  text: {color: '#E6E6E6', fontSize: 11, flex: 1, lineHeight: 16},
  empty: {color: '#8A8A8A', fontSize: theme.font.sizeXs, lineHeight: 18},
});
