#!/usr/bin/env node
/**
 * Android 构建预检：在跑 ./gradlew assembleDebug 前先确认项目配置 + 本机工具链。
 * 退出码 0 = 项目配置完整 + 工具链就绪；1 = 项目缺文件；2 = 工具链未装。
 */
import {existsSync, statSync, readFileSync} from 'node:fs';
import {execSync} from 'node:child_process';

const required = [
  'android/build.gradle',
  'android/app/build.gradle',
  'android/gradle.properties',
  'android/settings.gradle',
  'android/gradlew',
  'android/app/src/main/AndroidManifest.xml',
  'android/app/src/main/java/com/catune/MainApplication.kt',
  'android/app/src/main/java/com/catune/MainActivity.kt',
];

let projectOk = true;
for (const f of required) {
  if (existsSync(f)) {
    console.log(`  ✓ ${f}`);
  } else {
    console.log(`  ✗ MISSING: ${f}`);
    projectOk = false;
  }
}

console.log('\n--- gradle 关键配置 ---');
const gradleProps = readFileSync('android/gradle.properties', 'utf8');
for (const key of ['android.compileSdkVersion', 'android.targetSdkVersion', 'android.minSdkVersion', 'android.useAndroidX']) {
  const m = gradleProps.match(new RegExp(`${key}\\s*=\\s*(\\S+)`));
  console.log(`  ${key} = ${m?.[1] ?? '(未设置)'}`);
}

const rootBuild = readFileSync('android/build.gradle', 'utf8');
console.log(`  buildscript classpath: ${rootBuild.includes('com.android.tools.build:gradle') ? '✓' : '✗'}`);
console.log(`  React Native gradle plugin: ${rootBuild.includes('com.facebook.react:react-native-gradle-plugin') ? '✓' : '✗'}`);
console.log(`  Kotlin gradle plugin: ${rootBuild.includes('kotlin-gradle-plugin') ? '✓' : '✗'}`);

console.log('\n--- 本机工具链 ---');
let toolOk = true;
try {
  const java = execSync('java -version 2>&1', {encoding: 'utf8'});
  console.log(`  ✓ Java: ${java.split('\n')[0]}`);
} catch {
  console.log('  ✗ Java 未安装（需 JDK 17+）');
  toolOk = false;
}
try {
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '~/Library/Android/sdk';
  const sdkExpanded = sdk.replace('~', process.env.HOME);
  if (existsSync(sdkExpanded)) {
    console.log(`  ✓ Android SDK: ${sdkExpanded}`);
  } else {
    console.log(`  ✗ Android SDK 未找到：${sdk}`);
    toolOk = false;
  }
} catch {
  console.log('  ✗ Android SDK 未配置');
  toolOk = false;
}

console.log('\n--- 总结 ---');
if (!projectOk) {
  console.log('FAIL: 项目配置不完整，缺关键文件');
  process.exit(1);
}
if (!toolOk) {
  console.log('WARN: 本机工具链未就绪（Java / Android SDK 缺失），无法跑 ./gradlew assembleDebug');
  console.log('      请按 README.md 「原生构建」安装 Android Studio + SDK 35 后重试。');
  console.log('      项目配置本身完整 ✓');
  process.exit(2);
}
console.log('OK: 项目配置 + 工具链均就绪，可跑 ./gradlew assembleDebug');