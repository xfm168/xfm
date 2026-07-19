/**
 * Professional Review Engine 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - submitReview 基本功能
 *   - getReviewWorkflow
 *   - getReviewStats
 *   - getPendingReviews
 *   - approveReview
 *   - rejectReview
 *   - getReviewHistory
 *   - submitBatchReview
 *   - generateReviewSummary
 *   - 边界条件
 */

import { describe, test, expect, beforeEach } from 'vitest'
import type { ReviewAction, ExpertReview } from '../professionalReviewTypes'
import {
  PROFESSIONAL_REVIEW_VERSION,
  submitReview,
  getReviewWorkflow,
  getReviewStats,
  getPendingReviews,
  approveReview,
  rejectReview,
  getReviewHistory,
  submitBatchReview,
  generateReviewSummary,
  _clearReviewStore,
} from '../professionalReviewEngine'

beforeEach(() => {
  _clearReviewStore()
})

// ─── 版本号 ───

describe('Professional Review Engine - 版本号', () => {
  test('版本号为 1.0.0', () => {
    expect(PROFESSIONAL_REVIEW_VERSION).toBe('1.0.0')
  })
})

// ─── submitReview ───

describe('Professional Review Engine - submitReview', () => {
  test('提交审核返回 ExpertReview 对象', () => {
    const review = submitReview('CLS-001', 'EXP-001', 'approved', '同意判定')
    expect(review).toBeDefined()
    expect(review.reviewId).toMatch(/^REV-/)
    expect(review.caseId).toBe('CLS-001')
    expect(review.reviewerId).toBe('EXP-001')
    expect(review.action).toBe('approved')
    expect(review.status).toBe('approved')
    expect(review.comment).toBe('同意判定')
    expect(review.revisionHistory).toEqual([])
    expect(review.affectedFields).toEqual([])
  })

  test('提交审核自动设置 reviewedAt', () => {
    const before = Date.now()
    const review = submitReview('CLS-001', 'EXP-001', 'approved', 'ok')
    expect(review.reviewedAt).toBeGreaterThanOrEqual(before)
    expect(review.reviewedAt).toBeLessThanOrEqual(Date.now())
  })

  test('提交不同动作的审核', () => {
    const actions: ReviewAction[] = [
      'pending_review', 'approved', 'revision_required', 'contested', 'deprecated',
    ]
    for (const action of actions) {
      const review = submitReview('CLS-001', 'EXP-001', action, `test ${action}`)
      expect(review.action).toBe(action)
      expect(review.status).toBe(action)
    }
  })

  test('提交带 affectedFields 的审核', () => {
    const review = submitReview('CLS-001', 'EXP-001', 'revision_required', '需修改', ['primaryPattern', 'strengthLevel'])
    expect(review.affectedFields).toEqual(['primaryPattern', 'strengthLevel'])
  })

  test('同一命例可多次提交审核', () => {
    submitReview('CLS-001', 'EXP-001', 'approved', 'ok')
    submitReview('CLS-001', 'EXP-002', 'contested', '争议')
    const history = getReviewHistory('CLS-001')
    expect(history).toHaveLength(2)
  })
})

// ─── getReviewWorkflow ───

describe('Professional Review Engine - getReviewWorkflow', () => {
  test('空命例返回空工作流', () => {
    const wf = getReviewWorkflow('CLS-999')
    expect(wf.totalCount).toBe(0)
    expect(wf.approvalRate).toBe(0)
    expect(wf.avgReviewScore).toBe(0)
    expect(wf.pendingReviews).toEqual([])
    expect(wf.approvedReviews).toEqual([])
    expect(wf.contestedReviews).toEqual([])
    expect(wf.deprecatedReviews).toEqual([])
  })

  test('正确分类各类审核', () => {
    submitReview('CLS-001', 'EXP-001', 'pending_review', '待审核')
    submitReview('CLS-001', 'EXP-002', 'approved', '通过')
    submitReview('CLS-001', 'EXP-003', 'contested', '争议')
    submitReview('CLS-001', 'EXP-004', 'deprecated', '废弃')

    const wf = getReviewWorkflow('CLS-001')
    expect(wf.totalCount).toBe(4)
    expect(wf.pendingReviews).toHaveLength(1)
    expect(wf.approvedReviews).toHaveLength(1)
    expect(wf.contestedReviews).toHaveLength(1)
    expect(wf.deprecatedReviews).toHaveLength(1)
  })

  test('正确计算批准率', () => {
    submitReview('CLS-001', 'EXP-001', 'approved', '通过')
    submitReview('CLS-001', 'EXP-002', 'approved', '通过')
    submitReview('CLS-001', 'EXP-003', 'contested', '争议')

    const wf = getReviewWorkflow('CLS-001')
    expect(wf.approvalRate).toBeCloseTo(66.67, 1)
  })
})

// ─── getReviewStats ───

describe('Professional Review Engine - getReviewStats', () => {
  test('空状态返回零值统计', () => {
    const stats = getReviewStats()
    expect(stats.totalReviews).toBe(0)
    expect(stats.approvalRate).toBe(0)
    expect(stats.contestedRate).toBe(0)
    expect(stats.avgCommentsPerReview).toBe(0)
    expect(stats.recentReviews).toEqual([])
  })

  test('全局统计按动作正确计数', () => {
    submitReview('CLS-001', 'EXP-001', 'approved', '通过')
    submitReview('CLS-001', 'EXP-002', 'approved', '通过')
    submitReview('CLS-002', 'EXP-001', 'contested', '争议')
    submitReview('CLS-002', 'EXP-003', 'revision_required', '需修改')

    const stats = getReviewStats()
    expect(stats.totalReviews).toBe(4)
    expect(stats.byAction.approved).toBe(2)
    expect(stats.byAction.contested).toBe(1)
    expect(stats.byAction.revision_required).toBe(1)
  })

  test('按审核人正确计数', () => {
    submitReview('CLS-001', 'EXP-001', 'approved', 'ok')
    submitReview('CLS-002', 'EXP-001', 'approved', 'ok')
    submitReview('CLS-003', 'EXP-002', 'approved', 'ok')

    const stats = getReviewStats()
    expect(stats.byReviewer['EXP-001']).toBe(2)
    expect(stats.byReviewer['EXP-002']).toBe(1)
  })

  test('avgCommentsPerReview 正确计算', () => {
    submitReview('CLS-001', 'EXP-001', 'approved', '一二三四五六七八九十')
    submitReview('CLS-002', 'EXP-001', 'approved', '一二三四')

    const stats = getReviewStats()
    expect(stats.avgCommentsPerReview).toBe(7)
  })
})

// ─── getPendingReviews ───

describe('Professional Review Engine - getPendingReviews', () => {
  test('无待审核时返回空数组', () => {
    expect(getPendingReviews()).toEqual([])
  })

  test('返回所有 pending_review 状态的审核', () => {
    submitReview('CLS-001', 'EXP-001', 'pending_review', '待审核1')
    submitReview('CLS-001', 'EXP-002', 'approved', '已通过')
    submitReview('CLS-002', 'EXP-003', 'pending_review', '待审核2')

    const pending = getPendingReviews()
    expect(pending).toHaveLength(2)
  })
})

// ─── approveReview ───

describe('Professional Review Engine - approveReview', () => {
  test('批准待审核的审核返回 true', () => {
    const review = submitReview('CLS-001', 'EXP-001', 'pending_review', '待审核')
    const result = approveReview(review.reviewId)
    expect(result).toBe(true)

    const wf = getReviewWorkflow('CLS-001')
    expect(wf.approvedReviews).toHaveLength(1)
    expect(wf.pendingReviews).toHaveLength(0)
  })

  test('批准不存在的审核返回 false', () => {
    expect(approveReview('REV-NONEXIST')).toBe(false)
  })

  test('批准已 approved 的审核返回 false', () => {
    const review = submitReview('CLS-001', 'EXP-001', 'approved', '已通过')
    expect(approveReview(review.reviewId)).toBe(false)
  })
})

// ─── rejectReview ───

describe('Professional Review Engine - rejectReview', () => {
  test('驳回待审核的审核返回 true', () => {
    const review = submitReview('CLS-001', 'EXP-001', 'pending_review', '待审核')
    const result = rejectReview(review.reviewId, '需要补充依据')
    expect(result).toBe(true)

    const wf = getReviewWorkflow('CLS-001')
    expect(wf.pendingReviews).toHaveLength(0)
  })

  test('驳回时添加原因到 revisionHistory', () => {
    const review = submitReview('CLS-001', 'EXP-001', 'pending_review', '待审核')
    rejectReview(review.reviewId, '需要补充依据')

    const history = getReviewHistory('CLS-001')
    expect(history[0].revisionHistory).toContain('需要补充依据')
  })

  test('驳回不存在的审核返回 false', () => {
    expect(rejectReview('REV-NONEXIST', 'reason')).toBe(false)
  })
})

// ─── getReviewHistory ───

describe('Professional Review Engine - getReviewHistory', () => {
  test('返回按时间倒序的审核历史', () => {
    const r1 = submitReview('CLS-001', 'EXP-001', 'approved', 'first')
    // 手动设置递增的 reviewedAt 确保时间有序
    const r2 = submitReview('CLS-001', 'EXP-002', 'approved', 'second')
    const r3 = submitReview('CLS-001', 'EXP-003', 'approved', 'third')

    // 重新注入递增时间戳
    const store = (getReviewWorkflow('CLS-001'))
    const all = [...store.pendingReviews, ...store.approvedReviews, ...store.contestedReviews, ...store.deprecatedReviews]
    const allSorted = all.sort((a, b) => a.reviewedAt - b.reviewedAt)
    allSorted[0].reviewedAt = 1000
    allSorted[1].reviewedAt = 2000
    allSorted[2].reviewedAt = 3000

    const history = getReviewHistory('CLS-001')
    expect(history).toHaveLength(3)
    expect(history[0].comment).toBe('third')
    expect(history[1].comment).toBe('second')
    expect(history[2].comment).toBe('first')
  })

  test('不存在命例返回空数组', () => {
    expect(getReviewHistory('CLS-999')).toEqual([])
  })
})

// ─── submitBatchReview ───

describe('Professional Review Engine - submitBatchReview', () => {
  test('批量提交审核返回多个 ExpertReview', () => {
    const results = submitBatchReview([
      { caseId: 'CLS-001', reviewerId: 'EXP-001', action: 'approved', comment: 'ok' },
      { caseId: 'CLS-002', reviewerId: 'EXP-002', action: 'approved', comment: 'ok' },
      { caseId: 'CLS-003', reviewerId: 'EXP-003', action: 'contested', comment: '争议' },
    ])

    expect(results).toHaveLength(3)
    expect(results[0].caseId).toBe('CLS-001')
    expect(results[2].action).toBe('contested')
  })
})

// ─── generateReviewSummary ───

describe('Professional Review Engine - generateReviewSummary', () => {
  test('生成包含版本号的摘要', () => {
    const summary = generateReviewSummary()
    expect(summary).toContain('v1.0.0')
    expect(summary).toContain('专业审核摘要')
  })

  test('摘要包含统计数据', () => {
    submitReview('CLS-001', 'EXP-001', 'approved', '通过')
    submitReview('CLS-002', 'EXP-002', 'contested', '争议')
    const summary = generateReviewSummary()
    expect(summary).toContain('总审核数: 2')
    expect(summary).toContain('批准率')
    expect(summary).toContain('contested')
  })
})

// ─── _clearReviewStore ───

describe('Professional Review Engine - _clearReviewStore', () => {
  test('清空后统计数据归零', () => {
    submitReview('CLS-001', 'EXP-001', 'approved', 'ok')
    _clearReviewStore()
    const stats = getReviewStats()
    expect(stats.totalReviews).toBe(0)
  })
})
