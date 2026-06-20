#!/usr/bin/env bash
# @file run-sme2-min.sh
# @description 最小 SME2 兜底镜头：在 Docker(linux/arm64) 里编 sme2_min.c，
#   先原生跑(M2 无 SME2 → SME2:no)，再 `qemu-aarch64 -cpu max` 跑(模拟 → SME2:yes + 指令执行 OK)。
#   比 MNN 全链路稳得多，只证"SME2 特性存在且指令可执行"，适合当兜底/对照镜头。
#
# 用法：bash scripts/sme2-demo/run-sme2-min.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"

echo "==> 构建镜像（linux/arm64）"
docker build --platform=linux/arm64 -t catune-sme2 "$HERE"

echo "==> 编译 + 原生/模拟 对比"
docker run --rm --platform=linux/arm64 -v "$HERE":/src:ro catune-sme2 bash -lc '
set -e
echo "=== qemu 是否暴露 SME2 ==="
qemu-aarch64 -cpu help 2>/dev/null | grep -iE "\bsme2?\b" || echo "(qemu 版本较老可能不列出)"

echo "=== 编译（带 +sme2 march；toolchain 不支持则退回仅检测） ==="
if cc -O2 -march=armv9.2-a+sme2 /src/sme2_min.c -o /tmp/sme2_min 2>/tmp/cc.log; then
  echo "[ok] 以 armv9.2-a+sme2 编译（含 SME 指令）"
else
  echo "[!] +sme2 march 不支持，退回纯检测编译："; cat /tmp/cc.log | tail -3
  cc -O2 /src/sme2_min.c -o /tmp/sme2_min
fi

echo "=== A) 原生执行（容器=M2 原生 arm64，无 SME2 → 预期 SME2: no） ==="
/tmp/sme2_min || true

echo "=== B) qemu -cpu max 执行（模拟出 SME2 → 预期 SME2: yes + 指令 OK） ==="
qemu-aarch64 -cpu max /tmp/sme2_min
'
echo "==> 完成。录制重点：A vs B 的 SME2: no → yes，以及 smstart/smstop executed OK。"
