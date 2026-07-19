/**
 * 风水勘测历史记录管理（localStorage）
 * V3.0：支持丰富字段存储与四项操作
 */

import type { PipelineOutput } from './pipeline'

export interface FengShuiHistoryRecord {
  id: string
  roomType: string
  roomName: string
  imageData: string        // base64 缩略图（限制尺寸）
  overallScore: number
  score8D?: {
    pattern: number
    windGathering: number
    qiGathering: number
    mingHall: number
    flowPath: number
    lighting: number
    elementHarmony: number
    advice: number
  }
  confidenceLevel: 'high' | 'fairlyHigh' | 'moderate' | 'low'
  confidenceScore: number
  mainIssues: string[]     // 前3条主要问题
  mainSuggestions: string[] // 前3条主要建议
  createdAt: string
  analysisDurationMs: number
}

const STORAGE_KEY = 'xuanfeng_fengshui_history_v3'
const MAX_RECORDS = 50
const MAX_IMAGE_SIZE = 200 * 1024 // 200KB 缩略图限制

function generateId(): string {
  return 'fs_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)
}

function truncateImage(base64: string): string {
  if (base64.length <= MAX_IMAGE_SIZE * 1.4) return base64
  // 简单截断提示：实际生产应使用 canvas 压缩
  return base64.slice(0, Math.floor(MAX_IMAGE_SIZE * 1.4))
}

export function saveFengShuiHistory(
  roomType: string,
  roomName: string,
  imageData: string,
  result: PipelineOutput
): FengShuiHistoryRecord {
  const prof = result.professionalReport
  const report = result.report

  const record: FengShuiHistoryRecord = {
    id: generateId(),
    roomType,
    roomName,
    imageData: truncateImage(imageData),
    overallScore: report?.overallScore ?? 0,
    score8D: result.score8D
      ? {
          pattern: result.score8D.dimensions.pattern.score,
          windGathering: result.score8D.dimensions.windGathering.score,
          qiGathering: result.score8D.dimensions.qiGathering.score,
          mingHall: result.score8D.dimensions.mingHall.score,
          flowPath: result.score8D.dimensions.flowPath.score,
          lighting: result.score8D.dimensions.lighting.score,
          elementHarmony: result.score8D.dimensions.elementHarmony.score,
          advice: result.score8D.dimensions.advice.score,
        }
      : undefined,
    confidenceLevel: prof?.confidence.level ?? 'moderate',
    confidenceScore: prof?.confidence.score ?? 0,
    mainIssues: prof?.issues?.slice(0, 3).map(i => i.title) ?? [],
    mainSuggestions: prof?.adjustments?.slice(0, 3).map(a => a.issue) ?? [],
    createdAt: new Date().toISOString(),
    analysisDurationMs: result.totalTime,
  }

  const existing = getFengShuiHistory()
  const updated = [record, ...existing].slice(0, MAX_RECORDS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

  return record
}

export function getFengShuiHistory(): FengShuiHistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as FengShuiHistoryRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getFengShuiHistoryById(id: string): FengShuiHistoryRecord | undefined {
  return getFengShuiHistory().find(r => r.id === id)
}

export function deleteFengShuiHistory(id: string): boolean {
  const existing = getFengShuiHistory()
  const filtered = existing.filter(r => r.id !== id)
  if (filtered.length === existing.length) return false
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

export function clearFengShuiHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function exportFengShuiHistoryForShare(record: FengShuiHistoryRecord): string {
  const lines = [
    `【玄风门 · 风水勘测报告】`,
    ``,
    `空间类型：${record.roomName}`,
    `综合评分：${record.overallScore} 分`,
    `分析可信度：${record.confidenceScore} 分`,
    ``,
    `主要问题：`,
    ...record.mainIssues.map((issue, i) => `${i + 1}. ${issue}`),
    ``,
    `主要建议：`,
    ...record.mainSuggestions.map((s, i) => `${i + 1}. ${s}`),
    ``,
    `生成时间：${new Date(record.createdAt).toLocaleString('zh-CN')}`,
    ``,
    `—— 来自玄风门 xuanfengmen.com`,
  ]
  return lines.join('\n')
}

// ═══════════════════════════════════════════════
// V3.0 预留：整改前后对比分析接口
// ═══════════════════════════════════════════════

/** 对比分析报告（暂不实现，仅预留接口） */
export interface FengShuiComparison {
  /** 整改前记录 ID */
  beforeRecordId: string
  /** 整改后记录 ID */
  afterRecordId: string
  /** 空间类型 */
  roomType: string
  /** 空间名称 */
  roomName: string
  /** 评分变化（后 - 前） */
  scoreChange: number
  /** 各维度评分变化 */
  dimensionChanges?: Record<string, number>
  /** 问题变化 */
  issueChanges: {
    resolved: string[]   // 已解决的问题
    new: string[]        // 新发现的问题
    remaining: string[]  // 仍未解决的问题
  }
  /** 建议效果评估 */
  suggestionEffects: {
    implemented: string[]     // 已执行的建议
    notImplemented: string[]  // 未执行的建议
    effectEstimate: string    // 效果评估文本
  }
  /** 生成时间 */
  generatedAt: string
}

/**
 * 生成整改前后对比报告
 * @param beforeId 整改前记录 ID
 * @param afterId 整改后记录 ID
 * @returns 对比报告，若记录不存在则返回 null
 *
 * TODO: V3.0 Phase 2 实现完整对比逻辑
 * 当前仅返回结构占位，用于前端接口联调。
 */
export function generateComparison(beforeId: string, afterId: string): FengShuiComparison | null {
  const before = getFengShuiHistoryById(beforeId)
  const after = getFengShuiHistoryById(afterId)
  if (!before || !after) return null
  if (before.roomType !== after.roomType) return null

  // 占位实现：仅计算评分差值
  return {
    beforeRecordId: beforeId,
    afterRecordId: afterId,
    roomType: before.roomType,
    roomName: before.roomName,
    scoreChange: after.overallScore - before.overallScore,
    issueChanges: {
      resolved: [],
      new: [],
      remaining: [],
    },
    suggestionEffects: {
      implemented: [],
      notImplemented: [],
      effectEstimate: '对比分析功能将在后续版本完善。',
    },
    generatedAt: new Date().toISOString(),
  }
}
