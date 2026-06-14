/**
 * @file DeskScreen.tsx
 * @description 书桌/仪表盘屏（= web DeskPage 的 RN 还原）：问候头 + 设备状态卡 + 脊柱可视化(react-native-svg 3 节点) + 节点角度卡 + 建议。浅色 Haptic。
 *
 * [WHO] 导出 `DeskScreen`
 * [FROM] 依赖 `react`、`react-native`、`react-native-svg`、`../theme`、`../primitives/Card`、`../icons`、`../../posture/types`
 * [TO] 被 `AppShell` 在 desk tab 渲染
 * [HERE] src/ui/screens/DeskScreen.tsx · 仪表盘屏
 */
import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import Svg, {Circle, Ellipse, G, Rect, Text as SvgText} from 'react-native-svg';
import {theme, statusColor} from '../theme';
import {Card} from '../primitives/Card';
import {BatteryIcon, DeviceIcon} from '../icons';
import {DashboardState} from '../../posture/types';

// 设备数据暂为 mock（真实 3 节点 BLE 姿态带为决赛硬件）
const DEVICE = {name: 'PoseMaster-C6', battery: 72, signal: -52, firmware: 'v1.2.3', connected: true};

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好';
}

/** 单节点角度 → 状态色（healthy/warning/alert）。 */
function nodeColor(value: number, healthyMax: number, warnMax: number): string {
  const v = Math.abs(value);
  if (v <= healthyMax) {
    return theme.colors.statusNormal;
  }
  if (v <= warnMax) {
    return theme.colors.statusWarning;
  }
  return theme.colors.statusAlert;
}

function Greeting(): React.JSX.Element {
  return (
    <View style={styles.greeting}>
      <Text style={styles.kicker}>POSTURE-AI</Text>
      <Text style={styles.greetText}>
        {greeting()}，<Text style={{color: theme.colors.primary}}>同学</Text>
      </Text>
    </View>
  );
}

function DeviceStatus(): React.JSX.Element {
  return (
    <Card style={styles.deviceCard}>
      <View style={styles.deviceIcon}>
        <DeviceIcon size={18} color={theme.colors.primary} />
      </View>
      <View style={{flex: 1}}>
        <View style={styles.deviceNameRow}>
          <Text style={styles.deviceName}>{DEVICE.name}</Text>
          <View style={[styles.dot, {backgroundColor: DEVICE.connected ? theme.colors.statusNormal : theme.colors.statusOffline}]} />
        </View>
        <Text style={styles.deviceMeta}>
          3 Nodes · {DEVICE.signal}dBm · {DEVICE.firmware}
        </Text>
      </View>
      <View style={styles.batteryRow}>
        <BatteryIcon level={DEVICE.battery / 100} />
        <Text style={styles.battery}>{DEVICE.battery}%</Text>
      </View>
    </Card>
  );
}

/** 脊柱可视化：椎骨盘 + 3 个监测节点（react-native-svg）。 */
function SpineVisualizer({state}: {state: DashboardState}): React.JSX.Element {
  const color = statusColor(state.posture);
  const nodes = [
    {label: 'C7', y: 44, c: nodeColor(state.neckPitch, 20, 30)},
    {label: 'T12', y: 120, c: nodeColor(state.thorPitch, 15, 25)},
    {label: 'L5', y: 196, c: nodeColor(state.lumbarRoll, 10, 20)},
  ];
  const curveX = (y: number) => 56 + 6 * Math.sin(y / 38);

  const discs: {x: number; y: number}[] = [];
  for (let y = 24; y <= 216; y += 16) {
    discs.push({x: curveX(y), y});
  }

  return (
    <Card style={styles.spineCard}>
      <View style={[styles.pill, {backgroundColor: `${color}22`, borderColor: color}]}>
        <View style={[styles.pillDot, {backgroundColor: color}]} />
        <Text style={[styles.pillText, {color}]}>{state.postureLabel}</Text>
      </View>
      <View style={styles.scoreBox}>
        <Text style={styles.scoreKicker}>SCORE</Text>
        <Text style={[styles.scoreNum, {color}]}>{state.score}</Text>
      </View>

      <View style={styles.spineSvgWrap}>
        <Svg width="100%" height="100%" viewBox="0 0 120 240" preserveAspectRatio="xMidYMid meet">
          {discs.map((d, i) => (
            <Ellipse key={i} cx={d.x} cy={d.y} rx={7} ry={3.2} fill={theme.colors.border} />
          ))}
          {nodes.map(n => {
            const x = curveX(n.y);
            return (
              <G key={n.label}>
                <Circle cx={x} cy={n.y} r={9} stroke={n.c} strokeWidth={2.5} fill={theme.colors.surface} />
                <Circle cx={x} cy={n.y} r={4} fill={n.c} />
                <Rect x={x + 12} y={n.y - 9} width={28} height={18} rx={5} fill={theme.colors.surface} stroke={n.c} strokeWidth={1.5} />
                <SvgText x={x + 26} y={n.y + 4} fontSize={10} fontWeight="700" fill={theme.colors.textPrimary} textAnchor="middle">
                  {n.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    </Card>
  );
}

function NodeAngleCard({label, value, color}: {label: string; value: number; color: string}): React.JSX.Element {
  return (
    <Card style={styles.angleCard}>
      <Text style={styles.angleLabel}>{label}</Text>
      <Text style={[styles.angleValue, {color}]}>{value.toFixed(0)}°</Text>
    </Card>
  );
}

export function DeskScreen({state}: {state: DashboardState; subtitle?: string}): React.JSX.Element {
  const cNeck = nodeColor(state.neckPitch, 20, 30);
  const cThor = nodeColor(state.thorPitch, 15, 25);
  const cLum = nodeColor(state.lumbarRoll, 10, 20);
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Greeting />
      <DeviceStatus />
      <SpineVisualizer state={state} />

      <View style={styles.row}>
        <NodeAngleCard label="C7 Neck" value={state.neckPitch} color={cNeck} />
        <NodeAngleCard label="T12 Thor." value={state.thorPitch} color={cThor} />
        <NodeAngleCard label="L5 Lumbar" value={state.lumbarRoll} color={cLum} />
      </View>

      {state.advice ? (
        <Card style={styles.adviceCard}>
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
  container: {padding: theme.spacing.md, paddingTop: 48, paddingBottom: 120, gap: theme.spacing.sm},

  greeting: {paddingHorizontal: 4, paddingBottom: 4},
  kicker: {color: theme.colors.textMuted, fontSize: 10, fontWeight: theme.font.weightBold, letterSpacing: 1},
  greetText: {color: theme.colors.textPrimary, fontSize: theme.font.sizeLg, fontWeight: theme.font.weightBold, marginTop: 2},

  deviceCard: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: theme.spacing.md},
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(251,75,0,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceNameRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  deviceName: {color: theme.colors.textPrimary, fontSize: theme.font.sizeSm, fontWeight: theme.font.weightBold},
  dot: {width: 8, height: 8, borderRadius: 4},
  deviceMeta: {color: theme.colors.textSecondary, fontSize: 10, marginTop: 2},
  batteryRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  battery: {color: theme.colors.textSecondary, fontSize: 11, fontWeight: theme.font.weightBold},

  spineCard: {height: 300, position: 'relative', padding: theme.spacing.md},
  pill: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillDot: {width: 6, height: 6, borderRadius: 3},
  pillText: {fontSize: 11, fontWeight: theme.font.weightBold},
  scoreBox: {position: 'absolute', top: 12, right: 12, zIndex: 10, alignItems: 'flex-end'},
  scoreKicker: {color: theme.colors.textMuted, fontSize: 9, fontWeight: theme.font.weightBold, letterSpacing: 1},
  scoreNum: {fontSize: 38, fontWeight: theme.font.weightHeavy, lineHeight: 40},
  spineSvgWrap: {flex: 1, marginTop: 36},

  row: {flexDirection: 'row', gap: theme.spacing.sm},
  angleCard: {flex: 1, alignItems: 'center', paddingVertical: theme.spacing.md},
  angleLabel: {color: theme.colors.textMuted, fontSize: 10, fontWeight: theme.font.weightBold},
  angleValue: {fontSize: theme.font.sizeLg, fontWeight: theme.font.weightBold, marginTop: 4},

  adviceCard: {},
  adviceLabel: {color: theme.colors.primary, fontSize: theme.font.sizeXs, fontWeight: theme.font.weightBold, marginBottom: 6},
  adviceText: {color: theme.colors.textPrimary, fontSize: theme.font.sizeSm, lineHeight: 20},
});
