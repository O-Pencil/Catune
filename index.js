/**
 * @file index.js
 * @description 统一 Expo 入口（iOS / Android / Web 同一入口）。
 *
 * [WHO] 侧效执行：`registerRootComponent(App)`（Expo 用组件键 "main"）
 * [FROM] 依赖 `expo`(registerRootComponent)、本地 `App`
 * [TO] 被 Metro + Expo runtime 加载
 * [HERE] 项目根 /index.js · Expo 应用入口
 */
import {registerRootComponent} from 'expo';
import App from './App';

registerRootComponent(App);
