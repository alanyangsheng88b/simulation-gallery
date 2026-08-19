/**
 * gallery.js — Simulation Gallery Application
 *
 * 基线 #5：每个仿真拥有独立路由 /simulations/<id>/，不再用模态框承载仿真。
 * 本文件仅负责：加载 /data/simulations.json → 渲染卡片网格 → 分类过滤。
 * 卡片为 <a> 锚点，点击直接进入仿真独立详情页（由 tools/gen-sim-pages.mjs 生成）。
 *
 * 路径全部使用根绝对路径（/data/...、/simulations/...、/assets/...），
 * 因此本文件既可用于站点根 index.html，也可复用于 /simulations/index.html。
 */

// ============================================================
// Category Display Names & Icons
// ============================================================
const CATEGORY_META = {
  all: { label: "全部", icon: "📂" },
  antenna: { label: "天线与辐射", icon: "📡" },
  "field-kinematics": { label: "场动力学", icon: "🧲" },
  mechanics: { label: "力学", icon: "🏀" },
  circuit: { label: "电路", icon: "🔌" },
};

const CATEGORY_ICONS = {
  antenna: "📡",
  "field-kinematics": "🧲",
  mechanics: "🏀",
  circuit: "🔌",
};

const DIFF_META = {
  beginner: { cls: "easy", text: "入门" },
  intermediate: { cls: "medium", text: "进阶" },
  advanced: { cls: "advanced", text: "高阶" },
};

// 卡片缩略图：优先用 PhysicsHub 复刻的「分类预览图」（web 优化版），缺失自动回退到 emoji
const CAT_IMG = {
  antenna: "cat-antenna",
  "field-kinematics": "cat-field",
  mechanics: "cat-mechanics",
  circuit: "cat-circuit",
};

// ============================================================
// DOM References
// ============================================================
const skeletonGrid = document.getElementById("skeleton-grid");
const cardGrid = document.getElementById("card-grid");
const emptyState = document.getElementById("empty-state");
const errorState = document.getElementById("error-state");
const retryBtn = document.getElementById("retry-btn");
const filterPills = document.querySelectorAll(".filter-pill");

// ============================================================
// State
// ============================================================
let simulations = [];
let currentCategory = "all";

// ============================================================
// Data Loading
// ============================================================
async function loadSimulations() {
  try {
    const response = await fetch("/data/simulations.json?v=3");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    simulations = await response.json();
    renderCards();
    updateCount();
  } catch (err) {
    console.error("Failed to load simulations:", err);
    showError();
  }
}

// 把真实仿真数写回 Hero 统计（默认占位 19，加载后覆盖）
function updateCount() {
  const n = String(simulations.length);
  document.querySelectorAll(".js-sim-count").forEach((el) => (el.textContent = n));
}

// ============================================================
// Card Rendering
// ============================================================
function renderCards() {
  skeletonGrid.classList.add("hidden");

  const filtered =
    currentCategory === "all"
      ? simulations
      : simulations.filter((s) => s.category === currentCategory);

  if (filtered.length === 0) {
    cardGrid.classList.add("hidden");
    emptyState.classList.remove("hidden");
    errorState.classList.add("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  errorState.classList.add("hidden");
  cardGrid.classList.remove("hidden");

  cardGrid.innerHTML = filtered.map(buildCard).join("");
}

function buildCard(sim) {
  const cat = sim.category;
  const meta = CATEGORY_META[cat] || { label: cat, icon: "🔬" };
  const icon = CATEGORY_ICONS[cat] || "🔬";
  const diff = DIFF_META[sim.difficulty] || DIFF_META.beginner;
  const imgName = CAT_IMG[cat];
  const img = imgName ? `/assets/images/web/${imgName}_1.png` : "";
  const tags = (sim.tags || []).map((t) => `<span class="tag">#${escapeHtml(t)}</span>`).join("");
  const href = `/simulations/${sim.id}/`;

  return `
    <article class="sim-card" data-category="${cat}">
      <a class="sim-card__thumb" href="${href}" data-category="${cat}" aria-label="打开 ${escapeHtml(sim.title)}">
        ${img ? `<img class="sim-card__thumb-img" src="${img}" alt="" loading="lazy" onerror="this.remove()">` : ""}
        <span class="card-thumb-icon">${icon}</span>
      </a>
      <div class="sim-card__body">
        <a class="sim-card__title" href="${href}">${escapeHtml(sim.title)}</a>
        <p class="sim-card__desc">${escapeHtml(sim.description)}</p>
        <div class="sim-card__meta">
          <span class="tag tag--cat">${meta.icon} ${meta.label}</span>
          <span class="tag tag--${diff.cls}">${diff.text}</span>
          ${tags}
        </div>
        <a class="btn btn--ghost sim-card__run" href="${href}">▶ 打开仿真</a>
      </div>
    </article>
  `;
}

// ============================================================
// Category Filtering
// ============================================================
filterPills.forEach((pill) => {
  pill.addEventListener("click", () => {
    filterPills.forEach((p) => {
      p.classList.remove("active");
      p.setAttribute("aria-pressed", "false");
    });
    pill.classList.add("active");
    pill.setAttribute("aria-pressed", "true");

    currentCategory = pill.dataset.category;
    renderCards();
  });
});

// ============================================================
// Error State
// ============================================================
function showError() {
  skeletonGrid.classList.add("hidden");
  cardGrid.classList.add("hidden");
  emptyState.classList.add("hidden");
  errorState.classList.remove("hidden");
}

retryBtn.addEventListener("click", () => {
  errorState.classList.add("hidden");
  skeletonGrid.classList.remove("hidden");
  loadSimulations();
});

// ============================================================
// Utility
// ============================================================
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// Init
// ============================================================
loadSimulations();
