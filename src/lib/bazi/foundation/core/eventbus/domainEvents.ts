/**
 * P0-5 最终预冻结 — 领域事件分类（Domain Events）
 *
 * 事件按领域分组，防止事件命名混乱。
 * 与 FoundationEvents（foundation:* 前缀）互补：本文件定义标准领域前缀
 * （system/rule/decision/plugin/quality/knowledge）与各领域事件常量。
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

// ============================================================
// 领域事件分类与结构
// ============================================================

// 领域事件分类 —— 事件按领域分组，防止事件命名混乱
export type DomainEventCategory = 'system' | 'rule' | 'decision' | 'plugin' | 'quality' | 'knowledge'

export interface DomainEvent {
  category: DomainEventCategory
  type: string
  payload?: any
  timestamp: number
  source?: string
}

// 标准化事件前缀
export const EVENT_PREFIX = {
  system: 'system:',
  rule: 'rule:',
  decision: 'decision:',
  plugin: 'plugin:',
  quality: 'quality:',
  knowledge: 'knowledge:',
} as const

// ============================================================
// 各领域事件常量
// ============================================================

// SystemEvent：系统生命周期/错误
export const SystemEvents = {
  SystemInit: 'system:init',
  SystemStart: 'system:start',
  SystemStop: 'system:stop',
  SystemError: 'system:error',
  SystemHealthCheck: 'system:health-check',
} as const

// RuleEvent：规则加载/卸载/执行/冲突
export const RuleEvents = {
  RuleLoaded: 'rule:loaded',
  RuleUnloaded: 'rule:unloaded',
  RuleRejected: 'rule:rejected',
  RuleExecuted: 'rule:executed',
  RuleConflict: 'rule:conflict',
  RuleQuarantined: 'rule:quarantined',
  RuleOptimized: 'rule:optimized',
  RuleMigrated: 'rule:migrated',
} as const

// DecisionEvent：决策/策略/融合
export const DecisionEvents = {
  DecisionStarted: 'decision:started',
  DecisionFinished: 'decision:finished',
  StrategySelected: 'decision:strategy-selected',
  FusionCompleted: 'decision:fusion-completed',
  SnapshotSaved: 'decision:snapshot-saved',
  SnapshotReplayed: 'decision:snapshot-replayed',
} as const

// PluginEvent：插件生命周期
export const PluginEvents = {
  PluginInstalled: 'plugin:installed',
  PluginInitialized: 'plugin:initialized',
  PluginEnabled: 'plugin:enabled',
  PluginDisabled: 'plugin:disabled',
  PluginDestroyed: 'plugin:destroyed',
  PluginError: 'plugin:error',
  PluginHealthChanged: 'plugin:health-changed',
} as const

// QualityEvent：质量/回归/审核
export const QualityEvents = {
  RegressionStarted: 'quality:regression-started',
  RegressionFinished: 'quality:regression-finished',
  AccuracyDropped: 'quality:accuracy-dropped',
  ReviewCompleted: 'quality:review-completed',
  BenchmarkUpdated: 'quality:benchmark-updated',
} as const

// KnowledgeEvent：知识图谱/语义
export const KnowledgeEvents = {
  ConceptResolved: 'knowledge:concept-resolved',
  SemanticMatched: 'knowledge:semantic-matched',
  ClassicQueried: 'knowledge:classic-queried',
  CitationAdded: 'knowledge:citation-added',
} as const

// 所有领域事件类型汇总
export const AllDomainEvents = {
  ...SystemEvents,
  ...RuleEvents,
  ...DecisionEvents,
  ...PluginEvents,
  ...QualityEvents,
  ...KnowledgeEvents,
} as const

// ============================================================
// 工具函数
// ============================================================

/**
 * 构造领域事件
 * @param category 领域分类
 * @param type 事件类型字符串
 * @param payload 事件负载
 * @param source 事件来源（模块/插件 ID）
 */
export function createDomainEvent(
  category: DomainEventCategory,
  type: string,
  payload?: any,
  source?: string,
): DomainEvent {
  return { category, type, payload, timestamp: Date.now(), source }
}

/**
 * 按分类过滤事件
 * 通过事件类型字符串的前缀判断其所属领域分类。
 * @param eventType 事件类型字符串
 * @param category 领域分类
 */
export function isCategory(eventType: string, category: DomainEventCategory): boolean {
  return eventType.startsWith(EVENT_PREFIX[category])
}
