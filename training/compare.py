"""
基线 vs 微调 对比脚本：用 5 个测试 prompt 跑基座和 1-epoch 微调版，输出对比。
"""
import os
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

BASE = 'Qwen/Qwen2.5-0.5B-Instruct'
LORA = r'training\saves\qwen0.5b-catune-lora'

INSTRUCTION = (
    "你是温和的坐姿教练。根据姿态信息，用一句不超过30字、有温度、指向具体动作、"
    "不做医疗诊断的中文提醒用户调整坐姿；结尾用 [动作:xxx] 标注一个建议动作。"
)

TEST_CASES = [
    '姿态：头前倾（TECH_NECK）；颈前倾约25°；已持续12分钟。',
    '姿态：驼背（SLUMPED）；胸椎后凸约18°；已持续8分钟。',
    '姿态：身体左倾（LEFT_LEAN）；腰椎侧倾约-15°；已持续10分钟。',
    '姿态：身体右倾（RIGHT_LEAN）；腰椎侧倾约16°；已持续10分钟。',
    '姿态：正常（NORMAL）；脊柱接近中立；已持续5分钟。',
]

print('>>> Loading tokenizer')
tok = AutoTokenizer.from_pretrained(BASE, trust_remote_code=True)

print('>>> Loading BASE model (CPU)...')
base_model = AutoModelForCausalLM.from_pretrained(BASE, trust_remote_code=True, dtype=torch.float32)
base_model.eval()

print('>>> Loading LoRA adapter (1 epoch)')
peft_model = PeftModel.from_pretrained(base_model, LORA)
peft_model.eval()


def gen(model, prompt_text: str) -> str:
    prompt = (
        f"<|im_start|>system\n{INSTRUCTION}<|im_end|>\n"
        f"<|im_start|>user\n{prompt_text}<|im_end|>\n"
        f"<|im_start|>assistant\n"
    )
    inputs = tok(prompt, return_tensors='pt')
    with torch.no_grad():
        out = model.generate(
            **inputs,
            max_new_tokens=80,
            do_sample=False,
            pad_token_id=tok.eos_token_id,
        )
    text = tok.decode(out[0], skip_special_tokens=False)
    # 截取 assistant 后的内容
    if '<|im_start|>assistant\n' in text:
        text = text.split('<|im_start|>assistant\n', 1)[1]
    if '<|im_end|>' in text:
        text = text.split('<|im_end|>', 1)[0]
    return text.strip()


print('\n' + '=' * 70)
print('对比：基座 Qwen2.5-0.5B-Instruct  vs  1-epoch LoRA 微调')
print('=' * 70)

for i, tc in enumerate(TEST_CASES, 1):
    print(f'\n--- 测试 {i} ---')
    print(f'输入: {tc}')
    base_out = gen(base_model, tc)
    lora_out = gen(peft_model, tc)
    body_base = base_out.split(' [动作')[0]
    body_lora = lora_out.split(' [动作')[0]
    print(f'基座   ({len(body_base)}字): {base_out}')
    print(f'微调版 ({len(body_lora)}字): {lora_out}')
