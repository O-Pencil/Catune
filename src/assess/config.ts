/**
 * @file config.ts
 * @description 评估后端配置的本地持久化（documentDirectory/catune_assess/config.json）。API Key 仅存本机、不进 git。
 *
 * [WHO] 导出 `loadAssessConfig`/`saveAssessConfig`
 * [FROM] 依赖 `expo-file-system/legacy`、./types
 * [TO] 被 src/assess/service.ts 与 Settings 配置卡消费
 * [HERE] src/assess/config.ts · 评估配置持久化
 */
import * as FileSystem from 'expo-file-system/legacy';
import {AssessConfig, DEFAULT_ASSESS_CONFIG} from './types';

const DIR = (FileSystem.documentDirectory ?? '') + 'catune_assess/';
const FILE = DIR + 'config.json';

export async function loadAssessConfig(): Promise<AssessConfig> {
  try {
    const info = await FileSystem.getInfoAsync(FILE);
    if (!info.exists) {
      return DEFAULT_ASSESS_CONFIG;
    }
    const parsed = JSON.parse(await FileSystem.readAsStringAsync(FILE));
    return {
      backend: parsed?.backend ?? DEFAULT_ASSESS_CONFIG.backend,
      cloud: {...DEFAULT_ASSESS_CONFIG.cloud, ...(parsed?.cloud ?? {})},
    };
  } catch {
    return DEFAULT_ASSESS_CONFIG;
  }
}

export async function saveAssessConfig(config: AssessConfig): Promise<void> {
  try {
    await FileSystem.makeDirectoryAsync(DIR, {intermediates: true});
    await FileSystem.writeAsStringAsync(FILE, JSON.stringify(config));
  } catch {
    // web / 无 FS：忽略
  }
}
