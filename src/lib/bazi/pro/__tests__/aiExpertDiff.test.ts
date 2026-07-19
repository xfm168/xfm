/**
 * AI Expert Diff Engine 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - recordDiff 记录差异
 *   - getDiffById / getDiffsByCaseId / getDiffsByCategory / getDiffsBySeverity
 *   - getUnresolvedDiffs
 *   - resolveDiff / batchResolveDiffs
 *   - getDiffStats 统计汇总
 *   - getTopDiffFields 字段排名
 *   - getAllDiffs / resetDiffStore
 *   - 种子数据验证
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import type {
  AiExpertDiffEntry,
  DiffCategory,
  DiffResolution,
} from '../aiExpertDiffTypes'

import type { CaseSeverity } from '../expertReviewFormTypes'

import {
  AI_EXPERT_DIFF_VERSION,
} from '../aiExpertDiffTypes'

import {
  AI_EXPERT_DIFF_ENGINE_VERSION,
  recordDiff,
  getDiffById,
  getDiffsByCaseId,
  getDiffsByCategory,
  getDiffsBySeverity,
  getUnresolvedDiffs,
  resolveDiff,
  getDiffStats,
  getTopDiffFields,
  batchResolveDiffs,
  getAllDiffs,
  resetDiffStore,
} from '../aiExpertDiffEngine'

describe('aiExpertDiffEngine', () => {
  beforeEach(() => {
    resetDiffStore()
  })

  // ─── 版本号 ───
  test('types 版本号应为 1.0.0', () => {
    expect(AI_EXPERT_DIFF_VERSION).toBe('1.0.0')
  })

  test('engine 版本号应与 types 一致', () => {
    expect(AI_EXPERT_DIFF_ENGINE_VERSION).toBe('1.0.0')
  })

  // ─── 种子数据 ───
  test('种子数据应包含 5 条差异', () => {
    const all = getAllDiffs()
    expect(all.length).toBe(5)
  })

  test('种子数据应包含特定 ID', () => {
    expect(getDiffById('DIFF-1000001-0001')).toBeDefined()
    expect(getDiffById('DIFF-1000005-0005')).toBeDefined()
  })

  // ─── recordDiff ───
  test('记录差异应返回包含自动生成 ID 的条目', () => {
    const entry = recordDiff({
      reviewId: 'ER-TEST',
      caseId: 'CASE-TEST',
      reportId: 'RPT-TEST',
      field: '测试字段',
      category: 'conclusion',
      aiValue: 'AI 值',
      expertValue: '专家值',
      diffDescription: '测试差异',
      severity: 'minor',
      resolution: 'pending',
    })
    expect(entry.id).toMatch(/^DIFF-\d+-\d{4}$/)
    expect(entry.createdAt).toBeGreaterThan(0)
    expect(entry.resolvedAt).toBeNull()
    expect(entry.resolvedBy).toBeNull()
    expect(entry.resolutionNote).toBeNull()
  })

  test('记录后应可通过 ID 查询', () => {
    const entry = recordDiff({
      reviewId: 'ER-NEW',
      caseId: 'CASE-NEW',
      reportId: 'RPT-NEW',
      field: '喜用神',
      category: 'conclusion',
      aiValue: '金',
      expertValue: '木',
      diffDescription: '喜用神分歧',
      severity: 'critical',
      resolution: 'pending',
    })
    const found = getDiffById(entry.id)
    expect(found).toBeDefined()
    expect(found!.field).toBe('喜用神')
  })

  // ─── getDiffById ───
  test('查询存在的 ID 应返回条目', () => {
    const entry = getDiffById('DIFF-1000002-0002')
    expect(entry).toBeDefined()
    expect(entry!.field).toBe('婚姻运势')
  })

  test('查询不存在的 ID 应返回 undefined', () => {
    expect(getDiffById('NON-EXISTENT')).toBeUndefined()
  })

  // ─── getDiffsByCaseId ───
  test('按案例 ID 筛选应返回正确结果', () => {
    const diffs = getDiffsByCaseId('CASE-003')
    expect(diffs.length).toBe(2) // DIFF-3 和 DIFF-4 都关联 CASE-003
  })

  test('不存在的案例 ID 应返回空', () => {
    expect(getDiffsByCaseId('CASE-NONE').length).toBe(0)
  })

  // ─── getDiffsByCategory ───
  test('按类别 conclusion 筛选应返回正确数量', () => {
    const diffs = getDiffsByCategory('conclusion')
    expect(diffs.length).toBe(4) // DIFF-1,2,3,5 都是 conclusion
  })

  test('按类别 reference 筛选应返回 1 条', () => {
    const diffs = getDiffsByCategory('reference')
    expect(diffs.length).toBe(1) // 只有 DIFF-4
  })

  // ─── getDiffsBySeverity ───
  test('按 critical 严重程度筛选应返回 2 条', () => {
    const diffs = getDiffsBySeverity('critical')
    expect(diffs.length).toBe(2) // DIFF-3 和 DIFF-5
  })

  test('按 major 严重程度筛选应返回 2 条', () => {
    const diffs = getDiffsBySeverity('major')
    expect(diffs.length).toBe(2) // DIFF-2 和 DIFF-4
  })

  // ─── getUnresolvedDiffs ───
  test('未解决差异应排除已解决的', () => {
    const unresolved = getUnresolvedDiffs()
    // DIFF-1 已解决，其余 4 条 pending
    expect(unresolved.length).toBe(4)
    expect(unresolved.every((d) => d.resolution === 'pending')).toBe(true)
  })

  // ─── resolveDiff ───
  test('解决差异应更新 resolution 和 resolvedAt', () => {
    const result = resolveDiff('DIFF-1000002-0002', 'REV-001', 'resolved', '确认修复')
    expect(result).not.toBeNull()
    expect(result!.resolution).toBe('resolved')
    expect(result!.resolvedAt).toBeGreaterThan(0)
    expect(result!.resolvedBy).toBe('REV-001')
    expect(result!.resolutionNote).toBe('确认修复')
  })

  test('解决不存在的 ID 应返回 null', () => {
    expect(resolveDiff('NON-EXISTENT', 'REV-001', 'resolved')).toBeNull()
  })

  // ─── batchResolveDiffs ───
  test('批量解决应返回实际解决数量', () => {
    const ids = ['DIFF-1000002-0002', 'DIFF-1000003-0003', 'NON-EXISTENT']
    const count = batchResolveDiffs(ids, 'REV-001', 'resolved', '批量修复')
    expect(count).toBe(2) // NON-EXISTENT 不存在
  })

  // ─── getDiffStats ───
  test('统计汇总应返回正确的总数', () => {
    const stats = getDiffStats()
    expect(stats.totalDiffs).toBe(5)
  })

  test('统计汇总未解决数应为 4', () => {
    const stats = getDiffStats()
    expect(stats.unresolvedDiffs).toBe(4)
  })

  test('统计汇总应包含类别分布', () => {
    const stats = getDiffStats()
    expect(stats.categoryDistribution.conclusion).toBe(4)
    expect(stats.categoryDistribution.reference).toBe(1)
  })

  test('统计汇总应包含严重程度分布', () => {
    const stats = getDiffStats()
    expect(stats.severityDistribution.critical).toBe(2)
    expect(stats.severityDistribution.major).toBe(2)
    expect(stats.severityDistribution.info).toBe(1)
  })

  // ─── getTopDiffFields ───
  test('字段排名应返回结果', () => {
    const topFields = getTopDiffFields(5)
    expect(topFields.length).toBeGreaterThan(0)
    // 喜用神出现 2 次（DIFF-1 和 DIFF-3），应为第一名
    expect(topFields[0].field).toBe('喜用神')
    expect(topFields[0].count).toBe(2)
  })

  test('字段排名 limit 应正确限制', () => {
    const topFields = getTopDiffFields(1)
    expect(topFields.length).toBe(1)
  })

  // ─── getAllDiffs ───
  test('获取所有差异应返回完整列表', () => {
    const all = getAllDiffs()
    expect(all.length).toBe(5)
    expect(all.every((d) => d.id)).toBe(true)
  })

  // ─── resetDiffStore ───
  test('重置后种子数据应恢复', () => {
    recordDiff({
      reviewId: 'ER-TEMP',
      caseId: 'CASE-TEMP',
      reportId: 'RPT-TEMP',
      field: '临时',
      category: 'detail',
      aiValue: 'AI',
      expertValue: '专家',
      diffDescription: '临时',
      severity: 'minor',
      resolution: 'pending',
    })
    expect(getAllDiffs().length).toBe(6)
    resetDiffStore()
    expect(getAllDiffs().length).toBe(5)
  })

  // ─── 边界情况 ───
  test('已解决差异的解决时间应大于创建时间', () => {
    const diff = getDiffById('DIFF-1000001-0001')
    expect(diff!.resolvedAt).toBeGreaterThan(diff!.createdAt)
  })
})
