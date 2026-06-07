# web/ · P2 模块地图

> 层级：P2（模块成员清单）
> 父级：[../AGENTS.md](../AGENTS.md)
> 语言：**中文**

---

## 1. 模块定位

Web 端 Haptic 拟物化设计系统演示 + 仪表盘原型，基于 React 19 + Vite 8 + Tailwind CSS 4 + shadcn/ui + Framer Motion。

---

## 2. 目录结构

```
web/src/
├── app/                          # 应用入口
│   ├── main.tsx                  # Vite 入口，挂载 React root
│   └── App.tsx                   # 根组件，Tab 路由（Desk / Plant / Settings）
├── components/
│   ├── haptic/                   # Haptic 设计系统（20 个组件 + tokens + motion）
│   │   ├── index.ts              # 桶导出，聚合所有 haptic 组件
│   │   ├── tokens.ts             # 设计 token（调色板 / 渐变 / 阴影 / 圆角 / 尺寸类型）
│   │   ├── motion.ts             # 动画预设（springSnappy / springSoft / tweenSurface）
│   │   ├── icons.tsx             # SVG 图标组件（Filter / Plus / Minus / Chevron / Check / Search）
│   │   ├── haptic-accordion.tsx  # 可折叠手风琴
│   │   ├── haptic-avatar.tsx     # 头像（尺寸 / 环 / 状态变体）
│   │   ├── haptic-badge.tsx      # 徽章（dot / pill / count / outline）
│   │   ├── haptic-button.tsx     # Utility 风格按钮（standard / primary）
│   │   ├── haptic-checkbox.tsx   # 动画复选框
│   │   ├── haptic-chip.tsx       # 彩色标签（7 色 + light/dark）
│   │   ├── haptic-icon-button.tsx# 图标按钮（复用 hapticButtonVariants）
│   │   ├── haptic-knob.tsx       # 旋转旋钮（拖拽 + 键盘）
│   │   ├── haptic-progress.tsx   # 进度条（5 色 + 条纹 + 不确定态）
│   │   ├── haptic-radio.tsx      # 动画单选按钮
│   │   ├── haptic-segmented-control.tsx # iOS 风格分段控件
│   │   ├── haptic-select.tsx     # 下拉选择（动画列表 + 描述）
│   │   ├── haptic-slider.tsx     # 范围滑块（纯 CSS 过渡）
│   │   ├── haptic-stepper.tsx    # 数字步进器
│   │   ├── haptic-switch.tsx     # 开关（checked / unchecked）
│   │   ├── haptic-tabs.tsx       # 标签栏（default / pill / underline）
│   │   └── haptic-tooltip.tsx    # 工具提示（4 方位 + 4 变体）
│   ├── icons/                    # App 级动画图标
│   │   ├── GaugeIcon.tsx         # 仪表图标（Desk tab）
│   │   ├── FanIcon.tsx           # 风扇图标（Plant tab）
│   │   └── SettingsIcon.tsx      # 齿轮图标（Settings tab）
│   ├── layout/
│   │   └── TabBar.tsx            # 底部标签栏（layoutId 动画指示器）
│   └── ui/                       # shadcn/ui 基础组件
│       ├── button.tsx            # 按钮（6 变体 + 4 尺寸）
│       ├── card.tsx              # 卡片布局族（7 个子组件）
│       └── input.tsx             # 文本输入框
├── demo/
│   └── SkeuomorphismShowcase.tsx # 设计系统全量展示页
├── lib/
│   └── utils.ts                  # cn() 工具（clsx + tailwind-merge）
├── pages/
│   ├── DeskPage.tsx              # 主仪表盘（脊柱可视化 + 设备状态 + 角度卡片）
│   ├── PlantPage.tsx             # 植物养成页（5 阶段 SVG + 积分表格）
│   └── SettingsPage.tsx          # 设置页（设备 / AI / MCP / 通知 / 关于）
└── styles/
    └── index.css                 # 全局样式（shadcn 主题 + Haptic token + 拟物工具类）
```

---

## 3. 成员清单

| 文件 | 职责 |
|------|------|
| `app/main.tsx` | Vite 入口，`createRoot` 挂载 `<App />` |
| `app/App.tsx` | 根组件，Tab 路由 + URL query 参数 + 动画图标管理 |
| `lib/utils.ts` | `cn()` 合并 Tailwind 类名 |
| `components/haptic/tokens.ts` | 设计 token 常量（调色板 / 渐变 / 阴影 / 圆角 / 类型定义） |
| `components/haptic/motion.ts` | 动画预设（springSnappy / springSoft / tweenSurface） |
| `components/haptic/icons.tsx` | 8 个 SVG 图标组件 |
| `components/haptic/index.ts` | 桶导出，聚合所有 haptic 组件 + token + 图标 |
| `components/haptic/haptic-accordion.tsx` | 可折叠手风琴（单/多模式，受控/非受控） |
| `components/haptic/haptic-avatar.tsx` | 头像（尺寸 / 环 / 状态变体，initials 回退） |
| `components/haptic/haptic-badge.tsx` | 徽章（dot / pill / count / outline，7 色） |
| `components/haptic/haptic-button.tsx` | Utility 按钮（standard / primary，图标 + motion 反馈） |
| `components/haptic/haptic-checkbox.tsx` | 动画复选框（选中/未选中 + 尺寸/缩进） |
| `components/haptic/haptic-chip.tsx` | 彩色标签（7 色 + light/dark + 尺寸/形状） |
| `components/haptic/haptic-icon-button.tsx` | 图标按钮（复用 hapticButtonVariants） |
| `components/haptic/haptic-knob.tsx` | 旋转旋钮（拖拽旋转 + 键盘 + 3 尺寸） |
| `components/haptic/haptic-progress.tsx` | 进度条（5 色 + 条纹 + 不确定态） |
| `components/haptic/haptic-radio.tsx` | 动画单选按钮（选中/未选中 + 尺寸/缩进） |
| `components/haptic/haptic-segmented-control.tsx` | iOS 分段控件（滑动指示器 + 键盘） |
| `components/haptic/haptic-select.tsx` | 下拉选择（动画列表 + 描述 + 勾选） |
| `components/haptic/haptic-slider.tsx` | 范围滑块（纯 CSS 过渡，无 motion 依赖） |
| `components/haptic/haptic-stepper.tsx` | 数字步进器（+/- 按钮 + min/max） |
| `components/haptic/haptic-switch.tsx` | 开关（checked/unchecked + motion 反馈） |
| `components/haptic/haptic-tabs.tsx` | 标签栏（default / pill / underline 变体） |
| `components/haptic/haptic-tooltip.tsx` | 工具提示（4 方位 + 4 变体 + 延迟） |
| `components/icons/GaugeIcon.tsx` | 仪表 SVG 图标（Desk tab，forwardRef + 动画） |
| `components/icons/FanIcon.tsx` | 风扇 SVG 图标（Plant tab，spring 旋转） |
| `components/icons/SettingsIcon.tsx` | 齿轮 SVG 图标（Settings tab，180° 旋转） |
| `components/layout/TabBar.tsx` | 底部标签栏（layoutId 动画指示器） |
| `components/ui/button.tsx` | shadcn 按钮（6 变体 + 4 尺寸） |
| `components/ui/card.tsx` | shadcn 卡片族（Card + 6 子组件） |
| `components/ui/input.tsx` | shadcn 文本输入框 |
| `demo/SkeuomorphismShowcase.tsx` | 设计系统全量展示页 |
| `pages/DeskPage.tsx` | 主仪表盘（脊柱 SVG + 设备状态 + 角度卡片） |
| `pages/PlantPage.tsx` | 植物养成（5 阶段 SVG + 积分表格） |
| `pages/SettingsPage.tsx` | 设置页（设备 / AI / MCP / 通知 / 关于） |
| `styles/index.css` | 全局样式（shadcn 主题 + Haptic token + 拟物工具类 + 动画） |

---

## 4. 依赖关系

```
main.tsx → App.tsx → TabBar / DeskPage / PlantPage / SettingsPage
                  → GaugeIcon / FanIcon / SettingsIcon

SettingsPage → haptic-switch.tsx（直接导入）

SkeuomorphismShowcase → haptic/index.ts → 全部 18 个 haptic 组件
                      → ui/card.tsx, input.tsx

utils.ts ← 19 个组件文件（几乎所有 UI 组件都依赖）
tokens.ts ← motion.ts, haptic-button, haptic-checkbox, haptic-chip,
            haptic-icon-button, haptic-progress, haptic-radio, index.ts
motion.ts ← 14 个 haptic 组件
icons.tsx ← haptic-accordion, haptic-button, haptic-checkbox,
            haptic-chip, haptic-icon-button, haptic-select, haptic-stepper
```

---

## 5. 维护纪律

- 新增/删除/移动任何源文件 → 必须同步更新本文件的成员清单。
- 修改任何模块边界（导入/导出/职责）→ 必须同步更新对应文件的 P3 头部。
