#!/usr/bin/env node
/**
 * Theme token usage: 扫描 src/ui 下 .tsx/.ts 中 StyleSheet.create 或样式对象，
 * 统计 token field（padding/margin/gap/borderRadius/fontSize 等）的"硬编码 vs 引用 token"占比。
 * 判定规则：
 *   - tokenized: 字段值为 theme.X / theme.spacing.X / spacing.X / radius.X / font.sizeX 等命名空间引用
 *   - hardcoded: 字段值为裸数字字面量（>1）
 */
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, extname} from 'node:path';

const ROOT = 'src/ui';
const EXTS = new Set(['.ts', '.tsx']);
const TOKEN_FIELDS = new Set([
  'padding', 'paddingHorizontal', 'paddingVertical', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'margin', 'marginHorizontal', 'marginVertical', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'gap', 'rowGap', 'columnGap',
  'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
  'fontSize', 'top', 'right', 'bottom', 'left',
]);

const files = [];
function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (EXTS.has(extname(p))) files.push(p);
  }
}
walk(ROOT);

let tokenized = 0;
let hardcoded = 0;
const offenders = [];

for (const f of files) {
  if (f.endsWith('theme/theme.ts') || f.endsWith('theme/colors.ts')) continue;
  const src = readFileSync(f, 'utf8');
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    // 匹配 `<field>:<value>`，要求 field 在 token 列表里
    const re = /\b([a-zA-Z]+)\s*:\s*([^,}]+)/g;
    let m;
    while ((m = re.exec(ln))) {
      const field = m[1];
      if (!TOKEN_FIELDS.has(field)) continue;
      const val = m[2].trim();
      // 排除运算、模板字符串、函数
      if (val.includes('+') || val.includes('-') || val.includes('*') || val.includes('`') || val.includes('(')) continue;
      // tokenized: 以 theme/spacing/radius/font/colors 开头
      if (/^(theme\.|spacing\.|radius\.|font\.|colors\.)/.test(val)) {
        tokenized++;
        continue;
      }
      // 裸数字
      if (/^\d+$/.test(val)) {
        const n = parseInt(val, 10);
        if (n <= 1) continue; // 0/1 是合法的
        hardcoded++;
        offenders.push({file: f, line: i + 1, field, value: val, text: ln.trim()});
      }
    }
  }
}

const total = tokenized + hardcoded;
console.log(`tokenized:           ${tokenized}`);
console.log(`hardcoded (>1):      ${hardcoded}`);
console.log(`total token usages:  ${total}`);
console.log(`tokenization ratio:  ${total ? ((tokenized / total) * 100).toFixed(1) : '100.0'}%`);

if (process.env.VERBOSE === '1' && offenders.length) {
  console.log(`\nTop 20 hardcoded offenders:`);
  for (const o of offenders.slice(0, 20)) console.log(`  ${o.file}:${o.line}  ${o.field}: ${o.value}  // ${o.text.slice(0, 90)}`);
}

const ratio = total ? (tokenized / total) : 1;
if (ratio >= 0.4) {
  console.log('\nOK: theme token usage ratio >= 40%');
  process.exit(0);
} else {
  console.log(`\nWARN: token usage ratio ${(ratio * 100).toFixed(1)}% < 40%`);
  process.exit(1);
}