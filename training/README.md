# 坐姿教练 LoRA 微调 → MNN 端侧链路

> 目标：把 Qwen2.5-0.5B 用一个小 LoRA 微调成「稳定输出 ≤30字、温和、指向具体动作、带 [动作:xxx] 标签、不医疗」的坐姿教练，再转成 `.mnn` 跑在 App 端侧。
> **分工**：本仓库只放数据/脚本/配置；**生成数据、训练、转换都在你的本地 GPU 机器跑**（开发沙箱无 GPU）。
> 基座默认 **Qwen2.5-0.5B**（与 App 默认模型一致）。关联 [模型与记忆个性化设计](../docs/模型与记忆个性化设计.md)。

## 为什么微调（价值，见设计文档§2）
不是提升「检测准确率」（分类是规则的活）。微调修的是 0.5B 的三个真实痛点：
1. **指令/长度失控**（真机实测输出远超 30 字）→ LoRA 最擅长治格式。
2. **话术泛泛/偏题**（“放松”而非“收下巴”）→ 教专业且具体的动作话术。
3. **可省提示词**：风格进权重后，App 端 prompt 可大幅缩短 → prefill 更快、TPS 更高。
附带：输出 `[动作:xxx]` 标签可**联动猫动画/跟练**（一份模型输出同时驱动文字 + 视觉）。

## 数据风格基准
见 `data/seed_gold.jsonl`（手写锚点）。每条 alpaca 格式：
- `instruction`：固定教练系统指令
- `input`：结构化姿态上下文（姿态/角度/时长）
- `output`：≤30字正文 + ` [动作:标签]`

5 条硬规则：①≤30字 ②温和有温度 ③指向具体动作 ④不诊断/不承诺/不卖货 ⑤结尾动作标签。

## 流程（在本地 GPU 机器执行）

```bash
# 0) 环境
pip install "transformers>=4.45" datasets accelerate peft
pip install llamafactory            # 或 git clone hiyouga/LLaMA-Factory 后 pip install -e .

# 1) 生成数据集（仓库已带 seed；扩样到 ~400 训练 + 40 验证）
python3 training/gen_dataset.py --n 400
#  → 产出 training/data/train.jsonl / val.jsonl

# 2) LoRA 训练（单卡 8GB 足够，约几分钟~十几分钟）
llamafactory-cli train training/configs/qwen0.5b_lora.yaml

# 3) 合并 LoRA → 完整 HF 模型
llamafactory-cli export training/configs/qwen0.5b_merge.yaml
#  → training/saves/qwen0.5b-catune-merged/

# 4) 转 MNN（INT4），产出 App 需要的文件集
git clone https://github.com/alibaba/MNN
python3 MNN/transformers/llm/export/llmexport.py \
  --path training/saves/qwen0.5b-catune-merged \
  --dst_path training/saves/qwen0.5b-catune-mnn \
  --export mnn --quant_bit 4 --quant_block 128
#  产物须含：config.json llm_config.json llm.mnn llm.mnn.weight tokenizer.txt embeddings_bf16.bin
#  （与 src/mnn/modelCatalog.ts 的 MNN_FILE_SET 对齐）

# 5) 部署到 App 端侧验证
#  - 把 5/6 个文件放到设备 filesDir/mnn_models/qwen2.5-0.5b-catune/ 并设为 .active
#  - 或起一个新 catalog 项指向你的下载源
#  - Settings → 模型基准测试 → 单次推理 / 基准 x2，核对：输出≤30字、含[动作:]、TPS
```

## 初赛“走通”验收标准
- [ ] `gen_dataset.py` 产出合法 JSONL（输出去标签后 ≤30 字，已在脚本内 assert）
- [ ] LoRA 训练 loss 正常下降，val 不发散
- [ ] 合并 + `llmexport` 产出完整 MNN 文件集
- [ ] 真机 `inferText` 跑通：输出**明显比基座更短、更对题、带动作标签**
- [ ] 录一段「基座 vs 微调」同 prompt 对比（证真 + 技术分）

## 后续（复赛）
- 数据从模板扩到 GPT 造的多样真实语料 + 检索增强
- 同链路微调 Qwen3-1.7B（配 SME2 真机）
- 教练记忆接 catui-mem（见设计文档§3.2）
