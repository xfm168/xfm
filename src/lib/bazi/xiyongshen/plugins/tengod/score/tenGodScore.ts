import type { TenGodName, CombinationId, TenGodScoreResult } from '../types'

export interface TenGodPerGod {
  name: TenGodName
  count: number
  tianGan: number
  diZhi: number
  cangGan: number
  tongGen: number
  strength: number
  derivedScore: number
  level: 'dominant' | 'strong' | 'medium' | 'weak' | 'feeble'
}

export interface TenGodScoreBreakdown {
  wangDu: number
  chunDu: number
  wenDing: number
  liuTong: number
  zhiHua: number
  pingHeng: number
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

const TEN_GODS: TenGodName[] = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印']

export type TenGodVerdictLabel =
  | '制化有序' | '流通顺畅' | '制化失衡' | '流通闭塞'
  | '极旺' | '偏旺' | '极弱' | '偏弱' | '中和'

export interface ExtendedTenGodScoreResult extends TenGodScoreResult {
  perGodDetail: TenGodPerGod[]
  breakdown: TenGodScoreBreakdown
  dominantGods: TenGodName[]
  weakGods: TenGodName[]
  verdict: TenGodVerdictLabel
  verdictReasons: string[]
  total: number
}

export class TenGodScorer {
  compute(
    perGodRaw: Record<TenGodName, { count: number; tianGan: number; diZhi: number; cangGan: number; tongGen: number; strength: number }>,
    extra: {
      dayStrength: number
      combinationsHit: Array<{ id: CombinationId | string; favorable: boolean; score: number }>
      liuTongScore?: number
      guanZhiHua?: number
      conflictingCount: number
      monthZhiBonusFor?: TenGodName | null
    },
  ): ExtendedTenGodScoreResult {
    const perGodDetail = this.computePerGod(perGodRaw, extra.monthZhiBonusFor)

    const derivedScores = perGodDetail.map(g => g.derivedScore).sort((a, b) => b - a)
    const top2 = derivedScores.slice(0, 2)
    const sumTop2 = top2.reduce((s, v) => s + v, 0)
    const top = derivedScores[0] ?? 0
    const sumAll = derivedScores.reduce((s, v) => s + v, 0)
    const uniqueGods = perGodDetail.filter(g => g.count > 0).length

    const favorableHits = extra.combinationsHit.filter(c => c.favorable).length
    const unfavorableHits = extra.combinationsHit.filter(c => !c.favorable).length

    const wangDuRaw = sumTop2 * 0.5 + ((extra.dayStrength + 3) / 6) * 100 * 0.5
    const wangDu = clamp(wangDuRaw, 0, 100)

    const chunDuRaw = (top / (sumAll + 1)) * 100 + 100 - uniqueGods * 6
    const chunDu = clamp(chunDuRaw, 0, 100)

    const avgTongGen33 = TEN_GODS.length > 0
      ? perGodDetail.reduce((s, g) => s + g.tongGen * 33, 0) / TEN_GODS.length
      : 0
    const wenDingRaw = avgTongGen33 * 0.5 + (100 - extra.conflictingCount * 8)
    const wenDing = clamp(wenDingRaw, 0, 100)

    const liuTong = extra.liuTongScore ?? 50

    const zhiHuaRaw = extra.guanZhiHua ?? (100 * favorableHits / Math.max(1, favorableHits + unfavorableHits))
    const zhiHua = clamp(zhiHuaRaw, 0, 100)

    const mean = sumAll / Math.max(1, TEN_GODS.length)
    const variance = TEN_GODS.length > 0
      ? perGodDetail.reduce((s, g) => s + Math.pow(g.derivedScore - mean, 2), 0) / TEN_GODS.length
      : 0
    const sd = Math.sqrt(variance)
    const pingHengRaw = 100 - sd * 2.5
    const pingHeng = clamp(pingHengRaw, 0, 100)

    const totalRaw = wangDu * 0.15 + chunDu * 0.18 + wenDing * 0.12 + liuTong * 0.22 + zhiHua * 0.18 + pingHeng * 0.15
    const total = clamp(totalRaw, 0, 100)

    const dominantGods = perGodDetail.filter(g => g.derivedScore >= 60).map(g => g.name)
    const weakGods = perGodDetail.filter(g => g.derivedScore < 25).map(g => g.name)

    const { verdict, verdictReasons } = this.determineVerdict(
      total, wangDu, liuTong, zhiHua, dominantGods, weakGods, favorableHits, unfavorableHits
    )

    const perGod: Record<TenGodName, number> = {} as any
    for (const g of perGodDetail) perGod[g.name] = g.derivedScore

    const perCombination: Record<string, number> = {}
    for (const c of extra.combinationsHit) perCombination[String(c.id)] = c.score

    return {
      perGod,
      perCombination,
      overall: total,
      total,
      breakdown: { wangDu, chunDu, wenDing, liuTong, zhiHua, pingHeng },
      perGodDetail,
      dominantGods,
      weakGods,
      verdict,
      verdictReasons,
    }
  }

  private computePerGod(
    raw: Record<TenGodName, { count: number; tianGan: number; diZhi: number; cangGan: number; tongGen: number; strength: number }>,
    monthZhiBonusFor: TenGodName | null | undefined,
  ): TenGodPerGod[] {
    const result: TenGodPerGod[] = []
    for (const name of TEN_GODS) {
      const r = raw[name] ?? { count: 0, tianGan: 0, diZhi: 0, cangGan: 0, tongGen: 0, strength: 0 }
      const tgBoost = monthZhiBonusFor === name ? 0.5 : 0
      const derivedRaw = 100 * (r.tianGan * 0.35 + r.diZhi * 0.35 + r.cangGan * 0.2 + r.tongGen * 0.1 + tgBoost) / 4
      const derivedScore = clamp(derivedRaw, 0, 100)
      let level: TenGodPerGod['level'] = 'medium'
      if (derivedScore >= 60) level = 'dominant'
      else if (derivedScore >= 40) level = 'strong'
      else if (derivedScore >= 25) level = 'medium'
      else if (derivedScore >= 10) level = 'weak'
      else level = 'feeble'
      result.push({ name, ...r, derivedScore, level })
    }
    return result
  }

  private determineVerdict(
    total: number,
    wangDu: number,
    liuTong: number,
    zhiHua: number,
    dominantGods: TenGodName[],
    weakGods: TenGodName[],
    favorableHits: number,
    unfavorableHits: number,
  ): { verdict: TenGodVerdictLabel; verdictReasons: string[] } {
    const reasons: string[] = []
    let verdict: TenGodVerdictLabel = '中和'

    if (total >= 85 && liuTong >= 80 && zhiHua >= 70) {
      verdict = '制化有序'
      reasons.push(`总分${total.toFixed(0)}≥85，流通分${liuTong.toFixed(0)}≥80，制化度${zhiHua.toFixed(0)}≥70，判定【制化有序】`)
    } else if (total >= 75 && liuTong >= 70) {
      verdict = '流通顺畅'
      reasons.push(`总分${total.toFixed(0)}≥75，流通分${liuTong.toFixed(0)}≥70，判定【流通顺畅】`)
    } else if (zhiHua < 30) {
      verdict = '制化失衡'
      reasons.push(`制化度${zhiHua.toFixed(0)}<30，判定【制化失衡】（吉组合${favorableHits}，凶组合${unfavorableHits}）`)
    } else if (liuTong < 30) {
      verdict = '流通闭塞'
      reasons.push(`流通分${liuTong.toFixed(0)}<30，判定【流通闭塞】`)
    } else if (wangDu >= 80) {
      verdict = '极旺'
      reasons.push(`旺度${wangDu.toFixed(0)}≥80，判定【极旺】，主导十神：${dominantGods.join('、') || '无'}`)
    } else if (wangDu >= 60) {
      verdict = '偏旺'
      reasons.push(`旺度${wangDu.toFixed(0)}≥60，判定【偏旺】，强势十神：${dominantGods.join('、') || '无'}`)
    } else if (wangDu < 25) {
      verdict = '极弱'
      reasons.push(`旺度${wangDu.toFixed(0)}<25，判定【极弱】，衰弱十神：${weakGods.join('、') || '无'}`)
    } else if (wangDu < 40) {
      verdict = '偏弱'
      reasons.push(`旺度${wangDu.toFixed(0)}<40，判定【偏弱】，偏弱十神：${weakGods.join('、') || '无'}`)
    } else {
      verdict = '中和'
      reasons.push(`旺度${wangDu.toFixed(0)}处于40-60区间，判定【中和】`)
    }

    if (dominantGods.length > 0) reasons.push(`主导十神(${dominantGods.length})：${dominantGods.join('、')}`)
    if (weakGods.length > 0) reasons.push(`衰弱十神(${weakGods.length})：${weakGods.join('、')}`)
    reasons.push(`吉组合命中${favorableHits}项，凶组合命中${unfavorableHits}项`)

    return { verdict, verdictReasons: reasons }
  }

  formatReport(r: ExtendedTenGodScoreResult): string {
    const b = r.breakdown
    const lines: string[] = []
    lines.push('========== 十神评分报告 ==========')
    lines.push(`总分：${r.total.toFixed(1)}/100`)
    lines.push(`判定结论：【${r.verdict}】`)
    lines.push('---------- 分项评分 ----------')
    lines.push(`旺度(WangDu)：${b.wangDu.toFixed(1)}/100（前二位十神+日主强弱）`)
    lines.push(`纯度(ChunDu)：${b.chunDu.toFixed(1)}/100（最强十神占比+格局集中度）`)
    lines.push(`稳定(WenDing)：${b.wenDing.toFixed(1)}/100（通根+冲突消解）`)
    lines.push(`流通(LiuTong)：${b.liuTong.toFixed(1)}/100（五行十神流通度）`)
    lines.push(`制化(ZhiHua)：${b.zhiHua.toFixed(1)}/100（吉凶组合制化）`)
    lines.push(`平衡(PingHeng)：${b.pingHeng.toFixed(1)}/100（十神分布标准差）`)
    lines.push('---------- 十神明细 ----------')
    lines.push(`${'十神'.padEnd(4)} ${'天干'.padEnd(4)} ${'地支'.padEnd(4)} ${'藏干'.padEnd(4)} ${'通根'.padEnd(4)} ${'得分'.padEnd(6)} ${'层级'}`)
    for (const g of r.perGodDetail) {
      lines.push(`${g.name.padEnd(4)} ${String(g.tianGan).padEnd(4)} ${String(g.diZhi).padEnd(4)} ${String(g.cangGan).padEnd(4)} ${String(g.tongGen).padEnd(4)} ${g.derivedScore.toFixed(1).padEnd(6)} ${g.level}`)
    }
    lines.push('---------- 判定理由 ----------')
    for (const reason of r.verdictReasons) lines.push(`· ${reason}`)
    lines.push('================================')
    return lines.join('\n')
  }
}

export const defaultTenGodScorer = new TenGodScorer()
