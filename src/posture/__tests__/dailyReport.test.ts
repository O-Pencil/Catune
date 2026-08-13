import {buildDailyReport, buildWeeklyReport} from '../dailyReport';
import {DailyHistory, DailySnapshot} from '../../platform/dailyHistory';
import {GrowthState} from '../growth';

function snapshot(date: string, score: number): DailySnapshot {
  return {
    date,
    score,
    growthPoints: 70,
    effectiveMs: 60_000,
    goodMs: Math.round(score * 600),
    goodMinutes: 0,
    abnormalCount: score < 100 ? 1 : 0,
    goodCount: 1,
    finalized: true,
  };
}

function growth(overrides: Partial<GrowthState['today']> = {}): GrowthState {
  return {
    points: 75,
    stage: 2,
    stageName: 'Sapling',
    log: [{id: 1, time: '08-13 14:37', action: 'Forward head', delta: -4, score: 75}],
    today: {
      date: '2026-08-13',
      hasData: true,
      score: 80,
      effectiveMinutes: 10,
      goodMinutes: 8,
      abnormalCount: 1,
      goodCount: 8,
      ...overrides,
    },
  };
}

describe('daily and weekly reports', () => {
  const now = new Date(2026, 7, 13, 15, 0);

  it('uses effective monitoring metrics and counts a real consecutive-day streak', () => {
    const history: DailyHistory = {
      days: [snapshot('2026-08-12', 90), snapshot('2026-08-11', 70)],
    };

    const report = buildDailyReport(growth(), 'zh', history, now);

    expect(report).toMatchObject({
      hasData: true,
      score: 80,
      effectiveMinutes: 10,
      goodMinutes: 8,
      abnormalCount: 1,
      streakDays: 3,
    });
    expect(report.aiComment).toContain('14');
  });

  it('merges the live day into the last seven days and calculates average score', () => {
    const history: DailyHistory = {
      days: [snapshot('2026-08-12', 100), snapshot('2026-08-11', 60)],
    };

    const report = buildWeeklyReport(growth({score: 80}), 'en', history, now);

    expect(report.recordedDays).toBe(3);
    expect(report.averageScore).toBe(80);
    expect(report.week.at(-1)?.snapshot?.score).toBe(80);
  });

  it('does not manufacture a report or streak before valid monitoring starts', () => {
    const report = buildDailyReport(
      growth({hasData: false, score: 0, effectiveMinutes: 0, goodMinutes: 0}),
      'en',
      {days: []},
      now,
    );

    expect(report.hasData).toBe(false);
    expect(report.streakDays).toBe(0);
  });
});
