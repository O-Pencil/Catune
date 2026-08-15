jest.mock('react-native', () => ({
  Platform: {OS: 'android'},
  NativeModules: {
    CatuneMnn: {
      getStatus: jest.fn(async () => ({
        cpu: {sme2Hw: true, i8mm: true, dot: true, fp16: true},
      })),
    },
  },
}));

jest.mock('expo-device', () => ({
  totalMemory: 16 * 1024 * 1024 * 1024,
  supportedCpuArchitectures: ['arm64-v8a'],
  osVersion: '16',
  platformApiLevel: 36,
}));

jest.mock('expo-file-system/legacy', () => ({
  getFreeDiskStorageAsync: jest.fn(async () => 32 * 1024 * 1024 * 1024),
}));

jest.mock('../../design/i18n', () => ({
  tr: (_locale: string, key: string, vars?: Record<string, string>) =>
    vars?.name ? `${key} ${vars.name}` : key,
}));

import {DeviceProfile, getDeviceProfile, recommendModel} from '../deviceProfile';

const GIB = 1024 * 1024 * 1024;

function profile(overrides: Partial<DeviceProfile> = {}): DeviceProfile {
  return {
    platform: 'android',
    osVersion: '16',
    androidApiLevel: 36,
    totalMemoryBytes: 16 * GIB,
    totalMemoryGB: 11.1,
    cpuArchitectures: ['arm64-v8a'],
    isArm64: true,
    hasSme2: true,
    hasI8mm: true,
    hasDotprod: true,
    hasFp16: true,
    freeDiskBytes: 32 * GIB,
    freeDiskGB: 32,
    tier: 'high',
    timestamp: 0,
    ...overrides,
  };
}

describe('device model recommendation', () => {
  test('reads the native sme2Hw and dot fields used by Android', async () => {
    const result = await getDeviceProfile();
    expect(result.hasSme2).toBe(true);
    expect(result.hasDotprod).toBe(true);
    expect(result.androidApiLevel).toBe(36);
  });

  test('recommends Qwen3.5-4B for an Android 16 flagship with SME2', () => {
    expect(recommendModel(profile()).model.id).toBe('qwen3.5-4b');
  });

  test('keeps a high-end pre-Android-15 device on Qwen3.5-2B', () => {
    const result = recommendModel(profile({osVersion: '14', androidApiLevel: 34}));
    expect(result.model.id).toBe('qwen3.5-2b');
  });

  test('recommends Qwen3.5-2B for an 8GB mainstream device', () => {
    const result = recommendModel(profile({
      totalMemoryBytes: 8 * GIB,
      totalMemoryGB: 8,
      tier: 'mainstream',
      hasSme2: false,
    }));
    expect(result.model.id).toBe('qwen3.5-2b');
  });

  test('recommends Qwen3.5-0.8B for a 6GB mainstream device', () => {
    const result = recommendModel(profile({
      totalMemoryBytes: 6 * GIB,
      totalMemoryGB: 6,
      tier: 'mainstream',
      hasSme2: false,
      hasI8mm: false,
    }));
    expect(result.model.id).toBe('qwen3.5-0.8b');
  });

  test('steps down from 4B when free storage cannot preserve the safety buffer', () => {
    const result = recommendModel(profile({freeDiskBytes: 3.5 * GIB, freeDiskGB: 3.5}));
    expect(result.model.id).toBe('qwen3.5-2b');
    expect(result.details.join(' ')).toContain('Qwen3.5-2B');
  });

  test('uses the compatibility model outside the Android native path', () => {
    const result = recommendModel(profile({
      platform: 'ios',
      osVersion: '19',
      androidApiLevel: null,
    }));
    expect(result.model.id).toBe('qwen2.5-0.5b');
  });
});
