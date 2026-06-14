/**
 * @file CatunePackage.kt
 * @description ReactPackage：业务逻辑已迁到 TS（src/posture），当前只注册端侧 MNN 调试模块。
 *
 * [WHO] 提供 `class CatunePackage: ReactPackage`，注册 `MnnDebugModule`
 * [FROM] 依赖 `com.facebook.react.*`、`MnnDebugModule`
 * [TO] 被 `CatuneApp.reactNativeHost.getPackages()` 添加到 PackageList
 * [HERE] android/app/src/main/java/com/catune/rn/CatunePackage.kt · RN Package 注册
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
