import type {
  TenGodName,
  TenGodClassifierInput,
  TenGodDistribution,
  TenGodScoreResult,
  CombinationVerdict,
  TenGodEvidenceReport,
} from '../types'
import { defaultTenGodCombinationEngine } from '../combinations/engine'
import { getScorePerGod } from '../score/tenGodScore'

export interface TenGodExplainResult {
  whyWangGods: Array<{ god: TenGodName; reasons: string[] }>
  whyWeakGods: Array<{ god: TenGodName; reasons: string[] }>
  whyCombinationsFormed: Array<{ id: string; name: string; reasons: string[] }>
  whyCombinationsFailed: Array<{ id: string; name: string; missing: string[] }>
  priorityNotes: string[]
  yongShenSuggestion: string[]
  jiShenSuggestion: string[]
  fullMarkdown: string
}

const ALL_TEN_GODS: TenGodName[] = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印']

export class TenGodExplainBuilder {
  build(args: {
    input: TenGodClassifierInput
    distribution: TenGodDistribution
    score: TenGodScoreResult
    combinationVerdicts: CombinationVerdict[]
    priorityMatrix: { resolve: any; list: any }
    evidenceReport?: TenGodEvidenceReport
  }): TenGodExplainResult {
    const { input, distribution, score, combinationVerdicts, priorityMatrix, evidenceReport } = args

    const whyWangGods = this.buildWhyWangGods(distribution, evidenceReport)
    const whyWeakGods = this.buildWhyWeakGods(distribution, evidenceReport)
    const whyCombinationsFormed = this.buildWhyCombinationsFormed(combinationVerdicts, evidenceReport)
    const whyCombinationsFailed = this.buildWhyCombinationsFailed(combinationVerdicts)
    const priorityNotes = this.buildPriorityNotes(combinationVerdicts, priorityMatrix)
    const yongShenSuggestion = this.buildYongShen(score, distribution, combinationVerdicts)
    const jiShenSuggestion = this.buildJiShen(score, distribution, combinationVerdicts)

    const result: TenGodExplainResult = {
      whyWangGods,
      whyWeakGods,
      whyCombinationsFormed,
      whyCombinationsFailed,
      priorityNotes,
      yongShenSuggestion,
      jiShenSuggestion,
      fullMarkdown: '',
    }
    result.fullMarkdown = this.buildFullMarkdown(result, input, combinationVerdicts, evidenceReport, score)
    return result
  }

  private buildWhyWangGods(
    dist: TenGodDistribution,
    _er?: TenGodEvidenceReport
  ): Array<{ god: TenGodName; reasons: string[] }> {
    const out: Array<{ god: TenGodName; reasons: string[] }> = []
    for (const g of dist.dominantGods.slice(0, 5)) {
      const reasons: string[] = []
      const n = dist.perGod[g] || 0
      const wn = dist.perGodWeighted[g] || 0
      reasons.push(`${g}共出现 ${n} 次，加权值 ${wn.toFixed(1)}，在十神中位列前位`)
      if (dist.tianGanFlags[g]) {
        reasons.push(`${g}透于天干，力量彰显于外`)
      }
      if (dist.hasMonthZhiBenQi[g]) {
        reasons.push(`${g}得月令本气，为提纲用神，最具力量`)
      }
      const positions = dist.perColumn.filter(r => r.tenGod === g).map(r => `${r.position}(${r.ganOrZhi})`)
      if (positions.length > 0) {
        reasons.push(`${g}分布于：${positions.slice(0, 3).join('、')}${positions.length > 3 ? '等' : ''}`)
      }
      while (reasons.length < 2) {
        reasons.push(`${g}在四柱中根基稳固，为当旺之十神`)
      }
      out.push({ god: g, reasons: reasons.slice(0, 4) })
    }
    if (out.length === 0) {
      for (const g of ALL_TEN_GODS) {
        const n = dist.perGod[g] || 0
        if (n >= 2) {
          out.push({
            god: g,
            reasons: [`${g}出现 ${n} 次，属于较旺的十神`],
          })
        }
      }
    }
    return out
  }

  private buildWhyWeakGods(
    dist: TenGodDistribution,
    _er?: TenGodEvidenceReport
  ): Array<{ god: TenGodName; reasons: string[] }> {
    const out: Array<{ god: TenGodName; reasons: string[] }> = []
    for (const g of dist.weakGods.slice(0, 5)) {
      const reasons: string[] = []
      const n = dist.perGod[g] || 0
      if (n === 0) {
        reasons.push(`${g}在四柱中完全未现，属于缺神`)
      } else {
        reasons.push(`${g}仅出现 ${n} 次，力量微弱`)
      }
      if (!dist.tianGanFlags[g] && n > 0) {
        reasons.push(`${g}不透天干，仅藏于地支，不显于外`)
      }
      if (!dist.hasMonthZhiBenQi[g]) {
        reasons.push(`${g}不得月令本气之助`)
      }
      while (reasons.length < 2) {
        reasons.push(`${g}缺乏生助，为衰弱之十神`)
      }
      out.push({ god: g, reasons: reasons.slice(0, 4) })
    }
    if (out.length === 0) {
      for (const g of ALL_TEN_GODS) {
        const n = dist.perGod[g] || 0
        if (n <= 1) {
          out.push({
            god: g,
            reasons: [`${g}仅出现 ${n} 次，力量偏弱`],
          })
        }
      }
    }
    return out.slice(0, 5)
  }

  private buildWhyCombinationsFormed(
    verdicts: CombinationVerdict[],
    _er?: TenGodEvidenceReport
  ): Array<{ id: string; name: string; reasons: string[] }> {
    const out: Array<{ id: string; name: string; reasons: string[] }> = []
    const formed = verdicts.filter(v => v.satisfied).sort((a, b) => b.score - a.score).slice(0, 5)
    for (const v of formed) {
      const reasons: string[] = []
      reasons.push(`满足条件 ${v.hits}/${v.required} 项，置信度 ${(v.confidence * 100).toFixed(0)}%`)
      v.hitConditions.slice(0, 3).forEach(c => reasons.push(`✓ ${c}`))
      reasons.push(`效果：${v.outcome}`)
      out.push({ id: v.id as string, name: v.name, reasons: reasons.slice(0, 5) })
    }
    return out
  }

  private buildWhyCombinationsFailed(
    verdicts: CombinationVerdict[]
  ): Array<{ id: string; name: string; missing: string[] }> {
    const out: Array<{ id: string; name: string; missing: string[] }> = []
    const failed = verdicts
      .filter(v => !v.satisfied)
      .sort((a, b) => (b.hits / b.required) - (a.hits / a.required))
      .slice(0, 5)
    for (const v of failed) {
      const missing = [...v.missingConditions.slice(0, 3)]
      const diff = v.required - v.hits
      if (missing.length === 0) {
        missing.push(`条件达成 ${v.hits}/${v.required}，尚差 ${diff} 项`)
      } else if (diff > missing.length) {
        missing.push(`其余 ${diff - missing.length} 项条件亦未满足`)
      }
      out.push({ id: v.id as string, name: v.name, missing })
    }
    return out
  }

  private buildPriorityNotes(
    verdicts: CombinationVerdict[],
    pm: { resolve: any; list: any }
  ): string[] {
    const notes: string[] = []
    const formed = verdicts.filter(v => v.satisfied).sort((a, b) => b.score - a.score)
    if (formed.length >= 2) {
      const top = formed.slice(0, 4)
      for (let i = 0; i < top.length - 1; i++) {
        for (let j = i + 1; j < top.length; j++) {
          const a = { id: top[i].id as string, score: top[i].score, favorable: top[i].favorable }
          const b = { id: top[j].id as string, score: top[j].score, favorable: top[j].favorable }
          try {
            const r = pm.resolve(a, b)
            if (r.winner !== 'TIE') {
              const winner = r.winner === 'A' ? top[i].name : top[j].name
              notes.push(`【${top[i].name} vs ${top[j].name}】${r.reason} → ${winner} 胜出`)
            }
            if (notes.length >= 3) break
          } catch (_) {}
        }
        if (notes.length >= 3) break
      }
    }
    if (notes.length === 0 && formed.length > 0) {
      const top = formed[0]
      const tier = top.score >= 80 ? '高位' : top.score >= 60 ? '中位' : '低位'
      notes.push(`${top.name}（${top.category}）为当前命中最强组合，置信度 ${(top.confidence * 100).toFixed(0)}%，属${tier}成立`)
      try {
        const list = pm.list()
        if (Array.isArray(list) && list.length > 0) {
          const ranks = list.slice(0, 5).map(e => `${e.rank}.${e.name}`).join(' ')
          notes.push(`优先级矩阵Top5：${ranks}`)
        }
      } catch (_) {}
    }
    return notes.slice(0, 5)
  }

  private buildYongShen(
    score: TenGodScoreResult,
    dist: TenGodDistribution,
    verdicts: CombinationVerdict[]
  ): string[] {
    const sugg: string[] = []
    const favorable = verdicts.filter(v => v.satisfied && v.favorable)
    const unfavorable = verdicts.filter(v => v.satisfied && !v.favorable)

    for (const v of favorable.slice(0, 2)) {
      const requires = defaultTenGodCombinationEngine.getRule(v.id)?.requires || []
      if (requires.length > 0) {
        sugg.push(`${v.name}成立，喜用：${requires.join('、')}（${v.outcome.slice(0, 12)}）`)
      }
    }

    // P1.2.1-A3: 统一从 score.breakdown.perGod 读取（通过 getScorePerGod 访问器）
    const perGodMap = getScorePerGod(score)
    const goodGods = ALL_TEN_GODS
      .map(g => ({ god: g, s: perGodMap[g] || 0 }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
    if (goodGods.length > 0) {
      const names = goodGods.map(x => x.god).join('、')
      const vals = goodGods.map(x => `${x.god}=${x.s.toFixed(1)}`).join(' ')
      sugg.push(`按十神评分喜：${names}（${vals}）`)
    }

    for (const v of unfavorable.slice(0, 2)) {
      const rule = defaultTenGodCombinationEngine.getRule(v.id)
      if (rule && rule.yieldsTo && rule.yieldsTo.length > 0) {
        const solvers = rule.yieldsTo.map(y => {
          const yr = defaultTenGodCombinationEngine.getRule(y)
          return yr ? yr.name : String(y)
        })
        sugg.push(`凶格${v.name}之解药：${solvers.join('、')}`)
      }
    }

    if (sugg.length === 0) {
      const weak = dist.weakGods.slice(0, 3)
      if (weak.length > 0) {
        sugg.push(`弱神需扶助：${weak.join('、')}`)
      }
    }
    return sugg.slice(0, 5)
  }

  private buildJiShen(
    score: TenGodScoreResult,
    dist: TenGodDistribution,
    verdicts: CombinationVerdict[]
  ): string[] {
    const sugg: string[] = []
    const unfavorable = verdicts.filter(v => v.satisfied && !v.favorable)

    for (const v of unfavorable.slice(0, 3)) {
      const rule = defaultTenGodCombinationEngine.getRule(v.id)
      const requires = rule?.requires || []
      if (requires.length > 0) {
        sugg.push(`${v.name}为凶，忌：${requires.join('、')}（${v.outcome.slice(0, 12)}）`)
      }
    }

    // P1.2.1-A3: 统一从 score.breakdown.perGod 读取（通过 getScorePerGod 访问器）
    const perGodMap = getScorePerGod(score)
    const badGods = ALL_TEN_GODS
      .map(g => ({ god: g, s: perGodMap[g] || 0 }))
      .filter(x => x.s < 0)
      .sort((a, b) => a.s - b.s)
      .slice(0, 3)
    if (badGods.length > 0) {
      const names = badGods.map(x => x.god).join('、')
      const vals = badGods.map(x => `${x.god}=${x.s.toFixed(1)}`).join(' ')
      sugg.push(`按十神评分忌：${names}（${vals}）`)
    }

    const overWang = dist.dominantGods.filter(g => {
      const n = dist.perGod[g] || 0
      return n >= 3
    }).slice(0, 3)
    if (overWang.length > 0) {
      sugg.push(`过旺需抑泄：${overWang.join('、')}`)
    }

    if (sugg.length === 0) {
      const wang = dist.dominantGods.slice(0, 2)
      if (wang.length > 0) {
        sugg.push(`旺神防过亢：${wang.join('、')}`)
      }
    }
    return sugg.slice(0, 5)
  }

  private buildFullMarkdown(
    r: TenGodExplainResult,
    input: TenGodClassifierInput,
    verdicts: CombinationVerdict[],
    er?: TenGodEvidenceReport,
    score?: TenGodScoreResult
  ): string {
    const lines: string[] = []
    lines.push(`## 十神解释`)
    lines.push('')
    lines.push(`> 日柱：${input.dayGan} | 月令：${input.monthZhi} | 综合分：${score?.overall ?? 0}`)
    lines.push('')

    lines.push('### 十神旺衰分析')
    lines.push('')
    if (r.whyWangGods.length > 0) {
      lines.push('**当旺十神：**')
      r.whyWangGods.forEach((item, idx) => {
        lines.push(`${idx + 1}. 「${item.god}」旺：`)
        item.reasons.forEach(rs => lines.push(`   - ${rs}`))
      })
      lines.push('')
    }
    if (r.whyWeakGods.length > 0) {
      lines.push('**衰弱十神：**')
      r.whyWeakGods.forEach((item, idx) => {
        lines.push(`${idx + 1}. 「${item.god}」弱：`)
        item.reasons.forEach(rs => lines.push(`   - ${rs}`))
      })
      lines.push('')
    }

    lines.push('### 十神组合分析')
    lines.push('')
    if (r.whyCombinationsFormed.length > 0) {
      lines.push('**成立组合（吉）：**')
      r.whyCombinationsFormed.forEach((item, idx) => {
        lines.push(`${idx + 1}. **${item.name}**（${item.id}）：`)
        item.reasons.forEach(rs => lines.push(`   - ${rs}`))
      })
      lines.push('')
    }
    if (r.whyCombinationsFailed.length > 0) {
      lines.push('**未成立的关键组合（原因）：**')
      r.whyCombinationsFailed.forEach((item, idx) => {
        lines.push(`${idx + 1}. ${item.name}（${item.id}）未成立，缺：`)
        item.missing.forEach(m => lines.push(`   - ✗ ${m}`))
      })
      lines.push('')
    }

    lines.push('### 优先级裁决')
    lines.push('')
    if (r.priorityNotes.length > 0) {
      r.priorityNotes.forEach(n => lines.push(`- ${n}`))
    } else {
      const fv = verdicts.filter(v => v.satisfied).sort((a, b) => b.score - a.score)[0]
      if (fv) {
        lines.push(`- 最强组合：${fv.name}（评分 ${fv.score.toFixed(0)}，权重 ${fv.weight}）`)
      } else {
        lines.push('- 无充分成立的组合，按旺衰判断')
      }
    }
    lines.push('')

    lines.push('### 喜忌建议')
    lines.push('')
    lines.push('**喜用（用神）：**')
    if (r.yongShenSuggestion.length > 0) {
      r.yongShenSuggestion.forEach(s => lines.push(`- ${s}`))
    } else {
      lines.push('- 结合旺衰与大运流年详参')
    }
    lines.push('')
    lines.push('**忌神（所忌）：**')
    if (r.jiShenSuggestion.length > 0) {
      r.jiShenSuggestion.forEach(s => lines.push(`- ${s}`))
    } else {
      lines.push('- 结合旺衰与大运流年详参')
    }
    lines.push('')

    lines.push('### 古籍佐证')
    lines.push('')
    const formed = verdicts.filter(v => v.satisfied).sort((a, b) => b.score - a.score).slice(0, 2)
    let cited = 0
    for (const v of formed) {
      const rule = defaultTenGodCombinationEngine.getRule(v.id)
      if (rule && rule.references && rule.references.length > 0) {
        rule.references.slice(0, 2).forEach(ref => {
          cited++
          lines.push(`- 《${ref.classicCode}》 ${v.name}：${ref.quote}`)
        })
      }
    }
    if (cited === 0) {
      if (er && er.steps) {
        const withCite = er.steps.filter(s => s.citation).slice(0, 3)
        withCite.forEach(s => lines.push(`- ${s.stepName}：${s.citation}`))
      }
      if (lines[lines.length - 1]?.startsWith('###')) {
        lines.push('- 本十神判定参照《渊海子平》《子平真诠》《滴天髓》《三命通会》《穷通宝鉴》等正统典籍的十神组合篇。')
        lines.push('- 如需针对性的逐条引文，请补充 citationsDB 后重新解释。')
      }
    }
    lines.push('')
    return lines.join('\n')
  }
}

export const defaultTenGodExplainBuilder = new TenGodExplainBuilder()
