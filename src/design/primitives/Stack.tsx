/**
 * @file Stack.tsx
 * @description 布局辅助：纵向/横向 stack，给移动端表单、按钮组、行内状态提供稳定 gap。
 *
 * [WHO] 导出 `Stack`、`Inline`
 * [FROM] 依赖 `react`、`react-native`、`../theme`
 * [TO] 被 src/design screens/components 组织局部布局
 * [HERE] src/design/primitives/Stack.tsx · 布局辅助
 */
import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {theme} from '../theme';

type Gap = keyof typeof theme.spacing;

type StackProps = {
  children: React.ReactNode;
  gap?: Gap;
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Stack({children, gap = 'md', style}: StackProps): React.JSX.Element {
  return <View style={[GAP_STYLE[gap], style]}>{children}</View>;
}

export function Inline({children, gap = 'sm', wrap = true, style}: StackProps): React.JSX.Element {
  return <View style={[styles.inline, wrap ? styles.wrap : styles.nowrap, GAP_STYLE[gap], style]}>{children}</View>;
}

const GAP_STYLE = StyleSheet.create({
  xxs: {gap: theme.spacing.xxs},
  xs: {gap: theme.spacing.xs},
  sm: {gap: theme.spacing.sm},
  sm2: {gap: theme.spacing.sm2},
  md: {gap: theme.spacing.md},
  md2: {gap: theme.spacing.md2},
  lg: {gap: theme.spacing.lg},
  xl: {gap: theme.spacing.xl},
  xxl: {gap: theme.spacing.xxl},
  xxxl: {gap: theme.spacing.xxxl},
});

const styles = StyleSheet.create({
  inline: {flexDirection: 'row', alignItems: 'center'},
  wrap: {flexWrap: 'wrap'},
  nowrap: {flexWrap: 'nowrap'},
});
