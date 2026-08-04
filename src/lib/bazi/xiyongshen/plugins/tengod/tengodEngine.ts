import type {
  TenGodName,
  TenGodClassifierInput,
  CombinationVerdict,
  TenGodScoreResult,
  TenGodEvidenceReport,
  TenGodClassifierResult,
} from './types'
import { defaultTenGodClassifier, type TenGodClassifier } from './tengodClassifier'
import { defaultTenGodPriorityMatrix, type TenGodPriorityMatrix } from './priority/matrix'
import { defaultTenGodCombinationEngine } from './combinations/engine'
import { defaultTenGodCitationsDB, CLASSIC_INFO_8, type ClassicCode8 } from './citations/citationsDB'
import { formatCitation } from './evidence/citationFormat'
import { defaultTenGodScorer } from './score/tenGodScore'
import { defaultTenGodEvidenceBuilder } from './evidence/builder'

const ALL_TEN_GODS: TenGodName[] = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印']

/** 古籍代码 → 古籍名映射（用于 rule.references 中 classicCode 翻译） */
const CLASSIC_CODE_TO_NAME: Record<string, string> = Object.fromEntries(
  (Object.entries(CLASSIC_INFO_8) as Array<[ClassicCode8, { name: string }]>).map(([k, v]) => [k, v.name])
)

export interface TenGodPerGodScores {
  god: TenGodName
  score: number
}

export interface TenGodEngineResult {
  engineName: 'TenGodEngine V2.0'
  weight: number
  scores: Record<TenGodName, number>
  combinationScores: Record<string, number>
  overallWangJi: Record<'喜' | '忌' | '闲', TenGodName[]>
  dominantCombinations: Array<{
    id: string
    name: string
    score: number
    favorable: boolean
  }>
  evidence: Array<{
    step: string
    text: string
    satisfied: boolean
    citation?: string
    weight?: number
  }>
  evidenceReport?: TenGodEvidenceReport
  classicEvidence?: any[]
  confidence: number
  metadata?: any
}

function buildFallbackScore(
  dist: any,
  verdicts: CombinationVerdict[]
): TenGodScoreResult {
  const perGod = {} as Record<TenGodName, number>
  ALL_TEN_GODS.forEach(g => perGod[g] = 0)
  const perCombination: Record<string, number> = {}
  let overall = 0
  for (const v of verdicts) {
    const base = v.satisfied ? v.score * v.weight : (v.hits / Math.max(1, v.required)) * v.score * v.weight * 0.3
    perCombination[v.id as string] = v.favorable ? base : -base
    overall += perCombination[v.id as string]
    const rule = defaultTenGodCombinationEngine.getRule(v.id)
    if (rule && v.satisfied) {
      const sign = v.favorable ? 1 : -1
      const boost = (v.confidence * v.weight) / Math.max(1, rule.requires.length)
      for (const req of rule.requires) {
        perGod[req] += sign * boost * 1.5
      }
    }
  }
  for (const g of ALL_TEN_GODS) {
    const c = dist?.perGod?.[g] || 0
    const w = dist?.perGodWeighted?.[g] || 0
    let s = perGod[g] || 0
    s += w * 0.3
    if (dist?.tianGanFlags?.[g]) s += 0.3
    if (dist?.hasMonthZhiBenQi?.[g]) s += 0.5
    if (c === 0) s -= 0.5
    perGod[g] = Math.max(-3, Math.min(3, s * 0.8))
  }
  const favorable = verdicts.filter(v => v.satisfied && v.favorable).length
  const unfavorable = verdicts.filter(v => v.satisfied && !v.favorable).length
  overall = Math.max(-100, Math.min(100, overall + (favorable - unfavorable) * 15))
  return {
    perGod,
    perCombination,
    overall,
    breakdown: {
      favorableCount: favorable,
      unfavorableCount: unfavorable,
      totalCount: dist?.totalCount || 0,
      // P1.2.1-A3: fallback 评分同样写入 breakdown.perGod 规范路径
      perGod,
    } as any,
  }
}

type EvidenceStepOut = { step: string; text: string; satisfied: boolean; citation?: string; weight?: number }
function buildFallbackEvidence(
  input: TenGodClassifierInput,
  dist: any,
  verdicts: CombinationVerdict[],
  cls: TenGodClassifierResult,
  score: TenGodScoreResult
): { report: TenGodEvidenceReport; steps: EvidenceStepOut[] } {
  const total = dist?.totalCount || 0
  const top3 = dist?.dominantGods?.slice(0, 3) || []
  const topN = top3.reduce((s: number, g: TenGodName) => s + (dist?.perGod?.[g] || 0), 0)
  const topRatio = total > 0 ? topN / total : 0
  const sat1 = topRatio >= 0.35
  const w1 = topRatio * 2

  const wang = dist?.dominantGods?.slice(0, 3) || []
  const lines2 = wang.map((g: TenGodName) => `${g}(${dist?.perGod?.[g] || 0}次, 加${(dist?.perGodWeighted?.[g] || 0).toFixed(1)})`)
  const monthHit = wang.some((g: TenGodName) => dist?.hasMonthZhiBenQi?.[g])
  const w2 = wang.length * 0.3

  const weak = dist?.weakGods?.slice(0, 4) || []
  const missing = weak.filter((g: TenGodName) => (dist?.perGod?.[g] || 0) === 0)
  const sat3 = weak.length === 0
  const w3 = (weak.length * 0.2 + missing.length * 0.3)

  const fav = verdicts.filter(v => v.satisfied && v.favorable).sort((a, b) => b.score - a.score)
  const topFav = fav.slice(0, 3)
  const wFav = fav.reduce((s, v) => s + v.weight * v.confidence, 0)
  const sat4 = fav.length > 0
  const linesFav = topFav.map(v => `${v.name}(置信${(v.confidence * 100).toFixed(0)}%)`)

  const unfav = verdicts.filter(v => v.satisfied && !v.favorable).sort((a, b) => b.score - a.score)
  const topUnf = unfav.slice(0, 3)
  const wUnf = unfav.reduce((s, v) => s + v.weight * v.confidence, 0)
  const sat5 = unfav.length === 0
  const linesUnf = topUnf.map(v => `${v.name}(置信${(v.confidence * 100).toFixed(0)}%)`)

  const formed = verdicts.filter(v => v.satisfied).sort((a, b) => b.score - a.score)
  let text6 = ''
  let sat6 = false
  let w6 = 0.8
  if (formed.length === 0) {
    text6 = '无充分成立之组合，按旺衰与喜忌常规策略处理'
    sat6 = false
    w6 = 0.1
  } else {
    const top = formed[0]
    const next = formed[1]
    text6 = `最强：${top.name}（评分${top.score.toFixed(0)}/${top.weight}权重）`
    if (next) {
      const gap = top.score - next.score
      text6 += `；次强${next.name}，分差${gap.toFixed(0)}。${gap >= 15 ? '主次分明' : '组合并现，需合参'}`
      sat6 = gap >= 15
    } else {
      sat6 = true
    }
  }

  const refs: string[] = []
  const formedN = verdicts.filter(v => v.satisfied).slice(0, 2)
  for (const v of formedN) {
    const arr = defaultTenGodCitationsDB.byCombination(v.id as string)
    if (arr && arr.length > 0) {
      refs.push(formatCitation(arr[0].classicName, `${arr[0].chapter}§${arr[0].paragraph}`, arr[0].originalText))
    } else {
      const rule = defaultTenGodCombinationEngine.getRule(v.id)
      if (rule && rule.references && rule.references.length > 0) {
        const ref = rule.references[0]
        const classicName = CLASSIC_CODE_TO_NAME[ref.classicCode] ?? ref.classicCode
        refs.push(formatCitation(classicName, `§${ref.paragraph ?? 0}`, ref.quote))
      }
    }
  }
  if (refs.length === 0) {
    refs.push('本判定参照《渊海子平》《子平真诠》《滴天髓》《三命通会》正统十神组合体系。')
  }
  const sat7 = refs.length >= 2
  const w7 = 0.5

  const stepsSimple: EvidenceStepOut[] = [
    { step: '十神旺衰', text: `旺神${top3.join('、') || '无'}共占${topN}/${total}=${(topRatio * 100).toFixed(0)}%，${sat1 ? '旺衰格局清晰' : '旺衰不明显，偏平衡'}`, satisfied: sat1, weight: w1 },
    { step: '旺神统计', text: `TOP旺神：${lines2.join('；') || '无'}。${monthHit ? '得月令提纲之力' : ''}`, satisfied: wang.length > 0, weight: w2 },
    { step: '衰神统计', text: `衰神：${weak.join('、') || '无'}。缺神：${missing.join('、') || '无'}。`, satisfied: sat3, weight: w3 },
    { step: '组合吉', text: `命中吉格${fav.length}项：${linesFav.join('；') || '（无）'}。吉格总权重${wFav.toFixed(2)}`, satisfied: sat4, citation: sat4 ? formatCitation('子平真诠', '论十神配合', '吉格成则富贵可期，凶格破则贫贱可忧。') : undefined, weight: wFav },
    { step: '组合凶', text: `命中凶格${unfav.length}项：${linesUnf.join('；') || '（无）'}。凶格总权重${wUnf.toFixed(2)}`, satisfied: sat5, citation: !sat5 ? formatCitation('渊海子平', '论凶格', '凶格成则为祸百端，看其有无制化。') : undefined, weight: wUnf },
    { step: '优先级裁决', text: text6, satisfied: sat6, weight: w6 },
    { step: '古籍佐证', text: refs.join(' '), satisfied: sat7, weight: w7 },
  ]
  stepsSimple.push({
    step: '喜忌判定',
    text: `综合评分 ${score.overall.toFixed(1)}，旺神：${(cls?.wangGods || []).join('、') || '无'}；弱神：${(cls?.weakGods || []).join('、') || '无'}；平衡度：${cls?.balanceLevel || '未知'}`,
    satisfied: Math.abs(score.overall) >= 10,
    weight: 0.8,
  })

  const positiveWeight = stepsSimple.filter(s => s.satisfied).reduce((s, x) => s + (x.weight || 0), 0) + w2
  const negativeWeight = stepsSimple.filter(s => !s.satisfied).reduce((s, x) => s + (x.weight || 0), 0) + w3
  const netWeight = positiveWeight - negativeWeight
  const balanceScore = Math.max(0, Math.min(100, 50 + netWeight * 10))

  const reportSteps = stepsSimple.map((s, idx) => ({
    stepId: `E${idx + 1}`,
    stepName: s.step,
    text: s.text,
    satisfied: s.satisfied,
    citation: s.citation,
    weight: s.weight,
  }))
  const report: TenGodEvidenceReport = {
    steps: reportSteps,
    byKind: {
      wangShuai: reportSteps.slice(0, 3),
      combination: reportSteps.slice(3, 5),
      priority: [reportSteps[5]],
      classic: [reportSteps[6]],
    },
    positiveWeight,
    negativeWeight,
    netWeight,
    balanceScore,
  }
  return { report, steps: stepsSimple }
}

export class TenGodEngine {
  readonly name = 'TenGodEngine V2.0' as const
  readonly weight = 1.5

  constructor(
    private classifier: TenGodClassifier = defaultTenGodClassifier,
    private scorer: any = undefined,
    private evidenceBuilder: any = undefined,
    private priority: TenGodPriorityMatrix = defaultTenGodPriorityMatrix
  ) {}

  evaluate(input: TenGodClassifierInput): TenGodEngineResult {
    const dist = this.classifier.computeDistribution(input)
    const classifierResult = this.classifier.classify(input)
    const verdicts = classifierResult.combinationVerdicts

    let score: TenGodScoreResult
    try {
      if (this.scorer && typeof this.scorer.score === 'function') {
        score = this.scorer.score(input, dist, verdicts) as TenGodScoreResult
      } else if (this.scorer && typeof this.scorer.compute === 'function') {
        const scored = buildFallbackScore(dist, verdicts)
        score = scored
      } else {
        score = buildFallbackScore(dist, verdicts)
      }
    } catch (_) {
      score = buildFallbackScore(dist, verdicts)
    }

    let er: TenGodEvidenceReport
    let evidenceSteps: EvidenceStepOut[]
    try {
      let builtReport: TenGodEvidenceReport | undefined
      if (this.evidenceBuilder && typeof this.evidenceBuilder.build === 'function') {
        try {
          const maybeReport = this.evidenceBuilder.build(input, dist, verdicts)
          if (maybeReport && Array.isArray(maybeReport.steps)) {
            builtReport = maybeReport as TenGodEvidenceReport
          }
        } catch (_) { builtReport = undefined }
      }
      const fallback = buildFallbackEvidence(input, dist, verdicts, classifierResult, score)
      if (builtReport) {
        er = builtReport
        evidenceSteps = builtReport.steps.map(s => ({
          step: s.stepName || s.stepId,
          text: s.text,
          satisfied: s.satisfied,
          citation: s.citation,
          weight: s.weight,
        }))
      } else {
        er = fallback.report
        evidenceSteps = fallback.steps
      }
    } catch (_) {
      const f = buildFallbackEvidence(input, dist, verdicts, classifierResult, score)
      er = f.report
      evidenceSteps = f.steps
    }

    const scores = this.computeScores(score, dist, verdicts)
    const combinationScores = this.computeCombinationScores(score, verdicts)
    const overallWangJi = this.computeWangJi(scores, classifierResult)
    const dominantCombinations = this.computeDominantCombinations(verdicts)
    const classicEvidence = this.buildClassicEvidence(verdicts)
    const confidence = this.computeConfidence(er, score, verdicts)

    return {
      engineName: 'TenGodEngine V2.0',
      weight: this.weight,
      scores,
      combinationScores,
      overallWangJi,
      dominantCombinations,
      evidence: evidenceSteps,
      evidenceReport: er,
      classicEvidence,
      confidence,
      metadata: {
        distribution: dist,
        classifierResult,
        scoreResult: score,
        favorableCount: verdicts.filter(v => v.satisfied && v.favorable).length,
        unfavorableCount: verdicts.filter(v => v.satisfied && !v.favorable).length,
      },
    }
  }

  private computeScores(
    score: TenGodScoreResult,
    dist: any,
    _verdicts: CombinationVerdict[]
  ): Record<TenGodName, number> {
    const out = {} as Record<TenGodName, number>
    ALL_TEN_GODS.forEach(g => out[g] = 0)
    for (const g of ALL_TEN_GODS) {
      let s = score.perGod[g] || 0
      const w = dist?.perGodWeighted?.[g] || 0
      const c = dist?.perGod?.[g] || 0
      s += w * 0.15
      if (c === 0) s -= 0.8
      out[g] = Math.max(-3, Math.min(3, s))
    }
    return out
  }

  private computeCombinationScores(
    score: TenGodScoreResult,
    verdicts: CombinationVerdict[]
  ): Record<string, number> {
    const out: Record<string, number> = {}
    for (const v of verdicts) {
      const base = score.perCombination?.[v.id as string] ?? (
        v.satisfied
          ? (v.favorable ? 1 : -1) * v.score * v.weight
          : (v.favorable ? 1 : -1) * v.score * v.weight * (v.hits / Math.max(1, v.required)) * 0.3
      )
      out[v.id as string] = base
    }
    return out
  }

  private computeWangJi(
    scores: Record<TenGodName, number>,
    _cr: TenGodClassifierResult
  ): Record<'喜' | '忌' | '闲', TenGodName[]> {
    const yong: TenGodName[] = []
    const ji: TenGodName[] = []
    const xian: TenGodName[] = []
    for (const g of ALL_TEN_GODS) {
      const s = scores[g] || 0
      if (s >= 0.6) yong.push(g)
      else if (s <= -0.6) ji.push(g)
      else xian.push(g)
    }
    if (yong.length === 0) {
      const sorted = [...ALL_TEN_GODS].sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
      yong.push(...sorted.slice(0, 2))
      xian.push(...sorted.slice(2, 6))
      ji.push(...sorted.slice(6))
    }
    return { 喜: yong, 忌: ji, 闲: xian }
  }

  private computeDominantCombinations(
    verdicts: CombinationVerdict[]
  ): Array<{ id: string; name: string; score: number; favorable: boolean }> {
    const formed = verdicts
      .filter(v => v.satisfied)
      .sort((a, b) => {
        const wa = a.score * a.weight * (a.favorable ? 1 : 0.9)
        const wb = b.score * b.weight * (b.favorable ? 1 : 0.9)
        return wb - wa
      })
    const out: Array<{ id: string; name: string; score: number; favorable: boolean }> = []
    for (let i = 0; i < formed.length && out.length < 6; i++) {
      let add = true
      for (let j = 0; j < out.length; j++) {
        const a = { id: out[j].id, score: out[j].score, favorable: out[j].favorable }
        const b = { id: formed[i].id, score: formed[i].score, favorable: formed[i].favorable }
        try {
          const r = this.priority.resolve(a, b)
          if (r.winner === 'A' && b.id === formed[i].id) {
            add = false
            break
          }
        } catch (_) {}
      }
      if (add) {
        out.push({
          id: formed[i].id as string,
          name: formed[i].name,
          score: formed[i].score,
          favorable: formed[i].favorable,
        })
      }
    }
    if (out.length === 0) {
      const top = [...verdicts].sort((a, b) => (b.hits / Math.max(1, b.required)) - (a.hits / Math.max(1, a.required))).slice(0, 3)
      for (const v of top) {
        out.push({
          id: v.id as string,
          name: v.name,
          score: v.score,
          favorable: v.favorable,
        })
      }
    }
    return out
  }

  private buildClassicEvidence(verdicts: CombinationVerdict[]): any[] {
    const out: any[] = []
    const cites = defaultTenGodCitationsDB
    const formed = verdicts.filter(v => v.satisfied).slice(0, 3)
    for (const v of formed) {
      const arr = cites.byCombination(v.id as string)
      if (arr && arr.length > 0) {
        for (const c of arr.slice(0, 2)) {
          out.push({
            combinationId: v.id,
            combinationName: v.name,
            classicCode: c.classicCode,
            quote: c.originalText,
          })
        }
      } else {
        const rule = defaultTenGodCombinationEngine.getRule(v.id)
        if (rule && rule.references) for (const c of rule.references.slice(0, 2)) {
          out.push({
            combinationId: v.id,
            combinationName: v.name,
            classicCode: c.classicCode,
            quote: c.quote,
          })
        }
      }
    }
    if (out.length < 2) {
      const backup = [
        { classicCode: 'YSX', quote: '十神乃八字之骨架，组合为命理之精髓。', combinationName: '总论十神' },
        { classicCode: 'ZYQ', quote: '子平之法，专以十神定兴衰，以组合辨吉凶。', combinationName: '子平真诠总论' },
      ]
      for (const b of backup) {
        if (out.length < 4) out.push(b)
      }
    }
    return out
  }

  private computeConfidence(
    er: TenGodEvidenceReport,
    _score: TenGodScoreResult,
    verdicts: CombinationVerdict[]
  ): number {
    const base = (er?.balanceScore ?? 50) / 100
    const formedCount = verdicts.filter(v => v.satisfied).length
    const formedRatio = formedCount / Math.max(1, verdicts.length)
    const formedQuality = formedCount > 0
      ? verdicts.filter(v => v.satisfied).reduce((s, v) => s + v.confidence * v.weight, 0) / formedCount
      : 0
    const net = ((er?.netWeight ?? 0) + 3) / 6
    const c = base * 0.4 + formedRatio * 0.2 + Math.min(1, formedQuality) * 0.25 + Math.max(0, Math.min(1, net)) * 0.15
    return Math.max(0.1, Math.min(0.98, c))
  }
}

export const defaultTenGodEngine = new TenGodEngine(
  defaultTenGodClassifier,
  defaultTenGodScorer,
  defaultTenGodEvidenceBuilder,
  defaultTenGodPriorityMatrix,
)
