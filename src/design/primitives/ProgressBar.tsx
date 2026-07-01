/**
 * @file ProgressBar.tsx
 * @description 线性进度：下载、评估、训练进度的统一表达，稳定高度且支持无障碍进度值。
 *
 * [WHO] 导出 `ProgressBar`
 * [FROM] 依赖 `react`、`react-native`、`../theme`
 * [TO] 被 src/design screens/components 展示进度
 * [HERE] src/design/primitives/ProgressBar.tsx · 线性进度
 */
import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {theme} from '../theme';

type Props = {
  value: number;
  max?: number;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  style?: StyleProp<ViewStyle>;
};

const TONE = {
  brand: theme.colors.primary,
  success: theme.colors.statusNormal,
  warning: theme.colors.statusWarning,
  danger: theme.colors.statusAlert,
} as const;

export function ProgressBar({value, max = 1, tone = 'brand', style}: Props): React.JSX.Element {
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{min: 0, max, now: Math.max(0, Math.min(max, value))}}
      style={[styles.track, style]}>
      <View style={[styles.fill, {backgroundColor: TONE[tone], width: `${ratio * 100}%`}]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceMuted,
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.pill,
  },
});
