/**
 * P0-5 Foundation Layer — 统一类型层
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 *
 * 所有 Foundation 模块共享的类型定义
 */

// ============================================================
// Part 1: RuleDSL 类型
// ============================================================

/** DSL 条件表达式操作符 */
export type DSLConditionOperator =
  | '>=' | '<=' | '>' | '<' | '==' | '!='
  | 'in' | 'not_in'
  | 'contains' | 'not_contains'
  | 'and' | 'or' | 'not'

/** DSL 条件表达式 */
export interface DSLCondition {
  /** 字段路径（如 'dayStrength', 'count.木', 'monthZhi'） */
  field: string
  /** 操作符 */
  operator: DSLConditionOperator
  /** 比较值 */
  value: any
  /** 自然语言描述（UI 可读） */
  description?: string
}

/** DSL 条件组（AND/OR 组合） */
export interface DSLConditionGroup {
  /** 组合方式 */
  logic: 'and' | 'or'
  /** 子条件（可以是 DSLCondition 或嵌套 DSLConditionGroup） */
  conditions: Array<DSLCondition | DSLConditionGroup>
}

/** DSL 支持/反对的五行权重 */
export interface DSLWuxingAction {
  /** 五行 */
  wuxing: string
  /** 权重/分数 */
  score: number
  /** 原因 */
  reason?: string
}

/** DSL 规则声明格式（声明式，不含代码） */
export interface RuleDSLDefinition {
  /** 规则 ID（全局唯一，如 BALANCE-STRONG-001） */
  id: string
  /** 规则名称 */
  name: string
  /** 版本号（语义化） */
  version: string
  /** 来源古籍 */
  source: string[]
  /** 优先级（数字越大越优先） */
  priority: number
  /** 规则类别 */
  category: string
  /** 规则描述 */
  description: string
  /** 成立条件 */
  conditions: DSLConditionGroup
  /** 支持的五行（喜用） */
  support?: DSLWuxingAction[]
  /** 反对的五行（忌） */
  oppose?: DSLWuxingAction[]
  /** 结论说明 */
  result: string
  /** 置信度权重 */
  confidence?: {
    components?: Record<string, number>
    note?: string
  }
  /** 依赖的规则 ID */
  dependencies?: string[]
  /** 冲突策略 */
  conflictStrategy?: string
  /** 古籍引用 */
  classicEvidence?: Array<{
    classicName: string
    chapter?: string
    quotedText: string
    supports: string
  }>
  /** 标签 */
  tags?: string[]
  /** 作者 */
  author?: string
  /** 审核人 */
  reviewer?: string
}

// ============================================================
// Part 4: Rule Version 类型
// ============================================================

/** 规则修改记录 */
export interface RuleModifyRecord {
  /** 修改时间 */
  timestamp: number
  /** 操作类型 */
  action: 'create' | 'update' | 'activate' | 'deprecate' | 'rollback'
  /** 操作人 */
  operator: string
  /** 变更前的版本号 */
  fromVersion?: string
  /** 变更后的版本号 */
  toVersion?: string
  /** 变更摘要 */
  summary: string
  /** 变更字段（哪些字段被修改） */
  changedFields?: string[]
}

/** 规则准确率历史记录 */
export interface RuleAccuracyHistoryEntry {
  /** 评估时间 */
  timestamp: number
  /** 样本数 */
  sampleSize: number
  /** 命中率 */
  hitRate: number
  /** 误判率 */
  misjudgeRate: number
  /** 准确率总分 */
  accuracyScore: number
  /** 评估版本 */
  ruleVersion: string
}

/** 规则完整版本记录 */
export interface RuleVersionRecord {
  /** 规则 ID */
  ruleId: string
  /** 当前版本号 */
  currentVersion: string
  /** 状态 */
  status: 'active' | 'sandbox' | 'deprecated'
  /** 修改历史 */
  modifyHistory: RuleModifyRecord[]
  /** 准确率历史 */
  accuracyHistory: RuleAccuracyHistoryEntry[]
  /** 版本快照（按版本号存储 DSL 定义） */
  snapshots: Record<string, RuleDSLDefinition>
  /** 创建时间 */
  createdAt: number
  /** 最后修改时间 */
  lastModifiedAt: number
}

// ============================================================
// Part 5: ReviewCenter 类型
// ============================================================

/** 审核维度 */
export type ReviewDimension =
  | 'classic'       // 古籍审核
  | 'accuracy'      // 准确率审核
  | 'conflict'      // 冲突审核
  | 'explain'       // Explain 审核
  | 'quality'       // Quality 审核

/** 审核状态 */
export type ReviewStatus = 'pending' | 'passed' | 'failed' | 'warning'

/** 单维度审核结果 */
export interface ReviewDimensionResult {
  /** 审核维度 */
  dimension: ReviewDimension
  /** 审核状态 */
  status: ReviewStatus
  /** 分数 0~100 */
  score: number
  /** 审核意见 */
  comments: string[]
  /** 发现的问题 */
  issues: string[]
}

/** 完整审核报告 */
export interface ReviewReport {
  /** 规则 ID */
  ruleId: string
  /** 规则版本 */
  ruleVersion: string
  /** 审核时间 */
  reviewedAt: number
  /** 审核人 */
  reviewer: string
  /** 各维度审核结果 */
  dimensions: ReviewDimensionResult[]
  /** 总体审核状态 */
  overallStatus: ReviewStatus
  /** 总分 */
  totalScore: number
  /** 是否通过（可进入正式库） */
  approved: boolean
  /** 审核摘要 */
  summary: string
}

// ============================================================
// Part 6: Knowledge Benchmark 类型
// ============================================================

/** 知识稳定性等级 */
export type KnowledgeStability = 'stable' | 'experimental' | 'deprecated'

/** 规则知识基准 */
export interface RuleKnowledgeBenchmark {
  /** 规则 ID */
  ruleId: string
  /** 稳定性等级 */
  stability: KnowledgeStability
  /** 古籍符合度 0~1 */
  classicConformance: number
  /** 现代命例符合度 0~1 */
  modernCaseConformance: number
  /** 争议度 0~1 */
  controversyLevel: number
  /** 支持的古籍数量 */
  classicSupportCount: number
  /** 反对的古籍数量 */
  classicOpposeCount: number
  /** 支持的流派 */
  supportingSchools: string[]
  /** 反对的流派 */
  opposingSchools: string[]
  /** 争议说明 */
  controversyNote?: string
  /** 建议操作 */
  recommendation: 'keep' | 'review' | 'demote' | 'deprecate'
  /** 最后评估时间 */
  lastAssessedAt: number
}

// ============================================================
// Part 7: AI Assistant Framework 类型
// ============================================================

/** AI 上下文层次 */
export interface AIContextLayer {
  /** 层次名称 */
  name: string
  /** 层次内容（结构化数据） */
  data: any
  /** 层次摘要（给 AI 的文字描述） */
  summary: string
  /** 重要性 0~1 */
  importance: number
}

/** AI 上下文构建结果 */
export interface AIContext {
  /** 上下文 ID */
  contextId: string
  /** 构建时间 */
  builtAt: number
  /** 层次列表 */
  layers: AIContextLayer[]
  /** 上下文 Token 估算 */
  estimatedTokens: number
  /** 完整上下文文本 */
  fullContext: string
}

/** AI Prompt 模板类型 */
export type PromptTemplateType =
  | 'bazi_full_analysis'   // 八字完整分析
  | 'xiyongshen_explain'   // 喜用神解释
  | 'geju_analysis'        // 格局分析
  | 'dayun_forecast'       // 大运预测
  | 'case_similarity'      // 案例相似度
  | 'quality_report'       // 质量报告
  | 'custom'               // 自定义

/** AI Prompt 构建结果 */
export interface AIPromptResult {
  /** 模板类型 */
  templateType: PromptTemplateType
  /** 系统消息 */
  systemMessage: string
  /** 用户消息 */
  userMessage: string
  /** 上下文 */
  context: AIContext
  /** 期望的返回格式 */
  expectedFormat: 'json' | 'text' | 'markdown'
  /** 格式说明 */
  formatSpec?: string
}

// ============================================================
// Part 8: Database 标准化类型
// ============================================================

/** 数据库类型 */
export type DBType =
  | 'classic'   // 古籍库
  | 'rule'      // 规则库
  | 'case'      // 命例库
  | 'school'    // 流派库
  | 'engine'    // 引擎库
  | 'explain'   // 解释库

/** 统一数据库接口 */
export interface StandardDB<T = any> {
  /** 数据库类型 */
  type: DBType
  /** 数据库名称 */
  name: string
  /** 数据库版本 */
  version: string
  /** 查询 */
  query(filter: Record<string, any>): T[]
  /** 按 ID 查询 */
  getById(id: string): T | undefined
  /** 插入 */
  insert(record: T): boolean
  /** 更新 */
  update(id: string, patch: Partial<T>): boolean
  /** 删除 */
  delete(id: string): boolean
  /** 统计 */
  stats(): { total: number; lastUpdated: number }
}

// ============================================================
// Part 9: API 标准类型
// ============================================================

/** API 端点定义 */
export interface APIEndpoint {
  /** 端点路径 */
  path: string
  /** HTTP 方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** 描述 */
  description: string
  /** 请求参数类型 */
  requestType?: string
  /** 响应类型 */
  responseType: string
  /** 是否需要认证 */
  requireAuth: boolean
}

/** API 合约 */
export interface APIContract {
  /** API 名称 */
  name: string
  /** API 版本 */
  version: string
  /** 端点列表 */
  endpoints: APIEndpoint[]
  /** 基础路径 */
  basePath: string
}

// ============================================================
// Part 10: 六层架构类型
// ============================================================

/** 架构层次 */
export type ArchitectureLayer =
  | 'core'         // 核心层（五行/天干地支/十神等基础概念）
  | 'knowledge'    // 知识层（古籍/规则/知识图谱）
  | 'engine'       // 引擎层（七大子引擎）
  | 'decision'     // 决策层（Unified Decision Core）
  | 'quality'      // 质量层（AccuracyCenter/Benchmark）
  | 'ai'           // AI 层（AI Context/Prompt）
  | 'application'  // 应用层（Web/APP/API）

/** 层次依赖关系 */
export interface LayerDependency {
  /** 当前层 */
  layer: ArchitectureLayer
  /** 上游依赖层 */
  dependsOn: ArchitectureLayer[]
  /** 下游消费者层 */
  consumedBy: ArchitectureLayer[]
  /** 层描述 */
  description: string
}

/** 六层架构配置 */
export interface ArchitectureConfig {
  /** 版本 */
  version: string
  /** 各层配置 */
  layers: Record<ArchitectureLayer, {
    enabled: boolean
    version: string
    modules: string[]
  }>
  /** 层依赖关系 */
  dependencies: LayerDependency[]
}

/** Foundation 系统版本 */
export const FOUNDATION_VERSION = '5.0.0'
