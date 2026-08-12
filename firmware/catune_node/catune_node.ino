/*
 * catune_node.ino — Catune 坐姿姿态带节点固件（ESP32-S3 + BNO085）
 *
 * 作用：I2C 读 BNO085 旋转向量（四元数）→ BLE GATT notify 广播，App(bleSensorSource) 订阅解析。
 * 协议（必须与 src/platform/bleSensorSource.ts 的 CATUNE_BLE 一致）：
 *   - Service  UUID: 6e401000-b5a3-f393-e0a9-e50e24dcca9e
 *   - Char     UUID: 6e401001-b5a3-f393-e0a9-e50e24dcca9e (NOTIFY)
 *   - 包格式 17 字节：[nodeId:uint8][qw,qx,qy,qz : 4×float32 小端]
 *   - nodeId: 0=颈C7  1=胸T12  2=腰L5（单节点先用 1=胸）
 *
 * 依赖库（Arduino 库管理器装）：
 *   - Adafruit BNO08x
 *   - ESP32 板支持包自带 BLEDevice（无需额外装）
 * 板：ESP32-S3 Dev Module。接线：BNO085 SDA/SCL 接 ESP32 默认 I2C（或下方改 Wire.begin 引脚）。
 */
#include <Wire.h>
#include <Adafruit_BNO08x.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <math.h>
#include <string.h>

#define NODE_ID 1  // 0=颈 1=胸 2=腰（多节点各烧一个不同 NODE_ID）
#define SERVICE_UUID "6e401000-b5a3-f393-e0a9-e50e24dcca9e"
#define CHAR_UUID "6e401001-b5a3-f393-e0a9-e50e24dcca9e"
// I2C 引脚：ESP32-S3 用 GPIO8(SDA)/GPIO9(SCL)；经典 ESP32 改成 21/22。
#define I2C_SDA 8
#define I2C_SCL 9

Adafruit_BNO08x bno08x;
sh2_SensorValue_t sensorValue;
BLECharacteristic *pChar = nullptr;
volatile bool connected = false;
uint32_t rotationEvents = 0;
uint32_t notifyPackets = 0;
uint32_t lastRotationMs = 0;
uint32_t lastHealthMs = 0;
float latestQ[4] = {1.0f, 0.0f, 0.0f, 0.0f};

class ServerCb : public BLEServerCallbacks {
  void onConnect(BLEServer *) override {
    connected = true;
    Serial.println("BLE_CONNECTED");
  }
  void onDisconnect(BLEServer *s) override {
    connected = false;
    Serial.println("BLE_DISCONNECTED advertising=restart");
    s->getAdvertising()->start();  // 断开后重新广播，便于重连
  }
};

static void enableReports() {
  // 旋转向量（含传感器融合的四元数）；周期 ~20ms ≈ 50Hz
  const bool ok = bno08x.enableReport(SH2_ROTATION_VECTOR, 20000);
  Serial.printf("BNO_REPORT rotation_vector=%s interval_us=20000\n", ok ? "ok" : "failed");
}

// I2C 扫描自检：开机打印总线上探测到的地址，确认 BNO085（默认 0x4A，ADR 拉高=0x4B）。
static void scanI2C() {
  Serial.println("I2C 扫描…");
  uint8_t found = 0;
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.printf("  发现设备 @ 0x%02X%s\n", addr,
                    (addr == 0x4A || addr == 0x4B) ? "  <- BNO085" : "");
      found++;
    }
  }
  if (found == 0) {
    Serial.println("  未发现任何 I2C 设备：查 SDA/SCL 是否接反、3V3/GND、线松没、PS0/PS1 模式");
  }
}

void setup() {
  Serial.begin(115200);
  delay(300);  // 等串口稳定
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(100000);  // BNO08x + ESP32-S3 首次闭环优先稳定性
  scanI2C();
  bool bnoReady = bno08x.begin_I2C(0x4A, &Wire);
  uint8_t bnoAddress = 0x4A;
  if (!bnoReady) {
    bnoReady = bno08x.begin_I2C(0x4B, &Wire);
    bnoAddress = 0x4B;
  }
  if (!bnoReady) {
    Serial.println("BNO08x 未找到，检查 I2C 接线/地址（看上面扫描结果是否有 0x4A/0x4B）");
    while (true) delay(100);
  }
  Serial.printf("BNO08X_READY address=0x%02X\n", bnoAddress);
  enableReports();

  BLEDevice::init("Catune-Node");
  BLEServer *srv = BLEDevice::createServer();
  srv->setCallbacks(new ServerCb());
  BLEService *svc = srv->createService(SERVICE_UUID);
  pChar = svc->createCharacteristic(CHAR_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  pChar->addDescriptor(new BLE2902());
  svc->start();
  BLEAdvertising *adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->setScanResponse(true);
  adv->start();
  Serial.println("Catune-Node 广播中…");
}

void loop() {
  if (bno08x.wasReset()) {
    Serial.println("BNO_RESET reports=reenable");
    enableReports();
  }
  if (bno08x.getSensorEvent(&sensorValue)) {
    if (sensorValue.sensorId == SH2_ROTATION_VECTOR) {
      // ESP32 小端 → float 内存布局即小端字节，直接 memcpy
      float q[4] = {
        sensorValue.un.rotationVector.real,  // w
        sensorValue.un.rotationVector.i,     // x
        sensorValue.un.rotationVector.j,     // y
        sensorValue.un.rotationVector.k,     // z
      };
      const float norm = sqrtf(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
      if (isfinite(norm) && norm > 0.5f && norm < 1.5f) {
        memcpy(latestQ, q, sizeof(latestQ));
        rotationEvents++;
        lastRotationMs = millis();
        if (connected && pChar) {
          uint8_t pkt[17];
          pkt[0] = (uint8_t)NODE_ID;
          memcpy(pkt + 1, q, 16);
          pChar->setValue(pkt, sizeof(pkt));
          pChar->notify();
          notifyPackets++;
        }
      }
    }
  }

  const uint32_t now = millis();
  if (now - lastHealthMs >= 1000) {
    lastHealthMs = now;
    const float norm = sqrtf(latestQ[0] * latestQ[0] + latestQ[1] * latestQ[1] +
                             latestQ[2] * latestQ[2] + latestQ[3] * latestQ[3]);
    Serial.printf(
        "BNO_Q w=%.5f x=%.5f y=%.5f z=%.5f norm=%.4f events=%lu age_ms=%lu ble=%u notify=%lu\n",
        latestQ[0], latestQ[1], latestQ[2], latestQ[3], norm,
        (unsigned long)rotationEvents,
        (unsigned long)(lastRotationMs == 0 ? now : now - lastRotationMs),
        connected ? 1 : 0, (unsigned long)notifyPackets);
  }
  delay(20);  // ~50Hz 上限，省电
}
