/**
 * Evidence Fusion Decision Engine - 模块导出
 *
 * 这是玄风门命理核心的大脑，支持：
 * - 多证据融合决策（非简单加权平均）
 * - 多用神（Primary/Secondary/Assistant/Avoid/Idle）
 * - SchoolProfile 流派模式
 * - Rule Voting 规则投票
 * - Conflict Report 冲突解释
 * - Decision Trace 决策回溯
 * - 统一 DecisionResult 输出（为紫微/奇门/六爻预留）
 */

export * from './types'
export * from './schoolProfile'
export * from './ruleVote'
export * from './conflictReport'
export * from './decisionTrace'
export * from './evidenceFusionEngine'
