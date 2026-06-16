/**
 * @file ModelDownloadCard.tsx
 * @description 端侧模型下载/切换/删除：断点续传、后台下载、已安装检测、活跃模型标记。
 */
import React, {useCallback, useEffect, useState} from 'react';
import {Alert, NativeModules, Pressable, StyleSheet, Text, View} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import {DEFAULT_MODEL_ID, getDefaultModel, getModelById, MODEL_CATALOG} from '../../mnn/modelCatalog';
import {getDownloadSnapshot, startModelDownload, subscribeModelDownload} from '../../mnn/modelDownloadService';
import {
  deleteModelFiles,
  formatBytes,
  getModelInstallState,
  InstalledModelInfo,
  listInstalledModels,
  readActiveModelId,
  readDownloadState,
  writeActiveModelId,
} from '../../mnn/modelStorage';
import {theme} from '../theme';
import {Card} from '../primitives/Card';

type Props = {
  onModelsChanged?: () => void;
};

type UiStatus = 'idle' | 'checking' | 'downloading' | 'error';

type CatuneMnnModule = {
  releaseModel?: () => Promise<boolean>;
};

const CatuneMnn = NativeModules.CatuneMnn as CatuneMnnModule | undefined;

async function releaseNativeModel(): Promise<void> {
  try {
    await CatuneMnn?.releaseModel?.();
  } catch {
    // ignore
  }
}

export function ModelDownloadCard({onModelsChanged}: Props): React.JSX.Element {
  const docDir: string | null = FileSystem.documentDirectory ?? null;
  const supported = Boolean(docDir);

  const [uiStatus, setUiStatus] = useState<UiStatus>('checking');
  const [selectedId, setSelectedId] = useState(DEFAULT_MODEL_ID);
  const [activeId, setActiveId] = useState(DEFAULT_MODEL_ID);
  const [installState, setInstallState] = useState<'missing' | 'partial' | 'ready'>('missing');
  const [installed, setInstalled] = useState<InstalledModelInfo[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasPendingDownload, setHasPendingDownload] = useState(false);

  const selectedModel = getModelById(selectedId) ?? getDefaultModel();
  const isActive = activeId === selectedId && installState === 'ready';
  const isDownloading = uiStatus === 'downloading';

  const refresh = useCallback(async () => {
    if (!docDir) {
      return;
    }
    const model = getModelById(selectedId) ?? getDefaultModel();
    setUiStatus('checking');
    setError(null);
    try {
      const [nextActive, nextInstalled, pending] = await Promise.all([
        readActiveModelId(docDir),
        listInstalledModels(docDir),
        readDownloadState(docDir),
      ]);
      setActiveId(nextActive);
      setInstalled(nextInstalled);
      setHasPendingDownload(Boolean(pending && pending.modelId === selectedId));
      const state = await getModelInstallState(docDir, model);
      setInstallState(state);
      const job = getDownloadSnapshot();
      setUiStatus(job.status === 'downloading' && job.modelId === selectedId ? 'downloading' : 'idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setUiStatus('error');
    }
  }, [docDir, selectedId]);

  useEffect(() => {
    refresh();
  }, [refresh, selectedId]);

  useEffect(
    () =>
      subscribeModelDownload(job => {
        if (job.modelId !== selectedId && job.status === 'downloading') {
          return;
        }
        if (job.status === 'downloading') {
          setUiStatus('downloading');
          setProgress(job.progress);
          setCurrentFile(job.currentFile);
          setError(null);
        } else if (job.status === 'error') {
          setUiStatus('error');
          setError(job.error);
          setHasPendingDownload(true);
        } else if (job.status === 'done') {
          setProgress(1);
          setUiStatus('idle');
          refresh().then(() => onModelsChanged?.());
        }
      }),
    [onModelsChanged, refresh, selectedId],
  );

  const activateModel = useCallback(
    async (modelId: string) => {
      if (!docDir) {
        return;
      }
      const model = getModelById(modelId);
      if (!model) {
        return;
      }
      const state = await getModelInstallState(docDir, model);
      if (state !== 'ready') {
        setError('模型文件不完整，请重新下载或继续下载。');
        return;
      }
      await writeActiveModelId(docDir, modelId);
      await releaseNativeModel();
      setActiveId(modelId);
      await refresh();
      onModelsChanged?.();
    },
    [docDir, onModelsChanged, refresh],
  );

  const runDownload = async (replaceExisting: boolean) => {
    setError(null);
    try {
      await startModelDownload(selectedId, replaceExisting);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setHasPendingDownload(true);
      setUiStatus('error');
    }
  };

  const onPressDownload = () => {
    if (installState === 'ready') {
      Alert.alert('更换模型', `将重新下载并覆盖 ${selectedModel.label} 的本地文件。`, [
        {text: '取消', style: 'cancel'},
        {text: '继续', style: 'destructive', onPress: () => runDownload(true)},
      ]);
      return;
    }
    runDownload(false);
  };

  const onPressDelete = () => {
    Alert.alert(
      '删除模型',
      `确定删除 ${selectedModel.label}？将释放 ${selectedModel.sizeHint} 左右空间。`,
      [
        {text: '取消', style: 'cancel'},
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            if (!docDir) {
              return;
            }
            await deleteModelFiles(docDir, selectedModel);
            if (activeId === selectedId) {
              const remaining = installed.filter(x => x.model.id !== selectedId && x.state === 'ready');
              if (remaining.length > 0) {
                await writeActiveModelId(docDir, remaining[0].model.id);
              } else {
                await FileSystem.deleteAsync(docDir + 'mnn_models/.active', {idempotent: true});
              }
              await releaseNativeModel();
            }
            setInstallState('missing');
            await refresh();
            onModelsChanged?.();
          },
        },
      ],
    );
  };

  const primaryLabel = (() => {
    if (isDownloading) {
      return '下载中…';
    }
    if (hasPendingDownload && installState !== 'ready') {
      return '继续下载';
    }
    if (installState === 'ready') {
      return isActive ? '更换模型' : '设为此模型';
    }
    if (installState === 'partial') {
      return '继续下载';
    }
    return '下载模型';
  })();

  const onPressPrimary = () => {
    if (isDownloading) {
      return;
    }
    if (installState === 'ready' && !isActive) {
      activateModel(selectedId);
      return;
    }
    onPressDownload();
  };

  const statusLine = (() => {
    if (isDownloading) {
      return `下载中：${currentFile} ${(progress * 100).toFixed(0)}%（可切 Tab / 退后台）`;
    }
    if (installState === 'ready' && isActive) {
      return '✓ 已安装 · 当前使用';
    }
    if (installState === 'ready') {
      return '✓ 已安装（未选用）';
    }
    if (installState === 'partial' || hasPendingDownload) {
      return '⚠ 未完整（可继续下载）';
    }
    return '未下载';
  })();

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>端侧模型</Text>
      {!supported ? (
        <Text style={styles.hint}>下载仅手机端（iOS/Android）支持；Web 端不可用。</Text>
      ) : (
        <View>
          <Text style={styles.sectionLabel}>选择模型</Text>
          <View style={styles.wrapRow}>
            {MODEL_CATALOG.map(m => (
              <Pressable
                key={m.id}
                style={[styles.pill, selectedId === m.id && styles.pillActive]}
                disabled={isDownloading}
                onPress={() => setSelectedId(m.id)}>
                <Text style={[styles.pillText, selectedId === m.id && styles.pillTextActive]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.statusText}>{statusLine}</Text>
          <Text style={styles.metaText}>
            {selectedModel.label} · {selectedModel.sizeHint} · 目录 {selectedModel.subdir}
          </Text>
          {isActive ? (
            <Text style={styles.metaText}>当前 App 推理使用此模型（与 MNN DEBUG 路径一致）</Text>
          ) : null}

          {isDownloading ? (
            <View style={styles.bar}>
              <View style={[styles.barFill, {width: `${Math.max(progress, 0.02) * 100}%`}]} />
            </View>
          ) : null}

          {error ? (
            <Text style={styles.error} numberOfLines={4}>
              {error}
            </Text>
          ) : null}

          <View style={styles.rowGap}>
            <Pressable
              style={[styles.btn, styles.btnPrimary, isDownloading && styles.btnDisabled]}
              disabled={isDownloading}
              onPress={onPressPrimary}>
              <Text style={styles.btnText}>{primaryLabel}</Text>
            </Pressable>
            {(installState === 'ready' || installState === 'partial') && !isDownloading ? (
              <Pressable style={[styles.btn, styles.btnDanger]} onPress={onPressDelete}>
                <Text style={styles.btnDangerText}>删除</Text>
              </Pressable>
            ) : null}
          </View>

          {installed.length > 0 ? (
            <View style={styles.installedBlock}>
              <Text style={styles.sectionLabel}>本机已安装</Text>
              {installed.map(item => (
                <Text key={item.model.id} style={styles.installedRow}>
                  {item.model.label}
                  {item.state === 'partial' ? '（不完整）' : ''}
                  {activeId === item.model.id && item.state === 'ready' ? ' · 使用中' : ''}
                  {' · '}
                  {formatBytes(item.dirSizeBytes)}
                </Text>
              ))}
            </View>
          ) : null}

          <Text style={styles.hint}>
            支持断点续传与后台下载：切 Tab 或按 Home 退后台可继续；若系统杀进程，下次打开 App 自动续传。{'\n'}
            {selectedModel.emulatorNote ?? ''}
            {'\n'}
            模拟器 INT4 乱码/!!!! 属虚拟 CPU 限制，换更小模型无法根治；真机中文已验证可用。{'\n'}
            模型须为 MNN 格式（config.json / llm.mnn / llm.mnn.weight），不是 AWQ / GGUF。
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {marginBottom: theme.spacing.md},
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    marginBottom: 12,
  },
  sectionLabel: {color: theme.colors.textMuted, fontSize: theme.font.sizeXs, marginBottom: 8},
  statusText: {color: theme.colors.textSecondary, fontSize: theme.font.sizeSm, marginTop: 4},
  metaText: {color: theme.colors.textMuted, fontSize: theme.font.sizeXs, marginTop: 4, lineHeight: 16},
  bar: {height: 6, borderRadius: 3, backgroundColor: theme.colors.surfaceMuted, marginTop: 10, overflow: 'hidden'},
  barFill: {height: 6, borderRadius: 3, backgroundColor: theme.colors.primary},
  error: {color: '#C20A0A', fontSize: theme.font.sizeXs, marginTop: 10, lineHeight: 17},
  rowGap: {flexDirection: 'row', gap: theme.spacing.sm, marginTop: 12, flexWrap: 'wrap'},
  wrapRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnPrimary: {borderColor: theme.colors.primary, backgroundColor: '#FCEAE0'},
  btnDanger: {borderColor: '#C20A0A', backgroundColor: '#FFF5F5'},
  btnDisabled: {opacity: 0.5},
  btnText: {color: theme.colors.primary, fontSize: theme.font.sizeSm, fontWeight: theme.font.weightBold},
  btnDangerText: {color: '#C20A0A', fontSize: theme.font.sizeSm, fontWeight: theme.font.weightBold},
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
  },
  pillActive: {borderColor: theme.colors.primary, backgroundColor: '#FCEAE0'},
  pillText: {color: theme.colors.textMuted, fontSize: theme.font.sizeSm},
  pillTextActive: {color: theme.colors.primary, fontWeight: theme.font.weightBold},
  installedBlock: {marginTop: 14},
  installedRow: {color: theme.colors.textSecondary, fontSize: theme.font.sizeXs, lineHeight: 18},
  hint: {color: theme.colors.textMuted, fontSize: theme.font.sizeXs, marginTop: 12, lineHeight: 18},
});
