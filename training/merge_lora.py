#!/usr/bin/env python3
"""
@file merge_lora.py
@description 合并 LoRA adapter 回基座，导出完整 HF 模型（供 MNN llmexport 转 .mnn）。
   匹配 train_sft.py 的输出（peft adapter 在 training/saves/qwen0.5b-catune-lora-v2）。不依赖 LLaMA-Factory。

用法：
  python training/merge_lora.py
  python training/merge_lora.py --adapter training/saves/qwen0.5b-catune-lora-v2 --out training/saves/qwen0.5b-catune-merged
"""
import argparse
import os

os.environ.setdefault('HF_HUB_DISABLE_SYMLINKS_WARNING', '1')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='Qwen/Qwen2.5-0.5B-Instruct')
    ap.add_argument('--adapter', default='training/saves/qwen0.5b-catune-lora-v2')
    ap.add_argument('--out', default='training/saves/qwen0.5b-catune-merged')
    args = ap.parse_args()

    if not os.path.exists(os.path.join(args.adapter, 'adapter_config.json')):
        raise SystemExit(f'✗ 找不到 adapter_config.json：{args.adapter}（先跑 train_sft.py，或用 --adapter 指定）')

    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel

    print(f'>>> 加载基座 {args.base}')
    base = AutoModelForCausalLM.from_pretrained(args.base, torch_dtype=torch.float16, trust_remote_code=True)
    tok = AutoTokenizer.from_pretrained(args.base, trust_remote_code=True)

    print(f'>>> 挂 LoRA {args.adapter}')
    model = PeftModel.from_pretrained(base, args.adapter)

    print('>>> merge_and_unload（把 LoRA 权重并回基座）')
    model = model.merge_and_unload()

    os.makedirs(args.out, exist_ok=True)
    model.save_pretrained(args.out, safe_serialization=True)
    tok.save_pretrained(args.out)
    print(f'✓ 合并完成 → {args.out}')
    print('  下一步：用 MNN llmexport 转 .mnn（见 training/README.md 步骤 4）。')


if __name__ == '__main__':
    main()
