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

/** 5 个成长阶段（与 PlantScreen 一致）。 */
export const STAGE_NAMES = ['Seed', 'Sprout', 'Sapling', 'Bud', 'Fruit'] as const;
/** 积分达到该档即进入对应阶段下标（升序）。起始 50 分 → Sapling。 */
export const STAGE_THRESHOLDS = [0, 20, 50, 90, 140] as const;

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
};

export type DailyGrowthSummary = {
  date: string;
  hasData: boolean;
  score: number;
  effectiveMinutes: number;
  goodMinutes: number;
  abnormalCount: number;
  goodCount: number;
};

export type GrowthTracker = {
  getState: () => GrowthState;
  subscribe: (cb: (s: GrowthState) => void) => () => void;
  /** 开始订阅引擎 + 启动良好坐姿计时心跳。 */
  start: () => Promise<void>;
  stop: () => void;
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
};

const INITIAL_POINTS = 50;
const GOOD_AWARD_POINTS = 5;
const LOG_CAP = 12;

/** 异常入态扣分 + 日志文案 i18n key。 */
const PENALTY: Partial<Record<PostureName, {delta: number; key: string}>> = {
  SLUMPED: {delta: -5, key: 'plant.event.slumping'},
  TECH_NECK: {delta: -4, key: 'plant.event.forwardHead'},
  LEFT_LEAN: {delta: -3, key: 'plant.event.leaning'},
};

function clampPoints(p: number): number {
  return Math.max(0, Math.min(999, Math.round(p)));
}

function stageOf(points: number): number {
  let stage = 0;
  for (let i = 0; i < STAGE_THRESHOLDS.length; i += 1) {
    if (points >= STAGE_THRESHOLDS[i]) {
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
  const goodAwardIntervalMs = opts.goodAwardIntervalMs ?? 60_000;
  const tickMs = opts.tickMs ?? 5_000;
  const getLocale = opts.getLocale ?? ((): Locale => 'en');
  const now = opts.now ?? (() => new Date());

  let points = INITIAL_POINTS;
  let log: GrowthEvent[] = [];
  let nextId = 1;
  let activeDate = todayKey(now());

  let currentPosture: PostureName = 'NORMAL';
  let goodAccumMs = 0; // 当前连续良好坐姿累计（满一档发分后扣回）
  let totalGoodMs = 0; // 仅用于日志文案展示「累计 N 分钟」
  let effectiveMs = 0;
  let abnormalCount = 0;
  let goodCount = 0;
  let hasReceivedSample = false;
  let lastTickAt = now().getTime();

  let unsubEngine: (() => void) | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let starting: Promise<void> | null = null;

  const listeners = new Set<(s: GrowthState) => void>();

  const dailyScore = () => (effectiveMs > 0 ? Math.round((totalGoodMs * 100) / effectiveMs) : 0);
  const snapshot = (): GrowthState => {
    const stage = stageOf(points);
    return {
      points,
      stage,
      stageName: stageNameAt(stage, getLocale()),
      log,
      today: {
        date: activeDate,
        hasData: effectiveMs > 0,
        score: dailyScore(),
        effectiveMinutes: Math.floor(effectiveMs / 60_000),
        goodMinutes: Math.floor(totalGoodMs / 60_000),
        abnormalCount,
        goodCount,
      },
    };
  };
  const emit = () => {
    const s = snapshot();
    listeners.forEach(cb => cb(s));
  };

  const persistToday = () => {
    if (effectiveMs <= 0) return;
    upsertTodaySnapshot({
      score: dailyScore(),
      growthPoints: points,
      effectiveMs,
      goodMs: totalGoodMs,
      goodMinutes: Math.floor(totalGoodMs / 60_000),
      abnormalCount,
      goodCount,
    }, now()).catch(() => {});
  };

  const resetForNewDay = (date: Date) => {
    activeDate = todayKey(date);
    points = INITIAL_POINTS;
    log = [];
    goodAccumMs = 0;
    totalGoodMs = 0;
    effectiveMs = 0;
    abnormalCount = 0;
    goodCount = 0;
    lastTickAt = date.getTime();
    rolloverIfNewDay(date).catch(() => {});
  };

  const ensureCurrentDay = (date: Date) => {
    if (todayKey(date) !== activeDate) resetForNewDay(date);
  };

  const pushEvent = (delta: number, action: string) => {
    const date = now();
    ensureCurrentDay(date);
    points = clampPoints(points + delta);
    const event: GrowthEvent = {id: nextId++, time: nowLabel(date), action, delta, score: points};
    log = [event, ...log].slice(0, LOG_CAP);
    if (delta < 0) abnormalCount += 1;
    if (delta > 0) goodCount += 1;
    persistToday();
    emit();
  };

  // 只在「姿态类别变化」时动作：异常入态扣分；良好计时交给心跳。
  const onSample = (posture: PostureName) => {
    if (posture === currentPosture) {
      return;
    }
    currentPosture = posture;
    if (posture !== 'NORMAL') {
      goodAccumMs = 0; // 中断良好连击
      const pen = PENALTY[posture];
      if (pen) {
        pushEvent(pen.delta, tr(getLocale(), pen.key));
      }
    }
  };

  const onTick = () => {
    const date = now();
    ensureCurrentDay(date);
    const elapsedMs = Math.min(Math.max(0, date.getTime() - lastTickAt), tickMs * 2);
    lastTickAt = date.getTime();
    if (!hasReceivedSample || currentPosture === 'OFFLINE') {
      return;
    }
    effectiveMs += elapsedMs;
    if (currentPosture !== 'NORMAL') {
      persistToday();
      emit();
      return;
    }
    goodAccumMs += elapsedMs;
    totalGoodMs += elapsedMs;
    if (goodAccumMs >= goodAwardIntervalMs) {
      goodAccumMs -= goodAwardIntervalMs;
      const minutes = Math.max(1, Math.round(totalGoodMs / 60_000));
      pushEvent(GOOD_AWARD_POINTS, tr(getLocale(), 'plant.event.goodPosture', {min: minutes}));
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
          points = saved.growthPoints;
          effectiveMs = saved.effectiveMs;
          totalGoodMs = saved.goodMs;
          abnormalCount = saved.abnormalCount;
          goodCount = saved.goodCount;
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
        timer = setInterval(onTick, tickMs);
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
  };
}
