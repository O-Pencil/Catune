#!/usr/bin/env node
/**
 * 死导出检测：扫 src/posture src/mnn src/assess src/ui 各模块的 export，
 * 检查是否被项目内任何文件 import。排除 re-export（export {X} from './Y'）。
 * 排除 web/ 下文件（web 是另一构建）和 .test.tsx（测试自身会引用）。
 */
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, extname, relative} from 'node:path';

const ROOT = 'src';
const EXTS = new Set(['.ts', '.tsx']);
const ROOTS = ['src/posture', 'src/mnn', 'src/assess', 'src/ui'];
const TEST_FILE = /\.test\.tsx?$/;

function walk(d, out) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXTS.has(extname(p))) out.push(p);
  }
}

const files = [];
for (const r of ROOTS) walk(r, files);

// 收集所有 import 引用（全项目扫，不只 ROOTS）
const imports = new Map(); // from-path → Set<symbol>
const reExports = new Set(); // from-path（用于跳过从这些文件死导出的判定）
const fromReExport = new Set(); // 用 re-export 的 symbol 跳过

const allFiles = [];
function walkAll(d, out) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walkAll(p, out);
    else if (EXTS.has(extname(p))) out.push(p);
  }
}
walkAll('src', allFiles);
// 也扫 App.tsx
try { statSync('App.tsx'); allFiles.push('App.tsx'); } catch {}
// 也扫 __tests__
function walkTests(d, out) {
  try {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walkTests(p, out);
      else if (EXTS.has(extname(p))) out.push(p);
    }
  } catch {}
}
walkTests('__tests__', allFiles);
walkTests('src/posture/__tests__', allFiles);
walkTests('src/mnn/__tests__', allFiles);
walkTests('src/assess/__tests__', allFiles);
walkTests('src/ui/__tests__', allFiles);

for (const f of allFiles) {
  const src = readFileSync(f, 'utf8');
  imports.set(f, new Set());
  // match `import {X, Y} from './foo'` 或 `import X from './foo'` 或 `import * as X from './foo'`
  const re = /(?:import|export)(?:\s+[^'"]+?\s+from\s+|\s*)['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) {
    const target = m[1];
    if (!target.startsWith('.')) continue;
    const resolved = resolveExt(join(dirname(f), target));
    if (resolved) imports.get(f).add(resolved);
  }
  // 收集 re-export
  if (/export\s*\{[^}]*\}\s*from/.test(src)) reExports.add(f);
}

// 收集所有 export 名
const exports = []; // {file, symbol}
for (const f of files) {
  if (TEST_FILE.test(f)) continue;
  const src = readFileSync(f, 'utf8');
  // `export const|let|var|function|class|type|interface NAME`
  const namedRe = /\bexport\s+(?:const|let|var|function|class|type|interface|enum|abstract\s+class)\s+([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = namedRe.exec(src))) exports.push({file: f, symbol: m[1]});
}

// 把 index.ts 桶文件识别为 re-export：实际导出由其他文件 re-export 进来
const indexFiles = new Set();
for (const f of files) {
  if (f.endsWith('/index.ts') || f.endsWith('/index.tsx')) indexFiles.add(f);
}
// 对每个 index.ts，识别它的 re-export 列表
const indexReExports = new Map(); // index file → Set<symbol it re-exports>
for (const f of indexFiles) {
  const src = readFileSync(f, 'utf8');
  const syms = new Set();
  // `export {A, B} from './x'` 和 `export {A}` / `export {A as B}`
  const reExportListRe = /export\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = reExportListRe.exec(src))) {
    for (const part of m[1].split(',')) {
      // 可能是 `A` 或 `A as B`
      const segs = part.trim().split(/\s+as\s+/);
      syms.add(segs[0].trim());
    }
  }
  // `export type {A} from './x'`
  const typeExportRe = /export\s+type\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;
  while ((m = typeExportRe.exec(src))) {
    for (const part of m[1].split(',')) syms.add(part.trim().split(/\s+as\s+/)[0].trim());
  }
  // `export * from './x'`
  if (/export\s*\*\s*from/.test(src)) {
    // 无法解析具体符号，标记"全部 re-export"
    syms.__all = true;
  }
  // 显式 `export const|function ...` 也算
  const namedRe2 = /\bexport\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g;
  while ((m = namedRe2.exec(src))) syms.add(m[1]);
  const namedRe3 = /\bexport\s+type\s+([A-Za-z_$][\w$]*)/g;
  while ((m = namedRe3.exec(src))) syms.add(m[1]);
  indexReExports.set(f, syms);
}
// 标记 index 文件为 re-export 集合
for (const idx of indexFiles) reExports.add(idx);

// 同文件内引用也作为"使用"（本地 helper）
function addLocalRefs() {
  for (const f of files) {
    if (TEST_FILE.test(f)) continue;
    const src = readFileSync(f, 'utf8');
    const exportSyms = new Set();
    const namedRe = /\bexport\s+(?:const|let|var|function|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g;
    let m;
    while ((m = namedRe.exec(src))) exportSyms.add(m[1]);
    if (!usedSymbols.has(f)) usedSymbols.set(f, new Set());
    for (const s of exportSyms) {
      const re = new RegExp(`\\b${s}\\b`, 'g');
      if (re.test(src)) usedSymbols.get(f).add(s);
    }
  }
}

// 收集每个文件实际被 import {X} 引用的符号
const usedSymbols = new Map(); // file → Set<symbol>
for (const f of allFiles) {
  const src = readFileSync(f, 'utf8');
  // `import {A, B as C} from './x'`
  const importRe = /\bimport\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = importRe.exec(src))) {
    const target = m[2];
    if (!target.startsWith('.')) continue;
    const resolved = resolveExt(join(dirname(f), target));
    if (!resolved) continue;
    if (!usedSymbols.has(resolved)) usedSymbols.set(resolved, new Set());
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/)[0].trim();
      if (name) usedSymbols.get(resolved).add(name);
    }
  }
  // `import Foo from './x'` (default)
  const defRe = /\bimport\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]/g;
  while ((m = defRe.exec(src))) {
    const target = m[2];
    if (!target.startsWith('.')) continue;
    const resolved = resolveExt(join(dirname(f), target));
    if (!resolved) continue;
    if (!usedSymbols.has(resolved)) usedSymbols.set(resolved, new Set());
    usedSymbols.get(resolved).add(m[1]);
  }
}

addLocalRefs();

// 判定 dead
function isReExport(file, sym) {
  if (!reExports.has(file)) return false;
  const src = readFileSync(file, 'utf8');
  const re = new RegExp(`export\\s*\\{[^}]*\\b${sym}\\b[^}]*\\}\\s*from`);
  return re.test(src);
}

const dead = [];
for (const {file, symbol} of exports) {
  if (isReExport(file, symbol)) continue; // re-export 不算 dead（聚合用）
  // index.ts 桶文件：如果符号在桶里被 re-export，且通过 `from './index'` 间接被 import 引用过，算"通过桶被用"
  if (indexFiles.has(file)) {
    const used = usedSymbols.get(file);
    if (used && used.has(symbol)) continue;
    // bucket 是 re-export 集合的入口文件
    const syms = indexReExports.get(file);
    if (syms && (syms.__all || syms.has(symbol))) {
      // 通过 index.ts 桶被引用：需要文件自己也被 import 过（import './index' 或 import from .../i18n）
      let refCount = 0;
      for (const targets of imports.values()) for (const t of targets) if (t === file) refCount++;
      if (refCount > 0) continue;
    }
  }
  const used = usedSymbols.get(file);
  if (!used || !used.has(symbol)) {
    // 进一步：文件本身被谁 import 吗？如果 0 引用，整个文件可能是 dead
    let refCount = 0;
    for (const targets of imports.values()) for (const t of targets) if (t === file) refCount++;
    if (refCount === 0 && !reExports.has(file)) continue; // 文件没人 import
    dead.push({file, symbol, refCount});
  }
}

if (dead.length === 0) {
  console.log('OK: 0 dead exports in src/');
  process.exit(0);
}

// 输出
const byFile = new Map();
for (const d of dead) {
  if (!byFile.has(d.file)) byFile.set(d.file, []);
  byFile.get(d.file).push(d);
}
console.log(`WARN: ${dead.length} dead exports in ${byFile.size} files:`);
for (const [f, ds] of byFile) {
  console.log(`  ${f}`);
  for (const d of ds) console.log(`    - ${d.symbol}`);
}
process.exit(1);

function resolveExt(p) {
  if (EXTS.has(extname(p))) return p;
  for (const ext of EXTS) {
    try { statSync(p + ext); return p + ext; } catch {}
  }
  for (const ext of EXTS) {
    try { statSync(join(p, 'index' + ext)); return join(p, 'index' + ext); } catch {}
  }
  return null;
}

function dirname(p) { return p.split('/').slice(0, -1).join('/'); }