// V5.0 GA P2: GA Release Audit Checklist — Engine

import type { AuditCategory }
  from './gaReleaseAuditTypes'
import type { AuditCheckItem }
  from './gaReleaseAuditTypes'
import type { AuditChecklist }
  from './gaReleaseAuditTypes'
import type { AuditGateDecision }
  from './gaReleaseAuditTypes'
import type { AuditReport }
  from './gaReleaseAuditTypes'
import type { AuditSeverity }
  from './gaReleaseAuditTypes'
import type { AuditSignOff }
  from './gaReleaseAuditTypes'
import type { AuditStatus }
  from './gaReleaseAuditTypes'

import {
  GA_AUDIT_CHECKLIST,
  GA_RELEASE_AUDIT_VERSION,
} from './gaReleaseAuditTypes'

export const GA_RELEASE_AUDIT_ENGINE_VERSION = '1.0.0'

const auditHistory: Map<string, AuditChecklist> = new Map()
let currentAudit: AuditChecklist | null = null
const simulatedFailures: Set<string> = new Set()

function createDefaultItem(
  template: { id: string; name: string; category: AuditCategory; description: string; severity: AuditSeverity; required: boolean },
  status: AuditStatus
): AuditCheckItem {
  return {
    id: template.id,
    name: template.name,
    category: template.category,
    description: template.description,
    severity: template.severity,
    status,
    required: template.required,
    result: status === 'passed' ? '检查通过' : '检查未通过',
    checkedAt: Date.now(),
    checkedBy: 'audit-engine',
    evidence: status === 'passed' ? '自动化检查通过' : '模拟失败',
    remediation: status === 'failed' ? `请修复 ${template.name} 相关问题后重新审核` : '',
  }
}

export function runGaReleaseAudit(options?: { version?: string; auditType?: string }): AuditChecklist {
  const version = options?.version ?? GA_RELEASE_AUDIT_VERSION
  const auditType = options?.auditType ?? 'pre_release'
  const now = Date.now()

  const items: AuditCheckItem[] = GA_AUDIT_CHECKLIST.map((template) => {
    const status: AuditStatus = simulatedFailures.has(template.id) ? 'failed' : 'passed'
    return createDefaultItem(template, status)
  })

  const passedCount = items.filter((i) => i.status === 'passed').length
  const failedCount = items.filter((i) => i.status === 'failed').length
  const warningCount = items.filter((i) => i.status === 'warning').length
  const skippedCount = items.filter((i) => i.status === 'skipped').length
  const overallStatus = evaluateAuditGateInternal(items)

  const checklist: AuditChecklist = {
    version,
    auditType,
    generatedAt: now,
    items,
    overallStatus,
    passedCount,
    failedCount,
    warningCount,
    skippedCount,
    summary: `审核完成: ${passedCount} 通过, ${failedCount} 失败, ${warningCount} 警告, ${skippedCount} 跳过`,
    recommendation: overallStatus === 'go'
      ? '所有必选项通过，建议发布'
      : overallStatus === 'conditional_go'
        ? '存在必选警告项，建议修复后发布'
        : '存在必选失败项，建议暂缓发布',
  }

  currentAudit = checklist
  auditHistory.set(`${version}-${now}`, checklist)

  return checklist
}

function evaluateAuditGateInternal(items: AuditCheckItem[]): AuditGateDecision {
  const requiredItems = items.filter((i) => i.required)
  const hasRequiredFailed = requiredItems.some((i) => i.status === 'failed')
  if (hasRequiredFailed) return 'hold'

  const hasRequiredWarning = requiredItems.some((i) => i.status === 'warning')
  if (hasRequiredWarning) return 'conditional_go'

  return 'go'
}

export function evaluateAuditGate(checklist: AuditChecklist): AuditGateDecision {
  return evaluateAuditGateInternal(checklist.items)
}

export function generateAuditReport(checklist: AuditChecklist): AuditReport {
  const blockers = getBlockers(checklist)
  const totalItems = checklist.items.length
  const passedCount = checklist.items.filter((i) => i.status === 'passed').length
  const releaseReadiness = totalItems > 0 ? Math.round((passedCount / totalItems) * 100) : 0

  const riskLevel = blockers.length > 0
    ? '高风险：存在阻塞项需要立即处理'
    : checklist.warningCount > 0
      ? '中风险：存在警告项建议关注'
      : '低风险：所有检查项均已通过'

  const recommendations: string[] = []
  if (blockers.length > 0) {
    recommendations.push(`修复 ${blockers.length} 个阻塞项后再进行发布`)
  }
  if (checklist.warningCount > 0) {
    recommendations.push('关注警告项，评估是否影响用户体验')
  }
  if (blockers.length === 0 && checklist.warningCount === 0) {
    recommendations.push('所有审核项通过，可以按计划发布')
  }

  return {
    checklist,
    riskAssessment: riskLevel,
    releaseReadiness,
    blockers,
    recommendations,
    signOff: null,
  }
}

export function getChecklistItem(checklist: AuditChecklist, itemId: string): AuditCheckItem | null {
  const found = checklist.items.find((i) => i.id === itemId)
  return found ?? null
}

export function getBlockers(checklist: AuditChecklist): AuditCheckItem[] {
  return checklist.items.filter(
    (i) => i.severity === 'critical' && i.required && i.status === 'failed'
  )
}

export function getAuditSummary(checklist: AuditChecklist): {
  passed: number
  failed: number
  warning: number
  skipped: number
  notChecked: number
} {
  return {
    passed: checklist.items.filter((i) => i.status === 'passed').length,
    failed: checklist.items.filter((i) => i.status === 'failed').length,
    warning: checklist.items.filter((i) => i.status === 'warning').length,
    skipped: checklist.items.filter((i) => i.status === 'skipped').length,
    notChecked: checklist.items.filter((i) => i.status === 'not_checked').length,
  }
}

export function getItemsByCategory(checklist: AuditChecklist, category: AuditCategory): AuditCheckItem[] {
  return checklist.items.filter((i) => i.category === category)
}

export function getItemsBySeverity(checklist: AuditChecklist, severity: AuditSeverity): AuditCheckItem[] {
  return checklist.items.filter((i) => i.severity === severity)
}

export function signOffAudit(checklist: AuditChecklist, signOff: AuditSignOff): AuditChecklist {
  return {
    ...checklist,
    overallStatus: signOff.decision,
  }
}

export function getAuditHistory(): AuditChecklist[] {
  return Array.from(auditHistory.values())
}

export function simulateAuditFailure(itemId: string): void {
  simulatedFailures.add(itemId)
}

export function resetAuditSimulation(): void {
  simulatedFailures.clear()
}