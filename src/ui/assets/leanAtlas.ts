/**
 * @file leanAtlas.ts
 * @description 左右倾（lumbar）轴的雪碧图（sprite sheet）元数据。所有帧拼成一张图集，CatSprite 据此裁剪平移。
 *
 * 打包步骤（在你的 Mac 上跑；本仓库环境无 ffmpeg）：
 *   mkdir -p public/atlas
 *   # 60 帧缩到 320×480，8×8 行优先拼成一张（行优先 = CatSprite 的 col=i%cols 排布）
 *   ffmpeg -start_number 1 -i public/frames/lean/lean_stage_%04d.png \
 *     -vf "scale=320:480,tile=8x8" -frames:v 1 public/atlas/lean_atlas.png
 * 打包后：把下方 source 改成 require('../../../public/atlas/lean_atlas.png')，并核对 cols/rows/count。
 *
 * [WHO] 导出 `AtlasMeta`、`LEAN_ATLAS`
 * [FROM] public/atlas/lean_atlas.png（构建期由 Metro 打包）
 * [TO] 被 DeskScreen 传给 CatSprite
 * [HERE] src/ui/assets/leanAtlas.ts · 左右倾雪碧图元数据
 */
import type {ImageSourcePropType} from 'react-native';

export type AtlasMeta = {
  /** 图集大图；为 null 时 DeskScreen 回退到逐帧/静态图。 */
  source: ImageSourcePropType | null;
  cols: number;
  rows: number;
  /** 有效帧数（尾部空格不算）。 */
  count: number;
};

export const LEAN_ATLAS: AtlasMeta = {
  source: null, // 打包后改为：require('../../../public/atlas/lean_atlas.png')
  cols: 8,
  rows: 8,
  count: 60,
};
