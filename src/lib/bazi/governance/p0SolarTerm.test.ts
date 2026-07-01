/**
 * P0-① Quality Gate - 模块交付质量门
 * V4.8.1 Baseline
 *
 * 验证 P0-① 节气精确到时分秒 满足全部 V4.8.1 交付标准：
 *   Rule Meta ✓  Rule Version ✓  Rule Pack ✓  Rule Evidence ✓  Rule Freeze ✓
 *   Explain ✓  Explain Version ✓  Confidence ✓
 *   Benchmark ✓  Regression ✓  Golden Dataset ✓
 *   Snapshot ✓  Feature Flag ✓  Observability ✓  Error Code ✓
 *   Quality Gate ✓  Dashboard ✓
 *
 * 任何检查失败 → Merge Blocked（Regression First 铁律）
 */

import { describe, it, expect } from 'vitest'
import { getSolarTermDate, getYearSolarTerms, explainSolarTerms, isAfterLiChun } from '../solarTerms'
import { GOLDEN_CASES, getGoldenCaseStats } from '../caseLibrary/golden'
import { calculateBaZi } from '../calculator'
import { calculateConfidence } from '../explain/types'
import { getFeatureFlags } from '../config/featureFlags'
import { ERROR_CODES } from '../errors'
import { getDashboardSummary } from '../governance/dashboard'
import { P0_SOLAR_TERM_PACK } from '../governance/packs/p0SolarTerm'
import { runSolarTermBenchmark } from '../governance/benchmarks/p0SolarTerm'
import { P0_SNAPSHOT } from '../governance/p0Snapshot'
import { getSnapshot } from '../governance/snapshot'
import { recordCall, getObservabilitySummary, resetObservability } from '../governance/observability'
import { runQualityGate, formatQualityGateReport, type QualityCheck } from '../governance/qualityGate'

describe('P0-① Quality Gate - 节气精确到时分秒', () => {
  const checks: QualityCheck[] = []

  // ========== 1. Rule Meta + Version ==========
  it('RULE-PP-021 / RULE-PP-069 规则元数据完整且已冻结', () => {
    const rules = P0_SOLAR_TERM_PACK.rules
    const r021 = rules.find(r => r.id === 'RULE-PP-021')!
    const r069 = rules.find(r => r.id === 'RULE-PP-069')!

    const pass =
      !!r021 && !!r069 &&
      r021.frozen && r069.frozen &&
      r021.status === 'stable' && r069.status === 'stable' &&
      r021.evidence?.level === 'A' && r069.evidence?.level === 'A' &&
      r021.sourceLevel === 1 && r069.sourceLevel === 1 &&
      r021.changeLogs.length > 0 && r069.changeLogs.length > 0

    checks.push({
      id: 'rule-meta',
      name: 'Rule Meta + Version + Freeze',
      passed: pass,
      detail: `RULE-PP-021 v${r021.version} frozen=${r021.frozen}; RULE-PP-069 v${r069.version} frozen=${r069.frozen}`,
    })
    expect(pass).toBe(true)
  })

  // ========== 2. Rule Pack ==========
  it('Rule Pack PACK-P0-01 完整', () => {
    const pass =
      P0_SOLAR_TERM_PACK.id === 'PACK-P0-01' &&
      P0_SOLAR_TERM_PACK.module === 'P0-①' &&
      P0_SOLAR_TERM_PACK.rules.length === 2 &&
      P0_SOLAR_TERM_PACK.allFrozen === true

    checks.push({
      id: 'rule-pack',
      name: 'Rule Pack',
      passed: pass,
      detail: `${P0_SOLAR_TERM_PACK.id} rules=${P0_SOLAR_TERM_PACK.rules.length} allFrozen=${P0_SOLAR_TERM_PACK.allFrozen}`,
    })
    expect(pass).toBe(true)
  })

  // ========== 3. Explain + Version + Confidence ==========
  it('Explain API 返回结构化解释与置信度', () => {
    const explain = explainSolarTerms(new Date(2026, 5, 15, 10, 30, 0), 2026)
    const conf = calculateConfidence({
      ruleStability: 100, casePassRate: 100, classicSupport: 100,
      ruleConsistency: 100, benchmarkAgreement: 100,
    })
    const pass =
      explain.version === 'explain-v1' &&
      explain.evidenceLevel === 'A' &&
      explain.rules.includes('RULE-PP-021') &&
      explain.rules.includes('RULE-PP-069') &&
      explain.references.length > 0 &&
      explain.reasons.length > 0 &&
      conf === 100

    checks.push({
      id: 'explain',
      name: 'Explain + Version + Confidence',
      passed: pass,
      detail: `version=${explain.version} evidence=${explain.evidenceLevel} confidence=${conf} rules=[${explain.rules.join(',')}]`,
    })
    expect(pass).toBe(true)
  })

  // ========== 4. Benchmark ==========
  it('Benchmark 权威节气基准 100% 一致', () => {
    const bench = runSolarTermBenchmark()
    const pass = bench.agreement === 100 && bench.isHealthy

    checks.push({
      id: 'benchmark',
      name: 'Benchmark (秒级精度)',
      passed: pass,
      detail: `${bench.passed}/${bench.total} agreement=${bench.agreement}%`,
    })
    expect(pass).toBe(true)
  })

  // ========== 5. Regression + Golden Dataset ==========
  it('Regression: 金标准命例全量通过', () => {
    const stats = getGoldenCaseStats()
    let allPass = true
    const failures: string[] = []

    for (const tc of GOLDEN_CASES) {
      const chart = calculateBaZi({
        birthDate: tc.birthDate,
        birthTime: tc.birthTime,
        gender: tc.gender,
      })
      const y = `${chart.sixLines.year.gan}${chart.sixLines.year.zhi}`
      const m = `${chart.sixLines.month.gan}${chart.sixLines.month.zhi}`
      const d = `${chart.sixLines.day.gan}${chart.sixLines.day.zhi}`
      const h = `${chart.sixLines.hour.gan}${chart.sixLines.hour.zhi}`
      if (y !== tc.expected.yearGanZhi || m !== tc.expected.monthGanZhi ||
          d !== tc.expected.dayGanZhi || h !== tc.expected.hourGanZhi) {
        allPass = false
        failures.push(tc.id)
      }
    }

    checks.push({
      id: 'regression',
      name: 'Regression + Golden Dataset',
      passed: allPass,
      detail: `${stats.total} cases (${stats.boundary} boundary) ${failures.length === 0 ? 'ALL PASS' : 'FAIL: ' + failures.join(',')}`,
    })
    expect(allPass).toBe(true)
  })

  // ========== 6. Snapshot ==========
  it('Snapshot SNAP-P0-01 已注册', () => {
    // 引用 P0_SNAPSHOT 触发模块副作用（registerSnapshot）
    expect(P0_SNAPSHOT.id).toBe('SNAP-P0-01')
    const snap = getSnapshot('SNAP-P0-01')
    const pass =
      !!snap &&
      snap.module === 'P0-①' &&
      snap.baseline === 'V4.8.1-Final' &&
      snap.rules.length === 2 &&
      snap.rules.every(r => r.frozen)

    checks.push({
      id: 'snapshot',
      name: 'Snapshot',
      passed: pass,
      detail: snap ? `${snap.id} rules=${snap.rules.length} baseline=${snap.baseline}` : 'NOT FOUND',
    })
    expect(pass).toBe(true)
  })

  // ========== 7. Feature Flag ==========
  it('Feature Flag ENABLE_SECOND_PRECISION 已启用', () => {
    const flags = getFeatureFlags()
    const pass = flags.ENABLE_SECOND_PRECISION === true && flags.ENABLE_EXPLAIN_API === true

    checks.push({
      id: 'feature-flag',
      name: 'Feature Flag',
      passed: pass,
      detail: `SECOND_PRECISION=${flags.ENABLE_SECOND_PRECISION} EXPLAIN_API=${flags.ENABLE_EXPLAIN_API}`,
    })
    expect(pass).toBe(true)
  })

  // ========== 8. Observability ==========
  it('Observability 指标可记录', () => {
    resetObservability()
    recordCall('solar-term-calc', 5, false)
    recordCall('solar-term-calc', 3, true)
    const sum = getObservabilitySummary()
    const pass = sum.trackedKeys >= 1 && sum.totalCalls === 2

    checks.push({
      id: 'observability',
      name: 'Observability',
      passed: pass,
      detail: `trackedKeys=${sum.trackedKeys} totalCalls=${sum.totalCalls}`,
    })
    expect(pass).toBe(true)
  })

  // ========== 9. Error Code ==========
  it('Error Code BZ-002 (节气数据不存在) 已定义', () => {
    const pass = !!ERROR_CODES['BZ-002'] && ERROR_CODES['BZ-002'].level === 'Error'

    checks.push({
      id: 'error-code',
      name: 'Error Code',
      passed: pass,
      detail: `BZ-002: ${ERROR_CODES['BZ-002']?.message}`,
    })
    expect(pass).toBe(true)
  })

  // ========== 10. Dashboard ==========
  it('Dashboard 规则统计可生成', () => {
    const dash = getDashboardSummary()
    const pass = typeof dash.coveragePercent === 'number'

    checks.push({
      id: 'dashboard',
      name: 'Dashboard',
      passed: pass,
      detail: `auditEnabled=${dash.auditEnabled} coverage=${dash.coveragePercent}%`,
    })
    expect(pass).toBe(true)
  })

  // ========== 11. 秒级精度核心验证 ==========
  it('核心：立春前后1秒年柱归属正确', () => {
    const lichun = getSolarTermDate(2026, '立春')
    const before = new Date(lichun.date.getTime() - 1000)
    const after = new Date(lichun.date.getTime() + 1000)
    const pass = !isAfterLiChun(before, 2026) && isAfterLiChun(after, 2026)

    checks.push({
      id: 'second-precision',
      name: '秒级精度（核心）',
      passed: pass,
      detail: `立春=${lichun.date.toISOString()} before→${!isAfterLiChun(before, 2026)} after→${isAfterLiChun(after, 2026)}`,
    })
    expect(pass).toBe(true)
  })

  // ========== 最终质量门汇总 ==========
  it('Quality Gate 汇总', () => {
    const result = runQualityGate('P0-①', 'V4.8.1-Final', checks)
    // eslint-disable-next-line no-console
    console.log(formatQualityGateReport(result))
    expect(result.passed).toBe(true)
    expect(result.checks.length).toBeGreaterThanOrEqual(11)
  })
})
