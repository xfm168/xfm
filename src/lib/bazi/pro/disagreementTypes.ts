/**
 * 命理分歧类型定义
 *
 * 职责：定义分歧报告、分歧来源、严重程度及相关过滤类型
 */

import type { ConflictType } from './caseLibraryTypesV2'

// ═══════════════════════════════════════════
// 1. 基础枚举
// ═══════════════════════════════════════════

/** 分歧来源 */
export type DisagreementSource = 'classical_text' | 'school' | 'expert' | 'modern'

/** 分歧严重程度 */
export type DisagreementSeverity = 'critical' | 'major' | 'minor' | 'info'

// ═══════════════════════════════════════════
// 2. 子结构定义
// ═══════════════════════════════════════════

/** 分歧观点 */
export interface DisagreementViewpoint {
  side: 'A' | 'B' | 'neutral'
  source: string
  argument: string
}

// ═══════════════════════════════════════════
// 3. 核心类型定义
// ═══════════════════════════════════════════

/** 分歧报告 */
export interface DisagreementReport {
  reportId: string
  topic: string
  type: ConflictType
  severity: DisagreementSeverity
  viewpoints: DisagreementViewpoint[]
  resolution?: string
  relatedCaseIds: string[]
  generatedAt: number
}

/** 分歧过滤器 */
export interface DisagreementFilter {
  types: ConflictType[]
  severities: DisagreementSeverity[]
  topics: string[]
  hasResolution: boolean | null
}

// ═══════════════════════════════════════════
// 4. 工具函数
// ═══════════════════════════════════════════

/** 生成分歧报告 ID */
export function generateDisagreementReportId(): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `DGR-${rand}`
}

/** 获取严重程度显示名 */
export function getSeverityDisplayName(severity: DisagreementSeverity): string {
  const map: Record<DisagreementSeverity, string> = {
    critical: '严重',
    major: '重要',
    minor: '轻微',
    info: '信息',
  }
  return map[severity]
}

/** 获取来源显示名 */
export function getSourceDisplayName(source: DisagreementSource): string {
  const map: Record<DisagreementSource, string> = {
    classical_text: '古典文献',
    school: '命理流派',
    expert: '专家观点',
    modern: '现代研究',
  }
  return map[source]
}
