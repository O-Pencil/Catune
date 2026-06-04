package com.postureai.pairing

import android.content.Context
import java.security.SecureRandom
import java.util.UUID

class PairingManager(context: Context) {
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    val bearerToken: String
        get() = prefs.getString(KEY_TOKEN, null) ?: generateAndStoreToken()

    var serverPort: Int
        get() = prefs.getInt(KEY_PORT, DEFAULT_PORT)
        set(value) = prefs.edit().putInt(KEY_PORT, value).apply()

    fun regenerateToken(): String {
        val token = "eop_${UUID.randomUUID().toString().replace("-", "")}"
        prefs.edit().putString(KEY_TOKEN, token).apply()
        return token
    }

    private fun generateAndStoreToken(): String = regenerateToken()

    companion object {
        const val DEFAULT_PORT = 8765
        private const val PREFS_NAME = "eyes_on_phone_pairing"
        private const val KEY_TOKEN = "bearer_token"
        private const val KEY_PORT = "server_port"
    }
}
