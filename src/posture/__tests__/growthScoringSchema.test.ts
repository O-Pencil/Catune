import {
  DEMO_GROWTH_SCHEMA,
  PRODUCTION_GROWTH_SCHEMA,
  validateGrowthScoringSchema,
} from '../growthScoringSchema';

describe('growth scoring schema', () => {
  it('keeps both presets on the same 0–100 scoring contract', () => {
    expect(validateGrowthScoringSchema(PRODUCTION_GROWTH_SCHEMA).score).toEqual({initial: 0, min: 0, max: 100});
    expect(validateGrowthScoringSchema(DEMO_GROWTH_SCHEMA).score).toEqual({initial: 0, min: 0, max: 100});
    expect(PRODUCTION_GROWTH_SCHEMA.goodPosture.intervalMs).toBe(60_000);
    expect(DEMO_GROWTH_SCHEMA.goodPosture.intervalMs).toBe(10_000);
    expect(DEMO_GROWTH_SCHEMA.abnormalPosture.intervalMs).toBe(10_000);
  });

  it('rejects schemas that can exceed the daily contract', () => {
    expect(() => validateGrowthScoringSchema({
      ...PRODUCTION_GROWTH_SCHEMA,
      score: {...PRODUCTION_GROWTH_SCHEMA.score, max: 999},
    })).toThrow('0–100');
  });
});
