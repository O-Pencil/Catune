#!/usr/bin/env python3
"""
@file gen_dataset.py
@description 由风格基准（seed_gold.jsonl）扩样出坐姿教练 SFT 数据集（alpaca 格式 JSONL）。
  目标是教会小模型「≤30字 + 温和 + 指向具体动作 + 不医疗 + [动作:xxx] 标签」的稳定风格，
  而非分类（分类仍由规则引擎做）。组合 姿态×严重度×时长×句式 采样，注入 seed 作为锚点。

用法：
  python3 training/gen_dataset.py            # 生成 train.jsonl / val.jsonl 到 training/data/
  python3 training/gen_dataset.py --n 400    # 指定训练样本量
"""
import argparse
import json
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")

INSTRUCTION = (
    "你是温和的坐姿教练。根据姿态信息，用一句不超过30字、有温度、指向具体动作、"
    "不做医疗诊断的中文提醒用户调整坐姿；结尾用 [动作:xxx] 标注一个建议动作。"
)

# 每种姿态：句式池（{a}=动作短语）+ 可用动作标签
POSTURES = {
    "TECH_NECK": {
        "name": "头前倾（TECH_NECK）",
        "field": "颈前倾约{deg}°",
        "deg": (20, 38),
        "phr": ["收下巴、让耳朵回到肩膀上方", "轻轻收下巴、把脖子拉直", "下巴往回找喉咙、头别前探"],
        "tag": "颈部回缩",
        "lead": ["脑袋有点探出去啦", "脖子又前伸了", "头微微前倾咯"],
    },
    "SLUMPED": {
        "name": "驼背（SLUMPED）",
        "field": "胸椎后凸约{deg}°",
        "deg": (15, 32),
        "phr": ["挺一下胸口、打开肩膀", "把胸口轻轻顶向前、坐高一点", "肩胛往后下方收一收"],
        "tag": "胸椎伸展",
        "lead": ["上背悄悄塌下来了", "背又圆起来啦", "背又拱起来咯"],
    },
    "LEFT_LEAN": {
        "name": "身体左倾（LEFT_LEAN）",
        "field": "腰椎侧倾约-{deg}°",
        "deg": (10, 24),
        "phr": ["把重心摆正、坐回中间", "肩膀放平、把骨盆坐正", "两边均匀受力、坐正"],
        "tag": "重心摆正",
        "lead": ["身子歪向一边啦", "一直往左靠咯", "稍微往左偏了点"],
    },
    "RIGHT_LEAN": {
        "name": "身体右倾（RIGHT_LEAN）",
        "field": "腰椎侧倾约{deg}°",
        "deg": (10, 24),
        "phr": ["肩膀放平、重心收回正中", "把重心摆正、坐回中间", "骨盆坐正、别往右压"],
        "tag": "重心摆正",
        "lead": ["向右斜过去了", "一直往右靠咯", "稍微往右偏了点"],
    },
    "NORMAL": {
        "name": "正常（NORMAL）",
        "field": "脊柱接近中立",
        "deg": None,
        "phr": ["保持这份从容", "肩膀松松地保持", "继续保持哦"],
        "tag": "保持",
        "lead": ["坐姿很稳", "坐得很正", "脊柱挺舒展"],
    },
}

LONG_HINTS = ["", "", "已经保持挺久了，", "坐了好一会儿，"]
BREAK_SUFFIX = "顺手起身走两步吧～ [动作:起身活动]"


def make_example(rng: random.Random):
    key = rng.choice(list(POSTURES.keys()))
    p = POSTURES[key]
    dur = rng.choice([5, 6, 8, 10, 12, 15, 18, 20, 25, 30, 35, 40])
    if p["deg"]:
        deg = rng.randint(*p["deg"])
        field = p["field"].format(deg=deg)
    else:
        field = p["field"]
    src = f"姿态：{p['name']}；{field}；已持续{dur}分钟。"

    long_sit = dur >= 30 and key != "NORMAL"
    lead = rng.choice(p["lead"])
    if long_sit:
        out = f"{lead}，{BREAK_SUFFIX}"
    else:
        phr = rng.choice(p["phr"])
        out = f"{lead}，{phr}～ [动作:{p['tag']}]"
    return {"instruction": INSTRUCTION, "input": src, "output": out}


def load_seed():
    path = os.path.join(DATA, "seed_gold.jsonl")
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return [json.loads(l) for l in f if l.strip()]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=400, help="训练样本量（不含 seed）")
    ap.add_argument("--val", type=int, default=40)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()
    rng = random.Random(args.seed)

    seed = load_seed()
    seen = set()
    rows = []
    for s in seed:  # seed 作为高质量锚点，全部保留
        k = (s["input"], s["output"])
        if k not in seen:
            seen.add(k)
            rows.append(s)
    guard = 0
    while len(rows) < args.n + len(seed) and guard < args.n * 50:
        guard += 1
        ex = make_example(rng)
        k = (ex["input"], ex["output"])
        if k in seen:
            continue
        seen.add(k)
        rows.append(ex)
        # 风格硬约束：输出去掉标签后 ≤30 字
        body = ex["output"].split(" [动作")[0]
        assert len(body) <= 30, f"超长: {body}"

    rng.shuffle(rows)
    val = rows[: args.val]
    train = rows[args.val :]
    os.makedirs(DATA, exist_ok=True)
    for name, part in [("train.jsonl", train), ("val.jsonl", val)]:
        with open(os.path.join(DATA, name), "w", encoding="utf-8") as f:
            for r in part:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"✓ train={len(train)}  val={len(val)}  (seed={len(seed)}) → {DATA}")


if __name__ == "__main__":
    main()
