# cpp/third_party/

端侧 MNN 推理的**第三方源码**放这里（不入库，体积大）。

## MNN/

`-PenableMnn=true` 构建时，`CMakeLists.txt` 会在 `cpp/third_party/MNN/` 找 MNN 源码头文件：

```
third_party/MNN/
├── include/MNN/...
├── transformers/llm/engine/include/llm/llm.hpp
├── tools/audio/include/...
└── 3rd_party/...
```

缺失时 CMake 会直接报 `FATAL_ERROR` 并提示本路径。

也可不放这里，用 `-DMNN_SOURCE_ROOT=<绝对路径>` 指定外部 MNN 源码目录。默认 App 构建不需要 MNN 源码；只有 `-PenableMnn=true` 时才会进入该路径。
