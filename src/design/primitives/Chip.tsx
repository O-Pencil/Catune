/**
 * @file Chip.tsx
 * @description 可选项 chip：适合模式、过滤器和少量互斥选项；支持 selected / disabled。
 *
 * [WHO] 导出 `Chip`
 * [FROM] 依赖 `react`、`react-native`、`../theme`
 * [TO] 被 src/design screens/components 作为轻量选择控件复用
 * [HERE] src/design/primitives/Chip.tsx · 选择 chip
 */
import React from 'react';
import {GestureResponderEvent, Pressable, StyleProp, StyleSheet, Text, ViewStyle} from 'react-native';
import {theme} from '../theme';

type Props = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Chip({label, selected = false, disabled = false, onPress, accessibilityLabel, style}: Props): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{selected, disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.chip,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text style={[styles.text, selected && styles.textSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm2,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
  },
  selected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FCEAE0',
  },
  disabled: {opacity: 0.45},
  pressed: {opacity: 0.75},
  text: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sizeSm,
    fontFamily: theme.font.bodyMedium,
    flexShrink: 1,
  },
  textSelected: {
    color: theme.colors.primary,
    fontFamily: theme.font.bodyBold,
    fontWeight: theme.font.weightBold,
  },
});
