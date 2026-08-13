/**
 * @file growth.ts
 * @description 植物成长累加器：订阅 PostureEngine，把真实坐姿随时间转成「积分 + 成长阶段 + 日志」，驱动 Plant 页。
 *   纪律：积分由「姿态状态 + 持续时长」驱动，不按 10Hz 帧累加。良好坐姿按心跳周期累计发积分；
 *   异常「入态」按状态转移扣分并记一条日志（不会每帧刷屏）。OFFLINE 不计分只忽略。
 *
 * [WHO] 导出 `createGrowthTracker(engine, opts?)`、`GrowthState`、`GrowthEvent`、`GrowthTracker`、`STAGE_NAMES`、`STAGE_THRESHOLDS`
 * [FROM] 依赖 ./engine(PostureEngine 类型)、./types(PostureName)、../design/i18n(tr, Locale)
 * [TO] 被 App.tsx 启动并订阅，结果传给 src/design/screens/PlantScreen
 * [HERE] src/posture/growth.ts · 植物成长累加器（真实数据 → 积分/阶段/日志）
 */
import {tr, type Locale} from '../design/i18n';
import type {PostureEngine} from './engine';
import {PostureName} from './types';
import {
  getCachedHistory,
  loadDailyHistory,
  rolloverIfNewDay,
  todayKey,
  upsertTodaySnapshot,
} from '../platform/dailyHistory';
import {pad} from './utils';
import type {PostureAction} from './types';
import {
  PRODUCTION_GROWTH_SCHEMA,
  type GrowthScoringSchema,
  type GrowthSchemaId,
  validateGrowthScoringSchema,
} from './growthScoringSchema';

/** 5 个成长阶段（与 PlantScreen 一致）。 */
export const STAGE_NAMES = ['Seed', 'Sprout', 'Sapling', 'Bud', 'Fruit'] as const;
/** 积分达到该档即进入对应阶段下标（升序）。起始 50 分 → Sapling。 */
export const STAGE_THRESHOLDS = PRODUCTION_GROWTH_SCHEMA.stages;

export type GrowthEvent = {
  id: number;
  time: string; // 'MM-DD HH:mm'
  action: string;
  delta: number;
  score: number; // 该事件后的累计积分
};

export type GrowthState = {
  points: number;
  stage: number; // 0..4
  stageName: string;
  log: GrowthEvent[]; // 最新在前，封顶 LOG_CAP
  today: DailyGrowthSummary;
  schemaId: GrowthSchemaId;
};

export type DailyGrowthSummary = {
  date: string;
  hasData: boolean;
  score: number;
  effectiveMinutes: number;
  goodMinutes: number;
  abnormalCount: number;
  goodCount: number;
  goodPoints: number;
  penaltyPoints: number;
  trainingPoints: number;
  trainingCount: number;
};

export type GrowthTracker = {
  getState: () => GrowthState;
  subscribe: (cb: (s: GrowthState) => void) => () => void;
  /** 开始订阅引擎 + 启动良好坐姿计时心跳。 */
  start: () => Promise<void>;
  stop: () => void;
  setSchema: (schema: GrowthScoringSchema) => void;
  getSchema: () => GrowthScoringSchema;
  recordTraining: (action: PostureAction) => boolean;
};

export type GrowthOptions = {
  /** 连续良好坐姿每满该时长发一次积分（默认 60s）。 */
  goodAwardIntervalMs?: number;
  /** 心跳间隔（默认 5s，越小良好计时越精细）。 */
  tickMs?: number;
  /** 当前 locale getter：用于 event.action 文案 / stageName。 */
  getLocale?: () => Locale;
  /** 测试注入时钟；生产默认当前本地时间。 */
  now?: () => Date;
  schema?: GrowthScoringSchema;
};

type GrowthRuntime = {
  activeDate: string;
  points: number;
  log: GrowthEvent[];
  goodAccumMs: number;
  totalGoodMs: number;
  effectiveMs: number;
  abnormalCount: number;
  goodCount: number;
  goodPoints: number;
  penaltyPoints: number;
  trainingPoints: number;
  trainingCount: number;
  trainingCredits: Array<[PostureAction, number]>;
};

const LOG_CAP = 12;

function clampPoints(p: number, schema: GrowthScoringSchema): number {
  return Math.max(schema.score.min, Math.min(schema.score.max, Math.round(p)));
}

function stageOf(points: number, thresholds: readonly number[]): number {
  let stage = 0;
  for (let i = 0; i < thresholds.length; i += 1) {
    if (points >= thresholds[i]) {
      stage = i;
    }
  }
  return stage;
}

function nowLabel(d: Date): string {
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function stageNameAt(stage: number, locale: Locale): string {
  const key = `plant.stageNames.${STAGE_NAMES[stage]?.toLowerCase() ?? 'seed'}`;
  const v = tr(locale, key);
  return v === key ? STAGE_NAMES[stage] : v;
}

export function createGrowthTracker(engine: PostureEngine, opts: GrowthOptions = {}): GrowthTracker {
  const getLocale = opts.getLocale ?? ((): Locale => 'en');
  const now = opts.now ?? (() => new Date());
  let schema = validateGrowthScoringSchema(opts.schema ?? {
    ...PRODUCTION_GROWTH_SCHEMA,
    goodPosture: {
      ...PRODUCTION_GROWTH_SCHEMA.goodPosture,
      intervalMs: opts.goodAwardIntervalMs ?? PRODUCTION_GROWTH_SCHEMA.goodPosture.intervalMs,
    },
    timing: {
      ...PRODUCTION_GROWTH_SCHEMA.timing,
      tickMs: opts.tickMs ?? PRODUCTION_GROWTH_SCHEMA.timing.tickMs,
      maxCatchUpMs: (opts.tickMs ?? PRODUCTION_GROWTH_SCHEMA.timing.tickMs) * 2,
    },
  });

  let points = schema.score.initial;
  let log: GrowthEvent[] = [];
  let nextId = 1;
  let activeDate = todayKey(now());

  let currentPosture: PostureName = 'NORMAL';
  let goodAccumMs = 0; // 当前连续良好坐姿累计（满一档发分后扣回）
  let totalGoodMs = 0; // 仅用于日志文案展示「累计 N 分钟」
  let effectiveMs = 0;
  let abnormalCount = 0;
  let goodCount = 0;
  let goodPoints = 0;
  let penaltyPoints = 0;
  let trainingPoints = 0;
  let trainingCount = 0;
  let abnormalEpisodeMs = 0;
  let abnormalAccumMs = 0;
  const trainingCredits = new Map<PostureAction, number>();
  let productionBackup: GrowthRuntime | null = null;
  let hasReceivedSample = false;
  let lastTickAt = now().getTime();

  let unsubEngine: (() => void) | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let starting: Promise<void> | null = null;

  const listeners = new Set<(s: GrowthState) => void>();

  const dailyScore = () => (effectiveMs > 0 ? Math.round((totalGoodMs * 100) / effectiveMs) : 0);
  const snapshot = (): GrowthState => {
    const stage = stageOf(points, schema.stages);
    return {
      points,
      stage,
      stageName: stageNameAt(stage, getLocale()),
      log,
      schemaId: schema.id,
      today: {
        date: activeDate,
        hasData: effectiveMs > 0 || trainingCount > 0,
        score: dailyScore(),
        effectiveMinutes: Math.floor(effectiveMs / 60_000),
        goodMinutes: Math.floor(totalGoodMs / 60_000),
        abnormalCount,
        goodCount,
        goodPoints,
        penaltyPoints,
        trainingPoints,
        trainingCount,
      },
    };
  };
  const emit = () => {
    const s = snapshot();
    listeners.forEach(cb => cb(s));
  };

  const persistToday = () => {
    if (schema.id === 'demo' || (effectiveMs <= 0 && trainingCount <= 0)) return;
    upsertTodaySnapshot({
      score: dailyScore(),
      growthPoints: points,
      effectiveMs,
      goodMs: totalGoodMs,
      goodMinutes: Math.floor(totalGoodMs / 60_000),
      abnormalCount,
      goodCount,
      goodPoints,
      penaltyPoints,
      trainingPoints,
      trainingCount,
    }, now()).catch(() => {});
  };

  const resetForNewDay = (date: Date) => {
    activeDate = todayKey(date);
    points = schema.score.initial;
    log = [];
    goodAccumMs = 0;
    totalGoodMs = 0;
    effectiveMs = 0;
    abnormalCount = 0;
    goodCount = 0;
    goodPoints = 0;
    penaltyPoints = 0;
    trainingPoints = 0;
    trainingCount = 0;
    abnormalEpisodeMs = 0;
    abnormalAccumMs = 0;
    trainingCredits.clear();
    lastTickAt = date.getTime();
    rolloverIfNewDay(date).catch(() => {});
  };

  const ensureCurrentDay = (date: Date) => {
    if (todayKey(date) !== activeDate) resetForNewDay(date);
  };

  const captureRuntime = (): GrowthRuntime => ({
    activeDate, points, log, goodAccumMs, totalGoodMs, effectiveMs, abnormalCount, goodCount,
    goodPoints, penaltyPoints, trainingPoints, trainingCount,
    trainingCredits: [...trainingCredits.entries()],
  });

  const restoreRuntime = (runtime: GrowthRuntime) => {
    ({activeDate, points, log, goodAccumMs, totalGoodMs, effectiveMs, abnormalCount, goodCount,
      goodPoints, penaltyPoints, trainingPoints, trainingCount} = runtime);
    trainingCredits.clear();
    runtime.trainingCredits.forEach(([action, timestamp]) => trainingCredits.set(action, timestamp));
    abnormalEpisodeMs = 0;
    abnormalAccumMs = 0;
  };

  const pushEvent = (delta: number, action: string, kind: 'good' | 'penalty' | 'training') => {
    const date = now();
    ensureCurrentDay(date);
    points = clampPoints(points + delta, schema);
    const event: GrowthEvent = {id: nextId++, time: nowLabel(date), action, delta, score: points};
    log = [event, ...log].slice(0, LOG_CAP);
    if (kind === 'penalty') abnormalCount += 1;
    if (kind === 'good') goodCount += 1;
    persistToday();
    emit();
  };

  // 只在「姿态类别变化」时动作：异常入态扣分；良好计时交给心跳。
  const onSample = (posture: PostureName) => {
    if (posture === currentPosture) {
      return;
    }
    currentPosture = posture;
    if (posture === 'NORMAL') {
      abnormalEpisodeMs = 0;
      abnormalAccumMs = 0;
    } else {
      goodAccumMs = 0;
    }
  };

  const onTick = () => {
    const date = now();
    ensureCurrentDay(date);
    const elapsedMs = Math.min(Math.max(0, date.getTime() - lastTickAt), schema.timing.maxCatchUpMs);
    lastTickAt = date.getTime();
    if (!hasReceivedSample || currentPosture === 'OFFLINE') {
      return;
    }
    effectiveMs += elapsedMs;
    if (currentPosture !== 'NORMAL') {
      if (schema.abnormalPosture.postures.includes(currentPosture)) {
        const before = abnormalEpisodeMs;
        abnormalEpisodeMs += elapsedMs;
        abnormalAccumMs += Math.max(0, abnormalEpisodeMs - schema.abnormalPosture.graceMs) -
          Math.max(0, before - schema.abnormalPosture.graceMs);
        while (
          abnormalAccumMs >= schema.abnormalPosture.intervalMs &&
          penaltyPoints < schema.abnormalPosture.dailyDeductionCap
        ) {
          abnormalAccumMs -= schema.abnormalPosture.intervalMs;
          const deduction = Math.min(
            Math.abs(schema.abnormalPosture.pointsPerInterval),
            schema.abnormalPosture.dailyDeductionCap - penaltyPoints,
          );
          penaltyPoints += deduction;
          pushEvent(-deduction, tr(getLocale(), 'plant.event.abnormalDuration'), 'penalty');
        }
      }
      persistToday();
      emit();
      return;
    }
    abnormalEpisodeMs = 0;
    abnormalAccumMs = 0;
    goodAccumMs += elapsedMs;
    totalGoodMs += elapsedMs;
    if (goodAccumMs >= schema.goodPosture.intervalMs && goodPoints < schema.goodPosture.contributionCap) {
      goodAccumMs -= schema.goodPosture.intervalMs;
      const minutes = Math.max(1, Math.round(totalGoodMs / 60_000));
      const award = Math.min(schema.goodPosture.pointsPerInterval, schema.goodPosture.contributionCap - goodPoints);
      goodPoints += award;
      pushEvent(award, tr(getLocale(), 'plant.event.goodPosture', {min: minutes}), 'good');
      return;
    }
    persistToday();
    emit();
  };

  return {
    getState: snapshot,
    subscribe(cb) {
      listeners.add(cb);
      cb(snapshot());
      return () => listeners.delete(cb);
    },
    start() {
      if (starting) return starting;
      starting = (async () => {
        await loadDailyHistory();
        const date = now();
        await rolloverIfNewDay(date);
        activeDate = todayKey(date);
        const saved = getCachedHistory().days.find(day => day.date === activeDate);
        if (saved) {
          points = clampPoints(saved.growthPoints, schema);
          effectiveMs = saved.effectiveMs;
          totalGoodMs = saved.goodMs;
          abnormalCount = saved.abnormalCount;
          goodCount = saved.goodCount;
          goodPoints = saved.goodPoints;
          penaltyPoints = saved.penaltyPoints;
          trainingPoints = saved.trainingPoints;
          trainingCount = saved.trainingCount;
        }
        currentPosture = engine.getState().posture;
        lastTickAt = date.getTime();
        let initialEmission = true;
        unsubEngine = engine.subscribe(s => {
          if (initialEmission) {
            initialEmission = false;
            currentPosture = s.posture;
            return;
          }
          hasReceivedSample = true;
          onSample(s.posture);
        });
        timer = setInterval(onTick, schema.timing.tickMs);
        emit();
      })();
      return starting;
    },
    stop() {
      unsubEngine?.();
      unsubEngine = null;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      persistToday();
      starting = null;
    },
    setSchema(nextSchema) {
      const next = validateGrowthScoringSchema(nextSchema);
      if (next.id === schema.id) return;
      if (schema.id === 'production') {
        persistToday();
        productionBackup = captureRuntime();
      }
      schema = next;
      if (schema.id === 'production' && productionBackup?.activeDate === todayKey(now())) {
        restoreRuntime(productionBackup);
        productionBackup = null;
      } else {
        const date = now();
        activeDate = todayKey(date);
        points = schema.score.initial;
        log = [];
        goodAccumMs = 0;
        totalGoodMs = 0;
        effectiveMs = 0;
        abnormalCount = 0;
        goodCount = 0;
        goodPoints = 0;
        penaltyPoints = 0;
        trainingPoints = 0;
        trainingCount = 0;
        abnormalEpisodeMs = 0;
        abnormalAccumMs = 0;
        trainingCredits.clear();
      }
      lastTickAt = now().getTime();
      if (timer) {
        clearInterval(timer);
        timer = setInterval(onTick, schema.timing.tickMs);
      }
      emit();
    },
    getSchema() {
      return schema;
    },
    recordTraining(action) {
      const date = now();
      ensureCurrentDay(date);
      const previous = trainingCredits.get(action) ?? 0;
      if (
        trainingCount >= schema.training.dailyCompletionCap ||
        trainingPoints >= schema.training.contributionCap ||
        date.getTime() - previous < schema.training.sameActionCooldownMs
      ) {
        return false;
      }
      const award = Math.min(schema.training.pointsPerCompletion, schema.training.contributionCap - trainingPoints);
      trainingCredits.set(action, date.getTime());
      trainingCount += 1;
      trainingPoints += award;
      pushEvent(award, tr(getLocale(), 'plant.event.training'), 'training');
      return true;
    },
  };
}
