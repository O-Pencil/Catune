#!/usr/bin/env node
/**
 * 轻量循环依赖检测：扫描 src/ 下所有 .ts/.tsx，提取相对 import，用 DFS 找环。
 * 仅做相对路径，不解析 tsconfig path alias。
 */
import {readFileSync, statSync, readdirSync} from 'node:fs';
import {join, resolve, dirname, extname, basename} from 'node:path';

const ROOT = resolve(process.cwd(), 'src');
const EXTS = ['.ts', '.tsx', '.js', '.jsx'];
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next']);

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    if (SKIP_DIRS.has(e)) continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (EXTS.includes(extname(p))) out.push(p);
  }
  return out;
}

function fileToId(f) {
  return f.replace(/\.(tsx?|jsx?)$/, '');
}

const files = walk(ROOT);
const idToFile = new Map();
for (const f of files) idToFile.set(fileToId(f), f);

const graph = new Map(); // file -> Set<file>
for (const f of files) graph.set(f, new Set());

const importRe = /(?:import\s+[^'"]*from\s+|import\s+|export\s+[^'"]*from\s+|require\(\s*)['"]([^'"]+)['"]/g;

function resolveExt(p) {
  if (EXTS.includes(extname(p))) return p;
  for (const ext of EXTS) {
    const cand = p + ext;
    try {
      statSync(cand);
      return cand;
    } catch {}
  }
  for (const ext of EXTS) {
    const cand = join(p, 'index' + ext);
    try {
      statSync(cand);
      return cand;
    } catch {}
  }
  return null;
}

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  let m;
  while ((m = importRe.exec(src))) {
    const target = m[1];
    if (!target.startsWith('.')) continue;
    const resolved = resolveExt(join(dirname(f), target));
    if (resolved && resolved !== f) graph.get(f).add(resolved);
  }
}

// DFS 找环
const visited = new Set();
const onStack = new Set();
const stack = [];
const cycles = [];

function dfs(file) {
  if (onStack.has(file)) {
    const idx = stack.indexOf(file);
    if (idx >= 0) cycles.push(stack.slice(idx).concat(file));
    return;
  }
  if (visited.has(file)) return;
  visited.add(file);
  onStack.add(file);
  stack.push(file);
  for (const imp of graph.get(file) ?? []) dfs(imp);
  onStack.delete(file);
  stack.pop();
}

for (const f of files) dfs(f);

if (cycles.length === 0) {
  console.log('OK: 0 circular dependencies in src/');
  process.exit(0);
} else {
  console.log(`FAIL: ${cycles.length} circular dependencies:`);
  for (const c of cycles) {
    console.log('  ' + c.map(p => p.replace(process.cwd() + '/', '')).join(' -> '));
  }
  process.exit(1);
}
