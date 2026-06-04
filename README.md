# Posture-AI · 项目总览（中文）

> 智能体代号：**Posture-AI**（赛事名 *Omni-Posture Master*，Android 包名 `com.postureai`）
> 文档语言：**中文**
> 完整文档导航：[AGENTS.md](AGENTS.md)（`CLAUDE.md` 是其软链）

Posture-AI 是一款**端侧优先、隐私优先**的智能体应用，把"高频 IMU 脊柱动捕 + 端侧多模态大模型（Qwen3-VL via MNN）"打包成 MCP 工具，暴露给 PC 上的 LLM 智能体（Claude Code、Qwen、Codex 等）远程调用。

## 一句话定义

全球首款基于 **MCP 协议** 与 **端侧多模态大模型** 的软硬一体化"个人空间感知康复/运动智能体"。

## 核心特性

- **实时 3D 动捕**：跟踪脊柱角度（颈椎前倾 NECK PITCH、腰椎侧倾 LUMBAR ROLL）。
- **React Native 仪表盘**：现代、灵活的数据可视化界面。
- **端侧 AI**：基于 Qwen3-VL 的隐私优先视觉基线校准。
- **MCP 集成**：把物理动捕数据暴露为 LLM 智能体（Claude Code、Codex 等）可调用的工具。
- **降级运行**：无 MNN 权重时自动回退到启发式分析，**MCP 服务仍然可用**。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动 Android

```bash
npx react-native run-android
# 或
npm run android
```

### 3. 启动 MCP 服务

启动 App，点击 **"START MCP SERVICE"** 按钮（仪表盘底部），即可获得：

- 本地 URL：`http://<手机局域网 IP>:8765/mcp`
- Bearer Token：形如 `eop_<uuid>`

把这两个值配到 PC 端 Claude Code（或任意支持 MCP 的 LLM 智能体）即可远程调用手机的"看、听、感知、姿态数据、振动反馈"等 10 个工具。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React Native 0.76 + Hermes + New Architecture |
| 原生 | Kotlin 1.9.24 + Android SDK 35 + NDK 26 + CMake 3.22.1 |
| 端侧 AI | MNN 1.x + Qwen3-VL-2B（4 线程、低精度、低内存） |
| 端侧协议 | MCP（Model Context Protocol）JSON-RPC 2.0 + SSE |
| HTTP 服务 | Ktor 2.3.12 + CIO 引擎，监听 `0.0.0.0:8765` |
| 序列化 | kotlinx-serialization 1.7.1 |
| 摄像头 | CameraX 1.4.0（1280×720 拍照 + 640×480 分析流） |
| 音频 | AudioRecord 16kHz 单声道 PCM，10s 环形缓冲 |
| 二维码 | ZXing 3.5.3 |

## 目录导航

| 入口 | 内容 |
| --- | --- |
| [AGENTS.md](AGENTS.md) | P1 根地图：架构拓扑、关键抽象、构建命令、DIP 导航、中文 commit 规范（`CLAUDE.md` 是其软链，供 Claude Code 自动加载） |
| [__tests__/AGENTS.md](__tests__/AGENTS.md) | RN 测试模块 P2 |
| [android/app/src/main/java/com/postureai/AGENTS.md](android/app/src/main/java/com/postureai/AGENTS.md) | 31 个 Kotlin 源文件 P2 模块地图 |
| [android/app/src/main/cpp/AGENTS.md](android/app/src/main/cpp/AGENTS.md) | C++/JNI 桥接 P2 模块地图 |
| [PRD/AI姿态矫正康复产品PRD.md](PRD/AI姿态矫正康复产品PRD.md) | v1.9 完整产品需求（赛事向） |
| [PRD/技术规格文档.md](PRD/技术规格文档.md) | 硬件 / 数据协议 / AI 安全 / 研发模块拆分（516 行） |
| [docs/技术草案.md](docs/技术草案.md) | 软硬件结合技术方案 |
| [docs/README-Native.md](docs/README-Native.md) | Android 端构建与首次运行指南 |

## 文档协议

本项目采用 **DIP（Dual-phase Isomorphic Documentation）** 三层分形文档：

1. **P1（根地图）**：`AGENTS.md`（`CLAUDE.md` 是其软链）— 项目全局视野。
2. **P2（模块地图）**：每个模块的 `AGENTS.md` — 成员清单与关键调用链。
3. **P3（文件契约头）**：每个源文件顶部的中文注释 — `[WHO]` 导出、`[FROM]` 依赖、`[TO]` 消费方、`[HERE]` 位置与角色。

详细使用方式见 [AGENTS.md §7](AGENTS.md#7-dip-导航双相同构文档)。

## 许可与赛事

- 赛事背景：TONGYI LAB × Arm 手机端挑战赛（创意 AI 赛道）
- 目标周期：**2 周初赛版**（2026-06-08 — 2026-06-19），面向 **6.22 初赛**
- 团队规模：2 人（嵌入式 + App / 产品 + UI）
