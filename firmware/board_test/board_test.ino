/*
 * board_test.ino — Catune 开发板单板自检（ESP32-S3 / ESP32-C6）
 *
 * 不接 BNO085，只验证：烧录、USB 串口、板载 LED。
 * 详见 docs/硬件单板自检指南.md
 */
#include <Arduino.h>

#if CONFIG_IDF_TARGET_ESP32S3
  #define BOARD_NAME "ESP32-S3"
#elif CONFIG_IDF_TARGET_ESP32C6
  #define BOARD_NAME "ESP32-C6"
#elif CONFIG_IDF_TARGET_ESP32
  #define BOARD_NAME "ESP32"
#else
  #define BOARD_NAME "ESP32 (unknown target)"
#endif

#ifndef LED_BUILTIN
  // 部分 DevKit 未定义 LED_BUILTIN 时的兜底
  #define LED_BUILTIN 2
#endif

static uint32_t tick = 0;

void setup() {
  Serial.begin(115200);
  delay(800);
  pinMode(LED_BUILTIN, OUTPUT);

  Serial.println();
  Serial.println("=== Catune 单板自检 ===");
  Serial.printf("芯片: %s\n", BOARD_NAME);
  Serial.printf("CPU: %u MHz\n", getCpuFrequencyMhz());
  Serial.printf("LED 引脚: GPIO %d\n", LED_BUILTIN);
  Serial.println("期望: 每 1s 打印 tick，LED 闪烁");
  Serial.println("通过标准: 能持续看到 tick 即 USB+烧录+串口 OK");
  Serial.println("========================");
}

void loop() {
  digitalWrite(LED_BUILTIN, tick % 2);
  Serial.printf("[tick %lu] %s LED=%s\n",
                (unsigned long)tick,
                BOARD_NAME,
                (tick % 2) ? "ON" : "OFF");
  tick++;
  delay(1000);
}
