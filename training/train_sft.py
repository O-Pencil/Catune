#!/usr/bin/env python3
"""
@file train_sft.py
@description 精简 LoRA SFT 训练脚本（不依赖 LLaMA-Factory）。
   等价于 training/configs/qwen0.5b_lora.yaml 的训练配置，但用 transformers + peft 直接跑。
   适配：Qwen2.5-0.5B-Instruct + alpaca 数据集 + LoRA(rank=16) + 4 epoch + bf16/fp32。

用法：
  python training/train_sft.py
  # 或用镜像环境变量加速下载：
  set HF_ENDPOINT=https://hf-mirror.com
  python training/train_sft.py
"""
import argparse
import json
import os
import random
from dataclasses import dataclass

import numpy as np
import torch
from datasets import Dataset
from peft import LoraConfig, TaskType, get_peft_model
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    DataCollatorForSeq2Seq,
    HfArgumentParser,
    Trainer,
    TrainingArguments,
)


INSTRUCTION = (
    "你是温和的坐姿教练。根据姿态信息，用一句不超过30字、有温度、指向具体动作、"
    "不做医疗诊断的中文提醒用户调整坐姿；结尾用 [动作:xxx] 标注一个建议动作。"
)


def build_prompt(instruction: str, input_text: str) -> str:
    """Qwen2.5 chat template."""
    return (
        f"<|im_start|>system\n{instruction}<|im_end|>\n"
        f"<|im_start|>user\n{input_text}<|im_end|>\n"
        f"<|im_start|>assistant\n"
    )


def build_full_text(prompt: str, output: str) -> str:
    return prompt + output + "<|im_end|>\n"


def load_jsonl(path: str):
    rows = []
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base_model', default='Qwen/Qwen2.5-0.5B-Instruct')
    ap.add_argument('--train_file', default='training/data/train.jsonl')
    ap.add_argument('--val_file', default='training/data/val.jsonl')
    ap.add_argument('--output_dir', default='training/saves/qwen0.5b-catune-lora')
    ap.add_argument('--epochs', type=float, default=4.0)
    ap.add_argument('--lr', type=float, default=2e-4)
    ap.add_argument('--batch_size', type=int, default=8)
    ap.add_argument('--grad_accum', type=int, default=2)
    ap.add_argument('--lora_rank', type=int, default=16)
    ap.add_argument('--lora_alpha', type=int, default=32)
    ap.add_argument('--lora_dropout', type=float, default=0.05)
    ap.add_argument('--max_len', type=int, default=512)
    ap.add_argument('--seed', type=int, default=42)
    args = ap.parse_args()

    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)

    print(f'>>> Loading tokenizer: {args.base_model}')
    tokenizer = AutoTokenizer.from_pretrained(args.base_model, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # 加载数据
    print(f'>>> Loading data: {args.train_file} / {args.val_file}')
    train_rows = load_jsonl(args.train_file)
    val_rows = load_jsonl(args.val_file) if os.path.exists(args.val_file) else []
    print(f'  train: {len(train_rows)}  val: {len(val_rows)}')

    def to_features(rows):
        features = []
        for r in rows:
            prompt = build_prompt(r['instruction'], r['input'])
            full = build_full_text(prompt, r['output'])
            tok = tokenizer(full, max_length=args.max_len, truncation=True)
            # mask prompt 部分：labels = -100 for prompt tokens
            prompt_tok = tokenizer(prompt, max_length=args.max_len, truncation=True)
            prompt_len = len(prompt_tok['input_ids'])
            labels = list(tok['input_ids'])
            for i in range(min(prompt_len, len(labels))):
                labels[i] = -100
            tok['labels'] = labels
            features.append(tok)
        return features

    print('>>> Tokenizing...')
    train_features = to_features(train_rows)
    val_features = to_features(val_rows) if val_rows else None

    train_ds = Dataset.from_list(train_features)
    val_ds = Dataset.from_list(val_features) if val_features else None

    # 加载基座
    print(f'>>> Loading base model: {args.base_model}')
    model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        trust_remote_code=True,
        torch_dtype=torch.float32,  # CPU 友好；GPU 上改成 bf16
    )
    model.config.use_cache = False

    # LoRA
    print(f'>>> Adding LoRA (r={args.lora_rank}, alpha={args.lora_alpha})')
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=args.lora_rank,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'],
        bias='none',
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # 训练
    print('>>> Training...')
    targs = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.lr,
        lr_scheduler_type='cosine',
        warmup_ratio=0.1,
        logging_steps=10,
        save_strategy='epoch',
        save_total_limit=2,
        eval_strategy='epoch' if val_ds is not None else 'no',
        report_to='none',
        seed=args.seed,
        bf16=False,  # CPU 模式
        fp16=False,
        dataloader_num_workers=0,
        remove_unused_columns=False,
    )
    collator = DataCollatorForSeq2Seq(tokenizer, padding=True)

    trainer = Trainer(
        model=model,
        args=targs,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        data_collator=collator,
    )
    trainer.train()

    print(f'>>> Saving LoRA to {args.output_dir}')
    model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    print('>>> Done.')


if __name__ == '__main__':
    main()
