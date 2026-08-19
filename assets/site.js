// alanalan.cn — 共享站点交互：主题切换 / 导航下划线 / 移动端菜单
// 初始主题由各页面 <head> 内联脚本设置（html[data-theme]），避免闪烁。
(function () {
  "use strict";
  var KEY = "alanalan-theme";

  /* 主题切换（深色为默认，与品牌暗色 EDA 主题一致） */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    var cur = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = cur;
    try { localStorage.setItem(KEY, cur); } catch (err) {}
  });

  /* 移动端菜单 */
  var header = document.querySelector("header.site-header");
  if (header) {
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-menu-toggle]")) {
        header.classList.toggle("open");
      } else if (e.target.closest("nav a") && header.classList.contains("open")) {
        header.classList.remove("open");
      }
    });
  }

  /* 导航滑动下划线 */
  var nav = document.querySelector("header.site-header nav");
  function norm(p) {
    return (p || "").replace(/^\/+/, "").replace(/index\.html$/, "").replace(/\/+$/, "");
  }
  function setActive() {
    if (!nav) return;
    var path = norm(location.pathname);
    var links = nav.querySelectorAll("a.nav-link");
    var active = null;
    links.forEach(function (a) {
      var h = norm(a.getAttribute("href"));
      var isActive = h === path || (path === "" && (h === "" || h === "index.html"));
      a.classList.toggle("active", isActive);
      if (isActive) active = a;
    });
    var ul = nav.querySelector("ul");
    var underline = nav.querySelector(".nav-underline");
    if (!underline && ul) {
      underline = document.createElement("span");
      underline.className = "nav-underline";
      ul.appendChild(underline);
    }
    if (active && underline && ul) {
      var r = active.getBoundingClientRect();
      var pr = ul.getBoundingClientRect();
      underline.style.left = r.left - pr.left + "px";
      underline.style.width = r.width + "px";
    } else if (underline) {
      underline.style.width = "0px";
    }
  }
  setActive();
  window.addEventListener("resize", setActive);
})();
