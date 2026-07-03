module.exports = {
  preset: 'react-native',
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?|@expo-google-fonts|expo-.*|expo-modules-core|@unimodules|unistyles|react-native-svg|react-native-web|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-worklets|react-native-css-interop|react-native-screens|@rn-primitives|lucide-react-native|class-variance-authority|clsx|tailwind-merge|nativewind)/)',
  ],
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/jest.css-stub.js',
  },
};