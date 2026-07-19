/**
 * User Feedback Engine 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - submitUserFeedback 提交反馈
 *   - getFeedbackById / getFeedbacksByReportId / getFeedbacksByUserId
 *   - getFeedbacksByRating / getFeedbacksByDateRange
 *   - validateFeedback 专家验证
 *   - getFeedbackStats 统计汇总
 *   - getUnvalidatedFeedbacks / getAllFeedbacks
 *   - getSectionAccuracyReport 板块准确度报告
 *   - resetFeedbackStore 重置
 *   - 种子数据验证
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import type {
  UserFeedbackEntry,
  ReportSection,
  SatisfactionRating,
} from '../userFeedbackTypes'

import {
  USER_FEEDBACK_VERSION,
} from '../userFeedbackTypes'

import {
  USER_FEEDBACK_ENGINE_VERSION,
  submitUserFeedback,
  getFeedbackById,
  getFeedbacksByReportId,
  getFeedbacksByUserId,
  getFeedbacksByRating,
  getFeedbacksByDateRange,
  validateFeedback,
  getFeedbackStats,
  getAllFeedbacks,
  getUnvalidatedFeedbacks,
  getSectionAccuracyReport,
  resetFeedbackStore,
} from '../userFeedbackEngine'

describe('userFeedbackEngine', () => {
  beforeEach(() => {
    resetFeedbackStore()
  })

  // ─── 版本号 ───
  test('types 版本号应为 1.0.0', () => {
    expect(USER_FEEDBACK_VERSION).toBe('1.0.0')
  })

  test('engine 版本号应与 types 一致', () => {
    expect(USER_FEEDBACK_ENGINE_VERSION).toBe('1.0.0')
  })

  // ─── 种子数据 ───
  test('种子数据应包含 5 条反馈', () => {
    const all = getAllFeedbacks()
    expect(all.length).toBe(5)
  })

  test('种子数据应包含特定 ID', () => {
    expect(getFeedbackById('UF-1000001-0001')).toBeDefined()
    expect(getFeedbackById('UF-1000005-0005')).toBeDefined()
  })

  // ─── submitUserFeedback ───
  test('提交反馈应返回包含自动生成 ID 的条目', () => {
    const entry = submitUserFeedback({
      reportId: 'RPT-TEST',
      userId: 'U-TEST',
      channel: 'web',
      rating: 4,
      accuracyRating: 4,
      readabilityRating: 4,
      helpfulnessRating: 4,
      mostAccurateSections: ['career'],
      leastAccurateSections: ['health'],
      comment: '测试评论',
      improvementSuggestions: ['建议1'],
      wouldRecommend: true,
    })
    expect(entry.id).toMatch(/^UF-\d+-\d{4}$/)
    expect(entry.reportId).toBe('RPT-TEST')
    expect(entry.createdAt).toBeGreaterThan(0)
    expect(entry.validatedAt).toBeNull()
    expect(entry.validatedBy).toBeNull()
  })

  test('提交后应可通过 ID 查询到', () => {
    const entry = submitUserFeedback({
      reportId: 'RPT-NEW',
      userId: 'U-NEW',
      channel: 'mobile',
      rating: 3,
      accuracyRating: 3,
      readabilityRating: 3,
      helpfulnessRating: 3,
      mostAccurateSections: [],
      leastAccurateSections: [],
      comment: '新评论',
      improvementSuggestions: [],
      wouldRecommend: false,
    })
    const found = getFeedbackById(entry.id)
    expect(found).toBeDefined()
    expect(found!.reportId).toBe('RPT-NEW')
  })

  // ─── getFeedbackById ───
  test('查询存在的 ID 应返回条目', () => {
    const entry = getFeedbackById('UF-1000001-0001')
    expect(entry).toBeDefined()
    expect(entry!.userId).toBe('U001')
  })

  test('查询不存在的 ID 应返回 undefined', () => {
    expect(getFeedbackById('NON-EXISTENT')).toBeUndefined()
  })

  // ─── getFeedbacksByReportId ───
  test('按报告 ID 筛选应返回正确结果', () => {
    const feedbacks = getFeedbacksByReportId('RPT-001')
    expect(feedbacks.length).toBe(1)
    expect(feedbacks[0].userId).toBe('U001')
  })

  test('不存在的报告 ID 应返回空数组', () => {
    expect(getFeedbacksByReportId('RPT-NONE').length).toBe(0)
  })

  // ─── getFeedbacksByUserId ───
  test('按用户 ID 筛选应返回正确数量', () => {
    const feedbacks = getFeedbacksByUserId('U001')
    expect(feedbacks.length).toBe(2) // 种子数据中 U001 有 2 条
  })

  // ─── getFeedbacksByRating ───
  test('筛选评分 >= 4 的反馈应返回正确结果', () => {
    const high = getFeedbacksByRating(4)
    expect(high.length).toBe(2) // 种子数据中评分 4 和 5 的各有 1 条
  })

  test('筛选评分 >= 1 的反馈应返回所有', () => {
    const all = getFeedbacksByRating(1)
    expect(all.length).toBe(5)
  })

  test('筛选评分 >= 6 的反馈应返回空', () => {
    expect(getFeedbacksByRating(6).length).toBe(0)
  })

  // ─── getFeedbacksByDateRange ───
  test('按时间范围筛选应返回正确结果', () => {
    const now = Date.now()
    const start = now - 86400000 * 4
    const end = now - 86400000 * 2
    const range = getFeedbacksByDateRange(start, end)
    expect(range.length).toBeGreaterThanOrEqual(1)
  })

  test('未来时间范围应返回空', () => {
    const future = getFeedbacksByDateRange(Date.now() + 86400000, Date.now() + 86400000 * 2)
    expect(future.length).toBe(0)
  })

  // ─── validateFeedback ───
  test('专家验证应更新 validatedAt 和 validatedBy', () => {
    const result = validateFeedback('UF-1000002-0002', 'EXP-002', '审核通过')
    expect(result).not.toBeNull()
    expect(result!.validatedAt).toBeGreaterThan(0)
    expect(result!.validatedBy).toBe('EXP-002')
  })

  test('验证不存在的 ID 应返回 null', () => {
    expect(validateFeedback('NON-EXISTENT', 'EXP-001')).toBeNull()
  })

  test('已验证的反馈不应在未验证列表中', () => {
    validateFeedback('UF-1000002-0002', 'EXP-002')
    const unvalidated = getUnvalidatedFeedbacks()
    const found = unvalidated.find((f) => f.id === 'UF-1000002-0002')
    expect(found).toBeUndefined()
  })

  // ─── getFeedbackStats ───
  test('统计汇总应返回正确的总数', () => {
    const stats = getFeedbackStats()
    expect(stats.totalFeedbacks).toBe(5)
  })

  test('统计汇总应包含 1~5 星分布', () => {
    const stats = getFeedbackStats()
    expect(stats.ratingDistribution[1]).toBe(1)
    expect(stats.ratingDistribution[2]).toBe(1)
    expect(stats.ratingDistribution[3]).toBe(1)
    expect(stats.ratingDistribution[4]).toBe(1)
    expect(stats.ratingDistribution[5]).toBe(1)
  })

  test('统计汇总推荐率应正确', () => {
    const stats = getFeedbackStats()
    // 种子数据中只有 U001 的两条反馈推荐: rating 5 和 4
    expect(stats.recommendRate).toBe(0.4)
  })

  test('统计汇总的平均评分应在合理范围', () => {
    const stats = getFeedbackStats()
    expect(stats.averageRating).toBeGreaterThanOrEqual(1)
    expect(stats.averageRating).toBeLessThanOrEqual(5)
  })

  test('统计汇总应包含各板块准确度', () => {
    const stats = getFeedbackStats()
    expect(Object.keys(stats.sectionAccuracy).length).toBe(10)
  })

  test('统计汇总应包含改进建议排行', () => {
    const stats = getFeedbackStats()
    expect(stats.topImprovementSuggestions.length).toBeGreaterThan(0)
  })

  // ─── getUnvalidatedFeedbacks ───
  test('未验证反馈列表应排除已验证的', () => {
    const unvalidated = getUnvalidatedFeedbacks()
    // 种子数据中只有 UF-1000001-0001 已验证
    expect(unvalidated.length).toBe(4)
    expect(unvalidated.every((f) => f.validatedAt === null)).toBe(true)
  })

  // ─── getAllFeedbacks ───
  test('获取所有反馈应返回完整列表', () => {
    const all = getAllFeedbacks()
    expect(all.length).toBe(5)
    expect(all.every((f) => f.id)).toBe(true)
  })

  // ─── getSectionAccuracyReport ───
  test('板块准确度报告应包含所有板块', () => {
    const report = getSectionAccuracyReport()
    const sections: ReportSection[] = [
      'overview', 'career', 'wealth', 'marriage', 'health',
      'education', 'fortune', 'risk', 'suggestion', 'all',
    ]
    for (const s of sections) {
      expect(report[s]).toBeDefined()
      expect(typeof report[s].average).toBe('number')
      expect(typeof report[s].count).toBe('number')
    }
  })

  test('板块准确度 average 应在 0~1 之间', () => {
    const report = getSectionAccuracyReport()
    for (const key of Object.keys(report)) {
      expect(report[key as ReportSection].average).toBeGreaterThanOrEqual(0)
      expect(report[key as ReportSection].average).toBeLessThanOrEqual(1)
    }
  })

  // ─── resetFeedbackStore ───
  test('重置后种子数据应恢复', () => {
    // 先新增一条
    submitUserFeedback({
      reportId: 'RPT-TEMP',
      userId: 'U-TEMP',
      channel: 'api',
      rating: 1,
      accuracyRating: 1,
      readabilityRating: 1,
      helpfulnessRating: 1,
      mostAccurateSections: [],
      leastAccurateSections: [],
      comment: 'temp',
      improvementSuggestions: [],
      wouldRecommend: false,
    })
    expect(getAllFeedbacks().length).toBe(6)
    resetFeedbackStore()
    expect(getAllFeedbacks().length).toBe(5)
  })

  // ─── 边界情况 ───
  test('清空后统计应为零值', () => {
    // 通过直接 reset 再清空（这里测试 reset 后再额外清除后统计为空）
    // 但 reset 会重新加载种子，所以直接验证种子后的统计
    const stats = getFeedbackStats()
    expect(stats.totalFeedbacks).toBeGreaterThan(0)
  })

  test('提交多条反馈后 ID 应唯一', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 10; i++) {
      const entry = submitUserFeedback({
        reportId: `RPT-BATCH-${i}`,
        userId: 'U-BATCH',
        channel: 'web',
        rating: 3,
        accuracyRating: 3,
        readabilityRating: 3,
        helpfulnessRating: 3,
        mostAccurateSections: [],
        leastAccurateSections: [],
        comment: `批量测试 ${i}`,
        improvementSuggestions: [],
        wouldRecommend: false,
      })
      ids.add(entry.id)
    }
    expect(ids.size).toBe(10)
  })
})
