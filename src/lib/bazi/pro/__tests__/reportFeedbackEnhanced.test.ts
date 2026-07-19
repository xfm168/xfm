/**
 * Report Feedback Enhanced Engine 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - submitEnhancedFeedback 提交增强反馈
 *   - getFeedbackById / getFeedbacksByReportId / getFeedbacksByUserId
 *   - autoEnqueueToCaseLibrary 自动入队
 *   - getFeedbackAnalytics 统计分析
 *   - getDimensionAverage 单维度平均
 *   - getTopDisputedSections 争议板块
 *   - getExperienceHighlights 经历亮点
 *   - getAllFeedbacks / resetFeedbackStore
 *   - 种子数据验证
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import type {
  FeedbackDimension,
  DimensionFeedback,
  ParagraphFeedback,
  EnhancedReportFeedback,
  ReportFeedbackAnalytics,
} from '../reportFeedbackEnhancedTypes'

import {
  REPORT_FEEDBACK_ENHANCED_VERSION,
  FEEDBACK_DIMENSIONS,
  DIMENSION_LABELS,
} from '../reportFeedbackEnhancedTypes'

import {
  REPORT_FEEDBACK_ENHANCED_ENGINE_VERSION,
  submitEnhancedFeedback,
  getFeedbackById,
  getFeedbacksByReportId,
  getFeedbacksByUserId,
  autoEnqueueToCaseLibrary,
  getFeedbackAnalytics,
  getDimensionAverage,
  getTopDisputedSections,
  getExperienceHighlights,
  getAllFeedbacks,
  resetFeedbackStore,
} from '../reportFeedbackEnhancedEngine'

// 测试用维度反馈
function makeDimensionFeedbacks(ratings: Partial<Record<FeedbackDimension, number>>): DimensionFeedback[] {
  return FEEDBACK_DIMENSIONS.map(dim => ({
    dimension: dim,
    rating: ratings[dim] ?? 3,
    comment: `${dim} comment`,
    recognized: (ratings[dim] ?? 3) >= 3,
  }))
}

// 测试用段落反馈
function makeParagraphFeedback(overrides: Partial<ParagraphFeedback> = {}): ParagraphFeedback {
  return {
    sectionId: 'career',
    paragraphIndex: 0,
    content: '测试段落内容',
    approved: true,
    disputed: false,
    userComment: '',
    userExperience: '',
    ...overrides,
  }
}

describe('reportFeedbackEnhancedEngine', () => {
  beforeEach(() => {
    resetFeedbackStore()
  })

  // ─── 版本号 ───
  describe('版本号', () => {
    test('types 版本为 1.0.0', () => {
      expect(REPORT_FEEDBACK_ENHANCED_VERSION).toBe('1.0.0')
    })

    test('engine 版本与 types 一致', () => {
      expect(REPORT_FEEDBACK_ENHANCED_ENGINE_VERSION).toBe(REPORT_FEEDBACK_ENHANCED_VERSION)
    })
  })

  // ─── submitEnhancedFeedback ───
  describe('submitEnhancedFeedback', () => {
    test('提交反馈返回正确结构', () => {
      const fb = submitEnhancedFeedback({
        reportId: 'rpt-test',
        userId: 'user-test',
        dimensionFeedbacks: makeDimensionFeedbacks({ overall_accuracy: 4 }),
        paragraphFeedbacks: [makeParagraphFeedback()],
        overallComment: 'test',
        wouldShare: false,
      })

      expect(fb.id).toMatch(/^EF-\d+-\d{4}$/)
      expect(fb.reportId).toBe('rpt-test')
      expect(fb.userId).toBe('user-test')
      expect(fb.createdAt).toBeGreaterThan(0)
      expect(fb.autoEnqueued).toBe(false)
    })

    test('自动生成 ID 和时间戳', () => {
      const before = Date.now()
      const fb = submitEnhancedFeedback({
        reportId: 'r-1',
        userId: 'u-1',
        dimensionFeedbacks: [],
        paragraphFeedbacks: [],
        overallComment: '',
        wouldShare: false,
      })
      const after = Date.now()
      expect(fb.createdAt).toBeGreaterThanOrEqual(before)
      expect(fb.createdAt).toBeLessThanOrEqual(after)
    })

    test('autoEnqueued 默认为 false', () => {
      const fb = submitEnhancedFeedback({
        reportId: 'r-2',
        userId: 'u-2',
        dimensionFeedbacks: [],
        paragraphFeedbacks: [],
        overallComment: '',
        wouldShare: true,
      })
      expect(fb.autoEnqueued).toBe(false)
    })
  })

  // ─── getFeedbackById ───
  describe('getFeedbackById', () => {
    test('存在 ID 返回反馈对象', () => {
      const all = getAllFeedbacks()
      if (all.length > 0) {
        const found = getFeedbackById(all[0].id)
        expect(found).toBeDefined()
        expect(found!.id).toBe(all[0].id)
      }
    })

    test('不存在 ID 返回 undefined', () => {
      const result = getFeedbackById('nonexistent-id')
      expect(result).toBeUndefined()
    })
  })

  // ─── getFeedbacksByReportId ───
  describe('getFeedbacksByReportId', () => {
    test('返回对应报告的反馈列表', () => {
      // 种子数据中 rpt-001 有一条
      const feedbacks = getFeedbacksByReportId('rpt-001')
      expect(feedbacks.length).toBeGreaterThanOrEqual(1)
      for (const fb of feedbacks) {
        expect(fb.reportId).toBe('rpt-001')
      }
    })

    test('不存在的 reportId 返回空数组', () => {
      const feedbacks = getFeedbacksByReportId('nonexistent-report')
      expect(feedbacks).toEqual([])
    })
  })

  // ─── getFeedbacksByUserId ───
  describe('getFeedbacksByUserId', () => {
    test('返回对应用户的反馈列表', () => {
      const feedbacks = getFeedbacksByUserId('user-001')
      expect(feedbacks.length).toBeGreaterThanOrEqual(1)
      for (const fb of feedbacks) {
        expect(fb.userId).toBe('user-001')
      }
    })

    test('不存在的 userId 返回空数组', () => {
      const feedbacks = getFeedbacksByUserId('nonexistent-user')
      expect(feedbacks).toEqual([])
    })
  })

  // ─── autoEnqueueToCaseLibrary ───
  describe('autoEnqueueToCaseLibrary', () => {
    test('有争议段落的反馈可以入队', () => {
      const fb = submitEnhancedFeedback({
        reportId: 'r-ae',
        userId: 'u-ae',
        dimensionFeedbacks: [],
        paragraphFeedbacks: [makeParagraphFeedback({ disputed: true, userComment: '不同意' })],
        overallComment: '有争议',
        wouldShare: false,
      })

      const result = autoEnqueueToCaseLibrary(fb.id)
      expect(result).toBe(true)

      const updated = getFeedbackById(fb.id)
      expect(updated!.autoEnqueued).toBe(true)
    })

    test('没有争议段落的反馈不能入队', () => {
      const fb = submitEnhancedFeedback({
        reportId: 'r-ae2',
        userId: 'u-ae2',
        dimensionFeedbacks: [],
        paragraphFeedbacks: [makeParagraphFeedback({ disputed: false })],
        overallComment: '全部认可',
        wouldShare: true,
      })

      const result = autoEnqueueToCaseLibrary(fb.id)
      expect(result).toBe(false)
    })

    test('不存在的反馈 ID 返回 false', () => {
      const result = autoEnqueueToCaseLibrary('nonexistent-id')
      expect(result).toBe(false)
    })
  })

  // ─── getFeedbackAnalytics ───
  describe('getFeedbackAnalytics', () => {
    test('返回完整统计结构', () => {
      const analytics = getFeedbackAnalytics()
      expect(analytics.totalFeedbacks).toBeGreaterThan(0)
      expect(analytics.averageOverallAccuracy).toBeGreaterThan(0)
      expect(analytics.dimensionAverages).toBeDefined()
      expect(analytics.approvalRateBySection).toBeInstanceOf(Array)
      expect(analytics.topDisputedSections).toBeInstanceOf(Array)
      expect(analytics.experienceHighlights).toBeInstanceOf(Array)
      expect(typeof analytics.totalAutoEnqueued).toBe('number')
    })

    test('dimensionAverages 包含所有维度', () => {
      const analytics = getFeedbackAnalytics()
      for (const dim of FEEDBACK_DIMENSIONS) {
        expect(analytics.dimensionAverages).toHaveProperty(dim)
        expect(analytics.dimensionAverages[dim]).toBeGreaterThan(0)
      }
    })

    test('totalFeedbacks 与 getAllFeedbacks 一致', () => {
      const analytics = getFeedbackAnalytics()
      expect(analytics.totalFeedbacks).toBe(getAllFeedbacks().length)
    })
  })

  // ─── getDimensionAverage ───
  describe('getDimensionAverage', () => {
    test('返回有效维度平均分', () => {
      const avg = getDimensionAverage('overall_accuracy')
      expect(avg).toBeGreaterThan(0)
      expect(avg).toBeLessThanOrEqual(5)
    })

    test('所有维度都有平均分', () => {
      for (const dim of FEEDBACK_DIMENSIONS) {
        const avg = getDimensionAverage(dim)
        expect(avg).toBeGreaterThanOrEqual(0)
      }
    })
  })

  // ─── getTopDisputedSections ───
  describe('getTopDisputedSections', () => {
    test('返回争议板块列表', () => {
      const sections = getTopDisputedSections(5)
      expect(sections).toBeInstanceOf(Array)
    })

    test('每条记录包含 sectionId 和 disputeCount', () => {
      const sections = getTopDisputedSections(10)
      for (const s of sections) {
        expect(s).toHaveProperty('sectionId')
        expect(s).toHaveProperty('disputeCount')
        expect(s.disputeCount).toBeGreaterThan(0)
      }
    })

    test('按 disputeCount 降序排列', () => {
      const sections = getTopDisputedSections(10)
      for (let i = 1; i < sections.length; i++) {
        expect(sections[i - 1].disputeCount).toBeGreaterThanOrEqual(sections[i].disputeCount)
      }
    })

    test('limit 参数限制返回条数', () => {
      const sections = getTopDisputedSections(1)
      expect(sections.length).toBeLessThanOrEqual(1)
    })
  })

  // ─── getExperienceHighlights ───
  describe('getExperienceHighlights', () => {
    test('返回经历亮点列表', () => {
      const highlights = getExperienceHighlights(10)
      expect(highlights).toBeInstanceOf(Array)
    })

    test('limit 参数限制返回条数', () => {
      const highlights = getExperienceHighlights(2)
      expect(highlights.length).toBeLessThanOrEqual(2)
    })
  })

  // ─── getAllFeedbacks ───
  describe('getAllFeedbacks', () => {
    test('返回反馈数组', () => {
      const all = getAllFeedbacks()
      expect(Array.isArray(all)).toBe(true)
    })

    test('每条反馈包含必要字段', () => {
      const all = getAllFeedbacks()
      for (const fb of all) {
        expect(fb).toHaveProperty('id')
        expect(fb).toHaveProperty('reportId')
        expect(fb).toHaveProperty('userId')
        expect(fb).toHaveProperty('dimensionFeedbacks')
        expect(fb).toHaveProperty('paragraphFeedbacks')
        expect(fb).toHaveProperty('autoEnqueued')
      }
    })
  })

  // ─── resetFeedbackStore ───
  describe('resetFeedbackStore', () => {
    test('重置后种子数据恢复', () => {
      submitEnhancedFeedback({
        reportId: 'temp-rpt',
        userId: 'temp-user',
        dimensionFeedbacks: [],
        paragraphFeedbacks: [],
        overallComment: '',
        wouldShare: false,
      })
      resetFeedbackStore()
      const all = getAllFeedbacks()
      expect(all.length).toBe(5)
    })
  })

  // ─── 种子数据验证 ───
  describe('种子数据验证', () => {
    test('种子数据有 5 条反馈', () => {
      const all = getAllFeedbacks()
      expect(all.length).toBe(5)
    })

    test('FEEDBACK_DIMENSIONS 有 6 个维度', () => {
      expect(FEEDBACK_DIMENSIONS.length).toBe(6)
    })

    test('DIMENSION_LABELS 包含所有维度标签', () => {
      for (const dim of FEEDBACK_DIMENSIONS) {
        expect(DIMENSION_LABELS).toHaveProperty(dim)
        expect(typeof DIMENSION_LABELS[dim]).toBe('string')
        expect(DIMENSION_LABELS[dim].length).toBeGreaterThan(0)
      }
    })

    test('种子数据包含不同评分', () => {
      const all = getAllFeedbacks()
      const ratings = new Set<number>()
      for (const fb of all) {
        for (const df of fb.dimensionFeedbacks) {
          ratings.add(df.rating)
        }
      }
      // 至少有 2 种不同评分
      expect(ratings.size).toBeGreaterThanOrEqual(2)
    })
  })
})