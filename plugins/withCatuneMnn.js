/**
 * @file withCatuneMnn.js
 * @description Expo config plugin：prebuild 时把端侧推理 Pod `CatuneMnn`（ios/CatuneMnn）加进 iOS Podfile。
 *   守卫：仅当 ios/CatuneMnn/MNN/lib/libMNN.a 存在时才启用 —— 这样「目标 A（UI demo，无端侧）」的
 *   prebuild/pod install 不受影响；先跑 scripts/build-mnn-ios.sh 产出 MNN 库后，本插件自动接通端侧。
 *
 * 用法：app.json 的 plugins 里加 "./plugins/withCatuneMnn.js"。
 */
const {withDangerousMod} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const POD_LINE = "  pod 'CatuneMnn', :path => './CatuneMnn'";

module.exports = function withCatuneMnn(config) {
  return withDangerousMod(config, [
    'ios',
    async cfg => {
      const projectRoot = cfg.modRequest.projectRoot;
      const lib = path.join(projectRoot, 'ios', 'CatuneMnn', 'MNN', 'lib', 'libMNN.a');
      if (!fs.existsSync(lib)) {
        console.warn(
          '[withCatuneMnn] 未找到 ios/CatuneMnn/MNN/lib/libMNN.a，跳过端侧模块（目标A=UI demo 不需要）。\n' +
            '  先跑 scripts/build-mnn-ios.sh 产出 MNN 库后再 prebuild，即可自动接通端侧推理。',
        );
        return cfg;
      }
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let content = fs.readFileSync(podfile, 'utf8');
      if (!content.includes("pod 'CatuneMnn'")) {
        // 插入到第一个 target ... do 之后
        content = content.replace(/(target\s+['"][^'"]+['"]\s+do\s*\n)/, `$1${POD_LINE}\n`);
        fs.writeFileSync(podfile, content);
        console.log('[withCatuneMnn] 已把 CatuneMnn Pod 加入 iOS Podfile（端侧推理已启用）。');
      }
      return cfg;
    },
  ]);
};
