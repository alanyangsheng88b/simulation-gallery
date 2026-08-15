# 仿真数据模型（simulations.json）

> 实际落地契约。字段以 `data/simulations.schema.json`（JSON Schema draft-07）为权威。
> ⚠️ 注意：规划库 `Alanspace/电子仿真网页/仿真包标准与Schema.md` 草案用的是 `slug` + 数字难度 + `expr`/`related` 模型，与落地实现（**id 模型**）不一致；**以本文件与 `data/simulations.schema.json` 为准**，规划库文档已同步修正。

## 顶层
数组，每个元素描述一个仿真：
```json
[ { "id": "dipole-em-wave", "category": "antenna", ... }, ... ]
```

## 字段速查

| 字段 | 必填 | 类型 | 约束 / 取值 |
|------|------|------|------|
| `id` | ✅ | string | `^[a-z0-9][a-z0-9-]*$`，全局唯一，作为路由 `/simulations/<id>/`，**不可变** |
| `category` | ✅ | string | `antenna` / `field-kinematics` / `mechanics` / `circuit` |
| `title` | ✅ | string | 中文标题 |
| `description` | ✅ | string | 一句话简介（卡片 + meta description） |
| `path` | ✅ | string | 相对根目录的内核路径，必须存在：`sims/<license>/<category>/<file>.html` |
| `version` | ✅ | string | 如 `"1.0"` |
| `titleEn` | ⬜ | string | 英文标题（SEO / i18n） |
| `tags` | ⬜ | string[] | 横向标签，如 `["天线","偶极子"]` |
| `difficulty` | ⬜（建议填） | enum | `beginner` / `intermediate` / `advanced` |
| `source` | ⬜ | string | 来源/作者，如「原创」「改编自 XXX」；须查证后填 |
| `license` | ⬜（建议填） | enum | `own` / `mit` / `apache` / `gpl` / `cc-by` / `cc-by-sa` / `unknown`；决定物理目录 |
| `theory` | ⬜ | string | 原理讲解（Markdown 纯文本），空 = 未撰写 |
| `formulas` | ⬜ | obj[] | `{ expression, label?, description? }` |
| `experiment` | ⬜ | obj | `{ summary?, steps: [{ title, instruction, expected? }] }` |
| `application` | ⬜ | string | 实际应用场景 |
| `videos` | ⬜ | obj[] | `{ title, url, platform? }` |
| `relatedSimulations` | ⬜ | string[] | 关联仿真 id（同分类自动关联即可） |
| `updatedAt` | ⬜ | date | 最后更新日期 `YYYY-MM-DD` |

## 最小合法记录（脚手架默认值）
```json
{
  "id": "my-sim",
  "category": "antenna",
  "title": "我的仿真",
  "description": "一句话简介",
  "path": "sims/own/antenna/my-sim.html",
  "version": "1.0",
  "difficulty": "beginner",
  "license": "own",
  "tags": [],
  "theory": "",
  "formulas": [],
  "experiment": { "summary": "", "steps": [] },
  "application": "",
  "videos": [],
  "relatedSimulations": []
}
```

## 校验命令
```bash
node tools/validate.mjs
```
