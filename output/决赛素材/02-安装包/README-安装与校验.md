# Catune 决赛最终 Release

## 文件

- APK：`Catune-决赛最终锁定包-2026-08-14-arm64-release.apk`
- 包名：`com.catune`
- 版本：`1.0.0 (2)`
- minSdk / targetSdk：24 / 35
- SHA-256：`CB46C17C44DC5B440770B7A948555C33A33DF704AB78B0A68284D98C5FB0DB99`

## 构建与静态校验

- Gradle `app:assembleRelease -PenableMnn=true`：通过。
- Android Lint Vital：通过。
- APK Signature Scheme v2：通过。
- APK 内包含：`lib/arm64-v8a/libMNN.so`、`libappmodules.so`、`libposture_ai_bridge.so`。
- Qwen3.5 非思考模式运行时开关已编入原生 bridge。

## 安装

```powershell
adb install -r "Catune-决赛最终锁定包-2026-08-14-arm64-release.apk"
```

当前 Release 使用项目调试证书签名，适用于同签名测试包的覆盖安装和决赛侧载；正式上架前需要换成受控生产证书并递增 `versionCode`。

## 真机验收

- [x] ADB 覆盖安装成功。
- [x] 冷启动无 Metro、无开发警告条，冷启动耗时 308 ms。
- [x] 系统包信息为 `1.0.0 (2)`，设置页显示 `V1.0.0`。
- [x] 模型管理显示 Qwen3.5-4B 已安装且为当前模型。
- [x] 单次推理直接输出中文提醒，不出现 Thinking Process；SME2、8.77 tok/s、总耗时 2893 ms。
- [ ] Welcome 页 `Get Start!` 安全区问题修复后重拍。
