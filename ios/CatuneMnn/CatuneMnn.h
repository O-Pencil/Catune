//
//  CatuneMnn.h
//  端侧 Qwen+MNN 推理的 iOS RN 桥（骨架，复赛接入）。
//  方法名/事件名与安卓 MnnDebugModule 完全一致，JS 侧 inferStreamClient 零改动。
//
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

// RCTEventEmitter 自带 addListener/removeListeners，满足 JS NativeEventEmitter。
@interface CatuneMnn : RCTEventEmitter <RCTBridgeModule>
@end
