import type { GejuCategory, GejuName } from '../types'

export interface PatternScoreBreakdown {
  chengGeProbability: number
  purity: number
  stability: number
  poGeScore: number
  hunGeScore: number
  jiaGeIndicator: number
}

export interface PatternScoreResult {
  total: number
  breakdown: PatternScoreBreakdown
  verdict: '真格' | '标准格局' | '混格' | '假格' | '破格' | '弱格迹象' | '不成立'
  reasons: string[]
  flagPoGe: boolean
  flagHunGe: boolean
  flagJiaGe: boolean
}

export class PatternScorer {
  compute(
    verdict: { name: GejuName; category: GejuCategory; confidence: number },
    signals: {
      chengGeMet: number
      chengGeRequired: number
      poGeMet: number
      jiaGeMet: number
      hunGeLevel: number
      dayRootCount: number
      dominantWuxingRatio: number
      consistency: number
    },
  ): PatternScoreResult {
    const {
      chengGeMet,
      chengGeRequired,
      poGeMet,
      jiaGeMet,
      hunGeLevel,
      dayRootCount,
      dominantWuxingRatio,
      consistency,
    } = signals

    const chengGeProbability = Math.min(100, Math.round((chengGeMet / Math.max(1, chengGeRequired)) * 100))

    const purity = Math.max(0, Math.min(100, Math.round(100 - hunGeLevel * 60 - poGeMet * 20)))

    const stability = Math.max(0, Math.min(100, Math.round(
      dominantWuxingRatio * 70 + (1 - hunGeLevel) * 30,
    )))

    const poGeScore = Math.min(100, Math.round(poGeMet * 40 + (100 - chengGeProbability) * 0.2))

    const hunGeScore = Math.round(hunGeLevel * 100)

    const jiaGeIndicator = Math.min(100, Math.round(
      (jiaGeMet > 0 ? 60 : 0) + (dayRootCount > 0 ? 15 : 0) + hunGeLevel * 25,
    ))

    const total = Math.round(
      chengGeProbability * 0.35 +
      purity * 0.25 +
      stability * 0.2 +
      (100 - poGeScore) * 0.15 +
      (100 - jiaGeIndicator) * 0.05,
    )

    const reasons: string[] = []

    reasons.push(`成格概率：${chengGeProbability}/100（满足${chengGeMet}/${chengGeRequired}条成格条件）`)

    if (poGeMet > 0) {
      reasons.push(`破格条件满足${poGeMet}条，破格风险：${poGeScore}/100`)
    } else {
      reasons.push(`无破格条件满足，破格风险：${poGeScore}/100`)
    }

    if (jiaGeMet > 0 || dayRootCount > 0 || hunGeLevel > 0.3) {
      reasons.push(`假格倾向：${jiaGeIndicator}/100（假格条件${jiaGeMet}条，根气${dayRootCount}个，混格度${hunGeScore}%）`)
    }

    if (hunGeLevel > 0.2) {
      reasons.push(`混格程度：${hunGeScore}/100（有${Math.round(hunGeLevel * 100)}%的竞争者）`)
    }

    reasons.push(`格局纯度：${purity}/100，稳定性：${stability}/100`)
    reasons.push(`信号一致性：${Math.round(consistency * 100)}%，分类器置信度：${Math.round(verdict.confidence * 100)}%`)

    let finalVerdict: PatternScoreResult['verdict'] = '不成立'

    if (total >= 90 && poGeScore <= 5 && jiaGeIndicator <= 20) {
      finalVerdict = '真格'
      reasons.push('判定：真格（高分且无破格假格迹象）')
    } else if (total >= 75 && poGeScore <= 10 && hunGeScore <= 20) {
      finalVerdict = '标准格局'
      reasons.push('判定：标准格局（高分且破格混格低）')
    } else if (total >= 60 && hunGeScore > 20) {
      finalVerdict = '混格'
      reasons.push('判定：混格（得分不低，但多格并存）')
    } else if (total >= 60 && jiaGeIndicator > 50) {
      finalVerdict = '假格'
      reasons.push('判定：假格（得分尚可，但假格倾向高）')
    } else if (total >= 40 && poGeScore > 50) {
      finalVerdict = '破格'
      reasons.push('判定：破格（破格风险>50%）')
    } else if (total >= 30) {
      finalVerdict = '弱格迹象'
      reasons.push('判定：弱格迹象（有格象但不足以成格）')
    } else {
      finalVerdict = '不成立'
      reasons.push('判定：不成立（得分过低，格象不足）')
    }

    const flagPoGe = poGeScore > 30 || poGeMet > 0
    const flagHunGe = hunGeScore > 20
    const flagJiaGe = jiaGeIndicator > 30

    return {
      total: Math.max(0, Math.min(100, total)),
      breakdown: {
        chengGeProbability,
        purity,
        stability,
        poGeScore,
        hunGeScore,
        jiaGeIndicator,
      },
      verdict: finalVerdict,
      reasons,
      flagPoGe,
      flagHunGe,
      flagJiaGe,
    }
  }

  formatReport(r: PatternScoreResult): string {
    const b = r.breakdown
    const lines: string[] = []
    lines.push('========== 格局评分报告 ==========')
    lines.push(`总分：${r.total}/100`)
    lines.push(`判定结论：【${r.verdict}】`)
    if (r.flagPoGe) lines.push('  ⚠️ 存在破格风险')
    if (r.flagHunGe) lines.push('  ⚠️ 存在混格迹象')
    if (r.flagJiaGe) lines.push('  ⚠️ 假格倾向明显')
    lines.push('---------- 分项评分 ----------')
    lines.push(`成格概率：${b.chengGeProbability}/100`)
    lines.push(`格局纯度：${b.purity}/100`)
    lines.push(`稳定性：${b.stability}/100`)
    lines.push(`破格风险：${b.poGeScore}/100（越低越好）`)
    lines.push(`混格程度：${b.hunGeScore}/100（越低越好）`)
    lines.push(`假格倾向：${b.jiaGeIndicator}/100（越低越好，0=真格）`)
    lines.push('---------- 详细理由 ----------')
    for (const reason of r.reasons) {
      lines.push(`· ${reason}`)
    }
    lines.push('================================')
    return lines.join('\n')
  }
}

export const defaultPatternScorer = new PatternScorer()
