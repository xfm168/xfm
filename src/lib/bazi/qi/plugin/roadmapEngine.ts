/**
 * P3.18 RoadmapEngine — 长期路线图引擎
 *
 * 纯 Plugin，不修改 Kernel。
 * 管理 P3-P8 全阶段路线图，追踪里程碑进度，验证 P3 验收标准，
 * 生成中文路线图报告，为玄风门体系的长远发展提供全景视图。
 *
 * 古籍依据：
 *   《易经》："凡事预则立，不预则废。" — 路线图是长远发展的根基
 *   《道德经》："千里之行，始于足下。" — 从P3出发，逐步实现宏大愿景
 *   《荀子》："不积跬步，无以至千里；不积小流，无以成江海。" — 持续迭代
 *
 * 阶段定义：
 *   P3 — 专家级八字引擎（当前）
 *   P4 — 紫微斗数
 *   P5 — 奇门遁甲
 *   P6 — 六爻
 *   P7 — 风水联动
 *   P8 — AI命理顾问（终极统一平台）
 */

// ═══════════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════════

/** 从数组中随机选取一个元素 */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 从数组中随机选取 N 个不重复元素 */
function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr]
  const result: T[] = []
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(Math.random() * copy.length)
    result.push(copy.splice(idx, 1)[0])
  }
  return result
}

/** 格式化时间 */
function formatTime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 保留一位小数 */
function round1(n: number): number {
  return Math.round(n * 10) / 10
}

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

/** 路线图阶段 */
export type RoadmapPhase = 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8'

/** 阶段状态 */
export type PhaseStatus = 'completed' | 'in-progress' | 'planned' | 'future'

/** 里程碑状态 */
export type MilestoneStatus = 'done' | 'in-progress' | 'pending' | 'blocked'

/** 验收标准状态 */
export type AcceptanceStatus = 'pass' | 'fail' | 'pending' | 'unknown'

/** 术数系统（复用 architectureUpgrade 定义） */
type DivinationSystem = 'bazi' | 'ziwei' | 'liuyao' | 'qimen' | 'fengshui' | 'xingming'

/** 里程碑 */
export interface Milestone {
  /** 里程碑唯一标识 */
  id: string
  /** 里程碑名称 */
  name: string
  /** 里程碑详细描述 */
  description: string
  /** 里程碑状态 */
  status: MilestoneStatus
  /** 完成度 0-100 */
  completion: number
  /** 依赖的里程碑 ID 列表 */
  dependencies: string[]
}

/** 阶段定义 */
export interface PhaseDef {
  /** 阶段标识 */
  phase: RoadmapPhase
  /** 中文名 */
  name: string
  /** 详细描述 */
  description: string
  /** 目标术数系统 */
  targetSystems: DivinationSystem[]
  /** 阶段状态 */
  status: PhaseStatus
  /** 计划开始时间 */
  startDate: string
  /** 计划结束时间 */
  endDate: string
  /** 里程碑列表 */
  milestones: Milestone[]
  /** 前置依赖阶段 */
  dependencies: RoadmapPhase[]
  /** 验收标准 */
  acceptanceCriteria: string[]
  /** 古籍来源 */
  classicalSources: string[]
  /** 交付物 */
  deliverables: string[]
}

/** P3 验收标准项 */
export interface AcceptanceCriterion {
  /** 验收标准编号 */
  id: string
  /** 验收标准描述 */
  description: string
  /** 当前状态 */
  status: AcceptanceStatus
  /** 佐证信息（可选） */
  evidence?: string
}

/** P3 验收结果 */
export interface AcceptanceResult {
  /** 标准总数 */
  total: number
  /** 通过数 */
  passed: number
  /** 未通过数 */
  failed: number
  /** 待验证数 */
  pending: number
  /** 未知数 */
  unknown: number
  /** 通过率 */
  passRate: number
  /** 各标准详情 */
  criteria: AcceptanceCriterion[]
  /** 是否整体通过 */
  overallPass: boolean
  /** 古籍引用 */
  classicalRef: string
}

/** 路线图进度 */
export interface RoadmapProgress {
  /** 总体完成度 0-100 */
  overallCompletion: number
  /** 各阶段进度 */
  byPhase: Record<RoadmapPhase, {
    /** 该阶段完成度 */
    completion: number
    /** 已完成里程碑数 */
    milestonesDone: number
    /** 总里程碑数 */
    milestonesTotal: number
  }>
  /** 当前阶段 */
  currentPhase: RoadmapPhase
  /** 下一阶段 */
  nextPhase: RoadmapPhase | null
  /** 阻塞项 */
  blocked: string[]
}

/** 最终目标描述 */
export interface FinalGoal {
  /** 目标描述 */
  description: string
  /** 愿景 */
  vision: string
  /** 核心原则 */
  principles: string[]
  /** 古籍引用 */
  classicalRef: string
}

/** 路线图报告 */
export interface RoadmapReport {
  /** 报告生成时间 */
  generatedAt: string
  /** 所有阶段 */
  phases: PhaseDef[]
  /** 总体进度 */
  progress: RoadmapProgress
  /** P3 验收结果 */
  p3Acceptance: AcceptanceResult
  /** 最终目标 */
  finalGoal: FinalGoal
  /** 总体评分 0-100 */
  overallScore: number
  /** 建议 */
  suggestions: string[]
  /** 中文报告 */
  report: string
  /** 古籍引用 */
  classicalRef: string
}

// ═══════════════════════════════════════════════════════════════
// P3 验收标准内置数据
// ═══════════════════════════════════════════════════════════════

/** P3 验收标准初始数据 */
const P3_ACCEPTANCE_CRITERIA: AcceptanceCriterion[] = [
  {
    id: 'AC001',
    description: '真实案例验证 >= 1000例',
    status: 'pending',
    evidence: '需要 CaseLibrary 提供真实案例数据进行验证',
  },
  {
    id: 'AC002',
    description: 'Benchmark 自动运行',
    status: 'pending',
    evidence: '需要 RegressionCenter 配置自动化基准测试流水线',
  },
  {
    id: 'AC003',
    description: 'Explain 无明显自相矛盾',
    status: 'pending',
    evidence: '需要 ConsistencyChecker 对 Explain 输出进行矛盾检测',
  },
  {
    id: 'AC004',
    description: '全模块一致性校验通过',
    status: 'pending',
    evidence: '需要 ConsistencyChecker 横向校验各模块输出的一致性',
  },
  {
    id: 'AC005',
    description: '所有新增能力保持 Plugin 化',
    status: 'pass',
    evidence: '已确认全部 18 个 P3 模块均为 Plugin，未修改 Kernel',
  },
  {
    id: 'AC006',
    description: 'Kernel 零修改',
    status: 'pass',
    evidence: '通过 architectureUpgrade 确认 Kernel 未被修改',
  },
  {
    id: 'AC007',
    description: '性能满足目标',
    status: 'pending',
    evidence: '需要 PerformanceEngine 输出性能基准报告',
  },
  {
    id: 'AC008',
    description: '专家验证准确率持续提升',
    status: 'pending',
    evidence: '需要 LearningEngine 追踪准确率变化曲线',
  },
]

// ═══════════════════════════════════════════════════════════════
// P3 阶段里程碑内置数据（P3.1 - P3.18）
// ═══════════════════════════════════════════════════════════════

const P3_MILESTONES: Milestone[] = [
  {
    id: 'P3-M01',
    name: 'P3.1 CaseLibrary 案例库',
    description: '构建标准化的命盘案例库，支持真实案例与经典案例的存储、检索和相似度匹配',
    status: 'done',
    completion: 100,
    dependencies: [],
  },
  {
    id: 'P3-M02',
    name: 'P3.2 BenchmarkEngine 基准测试引擎',
    description: '构建自动化基准测试框架，支持与传统八字方法的对比评测',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M01'],
  },
  {
    id: 'P3-M03',
    name: 'P3.3 ProbabilityEngine 概率引擎',
    description: '基于统计模型的命理事件概率计算，提供置信区间和概率分布',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M01'],
  },
  {
    id: 'P3-M04',
    name: 'P3.4 TimelineEngine 时间线引擎',
    description: '构建命运时间线，将命盘事件映射到具体时间段，支持大运流年事件排布',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M03'],
  },
  {
    id: 'P3-M05',
    name: 'P3.5 EventPredictionEngine 事件预测引擎',
    description: '基于时间线和概率模型的事件预测，支持多维度事件类型分类',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M04'],
  },
  {
    id: 'P3-M06',
    name: 'P3.6 DecisionEngine 决策引擎',
    description: '基于命盘分析结果提供行动建议，支持多方案比较和风险评估',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M05'],
  },
  {
    id: 'P3-M07',
    name: 'P3.7 SimilarityEngine 相似度引擎',
    description: '八字相似度计算，支持命盘间结构化比较与案例匹配',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M01'],
  },
  {
    id: 'P3-M08',
    name: 'P3.8 ExplainV3 解释引擎升级',
    description: '升级解释引擎至第三版，支持推理链、古籍引用和概率标注',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M02', 'P3-M03'],
  },
  {
    id: 'P3-M09',
    name: 'P3.9 KnowledgeGraph 知识图谱',
    description: '构建八字命理知识图谱，将十神、神煞、格局等概念关系化',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M08'],
  },
  {
    id: 'P3-M10',
    name: 'P3.10 ConsistencyChecker 一致性校验',
    description: '横跨所有模块的一致性校验，检测并修复矛盾输出',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M08', 'P3-M09'],
  },
  {
    id: 'P3-M11',
    name: 'P3.11 ReasoningLayer 推理层',
    description: '构建逻辑推理层，支持多步推理和反事实分析',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M09', 'P3-M10'],
  },
  {
    id: 'P3-M12',
    name: 'P3.12 ExpertRuleEngine 专家规则引擎',
    description: '将命理名家经验规则形式化，支持可配置的专家规则库',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M11'],
  },
  {
    id: 'P3-M13',
    name: 'P3.13 LearningEngine 学习引擎',
    description: '基于反馈的学习机制，持续优化分析准确率',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M02', 'P3-M12'],
  },
  {
    id: 'P3-M14',
    name: 'P3.14 QualityMonitor 质量监控',
    description: '统一质量指标采集，输出可视化数据和质量报告',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M10', 'P3-M13'],
  },
  {
    id: 'P3-M15',
    name: 'P3.15 RegressionCenter 回归中心',
    description: '自动化回归测试框架，确保系统变更不引入退化',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M02', 'P3-M14'],
  },
  {
    id: 'P3-M16',
    name: 'P3.16 PerformanceEngine 性能引擎',
    description: '性能基准测试与优化，确保大规模命盘分析的性能目标',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M14', 'P3-M15'],
  },
  {
    id: 'P3-M17',
    name: 'P3.17 ArchitectureUpgrade 架构升级',
    description: '将系统架构升级为支持多术数的 XuanFeng Core',
    status: 'done',
    completion: 100,
    dependencies: ['P3-M16'],
  },
  {
    id: 'P3-M18',
    name: 'P3.18 RoadmapEngine 路线图引擎',
    description: '构建 P3-P8 长期路线图，追踪里程碑，验证验收标准',
    status: 'in-progress',
    completion: 90,
    dependencies: ['P3-M17'],
  },
]

// ═══════════════════════════════════════════════════════════════
// P4-P8 阶段里程碑数据
// ═══════════════════════════════════════════════════════════════

const P4_MILESTONES: Milestone[] = [
  {
    id: 'P4-M01',
    name: '紫微星盘生成',
    description: '根据出生时间生成完整的紫微斗数命盘，包含十二宫位和星曜分布',
    status: 'pending',
    completion: 0,
    dependencies: [],
  },
  {
    id: 'P4-M02',
    name: '命盘分析引擎',
    description: '对命盘进行深度分析，解读各宫位星曜的含义与相互关系',
    status: 'pending',
    completion: 0,
    dependencies: ['P4-M01'],
  },
  {
    id: 'P4-M03',
    name: '四化飞星推演',
    description: '实现禄权科忌四化飞星的推演算法，支持宫干飞化和流年四化',
    status: 'pending',
    completion: 0,
    dependencies: ['P4-M02'],
  },
  {
    id: 'P4-M04',
    name: '大限流年推算',
    description: '计算大限、流年、流月的运势变化，支持时间轴上的命盘推演',
    status: 'pending',
    completion: 0,
    dependencies: ['P4-M03'],
  },
  {
    id: 'P4-M05',
    name: '宫位解读系统',
    description: '十二宫位的专业解读，涵盖事业、财运、感情、健康等方面',
    status: 'pending',
    completion: 0,
    dependencies: ['P4-M02'],
  },
  {
    id: 'P4-M06',
    name: '星曜组合分析',
    description: '星曜组合（主星、辅星、煞星、化星）的综合分析与格局判断',
    status: 'pending',
    completion: 0,
    dependencies: ['P4-M02', 'P4-M05'],
  },
  {
    id: 'P4-M07',
    name: '紫微案例分析',
    description: '收集经典命例并建立案例库，验证紫微推演的准确性',
    status: 'pending',
    completion: 0,
    dependencies: ['P4-M04', 'P4-M06'],
  },
  {
    id: 'P4-M08',
    name: '八字-紫微联动',
    description: '实现八字与紫微斗数之间的交叉验证和综合分析',
    status: 'pending',
    completion: 0,
    dependencies: ['P4-M07'],
  },
]

const P5_MILESTONES: Milestone[] = [
  {
    id: 'P5-M01',
    name: '奇门局生成',
    description: '根据时间生成奇门遁甲排盘，构建天地人神四盘',
    status: 'pending',
    completion: 0,
    dependencies: [],
  },
  {
    id: 'P5-M02',
    name: '局象分析引擎',
    description: '对奇门局的九星、八门、八神、三奇六仪进行综合分析',
    status: 'pending',
    completion: 0,
    dependencies: ['P5-M01'],
  },
  {
    id: 'P5-M03',
    name: '用神定局系统',
    description: '确定奇门局中的用神，进行吉凶判断和择时分析',
    status: 'pending',
    completion: 0,
    dependencies: ['P5-M02'],
  },
  {
    id: 'P5-M04',
    name: '择时择方系统',
    description: '基于奇门局分析，提供最佳行动时间和方位建议',
    status: 'pending',
    completion: 0,
    dependencies: ['P5-M03'],
  },
  {
    id: 'P5-M05',
    name: '奇门案例验证',
    description: '收集经典奇门案例，建立案例库并验证推演准确性',
    status: 'pending',
    completion: 0,
    dependencies: ['P5-M04'],
  },
  {
    id: 'P5-M06',
    name: '奇门与八字联动',
    description: '实现奇门遁甲与八字系统的交叉分析能力',
    status: 'pending',
    completion: 0,
    dependencies: ['P5-M05'],
  },
]

const P6_MILESTONES: Milestone[] = [
  {
    id: 'P6-M01',
    name: '六爻起卦系统',
    description: '支持铜钱摇卦、时间起卦、数字起卦等多种起卦方式',
    status: 'pending',
    completion: 0,
    dependencies: [],
  },
  {
    id: 'P6-M02',
    name: '纳甲装卦引擎',
    description: '自动完成纳甲、安世应、配六亲、装六神等装卦步骤',
    status: 'pending',
    completion: 0,
    dependencies: ['P6-M01'],
  },
  {
    id: 'P6-M03',
    name: '断卦分析系统',
    description: '基于动爻、用神、六亲关系进行断卦分析，判断吉凶成败',
    status: 'pending',
    completion: 0,
    dependencies: ['P6-M02'],
  },
  {
    id: 'P6-M04',
    name: '应期推算',
    description: '根据卦象推断事件发生的时间，支持年月日时的应期判断',
    status: 'pending',
    completion: 0,
    dependencies: ['P6-M03'],
  },
  {
    id: 'P6-M05',
    name: '六爻案例库',
    description: '收集经典六爻占例，建立案例库验证断卦准确性',
    status: 'pending',
    completion: 0,
    dependencies: ['P6-M04'],
  },
  {
    id: 'P6-M06',
    name: '六爻与八字联动',
    description: '实现六爻占卜与八字命盘的综合分析',
    status: 'pending',
    completion: 0,
    dependencies: ['P6-M05'],
  },
]

const P7_MILESTONES: Milestone[] = [
  {
    id: 'P7-M01',
    name: '形势派风水分析',
    description: '基于山川地形的形势分析，判断龙脉走向、砂水格局',
    status: 'pending',
    completion: 0,
    dependencies: [],
  },
  {
    id: 'P7-M02',
    name: '理气派风水推算',
    description: '基于罗盘数据的理气分析，涵盖二十四山、九星、玄空飞星',
    status: 'pending',
    completion: 0,
    dependencies: ['P7-M01'],
  },
  {
    id: 'P7-M03',
    name: '阳宅风水评估',
    description: '住宅环境的综合风水评估，包括户型、朝向、装修等',
    status: 'pending',
    completion: 0,
    dependencies: ['P7-M01', 'P7-M02'],
  },
  {
    id: 'P7-M04',
    name: '阴宅风水分析',
    description: '墓地选址与风水评估，涉及寻龙点穴等传统技法',
    status: 'pending',
    completion: 0,
    dependencies: ['P7-M02'],
  },
  {
    id: 'P7-M05',
    name: '风水案例库',
    description: '收集经典风水案例，建立案例库验证风水分析的准确性',
    status: 'pending',
    completion: 0,
    dependencies: ['P7-M03', 'P7-M04'],
  },
  {
    id: 'P7-M06',
    name: '风水与命理联动',
    description: '实现风水分析与八字命盘的综合调和工作',
    status: 'pending',
    completion: 0,
    dependencies: ['P7-M05'],
  },
]

const P8_MILESTONES: Milestone[] = [
  {
    id: 'P8-M01',
    name: '统一推演接口',
    description: '构建统一的术数推演接口，所有术数系统通过统一 API 调用',
    status: 'pending',
    completion: 0,
    dependencies: [],
  },
  {
    id: 'P8-M02',
    name: '多术数融合分析',
    description: '支持同时对一个命盘进行八字、紫微、六爻等多术数联合分析',
    status: 'pending',
    completion: 0,
    dependencies: ['P8-M01'],
  },
  {
    id: 'P8-M03',
    name: '交叉验证引擎',
    description: '不同术数系统之间的结果交叉验证，提升综合判断的可信度',
    status: 'pending',
    completion: 0,
    dependencies: ['P8-M02'],
  },
  {
    id: 'P8-M04',
    name: 'AI 对话接口',
    description: '构建自然语言对话接口，用户可直接提问获取命理分析',
    status: 'pending',
    completion: 0,
    dependencies: ['P8-M01'],
  },
  {
    id: 'P8-M05',
    name: '个性化建议引擎',
    description: '基于多术数综合分析结果，生成个性化的生活、事业、健康建议',
    status: 'pending',
    completion: 0,
    dependencies: ['P8-M03', 'P8-M04'],
  },
  {
    id: 'P8-M06',
    name: '持续学习系统',
    description: 'AI 命理顾问从用户反馈中持续学习，不断优化分析质量',
    status: 'pending',
    completion: 0,
    dependencies: ['P8-M05'],
  },
  {
    id: 'P8-M07',
    name: '知识库整合',
    description: '整合所有术数系统的知识库，构建统一的玄学知识图谱',
    status: 'pending',
    completion: 0,
    dependencies: ['P8-M03'],
  },
  {
    id: 'P8-M08',
    name: '全平台发布',
    description: '完成 XuanFeng Core Engine 全平台的发布，实现终极愿景',
    status: 'pending',
    completion: 0,
    dependencies: ['P8-M06', 'P8-M07'],
  },
]

// ═══════════════════════════════════════════════════════════════
// 阶段定义内置数据
// ═══════════════════════════════════════════════════════════════

/** P3 阶段定义 */
const P3_PHASE: PhaseDef = {
  phase: 'P3',
  name: '专家级八字引擎',
  description:
    '将玄风门八字系统从基础命盘计算升级为具备专家级分析能力的完整引擎。' +
    '涵盖案例库、基准测试、概率推理、时间线、事件预测、决策支持、相似度匹配、' +
    '解释引擎升级、知识图谱、一致性校验、推理层、专家规则、学习引擎、质量监控、' +
    '回归中心、性能优化、架构升级和路线图规划等 18 个核心模块。',
  targetSystems: ['bazi'],
  status: 'in-progress',
  startDate: '2025-01-01',
  endDate: '2026-06-30',
  milestones: P3_MILESTONES,
  dependencies: [],
  acceptanceCriteria: [
    '真实案例验证 >= 1000例',
    'Benchmark 自动运行',
    'Explain 无明显自相矛盾',
    '全模块一致性校验通过',
    '所有新增能力保持 Plugin 化',
    'Kernel 零修改',
    '性能满足目标',
    '专家验证准确率持续提升',
  ],
  classicalSources: [
    '渊海子平',
    '滴天髓',
    '穷通宝鉴',
    '三命通会',
    '子平真诠',
    '命理约言',
    '神峰通考',
    '兰台妙选',
  ],
  deliverables: [
    'CaseLibrary 案例库',
    'BenchmarkEngine 基准测试引擎',
    'ProbabilityEngine 概率引擎',
    'TimelineEngine 时间线引擎',
    'EventPredictionEngine 事件预测引擎',
    'DecisionEngine 决策引擎',
    'SimilarityEngine 相似度引擎',
    'ExplainV3 解释引擎升级',
    'KnowledgeGraph 知识图谱',
    'ConsistencyChecker 一致性校验',
    'ReasoningLayer 推理层',
    'ExpertRuleEngine 专家规则引擎',
    'LearningEngine 学习引擎',
    'QualityMonitor 质量监控',
    'RegressionCenter 回归中心',
    'PerformanceEngine 性能引擎',
    'ArchitectureUpgrade 架构升级',
    'RoadmapEngine 路线图引擎',
  ],
}

/** P4 阶段定义 */
const P4_PHASE: PhaseDef = {
  phase: 'P4',
  name: '紫微斗数',
  description:
    '以星曜入宫为核心的命理推演系统。基于出生时间排布紫微命盘，' +
    '通过十二宫位、主星、辅星、煞星的组合分析，结合四化飞星推演，' +
    '提供全面的命盘解读和大运流年预测。',
  targetSystems: ['ziwei'],
  status: 'planned',
  startDate: '2026-07-01',
  endDate: '2027-12-31',
  milestones: P4_MILESTONES,
  dependencies: ['P3'],
  acceptanceCriteria: [
    '星盘生成与传统排盘一致',
    '四化飞星推演正确率 >= 95%',
    '大限流年预测经验证',
    '与八字联动分析可用',
  ],
  classicalSources: [
    '紫微斗数全书',
    '太微赋',
    '骨髓赋',
    '形性赋',
  ],
  deliverables: [
    '紫微星盘引擎',
    '四化推演引擎',
    '宫位分析系统',
    '流年预测引擎',
    '八字-紫微联动模块',
  ],
}

/** P5 阶段定义 */
const P5_PHASE: PhaseDef = {
  phase: 'P5',
  name: '奇门遁甲',
  description:
    '以天地人神四盘为核心的择时择方系统。根据时间排布奇门局，' +
    '通过九星、八门、八神、三奇六仪的分析，判断吉凶方位和最佳时机，' +
    '为用户提供行动决策的时空依据。',
  targetSystems: ['qimen'],
  status: 'future',
  startDate: '2028-01-01',
  endDate: '2029-06-30',
  milestones: P5_MILESTONES,
  dependencies: ['P4'],
  acceptanceCriteria: [
    '奇门排盘与传统方法一致',
    '吉凶判断经验证',
    '择时择方功能可用',
    '与八字联动分析可用',
  ],
  classicalSources: [
    '烟波钓叟歌',
    '奇门遁甲秘笈',
  ],
  deliverables: [
    '奇门排盘引擎',
    '局象分析系统',
    '择时择方系统',
    '奇门案例库',
    '奇门-八字联动模块',
  ],
}

/** P6 阶段定义 */
const P6_PHASE: PhaseDef = {
  phase: 'P6',
  name: '六爻',
  description:
    '以纳甲六亲为核心的占卜系统。支持多种起卦方式，通过纳甲装卦、' +
    '六亲生克、动变分析进行断卦，推断吉凶成败和应期，为具体问题提供占断。',
  targetSystems: ['liuyao'],
  status: 'future',
  startDate: '2029-07-01',
  endDate: '2030-12-31',
  milestones: P6_MILESTONES,
  dependencies: ['P5'],
  acceptanceCriteria: [
    '起卦与装卦正确率 >= 98%',
    '断卦分析经验证',
    '应期推断合理',
    '与八字联动分析可用',
  ],
  classicalSources: [
    '增删卜易',
    '卜筮正宗',
    '黄金策',
  ],
  deliverables: [
    '六爻起卦系统',
    '装卦引擎',
    '断卦分析系统',
    '应期推算引擎',
    '六爻案例库',
    '六爻-八字联动模块',
  ],
}

/** P7 阶段定义 */
const P7_PHASE: PhaseDef = {
  phase: 'P7',
  name: '风水联动',
  description:
    '以形势理气为核心的环境堪察系统。融合形势派与理气派两大流派，' +
    '支持阳宅阴宅的风水分析，通过罗盘数据与实地信息进行环境评估，' +
    '并与命理系统联动实现风水调理。',
  targetSystems: ['fengshui'],
  status: 'future',
  startDate: '2031-01-01',
  endDate: '2032-06-30',
  milestones: P7_MILESTONES,
  dependencies: ['P6'],
  acceptanceCriteria: [
    '形势分析覆盖主要地形',
    '理气推算与传统方法一致',
    '阳宅评估报告可用',
    '风水-命理联动功能可用',
  ],
  classicalSources: [
    '葬经',
    '撼龙经',
    '疑龙经',
    '青囊经',
    '天玉经',
  ],
  deliverables: [
    '形势分析引擎',
    '理气推算引擎',
    '阳宅评估系统',
    '阴宅分析系统',
    '风水案例库',
    '风水-命理联动模块',
  ],
}

/** P8 阶段定义 */
const P8_PHASE: PhaseDef = {
  phase: 'P8',
  name: 'AI 命理顾问',
  description:
    '统一玄学推演平台。整合八字、紫微、奇门、六爻、风水、姓名学六大术数系统，' +
    '通过 AI 对话接口提供自然语言命理咨询服务，实现多术数融合分析、交叉验证、' +
    '个性化建议和持续学习，构建完整的 XuanFeng Core Engine。',
  targetSystems: ['bazi', 'ziwei', 'liuyao', 'qimen', 'fengshui', 'xingming'],
  status: 'future',
  startDate: '2032-07-01',
  endDate: '2034-12-31',
  milestones: P8_MILESTONES,
  dependencies: ['P7'],
  acceptanceCriteria: [
    '所有术数系统接口统一',
    '多术数融合分析可用',
    '交叉验证引擎正常工作',
    'AI 对话接口可用',
    '持续学习机制有效',
    '知识库完整覆盖',
  ],
  classicalSources: [
    '综合所有前期阶段古籍来源',
    '易经',
    '道德经',
  ],
  deliverables: [
    'XuanFeng Core Engine 统一平台',
    '多术数融合分析引擎',
    '交叉验证引擎',
    'AI 对话接口',
    '个性化建议引擎',
    '持续学习系统',
    '统一玄学知识图谱',
  ],
}

// ═══════════════════════════════════════════════════════════════
// 最终目标
// ═══════════════════════════════════════════════════════════════

/** 最终目标描述 */
const FINAL_GOAL: FinalGoal = {
  description:
    '最终目标不是生成一份命理报告，而是构建一个具备专业推演能力、可验证、可持续迭代、' +
    '可扩展到全玄学体系的 XuanFeng Core Engine。',
  vision:
    '以玄风核心（XuanFeng Core）为根基，从八字出发，逐步融合紫微斗数、奇门遁甲、六爻、' +
    '风水、姓名学等术数系统，最终构建一个统一、专业、可验证、可持续迭代的 AI 命理顾问平台。',
  principles: [
    'Kernel 永不修改 — 所有扩展通过 Plugin 机制实现',
    '古籍为根 — 每个功能模块都有对应的古籍依据',
    '可验证 — 所有推演结果必须经过基准测试和案例分析验证',
    '可持续迭代 — 通过学习引擎和反馈机制持续提升准确率',
    '可扩展 — 架构支持无限扩展新的术数系统',
    '一致性 — 所有模块输出必须通过一致性校验',
    '性能优先 — 在保证准确率的前提下优化性能',
  ],
  classicalRef:
    '《道德经》："千里之行，始于足下。" — 从 P3 八字引擎出发，逐步实现宏大愿景。\n' +
    '《荀子》："不积跬步，无以至千里；不积小流，无以成江海。" — 每个阶段的积累，终将汇聚为完整的玄学推演体系。',
}

// ═══════════════════════════════════════════════════════════════
// 古籍引用池
// ═══════════════════════════════════════════════════════════════

/** 路线图相关古籍引用 */
const CLASSICAL_QUOTES = [
  '《易经》："凡事预则立，不预则废。" — 路线图是长远发展的根基',
  '《道德经》："千里之行，始于足下。" — 从P3出发，逐步实现宏大愿景',
  '《荀子》："不积跬步，无以至千里；不积小流，无以成江海。" — 持续迭代',
  '《易经》："形而上者谓之道，形而下者谓之器。" — 核心为道，术数为器',
  '《道德经》："道生一，一生二，二生三，三生万物。" — 一个核心，衍生万法',
  '《论语》："君子不器。" — 不拘泥于单一术数，触类旁通',
  '《中庸》："博学之，审问之，慎思之，明辨之，笃行之。" — 学问与践行并重',
  '《易经》："天行健，君子以自强不息。" — 持续改进，永不止步',
]

// ═══════════════════════════════════════════════════════════════
// RoadmapEngine 主类
// ═══════════════════════════════════════════════════════════════

export class RoadmapEngine {
  /** 内置阶段定义 */
  private phases: Map<RoadmapPhase, PhaseDef>

  /** P3 验收标准（可变状态） */
  private acceptanceCriteria: AcceptanceCriterion[]

  constructor() {
    // 初始化所有阶段
    this.phases = new Map<RoadmapPhase, PhaseDef>([
      ['P3', structuredClone(P3_PHASE)],
      ['P4', structuredClone(P4_PHASE)],
      ['P5', structuredClone(P5_PHASE)],
      ['P6', structuredClone(P6_PHASE)],
      ['P7', structuredClone(P7_PHASE)],
      ['P8', structuredClone(P8_PHASE)],
    ])

    // 初始化 P3 验收标准
    this.acceptanceCriteria = P3_ACCEPTANCE_CRITERIA.map(c => ({ ...c }))
  }

  // ───────────────────────────────────────────────────────────────
  // 阶段查询
  // ───────────────────────────────────────────────────────────────

  /**
   * 获取所有阶段定义
   * @returns 所有阶段的深拷贝列表
   */
  getAllPhases(): PhaseDef[] {
    return Array.from(this.phases.values()).map(p => structuredClone(p))
  }

  /**
   * 获取指定阶段定义
   * @param phase - 阶段标识
   * @returns 阶段定义的深拷贝，若不存在返回 null
   */
  getPhase(phase: RoadmapPhase): PhaseDef | null {
    const def = this.phases.get(phase)
    return def ? structuredClone(def) : null
  }

  // ───────────────────────────────────────────────────────────────
  // 里程碑管理
  // ───────────────────────────────────────────────────────────────

  /**
   * 更新里程碑状态和完成度
   * @param phase - 阶段标识
   * @param milestoneId - 里程碑 ID
   * @param status - 新状态
   * @param completion - 可选，新的完成度 0-100
   * @returns 是否更新成功
   */
  updateMilestone(
    phase: RoadmapPhase,
    milestoneId: string,
    status: MilestoneStatus,
    completion?: number,
  ): boolean {
    const def = this.phases.get(phase)
    if (!def) return false

    const ms = def.milestones.find(m => m.id === milestoneId)
    if (!ms) return false

    ms.status = status
    if (completion !== undefined) {
      ms.completion = Math.max(0, Math.min(100, completion))
    }
    return true
  }

  /**
   * 将里程碑标记为已完成
   * @param phase - 阶段标识
   * @param milestoneId - 里程碑 ID
   * @returns 是否完成成功
   */
  completeMilestone(phase: RoadmapPhase, milestoneId: string): boolean {
    return this.updateMilestone(phase, milestoneId, 'done', 100)
  }

  // ───────────────────────────────────────────────────────────────
  // P3 验收标准
  // ───────────────────────────────────────────────────────────────

  /**
   * 获取 P3 验收标准列表
   * @returns 验收标准列表的深拷贝
   */
  getP3AcceptanceCriteria(): AcceptanceCriterion[] {
    return this.acceptanceCriteria.map(c => ({ ...c }))
  }

  /**
   * 验证 P3 验收标准（逐项检查）
   * @returns 验收结果
   */
  validateP3Acceptance(): AcceptanceResult {
    const criteria = this.acceptanceCriteria.map(c => ({ ...c }))
    const total = criteria.length
    const passed = criteria.filter(c => c.status === 'pass').length
    const failed = criteria.filter(c => c.status === 'fail').length
    const pending = criteria.filter(c => c.status === 'pending').length
    const unknown = criteria.filter(c => c.status === 'unknown').length
    const passRate = total > 0 ? round1((passed / total) * 100) : 0

    return {
      total,
      passed,
      failed,
      pending,
      unknown,
      passRate,
      criteria,
      overallPass: failed === 0 && pending === 0 && unknown === 0,
      classicalRef: pick(CLASSICAL_QUOTES),
    }
  }

  // ───────────────────────────────────────────────────────────────
  // 进度查询
  // ───────────────────────────────────────────────────────────────

  /**
   * 获取路线图总体进度
   * @returns 进度信息
   */
  getProgress(): RoadmapProgress {
    const phaseOrder: RoadmapPhase[] = ['P3', 'P4', 'P5', 'P6', 'P7', 'P8']
    let totalWeight = 0
    let totalDone = 0
    const blocked: string[] = []

    const byPhase = {} as Record<RoadmapPhase, {
      completion: number
      milestonesDone: number
      milestonesTotal: number
    }>

    for (const phase of phaseOrder) {
      const def = this.phases.get(phase)!
      const ms = def.milestones
      const done = ms.filter(m => m.status === 'done').length
      const totalMs = ms.length
      // 阶段完成度 = 已完成里程碑数 / 总里程碑数 * 100
      const completion = totalMs > 0 ? round1((done / totalMs) * 100) : 0

      byPhase[phase] = {
        completion,
        milestonesDone: done,
        milestonesTotal: totalMs,
      }

      // 累加权重（越早的阶段权重越大）
      const weight = 6 - phaseOrder.indexOf(phase)
      totalWeight += weight
      totalDone += done * weight

      // 检查是否有被阻塞的里程碑
      for (const m of ms) {
        if (m.status === 'blocked') {
          blocked.push(`[${phase}] ${m.name}`)
        }
      }
    }

    // 总体完成度 = 加权平均
    const overallCompletion = totalWeight > 0
      ? round1((totalDone / (totalWeight * 6)) * 100)  // 标准化到 0-100
      : 0

    // 确定当前阶段和下一阶段
    let currentPhase: RoadmapPhase = 'P3'
    let nextPhase: RoadmapPhase | null = null

    for (const phase of phaseOrder) {
      const def = this.phases.get(phase)!
      if (def.status === 'in-progress') {
        currentPhase = phase
        break
      }
      if (def.status === 'planned' || def.status === 'future') {
        if (nextPhase === null) {
          nextPhase = phase
        }
      }
    }

    // 如果没有明确的 in-progress，找第一个非 completed 的
    const inProgressExists = Array.from(this.phases.values())
      .some(d => d.status === 'in-progress')
    if (!inProgressExists) {
      for (const phase of phaseOrder) {
        const def = this.phases.get(phase)!
        if (def.status !== 'completed') {
          currentPhase = phase
          break
        }
      }
    }

    // 重新计算 nextPhase
    nextPhase = null
    for (let i = phaseOrder.indexOf(currentPhase) + 1; i < phaseOrder.length; i++) {
      nextPhase = phaseOrder[i]
      break
    }

    return {
      overallCompletion,
      byPhase,
      currentPhase,
      nextPhase,
      blocked,
    }
  }

  // ───────────────────────────────────────────────────────────────
  // 报告生成
  // ───────────────────────────────────────────────────────────────

  /**
   * 生成路线图报告
   * @returns 完整的路线图报告
   */
  getReport(): RoadmapReport {
    const progress = this.getProgress()
    const p3Acceptance = this.validateP3Acceptance()
    const phases = this.getAllPhases()
    const finalGoal = { ...FINAL_GOAL }
    const suggestions = this.generateSuggestions(progress, p3Acceptance)

    // 计算总体评分（基于完成度、验收通过率、里程碑完成数）
    const completionScore = progress.overallCompletion * 0.4
    const acceptanceScore = p3Acceptance.passRate * 0.3
    const milestoneScore = this.calculateMilestoneScore(progress) * 0.3
    const overallScore = Math.round(completionScore + acceptanceScore + milestoneScore)

    // 生成中文报告
    const report = this.generateChineseReport(phases, progress, p3Acceptance, finalGoal, suggestions)

    return {
      generatedAt: formatTime(new Date()),
      phases,
      progress,
      p3Acceptance,
      finalGoal,
      overallScore,
      suggestions,
      report,
      classicalRef: pickN(CLASSICAL_QUOTES, 3).join('\n'),
    }
  }

  /**
   * 获取最终目标描述
   * @returns 最终目标
   */
  getFinalGoal(): FinalGoal {
    return { ...FINAL_GOAL }
  }

  /**
   * 检查阶段是否可启动（前置依赖是否满足）
   * @param phase - 阶段标识
   * @returns ready 为 true 表示可启动；blocking 列出阻塞的阶段
   */
  canStartPhase(phase: RoadmapPhase): { ready: boolean; blocking: RoadmapPhase[] } {
    const def = this.phases.get(phase)
    if (!def) {
      return { ready: false, blocking: [] }
    }

    const blocking: RoadmapPhase[] = []

    for (const dep of def.dependencies) {
      const depDef = this.phases.get(dep)
      if (!depDef || depDef.status !== 'completed') {
        blocking.push(dep)
      }
    }

    return {
      ready: blocking.length === 0,
      blocking,
    }
  }

  // ───────────────────────────────────────────────────────────────
  // 内部辅助方法
  // ───────────────────────────────────────────────────────────────

  /**
   * 计算里程碑得分（0-100）
   */
  private calculateMilestoneScore(progress: RoadmapProgress): number {
    let totalDone = 0
    let totalAll = 0
    for (const key of Object.keys(progress.byPhase) as RoadmapPhase[]) {
      totalDone += progress.byPhase[key].milestonesDone
      totalAll += progress.byPhase[key].milestonesTotal
    }
    return totalAll > 0 ? round1((totalDone / totalAll) * 100) : 0
  }

  /**
   * 生成建议列表
   */
  private generateSuggestions(
    progress: RoadmapProgress,
    acceptance: AcceptanceResult,
  ): string[] {
    const suggestions: string[] = []

    // 基于验收标准的建议
    for (const c of acceptance.criteria) {
      if (c.status === 'pending') {
        suggestions.push(`【验收】${c.description}：当前待验证，建议尽快完成。${c.evidence ? ' ' + c.evidence : ''}`)
      }
      if (c.status === 'fail') {
        suggestions.push(`【验收】${c.description}：未通过验收，需要修复。${c.evidence ? ' ' + c.evidence : ''}`)
      }
    }

    // 基于进度的建议
    const currentDef = this.phases.get(progress.currentPhase)
    if (currentDef) {
      const inProgressMs = currentDef.milestones.filter(m => m.status === 'in-progress')
      const pendingMs = currentDef.milestones.filter(m => m.status === 'pending')

      if (inProgressMs.length > 0) {
        const names = inProgressMs.map(m => m.name).join('、')
        suggestions.push(`【进度】当前有 ${inProgressMs.length} 个里程碑进行中：${names}，建议持续推进。`)
      }
      if (pendingMs.length > 0) {
        const names = pendingMs.map(m => m.name).join('、')
        suggestions.push(`【进度】当前有 ${pendingMs.length} 个里程碑待启动：${names}，建议按依赖顺序启动。`)
      }
    }

    // 基于阻塞项的建议
    if (progress.blocked.length > 0) {
      suggestions.push(`【阻塞】存在 ${progress.blocked.length} 个被阻塞的里程碑，需要排查原因。`)
    }

    // 阶段启动建议
    if (progress.nextPhase) {
      const canStart = this.canStartPhase(progress.nextPhase)
      if (canStart.ready) {
        suggestions.push(`【规划】阶段 ${progress.nextPhase} 的前置依赖已满足，可以考虑启动规划。`)
      } else {
        const blockNames = canStart.blocking.join('、')
        suggestions.push(`【规划】阶段 ${progress.nextPhase} 尚需完成前置依赖：${blockNames}。`)
      }
    }

    // 总体建议
    if (progress.overallCompletion >= 80) {
      suggestions.push('【总体】路线图进度良好，建议开始筹备下一阶段的预研工作。')
    } else if (progress.overallCompletion >= 50) {
      suggestions.push('【总体】路线图进度过半，建议加快当前阶段的推进速度。')
    } else {
      suggestions.push('【总体】路线图尚在早期阶段，建议专注当前阶段的里程碑交付。')
    }

    return suggestions
  }

  /**
   * 生成中文路线图报告
   */
  private generateChineseReport(
    phases: PhaseDef[],
    progress: RoadmapProgress,
    acceptance: AcceptanceResult,
    finalGoal: FinalGoal,
    suggestions: string[],
  ): string {
    const lines: string[] = []

    lines.push('╔══════════════════════════════════════════════════════════════╗')
    lines.push('║           玄风门 XuanFeng Core 路线图报告                    ║')
    lines.push('╚══════════════════════════════════════════════════════════════╝')
    lines.push('')

    // 一、最终愿景
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('一、最终愿景')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('')
    lines.push(`愿景：${finalGoal.vision}`)
    lines.push('')
    lines.push('核心原则：')
    for (const p of finalGoal.principles) {
      lines.push(`  - ${p}`)
    }
    lines.push('')

    // 二、P3 验收标准逐项检查
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('二、P3 验收标准逐项检查')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('')
    for (const c of acceptance.criteria) {
      const icon = c.status === 'pass' ? '[PASS]' :
                   c.status === 'fail' ? '[FAIL]' :
                   c.status === 'pending' ? '[PEND]' : '[????]'
      lines.push(`  ${icon} ${c.id} — ${c.description}`)
      if (c.evidence) {
        lines.push(`         佐证：${c.evidence}`)
      }
    }
    lines.push('')
    lines.push(`  总计：${acceptance.total} 项  |  通过：${acceptance.passed}  |  待验证：${acceptance.pending}  |  通过率：${acceptance.passRate}%`)
    lines.push(`  整体验收：${acceptance.overallPass ? '已通过' : '未通过'}`)
    lines.push('')

    // 三、P3-P8 阶段概览
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('三、P3-P8 阶段概览')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('')
    for (const phase of phases) {
      const statusIcon = phase.status === 'completed' ? '[DONE]' :
                         phase.status === 'in-progress' ? '[ >>> ]' :
                         phase.status === 'planned' ? '[PLAN]' : '[FUTU]'
      lines.push(`  ${statusIcon} ${phase.phase}: ${phase.name}`)
      lines.push(`         时间：${phase.startDate} ~ ${phase.endDate}`)
      lines.push(`         系统：${phase.targetSystems.join('、')}`)
      lines.push(`         里程碑：${phase.milestones.length} 个`)
      if (phase.dependencies.length > 0) {
        lines.push(`         前置依赖：${phase.dependencies.join('、')}`)
      }
      lines.push('')
    }

    // 四、当前进度
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('四、当前进度')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('')
    lines.push(`  总体完成度：${progress.overallCompletion}%`)
    lines.push(`  当前阶段：${progress.currentPhase}`)
    lines.push(`  下一阶段：${progress.nextPhase || '无'}`)
    lines.push('')
    lines.push('  各阶段进度：')

    const phaseNames: Record<RoadmapPhase, string> = {
      P3: '专家级八字',
      P4: '紫微斗数',
      P5: '奇门遁甲',
      P6: '六爻',
      P7: '风水联动',
      P8: 'AI命理顾问',
    }

    for (const key of Object.keys(progress.byPhase) as RoadmapPhase[]) {
      const bp = progress.byPhase[key]
      // 生成进度条
      const barLen = 20
      const filled = Math.round(bp.completion / 100 * barLen)
      const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barLen - filled)
      lines.push(`    ${key} (${phaseNames[key]}): [${bar}] ${bp.completion}% (${bp.milestonesDone}/${bp.milestonesTotal})`)
    }
    lines.push('')

    if (progress.blocked.length > 0) {
      lines.push('  阻塞项：')
      for (const b of progress.blocked) {
        lines.push(`    - ${b}`)
      }
      lines.push('')
    }

    // 五、各阶段里程碑详情
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('五、各阶段里程碑详情')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('')

    for (const phase of phases) {
      if (phase.milestones.length === 0) continue
      lines.push(`  ── ${phase.phase}: ${phase.name} ──`)
      lines.push('')
      for (const ms of phase.milestones) {
        const icon = ms.status === 'done' ? '[DONE]' :
                     ms.status === 'in-progress' ? '[ >>> ]' :
                     ms.status === 'blocked' ? '[LOCK]' : '[PEND]'
        lines.push(`    ${icon} ${ms.id} ${ms.name} (${ms.completion}%)`)
        lines.push(`         ${ms.description}`)
      }
      lines.push('')
    }

    // 六、下一步计划
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('六、下一步计划与建议')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('')

    if (suggestions.length > 0) {
      for (let i = 0; i < suggestions.length; i++) {
        lines.push(`  ${i + 1}. ${suggestions[i]}`)
      }
    } else {
      lines.push('  暂无建议。')
    }
    lines.push('')

    // 七、古籍引用
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('七、古籍引用')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('')

    const quotes = pickN(CLASSICAL_QUOTES, 3)
    for (const q of quotes) {
      lines.push(`  ${q}`)
    }
    lines.push('')
    lines.push('╚══════════════════════════════════════════════════════════════╝')

    return lines.join('\n')
  }
}
