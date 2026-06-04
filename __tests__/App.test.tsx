/**
 * @file App.test.tsx
 * @description Jest 冒烟测试：用 react-test-renderer 验证 App 组件能挂载不抛错。
 *
 * [WHO] 默认导出无；调 `it('renders correctly', () => renderer.create(<App />))`
 * [FROM] 依赖 `react-native`、`@jest/globals` 的 `it`、`react-test-renderer`、本地 `App` 组件
 * [TO] 被 `npm test` 触发；是 RN 仪表盘的唯一自动化测试
 * [HERE] __tests__/App.test.tsx · RN 渲染冒烟测试
 */
/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  renderer.create(<App />);
});
