# Catune · Omni-Posture Master

> Android 包名：`com.catune`
> 参赛方向：TONGYI LAB x Arm 手机端挑战赛
> 文档语言：中文

Catune 是一个 **React Native 跨平台手机 App（iOS + Android，一套 TS 代码）**，不是小程序、H5 或纯演示页。面向 2026-06-22 挑战赛交付“不驼背坐姿助手”的可演示闭环。

**架构两层**：业务逻辑（姿态状态机 / 打分 / 建议 / 模拟数据）用 **TypeScript** 写一次、iOS/Android 通用（`src/posture/`）；只有「端侧 Qwen+MNN 推理」「真蓝牙」这类原生能力下沉到各平台原生层。

> **当前阶段（2026-06-10）**：纯 TS 仪表盘可在 **iOS / Android** 跑（模拟器或 iPhone via Expo），由本地 10Hz 模拟流驱动，显示姿态分数/角度/状态，并**根据姿态给出建议文案（规则兜底，离线可用）**。已通过 `jest` + `tsc` 类型检查。端侧 Qwen+MNN 推理桥（C++/JNI + Kotlin）**在仓库但默认不编、未接真模型**——缺 MNN 源/SME2 库/模型，接入计划见 [docs/端侧模型对接计划.md](docs/端侧模型对接计划.md)。多页面 UI 按 PRD 后续迭代。

核心产品诉求来自 [PRD/AI姿态矫正康复产品PRD.md](PRD/AI姿态矫正康复产品PRD.md)：持续检测久坐用户的驼背/头前倾，异常时给出震动和 App 提醒，并串起训练与复盘。最新技术口径以 [docs/技术实现文档.md](docs/技术实现文档.md) 为准。

> **平台说明**：UI/逻辑跨平台；端侧 AI 的 SME2 加速是 Arm CPU 特性、只能原生实现，**演示建议在安卓 Arm 真机上做**。物理 iPhone 跑「带 AI 的完整版」需 Mac/Xcode 或 EAS；纯 TS 演示版可用 Expo Go 在 iPhone 上免 Mac 预览。

### 仓库内的非 App 产物（不作为最终 APP 输出）

| 目录 | 用途 | 是否打进 App |
| --- | --- | --- |
| `web/` | 设计师快速迭代用的 Vite + React 原型工程 | ❌ 仅设计迭代，不作为最终 APP 输出 |
| `prototype/` | 静态 HTML 视觉/交互原型 | ❌ 仅视觉参考，不作为最终 APP 输出 |

> 最终交付物是 React Native App（仓库根 `App.tsx` + `src/` + `android/` + `ios/`）。`web/` 与 `prototype/` 保留供设计协作，最终 UI 回到 RN 实现。

## 硬性技术口径（目标态）

- **App 形态**：完整 React Native 手机 App（iOS + Android，一套 TS），React Native 0.76 + Hermes。✅ 已满足（构建出真原生 .apk/.ipa，非小程序/H5）
- **端侧推理**：核心姿态分类与本地反馈在手机端通过 Qwen + MNN 运行，本地 CPU 推理为主。🟡 推理桥代码就绪、默认不编；待模型/SME2 库/真机，见 [docs/端侧模型对接计划.md](docs/端侧模型对接计划.md)
- **Arm 加速**：MNN 库需使用支持 Arm SME2 的 arm64 构建；演示时展示 SME2/NEON 能力检测、模型加载状态和推理指标。🚧 随端侧模型一并接入
- **云端边界**：云端 Qwen-VL/API 只做低频视觉评估、报告润色或兜底辅助，不能替代核心姿态判断。
- **离线能力**：断网后仍能完成姿态分类、分数刷新、提醒文案和 F7 Mock 演示。✅ 规则状态机已离线可用

## 当前代码状态

| 层 | 当前实现 | 平台 |
| --- | --- | --- |
| RN UI | [App.tsx](App.tsx) 渲染分数 / Neck Pitch / Lumbar Roll / 状态 / **建议文案** + F7 Mock Console | iOS+Android（TS） |
| 姿态引擎 | `src/posture/engine.ts` 状态机（`NORMAL/SLUMPED/TECH_NECK/LEFT_LEAN/OFFLINE` + 0-100 分）+ 建议查表 + 禁词 + 规则兜底 | iOS+Android（TS） |
| 模拟数据 | `src/posture/mock.ts` 10Hz 模拟流；F7 锁定场景（修了原 Kotlin「设置被覆盖」的 bug） | iOS+Android（TS） |
| 安卓引导 | `CatuneApp`/`MainActivity`/`CatunePackage` 仅启动 RN（已无业务逻辑） | Android |
| 端侧推理（AI 支线） | 🟡 C++/JNI 桥 + `MnnPerceptionEngine` + `libMNN.so` 在仓库，**默认不编、未接线**；`-PenableMnn` 才挂 CMake。仍缺 MNN 源/SME2 库/模型 | Android（iOS 另写薄桥，C++ 复用） |

> 默认 `assembleDebug` 是纯 RN + 引导 Kotlin（不挂 CMake，模拟器可装）。端侧推理用 `-PenableMnn=true` 开启（需先放 MNN 源码到 `cpp/third_party/MNN/`）。
>
> 业务逻辑已从 Kotlin 迁到 TS（`src/posture/`），原 `KinematicsHub`/`KinematicsModule`/`SpineBluetoothManager` + Kotlin `posture/*` 已删（逻辑单一来源在 TS）。可从 git 历史恢复。
>
> 已移除（PRD §0.5.7 Non-Goals）：MCP/Ktor、CameraX/音频、Watchdog、Compose 面板、`DefaultPerceptionEngine`/`HeuristicAnalyzer`。

## 快速开始

```bash
npm install
npm start
```

另开一个终端运行：

```bash
npm run android     # 安卓模拟器或真机
npm run ios         # iOS 模拟器（需 Mac + Xcode）
```

不想装原生工具链、想直接在 iPhone 上看纯 TS 版？可接入 **Expo Go**（扫码即看，免 Mac；但不含端侧 AI 原生模块）。

Android 原生构建（产出 .apk）：

```bash
cd android
./gradlew assembleDebug
```

## 端侧模型

端侧 Qwen + MNN 的推理桥代码（C++/JNI + Kotlin）已在仓库，但默认不参与构建、未接入 RN 主链路；仓库不含模型权重与 SME2 版 libMNN。接入步骤、目录约定、`-PenableMnn` 开关、验收标准统一收敛到 [docs/端侧模型对接计划.md](docs/端侧模型对接计划.md)。

## 文档导航

| 入口 | 用途 |
| --- | --- |
| [docs/技术实现文档.md](docs/技术实现文档.md) | 最新权威技术实现方案，含 PRD 技术评审和代码现状 |
| [docs/端侧模型对接计划.md](docs/端侧模型对接计划.md) | 端侧 Qwen + MNN 重新接入的分步计划与验收 |
| [docs/硬件采购与小白使用指南.md](docs/硬件采购与小白使用指南.md) | 面向零硬件基础的采购清单、接线、通电和佩戴说明 |
| [PRD/AI姿态矫正康复产品PRD.md](PRD/AI姿态矫正康复产品PRD.md) | 产品需求、演示策略、功能验收 |
| [AGENTS.md](AGENTS.md) | DIP P1 根地图、模块导航和协作规范 |

## 验证命令

```bash
npm test     # jest 渲染冒烟测试（已通过）
npm run lint # eslint（src/ 与 App.tsx 0 error）
cd android && ./gradlew assembleDebug                 # 默认：纯 RN + 引导 Kotlin（不挂 CMake，模拟器可装）
cd android && ./gradlew assembleDebug -PenableMnn=true # 端侧推理：编 arm64 native（需先放 MNN 源码到 cpp/third_party/MNN/）
```

> 说明：`App.tsx` + `src/posture/*` 已通过 `tsc --noEmit` 类型检查与 `jest` 挂载测试。Android/iOS 的 `gradlew`/Xcode 构建需在装有对应 SDK 的机器上验证。
