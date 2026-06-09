# Catune · AGENTS.md

> 项目代号：**Catune**（赛事名 *Omni-Posture Master*，包名 `com.catune`）
> 类型：React Native 0.76 + Android 原生（Kotlin）手机 App
> 文档协议：DIP（Dual-phase Isomorphic Documentation）· P1 根地图
> 文档语言：**中文**

---

## 1. Identity（项目本质）

Catune 是面向久坐用户的「不驼背坐姿助手」**React Native Android App**（PRD 唯一交付形态，非小程序/H5/网页壳）。

- 核心目标：检测久坐人群的驼背/头前倾（颈前倾 NECK PITCH、腰椎侧倾 LUMBAR ROLL），异常时震动 + App 提醒，并串起训练与复盘闭环。
- 用户场景：TONGYI LAB × Arm 手机端挑战赛初赛（2026-06-22）演示 + 2 人小团队冲刺。
- **当前阶段（2026-06-09）**：RN 主链路是「纯 RN + 轻量 Kotlin」，可在 x86_64 模拟器运行，由本地模拟数据流驱动 RN 仪表盘。
- **端侧 Qwen + MNN 推理**：C++/JNI 桥 + Kotlin 推理桥 + `libMNN.so` **已恢复进仓库但默认不参与构建**（`-PenableMnn` 开关后才挂 CMake，仅编 arm64）；尚未接入 RN 主链路，仍缺 MNN 源码 / SME2 库 / 模型权重。详见 [docs/端侧模型对接计划.md](docs/端侧模型对接计划.md)。
- **已移除（不在初赛 MVP 范围，PRD §0.5.7 Non-Goals）**：MCP/Ktor 服务、CameraX/音频采集、Watchdog、Compose 调试面板、PairingManager、`DefaultPerceptionEngine`/`HeuristicAnalyzer`（相机/音频编排）。

---

## 2. 架构拓扑（ASCII）

当前（初赛最小骨架）数据流：模拟流 → 角度解算 → 状态机 → RN 仪表盘。

```
┌──────────────────────────────────────────────────────────────────┐
│                     Android 进程 (com.catune)                      │
│                                                                    │
│  ┌────────────────────┐        ┌────────────────────────────────┐ │
│  │  React Native UI   │        │  CatuneApp (Application)        │ │
│  │  App.tsx 仪表盘    │        │  onCreate 装配 + 启动模拟流      │ │
│  │  index.js 入口     │        └───────────────┬────────────────┘ │
│  │  NativeEventEmitter│                        │                  │
│  └──────────┬─────────┘                        ▼                  │
│             │ RN Bridge        ┌────────────────────────────────┐ │
│             │  onKinematics    │  SpineBluetoothManager          │ │
│             │  Update          │  10Hz 模拟流 / 预留真实 BLE      │ │
│             ▼                  └───────────────┬────────────────┘ │
│  ┌────────────────────┐                        │ 原始四元数        │
│  │  KinematicsModule  │                        ▼                  │
│  │  (RN 桥接)         │        ┌────────────────────────────────┐ │
│  │  getLatestState    │        │  MainActivity                   │ │
│  │  setSimulation...  │        │  calculateSpineAnglesStatic     │ │
│  └──────────┬─────────┘        │  （纯 Kotlin 占位角度解算）      │ │
│             │ 订阅 StateFlow    └───────────────┬────────────────┘ │
│             ▼                                   │ neck / lumbar    │
│  ┌─────────────────────────────────────────────▼────────────────┐ │
│  │  KinematicsHub (object, StateFlow)                            │ │
│  │  规则状态机：NORMAL/SLUMPED/TECH_NECK/LEFT_LEAN/OFFLINE + 0-100 分 │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘

   🚧 规划接入（docs/端侧模型对接计划.md）：
      KinematicsHub ──结构化 Prompt──► InferenceExecutor ──JNI──► libMNN ──► Qwen 2B INT4
                                          │ 仅结构化字段 → 本地查表 → 禁词检查 → RN
```

---

## 3. 目录结构（与 `ls -la` 对齐）

```
Catune/
├── App.tsx                       # RN 入口组件，仪表盘 + F7 Mock Console
├── index.js                      # AppRegistry 绑定
├── app.json                      # RN 应用元数据（name=Catune）
├── package.json                  # 依赖（RN 0.76、react 18.3.1）
├── tsconfig.json                 # 继承 @react-native/typescript-config
├── babel.config.js               # @react-native/babel-preset
├── metro.config.js               # 默认 Metro 配置
├── jest.config.js                # react-native preset
├── .eslintrc.js / .prettierrc.js # 代码风格
├── Gemfile                       # cocoapods 锁定版本
├── __tests__/                    # RN 渲染快照测试
├── android/                      # 原生 Android 主体
│   ├── build.gradle              # 根 build 脚本
│   ├── settings.gradle           # 包含 :app 子工程
│   ├── gradle.properties         # Hermes + New Arch
│   └── app/
│       ├── build.gradle          # com.catune 应用配置
│       ├── proguard-rules.pro
│       └── src/main/
│           ├── AndroidManifest.xml    # 权限（BLE/INTERNET）+ MainActivity
│           ├── java/com/catune/      # Kotlin 源码（见下）
│           ├── cpp/                   # C++/JNI MNN 桥（默认不编，-PenableMnn 才挂 CMake）
│           ├── jniLibs/arm64-v8a/     # libMNN.so（arm64，可能需换 SME2 版）
│           └── res/                   # 图标 + strings + styles
├── web/                          # 设计师快速迭代用 Vite+React 原型（不作为最终 APP 输出）
├── prototype/                    # 静态 HTML 视觉/交互原型（不作为最终 APP 输出）
├── ios/                          # 标准 RN iOS 脚手架（未启用原生模块）
├── PRD/
│   └── AI姿态矫正康复产品PRD.md  # 唯一 PRD：产品需求 / 功能 / 验收
├── docs/
│   ├── 技术实现文档.md            # 唯一技术实现：架构 / 数据 / 安全 / 构建
│   ├── 端侧模型对接计划.md        # 端侧 Qwen+MNN 重新接入的分步计划与验收
│   ├── 硬件采购与小白使用指南.md  # 唯一硬件指南：采购 / 接线 / 通电 / 佩戴
│   └── 设计-IDEA.md               # 设计 IDEA · Haptic 拟物化（Figma Make 提示词）
├── README.md                     # 项目总览与唯一入口
└── AGENTS.md                     # P1 根地图（CLAUDE.md 是其软链，供 Claude Code 自动加载）
```

### Kotlin 源码（`android/app/src/main/java/com/catune/`，目录名已与 `package com.catune` 对齐）

```
com/catune/
├── CatuneApp.kt                  # Application：装配 + 启动模拟流
├── MainActivity.kt               # RN 宿主 + calculateSpineAnglesStatic 占位角度解算
├── rn/
│   ├── KinematicsModule.kt       # RN 桥接：订阅 KinematicsHub → onKinematicsUpdate
│   └── CatunePackage.kt          # ReactPackage 注册 KinematicsModule
├── inference/
│   ├── PerceptionModels.kt       # 通用推理数据契约（@Serializable，VL 形态）
│   ├── mnn/
│   │   ├── KinematicsHub.kt      # 规则姿态状态机（StateFlow，RN 主链路）
│   │   ├── MnnPerceptionEngine.kt # 端侧 MNN Kotlin/JNI 桥（analyze + inferText）·已恢复·未接线
│   │   ├── InferenceExecutor.kt  # 单线程串行加载/推理
│   │   └── ModelOutputParser.kt  # MNN 输出 JSON 解析
│   └── posture/                  # 姿态化推理（对齐技术文档 §3.3 / 安全链 §7.2）
│       ├── PostureInference.kt   # 信号/Prompt/分类契约 + 输出解析
│       ├── PostureAdvice.kt      # 本地查表文案 + 禁词检查
│       └── PostureClassifier.kt  # 编排：模型优先 → 规则兜底
└── bluetooth/
    └── SpineBluetoothManager.kt  # 10Hz 模拟流 + 预留真实 BLE GATT
```

---

## 4. 关键抽象（≤ 7 个）

| 抽象 | 位置 | 职责 |
| --- | --- | --- |
| `CatuneApp` | `android/.../CatuneApp.kt` | Application：初始化 RN/SoLoader，启动 `SpineBluetoothManager` 模拟流驱动仪表盘 |
| `MainActivity` | `android/.../MainActivity.kt` | RN 宿主；`calculateSpineAnglesStatic` 纯 Kotlin 占位角度解算（待接真实算法/端侧模型） |
| `KinematicsModule` | `android/.../rn/KinematicsModule.kt` | RN 桥接：订阅 `KinematicsHub.state` → `onKinematicsUpdate`；暴露 `getLatestState` / `setSimulationScenario`（F7 Mock Console） |
| `KinematicsHub` | `android/.../inference/mnn/KinematicsHub.kt` | 实时姿态规则状态机（颈前倾/腰椎侧倾/姿势枚举/0-100 分），`StateFlow` 单一状态枢纽 |
| `SpineBluetoothManager` | `android/.../bluetooth/SpineBluetoothManager.kt` | 10Hz 模拟数据流写入 `KinematicsHub`；预留真实 BLE GATT（PoseMaster-C6） |
| `CatunePackage` | `android/.../rn/CatunePackage.kt` | ReactPackage，把 `KinematicsModule` 注册到 RN runtime |
| `MnnPerceptionEngine` | `android/.../inference/mnn/MnnPerceptionEngine.kt` | 端侧 MNN Kotlin/JNI 桥（`analyze` + 推理指标）。**已恢复·未接线**，`-PenableMnn` 才编 native |
| `InferenceExecutor` | `android/.../inference/mnn/InferenceExecutor.kt` | 单线程 `eyes-mnn-infer` 串行化模型加载/推理，幂等 `ensureModelLoaded` |

> C++ 层（`cpp/eyes_mnn_bridge.cpp` → `eyes_llm_session.cpp` → libMNN）已恢复，含 SME2/NEON 检测与 ttft/tps 指标；接入与缺口见 [docs/端侧模型对接计划.md](docs/端侧模型对接计划.md)。

---

## 5. 构建与运行

### 5.1 公共前置

- Node ≥ 18、Yarn 或 npm
- Android Studio Ladybug+、Android SDK 35（默认构建**不需要** NDK/CMake；仅 `-PenableMnn` 端侧推理需要 NDK 27 + MNN 源码）
- 模拟器：标准 x86_64 AVD 即可（ABI = `arm64-v8a` + `x86_64`）

### 5.2 启动 RN 仪表盘（模拟器可跑）

```bash
npm install
# 终端 1：Metro
npm start
# 终端 2：Android（x86_64 模拟器或真机）
npm run android
```

启动后仪表盘由本地 10Hz 模拟流驱动，显示姿态分数 / Neck Pitch / Lumbar Roll / 当前状态；F7 Mock Console 可一键切 `NORMAL/SLUMPED/TECH_NECK/LEFT_LEAN/OFFLINE`。

### 5.3 端侧模型（默认关闭）

推理桥代码已在仓库，但默认不参与构建。开启需 MNN 源码 + 模型，详见 [docs/端侧模型对接计划.md](docs/端侧模型对接计划.md)：

```bash
# 1) 把 MNN 源码放到 android/app/src/main/cpp/third_party/MNN/
# 2) 仅 arm64 真机/AVD：
cd android && ./gradlew assembleDebug -PenableMnn=true
```

### 5.4 验证与检查

```bash
npm test                                # RN 渲染冒烟测试
npm run lint                            # 静态检查
cd android && ./gradlew assembleDebug   # 默认：纯 RN + Kotlin（不挂 CMake，模拟器可装）
```

---

## 6. 核心约定

- **命名**：Kotlin 包 `com.catune`，目录 `java/com/catune/` 已与包名对齐。
- **日志**：`Tag = "KinematicsModule"` 等（Kotlin，使用类名）。
- **线程**：RN 桥接走 `Dispatchers.Main`；模拟流走 `Dispatchers.Default`。
- **状态流**：UI 状态用 `StateFlow`（`KinematicsHub`），RN 端通过 `NativeEventEmitter` 订阅。
- **数据源**：初赛由 `SpineBluetoothManager` 模拟流驱动；真实 BLE 与端侧模型按计划接入。

---

## 7. DIP 导航（双相同构文档）

本项目按 **P1（根地图）/ P3（文件契约头）** 组织文档（精简后已无 P2 模块地图）：

| 层级 | 文件 | 作用 |
| --- | --- | --- |
| P1 | `AGENTS.md`（本文件） / `CLAUDE.md` | 项目拓扑、技术栈、构建命令、关键抽象 |
| P2 | `ios/AGENTS.md` | iOS RN 脚手架（未启用原生模块） |
| P2 | `__tests__/AGENTS.md` | RN 渲染测试 |
| P3 | 每个源文件顶部的中文注释头 | `[WHO]` 导出 · `[FROM]` 依赖 · `[TO]` 消费方 · `[HERE]` 位置与角色 |

**阅读顺序**：先看 P1（你正在读）→ 按需进入 P2（模块成员清单）→ 在 P2 找到目标文件 → 先看 P3 头部判断是否相关，再决定是否深入读代码。

**维护纪律**：
- 新增/删除/移动任何源文件 → 必须同步更新对应 P2 的成员清单。
- 修改任何模块边界（导入/导出/职责）→ 必须更新对应文件的 P3 头部。
- P1 中的「关键抽象」发生变化（新增/废弃/合并）→ 同步更新 P1。

---

## 8. Commit 规范（中文强制）

所有 commit message **必须使用中文**，并遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

[optional body]
```

### Type 类型

| Type       | 用途                         |
| ---------- | ---------------------------- |
| `feat`     | 新功能                       |
| `fix`      | 修复 Bug                     |
| `docs`     | 仅文档变更                   |
| `style`    | 代码格式（空格、分号等）     |
| `refactor` | 重构（非 bugfix 也非 feat）  |
| `perf`     | 性能优化                     |
| `test`     | 测试相关                     |
| `chore`    | 构建、工具链、依赖           |
| `ci`       | CI/CD 配置                   |
| `revert`   | 回滚                         |

### 规则

- **语言**：必须中文。禁止英文 commit message。
- **Subject**：祈使句，不加句号，不超过 72 字符。
- **Scope**：可选，小写（如 `android`、`ios`、`rn`、`mcp`、`prd`）。
- **Body**：每行不超过 72 字符，说明 *为什么*，而不是 *做了什么*。

### 示例

```
feat(android): 集成 MNN 推理引擎
fix(prd): 修复文件移动导致的 UTF-8 编码损坏
docs: 添加 commit 规范到 AGENTS.md
chore(android): 更新 Gradle 构建配置
```

> Claude Code 兼容说明：项目根的 `CLAUDE.md` 是本文件的**符号链接**（`CLAUDE.md → AGENTS.md`），Claude Code 会自动加载 `CLAUDE.md`，内容与本文件完全一致，**无需手动同步**。
