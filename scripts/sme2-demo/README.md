# SME2 功能级演示（无 SME2 硬件 / M2 Pro）

> 目的：在没有 SME2 硬件的电脑上，**证明 MNN 的 SME2 代码路径真的被走到、输出正确**。
> **这是功能/适配证据，不是速度证据**——QEMU 是模拟，比真机慢，**不能**用来讲"加速 X 倍"。
> 真·加速数字需 SME2 硬件（如 Apple M4 / 含 SME2 的 Arm 真机），口径：「代码已适配，设备就绪即加速」。

## 为什么这么做
- SME2 是 Armv9.2+ 硬件特性，无法软件开启；**M2 Pro 无 SME2**（SME 从 M4 起）。
- 唯一办法是让 CPU"看起来有 SME2"：用 **`qemu-aarch64 -cpu max`** 模拟一个带 SME/SME2 的 CPU 来跑二进制。
- 为避免在模拟器里慢吞吞地编译：用 **Docker(linux/arm64，在 M2 上原生)先快速编好 MNN**，只让**推理**那一步在 qemu 模拟 CPU 上跑。

## 前置
- Docker Desktop（Apple Silicon，含 arm64）
- 本地 MNN 源码：`export MNN_SRC=~/MNN`
- Qwen 的 `.mnn` 模型目录（含 `config.json`/`llm.mnn` 等；可从 hf-mirror `taobao-mnn/Qwen2.5-0.5B-Instruct-MNN` 下载）：`export MODEL_DIR=~/models/qwen2.5-0.5b`

## 跑
```bash
export MNN_SRC=~/MNN
export MODEL_DIR=~/models/qwen2.5-0.5b
bash scripts/sme2-demo/run-sme2-demo.sh
```

## 录制重点（视频）
1. `qemu-aarch64 -cpu help | grep sme2` —— 证 qemu 暴露 SME2。
2. 构建日志里 `MNN_SME2=ON / KleidiAI` 开启。
3. 推理时 MNN 选到 **SME2 / KleidiAI 内核**（backend 日志）。
4. **正确的中文教练输出**（同 App 端那句）。
5. 口播口径：「同一份 MNN 代码已适配 SME2；这里用 QEMU 模拟出 SME2 CPU，内核被自动选中、输出正确；在 SME2 真机（如 M4）上即为硬件加速。」

## 可能要微调的点（不同 MNN 版本）
- `llm_demo` 的参数/路径可能不同（有的是 `config.json` + prompt 文件，有的是交互式）；脚本已做两种尝试，必要时按你的 MNN 版本改。
- 若 backend 没打印 SME2：确认 MNN 这版的 KleidiAI/SME2 派发是否依赖额外宏；可加调试输出或查 `source/backend/cpu` 的特性探测。
- qemu 需较新版本（8.x+）才完整支持 SME2；Ubuntu 24.04 的 `qemu-user` 一般够；过老可 `apt install` 新版或自编。
- 推理在模拟 CPU 上**会慢**，建议短 prompt + 小 max tokens，只录"能跑出正确首句"即可。

## 备选（更轻，但只证"特性存在"不证"MNN 走 SME2"）
- 跑一个最小 SME2 测试程序（如 KleidiAI 自带 example / 一段 SME2 matmul）在 `qemu -cpu max` 下执行成功，配 `/proc/cpuinfo` 显示 `sme sme2`。适合当兜底镜头，但说服力不如上面 MNN+Qwen 全链路。
