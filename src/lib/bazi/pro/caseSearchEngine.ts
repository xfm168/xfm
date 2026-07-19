/**
 * 命例搜索引擎
 *
 * 职责：
 *   - 支持多条件组合 AND/OR 搜索
 *   - 支持字段：格局、十神、神煞、五行、关键词、标签、强弱、喜用神
 *   - 支持分页、排序、分面统计、相关命例推荐
 */

import type { CaseEntryV2, CasePillarsInput } from './caseLibraryTypesV2'
import type {
  CaseSearchQuery,
  SearchCondition,
  SearchField,
  SearchFacet,
  SearchFacetValue,
  SearchResult,
} from './caseSearchTypes'

import { getAllCasesV2 } from './caseDatabaseV2'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const CASE_SEARCH_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 核心搜索函数
// ═══════════════════════════════════════════

/**
 * 执行命例搜索
 * @param query - 搜索查询条件
 * @returns 搜索结果（含分页信息）
 */
export function searchCases(query: CaseSearchQuery): SearchResult {
  const allCases = getAllCasesV2()
  let filtered = allCases

  // 条件过滤
  if (query.conditions.length > 0) {
    filtered = allCases.filter((caseEntry) => {
      const results = query.conditions.map((cond) => matchCondition(caseEntry, cond))
      return query.logic === 'AND' ? results.every(Boolean) : results.some(Boolean)
    })
  }

  // 排序
  if (query.sortBy) {
    const order = query.sortOrder === 'desc' ? -1 : 1
    filtered = [...filtered].sort((a, b) => {
      const va = getSortValue(a, query.sortBy!)
      const vb = getSortValue(b, query.sortBy!)
      if (va === undefined && vb === undefined) return 0
      if (va === undefined) return 1
      if (vb === undefined) return -1
      return va > vb ? order : va < vb ? -order : 0
    })
  }

  // 分页
  const limit = query.limit ?? 20
  const offset = query.offset ?? 0
  const total = filtered.length
  const cases = filtered.slice(offset, offset + limit)
  const page = Math.floor(offset / limit) + 1
  const hasMore = offset + limit < total

  return { cases, total, page, hasMore }
}

// ═══════════════════════════════════════════
// 3. 分面统计
// ═══════════════════════════════════════════

/**
 * 获取指定命例集合在各字段上的分面统计
 * @param cases - 命例集合
 * @param fields - 需要统计的字段列表
 * @returns 分面统计数组
 */
export function getSearchFacets(
  cases: CaseEntryV2[],
  fields: SearchField[],
): SearchFacet[] {
  return fields.map((field) => {
    const counter = new Map<string, number>()

    for (const c of cases) {
      const values = extractFieldValues(c, field)
      for (const v of values) {
        counter.set(v, (counter.get(v) ?? 0) + 1)
      }
    }

    const values: SearchFacetValue[] = Array.from(counter.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)

    return { field, values }
  })
}

// ═══════════════════════════════════════════
// 4. 相关命例推荐
// ═══════════════════════════════════════════

/**
 * 基于标签和格局找相关命例
 * @param caseId - 目标命例 ID
 * @param limit - 返回数量上限
 * @returns 相关命例数组
 */
export function getRelatedCases(caseId: string, limit = 5): CaseEntryV2[] {
  const allCases = getAllCasesV2()
  const target = allCases.find((c) => c.caseId === caseId)
  if (!target) return []

  const scored = allCases
    .filter((c) => c.caseId !== caseId)
    .map((c) => {
      let score = 0

      // 标签匹配
      const commonTags = c.tags.filter((tag) => target.tags.includes(tag))
      score += commonTags.length * 3

      // 格局匹配
      if (
        c.expectedResult.primaryPattern &&
        target.expectedResult.primaryPattern &&
        c.expectedResult.primaryPattern === target.expectedResult.primaryPattern
      ) {
        score += 5
      }

      // 日主五行匹配
      if (
        c.expectedResult.dayMasterElement &&
        target.expectedResult.dayMasterElement &&
        c.expectedResult.dayMasterElement === target.expectedResult.dayMasterElement
      ) {
        score += 2
      }

      // 强弱匹配
      if (
        c.expectedResult.strengthLevel &&
        target.expectedResult.strengthLevel &&
        c.expectedResult.strengthLevel === target.expectedResult.strengthLevel
      ) {
        score += 2
      }

      return { caseEntry: c, score }
    })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.caseEntry)
}

// ═══════════════════════════════════════════
// 5. 结构相似度
// ═══════════════════════════════════════════

/**
 * 基于八字结构相似度找相似命例
 * @param pillars - 四柱输入
 * @param limit - 返回数量上限
 * @returns 相似命例数组（按相似度排序）
 */
export function getSimilarCasesByStructure(
  pillars: CasePillarsInput,
  limit = 5,
): CaseEntryV2[] {
  const allCases = getAllCasesV2()

  const scored = allCases.map((c) => {
    let score = 0

    // 年柱匹配
    if (c.yearGan === pillars.yearGan) score += 2
    if (c.yearZhi === pillars.yearZhi) score += 2

    // 月柱匹配
    if (c.monthGan === pillars.monthGan) score += 3
    if (c.monthZhi === pillars.monthZhi) score += 3

    // 日柱匹配
    if (c.dayGan === pillars.dayGan) score += 4
    if (c.dayZhi === pillars.dayZhi) score += 4

    // 时柱匹配
    if (c.hourGan === pillars.hourGan) score += 2
    if (c.hourZhi === pillars.hourZhi) score += 2

    // 性别匹配
    if (c.gender === pillars.gender) score += 1

    return { caseEntry: c, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.caseEntry)
}

// ═══════════════════════════════════════════
// 6. 内部辅助函数
// ═══════════════════════════════════════════

function matchCondition(caseEntry: CaseEntryV2, condition: SearchCondition): boolean {
  const values = extractFieldValues(caseEntry, condition.field)

  switch (condition.operator) {
    case 'eq':
      return values.some((v) => v === String(condition.value))
    case 'contains':
      return values.some((v) => v.includes(String(condition.value)))
    case 'gt':
      return values.some((v) => parseFloat(v) > Number(condition.value))
    case 'lt':
      return values.some((v) => parseFloat(v) < Number(condition.value))
    case 'in': {
      const arr = Array.isArray(condition.value)
        ? condition.value.map(String)
        : [String(condition.value)]
      return values.some((v) => arr.includes(v))
    }
    default:
      return false
  }
}

function extractFieldValues(caseEntry: CaseEntryV2, field: SearchField): string[] {
  const er = caseEntry.expectedResult

  switch (field) {
    case 'pattern':
      return [er.primaryPattern, er.secondaryPattern].filter(Boolean) as string[]
    case 'tenGod':
      return er.tenGodSummary ? [er.tenGodSummary] : []
    case 'shenSha':
      return er.shenShaList ?? []
    case 'element': {
      const elements = [
        er.dayMasterElement,
        er.primaryXiShen,
        er.primaryYongShen,
        er.primaryJiShen,
        er.primaryChouShen,
        er.primaryXianShen,
      ]
      return elements.filter(Boolean) as string[]
    }
    case 'keyword':
      return caseEntry.keywords ?? []
    case 'tag':
      return caseEntry.tags ?? []
    case 'strength':
      return er.strengthLevel ? [er.strengthLevel] : []
    case 'xiShen': {
      const xis = [er.primaryXiShen, er.primaryYongShen, er.primaryJiShen]
      return xis.filter(Boolean) as string[]
    }
    default:
      return []
  }
}

function getSortValue(
  caseEntry: CaseEntryV2,
  sortBy: 'qualityScore' | 'reliability' | 'createdAt' | 'updatedAt',
): number | undefined {
  switch (sortBy) {
    case 'qualityScore':
      return caseEntry.qualityScore
    case 'reliability':
      return caseEntry.reliability
    case 'createdAt':
      return caseEntry.createdAt
    case 'updatedAt':
      return caseEntry.updatedAt
    default:
      return undefined
  }
}
