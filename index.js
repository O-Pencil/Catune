/**
 * @file index.js
 * @description RN 入口：同时注册 Expo Go（"main"）与裸原生（app.json 的 name="Catune"）两种运行方式。
 *
 * [WHO] 侧效执行：`registerRootComponent(App)`（Expo Go）+ `AppRegistry.registerComponent(appName, () => App)`（裸 iOS/Android）
 * [FROM] 依赖 `expo`（registerRootComponent）、`react-native`（AppRegistry）、本地 `App`、`./app.json` 的 name
 * [TO] 被 Metro + RN/Expo runtime 加载
 * [HERE] 项目根 /index.js · RN/Expo 应用入口
 */
/**
 * @format
 */

import {registerRootComponent} from 'expo';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Expo Go / EAS 用组件键 "main"
registerRootComponent(App);
// 裸 iOS/Android（MainActivity.getMainComponentName="Catune"）用 appName
AppRegistry.registerComponent(appName, () => App);
