import { PatternClassifier } from '../classifier'
import { GejuCaseDB, PatternCase } from './casesDB'
import type { ClassifierInput, Wuxing } from '../types'

export interface RegressionResult {
  caseId: string
  expected: { category: string; name: string }
  actual: { category: string | undefined; name: string; score: number; confidence?: number }
  passCategory: boolean
  passName: boolean
  pass: boolean
}

export interface RegressionReport {
  total: number
  passed: number
  failed: number
  categoryAccuracy: number
  nameAccuracy: number
  overallAccuracy: number
  results: RegressionResult[]
  failures: RegressionResult[]
  durationMs: number
  perCategoryStats: Record<string, { total: number; passed: number; acc: number }>
}

const GAN_WX_MAP: Record<string, Wuxing> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
  '庚': '金', '辛': '金', '壬': '水', '癸': '水',
}

const ZHI_WX_MAP: Record<string, Wuxing> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
}

function caseToInput(c: PatternCase): ClassifierInput {
  const pillars = [
    { gan: c.fourPillars.year.gan, zhi: c.fourPillars.year.zhi,
      ganWx: GAN_WX_MAP[c.fourPillars.year.gan] ?? c.dayGanWuxing,
      zhiWx: ZHI_WX_MAP[c.fourPillars.year.zhi] ?? c.monthZhiWuxing },
    { gan: c.fourPillars.month.gan, zhi: c.fourPillars.month.zhi,
      ganWx: GAN_WX_MAP[c.fourPillars.month.gan] ?? c.monthZhiWuxing,
      zhiWx: ZHI_WX_MAP[c.fourPillars.month.zhi] ?? c.monthZhiWuxing },
    { gan: c.fourPillars.day.gan, zhi: c.fourPillars.day.zhi,
      ganWx: GAN_WX_MAP[c.fourPillars.day.gan] ?? c.dayGanWuxing,
      zhiWx: ZHI_WX_MAP[c.fourPillars.day.zhi] ?? c.dayGanWuxing },
  ]
  if (c.fourPillars.hour) {
    pillars.push({
      gan: c.fourPillars.hour.gan, zhi: c.fourPillars.hour.zhi,
      ganWx: GAN_WX_MAP[c.fourPillars.hour.gan] ?? c.dayGanWuxing,
      zhiWx: ZHI_WX_MAP[c.fourPillars.hour.zhi] ?? c.monthZhiWuxing,
    })
  } else {
    pillars.push({ gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' })
  }

  const conflicts: Array<[Wuxing, Wuxing]> = []
  const ke: Array<[Wuxing, Wuxing]> = [['金', '木'], ['木', '土'], ['土', '水'], ['水', '火'], ['火', '金']]
  const total = Object.values(c.count).reduce((s, n) => s + n, 0) || 1
  for (const [a, b] of ke) {
    if (c.count[a] / total >= 0.15 && c.count[b] / total >= 0.15) {
      conflicts.push([a, b])
    }
  }

  return {
    dayGanWuxing: c.dayGanWuxing,
    monthZhiWuxing: c.monthZhiWuxing,
    count: c.count,
    fourPillars: pillars,
    dayStrength: c.dayStrength,
    dayGan: c.fourPillars.day.gan,
    monthZhi: c.fourPillars.month.zhi,
    dayRootCount: c.dayRootCount,
    isWinterBorn: c.isWinterBorn,
    isSummerBorn: c.isSummerBorn,
    conflictingPairs: conflicts.length > 0 ? conflicts : undefined,
  }
}

export class PatternRegressionRunner {
  constructor(
    private classifier = new PatternClassifier(),
    private caseDB = new GejuCaseDB()
  ) {}

  async run(options?: { scope?: 'smoke' | 'standard' | 'full'; fromId?: string; limit?: number }): Promise<RegressionReport> {
    const scope = options?.scope ?? 'full'
    const all = this.caseDB.all()
    let cases: PatternCase[] = all

    if (options?.fromId) {
      const idx = all.findIndex(c => c.caseId === options.fromId)
      if (idx >= 0) cases = all.slice(idx)
    }

    let limit = options?.limit
    if (scope === 'smoke') limit = limit ?? Math.min(15, cases.length)
    else if (scope === 'standard') limit = limit ?? Math.min(60, cases.length)
    else limit = limit ?? cases.length

    cases = cases.slice(0, limit)

    const start = performance.now()
    const results: RegressionResult[] = []

    for (const c of cases) {
      const input = caseToInput(c)
      const out = this.classifier.classify(input)
      const actualTop = out.candidates[0]
        ? { category: out.candidates[0].category, name: out.candidates[0].name, score: out.candidates[0].score, confidence: out.verdict?.confidence }
        : { category: undefined as string | undefined, name: '未判定', score: 0, confidence: 0 }

      const exp = c.expectedGeju
      const passCategory = actualTop.category === exp.category
      const passName = actualTop.name === exp.name
      const pass = passCategory && passName

      results.push({
        caseId: c.caseId,
        expected: { category: exp.category, name: exp.name },
        actual: actualTop,
        passCategory,
        passName,
        pass,
      })
    }

    const durationMs = performance.now() - start
    const total = results.length
    const passed = results.filter(r => r.pass).length
    const failed = total - passed
    const passCategoryCount = results.filter(r => r.passCategory).length
    const passNameCount = results.filter(r => r.passName).length

    const perCategoryStats: Record<string, { total: number; passed: number; acc: number }> = {}
    for (const r of results) {
      const key = r.expected.category
      if (!perCategoryStats[key]) perCategoryStats[key] = { total: 0, passed: 0, acc: 0 }
      perCategoryStats[key].total += 1
      if (r.pass) perCategoryStats[key].passed += 1
    }
    for (const k of Object.keys(perCategoryStats)) {
      const s = perCategoryStats[k]
      s.acc = s.total > 0 ? s.passed / s.total : 0
    }

    return {
      total,
      passed,
      failed,
      categoryAccuracy: total > 0 ? passCategoryCount / total : 0,
      nameAccuracy: total > 0 ? passNameCount / total : 0,
      overallAccuracy: total > 0 ? passed / total : 0,
      results,
      failures: results.filter(r => !r.pass),
      durationMs,
      perCategoryStats,
    }
  }

  formatReport(r: RegressionReport): string {
    const lines: string[] = []
    lines.push('═'.repeat(64))
    lines.push(`  XuanFengMen · 格局回归测试报告  (N=${r.total})`)
    lines.push('═'.repeat(64))
    lines.push(`  耗时           : ${r.durationMs.toFixed(2)} ms`)
    lines.push(`  平均/用例      : ${r.total > 0 ? (r.durationMs / r.total).toFixed(2) : '0.00'} ms`)
    lines.push('─' * 64)
    lines.push(`  Category 准确率: ${(r.categoryAccuracy * 100).toFixed(1)}%  (${r.total - Math.round(r.categoryAccuracy * r.total)} 错类)`)
    lines.push(`  Name     准确率: ${(r.nameAccuracy * 100).toFixed(1)}%  (${r.total - Math.round(r.nameAccuracy * r.total)} 错名)`)
    lines.push(`  Overall  准确率: ${(r.overallAccuracy * 100).toFixed(1)}%  (${r.passed} / ${r.total} 通过)`)
    lines.push('─' * 64)
    lines.push('  分类统计:')
    const catOrder = ['zheng', 'zhencong', 'jiacong', 'zhuanwang', 'yiqi', 'huaqi', 'tiaohou', 'bingyao', 'tongguan', 'fuyi']
    for (const cat of catOrder) {
      const s = r.perCategoryStats[cat]
      if (!s) continue
      const pct = (s.acc * 100).toFixed(0).padStart(3, ' ')
      lines.push(`    ${cat.padEnd(10, ' ')} : ${String(s.passed).padStart(2, ' ')}/${s.total}  (${pct}%)`)
    }
    if (r.failures.length > 0) {
      lines.push('─' * 64)
      lines.push(`  失败案例 Top${Math.min(10, r.failures.length)}:`)
      for (const f of r.failures.slice(0, 10)) {
        lines.push(`    [${f.caseId}] 期望:${f.expected.name}  实际:${f.actual.name}(score=${f.actual.score})`)
      }
    }
    lines.push('═'.repeat(64))
    return lines.join('\n')
  }
}

export const defaultPatternRegressionRunner = new PatternRegressionRunner()
