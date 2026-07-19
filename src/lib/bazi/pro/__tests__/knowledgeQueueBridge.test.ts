/**
 * Knowledge Queue Bridge Engine 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - enqueueItem 手动入队
 *   - enqueueFromUserFeedback / enqueueFromExpertReview / enqueueFromAiDiff 自动入队
 *   - getItemById / getPendingItems / getItemsByStatus / getItemsBySourceType
 *   - assignItem / resolveItem
 *   - getQueueStats 统计汇总
 *   - getAllItems / resetQueueStore
 *   - 种子数据验证
 *   - 自动入队条件逻辑
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import type {
  KnowledgeQueueItem,
  QueueSourceType,
  QueuePriority,
  QueueItemStatus,
} from '../knowledgeQueueBridgeTypes'

import type { UserFeedbackEntry } from '../userFeedbackTypes'
import type { ExpertReviewFormEntry, ReviewVerdict } from '../expertReviewFormTypes'
import type { AiExpertDiffEntry } from '../aiExpertDiffTypes'

import {
  KNOWLEDGE_QUEUE_BRIDGE_VERSION,
} from '../knowledgeQueueBridgeTypes'

import {
  KNOWLEDGE_QUEUE_BRIDGE_ENGINE_VERSION,
  enqueueItem,
  enqueueFromUserFeedback,
  enqueueFromExpertReview,
  enqueueFromAiDiff,
  getItemById,
  getPendingItems,
  getItemsByStatus,
  getItemsBySourceType,
  assignItem,
  resolveItem,
  getQueueStats,
  getAllItems,
  resetQueueStore,
} from '../knowledgeQueueBridgeEngine'

describe('knowledgeQueueBridgeEngine', () => {
  beforeEach(() => {
    resetQueueStore()
  })

  // ─── 版本号 ───
  test('types 版本号应为 1.0.0', () => {
    expect(KNOWLEDGE_QUEUE_BRIDGE_VERSION).toBe('1.0.0')
  })

  test('engine 版本号应与 types 一致', () => {
    expect(KNOWLEDGE_QUEUE_BRIDGE_ENGINE_VERSION).toBe('1.0.0')
  })

  // ─── 种子数据 ───
  test('种子数据应包含 5 条队列项', () => {
    const all = getAllItems()
    expect(all.length).toBe(5)
  })

  test('种子数据应包含特定 ID', () => {
    expect(getItemById('KQ-1000001-0001')).toBeDefined()
    expect(getItemById('KQ-1000005-0005')).toBeDefined()
  })

  // ─── enqueueItem ───
  test('手动入队应返回包含自动生成 ID 的条目', () => {
    const item = enqueueItem({
      sourceType: 'manual',
      sourceId: 'MANUAL-TEST',
      caseId: 'CASE-TEST',
      topic: '测试入队',
      description: '测试描述',
      priority: 'normal',
      status: 'pending',
      evidence: ['证据1'],
      relatedRules: [],
      relatedKnowledge: [],
      assignedTo: null,
    })
    expect(item.id).toMatch(/^KQ-\d+-\d{4}$/)
    expect(item.createdAt).toBeGreaterThan(0)
    expect(item.resolvedAt).toBeNull()
    expect(item.resolutionNote).toBeNull()
  })

  test('入队后应可通过 ID 查询', () => {
    const item = enqueueItem({
      sourceType: 'manual',
      sourceId: 'MAN-FIND',
      caseId: null,
      topic: '查找测试',
      description: '查找描述',
      priority: 'low',
      status: 'pending',
      evidence: [],
      relatedRules: [],
      relatedKnowledge: [],
      assignedTo: null,
    })
    const found = getItemById(item.id)
    expect(found).toBeDefined()
    expect(found!.topic).toBe('查找测试')
  })

  // ─── enqueueFromUserFeedback ───
  test('评分 <= 2 的反馈应自动入队', () => {
    const feedback: UserFeedbackEntry = {
      id: 'UF-LOW',
      reportId: 'RPT-LOW',
      userId: 'U-LOW',
      channel: 'web',
      rating: 2,
      accuracyRating: 2,
      readabilityRating: 2,
      helpfulnessRating: 2,
      mostAccurateSections: [],
      leastAccurateSections: [],
      comment: '太差了',
      improvementSuggestions: [],
      wouldRecommend: false,
      createdAt: Date.now(),
      validatedAt: null,
      validatedBy: null,
    }
    const item = enqueueFromUserFeedback('UF-LOW', feedback)
    expect(item).not.toBeNull()
    expect(item!.sourceType).toBe('user_feedback')
    expect(item!.priority).toBe('low')
  })

  test('评分 > 2 的反馈不应入队', () => {
    const feedback: UserFeedbackEntry = {
      id: 'UF-HIGH',
      reportId: 'RPT-HIGH',
      userId: 'U-HIGH',
      channel: 'web',
      rating: 3,
      accuracyRating: 3,
      readabilityRating: 3,
      helpfulnessRating: 3,
      mostAccurateSections: [],
      leastAccurateSections: [],
      comment: '还行',
      improvementSuggestions: [],
      wouldRecommend: true,
      createdAt: Date.now(),
      validatedAt: null,
      validatedBy: null,
    }
    const item = enqueueFromUserFeedback('UF-HIGH', feedback)
    expect(item).toBeNull()
  })

  test('评分 1 的反馈应入队', () => {
    const feedback: UserFeedbackEntry = {
      id: 'UF-1STAR',
      reportId: 'RPT-1S',
      userId: 'U-1S',
      channel: 'mobile',
      rating: 1,
      accuracyRating: 1,
      readabilityRating: 1,
      helpfulnessRating: 1,
      mostAccurateSections: [],
      leastAccurateSections: [],
      comment: '极差',
      improvementSuggestions: [],
      wouldRecommend: false,
      createdAt: Date.now(),
      validatedAt: null,
      validatedBy: null,
    }
    const item = enqueueFromUserFeedback('UF-1STAR', feedback)
    expect(item).not.toBeNull()
  })

  // ─── enqueueFromExpertReview ───
  test('verdict 含 incorrect 的审核应自动入队', () => {
    const review: ExpertReviewFormEntry = {
      id: 'ER-INC',
      reviewerId: 'REV-001',
      caseId: 'CASE-INC',
      reportId: 'RPT-INC',
      dimensions: {
        accuracy: { rating: 2, comment: '不准确', verdict: 'incorrect' },
        depth: { rating: 8, comment: '准确', verdict: 'correct' },
        completeness: { rating: 8, comment: '准确', verdict: 'correct' },
        classicalReference: { rating: 8, comment: '准确', verdict: 'correct' },
        readability: { rating: 8, comment: '准确', verdict: 'correct' },
        recommendation: { rating: 8, comment: '准确', verdict: 'correct' },
      },
      aiConclusion: 'AI',
      expertConclusion: '专家',
      disagreementReason: '不一致',
      severity: 'critical',
      classicalReferenceUsed: [],
      recommendation: '改进',
      reviewedAt: Date.now(),
      timeSpentMinutes: 30,
    }
    const item = enqueueFromExpertReview('ER-INC', review)
    expect(item).not.toBeNull()
    expect(item!.sourceType).toBe('expert_review')
    expect(item!.priority).toBe('high')
  })

  test('全部 correct 的审核不应入队', () => {
    const review: ExpertReviewFormEntry = {
      id: 'ER-COR',
      reviewerId: 'REV-001',
      caseId: 'CASE-COR',
      reportId: 'RPT-COR',
      dimensions: {
        accuracy: { rating: 8, comment: '准确', verdict: 'correct' },
        depth: { rating: 8, comment: '准确', verdict: 'correct' },
        completeness: { rating: 8, comment: '准确', verdict: 'correct' },
        classicalReference: { rating: 8, comment: '准确', verdict: 'correct' },
        readability: { rating: 8, comment: '准确', verdict: 'correct' },
        recommendation: { rating: 8, comment: '准确', verdict: 'correct' },
      },
      aiConclusion: 'AI',
      expertConclusion: 'AI 一致',
      disagreementReason: '',
      severity: 'info',
      classicalReferenceUsed: [],
      recommendation: '维持',
      reviewedAt: Date.now(),
      timeSpentMinutes: 10,
    }
    const item = enqueueFromExpertReview('ER-COR', review)
    expect(item).toBeNull()
  })

  // ─── enqueueFromAiDiff ───
  test('severity === critical 的差异应自动入队', () => {
    const diff: AiExpertDiffEntry = {
      id: 'DIFF-CRIT',
      reviewId: 'ER-CRIT',
      caseId: 'CASE-CRIT',
      reportId: 'RPT-CRIT',
      field: '喜用神',
      category: 'conclusion',
      aiValue: '水',
      expertValue: '木',
      diffDescription: '严重分歧',
      severity: 'critical',
      resolution: 'pending',
      resolvedAt: null,
      resolvedBy: null,
      resolutionNote: null,
      createdAt: Date.now(),
    }
    const item = enqueueFromAiDiff('DIFF-CRIT', diff)
    expect(item).not.toBeNull()
    expect(item!.sourceType).toBe('ai_diff')
    expect(item!.priority).toBe('critical')
  })

  test('severity !== critical 的差异不应入队', () => {
    const diff: AiExpertDiffEntry = {
      id: 'DIFF-MAJ',
      reviewId: 'ER-MAJ',
      caseId: 'CASE-MAJ',
      reportId: 'RPT-MAJ',
      field: '五行',
      category: 'detail',
      aiValue: 'AI',
      expertValue: '专家',
      diffDescription: '一般差异',
      severity: 'major',
      resolution: 'pending',
      resolvedAt: null,
      resolvedBy: null,
      resolutionNote: null,
      createdAt: Date.now(),
    }
    const item = enqueueFromAiDiff('DIFF-MAJ', diff)
    expect(item).toBeNull()
  })

  // ─── getItemById ───
  test('查询存在的 ID 应返回条目', () => {
    const item = getItemById('KQ-1000001-0001')
    expect(item).toBeDefined()
    expect(item!.sourceType).toBe('user_feedback')
  })

  test('查询不存在的 ID 应返回 undefined', () => {
    expect(getItemById('NON-EXISTENT')).toBeUndefined()
  })

  // ─── getPendingItems ───
  test('待处理项应只包含 pending 状态', () => {
    const pending = getPendingItems()
    expect(pending.length).toBe(1) // 只有 KQ-1 是 pending
    expect(pending.every((i) => i.status === 'pending')).toBe(true)
  })

  test('按优先级筛选待处理项', () => {
    const critical = getPendingItems('critical')
    expect(critical.length).toBe(0) // critical 的 KQ-3 是 reviewed 状态
  })

  // ─── getItemsByStatus ───
  test('按状态筛选 applied 应返回 1 条', () => {
    const applied = getItemsByStatus('applied')
    expect(applied.length).toBe(1) // KQ-4
  })

  test('按状态筛选 rejected 应返回 1 条', () => {
    const rejected = getItemsByStatus('rejected')
    expect(rejected.length).toBe(1) // KQ-5
  })

  // ─── getItemsBySourceType ───
  test('按来源类型筛选 user_feedback 应返回 1 条', () => {
    const items = getItemsBySourceType('user_feedback')
    expect(items.length).toBe(1) // KQ-1
  })

  test('按来源类型筛选 manual 应返回 1 条', () => {
    const items = getItemsBySourceType('manual')
    expect(items.length).toBe(1) // KQ-4
  })

  // ─── assignItem ───
  test('分配应更新 assignedTo 和 status', () => {
    const result = assignItem('KQ-1000001-0001', 'TEAM-003')
    expect(result).not.toBeNull()
    expect(result!.assignedTo).toBe('TEAM-003')
    expect(result!.status).toBe('in_progress')
    expect(result!.updatedAt).toBeGreaterThan(0)
  })

  test('分配不存在的 ID 应返回 null', () => {
    expect(assignItem('NON-EXISTENT', 'TEAM-001')).toBeNull()
  })

  // ─── resolveItem ───
  test('解决应更新 status 和 resolutionNote', () => {
    const result = resolveItem('KQ-1000001-0001', '已处理，更新规则', 'applied')
    expect(result).not.toBeNull()
    expect(result!.status).toBe('applied')
    expect(result!.resolutionNote).toBe('已处理，更新规则')
    expect(result!.resolvedAt).toBeGreaterThan(0)
  })

  test('解决时不指定状态应默认 applied', () => {
    const result = resolveItem('KQ-1000001-0001', '默认处理')
    expect(result!.status).toBe('applied')
  })

  test('解决不存在的 ID 应返回 null', () => {
    expect(resolveItem('NON-EXISTENT', '处理')).toBeNull()
  })

  // ─── getQueueStats ───
  test('统计汇总应返回正确的总数', () => {
    const stats = getQueueStats()
    expect(stats.totalItems).toBe(5)
  })

  test('统计汇总应包含来源分布', () => {
    const stats = getQueueStats()
    expect(stats.bySource.user_feedback).toBe(1)
    expect(stats.bySource.expert_review).toBe(1)
    expect(stats.bySource.ai_diff).toBe(1)
    expect(stats.bySource.manual).toBe(1)
    expect(stats.bySource.regression_failure).toBe(1)
  })

  test('统计汇总应包含优先级分布', () => {
    const stats = getQueueStats()
    expect(stats.byPriority.critical).toBe(1)
    expect(stats.byPriority.high).toBe(2)
    expect(stats.byPriority.normal).toBe(1)
    expect(stats.byPriority.low).toBe(1)
  })

  test('统计汇总应包含状态分布', () => {
    const stats = getQueueStats()
    expect(stats.byStatus.pending).toBe(1)
    expect(stats.byStatus.in_progress).toBe(1)
    expect(stats.byStatus.reviewed).toBe(1)
    expect(stats.byStatus.applied).toBe(1)
    expect(stats.byStatus.rejected).toBe(1)
  })

  test('统计汇总解决率应正确', () => {
    const stats = getQueueStats()
    // applied(1) + rejected(1) = 2, total = 5
    expect(stats.resolutionRate).toBe(0.4)
  })

  // ─── getAllItems ───
  test('获取所有队列项应返回完整列表', () => {
    const all = getAllItems()
    expect(all.length).toBe(5)
    expect(all.every((i) => i.id)).toBe(true)
  })

  // ─── resetQueueStore ───
  test('重置后种子数据应恢复', () => {
    enqueueItem({
      sourceType: 'manual',
      sourceId: 'MAN-TEMP',
      caseId: null,
      topic: '临时',
      description: '临时',
      priority: 'low',
      status: 'pending',
      evidence: [],
      relatedRules: [],
      relatedKnowledge: [],
      assignedTo: null,
    })
    expect(getAllItems().length).toBe(6)
    resetQueueStore()
    expect(getAllItems().length).toBe(5)
  })

  // ─── 边界情况 ───
  test('已解决项的解决时间应大于创建时间', () => {
    const item = getItemById('KQ-1000004-0004')
    expect(item!.resolvedAt).toBeGreaterThan(item!.createdAt)
  })

  test('种子数据 KQ-2 应有 assignee', () => {
    const item = getItemById('KQ-1000002-0002')
    expect(item!.assignedTo).toBe('TEAM-001')
    expect(item!.status).toBe('in_progress')
  })

  test('种子数据 KQ-3 应包含关联知识', () => {
    const item = getItemById('KQ-1000003-0003')
    expect(item!.relatedRules).toContain('RULE-002')
  })
})
