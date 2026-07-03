// Expo SDK 54 + NativeWind v4 + react-native-reusables（@/ 别名）
const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', {jsxImportSource: 'nativewind'}], 'nativewind/babel'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': path.resolve(__dirname, './src'),
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
    ],
  };
};