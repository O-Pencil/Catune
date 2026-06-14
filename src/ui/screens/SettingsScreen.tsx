/**
 * @file SettingsScreen.tsx
 * @description 设置屏（= web SettingsPage 的 RN 版）：数据源切换（传感器/模拟）+ F7 演示控制台。
 *
 * [WHO] 导出 `SettingsScreen`
 * [FROM] 依赖 `react`、`react-native`、`../theme`、`../primitives/Card`、`../../posture/mock`、`../../posture/types`
 * [TO] 被 `AppShell` 在 settings tab 渲染
 * [HERE] src/ui/screens/SettingsScreen.tsx · 设置/演示控制
 */
import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {theme} from '../theme';
import {Card} from '../primitives/Card';
import {MockScenario, SCENARIOS} from '../../posture/mock';
import {DashboardState} from '../../posture/types';

export type DataMode = 'loading' | 'sensor' | 'mock';

type Props = {
  state: DashboardState;
  mode: DataMode;
  onUseSensor: () => void;
  onUseMock: () => void;
  onScenario: (s: MockScenario) => void;
};

function Pill({active, label, onPress}: {active: boolean; label: string; onPress: () => void}): React.JSX.Element {
  return (
    <Pressable style={[styles.pill, active && styles.pillActive]} onPress={onPress}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function SettingsScreen({state, mode, onUseSensor, onUseMock, onScenario}: Props): React.JSX.Element {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>设置</Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>数据源</Text>
        <View style={styles.rowGap}>
          <Pill active={mode === 'sensor'} label="手机传感器" onPress={onUseSensor} />
          <Pill active={mode === 'mock'} label="模拟" onPress={onUseMock} />
        </View>
        <Text style={styles.hint}>
          {mode === 'sensor' ? '正在用手机 IMU（前后/左右倾斜手机）。' : mode === 'mock' ? '正在用本地模拟流。' : '检测传感器中…'}
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>F7 演示控制台</Text>
        <View style={styles.wrapRow}>
          {SCENARIOS.map((s: MockScenario) => (
            <Pill
              key={s}
              active={mode === 'mock' && state.posture === s}
              label={s.replace('_', ' ')}
              onPress={() => onScenario(s)}
            />
          ))}
        </View>
        <Text style={styles.hint}>一键切换演示姿态（自动切到模拟数据源）。</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>关于</Text>
        <Text style={styles.hint}>Catune · 不驼背坐姿助手。健康管理辅助，非医疗诊断。</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  container: {padding: theme.spacing.lg, paddingTop: 56, paddingBottom: 120},
  title: {color: theme.colors.textPrimary, fontSize: theme.font.sizeXl, fontWeight: theme.font.weightHeavy, marginBottom: 20},
  card: {marginBottom: theme.spacing.md},
  cardTitle: {color: theme.colors.textPrimary, fontSize: theme.font.sizeMd, fontWeight: theme.font.weightBold, marginBottom: 12},
  rowGap: {flexDirection: 'row', gap: theme.spacing.sm},
  wrapRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  hint: {color: theme.colors.textMuted, fontSize: theme.font.sizeXs, marginTop: 10, lineHeight: 18},
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
  },
  pillActive: {borderColor: theme.colors.primary, backgroundColor: '#FCEAE0'},
  pillText: {color: theme.colors.textMuted, fontSize: theme.font.sizeSm},
  pillTextActive: {color: theme.colors.primary, fontWeight: theme.font.weightBold},
});
