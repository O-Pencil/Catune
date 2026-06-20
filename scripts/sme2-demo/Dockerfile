# SME2 功能级演示镜像（linux/arm64）。
# 在 Apple Silicon（含 M2/M2 Pro）上由 Docker 原生 arm64 运行 → 构建快；
# 真正的 SME2 由容器内 qemu-user 的 `-cpu max` 模拟（M2 硬件无 SME2）。
FROM ubuntu:24.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake git ca-certificates \
    qemu-user \
    && rm -rf /var/lib/apt/lists/*

# MNN 源码与 .mnn 模型在运行时挂载（-v），避免镜像臃肿。
WORKDIR /work
