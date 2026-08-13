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
import {DEMO_GROWTH_SCHEMA, PRODUCTION_GROWTH_SCHEMA} from '../growthScoringSchema';

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
    expect(tracker.getState().today).toMatchObject({score: 50, effectiveMinutes: 2, abnormalCount: 1, penaltyPoints: 1});
    expect(tracker.getState().points).toBe(0);

    advanceMinute();
    expect(tracker.getState().today).toMatchObject({effectiveMinutes: 3, abnormalCount: 2, penaltyPoints: 2});
    expect(tracker.getState().points).toBe(0);

    posture = 'OFFLINE';
    listener?.(state());
    advanceMinute();
    expect(tracker.getState().today).toMatchObject({effectiveMinutes: 3});

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
    expect(tracker.recordTraining('NECK_RETRACTION')).toBe(true);
    expect(tracker.getState()).toMatchObject({points: 10, today: {trainingPoints: 10, trainingCount: 1}});
    expect(tracker.recordTraining('NECK_RETRACTION')).toBe(false);

    tracker.setSchema(DEMO_GROWTH_SCHEMA);
    for (let i = 0; i < 10; i += 1) {
      nowMs += 1_000;
      jest.advanceTimersByTime(1_000);
    }
    expect(tracker.getState()).toMatchObject({points: 1, schemaId: 'demo'});

    tracker.setSchema(PRODUCTION_GROWTH_SCHEMA);
    expect(tracker.getState()).toMatchObject({points: 10, schemaId: 'production'});
    tracker.stop();
  });
});
