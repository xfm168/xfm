import type { TenGodName, CombinationId, TenGodScoreResult, TenGodClassifierInput, TenGodDistribution, CombinationVerdict } from '../types'

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
  /** P1.2.1 校准：身弱惩罚（dayStrength<0 时为正数，表示扣分） */
  shenRuoPenalty: number
  /** P1.2.1 校准：失令修正（月令之气是否帮身，失令则扣分） */
  shiLingPenalty: number
  /** P1.2.1 校准：无根修正（日主通根数为0时扣分） */
  wuGenPenalty: number
  /** P1.2.1 校准：制化不足扣分（凶组合多于吉组合时扣分） */
  zhiHuaBuZuPenalty: number
  /**
   * P1.2.1-A3 Explain 字段路径统一：
   * per-god 评分的规范存储位置。
   * Explain / 验收测试必须从 `score.breakdown.perGod` 读取，
   * 禁止直接从 `score.perGod` 读取（保持 perGod 仅作为 backward-compat）。
   */
  perGod?: Record<TenGodName, number>
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

const TEN_GODS: TenGodName[] = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印']

/** P1.2.1-C1 适配层：地支本气藏干表（仅取本气，用于月令失令判定） */
const ZHI_BENQI_GAN: Record<string, string> = {
  子: '癸', 丑: '己', 寅: '甲', 卯: '乙', 辰: '戊', 巳: '丙',
  午: '丁', 未: '己', 申: '庚', 酉: '辛', 戌: '戊', 亥: '壬',
}

/** P1.2.1-C1 适配层：天干→五行 */
const GAN_WUXING: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土',
  庚: '金', 辛: '金', 壬: '水', 癸: '水',
}

/** P1.2.1-C1 适配层：天干阴阳 */
const GAN_YINYANG: Record<string, '阳' | '阴'> = {
  甲: '阳', 乙: '阴', 丙: '阳', 丁: '阴', 戊: '阳',
  己: '阴', 庚: '阳', 辛: '阴', 壬: '阳', 癸: '阴',
}

/**
 * P1.2.1-C1 适配层：根据日主天干与月令地支，计算月令本气所对应的十神。
 * 用于 shiLingPenalty（失令修正）的准确判定，不依赖 classifier 的 hasMonthZhiBenQi。
 */
function computeMonthBenQiTenGod(dayGan: string, monthZhi: string): TenGodName | null {
  const benGan = ZHI_BENQI_GAN[monthZhi]
  if (!benGan) return null
  const dayYy = GAN_YINYANG[dayGan]
  const targetYy = GAN_YINYANG[benGan]
  const dayWx = GAN_WUXING[dayGan]
  const targetWx = GAN_WUXING[benGan]
  if (!dayYy || !targetYy || !dayWx || !targetWx) return null
  const sameYy = dayYy === targetYy
  const shengKe: Record<string, { sheng: string; ke: string; beiSheng: string; beiKe: string }> = {
    木: { sheng: '火', ke: '土', beiSheng: '水', beiKe: '金' },
    火: { sheng: '土', ke: '金', beiSheng: '木', beiKe: '水' },
    土: { sheng: '金', ke: '水', beiSheng: '火', beiKe: '木' },
    金: { sheng: '水', ke: '木', beiSheng: '土', beiKe: '火' },
    水: { sheng: '木', ke: '火', beiSheng: '金', beiKe: '土' },
  }
  const rel = shengKe[dayWx]
  if (!rel) return null
  if (targetWx === dayWx) return sameYy ? '比肩' : '劫财'
  if (targetWx === rel.sheng) return sameYy ? '食神' : '伤官'
  if (targetWx === rel.ke) return sameYy ? '偏财' : '正财'
  if (targetWx === rel.beiKe) return sameYy ? '七杀' : '正官'
  if (targetWx === rel.beiSheng) return sameYy ? '偏印' : '正印'
  return null
}

/** 帮身十神：日主同类（比劫）与生身（正偏印） */
const DAY_HELP_GODS: Set<TenGodName> = new Set<TenGodName>(['比肩', '劫财', '正印', '偏印'])

/**
 * P1.2.1 适配层：将 TenGodDistribution 转换为 compute() 所需的 perGodRaw 格式。
 * 提取每个十神的：count(总数)、tianGan(天干出现次数)、diZhi(地支本气次数)、
 * cangGan(藏干余气次数)、tongGen(通根强度)、strength(加权强度)。
 */
export function rawPerGodFromDist(dist: TenGodDistribution): Record<TenGodName, {
  count: number; tianGan: number; diZhi: number; cangGan: number; tongGen: number; strength: number
}> {
  const r = {} as Record<TenGodName, { count: number; tianGan: number; diZhi: number; cangGan: number; tongGen: number; strength: number }>
  for (const g of TEN_GODS) {
    const count = dist.perGod?.[g] ?? 0
    const tianGan = dist.tianGanFlags?.[g] ? 1 : 0
    const diZhi = dist.perColumn?.filter(p => p.tenGod === g && (p.position?.includes('支本气') || p.position?.includes('地支'))).length ?? 0
    const tongGen = dist.hasMonthZhiBenQi?.[g] ? 1 : 0
    const cangGan = Math.max(0, count - tianGan - diZhi)
    const strength = dist.perGodWeighted?.[g] ?? count
    r[g] = { count, tianGan, diZhi, cangGan, tongGen, strength }
  }
  return r
}

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

export interface TenGodScorerExtra {
  dayStrength: number
  /** P1.2.1 新增：日主通根数（用于无根修正；缺省视为未知，不扣分） */
  dayRootCount?: number
  combinationsHit: Array<{ id: CombinationId | string; favorable: boolean; score: number }>
  liuTongScore?: number
  guanZhiHua?: number
  conflictingCount: number
  monthZhiBonusFor?: TenGodName | null
}

export class TenGodScorer {
  compute(
    perGodRaw: Record<TenGodName, { count: number; tianGan: number; diZhi: number; cangGan: number; tongGen: number; strength: number }>,
    extra: TenGodScorerExtra,
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

    // ===== P1.2.1 评分模型校准：身弱惩罚 / 失令修正 / 无根修正 / 制化不足扣分 =====
    // 1) 身弱惩罚：dayStrength 假定范围 [-3, +3]，<0 表示身弱，按比例扣分（最多 -15）
    const dayStrengthClamped = clamp(extra.dayStrength, -3, 3)
    const shenRuoPenalty = dayStrengthClamped < 0 ? Math.abs(dayStrengthClamped) * 5 : 0
    // 2) 失令修正：月令之神不属于帮身（比劫/印）则失令，扣 5 分
    const monthBonusIsHelp = extra.monthZhiBonusFor ? DAY_HELP_GODS.has(extra.monthZhiBonusFor) : false
    const shiLingPenalty = monthBonusIsHelp ? 0 : 5
    // 3) 无根修正：日主通根数显式为 0 时扣 8 分；为 1 时扣 3 分；缺省（未知）不扣分
    const dayRootCount = extra.dayRootCount
    const wuGenPenalty = dayRootCount == null ? 0 : (dayRootCount === 0 ? 8 : (dayRootCount === 1 ? 3 : 0))
    // 4) 制化不足扣分：凶组合多于吉组合时按差额扣分
    const zhiHuaBuZuPenalty = unfavorableHits > favorableHits ? (unfavorableHits - favorableHits) * 3 : 0
    const totalPenalty = shenRuoPenalty + shiLingPenalty + wuGenPenalty + zhiHuaBuZuPenalty

    const totalRaw = wangDu * 0.15 + chunDu * 0.18 + wenDing * 0.12 + liuTong * 0.22 + zhiHua * 0.18 + pingHeng * 0.15 - totalPenalty
    const total = clamp(totalRaw, 0, 100)

    const dominantGods = perGodDetail.filter(g => g.derivedScore >= 60).map(g => g.name)
    const weakGods = perGodDetail.filter(g => g.derivedScore < 25).map(g => g.name)

    // P1.2.1 verdict 校准：将身弱/失令/无根惩罚纳入旺度判定，避免身弱命局被误判为中和
    const effectiveWangDu = clamp(wangDu - shenRuoPenalty - shiLingPenalty - wuGenPenalty, 0, 100)

    const { verdict, verdictReasons } = this.determineVerdict(
      total, effectiveWangDu, liuTong, zhiHua, dominantGods, weakGods, favorableHits, unfavorableHits
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
      breakdown: {
        wangDu, chunDu, wenDing, liuTong, zhiHua, pingHeng,
        shenRuoPenalty, shiLingPenalty, wuGenPenalty, zhiHuaBuZuPenalty,
        perGod,
      },
      perGodDetail,
      dominantGods,
      weakGods,
      verdict,
      verdictReasons,
    }
  }

  /**
   * P1.2.1 适配层：引擎可直接调用的 score(input, dist, verdicts) 接口，
   * 将 TenGodClassifierInput + TenGodDistribution + CombinationVerdict[]
   * 转换为 compute() 所需的 (perGodRaw, extra) 格式后调用 compute()。
   * 返回 ExtendedTenGodScoreResult，被引擎与 explain 复用。
   */
  score(
    input: TenGodClassifierInput,
    dist: TenGodDistribution,
    verdicts: CombinationVerdict[],
  ): ExtendedTenGodScoreResult {
    const perGodRaw = rawPerGodFromDist(dist)
    const combinationsHit = verdicts
      .filter(v => v.satisfied)
      .map(v => ({ id: v.id, favorable: v.favorable, score: v.score }))
    const conflictingCount = verdicts.filter(v => v.satisfied && !v.favorable).length
    // P1.2.1-C1 修正：monthZhiBonusFor 应取月令本气所对应的十神，
    // 直接由 dayGan + monthZhi 计算，不依赖 classifier 的 hasMonthZhiBenQi（可能不准）。
    // 否则身强但月令不帮身的命例会被误判为得令。
    const monthBenQiGod = computeMonthBenQiTenGod(input.dayGan, input.monthZhi)
    return this.compute(perGodRaw, {
      dayStrength: input.dayStrength ?? 0,
      dayRootCount: input.dayRootCount,
      combinationsHit,
      conflictingCount,
      monthZhiBonusFor: monthBenQiGod ?? dist.dominantGods?.[0] ?? null,
    })
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
    lines.push('---------- P1.2.1 校准扣分 ----------')
    lines.push(`身弱惩罚：-${b.shenRuoPenalty.toFixed(1)}（dayStrength<0 时按比例扣分）`)
    lines.push(`失令修正：-${b.shiLingPenalty.toFixed(1)}（月令之气不帮身则扣分）`)
    lines.push(`无根修正：-${b.wuGenPenalty.toFixed(1)}（日主通根数为0/1时扣分）`)
    lines.push(`制化不足：-${b.zhiHuaBuZuPenalty.toFixed(1)}（凶组合多于吉组合时扣分）`)
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

/**
 * P1.2.1-A3 Explain 字段路径统一：类型保护 + 安全访问器。
 *
 * 规范：
 *   - 优先从 `score.breakdown.perGod` 读取 per-god 评分（规范位置）
 *   - 仅在 breakdown.perGod 缺失时回退到 `score.perGod`（legacy 兼容）
 *   - 验收规则：Explain 与验收测试必须使用此访问器，禁止直接 `score.perGod` 访问
 *
 * @param score 评分结果（TenGodScoreResult 或 ExtendedTenGodScoreResult）
 * @returns per-god 评分记录；若两者均缺失则返回空对象
 */
export function getScorePerGod(
  score: { perGod?: Record<string, number>; breakdown?: { perGod?: Record<string, number> } } | null | undefined,
): Record<string, number> {
  if (!score) return {}
  const bd = score.breakdown
  if (bd && bd.perGod && typeof bd.perGod === 'object') {
    return bd.perGod
  }
  if (score.perGod && typeof score.perGod === 'object') {
    return score.perGod
  }
  return {}
}

/**
 * P1.2.1-A3 类型保护：判定评分结果是否已迁移到 `breakdown.perGod` 规范路径。
 * 用于验收测试断言「Explain 不再依赖 legacy score.perGod」。
 */
export function hasCanonicalPerGod(
  score: { breakdown?: { perGod?: unknown } } | null | undefined,
): boolean {
  return !!(score?.breakdown?.perGod && typeof score.breakdown.perGod === 'object')
}
