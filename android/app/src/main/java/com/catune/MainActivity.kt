/**
 * @file MainActivity.kt
 * @description React Native Activity 宿主（仅引导 RN）。姿态角解算/判定已迁到 TS（src/posture），此处不再持有业务逻辑。
 *
 * [WHO] 提供 MainActivity（默认 RN 入口）、`getMainComponentName()` 返回 "Catune"
 * [FROM] 依赖 `com.facebook.react.*`（Activity / Delegate）
 * [TO] 被 Android 启动器（`<action android:name="android.intent.action.MAIN" />`）拉起
 * [HERE] android/app/src/main/java/com/catune/MainActivity.kt · RN 宿主
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
}
