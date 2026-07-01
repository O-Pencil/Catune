/**
 * @file Badge.tsx
 * @description 状态徽章：用于 ready/warning/error/muted 等短状态，不承担主要操作。
 *
 * [WHO] 导出 `Badge`、`BadgeTone`
 * [FROM] 依赖 `react`、`react-native`、`../theme`
 * [TO] 被 src/design screens/components 展示状态与标签
 * [HERE] src/design/primitives/Badge.tsx · 状态徽章
 */
import React from 'react';
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {theme} from '../theme';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

type Props = {
  label: string;
  tone?: BadgeTone;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const TONE: Record<BadgeTone, {bg: string; fg: string}> = {
  neutral: {bg: theme.colors.surfaceMuted, fg: theme.colors.textSecondary},
  brand: {bg: '#FCEAE0', fg: theme.colors.primary},
  success: {bg: '#E9F8EE', fg: '#1B7A3E'},
  warning: {bg: '#FFF4DC', fg: '#9A6400'},
  danger: {bg: '#FFF1EF', fg: theme.colors.statusAlert},
};

export function Badge({label, tone = 'neutral', icon, style}: Props): React.JSX.Element {
  const colors = TONE[tone];
  return (
    <View style={[styles.badge, {backgroundColor: colors.bg}, style]}>
      {icon}
      <Text style={[styles.text, {color: colors.fg}]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm2,
    paddingVertical: theme.spacing.xxs,
    maxWidth: '100%',
  },
  text: {
    fontSize: theme.font.sizeXs,
    fontFamily: theme.font.bodyBold,
    fontWeight: theme.font.weightBold,
    flexShrink: 1,
  },
});
