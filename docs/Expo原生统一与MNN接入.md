# Expo 原生统一 + MNN 接入（在 M2 Mac 上跑）

> 版本：**2026-06-16**（联调实测见 [联调进度与实测记录](./联调进度与实测记录.md)）  
> 目标：把 Android 原生统一到 **Expo SDK 54 / RN 0.81**（与 JS 一致）+ 自动链接 expo-sensors / react-native-svg，并保留端侧 **MNN** 原生模块；之后在 **arm64 模拟器或真机**上调试端侧模型。

---

## 当前结论（2026-06-16）

| 项 | 状态 |
| --- | --- |
| 联调模型 | **Qwen2.5-0.5B-Instruct-MNN**（~550MB，INT4） |
| 模拟器 | 链路跑通；输出乱码/!!!! **预期内**，仅用于 UI/下载/加载 |
| 真机 | 中文正常；**TPS ~88.7**（0.5B，CPU/NEON 回退） |
| SME2 | lib 已编 SME2；当前真机 **hw sme2=false**，未走 SME2 backend |
| 模型进机 | App 内下载（断点续传 + 后台 + 多模型切换/删除），**免 adb push** |

---

## 0. 现状与为什么要做

| 层 | 现状 |
| --- | --- |
| JS | Expo SDK 54 / RN 0.81 + expo-sensors + react-native-svg + expo-file-system |
| `android/` 原生 | 还是裸 **RN 0.76** 工程，未接 Expo 自动链接 |

→ 直接 build 不过：RN 版本不匹配 + expo 模块没链接。必须先统一。

**思路（最稳）**：用 `expo prebuild` 重新生成正确的 RN 0.81 + Expo 原生工程，再把 MNN 原生文件从 git 取回 + 打两个补丁。MNN 文件都在 git 里（cpp/、jniLibs/libMNN.so、inference/、MnnDebugModule、CatunePackage），不会丢。

---

## 1. M2 前置

- Android Studio + SDK 35 + **NDK 27.0.12077973** + CMake 3.22.1
- 建一个 **arm64-v8a** 系统镜像的 AVD（M2 原生跑，快）
- MNN 源码放 `android/app/src/main/cpp/third_party/MNN/`（编 JNI 桥要它）
- Qwen MNN 模型（`config.json` / `llm.mnn` / `llm.mnn.weight`）

## 2. 统一原生（一次性）

```bash
# 0) 先确保当前改动已提交（MNN 文件要从这个提交取回）
git add -A && git commit -m "wip: prebuild 前快照"

# 1) 安装依赖（含 expo-build-properties / expo-file-system）
npm install
npx expo install --fix

# 2) 重新生成 android/（RN 0.81 + Expo 自动链接；会覆盖旧的裸工程）
npx expo prebuild -p android --clean

# 3) 把 MNN 原生文件从上一个提交取回到新 android/
git checkout HEAD -- \
  android/app/src/main/cpp \
  android/app/src/main/jniLibs \
  android/app/src/main/java/com/catune/inference \
  android/app/src/main/java/com/catune/rn/MnnDebugModule.kt \
  android/app/src/main/java/com/catune/rn/CatunePackage.kt
```

### 补丁 A：注册 CatunePackage（让 `CatuneMnn` 原生模块可用）

编辑 prebuild 生成的 `android/app/src/main/java/com/catune/MainApplication.kt`，在 `getPackages()` 里加一行：

```kotlin
override fun getPackages(): List<ReactPackage> {
  val packages = PackageList(this).packages
  packages.add(com.catune.rn.CatunePackage())   // ← 加这行
  return packages
}
```

### 补丁 B：挂上 MNN 的 CMake（`-PenableMnn` 时编 arm64 native）

编辑生成的 `android/app/build.gradle`，在 `android { ... }` 内加（沿用主线已验证的写法）：

```gradle
android {
  // ...defaultConfig 等...

  // 端侧 Qwen+MNN：仅 -PenableMnn 时编 native，仅 arm64
  if (project.hasProperty("enableMnn")) {
    defaultConfig {
      externalNativeBuild {
        cmake {
          cppFlags "-std=c++17"
          arguments "-DANDROID_STL=c++_shared"
          abiFilters "arm64-v8a"
        }
      }
    }
    externalNativeBuild {
      cmake {
        path "src/main/cpp/CMakeLists.txt"
        version "3.22.1"
      }
    }
  }

  sourceSets { main { jniLibs.srcDirs += ['src/main/jniLibs'] } }
}
```

> 也要把 `kotlinx-serialization` 插件 + `kotlinx-serialization-json` 依赖加回（`PerceptionModels`/`ModelOutputParser` 用到）。或后续把这两文件改成手写 JSON 去依赖。

## 3. 在 arm64 模拟器跑端侧模型

```bash
# 构建 + 装到 arm64 AVD（开 MNN）
npx expo run:android -- -PenableMnn=true
# 或：cd android && ./gradlew installDebug -PenableMnn=true

# push 模型到 App 私有目录
adb push <模型目录>/ /data/data/com.catune/files/mnn_models/qwen3-1.7b/
```

App → **Settings → MNN DEBUG → REFRESH**（native/model loaded）→ **INFER TEXT**（看 backend + ttft/tps + 输出）。

> ⚠️ 模拟器 `backend` 是 **NEON/CPU，不是 SME2**（虚拟 CPU 无 SME2）。SME2 卖点要真 SME2 手机。

## 4. 打 APK 给真机（同一个 arm64 APK）

```bash
cd android && ./gradlew assembleRelease -PenableMnn=true
# 产出 app/build/outputs/apk/release/app-release.apk（arm64）
adb install app-release.apk   # 或发文件给手机，开"未知来源"安装
```

模拟器(arm64) 与真机(arm64) 同一 ABI，**同一个 APK 都能跑**；真机若是 SME2 芯片且 ship 了 SME2 版 `libMNN.so`，才会走 SME2。

## 5. 模型怎么进手机：App 内「下载模型」✅（2026-06-16 增强）

模型不打进 APK。标准流程：**装 APK 一次 → App 内下载 → 自动写入 `filesDir/mnn_models/`**。

实现位置：

- `src/mnn/modelCatalog.ts` — 模型清单（Qwen2.5-0.5B / Qwen3-1.7B）
- `src/mnn/modelDownloadService.ts` — 全局下载（切 Tab / 退后台可继续；杀进程后自动续传）
- `src/ui/components/ModelDownloadCard.tsx` — 下载 / 更换 / 删除 / 设为此模型
- `mnn_models/.active` — 当前推理使用的 model id（原生 `MnnModelPaths.resolveSubdir()` 读取）

特性：

- **断点续传**：`mnn_models/.download_state.json` + `DownloadResumable`
- **后台**：顶部 `ModelDownloadBanner`；下载与 Settings 卡片生命周期解耦
- **多模型**：已安装列表、删除垃圾、切换活跃模型时 `CatuneMnn.releaseModel()`

`documentDirectory` = 原生 `context.filesDir`，与 `MnnDebugModule` 路径一致。

> **APK** = App；**模型** = 数据（App 内下载）。模拟器 INT4 乱码不能靠换模型根治，中文质量以真机为准（见联调记录）。

## 6. 之后可自动化

本流程的「补丁 A/B + 取回文件」可固化成 **Expo config plugin**，让每次 `prebuild` 自动注入 MNN（不用手动）。建议**先按本文手动跑通一次**，确认无误后我再帮你写成 plugin。
