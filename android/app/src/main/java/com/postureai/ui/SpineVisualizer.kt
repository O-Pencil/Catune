package com.postureai.ui

import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

import android.util.Log
import android.webkit.WebChromeClient
import android.webkit.ConsoleMessage

@Composable
fun SpineVisualizer(angles: FloatArray, modifier: Modifier = Modifier) {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.allowFileAccess = true
                settings.allowContentAccess = true
                
                webChromeClient = object : WebChromeClient() {
                    override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                        Log.d("SpineVisualizer", "${consoleMessage?.message()} -- From line ${consoleMessage?.lineNumber()} of ${consoleMessage?.sourceId()}")
                        return true
                    }
                }
                
                webViewClient = WebViewClient()
                loadUrl("file:///android_asset/threejs_spine/index.html")
            }
        },
        update = { webView ->
            // 将角度数据实时传�?JS
            val neck = if (angles.isNotEmpty()) angles[0] else 0f
            val lumbar = if (angles.size > 1) angles[1] else 0f
            webView.evaluateJavascript("updateSpineAngles($neck, $lumbar)", null)
        },
        modifier = modifier.fillMaxSize()
    )
}
