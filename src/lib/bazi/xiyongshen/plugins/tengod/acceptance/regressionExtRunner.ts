import { defaultTenGodRegressionRunner, defaultTenGodCaseDB } from '../regression'
import { defaultTenGodExplainBuilder, defaultTenGodClassifier, defaultTenGodEngine, defaultTenGodEvidenceBuilder } from '..'
import type { RegressionExtReport } from './types'

const EXPLAIN_KEYWORDS = [
  '旺衰', '组合', '生克', '古籍', '喜忌', 'Why旺', 'Why弱', '制化', '流通', '平衡',
]

const CONFLICT_NEGATIVE_COMBOS = [
  'xiaoShenDuoShi', 'shangGuanJianGuan', 'guanShaHunZa',
  'biJieDuoCai', 'caiPoYin', 'yinShaXiangZhan',
]

export class RegressionExtRunner {
  static explainScoreForMarkdown(md: string): number {
    if (!md) return 0
    let score = 0
    for (const kw of EXPLAIN_KEYWORDS) {
      if (md.includes(kw)) score += 10
    }
    const additional = [
      /Why旺|旺神.*当旺|十神旺衰/,
      /Why弱|衰弱.*缺神/,
      /喜忌|用神|忌神/,
      /制化|食神制杀|伤官佩印|杀印相生/,
      /流通|循环相生|财官印/,
      /平衡|中和|偏倾/,
      /古籍|渊海子平|子平真诠|滴天髓|三命通会|穷通宝鉴/,
      /组合.*成立|吉格|凶格/,
    ]
    for (const re of additional) {
      if (re.test(md)) score = Math.min(100, score + 2)
    }
    return Math.min(100, score)
  }

  static evidenceCategoriesCount(caseRun: any): number {
    if (!caseRun) return 0
    const evidences = caseRun.evidenceReport?.evidences || caseRun.evidenceReport?.byKind || caseRun.evidence || []
    if (Array.isArray(evidences)) {
      const kinds = new Set<string>()
      for (const e of evidences) {
        if (e.kind) kinds.add(e.kind)
        else if (e.step && typeof e.step === 'string') kinds.add(e.step.slice(0, 4))
      }
      return kinds.size
    }
    if (typeof evidences === 'object') {
      return Object.keys(evidences).filter(k => Array.isArray((evidences as any)[k]) && (evidences as any)[k].length > 0).length
    }
    return 0
  }

  static async run(scope: 'standard' | 'full' = 'full'): Promise<RegressionExtReport> {
    const baseReport = await defaultTenGodRegressionRunner.run({ scope: scope as any })

    const failures: RegressionExtReport['failures'] = []
    if (baseReport.failures && Array.isArray(baseReport.failures)) {
      for (const f of baseReport.failures) {
        const reasons: string[] = []
        if (f.dominantGodsPass === false) reasons.push('旺神判定不符')
        if (f.combinationsPass === false) reasons.push('组合判定不符')
        failures.push({
          caseId: f.caseId,
          caseName: f.caseName,
          reason: reasons.join('、') || '未达预期',
        })
      }
    }

    let casesPool: any[] = []
    try {
      casesPool = defaultTenGodCaseDB?.all?.() || []
    } catch (_) { casesPool = [] }
    const totalCases = casesPool.length
    const sampleSize = totalCases < 500 ? totalCases : Math.max(50, Math.floor(totalCases * 0.1))
    const sampleCases = totalCases < 500 ? casesPool : casesPool.slice(0, sampleSize)

    let explainSum = 0
    let explainCount = 0
    let evidenceCompleteCount = 0
    let conflictCount = 0

    const explainScoresPerTag: Record<string, { sum: number; count: number }> = {}

    for (const c of sampleCases) {
      try {
        const input = c.input || {
          dayGan: c.fourPillars?.day?.gan,
          monthZhi: c.fourPillars?.month?.zhi,
          fourPillars: c.fourPillars
            ? [c.fourPillars.year, c.fourPillars.month, c.fourPillars.day, c.fourPillars.hour].filter(Boolean).map((p: any) => ({ gan: p.gan, zhi: p.zhi }))
            : [],
        }

        const cls = defaultTenGodClassifier.classify(input)
        const ev = defaultTenGodEngine.evaluate(input)
        // Build fresh 9-category evidence via native builder for completeness check
        let builderEv: any = null
        try {
          builderEv = defaultTenGodEvidenceBuilder.build(input, cls.distribution, cls.combinationVerdicts)
        } catch (_) {}

        const md = defaultTenGodExplainBuilder.build({
          input,
          distribution: cls.distribution,
          score: (ev as any).metadata?.scoreResult ?? { perGod: {}, perCombination: {}, overall: 0 },
          combinationVerdicts: cls.combinationVerdicts,
          priorityMatrix: { resolve: () => ({ winner: 'TIE', reason: '' }), list: () => [] },
          evidenceReport: (ev as any).evidenceReport,
        })

        const score = RegressionExtRunner.explainScoreForMarkdown(md?.fullMarkdown || '')
        explainSum += score
        explainCount++

        const tags = c.tags || []
        for (const t of tags) {
          if (!explainScoresPerTag[t]) explainScoresPerTag[t] = { sum: 0, count: 0 }
          explainScoresPerTag[t].sum += score
          explainScoresPerTag[t].count++
        }

        let evCatCount = RegressionExtRunner.evidenceCategoriesCount(ev as any)
        if (builderEv) {
          const builderCount = RegressionExtRunner.evidenceCategoriesCount({ evidenceReport: builderEv } as any)
          evCatCount = Math.max(evCatCount, builderCount)
        }
        if (evCatCount >= 6) evidenceCompleteCount++

        const unfavorableHigh = cls.combinationVerdicts.filter(
          (v: any) => !v.favorable && v.satisfied && CONFLICT_NEGATIVE_COMBOS.includes(v.id) && v.confidence >= 0.6
        )
        if (unfavorableHigh.length >= 2) conflictCount++
      } catch (_) {}
    }

    const perTag: RegressionExtReport['perTag'] = {}
    if (baseReport.perTagStats) {
      for (const tag of Object.keys(baseReport.perTagStats)) {
        const base = baseReport.perTagStats[tag]
        const expl = explainScoresPerTag[tag]
        perTag[tag] = {
          total: base.total,
          passed: base.passed,
          acc: base.acc,
          explainAvg: expl && expl.count > 0 ? Number((expl.sum / expl.count).toFixed(1)) : 0,
        }
      }
    }

    const perCombination: RegressionExtReport['perCombination'] = {}
    if (baseReport.perCombinationStats) {
      for (const cid of Object.keys(baseReport.perCombinationStats)) {
        const cs = baseReport.perCombinationStats[cid]
        perCombination[cid] = {
          total: cs.total,
          passed: cs.passed || 0,
          acc: cs.total > 0 ? (cs.passed || 0) / cs.total : 0,
        }
      }
    }

    const total = baseReport.total || 0
    const passed = baseReport.passed || 0
    const accuracy = total > 0 ? passed / total : 0
    const sampleDenom = sampleCases.length > 0 ? sampleCases.length : 1

    return {
      total,
      passed,
      failed: total - passed,
      accuracy: Number(accuracy.toFixed(4)),
      conflictRate: Number((conflictCount / sampleDenom).toFixed(4)),
      misjudgeRate: Number((1 - accuracy).toFixed(4)),
      explainAvgScore: explainCount > 0 ? Number((explainSum / explainCount).toFixed(1)) : 0,
      evidenceCompleteRate: Number((evidenceCompleteCount / sampleDenom).toFixed(4)),
      perTag,
      perCombination,
      failures,
    }
  }
}

export default RegressionExtRunner
