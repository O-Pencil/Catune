/**
 * @file SwitchRow.tsx
 * @description 开关行：二元设置的标准表达，包含标题、说明、禁用态和 RN Switch。
 *
 * [WHO] 导出 `SwitchRow`
 * [FROM] 依赖 `react`、`react-native`、`../theme`
 * [TO] 被 src/design screens/components 作为设置开关复用
 * [HERE] src/design/primitives/SwitchRow.tsx · 设置开关行
 */
import React from 'react';
import {StyleProp, StyleSheet, Switch, Text, View, ViewStyle} from 'react-native';
import {theme} from '../theme';

type Props = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SwitchRow({label, description, value, onValueChange, disabled = false, style}: Props): React.JSX.Element {
  return (
    <View style={[styles.row, disabled && styles.disabled, style]}>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{false: theme.colors.border, true: theme.colors.primaryLight}}
        thumbColor={value ? theme.colors.primary : theme.colors.surface}
        ios_backgroundColor={theme.colors.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.sm2,
  },
  copy: {flex: 1, minWidth: 0},
  label: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.sizeSm,
    fontFamily: theme.font.bodyBold,
    fontWeight: theme.font.weightBold,
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sizeXs,
    lineHeight: 17,
    marginTop: theme.spacing.xs,
  },
  disabled: {opacity: 0.5},
});
