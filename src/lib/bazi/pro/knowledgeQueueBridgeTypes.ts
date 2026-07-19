/**
 * Knowledge Queue Bridge Types
 *
 * 职责：定义 P0 真人验证反馈系统的知识队列桥接类型
 */

// ═══════════════════════════════════════════
// 1. 枚举类型
// ═══════════════════════════════════════════

export type QueueSourceType = 'user_feedback' | 'expert_review' | 'ai_diff' | 'regression_failure' | 'manual'
export type QueuePriority = 'critical' | 'high' | 'normal' | 'low'
export type QueueItemStatus = 'pending' | 'in_progress' | 'reviewed' | 'applied' | 'rejected'

// ═══════════════════════════════════════════
// 2. 数据实体
// ═══════════════════════════════════════════

export interface KnowledgeQueueItem {
  id: string
  sourceType: QueueSourceType
  sourceId: string
  caseId: string | null
  topic: string
  description: string
  priority: QueuePriority
  status: QueueItemStatus
  evidence: string[]
  relatedRules: string[]
  relatedKnowledge: string[]
  assignedTo: string | null
  createdAt: number
  updatedAt: number
  resolvedAt: number | null
  resolutionNote: string | null
}

export interface KnowledgeQueueStats {
  totalItems: number
  pendingItems: number
  resolvedItems: number
  resolutionRate: number
  bySource: Record<QueueSourceType, number>
  byPriority: Record<QueuePriority, number>
  byStatus: Record<QueueItemStatus, number>
  avgResolutionTimeHours: number
}

// ═══════════════════════════════════════════
// 3. 版本号
// ═══════════════════════════════════════════

export const KNOWLEDGE_QUEUE_BRIDGE_VERSION = '1.0.0'
