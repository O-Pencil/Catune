/**
 * @file PlantScreen.tsx
 * @description 植物养成屏占位（= web PlantPage 的 RN 版，待按设计搬运）。
 * [HERE] src/ui/screens/PlantScreen.tsx
 */
import React from 'react';
import {ScrollView, StyleSheet, Text} from 'react-native';
import {theme} from '../theme';
import {Card} from '../primitives/Card';

export function PlantScreen(): React.JSX.Element {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>植物养成</Text>
      <Card style={styles.card}>
        <Text style={styles.emoji}>🌱</Text>
        <Text style={styles.hint}>坐姿越好，植物长得越旺。{'\n'}（按 web/ PlantPage 设计搬运中）</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  container: {padding: theme.spacing.lg, paddingTop: 56, paddingBottom: 120, alignItems: 'center'},
  title: {color: theme.colors.textPrimary, fontSize: theme.font.sizeXl, fontWeight: theme.font.weightHeavy, marginBottom: 20},
  card: {width: '100%', alignItems: 'center', paddingVertical: theme.spacing.xxl},
  emoji: {fontSize: 64, marginBottom: 12},
  hint: {color: theme.colors.textMuted, fontSize: theme.font.sizeSm, textAlign: 'center', lineHeight: 20},
});
