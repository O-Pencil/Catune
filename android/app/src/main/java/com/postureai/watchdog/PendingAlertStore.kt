package com.postureai.watchdog

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

@Serializable
data class PendingAlert(
    val alertKey: String,
    val watchId: String,
    val summary: String,
    val structuredJson: String,
    val timestampMs: Long,
)

class PendingAlertStore(context: Context) {
    private val file = File(context.filesDir, "pending_alerts.json")
    private val maxAlerts = 20
    private val listSerializer = ListSerializer(PendingAlert.serializer())

    @Synchronized
    fun addAlert(alert: PendingAlert) {
        val current = loadAll().toMutableList()
        current.add(0, alert)
        while (current.size > maxAlerts) current.removeLast()
        file.writeText(Json.encodeToString(listSerializer, current))
    }

    @Synchronized
    fun loadAll(): List<PendingAlert> {
        if (!file.exists()) return emptyList()
        return try {
            Json.decodeFromString(listSerializer, file.readText())
        } catch (_: Exception) {
            emptyList()
        }
    }

    @Synchronized
    fun clear() {
        file.delete()
    }

    fun toJson(): String = Json.encodeToString(listSerializer, loadAll())
}
