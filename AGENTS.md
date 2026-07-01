# Catune · AGENTS.md

> 目标：保持一个对 Agent 友好、对 vibe coding 友好的 Expo React Native 项目。  
> 文档语言：中文。Commit message 必须中文 Conventional Commits。

## 项目定位

Catune 是一个久坐坐姿辅助 App。正式交付是 Expo SDK 54 / React Native 0.81 App，一套 TypeScript 跑 iOS、Android 和 Web(RNW)。当前仓库已清理掉历史 PRD、docs、静态 HTML 原型和 Vite 原型；后续不要把它们重新引入为正式开发入口。

## 开发入口

```bash
npm run dev        # Expo Web，日常 UI/交互 vibe coding
npm run dev:mobile # Expo Go / 真机
npm run dev:android
npm run dev:ios
```

验证命令：

```bash
npm run tsc:rn
npm test -- --runInBand
npm run lint
```

## 目录边界

```text
src/design/    # UI、组件库、screens、theme、i18n
src/posture/   # 纯 TS 业务核心：姿态规则、打分、建议、训练、成长、日报
src/platform/  # 平台适配：DeviceMotion、BLE、Vibration、FileSystem、memory
src/mnn/       # 模型下载、设备推荐、端侧推理 JS 客户端
src/assess/    # 视觉评估服务：cloud/local/preset
src/debug/     # 调试日志总线
android/       # Android 原生壳与 MNN JNI 支线
ios/           # iOS 原生壳与 CatuneMnn 占位模块
public/        # App 视觉资源
```

## Agent 修改规则

- 涉及用户可见 UI、文案、交互、流程、状态、可访问性或响应式行为时，先加载 `.agents/skills/catune-product-design/SKILL.md`，按它路由到最小必要参考。
- UI 改动统一放在 `src/design/`。
- 页面放 `src/design/screens/`；可复用组件放 `src/design/components/`；基础原语放 `src/design/primitives/`。
- 主题 token 放 `src/design/theme/`；不要在页面里随意散落颜色、半径、阴影和字号。
- 文案走 `src/design/i18n/`；新增 key 必须同时补 `en.ts` 和 `zh.ts`。
- 姿态分类、分数、建议兜底、禁词逻辑只放 `src/posture/`。
- DeviceMotion、BLE、震动、文件系统、NativeModules 不要直接写进 UI 组件，必须经 `src/platform/` 或 `src/mnn/`。
- 不要新增 `docs/`、`PRD/`、`prototype/`、`web/` 作为项目知识或正式 UI 来源。
- 如果需要长期说明，更新 `README.md` 或本文件；不要分散新文档。

## UI 工作流

1. 用 `npm run dev` 打开 Expo Web。
2. 按 `.agents/skills/catune-product-design/SKILL.md` 确认这次是 Shape / Implement / Review / Copy / Harden。
3. 改 `src/design/screens/*` 或 `src/design/components/*`。
4. 抽出重复视觉模式到 `src/design/components/` 或 `src/design/primitives/`。
5. 需要跨屏统一的视觉变量时，先加到 `src/design/theme/`。
6. 完成后跑 `npm run tsc:rn`、`npm test -- --runInBand`、`npm run lint`。

## 当前架构要点

- `App.tsx` 持有姿态引擎、数据源、记忆服务、成长追踪、提醒服务，并渲染 `src/design/AppShell`。
- `src/posture/engine.ts` 是姿态规则状态机和安全兜底的核心。
- 数据源优先级：BLE 姿态带、手机 DeviceMotion、mock 兜底。
- Android MNN 原生能力默认不编；只有明确做端侧模型联调时才进入 `android/` 和 `src/mnn/`。

## 提交规范

Commit message 必须中文 Conventional Commits：

```text
feat(design): 优化书桌页状态卡片
fix(posture): 修复头前倾动作标签解析
chore: 清理历史原型目录
```
