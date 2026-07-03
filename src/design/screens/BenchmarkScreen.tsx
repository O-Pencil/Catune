/**
 * @file BenchmarkScreen.tsx
 * @description 模型基准测试：可编辑 Prompt、输出展示、推理指标（录像证真端侧模型）。
 *
 * [WHO] 导出 `BenchmarkPanel`
 * [FROM] 依赖 `react`、`react-native`(Pressable/TextInput)、`../../mnn/nativeDebugClient`、`../theme`、`../primitives/Card`、`../i18n`
 * [TO] 被 SettingsScreen 嵌入（settings.assess 区域）
 * [HERE] src/design/screens/BenchmarkScreen.tsx · 模型基准测试面板
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {
  getMnnStatus,
  inferMnnText,
  isCatuneMnnAvailable,
  MnnBenchRun,
  MnnBenchResult,
  MnnMetrics,
  MnnStatus,
  runMnnBenchmark,
} from '../../mnn/nativeDebugClient';
import {colors, theme} from '../theme';
import {Card} from '@/design/primitives';
import {useT} from '../i18n';

type MetricScope = 'idle' | 'infer' | 'bench';

type T = (key: string, vars?: Record<string, string | number>) => string;

/** PREVIEW_STATUS 模板：用户可见的 3 字段（activeModelId/modelDir/readiness）按 locale 替换；
 *  boolean/numeric 字段无关 locale。
 *  调用方在组件内 useMemo(() => buildPreviewStatus(t), [t]) 构造。 */
const PREVIEW_STATUS_TEMPLATE = {
  nativeLibLoaded: false,
  modelLoaded: false,
  configExists: false,
  cpu: {
    sme2Hw: false,
    libSme2: false,
    backend: '—',
  },
} as const;

function buildPreviewStatus(t: (k: string) => string): MnnStatus {
  return {
    ...PREVIEW_STATUS_TEMPLATE,
    activeModelId: t('benchmark.preview.activeModelId'),
    modelDir: t('benchmark.preview.modelDir'),
    cpu: {...PREVIEW_STATUS_TEMPLATE.cpu, readiness: t('benchmark.preview.readiness')},
  };
}

type BenchmarkPanelProps = {refreshKey?: number};

const bad = '#C20A0A';

/** 毫秒：小值保留 1 位小数，避免 TTFT 被四舍五入成 0。 */
function formatDurationMs(ms: number | null | undefined, t: T): string {
  if (ms == null || Number.isNaN(ms)) {
    return '—';
  }
  if (ms > 0 && ms < 1) {
    return t('benchmark.duration.short');
  }
  if (ms < 100) {
    return t('benchmark.duration.fmt', {ms: ms.toFixed(1)});
  }
  return t('benchmark.duration.fmt', {ms: Math.round(ms)});
}

function formatTps(tps: number | null | undefined, t: T): string {
  if (tps == null || Number.isNaN(tps)) {
    return '—';
  }
  return t('benchmark.tps.fmt', {n: tps.toFixed(2)});
}

function formatRunDetail(run: MnnBenchRun, t: T): string {
  const m = run.metrics;
  return t('benchmark.run.fmt', {
    tps: formatTps(m?.decodeTps, t),
    tokens: m?.tokensGenerated ?? '—',
    total: formatDurationMs(run.inferenceMs, t),
    prefill: formatDurationMs(m?.prefillMs, t),
    decode: formatDurationMs(m?.decodeMs, t),
  });
}

const styles = StyleSheet.create({
  card: {marginBottom: theme.spacing.md},
  cardTitle: {color: theme.colors.textPrimary, fontSize: theme.font.sizeMd, fontFamily: theme.font.displayMedium},
  subtitle: {color: theme.colors.textMuted, fontSize: theme.font.sizeXs, marginTop: theme.spacing.sm, lineHeight: 17},
  previewBanner: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewBannerText: {color: theme.colors.textSecondary, fontSize: theme.font.sizeXs, lineHeight: 17},
  body: {marginTop: theme.spacing.md2},
  sectionLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sizeXs,
    fontFamily: theme.font.displayMedium,
    marginTop: 14,
    marginBottom: theme.spacing.sm,
  },
  sectionHint: {
    color: theme.colors.textSecondary,
    fontSize: theme.font.sizeXs,
    lineHeight: 16,
    marginBottom: theme.spacing.sm2,
  },
  promptInput: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md2,
    paddingVertical: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: theme.font.sizeSm,
    lineHeight: 20,
    backgroundColor: theme.colors.surface,
    textAlignVertical: 'top',
  },
  inputPreview: {backgroundColor: '#FAFAFA'},
  ioBox: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: '#FAFAFA',
    padding: theme.spacing.md2,
    minHeight: 88,
  },
  ioBoxPreview: {opacity: 0.85},
  outputText: {color: theme.colors.textPrimary, fontSize: theme.font.sizeSm, lineHeight: 22},
  outputPlaceholder: {color: theme.colors.textMuted, fontSize: theme.font.sizeXs, lineHeight: 20},
  metricGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm2},
  metricTile: {
    width: '31%',
    minWidth: 96,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm2,
    paddingHorizontal: theme.spacing.sm2,
    backgroundColor: theme.colors.surface,
  },
  metricLabel: {color: theme.colors.textMuted, fontSize: theme.font.sizeXs, fontWeight: theme.font.weightBold},
  metricValue: {color: theme.colors.textPrimary, fontSize: theme.font.sizeSm, fontWeight: theme.font.weightBold, marginTop: theme.spacing.xs},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md2,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {color: theme.colors.textMuted, fontSize: theme.font.sizeXs, flexShrink: 0},
  infoValue: {
    color: theme.colors.textSecondary,
    fontSize: theme.font.sizeXs,
    fontWeight: theme.font.weightBold,
    flex: 1,
    textAlign: 'right',
  },
  btnRow: {flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md},
  btn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  btnPrimary: {borderColor: theme.colors.primary, backgroundColor: '#FCEAE0'},
  btnDisabled: {opacity: 0.5},
  btnText: {color: theme.colors.textPrimary, fontSize: theme.font.sizeXs, fontWeight: theme.font.weightBold},
  btnTextPrimary: {color: theme.colors.primary},
  errorText: {color: bad, fontSize: theme.font.sizeXs, marginTop: theme.spacing.sm2, lineHeight: 17},
});

function MetricTile({label, value}: {label: string; value: string}): React.JSX.Element {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function InfoRow({label, value}: {label: string; value: string}): React.JSX.Element {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

export function BenchmarkPanel({refreshKey = 0}: BenchmarkPanelProps): React.JSX.Element {
  const t = useT();
  const nativeReady = isCatuneMnnAvailable();
  const previewMode = !nativeReady;
  // preview status 按 locale 渲染（activeModelId/modelDir/readiness 用户可见字段）
  const previewStatus = useMemo<MnnStatus>(() => buildPreviewStatus(t), [t]);

  // 默认 prompt 按 locale 切换：切到新 locale 且用户未改过时同步替换。
  // `userEdited` 标记用户是否在 TextInput 上动过 prompt；切换 locale 不覆盖用户改动。
  const defaultPrompt = t('benchmark.promptDefault');
  const [prompt, setPrompt] = useState(defaultPrompt);
  const lastDefaultRef = useRef(defaultPrompt);
  const userEditedRef = useRef(false);
  useEffect(() => {
    // locale 变化导致 default 变化：若用户没改过 prompt，把 default 同步到当前 locale
    if (defaultPrompt !== lastDefaultRef.current) {
      lastDefaultRef.current = defaultPrompt;
      if (!userEditedRef.current) {
        setPrompt(defaultPrompt);
      }
    }
  }, [defaultPrompt]);
  const [status, setStatus] = useState<MnnStatus | null>(previewMode ? previewStatus : null);
  const [output, setOutput] = useState('');
  const [metrics, setMetrics] = useState<MnnMetrics | null>(null);
  const [inferenceMs, setInferenceMs] = useState<number | null>(null);
  const [bench, setBench] = useState<MnnBenchResult | null>(null);
  const [metricScope, setMetricScope] = useState<MetricScope>('idle');
  const [busy, setBusy] = useState<'' | 'status' | 'infer' | 'bench'>('');
  const [error, setError] = useState<string | null>(null);

  const yesNo = useCallback(
    (v?: boolean) => (v === undefined ? '—' : v ? t('common.yes') : t('common.no')),
    [t],
  );

  const refresh = useCallback(async () => {
    if (!nativeReady) {
      setStatus(previewStatus);
      return;
    }
    setBusy('status');
    setError(null);
    try {
      setStatus(await getMnnStatus());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  }, [nativeReady, previewStatus]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  const trimmedPrompt = prompt.trim();
  const actionsDisabled = previewMode || busy !== '';

  const lastBenchTimed = useMemo(
    () => [...(bench?.runs ?? [])].reverse().find(r => r.label === 'timed'),
    [bench],
  );

  const runInfer = async () => {
    if (previewMode || !nativeReady || !trimmedPrompt) {
      return;
    }
    setBusy('infer');
    setError(null);
    setBench(null);
    setMetricScope('infer');
    try {
      const result = await inferMnnText(trimmedPrompt);
      setOutput(result.rawOutput ?? '');
      setMetrics(result.metrics ?? null);
      setInferenceMs(result.inferenceMs ?? null);
      setStatus(await getMnnStatus());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  };

  const runBench = async () => {
    if (previewMode || !nativeReady || !trimmedPrompt) {
      return;
    }
    setBusy('bench');
    setError(null);
    setMetricScope('bench');
    try {
      const result = await runMnnBenchmark(trimmedPrompt);
      setBench(result);
      const lastTimed = [...(result.runs ?? [])].reverse().find(r => r.label === 'timed');
      if (lastTimed?.rawOutput) {
        setOutput(lastTimed.rawOutput);
      }
      if (lastTimed?.metrics) {
        setMetrics(lastTimed.metrics);
        setInferenceMs(lastTimed.inferenceMs ?? null);
      }
      setStatus(await getMnnStatus());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  };

  const cpu = status?.cpu;
  const backend = metrics?.backend ?? bench?.summary?.backend ?? cpu?.backend ?? '—';
  const timedRunCount = (bench?.runs ?? []).filter(r => r.label === 'timed').length;
  const metricSectionTitle =
    metricScope === 'bench' && lastBenchTimed?.run != null
      ? t('benchmark.section.benchTitle', {n: lastBenchTimed.run})
      : metricScope === 'infer'
        ? t('benchmark.section.inferTitle')
        : t('benchmark.section.defaultTitle');

  const metricSectionHint =
    metricScope === 'bench'
      ? t('benchmark.section.benchHint', {n: lastBenchTimed?.run ?? '?'})
      : metricScope === 'infer'
        ? t('benchmark.section.inferHint')
        : null;

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>{t('benchmark.title')}</Text>
      <Text style={styles.subtitle}>{t('benchmark.subtitle')}</Text>

      {previewMode ? (
        <View style={styles.previewBanner}>
          <Text style={styles.previewBannerText}>{t('benchmark.banner')}</Text>
        </View>
      ) : null}

      <View style={styles.body}>
        <Text style={styles.sectionLabel}>{t('benchmark.promptLabel')}</Text>
        <TextInput
          style={[styles.promptInput, previewMode && styles.inputPreview]}
          value={prompt}
          onChangeText={text => {
            userEditedRef.current = true;
            setPrompt(text);
          }}
          multiline
          placeholder={t('benchmark.promptPlaceholder')}
          placeholderTextColor={colors.textMuted}
          editable={busy === ''}
        />

        <View style={styles.btnRow}>
          <Pressable style={[styles.btn, actionsDisabled && styles.btnDisabled]} disabled={actionsDisabled} onPress={refresh}>
            <Text style={styles.btnText}>{busy === 'status' ? t('benchmark.busy.status') : t('benchmark.action.refresh')}</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnPrimary, (actionsDisabled || !trimmedPrompt) && styles.btnDisabled]}
            disabled={actionsDisabled || !trimmedPrompt}
            onPress={runInfer}>
            <Text style={[styles.btnText, styles.btnTextPrimary]}>{busy === 'infer' ? t('benchmark.busy.infer') : t('benchmark.action.infer')}</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnPrimary, (actionsDisabled || !trimmedPrompt) && styles.btnDisabled]}
            disabled={actionsDisabled || !trimmedPrompt}
            onPress={runBench}>
            <Text style={[styles.btnText, styles.btnTextPrimary]}>{busy === 'bench' ? t('benchmark.busy.bench') : t('benchmark.action.bench')}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>{t('benchmark.outputLabel')}</Text>
        <View style={[styles.ioBox, previewMode && styles.ioBoxPreview]}>
          <Text style={output ? styles.outputText : styles.outputPlaceholder}>
            {previewMode
              ? t('benchmark.bannerOutput')
              : output || t('benchmark.bannerCta')}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>{metricSectionTitle}</Text>
        {metricSectionHint ? <Text style={styles.sectionHint}>{metricSectionHint}</Text> : null}
        <View style={styles.metricGrid}>
          <MetricTile label={t('benchmark.metric.ttft')} value={formatDurationMs(metrics?.ttftMs, t)} />
          <MetricTile label={t('benchmark.metric.prefill')} value={formatDurationMs(metrics?.prefillMs, t)} />
          <MetricTile label={t('benchmark.metric.decode')} value={formatDurationMs(metrics?.decodeMs, t)} />
          <MetricTile label={t('benchmark.metric.total')} value={formatDurationMs(inferenceMs, t)} />
          <MetricTile label={t('benchmark.metric.tps')} value={formatTps(metrics?.decodeTps, t)} />
          <MetricTile label={t('benchmark.metric.tokens')} value={metrics?.tokensGenerated != null ? String(metrics.tokensGenerated) : '—'} />
          <MetricTile label={t('benchmark.metric.backend')} value={backend} />
          <MetricTile label={t('benchmark.metric.modelLoaded')} value={yesNo(status?.modelLoaded)} />
        </View>

        {metricScope === 'bench' && bench?.summary?.avgDecodeTps != null ? (
          <>
            <Text style={styles.sectionLabel}>{t('benchmark.summary.title')}</Text>
            <InfoRow
              label={t('benchmark.summary.avgTps', {n: timedRunCount})}
              value={formatTps(bench.summary.avgDecodeTps, t)}
            />
            <InfoRow label={t('benchmark.summary.scope')} value={t('benchmark.summary.scopeHint')} />
          </>
        ) : null}

        {bench?.runs?.length ? (
          <>
            <Text style={styles.sectionLabel}>{t('benchmark.runs.title')}</Text>
            {bench.runs.map((run, index) => (
              <InfoRow
                key={index}
                label={t('benchmark.run.labelFmt', {n: run.run ?? '?', label: run.label ?? ''})}
                value={formatRunDetail(run, t)}
              />
            ))}
          </>
        ) : null}

        <Text style={styles.sectionLabel}>{t('benchmark.info.title')}</Text>
        <InfoRow label={t('benchmark.info.activeModel')} value={status?.activeModelId ?? '—'} />
        <InfoRow label={t('benchmark.info.modelDir')} value={status?.modelDir ?? '—'} />
        <InfoRow label={t('benchmark.info.sme2')} value={`${yesNo(cpu?.sme2Hw)} / ${yesNo(cpu?.libSme2)}`} />
        <InfoRow label={t('benchmark.info.readiness')} value={cpu?.readiness ?? '—'} />
        {status?.loadError ? <Text style={styles.errorText}>{status.loadError}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </Card>
  );
}
