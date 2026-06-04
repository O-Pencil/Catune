package com.postureai.inference

import android.content.Context
import com.postureai.inference.mnn.MnnPerceptionEngine
import java.io.File

data class ModelInstallState(
    val modelDir: String,
    val weightsPresent: Boolean,
    val fileCount: Int,
    val totalSizeMb: Float,
    val nativeLibLoaded: Boolean,
    val readyForInference: Boolean,
    val checking: Boolean = false,
) {
    val statusLabel: String = when {
        checking -> "Checking model filesâ€?
        readyForInference -> "Ready (Qwen3-VL)"
        weightsPresent && nativeLibLoaded && !readyForInference ->
            "Weights OK Â· loading MNN (${com.postureai.inference.mnn.InferenceExecutor.loadError() ?: "initâ€?})"
        weightsPresent && !readyForInference -> "Weights OK Â· MNN inference not wired yet"
        weightsPresent && !nativeLibLoaded -> "Weights found Â· JNI library missing"
        weightsPresent -> "Weights found"
        else -> "Not installed (heuristic mode)"
    }

    companion object {
        fun loading() = ModelInstallState(
            modelDir = "",
            weightsPresent = false,
            fileCount = 0,
            totalSizeMb = 0f,
            nativeLibLoaded = false,
            readyForInference = false,
            checking = true,
        )
    }
}

object ModelInstallChecker {
    private const val MODEL_SUBDIR = "mnn_models/qwen3-vl-2b"
    private val REQUIRED_FILES = listOf(
        "config.json",
        "llm.mnn",
        "llm.mnn.weight",
        "visual.mnn",
        "visual.mnn.weight",
    )

    fun from(context: Context): ModelInstallState {
        val dir = File(context.filesDir, MODEL_SUBDIR)
        if (!dir.exists()) dir.mkdirs()

        var fileCount = 0
        var totalBytes = 0L
        dir.listFiles()?.forEach { f ->
            if (f.isFile) {
                fileCount++
                totalBytes += f.length()
            }
        }

        val weightsPresent = hasRequiredModelFiles(dir)
        val nativeLoaded = MnnPerceptionEngine.isNativeLibLoaded()
        val inferenceReady = weightsPresent &&
            nativeLoaded &&
            (com.postureai.inference.mnn.InferenceExecutor.isModelLoaded() ||
                MnnPerceptionEngine.isModelDirReady(dir))
        return ModelInstallState(
            modelDir = dir.absolutePath,
            weightsPresent = weightsPresent,
            fileCount = fileCount,
            totalSizeMb = totalBytes / (1024f * 1024f),
            nativeLibLoaded = nativeLoaded,
            readyForInference = inferenceReady,
        )
    }

    private fun hasRequiredModelFiles(dir: File): Boolean =
        REQUIRED_FILES.all { name -> File(dir, name).isFile && File(dir, name).length() > 0L }
}
