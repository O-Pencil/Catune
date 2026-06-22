/**
 * @file App.zh.test.tsx
 * @description App 在 zh locale 下挂载不抛错的回归测试。
 *   mock FileSystem 让 loadLocale() 返回 'zh'，覆盖全局 jest.setup 的"无文件系统"默认 mock。
 *   覆盖路径：FileSystem.getInfoAsync → exists；FileSystem.readAsStringAsync → JSON 含 locale='zh'。
 *
 * [WHO] jest 套件 `app.zh-mount`
 * [FROM] 依赖 react-test-renderer、本地 App
 * [TO] 被 `npm test` 触发
 * [HERE] __tests__/App.zh.test.tsx
 */

// 关键：必须在 import App 之前覆盖 mock（jest hoists jest.mock，但本测试用 jest.doMock 局部覆盖）
jest.mock('expo-file-system/legacy', () => {
  const meta = JSON.stringify({locale: 'zh'});
  return {
    documentDirectory: '/mock/',
    cacheDirectory: '/mock/',
    bundleDirectory: '/mock/',
    getInfoAsync: async (path: string) => {
      // 任何路径都返回存在
      return {exists: true, isDirectory: false, size: meta.length};
    },
    readAsStringAsync: async (_path: string) => meta,
    writeAsStringAsync: async () => {},
    makeDirectoryAsync: async () => {},
    deleteAsync: async () => {},
    readDirectoryAsync: async () => [],
  };
});

import React from 'react';
import renderer, {act} from 'react-test-renderer';
import App from '../App';

it('renders in zh locale without throwing', async () => {
  jest.useFakeTimers();
  let tree: renderer.ReactTestRenderer | null = null;
  await act(async () => {
    tree = renderer.create(<App />);
  });
  // 等 memory.ready.then(...) 跑完（microtask）
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  // 跑完所有 fake timers（adviceOrchestrator / growth / reminder 的 setInterval）
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  expect(tree).not.toBeNull();
  jest.clearAllTimers();
  jest.useRealTimers();
});