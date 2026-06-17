/**
 * @file leanFrames.ts
 * @description 左右倾（lumbar）轴的猫旋转帧清单。由 scripts/gen-frame-manifest.mjs 从 public/frames/lean/ 自动生成。
 *   空数组时 DeskScreen 自动回退到 portal.png 静态图，不破坏构建。
 *
 * 生成步骤见 DeskScreen 顶部说明：先 ffmpeg 切帧，再 `node scripts/gen-frame-manifest.mjs`。
 *
 * [WHO] 导出 `LEAN_FRAMES`（有序 require 帧数组）
 * [FROM] public/frames/lean/*.png（构建期由 Metro 静态打包）
 * [TO] 被 DeskScreen 传给 CatFlipbook
 * [HERE] src/ui/assets/leanFrames.ts · 左右倾帧清单（自动生成）
 */
import type {ImageSourcePropType} from 'react-native';

// AUTO-GENERATED-FRAMES-START
export const LEAN_FRAMES: ImageSourcePropType[] = [];
// AUTO-GENERATED-FRAMES-END
