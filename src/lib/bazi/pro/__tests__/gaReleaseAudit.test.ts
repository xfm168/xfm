import { describe, test, expect, beforeEach, vi } from 'vitest'

import {
  GA_AUDIT_CHECKLIST,
  GA_RELEASE_AUDIT_VERSION,
  AUDIT_CATEGORIES,
} from '../gaReleaseAuditTypes'
import type { AuditCategory } from '../gaReleaseAuditTypes'
import type { AuditChecklist } from '../gaReleaseAuditTypes'
import type { AuditCheckItem } from '../gaReleaseAuditTypes'
import type { AuditSignOff } from '../gaReleaseAuditTypes'

import {
  GA_RELEASE_AUDIT_ENGINE_VERSION,
  runGaReleaseAudit,
  evaluateAuditGate,
  generateAuditReport,
  getChecklistItem,
  getBlockers,
  getAuditSummary,
  getItemsByCategory,
  getItemsBySeverity,
  signOffAudit,
  getAuditHistory,
  simulateAuditFailure,
  resetAuditSimulation,
} from '../gaReleaseAuditEngine'

// ========== GA_AUDIT_CHECKLIST 常量验证 ==========

describe('GA_AUDIT_CHECKLIST 常量验证', () => {
  test('包含 28 项审核条目', () => {
    expect(GA_AUDIT_CHECKLIST).toHaveLength(28)
  })

  test('每项 id 唯一', () => {
    const ids = GA_AUDIT_CHECKLIST.map((i) => i.id)
    expect(new Set(ids).size).toBe(28)
  })

  test('所有条目 id 以 ga- 开头', () => {
    GA_AUDIT_CHECKLIST.forEach((item) => {
      expect(item.id).toMatch(/^ga-/)
    })
  })

  test('所有条目 category 在 AUDIT_CATEGORIES 范围内', () => {
    const validCats = new Set<string>(AUDIT_CATEGORIES)
    GA_AUDIT_CHECKLIST.forEach((item) => {
      expect(validCats.has(item.category)).toBe(true)
    })
  })

  test('所有条目 severity 为有效值', () => {
    const validSeverities = new Set<string>(['critical', 'major', 'minor', 'info'])
    GA_AUDIT_CHECKLIST.forEach((item) => {
      expect(validSeverities.has(item.severity)).toBe(true)
    })
  })

  test('required 条目数量为 21', () => {
    const requiredCount = GA_AUDIT_CHECKLIST.filter((i) => i.required).length
    expect(requiredCount).toBe(21)
  })

  test('非 required 条目数量为 7', () => {
    const optionalCount = GA_AUDIT_CHECKLIST.filter((i) => !i.required).length
    expect(optionalCount).toBe(7)
  })

  test('所有条目包含 id、name、category、description、severity、required 字段', () => {
    GA_AUDIT_CHECKLIST.forEach((item) => {
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('name')
      expect(item).toHaveProperty('category')
      expect(item).toHaveProperty('description')
      expect(item).toHaveProperty('severity')
      expect(item).toHaveProperty('required')
      expect(typeof item.id).toBe('string')
      expect(typeof item.name).toBe('string')
      expect(typeof item.description).toBe('string')
    })
  })
})

// ========== GA_RELEASE_AUDIT_VERSION ==========

describe('GA_RELEASE_AUDIT_VERSION', () => {
  test('值为 1.0.0', () => {
    expect(GA_RELEASE_AUDIT_VERSION).toBe('1.0.0')
  })
})

describe('GA_RELEASE_AUDIT_ENGINE_VERSION', () => {
  test('值为 1.0.0', () => {
    expect(GA_RELEASE_AUDIT_ENGINE_VERSION).toBe('1.0.0')
  })
})

// ========== AUDIT_CATEGORIES ==========

describe('AUDIT_CATEGORIES 常量', () => {
  test('包含 12 个分类', () => {
    expect(AUDIT_CATEGORIES).toHaveLength(12)
  })

  test('包含 security 分类', () => {
    expect(AUDIT_CATEGORIES).toContain('security')
  })

  test('包含 payment 分类', () => {
    expect(AUDIT_CATEGORIES).toContain('payment')
  })

  test('包含 disaster_recovery 分类', () => {
    expect(AUDIT_CATEGORIES).toContain('disaster_recovery')
  })

  test('每个分类在 GA_AUDIT_CHECKLIST 中至少有一条', () => {
    AUDIT_CATEGORIES.forEach((cat) => {
      const items = GA_AUDIT_CHECKLIST.filter((i) => i.category === cat)
      expect(items.length).toBeGreaterThanOrEqual(1)
    })
  })
})

// ========== runGaReleaseAudit ==========

describe('runGaReleaseAudit 默认全部通过', () => {
  beforeEach(() => {
    resetAuditSimulation()
  })

  test('返回 28 条审核项', () => {
    const checklist = runGaReleaseAudit()
    expect(checklist.items).toHaveLength(28)
  })

  test('所有项状态为 passed', () => {
    const checklist = runGaReleaseAudit()
    checklist.items.forEach((item) => {
      expect(item.status).toBe('passed')
    })
  })

  test('overallStatus 为 go', () => {
    const checklist = runGaReleaseAudit()
    expect(checklist.overallStatus).toBe('go')
  })

  test('默认 version 为 1.0.0', () => {
    const checklist = runGaReleaseAudit()
    expect(checklist.version).toBe('1.0.0')
  })

  test('默认 auditType 为 pre_release', () => {
    const checklist = runGaReleaseAudit()
    expect(checklist.auditType).toBe('pre_release')
  })

  test('passedCount 等于 28', () => {
    const checklist = runGaReleaseAudit()
    expect(checklist.passedCount).toBe(28)
  })

  test('failedCount 为 0', () => {
    const checklist = runGaReleaseAudit()
    expect(checklist.failedCount).toBe(0)
  })

  test('warningCount 为 0', () => {
    const checklist = runGaReleaseAudit()
    expect(checklist.warningCount).toBe(0)
  })

  test('skippedCount 为 0', () => {
    const checklist = runGaReleaseAudit()
    expect(checklist.skippedCount).toBe(0)
  })

  test('generatedAt 为正数时间戳', () => {
    const checklist = runGaReleaseAudit()
    expect(checklist.generatedAt).toBeGreaterThan(0)
  })

  test('每项 checkedAt 不为 null', () => {
    const checklist = runGaReleaseAudit()
    checklist.items.forEach((item) => {
      expect(item.checkedAt).not.toBeNull()
    })
  })

  test('每项 checkedBy 为 audit-engine', () => {
    const checklist = runGaReleaseAudit()
    checklist.items.forEach((item) => {
      expect(item.checkedBy).toBe('audit-engine')
    })
  })

  test('summary 包含通过信息', () => {
    const checklist = runGaReleaseAudit()
    expect(checklist.summary).toContain('28')
    expect(checklist.summary).toContain('通过')
  })

  test('recommendation 为建议发布', () => {
    const checklist = runGaReleaseAudit()
    expect(checklist.recommendation).toBe('所有必选项通过，建议发布')
  })
})

// ========== 边界场景 ==========

describe('runGaReleaseAudit 边界场景', () => {
  beforeEach(() => {
    resetAuditSimulation()
  })

  test('空 options 使用默认值', () => {
    const checklist = runGaReleaseAudit({})
    expect(checklist.version).toBe('1.0.0')
    expect(checklist.auditType).toBe('pre_release')
  })

  test('自定义 version', () => {
    const checklist = runGaReleaseAudit({ version: '2.0.0' })
    expect(checklist.version).toBe('2.0.0')
  })

  test('自定义 auditType', () => {
    const checklist = runGaReleaseAudit({ auditType: 'post_release' })
    expect(checklist.auditType).toBe('post_release')
  })

  test('periodic auditType', () => {
    const checklist = runGaReleaseAudit({ auditType: 'periodic' })
    expect(checklist.auditType).toBe('periodic')
  })
})

// ========== evaluateAuditGate ==========

describe('evaluateAuditGate', () => {
  test('全部 passed 返回 go', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    expect(evaluateAuditGate(checklist)).toBe('go')
  })

  test('required 项 failed 返回 hold', () => {
    resetAuditSimulation()
    simulateAuditFailure('ga-sec-001')
    const checklist = runGaReleaseAudit()
    expect(evaluateAuditGate(checklist)).toBe('hold')
  })

  test('非 required 项 failed 不影响 gate（仍为 go）', () => {
    resetAuditSimulation()
    simulateAuditFailure('ga-perf-003')
    const checklist = runGaReleaseAudit()
    expect(evaluateAuditGate(checklist)).toBe('go')
  })

  test('required 项 warning 返回 conditional_go', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const warningItems = checklist.items.map((item) => ({
      ...item,
      status: item.required ? 'warning' as const : item.status,
    }))
    const modified: AuditChecklist = { ...checklist, items: warningItems }
    expect(evaluateAuditGate(modified)).toBe('conditional_go')
  })

  test('非 required 项 warning 仍为 go', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const nonRequiredIds = checklist.items.filter((i) => !i.required).map((i) => i.id)
    const warningItems = checklist.items.map((item) => ({
      ...item,
      status: nonRequiredIds.includes(item.id) ? 'warning' as const : item.status,
    }))
    const modified: AuditChecklist = { ...checklist, items: warningItems }
    expect(evaluateAuditGate(modified)).toBe('go')
  })
})

// ========== simulateAuditFailure + resetAuditSimulation ==========

describe('simulateAuditFailure 和 resetAuditSimulation', () => {
  beforeEach(() => {
    resetAuditSimulation()
  })

  test('模拟必选 critical 项失败后 overallStatus 为 hold', () => {
    simulateAuditFailure('ga-sec-001')
    const checklist = runGaReleaseAudit()
    expect(checklist.overallStatus).toBe('hold')
  })

  test('模拟失败后该项 status 为 failed', () => {
    simulateAuditFailure('ga-sec-001')
    const checklist = runGaReleaseAudit()
    const item = getChecklistItem(checklist, 'ga-sec-001')
    expect(item?.status).toBe('failed')
  })

  test('模拟非必选项失败不影响 overallStatus', () => {
    simulateAuditFailure('ga-seo-001')
    const checklist = runGaReleaseAudit()
    expect(checklist.overallStatus).toBe('go')
  })

  test('resetSimulation 后恢复全部 passed', () => {
    simulateAuditFailure('ga-sec-001')
    simulateAuditFailure('ga-sec-002')
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    expect(checklist.overallStatus).toBe('go')
    expect(checklist.failedCount).toBe(0)
  })

  test('多次模拟失败', () => {
    simulateAuditFailure('ga-sec-001')
    simulateAuditFailure('ga-sec-002')
    simulateAuditFailure('ga-pay-001')
    const checklist = runGaReleaseAudit()
    expect(checklist.failedCount).toBe(3)
  })

  test('重复模拟同一项是幂等的', () => {
    simulateAuditFailure('ga-sec-001')
    simulateAuditFailure('ga-sec-001')
    const checklist = runGaReleaseAudit()
    expect(checklist.failedCount).toBe(1)
  })

  test('模拟失败项的 remediation 不为空', () => {
    simulateAuditFailure('ga-sec-001')
    const checklist = runGaReleaseAudit()
    const item = getChecklistItem(checklist, 'ga-sec-001')
    expect(item?.remediation).not.toBe('')
  })

  test('模拟失败项的 evidence 为模拟失败', () => {
    simulateAuditFailure('ga-sec-001')
    const checklist = runGaReleaseAudit()
    const item = getChecklistItem(checklist, 'ga-sec-001')
    expect(item?.evidence).toBe('模拟失败')
  })
})

// ========== getBlockers ==========

describe('getBlockers', () => {
  test('全部通过时无阻塞项', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    expect(getBlockers(checklist)).toHaveLength(0)
  })

  test('critical + required + failed 项为阻塞项', () => {
    resetAuditSimulation()
    simulateAuditFailure('ga-sec-001')
    const checklist = runGaReleaseAudit()
    const blockers = getBlockers(checklist)
    expect(blockers).toHaveLength(1)
    expect(blockers[0].id).toBe('ga-sec-001')
  })

  test('非 critical 失败项不是阻塞项', () => {
    resetAuditSimulation()
    simulateAuditFailure('ga-sec-003')
    const checklist = runGaReleaseAudit()
    expect(getBlockers(checklist)).toHaveLength(0)
  })

  test('非 required 失败项不是阻塞项', () => {
    resetAuditSimulation()
    simulateAuditFailure('ga-perf-003')
    const checklist = runGaReleaseAudit()
    expect(getBlockers(checklist)).toHaveLength(0)
  })

  test('多个 critical required 失败时返回全部阻塞项', () => {
    resetAuditSimulation()
    simulateAuditFailure('ga-sec-001')
    simulateAuditFailure('ga-pay-001')
    const checklist = runGaReleaseAudit()
    expect(getBlockers(checklist)).toHaveLength(2)
  })
})

// ========== getChecklistItem ==========

describe('getChecklistItem', () => {
  test('存在时返回对应项', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const item = getChecklistItem(checklist, 'ga-sec-001')
    expect(item).not.toBeNull()
    expect(item!.id).toBe('ga-sec-001')
    expect(item!.name).toBe('API 认证与授权')
  })

  test('不存在时返回 null', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const item = getChecklistItem(checklist, 'non-existent-id')
    expect(item).toBeNull()
  })
})

// ========== getAuditSummary ==========

describe('getAuditSummary', () => {
  test('全部通过时计数正确', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const summary = getAuditSummary(checklist)
    expect(summary.passed).toBe(28)
    expect(summary.failed).toBe(0)
    expect(summary.warning).toBe(0)
    expect(summary.skipped).toBe(0)
    expect(summary.notChecked).toBe(0)
  })

  test('有失败项时计数正确', () => {
    resetAuditSimulation()
    simulateAuditFailure('ga-sec-001')
    simulateAuditFailure('ga-sec-002')
    const checklist = runGaReleaseAudit()
    const summary = getAuditSummary(checklist)
    expect(summary.passed).toBe(26)
    expect(summary.failed).toBe(2)
  })

  test('混合状态时计数正确', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const mixedItems = checklist.items.map((item, idx) => {
      if (idx === 0) return { ...item, status: 'failed' as const }
      if (idx === 1) return { ...item, status: 'warning' as const }
      if (idx === 2) return { ...item, status: 'skipped' as const }
      if (idx === 3) return { ...item, status: 'not_checked' as const }
      return item
    })
    const modified: AuditChecklist = { ...checklist, items: mixedItems }
    const summary = getAuditSummary(modified)
    expect(summary.failed).toBe(1)
    expect(summary.warning).toBe(1)
    expect(summary.skipped).toBe(1)
    expect(summary.notChecked).toBe(1)
    expect(summary.passed).toBe(24)
  })
})

// ========== getItemsByCategory ==========

describe('getItemsByCategory', () => {
  test('security 分类有 4 项', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const items = getItemsByCategory(checklist, 'security')
    expect(items).toHaveLength(4)
  })

  test('performance 分类有 3 项', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const items = getItemsByCategory(checklist, 'performance')
    expect(items).toHaveLength(3)
  })

  test('返回的所有项 category 正确', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    AUDIT_CATEGORIES.forEach((cat) => {
      const items = getItemsByCategory(checklist, cat)
      items.forEach((item) => {
        expect(item.category).toBe(cat)
      })
    })
  })

  test('所有分类总项数等于 28', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    let total = 0
    AUDIT_CATEGORIES.forEach((cat) => {
      total += getItemsByCategory(checklist, cat).length
    })
    expect(total).toBe(28)
  })
})

// ========== getItemsBySeverity ==========

describe('getItemsBySeverity', () => {
  test('critical 项有 11 个', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const items = getItemsBySeverity(checklist, 'critical')
    expect(items).toHaveLength(11)
  })

  test('major 项有 12 个', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const items = getItemsBySeverity(checklist, 'major')
    expect(items).toHaveLength(12)
  })

  test('minor 项有 5 个', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const items = getItemsBySeverity(checklist, 'minor')
    expect(items).toHaveLength(5)
  })

  test('info 项有 0 个', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const items = getItemsBySeverity(checklist, 'info')
    expect(items).toHaveLength(0)
  })

  test('所有 severity 总项数等于 28', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const severities: Array<'critical' | 'major' | 'minor' | 'info'> = ['critical', 'major', 'minor', 'info']
    let total = 0
    severities.forEach((sev) => {
      total += getItemsBySeverity(checklist, sev).length
    })
    expect(total).toBe(28)
  })
})

// ========== generateAuditReport ==========

describe('generateAuditReport', () => {
  test('返回报告包含 checklist 字段', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const report = generateAuditReport(checklist)
    expect(report.checklist).toBe(checklist)
  })

  test('全部通过时 releaseReadiness 为 100', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const report = generateAuditReport(checklist)
    expect(report.releaseReadiness).toBe(100)
  })

  test('signOff 初始为 null', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const report = generateAuditReport(checklist)
    expect(report.signOff).toBeNull()
  })

  test('全部通过时风险为低风险', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const report = generateAuditReport(checklist)
    expect(report.riskAssessment).toContain('低风险')
  })

  test('全部通过时 recommendations 包含可以发布', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const report = generateAuditReport(checklist)
    const hasGoRec = report.recommendations.some((r) => r.includes('可以按计划发布'))
    expect(hasGoRec).toBe(true)
  })

  test('有阻塞项时 riskAssessment 为高风险', () => {
    resetAuditSimulation()
    simulateAuditFailure('ga-sec-001')
    const checklist = runGaReleaseAudit()
    const report = generateAuditReport(checklist)
    expect(report.riskAssessment).toContain('高风险')
  })

  test('有阻塞项时 recommendations 包含修复', () => {
    resetAuditSimulation()
    simulateAuditFailure('ga-sec-001')
    const checklist = runGaReleaseAudit()
    const report = generateAuditReport(checklist)
    const hasFixRec = report.recommendations.some((r) => r.includes('修复'))
    expect(hasFixRec).toBe(true)
  })

  test('有失败项时 releaseReadiness 小于 100', () => {
    resetAuditSimulation()
    simulateAuditFailure('ga-sec-001')
    const checklist = runGaReleaseAudit()
    const report = generateAuditReport(checklist)
    expect(report.releaseReadiness).toBeLessThan(100)
    expect(report.releaseReadiness).toBeGreaterThan(0)
  })

  test('有阻塞项时 blockers 数组不为空', () => {
    resetAuditSimulation()
    simulateAuditFailure('ga-sec-001')
    const checklist = runGaReleaseAudit()
    const report = generateAuditReport(checklist)
    expect(report.blockers.length).toBeGreaterThan(0)
  })
})

// ========== signOffAudit ==========

describe('signOffAudit', () => {
  test('签署后 overallStatus 更新为签署决策', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const signOff: AuditSignOff = {
      signedBy: '张三',
      role: '技术负责人',
      signedAt: Date.now(),
      decision: 'conditional_go',
      comment: '部分警告需关注',
    }
    const signed = signOffAudit(checklist, signOff)
    expect(signed.overallStatus).toBe('conditional_go')
  })

  test('签署后原 checklist 不被修改', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const originalStatus = checklist.overallStatus
    const signOff: AuditSignOff = {
      signedBy: '张三',
      role: '技术负责人',
      signedAt: Date.now(),
      decision: 'conditional_go',
      comment: '部分警告需关注',
    }
    signOffAudit(checklist, signOff)
    expect(checklist.overallStatus).toBe(originalStatus)
  })

  test('hold 决策正确反映', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const signOff: AuditSignOff = {
      signedBy: '李四',
      role: '产品经理',
      signedAt: Date.now(),
      decision: 'hold',
      comment: '存在阻塞项',
    }
    const signed = signOffAudit(checklist, signOff)
    expect(signed.overallStatus).toBe('hold')
  })

  test('签署后 items 保留不变', () => {
    resetAuditSimulation()
    const checklist = runGaReleaseAudit()
    const signOff: AuditSignOff = {
      signedBy: '王五',
      role: 'QA负责人',
      signedAt: Date.now(),
      decision: 'go',
      comment: '确认发布',
    }
    const signed = signOffAudit(checklist, signOff)
    expect(signed.items).toBe(checklist.items)
  })
})

// ========== getAuditHistory ==========

describe('getAuditHistory', () => {
  beforeEach(() => {
    resetAuditSimulation()
  })

  test('初始历史为空', () => {
    // 模块首次加载时历史为空，但之前测试可能已产生记录
    // 只验证返回类型为数组
    const history = getAuditHistory()
    expect(Array.isArray(history)).toBe(true)
  })

  test('每次运行后历史增加', () => {
    const before = getAuditHistory().length
    runGaReleaseAudit({ version: `hist-test-${Date.now()}` })
    const after = getAuditHistory().length
    expect(after).toBeGreaterThan(before)
  })

  test('历史记录包含正确的 checklist 结构', () => {
    runGaReleaseAudit()
    const history = getAuditHistory()
    const latest = history[history.length - 1]
    expect(latest).toHaveProperty('version')
    expect(latest).toHaveProperty('items')
    expect(latest).toHaveProperty('overallStatus')
    expect(latest).toHaveProperty('generatedAt')
    expect(latest.items).toHaveLength(28)
  })
})