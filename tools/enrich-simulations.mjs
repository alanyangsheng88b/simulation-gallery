// tools/enrich-simulations.mjs
// 将现有 simulations.json 富化为基线第三节内容模型要求的完整字段，
// 并把 path 改写为许可证隔离后的新路径 sims/own/<category>/<file>。
// 运行：node tools/enrich-simulations.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const dataPath = join(ROOT, "data", "simulations.json");

const base = JSON.parse(readFileSync(dataPath, "utf8"));

// 内容覆盖层：id -> 新增/富化字段。relatedSimulations 按分类自动计算。
// 注意：source/license 默认填「原创 / own」，其真实来源与许可证需逐条人工核实后再定稿。
const CONTENT = {
  "antenna-visualization": {
    difficulty: "beginner",
    theory:
      "通过三维辐射方向图直观展示不同天线类型的远场辐射强度分布。方向图是天线增益随空间角度变化的函数，是评估天线覆盖能力最直观的方式。",
    application: "射频工程师选型与波束覆盖评估、天线教学演示。",
    formulas: [{ expression: "F(θ,φ) = √(G(θ,φ))", label: "归一化方向图函数" }],
  },
  "dipole-em-wave": {
    difficulty: "beginner",
    theory:
      "偶极子天线由时变电流激励，其周围产生交变电场与磁场；二者相互垂直并同时垂直于传播方向，构成横电磁波（TEM）。本仿真展示电场线随电流的生灭与向外传播。",
    application: "理解电磁波本质、天线辐射入门。",
    formulas: [
      { expression: "E_θ = j η (k I₀ l / 4π r) e^{-jkr} sinθ", label: "短偶极子远场电场" },
      { expression: "H_φ = E_θ / η", label: "远场磁场" },
    ],
    experiment: {
      summary: "观察偶极子周围电场与磁场的空间关系",
      steps: [
        { title: "启动电流", instruction: "点击播放，观察电流从 0 增大到峰值。", expected: "电场线从电荷处向外生长。" },
        { title: "观察传播", instruction: "跟随电场线的向外运动。", expected: "波形以光速向外扩散，E 与 H 相互正交。" },
        { title: "改变频率", instruction: "调高频率后观察波长变化。", expected: "波长变短，相同距离内周期数增多。" },
      ],
    },
  },
  "omni-directional-radiation": {
    difficulty: "beginner",
    theory:
      "全向天线在水平面近似均匀辐射（如垂直偶极子），定向天线通过阵元干涉将能量集中到特定方向，形成高增益波束。二者对比揭示了波束赋形与增益的权衡。",
    application: "基站天线选型、室内覆盖设计。",
  },
  "antenna-radiation-sim": {
    difficulty: "intermediate",
    theory:
      "综合辐射仿真工具：调节频率、阵元数、间距等参数，实时更新方向图与关键指标（增益、波束宽度、旁瓣）。",
    application: "天线参数扫描与教学实验。",
  },
  "radar-equation": {
    difficulty: "intermediate",
    theory:
      "雷达方程描述了接收功率与发射功率、天线增益、目标 RCS、距离之间的定量关系。窄波束通过高增益天线获得更远探测距离，但搜索范围变窄。",
    application: "雷达探测距离预算、传感器设计。",
    formulas: [
      { expression: "P_r = (P_t G² λ² σ) / ((4π)³ R⁴)", label: "雷达方程（单站）" },
    ],
  },
  "birth-of-antenna": {
    difficulty: "beginner",
    theory:
      "麦克斯韦方程组预言变化的电场产生磁场、变化的磁场产生电场，从而以波的形式在自由空间传播。当天线中的导行波无法被传输线约束时，能量便以电磁辐射的形式释放——这就是天线诞生的本质。",
    application: "电磁学入门、天线原理教学。",
    formulas: [
      { expression: "∇×E = -∂B/∂t", label: "法拉第定律" },
      { expression: "∇×H = J + ∂D/∂t", label: "安培-麦克斯韦定律" },
    ],
  },
  "birth-of-antenna-2": {
    difficulty: "beginner",
    theory:
      "在 v1 基础上增强场线动画，展示近场（感应场）到远场（辐射场）的过渡——近场能量在源附近振荡而不辐射，远场能量脱离源向外传播。",
    application: "近场/远场概念教学。",
  },
  "birth-of-antenna-3": {
    difficulty: "intermediate",
    theory:
      "加入时域演化与多频率分析，观察不同频率下辐射模式与波长的变化关系，理解频率对天线电尺寸的决定性影响。",
    application: "频率-电尺寸关系教学。",
  },
  "birth-of-antenna-4": {
    difficulty: "intermediate",
    theory:
      "增加干涉相消的定量分析，可视化驻波（能量储存）与行波（能量传播）的转换过程，揭示天线为何能有效辐射。",
    application: "驻波/行波与辐射效率教学。",
  },
  "birth-of-antenna-5": {
    difficulty: "advanced",
    theory:
      "完整麦克斯韦方程组可视化，包含边界条件与阻抗匹配的动画演示，呈现从源到自由空间电磁波的全链路物理过程。",
    application: "电磁场完整体系教学。",
  },
  "bouncing-ball": {
    difficulty: "beginner",
    theory:
      "篮球自由下落时重力势能转化为动能，与地面碰撞时发生弹性/非弹性碰撞，部分能量以热和形变耗散。实时显示速度、加速度与机械能变化，直观呈现能量守恒与损耗。",
    application: "经典力学教学、碰撞与能量守恒演示。",
    formulas: [
      { expression: "v = √(2gh)", label: "自由落体末速度" },
      { expression: "E = mgh + ½mv²", label: "机械能" },
    ],
    experiment: {
      summary: "观察弹跳中的能量转换",
      steps: [
        { title: "释放篮球", instruction: "点击释放，观察下落过程的速度变化。", expected: "速度线性增大，高度降低。" },
        { title: "观察碰撞", instruction: "注意触地瞬间的速度突变。", expected: "速度反向、幅度减小（能量损耗）。" },
        { title: "多次弹跳", instruction: "连续观察若干次弹跳高度。", expected: "每次回弹高度递减，最终静止。" },
      ],
    },
  },
  "circuit-simulator": {
    difficulty: "intermediate",
    theory:
      "基于改进节点分析法（MNA）求解电路微分代数方程，得到各节点电压与支路电流；配合原理图编辑与波形查看，构成轻量 EDA 工具。",
    application: "电路原理教学、小型电路验证。",
  },
  "dipole-antenna-4": {
    difficulty: "advanced",
    theory:
      "端到端天线射频仿真：基于 S 参数提取输入/反向损耗，计算阻抗匹配与驻波比（VSWR），评估辐射效率。覆盖从建模到指标分析的完整流程。",
    application: "射频天线设计与指标验证。",
    formulas: [
      { expression: "VSWR = (1+|Γ|)/(1-|Γ|)", label: "电压驻波比" },
      { expression: "Γ = (Z_L - Z₀)/(Z_L + Z₀)", label: "反射系数" },
    ],
  },
  "dipole-antenna-eda": {
    difficulty: "advanced",
    theory:
      "EDA 风格偶极子天线设计工具，可视化电流分布与辐射方向图，支持参数化扫描以优化增益与带宽。",
    application: "偶极子天线设计与优化。",
  },
  "em-dipole-field-2": {
    difficulty: "advanced",
    theory:
      "仿真电磁偶极天线的近场与远场辐射，展示场强空间分布与极化特性，帮助理解辐射场的矢量本质。",
    application: "辐射场分析与极化研究。",
  },
  "dipole-e-field-lines": {
    difficulty: "beginner",
    theory:
      "逐步展示偶极子电场线从电荷分离到稳态的完整生成过程，揭示电场作为矢量场的本质与边界形态。",
    application: "电场概念教学。",
  },
  "phased-array-radar": {
    difficulty: "advanced",
    theory:
      "通过控制各阵元馈电的相位差，使远场波前相干叠加，实现波束的电子扫描而无需机械转动。阵因子决定了主瓣方向与栅瓣出现条件。",
    application: "雷达、5G 大规模 MIMO、卫星通信。",
    formulas: [
      { expression: "AF(θ) = Σ e^{j k d (n-1)(sinθ - sinθ₀)}", label: "均匀线阵阵因子" },
      { expression: "d/λ > 1 + |sinθ₀|", label: "无栅瓣条件" },
    ],
    experiment: {
      summary: "体验电子波束扫描",
      steps: [
        { title: "设置相位差", instruction: "调节阵元相位差 Δφ。", expected: "主瓣方向随之偏转。" },
        { title: "扫描波束", instruction: "连续改变 Δφ 扫描 0°~60°。", expected: "波束平滑电子扫描，无机械转动。" },
        { title: "观察栅瓣", instruction: "增大阵元间距 d 超过 λ。", expected: "出现不期望的栅瓣。" },
      ],
    },
  },
  "vector-magnetic-potential": {
    difficulty: "advanced",
    theory:
      "引入矢量磁位 A（B = ∇×A）可大幅简化辐射场推导。由电流元产生的 A 出发，可解析得到偶极子的电场、磁场与完备的矢量关系。",
    application: "电磁辐射理论推导、天线建模。",
    formulas: [
      { expression: "B = ∇×A", label: "磁感应强度" },
      { expression: "A = μ₀/(4π) ∫ J e^{-jkr}/r dV", label: "矢量磁位积分式" },
    ],
  },
};

const enriched = base.map((s) => {
  const c = CONTENT[s.id] || {};
  const file = basename(s.path);
  const newPath = `sims/own/${s.category}/${file}`;
  return {
    ...s,
    path: newPath,
    difficulty: c.difficulty || "beginner",
    source: c.source || "原创",
    license: c.license || "own",
    theory: c.theory || "",
    formulas: c.formulas || [],
    experiment: c.experiment || { summary: "", steps: [] },
    application: c.application || "",
    videos: c.videos || [],
  };
});

// 按分类自动计算关联仿真（排除自身）
const byCat = {};
enriched.forEach((s) => {
  (byCat[s.category] ||= []).push(s.id);
});
enriched.forEach((s) => {
  s.relatedSimulations = (byCat[s.category] || []).filter((id) => id !== s.id);
});

writeFileSync(dataPath, JSON.stringify(enriched, null, 2) + "\n", "utf8");
console.log(`✅ 已富化并写回 ${enriched.length} 条仿真 -> ${dataPath}`);
