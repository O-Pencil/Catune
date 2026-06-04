package com.postureai.inference.mnn

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

object KinematicsHub {
    data class State(
        val neckPitch: Float = 0f,
        val lumbarRoll: Float = 0f,
        val postureStatus: String = "Normal"
    )

    private val _state = MutableStateFlow(State())
    val state: StateFlow<State> = _state

    fun update(neck: Float, lumbar: Float) {
        val status = when {
            neck > 25f -> "Neck Compensating"
            lumbar > 10f -> "Lumbar Over-rotated"
            else -> "Normal"
        }
        _state.value = State(neck, lumbar, status)
    }

    fun getAsJson() = buildJsonObject {
        put("neck_pitch", _state.value.neckPitch)
        put("lumbar_roll", _state.value.lumbarRoll)
        put("status", _state.value.postureStatus)
    }
}
