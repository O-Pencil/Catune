/**
 * @file dailyReport.ts
 * @description 日报 / 周报聚合：基于 growth（今日实时）+ dailyHistory（持久化历史）推导报告。
 *   - 日报：有效监测时间内的不驼背分、不驼背时长、异常次数、Streak、AI 评论
 *   - 周报：最近 7 天每日不驼背分 + AI 周总结
 *   - 全部真实数据，无假数据；缺数据时返回 hasData=false 让 UI 显示无数据态。
 *
 * [WHO] 导出 `buildDailyReport` / `buildWeeklyReport` / `DailyReport` / `WeeklyReport`
 * [FROM] 依赖 ./growth(GrowthState)、./dailyHistory(DailyHistory/getWeekSnapshots/loadDailyHistory)、../design/i18n
 * [TO] 被 src/design/components/DailyReportPanel / WeeklyReportPanel 消费
 * [HERE] src/posture/dailyReport.ts · 日报/周报聚合
 */
import {tr, type Locale} from '../design/i18n';
import {GrowthState} from './growth';
import {
  DailyHistory,
  getCachedHistory,
  getWeekSnapshots,
  todayKey,
  WeekDay,
} from '../platform/dailyHistory';

export type DailyReport = {
  hasData: boolean;
  score: number;
  effectiveMinutes: number;
  goodMinutes: number;
  abnormalCount: number;
  goodCount: number;
  streakDays: number;
  aiComment: string;
};

export type WeeklyReport = {
  hasData: boolean;
  week: WeekDay[];
  /** 本周已存在快照的天数（0..7）。 */
  recordedDays: number;
  /** 有记录日期的平均姿态评分。 */
  averageScore: number;
  /** AI 周总结。 */
  aiSummary: string;
};

// 重新导出 WeekDay 给 UI 组件用（避免 UI 直接依赖 dailyHistory）
export type {WeekDay} from '../platform/dailyHistory';

// ─── 日报常量（评分边界） ─────────────────────────────────────────────────
// 无异常 + 多少条正向日志算"great"（而非"steady"）。
const DAILY_GREAT_GOOD_LOG_MIN = 4;
// 周报"good 占绝对多数"判定：good / abnormal 至少 2 倍。
const WEEKLY_GOOD_DOMINANCE_RATIO = 2;

// ─── 日报 ──────────────────────────────────────────────────────────────────

/**
 * 日报：今日不驼背分 + 异常次数 + 有效监测时长 + Streak + AI 评论。
 * 数据源：growth（今日实时）+ dailyHistory（昨日及更早 → 计算 Streak）。
 */
export function buildDailyReport(
  growth: GrowthState,
  locale: Locale = 'en',
  history: DailyHistory = getCachedHistory(),
  currentDate: Date = new Date(),
): DailyReport {
  const today = todayKey(currentDate);

  // 今日事件从 growth.log 推
  const todayLog = growth.log.filter(e => {
    // growth.log.time 形如 'MM-DD HH:mm'，无年份 → 用月份+日期匹配
    const m = /^(\d{2})-(\d{2}) \d{2}:\d{2}$/.exec(e.time);
    if (!m) return false;
    const key = `${currentDate.getFullYear()}-${m[1]}-${m[2]}`;
    return key === today;
  });

  // Streak：从今天往回数连续"有事件"的天数（包含今天）
  const streakDays = computeStreak(history, today, growth.today.hasData);

  // AI 评论：规则兜底，根据异常事件时段分布生成
  const aiComment = generateDailyComment(todayLog, locale);

  return {
    hasData: growth.today.hasData,
    score: growth.today.score,
    effectiveMinutes: growth.today.effectiveMinutes,
    goodMinutes: growth.today.goodMinutes,
    abnormalCount: growth.today.abnormalCount,
    goodCount: growth.today.goodCount,
    streakDays,
    aiComment,
  };
}

function computeStreak(history: DailyHistory, today: string, hasDataToday: boolean): number {
  if (!hasDataToday && !hasAnyValidHistory(history)) return 0;
  const map = new Set(history.days.filter(s => s.effectiveMs > 0).map(s => s.date));
  if (hasDataToday) map.add(today);

  let streak = 0;
  const d = new Date(today);
  // 最多回溯 60 天
  for (let i = 0; i < 60; i += 1) {
    const key = todayKey(d);
    if (map.has(key)) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function hasAnyValidHistory(history: DailyHistory): boolean {
  // 简化：判断当今日志（growth）有事件即可，调用方已传入 growth
  return history.days.some(day => day.effectiveMs > 0);
}

function generateDailyComment(
  todayLog: {delta: number; action: string; time: string}[],
  locale: Locale,
): string {
  if (todayLog.length === 0) {
    return tr(locale, 'report.daily.continue');
  }

  // 找"异常入态"事件的高发时段
  const abnormalByHour: Record<number, number> = {};
  todayLog.filter(e => e.delta < 0).forEach(e => {
    const m = / (\d{2}):\d{2}$/.exec(e.time);
    if (m) {
      const h = parseInt(m[1], 10);
      abnormalByHour[h] = (abnormalByHour[h] ?? 0) + 1;
    }
  });

  const totalAbnormal = Object.values(abnormalByHour).reduce((a, b) => a + b, 0);
  const goodCount = todayLog.filter(e => e.delta > 0).length;

  if (totalAbnormal === 0) {
    if (goodCount >= DAILY_GREAT_GOOD_LOG_MIN) return tr(locale, 'report.daily.great');
    return tr(locale, 'report.daily.steady');
  }

  // 找高发小时
  const peakHour = Object.entries(abnormalByHour).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (peakHour !== undefined) {
    const h = parseInt(peakHour, 10);
    return tr(locale, 'report.daily.peakTechNeck', {h});
  }
  return tr(locale, 'report.daily.breakHint');
}

// ─── 周报 ──────────────────────────────────────────────────────────────────

/**
 * 周报：最近 7 天每日不驼背分 + AI 周总结。
 * 数据源：dailyHistory。
 */
export function buildWeeklyReport(
  growth: GrowthState,
  locale: Locale = 'en',
  history: DailyHistory = getCachedHistory(),
  currentDate: Date = new Date(),
): WeeklyReport {
  const week = getWeekSnapshots(history, currentDate);
  week.forEach(day => {
    if (day.snapshot && day.snapshot.effectiveMs <= 0) day.snapshot = null;
  });
  const currentKey = todayKey(currentDate);
  const today = week.find(day => day.date === currentKey);
  if (today && growth.today.hasData) {
    today.snapshot = {
      date: currentKey,
      score: growth.today.score,
      growthPoints: growth.points,
      effectiveMs: growth.today.effectiveMinutes * 60_000,
      goodMs: growth.today.goodMinutes * 60_000,
      goodMinutes: growth.today.goodMinutes,
      abnormalCount: growth.today.abnormalCount,
      goodCount: growth.today.goodCount,
      finalized: false,
    };
  }
  const recordedDays = week.filter(d => d.snapshot !== null).length;
  const totalScore = week.reduce((sum, d) => sum + (d.snapshot?.score ?? 0), 0);

  return {
    hasData: recordedDays > 0,
    week,
    recordedDays,
    averageScore: recordedDays > 0 ? Math.round(totalScore / recordedDays) : 0,
    aiSummary: generateWeeklySummary(week, locale),
  };
}

function generateWeeklySummary(week: WeekDay[], locale: Locale): string {
  const recorded = week.filter(d => d.snapshot !== null);
  if (recorded.length === 0) {
    return tr(locale, 'report.weekly.none');
  }
  const totalAbnormal = recorded.reduce((sum, d) => sum + (d.snapshot?.abnormalCount ?? 0), 0);
  const totalGood = recorded.reduce((sum, d) => sum + (d.snapshot?.goodCount ?? 0), 0);
  if (totalAbnormal === 0 && totalGood > 0) {
    return tr(locale, 'report.weekly.zeroAbnormal');
  }
  if (totalGood > totalAbnormal * WEEKLY_GOOD_DOMINANCE_RATIO) {
    return tr(locale, 'report.weekly.goodMore', {good: totalGood, bad: totalAbnormal});
  }
  return tr(locale, 'report.weekly.badMore', {good: totalGood, bad: totalAbnormal});
}
