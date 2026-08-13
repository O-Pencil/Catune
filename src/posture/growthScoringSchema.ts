import type {PostureName} from './types';

export type GrowthSchemaId = 'production' | 'demo';

export type GrowthScoringSchema = {
  schemaVersion: 1;
  id: GrowthSchemaId;
  score: {initial: number; min: number; max: number};
  goodPosture: {intervalMs: number; pointsPerInterval: number; contributionCap: number};
  abnormalPosture: {
    graceMs: number;
    intervalMs: number;
    pointsPerInterval: number;
    dailyDeductionCap: number;
    postures: PostureName[];
  };
  training: {
    pointsPerCompletion: number;
    dailyCompletionCap: number;
    contributionCap: number;
    sameActionCooldownMs: number;
  };
  stages: readonly [number, number, number, number, number];
  timing: {tickMs: number; maxCatchUpMs: number};
};

export const PRODUCTION_GROWTH_SCHEMA: GrowthScoringSchema = {
  schemaVersion: 1,
  id: 'production',
  score: {initial: 0, min: 0, max: 100},
  goodPosture: {intervalMs: 60_000, pointsPerInterval: 1, contributionCap: 80},
  abnormalPosture: {
    graceMs: 0,
    intervalMs: 60_000,
    pointsPerInterval: -1,
    dailyDeductionCap: 20,
    postures: ['SLUMPED', 'TECH_NECK', 'LEFT_LEAN'],
  },
  training: {
    pointsPerCompletion: 10,
    dailyCompletionCap: 2,
    contributionCap: 20,
    sameActionCooldownMs: 30 * 60_000,
  },
  stages: [0, 25, 50, 75, 100],
  timing: {tickMs: 5_000, maxCatchUpMs: 10_000},
};

export const DEMO_GROWTH_SCHEMA: GrowthScoringSchema = {
  ...PRODUCTION_GROWTH_SCHEMA,
  id: 'demo',
  goodPosture: {...PRODUCTION_GROWTH_SCHEMA.goodPosture, intervalMs: 10_000},
  abnormalPosture: {...PRODUCTION_GROWTH_SCHEMA.abnormalPosture, graceMs: 0, intervalMs: 10_000},
  training: {...PRODUCTION_GROWTH_SCHEMA.training, sameActionCooldownMs: 10_000},
  timing: {tickMs: 1_000, maxCatchUpMs: 2_000},
};

export const GROWTH_SCHEMAS: Record<GrowthSchemaId, GrowthScoringSchema> = {
  production: PRODUCTION_GROWTH_SCHEMA,
  demo: DEMO_GROWTH_SCHEMA,
};

export function validateGrowthScoringSchema(schema: GrowthScoringSchema): GrowthScoringSchema {
  const values = [
    schema.score.initial,
    schema.score.min,
    schema.score.max,
    schema.goodPosture.intervalMs,
    schema.goodPosture.pointsPerInterval,
    schema.goodPosture.contributionCap,
    schema.abnormalPosture.graceMs,
    schema.abnormalPosture.intervalMs,
    schema.abnormalPosture.pointsPerInterval,
    schema.abnormalPosture.dailyDeductionCap,
    schema.training.pointsPerCompletion,
    schema.training.dailyCompletionCap,
    schema.training.contributionCap,
    schema.training.sameActionCooldownMs,
    schema.timing.tickMs,
    schema.timing.maxCatchUpMs,
    ...schema.stages,
  ];
  if (schema.schemaVersion !== 1 || values.some(value => !Number.isFinite(value))) {
    throw new Error('Invalid growth scoring schema');
  }
  if (
    schema.score.min !== 0 || schema.score.max !== 100 || schema.score.initial < 0 ||
    schema.goodPosture.intervalMs <= 0 || schema.goodPosture.pointsPerInterval <= 0 ||
    schema.abnormalPosture.intervalMs <= 0 || schema.abnormalPosture.pointsPerInterval >= 0 ||
    schema.training.pointsPerCompletion <= 0 || schema.timing.tickMs <= 0 ||
    schema.stages[0] !== 0 || schema.stages[4] !== 100 ||
    schema.stages.some((value, index) => index > 0 && value <= schema.stages[index - 1])
  ) {
    throw new Error('Growth scoring schema violates the 0–100 contract');
  }
  return schema;
}
