/**
 * @file index.ts
 * @description theme 桶文件，统一导出。
 * [WHO] 导出 `colors`、`Colors`、`spacing`、`radius`、`font`、`shadow`、`theme`、`statusColor`
 * [FROM] 依赖 ./colors、./theme
 * [TO] 被 src/ui 各组件消费
 * [HERE] src/ui/theme/index.ts · 设计系统统一导出
 */
export {colors, type Colors} from './colors';
export {spacing, radius, font, shadow, theme, statusColor} from './theme';
