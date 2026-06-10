/**
 * @file CatuneApp.kt
 * @description Application 入口，初始化 React Native / SoLoader / 新架构。仅负责启动 RN——业务逻辑（状态机/打分/建议/模拟数据）已迁到 TS（src/posture），iOS/Android 共用。
 *
 * [WHO] 提供 CatuneApp（Application 子类）、内部 `reactNativeHost`（`DefaultReactNativeHost`）
 * [FROM] 依赖 `com.facebook.react.*`（SoLoader / ReactHost / PackageList）、`com.catune.rn.CatunePackage`
 * [TO] 被 Android 启动器（`android:name=".CatuneApp"`）实例化；`CatunePackage` 被 `reactNativeHost.getPackages()` 注册
 * [HERE] android/app/src/main/java/com/catune/CatuneApp.kt · 全局应用类（仅引导 RN）
 */
package com.catune

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.catune.rn.CatunePackage

class CatuneApp : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              add(CatunePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
  }
}
