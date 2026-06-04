#pragma once
#include <android/log.h>

#define EYES_LOG_TAG "EyesMNN"
#define EYES_LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, EYES_LOG_TAG, __VA_ARGS__)
#define EYES_LOGE(...) __android_log_print(ANDROID_LOG_ERROR, EYES_LOG_TAG, __VA_ARGS__)
