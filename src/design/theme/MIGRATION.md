# Catune 老 Token → Tailwind / NativeWind 迁移表

> 状态：2026-07-04 第三次重写（d1eb7cf + reusables 集成）后正式版。
> 本表是 **新代码的权威参考**，老代码可以继续读 `theme.ts` / `colors.ts` 的 ts 对象，但**不再扩展它们**。
>
> 改主题的唯一入口：修改 `global.css` 的 CSS variables（`--primary` / `--background` 等） + `tailwind.config.js` 的 `theme.extend`。

---

## 1. Color Token（colors.ts · 16 个 hex）

| Catune token (hex) | reusables / Tailwind class | CSS Variable (HSL) | 用途 |
|---|---|---|---|
| `colors.background` `#F2F0EC` | `bg-background` | `--background: 30 14% 94%` | App 主背景（暖中性 canvas） |
| `colors.surface` `#FFFFFF` | `bg-card` / `bg-popover` | `--card: 0 0% 100%` | 卡片 / 浮层 |
| `colors.surfaceMuted` `#F5F5F5` | `bg-surface-muted` / `bg-muted` | `--surface-muted: 0 0% 96%` | 次级表面 |
| `colors.neutralStart` `#FFFFFF` | `bg-neutral-start` | `--neutral-start: 0 0% 100%` | 渐变起 |
| `colors.neutralEnd` `#E5E5E5` | `bg-neutral-end` / `bg-border` | `--neutral-end: 0 0% 90%` | 渐变止 |
| `colors.border` `#E5E5E5` | `border-border` / `bg-border` | `--border: 0 0% 90%` | 边框 |
| `colors.textPrimary` `#141414` | `text-foreground` | `--foreground: 0 0% 8%` | 主文字 |
| `colors.textSecondary` `#666666` | `text-text-secondary` / `text-muted-foreground` | `--text-secondary: 0 0% 40%` | 次要文字 |
| `colors.textMuted` `#9B9590` | `text-text-muted` | `--text-muted: 20 7% 60%` | 弱化文字 / mono 标签 |
| `colors.primary` `#FB4B00` | `bg-primary` / `text-primary` / `border-primary` | `--primary: 18 100% 49%` | 品牌橙 |
| `colors.primaryLight` `#FFA060` | `bg-primary-light` | `--primary-light: 22 100% 68%` | 品牌橙浅色 |
| `colors.primaryFg` `#FFF0EA` | `text-primary-foreground` | `--primary-foreground: 18 100% 96%` | 品牌色上的文字 / foreground |
| `colors.statusNormal` `#7BA05B` | `bg-status-normal` / `text-status-normal` | `--status-normal: 87 27% 49%` | 鼠尾草绿（healthy） |
| `colors.statusWarning` `#FB4B00` | `bg-status-warning` (= primary) | `--status-warning: 18 100% 49%` | 警告橙 |
| `colors.statusAlert` `#C75348` | `bg-status-alert` / `bg-destructive` | `--status-alert: 5 56% 53%` | 黏土红 / destructive |
| `colors.statusOffline` `#AFA8A0` | `bg-status-offline` | `--status-offline: 30 7% 65%` | 离线灰 |

### 改主题示范：把品牌橙换成蓝色

只需要改 `global.css`：

```css
:root {
  --primary: 220 90% 53%;           /* 之前: 18 100% 49% 橘色 → 现蓝色 */
  --primary-foreground: 0 0% 100%;
  --primary-light: 220 90% 68%;
  --status-warning: 220 90% 53%;
  --ring: 220 90% 53%;
}
```

整个 App 所有 `bg-primary` / `text-primary` / `border-primary` 自动跟着变色，不用改任何 .tsx 文件。

---

## 2. Spacing（colors.spacing · 10 档 → 默认 Tailwind spacing 完全覆盖）

| Catune token (px) | Tailwind class | 命名来源 |
|---|---|---|
| `theme.spacing.xxs` (2) | `gap-0.5` / `p-0.5` | Tailwind 默认（已覆盖） |
| `theme.spacing.xs` (4) | `gap-1` / `p-1` | Tailwind 默认（已覆盖） |
| `theme.spacing.sm` (6) | `gap-1.5` / `p-1.5` | Tailwind 默认（已覆盖） |
| `theme.spacing.sm2` (8) | `gap-2` / `p-2` | Tailwind 默认（已覆盖） |
| `theme.spacing.md` (10) | `gap-2.5` / `p-2.5` | Tailwind 默认（已覆盖） |
| `theme.spacing.md2` (12) | `gap-3` / `p-3` | Tailwind 默认（已覆盖） |
| `theme.spacing.lg` (16) | `gap-4` / `p-4` | Tailwind 默认（已覆盖） |
| `theme.spacing.xl` (20) | `gap-5` / `p-5` | Tailwind 默认（已覆盖） |
| `theme.spacing.xxl` (24) | `gap-6` / `p-6` | Tailwind 默认（已覆盖） |
| `theme.spacing.xxxl` (32) | `gap-8` / `p-8` | Tailwind 默认（已覆盖） |

**全部直接覆盖 Tailwind 默认 spacing 数值**。无 `cat-` 自定义命名空间。

---

## 3. Border Radius（colors.radius · 4 档 → 默认 Tailwind borderRadius 完全覆盖）

| Catune token (px) | Tailwind class | 原有 Tailwind 默认 | 修复 |
|---|---|---|---|
| `theme.radius.sm` (8) | `rounded-sm` | 2px | ✅ 覆盖到 8px |
| `theme.radius.md` (12) | `rounded-md` | 6px | ✅ 覆盖到 12px |
| `theme.radius.lg` (16) | `rounded-lg` | 8px | ✅ 覆盖到 16px |
| `theme.radius.pill` (9999) | `rounded-full` | 9999px | ✅ 默认就一致 |

---

## 4. Font Size（font.size · 6 档 → 默认 Tailwind fontSize 覆盖 + 新增 score）

| Catune token (px) | Tailwind class | 原有 Tailwind 默认 | 修复 |
|---|---|---|---|
| `theme.font.sizeXs` (12) | `text-xs` | 12px | ✅ 默认一致 |
| `theme.font.sizeSm` (14) | `text-sm` | 14px | ✅ 默认一致 |
| `theme.font.sizeMd` (**15**) | `text-base` | **16px** | ✅ **关键修复：16→15** |
| `theme.font.sizeLg` (18) | `text-lg` | 18px | ✅ 默认一致 |
| `theme.font.sizeXl` (**22**) | `text-xl` | **20px** | ✅ **关键修复：20→22** |
| `theme.font.sizeScore` (56) | `text-score` | (无) | ✅ 新增（分数大字） |

`2xl / 3xl / 4xl` 保留 Tailwind 默认（24 / 30 / 36），Catune 未使用。

### Font Size lineHeight

| class | fontSize | lineHeight |
|---|---|---|
| `text-xs` | 12px | 16px |
| `text-sm` | 14px | 20px |
| `text-base` | 15px | 22px |
| `text-md` | 15px | 22px（别名） |
| `text-lg` | 18px | 24px |
| `text-xl` | 22px | 28px |
| `text-score` | 56px | 64px |

---

## 5. Font Weight

| Catune token | Tailwind class | 值 |
|---|---|---|
| `theme.font.weightBold` | `font-bold` | 700 |
| `theme.font.weightHeavy` | `font-extrabold` | 800 |
| `theme.font.display` (Fredoka\_400Regular) | (通过 App.tsx 字体加载) | — |
| `theme.font.displayMedium` (Fredoka\_500Medium) | `font-medium` | 500 |
| `theme.font.displayBold` (Fredoka\_700Bold) | `font-bold` | 700 |
| `theme.font.body` (Geist\_400Regular) | (通过 App.tsx 字体加载) | — |
| `theme.font.bodyMedium` (Geist\_500Medium) | `font-medium` | 500 |
| `theme.font.bodyBold` (Geist\_700Bold) | `font-bold` | 700 |

字体族（Fredoka / Geist）通过 `App.tsx` 的 `useFonts()` 注册全局生效，组件层不需要特意指定。

---

## 6. Shadow（shadow · 2 档 → 默认 Tailwind boxShadow 覆盖）

| Catune token | Tailwind class | boxShadow 值 |
|---|---|---|
| `theme.shadow.card` | `shadow-sm` | `0 4px 12px rgba(0,0,0,0.08)`（opacity 0.08 / radius 12 / offset 4） |
| `theme.shadow.pill` | `shadow-md` | `0 3px 8px rgba(0,0,0,0.1)`（opacity 0.1 / radius 8 / offset 3） |

额外的 `shadow-lg / shadow-xl` 也已配置（覆盖默认）。

---

## 7. 已删除的自定义 token（不再用）

| 原配置 | 原因 |
|---|---|
| `cat-xxs / cat-xs / cat-sm / cat-sm2` 等自定义 spacing | 已用 Tailwind 默认 spacing 覆盖（去 `cat-` 前缀） |
| `shadow-cat-card / shadow-cat-pill` 自定义 token | 已覆盖 `shadow-sm / shadow-md`（去 `cat-` 前缀） |
| `font-size score = 56`（独立 key） | 已用 `text-score`（Tailwind 标准命名空间内新增） |

---

## 8. 状态映射

`statusColor(posture: string): string` 函数映射：

| Posture | Catune statusColor | Tailwind class |
|---|---|---|
| `NORMAL` | `colors.statusNormal` (#7BA05B) | `bg-status-normal` |
| `TECH_NECK` | `colors.statusWarning` (#FB4B00) | `bg-status-warning` |
| `OFFLINE` | `colors.statusOffline` (#AFA8A0) | `bg-status-offline` |
| `SLUMPED / LEFT_LEAN / 其它` | `colors.statusAlert` (#C75348) | `bg-status-alert` / `bg-destructive` |

新代码用 Tailwind class 名，不要调用 `statusColor()` 函数（它仍保留给老代码兼容）。

---

## 9. 完整组件改写示范

### 旧写法（Catune 老 API）

```tsx
import {theme} from '@/design/theme';

<View style={{padding: theme.spacing.lg, backgroundColor: theme.colors.surface}}>
  <Text style={{fontSize: theme.font.sizeMd, fontWeight: theme.font.weightBold, color: theme.colors.primary}}>
    标题
  </Text>
</View>
```

### 新写法（Tailwind class）

```tsx
<View className="rounded-2xl p-4 bg-card">
  <Text className="text-base font-bold text-primary">
    标题
  </Text>
</View>
```

---

## 10. 仍保留老 API 的文件（暂未重写）

| 文件 | 原因 |
|---|---|
| `src/design/AppShell.tsx` | 多个 `theme.font.body` 引用 |
| `src/design/components/DailyReportPanel.tsx` | 主体结构用 `StyleSheet.create({...})` |
| `src/design/components/LogConsole.tsx` | 同上 |
| `src/design/components/LoopTabs.tsx` | 同上 |
| `src/design/components/ModelDownloadCard.tsx` | 同上 |

**计划**：W2 7-08 ~ 7-10 期间逐步把 StyleSheet 改成 Tailwind className。
这些旧文件**不需要** 新增 `theme.x` 字段，保持现状即可。**新写代码直接用 Tailwind**。

---

## 11. 修改主题的标准流程

1. **改颜色** → 编辑 `global.css` 的 CSS variables（`--primary` 等）
2. **改圆角/字号/间距/阴影** → 编辑 `tailwind.config.js` 的 `theme.extend`
3. **不需要任何 .tsx / .ts 改动**
4. Metro HMR 自动热重载

---

## 12. 验证脚本

```bash
node scripts/check-theme-token-usage.mjs     # 验证 token 化率 ≥40%
node scripts/check-no-color-literal.mjs      # 查找 .tsx/.ts 字面色值
```

两个脚本都是 **warn-only**，不阻塞 lint，但触发后会打印违规列表。
