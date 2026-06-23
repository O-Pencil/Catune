#!/usr/bin/env python3
"""从 training/compare.md 生成 LoRA 对比幻灯片（无 emoji）。"""
from __future__ import annotations

import importlib.util
import re
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "compose_video_label", Path(__file__).parent / "compose-video-label.py"
)
_mod = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(_mod)
load_font = _mod.load_font
from PIL import Image, ImageDraw


def _strip_md(s: str) -> str:
    s = re.sub(r"\*\*([^*]+)\*\*", r"\1", s)
    s = s.replace("✓", "OK").replace("✗", "X")
    return s.strip()


def _wrap(draw: ImageDraw.ImageDraw, text: str, font, max_w: int) -> list[str]:
    text = _strip_md(text).replace("\n", "")
    if not text:
        return [""]
    lines: list[str] = []
    cur = ""
    for ch in text:
        trial = cur + ch
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines or [""]


def render_compare_slide(md_path: Path, out: Path) -> None:
    raw = md_path.read_text(encoding="utf-8")
    lines = raw.splitlines()

    meta: list[str] = []
    rows: list[tuple[str, str, str, str]] = []
    metrics: list[tuple[str, str, str, str, str]] = []

    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("- ") and not line.startswith("- --"):
            meta.append(_strip_md(line[2:]))
        if line.startswith("|") and "---" not in line:
            cells = [c.strip() for c in line.strip("|").split("|")]
            if cells and cells[0] == "#":
                pass
            elif cells and cells[0].isdigit():
                if len(cells) >= 4:
                    rows.append((cells[0], cells[1], cells[2], cells[3]))
            elif cells and cells[0] == "模型":
                pass
            elif cells and len(cells) >= 5 and cells[0] in ("基座", "微调"):
                metrics.append(tuple(cells[:5]))  # type: ignore[arg-type]
        i += 1

    w, h = 1920, 1080
    img = Image.new("RGB", (w, h), (30, 30, 30))
    draw = ImageDraw.Draw(img)
    title_f = load_font(40)
    meta_f = load_font(26)
    head_f = load_font(22)
    cell_f = load_font(20)
    small_f = load_font(18)

    y = 36
    draw.text((48, y), "基座 vs 微调 (LoRA)", fill=(220, 220, 220), font=title_f)
    y += 56
    for m in meta[:3]:
        for ln in _wrap(draw, m, meta_f, w - 96)[:2]:
            draw.text((48, y), ln, fill=(180, 190, 200), font=meta_f)
            y += 32
    y += 8

    # 表头
    cols = [(48, 36, "#"), (100, 520, "输入"), (640, 280, "基座"), (940, 900, "微调")]
    for x, cw, label in cols:
        draw.rectangle((x, y, x + cw - 4, y + 34), fill=(45, 45, 48))
        draw.text((x + 8, y + 6), label, fill=(160, 170, 180), font=head_f)
    y += 38

    row_h = 118
    for num, inp, base, tuned in rows[:7]:
        draw.rectangle((48, y, 1872, y + row_h - 4), outline=(55, 55, 58))
        draw.text((56, y + 6), num, fill=(140, 150, 160), font=cell_f)
        ty = y + 6
        for ln in _wrap(draw, inp, small_f, 500)[:2]:
            draw.text((100, ty), ln, fill=(200, 200, 200), font=small_f)
            ty += 22
        ty = y + 6
        for ln in _wrap(draw, base, small_f, 270)[:3]:
            draw.text((640, ty), ln, fill=(255, 140, 100), font=small_f)
            ty += 22
        ty = y + 6
        for ln in _wrap(draw, tuned, small_f, 880)[:3]:
            draw.text((940, ty), ln, fill=(120, 200, 140), font=small_f)
            ty += 22
        y += row_h
        if y > 780:
            break

    # 指标汇总
    y = max(y + 12, 800)
    draw.text((48, y), "指标汇总", fill=(160, 170, 180), font=head_f)
    y += 34
    for row in metrics:
        txt = f"{row[0]}: 均字 {row[1]} | 动作标签 {row[2]} | 超30字 {row[3]} | 禁词 {row[4]}"
        draw.text((48, y), txt, fill=(190, 190, 190), font=small_f)
        y += 28

    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)


def render_logits_slide(out: Path, delta: float = 14.4445) -> None:
    w, h = 1920, 1080
    img = Image.new("RGB", (w, h), (18, 22, 28))
    draw = ImageDraw.Draw(img)
    title_f = load_font(48)
    val_f = load_font(96)
    sub_f = load_font(32)

    lines = [
        ("LoRA adapter 生效校验", title_f, (200, 200, 200), 320),
        (f"logits |delta| max = {delta:.4f}", val_f, (100, 180, 255), 420),
        ("启用与禁用 adapter 输出差异显著", sub_f, (150, 160, 170), 560),
        ("确为两个不同模型，训练非空跑", sub_f, (150, 160, 170), 610),
    ]
    for text, font, color, y in lines:
        tw = draw.textlength(text, font=font)
        draw.text(((w - tw) / 2, y), text, fill=color, font=font)

    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    work = root / "mp4" / ".compose-tmp" / "lora"
    render_compare_slide(root / "training" / "compare.md", work / "compare_slide.png")
    render_logits_slide(work / "logits_slide.png")
    print(f"OK: {work}")
