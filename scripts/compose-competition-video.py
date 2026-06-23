#!/usr/bin/env python3
"""Catune 参赛演示片合成：1920×1080，居中/分屏、字幕、段间过渡。"""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path
from shutil import which

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "mp4"
OUT = SRC / "Catune-参赛演示-1920x1080.mp4"
WORK = SRC / ".compose-tmp"
FPS = 30
XFADE = 0.45

# 动态加载 compose-video-label.py（文件名含连字符）
_label_spec = importlib.util.spec_from_file_location(
    "compose_video_label", Path(__file__).parent / "compose-video-label.py"
)
_label = importlib.util.module_from_spec(_label_spec)
assert _label_spec.loader is not None
_label_spec.loader.exec_module(_label)
load_font = _label.load_font
make_label = _label.make_label
make_subtitle_bar = _label.make_subtitle_bar


def run(cmd: list[str], *, quiet: bool = True) -> None:
    kw: dict = {"check": True}
    if quiet:
        kw["stdout"] = subprocess.DEVNULL
        kw["stderr"] = subprocess.DEVNULL
    subprocess.run(cmd, **kw)


def probe_dur(path: Path) -> float:
    try:
        out = subprocess.check_output(
            [
                "ffprobe", "-v", "error", "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1", str(path),
            ],
            text=True,
        ).strip()
        return float(out) if out and out != "N/A" else 0.0
    except (subprocess.CalledProcessError, ValueError):
        return 0.0


def concat_videos(inputs: list[Path], out: Path) -> None:
    lst = out.with_suffix(".txt")
    lst.write_text("\n".join(f"file '{p.resolve()}'" for p in inputs) + "\n", encoding="utf-8")
    run([
        "ffmpeg", "-y", "-hide_banner", "-f", "concat", "-safe", "0", "-i", str(lst),
        "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-r", str(FPS), "-an", str(out),
    ])


def center_clip(
    inp: Path,
    out: Path,
    *,
    dur: float | None = None,
    subtitle: str = "",
    width: int = 1920,
    height: int = 1080,
) -> float:
    sub_png = WORK / "subs" / f"{out.stem}_sub.png"
    if subtitle:
        make_subtitle_bar(subtitle, sub_png, width=width)
    d = dur if dur is not None else (probe_dur(inp) or 4.0)
    fade_out_st = max(0.0, d - 0.35)
    vf = (
        f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
        f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,"
        f"fade=t=in:st=0:d=0.35,fade=t=out:st={fade_out_st:.3f}:d=0.35"
    )
    cmd = ["ffmpeg", "-y", "-hide_banner", "-i", str(inp), "-t", f"{d:.3f}"]
    if subtitle:
        cmd += [
            "-i", str(sub_png),
            "-filter_complex", f"[0:v]{vf}[base];[base][1:v]overlay=0:{height - 100}[v]",
            "-map", "[v]",
        ]
    else:
        cmd += ["-vf", vf]
    cmd += ["-c:v", "libx264", "-preset", "fast", "-crf", "20", "-r", str(FPS), "-an", str(out)]
    run(cmd)
    return d


def img_clip(img: Path, out: Path, dur: float, subtitle: str = "") -> float:
    sub_png = WORK / "subs" / f"{out.stem}_sub.png"
    make_subtitle_bar(subtitle, sub_png)
    fade_out_st = max(0.0, dur - 0.25)
    vf = (
        "scale=1920:1080:force_original_aspect_ratio=decrease,"
        "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,setsar=1,"
        f"fade=t=in:st=0:d=0.25,fade=t=out:st={fade_out_st:.3f}:d=0.25"
    )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loop", "1", "-i", str(img),
        "-i", str(sub_png), "-t", f"{dur:.3f}",
        "-filter_complex", f"[0:v]{vf}[base];[base][1:v]overlay=0:980[v]",
        "-map", "[v]", "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-r", str(FPS), "-an", str(out),
    ])
    return dur


def half_clip(inp: Path, out: Path, label: str, *, dur: float | None = None, align: str = "left") -> float:
    labels = WORK / "labels"
    labels.mkdir(parents=True, exist_ok=True)
    lp = labels / f"{out.stem}_lbl.png"
    make_label(label, lp, align=align)
    d = dur if dur is not None else (probe_dur(inp) or 5.0)
    fade_out_st = max(0.0, d - 0.3)
    run([
        "ffmpeg", "-y", "-hide_banner", "-i", str(inp), "-i", str(lp), "-t", f"{d:.3f}",
        "-filter_complex",
        (
            "[0:v]scale=960:1080:force_original_aspect_ratio=decrease,"
            "pad=960:1080:(ow-iw)/2:(oh-ih)/2:black,setsar=1,"
            f"fade=t=in:st=0:d=0.3,fade=t=out:st={fade_out_st:.3f}:d=0.3[base];"
            "[base][1:v]overlay=0:24[v]"
        ),
        "-map", "[v]", "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-r", str(FPS), "-an", str(out),
    ])
    return d


def hstack_clips(left: Path, right: Path, out: Path, subtitle: str) -> float:
    dl, dr = probe_dur(left), probe_dur(right)
    d = max(dl, dr, 0.1)
    sub_png = WORK / "subs" / f"{out.stem}_sub.png"
    make_subtitle_bar(subtitle, sub_png)
    fade_out_st = max(0.0, d - 0.35)
    run([
        "ffmpeg", "-y", "-hide_banner", "-i", str(left), "-i", str(right), "-i", str(sub_png),
        "-filter_complex",
        (
            f"[0:v]tpad=stop_mode=clone:stop_duration={max(0.0, d - dl):.3f}[L];"
            f"[1:v]tpad=stop_mode=clone:stop_duration={max(0.0, d - dr):.3f}[R];"
            "[L][R]hstack=inputs=2[hs];"
            f"[hs]fade=t=in:st=0:d=0.35,fade=t=out:st={fade_out_st:.3f}:d=0.35[base];"
            "[base][2:v]overlay=0:980[v]"
        ),
        "-map", "[v]", "-t", f"{d:.3f}",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-r", str(FPS), "-an", str(out),
    ])
    return d


def make_end_card(out: Path, title: str, subtitle: str) -> None:
    img = Image.new("RGB", (1920, 1080), (12, 14, 20))
    draw = ImageDraw.Draw(img)
    ft, fs = load_font(72), load_font(36)
    for text, font, y, color in [
        (title, ft, 460, (255, 255, 255)),
        (subtitle, fs, 560, (160, 170, 190)),
    ]:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        draw.text(((1920 - tw) // 2, y), text, fill=color, font=font)
    png = WORK / "end_card.png"
    img.save(png)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loop", "1", "-i", str(png), "-t", "3",
        "-vf", "fade=t=in:st=0:d=0.4,fade=t=out:st=2.6:d=0.4",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-r", str(FPS), "-an", str(out),
    ])


def xfade_join(segments: list[tuple[Path, float]], out: Path) -> None:
    if len(segments) == 1:
        run(["ffmpeg", "-y", "-hide_banner", "-i", str(segments[0][0]), "-c", "copy", str(out)], quiet=False)
        return

    inputs: list[str] = []
    for p, _ in segments:
        inputs += ["-i", str(p)]

    parts: list[str] = []
    offset = segments[0][1] - XFADE
    prev = "[0:v]"
    for i in range(1, len(segments)):
        nxt = f"[{i}:v]"
        out_label = f"[v{i}]" if i < len(segments) - 1 else "[v]"
        parts.append(
            f"{prev}{nxt}xfade=transition=fade:duration={XFADE}:offset={offset:.3f}{out_label}"
        )
        prev = out_label
        offset += segments[i][1] - XFADE

    run([
        "ffmpeg", "-y", "-hide_banner", *inputs,
        "-filter_complex", ";".join(parts), "-map", "[v]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(out),
    ], quiet=False)


def build_segments() -> list[tuple[Path, float]]:
    WORK.mkdir(parents=True, exist_ok=True)
    (WORK / "subs").mkdir(exist_ok=True)
    built: list[tuple[Path, float]] = []

    def add(path: Path, dur: float) -> None:
        built.append((path, dur))

    # 1 片头佩戴
    p = WORK / "01_wear.mp4"
    add(p, center_clip(SRC / "人佩戴-4秒.mp4", p, dur=4, subtitle="佩戴姿态带 · 打开 Catune"))

    # 2 启动
    p = WORK / "02_launch.mp4"
    add(p, center_clip(SRC / "安卓模拟器启动.webm", p, dur=8, subtitle="端侧 AI 坐姿助手 · 本地启动"))

    # 3 模型下载
    p = WORK / "03_model.mp4"
    add(p, center_clip(SRC / "安卓模拟器下载模型视频.webm", p, dur=10, subtitle="Qwen2.5-0.5B 量化模型 · 手机本地加载"))

    # 4 猫动：左安卓猫动→雪碧图+LLM / 右 iOS 猫
    left_cat = WORK / "04L_android_cat.mp4"
    concat_videos([SRC / "安卓猫动.mp4", SRC / "安卓-雪碧图+端侧模型输出演示视频.mp4"], left_cat)
    right_cat = WORK / "04R_ios_cat.mp4"
    concat_videos([SRC / "苹果猫左右摇摆.mp4", SRC / "苹果猫低头抬头（剪4秒）.mp4"], right_cat)
    half_clip(left_cat, WORK / "04L_half.mp4", "Android · 猫动 + 端侧推理", align="left")
    half_clip(right_cat, WORK / "04R_half.mp4", "iOS · 猫动", align="right")
    p = WORK / "04_cat.mp4"
    add(p, hstack_clips(
        WORK / "04L_half.mp4", WORK / "04R_half.mp4", p,
        "颈、胸、腰三节点实时还原 · 前倾侧倾低头分得清",
    ))

    # 5 LoRA 微调证据（猫动之后：先看效果，再证明话术来源）
    _lora_spec = importlib.util.spec_from_file_location(
        "compose_lora_slides", Path(__file__).parent / "compose-lora-slides.py"
    )
    _lora = importlib.util.module_from_spec(_lora_spec)
    assert _lora_spec.loader is not None
    _lora_spec.loader.exec_module(_lora)
    lora_dir = WORK / "lora"
    lora_dir.mkdir(exist_ok=True)
    compare_png = SRC / "compare-lora.png"
    if not compare_png.is_file():
        _lora.render_compare_slide(ROOT / "training" / "compare.md", lora_dir / "compare_slide.png")
        compare_png = lora_dir / "compare_slide.png"
    _lora.render_logits_slide(lora_dir / "logits_slide.png", delta=14.4445)

    lora_parts: list[Path] = []
    loss_png = ROOT / "training" / "loss_curve.png"
    lp = WORK / "05_lora_loss.mp4"
    img_clip(loss_png, lp, 2.5, subtitle="LoRA 训练收敛 · eval loss 0.27 降至 0.11")
    lora_parts.append(lp)

    cp = WORK / "05_lora_compare.mp4"
    img_clip(compare_png, cp, 6.0, subtitle="7 条测试 0/7 与基座一致 · 学到猫教练话术")
    lora_parts.append(cp)

    gp = WORK / "05_lora_logits.mp4"
    img_clip(lora_dir / "logits_slide.png", gp, 2.5, subtitle="logits delta max 14.44 · LoRA 确已改写权重")
    lora_parts.append(gp)

    p = WORK / "05_lora.mp4"
    concat_videos(lora_parts, p)
    add(p, 11.0)

    # 6 跟练 iOS 居中
    p = WORK / "06_train.mp4"
    add(p, center_clip(SRC / "苹果-跟练（13秒）.mp4", p, dur=13, subtitle="跟练模式 · 跟着猫教练矫正坐姿"))

    # 7 监控居中
    p = WORK / "07_monitor.mp4"
    add(p, center_clip(SRC / "安卓监控页面.mp4", p, dur=12, subtitle="姿态信号进 · 教练文案出 · 全部端侧完成"))

    # 8 AI 评估 iOS 居中
    p = WORK / "08_ai.mp4"
    add(p, center_clip(SRC / "苹果AI姿态评估（取前15秒）.mp4", p, dur=14, subtitle="AI 姿态评估 · 多模态看懂你的坐姿"))

    # 9 Plant 居中
    p = WORK / "09_plant.mp4"
    add(p, center_clip(SRC / "安卓模拟器植物页+日报周报.webm", p, dur=10, subtitle="坚持好坐姿植物会长大 · 日报周报复盘"))

    # 10 基准测试截图各 1 秒
    bench_parts: list[Path] = []
    for i, name in enumerate(["安卓模型基准测试1.jpg", "安卓模型基准测试2.jpg"], 1):
        bp = WORK / f"10_bench_{i}.mp4"
        img_clip(SRC / name, bp, 1.0, subtitle="端侧基准：tok/s · 首字延迟 · backend")
        bench_parts.append(bp)
    p = WORK / "10_bench.mp4"
    concat_videos(bench_parts, p)
    add(p, 2.0)

    # 11 SME2：截图 + 终端录屏
    sme_parts: list[Path] = []
    for i, name in enumerate(["QWME跑推理.jpg", "M2用QWMU模拟SME2的CPU跑推理.jpg"], 1):
        sp = WORK / f"11_sme_img_{i}.mp4"
        img_clip(SRC / name, sp, 2.5, subtitle="MNN 已集成 SME2/KleidiAI 编译开关")
        sme_parts.append(sp)
    sme_mov = WORK / "11_sme_mov.mp4"
    center_clip(
        SRC / "libMNN.so 里编进了 SME2 内核.mov", sme_mov, dur=9,
        subtitle="libMNN.so 含 SME2 微内核 · 运行时按 CPU 能力自动选择",
    )
    sme_parts.append(sme_mov)
    p = WORK / "11_sme2.mp4"
    concat_videos(sme_parts, p)
    add(p, 14.0)

    # 12 传感器硬件
    p = WORK / "12_sensor.mp4"
    add(p, img_clip(
        SRC / "ESP32-C6主板+BNO085传感器.JPG", p, 4,
        subtitle="硬件姿态带 · ESP32-C6 + BNO085 九轴传感器",
    ))

    # 收尾
    end = WORK / "13_end.mp4"
    make_end_card(end, "Catune", "端侧 AI 的不驼背坐姿助手")
    add(end, 3.0)

    manifest = WORK / "manifest.json"
    manifest.write_text(
        json.dumps([{"file": str(p), "dur": d} for p, d in built], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return built


def main() -> None:
    if not which("ffmpeg"):
        sys.exit("需要 ffmpeg")
    segments = build_segments()
    print(f"==> 共 {len(segments)} 段，段间 fade 过渡 {XFADE}s …")
    xfade_join(segments, OUT)
    total = sum(d for _, d in segments) - XFADE * (len(segments) - 1)
    print(f"\n完成: {OUT}")
    print(f"   1920x1080 · 约 {total:.0f}s")


if __name__ == "__main__":
    main()
