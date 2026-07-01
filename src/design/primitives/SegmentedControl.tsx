/**
 * @file SegmentedControl.tsx
 * @description 分段控件：用于 2-4 个互斥模式，比一排按钮更稳定。
 *
 * [WHO] 导出 `SegmentedControl`、`SegmentedOption`
 * [FROM] 依赖 `react`、`react-native`、`../theme`
 * [TO] 被 src/design screens/components 作为模式切换控件复用
 * [HERE] src/design/primitives/SegmentedControl.tsx · 分段选择
 */
import React from 'react';
import {Pressable, StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {theme} from '../theme';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type Props<T extends string> = {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  accessibilityLabel,
  style,
}: Props<T>): React.JSX.Element {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={[styles.root, style]}>
      {options.map(option => {
        const selected = option.value === value;
        const itemDisabled = disabled || option.disabled;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{selected, disabled: itemDisabled}}
            disabled={itemDisabled}
            onPress={() => onChange(option.value)}
            style={({pressed}) => [
              styles.item,
              selected && styles.itemSelected,
              itemDisabled && styles.itemDisabled,
              pressed && !itemDisabled && styles.itemPressed,
            ]}>
            <Text style={[styles.itemText, selected && styles.itemTextSelected]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  item: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  itemSelected: {
    backgroundColor: theme.colors.surface,
    ...theme.shadow.pill,
  },
  itemDisabled: {opacity: 0.45},
  itemPressed: {opacity: 0.76},
  itemText: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sizeSm,
    fontFamily: theme.font.bodyMedium,
  },
  itemTextSelected: {
    color: theme.colors.textPrimary,
    fontFamily: theme.font.bodyBold,
    fontWeight: theme.font.weightBold,
  },
});
