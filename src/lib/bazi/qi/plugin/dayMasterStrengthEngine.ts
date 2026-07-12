/**
 * DayMasterStrengthEngine — P2-2 旺衰系统核心引擎
 * 
 * 权重模型（源自《滴天髓》《五行精纪》）：
 *   得令（月令司令）  50%  — "得令如当县长"
 *   得地（通根）      30%  — "得根如有家室"
 *   得势（多助）      20%  — "得助如有朋友"
 * 
 * 综合输出：
 *   strengthScore: 0-100（连续分值）
 *   strengthLevel: VeryWeak / Weak / Balanced / Strong / VeryStrong
 * 
 * 原则：
 *   - 禁止使用简单五行计数决定旺衰
 *   - 必须采用权重模型
 *   - 所有算法来自 Rule Engine
 *   - Explain 必须引用古籍来源
 *   - Plugin 方式接入，不修改 Kernel
 */

import type { SixLines, FiveElement, HeavenlyStem, EarthlyBranch } from '../../types'
import { getStemElement, getBranchElement, WANG_SHUAI_TABLE, GENERATE, OVERCOME } from '@/lib/core'
import { getChangSheng } from '../../changsheng'
import type { FiveElementPowerResult } from '../../fiveElementPower'
import { calculateFiveElementPower } from '../../fiveElementPower'

// ─── 类型定义 ───

export type StrengthLevel = 'VeryWeak' | 'Weak' | 'Balanced' | 'Strong' | 'VeryStrong'

export interface StrengthDimension {
  /** 维度名称 */
  name: string
  /** 权重 0-1 */
  weight: number
  /** 原始分值 0-100 */
  rawScore: number
  /** 加权分值 */
  weightedScore: number
  /** 判定依据 */
  reason: string
  /** 古籍出处 */
  classicalSource: string
}

export interface ChangShengDetail {
  pillar: string       // 年/月/日/时
  zhi: EarthlyBranch
  state: string         // 十二长生状态
  isBeneficial: boolean // 是否有利（长生/冠带/临官/帝旺）
}

export interface DayMasterStrengthResult {
  /** 综合旺衰分值 0-100 */
  strengthScore: number
  /** 旺衰等级 */
  strengthLevel: StrengthLevel
  /** 旺衰等级（中文） */
  strengthLevelCN: string
  /** 是否得令 */
  deLing: boolean
  /** 是否得地 */
  deDi: boolean
  /** 是否得势 */
  deShi: boolean
  /** 是否通根 */
  tongGen: boolean
  /** 是否透干 */
  touGan: boolean
  /** 旺相休囚死状态 */
  wangShuai: string
  /** 各维度详细分析 */
  dimensions: StrengthDimension[]
  /** 十二长生明细 */
  changShengDetails: ChangShengDetail[]
  /** 生扶力量 */
  shengFuPower: number
  /** 克泄耗力量 */
  keXiePower: number
  /** 推理过程（用于 Explain） */
  reasoning: string[]
  /** 古籍引用 */
  classicalQuote?: string
  /** 五行力量分析（复用） */
  fiveElementPower: FiveElementPowerResult
}

// ─── 十二长生对照表（复用核心常量） ───

const BENEFICIAL_STATES = new Set(['长生', '冠带', '临官', '帝旺'])

// ─── 藏干表（复用） ───

const CANG_GAN_TABLE: Record<string, { ben: string; zhong: string | null; yao: string | null }> = {
  '子': { ben: '癸', zhong: null, yao: null },
  '丑': { ben: '己', zhong: '辛', yao: '癸' },
  '寅': { ben: '甲', zhong: '丙', yao: '戊' },
  '卯': { ben: '乙', zhong: null, yao: null },
  '辰': { ben: '戊', zhong: '乙', yao: '癸' },
  '巳': { ben: '丙', zhong: '庚', yao: '戊' },
  '午': { ben: '丁', zhong: '己', yao: null },
  '未': { ben: '己', zhong: '丁', yao: '乙' },
  '申': { ben: '庚', zhong: '壬', yao: '戊' },
  '酉': { ben: '辛', zhong: null, yao: null },
  '戌': { ben: '戊', zhong: '辛', yao: '丁' },
  '亥': { ben: '壬', zhong: '甲', yao: null },
}

// ─── 核心引擎 ───

/**
 * 计算日主旺衰（权重模型）
 *
 * 权重分配（源自传统命理）：
 *  - 得令（月令司令）：50%
 *  - 得地（通根）：30%
 *  - 得势（多助/透干）：20%
 *
 * 同时参考：
 *  - 十二长生（修正系数 ±5）
 *  - 五行数量（最低权重，修正系数 ±3）
 *  - 生扶克泄耗比（修正系数 ±5）
 */
export function calculateDayMasterStrength(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  monthZhi: EarthlyBranch,
): DayMasterStrengthResult {
  const dayElement = getStemElement(dayGan)
  const monthElement = getBranchElement(monthZhi)

  // 1. 调用已有五行力量分析（复用 fiveElementPower.ts 的完整逻辑）
  const fePower = calculateFiveElementPower(sixLines, dayGan, monthZhi)

  // 2. 收集十二长生明细
  const pillars = [
    { name: '年柱', zhi: sixLines.year.zhi },
    { name: '月柱', zhi: sixLines.month.zhi },
    { name: '日柱', zhi: sixLines.day.zhi },
    { name: '时柱', zhi: sixLines.hour.zhi },
  ]
  const changShengDetails: ChangShengDetail[] = pillars.map(p => {
    const cs = getChangSheng(dayGan, p.zhi)
    return {
      pillar: p.name,
      zhi: p.zhi,
      state: cs,
      isBeneficial: BENEFICIAL_STATES.has(cs),
    }
  })

  const beneficialCount = changShengDetails.filter(d => d.isBeneficial).length

  // 3. 计算各维度加权分值

  // ─── 维度①：得令（月令司令）权重 50% ───
  const deLingDim = buildDeLingDimension(dayGan, dayElement, monthZhi, monthElement, fePower)

  // ─── 维度②：得地（通根）权重 30% ───
  const deDiDim = buildDeDiDimension(dayGan, dayElement, sixLines, fePower, changShengDetails)

  // ─── 维度③：得势（多助/透干）权重 20% ───
  const deShiDim = buildDeShiDimension(dayGan, dayElement, sixLines, fePower)

  const dimensions = [deLingDim, deDiDim, deShiDim]

  // 4. 基础综合分值（加权）
  let baseScore = dimensions.reduce((sum, d) => sum + d.weightedScore, 0)

  // 5. 十二长生修正（±5 分）
  const csAdjust = beneficialCount >= 3 ? 5 : beneficialCount >= 2 ? 3 : beneficialCount === 0 ? -5 : 0

  // 6. 生扶克泄耗修正（±5 分）
  const shengFu = fePower.shengFuPower
  const keXie = fePower.keXiePower
  const balanceAdjust = shengFu > keXie ? Math.min(5, (shengFu - keXie) / 4) :
    keXie > shengFu ? Math.max(-5, -(keXie - shengFu) / 4) : 0

  // 7. 五行数量修正（±3 分，最低权重）
  const elementCount = countDayElement(dayElement, sixLines)
  const countAdjust = elementCount >= 5 ? 3 : elementCount >= 4 ? 2 : elementCount <= 1 ? -3 : elementCount === 2 ? -1 : 0

  // 8. 最终分值
  const finalScore = Math.round(Math.max(0, Math.min(100, baseScore + csAdjust + balanceAdjust + countAdjust)))

  // 9. 等级判定
  const { level, levelCN } = determineLevel(finalScore)

  // 10. 推理过程
  const reasoning = buildReasoning(
    dayGan, dayElement, monthZhi, monthElement,
    dimensions, finalScore, levelCN,
    csAdjust, balanceAdjust, countAdjust,
    beneficialCount, shengFu, keXie,
  )

  return {
    strengthScore: finalScore,
    strengthLevel: level,
    strengthLevelCN: levelCN,
    deLing: fePower.deLing,
    deDi: fePower.deDi,
    deShi: fePower.deShi,
    tongGen: fePower.elements.find(e => e.element === dayElement)?.fromTongGen > 0,
    touGan: fePower.touGan,
    wangShuai: WANG_SHUAI_TABLE[monthElement][dayElement] || '休',
    dimensions,
    changShengDetails,
    shengFuPower: shengFu,
    keXiePower: keXie,
    reasoning,
    classicalQuote: '《滴天髓》任铁樵注："旺者宜抑，衰者宜扶。扶抑得中，命局平和。"',
    fiveElementPower: fePower,
  }
}

// ─── 维度构建函数 ───

function buildDeLingDimension(
  dayGan: HeavenlyStem,
  dayElement: FiveElement,
  monthZhi: EarthlyBranch,
  monthElement: FiveElement,
  fePower: FiveElementPowerResult,
): StrengthDimension {
  const ws = WANG_SHUAI_TABLE[monthElement][dayElement]

  let rawScore: number
  let reason: string
  const classical = '《滴天髓》："月令为提纲，得令者旺。得助不如得生，得生不如得根，得根不如得令。"'

  if (ws === '旺') {
    rawScore = 95
    reason = `月令${monthZhi}属${monthElement}，日主${dayGan}（${dayElement}）当令而旺，权重最高（50%）`
  } else if (ws === '相') {
    rawScore = 78
    reason = `月令${monthZhi}属${monthElement}，${monthElement}生${dayElement}（我生者相），日主${dayGan}得令而相`
  } else if (ws === '休') {
    rawScore = 50
    reason = `月令${monthZhi}属${monthElement}，${dayElement}生${monthElement}（我生者休），日主${dayGan}休囚无力`
  } else if (ws === '囚') {
    rawScore = 30
    reason = `月令${monthZhi}属${monthElement}，${(OVERCOME as any)[monthElement] === dayElement ? monthElement + '克' + dayElement : '克我者囚'}，日主${dayGan}失令而囚`
  } else {
    // 死
    rawScore = 12
    reason = `月令${monthZhi}属${monthElement}，${(GENERATE as any)[dayElement] === monthElement ? dayElement + '克' + monthElement : '我克者死'}，日主${dayGan}失令而死`
  }

  return {
    name: '得令（月令司令）',
    weight: 0.50,
    rawScore,
    weightedScore: rawScore * 0.50,
    reason,
    classicalSource: classical,
  }
}

function buildDeDiDimension(
  dayGan: HeavenlyStem,
  dayElement: FiveElement,
  sixLines: SixLines,
  fePower: FiveElementPowerResult,
  changShengDetails: ChangShengDetail[],
): StrengthDimension {
  // 统计通根层级
  let benGenCount = 0  // 本气根
  let zhongGenCount = 0  // 中气根
  let yaoGenCount = 0  // 余气根

  for (const pillar of [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]) {
    const cg = CANG_GAN_TABLE[pillar.zhi]
    if (!cg) continue
    if (getStemElement(cg.ben as any) === dayElement) benGenCount++
    if (cg.zhong && getStemElement(cg.zhong as any) === dayElement) zhongGenCount++
    if (cg.yao && getStemElement(cg.yao as any) === dayElement) yaoGenCount++
  }

  // 有利长生位置数
  const beneficialCount = changShengDetails.filter(d => d.isBeneficial).length

  // 原始分值：综合考虑根气深度和长生位置
  let rawScore: number
  let reason: string
  const classical = '《滴天髓》："干多不如支重。通根如家室之可托，比劫如朋友之相扶。"'

  const rootStrength = benGenCount * 30 + zhongGenCount * 15 + yaoGenCount * 5
  const csBonus = beneficialCount * 8

  rawScore = Math.min(100, rootStrength + csBonus)

  if (rawScore >= 80) {
    reason = `地支有${benGenCount}个本气根、${zhongGenCount}个中气根、${yaoGenCount}个余气根，${beneficialCount}处长生帝旺临官，根基深厚`
  } else if (rawScore >= 50) {
    reason = `地支有${benGenCount}个本气根、${zhongGenCount}个中气根，${beneficialCount}处得地，有一定根基`
  } else if (rawScore >= 20) {
    reason = `地支仅有${zhongGenCount}个中气根或${yaoGenCount}个余气根，根基浅薄`
  } else {
    reason = '地支中无日主之根，十二长生亦不得地，完全无根'
  }

  return {
    name: '得地（通根）',
    weight: 0.30,
    rawScore,
    weightedScore: rawScore * 0.30,
    reason,
    classicalSource: classical,
  }
}

function buildDeShiDimension(
  dayGan: HeavenlyStem,
  dayElement: FiveElement,
  sixLines: SixLines,
  fePower: FiveElementPowerResult,
): StrengthDimension {
  // 统计天干帮扶
  let bijieCount = 0  // 比劫数
  let yinCount = 0  // 印星数

  for (const pillar of [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]) {
    if (pillar.gan === dayGan) continue  // 跳过日主自身
    const el = getStemElement(pillar.gan)
    if (el === dayElement) bijieCount++
    else if ((GENERATE as any)[el] === dayElement) yinCount++
  }

  const tongDangCount = bijieCount + yinCount

  let rawScore: number
  let reason: string
  const classical = '《滴天髓》："旺者宜抑，衰者宜扶。扶抑得中，命局平和。"'

  if (tongDangCount >= 3) {
    rawScore = 90
    reason = `天干中${bijieCount}个比劫+${yinCount}个印星帮扶，得势有力`
  } else if (tongDangCount >= 2) {
    rawScore = 70
    reason = `天干中${bijieCount}个比劫+${yinCount}个印星帮扶，略有得势`
  } else if (tongDangCount >= 1) {
    rawScore = 45
    reason = `天干中仅${bijieCount > 0 ? bijieCount + '个比劫' : yinCount + '个印星'}帮扶，势单力薄`
  } else {
    rawScore = 10
    reason = '天干中无比劫印星帮身，完全不得势'
  }

  // 透干加分
  if (fePower.touGan) {
    rawScore = Math.min(100, rawScore + 8)
    reason += '（日主透干加成）'
  }

  return {
    name: '得势（多助/透干）',
    weight: 0.20,
    rawScore,
    weightedScore: rawScore * 0.20,
    reason,
    classicalSource: classical,
  }
}

// ─── 辅助函数 ───

function countDayElement(element: FiveElement, sixLines: SixLines): number {
  let count = 0
  for (const pillar of [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]) {
    if (pillar.element === element) count++
    // 藏干也计入
    const cg = CANG_GAN_TABLE[pillar.zhi]
    if (cg) {
      if (getStemElement(cg.ben as any) === element) count++
      if (cg.zhong && getStemElement(cg.zhong as any) === element) count += 0.5
      if (cg.yao && getStemElement(cg.yao as any) === element) count += 0.3
    }
  }
  return Math.round(count)
}

function determineLevel(score: number): { level: StrengthLevel; levelCN: string } {
  if (score < 20) return { level: 'VeryWeak', levelCN: '极弱' }
  if (score < 40) return { level: 'Weak', levelCN: '偏弱' }
  if (score < 60) return { level: 'Balanced', levelCN: '中和' }
  if (score < 80) return { level: 'Strong', levelCN: '偏强' }
  return { level: 'VeryStrong', levelCN: '极强' }
}

function buildReasoning(
  dayGan: HeavenlyStem,
  dayElement: FiveElement,
  monthZhi: EarthlyBranch,
  monthElement: FiveElement,
  dimensions: StrengthDimension[],
  finalScore: number,
  levelCN: string,
  csAdjust: number,
  balanceAdjust: number,
  countAdjust: number,
  beneficialCount: number,
  shengFu: number,
  keXie: number,
): string[] {
  const lines: string[] = []

  lines.push(`=== 日主${dayGan}（${dayElement}）旺衰分析 ===`)
  lines.push(`月令：${monthZhi}（${monthElement}）`)

  for (const dim of dimensions) {
    lines.push(``)
    lines.push(`【${dim.name}】权重${(dim.weight * 100).toFixed(0)}%`)
    lines.push(`  分值：${dim.rawScore} × ${(dim.weight * 100).toFixed(0)}% = ${dim.weightedScore.toFixed(1)}`)
    lines.push(`  依据：${dim.reason}`)
  }

  lines.push(``)
  lines.push(`【修正系数】`)
  if (csAdjust !== 0) lines.push(`  十二长生修正：${beneficialCount}处有利位置 → ${csAdjust > 0 ? '+' : ''}${csAdjust}`)
  if (balanceAdjust !== 0) lines.push(`  生扶克泄耗修正：生扶${shengFu} vs 克泄耗${keXie} → ${balanceAdjust > 0 ? '+' : ''}${Math.round(balanceAdjust)}`)
  if (countAdjust !== 0) lines.push(`  五行数量修正 → ${countAdjust > 0 ? '+' : ''}${countAdjust}`)

  const baseScore = dimensions.reduce((sum, d) => sum + d.weightedScore, 0)
  lines.push(``)
  lines.push(`【综合评定】`)
  lines.push(`  基础分：${baseScore.toFixed(1)}`)
  lines.push(`  修正后：${finalScore}`)
  lines.push(`  等级：${levelCN}（${finalScore}/100）`)

  return lines
}
