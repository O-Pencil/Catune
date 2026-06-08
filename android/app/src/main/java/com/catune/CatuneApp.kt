/**
 * @file CatuneApp.kt
 * @description Application 入口，初始化 React Native、SoLoader、新架构入口，并启动 SpineBluetoothManager 模拟流驱动 RN 仪表盘。
 *
 * [WHO] 提供 CatuneApp（Application 子类）、内部 `reactNativeHost`（`DefaultReactNativeHost`）、`bluetoothManager` 字段
 * [FROM] 依赖 `com.facebook.react.*`（SoLoader / ReactHost / PackageList）、`com.catune.bluetooth.SpineBluetoothManager`、`com.catune.rn.CatunePackage`
 * [TO] 被 Android 启动器（`android:name=".CatuneApp"`）实例化；`CatunePackage` 被 `reactNativeHost.getPackages()` 注册
 * [HERE] android/app/src/main/java/com/catune/CatuneApp.kt · 全局应用类 + 核心装配
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
import com.catune.bluetooth.SpineBluetoothManager
import kotlinx.coroutines.MainScope

class CatuneApp : Application(), ReactApplication {

  private lateinit var bluetoothManager: SpineBluetoothManager

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

    // 初赛阶段：自动启动模拟数据流，驱动 RN 仪表盘展示测试数据（无硬件依赖）。
    // 真实 BLE 链路与端侧模型对接见 docs/端侧模型对接计划.md。
    bluetoothManager = SpineBluetoothManager(this, MainScope()) { raw ->
        com.catune.MainActivity.calculateSpineAnglesStatic(raw)
    }
    bluetoothManager.startSimulation()
  }
}
