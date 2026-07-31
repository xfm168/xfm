/**
 * Evidence Fusion Decision Engine V2 - 玄风门统一命理决策核心
 *
 * Unified Decision Core 完整链路：
 * - 7 Evidence Engine
 *   → RulePriorityResolver（动态优先级 · 非固定Weight）
 *   → RuleGate（准入 · 5维过滤）
 *   → RuleKill（淘汰 · 低质量引擎退出Fusion）
 *   → RuleVoting V2（Weighted Voting · 5维加权）
 *   → ConflictResolver V2（完整链路裁决：Source→Evidence→Classic→Priority→Decision）
 *   → MetaDecision（元决策·多用神/调候/扶抑/病药/通关/格局优先）
 *   → DecisionResult V2（统一输出，紫微/奇门/六爻/风水未来复用）
 *   → AI（禁止再次推理 · 仅润色 ExplainBuilder）
 */

export * from './types'
export * from './schoolProfile'
export * from './ruleVote'
export * from './conflictReport'
export * from './decisionTrace'
export * from './rulePriorityResolver'
export * from './ruleGateAndMeta'
export * from './healthTreeExplain'
export * from './evidenceFusionEngine'
