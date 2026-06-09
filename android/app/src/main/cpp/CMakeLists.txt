# @file CMakeLists.txt
# @description CMake 3.22.1 配置：构建 posture_ai_bridge 共享库，链接外部 IMPORTED 的 libMNN.so。
#
# [WHO] cmake_minimum_required(3.22.1) + project("posture_ai_bridge") + add_library(posture_ai_bridge SHARED eyes_mnn_bridge.cpp eyes_llm_session.cpp) + add_library(MNN SHARED IMPORTED)
# [FROM] 依赖 `MNN_SOURCE_ROOT` 头文件目录、`jniLibs/${ANDROID_ABI}/libMNN.so`、`log-lib`、`android`
# [TO] 被 `android/app/build.gradle` 的 `externalNativeBuild { cmake { path "src/main/cpp/CMakeLists.txt" } }` 调用
# [HERE] android/app/src/main/cpp/CMakeLists.txt · 原生构建配置
cmake_minimum_required(VERSION 3.22.1)
project("posture_ai_bridge")

# MNN 源码（含 llm/llm.hpp 等头文件）须放到仓库内的 cpp/third_party/MNN/。
# 原历史路径指向仓库外的 Template-github/eyes-on-my-phone/MNN-master（不存在 → 构建失败），已改为仓库内相对路径。
# 可用 -DMNN_SOURCE_ROOT=<绝对路径> 覆盖。详见 docs/端侧模型对接计划.md。
if(NOT DEFINED MNN_SOURCE_ROOT)
    set(MNN_SOURCE_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/third_party/MNN")
endif()
if(NOT EXISTS "${MNN_SOURCE_ROOT}/include/MNN")
    message(FATAL_ERROR "MNN 源码缺失：未找到 ${MNN_SOURCE_ROOT}/include/MNN。\n请将 MNN 源码放到 cpp/third_party/MNN/，或用 -DMNN_SOURCE_ROOT=<path> 指定。详见 docs/端侧模型对接计划.md。")
endif()
set(MNN_LIB_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../jniLibs/${ANDROID_ABI}")

add_library(posture_ai_bridge SHARED
        eyes_mnn_bridge.cpp
        eyes_llm_session.cpp
)

target_compile_definitions(posture_ai_bridge PRIVATE GIT_COMMIT_ID="eyes-on-phone")

target_link_options(posture_ai_bridge PRIVATE "-Wl,-z,max-page-size=16384")

include_directories(
        "${MNN_SOURCE_ROOT}/include/"
        "${MNN_SOURCE_ROOT}/transformers/llm/engine/include"
        "${MNN_SOURCE_ROOT}/tools/audio/include"
        "${MNN_SOURCE_ROOT}/3rd_party/"
)

add_library(MNN SHARED IMPORTED)
set_target_properties(MNN PROPERTIES IMPORTED_LOCATION "${MNN_LIB_DIR}/libMNN.so")

find_library(log-lib log)

target_link_libraries(posture_ai_bridge
        ${log-lib}
        android
        MNN
)
