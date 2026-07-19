/**
 * Release Checklist Engine — 测试
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import type {
  ChecklistItem,
  ChecklistItemStatus,
  ChecklistCategory,
  GateDecision,
  ReleaseChecklist,
  ChecklistSummary,
  ReleaseGateOptions,
} from '../releaseChecklistTypes'

import {
  RELEASE_CHECKLIST_ENGINE_VERSION,
  runReleaseChecklist,
  evaluateReleaseGate,
  getChecklistItemStatus,
  getFailedItems,
  generateChecklistReport,
  registerChecklistAutomation,
  getChecklistSummary,
  simulateFailure,
  resetSimulation,
  getCurrentChecklist,
} from '../releaseChecklistEngine'

import {
  RELEASE_CHECKLIST_VERSION,
  DEFAULT_CHECKLIST_ITEMS,
  CHECKLIST_CATEGORIES,
} from '../releaseChecklistTypes'

// ═══════════════════════════════════════════
// 辅助
// ═══════════════════════════════════════════

const defaultOptions: ReleaseGateOptions = {
  strictMode: false,
  skipCategories: [],
  version: '5.0.0',
}

function buildChecklist(overrides: Partial<ReleaseChecklist> = {}): ReleaseChecklist {
  const allPassed: ChecklistItem[] = DEFAULT_CHECKLIST_ITEMS.map((def) => ({
    ...def,
    status: 'passed' as ChecklistItemStatus,
    durationMs: 0,
  }))
  const summary: ChecklistSummary = { total: 12, passed: 12, failed: 0, skipped: 0, pending: 0 }
  return {
    version: '5.0.0',
    generatedAt: Date.now(),
    items: allPassed,
    overallPassed: true,
    passRate: 100,
    failedItems: [],
    gateDecision: 'release',
    summary,
    ...overrides,
  }
}

// ═══════════════════════════════════════════
// 1. 常量验证
// ═══════════════════════════════════════════

describe('常量验证', () => {
  test('RELEASE_CHECKLIST_VERSION 应为 1.0.0', () => {
    expect(RELEASE_CHECKLIST_VERSION).toBe('1.0.0')
  })

  test('RELEASE_CHECKLIST_ENGINE_VERSION 应为 1.0.0', () => {
    expect(RELEASE_CHECKLIST_ENGINE_VERSION).toBe('1.0.0')
  })

  test('DEFAULT_CHECKLIST_ITEMS 应有 12 项', () => {
    expect(DEFAULT_CHECKLIST_ITEMS).toHaveLength(12)
  })

  test('DEFAULT_CHECKLIST_ITEMS 每项有正确字段', () => {
    for (const item of DEFAULT_CHECKLIST_ITEMS) {
      expect(item.id).toBeTruthy()
      expect(item.name).toBeTruthy()
      expect(item.category).toBeTruthy()
      expect(item.description).toBeTruthy()
      expect(typeof item.required).toBe('boolean')
      expect(typeof item.automated).toBe('boolean')
    }
  })

  test('DEFAULT_CHECKLIST_ITEMS ID 递增 chk-001 ~ chk-012', () => {
    const ids = DEFAULT_CHECKLIST_ITEMS.map((i) => i.id)
    expect(ids).toEqual([
      'chk-001', 'chk-002', 'chk-003', 'chk-004', 'chk-005', 'chk-006',
      'chk-007', 'chk-008', 'chk-009', 'chk-010', 'chk-011', 'chk-012',
    ])
  })

  test('DEFAULT_CHECKLIST_ITEMS 仅 chk-009 为非 required', () => {
    const nonRequired = DEFAULT_CHECKLIST_ITEMS.filter((i) => !i.required)
    expect(nonRequired).toHaveLength(1)
    expect(nonRequired[0].id).toBe('chk-009')
  })

  test('DEFAULT_CHECKLIST_ITEMS 全部 automated = true', () => {
    for (const item of DEFAULT_CHECKLIST_ITEMS) {
      expect(item.automated).toBe(true)
    }
  })

  test('CHECKLIST_CATEGORIES 应有 6 个分类', () => {
    expect(CHECKLIST_CATEGORIES).toHaveLength(6)
  })

  test('CHECKLIST_CATEGORIES 包含所有预期分类', () => {
    expect(CHECKLIST_CATEGORIES).toContain('algorithm')
    expect(CHECKLIST_CATEGORIES).toContain('quality')
    expect(CHECKLIST_CATEGORIES).toContain('performance')
    expect(CHECKLIST_CATEGORIES).toContain('documentation')
    expect(CHECKLIST_CATEGORIES).toContain('security')
    expect(CHECKLIST_CATEGORIES).toContain('compliance')
  })
})

// ═══════════════════════════════════════════
// 2. runReleaseChecklist — 默认全部通过
// ═══════════════════════════════════════════

describe('runReleaseChecklist 默认全部通过', () => {
  beforeEach(() => {
    resetSimulation()
  })

  test('返回结构完整的 ReleaseChecklist', () => {
    const result = runReleaseChecklist(defaultOptions)
    expect(result.version).toBe('5.0.0')
    expect(result.generatedAt).toBeGreaterThan(0)
    expect(result.items).toHaveLength(12)
    expect(result.overallPassed).toBe(true)
    expect(result.passRate).toBe(100)
    expect(result.failedItems).toHaveLength(0)
    expect(result.gateDecision).toBe('release')
  })

  test('所有 12 项状态为 passed', () => {
    const result = runReleaseChecklist(defaultOptions)
    for (const item of result.items) {
      expect(item.status).toBe('passed')
    }
  })

  test('每项有正确的 id 和 name', () => {
    const result = runReleaseChecklist(defaultOptions)
    const ids = result.items.map((i) => i.id)
    expect(ids).toEqual([
      'chk-001', 'chk-002', 'chk-003', 'chk-004', 'chk-005', 'chk-006',
      'chk-007', 'chk-008', 'chk-009', 'chk-010', 'chk-011', 'chk-012',
    ])
  })

  test('summary 正确', () => {
    const result = runReleaseChecklist(defaultOptions)
    expect(result.summary.total).toBe(12)
    expect(result.summary.passed).toBe(12)
    expect(result.summary.failed).toBe(0)
    expect(result.summary.skipped).toBe(0)
    expect(result.summary.pending).toBe(0)
  })

  test('每项 result 非空', () => {
    const result = runReleaseChecklist(defaultOptions)
    for (const item of result.items) {
      expect(item.result).toBeTruthy()
    }
  })

  test('每项 durationMs >= 0', () => {
    const result = runReleaseChecklist(defaultOptions)
    for (const item of result.items) {
      expect(item.durationMs).toBeGreaterThanOrEqual(0)
    }
  })

  test('更新 currentChecklist', () => {
    runReleaseChecklist(defaultOptions)
    const current = getCurrentChecklist()
    expect(current).not.toBeNull()
    expect(current!.items).toHaveLength(12)
  })
})

// ═══════════════════════════════════════════
// 3. runReleaseChecklist — strictMode
// ═══════════════════════════════════════════

describe('runReleaseChecklist strictMode', () => {
  beforeEach(() => {
    resetSimulation()
  })

  test('strictMode 下全部通过时决策仍为 release', () => {
    const result = runReleaseChecklist({ ...defaultOptions, strictMode: true })
    expect(result.gateDecision).toBe('release')
  })

  test('strictMode 下非 required 失败时决策为 hold', () => {
    simulateFailure('chk-009') // non-required
    const result = runReleaseChecklist({ ...defaultOptions, strictMode: true })
    expect(result.gateDecision).toBe('hold')
  })

  test('非 strictMode 下非 required 失败时决策为 conditional', () => {
    simulateFailure('chk-009')
    const result = runReleaseChecklist({ ...defaultOptions, strictMode: false })
    expect(result.gateDecision).toBe('conditional')
  })
})

// ═══════════════════════════════════════════
// 4. evaluateReleaseGate — 决策逻辑
// ═══════════════════════════════════════════

describe('evaluateReleaseGate', () => {
  test('全部 required passed -> release', () => {
    const checklist = buildChecklist()
    expect(evaluateReleaseGate(checklist, false)).toBe('release')
  })

  test('有 required 失败 -> hold', () => {
    const items: ChecklistItem[] = DEFAULT_CHECKLIST_ITEMS.map((def) => ({
      ...def,
      status: 'passed' as ChecklistItemStatus,
      durationMs: 0,
    }))
    // 让 chk-001 (required) 失败
    items[0].status = 'failed'
    const checklist = buildChecklist({ items, overallPassed: false, failedItems: [items[0]] })
    expect(evaluateReleaseGate(checklist, false)).toBe('hold')
  })

  test('仅非 required 失败 -> conditional', () => {
    const items: ChecklistItem[] = DEFAULT_CHECKLIST_ITEMS.map((def) => ({
      ...def,
      status: 'passed' as ChecklistItemStatus,
      durationMs: 0,
    }))
    // chk-009 是唯一非 required 的
    items[8].status = 'failed'
    const checklist = buildChecklist({ items, overallPassed: false, failedItems: [items[8]] })
    expect(evaluateReleaseGate(checklist, false)).toBe('conditional')
  })

  test('非 required 失败 + strictMode -> hold', () => {
    const items: ChecklistItem[] = DEFAULT_CHECKLIST_ITEMS.map((def) => ({
      ...def,
      status: 'passed' as ChecklistItemStatus,
      durationMs: 0,
    }))
    items[8].status = 'failed'
    const checklist = buildChecklist({ items, overallPassed: false, failedItems: [items[8]] })
    expect(evaluateReleaseGate(checklist, true)).toBe('hold')
  })

  test('required 失败 + strictMode -> hold', () => {
    const items: ChecklistItem[] = DEFAULT_CHECKLIST_ITEMS.map((def) => ({
      ...def,
      status: 'passed' as ChecklistItemStatus,
      durationMs: 0,
    }))
    items[0].status = 'failed'
    const checklist = buildChecklist({ items, overallPassed: false, failedItems: [items[0]] })
    expect(evaluateReleaseGate(checklist, true)).toBe('hold')
  })

  test('多项 required 失败 -> hold', () => {
    const items: ChecklistItem[] = DEFAULT_CHECKLIST_ITEMS.map((def) => ({
      ...def,
      status: 'passed' as ChecklistItemStatus,
      durationMs: 0,
    }))
    items[0].status = 'failed'
    items[1].status = 'failed'
    items[2].status = 'failed'
    const checklist = buildChecklist({
      items,
      overallPassed: false,
      failedItems: [items[0], items[1], items[2]],
    })
    expect(evaluateReleaseGate(checklist, false)).toBe('hold')
  })
})

// ═══════════════════════════════════════════
// 5. simulateFailure + reset
// ═══════════════════════════════════════════

describe('simulateFailure + reset', () => {
  beforeEach(() => {
    resetSimulation()
  })

  test('模拟 required 项失败后 gateDecision 为 hold', () => {
    simulateFailure('chk-001')
    const result = runReleaseChecklist(defaultOptions)
    expect(result.gateDecision).toBe('hold')
    expect(result.overallPassed).toBe(false)
  })

  test('模拟非 required 项失败后 gateDecision 为 conditional', () => {
    simulateFailure('chk-009')
    const result = runReleaseChecklist(defaultOptions)
    expect(result.gateDecision).toBe('conditional')
    expect(result.overallPassed).toBe(false)
  })

  test('模拟失败后 result 包含 SIMULATED FAILURE 标记', () => {
    simulateFailure('chk-005')
    const result = runReleaseChecklist(defaultOptions)
    const item = result.items.find((i) => i.id === 'chk-005')!
    expect(item.result).toContain('[SIMULATED FAILURE]')
    expect(item.status).toBe('failed')
  })

  test('resetSimulation 后全部恢复通过', () => {
    simulateFailure('chk-001')
    simulateFailure('chk-005')
    resetSimulation()
    const result = runReleaseChecklist(defaultOptions)
    expect(result.overallPassed).toBe(true)
    expect(result.gateDecision).toBe('release')
  })

  test('resetSimulation 后 getCurrentChecklist 为 null', () => {
    runReleaseChecklist(defaultOptions)
    expect(getCurrentChecklist()).not.toBeNull()
    resetSimulation()
    expect(getCurrentChecklist()).toBeNull()
  })

  test('模拟多项失败', () => {
    simulateFailure('chk-001')
    simulateFailure('chk-002')
    simulateFailure('chk-003')
    const result = runReleaseChecklist(defaultOptions)
    expect(result.failedItems).toHaveLength(3)
  })
})

// ═══════════════════════════════════════════
// 6. getFailedItems / getChecklistItemStatus / getChecklistSummary
// ═══════════════════════════════════════════

describe('getFailedItems / getChecklistItemStatus / getChecklistSummary', () => {
  beforeEach(() => {
    resetSimulation()
  })

  test('getFailedItems 默认返回空数组', () => {
    const result = runReleaseChecklist(defaultOptions)
    expect(getFailedItems(result)).toHaveLength(0)
  })

  test('getFailedItems 失败时返回正确项', () => {
    simulateFailure('chk-004')
    const result = runReleaseChecklist(defaultOptions)
    const failed = getFailedItems(result)
    expect(failed).toHaveLength(1)
    expect(failed[0].id).toBe('chk-004')
  })

  test('getChecklistItemStatus 返回 passed', () => {
    const result = runReleaseChecklist(defaultOptions)
    expect(getChecklistItemStatus(result, 'chk-001')).toBe('passed')
    expect(getChecklistItemStatus(result, 'chk-012')).toBe('passed')
  })

  test('getChecklistItemStatus 不存在时返回 pending', () => {
    const result = runReleaseChecklist(defaultOptions)
    expect(getChecklistItemStatus(result, 'chk-999')).toBe('pending')
  })

  test('getChecklistItemStatus 失败项返回 failed', () => {
    simulateFailure('chk-007')
    const result = runReleaseChecklist(defaultOptions)
    expect(getChecklistItemStatus(result, 'chk-007')).toBe('failed')
  })

  test('getChecklistSummary 正确', () => {
    simulateFailure('chk-001')
    simulateFailure('chk-009')
    const result = runReleaseChecklist(defaultOptions)
    const summary = getChecklistSummary(result)
    expect(summary.total).toBe(12)
    expect(summary.passed).toBe(10)
    expect(summary.failed).toBe(2)
    expect(summary.skipped).toBe(0)
    expect(summary.pending).toBe(0)
  })

  test('getChecklistSummary 与 result.summary 一致', () => {
    const result = runReleaseChecklist(defaultOptions)
    expect(getChecklistSummary(result)).toEqual(result.summary)
  })
})

// ═══════════════════════════════════════════
// 7. generateChecklistReport
// ═══════════════════════════════════════════

describe('generateChecklistReport', () => {
  beforeEach(() => {
    resetSimulation()
  })

  test('报告包含标题行', () => {
    const result = runReleaseChecklist(defaultOptions)
    const report = generateChecklistReport(result)
    expect(report).toContain('=== Release Checklist Report ===')
    expect(report).toContain('=== End of Report ===')
  })

  test('报告包含版本和决策', () => {
    const result = runReleaseChecklist(defaultOptions)
    const report = generateChecklistReport(result)
    expect(report).toContain('Version: 5.0.0')
    expect(report).toContain('Gate Decision: release')
  })

  test('报告包含 Summary', () => {
    const result = runReleaseChecklist(defaultOptions)
    const report = generateChecklistReport(result)
    expect(report).toContain('--- Summary ---')
    expect(report).toContain('Total: 12')
    expect(report).toContain('Passed: 12')
  })

  test('报告包含每项检查的 PASS 标记', () => {
    const result = runReleaseChecklist(defaultOptions)
    const report = generateChecklistReport(result)
    expect(report).toContain('[PASS]* chk-001')
    expect(report).toContain('[PASS]* chk-012')
  })

  test('报告包含非 required 项的空格标记', () => {
    const result = runReleaseChecklist(defaultOptions)
    const report = generateChecklistReport(result)
    expect(report).toContain('[PASS]  chk-009')
  })

  test('报告对失败项显示 FAIL 标记', () => {
    simulateFailure('chk-003')
    const result = runReleaseChecklist(defaultOptions)
    const report = generateChecklistReport(result)
    expect(report).toContain('[FAIL]* chk-003')
  })

  test('报告对跳过项显示 SKIP 标记', () => {
    const result = runReleaseChecklist({
      ...defaultOptions,
      skipCategories: ['documentation'],
    })
    const report = generateChecklistReport(result)
    expect(report).toContain('[SKIP]')
  })

  test('报告是多行文本', () => {
    const result = runReleaseChecklist(defaultOptions)
    const report = generateChecklistReport(result)
    const lines = report.split('\n')
    expect(lines.length).toBeGreaterThan(10)
  })
})

// ═══════════════════════════════════════════
// 8. registerChecklistAutomation
// ═══════════════════════════════════════════

describe('registerChecklistAutomation', () => {
  beforeEach(() => {
    resetSimulation()
  })

  test('自定义处理器覆盖默认结果', () => {
    registerChecklistAutomation({
      itemId: 'chk-001',
      handler: () => ({
        id: 'chk-001',
        name: 'TypeScript 编译零错误',
        category: 'quality' as ChecklistCategory,
        description: 'TS 编译器报告 0 错误',
        status: 'failed',
        required: true,
        automated: true,
        result: '3 errors found',
        durationMs: 0,
      }),
    })
    const result = runReleaseChecklist(defaultOptions)
    const item = result.items.find((i) => i.id === 'chk-001')!
    expect(item.status).toBe('failed')
    expect(item.result).toBe('3 errors found')
  })

  test('自定义处理器返回 passed 时结果正确', () => {
    registerChecklistAutomation({
      itemId: 'chk-002',
      handler: () => ({
        id: 'chk-002',
        name: 'Health Score >= 95',
        category: 'quality' as ChecklistCategory,
        description: '9 维健康评分 >= 95',
        status: 'passed',
        required: true,
        automated: true,
        result: 'Health Score: 98.0',
        durationMs: 0,
      }),
    })
    const result = runReleaseChecklist(defaultOptions)
    const item = result.items.find((i) => i.id === 'chk-002')!
    expect(item.status).toBe('passed')
    expect(item.result).toBe('Health Score: 98.0')
  })

  test('resetSimulation 清除自定义处理器', () => {
    registerChecklistAutomation({
      itemId: 'chk-001',
      handler: () => ({
        id: 'chk-001',
        name: 'TypeScript 编译零错误',
        category: 'quality' as ChecklistCategory,
        description: 'TS 编译器报告 0 错误',
        status: 'failed',
        required: true,
        automated: true,
        result: 'Custom handler',
        durationMs: 0,
      }),
    })
    resetSimulation()
    const result = runReleaseChecklist(defaultOptions)
    const item = result.items.find((i) => i.id === 'chk-001')!
    expect(item.status).toBe('passed')
    expect(item.result).toBe('0 errors found')
  })
})

// ═══════════════════════════════════════════
// 9. skipCategories
// ═══════════════════════════════════════════

describe('skipCategories 边界', () => {
  beforeEach(() => {
    resetSimulation()
  })

  test('跳过 documentation 类别', () => {
    const result = runReleaseChecklist({
      ...defaultOptions,
      skipCategories: ['documentation'],
    })
    const skipped = result.items.filter((i) => i.status === 'skipped')
    expect(skipped.length).toBeGreaterThanOrEqual(2) // chk-009, chk-012
    for (const item of skipped) {
      expect(item.category).toBe('documentation')
    }
  })

  test('跳过多个类别', () => {
    const result = runReleaseChecklist({
      ...defaultOptions,
      skipCategories: ['documentation', 'security'],
    })
    const skipped = result.items.filter((i) => i.status === 'skipped')
    const cats = new Set(skipped.map((i) => i.category))
    expect(cats.has('documentation')).toBe(true)
    expect(cats.has('security')).toBe(true)
  })

  test('跳过所有类别后所有项为 skipped', () => {
    const allCats: ChecklistCategory[] = [
      'algorithm', 'quality', 'performance', 'documentation', 'security', 'compliance',
    ]
    const result = runReleaseChecklist({
      ...defaultOptions,
      skipCategories: allCats,
    })
    expect(result.items).toHaveLength(12)
    for (const item of result.items) {
      expect(item.status).toBe('skipped')
    }
    expect(result.summary.skipped).toBe(12)
    expect(result.passRate).toBe(0)
  })

  test('空 skipCategories 不跳过任何项', () => {
    const result = runReleaseChecklist(defaultOptions)
    const skipped = result.items.filter((i) => i.status === 'skipped')
    expect(skipped).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════
// 10. getCurrentChecklist
// ═══════════════════════════════════════════

describe('getCurrentChecklist', () => {
  beforeEach(() => {
    resetSimulation()
  })

  test('初始时为 null', () => {
    expect(getCurrentChecklist()).toBeNull()
  })

  test('runReleaseChecklist 后非 null', () => {
    runReleaseChecklist(defaultOptions)
    expect(getCurrentChecklist()).not.toBeNull()
  })

  test('返回最新结果', () => {
    const result1 = runReleaseChecklist({ ...defaultOptions, version: '5.0.0' })
    const result2 = runReleaseChecklist({ ...defaultOptions, version: '5.1.0' })
    expect(getCurrentChecklist()).toBe(result2)
    expect(getCurrentChecklist()!.version).toBe('5.1.0')
  })
})

// ═══════════════════════════════════════════
// 11. passRate 计算
// ═══════════════════════════════════════════

describe('passRate 计算', () => {
  beforeEach(() => {
    resetSimulation()
  })

  test('全部通过时 passRate = 100', () => {
    const result = runReleaseChecklist(defaultOptions)
    expect(result.passRate).toBe(100)
  })

  test('1 项失败 passRate = 91.67 (11/12)', () => {
    simulateFailure('chk-001')
    const result = runReleaseChecklist(defaultOptions)
    expect(result.passRate).toBeCloseTo(91.67, 1)
  })

  test('跳过项不计入 passRate', () => {
    const result = runReleaseChecklist({
      ...defaultOptions,
      skipCategories: ['documentation'],
    })
    // 12 items, 2 skipped, 10 passed -> 10/10 = 100
    expect(result.passRate).toBe(100)
  })
})
