/**
 * @file Section.tsx
 * @description 页面分区：统一 eyebrow、标题、说明、右侧动作和纵向间距，不强制卡片化。
 *
 * [WHO] 导出 `Section`
 * [FROM] 依赖 `react`、`react-native`、`../theme`
 * [TO] 被 src/design screens/components 组织页面结构
 * [HERE] src/design/primitives/Section.tsx · 页面分区
 */
import React from 'react';
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {theme} from '../theme';

type Props = {
  title?: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Section({title, eyebrow, description, action, children, style, contentStyle}: Props): React.JSX.Element {
  const hasHeader = title || eyebrow || description || action;
  return (
    <View style={[styles.section, style]}>
      {hasHeader ? (
        <View style={styles.header}>
          <View style={styles.copy}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>
          {action ? <View style={styles.action}>{action}</View> : null}
        </View>
      ) : null}
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  copy: {flex: 1, minWidth: 0},
  eyebrow: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sizeXs,
    fontFamily: theme.font.displayMedium,
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.sizeLg,
    fontFamily: theme.font.displaySemiBold,
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sizeSm,
    lineHeight: 20,
    marginTop: theme.spacing.sm,
  },
  action: {alignItems: 'flex-end', justifyContent: 'center'},
});
