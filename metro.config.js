// Expo 的 metro 配置是 RN 默认配置的超集，Expo Go 与裸 RN 构建都用它。
// https://docs.expo.dev/guides/customizing-metro/
const {getDefaultConfig} = require('expo/metro-config');

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
