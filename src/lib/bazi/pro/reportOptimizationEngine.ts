/**
 * Phase 6 Batch 2 Module 3: Report Optimization Engine
 *
 * 职责：优化建议 CRUD、状态流转、优化计划管理、统计
 * 约束：纯数据管理层，不做实际报告渲染
 */

import type {
  OptimizationCategory,
  OptimizationPriority,
  OptimizationSuggestion,
  ReportOptimizationPlan,
  OptimizationStats,
} from './reportOptimizationTypes'

import {
  REPORT_OPTIMIZATION_VERSION,
  OPTIMIZATION_CATEGORIES,
  DEFAULT_OPTIMIZATION_SUGGESTIONS,
} from './reportOptimizationTypes'

// ═══════════════════════════════════════════════════════════
// 版本号
// ═══════════════════════════════════════════════════════════

export const REPORT_OPTIMIZATION_ENGINE_VERSION = REPORT_OPTIMIZATION_VERSION

// ═══════════════════════════════════════════════════════════
// 内部存储
// ═══════════════════════════════════════════════════════════

const suggestionStore = new Map<string, OptimizationSuggestion>()

let suggestionCounter = 0

// ═══════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════

function generateSuggestionId(): string {
  suggestionCounter++
  const ts = Date.now()
  return `OPT-${ts}-${suggestionCounter.toString().padStart(4, '0')}`
}

function generatePlanId(): string {
  const ts = Date.now()
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `PLAN-${ts}-${rand}`
}

// ═══════════════════════════════════════════════════════════
// 核心函数
// ═══════════════════════════════════════════════════════════

/**
 * 创建优化建议
 */
export function createSuggestion(data: Omit<OptimizationSuggestion, 'id' | 'createdAt' | 'implementedAt' | 'status'>): OptimizationSuggestion {
  const id = generateSuggestionId()
  const now = Date.now()

  const suggestion: OptimizationSuggestion = {
    ...data,
    id,
    status: 'pending',
    createdAt: now,
    implementedAt: null,
  }

  suggestionStore.set(id, suggestion)
  return suggestion
}

/**
 * 实施建议
 */
export function implementSuggestion(suggestionId: string): OptimizationSuggestion | null {
  const suggestion = suggestionStore.get(suggestionId)
  if (!suggestion || suggestion.status !== 'pending') {
    return null
  }
  suggestion.status = 'implemented'
  suggestion.implementedAt = Date.now()
  return suggestion
}

/**
 * 延迟建议
 */
export function deferSuggestion(suggestionId: string): OptimizationSuggestion | null {
  const suggestion = suggestionStore.get(suggestionId)
  if (!suggestion || suggestion.status !== 'pending') {
    return null
  }
  suggestion.status = 'deferred'
  return suggestion
}

/**
 * 拒绝建议
 */
export function rejectSuggestion(suggestionId: string): OptimizationSuggestion | null {
  const suggestion = suggestionStore.get(suggestionId)
  if (!suggestion || suggestion.status !== 'pending') {
    return null
  }
  suggestion.status = 'rejected'
  return suggestion
}

/**
 * 根据 ID 获取建议
 */
export function getSuggestionById(id: string): OptimizationSuggestion | undefined {
  return suggestionStore.get(id)
}

/**
 * 根据分类获取建议
 */
export function getSuggestionsByCategory(category: OptimizationCategory): OptimizationSuggestion[] {
  return Array.from(suggestionStore.values()).filter(s => s.category === category)
}

/**
 * 根据优先级获取建议
 */
export function getSuggestionsByPriority(priority: OptimizationPriority): OptimizationSuggestion[] {
  return Array.from(suggestionStore.values()).filter(s => s.priority === priority)
}

/**
 * 根据状态获取建议
 */
export function getSuggestionsByStatus(status: string): OptimizationSuggestion[] {
  return Array.from(suggestionStore.values()).filter(s => s.status === status)
}

/**
 * 创建优化计划
 */
export function createOptimizationPlan(
  reportType: string,
  suggestions: OptimizationSuggestion[],
  currentScore: number,
  targetScore: number,
): ReportOptimizationPlan {
  const id = generatePlanId()
  const now = Date.now()

  return {
    id,
    reportType,
    version: '1.0.0',
    suggestions: [...suggestions],
    overallScore: currentScore,
    targetScore,
    createdAt: now,
  }
}

/**
 * 获取优化统计
 */
export function getOptimizationStats(): OptimizationStats {
  const allSuggestions = Array.from(suggestionStore.values())
  const totalSuggestions = allSuggestions.length

  const byCategory = {} as Record<OptimizationCategory, number>
  for (const cat of OPTIMIZATION_CATEGORIES) {
    byCategory[cat] = 0
  }

  const byPriority = {} as Record<OptimizationPriority, number>
  const priorities: OptimizationPriority[] = ['critical', 'high', 'medium', 'low']
  for (const p of priorities) {
    byPriority[p] = 0
  }

  const byStatus: Record<string, number> = {}
  const bySource: Record<string, number> = {}
  let implementedCount = 0

  for (const s of allSuggestions) {
    byCategory[s.category] = (byCategory[s.category] ?? 0) + 1
    byPriority[s.priority] = (byPriority[s.priority] ?? 0) + 1
    byStatus[s.status] = (byStatus[s.status] ?? 0) + 1
    bySource[s.source] = (bySource[s.source] ?? 0) + 1
    if (s.status === 'implemented') {
      implementedCount++
    }
  }

  const implementedRate = totalSuggestions > 0 ? implementedCount / totalSuggestions : 0

  return {
    totalSuggestions,
    byCategory,
    byPriority,
    byStatus,
    bySource,
    implementedRate,
  }
}

/**
 * 获取默认建议列表（预置 6 条）
 */
export function getDefaultSuggestions(): OptimizationSuggestion[] {
  const results: OptimizationSuggestion[] = []
  for (const def of DEFAULT_OPTIMIZATION_SUGGESTIONS) {
    results.push(createSuggestion({
      category: def.category,
      priority: def.priority,
      title: def.title,
      description: def.description,
      source: 'design_review',
      relatedFeedbackIds: [],
    }))
  }
  return results
}

/**
 * 获取所有建议
 */
export function getAllSuggestions(): OptimizationSuggestion[] {
  return Array.from(suggestionStore.values())
}

/**
 * 重置建议存储（用于测试）
 */
export function resetSuggestionStore(): void {
  suggestionStore.clear()
  suggestionCounter = 0
}