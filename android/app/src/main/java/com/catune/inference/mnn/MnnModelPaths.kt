package com.catune.inference.mnn

/**
 * 端侧 MNN 模型目录（相对 context.filesDir）。
 * 须与 [ModelDownloadCard] 的 MODEL_SUBDIR 保持一致。
 *
 * 当前用 Qwen2.5-0.5B 便于模拟器/low-RAM 联调；真机验证 SME2/1.7B 时再改回 qwen3-1.7b 并同步 TS 下载源。
 */
object MnnModelPaths {
    const val SUBDIR = "mnn_models/qwen2.5-0.5b"
}
