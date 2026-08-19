---
name: new-simulation
description: 往 simulation-gallery 仓库新增一个仿真（建内核占位 + 写 metadata + 生成详情页 + 校验）。当用户要求在仿真画廊加 / 新增 / 创建一个仿真时使用。
---

# 新增仿真标准操作（new-simulation）

适用仓库：`/Users/apple/AI/_code/projects/simulation-gallery`（在 `feature/*` 分支工作）。
目标：让「增加半波偶极子仿真并关联视频」这类需求可标准化、可 AI 自动完成。

## 前置
- 在 `feature/*` 分支工作，**不碰 main**，合并前不影响 `alanalan.cn`。
- Node 22（可用 `/Users/apple/.workbuddy/binaries/node/versions/22.22.2/bin/node`）。
- 架构与字段契约见 `.ai/knowledge/architecture.md` 与 `.ai/knowledge/simulation-schema.md`。

## 步骤
1. **确认 id**：slug 规则 `^[a-z0-9][a-z0-9-]*$`，全局唯一、不可变。例：`half-wave-dipole`。
2. **确定分类与许可证**：
   - `category` ∈ {antenna, field-kinematics, mechanics, circuit}
   - `license` 决定存放目录 `sims/<license>/<category>/`。自研填 `own`；第三方须查证（GPL → `gpl/`）。
3. **写 metadata**：在 `data/simulations.json` 追加一条记录（字段见 `.ai/knowledge/simulation-schema.md`）。至少填必填 6 项；`theory`/`formulas`/`experiment` 鼓励补全（小白用户核心诉求）。
4. **准备内核**：把仿真 HTML 放到 `sims/<license>/<category>/<id>.html`（自包含 HTML/CSS/JS）。无现成代码时用脚手架生成占位骨架。
5. **生成详情页**：`node tools/gen-sim-pages.mjs`（全量重生成 `simulations/<id>/index.html`）。
6. **校验**：`node tools/validate.mjs`。必须零错误。
7. **提交 + PR**：`git add` 改动（含新增内核、json、详情页），commit，开 PR 等 review。

## 全自动（推荐）
执行脚手架，自动完成步骤 3~6：
```bash
node tools/new-simulation.mjs \
  --id half-wave-dipole \
  --title "半波偶极子" \
  --category antenna \
  --difficulty beginner \
  --license own \
  --description "观察半波偶极子的电流、电压和辐射场"
```
- 未提供 `--path` 时自动推导为 `sims/<license>/<category>/<id>.html` 并生成占位内核。
- 也可用 `--config ./my-sim.json` 传入完整 JSON（含 `theory`/`formulas`/`experiment`/`videos`）。
- 关联仿真默认自动填入同分类其它 id（可在生成后手改 json）。

## 引擎（依赖来源）
- 默认 `--engine canvas`：纯 Canvas 2D 占位（向后兼容现有行为）。
- `--engine three`：生成含 **importmap 本地依赖**的 Three.js 内核骨架，引用仓库 `vendor/three/`（离线、不依赖 CDN）。
  - 首次使用前须落地本地依赖库：`node tools/vendor-three.mjs`（默认 three@0.185.1，OrbitControls/stats/lil-gui 同版本一起下载）。
  - 内核固定位于 `sims/<license>/<category>/<id>.html`，importmap 用相对路径 `../../../vendor/three/`。
  - 升级 three 时须同步升级 vendor 内全部 4 个文件（版本必须一致，否则白屏）。
  - 下载前可用 `node tools/vendor-three.mjs --dry-run` 预览、`--check` 检查本地是否齐全。
- 依赖策略总纲见 `Alanspace/threejs-电子仿真依赖与策略.md`。

## 注意事项
- **不要手改 `simulations/<id>/index.html`**：那是生成产物，改 json 后重跑 `gen-sim-pages.mjs` 即可。
- `id` 不可变；`path` 必须与 `license` 目录一致。
- `source`/`license` 标第三方 / GPL 的，务必先查证再定稿（CI 暂未自动阻断，靠人工）。
- `videos[]` 暂可空，后期补。
