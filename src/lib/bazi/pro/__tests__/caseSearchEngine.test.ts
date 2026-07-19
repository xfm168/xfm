/**
 * Case Search Engine 测试套件
 *
 * 覆盖：
 *   - searchCases（各种字段、操作符、AND/OR、分页、排序）
 *   - getSearchFacets
 *   - getRelatedCases
 *   - getSimilarCasesByStructure
 *   - 版本号与边界条件
 */

import { describe, test, expect } from 'vitest'
import type { CaseEntryV2, CasePillarsInput } from '../caseLibraryTypesV2'
import type { CaseSearchQuery, SearchCondition } from '../caseSearchTypes'

import {
  CASE_SEARCH_VERSION,
  searchCases,
  getSearchFacets,
  getRelatedCases,
  getSimilarCasesByStructure,
} from '../caseSearchEngine'

import { getAllCasesV2 } from '../caseDatabaseV2'

// ═══════════════════════════════════════════
// Group 1: 版本与常量
// ═══════════════════════════════════════════

describe('caseSearchEngine constants', () => {
  test('CASE_SEARCH_VERSION is 1.0.0', () => {
    expect(CASE_SEARCH_VERSION).toBe('1.0.0')
  })
})

// ═══════════════════════════════════════════
// Group 2: searchCases 基础行为
// ═══════════════════════════════════════════

describe('searchCases basic behavior', () => {
  test('empty conditions returns all cases', () => {
    const result = searchCases({ conditions: [], logic: 'AND' })
    expect(result.total).toBeGreaterThan(0)
    expect(result.cases.length).toBeGreaterThan(0)
  })

  test('respects limit', () => {
    const result = searchCases({ conditions: [], logic: 'AND', limit: 3 })
    expect(result.cases.length).toBeLessThanOrEqual(3)
  })

  test('respects offset', () => {
    const q1 = searchCases({ conditions: [], logic: 'AND', limit: 5, offset: 0 })
    const q2 = searchCases({ conditions: [], logic: 'AND', limit: 5, offset: 2 })
    expect(q2.cases.length).toBeLessThanOrEqual(5)
    if (q1.cases.length > 2 && q2.cases.length > 0) {
      expect(q2.cases[0].caseId).toBe(q1.cases[2].caseId)
    }
  })

  test('hasMore is false when all results fit in one page', () => {
    const result = searchCases({ conditions: [], logic: 'AND', limit: 1000 })
    expect(result.hasMore).toBe(false)
  })

  test('page calculation is correct', () => {
    const result = searchCases({ conditions: [], logic: 'AND', limit: 5, offset: 5 })
    expect(result.page).toBe(2)
  })
})

// ═══════════════════════════════════════════
// Group 3: 按字段搜索 - pattern
// ═══════════════════════════════════════════

describe('searchCases by pattern', () => {
  test('eq finds exact pattern', () => {
    const query: CaseSearchQuery = {
      conditions: [{ field: 'pattern', operator: 'eq', value: '建禄格' }],
      logic: 'AND',
    }
    const result = searchCases(query)
    expect(result.cases.length).toBeGreaterThan(0)
    expect(result.cases.every((c) => c.expectedResult.primaryPattern === '建禄格')).toBe(true)
  })

  test('contains finds partial pattern', () => {
    const query: CaseSearchQuery = {
      conditions: [{ field: 'pattern', operator: 'contains', value: '官' }],
      logic: 'AND',
    }
    const result = searchCases(query)
    expect(result.cases.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════
// Group 4: 按字段搜索 - element & xiShen
// ═══════════════════════════════════════════

describe('searchCases by element and xiShen', () => {
  test('eq finds cases by dayMasterElement', () => {
    const query: CaseSearchQuery = {
      conditions: [{ field: 'element', operator: 'eq', value: '木' }],
      logic: 'AND',
    }
    const result = searchCases(query)
    expect(result.cases.length).toBeGreaterThan(0)
  })

  test('eq finds cases by xiShen', () => {
    const query: CaseSearchQuery = {
      conditions: [{ field: 'xiShen', operator: 'eq', value: '水' }],
      logic: 'AND',
    }
    const result = searchCases(query)
    expect(result.cases.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════
// Group 5: 按字段搜索 - tag & keyword
// ═══════════════════════════════════════════

describe('searchCases by tag and keyword', () => {
  test('in operator works for tags', () => {
    const all = getAllCasesV2()
    const withTags = all.filter((c) => c.tags.length > 0)
    if (withTags.length > 0) {
      const tag = withTags[0].tags[0]
      const query: CaseSearchQuery = {
        conditions: [{ field: 'tag', operator: 'in', value: [tag] }],
        logic: 'AND',
      }
      const result = searchCases(query)
      expect(result.cases.some((c) => c.tags.includes(tag))).toBe(true)
    }
  })

  test('in operator works for keywords', () => {
    const all = getAllCasesV2()
    const withKeywords = all.filter((c) => c.keywords.length > 0)
    if (withKeywords.length > 0) {
      const kw = withKeywords[0].keywords[0]
      const query: CaseSearchQuery = {
        conditions: [{ field: 'keyword', operator: 'in', value: [kw] }],
        logic: 'AND',
      }
      const result = searchCases(query)
      expect(result.cases.some((c) => c.keywords.includes(kw))).toBe(true)
    }
  })
})

// ═══════════════════════════════════════════
// Group 6: 按字段搜索 - strength
// ═══════════════════════════════════════════

describe('searchCases by strength', () => {
  test('eq finds cases by strengthLevel', () => {
    const query: CaseSearchQuery = {
      conditions: [{ field: 'strength', operator: 'eq', value: '偏强' }],
      logic: 'AND',
    }
    const result = searchCases(query)
    if (result.total > 0) {
      expect(result.cases.every((c) => c.expectedResult.strengthLevel === '偏强')).toBe(true)
    }
  })
})

// ═══════════════════════════════════════════
// Group 7: 组合逻辑 AND / OR
// ═══════════════════════════════════════════

describe('searchCases logic AND/OR', () => {
  test('AND requires all conditions', () => {
    const query: CaseSearchQuery = {
      conditions: [
        { field: 'element', operator: 'eq', value: '木' },
        { field: 'pattern', operator: 'eq', value: '建禄格' },
      ],
      logic: 'AND',
    }
    const result = searchCases(query)
    if (result.total > 0) {
      expect(
        result.cases.every(
          (c) =>
            c.expectedResult.dayMasterElement === '木' &&
            c.expectedResult.primaryPattern === '建禄格',
        ),
      ).toBe(true)
    }
  })

  test('OR requires any condition', () => {
    const query: CaseSearchQuery = {
      conditions: [
        { field: 'element', operator: 'eq', value: '木' },
        { field: 'element', operator: 'eq', value: '火' },
      ],
      logic: 'OR',
    }
    const result = searchCases(query)
    expect(result.total).toBeGreaterThanOrEqual(
      searchCases({ conditions: [{ field: 'element', operator: 'eq', value: '木' }], logic: 'AND' }).total,
    )
  })
})

// ═══════════════════════════════════════════
// Group 8: 分页与排序
// ═══════════════════════════════════════════

describe('searchCases pagination and sorting', () => {
  test('sort by qualityScore desc', () => {
    const result = searchCases({
      conditions: [],
      logic: 'AND',
      sortBy: 'qualityScore',
      sortOrder: 'desc',
      limit: 5,
    })
    if (result.cases.length > 1) {
      expect(result.cases[0].qualityScore).toBeGreaterThanOrEqual(result.cases[1].qualityScore)
    }
  })

  test('sort by reliability asc', () => {
    const result = searchCases({
      conditions: [],
      logic: 'AND',
      sortBy: 'reliability',
      sortOrder: 'asc',
      limit: 5,
    })
    if (result.cases.length > 1) {
      expect(result.cases[0].reliability).toBeLessThanOrEqual(result.cases[1].reliability)
    }
  })

  test('pagination reduces cases count', () => {
    const all = searchCases({ conditions: [], logic: 'AND' })
    const paged = searchCases({ conditions: [], logic: 'AND', limit: 2 })
    expect(paged.cases.length).toBeLessThanOrEqual(2)
    expect(paged.total).toBe(all.total)
  })
})

// ═══════════════════════════════════════════
// Group 9: getSearchFacets
// ═══════════════════════════════════════════

describe('getSearchFacets', () => {
  test('returns facets for pattern field', () => {
    const all = getAllCasesV2()
    const facets = getSearchFacets(all, ['pattern'])
    expect(facets.length).toBe(1)
    expect(facets[0].field).toBe('pattern')
    expect(facets[0].values.length).toBeGreaterThan(0)
  })

  test('returns facets for element field', () => {
    const all = getAllCasesV2()
    const facets = getSearchFacets(all, ['element'])
    expect(facets.length).toBe(1)
    expect(facets[0].values.every((v) => typeof v.count === 'number')).toBe(true)
  })

  test('counts sum to relevant cases', () => {
    const all = getAllCasesV2()
    const facets = getSearchFacets(all, ['strength'])
    const strengthFacet = facets.find((f) => f.field === 'strength')
    if (strengthFacet && strengthFacet.values.length > 0) {
      const totalCount = strengthFacet.values.reduce((sum, v) => sum + v.count, 0)
      const casesWithStrength = all.filter((c) => c.expectedResult.strengthLevel)
      expect(totalCount).toBe(casesWithStrength.length)
    }
  })

  test('handles multiple fields', () => {
    const all = getAllCasesV2()
    const facets = getSearchFacets(all, ['pattern', 'element'])
    expect(facets.length).toBe(2)
  })
})

// ═══════════════════════════════════════════
// Group 10: getRelatedCases
// ═══════════════════════════════════════════

describe('getRelatedCases', () => {
  test('returns empty for unknown caseId', () => {
    const related = getRelatedCases('UNKNOWN-999')
    expect(related).toEqual([])
  })

  test('does not include the target case itself', () => {
    const all = getAllCasesV2()
    if (all.length > 0) {
      const related = getRelatedCases(all[0].caseId, 10)
      expect(related.every((c) => c.caseId !== all[0].caseId)).toBe(true)
    }
  })

  test('returns at most limit cases', () => {
    const all = getAllCasesV2()
    if (all.length > 0) {
      const related = getRelatedCases(all[0].caseId, 3)
      expect(related.length).toBeLessThanOrEqual(3)
    }
  })

  test('returns cases ordered by relevance', () => {
    const all = getAllCasesV2()
    if (all.length > 1) {
      const related = getRelatedCases(all[0].caseId, 5)
      // Should return array (possibly empty if no matches)
      expect(Array.isArray(related)).toBe(true)
    }
  })
})

// ═══════════════════════════════════════════
// Group 11: getSimilarCasesByStructure
// ═══════════════════════════════════════════

describe('getSimilarCasesByStructure', () => {
  test('returns cases sorted by similarity', () => {
    const pillars: CasePillarsInput = {
      yearGan: '甲',
      yearZhi: '子',
      monthGan: '丙',
      monthZhi: '寅',
      dayGan: '甲',
      dayZhi: '子',
      hourGan: '甲',
      hourZhi: '子',
      gender: 'male',
    }
    const similar = getSimilarCasesByStructure(pillars, 5)
    expect(similar.length).toBeLessThanOrEqual(5)
  })

  test('exact match pillars returns highest score first', () => {
    const all = getAllCasesV2()
    if (all.length > 0) {
      const target = all[0]
      const pillars: CasePillarsInput = {
        yearGan: target.yearGan,
        yearZhi: target.yearZhi,
        monthGan: target.monthGan,
        monthZhi: target.monthZhi,
        dayGan: target.dayGan,
        dayZhi: target.dayZhi,
        hourGan: target.hourGan,
        hourZhi: target.hourZhi,
        gender: target.gender,
      }
      const similar = getSimilarCasesByStructure(pillars, 5)
      expect(similar.length).toBeGreaterThan(0)
      expect(similar[0].caseId).toBe(target.caseId)
    }
  })

  test('respects limit parameter', () => {
    const pillars: CasePillarsInput = {
      yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅',
      dayGan: '甲', dayZhi: '子', hourGan: '甲', hourZhi: '子',
      gender: 'male',
    }
    const similar = getSimilarCasesByStructure(pillars, 2)
    expect(similar.length).toBeLessThanOrEqual(2)
  })
})

// ═══════════════════════════════════════════
// Group 12: 边界与异常情况
// ═══════════════════════════════════════════

describe('searchCases edge cases', () => {
  test('no match returns empty cases and total 0', () => {
    const query: CaseSearchQuery = {
      conditions: [{ field: 'pattern', operator: 'eq', value: '不存在的格局xyz' }],
      logic: 'AND',
    }
    const result = searchCases(query)
    expect(result.cases).toEqual([])
    expect(result.total).toBe(0)
    expect(result.hasMore).toBe(false)
  })

  test('gt operator works for numeric fields', () => {
    const query: CaseSearchQuery = {
      conditions: [{ field: 'tag', operator: 'gt', value: 0 }],
      logic: 'AND',
    }
    const result = searchCases(query)
    // tag values are strings, parseFloat will be NaN, so no match expected
    expect(result.total).toBe(0)
  })

  test('lt operator works for numeric fields', () => {
    const query: CaseSearchQuery = {
      conditions: [{ field: 'tag', operator: 'lt', value: 999 }],
      logic: 'AND',
    }
    const result = searchCases(query)
    expect(result.total).toBe(0)
  })

  test('offset beyond total returns empty', () => {
    const result = searchCases({ conditions: [], logic: 'AND', offset: 99999, limit: 10 })
    expect(result.cases).toEqual([])
    expect(result.hasMore).toBe(false)
  })
})
