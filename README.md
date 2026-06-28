# ⚡ 电子仿真 · 小程序画廊

> 交互式电子与物理仿真集合 — 天线辐射 · 电磁场可视化 · 电路仿真 · 经典力学

一个极简卡片画廊风格的静态网站，展示 12 个电子/物理仿真小程序。每个仿真运行在独立沙箱 iframe 中。

## 🎯 仿真列表

### 📡 天线与辐射（5 个）
| 仿真 | 描述 |
|------|------|
| 天线可视化 | 交互式天线辐射方向图可视化 |
| 偶极子电磁波 | 偶极子天线产生的电磁波传播动画 |
| 全向与定向辐射 | 对比全向天线与定向天线的辐射模式 |
| 天线辐射仿真 | 综合天线辐射仿真工具，支持参数调节 |
| 雷达方程与窄波束 | 雷达方程计算器与窄波束电磁辐射仿真 |

### 🧲 场动力学 — 天线的诞生系列（5 个）
| 版本 | 描述 |
|------|------|
| v1 | 麦克斯韦电磁辐射与干涉相消物理可视化 |
| v2 | 更丰富的场线动画与交互控制 |
| v3 | 时域演化和多频率分析 |
| v4 | 干涉相消的定量分析 |
| v5 | 完整的麦克斯韦方程组可视化 |

### 🏀 力学（1 个）
| 仿真 | 描述 |
|------|------|
| 拍篮球物理仿真 | 自由落体与弹性碰撞，实时显示速度与能量 |

### 🔌 电路（1 个）
| 仿真 | 描述 |
|------|------|
| 电路仿真器 (EDA) | 原理图编辑器 + DC 工作点分析 + 波形查看器 |

## 🚀 部署

### 本地预览
```bash
cd simulation-gallery
python3 -m http.server 8000
# 打开 http://localhost:8000
```

### Cloudflare Pages（主域名）
1. 将仓库推送到 GitHub
2. 在 Cloudflare Dashboard 中连接仓库
3. 构建设置：无需构建命令，直接部署静态文件
4. 获得 `xxx.pages.dev` 域名

### GitHub Pages（备用域名）
1. Settings → Pages → Source: `main` branch, `/ (root)`
2. 获得 `xxx.github.io` 域名

## 🛡️ 安全

所有仿真运行在沙箱 iframe 中：
```html
<iframe sandbox="allow-scripts allow-same-origin" ...></iframe>
```

- `allow-scripts`：仿真必需
- `allow-same-origin`：允许 CDN 资源加载
- 关闭模态框时释放 iframe 资源

## 📁 文件结构

```
simulation-gallery/
├── index.html          # 画廊主页面
├── styles.css          # 暗色 EDA 主题 + 响应式
├── gallery.js          # 数据加载 / 卡片渲染 / 过滤 / iframe 模态
├── data/
│   └── simulations.json # 仿真元数据
├── sims/
│   ├── antenna/        # 5 个天线/电磁辐射仿真
│   ├── field-kinematics/ # 5 个麦克斯韦场仿真
│   ├── mechanics/      # 1 个物理力学仿真
│   └── circuit/        # EDA 电路仿真器构建产物
├── thumbnails/         # 缩略图（CSS 渐变占位）
└── README.md
```

## 🎨 设计

暗色 EDA 主题，4 类分类色：
- 🟢 天线：`#00ff66`
- 🔵 场动力学：`#00f2fe`
- 🟠 力学：`#ff6600`
- 🟣 电路：`#bc8cff`

响应式卡片网格：1列（<640px）→ 2列（640-900px）→ 3列（900-1200px）→ 4列（>1200px）

## 🌐 访问

- **中国大陆**：通过 Cloudflare Pages（附近有香港/东京/新加坡节点）
- **全球**：Cloudflare Pages + GitHub Pages 双域名

## 📄 许可

MIT License
