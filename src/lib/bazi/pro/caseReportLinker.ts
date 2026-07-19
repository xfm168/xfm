/**
 * Case Report Linker
 *
 * 职责：
 *   - 从 MasterReport 提取关键命理特征
 *   - 在 caseDatabaseV2 中搜索最相似的命例
 *   - 返回 Top N 推荐，含共同特点、不同点、历史结果、调理建议、可信度说明
 * 约束：
 *   - 只读引用 MasterReport，不修改 Module 7
 *   - 0 TS Error 目标
 */

import type { HeavenlyStem, FiveElement } from '@/lib/core/types/base'
import type { MasterReport } from './masterReportTypes'
import type { CaseEntryV2 } from './caseLibraryTypesV2'
import type { CaseComparisonDetail, SimilarCasesReport, LinkerOptions } from './caseReportLinkerTypes'

import { getAllCasesV2 } from './caseDatabaseV2'
import { getAllPatternNames } from './patternDatabase'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const CASE_REPORT_LINKER_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 报告特征提取
// ═══════════════════════════════════════════

/** 从 MasterReport 中提取的关键特征 */
export interface ReportFeatures {
  dayMaster: HeavenlyStem
  dayMasterElement: FiveElement
  pattern?: string
  strength?: string
  xiShen?: FiveElement
  yongShen?: FiveElement
  tenGodSummary?: string
}

/** 从 MasterReport 中提取关键命理特征 */
export function extractFeaturesFromReport(report: MasterReport): ReportFeatures {
  return {
    dayMaster: report.dayMaster,
    dayMasterElement: report.dayMasterElement,
    pattern: extractPatternFromReport(report),
    strength: extractStrengthFromReport(report),
    xiShen: extractXiShenFromReport(report),
    yongShen: extractYongShenFromReport(report),
    tenGodSummary: extractTenGodSummaryFromReport(report),
  }
}

/** 从 overallAssessment.patternEvaluation 中匹配已知格局名称 */
function extractPatternFromReport(report: MasterReport): string | undefined {
  const text = report.overallAssessment?.patternEvaluation ?? ''
  if (!text) return undefined

  const allPatterns = getAllPatternNames()
  for (const name of allPatterns) {
    if (text.includes(name)) {
      return name
    }
  }
  return undefined
}

/** 从 overallAssessment / explains 中提取强弱等级 */
function extractStrengthFromReport(report: MasterReport): string | undefined {
  const summary = report.overallAssessment?.summary ?? ''
  const patternEval = report.overallAssessment?.patternEvaluation ?? ''
  const combined = summary + patternEval

  const levels = ['极强', '偏强', '中和', '偏弱', '极弱']
  for (const level of levels) {
    if (combined.includes(level)) {
      return level
    }
  }

  // 尝试从 explains 中查找
  for (const entry of report.explains) {
    if (entry.topic === '日主强弱' || entry.keywords.some(k => k.includes('强弱') || k.includes('旺衰'))) {
      for (const level of levels) {
        if (entry.professionalExplanation.includes(level) || entry.plainExplanation.includes(level)) {
          return level
        }
      }
    }
  }

  return undefined
}

/** 从 recommendations 中提取喜神（五行补救类建议） */
function extractXiShenFromReport(report: MasterReport): FiveElement | undefined {
  for (const rec of report.recommendations) {
    if (rec.category === '五行补救' && rec.relatedElements.length > 0) {
      return rec.relatedElements[0]
    }
  }
  return undefined
}

/** 从 recommendations 中提取用神（五行补救类建议的第二个元素） */
function extractYongShenFromReport(report: MasterReport): FiveElement | undefined {
  for (const rec of report.recommendations) {
    if (rec.category === '五行补救' && rec.relatedElements.length > 1) {
      return rec.relatedElements[1]
    }
  }
  return undefined
}

/** 从 explains 中提取十神摘要 */
function extractTenGodSummaryFromReport(report: MasterReport): string | undefined {
  for (const entry of report.explains) {
    if (entry.topic === '十神分析' || entry.keywords.some(k => k.includes('十神'))) {
      return entry.professionalExplanation.slice(0, 80)
    }
  }
  return undefined
}

// ═══════════════════════════════════════════
// 3. 相似度计算
// ═══════════════════════════════════════════

/**
 * 计算两个命例之间的相似度（0-100）
 * 权重：日主五行(20%) + 格局(25%) + 强弱(15%) + 喜用神(25%) + 性别(5%) + 十神摘要(10%)
 */
export function calculateSimilarityScore(caseA: CaseEntryV2, caseB: CaseEntryV2): number {
  const erA = caseA.expectedResult
  const erB = caseB.expectedResult
  let score = 0

  // 日主五行 20%
  if (erA.dayMasterElement && erB.dayMasterElement && erA.dayMasterElement === erB.dayMasterElement) {
    score += 20
  }

  // 格局 25%
  if (erA.primaryPattern && erB.primaryPattern && erA.primaryPattern === erB.primaryPattern) {
    score += 25
  }

  // 强弱 15%
  if (erA.strengthLevel && erB.strengthLevel && erA.strengthLevel === erB.strengthLevel) {
    score += 15
  }

  // 喜用神 25%
  const xiShenMatch = (
    (erA.primaryXiShen && erB.primaryXiShen && erA.primaryXiShen === erB.primaryXiShen) ||
    (erA.primaryYongShen && erB.primaryYongShen && erA.primaryYongShen === erB.primaryYongShen)
  )
  if (xiShenMatch) {
    score += 25
  }

  // 性别 5%
  if (caseA.gender && caseB.gender && caseA.gender === caseB.gender) {
    score += 5
  }

  // 十神摘要 10%
  if (erA.tenGodSummary && erB.tenGodSummary && erA.tenGodSummary === erB.tenGodSummary) {
    score += 10
  }

  return score
}

/** 计算报告特征与命例之间的相似度（内部辅助） */
function calculateReportToCaseSimilarity(features: ReportFeatures, caseEntry: CaseEntryV2): number {
  const er = caseEntry.expectedResult
  let score = 0

  // 日主五行 20%
  if (features.dayMasterElement && er.dayMasterElement && features.dayMasterElement === er.dayMasterElement) {
    score += 20
  }

  // 格局 25%
  if (features.pattern && er.primaryPattern && features.pattern === er.primaryPattern) {
    score += 25
  }

  // 强弱 15%
  if (features.strength && er.strengthLevel && features.strength === er.strengthLevel) {
    score += 15
  }

  // 喜用神 25%
  const xiShenMatch = (
    (features.xiShen && er.primaryXiShen && features.xiShen === er.primaryXiShen) ||
    (features.yongShen && er.primaryYongShen && features.yongShen === er.primaryYongShen)
  )
  if (xiShenMatch) {
    score += 25
  }

  // 性别 5% — MasterReport 无性别信息，不加分

  // 十神摘要 10%
  if (features.tenGodSummary && er.tenGodSummary && features.tenGodSummary === er.tenGodSummary) {
    score += 10
  }

  return score
}

// ═══════════════════════════════════════════
// 4. 核心推荐函数
// ═══════════════════════════════════════════

/**
 * 为 MasterReport 查找最相似的命例
 * @param masterReport - Module 7 最终报告（只读引用）
 * @param options - 关联器选项
 * @returns 相似案例报告
 */
export function findSimilarCasesForReport(
  masterReport: MasterReport,
  options?: LinkerOptions,
): SimilarCasesReport {
  const features = extractFeaturesFromReport(masterReport)
  const allCases = getAllCasesV2()

  const limit = options?.limit ?? 5
  const minSimilarity = options?.minSimilarity ?? 0
  const minReliability = options?.minReliability ?? 0

  const scored = allCases
    .filter((c) => c.reliability >= minReliability)
    .map((c) => ({
      caseEntry: c,
      similarityScore: calculateReportToCaseSimilarity(features, c),
    }))
    .filter((s) => s.similarityScore >= minSimilarity)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit)

  const topRecommendations = scored.map((s) =>
    buildCaseComparisonDetail(s.caseEntry, s.similarityScore, features, options),
  )

  const summary = generateSummary(features, topRecommendations)
  const targetCaseId = `REPORT-${masterReport.dayMaster}-${Date.now()}`

  return {
    targetCaseId,
    topRecommendations,
    summary,
    generatedAt: Date.now(),
  }
}

// ═══════════════════════════════════════════
// 5. 辅助构造函数
// ═══════════════════════════════════════════

/** 构造单个命例比较详情 */
function buildCaseComparisonDetail(
  caseEntry: CaseEntryV2,
  similarityScore: number,
  features: ReportFeatures,
  options?: LinkerOptions,
): CaseComparisonDetail {
  const er = caseEntry.expectedResult
  const commonFeatures: string[] = []
  const differences: string[] = []

  // 共同特点与不同点
  if (features.dayMasterElement && er.dayMasterElement) {
    if (features.dayMasterElement === er.dayMasterElement) {
      commonFeatures.push(`日主五行同为${er.dayMasterElement}`)
    } else {
      differences.push(`日主五行不同：报告为${features.dayMasterElement}，命例为${er.dayMasterElement}`)
    }
  }

  if (features.pattern && er.primaryPattern) {
    if (features.pattern === er.primaryPattern) {
      commonFeatures.push(`格局同为${er.primaryPattern}`)
    } else {
      differences.push(`格局不同：报告为${features.pattern}，命例为${er.primaryPattern}`)
    }
  }

  if (features.strength && er.strengthLevel) {
    if (features.strength === er.strengthLevel) {
      commonFeatures.push(`强弱同为${er.strengthLevel}`)
    } else {
      differences.push(`强弱不同：报告为${features.strength}，命例为${er.strengthLevel}`)
    }
  }

  if (features.xiShen && er.primaryXiShen) {
    if (features.xiShen === er.primaryXiShen) {
      commonFeatures.push(`喜神同为${er.primaryXiShen}`)
    } else {
      differences.push(`喜神不同：报告为${features.xiShen}，命例为${er.primaryXiShen}`)
    }
  }

  if (caseEntry.gender) {
    commonFeatures.push(`性别：${caseEntry.gender === 'male' ? '男' : '女'}性`)
  }

  // 若用户不请求不同点，且无任何不同点，则留空
  if (options?.includeDifferences === false) {
    differences.length = 0
  }

  // 历史结果描述
  const historicalResult = `该命例（${caseEntry.caseId}）为${caseEntry.category}类别，日主${caseEntry.dayGan}，${er.primaryPattern ? `格局${er.primaryPattern}` : '格局未识别'}，${er.strengthLevel ? `日主${er.strengthLevel}` : '强弱未评'}。来源：${caseEntry.source}。`

  // 调理建议
  const suggestion = caseEntry.expectedResult.primaryXiShen
    ? `建议加强${caseEntry.expectedResult.primaryXiShen}五行调理，参考该命例的用神配置。`
    : '建议参考该命例的详细用神配置进行调理。'

  // 可信度说明
  const credibilityNote = `命例可信度评分 ${caseEntry.reliability}/100，${caseEntry.reliability >= 80 ? '可信度高，可直接参考' : caseEntry.reliability >= 60 ? '可信度中等，建议交叉验证' : '可信度较低，仅供参考'}。验证专家数：${caseEntry.verifiedBy.length}。`

  return {
    caseId: caseEntry.caseId,
    name: caseEntry.name,
    similarityScore,
    reliability: caseEntry.reliability,
    commonFeatures,
    differences,
    historicalResult,
    suggestion,
    credibilityNote,
  }
}

/** 生成报告摘要 */
function generateSummary(
  features: ReportFeatures,
  recommendations: CaseComparisonDetail[],
): string {
  if (recommendations.length === 0) {
    return `未找到与日主${features.dayMaster}（${features.dayMasterElement}）相似的命例。建议扩大搜索范围或降低相似度阈值。`
  }

  const top = recommendations[0]
  return `为日主${features.dayMaster}（${features.dayMasterElement}）找到 ${recommendations.length} 个相似命例。最相似为 ${top.caseId}${top.name ? `（${top.name}）` : ''}，相似度 ${top.similarityScore} 分，可信度 ${top.reliability}/100。`
}
