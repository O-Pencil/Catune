#  🌱 Catune · 参赛创意方案

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/1X3lE5jVR6BVBlJb/img/88921b1b-472e-45a0-aae6-64cb21455ed4.png)

## 1. 项目概述

### 1.1 一句话定位

**Catune 是一套面向久坐办公人群的端侧姿态管理 APP**。搭配轻量 IMU 姿态带佩戴在身上，实时感知头前倾、含胸或侧倾，在异常持续出现时以轻量震动、温和提醒和可立即执行的舒展动作帮助用户及时调整姿态。

### 1.2 我们解决的问题

久坐办公人群通常不是不知道正确坐姿，而是**无法意识到自己在什么时候逐渐前倾、含胸或塌坐**。

传统站立提醒只能判断用户是否久坐，无法判断坐姿质量；摄像头方案存在办公隐私和持续采集压力；事后的按摩或课程又无法在姿态变差的当下提供反馈。

Catune 将姿态判断、提醒触发和反馈生成放在手机端完成，让姿态问题从**"事后发现"**变成**"发生时即可纠正"**。

### 1.3 核心成果

:::
**① 端侧 AI 真机运行**

Qwen2.5-0.5B INT4 已通过 MNN 在 Android arm64 设备上完成离线推理验证，飞行模式下仍可生成中文姿态建议，实测 Decode TPS 为 ~63–88 tok/s。
:::

**② 确定性规则与生成式 AI 双轨协作**

规则引擎负责姿态分类、评分和提醒触发，语言模型只负责自然表达。模型不能覆盖规则结果，任何输出异常都会回退到本地安全文案。

:::
**③ 面向 Arm 设备的自适应部署**

系统能够识别设备内存、存储和 CPU 能力，为不同设备选择合适的模型与推理路径，并通过运行时降级保证入门设备上的可用性。
:::

**④ 语义记忆个性化（本地）**

问卷+正负反馈写入本地记忆，按相关性注入教练 prompt，教练"越用越懂你"；

**⑤ 云 + 端混合、可插拔评估**

体态评估后端「端侧VL / 云端 / 预置」一键切，离线零风险。

**⑥ 低打扰的产品体验**

Catune 不采用高频警报，而是通过首页黑猫的姿态变化、短震动、十分钟冷却期、三十秒舒展动作和植物成长反馈，帮助用户在不中断工作的情况下逐步建立姿态意识。

:::
**⑦ 情感化陪伴**

首页的黑猫不只是数据可视化，而是一个有性格的伙伴——它会因为你的坐姿不好而低头弓背，也会因为你坐直了而精神起来。配合植物成长的养成感，**让"纠正坐姿"从一项任务变成一种陪伴。**
:::

**⑧ 隐私优先**

所有姿态数据、模型推理和反馈生成全部在手机本地完成，核心监测不依赖网络，数据默认不出设备。摄像头方案在办公场景难以被接受，而 Catune 姿态带采集的原始数据只用于实时判断，不上传云端，零隐私顾虑。

### 1.4 隐私与边界

实时姿态传感器数据默认保留在本地，核心监测不依赖网络。系统不提供医疗诊断、治疗建议或疗效承诺；端侧模型输出必须通过结构校验、风险内容过滤和长度限制后才能展示。

---

## 2. 产品体验

### 2.1 完整闭环

Catune 在本地完成完整的姿态管理流程：

:::
姿态采样 → 实时状态判断 → 异常持续检测 → 温和提醒 → 微动作建议 → 用户纠正 → 日报复盘
:::

其中，姿态分类、评分、提醒阈值和冷却机制由确定性的规则引擎执行；端侧 Qwen 模型通过 MNN 生成简短、自然的反馈文案。模型不可用时，系统自动使用经过审核的本地建议，核心监测流程不会中断。

### 2.2 三个核心页面

:::
![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/1X3lE5jVR6BVBlJb/img/01bbb851-5e7a-43e7-9871-056a1f925496.png)

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/1X3lE5jVR6BVBlJb/img/fda2efd2-097e-4a73-9176-e2dfb0aef3df.png)
:::

**仪表盘**：页面中央是一只坐在书桌前的黑猫，**猫的姿态跟随传感器实时变化**——坐直时猫端坐，头前倾时猫低头，驼背时猫弓背。猫的桌面上有一盆小植物。顶部显示实时建议和传感器参数。用户看到猫的姿态就能直觉感知"我现在的坐姿怎么样"。

![Wan_视频生成_手机和界面稳定不动，只有猫动.gif](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/1X3lE5jVR6BVBlJb/img/6d55e80a-59ac-4337-91f6-68b45e23bf03.gif?x-oss-process=image/crop,x_0,y_36,w_1280,h_828/ignore-error,1)

_此为示意、具体待真机演示_

**植物页**：植物成长是独立的养成系统。5 阶段植物成长（**种子 → 嫩芽 → 小苗 → 含苞 → 结果**），随连续良好坐姿天数升级；下方是实时的加分减分和周报日报。仪表盘页猫桌上的那盆植物和植物页的养成系统是同一个视觉锚点——第一页看到它在桌上，第二页看到它的成长故事。设计取舍：不采用重度游戏化路线（果实收集、地图解锁），视觉激励对齐到"日积月累"即可。

![Wan_视频生成_UI不动，盆栽生长.gif](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/1X3lE5jVR6BVBlJb/img/dc94ac6b-9618-4fac-9d4d-0f1b6c081e3e.gif?x-oss-process=image/crop,x_0,y_0,w_1280,h_828/ignore-error,1)

_此为示意、具体待真机演示_

**设置页**：设备管理、提醒偏好、震动强度等折叠菜单，以及模型状态面板（模型是否已加载、推理后端、解码速度）。

---

## 3. 核心创新

### 3.1 端侧实时姿态闭环

不是事后报告，而是在用户工作过程中完成++"采样 → 判断 → 提醒 → 行动建议 → 纠正反馈"++的完整闭环。首页的黑猫实时跟随坐姿变化，异常持续 5 分钟触发轻量震动（< 200 ms）和 App 提醒卡片，推荐 30 秒内可完成的舒展动作；纠正坐姿后猫的姿态自动恢复。全程核心能力本地离线可用。

### 3.2 规则与端侧模型双轨架构

这是本项目最有辨识度的技术判断：**规则负责确定性，模型负责表达；模型失败不影响产品工作。**

姿态分类、评分、提醒触发和冷却机制全部由规则引擎执行——零延迟、零内存、确定性强。端侧 Qwen 模型只做规则做不到的事：生成 30 字以内的自然语言反馈。模型输入由规则引擎生成（包含已判定的姿态状态和建议动作），模型输出只允许返回建议文案，不得覆盖规则判断。任何输出异常（超长、含敏感词、格式错误）自动回退本地预置文案。

### 3.3 面向 Arm 设备的自适应部署

项目基于 MNN 完成 Android arm64 端侧推理适配，并启用 SME2、KleidiAI、ARM82、低内存模式及 16 KB 页面对齐。系统根据设备能力选择推理路径，在不支持新指令集的设备上自动降级，保证应用可用性。

同一份 APK 在不同设备上自动选择合适的模型：入门设备跑 0.5B 保稳定，支持 SME2/i8mm 的高性能设备可启 1.7B 获得更好的生成质量。模型下载支持断点续传和多模型并存。

入门（RAM<6GB、无 SME2/i8mm、存储<10GB） - 0.5B 

主流（6–12GB、i8mm）  - 1.7B

高性能（>12GB、SME2）  - 2B（足够）

### 3.4 为坐姿场景 LoRA 微调 → 转 MNN 端侧部署

不只是"调一个云 API"，我们针对坐姿教练场景做了**端侧 LoRA 微调 → 转 MNN** 的完整链路：从风格基准造数据 → 训练 → 合并 → `.mnn` → 真机部署。微调目标是把 Qwen2.5-0.5B 校成"≤30 字 + 带 `[动作:]` 标签 + 统一『喵～』口吻"的坐姿教练话术。App 端 `coachPrompt.ts` 与训练数据 `gen_dataset.py` **同格式**，保证微调真正迁移而非停留在实验室。

### 3.5 语义记忆个性化（本地）

首启「认识一下你」问卷收集用户偏好（如"脖子/肩背容易不舒服"），加上日常 正负 反馈，全部写入本地语义记忆。推理时按相关性**检索注入到教练 prompt**，教练"越用越懂你"。所有记忆**仅存本机**、可在 Settings「教练记忆」查看与一键清空，隐私敏感人群也能放心用。

### 3.6 拟人化陪伴「喵～」

吉祥物是只爱操心的黑猫，**规则兜底文案、端侧模型系统提示词、微调数据**三处口吻统一带"喵～"。AI 教练不再是冷冰冰的提醒，而是有温度、好记的伙伴。配合植物成长的养成感，让"纠正坐姿"从一项任务变成一种陪伴——这是情绪设计对"提醒疲劳"的产品级解法。

---

## 4. 技术架构

### 4.1 端云分工

| **任务** | **端侧** | **云端** | **兜底** |
| --- | --- | --- | --- |
| 姿态分类 | 规则引擎 | 不做 | 规则引擎 |
| 评分与提醒 | 规则引擎 | 不做 | 规则引擎 |
| 反馈文案（≤ 30 字） | 端侧 Qwen + MNN | 不做 | 本地预置文案 |
| 视觉体态评估（侧身照） | 端则 Qwen-VL | 云 Qwen-VL（OpenAI/DashScope 兼容，BYO Key） | 规则引擎 |

云端纪律：不能替代实时分类主路径，不能在断网时阻塞核心流程，不能输出医疗诊断或疗效承诺。

### 4.2 MNN 与 Arm 适配

MNN 是少数同时支持 SME2 + KleidiAI + ARM82 + OpenCL 的端侧推理框架之一。项目自编译 libMNN.so（约 5.1 MB），配合约 0.5 GB 的 Qwen2.5-0.5B INT4 模型完成离线推理。

运行时根据设备 CPU 能力自动选择最优路径：SME2 设备走 KleidiAI 微内核，i8mm 设备走 Armv8.2 指令，老设备走 NEON 兜底。

### 4.3 安全与降级

姿态状态和严重程度由规则引擎确定，语言模型不得覆盖规则判断。模型输出必须通过结构校验、长度限制和风险内容过滤后才能展示。任何校验失败都会回退至经过审核的本地文案，系统不提供诊断、处方或疗效承诺。

| **异常类型** | **系统处理** |
| --- | --- |
| 模型缺失、加载或推理失败 | 自动切换本地预置建议 |
| 传感器断连 | 显示离线状态，保留历史数据和训练功能 |
| 网络不可用 | 核心监测与端侧反馈保持运行，云端视觉能力暂不可用 |

### 4.4 技术难点与解决

| 难点 | 解决 |
| --- | --- |
| **SME2 硬件稀缺**（演示机 `hw sme2=false`；Mac QEMU 亦 `sme2:0`） | **赛事认可「开发期打开 SME2 优化开关」即满足要求** —— 我们已开（`MNN_SME2=ON` + KleidiAI 进 libMNN，App 内 `lib sme2=true`），**要求已 ✅**。运行时硬件加速（`hw sme2=true` 设备 + logcat `sme2:1` + TPS 对比）为复赛锦上添花，非初赛门槛 |
| 端侧生成慢、体感延迟 | 仪表盘走规则瞬时显示，模型异步替换；**流式打字**掩盖延迟 |
| 0.5B 指令遵循弱（输出超长/偏题） | **LoRA 微调**强约束格式与语气；**推理 prompt 与训练逐字对齐** |
| 主视觉逐帧换图卡顿 | 改**雪碧图**：单次解码 + UI 线程平移 snap，零撕影 |
| 记忆要个性化又要隐私 | RN 原生轻量语义记忆，**仅本地**、可清空、过禁词链 |
| 云端依赖网络风险 | 评估后端可插拔，云端**可降级预置**，现场不依赖网络；API Key 仅存本机 |

---

## 5. 实测结果

### 5.1 端侧推理

| **指标** | **结果** |
| --- | --- |
| 模型 | Qwen2.5-0.5B Instruct INT4 |
| 推理框架 | MNN（自编译 libMNN.so，SME2 + KleidiAI 适配） |
| 运行平台 | Android arm64 真机 |
| 模型体积 | 约 0.5 GB |
| Decode TPS | 88.7 |
| 网络状态 | 飞行模式下可完整运行 |
| 编译适配 | `-DMNN_SME2=ON`、lib 含 KleidiAI/SME2 符号 \| APK `lib sme2=true`；Mac/Docker cmake 开 SME2，附视频 |

### 5.2 姿态监测

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/1X3lE5jVR6BVBlJb/img/14289690-5ee3-4fca-8d35-4ffb74a32ef0.png)

传感器采样 → 仪表盘状态变化（端到端）≤ 300 ms

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/1X3lE5jVR6BVBlJb/img/2467fccb-d77f-48e7-bbc6-2eb503cdfa37.png)

异常持续 → 触发震动 + 提醒卡片：5 分钟阈值

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/1X3lE5jVR6BVBlJb/img/9f317a6f-9e61-4616-b65f-394066509449.png)

首次校准 → 进入监测：5 秒

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/1X3lE5jVR6BVBlJb/img/656e8b75-7870-4751-a160-ba406b81b089.png)

端侧模型不可用时主仪表盘仍可正常工作

### 5.3 安全链验证

禁词过滤、长度限制、结构校验均已通过测试；命中禁词的输出被替换为预置安全文案，异常日志仅本地留存。

### 5.4 真机Demo

[请至钉钉文档查看附件《安卓演示.mp4》。](https://alidocs.dingtalk.com/i/nodes/dxXB52LJqnOX3E9EHKkKN1Oz8qjMp697?doc_type=wiki_doc&iframeQuery=anchorId%3DX02mqpdg3bgr1o3pfi7e9b&rnd=0.5840622109031586&utm_source=conversation_spaces)

[请至钉钉文档查看附件《monitor.mp4》。](https://alidocs.dingtalk.com/i/nodes/dxXB52LJqnOX3E9EHKkKN1Oz8qjMp697?doc_type=wiki_doc&iframeQuery=anchorId%3DX02mqpdgi48s2wbxi2nagn&rnd=0.5840622109031586&utm_source=conversation_spaces)

---

## 6. 用户价值与竞争差异

| **维度** | **现有方案** | **Catune** |
| --- | --- | --- |
| **姿态感知** | 手环只能判断站立/坐下，无法判断坐姿好坏 | 实时识别头前倾、含胸、侧倾，首页黑猫姿态同步反馈 |
| **反馈方式** | 站点提醒（到点该站）或摄像头（隐私敏感） | 猫的姿态变化 + 短震动 + 温和文案 + 30 秒微动作 |
| **隐私** | 摄像头方案在办公场景难以接受 | 姿态数据默认不上云 |
| **离线能力** | 纯云方案断网即失效 | 核心监测与端侧反馈全程离线可用 |
| **可执行性** | 事后报告或课程，无法在姿态变差时干预 | 异常发生时即时给出可执行建议 |
| **成本** | 医院评估 200-500 元/次 | 200 级别硬件+手机端免费使用，未来可选配硬件 |

---

## 7. 后续规划

[火箭]

三节点姿态带融合：接入颈、胸、腰 IMU 传感器，获得更完整的脊柱姿态数据

[手机]

SME2 真机性能验证：在支持 SME2 的设备上完成 1.7B 模型的量化对比

👀

端侧视觉能力：将侧身照体态评估从云端迁移到端侧，实现全程不联网

---

## 附录

### A. 架构图

![architecture-diagram.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/1X3lE5jVR6BVBlJb/img/d2385d7b-6f81-4eae-b53c-04e6266e7139.png?x-oss-process=image/crop,x_233,y_0,w_2105,h_2262/ignore-error,1)

### B. MNN 编译要点

自编译 libMNN.so 启用以下能力：SME2 汇编优化、KleidiAI 微内核、ARM82 FP16、低内存模式、量化 GEMM 路径、16 KB page 对齐（Android 15+）。同时关闭视觉 / 音频 / 扩散等不需要的能力，体积减少约 30%。

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/1X3lE5jVR6BVBlJb/img/ae467a76-c7c7-4755-82a1-e549192235ab.png)

### C. 关键代码

| 能力 | 文件 |
| --- | --- |
| 规则状态机 + 打分 + 禁词安全链 | `src/posture/engine.ts` |
| 教练 prompt 单一来源（与训练对齐） | `src/posture/coachPrompt.ts` |
| `[动作:]` 标签解析 → 文字+视觉联动 | `src/posture/actionTag.ts` |
| 语义记忆（本地、评分、注入） | `src/posture/memory/` |
| 端侧推理流式编排 | `src/posture/adviceOrchestrator.ts` |
| MNN JNI 桥（文本/流式/图像/基准） | `android/.../rn/MnnDebugModule.kt`、`cpp/eyes_mnn_bridge.cpp` |
| 角度驱动雪碧图主视觉 | `src/ui/components/CatSprite.tsx` |
| LoRA 微调→MNN 链路 | `training/`（gen\_dataset / train\_sft / configs / README） |

代表片段（规则分类，单一判定来源）：

```ts
// src/posture/engine.ts —— 阈值规则（驼背主指标=胸椎后凸）
if (thor > THRESHOLDS.thorSlumpDeg) return {posture: 'SLUMPED', actionId: 'thoracic_extension'};
if (neck > THRESHOLDS.neckTechDeg) return {posture: 'TECH_NECK', actionId: 'neck_retraction'};
if (lumbar < THRESHOLDS.lumbarLeanDeg) return {posture: 'LEFT_LEAN', actionId: 'scapular_retraction'};
return {posture: 'NORMAL', actionId: null};

```
```kotlin
// android/.../rn/MnnDebugModule.kt —— 端侧 VL 评估走已有图像路径
val jpeg = android.util.Base64.decode(imageBase64, android.util.Base64.DEFAULT)
val result = engine.analyze(jpeg, null, 0, prompt)   // → C++ infer(prompt, imagePath)

```
---

Catune 团队  2026-06-21

![image.png](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/1X3lE5jVR6BVBlJb/img/a1148e1b-c2f1-49a6-bf65-c72a947ae6c9.png?x-oss-process=image/crop,x_0,y_320,w_1042,h_374/ignore-error,1)