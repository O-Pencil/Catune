# Android App

## Requirements

- Android Studio Ladybug or newer
- Android SDK 35
- NDK 27 (for `eyes_mnn_bridge` stub; full MNN linkage optional)
- Physical device API 29+, 8GB RAM recommended

## Build

1. Open this folder in Android Studio.
2. Let Gradle sync; create `local.properties` with `sdk.dir` if needed.
3. Run **app** on device.

## First run

1. Grant camera, microphone, notifications.
2. **Start MCP Service** — note URL `http://<lan-ip>:8765/mcp` and Bearer token.
3. Configure Claude Code on PC (same Wi-Fi) per [../docs/claude-code-setup.md](../docs/claude-code-setup.md).

## MNN models (optional)

Push converted Qwen3-VL-2B MNN files to:

`/data/data/com.eyesonphone/files/mnn_models/qwen3-vl-2b/`

Without weights, tools use on-device **heuristic** analysis (`degraded_mode: true`).

See [../docs/troubleshooting.md](../docs/troubleshooting.md).
