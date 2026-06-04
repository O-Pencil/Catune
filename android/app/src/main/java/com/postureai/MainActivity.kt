package com.postureai

import android.Manifest
import android.content.ClipData
import android.content.ClipboardManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.postureai.PostureAIApp
import com.postureai.inference.InferenceStatusHub
import com.postureai.inference.ModelInstallChecker
import com.postureai.inference.ModelInstallState
import com.postureai.inference.mnn.InferenceExecutor
import com.postureai.pairing.PairingManager
import com.postureai.service.McpForegroundService
import com.postureai.ui.theme.PostureAITheme

import androidx.lifecycle.lifecycleScope
import com.postureai.bluetooth.SpineBluetoothManager
import com.postureai.inference.mnn.KinematicsHub

class MainActivity : ComponentActivity() {
    private var serviceRunning by mutableStateOf(false)
    private var boundService: McpForegroundService? = null
    private lateinit var bluetoothManager: SpineBluetoothManager

    companion object {
        init {
            System.loadLibrary("MNN")
            System.loadLibrary("posture_ai_bridge")
        }
    }

    external fun calculateSpineAngles(rawQuaternions: FloatArray): FloatArray

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { grants ->
        if (grants.values.all { it }) {
            startMcpService()
            bluetoothManager.startBleScan()
        } else {
            Toast.makeText(this, "Camera, microphone, and Bluetooth permissions required", Toast.LENGTH_LONG).show()
        }
    }

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, binder: IBinder?) {
            boundService = null // not using binder
            serviceRunning = true
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            boundService = null
            serviceRunning = false
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val app = application as PostureAIApp
        
        bluetoothManager = SpineBluetoothManager(this, lifecycleScope) { raw ->
            calculateSpineAngles(raw)
        }
        // 我们改为在权限获取后启动扫描，但模拟数据可以先跑着
        bluetoothManager.startSimulation()

        setContent {
            PostureAITheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    var spineAngles by remember { mutableStateOf(floatArrayOf(0f, 0f)) }
                    val kinematicsState by KinematicsHub.state.collectAsStateWithLifecycle()
                    
                    LaunchedEffect(kinematicsState) {
                        spineAngles = floatArrayOf(kinematicsState.neckPitch, kinematicsState.lumbarRoll)
                    }
                    
                    Column {
                        // 在上方显�?3D 脊柱模型
                        Box(modifier = Modifier.weight(1f).background(Color.DarkGray)) {
                            SpineVisualizer(angles = spineAngles)
                            // 浮层显示实时数据，避开状态栏
                            Column(modifier = Modifier
                                .statusBarsPadding()
                                .padding(16.dp)) {
                                Text("REALTIME DATA", color = Color.Green)
                                Text("Neck Pitch: ${spineAngles[0]}°", color = Color.White)
                                Text("Lumbar Roll: ${spineAngles[1]}°", color = Color.White)
                                Text("Status: ${kinematicsState.postureStatus}", color = Color.Yellow)
                            }
                        }

                        // 下方保留原有�?MCP 控制面板
                        Box(modifier = Modifier.weight(1f).background(Color.Black)) {
                            MainScreen(
                                pairingManager = app.pairingManager,
                                serviceRunning = serviceRunning,
                                onStart = { ensurePermissionsAndStart() },
                                onStop = { stopMcpService() },
                                onRegenerateToken = {
                                    app.pairingManager.regenerateToken()
                                    Toast.makeText(this@MainActivity, "Token regenerated", Toast.LENGTH_SHORT).show()
                                },
                            )
                        }
                    }
                }
            }
        }
    }

    override fun onStart() {
        super.onStart()
        bindService(
            Intent(this, McpForegroundService::class.java),
            connection,
            Context.BIND_AUTO_CREATE,
        )
    }

    override fun onStop() {
        super.onStop()
        try {
            unbindService(connection)
        } catch (_: Exception) {
        }
    }

    private fun ensurePermissionsAndStart() {
        val needed = mutableListOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            needed.add(Manifest.permission.BLUETOOTH_SCAN)
            needed.add(Manifest.permission.BLUETOOTH_CONNECT)
        }
        needed.add(Manifest.permission.ACCESS_FINE_LOCATION)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            needed.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        val missing = needed.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isEmpty()) {
            startMcpService()
            bluetoothManager.startBleScan()
        } else {
            permissionLauncher.launch(missing.toTypedArray())
        }
    }

    private fun startMcpService() {
        ContextCompat.startForegroundService(
            this,
            Intent(this, McpForegroundService::class.java),
        )
        serviceRunning = true
        Toast.makeText(this, "MCP service started", Toast.LENGTH_SHORT).show()
    }

    private fun stopMcpService() {
        startService(
            Intent(this, McpForegroundService::class.java).apply {
                action = McpForegroundService.ACTION_STOP
            },
        )
        stopService(Intent(this, McpForegroundService::class.java))
        serviceRunning = false
    }
}

@Composable
fun MainScreen(
    pairingManager: PairingManager,
    serviceRunning: Boolean,
    onStart: () -> Unit,
    onStop: () -> Unit,
    onRegenerateToken: () -> Unit,
) {
    val context = LocalContext.current
    val ip = NetworkUtils.getLanIpAddress()
    val port = pairingManager.serverPort
    val token = pairingManager.bearerToken
    val mcpUrl = "http://$ip:$port/mcp"
    val claudeCmd = "claude mcp add --transport http --scope project eyes-on-phone $mcpUrl --header \"Authorization: Bearer $token\""
    val qrBitmap = rememberQrBitmap(claudeCmd)
    val inferenceStatus by InferenceStatusHub.state.collectAsStateWithLifecycle()
    var modelState by remember { mutableStateOf(ModelInstallState.loading()) }
    LaunchedEffect(serviceRunning) {
        modelState = ModelInstallState.loading()
        withContext(Dispatchers.IO) { InferenceExecutor.ensureModelLoaded(context) }
        modelState = withContext(Dispatchers.IO) { ModelInstallChecker.from(context) }
        while (!modelState.readyForInference && modelState.weightsPresent) {
            delay(3000)
            withContext(Dispatchers.IO) { InferenceExecutor.ensureModelLoaded(context) }
            modelState = withContext(Dispatchers.IO) { ModelInstallChecker.from(context) }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Eyes-on-Phone", style = MaterialTheme.typography.headlineMedium)
        Text("Phone-as-MCP Server for Claude Code")

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Service: ${if (serviceRunning) "Running" else "Stopped"}")
                Text("MCP URL: $mcpUrl")
                Text("Token: ${token.take(12)}...")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (serviceRunning) {
                        OutlinedButton(onClick = onStop) { Text("Stop") }
                    } else {
                        Button(onClick = { onStart() }) { Text("Start MCP Service") }
                    }
                    OutlinedButton(onClick = onRegenerateToken) { Text("New Token") }
                }
            }
        }

        ModelStatusCard(model = modelState)
        InferenceStatusCard(status = inferenceStatus)

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Claude Code setup", style = MaterialTheme.typography.titleMedium)
                Text(claudeCmd, style = MaterialTheme.typography.bodySmall)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = { copyToClipboard(context, claudeCmd) }) { Text("Copy command") }
                    OutlinedButton(onClick = { copyToClipboard(context, token) }) { Text("Copy token") }
                }
                qrBitmap?.let {
                    Image(
                        bitmap = it.asImageBitmap(),
                        contentDescription = "QR for Claude MCP setup",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(220.dp),
                    )
                }
            }
        }

        Text(
            "Point Claude Code at this HTTP MCP server. Tools: phone_look, phone_listen, phone_perceive, phone_watch_*.",
            style = MaterialTheme.typography.bodyMedium,
        )
    }
}

@Composable
private fun rememberQrBitmap(text: String): Bitmap? {
    return androidx.compose.runtime.remember(text) {
        QrCodeGenerator.generate(text, 400)
    }
}

private fun copyToClipboard(context: Context, text: String) {
    val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    cm.setPrimaryClip(ClipData.newPlainText("eyes-on-phone", text))
    Toast.makeText(context, "Copied", Toast.LENGTH_SHORT).show()
}
