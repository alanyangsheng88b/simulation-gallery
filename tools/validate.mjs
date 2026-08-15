// tools/validate.mjs
// 基线 #11「三层校验」第一层：元数据 Schema / 完整性校验。
// 第二层（iframe 可加载）与第三层（Playwright 交互）见文件底部 TODO，中期接入。
// 运行：node tools/validate.mjs
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const CATS = ["antenna", "field-kinematics", "mechanics", "circuit"];
const DIFFS = ["beginner", "intermediate", "advanced"];
const LICENSES = ["own", "mit", "apache", "gpl", "cc-by", "cc-by-sa", "unknown"];

const errors = [];
const data = JSON.parse(readFileSync(join(ROOT, "data", "simulations.json"), "utf8"));
if (!Array.isArray(data)) errors.push("simulations.json 顶层必须是数组");

const ids = new Set();
for (const [i, s] of data.entries()) {
  const at = `条目[${i}]${s && s.id ? `(${s.id})` : ""}`;
  if (!s || typeof s !== "object") { errors.push(`${at} 不是对象`); continue; }
  for (const f of ["id", "category", "title", "description", "path", "version"]) {
    if (s[f] === undefined || s[f] === "") errors.push(`${at} 缺少必填字段 "${f}"`);
  }
  if (s.id !== undefined) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(s.id)) errors.push(`${at} id "${s.id}" 不符合 slug 规则`);
    if (ids.has(s.id)) errors.push(`${at} id 重复: ${s.id}`);
    ids.add(s.id);
  }
  if (s.category !== undefined && !CATS.includes(s.category)) errors.push(`${at} category 非法: ${s.category}`);
  if (s.difficulty !== undefined && !DIFFS.includes(s.difficulty)) errors.push(`${at} difficulty 非法: ${s.difficulty}`);
  if (s.license !== undefined && !LICENSES.includes(s.license)) errors.push(`${at} license 非法: ${s.license}`);
  if (s.path !== undefined) {
    const p = join(ROOT, s.path);
    if (!existsSync(p)) errors.push(`${at} path 指向的文件不存在: ${s.path}`);
  }
  if (Array.isArray(s.relatedSimulations)) {
    for (const r of s.relatedSimulations) {
      // 关联 id 校验推迟到 ids 收集完成后统一检查（见下方）
      s.__related = s.relatedSimulations;
    }
  }
}
// 关联 id 存在性（需在全部 id 收集后）
for (const [i, s] of data.entries()) {
  if (!Array.isArray(s.relatedSimulations)) continue;
  const at = `条目[${i}](${s.id})`;
  for (const r of s.relatedSimulations) {
    if (!ids.has(r)) errors.push(`${at} relatedSimulations 引用了不存在的 id: ${r}`);
  }
  if (s.relatedSimulations.includes(s.id)) errors.push(`${at} relatedSimulations 不能包含自身`);
}

if (errors.length) {
  console.error("❌ 校验失败，发现 " + errors.length + " 个问题：");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`✅ 校验通过：${data.length} 条仿真，字段/枚举/path/关联 均合法`);

/* ============================================================
   TODO（中期接入，本期未实现）：
   - 第二层 iframe 可加载：用无头浏览器请求每个 sim.path，断言 HTTP 200 且含 <html>。
   - 第三层 Playwright 交互：选取 1~2 个核心仿真做冒烟点击，断言 canvas/控件就绪。
   ============================================================ */
