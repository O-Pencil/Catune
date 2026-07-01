/**
 * @file ListItem.tsx
 * @description 列表项：设置、诊断、摘要行的统一结构，支持左右插槽和可点击态。
 *
 * [WHO] 导出 `ListItem`
 * [FROM] 依赖 `react`、`react-native`、`../theme`
 * [TO] 被 src/design screens/components 作为信息行复用
 * [HERE] src/design/primitives/ListItem.tsx · 信息列表项
 */
import React from 'react';
import {GestureResponderEvent, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {theme} from '../theme';

type Props = {
  title: string;
  description?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ListItem({title, description, leading, trailing, onPress, disabled = false, style}: Props): React.JSX.Element {
  const content = (
    <>
      {leading ? <View style={styles.slot}>{leading}</View> : null}
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.item, disabled && styles.disabled, style]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [styles.item, disabled && styles.disabled, pressed && !disabled && styles.pressed, style]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md2,
    paddingVertical: theme.spacing.sm2,
  },
  slot: {alignItems: 'center', justifyContent: 'center'},
  copy: {flex: 1, minWidth: 0},
  title: {
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
  trailing: {alignItems: 'flex-end', justifyContent: 'center'},
  disabled: {opacity: 0.5},
  pressed: {opacity: 0.76},
});
