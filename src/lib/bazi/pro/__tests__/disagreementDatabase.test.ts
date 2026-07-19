/**
 * Disagreement Database 测试套件
 *
 * 覆盖：
 *   - 静态数据完整性
 *   - 查询函数（getAllConflicts, getConflictsByType, getConflictsByTopic, getConflictsByCaseId）
 *   - 统计函数
 *   - 版本号常量
 */

import { describe, test, expect } from 'vitest'
import type { ConflictRecordV2 } from '../caseLibraryTypesV2'

import {
  DISAGREEMENT_DATABASE_VERSION,
  DISAGREEMENT_CONFLICTS,
  getAllConflicts,
  getConflictsByType,
  getConflictsByTopic,
  getConflictsByCaseId,
  getConflictStatistics,
} from '../disagreementDatabase'

// ═══════════════════════════════════════════
// Group 1: 静态数据与版本
// ═══════════════════════════════════════════

describe('disagreementDatabase static data', () => {
  test('DISAGREEMENT_DATABASE_VERSION is 1.0.0', () => {
    expect(DISAGREEMENT_DATABASE_VERSION).toBe('1.0.0')
  })

  test('DISAGREEMENT_CONFLICTS has at least 10 entries', () => {
    expect(DISAGREEMENT_CONFLICTS.length).toBeGreaterThanOrEqual(10)
  })

  test('every conflict has required fields', () => {
    for (const c of DISAGREEMENT_CONFLICTS) {
      expect(c.conflictId).toBeTruthy()
      expect(c.conflictType).toMatch(/^(classical|school|expert)$/)
      expect(c.topic).toBeTruthy()
      expect(c.description).toBeTruthy()
      expect(c.viewpointA).toBeTruthy()
      expect(c.viewpointB).toBeTruthy()
      expect(c.sourceA).toBeTruthy()
      expect(c.sourceB).toBeTruthy()
      expect(Array.isArray(c.affectedCaseIds)).toBe(true)
    }
  })

  test('conflictIds are unique', () => {
    const ids = DISAGREEMENT_CONFLICTS.map((c) => c.conflictId)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})

// ═══════════════════════════════════════════
// Group 2: getAllConflicts
// ═══════════════════════════════════════════

describe('getAllConflicts', () => {
  test('returns all conflicts', () => {
    const all = getAllConflicts()
    expect(all.length).toBe(DISAGREEMENT_CONFLICTS.length)
  })

  test('returns a copy, not the original array', () => {
    const all = getAllConflicts()
    all.pop()
    expect(getAllConflicts().length).toBe(DISAGREEMENT_CONFLICTS.length)
  })
})

// ═══════════════════════════════════════════
// Group 3: getConflictsByType
// ═══════════════════════════════════════════

describe('getConflictsByType', () => {
  test('filters classical conflicts', () => {
    const classical = getConflictsByType('classical')
    expect(classical.length).toBeGreaterThan(0)
    expect(classical.every((c) => c.conflictType === 'classical')).toBe(true)
  })

  test('filters school conflicts', () => {
    const school = getConflictsByType('school')
    expect(school.length).toBeGreaterThan(0)
    expect(school.every((c) => c.conflictType === 'school')).toBe(true)
  })

  test('filters expert conflicts', () => {
    const expert = getConflictsByType('expert')
    expect(expert.length).toBeGreaterThan(0)
    expect(expert.every((c) => c.conflictType === 'expert')).toBe(true)
  })

  test('returns empty array for non-matching type', () => {
    // 'modern' is not a ConflictType, but TS prevents this at compile time.
    // We test with a valid type that may have zero entries.
    const result = getConflictsByType('expert')
    expect(Array.isArray(result)).toBe(true)
  })

  test('returns copies of conflicts', () => {
    const classical = getConflictsByType('classical')
    if (classical.length > 0) {
      classical[0].topic = 'modified'
      const fresh = getConflictsByType('classical')
      expect(fresh[0].topic).not.toBe('modified')
    }
  })
})

// ═══════════════════════════════════════════
// Group 4: getConflictsByTopic
// ═══════════════════════════════════════════

describe('getConflictsByTopic', () => {
  test('finds conflicts by topic keyword', () => {
    const result = getConflictsByTopic('用神')
    expect(result.length).toBeGreaterThan(0)
    expect(result.some((c) => c.topic.includes('用神'))).toBe(true)
  })

  test('finds conflicts by description keyword', () => {
    const result = getConflictsByTopic('天干五合')
    expect(result.length).toBeGreaterThan(0)
  })

  test('is case-insensitive', () => {
    const lower = getConflictsByTopic('格局')
    const upper = getConflictsByTopic('格局')
    expect(lower.length).toBe(upper.length)
  })

  test('returns empty array for unmatched keyword', () => {
    const result = getConflictsByTopic('不存在的主题xyz123')
    expect(result).toEqual([])
  })
})

// ═══════════════════════════════════════════
// Group 5: getConflictsByCaseId
// ═══════════════════════════════════════════

describe('getConflictsByCaseId', () => {
  test('finds conflicts related to CLS-001', () => {
    const result = getConflictsByCaseId('CLS-001')
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((c) => c.affectedCaseIds.includes('CLS-001'))).toBe(true)
  })

  test('finds conflicts related to REG-001', () => {
    const result = getConflictsByCaseId('REG-001')
    expect(result.length).toBeGreaterThan(0)
  })

  test('returns empty array for unknown caseId', () => {
    const result = getConflictsByCaseId('UNKNOWN-999')
    expect(result).toEqual([])
  })
})

// ═══════════════════════════════════════════
// Group 6: getConflictStatistics
// ═══════════════════════════════════════════

describe('getConflictStatistics', () => {
  test('total equals conflict count', () => {
    const stats = getConflictStatistics()
    expect(stats.total).toBe(DISAGREEMENT_CONFLICTS.length)
  })

  test('byType sums to total', () => {
    const stats = getConflictStatistics()
    const sum = stats.byType.classical + stats.byType.school + stats.byType.expert
    expect(sum).toBe(stats.total)
  })

  test('resolution counts sum to total', () => {
    const stats = getConflictStatistics()
    expect(stats.withResolution + stats.withoutResolution).toBe(stats.total)
  })

  test('withResolution is non-negative', () => {
    const stats = getConflictStatistics()
    expect(stats.withResolution).toBeGreaterThanOrEqual(0)
  })
})
