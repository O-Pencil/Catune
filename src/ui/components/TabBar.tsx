/**
 * @file TabBar.tsx
 * @description 底部 Haptic 标签栏（RN 原语，从 web/ components/layout/TabBar 重写）：浮动胶囊条 + 选中态高亮。
 *   web 的 motion layoutId 滑动指示器先用「选中态背景高亮」近似，动画后续用 Reanimated 加。
 *
 * [WHO] 导出 `Tab` 类型、`TabBar`
 * [FROM] 依赖 `react`、`react-native`(Pressable/View/Text)、`../theme`
 * [TO] 被 `AppShell` 消费
 * [HERE] src/ui/components/TabBar.tsx · 底部标签栏
 */
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {theme} from '../theme';

export type Tab = {value: string; label: string; icon: string};

export function TabBar({
  tabs,
  value,
  onChange,
}: {
  tabs: Tab[];
  value: string;
  onChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bar}>
        {tabs.map(tab => {
          const active = tab.value === value;
          return (
            <Pressable
              key={tab.value}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => onChange(tab.value)}>
              <Text style={styles.icon}>{tab.icon}</Text>
              <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center'},
  bar: {
    flexDirection: 'row',
    gap: 4,
    margin: theme.spacing.lg,
    padding: 4,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxWidth: 480,
    width: '92%',
    ...theme.shadow.pill,
  },
  tab: {flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: theme.radius.md, gap: 2},
  tabActive: {backgroundColor: theme.colors.surface, ...theme.shadow.pill},
  icon: {fontSize: 18},
  label: {fontSize: theme.font.sizeXs, color: theme.colors.textMuted, fontWeight: theme.font.weightBold},
  labelActive: {color: theme.colors.textPrimary},
});
