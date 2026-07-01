/**
 * @file Card.tsx
 * @description Haptic 卡片：白底、柔和阴影、圆角、细边（对齐 web shadcn Card 的拟物质感）。
 *
 * [WHO] 导出 `Card`
 * [FROM] 依赖 `react`、`react-native`(View)、`../theme`
 * [TO] 被各屏/组件包内容
 * [HERE] src/design/primitives/Card.tsx · 卡片
 */
import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {theme} from '../theme';

export function Card({children, style}: {children: React.ReactNode; style?: StyleProp<ViewStyle>}): React.JSX.Element {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
});
