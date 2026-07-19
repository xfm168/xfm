/**
 * V4.5 Phase 2: Knowledge Base + Expert Validation Center — 类型定义
 *
 * 统一知识中心：古籍原文 → 现代解释 → 关联规则 → 专家验证
 * 约束：不参与任何命理计算，仅存储知识和验证数据
 */

import type { DerivationChain } from './types'

// ═══════════════════════════════════════════
// 1. Knowledge Base 类型
// ═══════════════════════════════════════════

/** 知识条目来源 */
export type KnowledgeSource =
  | '三命通会'
  | '滴天髓'
  | '子平真诠'
  | '穷通宝鉴'
  | '渊海子平'
  | '神峰通考'
  | '星平会海'
  | '协纪辨方书'
  | '命理正宗'
  | '兰台妙选'
  | 'Other'

/** 引用等级 */
export type CitationLevel = 'primary' | 'secondary' | 'tertiary'

/** 知识条目分类 */
export type KnowledgeCategory =
  | '四柱' | '神煞' | '十神' | '格局' | '喜用神'
  | '大运' | '流年' | '命局总论' | '五行' | '调候'
  | '合化' | '冲刑' | '事业' | '财运' | '婚姻'
  | '健康' | '学业' | '风水' | '其他'

/** 关联类型 */
export type AssociationType =
  | '十神' | '格局' | '喜用神' | '神煞' | '五行' | '大运' | '流年' | '章节'

/** 关联项 */
export interface KnowledgeAssociation {
  type: AssociationType
  value: string
}

/** 知识条目 */
export interface KnowledgeEntry {
  id: string
  source: KnowledgeSource
  chapter?: string        // 原文章节
  pageNumber?: number      // 页码（可选）
  originalText: string     // 经典原文
  modernExplanation: string // 现代解释
  keywords: string[]
  category: KnowledgeCategory
  associations: KnowledgeAssociation[]
  citationLevel: CitationLevel
  confidence: number        // 0~1
}

// ═══════════════════════════════════════════
// 2. Expert Validation 类型
// ═══════════════════════════════════════════

/** 验证状态 */
export type ReviewStatus = 'pending' | 'verified' | 'disputed' | 'deprecated'

/** 验证结论 */
export type VerdictType = 'agree' | 'partially_agree' | 'disagree' | 'unclear'

/** 专家验证记录 */
export interface ExpertValidationRecord {
  validationId: string
  caseId: string             // 关联 Case Library 命例 ID
  expertId: string           // 专家匿名编号（如 EXP-001）
  validatedAt: number
  engineVersion: string
  systemConclusion: string   // 系统结论摘要
  expertConclusion: string   // 专家结论
  verdict: VerdictType
  classicalBasis: string    // 古籍依据
  systemBasis: string       // 系统依据
  consistencyRate: number   // 0~1 一致率
  score: number              // 0~100 评分
  suggestion?: string        // 修改建议
  notes?: string             // 备注
  status: ReviewStatus
  affectedRules: string[]    // 涉及的规则 ID
  affectedModules: string[]   // 涉及的模块名
}

// ═══════════════════════════════════════════
// 3. Difference Analyzer 类型
// ═══════════════════════════════════════════

/** 差异项 */
export interface DifferenceItem {
  field: string
  systemValue: string | number
  expertValue: string | number
  severity: 'critical' | 'major' | 'minor' | 'info'
  possibleCause: string
  affectedRules: string[]
  affectedModules: string[]
}

/** 差异报告 */
export interface DifferenceReport {
  validationId: string
  generatedAt: number
  totalDifferences: number
  items: DifferenceItem[]
  summary: string
  recommendations: string[]
}

// ═══════════════════════════════════════════
// 4. Learning Queue 类型
// ═══════════════════════════════════════════

/** 学习队列项 */
export interface LearningQueueItem {
  queueId: string
  validationId: string
  caseId: string
  reason: string
  priority: number          // 优先级（越大越优先）
  addedAt: number
  resolved: boolean
  resolvedAt?: number
}

// ═══════════════════════════════════════════
// 5. Regression Lock 类型
// ═══════════════════════════════════════════

/** 回归锁 */
export interface RegressionLock {
  lockId: string
  caseId: string
  validationId: string
  lockedAt: number
  lockedByVersion: string
  lockedResult: Record<string, string | number>
  status: 'active' | 'broken' | 'released'
  lastCheckAt?: number
}

// ═══════════════════════════════════════════
// 6. Expert Validation Center 统一输出
// ═══════════════════════════════════════════

/** 验证中心汇总报告 */
export interface ExpertValidationCenterReport {
  version: string
  generatedAt: number
  totalValidations: number
  statusBreakdown: {
    pending: number
    verified: number
    disputed: number
    deprecated: number
  }
  averageConsistencyRate: number
  averageScore: number
  validations: ExpertValidationRecord[]
  differenceReports: DifferenceReport[]
  learningQueue: LearningQueueItem[]
  regressionLocks: RegressionLock[]
  warnings: string[]
  computeTimeMs: number
  derivationChain?: DerivationChain
}

/** 验证选项 */
export interface ExpertValidationOptions {
  caseIds?: string[]
  statusFilter?: ReviewStatus[]
  includeDisputed?: boolean
  includeLearningQueue?: boolean
}

// ═══════════════════════════════════════════
// 7. 工具函数
// ═══════════════════════════════════════════

/** 生成验证 ID */
export function generateValidationId(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `VAL-${ts}-${rand}`
}

/** 生成专家 ID */
export function generateExpertId(): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `EXP-${rand}`
}

/** 获取验证状态显示名 */
export function getReviewStatusDisplay(status: ReviewStatus): string {
  const map: Record<ReviewStatus, string> = {
    pending: '待审核',
    verified: '已验证',
    disputed: '有争议',
    deprecated: '已废弃',
  }
  return map[status]
}
