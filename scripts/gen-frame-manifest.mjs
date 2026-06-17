/**
 * @file gen-frame-manifest.mjs
 * @description 扫描 public/frames/<axis>/ 下的帧图，生成 src/ui/assets/<axis>Frames.ts 的 require 清单。
 *   Metro 要求 require 路径是静态字面量，所以帧清单必须落成代码而非运行时读目录。
 *
 * 用法：
 *   node scripts/gen-frame-manifest.mjs           # 默认 axis=lean
 *   node scripts/gen-frame-manifest.mjs neck      # 生成脖子轴清单（public/frames/neck → neckFrames.ts）
 *
 * [HERE] scripts/gen-frame-manifest.mjs · 帧清单生成器
 */
import {readdirSync, readFileSync, writeFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const axis = process.argv[2] || 'lean';
const framesDir = join(root, 'public', 'frames', axis);
const outFile = join(root, 'src', 'ui', 'assets', `${axis}Frames.ts`);
const constName = `${axis.toUpperCase()}_FRAMES`;

if (!existsSync(framesDir)) {
  console.error(`✗ 帧目录不存在：${framesDir}\n  先用 ffmpeg 切帧到该目录再运行本脚本。`);
  process.exit(1);
}

const files = readdirSync(framesDir)
  .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

if (files.length === 0) {
  console.error(`✗ ${framesDir} 下没有图片帧。`);
  process.exit(1);
}

const requires = files.map(f => `  require('../../../public/frames/${axis}/${f}'),`).join('\n');
const block = `// AUTO-GENERATED-FRAMES-START\nexport const ${constName}: ImageSourcePropType[] = [\n${requires}\n];\n// AUTO-GENERATED-FRAMES-END`;

if (!existsSync(outFile)) {
  console.error(`✗ 目标文件不存在：${outFile}（请先创建 ${axis}Frames.ts 的骨架）`);
  process.exit(1);
}

const src = readFileSync(outFile, 'utf8');
const replaced = src.replace(
  /\/\/ AUTO-GENERATED-FRAMES-START[\s\S]*?\/\/ AUTO-GENERATED-FRAMES-END/,
  block,
);
writeFileSync(outFile, replaced, 'utf8');
console.log(`✓ 写入 ${files.length} 帧到 ${outFile}（${constName}）`);
