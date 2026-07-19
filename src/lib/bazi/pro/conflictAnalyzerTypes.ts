/**
 * 跨模块冲突分析器 — 类型定义
 *
 * 职责：定义冲突类型、严重程度、模块冲突项、跨模块分析结果及冲突分析报告
 */

// ═══════════════════════════════════════════
// 1. 基础枚举
// ═══════════════════════════════════════════

/** 冲突类型 */
export type ConflictType =
  | 'rule_conflict'
  | 'pattern_conflict'
  | 'cross_module_conflict'
  | 'strength_paradox'
  | 'fortune_paradox'

/** 冲突严重程度 */
export type ConflictSeverity = 'critical' | 'major' | 'minor' | 'info'

// ═══════════════════════════════════════════
// 2. 子结构定义
// ═══════════════════════════════════════════

/** 模块结论信息 */
export interface ModuleConclusion {
  /** 模块名称 */
  module: string
  /** 该模块的结论 */
  conclusion: string
  /** 置信度 0~1 */
  confidence: number
}

// ═══════════════════════════════════════════
// 3. 核心类型定义
// ═══════════════════════════════════════════

/** 单个模块冲突项 */
export interface ModuleConflictItem {
  /** 冲突 ID */
  conflictId: string
  /** 冲突类型 */
  type: ConflictType
  /** 严重程度 */
  severity: ConflictSeverity
  /** 冲突描述 */
  description: string
  /** 涉及的模块及其结论 */
  modules: ModuleConclusion[]
  /** 冲突原因 */
  reason: string
  /** 优先级评分 */
  priority: number
  /** 解决方案（可选） */
  resolution?: string
}

/** 单个命例的跨模块分析结果 */
export interface CrossModuleAnalysis {
  /** 命例 ID */
  caseId: string
  /** 发现的冲突列表 */
  conflictsFound: ModuleConflictItem[]
  /** 总冲突数 */
  totalConflicts: number
  /** critical 级别冲突数 */
  criticalCount: number
  /** major 级别冲突数 */
  majorCount: number
  /** minor 级别冲突数 */
  minorCount: number
  /** 综合冲突评分 0~100（0=无冲突） */
  overallConflictScore: number
  /** 高优先级冲突列表 */
  priorityConflicts: ModuleConflictItem[]
}

/** 冲突分布统计 */
export interface ConflictDistribution {
  rule_conflict: number
  pattern_conflict: number
  cross_module_conflict: number
  strength_paradox: number
  fortune_paradox: number
}

/** 批量冲突分析报告 */
export interface ConflictAnalysisReport {
  /** 版本号 */
  version: string
  /** 分析的命例总数 */
  totalCases: number
  /** 总冲突数 */
  totalConflicts: number
  /** 冲突分布 */
  conflictDistribution: ConflictDistribution
  /** 平均冲突评分 */
  avgConflictScore: number
  /** 生成时间 */
  generatedAt: number
}

// ═══════════════════════════════════════════
// 4. 工具函数
// ═══════════════════════════════════════════

/** 获取冲突类型显示名 */
export function getConflictTypeDisplayName(type: ConflictType): string {
  const map: Record<ConflictType, string> = {
    rule_conflict: '规则冲突',
    pattern_conflict: '格局冲突',
    cross_module_conflict: '跨模块冲突',
    strength_paradox: '强弱悖论',
    fortune_paradox: '运势悖论',
  }
  return map[type]
}

/** 获取冲突严重程度显示名 */
export function getConflictSeverityDisplayName(severity: ConflictSeverity): string {
  const map: Record<ConflictSeverity, string> = {
    critical: '严重',
    major: '重要',
    minor: '轻微',
    info: '信息',
  }
  return map[severity]
}

/** 获取严重程度权重（用于冲突评分） */
export function getSeverityWeight(severity: ConflictSeverity): number {
  const map: Record<ConflictSeverity, number> = {
    critical: 30,
    major: 20,
    minor: 10,
    info: 5,
  }
  return map[severity]
}

/** 生成冲突 ID */
export function generateConflictId(): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `CMA-${rand}`
}
