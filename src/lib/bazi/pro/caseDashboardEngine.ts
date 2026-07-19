/**
 * Case Dashboard Engine
 *
 * 职责：
 *   - 基于 v2 案例库生成综合仪表盘
 *   - 6 大板块：案例概览、质量评分、专家共识、回归分级、可信度、动态统计
 *   - 提供精简版快照
 * 约束：
 *   - 不修改已有文件
 *   - 纯函数设计（读取数据库状态，不修改）
 */

import type { CaseEntryV2, CaseCategoryV2 } from './caseLibraryTypesV2'
import type { ConsensusLevel } from './expertConsensusTypes'
import type { ReliabilityLevel } from './caseReliabilityTypes'
import type {
  CaseDashboard,
  CaseDashboardSection,
  CaseDashboardMetric,
  CaseDashboardSnapshot,
  DashboardOverallStatus,
  DashboardMetricStatus,
} from './caseDashboardTypes'

import {
  getAllCasesV2,
  getTotalCaseCountV2,
  getCaseStatisticsV2,
} from './caseDatabaseV2'

import { getQualityScoreDistribution } from './caseQualityScoreEngine'
import { calculateExpertConsensus } from './expertConsensusEngine'
import { getRegressionGoldSummary } from './regressionGoldEngine'
import {
  getReliabilityDistribution,
  getTopReliableCases,
} from './caseReliabilityEngine'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const CASE_DASHBOARD_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 内部辅助函数
// ═══════════════════════════════════════════

/** 计算最近 N 天内新增的案例数 */
function countRecentAdditions(cases: CaseEntryV2[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return cases.filter((c) => c.createdAt >= cutoff).length
}

/** 将数字转为指标状态（带阈值） */
function numericStatus(
  value: number,
  warningThreshold: number,
  criticalThreshold: number,
  invert = false,
): DashboardMetricStatus {
  if (invert) {
    if (value >= warningThreshold) return 'ok'
    if (value >= criticalThreshold) return 'warning'
    return 'critical'
  }
  if (value <= warningThreshold) return 'ok'
  if (value <= criticalThreshold) return 'warning'
  return 'critical'
}

/** 计算百分比 */
function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0
}

/** 计算共识等级分布 */
function getConsensusDistribution(cases: CaseEntryV2[]): Record<ConsensusLevel, number> {
  const distribution: Record<ConsensusLevel, number> = {
    unanimous: 0,
    strong: 0,
    moderate: 0,
    weak: 0,
    disputed: 0,
  }
  for (const c of cases) {
    const result = calculateExpertConsensus(c)
    distribution[result.consensusLevel]++
  }
  return distribution
}

/** 计算有专家观点的案例平均共识分 */
function getAverageConsensusScore(cases: CaseEntryV2[]): number {
  const withOpinions = cases.filter((c) => c.expertOpinions.length > 0)
  if (withOpinions.length === 0) return 0
  const total = withOpinions.reduce((sum, c) => {
    const result = calculateExpertConsensus(c)
    return sum + result.consensusScore
  }, 0)
  return Math.round(total / withOpinions.length)
}

/** 综合判断仪表盘整体状态 */
function determineOverallStatus(
  totalCases: number,
  lowQualityRatio: number,
  pendingRatio: number,
  goldRatio: number,
  deprecatedCount: number,
  conflictCount: number,
): DashboardOverallStatus {
  if (totalCases === 0) return 'critical'
  if (lowQualityRatio > 0.5) return 'critical'
  if (pendingRatio > 0.5) return 'critical'
  if (deprecatedCount > totalCases * 0.3) return 'critical'
  if (lowQualityRatio > 0.3) return 'warning'
  if (pendingRatio > 0.3) return 'warning'
  if (goldRatio < 0.1 && totalCases > 10) return 'warning'
  if (conflictCount > totalCases * 0.2) return 'warning'
  return 'healthy'
}

// ═══════════════════════════════════════════
// 3. 板块构建函数
// ═══════════════════════════════════════════

/** 板块 1：案例概览 */
function buildOverviewSection(counts: Record<CaseCategoryV2, number> & { total: number }): CaseDashboardSection {
  const total = counts.total
  const metrics: CaseDashboardMetric[] = [
    { label: '案例总数', value: total, status: total > 0 ? 'ok' : 'critical' },
    { label: '经典命例', value: counts.classic, status: 'ok' },
    { label: '匿名命例', value: counts.anonymous, status: 'ok' },
    { label: '回归样本', value: counts.regression, status: 'ok' },
    { label: '专家验证', value: counts.expertVerified, status: 'ok' },
    { label: '边缘案例', value: counts.edge, status: 'ok' },
    { label: '冲突案例', value: counts.conflict, status: numericStatus(counts.conflict, 0, 3) },
    { label: '历史命例', value: counts.historical, status: 'ok' },
    { label: '名人命例', value: counts.celebrity, status: 'ok' },
  ]
  return { title: '案例概览', metrics }
}

/** 板块 2：质量评分 */
function buildQualitySection(
  cases: CaseEntryV2[],
  stats: ReturnType<typeof getCaseStatisticsV2>,
): CaseDashboardSection {
  const distribution = getQualityScoreDistribution(cases)
  const lowQualityCount = cases.filter((c) => c.qualityScore < 60).length
  const learnableCount = cases.filter((c) => !c.excludeFromLearning && c.qualityScore >= 60).length

  const metrics: CaseDashboardMetric[] = [
    {
      label: '平均质量评分',
      value: stats.avgQualityScore,
      status: numericStatus(stats.avgQualityScore, 70, 50, true),
    },
    { label: '1星', value: distribution['1'], status: 'ok' },
    { label: '2星', value: distribution['2'], status: 'ok' },
    { label: '3星', value: distribution['3'], status: 'ok' },
    { label: '4星', value: distribution['4'], status: 'ok' },
    { label: '5星', value: distribution['5'], status: 'ok' },
    {
      label: '低质量案例',
      value: lowQualityCount,
      status: numericStatus(lowQualityCount, 3, 8),
    },
    {
      label: '可学习案例',
      value: learnableCount,
      status: learnableCount > 0 ? 'ok' : 'warning',
    },
  ]
  return { title: '质量评分', metrics }
}

/** 板块 3：专家共识 */
function buildConsensusSection(cases: CaseEntryV2[]): CaseDashboardSection {
  const withOpinions = cases.filter((c) => c.expertOpinions.length > 0)
  const avgConsensusScore = getAverageConsensusScore(cases)
  const distribution = getConsensusDistribution(cases)

  const metrics: CaseDashboardMetric[] = [
    {
      label: '有专家观点',
      value: withOpinions.length,
      status: withOpinions.length > 0 ? 'ok' : 'warning',
    },
    {
      label: '平均共识分',
      value: avgConsensusScore,
      status: numericStatus(avgConsensusScore, 70, 50, true),
    },
    { label: '完全一致', value: distribution.unanimous, status: 'ok' },
    { label: '强共识', value: distribution.strong, status: 'ok' },
    { label: '中等共识', value: distribution.moderate, status: 'ok' },
    { label: '弱共识', value: distribution.weak, status: 'ok' },
    {
      label: '争议',
      value: distribution.disputed,
      status: numericStatus(distribution.disputed, 2, 5),
    },
  ]
  return { title: '专家共识', metrics }
}

/** 板块 4：回归分级 */
function buildRegressionSection(cases: CaseEntryV2[]): CaseDashboardSection {
  const summary = getRegressionGoldSummary(cases)
  const goldRatio = percent(summary.goldCount, summary.total)

  const metrics: CaseDashboardMetric[] = [
    { label: 'Gold', value: summary.goldCount, status: summary.goldCount > 0 ? 'ok' : 'warning' },
    { label: 'Silver', value: summary.silverCount, status: 'ok' },
    { label: 'Bronze', value: summary.bronzeCount, status: 'ok' },
    { label: 'None', value: summary.noneCount, status: 'ok' },
    {
      label: 'Gold 占比',
      value: `${goldRatio}%`,
      status: numericStatus(goldRatio, 10, 5, true),
    },
  ]
  return { title: '回归分级', metrics }
}

/** 板块 5：可信度 */
function buildReliabilitySection(cases: CaseEntryV2[]): CaseDashboardSection {
  const total = cases.length
  const avgReliability = total > 0
    ? Math.round(cases.reduce((sum, c) => sum + c.reliability, 0) / total)
    : 0
  const distribution = getReliabilityDistribution(cases)
  const top10 = getTopReliableCases(cases, 10)

  const metrics: CaseDashboardMetric[] = [
    {
      label: '平均可信度',
      value: avgReliability,
      status: numericStatus(avgReliability, 70, 50, true),
    },
    { label: '优秀', value: distribution.excellent, status: 'ok' },
    { label: '良好', value: distribution.good, status: 'ok' },
    { label: '一般', value: distribution.fair, status: 'ok' },
    { label: '较差', value: distribution.poor, status: 'ok' },
    { label: '未验证', value: distribution.unverified, status: 'ok' },
    {
      label: 'Top10 最可信',
      value: top10.length,
      status: top10.length > 0 ? 'ok' : 'warning',
    },
  ]
  return { title: '可信度', metrics }
}

/** 板块 6：动态统计 */
function buildDynamicSection(
  cases: CaseEntryV2[],
  stats: ReturnType<typeof getCaseStatisticsV2>,
): CaseDashboardSection {
  const recentAdditions = countRecentAdditions(cases, 30)
  const withConflicts = cases.filter((c) => c.conflicts.length > 0).length
  const deprecatedCount = cases.filter((c) => c.reviewStatus === 'deprecated').length

  const metrics: CaseDashboardMetric[] = [
    {
      label: '最近30天新增',
      value: recentAdditions,
      status: 'ok',
    },
    {
      label: '待审核',
      value: stats.pendingReviewCount,
      status: numericStatus(stats.pendingReviewCount, 3, 8),
    },
    {
      label: '有冲突',
      value: withConflicts,
      status: numericStatus(withConflicts, 2, 5),
    },
    {
      label: '已废弃',
      value: deprecatedCount,
      status: numericStatus(deprecatedCount, 2, 5),
    },
  ]
  return { title: '动态统计', metrics }
}

// ═══════════════════════════════════════════
// 4. 核心函数
// ═══════════════════════════════════════════

/**
 * 生成完整案例库仪表盘
 * @returns 包含 6 大板块的 CaseDashboard
 */
export function generateCaseDashboard(): CaseDashboard {
  const allCases = getAllCasesV2()
  const counts = getTotalCaseCountV2()
  const stats = getCaseStatisticsV2()

  const totalCases = allCases.length
  const recentAdditions = countRecentAdditions(allCases, 30)

  const sections: CaseDashboardSection[] = [
    buildOverviewSection(counts),
    buildQualitySection(allCases, stats),
    buildConsensusSection(allCases),
    buildRegressionSection(allCases),
    buildReliabilitySection(allCases),
    buildDynamicSection(allCases, stats),
  ]

  const lowQualityCount = allCases.filter((c) => c.qualityScore < 60).length
  const lowQualityRatio = totalCases > 0 ? lowQualityCount / totalCases : 0
  const pendingRatio = totalCases > 0 ? stats.pendingReviewCount / totalCases : 0
  const goldSummary = getRegressionGoldSummary(allCases)
  const goldRatio = totalCases > 0 ? goldSummary.goldCount / totalCases : 0
  const deprecatedCount = allCases.filter((c) => c.reviewStatus === 'deprecated').length
  const conflictCount = allCases.filter((c) => c.conflicts.length > 0).length

  const overallStatus = determineOverallStatus(
    totalCases,
    lowQualityRatio,
    pendingRatio,
    goldRatio,
    deprecatedCount,
    conflictCount,
  )

  return {
    version: CASE_DASHBOARD_VERSION,
    generatedAt: Date.now(),
    overallStatus,
    sections,
    totalCases,
    recentAdditions,
  }
}

/**
 * 获取精简版仪表盘快照（仅关键指标）
 * @returns CaseDashboardSnapshot
 */
export function getDashboardSnapshot(): CaseDashboardSnapshot {
  const allCases = getAllCasesV2()
  const stats = getCaseStatisticsV2()
  const goldSummary = getRegressionGoldSummary(allCases)

  const totalCases = allCases.length
  const lowQualityCount = allCases.filter((c) => c.qualityScore < 60).length
  const goldRatio = totalCases > 0 ? Math.round((goldSummary.goldCount / totalCases) * 1000) / 10 : 0

  const pendingRatio = totalCases > 0 ? stats.pendingReviewCount / totalCases : 0
  const deprecatedCount = allCases.filter((c) => c.reviewStatus === 'deprecated').length
  const conflictCount = allCases.filter((c) => c.conflicts.length > 0).length

  const overallStatus = determineOverallStatus(
    totalCases,
    totalCases > 0 ? lowQualityCount / totalCases : 0,
    pendingRatio,
    totalCases > 0 ? goldSummary.goldCount / totalCases : 0,
    deprecatedCount,
    conflictCount,
  )

  return {
    version: CASE_DASHBOARD_VERSION,
    generatedAt: Date.now(),
    overallStatus,
    totalCases,
    avgQualityScore: stats.avgQualityScore,
    avgReliability: stats.avgReliability,
    goldRatio,
    pendingReviewCount: stats.pendingReviewCount,
    lowQualityCount,
  }
}
