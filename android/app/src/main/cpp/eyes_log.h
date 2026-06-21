// @file eyes_log.h
// @description 跨平台日志宏：EYES_LOGD / EYES_LOGE，tag = "CatuneMNN"。Android 走 logcat，iOS/其它走 stderr。
//
// [WHO] 定义 `EYES_LOG_TAG` 常量与 `EYES_LOGD(...)` / `EYES_LOGE(...)` 宏
// [FROM] Android: `<android/log.h>`；iOS/其它: `<cstdio>`
// [TO] 被 `eyes_mnn_bridge.cpp`(Android JNI) / `CatuneMnn.mm`(iOS) / `eyes_llm_session.cpp`(共享) 调用
// [HERE] android/app/src/main/cpp/eyes_log.h · 日志宏（header-only，C++ 核与安卓/iOS 共享）
#pragma once

#define EYES_LOG_TAG "CatuneMNN"

#if defined(__ANDROID__)
#include <android/log.h>
#define EYES_LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, EYES_LOG_TAG, __VA_ARGS__)
#define EYES_LOGE(...) __android_log_print(ANDROID_LOG_ERROR, EYES_LOG_TAG, __VA_ARGS__)
#else
#include <cstdio>
#define EYES_LOGD(...)                         \
  do {                                         \
    fprintf(stderr, "[D][" EYES_LOG_TAG "] "); \
    fprintf(stderr, __VA_ARGS__);              \
    fprintf(stderr, "\n");                     \
  } while (0)
#define EYES_LOGE(...)                         \
  do {                                         \
    fprintf(stderr, "[E][" EYES_LOG_TAG "] "); \
    fprintf(stderr, __VA_ARGS__);              \
    fprintf(stderr, "\n");                     \
  } while (0)
#endif
