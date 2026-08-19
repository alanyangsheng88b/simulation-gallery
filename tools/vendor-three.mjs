#!/usr/bin/env node
// tools/vendor-three.mjs
// 把 Three.js（core + 常用 addons）下载到本地 vendor/three/，使仿真内核可离线 import。
// 大陆网络优先 npmmirror 镜像。用法：
//   node tools/vendor-three.mjs                 # 下载默认版本 0.185.1
//   node tools/vendor-three.mjs --version 0.186.0
//   node tools/vendor-three.mjs --dry-run       # 只打印将要下载的 URL，不写文件
//   node tools/vendor-three.mjs --check         # 检查本地是否已齐全
import { writeFileSync, mkdirSync, existsSync, statSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const VENDOR = join(ROOT, "vendor", "three");

const DEFAULT_VERSION = "0.185.1";
const MIRROR = (v, p) => `https://registry.npmmirror.com/three/${v}/files/${p}`;

// 目标相对路径 -> 镜像内路径（保持与 three 包目录结构一致，addons 才能互相解析）
// ⚠️ three r165+ 把 build 拆成 three.module.js + three.core.js（前者 `export * from './three.core.js'`）。
//    只下 three.module.js 会导致运行时 404 → 页面无 canvas 静默白屏。两个文件必须同时落地。
const FILES = [
  ["three.module.js", "build/three.module.js"],
  ["three.core.js", "build/three.core.js"],
  ["addons/controls/OrbitControls.js", "examples/jsm/controls/OrbitControls.js"],
  ["addons/libs/stats.module.js", "examples/jsm/libs/stats.module.js"],
  ["addons/libs/lil-gui.module.min.js", "examples/jsm/libs/lil-gui.module.min.js"],
];

function parseArgs(argv) {
  const o = { version: DEFAULT_VERSION, dryRun: false, check: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") o.dryRun = true;
    else if (a === "--check") o.check = true;
    else if (a === "--version") o.version = argv[++i] || o.version;
  }
  return o;
}

const args = parseArgs(process.argv);

// 完整性体检：扫描已落地文件里的**相对 import**（如 `from './three.core.js'`），
// 确认被引用的兄弟文件真实存在。three 未来若继续拆 build，这里会直接报出来，
// 而不是等到浏览器里静默 404 白屏。
function integrityCheck() {
  const problems = [];
  for (const [rel] of FILES) {
    const f = join(VENDOR, rel);
    if (!existsSync(f)) continue;
    const code = readFileSync(f, "utf8");
    const refs = new Set();
    // 匹配 import/export ... from './x.js' | from "../y/z.js"
    for (const m of code.matchAll(/\bfrom\s*['"](\.[^'"]+\.js)['"]/g)) refs.add(m[1]);
    for (const m of code.matchAll(/\bimport\s*\(\s*['"](\.[^'"]+\.js)['"]\s*\)/g)) refs.add(m[1]);
    for (const r of refs) {
      const target = join(dirname(f), r);
      if (!existsSync(target)) {
        problems.push(`${rel} 引用了 ${r}，但 ${target.replace(VENDOR + "/", "vendor/three/")} 不存在`);
      }
    }
  }
  return problems;
}

async function main() {
  if (args.check) {
    let ok = true;
    for (const [rel] of FILES) {
      const f = join(VENDOR, rel);
      const good = existsSync(f) && statSync(f).size > 1000;
      console.log(`${good ? "OK " : "MISSING "} ${rel}${good ? " (" + statSync(f).size + "B)" : ""}`);
      if (!good) ok = false;
    }
    const problems = integrityCheck();
    if (problems.length) {
      ok = false;
      console.log("\n内部依赖缺失（会导致浏览器 404 白屏）：");
      for (const p of problems) console.log(`  ✗ ${p}`);
    } else if (ok) {
      console.log("内部相对 import 全部可解析");
    }
    console.log(ok ? "\n本地依赖库齐全" : "\n本地依赖库不完整，请运行 node tools/vendor-three.mjs 下载");
    process.exit(ok ? 0 : 1);
  }

  console.log(`目标版本: three@${args.version}`);
  console.log(`输出目录: ${VENDOR}`);
  for (const [rel, src] of FILES) {
    const url = MIRROR(args.version, src);
    const dest = join(VENDOR, rel);
    if (args.dryRun) {
      console.log(`(dry-run) 将下载 ${url}\n          -> ${dest}`);
      continue;
    }
    process.stdout.write(`下载 ${rel} ... `);
    const res = await fetch(url);
    if (!res.ok) { console.log(`失败 ${res.status}`); process.exit(1); }
    const buf = Buffer.from(await res.arrayBuffer());
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
    console.log(`ok (${buf.length}B)`);
  }
  if (!args.dryRun) {
    const problems = integrityCheck();
    if (problems.length) {
      console.log("\n⚠️ 内部依赖缺失（会导致浏览器 404 白屏）：");
      for (const p of problems) console.log(`  ✗ ${p}`);
      console.log("请把缺失文件补进本脚本的 FILES 列表后重跑。");
      process.exit(1);
    }
    console.log("\n本地依赖库已落地，内部相对 import 全部可解析。");
    console.log("内核用 importmap 引用 ../../../vendor/three/");
    console.log(`提示：升级版本时改 DEFAULT_VERSION 后重跑本脚本，覆盖全部 ${FILES.length} 个文件。`);
  }
}

main().catch((e) => { console.error("下载失败:", e.message); process.exit(1); });
