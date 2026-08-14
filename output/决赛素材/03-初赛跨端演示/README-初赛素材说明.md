# Catune 初赛跨端演示素材

这组素材用于补充 Catune 从初赛到决赛的产品与端侧模型演进。原始素材仍保留在 `output/mp4/`，本目录仅收录适合路演、答辩和备份的副本。

## Android：无 SME2 设备也能运行端侧模型

- `01-Android-产品与端侧输出.mp4`：初赛 Android 产品体验、猫咪姿态反馈与端侧输出。
- `02-Android-非SME2基准-多轮.jpg`：Qwen2.5-0.5B 的多轮基准；`hw sme2=false`、`lib sme2=true`、CPU/NEON 回退，双轮 timed 平均 62.97 tok/s。
- `03-Android-非SME2基准-单次.jpg`：同一阶段单次中文推理，CPU 后端 88.69 tok/s。

已知演示机为小米 14。这里证明的是：MNN 在没有 SME2 硬件的 Android 手机上仍能自动回退到 NEON，端侧 Qwen 仍然可用。62.97 tok/s 是两轮 timed 平均，88.69 tok/s 是另一轮单次采样，两者不能混写为同一组平均结果。

## iOS：Expo 产品体验与真实传感器链路

- `04-iOS-Expo-DeviceMotion传感器.mp4`：iPhone 通过 Expo Go 读取真实 DeviceMotion。
- `05-iOS-Expo-猫咪低头抬头.mp4`：姿态变化驱动黑猫反馈。
- `06-iOS-Expo-猫咪左右摇摆.mp4`：左右姿态变化演示。
- `07-iOS-Expo-跟练.mp4`：跟练体验。
- `08-iOS-Expo-AI姿态评估.mp4`：AI 姿态评估流程。

iOS 素材只证明一套 React Native / TypeScript 产品体验和真实手机传感器链路。Expo Go 没有接入 CatuneMnn，因此不能标注为“iOS 端侧 Qwen”或填写端侧模型 TPS。

## 初赛完整视频

- `00-Catune-初赛完整演示-1920x1080.mp4`：初赛完整演示成片。适合回顾产品演进，不建议在决赛现场完整播放。

## 路演建议

- 正式演讲：Android 初赛视频和 iOS Expo 视频各取 3–5 秒，表现“不同设备都有产品体验”。
- 模型证明：只展示 Android 两张基准截图；iOS 一栏明确写“Expo 产品体验，未运行原生 MNN”。
- 机型对比：直接使用相邻目录 `04-机型与模型对比/机型与模型测试对比-16x9.svg`。
