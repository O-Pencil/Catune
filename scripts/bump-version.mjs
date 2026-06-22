#!/usr/bin/env node
/**
 * 递增 Android versionCode，并可选 bump 语义化版本号。
 * 用法：
 *   node scripts/bump-version.mjs          # 仅 +1 versionCode（发测试包）
 *   node scripts/bump-version.mjs patch      # 1.0.0 → 1.0.1，versionCode +1
 *   node scripts/bump-version.mjs minor      # 1.0.0 → 1.1.0
 *   node scripts/bump-version.mjs major      # 1.0.0 → 2.0.0
 */
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const propsPath = path.join(root, 'version.properties');
const nativePath = path.join(root, 'version.native.json');
const pkgPath = path.join(root, 'package.json');
const appJsonPath = path.join(root, 'app.json');

function parseProps(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

function stringifyProps(props) {
  return `# Android 安装包版本（发新 APK 前请递增 VERSION_CODE）
# versionName 建议与 package.json / app.json 的 version 保持一致
VERSION_NAME=${props.VERSION_NAME}
VERSION_CODE=${props.VERSION_CODE}
`;
}

function bumpSemver(version, kind) {
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) throw new Error(`Invalid semver: ${version}`);
  let [major, minor, patch] = [+m[1], +m[2], +m[3]];
  if (kind === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (kind === 'minor') {
    minor += 1;
    patch = 0;
  } else if (kind === 'patch') {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
}

const kind = process.argv[2];
const props = parseProps(fs.readFileSync(propsPath, 'utf8'));
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

const nextCode = Number(props.VERSION_CODE || 0) + 1;
let nextName = props.VERSION_NAME || pkg.version;

if (kind && ['patch', 'minor', 'major'].includes(kind)) {
  nextName = bumpSemver(nextName, kind);
} else if (kind && kind !== 'code') {
  console.error(`Unknown bump kind: ${kind}. Use patch | minor | major`);
  process.exit(1);
}

props.VERSION_CODE = String(nextCode);
props.VERSION_NAME = nextName;
pkg.version = nextName;
appJson.expo.version = nextName;
if (!appJson.expo.android) appJson.expo.android = {};
appJson.expo.android.versionCode = nextCode;

fs.writeFileSync(propsPath, stringifyProps(props));
fs.writeFileSync(nativePath, `${JSON.stringify({androidVersionCode: nextCode}, null, 2)}\n`);
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);

console.log(`Bumped → v${nextName} (versionCode ${nextCode})`);
console.log('Updated: version.properties, version.native.json, package.json, app.json');
