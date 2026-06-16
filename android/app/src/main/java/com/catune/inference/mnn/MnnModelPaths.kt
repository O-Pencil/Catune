package com.catune.inference.mnn

import android.content.Context
import java.io.File

/**
 * 端侧 MNN 模型路径。活跃模型由 JS 写入 [ACTIVE_FILE]（model id），原生侧读取。
 * 须与 TS [modelCatalog] / [ModelDownloadCard] 保持一致。
 */
object MnnModelPaths {
    const val ROOT = "mnn_models"
    const val ACTIVE_FILE = "$ROOT/.active"
    const val DEFAULT_MODEL_ID = "qwen2.5-0.5b"
    const val DEFAULT_SUBDIR = "$ROOT/$DEFAULT_MODEL_ID"

    /** @deprecated 使用 [resolveSubdir]；保留常量供旧注释/文档引用 */
    const val SUBDIR: String = DEFAULT_SUBDIR

    fun resolveSubdir(context: Context): String {
        val activeFile = File(context.filesDir, ACTIVE_FILE)
        if (activeFile.exists()) {
            val id = activeFile.readText().trim()
            if (id.isNotEmpty()) {
                val subdir = "$ROOT/$id"
                val config = File(File(context.filesDir, subdir), "config.json")
                if (config.exists()) {
                    return subdir
                }
            }
        }
        val fallback = File(File(context.filesDir, DEFAULT_SUBDIR), "config.json")
        return if (fallback.exists()) DEFAULT_SUBDIR else DEFAULT_SUBDIR
    }

    fun resolveModelDir(context: Context): File = File(context.filesDir, resolveSubdir(context))

    fun resolveActiveModelId(context: Context): String {
        val subdir = resolveSubdir(context)
        return subdir.removePrefix("$ROOT/")
    }
}
