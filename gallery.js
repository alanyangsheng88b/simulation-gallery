/**
 * gallery.js — Simulation Gallery Application
 *
 * 基线 #5：每个仿真拥有独立路由 /simulations/<id>/，不再用模态框承载仿真。
 * 本文件仅负责：加载 data/simulations.json → 渲染卡片网格 → 分类过滤。
 * 卡片为 <a> 锚点，点击直接进入仿真独立详情页（由 tools/gen-sim-pages.mjs 生成）。
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

const DIFF_STARS = { beginner: "★☆☆", intermediate: "★★☆", advanced: "★★★" };

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
    const response = await fetch("data/simulations.json?v=3");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    simulations = await response.json();
    renderCards();
  } catch (err) {
    console.error("Failed to load simulations:", err);
    showError();
  }
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
  const categoryLabel = CATEGORY_META[sim.category]?.label || sim.category;
  const icon = CATEGORY_ICONS[sim.category] || "🔬";
  const stars = DIFF_STARS[sim.difficulty] || "★☆☆";
  const diffText = { beginner: "入门", intermediate: "进阶", advanced: "高阶" }[sim.difficulty] || "";

  return `
    <a
      class="sim-card"
      href="simulations/${sim.id}/"
      data-category="${sim.category}"
      aria-label="打开 ${escapeHtml(sim.title)}"
    >
      <div class="card-thumbnail" data-category="${sim.category}">
        <span class="card-thumbnail-icon">${icon}</span>
        <span class="card-badge">${categoryLabel}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(sim.title)}</h3>
        <p class="card-desc">${escapeHtml(sim.description)}</p>
        <div class="card-tags">
          ${sim.tags.map((t) => `<span class="card-tag">#${escapeHtml(t)}</span>`).join("")}
        </div>
      </div>
      <div class="card-meta">
        <span class="card-diff" title="难度">${stars} ${diffText}</span>
        <span class="card-action">▶ 打开仿真</span>
      </div>
    </a>
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
