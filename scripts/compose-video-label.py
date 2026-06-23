#!/usr/bin/env python3
"""生成左右分屏标签条 PNG（不依赖 ffmpeg drawtext）。"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for path in candidates:
        p = Path(path)
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def make_label(text: str, out: Path, *, align: str = "left") -> None:
    w, h = 960, 72
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((16, 12, w - 16, h - 8), radius=12, fill=(0, 0, 0, 150))
    font = load_font(34)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    if align == "right":
        x = w - 32 - tw
    else:
        x = 32
    y = (h - th) // 2 - 2
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)


def make_slate(title: str, subtitle: str, out: Path) -> None:
    w, h = 960, 1080
    img = Image.new("RGB", (w, h), (20, 24, 32))
    draw = ImageDraw.Draw(img)
    font_t = load_font(44)
    font_s = load_font(28)
    for text, font, y in [
        (title, font_t, h // 2 - 70),
        (subtitle, font_s, h // 2 + 10),
    ]:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        draw.text(((w - tw) // 2, y), text, fill=(220, 220, 220) if font == font_t else (140, 140, 140), font=font)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)


def make_subtitle_bar(text: str, out: Path, *, width: int = 1920) -> None:
    """底部字幕条（全宽）。"""
    h = 100
    img = Image.new("RGBA", (width, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((24, 12, width - 24, h - 8), radius=10, fill=(0, 0, 0, 175))
    font = load_font(32)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((width - tw) // 2, 28), text, fill=(255, 255, 255, 255), font=font)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("mode", choices=["label", "slate", "subtitle"])
    p.add_argument("--text", default="")
    p.add_argument("--title", default="")
    p.add_argument("--subtitle", default="")
    p.add_argument("--align", choices=["left", "right"], default="left")
    p.add_argument("-o", "--out", required=True)
    args = p.parse_args()
    out = Path(args.out)
    if args.mode == "label":
        make_label(args.text, out, align=args.align)
    elif args.mode == "subtitle":
        make_subtitle_bar(args.text, out)
    else:
        make_slate(args.title, args.subtitle, out)


if __name__ == "__main__":
    main()
