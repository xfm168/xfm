/**
 * Report Feedback Enhanced Engine
 *
 * 职责：
 *   - 增强反馈的提交与查询
 *   - 多维度评分统计
 *   - 段落级认可/争议分析
 *   - 用户真实经历提取
 *   - 自动进入 Case Library
 * 约束：
 *   - 不修改已有文件
 *   - 纯数据管理层
 */

import type {
  FeedbackDimension,
  DimensionFeedback,
  ParagraphFeedback,
  EnhancedReportFeedback,
  ReportFeedbackAnalytics,
} from './reportFeedbackEnhancedTypes'

import {
  REPORT_FEEDBACK_ENHANCED_VERSION,
  FEEDBACK_DIMENSIONS,
} from './reportFeedbackEnhancedTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const REPORT_FEEDBACK_ENHANCED_ENGINE_VERSION = REPORT_FEEDBACK_ENHANCED_VERSION

// ═══════════════════════════════════════════
// 2. 内部存储
// ═══════════════════════════════════════════

const feedbackStore = new Map<string, EnhancedReportFeedback>()

// ═══════════════════════════════════════════
// 3. 辅助函数
// ═══════════════════════════════════════════

function generateFeedbackId(): string {
  const ts = Date.now()
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `EF-${ts}-${rand}`
}

// ═══════════════════════════════════════════
// 4. 核心 API
// ═══════════════════════════════════════════

export function submitEnhancedFeedback(
  data: Omit<EnhancedReportFeedback, 'id' | 'createdAt' | 'autoEnqueued'>
): EnhancedReportFeedback {
  const feedback: EnhancedReportFeedback = {
    ...data,
    id: generateFeedbackId(),
    createdAt: Date.now(),
    autoEnqueued: false,
  }

  feedbackStore.set(feedback.id, feedback)
  return feedback
}

export function getFeedbackById(id: string): EnhancedReportFeedback | undefined {
  return feedbackStore.get(id)
}

export function getFeedbacksByReportId(reportId: string): EnhancedReportFeedback[] {
  const results: EnhancedReportFeedback[] = []
  for (const fb of feedbackStore.values()) {
    if (fb.reportId === reportId) {
      results.push(fb)
    }
  }
  return results
}

export function getFeedbacksByUserId(userId: string): EnhancedReportFeedback[] {
  const results: EnhancedReportFeedback[] = []
  for (const fb of feedbackStore.values()) {
    if (fb.userId === userId) {
      results.push(fb)
    }
  }
  return results
}

export function autoEnqueueToCaseLibrary(feedbackId: string): boolean {
  const feedback = feedbackStore.get(feedbackId)
  if (!feedback) return false

  const hasDisputed = feedback.paragraphFeedbacks.some(p => p.disputed)
  if (!hasDisputed) return false

  feedback.autoEnqueued = true
  feedbackStore.set(feedbackId, feedback)
  return true
}

export function getFeedbackAnalytics(): ReportFeedbackAnalytics {
  const allFeedbacks = getAllFeedbacks()
  const totalFeedbacks = allFeedbacks.length

  // 总体准确度平均
  const accuracyRatings: number[] = []
  for (const fb of allFeedbacks) {
    const dim = fb.dimensionFeedbacks.find(d => d.dimension === 'overall_accuracy')
    if (dim) accuracyRatings.push(dim.rating)
  }
  const averageOverallAccuracy = accuracyRatings.length > 0
    ? accuracyRatings.reduce((a, b) => a + b, 0) / accuracyRatings.length
    : 0

  // 各维度平均
  const dimensionSums: Record<string, number> = {}
  const dimensionCounts: Record<string, number> = {}
  for (const dim of FEEDBACK_DIMENSIONS) {
    dimensionSums[dim] = 0
    dimensionCounts[dim] = 0
  }
  for (const fb of allFeedbacks) {
    for (const df of fb.dimensionFeedbacks) {
      dimensionSums[df.dimension] = (dimensionSums[df.dimension] ?? 0) + df.rating
      dimensionCounts[df.dimension] = (dimensionCounts[df.dimension] ?? 0) + 1
    }
  }
  const dimensionAverages: Record<FeedbackDimension, number> = {} as Record<FeedbackDimension, number>
  for (const dim of FEEDBACK_DIMENSIONS) {
    dimensionAverages[dim] = dimensionCounts[dim] > 0
      ? dimensionSums[dim] / dimensionCounts[dim]
      : 0
  }

  // 板块认可率
  const sectionMap = new Map<string, { approved: number; total: number }>()
  for (const fb of allFeedbacks) {
    for (const pf of fb.paragraphFeedbacks) {
      if (!sectionMap.has(pf.sectionId)) {
        sectionMap.set(pf.sectionId, { approved: 0, total: 0 })
      }
      const entry = sectionMap.get(pf.sectionId)!
      entry.total++
      if (pf.approved) entry.approved++
    }
  }
  const approvalRateBySection = Array.from(sectionMap.entries()).map(([sectionId, data]) => ({
    sectionId,
    rate: data.total > 0 ? data.approved / data.total : 0,
    count: data.total,
  }))

  // 争议最多板块
  const disputeMap = new Map<string, { count: number; comments: string[] }>()
  for (const fb of allFeedbacks) {
    for (const pf of fb.paragraphFeedbacks) {
      if (pf.disputed) {
        if (!disputeMap.has(pf.sectionId)) {
          disputeMap.set(pf.sectionId, { count: 0, comments: [] })
        }
        const entry = disputeMap.get(pf.sectionId)!
        entry.count++
        if (pf.userComment) entry.comments.push(pf.userComment)
      }
    }
  }
  const topDisputedSections = Array.from(disputeMap.entries())
    .map(([sectionId, data]) => ({ sectionId, ...data }))
    .sort((a, b) => b.count - a.count)

  // 用户真实经历亮点
  const experienceHighlights: string[] = []
  for (const fb of allFeedbacks) {
    for (const pf of fb.paragraphFeedbacks) {
      if (pf.userExperience.trim()) {
        experienceHighlights.push(pf.userExperience)
      }
    }
  }

  const totalAutoEnqueued = allFeedbacks.filter(fb => fb.autoEnqueued).length

  return {
    totalFeedbacks,
    averageOverallAccuracy,
    dimensionAverages,
    approvalRateBySection,
    topDisputedSections,
    experienceHighlights,
    totalAutoEnqueued,
  }
}

export function getDimensionAverage(dimension: FeedbackDimension): number {
  const allFeedbacks = getAllFeedbacks()
  const ratings: number[] = []
  for (const fb of allFeedbacks) {
    const dim = fb.dimensionFeedbacks.find(d => d.dimension === dimension)
    if (dim) ratings.push(dim.rating)
  }
  return ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 0
}

export function getTopDisputedSections(
  limit: number
): Array<{sectionId: string; disputeCount: number}> {
  const disputeMap = new Map<string, number>()
  for (const fb of feedbackStore.values()) {
    for (const pf of fb.paragraphFeedbacks) {
      if (pf.disputed) {
        disputeMap.set(pf.sectionId, (disputeMap.get(pf.sectionId) ?? 0) + 1)
      }
    }
  }
  return Array.from(disputeMap.entries())
    .map(([sectionId, disputeCount]) => ({ sectionId, disputeCount }))
    .sort((a, b) => b.disputeCount - a.disputeCount)
    .slice(0, limit)
}

export function getExperienceHighlights(limit: number): string[] {
  const highlights: string[] = []
  for (const fb of feedbackStore.values()) {
    for (const pf of fb.paragraphFeedbacks) {
      if (pf.userExperience.trim()) {
        highlights.push(pf.userExperience)
      }
    }
  }
  return highlights.slice(0, limit)
}

export function getAllFeedbacks(): EnhancedReportFeedback[] {
  return Array.from(feedbackStore.values())
}

export function resetFeedbackStore(): void {
  feedbackStore.clear()
  seedFeedbackData()
}

// ═══════════════════════════════════════════
// 5. 种子数据
// ═══════════════════════════════════════════

function seedFeedbackData(): void {
  // 反馈1: 高满意度
  submitEnhancedFeedback({
    reportId: 'rpt-001',
    userId: 'user-001',
    dimensionFeedbacks: [
      { dimension: 'overall_accuracy', rating: 5, comment: '非常准确', recognized: true },
      { dimension: 'personality', rating: 4, comment: '基本符合', recognized: true },
      { dimension: 'career', rating: 5, comment: '事业分析精准', recognized: true },
      { dimension: 'wealth', rating: 4, comment: '财运分析合理', recognized: true },
      { dimension: 'marriage', rating: 3, comment: '婚姻部分一般', recognized: false },
      { dimension: 'health', rating: 4, comment: '健康建议有参考价值', recognized: true },
    ],
    paragraphFeedbacks: [
      {
        sectionId: 'personality',
        paragraphIndex: 0,
        content: '性格分析段落摘要',
        approved: true,
        disputed: false,
        userComment: '',
        userExperience: '',
      },
      {
        sectionId: 'career',
        paragraphIndex: 0,
        content: '事业分析段落摘要',
        approved: true,
        disputed: false,
        userComment: '确实在30岁后有转机',
        userExperience: '我30岁那年确实换了工作，薪资翻倍',
      },
    ],
    overallComment: '整体非常满意，事业分析特别准确',
    wouldShare: true,
  })

  // 反馈2: 有争议
  submitEnhancedFeedback({
    reportId: 'rpt-002',
    userId: 'user-002',
    dimensionFeedbacks: [
      { dimension: 'overall_accuracy', rating: 3, comment: '一般', recognized: false },
      { dimension: 'personality', rating: 4, comment: '性格基本准确', recognized: true },
      { dimension: 'career', rating: 2, comment: '事业分析偏差较大', recognized: false },
      { dimension: 'wealth', rating: 3, comment: '财运分析不准', recognized: false },
      { dimension: 'marriage', rating: 5, comment: '婚姻分析很准', recognized: true },
      { dimension: 'health', rating: 4, comment: '健康建议不错', recognized: true },
    ],
    paragraphFeedbacks: [
      {
        sectionId: 'career',
        paragraphIndex: 0,
        content: '事业方向建议段落',
        approved: false,
        disputed: true,
        userComment: '我并没有在35岁创业',
        userExperience: '我一直在企业工作，没有创业经历',
      },
      {
        sectionId: 'marriage',
        paragraphIndex: 0,
        content: '婚姻分析段落摘要',
        approved: true,
        disputed: false,
        userComment: '婚姻状况描述准确',
        userExperience: '确实在28岁结婚，与描述一致',
      },
    ],
    overallComment: '婚姻和性格分析好，事业和财运有偏差',
    wouldShare: false,
  })

  // 反馈3: 中等评价
  submitEnhancedFeedback({
    reportId: 'rpt-003',
    userId: 'user-003',
    dimensionFeedbacks: [
      { dimension: 'overall_accuracy', rating: 4, comment: '较好', recognized: true },
      { dimension: 'personality', rating: 3, comment: '性格部分准确', recognized: true },
      { dimension: 'career', rating: 4, comment: '事业分析不错', recognized: true },
      { dimension: 'wealth', rating: 4, comment: '财运合理', recognized: true },
      { dimension: 'marriage', rating: 4, comment: '婚姻分析可以', recognized: true },
      { dimension: 'health', rating: 5, comment: '健康建议很好', recognized: true },
    ],
    paragraphFeedbacks: [
      {
        sectionId: 'health',
        paragraphIndex: 0,
        content: '健康建议段落摘要',
        approved: true,
        disputed: false,
        userComment: '健康建议很有用',
        userExperience: '按照建议调整作息后确实感觉好多了',
      },
    ],
    overallComment: '整体质量不错，各维度都较为合理',
    wouldShare: true,
  })

  // 反馈4: 低评价带争议
  submitEnhancedFeedback({
    reportId: 'rpt-004',
    userId: 'user-004',
    dimensionFeedbacks: [
      { dimension: 'overall_accuracy', rating: 2, comment: '不太准确', recognized: false },
      { dimension: 'personality', rating: 2, comment: '性格描述偏差', recognized: false },
      { dimension: 'career', rating: 3, comment: '事业分析尚可', recognized: true },
      { dimension: 'wealth', rating: 1, comment: '财运分析完全不对', recognized: false },
      { dimension: 'marriage', rating: 3, comment: '婚姻部分还行', recognized: true },
      { dimension: 'health', rating: 2, comment: '健康建议不太适用', recognized: false },
    ],
    paragraphFeedbacks: [
      {
        sectionId: 'wealth',
        paragraphIndex: 0,
        content: '财运分析段落摘要',
        approved: false,
        disputed: true,
        userComment: '财运预测与实际完全相反',
        userExperience: '报告说财运好但实际经济困难',
      },
      {
        sectionId: 'personality',
        paragraphIndex: 0,
        content: '性格分析段落摘要',
        approved: false,
        disputed: true,
        userComment: '性格描述不太符合我',
        userExperience: '我是外向型性格，报告描述为内向',
      },
    ],
    overallComment: '准确度较低，希望改进',
    wouldShare: false,
  })

  // 反馈5: 全面好评
  submitEnhancedFeedback({
    reportId: 'rpt-005',
    userId: 'user-005',
    dimensionFeedbacks: [
      { dimension: 'overall_accuracy', rating: 5, comment: '极其准确', recognized: true },
      { dimension: 'personality', rating: 5, comment: '完全符合', recognized: true },
      { dimension: 'career', rating: 5, comment: '事业分析精准', recognized: true },
      { dimension: 'wealth', rating: 4, comment: '财运分析较好', recognized: true },
      { dimension: 'marriage', rating: 5, comment: '婚姻分析完美', recognized: true },
      { dimension: 'health', rating: 5, comment: '健康建议很有用', recognized: true },
    ],
    paragraphFeedbacks: [
      {
        sectionId: 'personality',
        paragraphIndex: 0,
        content: '性格深度分析段落',
        approved: true,
        disputed: false,
        userComment: '非常准确',
        userExperience: '朋友也说描述得像我',
      },
      {
        sectionId: 'marriage',
        paragraphIndex: 0,
        content: '婚姻状况分析段落',
        approved: true,
        disputed: false,
        userComment: '完全准确',
        userExperience: '婚恋时间线和状况完全匹配',
      },
    ],
    overallComment: '这是我见过最准确的分析报告',
    wouldShare: true,
  })
}

// 初始化种子数据
seedFeedbackData()