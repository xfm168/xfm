/**
 * V4.5 Phase 2: Expert Validation Center — 专家验证中心核心引擎
 *
 * 职责：生成验证中心报告、差异分析、学习队列更新、汇总生成
 * 约束：不参与任何命理计算，仅处理验证数据和生成报告
 */

import { createChain, createTreeNode, DerivationStep } from './types'

import type {
  ExpertValidationRecord,
  ExpertValidationCenterReport,
  ExpertValidationOptions,
  DifferenceReport,
  DifferenceItem,
  LearningQueueItem,
  VerdictType,
} from './knowledgeBaseTypes'

import {
  KNOWLEDGE_BASE,
  EXPERT_VALIDATIONS,
  LEARNING_QUEUE_DATA,
  REGRESSION_LOCKS,
  getAllValidations,
  getUnresolvedLearningQueue,
  getActiveLocks,
} from './knowledgeBaseDatabase'

// ═══════════════════════════════════════════
// 版本号
// ═══════════════════════════════════════════

/** 专家验证中心引擎版本号 */
export const EXPERT_VALIDATION_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 辅助常量
// ═══════════════════════════════════════════

/** verdict → 差异严重程度映射 */
const VERDICT_SEVERITY_MAP: Record<VerdictType, DifferenceItem['severity'] | null> = {
  agree: null,
  disagree: 'critical',
  partially_agree: 'major',
  unclear: 'minor',
}

/** verdict → 可能原因描述映射 */
const VERDICT_CAUSE_MAP: Record<string, string> = {
  disagree: '系统结论与专家结论存在根本性分歧，可能涉及规则逻辑或古籍理解偏差',
  partially_agree: '系统结论部分正确，但在某些维度上与专家判断不一致',
  unclear: '信息不充分或案例边界模糊，需要更多上下文才能做出准确判断',
}

// ═══════════════════════════════════════════
// 核心函数
// ═══════════════════════════════════════════

/**
 * 生成专家验证中心报告（主入口）
 *
 * 流程：
 * 1. 获取验证记录（按 statusFilter/caseIds 过滤）
 * 2. 按状态统计（pending/verified/disputed/deprecated）
 * 3. 计算平均一致率和平均评分
 * 4. 为每条验证记录生成差异报告（仅 disputed/disagree 的记录）
 * 5. 获取学习队列（未解决的争议案例）
 * 6. 获取回归锁
 * 7. 生成报告
 *
 * @param options - 可选的验证选项
 * @param options.caseIds - 过滤指定命例 ID
 * @param options.statusFilter - 过滤指定状态
 * @param options.includeDisputed - 是否包含有争议的记录（默认 true）
 * @param options.includeLearningQueue - 是否包含学习队列（默认 true）
 * @returns 完整的验证中心报告
 */
export function generateValidationCenterReport(
  options?: ExpertValidationOptions,
): ExpertValidationCenterReport {
  const startTime = Date.now()
  const warnings: string[] = []
  const chainSteps: DerivationStep[] = []

  // 1. 获取验证记录
  const validations = options
    ? EXPERT_VALIDATIONS.filter((v) => {
      if (options.caseIds && options.caseIds.length > 0) {
        if (!options.caseIds.includes(v.caseId)) return false
      }
      if (options.statusFilter && options.statusFilter.length > 0) {
        if (!options.statusFilter.includes(v.status)) return false
      }
      return true
    })
    : EXPERT_VALIDATIONS

  if (validations.length === 0) {
    warnings.push('未找到匹配的验证记录，报告将为空')
  }

  // 2. 按状态统计
  const statusBreakdown = {
    pending: 0,
    verified: 0,
    disputed: 0,
    deprecated: 0,
  }
  for (const v of validations) {
    statusBreakdown[v.status]++
  }

  // 3. 计算平均一致率和平均评分
  const totalValidations = validations.length
  const averageConsistencyRate =
    totalValidations > 0
      ? validations.reduce((sum, v) => sum + v.consistencyRate, 0) / totalValidations
      : 0

  const averageScore =
    totalValidations > 0
      ? validations.reduce((sum, v) => sum + v.score, 0) / totalValidations
      : 0

  chainSteps.push(createTreeNode({
    id: 'expert-validation-stats',
    name: '验证记录统计',
    input: { totalValidations },
    output: { averageConsistencyRate, averageScore },
    ruleDescription: `共 ${totalValidations} 条记录，通过 ${validations.filter(v => v.verdict === 'agree').length} 条`,
    algorithmVersion: EXPERT_VALIDATION_VERSION,
    confidence: totalValidations > 0 ? averageConsistencyRate : 0,
  }))

  // 4. 为每条有差异的验证记录生成差异报告
  const includeDisputed = options?.includeDisputed !== false
  const differenceReports: DifferenceReport[] = []
  if (includeDisputed) {
    for (const validation of validations) {
      if (validation.verdict !== 'agree') {
        differenceReports.push(analyzeDifference(validation))
      }
    }
  }

  chainSteps.push(createTreeNode({
    id: 'expert-validation-diff',
    name: '差异分析',
    input: { includeDisputed },
    output: { differenceReportCount: differenceReports.length },
    ruleDescription: `生成 ${differenceReports.length} 份差异报告`,
    algorithmVersion: EXPERT_VALIDATION_VERSION,
    confidence: 1,
  }))

  // 5. 获取学习队列
  const includeLearningQueue = options?.includeLearningQueue !== false
  const existingQueue = getUnresolvedLearningQueue()
  const learningQueue = includeLearningQueue
    ? updateLearningQueue(validations, existingQueue)
    : []

  // 6. 获取回归锁
  const regressionLocks = getActiveLocks()

  // 7. 生成报告
  const computeTimeMs = Date.now() - startTime

  const chain = createChain(chainSteps, computeTimeMs, {
    engineVersion: EXPERT_VALIDATION_VERSION,
    algorithmVersion: EXPERT_VALIDATION_VERSION,
  })

  return {
    version: EXPERT_VALIDATION_VERSION,
    generatedAt: Date.now(),
    totalValidations,
    statusBreakdown,
    averageConsistencyRate: Math.round(averageConsistencyRate * 10000) / 10000,
    averageScore: Math.round(averageScore * 100) / 100,
    validations,
    differenceReports,
    learningQueue,
    regressionLocks,
    warnings,
    computeTimeMs,
    derivationChain: chain,
  }
}

/**
 * 分析验证记录的差异
 *
 * 对于 verdict 不是 'agree' 的验证记录，生成差异报告。
 * 由于 ExpertValidationRecord 中只有文本结论（systemConclusion/expertConclusion），
 * 没有结构化字段对比，因此生成一个整体差异项：
 * - disagree → critical
 * - partially_agree → major
 * - unclear → minor
 *
 * @param validation - 专家验证记录
 * @returns 差异报告
 */
function analyzeDifference(validation: ExpertValidationRecord): DifferenceReport {
  const severity = VERDICT_SEVERITY_MAP[validation.verdict]
  const possibleCause = VERDICT_CAUSE_MAP[validation.verdict] ?? '未知差异原因'

  const item: DifferenceItem = {
    field: 'overall_conclusion',
    systemValue: validation.systemConclusion,
    expertValue: validation.expertConclusion,
    severity: severity ?? 'info',
    possibleCause,
    affectedRules: [...validation.affectedRules],
    affectedModules: [...validation.affectedModules],
  }

  // 根据差异严重程度生成建议
  const recommendations = generateRecommendations(item)

  return {
    validationId: validation.validationId,
    generatedAt: Date.now(),
    totalDifferences: 1,
    items: [item],
    summary: `验证记录 ${validation.validationId}（案例 ${validation.caseId}）：系统结论与专家结论存在差异（${validation.verdict}），严重程度：${item.severity}`,
    recommendations,
  }
}

/**
 * 根据差异项生成改进建议
 *
 * @param item - 差异项
 * @returns 建议列表
 */
function generateRecommendations(item: DifferenceItem): string[] {
  const recommendations: string[] = []

  if (item.severity === 'critical') {
    recommendations.push(
      '建议优先审查相关规则的逻辑正确性，与古籍原文逐条比对',
      '考虑引入更多经典命例进行回归验证',
    )
  }

  if (item.severity === 'major') {
    recommendations.push(
      '建议对比系统与专家在关键维度上的分歧点',
      '可考虑增加条件分支以覆盖边界情况',
    )
  }

  if (item.severity === 'minor') {
    recommendations.push(
      '建议补充更多上下文信息以提高判断准确性',
      '可考虑增加置信度权重机制',
    )
  }

  if (item.affectedRules.length > 0) {
    recommendations.push(
      `涉及规则：${item.affectedRules.join(', ')}，建议重点复查`,
    )
  }

  if (item.affectedModules.length > 0) {
    recommendations.push(
      `涉及模块：${item.affectedModules.join(', ')}，建议检查模块间依赖`,
    )
  }

  return recommendations
}

/**
 * 更新学习队列
 *
 * - 对于所有 verdict 为 'disagree' 或 'unclear' 的验证，检查是否已在队列中
 * - 不在队列中的添加到队列
 * - 已解决的（status=verified）标记为 resolved
 *
 * @param validations - 当前验证记录列表
 * @param existingQueue - 现有学习队列
 * @returns 更新后的学习队列
 */
function updateLearningQueue(
  validations: ExpertValidationRecord[],
  existingQueue: LearningQueueItem[],
): LearningQueueItem[] {
  const updatedQueue = existingQueue.map((item) => ({ ...item }))
  const existingValidationIds = new Set(existingQueue.map((q) => q.validationId))

  for (const validation of validations) {
    // 已解决的标记为 resolved
    if (validation.status === 'verified') {
      for (const item of updatedQueue) {
        if (item.validationId === validation.validationId && !item.resolved) {
          item.resolved = true
          item.resolvedAt = Date.now()
        }
      }
    }

    // disagree 或 unclear 的添加到队列
    if (
      (validation.verdict === 'disagree' || validation.verdict === 'unclear') &&
      !existingValidationIds.has(validation.validationId)
    ) {
      const priority =
        validation.verdict === 'disagree'
          ? 100 - validation.consistencyRate * 50
          : 50 - validation.consistencyRate * 25

      updatedQueue.push({
        queueId: `LQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        validationId: validation.validationId,
        caseId: validation.caseId,
        reason: `验证结论为「${validation.verdict}」，一致率 ${Math.round(validation.consistencyRate * 100)}%，需要进一步学习`,
        priority: Math.round(priority),
        addedAt: Date.now(),
        resolved: false,
      })

      // 更新集合，避免重复添加
      existingValidationIds.add(validation.validationId)
    }
  }

  // 按优先级降序排列
  updatedQueue.sort((a, b) => b.priority - a.priority)

  return updatedQueue
}

/**
 * 生成验证汇总文本描述
 *
 * @param validations - 验证记录列表
 * @returns 汇总文本
 */
function generateSummary(validations: ExpertValidationRecord[]): string {
  if (validations.length === 0) {
    return '暂无验证记录。'
  }

  const total = validations.length
  const agreeCount = validations.filter((v) => v.verdict === 'agree').length
  const disagreeCount = validations.filter((v) => v.verdict === 'disagree').length
  const partialCount = validations.filter((v) => v.verdict === 'partially_agree').length
  const unclearCount = validations.filter((v) => v.verdict === 'unclear').length

  const avgConsistency =
    Math.round(
      (validations.reduce((s, v) => s + v.consistencyRate, 0) / total) * 10000,
    ) / 100

  const avgScore =
    Math.round(
      (validations.reduce((s, v) => s + v.score, 0) / total) * 100,
    ) / 100

  return [
    `共 ${total} 条验证记录。`,
    `一致（agree）：${agreeCount} 条，`,
    `不一致（disagree）：${disagreeCount} 条，`,
    `部分一致（partially_agree）：${partialCount} 条，`,
    `不明确（unclear）：${unclearCount} 条。`,
    `平均一致率：${avgConsistency}%，平均评分：${avgScore} 分。`,
  ].join('')
}
