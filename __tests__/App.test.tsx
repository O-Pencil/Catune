/**
 * @file App.test.tsx
 * @description Jest 冒烟测试：用 react-test-renderer 验证纯 TS 的 App 组件能挂载不抛错（不再依赖原生模块）。
 *
 * [WHO] 默认导出无；调 `it('renders correctly', ...)` 在 fake timers 下挂载 App
 * [FROM] 依赖 `@jest/globals`、`react-test-renderer`、本地 `App` 组件
 * [TO] 被 `npm test` 触发
 * [HERE] __tests__/App.test.tsx · RN 渲染冒烟测试
 */
/**
 * @format
 */

import React from 'react';
import renderer, {act} from 'react-test-renderer';
import App from '../App';

it('renders correctly', async () => {
  // 使用 fake timers，避免模拟数据源的 setInterval 在测试后继续触发
  jest.useFakeTimers();
  let tree: renderer.ReactTestRenderer | null = null;
  try {
    await act(async () => {
      tree = renderer.create(<App />);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(tree).not.toBeNull();
  } finally {
    if (tree) {
      act(() => {
        tree?.unmount();
      });
    }
    jest.clearAllTimers();
    jest.useRealTimers();
  }
});
