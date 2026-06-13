// Expo SDK 54 标准 metro 配置。预览工程现在是自包含的（posture 逻辑已复制进 ./posture），
// 不再跨目录引用主工程，避免 Expo + 仓库外文件的解析问题。
const {getDefaultConfig} = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// 模块只从本工程自己的 node_modules 解析（拿到 RN 0.81，绝不串到主工程的 RN 0.76）
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

module.exports = config;
