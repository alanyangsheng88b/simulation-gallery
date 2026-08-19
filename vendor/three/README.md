# 本地依赖库：Three.js（vendor/three）

> 电子仿真工作流的「本地依赖库」约定。所有 Three.js 仿真内核通过 **importmap** 引用本目录，**不依赖任何 CDN**（大陆网络 cdnjs 被墙、jsdelivr 慢）。

## 版本
- 当前锁定：**three r185（0.185.1）**，OrbitControls / stats / lil-gui 须**同版本**（不同版本混用会白屏）。

## 目录结构
```text
vendor/three/
├── three.module.js                  # core（ESM，约 1.2MB）
├── addons/
│   ├── controls/OrbitControls.js
│   ├── libs/stats.module.js
│   └── libs/lil-gui.module.min.js
└── README.md
```

## 获取依赖（二选一）
1. 一键脚本（推荐）：`node tools/vendor-three.mjs`（默认 0.185.1，可用 `--version` 指定）
2. 手动 curl（npmmirror 镜像，秒下）：
   ```bash
   curl -o vendor/three/three.module.js \
     https://registry.npmmirror.com/three/0.185.1/files/build/three.module.js
   curl -o vendor/three/addons/controls/OrbitControls.js \
     https://registry.npmmirror.com/three/0.185.1/files/examples/jsm/controls/OrbitControls.js
   curl -o vendor/three/addons/libs/stats.module.js \
     https://registry.npmmirror.com/three/0.185.1/files/examples/jsm/libs/stats.module.js
   curl -o vendor/three/addons/libs/lil-gui.module.min.js \
     https://registry.npmmirror.com/three/0.185.1/files/examples/jsm/libs/lil-gui.module.min.js
   ```

## 内核里如何引用（importmap，固定相对路径）
仿真内核固定位于 `sims/<license>/<category>/<id>.html`（三级深度），importmap 用：
```html
<script type="importmap">
{ "imports": {
  "three": "../../../vendor/three/three.module.js",
  "three/addons/": "../../../vendor/three/addons/"
}}
</script>
<script type="module">
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
</script>
```

## 约束（来自 threejs-电子仿真依赖与策略.md）
- OrbitControls 必须与 three **同版本**；升级时一起升级全部 4 个文件。
- addons 内部 `import 'three'` 由 importmap 解析到本地，离线可用。
- 本目录**纳入 git**（GitHub Pages 离线部署需要），勿加进 `.gitignore`。
- 升级版本：先改 `tools/vendor-three.mjs` 的 `DEFAULT_VERSION`，再跑下载脚本覆盖全部 4 个文件。
