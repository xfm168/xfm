/**
 * V5.0 RC: Quality Gate Engine 测试
 *
 * 覆盖：类型工具函数、数据库常量、引擎核心逻辑、报告生成
 */

import { describe, it, expect } from 'vitest'
import {
  runQualityGate,
  QUALITY_GATE_VERSION,
} from '../qualityGateEngine'
import {
  DEFAULT_RELEASE_THRESHOLD,
  HEALTH_DIMENSIONS,
  QUALITY_CHECK_DEFINITIONS,
  getAllCheckDefinitions,
  getCheckDefinitionsByCategory,
  getCheckDefinitionsBySeverity,
  getDefaultThreshold,
} from '../qualityGateDatabase'
import {
  getHealthGrade,
  getHealthGradeDescription,
} from '../qualityGateTypes'
import type {
  QualityGateReport,
  EngineHealthScore,
  HealthGrade,
  QualityCheckResult,
  QualityGateSummary,
} from '../qualityGateTypes'

// ═══════════════════════════════════════════════════════════════
// 顶层 describe
// ═══════════════════════════════════════════════════════════════

describe('V5.0 RC: Quality Gate Engine', () => {

  // ─────────────────────────────────────────────
  // 1. 版本号
  // ─────────────────────────────────────────────
  describe('1. 版本号', () => {
    it('版本号应为 1.0.0', () => {
      expect(QUALITY_GATE_VERSION).toBe('1.0.0')
    })
  })

  // ─────────────────────────────────────────────
  // 2. 类型工具函数
  // ─────────────────────────────────────────────
  describe('2. 类型工具函数', () => {
    it('getHealthGrade: 90+ → excellent', () => {
      expect(getHealthGrade(95)).toBe('excellent')
      expect(getHealthGrade(90)).toBe('excellent')
    })
    it('getHealthGrade: 80~89 → good', () => {
      expect(getHealthGrade(85)).toBe('good')
      expect(getHealthGrade(80)).toBe('good')
    })
    it('getHealthGrade: 70~79 → acceptable', () => {
      expect(getHealthGrade(75)).toBe('acceptable')
      expect(getHealthGrade(70)).toBe('acceptable')
    })
    it('getHealthGrade: <70 → block', () => {
      expect(getHealthGrade(65)).toBe('block')
      expect(getHealthGrade(0)).toBe('block')
    })
    it('getHealthGradeDescription: 每个评级有对应描述', () => {
      const grades: HealthGrade[] = ['excellent', 'good', 'acceptable', 'block']
      for (const g of grades) {
        const desc = getHealthGradeDescription(g)
        expect(desc).toBeTruthy()
        expect(desc.length).toBeGreaterThan(0)
      }
    })
  })

  // ─────────────────────────────────────────────
  // 3. 数据库常量
  // ─────────────────────────────────────────────
  describe('3. 数据库常量', () => {
    it('DEFAULT_RELEASE_THRESHOLD.tsErrors 应为 0', () => {
      expect(DEFAULT_RELEASE_THRESHOLD.maxTsErrors).toBe(0)
    })
    it('DEFAULT_RELEASE_THRESHOLD.coverage 应为 1.0', () => {
      expect(DEFAULT_RELEASE_THRESHOLD.minRuleRegistryCoverage).toBe(1.0)
      expect(DEFAULT_RELEASE_THRESHOLD.minTraceChainCoverage).toBe(1.0)
      expect(DEFAULT_RELEASE_THRESHOLD.minRegressionRate).toBe(1.0)
      expect(DEFAULT_RELEASE_THRESHOLD.minTestPassRate).toBe(1.0)
    })
    it('DEFAULT_RELEASE_THRESHOLD.circularDependencies 应为 0', () => {
      expect(DEFAULT_RELEASE_THRESHOLD.maxCircularDependencies).toBe(0)
    })
    it('HEALTH_DIMENSIONS 应有 9 个维度', () => {
      expect(HEALTH_DIMENSIONS).toHaveLength(9)
    })
    it('HEALTH_DIMENSIONS 权重总和应为 1.0', () => {
      const total = HEALTH_DIMENSIONS.reduce((s, d) => s + d.weight, 0)
      expect(Math.abs(total - 1.0)).toBeLessThan(0.001)
    })
    it('QUALITY_CHECK_DEFINITIONS 应有 14 项', () => {
      expect(QUALITY_CHECK_DEFINITIONS).toHaveLength(14)
    })
    it('QUALITY_CHECK_DEFINITIONS ID 唯一', () => {
      const ids = QUALITY_CHECK_DEFINITIONS.map((d) => d.checkId)
      expect(new Set(ids).size).toBe(ids.length)
    })
    it('QUALITY_CHECK_DEFINITIONS 每项有 category 和 severity', () => {
      for (const def of QUALITY_CHECK_DEFINITIONS) {
        expect(def.checkId).toBeTruthy()
        expect(def.name).toBeTruthy()
        expect(def.category).toBeTruthy()
        expect(['critical', 'major', 'minor', 'info']).toContain(def.severity)
      }
    })
  })

  // ─────────────────────────────────────────────
  // 4. 查询函数
  // ─────────────────────────────────────────────
  describe('4. 查询函数', () => {
    it('getAllCheckDefinitions 返回所有 14 项', () => {
      expect(getAllCheckDefinitions()).toHaveLength(14)
    })
    it('getCheckDefinitionsByCategory 筛选正确', () => {
      const criticals = getCheckDefinitionsByCategory('typescript-errors')
      expect(criticals.length).toBeGreaterThan(0)
      for (const c of criticals) {
        expect(c.category).toBe('typescript-errors')
      }
    })
    it('getCheckDefinitionsBySeverity 筛选正确', () => {
      const criticals = getCheckDefinitionsBySeverity('critical')
      expect(criticals.length).toBeGreaterThan(0)
      for (const c of criticals) {
        expect(c.severity).toBe('critical')
      }
    })
    it('getDefaultThreshold 返回 ReleaseThreshold', () => {
      const t = getDefaultThreshold()
      expect(t.maxTsErrors).toBe(0)
      expect(t.minRuleRegistryCoverage).toBe(1.0)
    })
  })

  // ─────────────────────────────────────────────
  // 5. runQualityGate 主函数
  // ─────────────────────────────────────────────
  describe('5. runQualityGate', () => {
    it('返回完整 QualityGateReport', () => {
      const report = runQualityGate()
      expect(report.version).toBe('1.0.0')
      expect(report.generatedAt).toBeGreaterThan(0)
      expect(report.checks).toHaveLength(14)
      expect(report.summary).toBeDefined()
      expect(report.healthScore).toBeDefined()
      expect(report.releaseAllowed).toBeDefined()
      expect(report.blockReasons).toBeDefined()
      expect(report.computeTimeMs).toBeGreaterThanOrEqual(0)
    })

    it('报告检查结果每项有必需字段', () => {
      const report = runQualityGate()
      for (const check of report.checks) {
        expect(check.checkId).toBeTruthy()
        expect(check.name).toBeTruthy()
        expect(['critical', 'major', 'minor', 'info']).toContain(check.severity)
        expect(typeof check.passed).toBe('boolean')
        expect(check.details).toBeTruthy()
      }
    })

    it('检查总结数据正确', () => {
      const report = runQualityGate()
      const { summary } = report
      expect(summary.totalChecks).toBe(14)
      expect(summary.passedChecks).toBe(14)
      expect(summary.failedChecks).toBe(0)
      expect(summary.criticalFailures).toBe(0)
      expect(summary.passRate).toBe(100)
      expect(summary.passedChecks + summary.failedChecks).toBe(summary.totalChecks)
    })

    it('健康评分结构正确', () => {
      const report = runQualityGate()
      const { healthScore } = report
      expect(healthScore.totalScore).toBeGreaterThanOrEqual(90)
      expect(healthScore.totalScore).toBeLessThanOrEqual(100)
      expect(['excellent', 'good']).toContain(healthScore.grade)
      expect(healthScore.dimensions).toHaveLength(9)
      expect(healthScore.gradeDescription).toBeTruthy()
      for (const dim of healthScore.dimensions) {
        expect(dim.dimension).toBeTruthy()
        expect(dim.score).toBeGreaterThanOrEqual(0)
        expect(dim.score).toBeLessThanOrEqual(100)
        expect(dim.weight).toBeGreaterThan(0)
        expect(dim.details).toBeTruthy()
      }
    })

    it('维度权重总和 = 1.0', () => {
      const report = runQualityGate()
      const total = report.healthScore.dimensions.reduce((s, d) => s + d.weight, 0)
      expect(Math.abs(total - 1.0)).toBeLessThan(0.001)
    })

    it('releaseAllowed 与 blockReasons 一致', () => {
      const report = runQualityGate()
      expect(report.releaseAllowed).toBe(true)
      expect(report.blockReasons).toHaveLength(0)
    })
  })

  // ─────────────────────────────────────────────
  // 6. Options 参数
  // ─────────────────────────────────────────────
  describe('6. Options 参数', () => {
    it('自定义 thresholds 生效', () => {
      const report = runQualityGate({
        thresholds: {
          maxTsErrors: 5,
          minTestPassRate: 0.9,
        },
      })
      // 报告应正常生成
      expect(report.checks.length).toBeGreaterThan(0)
    })

    it('按 category 过滤', () => {
      const report = runQualityGate({
        categories: ['typescript-errors'],
      })
      expect(report.checks.length).toBeGreaterThanOrEqual(1)
    })

    it('空 options 等同于默认', () => {
      const report1 = runQualityGate()
      const report2 = runQualityGate(undefined)
      expect(report1.checks.length).toBe(report2.checks.length)
    })
  })

  // ─────────────────────────────────────────────
  // 7. 已知检查结果验证
  // ─────────────────────────────────────────────
  describe('7. 已知检查结果验证', () => {
    const report = runQualityGate()
    const checkMap = new Map(report.checks.map((c) => [c.checkId, c]))

    it('qg-008 TypeScript错误 → passed', () => {
      const check = checkMap.get('qg-008')
      expect(check).toBeDefined()
      expect(check!.passed).toBe(true)
    })

    it('qg-009 循环依赖 → passed', () => {
      const check = checkMap.get('qg-009')
      expect(check).toBeDefined()
      expect(check!.passed).toBe(true)
    })

    it('qg-012 Regression → passed', () => {
      const check = checkMap.get('qg-012')
      expect(check).toBeDefined()
      expect(check!.passed).toBe(true)
    })

    it('qg-013 Test Coverage → passed', () => {
      const check = checkMap.get('qg-013')
      expect(check).toBeDefined()
      expect(check!.passed).toBe(true)
    })

    it('qg-014 Performance → passed', () => {
      const check = checkMap.get('qg-014')
      expect(check).toBeDefined()
      expect(check!.passed).toBe(true)
    })

    it('qg-001 重复代码 → passed', () => {
      const check = checkMap.get('qg-001')
      expect(check).toBeDefined()
      expect(check!.passed).toBe(true)
    })

    it('qg-002 重复规则 → passed', () => {
      const check = checkMap.get('qg-002')
      expect(check).toBeDefined()
      expect(check!.passed).toBe(true)
    })

    it('qg-010 死代码 → passed', () => {
      const check = checkMap.get('qg-010')
      expect(check).toBeDefined()
      expect(check!.passed).toBe(true)
    })

    it('qg-004 RuleRegistry覆盖 → passed', () => {
      const check = checkMap.get('qg-004')
      expect(check).toBeDefined()
      expect(check!.passed).toBe(true)
    })

    it('qg-005 TraceChain覆盖 → passed', () => {
      const check = checkMap.get('qg-005')
      expect(check).toBeDefined()
      expect(check!.passed).toBe(true)
    })

    it('qg-006 Knowledge覆盖 → passed', () => {
      const check = checkMap.get('qg-006')
      expect(check).toBeDefined()
      expect(check!.passed).toBe(true)
    })

    it('qg-007 WarningCode覆盖 → passed', () => {
      const check = checkMap.get('qg-007')
      expect(check).toBeDefined()
      expect(check!.passed).toBe(true)
    })
  })

  // ─────────────────────────────────────────────
  // 8. 报告 ID 唯一性
  // ─────────────────────────────────────────────
  describe('8. 报告 ID 唯一性', () => {
    it('每次调用检查结果 ID 唯一', () => {
      const report = runQualityGate()
      const ids = report.checks.map((c) => c.checkId)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })
})