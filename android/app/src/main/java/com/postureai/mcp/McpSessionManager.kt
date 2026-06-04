package com.postureai.mcp

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

class McpSession(
    val sessionId: String,
    val notificationFlow: MutableSharedFlow<String> = MutableSharedFlow(extraBufferCapacity = 64),
)

class McpSessionManager {
    private val sessions = ConcurrentHashMap<String, McpSession>()

    fun createSession(): McpSession {
        val id = UUID.randomUUID().toString().replace("-", "")
        val session = McpSession(id)
        sessions[id] = session
        return session
    }

    fun getSession(sessionId: String?): McpSession? {
        if (sessionId.isNullOrBlank()) return null
        return sessions[sessionId]
    }

    fun removeSession(sessionId: String) {
        sessions.remove(sessionId)
    }

    fun broadcastNotification(json: String): Boolean {
        var emitted = false
        sessions.values.forEach { session ->
            if (session.notificationFlow.tryEmit(json)) {
                emitted = true
            }
        }
        return emitted
    }
}
