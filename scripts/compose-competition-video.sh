#!/usr/bin/env bash
# 合成 Catune 参赛演示片 → mp4/Catune-参赛演示-1920x1080.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/compose-competition-video.py
