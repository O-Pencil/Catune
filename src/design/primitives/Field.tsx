/**
 * @file Field.tsx
 * @description 表单输入：统一 label、hint、error、禁用态和多行输入样式。
 *
 * [WHO] 导出 `Field`
 * [FROM] 依赖 `react`、`react-native`、`../theme`
 * [TO] 被 src/design screens/components 作为文本输入复用
 * [HERE] src/design/primitives/Field.tsx · 表单输入
 */
import React from 'react';
import {StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle} from 'react-native';
import {theme} from '../theme';

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function Field({label, hint, error, containerStyle, inputStyle, multiline, editable = true, ...inputProps}: Props): React.JSX.Element {
  const describedBy = error ?? hint;
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...inputProps}
        editable={editable}
        multiline={multiline}
        placeholderTextColor={theme.colors.textMuted}
        accessibilityState={{disabled: !editable}}
        accessibilityHint={describedBy}
        style={[
          styles.input,
          multiline && styles.multiline,
          !editable && styles.disabled,
          error && styles.inputError,
          inputStyle,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {gap: theme.spacing.sm},
  label: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.sizeSm,
    fontFamily: theme.font.bodyBold,
    fontWeight: theme.font.weightBold,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md2,
    paddingVertical: theme.spacing.md,
    fontSize: theme.font.sizeSm,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    fontFamily: theme.font.body,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  disabled: {
    opacity: 0.55,
    backgroundColor: theme.colors.surfaceMuted,
  },
  inputError: {
    borderColor: theme.colors.statusAlert,
    backgroundColor: '#FFF9F8',
  },
  hint: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sizeXs,
    lineHeight: 17,
  },
  error: {
    color: theme.colors.statusAlert,
    fontSize: theme.font.sizeXs,
    lineHeight: 17,
  },
});
