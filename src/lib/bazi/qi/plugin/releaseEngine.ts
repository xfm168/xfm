/**
 * ReleaseEngine — 玄风门 XuanFeng Core Engine Release 1.0 核心管理引擎
 *
 * 纯 Plugin，不修改 Kernel。
 * 管理 Release 1.0 的 15 个维度的规范、配置和状态：
 *   1. Engine Freeze（引擎冻结）
 *   2. Accuracy Program（准确率计划）
 *   3. Expert Review（专家验证）
 *   4. Benchmark Upgrade（Benchmark升级）
 *   5. Explain Quality（Explain质量）
 *   6. UI Data Visualization（UI数据化）
 *   7. Performance Target（性能目标）
 *   8. Stability（稳定性）
 *   9. Product System（产品体系）
 *  10. API System（API体系）
 *  11. Commercial Plan（商业化）
 *  12. Security（安全）
 *  13. Development Standard（开发规范）
 *  14. Documentation Center（文档中心）
 *  15. Release Roadmap（版本路线图）
 *
 * 古籍依据：
 *   《易经》："穷则变，变则通，通则久。" — 持续演进之道
 *   《道德经》："大成若缺，其用不弊。" — 追求完美但务实
 *   《论语》："工欲善其事，必先利其器。" — 建立规范与工具
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

/** 生成唯一ID */
function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

/** 发布状态 */
export type ReleaseStatus = 'alpha' | 'beta' | 'rc' | 'stable' | 'frozen'

/** 开发阶段 */
export type DevelopmentPhase = 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8'

// ---------- 1. Engine Freeze（引擎冻结） ----------

/** 引擎冻结状态 */
export interface FreezeStatus {
  /** Kernel 是否已冻结 */
  kernelFrozen: boolean
  /** 冻结日期 */
  freezeDate: string
  /** 冻结原因 */
  freezeReason: string
  /** 允许的变更类型 */
  allowedChanges: string[] // 'bugfix-only', 'security-patch'
}

// ---------- 2. Accuracy Program（准确率计划） ----------

/** 单项准确率指标 */
export interface AccuracyMetric {
  /** 指标唯一标识 */
  id: string
  /** 指标名称 */
  name: string
  /** 指标描述 */
  description: string
  /** 当前得分 0-100 */
  currentScore: number
  /** 目标得分 */
  targetScore: number
  /** 趋势 */
  trend: 'improving' | 'stable' | 'declining'
  /** 测试案例数 */
  caseCount: number
  /** 专家验证数 */
  expertValidated: number
}

/** 准确率计划 */
export interface AccuracyProgram {
  /** 所有指标 */
  metrics: AccuracyMetric[]
  /** 总案例数 */
  totalCases: number
  /** 专家案例数 */
  expertCases: number
  /** 教科书案例数 */
  textbookCases: number
  /** 历史案例数 */
  historicalCases: number
  /** 最后更新时间 */
  lastUpdated: string
}

// ---------- 3. Expert Review（专家验证） ----------

/** 专家验证记录 */
export interface ExpertReviewRecord {
  /** 记录唯一标识 */
  id: string
  /** 案例标识 */
  caseId: string
  /** 专家姓名 */
  expertName: string
  /** 专家级别 */
  expertLevel: 'master' | 'senior' | 'junior'
  /** 验证维度（格局/用神/Explain等） */
  dimension: string
  /** 评级 */
  rating: 'correct' | 'partial' | 'incorrect'
  /** 专家评语 */
  comment: string
  /** 是否已应用修正 */
  revisionApplied: boolean
  /** 记录时间戳 */
  timestamp: string
}

/** 专家验证系统 */
export interface ExpertReviewSystem {
  /** 所有验证记录 */
  records: ExpertReviewRecord[]
  /** 总验证次数 */
  totalReviews: number
  /** 正确率 */
  correctRate: number
  /** 修正次数 */
  revisionCount: number
  /** 活跃专家列表 */
  activeExperts: string[]
}

// ---------- 4. Benchmark Upgrade（Benchmark升级） ----------

/** Benchmark 配置 */
export interface BenchmarkConfig {
  /** 发布时自动运行 */
  autoRunOnRelease: boolean
  /** 最低通过率（不允许低于上一版本） */
  minimumThreshold: number
  /** 是否需要回归测试 */
  regressionRequired: boolean
  /** 是否需要性能测试 */
  performanceRequired: boolean
  /** 是否需要缓存测试 */
  cacheRequired: boolean
  /** 是否需要懒加载测试 */
  lazyLoadRequired: boolean
  /** Benchmark 最大耗时(ms) */
  benchmarkMax: number
  /** 上次基准版本 */
  lastBaseline: string
  /** 上次测试结果 */
  lastResult: { passRate: number; duration: number; date: string }
}

// ---------- 5. Explain Quality（Explain质量） ----------

/** Explain 质量配置 */
export interface ExplainQualityConfig {
  /** 使用自然语言 */
  naturalLanguage: boolean
  /** 无重复 */
  noRepetition: boolean
  /** 无模板化 */
  noTemplate: boolean
  /** 无机械感 */
  noMechanical: boolean
  /** 专业性 */
  professional: boolean
  /** 可读性 */
  readable: boolean
  /** 基于证据 */
  evidenceBased: boolean
  /** 可操作性 */
  actionable: boolean
  /** Explain 之间最大相似度 */
  maxSimilarity: number
}

// ---------- 6. UI Data Visualization（UI数据化） ----------

/** 可视化配置 */
export interface VisualizationConfig {
  /** 已启用的可视化类型 */
  enabled: string[] // 'wuxing-radar', 'shishen-weight', 'wangshuai-curve', 'life-timeline', 'luck-trend', 'risk-heatmap'
  /** 图表渲染引擎 */
  chartProvider: string // 'echarts' | 'd3' | 'custom'
}

// ---------- 7. Performance Target（性能目标） ----------

/** 性能目标 */
export interface PerformanceTarget {
  /** 普通排盘最大耗时(ms) */
  normalChartMax: number    // 150ms
  /** Explain 最大耗时(ms) */
  explainMax: number        // 500ms
  /** Benchmark 最大耗时(ms) */
  benchmarkMax: number      // auto
  /** 是否启用缓存 */
  cacheEnabled: boolean
  /** 是否启用懒加载 */
  lazyLoadEnabled: boolean
  /** 并发目标 */
  concurrencyTarget: number
  /** 当前性能实测 */
  currentPerformance: { normalChart: number; explain: number; benchmark: number }
}

// ---------- 8. Stability（稳定性） ----------

/** 稳定性配置 */
export interface StabilityConfig {
  /** 错误监控 */
  errorMonitor: boolean
  /** 崩溃报告 */
  crashReport: boolean
  /** 健康检查 */
  healthCheck: boolean
  /** 日志记录 */
  logging: boolean
  /** 告警通知 */
  alerting: boolean
  /** 当前系统状态 */
  status: 'healthy' | 'degraded' | 'down'
}

// ---------- 9. Product System（产品体系） ----------

/** 产品体系 */
export interface ProductSystem {
  /** 核心引擎是否独立 */
  coreEngineIndependent: boolean
  /** 产品列表 */
  products: Array<{ id: string; name: string; system: string; status: string }>
  /** 是否共享核心引擎 */
  sharedCore: boolean
}

// ---------- 10. API System（API体系） ----------

/** 单个 API 定义 */
export interface APIDefinition {
  /** API 唯一标识 */
  id: string
  /** API 名称 */
  name: string
  /** API 描述 */
  description: string
  /** API 分类 */
  category: string
  /** API 状态 */
  status: 'planned' | 'implemented' | 'tested' | 'released'
}

/** API 体系 */
export interface APISystem {
  /** 所有 API 定义 */
  apis: APIDefinition[]
  /** API 版本 */
  version: string
  /** 通信协议 */
  protocol: string
}

// ---------- 11. Commercial Plan（商业化） ----------

/** 商业化层级 */
export interface CommercialTier {
  /** 层级唯一标识 */
  id: string
  /** 层级名称 */
  name: string
  /** 价格 */
  price: string
  /** 包含功能 */
  features: string[]
  /** 使用限制 */
  limits: Record<string, number>
}

/** 商业化计划 */
export interface CommercialPlan {
  /** 所有层级 */
  tiers: CommercialTier[]
  /** 是否共享核心引擎 */
  sharedCore: boolean
}

// ---------- 12. Security（安全） ----------

/** 安全配置 */
export interface SecurityConfig {
  /** 输入验证 */
  inputValidation: boolean
  /** 异常保护 */
  exceptionProtection: boolean
  /** 速率限制 */
  rateLimiting: boolean
  /** 缓存隔离 */
  cacheIsolation: boolean
  /** 日志脱敏 */
  logMasking: boolean
  /** 加密等级 */
  encryptionLevel: string
}

// ---------- 13. Development Standard（开发规范） ----------

/** 开发规范 */
export interface DevStandard {
  /** 需要设计文档 */
  requiresDesign: boolean
  /** 需要代码文档 */
  requiresDocumentation: boolean
  /** 需要测试 */
  requiresTesting: boolean
  /** 需要 Benchmark */
  requiresBenchmark: boolean
  /** 需要代码审查 */
  requiresReview: boolean
  /** 需要全部通过才能发布 */
  requiresAllPass: boolean
}

// ---------- 14. Documentation Center（文档中心） ----------

/** 文档中心 */
export interface DocumentationCenter {
  /** 文档模块列表 */
  modules: string[] // architecture, plugin, rule, strategy, knowledge, case, api
  /** 是否自动生成 */
  autoGenerated: boolean
  /** 最后生成时间 */
  lastGenerated: string
}

// ---------- 15. Release Roadmap（版本路线图） ----------

/** 版本里程碑 */
export interface ReleaseMilestone {
  /** 版本号 */
  version: string
  /** 里程碑名称 */
  name: string
  /** 目标时间 */
  target: string
  /** 里程碑状态 */
  status: 'current' | 'planned' | 'future'
  /** 依赖的版本 */
  dependencies: string[]
}

/** 版本路线图 */
export interface ReleaseRoadmap {
  /** 里程碑列表 */
  milestones: ReleaseMilestone[]
  /** 当前版本号 */
  currentVersion: string
}

// ---------- 完整 Release 状态 ----------

/** Release 1.0 完整状态 */
export interface ReleaseState {
  /** 版本号 */
  version: string
  /** 发布状态 */
  status: ReleaseStatus
  /** 1. 引擎冻结 */
  freeze: FreezeStatus
  /** 2. 准确率计划 */
  accuracy: AccuracyProgram
  /** 3. 专家验证 */
  expertReview: ExpertReviewSystem
  /** 4. Benchmark 配置 */
  benchmark: BenchmarkConfig
  /** 5. Explain 质量 */
  explainQuality: ExplainQualityConfig
  /** 6. 可视化 */
  visualization: VisualizationConfig
  /** 7. 性能目标 */
  performance: PerformanceTarget
  /** 8. 稳定性 */
  stability: StabilityConfig
  /** 9. 产品体系 */
  products: ProductSystem
  /** 10. API 体系 */
  apis: APISystem
  /** 11. 商业化 */
  commercial: CommercialPlan
  /** 12. 安全 */
  security: SecurityConfig
  /** 13. 开发规范 */
  devStandard: DevStandard
  /** 14. 文档中心 */
  documentation: DocumentationCenter
  /** 15. 版本路线图 */
  roadmap: ReleaseRoadmap
}

// ---------- Release 1.0 最终报告 ----------

/** Release 1.0 最终报告 */
export interface ReleaseReport {
  /** 报告生成时间 */
  generatedAt: string
  /** 完整状态快照 */
  state: ReleaseState
  /** 综合评分 0-100 */
  overallScore: number
  /** 就绪度检查 */
  readiness: {
    /** 引擎就绪 */
    engine: boolean
    /** 准确率就绪 */
    accuracy: boolean
    /** 稳定性就绪 */
    stability: boolean
    /** 性能就绪 */
    performance: boolean
    /** 文档就绪 */
    documentation: boolean
    /** 整体就绪 */
    overall: boolean
  }
  /** 开发原则列表 */
  principles: string[]
  /** 改进建议 */
  suggestions: string[]
  /** 中文报告正文 */
  report: string
  /** 古籍引用 */
  classicalRef: string
}

// ═══════════════════════════════════════════════════════════════
// 内置数据常量
// ═══════════════════════════════════════════════════════════════

/** API 定义（7个） */
const INITIAL_APIS: Omit<APIDefinition, 'status'>[] = [
  {
    id: 'api-bazi-analyze',
    name: 'AnalyzeBazi',
    description: '八字综合分析，包含格局、用神、旺衰、五行平衡等核心维度',
    category: 'bazi',
  },
  {
    id: 'api-luck-analyze',
    name: 'AnalyzeLuck',
    description: '运势分析，涵盖大运、流年、流月的吉凶趋势与关键转折点',
    category: 'luck',
  },
  {
    id: 'api-marriage-analyze',
    name: 'AnalyzeMarriage',
    description: '婚姻分析，评估婚姻质量、配偶特征、婚姻中的优势与潜在风险',
    category: 'marriage',
  },
  {
    id: 'api-career-analyze',
    name: 'AnalyzeCareer',
    description: '事业分析，识别职业方向、事业高低谷、贵人运与职场竞争力',
    category: 'career',
  },
  {
    id: 'api-health-analyze',
    name: 'AnalyzeHealth',
    description: '健康分析，根据五行偏颇判断易感脏腑、健康风险与养生方向',
    category: 'health',
  },
  {
    id: 'api-compatibility-analyze',
    name: 'AnalyzeCompatibility',
    description: '合婚分析，综合比较双方八字在性格、事业、财运、婚姻等方面的匹配度',
    category: 'compatibility',
  },
  {
    id: 'api-house-analyze',
    name: 'AnalyzeHouse',
    description: '风水分析，根据环境方位、五行生克评估住宅或办公环境的吉凶',
    category: 'fengshui',
  },
]

/** 商业化层级（5个） */
const INITIAL_TIERS: CommercialTier[] = [
  {
    id: 'tier-free',
    name: '免费版',
    price: '免费',
    features: ['基础八字排盘', '五行分析', '旺衰判断', '每日运势概览'],
    limits: { dailyAnalysis: 3, apiCallsPerDay: 50, explainDepth: 1 },
  },
  {
    id: 'tier-pro',
    name: '专业版',
    price: '¥99/月',
    features: ['完整八字分析', '大运流年', '婚姻/事业/健康专项分析', 'Explain深度解读', '可视化图表'],
    limits: { dailyAnalysis: 30, apiCallsPerDay: 500, explainDepth: 3 },
  },
  {
    id: 'tier-master',
    name: '大师版',
    price: '¥399/月',
    features: ['专业版全部功能', '合婚分析', '高级格局判断', '案例库对比', '专家验证标注', '古文依据引用'],
    limits: { dailyAnalysis: 100, apiCallsPerDay: 2000, explainDepth: 5 },
  },
  {
    id: 'tier-api',
    name: 'API版',
    price: '¥999/月',
    features: ['大师版全部功能', 'RESTful API 全量接入', '批量分析', 'Webhook回调', 'SLA保障'],
    limits: { dailyAnalysis: -1, apiCallsPerDay: 10000, explainDepth: 5 },
  },
  {
    id: 'tier-enterprise',
    name: '企业版',
    price: '面议',
    features: ['API版全部功能', '私有化部署', '定制Plugin开发', '专属技术支持', 'SLA定制', '数据隔离'],
    limits: { dailyAnalysis: -1, apiCallsPerDay: -1, explainDepth: 5 },
  },
]

/** Release 路线图里程碑（8个） */
const INITIAL_MILESTONES: ReleaseMilestone[] = [
  {
    version: '1.0',
    name: '八字引擎 Release',
    target: '2025-Q4',
    status: 'current',
    dependencies: [],
  },
  {
    version: '1.1',
    name: '准确率提升',
    target: '2026-Q1',
    status: 'planned',
    dependencies: ['1.0'],
  },
  {
    version: '1.2',
    name: 'Explain质量升级',
    target: '2026-Q2',
    status: 'planned',
    dependencies: ['1.1'],
  },
  {
    version: '2.0',
    name: '紫微斗数整合',
    target: '2026-Q4',
    status: 'future',
    dependencies: ['1.2'],
  },
  {
    version: '3.0',
    name: '奇门遁甲整合',
    target: '2027-Q2',
    status: 'future',
    dependencies: ['2.0'],
  },
  {
    version: '4.0',
    name: '六爻整合',
    target: '2027-Q4',
    status: 'future',
    dependencies: ['3.0'],
  },
  {
    version: '5.0',
    name: '风水模块',
    target: '2028-Q2',
    status: 'future',
    dependencies: ['4.0'],
  },
  {
    version: '6.0',
    name: 'AI命理顾问',
    target: '2028-Q4',
    status: 'future',
    dependencies: ['5.0'],
  },
]

/** 准确率指标（6个） */
const INITIAL_ACCURACY_METRICS: AccuracyMetric[] = [
  {
    id: 'acc-pattern',
    name: '格局正确率',
    description: '识别八字格局（正官格、七杀格、食神格等）的准确程度',
    currentScore: 72,
    targetScore: 90,
    trend: 'improving',
    caseCount: 0,
    expertValidated: 0,
  },
  {
    id: 'acc-usegod',
    name: '喜用神正确率',
    description: '确定喜神、用神、忌神、仇神的准确程度',
    currentScore: 68,
    targetScore: 88,
    trend: 'improving',
    caseCount: 0,
    expertValidated: 0,
  },
  {
    id: 'acc-explain',
    name: 'Explain一致率',
    description: 'Explain输出与古籍理论、专家解读的一致程度',
    currentScore: 65,
    targetScore: 85,
    trend: 'stable',
    caseCount: 0,
    expertValidated: 0,
  },
  {
    id: 'acc-career',
    name: '职业判断',
    description: '根据八字判断适合的职业方向的准确程度',
    currentScore: 60,
    targetScore: 82,
    trend: 'stable',
    caseCount: 0,
    expertValidated: 0,
  },
  {
    id: 'acc-marriage',
    name: '婚姻判断',
    description: '婚姻质量、配偶特征、婚姻时机判断的准确程度',
    currentScore: 58,
    targetScore: 80,
    trend: 'stable',
    caseCount: 0,
    expertValidated: 0,
  },
  {
    id: 'acc-wealth',
    name: '财富判断',
    description: '财运高低、财富趋势、理财方向判断的准确程度',
    currentScore: 55,
    targetScore: 78,
    trend: 'improving',
    caseCount: 0,
    expertValidated: 0,
  },
]

/** 产品体系（6个） */
const INITIAL_PRODUCTS: Array<{ id: string; name: string; system: string; status: string }> = [
  { id: 'prod-bazi', name: '八字', system: 'bazi', status: 'active' },
  { id: 'prod-fengshui', name: '风水', system: 'fengshui', status: 'planned' },
  { id: 'prod-liuyao', name: '六爻', system: 'liuyao', status: 'planned' },
  { id: 'prod-ziwei', name: '紫微', system: 'ziwei', status: 'planned' },
  { id: 'prod-qimen', name: '奇门', system: 'qimen', status: 'planned' },
  { id: 'prod-xingming', name: '姓名学', system: 'xingming', status: 'planned' },
]

/** 可视化类型列表 */
const VISUALIZATION_TYPES: string[] = [
  'wuxing-radar',
  'shishen-weight',
  'wangshuai-curve',
  'life-timeline',
  'luck-trend',
  'risk-heatmap',
]

/** 可视化类型中文名 */
const VISUALIZATION_NAMES: Record<string, string> = {
  'wuxing-radar': '五行雷达图',
  'shishen-weight': '十神权重图',
  'wangshuai-curve': '旺衰曲线',
  'life-timeline': '人生时间轴',
  'luck-trend': '运势趋势',
  'risk-heatmap': '风险热力图',
}

/** 开发原则（7条） */
const DEVELOPMENT_PRINCIPLES: string[] = [
  '1. Kernel 永久保持稳定，不随意修改',
  '2. 所有新增能力必须采用 Plugin / Strategy / Rule 扩展',
  '3. 以真实案例验证和专家反馈驱动优化',
  '4. 每次发布必须通过 Benchmark、Regression、Performance 全量验证',
  '5. 所有结论必须可解释、可追溯，并尽可能引用古籍依据',
  '6. 优先提升准确率、稳定性、性能和用户体验',
  '7. 保持代码简洁、模块解耦、文档完善',
]

/** 最终目标 */
const FINAL_GOAL: string =
  '玄风 Core 不只是一个八字分析程序，而是一个可验证、可扩展、可持续演进的专业命理推演引擎，' +
  '为八字、风水、六爻、紫微斗数、奇门遁甲等整个玄学体系提供统一底层能力。'

/** 古籍引用池 */
const CLASSICAL_REFS: string[] = [
  '《易经》："穷则变，变则通，通则久。" — 持续演进之道',
  '《道德经》："大成若缺，其用不弊。" — 追求完美但务实',
  '《论语》："工欲善其事，必先利其器。" — 建立规范与工具',
  '《易经》："天行健，君子以自强不息。" — 持续精进',
  '《道德经》："合抱之木，生于毫末；九层之台，起于累土。" — 积累之功',
  '《中庸》："致广大而尽精微，极高明而道中庸。" — 兼顾广度与深度',
  '《孙子兵法》："知己知彼，百战不殆。" — 以数据验证为基石',
  '《易经》："君子以慎辨物居方。" — 辨析精微，各安其位',
]

// ═══════════════════════════════════════════════════════════════
// ReleaseEngine 类
// ═══════════════════════════════════════════════════════════════

/**
 * ReleaseEngine — 玄风 Core Engine Release 1.0 核心管理引擎
 *
 * 管理15个维度的规范、配置和状态，生成中文发布报告，
 * 追踪准确率、专家验证、Benchmark等关键指标，
 * 维护商业化层级、API体系、产品体系与版本路线图。
 */
export class ReleaseEngine {
  /** Release 1.0 完整状态 */
  private state: ReleaseState

  constructor() {
    const now = formatTime(new Date())

    // 初始化 API 体系
    const apis: APIDefinition[] = INITIAL_APIS.map((api) => ({
      ...api,
      status: 'implemented' as const,
    }))

    // 初始化准确率计划
    const accuracy: AccuracyProgram = {
      metrics: INITIAL_ACCURACY_METRICS.map((m) => ({ ...m })),
      totalCases: 0,
      expertCases: 0,
      textbookCases: 0,
      historicalCases: 0,
      lastUpdated: now,
    }

    // 初始化专家验证系统
    const expertReview: ExpertReviewSystem = {
      records: [],
      totalReviews: 0,
      correctRate: 0,
      revisionCount: 0,
      activeExperts: [],
    }

    // 初始化 Benchmark 配置
    const benchmark: BenchmarkConfig = {
      autoRunOnRelease: true,
      minimumThreshold: 80,
      regressionRequired: true,
      performanceRequired: true,
      cacheRequired: true,
      lazyLoadRequired: true,
      benchmarkMax: 0,
      lastBaseline: '1.0.0-alpha',
      lastResult: { passRate: 0, duration: 0, date: now },
    }

    // 初始化 Explain 质量
    const explainQuality: ExplainQualityConfig = {
      naturalLanguage: true,
      noRepetition: true,
      noTemplate: true,
      noMechanical: true,
      professional: true,
      readable: true,
      evidenceBased: true,
      actionable: true,
      maxSimilarity: 0.3,
    }

    // 初始化可视化
    const visualization: VisualizationConfig = {
      enabled: [...VISUALIZATION_TYPES],
      chartProvider: 'echarts',
    }

    // 初始化性能目标
    const performance: PerformanceTarget = {
      normalChartMax: 150,
      explainMax: 500,
      benchmarkMax: 0,
      cacheEnabled: true,
      lazyLoadEnabled: true,
      concurrencyTarget: 100,
      currentPerformance: { normalChart: 120, explain: 380, benchmark: 0 },
    }

    // 初始化稳定性
    const stability: StabilityConfig = {
      errorMonitor: true,
      crashReport: true,
      healthCheck: true,
      logging: true,
      alerting: true,
      status: 'healthy',
    }

    // 初始化产品体系
    const products: ProductSystem = {
      coreEngineIndependent: true,
      products: INITIAL_PRODUCTS.map((p) => ({ ...p })),
      sharedCore: true,
    }

    // 初始化 API 体系
    const apiSystem: APISystem = {
      apis,
      version: '1.0.0',
      protocol: 'RESTful',
    }

    // 初始化商业化
    const commercial: CommercialPlan = {
      tiers: INITIAL_TIERS.map((t) => ({ ...t })),
      sharedCore: true,
    }

    // 初始化安全配置
    const security: SecurityConfig = {
      inputValidation: true,
      exceptionProtection: true,
      rateLimiting: true,
      cacheIsolation: true,
      logMasking: true,
      encryptionLevel: 'AES-256',
    }

    // 初始化开发规范
    const devStandard: DevStandard = {
      requiresDesign: true,
      requiresDocumentation: true,
      requiresTesting: true,
      requiresBenchmark: true,
      requiresReview: true,
      requiresAllPass: true,
    }

    // 初始化文档中心
    const documentation: DocumentationCenter = {
      modules: ['architecture', 'plugin', 'rule', 'strategy', 'knowledge', 'case', 'api'],
      autoGenerated: true,
      lastGenerated: now,
    }

    // 初始化路线图
    const roadmap: ReleaseRoadmap = {
      milestones: INITIAL_MILESTONES.map((m) => ({ ...m })),
      currentVersion: '1.0',
    }

    // 组装完整状态
    this.state = {
      version: '1.0.0',
      status: 'beta',
      freeze: {
        kernelFrozen: true,
        freezeDate: now,
        freezeReason: 'Release 1.0 进入稳定期，Kernel 不再接受非修复类变更',
        allowedChanges: ['bugfix-only', 'security-patch'],
      },
      accuracy,
      expertReview,
      benchmark,
      explainQuality,
      visualization,
      performance,
      stability,
      products,
      apis: apiSystem,
      commercial,
      security,
      devStandard,
      documentation,
      roadmap,
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 状态查询
  // ═══════════════════════════════════════════════════════════════

  /** 获取完整状态 */
  getState(): ReleaseState {
    return { ...this.state }
  }

  /** 获取冻结状态 */
  getFreezeStatus(): FreezeStatus {
    return { ...this.state.freeze }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. 准确率计划
  // ═══════════════════════════════════════════════════════════════

  /** 获取准确率计划 */
  getAccuracyProgram(): AccuracyProgram {
    return {
      ...this.state.accuracy,
      metrics: this.state.accuracy.metrics.map((m) => ({ ...m })),
    }
  }

  /** 记录单项准确率结果，返回是否成功 */
  recordAccuracyResult(metricId: string, score: number): boolean {
    const metric = this.state.accuracy.metrics.find((m) => m.id === metricId)
    if (!metric) return false
    if (score < 0 || score > 100) return false

    const oldScore = metric.currentScore
    metric.currentScore = round1(score)
    metric.caseCount++

    // 自动判断趋势
    if (metric.currentScore > oldScore + 0.5) {
      metric.trend = 'improving'
    } else if (metric.currentScore < oldScore - 0.5) {
      metric.trend = 'declining'
    } else {
      metric.trend = 'stable'
    }

    this.state.accuracy.totalCases = this.state.accuracy.metrics.reduce(
      (sum, m) => sum + m.caseCount,
      0
    )
    this.state.accuracy.lastUpdated = formatTime(new Date())
    return true
  }

  /** 新增准确率测试案例 */
  addAccuracyCase(category: 'expert' | 'textbook' | 'historical', count: number): void {
    if (count <= 0) return
    this.state.accuracy.totalCases += count
    switch (category) {
      case 'expert':
        this.state.accuracy.expertCases += count
        break
      case 'textbook':
        this.state.accuracy.textbookCases += count
        break
      case 'historical':
        this.state.accuracy.historicalCases += count
        break
    }
    this.state.accuracy.lastUpdated = formatTime(new Date())
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. 专家验证
  // ═══════════════════════════════════════════════════════════════

  /** 获取专家验证系统状态 */
  getExpertReview(): ExpertReviewSystem {
    return {
      ...this.state.expertReview,
      records: this.state.expertReview.records.map((r) => ({ ...r })),
    }
  }

  /** 记录专家验证，返回记录ID */
  recordExpertReview(review: Omit<ExpertReviewRecord, 'id' | 'timestamp'>): string {
    const id = uid()
    const record: ExpertReviewRecord = {
      ...review,
      id,
      timestamp: formatTime(new Date()),
    }
    this.state.expertReview.records.push(record)
    this.state.expertReview.totalReviews++

    // 统计正确率
    const correctCount = this.state.expertReview.records.filter(
      (r) => r.rating === 'correct'
    ).length
    this.state.expertReview.correctRate = round1(
      (correctCount / this.state.expertReview.totalReviews) * 100
    )

    // 维护活跃专家列表
    if (!this.state.expertReview.activeExperts.includes(review.expertName)) {
      this.state.expertReview.activeExperts.push(review.expertName)
    }

    return id
  }

  /** 应用修正（将指定验证记录标记为已修正），返回是否成功 */
  applyRevision(reviewId: string): boolean {
    const record = this.state.expertReview.records.find((r) => r.id === reviewId)
    if (!record) return false
    if (record.revisionApplied) return false
    record.revisionApplied = true
    this.state.expertReview.revisionCount++
    return true
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. Benchmark
  // ═══════════════════════════════════════════════════════════════

  /** 获取 Benchmark 配置 */
  getBenchmarkConfig(): BenchmarkConfig {
    return { ...this.state.benchmark }
  }

  /** 更新 Benchmark 运行结果 */
  updateBenchmarkResult(result: { passRate: number; duration: number }): void {
    this.state.benchmark.lastResult = {
      passRate: round1(result.passRate),
      duration: round1(result.duration),
      date: formatTime(new Date()),
    }
    // 自动调整 benchmarkMax 为当前耗时的 1.5 倍
    if (this.state.benchmark.lastResult.duration > 0) {
      this.state.benchmark.benchmarkMax = round1(
        this.state.benchmark.lastResult.duration * 1.5
      )
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. Explain 质量
  // ═══════════════════════════════════════════════════════════════

  /** 获取 Explain 质量配置 */
  getExplainQuality(): ExplainQualityConfig {
    return { ...this.state.explainQuality }
  }

  /** 更新 Explain 质量配置（部分更新） */
  updateExplainQuality(updates: Partial<ExplainQualityConfig>): void {
    this.state.explainQuality = { ...this.state.explainQuality, ...updates }
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. 性能
  // ═══════════════════════════════════════════════════════════════

  /** 获取性能目标 */
  getPerformanceTarget(): PerformanceTarget {
    return {
      ...this.state.performance,
      currentPerformance: { ...this.state.performance.currentPerformance },
    }
  }

  /** 更新性能目标（部分更新） */
  updatePerformance(updates: Partial<PerformanceTarget>): void {
    this.state.performance = { ...this.state.performance, ...updates }
  }

  // ═══════════════════════════════════════════════════════════════
  // 8. 稳定性
  // ═══════════════════════════════════════════════════════════════

  /** 获取稳定性状态 */
  getStabilityStatus(): StabilityConfig {
    return { ...this.state.stability }
  }

  /** 更新稳定性配置（部分更新） */
  updateStability(updates: Partial<StabilityConfig>): void {
    this.state.stability = { ...this.state.stability, ...updates }
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. API 体系
  // ═══════════════════════════════════════════════════════════════

  /** 获取 API 体系 */
  getAPISystem(): APISystem {
    return {
      ...this.state.apis,
      apis: this.state.apis.apis.map((a) => ({ ...a })),
    }
  }

  /** 新增 API 定义 */
  addAPI(api: Omit<APIDefinition, 'status'>): void {
    this.state.apis.apis.push({ ...api, status: 'planned' })
  }

  /** 更新 API 状态，返回是否成功 */
  updateAPIStatus(apiId: string, status: APIDefinition['status']): boolean {
    const api = this.state.apis.apis.find((a) => a.id === apiId)
    if (!api) return false
    api.status = status
    return true
  }

  // ═══════════════════════════════════════════════════════════════
  // 11. 商业化
  // ═══════════════════════════════════════════════════════════════

  /** 获取商业化计划 */
  getCommercialPlan(): CommercialPlan {
    return {
      ...this.state.commercial,
      tiers: this.state.commercial.tiers.map((t) => ({ ...t })),
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 12. 安全
  // ═══════════════════════════════════════════════════════════════

  /** 获取安全配置 */
  getSecurityConfig(): SecurityConfig {
    return { ...this.state.security }
  }

  // ═══════════════════════════════════════════════════════════════
  // 15. 版本路线图
  // ═══════════════════════════════════════════════════════════════

  /** 获取版本路线图 */
  getRoadmap(): ReleaseRoadmap {
    return {
      ...this.state.roadmap,
      milestones: this.state.roadmap.milestones.map((m) => ({ ...m })),
    }
  }

  /** 推进到下一个版本，返回是否成功 */
  advanceToNextRelease(): boolean {
    const currentIdx = this.state.roadmap.milestones.findIndex(
      (m) => m.status === 'current'
    )
    if (currentIdx === -1) return false
    if (currentIdx >= this.state.roadmap.milestones.length - 1) return false

    // 将当前版本标记为已完成（不再 current）
    // 将下一个版本标记为 current
    this.state.roadmap.milestones[currentIdx].status = 'planned'
    this.state.roadmap.milestones[currentIdx + 1].status = 'current'
    this.state.roadmap.currentVersion = this.state.roadmap.milestones[currentIdx + 1].version
    this.state.version = this.state.roadmap.currentVersion + '.0'
    return true
  }

  // ═══════════════════════════════════════════════════════════════
  // 开发原则
  // ═══════════════════════════════════════════════════════════════

  /** 获取开发原则列表 */
  getPrinciples(): string[] {
    return [...DEVELOPMENT_PRINCIPLES]
  }

  /** 获取最终目标 */
  getFinalGoal(): string {
    return FINAL_GOAL
  }

  // ═══════════════════════════════════════════════════════════════
  // 报告生成
  // ═══════════════════════════════════════════════════════════════

  /**
   * 获取 Release 1.0 最终报告
   * 包含完整状态快照、就绪度检查、综合评分、改进建议与中文报告正文
   */
  getReport(): ReleaseReport {
    const now = formatTime(new Date())
    const state = this.getState()

    // ---- 就绪度检查 ----
    const readiness = this.computeReadiness(state)

    // ---- 综合评分 ----
    const overallScore = this.computeOverallScore(state, readiness)

    // ---- 改进建议 ----
    const suggestions = this.generateSuggestions(state, readiness, overallScore)

    // ---- 古籍引用（随机选取） ----
    const classicalRef = pick(CLASSICAL_REFS)

    // ---- 生成中文报告正文 ----
    const report = this.generateChineseReport(state, readiness, overallScore, suggestions, classicalRef)

    return {
      generatedAt: now,
      state,
      overallScore,
      readiness,
      principles: this.getPrinciples(),
      suggestions,
      report,
      classicalRef,
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 内部计算方法
  // ═══════════════════════════════════════════════════════════════

  /** 计算就绪度 */
  private computeReadiness(state: ReleaseState): ReleaseReport['readiness'] {
    // 引擎就绪：Kernel已冻结
    const engine = state.freeze.kernelFrozen

    // 准确率就绪：所有指标 caseCount > 0 且平均分 >= 60
    const avgAccuracy =
      state.accuracy.metrics.length > 0
        ? state.accuracy.metrics.reduce((s, m) => s + m.currentScore, 0) /
          state.accuracy.metrics.length
        : 0
    const allMetricsTested = state.accuracy.metrics.every((m) => m.caseCount > 0)
    const accuracy = allMetricsTested && avgAccuracy >= 60

    // 稳定性就绪：状态为 healthy
    const stability = state.stability.status === 'healthy'

    // 性能就绪：排盘和 Explain 均在目标内
    const perf = state.performance.currentPerformance
    const performance =
      perf.normalChart <= state.performance.normalChartMax &&
      perf.explain <= state.performance.explainMax

    // 文档就绪：至少有 5 个模块且已自动生成
    const documentation =
      state.documentation.modules.length >= 5 && state.documentation.autoGenerated

    // 整体就绪：所有子项都通过
    const overall = engine && accuracy && stability && performance && documentation

    return { engine, accuracy, stability, performance, documentation, overall }
  }

  /** 计算综合评分（0-100） */
  private computeOverallScore(
    state: ReleaseState,
    readiness: ReleaseReport['readiness']
  ): number {
    let score = 0
    let weight = 0

    // 1. 准确率（权重 30%）
    const avgAcc =
      state.accuracy.metrics.length > 0
        ? state.accuracy.metrics.reduce((s, m) => s + m.currentScore, 0) /
          state.accuracy.metrics.length
        : 0
    score += avgAcc * 30
    weight += 30

    // 2. Benchmark（权重 15%）
    score += state.benchmark.lastResult.passRate * 15
    weight += 15

    // 3. 性能达标（权重 15%）
    const perfScore = this.computePerformanceScore(state.performance)
    score += perfScore * 15
    weight += 15

    // 4. 稳定性（权重 10%）
    const stabScore = state.stability.status === 'healthy' ? 100 :
      state.stability.status === 'degraded' ? 50 : 0
    score += stabScore * 10
    weight += 10

    // 5. 专家验证（权重 10%）
    score += state.expertReview.correctRate * 10
    weight += 10

    // 6. Explain 质量（权重 10%）
    const eqScore = this.computeExplainQualityScore(state.explainQuality)
    score += eqScore * 10
    weight += 10

    // 7. 就绪度检查（权重 10%）
    const readyCount = [
      readiness.engine,
      readiness.accuracy,
      readiness.stability,
      readiness.performance,
      readiness.documentation,
    ].filter(Boolean).length
    score += (readyCount / 5) * 100 * 10
    weight += 10

    return round1(score / weight)
  }

  /** 计算性能评分 */
  private computePerformanceScore(performance: PerformanceTarget): number {
    let score = 100
    const cp = performance.currentPerformance

    // 排盘超时扣分
    if (cp.normalChart > performance.normalChartMax) {
      score -= 30
    } else if (cp.normalChart > performance.normalChartMax * 0.8) {
      score -= 10
    }

    // Explain 超时扣分
    if (cp.explain > performance.explainMax) {
      score -= 30
    } else if (cp.explain > performance.explainMax * 0.8) {
      score -= 10
    }

    // 缓存和懒加载未启用扣分
    if (!performance.cacheEnabled) score -= 10
    if (!performance.lazyLoadEnabled) score -= 10

    return Math.max(0, score)
  }

  /** 计算 Explain 质量评分 */
  private computeExplainQualityScore(eq: ExplainQualityConfig): number {
    const checks = [
      eq.naturalLanguage,
      eq.noRepetition,
      eq.noTemplate,
      eq.noMechanical,
      eq.professional,
      eq.readable,
      eq.evidenceBased,
      eq.actionable,
    ]
    const passed = checks.filter(Boolean).length
    // 相似度达标加分
    const similarityOk = eq.maxSimilarity <= 0.3
    const baseScore = (passed / checks.length) * 100
    return round1(similarityOk ? Math.min(100, baseScore + 5) : baseScore * 0.9)
  }

  /** 生成改进建议 */
  private generateSuggestions(
    state: ReleaseState,
    readiness: ReleaseReport['readiness'],
    overallScore: number
  ): string[] {
    const suggestions: string[] = []

    if (overallScore < 60) {
      suggestions.push('整体评分偏低，建议优先排查准确率核心指标，确保格局判断和喜用神分析的案例覆盖充分')
    }

    if (!readiness.engine) {
      suggestions.push('Kernel 尚未冻结，建议尽快进入冻结状态以保障稳定性')
    }

    if (!readiness.accuracy) {
      suggestions.push('准确率指标尚未全部通过验证，建议增加专家案例和教科书案例的录入与测试')
    }

    // 准确率指标低于目标的项
    for (const metric of state.accuracy.metrics) {
      if (metric.currentScore < metric.targetScore - 10) {
        suggestions.push(
          `"${metric.name}"当前得分 ${metric.currentScore}，距目标 ${metric.targetScore} 差距较大，建议重点优化`
        )
      }
    }

    if (!readiness.stability) {
      suggestions.push('稳定性状态异常，建议排查错误监控和健康检查')
    }

    if (!readiness.performance) {
      suggestions.push('性能未达标，建议检查排盘和 Explain 的耗时瓶颈，优化缓存策略')
    }

    // Benchmark 通过率低
    if (state.benchmark.lastResult.passRate < 80) {
      suggestions.push(
        `Benchmark 通过率仅 ${state.benchmark.lastResult.passRate}%，低于 80% 阈值，需修复失败用例`
      )
    }

    // 专家验证不足
    if (state.expertReview.totalReviews < 50) {
      suggestions.push('专家验证记录不足 50 条，建议邀请更多专家参与验证')
    }

    // API 未全部发布
    const unreleased = state.apis.apis.filter((a) => a.status !== 'released')
    if (unreleased.length > 0) {
      suggestions.push(
        `尚有 ${unreleased.length} 个 API 未达到 released 状态：${unreleased.map((a) => a.name).join('、')}`
      )
    }

    // 文档模块不足
    if (state.documentation.modules.length < 7) {
      suggestions.push(`文档中心仅有 ${state.documentation.modules.length} 个模块，建议补全全部 7 个模块文档`)
    }

    if (overallScore >= 85) {
      suggestions.push('整体质量优秀，可考虑推进至 Release 1.1 准确率提升阶段')
    }

    // 补充随机古籍原则
    suggestions.push(pickN(CLASSICAL_REFS, 2).map((r) => `古籍云：${r}`).join('；'))

    return suggestions
  }

  /** 生成中文报告正文 */
  private generateChineseReport(
    state: ReleaseState,
    readiness: ReleaseReport['readiness'],
    overallScore: number,
    suggestions: string[],
    classicalRef: string
  ): string {
    const lines: string[] = []

    lines.push('═══════════════════════════════════════════════════════════════')
    lines.push('  玄风门 XuanFeng Core Engine Release 1.0 — 最终发布报告')
    lines.push('═══════════════════════════════════════════════════════════════')
    lines.push('')

    // ---- 1. 版本信息与冻结状态 ----
    lines.push('【一、版本信息与冻结状态】')
    lines.push(`  版本号：${state.version}`)
    lines.push(`  发布状态：${this.translateReleaseStatus(state.status)}`)
    lines.push(`  Kernel 冻结：${state.freeze.kernelFrozen ? '是' : '否'}`)
    lines.push(`  冻结日期：${state.freeze.freezeDate}`)
    lines.push(`  冻结原因：${state.freeze.freezeReason}`)
    lines.push(`  允许变更：${state.freeze.allowedChanges.join('、')}`)
    lines.push('')

    // ---- 2. 准确率统计 ----
    lines.push('【二、准确率统计】')
    lines.push(`  总案例数：${state.accuracy.totalCases}`)
    lines.push(`  专家案例：${state.accuracy.expertCases}  |  教科书案例：${state.accuracy.textbookCases}  |  历史案例：${state.accuracy.historicalCases}`)
    lines.push(`  最后更新：${state.accuracy.lastUpdated}`)
    lines.push('  各项指标：')
    for (const m of state.accuracy.metrics) {
      const trendLabel = m.trend === 'improving' ? '上升' : m.trend === 'declining' ? '下降' : '稳定'
      lines.push(
        `    ${m.name}：${m.currentScore}/${m.targetScore}（${trendLabel}，${m.caseCount} 案例，${m.expertValidated} 专家验证）`
      )
    }
    lines.push('')

    // ---- 3. 专家验证结果 ----
    lines.push('【三、专家验证结果】')
    lines.push(`  总验证次数：${state.expertReview.totalReviews}`)
    lines.push(`  正确率：${state.expertReview.correctRate}%`)
    lines.push(`  已应用修正：${state.expertReview.revisionCount}`)
    lines.push(`  活跃专家：${state.expertReview.activeExperts.length > 0 ? state.expertReview.activeExperts.join('、') : '暂无'}`)
    if (state.expertReview.records.length > 0) {
      lines.push('  最近验证记录（最近3条）：')
      const recent = state.expertReview.records.slice(-3).reverse()
      for (const r of recent) {
        const ratingLabel = r.rating === 'correct' ? '正确' : r.rating === 'partial' ? '部分正确' : '不正确'
        lines.push(
          `    [${r.expertLevel}] ${r.expertName} — ${r.dimension}：${ratingLabel} — ${r.comment}`
        )
      }
    }
    lines.push('')

    // ---- 4. Benchmark 配置 ----
    lines.push('【四、Benchmark 配置】')
    lines.push(`  自动运行：${state.benchmark.autoRunOnRelease ? '是' : '否'}`)
    lines.push(`  最低通过率：${state.benchmark.minimumThreshold}%`)
    lines.push(`  回归测试：${state.benchmark.regressionRequired ? '必选' : '可选'}`)
    lines.push(`  性能测试：${state.benchmark.performanceRequired ? '必选' : '可选'}`)
    lines.push(`  缓存测试：${state.benchmark.cacheRequired ? '必选' : '可选'}`)
    lines.push(`  懒加载测试：${state.benchmark.lazyLoadRequired ? '必选' : '可选'}`)
    lines.push(`  上次基准：${state.benchmark.lastBaseline}`)
    lines.push(`  上次结果：通过率 ${state.benchmark.lastResult.passRate}%，耗时 ${state.benchmark.lastResult.duration}ms（${state.benchmark.lastResult.date}）`)
    lines.push('')

    // ---- 5. Explain 质量配置 ----
    lines.push('【五、Explain 质量配置】')
    lines.push(`  自然语言：${state.explainQuality.naturalLanguage ? '启用' : '禁用'}`)
    lines.push(`  无重复：${state.explainQuality.noRepetition ? '启用' : '禁用'}`)
    lines.push(`  无模板化：${state.explainQuality.noTemplate ? '启用' : '禁用'}`)
    lines.push(`  无机械感：${state.explainQuality.noMechanical ? '启用' : '禁用'}`)
    lines.push(`  专业性：${state.explainQuality.professional ? '启用' : '禁用'}`)
    lines.push(`  可读性：${state.explainQuality.readable ? '启用' : '禁用'}`)
    lines.push(`  基于证据：${state.explainQuality.evidenceBased ? '启用' : '禁用'}`)
    lines.push(`  可操作性：${state.explainQuality.actionable ? '启用' : '禁用'}`)
    lines.push(`  最大相似度：${state.explainQuality.maxSimilarity}`)
    lines.push('')

    // ---- 6. 性能达标情况 ----
    lines.push('【六、性能达标情况】')
    const perf = state.performance
    lines.push(`  排盘耗时：${perf.currentPerformance.normalChart}ms / 目标 ${perf.normalChartMax}ms（${perf.currentPerformance.normalChart <= perf.normalChartMax ? '达标' : '超标'}）`)
    lines.push(`  Explain 耗时：${perf.currentPerformance.explain}ms / 目标 ${perf.explainMax}ms（${perf.currentPerformance.explain <= perf.explainMax ? '达标' : '超标'}）`)
    lines.push(`  Benchmark 耗时：${perf.currentPerformance.benchmark}ms${perf.benchmarkMax > 0 ? ` / 目标 ${perf.benchmarkMax}ms` : '（自动）'}`)
    lines.push(`  缓存：${perf.cacheEnabled ? '已启用' : '未启用'}  |  懒加载：${perf.lazyLoadEnabled ? '已启用' : '未启用'}`)
    lines.push(`  并发目标：${perf.concurrencyTarget}`)
    lines.push('')

    // ---- 7. 稳定性状态 ----
    lines.push('【七、稳定性状态】')
    const stabLabels: Record<string, string> = {
      healthy: '健康',
      degraded: '降级',
      down: '不可用',
    }
    lines.push(`  系统状态：${stabLabels[state.stability.status]}`)
    lines.push(`  错误监控：${state.stability.errorMonitor ? '启用' : '禁用'}`)
    lines.push(`  崩溃报告：${state.stability.crashReport ? '启用' : '禁用'}`)
    lines.push(`  健康检查：${state.stability.healthCheck ? '启用' : '禁用'}`)
    lines.push(`  日志记录：${state.stability.logging ? '启用' : '禁用'}`)
    lines.push(`  告警通知：${state.stability.alerting ? '启用' : '禁用'}`)
    lines.push('')

    // ---- 8. 产品体系概览 ----
    lines.push('【八、产品体系概览】')
    lines.push(`  核心引擎独立：${state.products.coreEngineIndependent ? '是' : '否'}`)
    lines.push(`  共享核心引擎：${state.products.sharedCore ? '是' : '否'}`)
    lines.push('  产品列表：')
    for (const p of state.products.products) {
      const statusLabel = p.status === 'active' ? '活跃' : p.status === 'planned' ? '计划中' : p.status
      lines.push(`    ${p.name}（${p.system}）— ${statusLabel}`)
    }
    lines.push('')

    // ---- 9. API 列表 ----
    lines.push('【九、API 列表】')
    lines.push(`  API 版本：${state.apis.version}  |  协议：${state.apis.protocol}`)
    for (const api of state.apis.apis) {
      const statusLabel = this.translateAPIStatus(api.status)
      lines.push(`    ${api.name}（${api.category}）— ${statusLabel}：${api.description}`)
    }
    lines.push('')

    // ---- 10. 商业化层级 ----
    lines.push('【十、商业化层级】')
    lines.push(`  共享核心引擎：${state.commercial.sharedCore ? '是' : '否'}`)
    for (const tier of state.commercial.tiers) {
      lines.push(`  [${tier.name}] ${tier.price}`)
      lines.push(`    功能：${tier.features.join('、')}`)
      lines.push(`    限制：每日分析 ${tier.limits.dailyAnalysis === -1 ? '无限制' : tier.limits.dailyAnalysis + '次'}，` +
        `API调用 ${tier.limits.apiCallsPerDay === -1 ? '无限制' : tier.limits.apiCallsPerDay + '次/日'}`)
    }
    lines.push('')

    // ---- 11. 安全配置 ----
    lines.push('【十一、安全配置】')
    lines.push(`  输入验证：${state.security.inputValidation ? '启用' : '禁用'}`)
    lines.push(`  异常保护：${state.security.exceptionProtection ? '启用' : '禁用'}`)
    lines.push(`  速率限制：${state.security.rateLimiting ? '启用' : '禁用'}`)
    lines.push(`  缓存隔离：${state.security.cacheIsolation ? '启用' : '禁用'}`)
    lines.push(`  日志脱敏：${state.security.logMasking ? '启用' : '禁用'}`)
    lines.push(`  加密等级：${state.security.encryptionLevel}`)
    lines.push('')

    // ---- 12. 开发规范 ----
    lines.push('【十二、开发规范】')
    lines.push(`  设计文档：${state.devStandard.requiresDesign ? '必须' : '可选'}`)
    lines.push(`  代码文档：${state.devStandard.requiresDocumentation ? '必须' : '可选'}`)
    lines.push(`  测试：${state.devStandard.requiresTesting ? '必须' : '可选'}`)
    lines.push(`  Benchmark：${state.devStandard.requiresBenchmark ? '必须' : '可选'}`)
    lines.push(`  代码审查：${state.devStandard.requiresReview ? '必须' : '可选'}`)
    lines.push(`  全部通过才可发布：${state.devStandard.requiresAllPass ? '是' : '否'}`)
    lines.push('')

    // ---- 13. 文档中心 ----
    lines.push('【十三、文档中心】')
    lines.push(`  模块数量：${state.documentation.modules.length}`)
    lines.push(`  模块列表：${state.documentation.modules.join('、')}`)
    lines.push(`  自动生成：${state.documentation.autoGenerated ? '是' : '否'}`)
    lines.push(`  最后生成：${state.documentation.lastGenerated}`)
    lines.push('')

    // ---- 14. 版本路线图 ----
    lines.push('【十四、版本路线图】')
    lines.push(`  当前版本：${state.roadmap.currentVersion}`)
    for (const ms of state.roadmap.milestones) {
      const statusIcon = ms.status === 'current' ? '当前' : ms.status === 'planned' ? '计划' : '未来'
      lines.push(`    ${ms.version} — ${ms.name}（${ms.target}）[${statusIcon}]`)
      if (ms.dependencies.length > 0) {
        lines.push(`      依赖：${ms.dependencies.join('、')}`)
      }
    }
    lines.push('')

    // ---- 15. 开发原则 ----
    lines.push('【十五、开发原则】')
    for (const p of DEVELOPMENT_PRINCIPLES) {
      lines.push(`  ${p}`)
    }
    lines.push('')

    // ---- 16. 就绪度与评分 ----
    lines.push('【十六、就绪度与评分】')
    lines.push(`  引擎就绪：${readiness.engine ? '通过' : '未通过'}`)
    lines.push(`  准确率就绪：${readiness.accuracy ? '通过' : '未通过'}`)
    lines.push(`  稳定性就绪：${readiness.stability ? '通过' : '未通过'}`)
    lines.push(`  性能就绪：${readiness.performance ? '通过' : '未通过'}`)
    lines.push(`  文档就绪：${readiness.documentation ? '通过' : '未通过'}`)
    lines.push(`  整体就绪：${readiness.overall ? '通过' : '未通过'}`)
    lines.push(`  综合评分：${overallScore}/100`)
    lines.push('')

    // ---- 17. 最终目标 ----
    lines.push('【十七、最终目标】')
    lines.push(`  ${FINAL_GOAL}`)
    lines.push('')

    // ---- 18. 古籍引用 ----
    lines.push('【古籍引用】')
    lines.push(`  ${classicalRef}`)
    lines.push('')

    // ---- 19. 改进建议 ----
    lines.push('【改进建议】')
    for (let i = 0; i < suggestions.length; i++) {
      lines.push(`  ${i + 1}. ${suggestions[i]}`)
    }
    lines.push('')

    lines.push('═══════════════════════════════════════════════════════════════')
    lines.push(`  报告生成时间：${formatTime(new Date())}`)
    lines.push('═══════════════════════════════════════════════════════════════')

    return lines.join('\n')
  }

  /** 翻译发布状态 */
  private translateReleaseStatus(status: ReleaseStatus): string {
    const map: Record<ReleaseStatus, string> = {
      alpha: '内测版',
      beta: '公测版',
      rc: '候选发布',
      stable: '正式版',
      frozen: '冻结版',
    }
    return map[status] || status
  }

  /** 翻译 API 状态 */
  private translateAPIStatus(status: APIDefinition['status']): string {
    const map: Record<APIDefinition['status'], string> = {
      planned: '计划中',
      implemented: '已实现',
      tested: '已测试',
      released: '已发布',
    }
    return map[status] || status
  }
}
