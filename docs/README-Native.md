# Android App · 构建与运行指南（中文）

> 对应英文原文：[README-Native.md.en](README-Native.md.en)
> 父文档：[../AGENTS.md](../AGENTS.md)（`CLAUDE.md` 是其软链）

## 环境要求

- Android Studio **Ladybug** 或更新版本
- Android SDK **35**
- Android NDK **26**（用于 `eyes_mnn_bridge` JNI 桩；MNN 库本体在 `jniLibs/arm64-v8a/libMNN.so` 已预置）
- 物理设备 API **29+**，建议 8GB 内存

## 构建步骤

1. 在 Android Studio 中打开本目录（`android/`）。
2. 等待 Gradle 同步；如需手动指定 SDK 路径，新建 `local.properties` 写入 `sdk.dir=<你的 SDK 路径>`。
3. 在物理设备上选择 **app** 配置并 Run。

## 首次运行流程

1. 授予 **摄像头**、**麦克风**、**通知** 权限。
2. 在 App 内点击 **"START MCP SERVICE"**，记录通知/控制台打印的：
   - URL：`http://<手机局域网 IP>:8765/mcp`
   - Bearer Token：形如 `eop_<uuid>`
3. 在 PC 端（需与手机同 Wi-Fi）配置 Claude Code / Codex 等支持 MCP 的 LLM 智能体，把上述 URL 与 Token 写入客户端。

   详细步骤见英文链接 [../docs/claude-code-setup.md](../docs/claude-code-setup.md)（该文件尚未汉化，按英文操作即可）。

## MNN 端侧模型（可选）

如果你已经转换好 **Qwen3-VL-2B MNN** 权重，推送至设备：

```bash
adb push <本地模型目录>/ \
  /data/data/com.postureai/files/mnn_models/qwen3-vl-2b/
```

模型目录必须包含以下 5 个必需文件：

- `config.json`
- `llm.mnn` / `llm.mnn.weight`
- `visual.mnn` / `visual.mnn.weight`

> **未推送权重时**：`DefaultPerceptionEngine` 会自动回退到 `HeuristicAnalyzer`，`PerceptionResult.degradedMode` 返回 `true`，**MCP 服务仍然可以正常调用**，只是返回的 `summary` 是基于像素级 RGB/亮度的启发式分析。

## 常见问题

- **Q：Service 启动后通过局域网无法访问？**
  A：检查 `PairingManager.serverPort`（默认 8765），以及手机的 Wi-Fi 是否允许局域网发现（部分路由器开启 AP 隔离）。
- **Q：MNN 加载失败 `loadError = Native libraries failed to load`？**
  A：检查 `app/build.gradle` 中 `ndk { abiFilters "arm64-v8a" }` 是否生效，确保 APK 内 `lib/arm64-v8a/libMNN.so` 和 `libeyes_mnn_bridge.so` 都存在。
- **Q：编译 `eyes_mnn_bridge.cpp` 找不到 `llm/llm.hpp`？**
  A：`CMakeLists.txt` 内的 `MNN_SOURCE_ROOT` 指向 `${CMAKE_CURRENT_SOURCE_DIR}/../../../../../../Template-github/eyes-on-my-phone/MNN-master`。请先准备 MNN 头文件目录（或按实际路径修改），否则只能靠预编译的 `libMNN.so` 跑通 native 调用，但不会包含完整 `Llm` 类声明。

更多问题排查见英文链接 [../docs/troubleshooting.md](../docs/troubleshooting.md)（尚未汉化）。

## 相关源码地图

- 入口与装配：[../android/app/src/main/java/com/postureai/MainActivity.kt](../android/app/src/main/java/com/postureai/MainActivity.kt) · [PostureAIApp.kt](../android/app/src/main/java/com/postureai/PostureAIApp.kt)
- MCP 服务：[../android/app/src/main/java/com/postureai/mcp/](../android/app/src/main/java/com/postureai/mcp/)
- 端侧推理：[../android/app/src/main/java/com/postureai/inference/](../android/app/src/main/java/com/postureai/inference/)
- JNI 桥接：[../android/app/src/main/cpp/](../android/app/src/main/cpp/)
- 完整 P2 模块地图：[../android/app/src/main/java/com/postureai/AGENTS.md](../android/app/src/main/java/com/postureai/AGENTS.md)
