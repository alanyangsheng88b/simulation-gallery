// assets/detail.js — 详情页渐进增强（引导实验进度）
// 纯前端增强，无外部依赖；禁用 JS 时实验步骤仍可读。
document.querySelectorAll(".exp-list").forEach((list) => {
  const section = list.closest(".info-section");
  const header = section && section.querySelector(".info-h");
  const steps = Array.from(list.querySelectorAll(".exp-step"));
  if (!steps.length) return;

  const progress = document.createElement("span");
  progress.className = "exp-progress";

  function update() {
    const done = steps.filter((s) => s.classList.contains("done")).length;
    progress.textContent = `${done}/${steps.length} 已完成`;
  }

  steps.forEach((step) => {
    step.setAttribute("role", "button");
    step.setAttribute("tabindex", "0");
    step.addEventListener("click", () => {
      step.classList.toggle("done");
      update();
    });
    step.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        step.classList.toggle("done");
        update();
      }
    });
  });

  update();
  if (header) header.appendChild(progress);
});
