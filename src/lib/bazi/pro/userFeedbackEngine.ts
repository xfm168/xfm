/**
 * User Feedback Engine
 *
 * 职责：
 *   - 用户反馈的 CRUD 操作
 *   - 反馈统计汇总
 *   - 专家验证标记
 *   - 各板块准确度报告
 * 约束：
 *   - 不修改已有文件
 *   - 纯数据管理层
 */

import type {
  UserFeedbackEntry,
  UserFeedbackStats,
  FeedbackChannel,
  ReportSection,
  SatisfactionRating,
} from './userFeedbackTypes'

import { USER_FEEDBACK_VERSION } from './userFeedbackTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const USER_FEEDBACK_ENGINE_VERSION = USER_FEEDBACK_VERSION

// ═══════════════════════════════════════════
// 2. 内部存储
// ═══════════════════════════════════════════

const feedbackStore = new Map<string, UserFeedbackEntry>()

// ═══════════════════════════════════════════
// 3. 辅助函数
// ═══════════════════════════════════════════

function generateFeedbackId(): string {
  const ts = Date.now()
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `UF-${ts}-${rand}`
}

const ALL_SECTIONS: ReportSection[] = [
  'overview', 'career', 'wealth', 'marriage', 'health',
  'education', 'fortune', 'risk', 'suggestion', 'all',
]

const ALL_RATINGS: SatisfactionRating[] = [1, 2, 3, 4, 5]

// ═══════════════════════════════════════════
// 4. 核心函数
// ═══════════════════════════════════════════

/** 提交反馈 */
export function submitUserFeedback(
  data: Omit<UserFeedbackEntry, 'id' | 'createdAt' | 'validatedAt' | 'validatedBy'>,
): UserFeedbackEntry {
  const entry: UserFeedbackEntry = {
    ...data,
    id: generateFeedbackId(),
    createdAt: Date.now(),
    validatedAt: null,
    validatedBy: null,
  }
  feedbackStore.set(entry.id, entry)
  return entry
}

/** 按 ID 获取反馈 */
export function getFeedbackById(id: string): UserFeedbackEntry | undefined {
  return feedbackStore.get(id)
}

/** 按报告ID获取反馈列表 */
export function getFeedbacksByReportId(reportId: string): UserFeedbackEntry[] {
  return Array.from(feedbackStore.values()).filter((f) => f.reportId === reportId)
}

/** 按用户ID获取反馈列表 */
export function getFeedbacksByUserId(userId: string): UserFeedbackEntry[] {
  return Array.from(feedbackStore.values()).filter((f) => f.userId === userId)
}

/** 筛选 >= minRating 的反馈 */
export function getFeedbacksByRating(minRating: number): UserFeedbackEntry[] {
  return Array.from(feedbackStore.values()).filter((f) => f.rating >= minRating)
}

/** 按时间范围获取反馈 */
export function getFeedbacksByDateRange(startAt: number, endAt: number): UserFeedbackEntry[] {
  return Array.from(feedbackStore.values()).filter(
    (f) => f.createdAt >= startAt && f.createdAt <= endAt,
  )
}

/** 专家验证反馈 */
export function validateFeedback(
  feedbackId: string,
  expertId: string,
  _comment?: string,
): UserFeedbackEntry | null {
  const entry = feedbackStore.get(feedbackId)
  if (!entry) return null
  entry.validatedAt = Date.now()
  entry.validatedBy = expertId
  feedbackStore.set(feedbackId, entry)
  return entry
}

/** 获取反馈统计汇总 */
export function getFeedbackStats(): UserFeedbackStats {
  const all = getAllFeedbacks()
  const total = all.length

  if (total === 0) {
    const emptyDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<SatisfactionRating, number>
    const emptySections = {} as Record<ReportSection, number>
    for (const s of ALL_SECTIONS) {
      emptySections[s] = 0
    }
    return {
      totalFeedbacks: 0,
      averageRating: 0,
      averageAccuracy: 0,
      averageReadability: 0,
      averageHelpfulness: 0,
      recommendRate: 0,
      ratingDistribution: emptyDist,
      sectionAccuracy: emptySections,
      topImprovementSuggestions: [],
    }
  }

  const sumRating = all.reduce((acc, f) => acc + f.rating, 0)
  const sumAccuracy = all.reduce((acc, f) => acc + f.accuracyRating, 0)
  const sumReadability = all.reduce((acc, f) => acc + f.readabilityRating, 0)
  const sumHelpfulness = all.reduce((acc, f) => acc + f.helpfulnessRating, 0)
  const recommendCount = all.filter((f) => f.wouldRecommend).length

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<SatisfactionRating, number>
  for (const f of all) {
    ratingDistribution[f.rating]++
  }

  // 各板块准确度：根据 mostAccurateSections 的出现次数计算
  const sectionAccuracy = {} as Record<ReportSection, number>
  for (const s of ALL_SECTIONS) {
    const mentions = all.filter((f) => f.mostAccurateSections.includes(s)).length
    sectionAccuracy[s] = total > 0 ? Math.round((mentions / total) * 100) / 100 : 0
  }

  // 改进建议 TOP 排行
  const suggestionMap = new Map<string, number>()
  for (const f of all) {
    for (const s of f.improvementSuggestions) {
      suggestionMap.set(s, (suggestionMap.get(s) ?? 0) + 1)
    }
  }
  const topSuggestions = Array.from(suggestionMap.entries())
    .map(([suggestion, count]) => ({ suggestion, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalFeedbacks: total,
    averageRating: Math.round((sumRating / total) * 100) / 100,
    averageAccuracy: Math.round((sumAccuracy / total) * 100) / 100,
    averageReadability: Math.round((sumReadability / total) * 100) / 100,
    averageHelpfulness: Math.round((sumHelpfulness / total) * 100) / 100,
    recommendRate: Math.round((recommendCount / total) * 100) / 100,
    ratingDistribution,
    sectionAccuracy,
    topImprovementSuggestions: topSuggestions,
  }
}

/** 获取所有反馈 */
export function getAllFeedbacks(): UserFeedbackEntry[] {
  return Array.from(feedbackStore.values())
}

/** 获取未验证反馈 */
export function getUnvalidatedFeedbacks(): UserFeedbackEntry[] {
  return Array.from(feedbackStore.values()).filter((f) => f.validatedAt === null)
}

/** 各板块准确度报告 */
export function getSectionAccuracyReport(): Record<ReportSection, { average: number; count: number }> {
  const all = getAllFeedbacks()
  const report = {} as Record<ReportSection, { average: number; count: number }>

  for (const section of ALL_SECTIONS) {
    const relevant = all.filter((f) => f.mostAccurateSections.includes(section) || f.leastAccurateSections.includes(section))
    const accurateCount = all.filter((f) => f.mostAccurateSections.includes(section)).length
    report[section] = {
      average: relevant.length > 0 ? Math.round((accurateCount / relevant.length) * 100) / 100 : 0,
      count: relevant.length,
    }
  }

  return report
}

/** 重置存储 */
export function resetFeedbackStore(): void {
  feedbackStore.clear()
  initSeedData()
}

// ═══════════════════════════════════════════
// 5. 种子数据
// ═══════════════════════════════════════════

function initSeedData(): void {
  const now = Date.now()

  const seed1: UserFeedbackEntry = {
    id: 'UF-1000001-0001',
    reportId: 'RPT-001',
    userId: 'U001',
    channel: 'web',
    rating: 5,
    accuracyRating: 5,
    readabilityRating: 4,
    helpfulnessRating: 5,
    mostAccurateSections: ['career', 'wealth'],
    leastAccurateSections: ['health'],
    comment: '非常准确的命理报告，特别是事业和财富板块',
    improvementSuggestions: ['增加更多具体建议'],
    wouldRecommend: true,
    createdAt: now - 86400000 * 5,
    validatedAt: now - 86400000 * 3,
    validatedBy: 'EXP-001',
  }

  const seed2: UserFeedbackEntry = {
    id: 'UF-1000002-0002',
    reportId: 'RPT-002',
    userId: 'U002',
    channel: 'mobile',
    rating: 3,
    accuracyRating: 3,
    readabilityRating: 4,
    helpfulnessRating: 3,
    mostAccurateSections: ['overview'],
    leastAccurateSections: ['marriage', 'education'],
    comment: '整体还行，婚姻板块不太准确',
    improvementSuggestions: ['改进婚姻分析', '增加教育运势细节'],
    wouldRecommend: false,
    createdAt: now - 86400000 * 3,
    validatedAt: null,
    validatedBy: null,
  }

  const seed3: UserFeedbackEntry = {
    id: 'UF-1000003-0003',
    reportId: 'RPT-003',
    userId: 'U001',
    channel: 'wechat',
    rating: 4,
    accuracyRating: 4,
    readabilityRating: 5,
    helpfulnessRating: 4,
    mostAccurateSections: ['fortune', 'risk'],
    leastAccurateSections: ['suggestion'],
    comment: '运势预测挺准的，建议部分可以更详细',
    improvementSuggestions: ['细化建议内容'],
    wouldRecommend: true,
    createdAt: now - 86400000 * 2,
    validatedAt: null,
    validatedBy: null,
  }

  const seed4: UserFeedbackEntry = {
    id: 'UF-1000004-0004',
    reportId: 'RPT-004',
    userId: 'U003',
    channel: 'api',
    rating: 1,
    accuracyRating: 1,
    readabilityRating: 2,
    helpfulnessRating: 1,
    mostAccurateSections: [],
    leastAccurateSections: ['career', 'wealth', 'marriage', 'health', 'education', 'fortune', 'risk'],
    comment: '完全不准，没有任何参考价值',
    improvementSuggestions: ['重新校准算法', '增加案例对比'],
    wouldRecommend: false,
    createdAt: now - 86400000 * 1,
    validatedAt: null,
    validatedBy: null,
  }

  const seed5: UserFeedbackEntry = {
    id: 'UF-1000005-0005',
    reportId: 'RPT-005',
    userId: 'U004',
    channel: 'web',
    rating: 2,
    accuracyRating: 2,
    readabilityRating: 3,
    helpfulnessRating: 2,
    mostAccurateSections: ['overview'],
    leastAccurateSections: ['wealth', 'career'],
    comment: '概述部分还行，其余偏差较大',
    improvementSuggestions: ['提升财富分析准确度', '增加案例对比', '细化建议内容'],
    wouldRecommend: false,
    createdAt: now,
    validatedAt: null,
    validatedBy: null,
  }

  feedbackStore.set(seed1.id, seed1)
  feedbackStore.set(seed2.id, seed2)
  feedbackStore.set(seed3.id, seed3)
  feedbackStore.set(seed4.id, seed4)
  feedbackStore.set(seed5.id, seed5)
}

// 初始化种子数据
initSeedData()
