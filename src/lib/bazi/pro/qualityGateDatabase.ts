/**
 * V5.0 RC: Quality Gate Engine — 默认配置与常量
 */

import type { ReleaseThreshold, HealthScoreDimension } from './qualityGateTypes'

// ─── 默认发布门槛 ───

/** V5.0 默认发布门槛 */
export const DEFAULT_RELEASE_THRESHOLD: ReleaseThreshold = {
  maxTsErrors: 0,
  minRuleRegistryCoverage: 1.0,
  minTraceChainCoverage: 1.0,
  minKnowledgeCoverage: 0.95,
  minRegressionRate: 1.0,
  minPerformanceRatio: 1.0,
  maxCircularDependencies: 0,
  minTestPassRate: 1.0,
}

// ─── 健康评分维度权重 ───

/** 9 大健康评分维度（权重总和 = 1.0） */
export const HEALTH_DIMENSIONS: { dimension: string; weight: number }[] = [
  { dimension: 'Code Quality', weight: 0.15 },
  { dimension: 'Documentation', weight: 0.10 },
  { dimension: 'Architecture', weight: 0.15 },
  { dimension: 'Knowledge', weight: 0.10 },
  { dimension: 'Testing', weight: 0.15 },
  { dimension: 'Performance', weight: 0.10 },
  { dimension: 'Coverage', weight: 0.10 },
  { dimension: 'Maintainability', weight: 0.10 },
  { dimension: 'Security', weight: 0.05 },
]

// ─── 静态检查定义 ───

/** 质量门禁静态检查项定义（14 项） */
export const QUALITY_CHECK_DEFINITIONS: {
  checkId: string
  name: string
  category: string
  severity: 'critical' | 'major' | 'minor' | 'info'
}[] = [
  { checkId: 'qg-001', name: '重复代码检查', category: 'duplicate-code', severity: 'major' },
  { checkId: 'qg-002', name: '重复规则检查', category: 'duplicate-rules', severity: 'major' },
  { checkId: 'qg-003', name: '重复数据库检查', category: 'duplicate-database', severity: 'major' },
  { checkId: 'qg-004', name: 'RuleRegistry 覆盖率', category: 'rule-registry-coverage', severity: 'critical' },
  { checkId: 'qg-005', name: 'TraceChain 覆盖率', category: 'tracechain-coverage', severity: 'critical' },
  { checkId: 'qg-006', name: 'Knowledge 引用覆盖率', category: 'knowledge-coverage', severity: 'major' },
  { checkId: 'qg-007', name: 'WarningCode 覆盖率', category: 'warningcode-coverage', severity: 'minor' },
  { checkId: 'qg-008', name: 'TypeScript 错误', category: 'typescript-errors', severity: 'critical' },
  { checkId: 'qg-009', name: '循环依赖检查', category: 'circular-dependency', severity: 'critical' },
  { checkId: 'qg-010', name: '死代码检查', category: 'dead-code', severity: 'minor' },
  { checkId: 'qg-011', name: 'Cache Version 一致性', category: 'cache-version', severity: 'minor' },
  { checkId: 'qg-012', name: 'Regression 一致率', category: 'regression-consistency', severity: 'critical' },
  { checkId: 'qg-013', name: 'Test Coverage', category: 'test-coverage', severity: 'critical' },
  { checkId: 'qg-014', name: 'Performance Threshold', category: 'performance-threshold', severity: 'major' },
]

// ─── 查询函数 ───

/** 获取所有检查定义 */
export function getAllCheckDefinitions() {
  return QUALITY_CHECK_DEFINITIONS
}

/** 按 category 获取检查定义 */
export function getCheckDefinitionsByCategory(category: string) {
  return QUALITY_CHECK_DEFINITIONS.filter((d) => d.category === category)
}

/** 按 severity 获取检查定义 */
export function getCheckDefinitionsBySeverity(severity: string) {
  return QUALITY_CHECK_DEFINITIONS.filter((d) => d.severity === severity)
}

/** 获取默认发布门槛 */
export function getDefaultThreshold(): ReleaseThreshold {
  return { ...DEFAULT_RELEASE_THRESHOLD }
}