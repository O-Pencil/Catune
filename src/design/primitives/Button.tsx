/**
 * @file Button.tsx
 * @description 移动端命令按钮：主按钮 / 次按钮 / 轻按钮 / 危险按钮，支持 loading、disabled、图标与全宽。
 *
 * [WHO] 导出 `Button`、`ButtonVariant`、`ButtonSize`
 * [FROM] 依赖 `react`、`react-native`、`../theme`
 * [TO] 被 src/design screens/components 作为通用操作按钮复用
 * [HERE] src/design/primitives/Button.tsx · 基础按钮
 */
import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {theme} from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const VARIANT_STYLE: Record<ButtonVariant, {container: ViewStyle; text: TextStyle; loader: string}> = {
  primary: {
    container: {backgroundColor: theme.colors.primary, borderColor: theme.colors.primary},
    text: {color: '#FFFFFF'},
    loader: '#FFFFFF',
  },
  secondary: {
    container: {backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border},
    text: {color: theme.colors.textPrimary},
    loader: theme.colors.primary,
  },
  ghost: {
    container: {backgroundColor: 'transparent', borderColor: 'transparent'},
    text: {color: theme.colors.primary},
    loader: theme.colors.primary,
  },
  danger: {
    container: {backgroundColor: '#FFF1EF', borderColor: '#F2C8C3'},
    text: {color: theme.colors.statusAlert},
    loader: theme.colors.statusAlert,
  },
};

const SIZE_STYLE: Record<ButtonSize, {container: ViewStyle; text: TextStyle; icon: number}> = {
  sm: {
    container: {minHeight: 36, paddingHorizontal: theme.spacing.md2, paddingVertical: theme.spacing.sm},
    text: {fontSize: theme.font.sizeXs},
    icon: 16,
  },
  md: {
    container: {minHeight: 44, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm2},
    text: {fontSize: theme.font.sizeSm},
    icon: 18,
  },
  lg: {
    container: {minHeight: 52, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.md},
    text: {fontSize: theme.font.sizeMd},
    icon: 20,
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  style,
  textStyle,
}: Props): React.JSX.Element {
  const stateDisabled = disabled || loading;
  const variantStyle = VARIANT_STYLE[variant];
  const sizeStyle = SIZE_STYLE[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{disabled: stateDisabled, busy: loading}}
      disabled={stateDisabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        variantStyle.container,
        sizeStyle.container,
        fullWidth && styles.fullWidth,
        stateDisabled && styles.disabled,
        pressed && !stateDisabled && styles.pressed,
        style,
      ]}>
      {loading ? <ActivityIndicator size="small" color={variantStyle.loader} /> : leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
      <Text style={[styles.label, variantStyle.text, sizeStyle.text, textStyle]} numberOfLines={1}>
        {label}
      </Text>
      {!loading && rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderRadius: theme.radius.md,
  },
  fullWidth: {alignSelf: 'stretch'},
  disabled: {opacity: 0.5},
  pressed: {opacity: 0.78},
  label: {
    fontFamily: theme.font.bodyBold,
    fontWeight: theme.font.weightBold,
    flexShrink: 1,
  },
  icon: {alignItems: 'center', justifyContent: 'center'},
});
