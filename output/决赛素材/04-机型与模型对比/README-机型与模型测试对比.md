# 手机机型与模型测试对比

## 路演主结论

Catune 不是把同一个大模型硬塞进所有手机，而是识别设备能力后推荐合适的 Qwen 规格，并由 MNN 选择 SME2、i8mm 或 NEON 等运行路径。

| 阶段 | 设备 | 产品运行形态 | 端侧模型 | MNN / CPU 路径 | 实测表现 | 适合证明 |
| --- | --- | --- | --- | --- | --- | --- |
| 初赛 iOS | iPhone（原素材未记录具体型号） | Expo Go + DeviceMotion | 未运行原生 MNN | 不适用 | 不填写 TPS | 一套 TS 的跨端体验、真实手机 IMU 数据 |
| 初赛 Android | 小米 14 / arm64 | 原生 APK | Qwen2.5-0.5B Instruct MNN INT4 | `hw SME2=false`、`lib SME2=true`，CPU/NEON 回退 | timed 双轮平均 **62.97 tok/s**；另有单次 **88.69 tok/s** | 没有 SME2 的手机仍能离线运行端侧 Qwen |
| 决赛 Android | vivo V2509A / MT6993 / Android 16 | arm64 Release APK | Qwen3.5-4B MNN | `hw SME2=true`、`lib SME2=true`，面板显示 Backend **SME2** | 单次 **9.34 tok/s**；Prefill 642 ms；总耗时 2819 ms；20 tokens | 高性能机型可运行能力更强的 4B 模型 |

## 可直接讲的两句话

“同一套 Catune 会先识别手机性能。初赛的小米 14 不支持 SME2，我们让 Qwen2.5-0.5B 自动回退到 NEON，依然可以完成离线中文推理；到了支持 SME2 的 vivo V2509A，我们则推荐并运行能力更强的 Qwen3.5-4B。”

“所以这里不是只追求一个最高 token/s，而是在不同手机上平衡模型能力、速度、内存和隐私，让更多用户真正用得上端侧 AI。”

## 数据口径

- 不把 62.97 tok/s 与 9.34 tok/s描述为 SME2 加速前后倍率：两组模型分别为 0.5B 和 4B，模型规模、版本和采样条件不同。
- 62.97 tok/s 是两轮 timed 平均；88.69 tok/s 是另一轮单次采样。
- vivo 当前截图可证明 4B 模型、SME2 后端与单次推理表现；如果讲“加速多少”，仍需同一模型、同一 Prompt、同一参数下做 SME2 与非 SME2 对照。
- iOS Expo 素材不填写模型性能，因为 Expo Go 未接入 CatuneMnn。

## 文件说明

- `机型与模型测试对比-16x9.svg`：可直接插入 PPT/PDF 的 1920×1080 对比图。
- `01-小米14-非SME2多轮基准.jpg`：初赛 Android 多轮基准原图。
- `02-小米14-非SME2单次推理.jpg`：初赛 Android 单次推理与 SME2 能力原图。
- `03-vivo-SME2与4B模型状态.png`：决赛机型、模型和 SME2 后端状态。
- `04-vivo-Qwen3.5-4B单次推理.png`：决赛 4B 中文输出与性能指标。
