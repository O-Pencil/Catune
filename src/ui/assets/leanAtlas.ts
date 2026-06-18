/**
 * @file leanAtlas.ts
 * @description 左右倾（lumbar）轴的雪碧图（sprite sheet）元数据。所有帧拼成一张图集，CatSprite 据此裁剪平移。
 *
 * 打包（在你的 Mac 上，一条命令搞定，自动写好下方 meta）：
 *   node scripts/pack-atlas.mjs lean
 *   （脚本会按帧数算 8×N 网格、scale 到 320×480、ffmpeg tile 拼图，并把 source/cols/rows/count 写回本文件）
 * 没装 ffmpeg 时脚本会打印手动命令；手动打包后再跑一次脚本写 meta。
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

// AUTO-GENERATED-ATLAS-START
export const LEAN_ATLAS: AtlasMeta = {
  source: null, // 打包后由 scripts/pack-atlas.mjs 改为 require('../../../public/atlas/lean_atlas.png')
  cols: 8,
  rows: 8,
  count: 60,
};
// AUTO-GENERATED-ATLAS-END
