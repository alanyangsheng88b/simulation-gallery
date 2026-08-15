# 仓库架构规范（AI 运维层）

> 本文件是 `simulation-gallery` 仓库的「单一事实来源」架构说明，供 AI agent / 贡献者快速理解结构。
> 配套：`.ai/knowledge/simulation-schema.md`（数据模型）、`.ai/skills/new-simulation.md`（加仿真 SOP）。
> 唯一判断标尺：《项目需求基线 V1.0》（位于 `Alanspace/项目需求基线 V1.0.md`）。

## 一、目录结构

```text
simulation-gallery/
├── index.html                  # 首页卡片画廊（锚点直链 /simulations/<id>/）
├── gallery.js                  # 首页渲染（读取 simulations.json）
├── styles.css / assets/        # 主题与详情页样式/脚本
├── worker.js / wrangler.toml   # Cloudflare Workers + Assets 部署（assets.directory = "."）
├── sims/<license>/<category>/<file>.html   # 仿真内核（iframe 源）
│     license ∈ {own, mit, apache, gpl, cc-by, cc-by-sa, unknown}
│     category ∈ {antenna, field-kinematics, mechanics, circuit}
├── simulations/<id>/index.html # 仿真详情页（脚本批量生成，勿手改）
├── data/simulations.json       # 中心化元数据（顶层数组，[id] 唯一）
├── data/simulations.schema.json# JSON Schema（draft-07），字段契约
├── tools/gen-sim-pages.mjs     # 由 simulations.json 全量生成详情页
├── tools/validate.mjs          # CI 第一层校验（字段/枚举/path/关联）
├── tools/enrich-simulations.mjs# 一次性富化脚本（仅历史数据用，勿重跑）
└── .ai/                        # AI 运维层（本目录）
```

## 二、核心约定

### 2.1 id 即路由
- 每个仿真有唯一 `id`（slug 规则 `^[a-z0-9][a-z0-9-]*$`）。
- 详情页路由 = `/simulations/<id>/`（生成于 `simulations/<id>/index.html`）。
- `id` 一经确定**不可更改**（改 id = 改 URL = 破坏已分享链接）。

### 2.2 iframe 接口
- 详情页用 `<iframe sandbox="allow-scripts allow-same-origin" src="../../<path>">` 加载仿真内核。
- 仿真内核是**独立运行**的 HTML 文件，不依赖主站 JS；通过 postMessage 可选上报交互状态（实验状态 URL 预留，本期未做）。
- 内核只需自包含（HTML/CSS/JS），放在 `sims/<license>/<category>/` 下即可。

### 2.3 许可证物理隔离
- `own` 自研 / `mit` / `apache` / `gpl` / `cc-by` / `cc-by-sa` / `unknown`。
- GPL 类第三方**必须**放 `sims/gpl/`，绝不并入主站代码（规避传染性）。
- `path` 字段必须与 `license` 目录一致：`sims/<license>/<category>/<file>.html`。

### 2.4 数据模型
- 单一事实：所有仿真元数据在 `data/simulations.json`（顶层数组）。
- 详情页由 `tools/gen-sim-pages.mjs` **全量重新生成**（幂等）。**不要手改 `simulations/<id>/index.html`**——改 json 后重新跑生成脚本。
- 字段契约见 `.ai/knowledge/simulation-schema.md`。

## 三、新增仿真两条路径
- 手动：按 `.ai/skills/new-simulation.md` SOP 逐步操作。
- 自动（推荐）：`node tools/new-simulation.mjs --id <id> --title <标题> --category <分类> --difficulty <难度> --license <许可证>`，脚本会建内核占位、写 metadata、生成详情页、跑校验。

## 四、CI / 校验
- `deploy.yml` 部署前运行 `node tools/validate.mjs`（基线 #11 第一层）。
- 校验项：必填字段、枚举合法、`id` 唯一、`path` 文件存在、`relatedSimulations` 引用存在且不自指。
- 校验失败 = 阻断部署。
