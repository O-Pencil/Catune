/**
 * @file colors.ts
 * @description 调色板（RN 用 hex）。浅色 Haptic 拟物化主题。
 *
 * [WHO] 导出 `colors`
 * [FROM] 无依赖
 * [TO] 被 src/design/theme/theme.ts 与各组件消费
 * [HERE] src/design/theme/colors.ts · 调色板
 */
export const colors = {
  // 背景 / 表面（haptic canvas / surface / neutral 渐变）
  background: '#F2F0EC', // 暖中性 canvas
  surface: '#FFFFFF',
  surfaceMuted: '#F5F5F5',
  neutralStart: '#FFFFFF',
  neutralEnd: '#E5E5E5',
  border: '#E5E5E5',

  // 文字
  textPrimary: '#141414',
  textSecondary: '#666666',
  textMuted: '#9B9590', // mono 标签

  // 品牌橙（--color-haptic-brand）
  primary: '#FB4B00',
  primaryLight: '#FFA060',
  primaryFg: '#FFF0EA',

  // 姿态状态色（对齐 DeskPage STATUS_COLORS）
  statusNormal: '#7BA05B', // healthy 暖鼠尾草绿
  statusWarning: '#FB4B00', // warning 品牌橙
  statusAlert: '#C75348', // alert 黏土红
  statusOffline: '#AFA8A0',
} as const;

export type Colors = typeof colors;
