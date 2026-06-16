/**
 * 全局下载进度条：切 Tab 后仍可见。
 */
import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {getModelById} from '../../mnn/modelCatalog';
import {getDownloadSnapshot, subscribeModelDownload, type DownloadJobSnapshot} from '../../mnn/modelDownloadService';
import {theme} from '../theme';

type Props = {
  onOpenSettings?: () => void;
};

export function ModelDownloadBanner({onOpenSettings}: Props): React.JSX.Element | null {
  const [job, setJob] = useState<DownloadJobSnapshot>(() => getDownloadSnapshot());

  useEffect(() => subscribeModelDownload(setJob), []);

  if (job.status !== 'downloading' || !job.modelId) {
    return null;
  }

  const label = getModelById(job.modelId)?.label ?? job.modelId;

  return (
    <Pressable style={styles.wrap} onPress={onOpenSettings}>
      <Text style={styles.text} numberOfLines={1}>
        后台下载中 · {label} · {job.currentFile || '…'} {(job.progress * 100).toFixed(0)}%
      </Text>
      <View style={styles.bar}>
        <View style={[styles.barFill, {width: `${Math.max(job.progress, 0.02) * 100}%`}]} />
      </View>
      <Text style={styles.hint}>可切换页面；完全退出 App 后下次打开会自动续传</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    backgroundColor: '#FFF8F3',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  text: {color: theme.colors.textSecondary, fontSize: theme.font.sizeXs, fontWeight: theme.font.weightBold},
  bar: {height: 4, borderRadius: 2, backgroundColor: theme.colors.surfaceMuted, marginTop: 6, overflow: 'hidden'},
  barFill: {height: 4, borderRadius: 2, backgroundColor: theme.colors.primary},
  hint: {color: theme.colors.textMuted, fontSize: 10, marginTop: 4},
});
