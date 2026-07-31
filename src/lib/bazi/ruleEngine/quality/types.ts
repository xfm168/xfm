/**
 * C8 Rule Quality Center（规则质量中心）
 * 
 * 负责：覆盖率分析、冲突检测、依赖分析、性能分析、准确率看板、可解释评分
 */

/** C8-1 覆盖率报告 */
export interface CoverageReport {
  /** 统计时间 */
  generatedAt: string
  /** 总案例数 */
  totalCases: number
  /** 总规则数 */
  totalRules: number
  /** 被至少一条规则命中的案例数 */
  coveredCases: number
  /** 未被任何规则命中的案例 ID 列表 */
  uncoveredCases: string[]
  /** 覆盖率 0~1 */
  coverageRate: number
  /** 每条规则的命中次数统计 */
  ruleHitCount: Array<{
    ruleId: string
    ruleName: string
    hitCount: number
    /** 命中率 0~1 */
    hitRate: number
  }>
  /** 永远不会命中的规则（dead rules） */
  deadRules: Array<{
    ruleId: string
    ruleName: string
    reason: string
  }>
}

/** C8-3 依赖图节点 */
export interface DependencyGraphNode {
  ruleId: string
  ruleName?: string
  /** 该节点依赖的规则 ID 列表 */
  dependencies: string[]
  /** 依赖该规则的规则 ID 列表（反向依赖） */
  dependents: string[]
  /** 是否为孤立节点（无依赖也无被依赖） */
  isIsolated: boolean
}

/** C8-3 循环依赖检测 */
export interface CircularDependency {
  /** 循环路径：ruleA → ruleB → ruleA */
  cycle: string[]
  /** 循环长度 */
  length: number
}

/** C8-3 依赖分析报告 */
export interface DependencyReport {
  generatedAt: string
  /** 依赖图节点列表 */
  nodes: DependencyGraphNode[]
  /** 检测到的循环依赖 */
  circularDependencies: CircularDependency[]
  /** 孤立规则（无依赖也无被依赖） */
  isolatedRules: Array<{ ruleId: string; ruleName?: string }>
  /** 拓扑排序结果（合法的执行顺序） */
  topologicalOrder: string[]
  /** 最大依赖深度 */
  maxDepth: number
  /** 统计 */
  stats: {
    totalNodes: number
    totalEdges: number
    isolatedCount: number
    circularCount: number
  }
}

/** C8-5 准确率看板 */
export interface AccuracyDashboard {
  generatedAt: string
  /** 总规则数 */
  totalRules: number
  /** 按规则类别统计 */
  byCategory: Array<{
    category: string
    totalRules: number
    /** 准确率 0~1 */
    accuracy: number
    /** 通过案例数 */
    passedCases: number
    /** 总校验案例数 */
    totalCases: number
    /** 古籍吻合率 */
    classicMatchRate: number
  }>
  /** 古籍吻合率（总体） */
  overallClassicMatchRate: number
  /** Evidence 完整率 */
  evidenceCompletenessRate: number
  /** KnowledgeGraph 引用率 */
  knowledgeReferenceRate: number
  /** Sandbox 通过率 */
  sandboxPassRate: number
  /** 总体准确率 */
  overallAccuracy: number
}

/** C8-6 可解释评分细则 */
export interface ExplainScoreDetail {
  /** 是否引用经典（classicEvidence 非空） */
  hasClassicEvidence: boolean
  /** 引用经典数量 */
  classicEvidenceCount: number
  /** 是否引用 Evidence */
  hasEvidence: boolean
  /** 是否引用 KnowledgeGraph */
  hasKnowledgeReference: boolean
  /** 是否存在争议说明（conflictOpinion 或 controversyNote） */
  hasControversyNote: boolean
  /** 是否输出可信度 */
  hasConfidence: boolean
  /** 是否有 trace */
  hasTrace: boolean
  /** 是否有 explain() 方法 */
  hasExplain: boolean
}

/** C8-6 可解释评分结果 */
export interface ExplainScore {
  ruleId: string
  ruleName: string
  /** 总分 0~100 */
  score: number
  /** 评分等级 */
  level: 'A' | 'B' | 'C' | 'D' | 'F'
  /** 评分细则 */
  details: ExplainScoreDetail
  /** 失分项 */
  deductions: string[]
  /** 建议 */
  suggestions: string[]
}

/** C8-6 Rule Health Report（最终汇总报告） */
export interface RuleHealthReport {
  generatedAt: string
  /** 报告版本 */
  version: string
  /** 总规则数 */
  totalRules: number

  /** C8-1 覆盖率 */
  coverage: {
    coverageRate: number
    uncoveredCasesCount: number
    deadRulesCount: number
  }

  /** C8-2 冲突 */
  conflicts: {
    totalConflicts: number
    highSeverityCount: number
  }

  /** C8-3 依赖 */
  dependencies: {
    maxDepth: number
    circularCount: number
    isolatedCount: number
    topologicalOrderLength: number
  }

  /** C8-4 性能 */
  performance: {
    avgDurationMs: number
    slowestRuleId?: string
    slowestDurationMs?: number
    totalExecutions: number
  }

  /** C8-5 准确率 */
  accuracy: {
    overallAccuracy: number
    classicMatchRate: number
    evidenceCompletenessRate: number
    knowledgeReferenceRate: number
    sandboxPassRate: number
  }

  /** C8-6 可解释性 */
  explainability: {
    avgScore: number
    aLevelCount: number
    bLevelCount: number
    cLevelCount: number
    dLevelCount: number
    fLevelCount: number
    /** Explain Score 低于 60 分的规则 */
    lowScoreRules: Array<{ ruleId: string; ruleName: string; score: number }>
  }

  /** 总体健康度 0~100 */
  overallHealthScore: number
  /** 总体健康等级 */
  overallHealthLevel: 'A' | 'B' | 'C' | 'D' | 'F'
  /** 关键问题 */
  criticalIssues: string[]
  /** 发布建议 */
  releaseRecommendation: 'approve' | 'approve_with_warnings' | 'reject'
}

/** C8-2 规则冲突类型 */
export type RuleConflictType =
  | 'concurrent'    // 两个规则同时成立（可能需要互斥）
  | 'contradictory'  // 两个规则互相否定（结果相反）
  | 'priority_error' // 优先级设置错误
  | 'overlap'        // 两个规则条件高度重叠

/** C8-2 规则冲突 */
export interface RuleConflict {
  /** 冲突类型 */
  type: RuleConflictType
  /** 冲突涉及的规则 ID */
  ruleIds: string[]
  /** 冲突描述 */
  description: string
  /** 在哪些案例中冲突 */
  affectedCases: string[]
  /** 建议的解决策略 */
  suggestion: string
  /** 严重程度 */
  severity: 'low' | 'medium' | 'high'
}

/** C8-2 冲突检测报告 */
export interface ConflictReport {
  generatedAt: string
  totalConflicts: number
  conflicts: RuleConflict[]
  /** 按类型统计 */
  byType: Record<RuleConflictType, number>
  /** 按严重程度统计 */
  bySeverity: Record<string, number>
}

/** C8-4 规则性能统计 */
export interface RulePerformanceStat {
  ruleId: string
  ruleName: string
  /** 平均执行耗时（毫秒） */
  avgDurationMs: number
  /** 最大执行耗时 */
  maxDurationMs: number
  /** 最小执行耗时 */
  minDurationMs: number
  /** 总执行次数 */
  totalExecutions: number
  /** 命中次数 */
  hitCount: number
  /** 命中率 */
  hitRate: number
  /** 被引用次数（被 Evidence 引用） */
  evidenceRefCount: number
}

/** C8-4 性能报告 */
export interface PerformanceReport {
  generatedAt: string
  totalRules: number
  totalExecutions: number
  /** 所有规则平均耗时 */
  avgDurationMs: number
  /** 最慢的 10 条规则 */
  slowestRules: RulePerformanceStat[]
  /** 最快的 10 条规则 */
  fastestRules: RulePerformanceStat[]
  /** 全部规则性能统计 */
  allStats: RulePerformanceStat[]
  /** 性能阈值建议 */
  thresholdSuggestion: {
    /** 建议单规则超时阈值（毫秒） */
    timeoutMs: number
    /** 建议总推演超时（毫秒） */
    totalTimeoutMs: number
  }
}
