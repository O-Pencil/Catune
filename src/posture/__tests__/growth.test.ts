const mockUpsert = jest.fn<Promise<void>, [unknown, unknown?]>(() => Promise.resolve());

jest.mock('../../platform/dailyHistory', () => {
  const actual = jest.requireActual('../../platform/dailyHistory');
  return {
    ...actual,
    getCachedHistory: () => ({days: []}),
    loadDailyHistory: jest.fn(() => Promise.resolve({days: []})),
    rolloverIfNewDay: jest.fn(() => Promise.resolve()),
    upsertTodaySnapshot: (value: unknown, date?: unknown) => mockUpsert(value, date),
  };
});

import {createGrowthTracker} from '../growth';
import {PostureEngine} from '../engine';
import {DashboardState, PostureName} from '../types';

describe('growth daily scoring', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUpsert.mockClear();
  });

  afterEach(() => jest.useRealTimers());

  it('scores valid online time and excludes offline time', async () => {
    let posture: PostureName = 'NORMAL';
    let listener: ((state: DashboardState) => void) | undefined;
    let nowMs = new Date(2026, 7, 13, 9, 0).getTime();
    const state = (): DashboardState => ({
      neckPitch: 0,
      thorPitch: 0,
      lumbarRoll: 0,
      posture,
      postureLabel: posture,
      score: 100,
      abnormalDurationMinutes: 0,
      advice: '',
      inferenceSource: 'RULE_FALLBACK',
      streaming: false,
      action: null,
    });
    const engine = {
      getState: state,
      subscribe: (cb: (value: DashboardState) => void) => {
        listener = cb;
        cb(state());
        return () => { listener = undefined; };
      },
    } as unknown as PostureEngine;
    const tracker = createGrowthTracker(engine, {
      tickMs: 5_000,
      goodAwardIntervalMs: 60_000,
      now: () => new Date(nowMs),
    });
    await tracker.start();

    const advanceMinute = () => {
      for (let i = 0; i < 12; i += 1) {
        nowMs += 5_000;
        jest.advanceTimersByTime(5_000);
      }
    };

    advanceMinute();
    expect(tracker.getState().today.hasData).toBe(false);

    listener?.(state());
    advanceMinute();
    expect(tracker.getState().today).toMatchObject({score: 100, effectiveMinutes: 1, goodMinutes: 1});

    posture = 'SLUMPED';
    listener?.(state());
    advanceMinute();
    expect(tracker.getState().today).toMatchObject({score: 50, effectiveMinutes: 2, abnormalCount: 1});

    posture = 'OFFLINE';
    listener?.(state());
    advanceMinute();
    expect(tracker.getState().today).toMatchObject({score: 50, effectiveMinutes: 2});

    posture = 'NORMAL';
    listener?.(state());
    nowMs = new Date(2026, 7, 14, 0, 0).getTime();
    jest.advanceTimersByTime(5_000);
    nowMs += 5_000;
    jest.advanceTimersByTime(5_000);
    expect(tracker.getState().today).toMatchObject({
      date: '2026-08-14',
      score: 100,
      effectiveMinutes: 0,
      abnormalCount: 0,
    });
    tracker.stop();
  });
});
