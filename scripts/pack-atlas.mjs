/**
 * @file pack-atlas.mjs
 * @description 把 public/frames/<axis>/ 的帧打包成一张雪碧图 public/atlas/<axis>_atlas.png，并把 cols/rows/count/source
 *   写回 src/ui/assets/<axis>Atlas.ts。网格行优先（与 CatSprite 的 col=i%cols 一致）；单格缩到 320×480 以控纹理 ≤4096。
 *
 * 用法（在装了 ffmpeg 的机器上）：
 *   node scripts/pack-atlas.mjs            # 默认 axis=lean
 *   node scripts/pack-atlas.mjs lean 360 540 8   # 可选：axis cellW cellH cols
 * 没装 ffmpeg：脚本只打印手动命令，不改 meta（避免指向不存在的图集）。
 *
 * [HERE] scripts/pack-atlas.mjs · 雪碧图打包 + meta 回写
 */
import {existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const axis = process.argv[2] || 'lean';
const cellW = Number(process.argv[3] || 320);
const cellH = Number(process.argv[4] || 480);
const cols = Number(process.argv[5] || 8);

const framesDir = join(root, 'public', 'frames', axis);
const atlasDir = join(root, 'public', 'atlas');
const atlasPath = join(atlasDir, `${axis}_atlas.png`);
const metaFile = join(root, 'src', 'ui', 'assets', `${axis}Atlas.ts`);
const constName = `${axis.toUpperCase()}_ATLAS`;

if (!existsSync(framesDir)) {
  console.error(`✗ 帧目录不存在：${framesDir}\n  先用 ffmpeg 切帧（见 DeskScreen 顶部说明）。`);
  process.exit(1);
}

// lean 优先用 lean_stage_*；否则取目录内所有图（排除 lean_* 兼容软链）
const all = readdirSync(framesDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
const stageFiles = all.filter(f => /_stage_\d+\.(png|jpg|jpeg|webp)$/i.test(f));
const files = (stageFiles.length > 0 ? stageFiles : all.filter(f => !/^lean_\d+\.png$/i.test(f))).sort((a, b) =>
  a.localeCompare(b, undefined, {numeric: true}),
);
const count = files.length;
if (count < 2) {
  console.error(`✗ ${framesDir} 帧数不足（${count}）。`);
  process.exit(1);
}

const rows = Math.ceil(count / cols);
const atlasW = cols * cellW;
const atlasH = rows * cellH;
const TEX_LIMIT = 4096;
if (atlasW > TEX_LIMIT || atlasH > TEX_LIMIT) {
  console.warn(
    `⚠ 图集 ${atlasW}×${atlasH} 超过常见纹理上限 ${TEX_LIMIT}，部分设备会糊/失败。\n` +
      `  建议：减帧、减小单格(cellW/cellH)，或改用 react-native-skia。`,
  );
}

// 输入文件名模板（取最长公共数字模板：<prefix>%0Nd<suffix>）
const sample = files[0];
const m = sample.match(/^(.*?)(\d+)(\D*)$/);
const pattern = m ? `${m[1]}%0${m[2].length}d${m[3]}` : sample;
const startNumber = m ? String(Number(m[2])) : '1';

const ffmpegArgs = [
  '-y',
  '-start_number',
  startNumber,
  '-i',
  join(framesDir, pattern),
  '-frames:v',
  '1',
  '-vf',
  `scale=${cellW}:${cellH},tile=${cols}x${rows}`,
  atlasPath,
];
const cmdStr = `ffmpeg ${ffmpegArgs.map(a => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`;

const hasFfmpeg = spawnSync('ffmpeg', ['-version'], {stdio: 'ignore'}).status === 0;
if (!hasFfmpeg) {
  console.log(
    `ℹ 未检测到 ffmpeg。请手动运行下面命令打包，再重跑本脚本写 meta：\n\n  mkdir -p ${atlasDir}\n  ${cmdStr}\n`,
  );
  console.log(`（网格：${cols}×${rows}，单格 ${cellW}×${cellH}，共 ${count} 帧）`);
  process.exit(0);
}

mkdirSync(atlasDir, {recursive: true});
const run = spawnSync('ffmpeg', ffmpegArgs, {stdio: 'inherit'});
if (run.status !== 0 || !existsSync(atlasPath)) {
  console.error('✗ ffmpeg 打包失败，meta 未改动。');
  process.exit(1);
}

// 回写 meta：source + cols/rows/count
if (!existsSync(metaFile)) {
  console.error(`✗ meta 文件不存在：${metaFile}`);
  process.exit(1);
}
const block =
  `// AUTO-GENERATED-ATLAS-START\n` +
  `export const ${constName}: AtlasMeta = {\n` +
  `  source: require('../../../public/atlas/${axis}_atlas.png'),\n` +
  `  cols: ${cols},\n` +
  `  rows: ${rows},\n` +
  `  count: ${count},\n` +
  `};\n` +
  `// AUTO-GENERATED-ATLAS-END`;
const src = readFileSync(metaFile, 'utf8');
const replaced = src.replace(
  /\/\/ AUTO-GENERATED-ATLAS-START[\s\S]*?\/\/ AUTO-GENERATED-ATLAS-END/,
  block,
);
writeFileSync(metaFile, replaced, 'utf8');
console.log(`✓ 打包 ${count} 帧 → ${atlasPath}（${cols}×${rows}），并写回 ${metaFile}`);
