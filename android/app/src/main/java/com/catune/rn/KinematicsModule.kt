/**
 * @file KinematicsModule.kt
 * @description RN 桥接模块：订阅 KinematicsHub.state，经 PostureClassifier 生成建议文案后 emit onKinematicsUpdate 给 JS；暴露 getLatestState / setSimulationScenario。
 *
 * [WHO] 提供 `class KinematicsModule(reactContext: ReactApplicationContext)`、`getName()`、`init` 协程订阅、private `sendEvent()` / `stateToMap()` / `signalsFrom()`、`@ReactMethod getLatestState(promise)` / `setSimulationScenario(scenario)` / `addListener()` / `removeListeners()`
 * [FROM] 依赖 `com.facebook.react.bridge.*`、`KinematicsHub`、`PostureClassifier`（规则兜底文案）、`kotlinx.coroutines.flow.collectLatest`
 * [TO] 被 `CatunePackage.createNativeModules` 注册；JS 端 `NativeModules.KinematicsModule` 与 `NativeEventEmitter` 调用
 * [HERE] android/app/src/main/java/com/catune/rn/KinematicsModule.kt · RN 桥接层
 */
package com.catune.rn

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.catune.inference.mnn.KinematicsHub
import com.catune.inference.posture.PostureClassifier
import com.catune.inference.posture.PostureSignals
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class KinematicsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val scope = CoroutineScope(Dispatchers.Main + Job())

    override fun getName(): String = "KinematicsModule"

    init {
        // Observe KinematicsHub and emit events to JS
        scope.launch {
            KinematicsHub.state.collectLatest { state ->
                sendEvent("onKinematicsUpdate", stateToMap(state))
            }
        }
    }

    /** State → RN payload，含 PostureClassifier 生成的建议文案。 */
    private fun stateToMap(state: KinematicsHub.State): WritableMap =
        com.facebook.react.bridge.Arguments.createMap().apply {
            putDouble("neckPitch", state.neckPitch.toDouble())
            putDouble("lumbarRoll", state.lumbarRoll.toDouble())
            putString("posture", state.posture.name)
            putString("postureLabel", state.posture.label)
            putInt("score", state.score)
            // 文案：当前无端侧模型，走规则兜底（离线可用）。
            // TODO(端侧模型): 接入后改为 PostureClassifier.classify(engine, signals)，并按 posture 变化节流模型调用。
            val feedback = PostureClassifier.ruleFallback(signalsFrom(state))
            putString("advice", feedback.advice)
            putString("inferenceSource", feedback.classification.source.name)
        }

    private fun signalsFrom(state: KinematicsHub.State): PostureSignals =
        PostureSignals(
            neckPitchDeg = state.neckPitch,
            thorPitchDeg = 0f, // 1 节点暂无胸椎独立角度
            lumbarRollDeg = state.lumbarRoll,
            durationMin = state.abnormalDurationMinutes,
            lastState = state.posture.name,
        )

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun getLatestState(promise: com.facebook.react.bridge.Promise) {
        promise.resolve(stateToMap(KinematicsHub.state.value))
    }

    @ReactMethod
    fun setSimulationScenario(scenario: String) {
        // This will be used by F7 Mock Console
        Log.d("KinematicsModule", "Setting scenario: $scenario")
        // Implementation: We can update KinematicsHub with specific values based on scenario
        when(scenario) {
            "NORMAL" -> KinematicsHub.update(5.0f, 2.0f)
            "SLUMPED" -> KinematicsHub.update(10.0f, 25.0f)
            "TECH_NECK" -> KinematicsHub.update(35.0f, 5.0f)
            "LEFT_LEAN" -> KinematicsHub.update(5.0f, -15.0f)
            "OFFLINE" -> KinematicsHub.setOffline()
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN built-in EventEmitters
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN built-in EventEmitters
    }
}
