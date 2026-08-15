// tools/gen-sim-pages.mjs
// 读取 data/simulations.json + tools/sim-page.template.html，
// 为每个仿真生成静态独立路由页 simulations/<id>/index.html。
// 运行：node tools/gen-sim-pages.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const data = JSON.parse(readFileSync(join(ROOT, "data", "simulations.json"), "utf8"));
const template = readFileSync(join(__dirname, "sim-page.template.html"), "utf8");

const CAT = {
  antenna: { label: "天线与辐射", icon: "📡" },
  "field-kinematics": { label: "场动力学", icon: "🧲" },
  mechanics: { label: "力学", icon: "🏀" },
  circuit: { label: "电路", icon: "🔌" },
};
const DIFF_LABEL = { beginner: "入门", intermediate: "进阶", advanced: "高阶" };

const titleById = Object.fromEntries(data.map((s) => [s.id, s.title]));

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function section(title, html) {
  if (!html) return "";
  return `<section class="info-section"><h2 class="info-h">${title}</h2>${html}</section>`;
}

function buildPane(s) {
  let pane = "";
  pane += section("概述", `<p class="info-desc">${esc(s.description)}</p>`);
  if (s.theory) pane += section("原理", `<div class="prose">${esc(s.theory)}</div>`);
  if (s.formulas && s.formulas.length) {
    const items = s.formulas
      .map(
        (f) =>
          `<li><code class="formula">${esc(f.expression)}</code>${
            f.label ? `<span class="formula-label">${esc(f.label)}</span>` : ""
          }${f.description ? `<p class="formula-desc">${esc(f.description)}</p>` : ""}</li>`
      )
      .join("");
    pane += section("关键公式", `<ul class="formula-list">${items}</ul>`);
  }
  if (s.experiment && s.experiment.steps && s.experiment.steps.length) {
    const steps = s.experiment.steps
      .map(
        (st, i) =>
          `<li class="exp-step"><span class="exp-num">${i + 1}</span><div><strong>${esc(
            st.title
          )}</strong><p>${esc(st.instruction)}</p>${
            st.expected ? `<p class="exp-expect">预期：${esc(st.expected)}</p>` : ""
          }</div></li>`
      )
      .join("");
    pane += section(
      "引导实验",
      `<p class="info-desc">${esc(s.experiment.summary || "")}</p><ol class="exp-list">${steps}</ol>`
    );
  }
  if (s.application) pane += section("应用场景", `<p class="prose">${esc(s.application)}</p>`);
  if (s.videos && s.videos.length) {
    const items = s.videos
      .map(
        (v) =>
          `<li><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.title)}</a>${
            v.platform ? ` <span class="video-plat">${esc(v.platform)}</span>` : ""
          }</li>`
      )
      .join("");
    pane += section("相关视频", `<ul class="video-list">${items}</ul>`);
  }
  if (s.relatedSimulations && s.relatedSimulations.length) {
    const cards = s.relatedSimulations
      .map((rid) => `<a class="rel-card" href="../${rid}/">${esc(titleById[rid] || rid)}</a>`)
      .join("");
    pane += section("相关仿真", `<div class="rel-grid">${cards}</div>`);
  }
  return pane;
}

let count = 0;
for (const s of data) {
  const cat = CAT[s.category] || { label: s.category, icon: "🔬" };
  const stars =
    "★".repeat(s.difficulty === "advanced" ? 3 : s.difficulty === "intermediate" ? 2 : 1) +
    "☆".repeat(s.difficulty === "advanced" ? 0 : s.difficulty === "intermediate" ? 1 : 2);
  const tags = (s.tags || []).map((t) => `<span class="card-tag">#${esc(t)}</span>`).join("");

  const map = {
    __TITLE__: esc(s.title),
    __TITLE_EN__: esc(s.titleEn || ""),
    __DESCRIPTION__: esc(s.description),
    __CATEGORY__: s.category,
    __CATEGORY_LABEL__: cat.label,
    __CATEGORY_ICON__: cat.icon,
    __DIFFICULTY__: `${stars} ${DIFF_LABEL[s.difficulty] || ""}`,
    __TAGS__: tags,
    __SIM_HREF__: `../../${s.path}`,
    __RIGHT_PANE__: buildPane(s),
  };

  let html = template;
  for (const [k, v] of Object.entries(map)) html = html.split(k).join(v);

  const outDir = join(ROOT, "simulations", s.id);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html, "utf8");
  count++;
}

console.log(`✅ 已生成 ${count} 个仿真详情页 -> simulations/`);
