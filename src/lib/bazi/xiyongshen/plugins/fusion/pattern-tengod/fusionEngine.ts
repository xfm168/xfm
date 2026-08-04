/**
 * P1.2.2 — 格局×十神 Fusion Engine（核心流水线）
 *
 *  流程：
 *  Pattern SubEngineResult + TenGod EngineResult
 *         ↓ (S2 evidenceMerge)
 *      Evidence Merge  →  PatternTenGodEvidence + Tree
 *         ↓ (S3 priorityMatrix)
 *       Priority Matrix  →  联合结构权重
 *         ↓ (S4 conflictResolver)
 *      Conflict Resolver →  冲突报告 & 调整后权重
 *         ↓ (S5 fusionEngine)
 *      FusionDecisionResult  →  主结构 / 支撑 / 冲突 / 权重 / 解释 / SubEngineResult
 *
 *  Fusion Engine 输出：
 *    1) FusionDecisionResult（供 FusionPlugin 消费解释）
 *    2) SubEngineResult（符合统一规范，传给 Unified Decision Core V3）
 */
import type { SubEngineResult, SubEngineInput } from '../../../../engines/types'
import type { Wuxing } from '../../../pattern/types'
import type {
  FusionDecisionResult,
  FusionDominantStructure,
  FusionInput,
  PatternTag,
  PriorityMatrixResult,
  ConflictResolverResult,
  PatternTenGodEvidence,
  PatternTenGodEvidenceTree,
} from './types'
import type { TenGodClassifierResult, TenGodName } from '../../../tengod/types'
import type { PatternClassifierResult } from '../../../pattern/types'
import type { TenGodEngineResult } from '../../../tengod/tengodEngine'

import { mergeEvidence } from './evidenceMerge'
import { classifyPriorityMatrix, extractPatternCategory, extractDayStrength, getBangShenSet, getGongShenSet, inferCategoryFromTenGods } from './priorityMatrix'
import { resolvePatternTenGodConflict } from './conflictResolver'

const WX_LIST: Wuxing[] = ['木', '火', '土', '金', '水']
const BANG_SHEN = getBangShenSet()
const GONG_SHEN = getGongShenSet()

function emptyScores(): Record<Wuxing, number> {
  return { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
}

function suggestWuxing(
  dist: TenGodClassifierResult['distribution'] | undefined,
  tag: PatternTag | string,
  strongOrWeak: '强' | '弱'
): { favorable: Wuxing[]; unfavorable: Wuxing[] } {
  const favorable: Wuxing[] = []
  const unfavorable: Wuxing[] = []
  const bangs = [...BANG_SHEN]
  const gongs = [...GONG_SHEN]

  // Tag 优先决定喜忌
  const TAG_WX_PREF: Record<string, { fav: Wuxing[]; unfav: Wuxing[] }> = {
    'qi-sha-wang': { fav: ['金', '水'], unfav: ['火'] },
    'qi-sha-yin-xiang-sheng': { fav: ['水', '木'], unfav: ['金'] },
    'qi-shi-zhi-sha': { fav: ['火'], unfav: ['火'] },
    'qi-sha-wu-zhi': { fav: ['金', '水'], unfav: ['金'] },
    'shang-guan-jian-guan': { fav: ['木'], unfav: ['金', '水'] },
    'shang-guan-pei-yin': { fav: ['水'], unfav: ['土'] },
    'shang-guan-sheng-cai': { fav: ['土'], unfav: ['木', '金'] },
    'cai-wang-shen-ruo': { fav: ['木', '水'], unfav: ['土', '火'] },
    'cai-wang-shen-qiang': { fav: ['土', '火'], unfav: ['木'] },
    'cai-guan-xiang-sheng': { fav: ['土', '火', '金'], unfav: ['木', '水'] },
    'yin-wang-shen-ruo': { fav: ['土', '火'], unfav: ['水'] },
  }
  const pref = TAG_WX_PREF[tag as string]
  if (pref) {
    favorable.push(...pref.fav)
    unfavorable.push(...pref.unfav)
  } else {
    // 默认：身弱喜比劫印，身强喜食伤财官
    if (strongOrWeak === '弱') {
      favorable.push('水', '木')
      unfavorable.push('金', '火', '土')
    } else {
      favorable.push('火', '土', '金')
      unfavorable.push('水', '木')
    }
  }

  // 去重保序
  const setFav = new Set<Wuxing>()
  const setUnfav = new Set<Wuxing>()
  for (const w of favorable) setFav.add(w)
  for (const w of unfavorable) setUnfav.add(w)
  // 避免同时在喜忌两边
  for (const w of WX_LIST) {
    if (setFav.has(w) && setUnfav.has(w)) {
      setUnfav.delete(w)
    }
  }
  return {
    favorable: [...setFav],
    unfavorable: [...setUnfav],
  }
}

function collectKeyTenGods(
  tag: PatternTag | string,
  dist: TenGodClassifierResult['distribution'] | undefined,
): { key: TenGodName[]; support: TenGodName[] } {
  const KEY_PREF: Record<string, TenGodName[]> = {
    'qi-sha-wang': ['七杀'],
    'qi-sha-yin-xiang-sheng': ['七杀', '正印', '偏印'],
    'qi-shi-zhi-sha': ['七杀', '食神'],
    'qi-sha-wu-zhi': ['七杀'],
    'shang-guan-jian-guan': ['伤官', '正官'],
    'shang-guan-pei-yin': ['伤官', '正印'],
    'shang-guan-sheng-cai': ['伤官', '食神', '正财', '偏财'],
    'cai-wang-shen-ruo': ['正财', '偏财'],
    'cai-wang-shen-qiang': ['正财', '偏财'],
    'cai-guan-xiang-sheng': ['正财', '偏财', '正官'],
    'yin-wang-shen-ruo': ['正印', '偏印'],
  }
  const pref = KEY_PREF[tag as string]
  const key = pref ? [...pref] : []
  // dominant 里旺神（除了key）放 support
  const dominant = dist?.dominantGods || []
  const support = dominant.filter(g => !key.includes(g)).slice(0, 3)
  return { key, support }
}

function computeSubEngineResult(args: {
  input: FusionInput
  priority: PriorityMatrixResult
  conflict: ConflictResolverResult
  evidence: PatternTenGodEvidence
  favorableWuxing: Wuxing[]
  unfavorableWuxing: Wuxing[]
  explanation: FusionDecisionResult['explanation']
  patternVerdict?: any
  dist?: TenGodClassifierResult['distribution']
}): SubEngineResult {
  const scores = emptyScores()
  const fav = args.favorableWuxing
  const unfav = args.unfavorableWuxing
  const weightBoost = +(Math.max(-3, Math.min(3, args.conflict.adjustedWeight / 5))).toFixed(3)
  for (const w of fav) {
    scores[w] = Math.min(3, +(+scores[w] + 2 + weightBoost).toFixed(3))
  }
  for (const w of unfav) {
    scores[w] = Math.max(-3, +(+scores[w] - 2 - weightBoost).toFixed(3))
  }

  const evidence: SubEngineResult['evidence'] = [
    {
      step: 'F1-格局基础',
      text: args.explanation.patternBasis,
      satisfied: true,
    },
    {
      step: 'F2-十神状态',
      text: args.explanation.tengodState,
      satisfied: true,
    },
    {
      step: 'F3-融合判断',
      text: args.explanation.fusionJudgment,
      satisfied: !args.conflict.hasConflict,
    },
  ]
  if (args.explanation.classicRefs && args.explanation.classicRefs.length > 0) {
    evidence.push({
      step: 'F4-古籍依据',
      text: args.explanation.classicRefs.join('；'),
      satisfied: true,
      citation: args.explanation.classicRefs[0],
    })
  }
  // 冲突记录
  if (args.conflict.hasConflict) {
    for (const item of args.conflict.items) {
      evidence.push({
        step: 'F5-冲突处理 · ' + item.id,
        text: item.resolveReason + ` → 最终权重=${item.finalWeight.toFixed(2)}`,
        satisfied: true,
      })
    }
  }

  const conf = +(
    (args.evidence.confidence * 0.6) +
    (args.priority.dominant ? 0.25 : 0.15) +
    (args.conflict.hasConflict ? 0.1 : 0.2)
  ).toFixed(3)

  const summary =
    `融合决策：${args.explanation.fusionJudgment}；` +
    `联合权重=${args.conflict.adjustedWeight.toFixed(2)}；` +
    `喜五行=${fav.join('、') || '（未定）'}；忌五行=${unfav.join('、') || '（未定）'}。`

  return {
    engineName: 'PatternTenGodFusionEngine V1.0',
    applicable: true,
    scores,
    evidence,
    classicEvidence: (args.evidence.classicCitation || []).map(c => ({
      classicId: (c as any).classicCode || c.classicName,
      classicName: c.classicName,
      chapter: c.chapter,
      quote: c.quote,
    })),
    confidence: Math.max(0.3, Math.min(0.99, conf)),
    weight: 1.35,
    summary,
  }
}

export class PatternTenGodFusionEngine {
  readonly name = 'PatternTenGodFusionEngine'
  readonly version = '1.0.0'
  readonly weight = 1.35

  evaluate(args: {
    input: FusionInput
    patternResult: SubEngineResult
    tengodResult: TenGodEngineResult
    patternClassify?: PatternClassifierResult
    tengodClassify?: TenGodClassifierResult
  }): FusionDecisionResult {
    const { input, patternResult, tengodResult } = args
    const patternVerdict = args.patternClassify?.verdict || args.patternClassify?.strongestVerdict
    let category = extractPatternCategory(patternVerdict)
    if (!category) {
      category = inferCategoryFromTenGods({
        distribution: args.tengodClassify?.distribution,
        wangGods: args.tengodClassify?.wangGods,
        weakGods: args.tengodClassify?.weakGods,
      })
    }
    const dist = args.tengodClassify?.distribution
    const strongOrWeak = extractDayStrength(
      patternVerdict?.confidence ?? 0.5,
      dist,
      input.dayStrength,
      input.dayRootCount
    )

    const { evidence, tree } = mergeEvidence(patternResult, tengodResult, {
      patternClassify: args.patternClassify,
      tengodClassify: args.tengodClassify,
    })

    const priority = classifyPriorityMatrix({
      patternVerdict,
      patternCategory: category,
      distribution: dist,
      wangGods: args.tengodClassify?.wangGods,
      weakGods: args.tengodClassify?.weakGods,
      combinationVerdicts: args.tengodClassify?.combinationVerdicts,
      dayStrength: input.dayStrength,
      dayRootCount: input.dayRootCount,
    })

    const conflict = resolvePatternTenGodConflict({
      patternVerdict,
      patternCategory: category,
      distribution: dist,
      combinationVerdicts: args.tengodClassify?.combinationVerdicts,
      dayStrength: input.dayStrength,
      dayRootCount: input.dayRootCount,
      priority,
    })

    const tag: PatternTag | string =
      priority.dominant?.tag || conflict.items[0]?.sources.find(s => s.source === 'tengod')?.view || 'unknown'
    const { favorable, unfavorable } = suggestWuxing(dist, tag, strongOrWeak)
    const { key, support } = collectKeyTenGods(tag, dist)
    const dominantStructure: FusionDominantStructure = {
      patternName: patternVerdict?.name || (category ? category + '格（疑似）' : '未判明格局'),
      patternTag: tag,
      keyTenGods: key,
      supportTenGods: support,
      favorableWuxing: favorable,
      unfavorableWuxing: unfavorable,
    }

    // 支撑因素 & 冲突因素
    const supportingFactors: FusionDecisionResult['supportingFactors'] = []
    const conflictingFactors: FusionDecisionResult['conflictingFactors'] = []
    for (const h of priority.hits) {
      const w = h.baseWeight
      const item = {
        factor: h.label,
        weight: +w.toFixed(2),
        evidence: h.trigger,
      }
      if (w >= 0) supportingFactors.push(item)
      else conflictingFactors.push(item)
    }
    for (const ci of conflict.items) {
      if (ci.finalWeight >= 0) {
        supportingFactors.push({
          factor: `协同·${ci.id}`,
          weight: +ci.finalWeight.toFixed(2),
          evidence: ci.resolveReason,
        })
      } else {
        conflictingFactors.push({
          factor: `冲突·${ci.id}`,
          weight: +ci.finalWeight.toFixed(2),
          evidence: ci.resolveReason,
        })
      }
    }

    const influence = +Math.max(-100, Math.min(100, conflict.adjustedWeight * 10)).toFixed(2)

    const explanation = this._buildExplanation({
      evidence, tree, priority, conflict, dominantStructure,
      strongOrWeak, patternName: patternVerdict?.name,
    })

    const subEngineResult = computeSubEngineResult({
      input, priority, conflict, evidence,
      favorableWuxing: favorable,
      unfavorableWuxing: unfavorable,
      explanation,
      patternVerdict,
      dist,
    })

    const result: FusionDecisionResult = {
      dominantStructure,
      supportingFactors,
      conflictingFactors,
      influenceWeight: influence,
      evidenceTree: tree,
      explanation,
      subEngineResult,
    }
    return result
  }

  _buildExplanation(args: {
    evidence: PatternTenGodEvidence
    tree: PatternTenGodEvidenceTree
    priority: PriorityMatrixResult
    conflict: ConflictResolverResult
    dominantStructure: FusionDominantStructure
    strongOrWeak: '强' | '弱'
    patternName?: string
  }): FusionDecisionResult['explanation'] {
    const { dominantStructure, priority, conflict, evidence } = args
    const patternBasis =
      dominantStructure.patternName
        ? `命局形成「${dominantStructure.patternName}」（${args.strongOrWeak === '强' ? '日主身强' : '日主身弱'}）。`
        : '命局未形成明确格局，按十神旺衰结构分析。'

    const keyTG = dominantStructure.keyTenGods.join('、') || '各神分布较均衡'
    const supTG = dominantStructure.supportTenGods.join('、')
    const tgSummary = priority.dominant?.label || '未命中显性联合结构'
    const tengodState =
      `主导十神：${keyTG}${supTG ? `；辅助十神：${supTG}` : ''}。${tgSummary}：${priority.dominant?.trigger || ''}`

    let fusionJudgment: string
    if (conflict.hasConflict) {
      const firstBad = conflict.items.find(i => i.finalWeight < 0) || conflict.items[0]
      fusionJudgment =
        `综合格局与十神力量，${priority.dominant?.label || '本局'}存在需要特别留意之处：${firstBad.resolveReason}。` +
        `最终融合权重=${conflict.adjustedWeight.toFixed(2)}，影响Unified Decision Core权重≈${(conflict.adjustedWeight * 10).toFixed(1)}。`
    } else {
      const best = priority.hits.find(h => h.favorable && h.baseWeight === Math.max(...priority.hits.map(x => x.baseWeight)))
        || priority.dominant
      fusionJudgment =
        `综合格局与十神力量，本局以「${best?.label || dominantStructure.patternTag || '综合结构'}」为主要结构；` +
        `喜五行：${dominantStructure.favorableWuxing.join('、') || '（待UDC裁决）'}；忌五行：${dominantStructure.unfavorableWuxing.join('、') || '（待UDC裁决）'}。`
    }

    const classicRefs = (evidence.classicCitation || []).slice(0, 5).map(
      c => `《${c.classicName}》·${c.chapter}：${c.quote}`
    )
    if (classicRefs.length === 0) {
      classicRefs.push('《渊海子平》·论格局：以月令为提纲，取格局，参十神制化。')
    }
    return {
      patternBasis,
      tengodState,
      fusionJudgment,
      classicRefs,
    }
  }
}

export const defaultPatternTenGodFusionEngine = new PatternTenGodFusionEngine()
