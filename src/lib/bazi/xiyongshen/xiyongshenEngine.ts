import {
  applyFuYi, applyTiaoHou, applyBingYao, applyTongGuan,
  applyHanNuan, applyZaoShi, applyGeJu,
  type XiYongInput,
} from './methods'
import type { XiYongResult, XiYongFinalShen, Wuxing, XiYongMethod, XiYongSingleMethodResult, ShenType } from './types'
import { buildConfidence5D, TraceEngine } from '../ruleEngine'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']

export class XiYongEngine {
  evaluate(input: XiYongInput): XiYongResult {
    const methods: XiYongSingleMethodResult[] = [
      applyFuYi(input),
      applyTiaoHou(input),
      applyBingYao(input),
      applyTongGuan(input),
      applyHanNuan(input),
      applyZaoShi(input),
      applyGeJu(input),
    ]
    const shens: XiYongFinalShen[] = WUXING_LIST.map(wx => {
      let totalScore = 0
      const breakdown: Partial<Record<XiYongMethod, number>> = {}
      const evidence: string[] = []
      for (const m of methods) {
        if (!m.applicable) continue
        const v = m.score[wx] * m.weight
        totalScore += v
        breakdown[m.method] = Number(v.toFixed(2))
        evidence.push(`${m.method}(${Math.round(m.weight*100)}%): ${v >= 0 ? '+' : ''}${v.toFixed(2)}`)
      }
      totalScore = Number(totalScore.toFixed(2))
      let finalType: ShenType = '闲神'
      if (totalScore >= 0.25) finalType = '用神'
      else if (totalScore >= 0.08) finalType = '喜神'
      else if (totalScore <= -0.25) finalType = '忌神'
      else if (totalScore <= -0.08) finalType = '仇神'
      return { wuxing: wx, finalType, totalScore, breakdown, evidence }
    })
    const sorted = [...shens].sort((a, b) => b.totalScore - a.totalScore)
    const primaryShen = sorted[0].wuxing
    const primaryJiShen = sorted[sorted.length - 1].totalScore < 0
      ? sorted[sorted.length - 1].wuxing : undefined
    const summary = `主用神：${primaryShen}${primaryJiShen? `；主忌神：${primaryJiShen}`:''}；5行综合分：${shens.map(s => `${s.wuxing}:${s.totalScore}`).join(' ')}`
    return { shens, primaryShen, primaryJiShen, methods, summary }
  }

  evaluateAsTriple(input: XiYongInput): {
    result: XiYongResult
    evidence: Array<any>
    confidence: any
  } {
    const result = this.evaluate(input)
    const evidence = result.methods.flatMap(m => (m.trace ?? []).map(t => ({
      rule: `XY-${m.method}`,
      source: m.sources,
      description: `[${m.method}] ${t.step}: ${t.text}`,
      confidence: m.weight,
    })))
    const consensus = Number(
      (result.methods.filter(m => m.applicable && m.score[result.primaryShen] > 0).length /
        Math.max(1, result.methods.filter(m => m.applicable).length)).toFixed(2)
    )
    const confidence = buildConfidence5D({
      calendar: { preciseProvider: true, trueSolarTimeUsed: true, ziHourStrategy: 'true-solar', termPrecisionLevel: 2 },
      geju: { conditions: [] },
      xiyongshen: { consensusRate: consensus },
      shensha: {},
    })
    return { result, evidence, confidence }
  }
}

export const globalXiYongEngine = new XiYongEngine()
