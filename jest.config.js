module.exports = {
  preset: 'react-native',
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?|@expo-google-fonts|expo-.*|expo-modules-core|@unimodules|unistyles|react-native-svg|react-native-web|@react-navigation|react-native-reanimated|react-native-gesture-handler)/)',
  ],
  setupFiles: ['./jest.setup.js'],
};
