// Jest setup: mock native modules so App.test can render without RN runtime.

// expo-modules-core: stub EventEmitter so native imports 不抛错
jest.mock('expo-modules-core', () => {
  class EventEmitter {
    addListener() { return {remove: () => {}}; }
    removeAllListeners() {}
  }
  return {
    __esModule: true,
    EventEmitter,
    NativeModulesProxy: {},
    requireNativeModule: () => ({}),
    CodedError: class extends Error {},
    EventSubscription: class {},
    Platform: {OS: 'ios', select: (m) => m.ios ?? m.default},
  };
});

// @expo-google-fonts: 字体不需要真加载
jest.mock('@expo-google-fonts/fredoka', () => ({
  __esModule: true,
  useFonts: () => [true],
  Fredoka_400Regular: 'mock', Fredoka_500Medium: 'mock', Fredoka_600SemiBold: 'mock', Fredoka_700Bold: 'mock',
}));
jest.mock('@expo-google-fonts/geist', () => ({
  __esModule: true,
  useFonts: () => [true],
  Geist_400Regular: 'mock', Geist_500Medium: 'mock', Geist_700Bold: 'mock',
}));

// expo-sensors / expo-device / expo-image-picker / expo-file-system: 全 stub
jest.mock('expo-sensors', () => ({
  DeviceMotion: {addListener: () => ({remove: () => {}}), setUpdateInterval: () => {}, isAvailableAsync: async () => false},
  DeviceMotionEvent: class {},
}));
jest.mock('expo-device', () => ({
  __esModule: true,
  default: {modelName: 'Mock', osName: 'Mock', osVersion: '1', totalMemory: 4 * 1024 * 1024 * 1024, platformApiLevel: 34},
  modelName: 'Mock', osName: 'Mock', osVersion: '1', totalMemory: 4 * 1024 * 1024 * 1024, platformApiLevel: 34,
}));
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: async () => ({canceled: true, assets: []}),
  launchImageLibraryAsync: async () => ({canceled: true, assets: []}),
  requestMediaLibraryPermissionsAsync: async () => ({granted: false}),
}));
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: null, cacheDirectory: null, bundleDirectory: null,
  getInfoAsync: async () => ({exists: false, isDirectory: false, size: 0}),
  readAsStringAsync: async () => '',
  writeAsStringAsync: async () => {},
  makeDirectoryAsync: async () => {},
  deleteAsync: async () => {},
  readDirectoryAsync: async () => [],
}));
