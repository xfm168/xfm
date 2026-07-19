/**
 * Knowledge Queue Bridge Engine
 *
 * 职责：
 *   - 知识队列的 CRUD 操作
 *   - 从用户反馈/专家审核/AI差异自动入队
 *   - 队列分配与解决管理
 *   - 队列统计汇总
 * 约束：
 *   - 不修改已有文件
 *   - 纯数据管理层
 */

import type {
  KnowledgeQueueItem,
  KnowledgeQueueStats,
  QueueSourceType,
  QueuePriority,
  QueueItemStatus,
} from './knowledgeQueueBridgeTypes'

import type { UserFeedbackEntry } from './userFeedbackTypes'
import type { ExpertReviewFormEntry, CaseSeverity } from './expertReviewFormTypes'
import type { AiExpertDiffEntry } from './aiExpertDiffTypes'

import { KNOWLEDGE_QUEUE_BRIDGE_VERSION } from './knowledgeQueueBridgeTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const KNOWLEDGE_QUEUE_BRIDGE_ENGINE_VERSION = KNOWLEDGE_QUEUE_BRIDGE_VERSION

// ═══════════════════════════════════════════
// 2. 内部存储
// ═══════════════════════════════════════════

const queueStore = new Map<string, KnowledgeQueueItem>()

// ═══════════════════════════════════════════
// 3. 常量
// ═══════════════════════════════════════════

const ALL_SOURCES: QueueSourceType[] = ['user_feedback', 'expert_review', 'ai_diff', 'regression_failure', 'manual']
const ALL_PRIORITIES: QueuePriority[] = ['critical', 'high', 'normal', 'low']
const ALL_STATUSES: QueueItemStatus[] = ['pending', 'in_progress', 'reviewed', 'applied', 'rejected']

// ═══════════════════════════════════════════
// 4. 核心函数
// ═══════════════════════════════════════════

/** 手动入队 */
export function enqueueItem(
  data: Omit<KnowledgeQueueItem, 'id' | 'createdAt' | 'updatedAt' | 'resolvedAt' | 'resolutionNote'>,
): KnowledgeQueueItem {
  const now = Date.now()
  const entry: KnowledgeQueueItem = {
    ...data,
    id: `KQ-${now}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    resolutionNote: null,
  }
  queueStore.set(entry.id, entry)
  return entry
}

/** 从用户反馈自动入队（评分<=2时入队） */
export function enqueueFromUserFeedback(
  feedbackId: string,
  feedbackData: UserFeedbackEntry,
): KnowledgeQueueItem | null {
  if (feedbackData.rating > 2) return null

  return enqueueItem({
    sourceType: 'user_feedback',
    sourceId: feedbackId,
    caseId: null,
    topic: `低评分反馈: ${feedbackData.reportId}`,
    description: `用户评分 ${feedbackData.rating} 星，评论: ${feedbackData.comment}`,
    priority: 'low',
    status: 'pending',
    evidence: [feedbackData.comment],
    relatedRules: [],
    relatedKnowledge: [],
    assignedTo: null,
  })
}

/** 从专家审核自动入队（verdict==='incorrect'时入队） */
export function enqueueFromExpertReview(
  reviewId: string,
  reviewData: ExpertReviewFormEntry,
): KnowledgeQueueItem | null {
  const hasIncorrect = Object.values(reviewData.dimensions).some((d) => d.verdict === 'incorrect')
  if (!hasIncorrect) return null

  return enqueueItem({
    sourceType: 'expert_review',
    sourceId: reviewId,
    caseId: reviewData.caseId,
    topic: `专家审核不一致: ${reviewData.caseId}`,
    description: `专家认为 AI 结论有误。分歧原因: ${reviewData.disagreementReason}`,
    priority: 'high',
    status: 'pending',
    evidence: [reviewData.expertConclusion, reviewData.aiConclusion],
    relatedRules: [],
    relatedKnowledge: reviewData.classicalReferenceUsed,
    assignedTo: null,
  })
}

/** 从AI差异自动入队（severity==='critical'时入队） */
export function enqueueFromAiDiff(
  diffId: string,
  diffData: AiExpertDiffEntry,
): KnowledgeQueueItem | null {
  if (diffData.severity !== 'critical') return null

  return enqueueItem({
    sourceType: 'ai_diff',
    sourceId: diffId,
    caseId: diffData.caseId,
    topic: `严重差异: ${diffData.field}`,
    description: `AI 与专家在 ${diffData.field} 上存在严重分歧。AI: ${diffData.aiValue}，专家: ${diffData.expertValue}`,
    priority: 'critical',
    status: 'pending',
    evidence: [diffData.diffDescription],
    relatedRules: [],
    relatedKnowledge: [],
    assignedTo: null,
  })
}

/** 按 ID 获取队列项 */
export function getItemById(id: string): KnowledgeQueueItem | undefined {
  return queueStore.get(id)
}

/** 获取待处理项（可按优先级筛选） */
export function getPendingItems(priority?: QueuePriority): KnowledgeQueueItem[] {
  const pending = Array.from(queueStore.values()).filter((item) => item.status === 'pending')
  if (priority !== undefined) {
    return pending.filter((item) => item.priority === priority)
  }
  return pending
}

/** 按状态获取队列项 */
export function getItemsByStatus(status: QueueItemStatus): KnowledgeQueueItem[] {
  return Array.from(queueStore.values()).filter((item) => item.status === status)
}

/** 按来源类型获取队列项 */
export function getItemsBySourceType(sourceType: QueueSourceType): KnowledgeQueueItem[] {
  return Array.from(queueStore.values()).filter((item) => item.sourceType === sourceType)
}

/** 分配队列项 */
export function assignItem(itemId: string, assignee: string): KnowledgeQueueItem | null {
  const item = queueStore.get(itemId)
  if (!item) return null
  item.assignedTo = assignee
  item.status = 'in_progress'
  item.updatedAt = Date.now()
  queueStore.set(itemId, item)
  return item
}

/** 解决队列项 */
export function resolveItem(
  itemId: string,
  resolutionNote: string,
  status?: 'applied' | 'rejected',
): KnowledgeQueueItem | null {
  const item = queueStore.get(itemId)
  if (!item) return null
  item.status = status ?? 'applied'
  item.resolutionNote = resolutionNote
  item.resolvedAt = Date.now()
  item.updatedAt = Date.now()
  queueStore.set(itemId, item)
  return item
}

/** 获取队列统计汇总 */
export function getQueueStats(): KnowledgeQueueStats {
  const all = getAllItems()
  const total = all.length

  if (total === 0) {
    const emptyBySource = {} as Record<QueueSourceType, number>
    const emptyByPriority = {} as Record<QueuePriority, number>
    const emptyByStatus = {} as Record<QueueItemStatus, number>
    for (const s of ALL_SOURCES) emptyBySource[s] = 0
    for (const p of ALL_PRIORITIES) emptyByPriority[p] = 0
    for (const s of ALL_STATUSES) emptyByStatus[s] = 0
    return {
      totalItems: 0,
      pendingItems: 0,
      resolvedItems: 0,
      resolutionRate: 0,
      bySource: emptyBySource,
      byPriority: emptyByPriority,
      byStatus: emptyByStatus,
      avgResolutionTimeHours: 0,
    }
  }

  const pending = all.filter((i) => i.status === 'pending').length
  const resolved = all.filter((i) => i.status === 'applied' || i.status === 'rejected').length

  const bySource = {} as Record<QueueSourceType, number>
  for (const s of ALL_SOURCES) bySource[s] = 0
  for (const i of all) bySource[i.sourceType]++

  const byPriority = {} as Record<QueuePriority, number>
  for (const p of ALL_PRIORITIES) byPriority[p] = 0
  for (const i of all) byPriority[i.priority]++

  const byStatus = {} as Record<QueueItemStatus, number>
  for (const s of ALL_STATUSES) byStatus[s] = 0
  for (const i of all) byStatus[i.status]++

  const resolvedItems = all.filter((i) => i.resolvedAt !== null && i.createdAt > 0)
  let avgHours = 0
  if (resolvedItems.length > 0) {
    const totalHours = resolvedItems.reduce((acc, i) => {
      return acc + (i.resolvedAt! - i.createdAt) / (1000 * 60 * 60)
    }, 0)
    avgHours = Math.round((totalHours / resolvedItems.length) * 100) / 100
  }

  return {
    totalItems: total,
    pendingItems: pending,
    resolvedItems: resolved,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) / 100 : 0,
    bySource,
    byPriority,
    byStatus,
    avgResolutionTimeHours: avgHours,
  }
}

/** 获取所有队列项 */
export function getAllItems(): KnowledgeQueueItem[] {
  return Array.from(queueStore.values())
}

/** 重置存储 */
export function resetQueueStore(): void {
  queueStore.clear()
  initSeedData()
}

// ═══════════════════════════════════════════
// 5. 种子数据
// ═══════════════════════════════════════════

function initSeedData(): void {
  const now = Date.now()

  const item1: KnowledgeQueueItem = {
    id: 'KQ-1000001-0001',
    sourceType: 'user_feedback',
    sourceId: 'UF-1000004-0004',
    caseId: null,
    topic: '低评分反馈: RPT-004',
    description: '用户评分 1 星，完全不准',
    priority: 'low',
    status: 'pending',
    evidence: ['完全不准，没有任何参考价值'],
    relatedRules: ['RULE-001'],
    relatedKnowledge: [],
    assignedTo: null,
    createdAt: now - 86400000 * 4,
    updatedAt: now - 86400000 * 4,
    resolvedAt: null,
    resolutionNote: null,
  }

  const item2: KnowledgeQueueItem = {
    id: 'KQ-1000002-0002',
    sourceType: 'expert_review',
    sourceId: 'ER-1000003-0003',
    caseId: 'CASE-003',
    topic: '专家审核不一致: CASE-003',
    description: '喜用神判断错误，水 vs 木',
    priority: 'high',
    status: 'in_progress',
    evidence: ['喜用神判断有误'],
    relatedRules: ['RULE-002', 'RULE-003'],
    relatedKnowledge: ['穷通宝鉴'],
    assignedTo: 'TEAM-001',
    createdAt: now - 86400000 * 3,
    updatedAt: now - 86400000 * 2,
    resolvedAt: null,
    resolutionNote: null,
  }

  const item3: KnowledgeQueueItem = {
    id: 'KQ-1000003-0003',
    sourceType: 'ai_diff',
    sourceId: 'DIFF-1000003-0003',
    caseId: 'CASE-003',
    topic: '严重差异: 喜用神',
    description: 'AI 与专家在喜用神上存在严重分歧',
    priority: 'critical',
    status: 'reviewed',
    evidence: ['五行平衡分析错误'],
    relatedRules: ['RULE-002'],
    relatedKnowledge: [],
    assignedTo: 'TEAM-001',
    createdAt: now - 86400000 * 3,
    updatedAt: now - 86400000 * 1,
    resolvedAt: null,
    resolutionNote: null,
  }

  const item4: KnowledgeQueueItem = {
    id: 'KQ-1000004-0004',
    sourceType: 'manual',
    sourceId: 'MANUAL-001',
    caseId: 'CASE-006',
    topic: '手动添加: 新规则需求',
    description: '需要新增大运流年综合分析规则',
    priority: 'normal',
    status: 'applied',
    evidence: ['多次用户反馈大运分析不足'],
    relatedRules: ['RULE-005'],
    relatedKnowledge: ['三命通会'],
    assignedTo: 'TEAM-002',
    createdAt: now - 86400000 * 10,
    updatedAt: now - 86400000 * 5,
    resolvedAt: now - 86400000 * 5,
    resolutionNote: '已添加新规则并上线',
  }

  const item5: KnowledgeQueueItem = {
    id: 'KQ-1000005-0005',
    sourceType: 'regression_failure',
    sourceId: 'REG-001',
    caseId: 'CASE-007',
    topic: '回归测试失败: 婚姻分析',
    description: '婚姻分析模块回归测试不通过',
    priority: 'high',
    status: 'rejected',
    evidence: ['回归测试 REG-001 失败'],
    relatedRules: ['RULE-010'],
    relatedKnowledge: [],
    assignedTo: 'TEAM-001',
    createdAt: now - 86400000 * 8,
    updatedAt: now - 86400000 * 2,
    resolvedAt: now - 86400000 * 2,
    resolutionNote: '误报，测试用例配置错误',
  }

  queueStore.set(item1.id, item1)
  queueStore.set(item2.id, item2)
  queueStore.set(item3.id, item3)
  queueStore.set(item4.id, item4)
  queueStore.set(item5.id, item5)
}

// 初始化种子数据
initSeedData()
