/**
 * Catune 老 API → react-native-reusables 适配层。
 *
 * 老的 primitives（Card/Button/Field/Chip/SegmentedControl/Stack/...）
 * 已经被 reusables 32 个组件替代。但 9 个 screen 用的是 Catune API（variant="primary"、
 * Button label="x"、Chip selected={true}、Field hint/error、SegmentedControl options={}）。
 *
 * 这里提供"同名包装"，保留 Catune 调用方不变，运行时映射到 reusables 内部 API。
 * 后续可逐步把 screen 改写到直接用 reusables API，本文件就可废弃。
 */
import React from 'react';
import {Pressable, View, Text as RNText, type TextInputProps, ActivityIndicator} from 'react-native';
import {Button as ReButton, Input as ReInput, Label as ReLabel} from '@/design/primitives';
import {cn} from '@/lib/utils';

/** 老 Button → reusables Button。label + variant(primary|secondary|ghost|danger) + size(sm|md|lg) + loading */
type LegacyButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
};

const VARIANT_MAP: Record<string, 'default' | 'secondary' | 'ghost' | 'destructive'> = {
  primary: 'default',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'destructive',
};

const SIZE_MAP: Record<string, 'sm' | 'default' | 'lg'> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
};

export function Button({label, onPress, variant = 'primary', size = 'md', disabled, loading, style}: LegacyButtonProps): React.JSX.Element {
  // 整个 Button 渲染绕过 ReButton 的强类型，避免 variant/size 联合类型推断冲突
  const ReButtonAny = ReButton as any;
  return (
    <ReButtonAny
      variant={VARIANT_MAP[variant] ?? 'default'}
      size={SIZE_MAP[size] ?? 'default'}
      disabled={disabled || loading}
      onPress={onPress}
      style={style}>
      {loading ? <ActivityIndicator size="small" className="text-primary-foreground" /> : null}
      <RNText className={cn('text-primary-foreground', variant === 'secondary' && 'text-secondary-foreground', variant === 'ghost' && 'text-primary')}>{label}</RNText>
    </ReButtonAny>
  );
}

/** 老 Chip → reusables 拼装。selected=boolean */
type LegacyChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
};

export function Chip({label, selected, onPress, disabled}: LegacyChipProps): React.JSX.Element {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'rounded-full border px-3 py-1',
        selected ? 'border-primary bg-primary/10' : 'border-border bg-transparent',
      )}>
      <RNText className={cn('text-sm', selected ? 'text-primary font-semibold' : 'text-muted-foreground')}>
        {label}
      </RNText>
    </Pressable>
  );
}

/** 老 Field → reusables Input + Label。 */
type LegacyFieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: any;
  inputStyle?: any;
};

export function Field({label, hint, error, containerStyle, inputStyle, ...inputProps}: LegacyFieldProps): React.JSX.Element {
  return (
    <View className="flex flex-col gap-1.5" style={containerStyle}>
      {label ? (
        <ReLabel className="text-sm font-medium text-foreground">
          {label}
        </ReLabel>
      ) : null}
      <ReInput
        className={cn(
          'border-input h-10 rounded-md border px-3 text-sm',
          error ? 'border-destructive' : '',
        )}
        style={inputStyle}
        {...inputProps}
      />
      {error ? (
        <RNText className="text-destructive text-xs">{error}</RNText>
      ) : hint ? (
        <RNText className="text-muted-foreground text-xs">{hint}</RNText>
      ) : null}
    </View>
  );
}

/** 老 SegmentedControl → inline 替代（reusables 没现成单选切换器）。 */
type LegacySegmentedOption<T extends string> = {value: T; label: string};
type LegacySegmentedControlProps<T extends string> = {
  options: LegacySegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
};

export function SegmentedControl<T extends string>({options, value, onChange}: LegacySegmentedControlProps<T>): React.JSX.Element {
  return (
    <View className="bg-muted flex h-9 flex-row items-center rounded-lg p-[3px]">
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={
              'h-[calc(100%-1px)] flex-1 flex-row items-center justify-center rounded-md px-2 py-1 ' +
              (active ? 'bg-background' : '')
            }>
            <RNText
              className={
                'text-sm ' + (active ? 'text-foreground font-semibold' : 'text-muted-foreground')
              }>
              {opt.label}
            </RNText>
          </Pressable>
        );
      })}
    </View>
  );
}