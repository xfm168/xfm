/**
 * 命例搜索类型定义
 *
 * 职责：定义搜索字段、操作符、查询条件、结果和分面统计类型
 */

import type { CaseEntryV2 } from './caseLibraryTypesV2'

// ═══════════════════════════════════════════
// 1. 基础枚举
// ═══════════════════════════════════════════

/** 可搜索字段 */
export type SearchField =
  | 'pattern'
  | 'tenGod'
  | 'shenSha'
  | 'element'
  | 'keyword'
  | 'tag'
  | 'strength'
  | 'xiShen'

/** 搜索操作符 */
export type SearchOperator = 'eq' | 'contains' | 'gt' | 'lt' | 'in'

// ═══════════════════════════════════════════
// 2. 核心类型定义
// ═══════════════════════════════════════════

/** 单个搜索条件 */
export interface SearchCondition {
  field: SearchField
  operator: SearchOperator
  value: string | number | string[] | number[]
}

/** 搜索查询 */
export interface CaseSearchQuery {
  conditions: SearchCondition[]
  logic: 'AND' | 'OR'
  sortBy?: 'qualityScore' | 'reliability' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/** 搜索结果 */
export interface SearchResult {
  cases: CaseEntryV2[]
  total: number
  page: number
  hasMore: boolean
}

/** 分面值 */
export interface SearchFacetValue {
  value: string
  count: number
}

/** 分面统计 */
export interface SearchFacet {
  field: SearchField
  values: SearchFacetValue[]
}

// ═══════════════════════════════════════════
// 3. 工具函数
// ═══════════════════════════════════════════

/** 获取搜索字段显示名 */
export function getSearchFieldDisplayName(field: SearchField): string {
  const map: Record<SearchField, string> = {
    pattern: '格局',
    tenGod: '十神',
    shenSha: '神煞',
    element: '五行',
    keyword: '关键词',
    tag: '标签',
    strength: '强弱',
    xiShen: '喜用神',
  }
  return map[field]
}

/** 获取操作符显示名 */
export function getSearchOperatorDisplayName(op: SearchOperator): string {
  const map: Record<SearchOperator, string> = {
    eq: '等于',
    contains: '包含',
    gt: '大于',
    lt: '小于',
    in: '在列表中',
  }
  return map[op]
}

/** 验证搜索条件 */
export function validateSearchCondition(condition: SearchCondition): {
  valid: boolean
  error?: string
} {
  const validFields: SearchField[] = [
    'pattern', 'tenGod', 'shenSha', 'element', 'keyword', 'tag', 'strength', 'xiShen',
  ]
  if (!validFields.includes(condition.field)) {
    return { valid: false, error: `无效字段: ${condition.field}` }
  }

  const validOps: SearchOperator[] = ['eq', 'contains', 'gt', 'lt', 'in']
  if (!validOps.includes(condition.operator)) {
    return { valid: false, error: `无效操作符: ${condition.operator}` }
  }

  if (condition.value === undefined || condition.value === null) {
    return { valid: false, error: '值不能为空' }
  }

  if (condition.operator === 'in' && !Array.isArray(condition.value)) {
    return { valid: false, error: "'in' 操作符的值必须是数组" }
  }

  if ((condition.operator === 'gt' || condition.operator === 'lt') && typeof condition.value !== 'number') {
    return { valid: false, error: "'gt'/'lt' 操作符的值必须是数字" }
  }

  return { valid: true }
}

/** 创建默认搜索查询 */
export function createDefaultSearchQuery(): CaseSearchQuery {
  return {
    conditions: [],
    logic: 'AND',
    limit: 20,
    offset: 0,
  }
}
