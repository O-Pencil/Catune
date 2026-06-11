/**
 * @file CatunePackage.kt
 * @description ReactPackage 占位。业务逻辑已迁到 TS（src/posture），当前无自定义原生模块。
 *   端侧 Qwen+MNN 就绪后，这里注册一个仅暴露 `inferText` 的 AI 推理模块（见 docs/端侧模型对接计划.md）。
 *
 * [WHO] 提供 `class CatunePackage: ReactPackage`，`createNativeModules()` 返回空，`createViewManagers()` 返回空
 * [FROM] 依赖 `com.facebook.react.*`
 * [TO] 被 `CatuneApp.reactNativeHost.getPackages()` 添加到 PackageList
 * [HERE] android/app/src/main/java/com/catune/rn/CatunePackage.kt · RN Package 注册（占位）
 */
package com.catune.rn

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class CatunePackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(MnnDebugModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
