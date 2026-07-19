/**
 * Phase 6 Batch 2 Module 3: Report Optimization 测试
 *
 * 覆盖：建议 CRUD、状态流转、优化计划、统计、默认建议
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import {
  createSuggestion,
  implementSuggestion,
  deferSuggestion,
  rejectSuggestion,
  getSuggestionById,
  getSuggestionsByCategory,
  getSuggestionsByPriority,
  getSuggestionsByStatus,
  createOptimizationPlan,
  getOptimizationStats,
  getDefaultSuggestions,
  getAllSuggestions,
  resetSuggestionStore,
  REPORT_OPTIMIZATION_ENGINE_VERSION,
} from '../reportOptimizationEngine'

import {
  REPORT_OPTIMIZATION_VERSION,
  OPTIMIZATION_CATEGORIES,
  DEFAULT_OPTIMIZATION_SUGGESTIONS,
} from '../reportOptimizationTypes'

import type {
  OptimizationCategory,
  OptimizationPriority,
  OptimizationSuggestion,
  ReportOptimizationPlan,
  OptimizationStats,
} from '../reportOptimizationTypes'

// ═══════════════════════════════════════════════════════════════
// 顶层 describe
// ═══════════════════════════════════════════════════════════════

describe('Phase 6 Batch 2 Module 3: Report Optimization', () => {

  beforeEach(() => {
    resetSuggestionStore()
  })

  // ─────────────────────────────────────────────
  // 1. 版本号
  // ─────────────────────────────────────────────
  describe('1. 版本号', () => {
    test('REPORT_OPTIMIZATION_ENGINE_VERSION 应为 1.0.0', () => {
      expect(REPORT_OPTIMIZATION_ENGINE_VERSION).toBe('1.0.0')
    })
    test('REPORT_OPTIMIZATION_VERSION 应为 1.0.0', () => {
      expect(REPORT_OPTIMIZATION_VERSION).toBe('1.0.0')
    })
  })

  // ─────────────────────────────────────────────
  // 2. OPTIMIZATION_CATEGORIES
  // ─────────────────────────────────────────────
  describe('2. OPTIMIZATION_CATEGORIES', () => {
    test('包含 6 个分类', () => {
      expect(OPTIMIZATION_CATEGORIES.length).toBe(6)
      expect(OPTIMIZATION_CATEGORIES).toEqual([
        'readability', 'terminology', 'action_suggestion', 'timeline', 'sharing', 'mobile',
      ])
    })
    test('每个分类为有效字符串', () => {
      for (const cat of OPTIMIZATION_CATEGORIES) {
        expect(typeof cat).toBe('string')
        expect(cat.length).toBeGreaterThan(0)
      }
    })
  })

  // ─────────────────────────────────────────────
  // 3. DEFAULT_OPTIMIZATION_SUGGESTIONS
  // ─────────────────────────────────────────────
  describe('3. DEFAULT_OPTIMIZATION_SUGGESTIONS', () => {
    test('包含 6 条默认建议', () => {
      expect(DEFAULT_OPTIMIZATION_SUGGESTIONS.length).toBe(6)
    })
    test('每条建议有 category / priority / title / description', () => {
      for (const s of DEFAULT_OPTIMIZATION_SUGGESTIONS) {
        expect(s.category).toBeTruthy()
        expect(s.priority).toBeTruthy()
        expect(s.title).toBeTruthy()
        expect(s.description).toBeTruthy()
      }
    })
  })

  // ─────────────────────────────────────────────
  // 4. createSuggestion
  // ─────────────────────────────────────────────
  describe('4. createSuggestion', () => {
    test('创建建议自动填充 id / status / createdAt', () => {
      const suggestion = createSuggestion({
        category: 'readability',
        priority: 'critical',
        title: '测试建议',
        description: '这是一个测试建议',
        source: 'user_feedback',
        relatedFeedbackIds: ['fb-001'],
      })
      expect(suggestion.id).toMatch(/^OPT-/)
      expect(suggestion.status).toBe('pending')
      expect(suggestion.createdAt).toBeGreaterThan(0)
      expect(suggestion.implementedAt).toBeNull()
      expect(suggestion.title).toBe('测试建议')
    })
    test('创建的建议存入 store', () => {
      const suggestion = createSuggestion({
        category: 'mobile',
        priority: 'high',
        title: '移动端优化',
        description: '优化移动端体验',
        source: 'analytics',
        relatedFeedbackIds: [],
      })
      const found = getSuggestionById(suggestion.id)
      expect(found).toBeDefined()
      expect(found!.title).toBe('移动端优化')
    })
  })

  // ─────────────────────────────────────────────
  // 5. implementSuggestion
  // ─────────────────────────────────────────────
  describe('5. implementSuggestion', () => {
    test('实施 pending 建议成功', () => {
      const s = createSuggestion({
        category: 'readability',
        priority: 'high',
        title: '测试实施',
        description: '测试',
        source: 'expert_review',
        relatedFeedbackIds: [],
      })
      const result = implementSuggestion(s.id)
      expect(result).not.toBeNull()
      expect(result!.status).toBe('implemented')
      expect(result!.implementedAt).not.toBeNull()
    })
    test('实施非 pending 建议返回 null', () => {
      const s = createSuggestion({
        category: 'terminology',
        priority: 'medium',
        title: '测试',
        description: '测试',
        source: 'analytics',
        relatedFeedbackIds: [],
      })
      deferSuggestion(s.id)
      const result = implementSuggestion(s.id)
      expect(result).toBeNull()
    })
    test('实施不存在的建议返回 null', () => {
      const result = implementSuggestion('NONEXISTENT')
      expect(result).toBeNull()
    })
  })

  // ─────────────────────────────────────────────
  // 6. deferSuggestion
  // ─────────────────────────────────────────────
  describe('6. deferSuggestion', () => {
    test('延迟 pending 建议成功', () => {
      const s = createSuggestion({
        category: 'sharing',
        priority: 'low',
        title: '测试延迟',
        description: '测试',
        source: 'design_review',
        relatedFeedbackIds: [],
      })
      const result = deferSuggestion(s.id)
      expect(result).not.toBeNull()
      expect(result!.status).toBe('deferred')
    })
    test('延迟已实施建议返回 null', () => {
      const s = createSuggestion({
        category: 'timeline',
        priority: 'high',
        title: '测试',
        description: '测试',
        source: 'analytics',
        relatedFeedbackIds: [],
      })
      implementSuggestion(s.id)
      const result = deferSuggestion(s.id)
      expect(result).toBeNull()
    })
  })

  // ─────────────────────────────────────────────
  // 7. rejectSuggestion
  // ─────────────────────────────────────────────
  describe('7. rejectSuggestion', () => {
    test('拒绝 pending 建议成功', () => {
      const s = createSuggestion({
        category: 'mobile',
        priority: 'medium',
        title: '测试拒绝',
        description: '测试',
        source: 'user_feedback',
        relatedFeedbackIds: [],
      })
      const result = rejectSuggestion(s.id)
      expect(result).not.toBeNull()
      expect(result!.status).toBe('rejected')
    })
    test('拒绝已延迟建议返回 null', () => {
      const s = createSuggestion({
        category: 'readability',
        priority: 'low',
        title: '测试',
        description: '测试',
        source: 'design_review',
        relatedFeedbackIds: [],
      })
      deferSuggestion(s.id)
      const result = rejectSuggestion(s.id)
      expect(result).toBeNull()
    })
  })

  // ─────────────────────────────────────────────
  // 8. getSuggestionById
  // ─────────────────────────────────────────────
  describe('8. getSuggestionById', () => {
    test('获取存在的建议', () => {
      const s = createSuggestion({
        category: 'action_suggestion',
        priority: 'critical',
        title: '测试查询',
        description: '测试',
        source: 'expert_review',
        relatedFeedbackIds: [],
      })
      const found = getSuggestionById(s.id)
      expect(found).toBeDefined()
      expect(found!.category).toBe('action_suggestion')
    })
    test('不存在的 ID 返回 undefined', () => {
      const found = getSuggestionById('NONEXISTENT')
      expect(found).toBeUndefined()
    })
  })

  // ─────────────────────────────────────────────
  // 9. getSuggestionsByCategory
  // ─────────────────────────────────────────────
  describe('9. getSuggestionsByCategory', () => {
    test('按 readability 分类筛选', () => {
      const defaults = getDefaultSuggestions()
      const readability = getSuggestionsByCategory('readability')
      expect(readability.length).toBeGreaterThanOrEqual(2)
      for (const s of readability) {
        expect(s.category).toBe('readability')
      }
    })
    test('无匹配分类返回空数组', () => {
      // 先重置确保没有数据
      resetSuggestionStore()
      const result = getSuggestionsByCategory('readability')
      expect(result).toEqual([])
    })
  })

  // ─────────────────────────────────────────────
  // 10. getSuggestionsByPriority
  // ─────────────────────────────────────────────
  describe('10. getSuggestionsByPriority', () => {
    test('按 critical 优先级筛选', () => {
      const defaults = getDefaultSuggestions()
      const critical = getSuggestionsByPriority('critical')
      expect(critical.length).toBeGreaterThanOrEqual(2)
      for (const s of critical) {
        expect(s.priority).toBe('critical')
      }
    })
    test('按 low 优先级筛选', () => {
      const defaults = getDefaultSuggestions()
      const low = getSuggestionsByPriority('low')
      // 默认建议中没有 low 优先级
      expect(low.length).toBe(0)
    })
  })

  // ─────────────────────────────────────────────
  // 11. getSuggestionsByStatus
  // ─────────────────────────────────────────────
  describe('11. getSuggestionsByStatus', () => {
    test('按 pending 状态筛选', () => {
      const defaults = getDefaultSuggestions()
      const pending = getSuggestionsByStatus('pending')
      expect(pending.length).toBeGreaterThanOrEqual(6)
      for (const s of pending) {
        expect(s.status).toBe('pending')
      }
    })
    test('按 implemented 状态筛选（实施后）', () => {
      const defaults = getDefaultSuggestions()
      if (defaults.length > 0) {
        implementSuggestion(defaults[0].id)
        const implemented = getSuggestionsByStatus('implemented')
        expect(implemented.length).toBeGreaterThanOrEqual(1)
      }
    })
  })

  // ─────────────────────────────────────────────
  // 12. createOptimizationPlan
  // ─────────────────────────────────────────────
  describe('12. createOptimizationPlan', () => {
    test('创建优化计划', () => {
      const suggestions = getDefaultSuggestions()
      const plan = createOptimizationPlan('master_report', suggestions, 45, 80)
      expect(plan.id).toMatch(/^PLAN-/)
      expect(plan.reportType).toBe('master_report')
      expect(plan.version).toBe('1.0.0')
      expect(plan.overallScore).toBe(45)
      expect(plan.targetScore).toBe(80)
      expect(plan.suggestions.length).toBe(6)
    })
    test('创建空建议的计划', () => {
      const plan = createOptimizationPlan('simple_report', [], 30, 60)
      expect(plan.suggestions).toEqual([])
      expect(plan.overallScore).toBe(30)
    })
  })

  // ─────────────────────────────────────────────
  // 13. getOptimizationStats
  // ─────────────────────────────────────────────
  describe('13. getOptimizationStats', () => {
    test('空 store 统计全为 0', () => {
      const stats = getOptimizationStats()
      expect(stats.totalSuggestions).toBe(0)
      expect(stats.implementedRate).toBe(0)
    })
    test('添加建议后统计正确', () => {
      const defaults = getDefaultSuggestions()
      implementSuggestion(defaults[0].id)
      const stats = getOptimizationStats()
      expect(stats.totalSuggestions).toBe(6)
      expect(stats.implementedRate).toBeCloseTo(1 / 6)
    })
    test('byCategory 包含所有分类', () => {
      const defaults = getDefaultSuggestions()
      const stats = getOptimizationStats()
      for (const cat of OPTIMIZATION_CATEGORIES) {
        expect(stats.byCategory[cat]).toBeDefined()
        expect(typeof stats.byCategory[cat]).toBe('number')
      }
    })
  })

  // ─────────────────────────────────────────────
  // 14. getDefaultSuggestions
  // ─────────────────────────────────────────────
  describe('14. getDefaultSuggestions', () => {
    test('生成 6 条默认建议', () => {
      const suggestions = getDefaultSuggestions()
      expect(suggestions.length).toBe(6)
    })
    test('每条默认建议 status 为 pending', () => {
      const suggestions = getDefaultSuggestions()
      for (const s of suggestions) {
        expect(s.status).toBe('pending')
      }
    })
    test('再次调用产生新 ID（不重复）', () => {
      const first = getDefaultSuggestions()
      const second = getDefaultSuggestions()
      const firstIds = first.map(s => s.id)
      const secondIds = second.map(s => s.id)
      for (const id of secondIds) {
        expect(firstIds).not.toContain(id)
      }
    })
  })

  // ─────────────────────────────────────────────
  // 15. getAllSuggestions
  // ─────────────────────────────────────────────
  describe('15. getAllSuggestions', () => {
    test('重置后 store 为空', () => {
      expect(getAllSuggestions().length).toBe(0)
    })
    test('添加默认建议后数量为 6', () => {
      getDefaultSuggestions()
      expect(getAllSuggestions().length).toBe(6)
    })
  })

  // ─────────────────────────────────────────────
  // 16. resetSuggestionStore
  // ─────────────────────────────────────────────
  describe('16. resetSuggestionStore', () => {
    test('重置后 store 清空', () => {
      getDefaultSuggestions()
      getDefaultSuggestions()
      expect(getAllSuggestions().length).toBeGreaterThan(0)

      resetSuggestionStore()
      expect(getAllSuggestions().length).toBe(0)
    })
    test('重置后可正常创建建议', () => {
      resetSuggestionStore()
      const s = createSuggestion({
        category: 'readability',
        priority: 'high',
        title: '重置后测试',
        description: '测试',
        source: 'analytics',
        relatedFeedbackIds: [],
      })
      expect(s.id).toMatch(/^OPT-/)
      expect(getAllSuggestions().length).toBe(1)
    })
  })
})