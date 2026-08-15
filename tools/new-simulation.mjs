#!/usr/bin/env node
// tools/new-simulation.mjs
// 新增仿真脚手架：建内核占位 + 写 metadata + 生成详情页 + 校验。
// 用法见 .ai/skills/new-simulation.md
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const dataPath = join(ROOT, "data", "simulations.json");

const CATS = ["antenna", "field-kinematics", "mechanics", "circuit"];
const DIFFS = ["beginner", "intermediate", "advanced"];
const LICENSES = ["own", "mit", "apache", "gpl", "cc-by", "cc-by-sa", "unknown"];

function parseArgs(argv) {
  const o = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const k = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) o[k] = true;
    else { o[k] = next; i++; }
  }
  return o;
}

function fail(msg) { console.error("❌ " + msg); process.exit(1); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// ---- 读取输入 ----
let input;
if (process.argv.includes("--config")) {
  const cfgPath = process.argv[process.argv.indexOf("--config") + 1];
  if (!cfgPath) fail("--config 需要一个文件路径");
  try { input = JSON.parse(readFileSync(join(ROOT, cfgPath), "utf8")); }
  catch (e) { fail("读取/解析 config 失败: " + e.message); }
} else {
  const a = parseArgs(process.argv);
  if (!a.id && !a.title) {
    console.log(`用法:
  node tools/new-simulation.mjs --id <id> --title <标题> --category <分类> \
--difficulty <beginner|intermediate|advanced> --license <own|mit|apache|gpl|...> \
[--description <简介>] [--titleEn <英文>] [--tags a,b,c] [--application <应用>] \
[--theory <原理>] [--path <自定义内核路径>]
  或: node tools/new-simulation.mjs --config ./my-sim.json

示例:
  node tools/new-simulation.mjs --id half-wave-dipole --title "半波偶极子" \
--category antenna --difficulty beginner --license own \
--description "观察半波偶极子的电流、电压和辐射场"`);
    process.exit(0);
  }
  input = a;
}

// ---- 校验必填与枚举 ----
const { id, title, category, difficulty, license } = input;
if (!id) fail("缺少 --id");
if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) fail(`id "${id}" 不符合 slug 规则 ^[a-z0-9][a-z0-9-]*$`);
if (!title) fail("缺少 --title");
if (!category) fail("缺少 --category");
if (!CATS.includes(category)) fail(`category 非法: ${category}（可选 ${CATS.join("/")}）`);
if (!difficulty) fail("缺少 --difficulty");
if (!DIFFS.includes(difficulty)) fail(`difficulty 非法: ${difficulty}（可选 ${DIFFS.join("/")}）`);
if (!license) fail("缺少 --license");
if (!LICENSES.includes(license)) fail(`license 非法: ${license}（可选 ${LICENSES.join("/")}）`);

// ---- 读取现有数据 ----
let data = [];
try { data = JSON.parse(readFileSync(dataPath, "utf8")); }
catch (e) { fail("读取 simulations.json 失败: " + e.message); }
if (!Array.isArray(data)) fail("simulations.json 顶层必须是数组");
if (data.some((s) => s.id === id)) fail(`id 已存在: ${id}`);

// ---- 计算 path ----
const path = input.path || `sims/${license}/${category}/${id}.html`;

// ---- 生成内核占位文件（若不存在）----
const kernelAbs = join(ROOT, path);
if (!existsSync(kernelAbs)) {
  mkdirSync(dirname(kernelAbs), { recursive: true });
  writeFileSync(kernelAbs, stubHtml(title, id), "utf8");
  console.log("📄 已生成内核占位:", path);
} else {
  console.log("ℹ️ 内核已存在，跳过占位生成:", path);
}

// ---- 构造记录 ----
const tags = typeof input.tags === "string"
  ? input.tags.split(",").map((t) => t.trim()).filter(Boolean)
  : Array.isArray(input.tags) ? input.tags : [];
const sameCat = data.filter((s) => s.category === category).map((s) => s.id).filter((x) => x !== id);

const record = {
  id,
  category,
  title,
  titleEn: input.titleEn || "",
  description: input.description || title,
  tags,
  path,
  version: input.version || "1.0",
  difficulty,
  source: input.source || "原创",
  license,
  theory: input.theory || "",
  formulas: input.formulas || [],
  experiment: input.experiment || { summary: "", steps: [] },
  application: input.application || "",
  videos: input.videos || [],
  relatedSimulations: input.relatedSimulations || sameCat,
  updatedAt: new Date().toISOString().slice(0, 10),
};

data.push(record);
writeFileSync(dataPath, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("✅ 已写入 metadata:", id);

// ---- 重新生成详情页 ----
console.log("⏳ 生成详情页...");
execSync("node tools/gen-sim-pages.mjs", { cwd: ROOT, stdio: "inherit" });

// ---- 校验 ----
console.log("⏳ 校验...");
try {
  execSync("node tools/validate.mjs", { cwd: ROOT, stdio: "inherit" });
} catch (e) {
  fail("校验失败，请检查上方错误信息后修正");
}

console.log(`
🎉 仿真「${title}」已就绪：
   - 内核:   ${path}（占位骨架，请替换为真实仿真）
   - 详情页: simulations/${id}/index.html
   - 元数据: data/simulations.json
下一步：
   1. 编辑 ${path} 实现真实仿真内核
   2. 补全 theory / formulas / experiment（小白用户核心内容）
   3. git add -A && git commit -m "feat: 新增仿真 ${id}"
   4. 开 PR 等待 review`);

function stubHtml(title, id) {
  const t = escapeHtml(title);
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${t}</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; font-family: system-ui, -apple-system, "PingFang SC", sans-serif;
         background:#0e1116; color:#c9d1d9; display:flex; align-items:center; justify-content:center; min-height:100vh; }
  .box { max-width:560px; padding:28px 32px; border:1px solid #30363d; border-radius:14px; text-align:center; }
  h1 { font-size:1.4rem; margin:0 0 8px; }
  .todo { color:#8b949e; font-size:.92rem; line-height:1.6; margin-top:14px; }
  code { background:#161b22; padding:2px 6px; border-radius:4px; color:#79c0ff; }
</style>
</head>
<body>
  <div class="box">
    <h1>${t}</h1>
    <p class="todo">仿真内核占位骨架（id: <code>${escapeHtml(id)}</code>）。<br>
    在此文件中实现交互式仿真（Canvas / WebGL / Three.js 等）。<br>
    由 <code>tools/new-simulation.mjs</code> 生成。详情页通过 iframe 加载本文件。</p>
  </div>
</body>
</html>
`;
}
