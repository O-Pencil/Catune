/**
 * @file IconButton.tsx
 * @description 移动端图标按钮：固定触控尺寸、明确 accessible label，适合关闭、删除、刷新等熟悉动作。
 *
 * [WHO] 导出 `IconButton`
 * [FROM] 依赖 `react`、`react-native`、`../theme`
 * [TO] 被 src/design screens/components 作为图标命令按钮复用
 * [HERE] src/design/primitives/IconButton.tsx · 图标按钮
 */
import React from 'react';
import {GestureResponderEvent, Pressable, StyleProp, StyleSheet, ViewStyle} from 'react-native';
import {theme} from '../theme';
import {ButtonSize, ButtonVariant} from './Button';

type Props = {
  icon: React.ReactNode;
  accessibilityLabel: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: Exclude<ButtonVariant, 'danger'> | 'danger';
  size?: ButtonSize;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SIZE: Record<ButtonSize, ViewStyle> = {
  sm: {width: 36, height: 36},
  md: {width: 44, height: 44},
  lg: {width: 52, height: 52},
};

const VARIANT: Record<ButtonVariant, ViewStyle> = {
  primary: {backgroundColor: theme.colors.primary, borderColor: theme.colors.primary},
  secondary: {backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border},
  ghost: {backgroundColor: 'transparent', borderColor: 'transparent'},
  danger: {backgroundColor: '#FFF1EF', borderColor: '#F2C8C3'},
};

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  style,
}: Props): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({pressed}) => [
        styles.button,
        SIZE[size],
        VARIANT[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: theme.radius.md,
  },
  disabled: {opacity: 0.45},
  pressed: {opacity: 0.76},
});
