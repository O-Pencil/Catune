/**
 * @file MainActivity.kt
 * @description React Native Activity 宿主，并提供四元数→姿态角的纯 Kotlin 解算入口（端侧 MNN 推理对接前的占位实现）。
 *
 * [WHO] 提供 MainActivity（默认 RN 入口）、`calculateSpineAnglesStatic(rawQuaternions: FloatArray): FloatArray`
 * [FROM] 依赖 `com.facebook.react.*`（Activity / Delegate）
 * [TO] 被 Android 启动器（`<action android:name="android.intent.action.MAIN" />`）拉起；`calculateSpineAnglesStatic` 被 `CatuneApp` 注入到 `SpineBluetoothManager` 回调链
 * [HERE] android/app/src/main/java/com/catune/MainActivity.kt · RN 宿主 + 姿态角解算占位
 *
 * 注：端侧 Qwen + MNN 推理（含 JNI / libMNN）已从初赛代码移除，改由 `docs/端侧模型对接计划.md` 规划重新接入。
 * 当前 `calculateSpineAnglesStatic` 为纯 Kotlin 占位算法，配合 F7 模拟数据驱动 UI。
 */
package com.catune

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "Catune"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null) // Required for React Native
    }

    companion object {
        /**
         * 纯 Kotlin 姿态角解算占位实现。
         * TODO(端侧模型): 接入真实四元数→姿态角算法 / 端侧 Qwen+MNN 推理，详见 docs/端侧模型对接计划.md。
         */
        @JvmStatic
        fun calculateSpineAnglesStatic(rawQuaternions: FloatArray): FloatArray {
            if (rawQuaternions.isEmpty()) return floatArrayOf(0f, 0f)
            val neckPitch = ((rawQuaternions.getOrNull(0) ?: 0f) * 12f + 8f).coerceIn(-45f, 45f)
            val lumbarRoll = ((rawQuaternions.getOrNull(1) ?: 0f) * 10f + 4f).coerceIn(-30f, 30f)
            return floatArrayOf(neckPitch, lumbarRoll)
        }
    }
}
