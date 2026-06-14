/**
 * @file DeskScreen.tsx
 * @description 书桌/仪表盘屏（= web DeskPage 的 RN 版）：分数环 + 3 节点角度(颈/胸/腰) + 状态 + 建议。浅色 Haptic。
 *
 * [WHO] 导出 `DeskScreen`
 * [FROM] 依赖 `react`、`react-native`、`../theme`、`../primitives/Card`、`../../posture/types`
 * [TO] 被 `AppShell` 在 desk tab 渲染
 * [HERE] src/ui/screens/DeskScreen.tsx · 仪表盘屏
 */
import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {theme, statusColor} from '../theme';
import {Card} from '../primitives/Card';
import {DashboardState} from '../../posture/types';

function Metric({label, value, color}: {label: string; value: string; color: string}): React.JSX.Element {
  return (
    <Card style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, {color}]}>{value}</Text>
    </Card>
  );
}

export function DeskScreen({state, subtitle}: {state: DashboardState; subtitle?: string}): React.JSX.Element {
  const color = statusColor(state.posture);
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>不驼背坐姿助手</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={[styles.scoreCircle, {borderColor: color}]}>
        <Text style={styles.scoreLabel}>SCORE</Text>
        <Text style={[styles.score, {color}]}>{state.score}</Text>
      </View>

      <View style={styles.row}>
        <Metric label="颈 Neck" value={`${state.neckPitch.toFixed(0)}°`} color={theme.colors.textPrimary} />
        <Metric label="胸 Thor" value={`${state.thorPitch.toFixed(0)}°`} color={theme.colors.textPrimary} />
        <Metric label="腰 Lumbar" value={`${state.lumbarRoll.toFixed(0)}°`} color={theme.colors.textPrimary} />
      </View>

      <Card style={styles.statusCard}>
        <Text style={styles.dim}>状态</Text>
        <Text style={[styles.status, {color}]}>{state.postureLabel}</Text>
      </Card>

      {state.advice ? (
        <Card style={[styles.statusCard, styles.adviceCard]}>
          <Text style={styles.adviceLabel}>
            建议{state.inferenceSource === 'RULE_FALLBACK' ? '（规则）' : ''}
          </Text>
          <Text style={styles.adviceText}>{state.advice}</Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  container: {padding: theme.spacing.lg, paddingTop: 56, paddingBottom: 120, alignItems: 'center'},
  title: {color: theme.colors.textPrimary, fontSize: theme.font.sizeXl, fontWeight: theme.font.weightHeavy},
  subtitle: {color: theme.colors.textMuted, fontSize: theme.font.sizeXs, marginTop: 4, marginBottom: 20, textAlign: 'center'},
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    ...theme.shadow.card,
  },
  scoreLabel: {color: theme.colors.textMuted, fontSize: theme.font.sizeXs, fontWeight: theme.font.weightBold},
  score: {fontSize: theme.font.sizeScore, fontWeight: theme.font.weightHeavy},
  row: {flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: theme.spacing.sm, marginBottom: theme.spacing.md},
  metric: {flex: 1, alignItems: 'center', paddingVertical: theme.spacing.md},
  metricLabel: {color: theme.colors.textMuted, fontSize: theme.font.sizeXs},
  metricValue: {fontSize: theme.font.sizeXl, fontWeight: theme.font.weightBold, marginTop: 4},
  statusCard: {width: '100%', alignItems: 'center', marginBottom: theme.spacing.md},
  dim: {color: theme.colors.textMuted, fontSize: theme.font.sizeXs},
  status: {fontSize: theme.font.sizeLg, fontWeight: '600', marginTop: 4},
  adviceCard: {alignItems: 'flex-start'},
  adviceLabel: {color: theme.colors.primary, fontSize: theme.font.sizeXs, fontWeight: theme.font.weightBold, marginBottom: 6},
  adviceText: {color: theme.colors.textPrimary, fontSize: theme.font.sizeSm, lineHeight: 20},
});
