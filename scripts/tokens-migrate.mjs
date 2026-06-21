#!/usr/bin/env node
/**
 * 一次性迁移：把 src/ui 下 .tsx/.ts 里的 StyleSheet 数字字面量替换为 token 引用。
 * 映射（最常见间距/圆角/字号）：
 *   2 → spacing.xxs, 4 → spacing.xs, 6 → spacing.sm, 8 → spacing.sm2,
 *   10 → spacing.md, 12 → spacing.md2, 16 → spacing.lg, 20 → spacing.xl,
 *   24 → spacing.xxl, 32 → spacing.xxxl
 *   fontSize: 12→font.sizeXs, 14→font.sizeSm, 15→font.sizeMd, 18→font.sizeLg, 22→font.sizeXl, 56→font.sizeScore
 *   borderRadius: 8→radius.sm, 12→radius.md, 16→radius.lg
 *
 * 安全：只替换 token field 旁边、紧跟冒号或逗号后的裸数字字面量；保留 0/1。
 */
import {readFileSync, writeFileSync, readdirSync, statSync} from 'node:fs';
import {join, extname} from 'node:path';

const ROOT = 'src/ui';
const EXTS = new Set(['.ts', '.tsx']);
const SPACING = {2: 'xxs', 4: 'xs', 6: 'sm', 8: 'sm2', 10: 'md', 12: 'md2', 16: 'lg', 20: 'xl', 24: 'xxl', 32: 'xxxl'};
const FONT = {12: 'sizeXs', 14: 'sizeSm', 15: 'sizeMd', 18: 'sizeLg', 22: 'sizeXl', 56: 'sizeScore'};
const RADIUS = {8: 'sm', 12: 'md', 16: 'lg'};
const SPACING_FIELDS = new Set(['padding','paddingHorizontal','paddingVertical','paddingTop','paddingBottom','paddingLeft','paddingRight','margin','marginHorizontal','marginVertical','marginTop','marginBottom','marginLeft','marginRight','gap','rowGap','columnGap','top','right','bottom','left']);

const files = [];
function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (EXTS.has(extname(p))) files.push(p);
  }
}
walk(ROOT);

let changed = 0;
for (const f of files) {
  if (f.endsWith('theme/theme.ts') || f.endsWith('theme/colors.ts')) continue;
  let src = readFileSync(f, 'utf8');
  let localChanged = 0;

  // spacing field → spacing token
  for (const [num, name] of Object.entries(SPACING)) {
    const re = new RegExp(`\\b(padding|paddingHorizontal|paddingVertical|paddingTop|paddingBottom|paddingLeft|paddingRight|margin|marginHorizontal|marginVertical|marginTop|marginBottom|marginLeft|marginRight|gap|rowGap|columnGap|top|right|bottom|left)\\s*:\\s*${num}\\b`, 'g');
    src = src.replace(re, (_, field) => {
      localChanged++;
      return `${field}: theme.spacing.${name}`;
    });
  }
  // fontSize
  for (const [num, name] of Object.entries(FONT)) {
    const re = new RegExp(`\\bfontSize\\s*:\\s*${num}\\b`, 'g');
    src = src.replace(re, () => {
      localChanged++;
      return `fontSize: theme.font.${name}`;
    });
  }
  // borderRadius
  for (const [num, name] of Object.entries(RADIUS)) {
    const re = new RegExp(`\\bborderRadius\\s*:\\s*${num}\\b`, 'g');
    src = src.replace(re, () => {
      localChanged++;
      return `borderRadius: theme.radius.${name}`;
    });
  }

  if (localChanged > 0) {
    writeFileSync(f, src);
    changed += localChanged;
    console.log(`${f}: +${localChanged}`);
  }
}
console.log(`\ntotal: ${changed} replacements in ${files.length} files`);