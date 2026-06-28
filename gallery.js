/**
 * gallery.js — Simulation Gallery Application
 *
 * Handles:
 * - Loading simulation metadata from data/simulations.json
 * - Rendering card grid with category filtering
 * - iframe sandbox modal with loading/error/timeout states
 * - Responsive behavior
 * - Keyboard navigation (Escape to close modal)
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

// ============================================================
// DOM References
// ============================================================
const skeletonGrid = document.getElementById("skeleton-grid");
const cardGrid = document.getElementById("card-grid");
const emptyState = document.getElementById("empty-state");
const errorState = document.getElementById("error-state");
const retryBtn = document.getElementById("retry-btn");
const filterPills = document.querySelectorAll(".filter-pill");

// Modal refs
const modalOverlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const modalIframe = document.getElementById("modal-iframe");
const modalIframeWrapper = document.getElementById("modal-iframe-wrapper");
const modalLoading = document.getElementById("modal-loading");
const modalError = document.getElementById("modal-error");
const modalClose = document.getElementById("modal-close");
const modalFullscreen = document.getElementById("modal-fullscreen");
const modalRetry = document.getElementById("modal-retry");

// ============================================================
// State
// ============================================================
let simulations = [];
let currentCategory = "all";
let currentSim = null;
let loadTimeout = null;

// ============================================================
// Data Loading
// ============================================================
async function loadSimulations() {
  try {
    const response = await fetch("data/simulations.json");
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
  // Hide skeletons
  skeletonGrid.classList.add("hidden");

  // Filter
  const filtered =
    currentCategory === "all"
      ? simulations
      : simulations.filter((s) => s.category === currentCategory);

  // Empty state
  if (filtered.length === 0) {
    cardGrid.classList.add("hidden");
    emptyState.classList.remove("hidden");
    errorState.classList.add("hidden");
    return;
  }

  // Show grid
  emptyState.classList.add("hidden");
  errorState.classList.add("hidden");
  cardGrid.classList.remove("hidden");

  // Build cards
  cardGrid.innerHTML = filtered.map(buildCard).join("");
}

function buildCard(sim) {
  const categoryLabel = CATEGORY_META[sim.category]?.label || sim.category;
  const icon = CATEGORY_ICONS[sim.category] || "🔬";

  return `
    <article
      class="sim-card"
      data-category="${sim.category}"
      data-id="${sim.id}"
      tabindex="0"
      role="button"
      aria-label="运行 ${sim.title}"
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
      <button class="card-action" aria-label="运行 ${escapeHtml(sim.title)}">
        ▶ 运行仿真
      </button>
    </article>
  `;
}

// ============================================================
// Card Click Handling (Event Delegation)
// ============================================================
cardGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".sim-card");
  if (!card) return;

  // Don't open if clicking the action button directly (handled above)
  const simId = card.dataset.id;
  const sim = simulations.find((s) => s.id === simId);
  if (sim) openModal(sim);
});

// Keyboard: Enter/Space on card
cardGrid.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    const card = e.target.closest(".sim-card");
    if (card) {
      e.preventDefault();
      const simId = card.dataset.id;
      const sim = simulations.find((s) => s.id === simId);
      if (sim) openModal(sim);
    }
  }
});

// ============================================================
// Category Filtering
// ============================================================
filterPills.forEach((pill) => {
  pill.addEventListener("click", () => {
    // Update active state
    filterPills.forEach((p) => {
      p.classList.remove("active");
      p.setAttribute("aria-pressed", "false");
    });
    pill.classList.add("active");
    pill.setAttribute("aria-pressed", "true");

    // Update filter
    currentCategory = pill.dataset.category;
    renderCards();
  });
});

// ============================================================
// Modal: Open
// ============================================================
function openModal(sim) {
  currentSim = sim;

  // Reset modal state
  modalTitle.textContent = sim.title;
  modalIframeWrapper.classList.add("hidden");
  modalError.classList.add("hidden");
  modalLoading.classList.remove("hidden");
  modalOverlay.classList.remove("hidden", "closing");

  // Prevent body scroll
  document.body.style.overflow = "hidden";

  // Focus close button for accessibility
  setTimeout(() => modalClose.focus(), 100);

  // Cache-bust for reliable reloads
  modalIframe.src = sim.path + (sim.path.includes('?') ? '&' : '?') + '_t=' + Date.now();

  // Track load
  let loaded = false;

  modalIframe.onload = () => {
    loaded = true;
    clearTimeout(loadTimeout);
    modalLoading.classList.add("hidden");
    modalIframeWrapper.classList.remove("hidden");
  };

  modalIframe.onerror = () => {
    clearTimeout(loadTimeout);
    showModalError();
  };

  // 30s timeout (extended for slow connections in China)
  loadTimeout = setTimeout(() => {
    if (!loaded) {
      showModalError();
    }
  }, 30000);
}

// ============================================================
// Modal: Close
// ============================================================
function closeModal() {
  modalOverlay.classList.add("closing");

  // Wait for animation
  setTimeout(() => {
    modalOverlay.classList.add("hidden");
    modalOverlay.classList.remove("closing");

    // Release iframe resources
    modalIframe.src = "about:blank";

    // Reset modal state
    modalLoading.classList.remove("hidden");
    modalIframeWrapper.classList.add("hidden");
    modalError.classList.add("hidden");

    clearTimeout(loadTimeout);
  }, 200);

  // Restore body scroll
  document.body.style.overflow = "";

  currentSim = null;
}

// ============================================================
// Modal: Error
// ============================================================
function showModalError() {
  modalLoading.classList.add("hidden");
  modalIframeWrapper.classList.add("hidden");
  modalError.classList.remove("hidden");
}

// ============================================================
// Modal: Event Listeners
// ============================================================
modalClose.addEventListener("click", closeModal);

// Click backdrop
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

// Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalOverlay.classList.contains("hidden")) {
    closeModal();
  }
});

// Retry in modal
modalRetry.addEventListener("click", () => {
  if (currentSim) {
    openModal(currentSim);
  }
});

// Fullscreen toggle
modalFullscreen.addEventListener("click", () => {
  if (modalIframeWrapper.classList.contains("modal-fullscreen")) {
    // Exit fullscreen-like mode
    modalIframeWrapper.classList.remove("modal-fullscreen");
    modalFullscreen.textContent = "⛶";
  } else {
    // Enter fullscreen
    modalIframeWrapper.classList.add("modal-fullscreen");
    modalFullscreen.textContent = "⛶";
  }
});

// ============================================================
// Error State (page level)
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
