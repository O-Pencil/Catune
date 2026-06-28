# iOS 真机构建与环境

> 版本：2026-06-28  
> 用途：记录 M2 Mac 上 Catune iOS 工程构建、端侧 MNN、真机安装的前置条件与卡点。  
> 关联：[iOS适配评估与计划](./iOS适配评估与计划.md) · [联调进度与实测记录](./联调进度与实测记录.md)

---

## 1. 当前进度（2026-06-28）

| 项 | 状态 |
| --- | --- |
| `expo prebuild -p ios --clean` + `CATUNE.xcworkspace` | ✅ 已完成 |
| `libMNN.a`（device arm64，LLM + NEON 汇编） | ✅ 已产出，`ios/CatuneMnn/MNN/lib/` |
| `CatuneMnn` Pod + 共享 C++ 核链接 | ✅ Xcode **BUILD SUCCEEDED**（含端侧桥） |
| Apple 自动签名 / 开发证书 | ✅ `Apple Development: …` 已在 Keychain |
| iPhone 开发者模式 | ✅ 已打开 |
| **真机安装** | ⏸ 待 **Xcode 26**（见 §2） |

编译产物路径：`ios/build/Build/Products/Debug-iphoneos/CATUNE.app`

---

## 2. 真机安装前置：必须升级 Xcode 26

### 2.1 原因

| 环境 | 版本 |
| --- | --- |
| 当前 Xcode | **16.4**（DeviceSupport 最高 **iOS 16.4**） |
| iPhone 16 Pro | **iOS 26.5** |

Xcode 16.4 无法给 iOS 26.5 挂载 **Developer Disk Image（DDI）**，表现为：

- `devicectl`：`connected (no DDI)` 或 `unavailable`
- `expo run:ios --device`：找不到可用设备 / 安装超时

**不是小版本更新，需要安装 Xcode 26.x**（建议 **Xcode 26.6** 或 **26.5**，支持 iOS 26.5 真机调试）。

### 2.2 升级 macOS（先决条件）

当前若低于 **macOS 15.6**，需先升级：

1. **系统设置 → 通用 → 软件更新**
2. 安装 **macOS Sequoia 15.7.7**（或系统提示的最新 15.x）
3. 重启 Mac

> Xcode 26 要求 **macOS Sequoia 15.6+** 或 **macOS Tahoe 26.x**。

### 2.3 安装 Xcode 26

**方式 A：Mac App Store（推荐）**

1. 打开 **App Store** → 搜索 **Xcode**
2. **更新 / 获取**（约 10GB+，预留磁盘空间）
3. 首次打开 Xcode → 同意许可协议

**方式 B：Apple 开发者下载**

1. [https://developer.apple.com/download/applications/](https://developer.apple.com/download/applications/)
2. 登录 Apple ID → 下载 **Xcode 26.6** 或 **26.5**（`.xip`）
3. 解压后将 `Xcode.app` 放入 `/Applications/`（旧版可改名为 `Xcode-16.4.app` 保留）

### 2.4 切换默认 Xcode

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcodebuild -version
# 期望：Xcode 26.x，Build 17F…
```

首次 USB 连接 iPhone 时，Xcode 可能自动下载 **iOS 26.5 Platform / Device Support**，等待完成。

### 2.5 签名（若尚未配置）

1. 打开 `ios/CATUNE.xcworkspace`
2. **TARGETS → CATUNE → Signing & Capabilities**
3. 勾选 **Automatically manage signing**，**Team** 选 Personal Team
4. iPhone：**设置 → 隐私与安全性 → 开发者模式** → 开

验证证书：

```bash
security find-identity -v -p codesigning
# 应至少有 1 条 Apple Development: …
```

---

## 3. 真机安装命令（Xcode 26 就绪后）

```bash
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
cd Posture-AI

# Metro（8081 占用时用 8082）
REACT_NATIVE_PACKAGER_HOSTNAME=$(ipconfig getifaddr en0) npx expo start --port 8082

# 另开终端：装到真机
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
npx expo run:ios --device --port 8082
```

或 Xcode 打开 `CATUNE.xcworkspace` → 选 **iPhone** → **Run**。

### 端侧 MNN 验收

1. App → **Settings** → 下载 `Qwen2.5-0.5B-Instruct-MNN`
2. **基准测试面板** → INFER / BENCH → 应有中文输出与 TPS

---

## 4. 已修复的构建问题（备忘）

| 问题 | 处理 |
| --- | --- |
| `PostureAI`/`Catune` 目录混乱、缺 `Expo.plist` | `npx expo prebuild -p ios --clean` |
| CocoaPods UTF-8 报错 | `export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` |
| `eyes_llm_session.cpp` 未编入 Pod | `ios/CatuneMnn/cpp/` symlink + podspec 修正 |
| `libMNN.a` 缺 ARM 汇编符号 | `build-mnn-ios.sh` 加 `-DARCHS=arm64 -DCMAKE_SYSTEM_PROCESSOR=aarch64` |
| 链接缺 MNN 符号 | podspec `-force_load libMNN.a` |

MNN iOS 构建：

```bash
export MNN_SRC=$PWD/android/app/src/main/cpp/third_party/MNN
bash scripts/build-mnn-ios.sh
npx expo prebuild -p ios && cd ios && pod install && cd ..
```

---

## 5. 口径

- **端侧 Qwen+MNN 真机验收**：Android arm64 为主线；iOS 桥已编过，待 Xcode 26 + 真机安装后补 Settings 基准测试。
- **SME2**：考核以 Android 为准；iPhone A18 无 SME2，iOS 走 NEON/SME。
