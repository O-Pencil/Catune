#!/usr/bin/env bash
# @file build-mnn-ios.sh
# @description 在 Mac 上编 MNN 的 iOS 静态库 + 汇总头文件，产出到 ios/CatuneMnn/MNN/（供 CatuneMnn.podspec 链接）。
#   产出：ios/CatuneMnn/MNN/lib/libMNN.a（device arm64）+ ios/CatuneMnn/MNN/include/（MNN core + llm 头）。
#   说明：MNN 的 iOS 构建因版本而异，本脚本是「可跑通起点」，按你的 MNN 版本/官方 iOS 文档微调。
#
# 用法：
#   export MNN_SRC=$PWD/android/app/src/main/cpp/third_party/MNN   # 或你的 MNN 源码
#   bash scripts/build-mnn-ios.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MNN_SRC="${MNN_SRC:?请先 export MNN_SRC=MNN 源码路径}"
OUT="$ROOT/ios/CatuneMnn/MNN"
BUILD="$ROOT/.mnn-ios-build"

echo "==> 配置 MNN iOS（device arm64，LLM + KleidiAI；按需开关）"
cmake -S "$MNN_SRC" -B "$BUILD" -G Xcode \
  -DCMAKE_SYSTEM_NAME=iOS \
  -DCMAKE_OSX_ARCHITECTURES=arm64 \
  -DCMAKE_OSX_DEPLOYMENT_TARGET=15.1 \
  -DMNN_BUILD_LLM=ON \
  -DMNN_ARM82=ON \
  -DMNN_KLEIDIAI=ON \
  -DMNN_LOW_MEMORY=ON \
  -DMNN_CPU_WEIGHT_DEQUANT_GEMM=ON \
  -DMNN_BUILD_SHARED_LIBS=OFF \
  -DMNN_SEP_BUILD=OFF \
  -DMNN_USE_THREAD_POOL=ON \
  -DMNN_METAL=OFF

echo "==> 编译 MNN（静态库）"
cmake --build "$BUILD" --config Release -j"$(sysctl -n hw.ncpu)"

echo "==> 汇总产物到 $OUT"
mkdir -p "$OUT/lib" "$OUT/include"
# 静态库（不同 MNN 版本路径可能不同，自动找最新 libMNN.a）
LIB="$(find "$BUILD" -name 'libMNN.a' | head -1)"
[ -n "$LIB" ] || { echo "✗ 没找到 libMNN.a，检查构建日志"; exit 1; }
cp "$LIB" "$OUT/lib/libMNN.a"

# 头文件：MNN core + transformers/llm（C++ 核 #include "llm/llm.hpp" 需要）
cp -R "$MNN_SRC/include/." "$OUT/include/" 2>/dev/null || true
if [ -d "$MNN_SRC/transformers/llm/engine/include" ]; then
  cp -R "$MNN_SRC/transformers/llm/engine/include/." "$OUT/include/"
fi

echo "✓ 完成：$OUT/lib/libMNN.a + $OUT/include/"
echo "  下一步：在 app.json 启用 plugins 里的 ./plugins/withCatuneMnn.js（已加），再 npx expo prebuild -p ios && cd ios && pod install"
echo "  注：仅 device arm64。要同时支持模拟器，请构建 xcframework（device+sim 各一份再 lipo/xcodebuild -create-xcframework）。"
