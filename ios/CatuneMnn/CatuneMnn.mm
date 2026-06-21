//
//  CatuneMnn.mm
//  端侧 Qwen+MNN 推理的 iOS RN 桥（ObjC++）。
//
//  等价安卓 `MnnDebugModule.kt` + `eyes_mnn_bridge.cpp` 的合并体：换成 ObjC++，
//  复用同一份 C++ 推理核 `eyes::EyesLlmSession`（android/.../cpp/eyes_llm_session.{h,cpp}）。
//  方法名/事件名与安卓完全一致 → JS 侧（inferStreamClient / BenchmarkPanel / assess）零改动。
//
//  模型目录：Documents/mnn_models/<activeId>/（与 expo-file-system documentDirectory + 安卓 filesDir 对齐）。
//  详见 docs/iOS适配评估与计划.md。
//
#import "CatuneMnn.h"
#import "eyes_llm_session.h"

#include <string>

using eyes::CpuCapability;
using eyes::EyesLlmSession;

// 全局会话 + 活跃模型 id（等价安卓 g_session / InferenceExecutor 单例）
static EyesLlmSession gSession;
static NSString *gLoadedModelId = nil;
// 串行推理队列（等价安卓 InferenceExecutor 单线程，保证 infer 不并发）
static dispatch_queue_t gInferQueue;

static NSString *DefaultModelId() { return @"qwen2.5-0.5b"; }

static NSString *DocumentsDir() {
  return [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
}
static NSString *ModelsRoot() { return [DocumentsDir() stringByAppendingPathComponent:@"mnn_models"]; }
static NSString *ModelDir(NSString *modelId) { return [ModelsRoot() stringByAppendingPathComponent:modelId]; }
static NSString *ConfigPath(NSString *modelId) { return [ModelDir(modelId) stringByAppendingPathComponent:@"config.json"]; }

/** 读取 .active 活跃模型 id（无则默认）。 */
static NSString *ActiveModelId() {
  NSString *p = [ModelsRoot() stringByAppendingPathComponent:@".active"];
  NSString *s = [NSString stringWithContentsOfFile:p encoding:NSUTF8StringEncoding error:nil];
  s = [s stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
  return s.length ? s : DefaultModelId();
}

/** 确保活跃模型已加载（按需重载）。只在 gInferQueue 内调用。失败时 errOut 返回原因。 */
static BOOL EnsureLoaded(NSString **errOut) {
  NSString *modelId = ActiveModelId();
  NSString *cfg = ConfigPath(modelId);
  if (![[NSFileManager defaultManager] fileExistsAtPath:cfg]) {
    if (errOut) *errOut = [NSString stringWithFormat:@"模型未下载：%@", cfg];
    return NO;
  }
  if (gSession.isReady() && gLoadedModelId && [gLoadedModelId isEqualToString:modelId]) {
    return YES;
  }
  if (gSession.isReady()) {
    gSession.unload();
  }
  std::string cacheDir([NSTemporaryDirectory() UTF8String]);
  bool ok = gSession.load(std::string([cfg UTF8String]), cacheDir);
  if (!ok) {
    if (errOut) *errOut = [NSString stringWithUTF8String:gSession.lastError().c_str()];
    return NO;
  }
  gLoadedModelId = modelId;
  return YES;
}

static NSDictionary *MetricsMap() {
  auto num = [](const char *k) -> double {
    std::string v = gSession.getMetric(k);
    return v.empty() ? 0.0 : atof(v.c_str());
  };
  std::string backend = gSession.getMetric("backend");
  return @{
    @"ttftMs": @(num("ttft_ms")),
    @"prefillMs": @(num("prefill_ms")),
    @"decodeMs": @(num("decode_ms")),
    @"tokensGenerated": @((int)num("tokens_generated")),
    @"decodeTps": @(num("decode_tps")),
    @"backend": backend.empty() ? @"unknown" : [NSString stringWithUTF8String:backend.c_str()],
  };
}

static NSDictionary *CpuMap() {
  CpuCapability c = eyes::queryCpuCapability();
  return @{
    @"probeOk": @(c.probe_ok),
    @"fp16": @(c.fp16),
    @"dot": @(c.dot),
    @"i8mm": @(c.i8mm),
    @"sve2": @(c.sve2),
    @"sme2Hw": @(c.sme2_hw),
    @"libSme2": @(c.lib_sme2),
    @"backend": [NSString stringWithUTF8String:c.backend_label.c_str()],
    @"readiness": [NSString stringWithUTF8String:c.readiness.c_str()],
  };
}

@implementation CatuneMnn {
  BOOL _hasListeners;
}

RCT_EXPORT_MODULE();  // 暴露为 NativeModules.CatuneMnn（与安卓同名）

+ (BOOL)requiresMainQueueSetup { return NO; }

- (instancetype)init {
  if (self = [super init]) {
    static dispatch_once_t once;
    dispatch_once(&once, ^{
      gInferQueue = dispatch_queue_create("com.catune.mnn.infer", DISPATCH_QUEUE_SERIAL);
    });
  }
  return self;
}

// 流式事件名与安卓一致（onMnnToken / onMnnDone / onMnnError）。RCTEventEmitter 自带 addListener/removeListeners。
- (NSArray<NSString *> *)supportedEvents {
  return @[@"onMnnToken", @"onMnnDone", @"onMnnError"];
}
- (void)startObserving { _hasListeners = YES; }
- (void)stopObserving { _hasListeners = NO; }

#pragma mark - getStatus

RCT_EXPORT_METHOD(getStatus:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(gInferQueue, ^{
    @try {
      NSString *modelId = ActiveModelId();
      NSFileManager *fm = [NSFileManager defaultManager];
      std::string err = gSession.lastError();
      resolve(@{
        @"nativeLibLoaded": @YES,
        @"modelDirExists": @([fm fileExistsAtPath:ModelDir(modelId)]),
        @"configExists": @([fm fileExistsAtPath:ConfigPath(modelId)]),
        @"modelLoaded": @(gSession.isReady()),
        @"modelDir": ModelDir(modelId),
        @"activeModelId": modelId,
        @"loadError": err.empty() ? (id)[NSNull null] : (id)[NSString stringWithUTF8String:err.c_str()],
        @"cpu": CpuMap(),
      });
    } @catch (NSException *e) {
      reject(@"CATUNE_MNN_STATUS_FAILED", e.reason, nil);
    }
  });
}

#pragma mark - inferText

RCT_EXPORT_METHOD(inferText:(NSString *)prompt resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(gInferQueue, ^{
    NSString *err = nil;
    if (!EnsureLoaded(&err)) {
      reject(@"CATUNE_MNN_MODEL_NOT_READY", err ?: @"MNN model is not ready", nil);
      return;
    }
    NSDate *start = [NSDate date];
    std::string out = gSession.infer(std::string([prompt UTF8String]), "", "");
    if (out.empty()) {
      reject(@"CATUNE_MNN_INFER_FAILED", [NSString stringWithUTF8String:gSession.lastError().c_str()], nil);
      return;
    }
    double ms = -[start timeIntervalSinceNow] * 1000.0;
    resolve(@{
      @"rawOutput": [NSString stringWithUTF8String:out.c_str()],
      @"inferenceMs": @(ms),
      @"metrics": MetricsMap(),
    });
  });
}

#pragma mark - inferTextStream（轮询 partial 缓冲 → 逐段发 token）

RCT_EXPORT_METHOD(inferTextStream:(NSString *)prompt resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(gInferQueue, ^{
    NSString *err = nil;
    if (!EnsureLoaded(&err)) {
      if (self->_hasListeners) [self sendEventWithName:@"onMnnError" body:@{@"error": err ?: @"model not ready"}];
      reject(@"CATUNE_MNN_MODEL_NOT_READY", err ?: @"MNN model is not ready", nil);
      return;
    }
    __block BOOL done = NO;
    __block NSUInteger emitted = 0;
    // 轮询线程：读 session.getPartial() 增量（线程安全，C++ 内部 partial_mutex_ 保护）
    dispatch_queue_t poll = dispatch_queue_create("com.catune.mnn.poll", DISPATCH_QUEUE_SERIAL);
    dispatch_async(poll, ^{
      while (!done) {
        std::string partial = gSession.getPartial();
        NSString *p = [NSString stringWithUTF8String:partial.c_str()] ?: @"";
        if (p.length > emitted) {
          NSString *delta = [p substringFromIndex:emitted];
          emitted = p.length;
          if (self->_hasListeners) [self sendEventWithName:@"onMnnToken" body:@{@"token": delta}];
        }
        [NSThread sleepForTimeInterval:0.12];
      }
    });
    std::string out = gSession.infer(std::string([prompt UTF8String]), "", "");
    done = YES;
    if (out.empty()) {
      if (self->_hasListeners) [self sendEventWithName:@"onMnnError" body:@{@"error": [NSString stringWithUTF8String:gSession.lastError().c_str()]}];
      reject(@"CATUNE_MNN_INFER_FAILED", @"infer failed", nil);
      return;
    }
    NSString *full = [NSString stringWithUTF8String:out.c_str()] ?: @"";
    if (full.length > emitted && self->_hasListeners) {
      [self sendEventWithName:@"onMnnToken" body:@{@"token": [full substringFromIndex:emitted]}];
    }
    if (self->_hasListeners) [self sendEventWithName:@"onMnnDone" body:@{@"rawOutput": full, @"metrics": MetricsMap()}];
    resolve(@(YES));
  });
}

#pragma mark - analyzeImage（端侧 VL 体态评估）

RCT_EXPORT_METHOD(analyzeImage:(NSString *)imageBase64 prompt:(NSString *)prompt resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(gInferQueue, ^{
    NSString *err = nil;
    if (!EnsureLoaded(&err)) {
      reject(@"CATUNE_MNN_MODEL_NOT_READY", err ?: @"MNN model is not ready", nil);
      return;
    }
    NSData *data = [[NSData alloc] initWithBase64EncodedString:imageBase64
                                                       options:NSDataBase64DecodingIgnoreUnknownCharacters];
    if (!data) {
      reject(@"CATUNE_MNN_BAD_IMAGE", @"Invalid base64 image", nil);
      return;
    }
    NSString *jpg = [NSTemporaryDirectory() stringByAppendingPathComponent:@"catune_infer.jpg"];
    [data writeToFile:jpg atomically:YES];
    std::string out = gSession.infer(std::string([prompt UTF8String]), std::string([jpg UTF8String]), "");
    if (out.empty()) {
      reject(@"CATUNE_MNN_INFER_FAILED", [NSString stringWithUTF8String:gSession.lastError().c_str()], nil);
      return;
    }
    resolve(@{@"rawOutput": [NSString stringWithUTF8String:out.c_str()], @"metrics": MetricsMap()});
  });
}

#pragma mark - runBenchmark（1 warmup + 2 timed）

RCT_EXPORT_METHOD(runBenchmark:(NSString *)prompt resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(gInferQueue, ^{
    NSString *err = nil;
    if (!EnsureLoaded(&err)) {
      reject(@"CATUNE_MNN_MODEL_NOT_READY", err ?: @"MNN model is not ready", nil);
      return;
    }
    NSMutableArray *runs = [NSMutableArray array];
    double totalTps = 0;
    int success = 0;
    for (int i = 0; i < 3; i++) {
      NSDate *s = [NSDate date];
      std::string out = gSession.infer(std::string([prompt UTF8String]), "", "");
      if (out.empty()) {
        if (i == 0) {
          reject(@"CATUNE_MNN_BENCH_FAILED", [NSString stringWithUTF8String:gSession.lastError().c_str()], nil);
          return;
        }
        continue;
      }
      double ms = -[s timeIntervalSinceNow] * 1000.0;
      NSDictionary *metrics = MetricsMap();
      [runs addObject:@{
        @"run": @(i + 1),
        @"label": i == 0 ? @"warmup" : @"timed",
        @"inferenceMs": @(ms),
        @"metrics": metrics,
        @"rawOutput": [NSString stringWithUTF8String:out.c_str()],
      }];
      if (i > 0) {
        totalTps += [metrics[@"decodeTps"] doubleValue];
        success += 1;
      }
    }
    NSDictionary *cpu = CpuMap();
    resolve(@{
      @"runs": runs,
      @"summary": @{
        @"avgDecodeTps": @(success > 0 ? totalTps / success : 0),
        @"backend": cpu[@"backend"],
        @"readiness": cpu[@"readiness"],
        @"sme2Hw": cpu[@"sme2Hw"],
        @"libSme2": cpu[@"libSme2"],
      },
    });
  });
}

#pragma mark - releaseModel

RCT_EXPORT_METHOD(releaseModel:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(gInferQueue, ^{
    gSession.unload();
    gLoadedModelId = nil;
    resolve(@(YES));
  });
}

@end
