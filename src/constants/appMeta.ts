/**
 * @file appMeta.ts
 * @description CATUNE 应用品牌与版本元数据（单一来源，供 UI / 关于页引用）。
 */
import {Platform} from 'react-native';
import packageJson from '../../package.json';
import nativeVersion from '../../version.native.json';

/** 正式产品名称（全大写品牌标识） */
export const APP_NAME = 'CATUNE';

/** 语义化版本号，与 package.json / app.json / version.properties 保持同步 */
export const APP_VERSION = packageJson.version;

/** Android 内部版本号（与 version.properties 的 VERSION_CODE 一致，用于覆盖安装） */
export const ANDROID_VERSION_CODE = nativeVersion.androidVersionCode;

/** 用户可见的完整版本文案 */
export function formatAppVersion(build?: string | number): string {
  const code = build ?? (Platform.OS === 'android' ? ANDROID_VERSION_CODE : undefined);
  if (code == null || code === '') {
    return `v${APP_VERSION}`;
  }
  return `v${APP_VERSION} (${code})`;
}
