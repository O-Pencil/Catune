/**
 * @file colors.ts
 * @description 调色板（RN 用 hex；从 web/ index.css 的 oklch :root 近似换算）。浅色 Haptic 拟物化主题。
 *
 * [WHO] 导出 `colors`
 * [FROM] 无依赖
 * [TO] 被 src/ui/theme/theme.ts 与各组件消费
 * [HERE] src/ui/theme/colors.ts · 调色板
 */
export const colors = {
  // 背景 / 表面（对齐 web --background / --card / --muted）
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F5F5',
  border: '#EAEAEA',

  // 文字（--foreground / --muted-foreground）
  textPrimary: '#1A1A1A',
  textMuted: '#8A8A8A',

  // 品牌橙（--primary: oklch(0.684 0.196 44.8) 近似）
  primary: '#E8703A',
  primaryFg: '#FFFFFF',

  // 姿态状态色
  statusNormal: '#16A34A',
  statusWarning: '#F59E0B',
  statusAlert: '#E5484D', // 对齐 --destructive
  statusOffline: '#9CA3AF',
} as const;

export type Colors = typeof colors;
