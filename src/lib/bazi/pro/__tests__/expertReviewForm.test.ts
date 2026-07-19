/**
 * Expert Review Form Engine 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - registerReviewer 注册审核员
 *   - submitExpertReview 提交审核
 *   - getReviewById / getReviewsByCaseId / getReviewsByReviewerId
 *   - getReviewsBySeverity
 *   - getDisagreementReviews 不一致审核
 *   - getReviewStats 统计汇总
 *   - getReviewerProfile / getAllReviewers
 *   - calculateReviewerAgreement 一致率
 *   - resetReviewFormStore 重置
 *   - 种子数据验证
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import type {
  ExpertReviewerProfile,
  ExpertReviewFormEntry,
  ReviewerLevel,
  ReviewDimension,
  ReviewVerdict,
  CaseSeverity,
} from '../expertReviewFormTypes'

import {
  EXPERT_REVIEW_FORM_VERSION,
} from '../expertReviewFormTypes'

import {
  EXPERT_REVIEW_FORM_ENGINE_VERSION,
  registerReviewer,
  submitExpertReview,
  getReviewById,
  getReviewsByCaseId,
  getReviewsByReviewerId,
  getReviewsBySeverity,
  getDisagreementReviews,
  getReviewStats,
  getReviewerProfile,
  getAllReviewers,
  calculateReviewerAgreement,
  resetReviewFormStore,
} from '../expertReviewFormEngine'

// ─── 测试辅助 ───
function makeTestDimensions(
  verdict: ReviewVerdict,
  rating: number,
): Record<ReviewDimension, { rating: number; comment: string; verdict: ReviewVerdict }> {
  const dims: Record<ReviewDimension, { rating: number; comment: string; verdict: ReviewVerdict }> = {
    accuracy: { rating, comment: verdict, verdict },
    depth: { rating, comment: verdict, verdict },
    completeness: { rating, comment: verdict, verdict },
    classicalReference: { rating, comment: verdict, verdict },
    readability: { rating, comment: verdict, verdict },
    recommendation: { rating, comment: verdict, verdict },
  }
  return dims
}

describe('expertReviewFormEngine', () => {
  beforeEach(() => {
    resetReviewFormStore()
  })

  // ─── 版本号 ───
  test('types 版本号应为 1.0.0', () => {
    expect(EXPERT_REVIEW_FORM_VERSION).toBe('1.0.0')
  })

  test('engine 版本号应与 types 一致', () => {
    expect(EXPERT_REVIEW_FORM_ENGINE_VERSION).toBe('1.0.0')
  })

  // ─── 种子数据 ───
  test('种子数据应包含 3 个审核员', () => {
    const reviewers = getAllReviewers()
    expect(reviewers.length).toBe(3)
  })

  test('种子数据应包含 5 条审核记录', () => {
    const reviewerIds = getAllReviewers().map((r) => r.reviewerId)
    let total = 0
    for (const rid of reviewerIds) {
      total += getReviewsByReviewerId(rid).length
    }
    expect(total).toBe(5)
  })

  test('种子审核员应有正确的层级', () => {
    const rev1 = getReviewerProfile('REV-001')
    expect(rev1!.level).toBe('senior')
    const rev3 = getReviewerProfile('REV-003')
    expect(rev3!.level).toBe('junior')
  })

  // ─── registerReviewer ───
  test('注册审核员应返回完整档案', () => {
    const profile = registerReviewer({
      reviewerId: 'REV-NEW',
      name: '测试审核员',
      level: 'intermediate',
      specialties: ['测试'],
    })
    expect(profile.reviewerId).toBe('REV-NEW')
    expect(profile.totalReviews).toBe(0)
    expect(profile.agreementRate).toBe(0)
    expect(profile.joinedAt).toBeGreaterThan(0)
  })

  test('注册后应可通过 ID 查询', () => {
    registerReviewer({
      reviewerId: 'REV-FIND',
      name: '查询测试',
      level: 'senior',
      specialties: ['查询'],
    })
    expect(getReviewerProfile('REV-FIND')).toBeDefined()
  })

  // ─── submitExpertReview ───
  test('提交审核应返回包含自动生成 ID 的条目', () => {
    const entry = submitExpertReview({
      reviewerId: 'REV-001',
      caseId: 'CASE-NEW',
      reportId: 'RPT-NEW',
      dimensions: makeTestDimensions('correct', 8),
      aiConclusion: 'AI 结论',
      expertConclusion: '专家结论',
      disagreementReason: '',
      severity: 'info',
      classicalReferenceUsed: ['渊海子平'],
      recommendation: '维持',
      timeSpentMinutes: 20,
    })
    expect(entry.id).toMatch(/^ER-\d+-\d{4}$/)
    expect(entry.reviewedAt).toBeGreaterThan(0)
  })

  test('提交审核后审核员统计应更新', () => {
    const before = getReviewerProfile('REV-001')!.totalReviews
    submitExpertReview({
      reviewerId: 'REV-001',
      caseId: 'CASE-NEW',
      reportId: 'RPT-NEW',
      dimensions: makeTestDimensions('correct', 7),
      aiConclusion: 'AI',
      expertConclusion: '专家',
      disagreementReason: '',
      severity: 'info',
      classicalReferenceUsed: [],
      recommendation: 'OK',
      timeSpentMinutes: 15,
    })
    const after = getReviewerProfile('REV-001')!.totalReviews
    expect(after).toBe(before + 1)
  })

  // ─── getReviewById ───
  test('查询存在的审核 ID 应返回条目', () => {
    const review = getReviewById('ER-1000001-0001')
    expect(review).toBeDefined()
    expect(review!.caseId).toBe('CASE-001')
  })

  test('查询不存在的审核 ID 应返回 undefined', () => {
    expect(getReviewById('NON-EXISTENT')).toBeUndefined()
  })

  // ─── getReviewsByCaseId ───
  test('按案例 ID 筛选应返回正确结果', () => {
    const reviews = getReviewsByCaseId('CASE-001')
    expect(reviews.length).toBe(1)
  })

  // ─── getReviewsByReviewerId ───
  test('按审核员 ID 筛选应返回正确数量', () => {
    const reviews = getReviewsByReviewerId('REV-001')
    expect(reviews.length).toBe(2) // 种子数据中 REV-001 有 2 条
  })

  // ─── getReviewsBySeverity ───
  test('按严重程度筛选 critical 应返回正确结果', () => {
    const critical = getReviewsBySeverity('critical')
    expect(critical.length).toBe(1) // 只有 review3 是 critical
  })

  test('按严重程度筛选 info 应返回正确结果', () => {
    const info = getReviewsBySeverity('info')
    expect(info.length).toBe(2) // review1 和 review4 是 info
  })

  // ─── getDisagreementReviews ───
  test('不一致审核应排除全 correct 的记录', () => {
    const disagreements = getDisagreementReviews()
    // 种子数据中 review1 和 review4 全 correct，应排除
    expect(disagreements.length).toBe(3)
    expect(disagreements.every((r) => {
      return Object.values(r.dimensions).some((d) => d.verdict !== 'correct')
    })).toBe(true)
  })

  // ─── getReviewStats ───
  test('统计汇总应返回正确的审核总数', () => {
    const stats = getReviewStats()
    expect(stats.totalReviews).toBe(5)
  })

  test('统计汇总应包含所有维度平均值', () => {
    const stats = getReviewStats()
    const dims: ReviewDimension[] = [
      'accuracy', 'depth', 'completeness', 'classicalReference', 'readability', 'recommendation',
    ]
    for (const d of dims) {
      expect(stats.dimensionAverages[d]).toBeGreaterThanOrEqual(0)
      expect(stats.dimensionAverages[d]).toBeLessThanOrEqual(10)
    }
  })

  test('统计汇总应包含严重程度分布', () => {
    const stats = getReviewStats()
    expect(stats.severityDistribution.critical).toBe(1)
    expect(stats.severityDistribution.major).toBe(2)
    expect(stats.severityDistribution.info).toBe(2)
  })

  test('统计汇总应包含审核员效率', () => {
    const stats = getReviewStats()
    expect(stats.reviewerProductivity.length).toBe(3)
  })

  test('统计汇总应包含分歧原因排行', () => {
    const stats = getReviewStats()
    expect(stats.topDisagreementReasons.length).toBeGreaterThan(0)
  })

  // ─── calculateReviewerAgreement ───
  test('REV-001 一致率应较高（有 correct 和 partial）', () => {
    const rate = calculateReviewerAgreement('REV-001')
    // REV-001: review1 全 correct(6/6), review2 全 partial(0/6) = 6/12 = 0.5
    expect(rate).toBe(0.5)
  })

  test('REV-002 一致率应较低（有 incorrect）', () => {
    const rate = calculateReviewerAgreement('REV-002')
    // REV-002: review3 全 incorrect(0/6), review4 全 correct(6/6) = 6/12 = 0.5
    expect(rate).toBe(0.5)
  })

  test('不存在的审核员一致率应为 0', () => {
    expect(calculateReviewerAgreement('NON-EXISTENT')).toBe(0)
  })

  // ─── getAllReviewers ───
  test('获取所有审核员应返回完整列表', () => {
    const all = getAllReviewers()
    expect(all.length).toBe(3)
    expect(all.every((r) => r.reviewerId)).toBe(true)
  })

  // ─── resetReviewFormStore ───
  test('重置后种子数据应恢复', () => {
    registerReviewer({
      reviewerId: 'REV-TEMP',
      name: '临时',
      level: 'junior',
      specialties: ['临时'],
    })
    expect(getAllReviewers().length).toBe(4)
    resetReviewFormStore()
    expect(getAllReviewers().length).toBe(3)
  })

  // ─── 边界情况 ───
  test('审核员档案应包含正确的专长', () => {
    const rev1 = getReviewerProfile('REV-001')
    expect(rev1!.specialties).toContain('格局')
    expect(rev1!.specialties).toContain('喜用神')
  })

  test('不一致审核记录应包含古籍引用', () => {
    const review = getReviewById('ER-1000003-0003')
    expect(review!.classicalReferenceUsed).toContain('穷通宝鉴')
    expect(review!.classicalReferenceUsed).toContain('滴天髓')
  })

  test('审核记录应包含时间花费', () => {
    const review = getReviewById('ER-1000002-0002')
    expect(review!.timeSpentMinutes).toBe(45)
  })
})
