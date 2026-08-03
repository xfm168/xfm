import type { TenGodName, CombinationId, TenGodClassifierInput, CombinationVerdict } from '../types'
import { defaultTenGodClassifier, type TenGodClassifier } from '../tengodClassifier'
import { defaultTenGodCombinationEngine, type TenGodCombinationEngine } from '../combinations/engine'
import { defaultTenGodCaseDB, type TenGodCaseDB, type TenGodCase } from './casesDB'

export interface TenGodRegressionResult {
  caseId: string
  caseName: string
  expected: any
  actual: {
    dominantGods: TenGodName[]
    combinationHits: Array<{ id: string; name: string; satisfied: boolean; favorable: boolean }>
    score?: any
  }
  dominantGodsPass: boolean
  combinationsPass: boolean
  overallPass: boolean
}

export interface TenGodRegressionReport {
  total: number
  passed: number
  failed: number
  accuracy: number
  perTagStats: Record<string, { total: number; passed: number; acc: number }>
  perCombinationStats: Record<string, { total: number; passed: number }>
  results: TenGodRegressionResult[]
  failures: TenGodRegressionResult[]
  durationMs: number
}

export class TenGodRegressionRunner {
  constructor(
    private caseDB: TenGodCaseDB = defaultTenGodCaseDB,
    private classifier: TenGodClassifier = defaultTenGodClassifier,
    private combo: TenGodCombinationEngine = defaultTenGodCombinationEngine,
  ) {}

  async run(opts?: {
    scope?: 'smoke' | 'standard' | 'full'
    fromId?: string
    limit?: number
  }): Promise<TenGodRegressionReport> {
    const start = performance.now()
    const scope = opts?.scope ?? 'full'
    let cases = this.caseDB.all()

    if (scope === 'smoke') {
      cases = cases.slice(0, 30)
    } else if (scope === 'standard') {
      cases = cases.slice(0, 150)
    }

    if (opts?.fromId) {
      const idx = cases.findIndex(c => c.caseId === opts.fromId)
      if (idx >= 0) cases = cases.slice(idx)
    }
    if (opts?.limit && opts.limit > 0) {
      cases = cases.slice(0, opts.limit)
    }

    const results: TenGodRegressionResult[] = []
    const perTagStats: TenGodRegressionReport['perTagStats'] = {}
    const perCombinationStats: TenGodRegressionReport['perCombinationStats'] = {}

    let passed = 0
    const tagCounts: Record<string, number> = {}
    const tagPasses: Record<string, number> = {}
    const comboCounts: Record<string, number> = {}
    const comboPasses: Record<string, number> = {}

    for (const c of cases) {
      const res = this.evaluateCase(c)
      results.push(res)

      if (res.overallPass) passed++

      for (const tag of c.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
        if (res.overallPass) tagPasses[tag] = (tagPasses[tag] || 0) + 1
      }

      for (const expCombo of c.expected.keyCombinations) {
        comboCounts[expCombo.id] = (comboCounts[expCombo.id] || 0) + 1
        const actualHit = res.actual.combinationHits.find(h => h.id === expCombo.id)
        const comboPassed = actualHit && actualHit.satisfied === expCombo.satisfiedExpected
        if (comboPassed) comboPasses[expCombo.id] = (comboPasses[expCombo.id] || 0) + 1
      }
    }

    for (const tag of Object.keys(tagCounts)) {
      const t = tagCounts[tag]
      const p = tagPasses[tag] || 0
      perTagStats[tag] = { total: t, passed: p, acc: t > 0 ? p / t : 0 }
    }
    for (const cid of Object.keys(comboCounts)) {
      perCombinationStats[cid] = {
        total: comboCounts[cid],
        passed: comboPasses[cid] || 0,
      }
    }

    const total = cases.length
    const durationMs = performance.now() - start

    return {
      total,
      passed,
      failed: total - passed,
      accuracy: total > 0 ? passed / total : 0,
      perTagStats,
      perCombinationStats,
      results,
      failures: results.filter(r => !r.overallPass),
      durationMs,
    }
  }

  private evaluateCase(c: TenGodCase): TenGodRegressionResult {
    const input: TenGodClassifierInput = {
      dayGan: c.input.dayGan,
      monthZhi: c.input.monthZhi,
      fourPillars: c.input.fourPillars,
      dayGanWuxing: c.input.dayGanWuxing,
      monthZhiWuxing: c.monthZhiWuxing,
      dayStrength: c.input.dayStrength,
      dayRootCount: c.input.dayRootCount,
      isWinterBorn: c.input.isWinterBorn,
      isSummerBorn: c.input.isSummerBorn,
    }

    const classResult = this.classifier.classify(input)
    const dist = classResult.distribution

    const expectedDominant = c.expected.dominantTenGods
    const actualDominant = dist.dominantGods
    const overlap = expectedDominant.filter(g => actualDominant.includes(g))
    const dominantGodsPass = overlap.length >= 1

    const combinationHits: TenGodRegressionResult['actual']['combinationHits'] = []
    const verdicts = classResult.combinationVerdicts
    for (const exp of c.expected.keyCombinations) {
      const found = verdicts.find((v: CombinationVerdict) => v.id === exp.id)
      if (found) {
        combinationHits.push({
          id: found.id,
          name: found.name,
          satisfied: found.satisfied,
          favorable: found.favorable,
        })
      } else {
        combinationHits.push({
          id: exp.id,
          name: exp.name,
          satisfied: false,
          favorable: !!exp.favorable,
        })
      }
    }

    let combinationsPass = c.expected.keyCombinations.length === 0
    if (c.expected.keyCombinations.length >= 1) {
      for (let i = 0; i < c.expected.keyCombinations.length; i++) {
        const exp = c.expected.keyCombinations[i]
        const act = combinationHits[i]
        if (act && act.satisfied === exp.satisfiedExpected) {
          combinationsPass = true
          break
        }
      }
    }

    return {
      caseId: c.caseId,
      caseName: c.name,
      expected: c.expected,
      actual: {
        dominantGods: actualDominant,
        combinationHits,
        score: { perGod: dist.perGod, perGodWeighted: dist.perGodWeighted },
      },
      dominantGodsPass,
      combinationsPass,
      overallPass: dominantGodsPass && combinationsPass,
    }
  }

  formatReport(r: TenGodRegressionReport): string {
    const lines: string[] = []
    lines.push('==================================================')
    lines.push('  十神分类回归测试报告')
    lines.push('==================================================')
    lines.push(`总案例数: ${r.total}`)
    lines.push(`通过: ${r.passed}  失败: ${r.failed}`)
    lines.push(`准确率: ${(r.accuracy * 100).toFixed(2)}%`)
    lines.push(`耗时: ${r.durationMs.toFixed(1)} ms`)
    lines.push('')
    lines.push('---- 按类别统计 ----')
    for (const tag of Object.keys(r.perTagStats)) {
      const s = r.perTagStats[tag]
      lines.push(`  [${tag}] ${s.passed}/${s.total}  ${(s.acc * 100).toFixed(1)}%`)
    }
    lines.push('')
    lines.push('---- 按组合统计 ----')
    const comboEntries = Object.entries(r.perCombinationStats)
      .sort((a, b) => b[1].total - a[1].total)
    for (const [cid, s] of comboEntries) {
      lines.push(`  ${cid}: ${s.passed}/${s.total}`)
    }
    lines.push('')
    if (r.failures.length > 0) {
      lines.push('---- 失败案例 (前10条) ----')
      for (const f of r.failures.slice(0, 10)) {
        const reasons: string[] = []
        if (!f.dominantGodsPass) reasons.push('旺神不符')
        if (!f.combinationsPass) reasons.push('组合不符')
        lines.push(`  ${f.caseId} ${f.caseName}: ${reasons.join(', ')}`)
      }
      if (r.failures.length > 10) {
        lines.push(`  ... 另有 ${r.failures.length - 10} 条失败案例`)
      }
    }
    lines.push('==================================================')
    return lines.join('\n')
  }
}

export const defaultTenGodRegressionRunner = new TenGodRegressionRunner()
