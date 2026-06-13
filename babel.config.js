// Expo SDK 54：babel-preset-expo（支持 iOS / Android / Web(RNW)）。
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
