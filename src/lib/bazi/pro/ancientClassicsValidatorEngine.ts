/**
 * Ancient Classics Validator Engine
 *
 * 职责：
 *   - 验证命例是否引用了指定的古籍来源
 *   - 检查引用覆盖率和必需来源
 *   - 批量验证、建议引用、全局覆盖率统计
 * 约束：
 *   - 不修改输入命例
 *   - 基于知识库提供智能引用建议
 */

import type { CaseEntryV2 } from './caseLibraryTypesV2'
import type {
  ClassicalSource,
  ClassicalReference,
  ClassicsValidationResult,
  ClassicsValidationReport,
} from './ancientClassicsValidatorTypes'
import { KNOWLEDGE_BASE } from './knowledgeBaseDatabase'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const ANCIENT_CLASSICS_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 合法古典来源集合
// ═══════════════════════════════════════════

const CLASSICAL_SOURCES: Set<string> = new Set<string>([
  '滴天髓', '子平真诠', '三命通会', '穷通宝鉴', '渊海子平',
  '神峰通考', '协纪辨方书', '星平会海', '命理正宗',
])

/** 判断字符串是否为已知古典来源 */
function isClassicalSource(name: string): boolean {
  return CLASSICAL_SOURCES.has(name)
}

// ═══════════════════════════════════════════
// 3. 内部辅助
// ═══════════════════════════════════════════

/** 从命例中提取古典引用来源及其数量 */
function extractClassicalSources(entry: CaseEntryV2): Record<string, number> {
  const sources: Record<string, number> = {}

  // 检查 referenceBooks
  for (const book of entry.referenceBooks) {
    if (isClassicalSource(book)) {
      sources[book] = (sources[book] ?? 0) + 1
    }
  }

  // 检查 evidence 中的 source 字段
  for (const ev of entry.evidence) {
    if (ev.source && isClassicalSource(ev.source)) {
      sources[ev.source] = (sources[ev.source] ?? 0) + 1
    }
  }

  return sources
}

/** 生成验证建议 */
function generateValidationRecommendations(
  totalReferences: number,
  missingSources: string[],
  bySource: Record<string, number>,
): string[] {
  const recommendations: string[] = []

  if (totalReferences === 0) {
    recommendations.push('命例未引用任何古籍来源，建议至少引用 1 部经典古籍')
  } else if (totalReferences === 1) {
    recommendations.push('仅引用 1 部古籍，建议增加引用以提高论证力度')
  }

  if (Object.keys(bySource).length === 1 && totalReferences >= 2) {
    recommendations.push('引用来源过于单一，建议参考多部古籍以增强说服力')
  }

  for (const source of missingSources) {
    recommendations.push(`建议补充引用《${source}》的相关论述`)
  }

  return recommendations
}

// ═══════════════════════════════════════════
// 4. 核心验证函数
// ═══════════════════════════════════════════

/**
 * 验证命例的古典引用
 * @param caseEntry - 命例条目
 * @param requiredSources - 必需的古典来源（可选）
 * @returns 古籍验证结果
 */
export function validateClassicalReferences(
  caseEntry: CaseEntryV2,
  requiredSources?: ClassicalSource[],
): ClassicsValidationResult {
  const bySource = extractClassicalSources(caseEntry)
  const totalReferences = Object.values(bySource).reduce((sum, count) => sum + count, 0)

  // 计算覆盖率：引用了至少 1 部古籍即为有覆盖，这里用引用来源种类数 / 知识库中的来源种类数
  const uniqueSources = Object.keys(bySource).length
  const totalClassicalSourcesInKB = new Set(KNOWLEDGE_BASE.map((kb) => kb.source)).size
  const referenceCoverage = totalClassicalSourcesInKB > 0
    ? Math.round((uniqueSources / totalClassicalSourcesInKB) * 100)
    : 0

  // 检查必需来源
  let requiredSourcesMet = true
  const missingSources: string[] = []

  if (requiredSources && requiredSources.length > 0) {
    for (const req of requiredSources) {
      if (!bySource[req] || bySource[req] === 0) {
        requiredSourcesMet = false
        missingSources.push(req)
      }
    }
  }

  const validationPassed = totalReferences > 0 && requiredSourcesMet
  const recommendations = generateValidationRecommendations(totalReferences, missingSources, bySource)

  return {
    caseId: caseEntry.caseId,
    totalReferences,
    bySource,
    referenceCoverage,
    requiredSourcesMet,
    validationPassed,
    missingSources,
    recommendations,
  }
}

// ═══════════════════════════════════════════
// 5. 批量验证
// ═══════════════════════════════════════════

/**
 * 批量验证命例的古典引用
 * @param cases - 命例数组
 * @param requiredSources - 必需的古典来源（可选）
 * @returns 古籍验证报告
 */
export function batchValidateClassicalReferences(
  cases: CaseEntryV2[],
  requiredSources?: ClassicalSource[],
): ClassicsValidationReport {
  const results = cases.map((c) => validateClassicalReferences(c, requiredSources))

  const passedCount = results.filter((r) => r.validationPassed).length
  const coverageRate = cases.length > 0
    ? Math.round((passedCount / cases.length) * 100)
    : 0

  const totalRefSum = results.reduce((sum, r) => sum + r.totalReferences, 0)
  const avgReferences = cases.length > 0
    ? Math.round((totalRefSum / cases.length) * 100) / 100
    : 0

  // 汇总各来源引用次数
  const sourceDistribution: Record<string, number> = {}
  for (const r of results) {
    for (const [source, count] of Object.entries(r.bySource)) {
      sourceDistribution[source] = (sourceDistribution[source] ?? 0) + count
    }
  }

  return {
    version: ANCIENT_CLASSICS_VERSION,
    totalCases: cases.length,
    coverageRate,
    avgReferences,
    sourceDistribution,
    generatedAt: Date.now(),
  }
}

// ═══════════════════════════════════════════
// 6. 覆盖率与建议
// ═══════════════════════════════════════════

/**
 * 获取最低覆盖率
 * @param cases - 命例数组
 * @param sources - 指定来源（可选），不指定则用全部古典来源
 * @returns 最低覆盖率（0-100）
 */
export function getMinimumClassicalCoverage(
  cases: CaseEntryV2[],
  sources?: string[],
): number {
  if (cases.length === 0) return 0

  const targetSources = sources ?? Array.from(CLASSICAL_SOURCES)
  let minCoverage = 100

  for (const c of cases) {
    const bySource = extractClassicalSources(c)
    const matchedCount = targetSources.filter((s) => bySource[s] && bySource[s] > 0).length
    const coverage = Math.round((matchedCount / targetSources.length) * 100)
    if (coverage < minCoverage) minCoverage = coverage
  }

  return minCoverage
}

/**
 * 基于命例内容建议应引用的古籍
 * @param entry - 命例条目
 * @returns 建议的古典引用列表
 */
export function suggestClassicalReferences(
  entry: CaseEntryV2,
): ClassicalReference[] {
  const suggestions: ClassicalReference[] = []
  const existingSources = new Set(entry.referenceBooks)

  const er = entry.expectedResult

  // 根据格局推荐
  if (er.primaryPattern) {
    const patternKB = KNOWLEDGE_BASE.filter(
      (kb) => kb.category === '格局' && !existingSources.has(kb.source),
    )
    for (const kb of patternKB) {
      if (kb.originalText.includes(er.primaryPattern!) || kb.keywords.some((k) => er.primaryPattern!.includes(k))) {
        suggestions.push({
          source: kb.source as ClassicalSource,
          level: 'primary',
          chapter: kb.chapter,
          originalText: kb.originalText,
          modernInterpretation: kb.modernExplanation,
          confidence: kb.confidence,
          relevanceScore: 0.9,
        })
      }
    }
  }

  // 根据喜用神推荐
  if (er.primaryXiShen || er.primaryYongShen) {
    const xiyongKB = KNOWLEDGE_BASE.filter(
      (kb) => kb.category === '喜用神' && !existingSources.has(kb.source),
    )
    for (const kb of xiyongKB) {
      if (!suggestions.some((s) => s.source === kb.source && s.chapter === kb.chapter)) {
        suggestions.push({
          source: kb.source as ClassicalSource,
          level: 'supporting',
          chapter: kb.chapter,
          originalText: kb.originalText,
          modernInterpretation: kb.modernExplanation,
          confidence: kb.confidence,
          relevanceScore: 0.7,
        })
      }
    }
  }

  // 根据十神推荐
  if (er.tenGodSummary) {
    const tenGodKB = KNOWLEDGE_BASE.filter(
      (kb) => kb.category === '十神' && !existingSources.has(kb.source),
    )
    for (const kb of tenGodKB) {
      if (kb.keywords.some((k) => er.tenGodSummary!.includes(k))) {
        suggestions.push({
          source: kb.source as ClassicalSource,
          level: 'secondary',
          chapter: kb.chapter,
          originalText: kb.originalText,
          modernInterpretation: kb.modernExplanation,
          confidence: kb.confidence,
          relevanceScore: 0.8,
        })
      }
    }
  }

  // 去重
  const seen = new Set<string>()
  return suggestions.filter((s) => {
    const key = `${s.source}-${s.chapter ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * 全局引用覆盖率统计
 * @returns 各来源的引用数量和覆盖率
 */
export function getSourceCoverageReport(): {
  source: string
  count: number
  coverage: number
}[] {
  const totalKB = KNOWLEDGE_BASE.length
  const sourceCount: Record<string, number> = {}

  for (const kb of KNOWLEDGE_BASE) {
    sourceCount[kb.source] = (sourceCount[kb.source] ?? 0) + 1
  }

  return Object.entries(sourceCount)
    .map(([source, count]) => ({
      source,
      count,
      coverage: Math.round((count / totalKB) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}