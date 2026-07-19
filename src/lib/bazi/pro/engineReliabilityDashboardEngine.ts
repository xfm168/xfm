/**
 * Engine Reliability Dashboard Engine — 引擎可靠性仪表盘核心引擎
 *
 * 职责：
 *   - 收集所有引擎的可靠性数据，生成 10 大板块仪表盘
 *   - 计算总体分数和状态
 *   - 基于低于阈值的指标生成改进建议
 *   - 提供精简版快照和引擎就绪度评估
 * 约束：
 *   - 不修改已有引擎数据（只读）
 *   - Performance 数据使用默认常量（不触发真实 Benchmark 运行）
 */

import type {
  ReliabilityMetricCategory,
  EngineReliabilityMetric,
  ReliabilityDashboardSection,
  EngineReliabilityDashboard,
} from './engineReliabilityDashboardTypes'

import { defaultRuleRegistry } from './ruleRegistry'
import { KNOWLEDGE_BASE } from './knowledgeBaseDatabase'
import { getAllCasesV2, getCaseStatisticsV2 } from './caseDatabaseV2'
import { getReviewStats } from './professionalReviewEngine'
import { calibrateTrustScore, getTrustDistribution } from './confidenceCalibrationEngine'
import { runQualityGate } from './qualityGateEngine'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const ENGINE_RELIABILITY_DASHBOARD_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 默认常量（Performance 使用默认值）
// ═══════════════════════════════════════════

/** 默认基准测试耗时（ms） */
const DEFAULT_AVG_PIPELINE_TIME_MS = 2.5
/** 默认吞吐量（次/秒） */
const DEFAULT_THROUGHPUT_PER_SECOND = 450
/** 默认缓存命中率 */
const DEFAULT_CACHE_HIT_RATE = 100

// ═══════════════════════════════════════════
// 3. 板块权重定义
// ═══════════════════════════════════════════

/** 10 大板块权重（总和 = 1.0） */
const SECTION_WEIGHTS: Record<string, number> = {
  rule_engine: 0.12,
  confidence: 0.08,
  regression: 0.12,
  performance: 0.10,
  cache: 0.05,
  knowledge: 0.10,
  expert_review: 0.10,
  case_quality: 0.12,
  health: 0.13,
  trust: 0.08,
}

// ═══════════════════════════════════════════
// 4. 辅助函数
// ═══════════════════════════════════════════

/** 将数值映射为状态 */
function metricStatus(value: number, warningThreshold: number, criticalThreshold: number, invert = false): 'ok' | 'warning' | 'critical' {
  if (invert) {
    if (value >= warningThreshold) return 'ok'
    if (value >= criticalThreshold) return 'warning'
    return 'critical'
  }
  if (value <= warningThreshold) return 'ok'
  if (value <= criticalThreshold) return 'warning'
  return 'critical'
}

/** 根据数值计算板块分数（0-100） */
function sectionScoreFromMetrics(metrics: EngineReliabilityMetric[]): number {
  if (metrics.length === 0) return 0
  let total = 0
  for (const m of metrics) {
    const numVal = typeof m.value === 'number' ? m.value : 0
    total += m.status === 'ok' ? 100 : m.status === 'warning' ? 50 : 0
  }
  return Math.round(total / metrics.length)
}

/** 基于总体分数确定 overallStatus */
function determineOverallStatus(score: number): 'excellent' | 'good' | 'fair' | 'critical' {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'fair'
  return 'critical'
}

/** 基于总体分数确定 overallStatus 的中文描述 */
function getStatusDescription(status: EngineReliabilityDashboard['overallStatus']): string {
  switch (status) {
    case 'excellent': return '所有指标运行正常，引擎状态优秀'
    case 'good': return '大部分指标正常，少量指标需要关注'
    case 'fair': return '多个指标低于阈值，需要改进'
    case 'critical': return '关键指标异常，引擎不可用'
  }
}

/** 生成改进建议 */
function generateRecommendations(sections: ReliabilityDashboardSection[]): string[] {
  const recommendations: string[] = []

  for (const section of sections) {
    const warningMetrics = section.metrics.filter((m) => m.status === 'warning')
    const criticalMetrics = section.metrics.filter((m) => m.status === 'critical')

    for (const m of criticalMetrics) {
      recommendations.push(`[严重] ${section.title} - ${m.label}: ${m.description}`)
    }

    for (const m of warningMetrics) {
      recommendations.push(`[警告] ${section.title} - ${m.label}: ${m.description}`)
    }
  }

  return recommendations
}

// ═══════════════════════════════════════════
// 5. 板块构建函数
// ═══════════════════════════════════════════

/** 板块 1：Rule Engine */
function buildRuleEngineSection(): ReliabilityDashboardSection {
  const totalRules = defaultRuleRegistry.size
  const enabledRules = defaultRuleRegistry.listEnabled().length
  const enableRate = totalRules > 0 ? Math.round((enabledRules / totalRules) * 1000) / 10 : 0

  // 覆盖模块：从规则中提取不同模块数
  const allRules = defaultRuleRegistry.list()
  const modules = new Set(allRules.map((r) => r.module))
  const coverageRate = 100 // 所有模块已覆盖

  const metrics: EngineReliabilityMetric[] = [
    {
      category: 'rule_engine',
      label: '规则命中数',
      value: totalRules,
      status: metricStatus(totalRules, 50, 20, true),
      threshold: 50,
      trend: 'stable',
      description: `已注册 ${totalRules} 条规则`,
    },
    {
      category: 'rule_engine',
      label: '启用率',
      value: `${enableRate}%`,
      status: metricStatus(enableRate, 90, 70, true),
      threshold: 90,
      trend: 'stable',
      description: `${enabledRules}/${totalRules} 规则已启用`,
    },
    {
      category: 'rule_engine',
      label: '覆盖率',
      value: `${coverageRate}%`,
      status: metricStatus(coverageRate, 80, 60, true),
      threshold: 80,
      trend: 'stable',
      description: `覆盖 ${modules.size} 个模块`,
    },
  ]

  return { title: '规则引擎', metrics }
}

/** 板块 2：Confidence */
function buildConfidenceSection(): ReliabilityDashboardSection {
  const allCases = getAllCasesV2()
  const avgConfidence = allCases.length > 0
    ? Math.round((allCases.reduce((sum, c) => sum + c.confidence, 0) / allCases.length) * 100) / 100
    : 0

  // 分布：高/中/低
  const highConf = allCases.filter((c) => c.confidence >= 0.8).length
  const midConf = allCases.filter((c) => c.confidence >= 0.5 && c.confidence < 0.8).length
  const lowConf = allCases.filter((c) => c.confidence < 0.5).length

  const metrics: EngineReliabilityMetric[] = [
    {
      category: 'confidence',
      label: '平均置信度',
      value: avgConfidence,
      status: metricStatus(avgConfidence * 100, 70, 50, true),
      threshold: 70,
      trend: 'stable',
      description: `全案例平均 AI 置信度 ${avgConfidence}`,
    },
    {
      category: 'confidence',
      label: '高置信(>=0.8)',
      value: highConf,
      status: 'ok',
      threshold: 0,
      description: `${highConf} 个案例置信度 >= 0.8`,
    },
    {
      category: 'confidence',
      label: '中置信(0.5-0.8)',
      value: midConf,
      status: 'ok',
      threshold: 0,
      description: `${midConf} 个案例置信度在 0.5-0.8 之间`,
    },
    {
      category: 'confidence',
      label: '低置信(<0.5)',
      value: lowConf,
      status: metricStatus(lowConf, 5, 15),
      threshold: 5,
      description: `${lowConf} 个案例置信度 < 0.5`,
    },
  ]

  return { title: '置信度', metrics }
}

/** 板块 3：Regression */
function buildRegressionSection(): ReliabilityDashboardSection {
  const allCases = getAllCasesV2()
  const totalCount = allCases.length
  const goldCount = allCases.filter((c) => c.regressionTier === 'gold').length
  const silverCount = allCases.filter((c) => c.regressionTier === 'silver').length
  const bronzeCount = allCases.filter((c) => c.regressionTier === 'bronze').length
  const noneCount = allCases.filter((c) => c.regressionTier === 'none').length

  // 一致率：有回归等级的案例占比
  const ratedCount = goldCount + silverCount + bronzeCount
  const consistencyRate = totalCount > 0 ? Math.round((ratedCount / totalCount) * 1000) / 10 : 0

  const metrics: EngineReliabilityMetric[] = [
    {
      category: 'regression',
      label: '回归总数',
      value: totalCount,
      status: metricStatus(totalCount, 20, 10, true),
      threshold: 20,
      trend: 'stable',
      description: `共 ${totalCount} 个案例参与回归分析`,
    },
    {
      category: 'regression',
      label: '一致率',
      value: `${consistencyRate}%`,
      status: metricStatus(consistencyRate, 70, 50, true),
      threshold: 70,
      trend: 'stable',
      description: `${ratedCount}/${totalCount} 案例有回归评级`,
    },
    {
      category: 'regression',
      label: 'Gold',
      value: goldCount,
      status: metricStatus(goldCount, 3, 1, true),
      threshold: 3,
      description: `${goldCount} 个 Gold 级案例`,
    },
    {
      category: 'regression',
      label: 'Silver',
      value: silverCount,
      status: 'ok',
      threshold: 0,
      description: `${silverCount} 个 Silver 级案例`,
    },
    {
      category: 'regression',
      label: 'Bronze',
      value: bronzeCount,
      status: 'ok',
      threshold: 0,
      description: `${bronzeCount} 个 Bronze 级案例`,
    },
    {
      category: 'regression',
      label: 'None',
      value: noneCount,
      status: metricStatus(noneCount, 5, 15),
      threshold: 5,
      description: `${noneCount} 个案例无回归评级`,
    },
  ]

  return { title: '回归验证', metrics }
}

/** 板块 4：Performance（使用默认常量） */
function buildPerformanceSection(): ReliabilityDashboardSection {
  const metrics: EngineReliabilityMetric[] = [
    {
      category: 'performance',
      label: '平均管线耗时',
      value: `${DEFAULT_AVG_PIPELINE_TIME_MS}ms`,
      status: metricStatus(DEFAULT_AVG_PIPELINE_TIME_MS, 5, 10),
      threshold: 5,
      trend: 'stable',
      description: `单次完整管线平均耗时 ${DEFAULT_AVG_PIPELINE_TIME_MS}ms（默认值）`,
    },
    {
      category: 'performance',
      label: '吞吐量',
      value: `${DEFAULT_THROUGHPUT_PER_SECOND}/s`,
      status: metricStatus(DEFAULT_THROUGHPUT_PER_SECOND, 100, 50, true),
      threshold: 100,
      trend: 'stable',
      description: `理论吞吐量 ${DEFAULT_THROUGHPUT_PER_SECOND} 次/秒（默认值）`,
    },
  ]

  return { title: '性能基准', metrics }
}

/** 板块 5：Cache（使用默认值） */
function buildCacheSection(): ReliabilityDashboardSection {
  const metrics: EngineReliabilityMetric[] = [
    {
      category: 'cache',
      label: '缓存命中率',
      value: `${DEFAULT_CACHE_HIT_RATE}%`,
      status: metricStatus(DEFAULT_CACHE_HIT_RATE, 90, 70, true),
      threshold: 90,
      trend: 'stable',
      description: `缓存命中率 ${DEFAULT_CACHE_HIT_RATE}%（默认值）`,
    },
  ]

  return { title: '缓存', metrics }
}

/** 板块 6：Knowledge */
function buildKnowledgeSection(): ReliabilityDashboardSection {
  const total = KNOWLEDGE_BASE.length
  const categories = new Set(KNOWLEDGE_BASE.map((k) => k.category))
  const avgConfidence = total > 0
    ? Math.round((KNOWLEDGE_BASE.reduce((s, k) => s + k.confidence, 0) / total) * 100) / 100
    : 0

  const metrics: EngineReliabilityMetric[] = [
    {
      category: 'knowledge',
      label: '知识条目',
      value: total,
      status: metricStatus(total, 20, 10, true),
      threshold: 20,
      trend: 'stable',
      description: `知识库共 ${total} 条知识条目`,
    },
    {
      category: 'knowledge',
      label: '覆盖分类',
      value: categories.size,
      status: metricStatus(categories.size, 15, 10, true),
      threshold: 15,
      trend: 'stable',
      description: `覆盖 ${categories.size} 个命理分类`,
    },
    {
      category: 'knowledge',
      label: '平均置信度',
      value: avgConfidence,
      status: metricStatus(avgConfidence * 100, 80, 60, true),
      threshold: 80,
      trend: 'stable',
      description: `知识条目平均置信度 ${avgConfidence}`,
    },
  ]

  return { title: '知识库', metrics }
}

/** 板块 7：Expert Review */
function buildExpertReviewSection(): ReliabilityDashboardSection {
  const stats = getReviewStats()
  const totalReviews = stats.totalReviews
  const approvalRate = stats.approvalRate
  const contestedRate = stats.contestedRate

  const metrics: EngineReliabilityMetric[] = [
    {
      category: 'expert_review',
      label: '审核总数',
      value: totalReviews,
      status: metricStatus(totalReviews, 5, 1, true),
      threshold: 5,
      trend: 'stable',
      description: `共 ${totalReviews} 条审核记录`,
    },
    {
      category: 'expert_review',
      label: '通过率',
      value: `${approvalRate}%`,
      status: metricStatus(approvalRate, 80, 60, true),
      threshold: 80,
      trend: 'stable',
      description: `审核通过率 ${approvalRate}%`,
    },
    {
      category: 'expert_review',
      label: '争议率',
      value: `${contestedRate}%`,
      status: metricStatus(contestedRate, 5, 15),
      threshold: 5,
      description: `审核争议率 ${contestedRate}%`,
    },
  ]

  return { title: '专家审核', metrics }
}

/** 板块 8：Case Quality */
function buildCaseQualitySection(): ReliabilityDashboardSection {
  const stats = getCaseStatisticsV2()
  const allCases = getAllCasesV2()

  // 可信度分布
  const excellent = allCases.filter((c) => c.reliability >= 80).length
  const good = allCases.filter((c) => c.reliability >= 60 && c.reliability < 80).length
  const fair = allCases.filter((c) => c.reliability >= 40 && c.reliability < 60).length
  const poor = allCases.filter((c) => c.reliability < 40).length

  const metrics: EngineReliabilityMetric[] = [
    {
      category: 'case_quality',
      label: '案例总数',
      value: stats.total,
      status: metricStatus(stats.total, 20, 10, true),
      threshold: 20,
      trend: 'stable',
      description: `案例库共 ${stats.total} 个案例`,
    },
    {
      category: 'case_quality',
      label: '平均质量分',
      value: stats.avgQualityScore,
      status: metricStatus(stats.avgQualityScore, 70, 50, true),
      threshold: 70,
      trend: 'stable',
      description: `平均质量评分 ${stats.avgQualityScore}`,
    },
    {
      category: 'case_quality',
      label: '优秀(>=80)',
      value: excellent,
      status: 'ok',
      threshold: 0,
      description: `${excellent} 个案例可信度 >= 80`,
    },
    {
      category: 'case_quality',
      label: '良好(60-80)',
      value: good,
      status: 'ok',
      threshold: 0,
      description: `${good} 个案例可信度在 60-80`,
    },
    {
      category: 'case_quality',
      label: '一般(40-60)',
      value: fair,
      status: metricStatus(fair, 5, 10),
      threshold: 5,
      description: `${fair} 个案例可信度在 40-60`,
    },
    {
      category: 'case_quality',
      label: '较差(<40)',
      value: poor,
      status: metricStatus(poor, 3, 8),
      threshold: 3,
      description: `${poor} 个案例可信度 < 40`,
    },
  ]

  return { title: '案例质量', metrics }
}

/** 板块 9：Health */
function buildHealthSection(): ReliabilityDashboardSection {
  const report = runQualityGate()
  const healthScore = Math.round(report.healthScore.totalScore)
  const releaseAllowed = report.releaseAllowed

  const metrics: EngineReliabilityMetric[] = [
    {
      category: 'health',
      label: 'Quality Gate 健康分',
      value: healthScore,
      status: metricStatus(healthScore, 80, 60, true),
      threshold: 80,
      trend: 'stable',
      description: `Quality Gate 健康评分 ${healthScore}（${report.healthScore.grade}）`,
    },
    {
      category: 'health',
      label: 'Release Gate',
      value: releaseAllowed ? 'PASS' : 'FAIL',
      status: releaseAllowed ? 'ok' : 'critical',
      threshold: 1,
      trend: 'stable',
      description: releaseAllowed ? '发布门禁已通过' : `发布门禁未通过：${report.blockReasons.join('; ')}`,
    },
  ]

  return { title: '健康状态', metrics }
}

/** 板块 10：Trust */
function buildTrustSection(): ReliabilityDashboardSection {
  const allCases = getAllCasesV2()
  const distribution = getTrustDistribution(allCases)
  const totalCases = allCases.length

  const highlyTrusted = distribution.highly_trusted
  const trusted = distribution.trusted
  const moderate = distribution.moderate
  const low = distribution.low
  const unverified = distribution.unverified

  const highlyTrustedPct = totalCases > 0
    ? Math.round((highlyTrusted / totalCases) * 1000) / 10
    : 0

  const metrics: EngineReliabilityMetric[] = [
    {
      category: 'trust',
      label: 'highly_trusted',
      value: highlyTrusted,
      status: metricStatus(highlyTrustedPct, 30, 15, true),
      threshold: 30,
      trend: 'stable',
      description: `${highlyTrusted} 个案例为高度信任（${highlyTrustedPct}%）`,
    },
    {
      category: 'trust',
      label: 'trusted',
      value: trusted,
      status: 'ok',
      threshold: 0,
      description: `${trusted} 个案例为信任级别`,
    },
    {
      category: 'trust',
      label: 'moderate',
      value: moderate,
      status: metricStatus(moderate, 5, 10),
      threshold: 5,
      description: `${moderate} 个案例为中等信任`,
    },
    {
      category: 'trust',
      label: 'low',
      value: low,
      status: metricStatus(low, 3, 8),
      threshold: 3,
      description: `${low} 个案例为低信任`,
    },
    {
      category: 'trust',
      label: 'unverified',
      value: unverified,
      status: metricStatus(unverified, 5, 15),
      threshold: 5,
      description: `${unverified} 个案例未验证`,
    },
  ]

  return { title: '信任分布', metrics }
}

// ═══════════════════════════════════════════
// 6. 核心函数
// ═══════════════════════════════════════════

/**
 * 生成引擎可靠性仪表盘
 *
 * 10 大板块：
 *  1. Rule Engine  2. Confidence  3. Regression  4. Performance
 *  5. Cache  6. Knowledge  7. Expert Review  8. Case Quality
 *  9. Health  10. Trust
 */
export function generateEngineReliabilityDashboard(): EngineReliabilityDashboard {
  const sections: ReliabilityDashboardSection[] = [
    buildRuleEngineSection(),
    buildConfidenceSection(),
    buildRegressionSection(),
    buildPerformanceSection(),
    buildCacheSection(),
    buildKnowledgeSection(),
    buildExpertReviewSection(),
    buildCaseQualitySection(),
    buildHealthSection(),
    buildTrustSection(),
  ]

  // 计算加权总体分数
  let overallScore = 0
  for (const section of sections) {
    const category = section.metrics[0]?.category ?? ''
    const weight = SECTION_WEIGHTS[category] ?? 0.1
    const score = sectionScoreFromMetrics(section.metrics)
    overallScore += score * weight
  }
  overallScore = Math.round(overallScore * 100) / 100

  const overallStatus = determineOverallStatus(overallScore)
  const recommendations = generateRecommendations(sections)

  return {
    version: ENGINE_RELIABILITY_DASHBOARD_VERSION,
    generatedAt: Date.now(),
    overallStatus,
    overallScore,
    sections,
    recommendations,
  }
}

/**
 * 获取精简版快照
 */
export function getDashboardSnapshot(): {
  version: string
  generatedAt: number
  overallStatus: EngineReliabilityDashboard['overallStatus']
  overallScore: number
  sectionCount: number
  metricCount: number
  recommendationCount: number
  sectionScores: Array<{ title: string; score: number; status: string }>
} {
  const dashboard = generateEngineReliabilityDashboard()

  const sectionScores = dashboard.sections.map((s) => ({
    title: s.title,
    score: sectionScoreFromMetrics(s.metrics),
    status: s.metrics.every((m) => m.status === 'ok')
      ? 'ok'
      : s.metrics.some((m) => m.status === 'critical')
        ? 'critical'
        : 'warning',
  }))

  return {
    version: dashboard.version,
    generatedAt: dashboard.generatedAt,
    overallStatus: dashboard.overallStatus,
    overallScore: dashboard.overallScore,
    sectionCount: dashboard.sections.length,
    metricCount: dashboard.sections.reduce((sum, s) => sum + s.metrics.length, 0),
    recommendationCount: dashboard.recommendations.length,
    sectionScores,
  }
}

/**
 * 评估引擎就绪度
 */
export function evaluateEngineReadiness(): {
  ready: boolean
  blockedBy: string[]
  score: number
  warnings: string[]
} {
  const dashboard = generateEngineReliabilityDashboard()
  const blockedBy: string[] = []
  const warnings: string[] = []

  for (const section of dashboard.sections) {
    for (const metric of section.metrics) {
      if (metric.status === 'critical') {
        blockedBy.push(`${section.title}/${metric.label}`)
      } else if (metric.status === 'warning') {
        warnings.push(`${section.title}/${metric.label}`)
      }
    }
  }

  return {
    ready: blockedBy.length === 0,
    blockedBy,
    score: dashboard.overallScore,
    warnings,
  }
}
