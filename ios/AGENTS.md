# ios · AGENTS.md

> 模块：iOS React Native 脚手架
> 协议层级：DIP · P2（模块地图）
> 父文档：[../AGENTS.md](../AGENTS.md)
> 状态：**RN iOS 脚手架 + TS 传感器数据可用**（未启用 Catune iOS 原生 AI 模块）

iOS 端目前可通过 Expo Go / RN 调用 TS 层 `src/posture/sensorSource.ts`，读取 iPhone DeviceMotion 并驱动姿态仪表盘；这属于 JS/Expo 能力，不需要本目录新增原生模块。

iOS 原生能力仍未与 Android 对齐：没有 `CatuneMnn`、没有 iOS MNN/LLM 桥、没有 CoreBluetooth 姿态带链路。后续若要 iOS 化，应在 `ios/PostureAI/` 下新建与 Android 对应的 ObjC++/Swift 桥接文件，并同步更新本文档。

## 成员清单（4 个源文件）

| 文件 | 责任 | 技术要点 |
| --- | --- | --- |
| `PostureAI/AppDelegate.h` | AppDelegate 头声明，继承 `RCTAppDelegate` | 空体，全部逻辑由父类提供 |
| `PostureAI/AppDelegate.mm` | AppDelegate 实现：设置 `moduleName="Catune"`、`initialProps={}`，返回 `bundleURL`（Debug 走 Metro，Release 走 `main.jsbundle`） | `RCTBundleURLProvider` |
| `PostureAI/main.m` | Objective-C 入口，`UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]))` | UIKit |
| `PostureAITests/PostureAITests.m` | XCTest 集成测试，等待根 View 出现 `Welcome to React` 子视图，超时 600s | `RCTSetLogFunction` 拦截 RedBox |

## 配置与资源

| 文件 | 责任 |
| --- | --- |
| `Podfile` | CocoaPods 配置，使用 RN 0.76 的 `use_react_native!`、target `PostureAI` + `PostureAITests`、启用 `:mac_catalyst_enabled => false` |
| `PostureAI/Info.plist` | `CFBundleDisplayName=Catune`、ATS（`NSAllowsArbitraryLoads=false` + `NSAllowsLocalNetworking=true`）、`arm64` only、portrait + landscape 方向 |
| `PostureAI/PrivacyInfo.xcprivacy` | iOS 17+ 隐私清单：仅记录 `FileTimestamp` / `UserDefaults` / `SystemBootTime` 三个系统 API 调用，不收集任何用户数据 |
| `PostureAI/LaunchScreen.storyboard` | 标准 RN 启动屏 |
| `PostureAI/Images.xcassets/` | App 图标资源 |
| `PostureAI.xcodeproj/project.pbxproj` | Xcode 工程文件，target `PostureAI` + `PostureAITests` |
| `.xcode.env` | 注入 `NODE_BINARY` 环境变量给 Xcode build phases 使用 |

## iPhone 端侧模型评估

iPhone 跑本地 Qwen 小模型技术上可行，但不作为当前比赛主线：

- Expo Go 不能加载自定义 MNN/MLX/llama.cpp 原生运行时；必须使用 Xcode 或 EAS dev client 构建自定义 iOS App。
- 需要单独编译 iOS 运行库（MNN iOS / MLX / llama.cpp 其一），写 ObjC++/Swift RN 原生模块，处理模型文件导入、沙盒路径、内存和签名。
- 比赛的 Arm SME2/MNN 叙事、现有 JNI/C++ 桥和调试模块都在 Android arm64 路线上；iPhone 当前更适合做真实手机 IMU 数据测试。

## 复赛 iOS 化待办

- 把 Android 的 `MainActivity` / `MainApplication` 用 Swift 镜像
- 用 `CoreBluetooth` 接入真实姿态带 BLE
- 单独编译并接入 iOS MNN/LLM 运行库，暴露与 Android `CatuneMnn.getStatus()` / `inferText()` 对齐的 RN 模块

## 维护纪律

- 当前 iOS 端 P3 头部由本次 DIP 整理补齐，但**禁止无脑同步 Android 模块**，避免误导后续维护者认为 iOS 端也有相关实现。
- 任何 iOS 原生模块新增 → 同步在本文档加一行，并新建对应的 P2 子目录 `ios/PostureAI/<Module>/AGENTS.md`。
