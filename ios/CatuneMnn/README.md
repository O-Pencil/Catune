# CatuneMnn（iOS 端侧 Qwen+MNN 推理桥）

端侧推理的 iOS RN 原生模块。方法名/事件名与安卓 `MnnDebugModule` **完全一致**，复用同一份 C++ 推理核
（`android/app/src/main/cpp/eyes_llm_session.*`），JS 侧（`src/mnn/*`、`inferStreamClient`、`assess`、基准面板）**零改动**。

- `CatuneMnn.{h,mm}`：完整实现 `getStatus / inferText / inferTextStream / analyzeImage / runBenchmark / releaseModel`。
- `CatuneMnn.podspec`：编模块 + 共享 C++ 核（排除 JNI 专属 `eyes_mnn_bridge.cpp`）+ 链接 `MNN/lib/libMNN.a`。
- 模型目录：`Documents/mnn_models/<activeId>/`（与 `expo-file-system` documentDirectory + 安卓 filesDir 对齐）。

## 启用（Mac 上）
```bash
export MNN_SRC=$PWD/android/app/src/main/cpp/third_party/MNN
bash scripts/build-mnn-ios.sh          # 产出 ios/CatuneMnn/MNN/lib/libMNN.a + include/
npx expo prebuild -p ios && cd ios && pod install && cd ..
npx expo run:ios --device
```
- `plugins/withCatuneMnn.js`（已挂 app.json）检测到 `MNN/lib/libMNN.a` 才把本 Pod 加进 Podfile；
  没编 MNN 时**自动跳过**，不影响「目标 A（iOS UI/云端/规则 demo）」的构建。

> `MNN/` 目录（编译产物）不入 git。
