# RN New Architecture（libappmodules.so）+ 可选 MNN 桥（libposture_ai_bridge.so）
# 不可只用 cpp/CMakeLists.txt，否则会覆盖 appmodules 导致 PlatformConstants 等 TurboModule 缺失。
cmake_minimum_required(VERSION 3.22.1)

project(appmodules)
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

if(ENABLE_MNN)
    set(MNN_BRIDGE_CPP_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../cpp)

    if(NOT DEFINED MNN_SOURCE_ROOT)
        set(MNN_SOURCE_ROOT "${MNN_BRIDGE_CPP_DIR}/third_party/MNN")
    endif()
    if(NOT EXISTS "${MNN_SOURCE_ROOT}/include/MNN")
        message(FATAL_ERROR "MNN 源码缺失：未找到 ${MNN_SOURCE_ROOT}/include/MNN。\n请将 MNN 源码放到 cpp/third_party/MNN/，或用 -DMNN_SOURCE_ROOT=<path> 指定。")
    endif()

    set(MNN_LIB_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../jniLibs/${ANDROID_ABI}")

    add_library(posture_ai_bridge SHARED
        ${MNN_BRIDGE_CPP_DIR}/eyes_mnn_bridge.cpp
        ${MNN_BRIDGE_CPP_DIR}/eyes_llm_session.cpp
    )

    target_compile_definitions(posture_ai_bridge PRIVATE GIT_COMMIT_ID="eyes-on-phone" CATUNE_MNN_LIB_SME2=1)
    target_link_options(posture_ai_bridge PRIVATE "-Wl,-z,max-page-size=16384")

    target_include_directories(posture_ai_bridge PRIVATE
        "${MNN_SOURCE_ROOT}/include/"
        "${MNN_SOURCE_ROOT}/transformers/llm/engine/include"
        "${MNN_SOURCE_ROOT}/tools/audio/include"
        "${MNN_SOURCE_ROOT}/3rd_party/"
    )

    add_library(MNN SHARED IMPORTED)
    set_target_properties(MNN PROPERTIES IMPORTED_LOCATION "${MNN_LIB_DIR}/libMNN.so")

    find_library(log-lib log)
    find_library(dl-lib dl)

    target_link_libraries(posture_ai_bridge
        ${log-lib}
        ${dl-lib}
        android
        MNN
    )
endif()
