/**
 * AI Expert Diff Engine
 *
 * 职责：
 *   - AI 与专家差异记录的 CRUD 操作
 *   - 差异解决管理
 *   - 差异统计汇总
 *   - 差异字段排名
 * 约束：
 *   - 不修改已有文件
 *   - 纯数据管理层
 */

import type {
  AiExpertDiffEntry,
  AiExpertDiffStats,
  DiffCategory,
  DiffResolution,
} from './aiExpertDiffTypes'

import type { CaseSeverity } from './expertReviewFormTypes'

import { AI_EXPERT_DIFF_VERSION } from './aiExpertDiffTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const AI_EXPERT_DIFF_ENGINE_VERSION = AI_EXPERT_DIFF_VERSION

// ═══════════════════════════════════════════
// 2. 内部存储
// ═══════════════════════════════════════════

const diffStore = new Map<string, AiExpertDiffEntry>()

// ═══════════════════════════════════════════
// 3. 常量
// ═══════════════════════════════════════════

const ALL_CATEGORIES: DiffCategory[] = ['conclusion', 'detail', 'reference', 'recommendation', 'confidence']
const ALL_SEVERITIES: CaseSeverity[] = ['critical', 'major', 'minor', 'info']

// ═══════════════════════════════════════════
// 4. 核心函数
// ═══════════════════════════════════════════

/** 记录差异 */
export function recordDiff(
  data: Omit<AiExpertDiffEntry, 'id' | 'createdAt' | 'resolvedAt' | 'resolvedBy' | 'resolutionNote'>,
): AiExpertDiffEntry {
  const entry: AiExpertDiffEntry = {
    ...data,
    id: `DIFF-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    createdAt: Date.now(),
    resolvedAt: null,
    resolvedBy: null,
    resolutionNote: null,
  }
  diffStore.set(entry.id, entry)
  return entry
}

/** 按 ID 获取差异 */
export function getDiffById(id: string): AiExpertDiffEntry | undefined {
  return diffStore.get(id)
}

/** 按案例ID获取差异 */
export function getDiffsByCaseId(caseId: string): AiExpertDiffEntry[] {
  return Array.from(diffStore.values()).filter((d) => d.caseId === caseId)
}

/** 按类别获取差异 */
export function getDiffsByCategory(category: DiffCategory): AiExpertDiffEntry[] {
  return Array.from(diffStore.values()).filter((d) => d.category === category)
}

/** 按严重程度获取差异 */
export function getDiffsBySeverity(severity: CaseSeverity): AiExpertDiffEntry[] {
  return Array.from(diffStore.values()).filter((d) => d.severity === severity)
}

/** 获取未解决差异 */
export function getUnresolvedDiffs(): AiExpertDiffEntry[] {
  return Array.from(diffStore.values()).filter((d) => d.resolution === 'pending')
}

/** 解决差异 */
export function resolveDiff(
  diffId: string,
  resolvedBy: string,
  resolution: DiffResolution,
  note?: string,
): AiExpertDiffEntry | null {
  const entry = diffStore.get(diffId)
  if (!entry) return null
  entry.resolution = resolution
  entry.resolvedAt = Date.now()
  entry.resolvedBy = resolvedBy
  entry.resolutionNote = note ?? null
  diffStore.set(diffId, entry)
  return entry
}

/** 获取差异统计汇总 */
export function getDiffStats(): AiExpertDiffStats {
  const all = getAllDiffs()
  const total = all.length

  if (total === 0) {
    const emptyCatDist = {} as Record<DiffCategory, number>
    const emptySevDist = {} as Record<CaseSeverity, number>
    for (const c of ALL_CATEGORIES) emptyCatDist[c] = 0
    for (const s of ALL_SEVERITIES) emptySevDist[s] = 0
    return {
      totalDiffs: 0,
      unresolvedDiffs: 0,
      resolutionRate: 0,
      categoryDistribution: emptyCatDist,
      severityDistribution: emptySevDist,
      topDiffFields: [],
      avgResolutionTimeHours: 0,
    }
  }

  const unresolved = all.filter((d) => d.resolution === 'pending').length
  const resolved = all.filter((d) => d.resolution === 'resolved').length

  const catDist = {} as Record<DiffCategory, number>
  for (const c of ALL_CATEGORIES) catDist[c] = 0
  for (const d of all) catDist[d.category]++

  const sevDist = {} as Record<CaseSeverity, number>
  for (const s of ALL_SEVERITIES) sevDist[s] = 0
  for (const d of all) sevDist[d.severity]++

  const topFields = getTopDiffFields(10)

  // 平均解决时间（仅计算已解决的）
  const resolvedDiffs = all.filter((d) => d.resolvedAt !== null && d.createdAt > 0)
  let avgResolutionHours = 0
  if (resolvedDiffs.length > 0) {
    const totalHours = resolvedDiffs.reduce((acc, d) => {
      return acc + (d.resolvedAt! - d.createdAt) / (1000 * 60 * 60)
    }, 0)
    avgResolutionHours = Math.round((totalHours / resolvedDiffs.length) * 100) / 100
  }

  return {
    totalDiffs: total,
    unresolvedDiffs: unresolved,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) / 100 : 0,
    categoryDistribution: catDist,
    severityDistribution: sevDist,
    topDiffFields: topFields,
    avgResolutionTimeHours: avgResolutionHours,
  }
}

/** 差异最多的字段排名 */
export function getTopDiffFields(limit: number): Array<{ field: string; count: number }> {
  const fieldMap = new Map<string, number>()
  for (const d of getAllDiffs()) {
    fieldMap.set(d.field, (fieldMap.get(d.field) ?? 0) + 1)
  }
  return Array.from(fieldMap.entries())
    .map(([field, count]) => ({ field, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/** 批量解决差异 */
export function batchResolveDiffs(
  diffIds: string[],
  resolvedBy: string,
  resolution: DiffResolution,
): number {
  let count = 0
  for (const id of diffIds) {
    const result = resolveDiff(id, resolvedBy, resolution)
    if (result !== null) count++
  }
  return count
}

/** 获取所有差异 */
export function getAllDiffs(): AiExpertDiffEntry[] {
  return Array.from(diffStore.values())
}

/** 重置存储 */
export function resetDiffStore(): void {
  diffStore.clear()
  initSeedData()
}

// ═══════════════════════════════════════════
// 5. 种子数据
// ═══════════════════════════════════════════

function initSeedData(): void {
  const now = Date.now()

  const diff1: AiExpertDiffEntry = {
    id: 'DIFF-1000001-0001',
    reviewId: 'ER-1000001-0001',
    caseId: 'CASE-001',
    reportId: 'RPT-001',
    field: '喜用神',
    category: 'conclusion',
    aiValue: '水',
    expertValue: '水',
    diffDescription: '无差异',
    severity: 'info',
    resolution: 'resolved',
    resolvedAt: now - 86400000 * 4,
    resolvedBy: 'REV-001',
    resolutionNote: '已确认一致',
    createdAt: now - 86400000 * 5,
  }

  const diff2: AiExpertDiffEntry = {
    id: 'DIFF-1000002-0002',
    reviewId: 'ER-1000002-0002',
    caseId: 'CASE-002',
    reportId: 'RPT-002',
    field: '婚姻运势',
    category: 'conclusion',
    aiValue: '婚姻宫逢冲，婚姻不顺',
    expertValue: '婚姻宫逢冲，但需综合大运',
    diffDescription: 'AI 未考虑大运影响',
    severity: 'major',
    resolution: 'pending',
    resolvedAt: null,
    resolvedBy: null,
    resolutionNote: null,
    createdAt: now - 86400000 * 4,
  }

  const diff3: AiExpertDiffEntry = {
    id: 'DIFF-1000003-0003',
    reviewId: 'ER-1000003-0003',
    caseId: 'CASE-003',
    reportId: 'RPT-003',
    field: '喜用神',
    category: 'conclusion',
    aiValue: '水',
    expertValue: '木',
    diffDescription: '五行平衡分析错误',
    severity: 'critical',
    resolution: 'pending',
    resolvedAt: null,
    resolvedBy: null,
    resolutionNote: null,
    createdAt: now - 86400000 * 3,
  }

  const diff4: AiExpertDiffEntry = {
    id: 'DIFF-1000004-0004',
    reviewId: 'ER-1000003-0003',
    caseId: 'CASE-003',
    reportId: 'RPT-003',
    field: '古籍引用',
    category: 'reference',
    aiValue: '未引用穷通宝鉴',
    expertValue: '应引用穷通宝鉴相关论述',
    diffDescription: '缺少关键古籍支撑',
    severity: 'major',
    resolution: 'pending',
    resolvedAt: null,
    resolvedBy: null,
    resolutionNote: null,
    createdAt: now - 86400000 * 3,
  }

  const diff5: AiExpertDiffEntry = {
    id: 'DIFF-1000005-0005',
    reviewId: 'ER-1000005-0005',
    caseId: 'CASE-005',
    reportId: 'RPT-005',
    field: '五行分析',
    category: 'conclusion',
    aiValue: '五行缺土，需补土',
    expertValue: '五行不缺，土气虽弱但不应补',
    diffDescription: '五行判断过于简化',
    severity: 'critical',
    resolution: 'pending',
    resolvedAt: null,
    resolvedBy: null,
    resolutionNote: null,
    createdAt: now - 86400000 * 1,
  }

  diffStore.set(diff1.id, diff1)
  diffStore.set(diff2.id, diff2)
  diffStore.set(diff3.id, diff3)
  diffStore.set(diff4.id, diff4)
  diffStore.set(diff5.id, diff5)
}

// 初始化种子数据
initSeedData()
