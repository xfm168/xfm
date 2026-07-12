/**
 * WealthEngine — P2-3.7 财富引擎
 *
 * 基于日主五行、旺衰、用神、格局分析财运走势。
 *
 * 核心思路：
 *   1. 身旺能担财→财运看财星（我克者为财）的强弱
 *   2. 身弱不能担财→财运看印比是否扶身，财多为忌反为祸
 *   3. 正财=稳定收入（工资），偏财=流动财富（投资/副业）
 *   4. 财库看地支是否藏财：辰（水库）、戌（火库）、丑（金库）、未（木库）
 *   5. 漏财看伤官是否太旺+财无库
 *   6. 用神为财星则求财顺利，用神克财则需先补用神
 *
 * Plugin 接入，不修改 Kernel。
 */

import type { FiveElement } from '../../types'
import { GENERATE } from '../../../core'

// ─── 类型定义 ───

export interface WealthResult {
  wealthLevel: string
  wealthScore: number
  zhengCai: { strength: string; description: string }
  pianCai: { strength: string; description: string }
  caiKu: string
  leakageRisk: string
  gatherAbility: string
  bestMethod: string[]
  riskWarning: string[]
  classicalRef: string
}

// ─── 五行生克关系 ───

// 我克者为财
const WEALTH_OF: Record<FiveElement, FiveElement> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
}
// 生我者为印
const PRINT_OF: Record<FiveElement, FiveElement> = {
  '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
}
// 同我者为比肩劫财
const ALL_ELEMENTS: FiveElement[] = ['木', '火', '土', '金', '水']

// ─── 财库对应 ───
// 辰为水库、戌为火库、丑为金库、未为木库、辰戌丑未也是土库
const CAI_KU_MAP: Record<string, string> = {
  '木': '未',   // 木库在未
  '火': '戌',   // 火库在戌
  '土': '辰',   // 土库在辰（壬水库也在辰，但辰戌丑未皆属土）
  '金': '丑',   // 金库在丑
  '水': '辰',   // 水库在辰
}

// ─── 古籍引用 ───

const CLASSICAL_REFS: Record<FiveElement, string> = {
  '木': '《三命通会》云："木主仁，财星为土，木克土为财。身旺财旺，富贵双全。"木日主求财，首重身旺能担，次看财星有力。',
  '火': '《三命通会》云："火主礼，财星为金，火克金为财。火旺金熔，需火柔金坚方为佳。"火日主求财，切忌火太旺而克财太过。',
  '土': '《三命通会》云："土主信，财星为水，土克水为财。土水相交，需有木疏土方成器。"土日主求财，宜见木疏方能流通。',
  '金': '《三命通会》云："金主义，财星为木，金克木为财。金坚木弱，财来有源。"金日主求财，宜金木相当时最佳。',
  '水': '《三命通会》云："水主智，财星为火，水克火为财。水火既济，大富之象。"水日主求财，水火均衡则富贵可期。',
}

// ─── 核心引擎 ───

export function analyzeWealth(
  dayElement: FiveElement,
  strengthLevel: string,
  useGodElement: FiveElement,
  geJuName: string,
  strengthScore: number,
  elementCount: Record<FiveElement, number>,
): WealthResult {
  const isStrong = strengthLevel.includes('Strong') || strengthLevel === '极旺' || strengthLevel === '偏旺'
  const isWeak = strengthLevel.includes('Weak') || strengthLevel === '极弱' || strengthLevel === '偏弱'
  const isBalanced = !isStrong && !isWeak

  // 财星五行 = 我克者
  const wealthElement = WEALTH_OF[dayElement]
  // 印星五行 = 生我者
  const printElement = PRINT_OF[dayElement]
  // 食伤五行 = 我生者
  const shiShangElement = GENERATE[dayElement]

  const wealthCount = elementCount[wealthElement] || 0
  const printCount = elementCount[printElement] || 0
  const shiShangCount = elementCount[shiShangElement] || 0

  // ─── 1. 财富等级 ───
  const { wealthLevel, wealthScore } = calcWealthLevel(
    isStrong, isWeak, isBalanced, wealthCount, shiShangCount,
    useGodElement, wealthElement, geJuName, dayElement,
  )

  // ─── 2. 正财分析（稳定收入） ───
  const zhengCai = analyzeZhengCai(wealthCount, isStrong, isWeak, dayElement)

  // ─── 3. 偏财分析（投资/意外之财） ───
  // 偏财 = 同财星但在不同位置（简化：财星数量>=2则有偏财基础）
  const pianCai = analyzePianCai(wealthCount, shiShangCount, isStrong, isWeak, dayElement)

  // ─── 4. 财库分析 ───
  const caiKu = analyzeCaiKu(wealthElement, elementCount)

  // ─── 5. 漏财风险 ───
  const leakageRisk = analyzeLeakageRisk(shiShangCount, wealthCount, isWeak, isStrong, elementCount)

  // ─── 6. 聚财能力 ───
  const gatherAbility = analyzeGatherAbility(isStrong, isWeak, wealthCount, shiShangCount, elementCount)

  // ─── 7. 最佳求财方式 ───
  const bestMethod = determineBestMethod(
    isStrong, isWeak, isBalanced, useGodElement, wealthElement,
    shiShangElement, shiShangCount, wealthCount,
  )

  // ─── 8. 风险提示 ───
  const riskWarning = buildRiskWarnings(
    isStrong, isWeak, wealthCount, shiShangCount,
    useGodElement, wealthElement, elementCount,
  )

  // ─── 9. 古籍引用 ───
  const classicalRef = CLASSICAL_REFS[dayElement]

  return {
    wealthLevel,
    wealthScore,
    zhengCai,
    pianCai,
    caiKu,
    leakageRisk,
    gatherAbility,
    bestMethod,
    riskWarning,
    classicalRef,
  }
}

// ─── 辅助函数 ───

function calcWealthLevel(
  isStrong: boolean,
  isWeak: boolean,
  isBalanced: boolean,
  wealthCount: number,
  shiShangCount: number,
  useGodElement: FiveElement,
  wealthElement: FiveElement,
  geJuName: string,
  dayElement: FiveElement,
): { wealthLevel: string; wealthScore: number } {
  let score = 40

  // 身旺能担财
  if (isStrong) {
    score += wealthCount >= 2 ? 30 : wealthCount >= 1 ? 20 : 5
  } else if (isBalanced) {
    score += wealthCount >= 2 ? 25 : wealthCount >= 1 ? 15 : 0
  } else {
    // 身弱：财多为忌反不好
    score += wealthCount <= 1 ? 10 : wealthCount >= 3 ? -10 : 0
  }

  // 用神为财星则求财有源
  if (useGodElement === wealthElement) score += 15
  // 用神为食伤则生财有道
  const shiShangEl = GENERATE[dayElement]
  if (useGodElement === shiShangEl) score += 10

  // 格局加分
  if (geJuName.includes('正财') || geJuName.includes('偏财')) score += 10
  if (geJuName.includes('食神生财')) score += 12

  score = clamp(score, 0, 100)

  let level: string
  if (score >= 85) level = '大富'
  else if (score >= 70) level = '中富'
  else if (score >= 50) level = '小康'
  else if (score >= 30) level = '普通'
  else level = '清贫'

  return { wealthLevel: level, wealthScore: score }
}

function analyzeZhengCai(
  wealthCount: number,
  isStrong: boolean,
  isWeak: boolean,
  dayElement: FiveElement,
): { strength: string; description: string } {
  let strength: string
  let description: string

  if (wealthCount >= 3) {
    strength = '旺'
    description = `正财星旺，${WEALTH_OF[dayElement]}气充盈，稳定收入来源较多，有较强的正财基础。`
  } else if (wealthCount >= 2) {
    strength = '中等'
    description = `正财星有气，${WEALTH_OF[dayElement]}气适中，有稳定的正财收入，适合工薪阶层稳步积累。`
  } else if (wealthCount >= 1) {
    strength = '弱'
    description = `正财星偏弱，${WEALTH_OF[dayElement]}气不足，正财收入有限，不宜依赖单一工资来源。`
  } else {
    strength = '极弱'
    description = `正财星缺失，命局不见${WEALTH_OF[dayElement]}之气，正财来路不多，需靠食伤生财或印星护身。`
  }

  if (isWeak && wealthCount >= 2) {
    description += '身弱财多，虽有收入但开销也大，宜注意理财节流。'
  }
  if (isStrong && wealthCount >= 2) {
    description += '身旺能担财，正财为用，收入稳步增长。'
  }

  return { strength, description }
}

function analyzePianCai(
  wealthCount: number,
  shiShangCount: number,
  isStrong: boolean,
  isWeak: boolean,
  dayElement: FiveElement,
): { strength: string; description: string } {
  let strength: string
  let description: string

  // 偏财看财星+食伤的配合
  const pianScore = wealthCount + shiShangCount

  if (pianScore >= 4) {
    strength = '旺'
    description = `偏财星旺，食伤生财有力，${GENERATE[dayElement]}与${WEALTH_OF[dayElement]}配合良好，投资理财、副业收入有潜力。`
  } else if (pianScore >= 3) {
    strength = '中等'
    description = `偏财星有气，有一定的投资理财天赋，可通过副业或投资增加收入。`
  } else if (pianScore >= 2) {
    strength = '弱'
    description = `偏财星偏弱，投资运势一般，不宜冒大风险，宜小本经营、稳健理财。`
  } else {
    strength = '极弱'
    description = `偏财星不足，不宜追求一夜暴富，靠勤劳致富更为稳妥。`
  }

  if (isWeak) {
    description += '身弱之命偏财来去匆匆，得财后容易花出，需养成储蓄习惯。'
  }

  return { strength, description }
}

function analyzeCaiKu(wealthElement: FiveElement, elementCount: Record<FiveElement, number>): string {
  const kuZhi = CAI_KU_MAP[wealthElement]
  // 简化：检查命局中是否有财库五行（土的四墓库都属土）
  const earthCount = elementCount['土'] || 0
  const wealthCount = elementCount[wealthElement] || 0

  if (earthCount >= 3 && wealthCount >= 1) {
    return `财库充盈（${wealthElement}库在${kuZhi}），命局中库位坚实，钱财能聚得住，属于有财有库之命。`
  }
  if (earthCount >= 2) {
    return `财库尚可（${wealthElement}库在${kuZhi}），有一定的蓄财能力，但库不太满，需注意开源节流。`
  }
  return `财库偏薄（${wealthElement}库在${kuZhi}），命局中库位不固，钱财来得快去得也快，需特别注重理财。`
}

function analyzeLeakageRisk(
  shiShangCount: number,
  wealthCount: number,
  isWeak: boolean,
  isStrong: boolean,
  elementCount: Record<FiveElement, number>,
): string {
  // 伤官（食伤过旺）+ 身弱 → 漏财
  // 水多 → 财（火）被克 → 漏财
  const waterCount = elementCount['水'] || 0

  if (shiShangCount >= 3 && isWeak) {
    return '高风险：食伤过旺泄身太过，虽有生财之能但自身难担，钱财左手进右手出。'
  }
  if (shiShangCount >= 3) {
    return '中等风险：食伤较旺，花钱大方，需刻意控制消费欲望。'
  }
  if (waterCount >= 3 && wealthCount <= 1) {
    return '中等风险：水旺财（火）弱，钱财容易被冲散，不宜大额消费。'
  }
  if (wealthCount >= 2 && isStrong) {
    return '低风险：身旺财旺有担当，钱财不易流失。'
  }
  return '低风险：财星有制化，漏财风险不大，保持正常消费习惯即可。'
}

function analyzeGatherAbility(
  isStrong: boolean,
  isWeak: boolean,
  wealthCount: number,
  shiShangCount: number,
  elementCount: Record<FiveElement, number>,
): string {
  const earthCount = elementCount['土'] || 0

  // 土主收藏，金主积聚
  if (earthCount >= 2 && isStrong) {
    return '聚财能力强：土旺收藏有力，身旺能存住钱财，善于积累财富。'
  }
  if (isStrong && wealthCount >= 1) {
    return '聚财能力中等偏上：身旺财有根，有较好的蓄财基础。'
  }
  if (isWeak) {
    return '聚财能力偏弱：身弱难以守住钱财，建议借助家人或理财产品辅助聚财。'
  }
  if (shiShangCount >= 3) {
    return '聚财能力一般：食伤旺者花钱爽快，聚财需靠后天修炼。'
  }
  return '聚财能力中等：具备基本的理财意识，注意养成储蓄习惯即可。'
}

function determineBestMethod(
  isStrong: boolean,
  isWeak: boolean,
  isBalanced: boolean,
  useGodElement: FiveElement,
  wealthElement: FiveElement,
  shiShangElement: FiveElement,
  shiShangCount: number,
  wealthCount: number,
): string[] {
  const methods: string[] = []

  // 身弱宜稳定工资
  if (isWeak) {
    methods.push('工资')
  }
  // 身旺财旺可投资
  if (isStrong && wealthCount >= 1) {
    methods.push('投资')
  }
  // 食伤旺可创业/副业
  if (shiShangCount >= 2 || useGodElement === shiShangElement) {
    methods.push('副业')
    if (isStrong) methods.push('创业')
  }
  // 中和者可多渠道
  if (isBalanced) {
    methods.push('工资')
    if (wealthCount >= 1) methods.push('投资')
  }

  // 至少给一个建议
  if (methods.length === 0) {
    methods.push('工资')
  }

  return methods
}

function buildRiskWarnings(
  isStrong: boolean,
  isWeak: boolean,
  wealthCount: number,
  shiShangCount: number,
  useGodElement: FiveElement,
  wealthElement: FiveElement,
  elementCount: Record<FiveElement, number>,
): string[] {
  const warnings: string[] = []

  if (isWeak && wealthCount >= 3) {
    warnings.push('身弱财多，"富屋贫人"之象，不宜贪求大财，先强身再求财。')
  }
  if (shiShangCount >= 3) {
    warnings.push('食伤过旺，花钱冲动，建议设定每月预算上限。')
  }
  if (useGodElement === wealthElement && isWeak) {
    warnings.push('用神为财但身弱，可求财但需量力而行，不宜借贷投资。')
  }

  const jiShenElement = getJiShen(useGodElement)
  if (jiShenElement === wealthElement) {
    warnings.push('财星为忌神，不宜投机取巧，正道求财方能长久。')
  }

  // 忌神为比肩劫财，则易被争夺
  // 简化：日主五行过多则劫财风险
  const dayCount = elementCount[useGodElement] || 0
  // 此处不直接用 dayElement，用 useGodElement 的对冲
  if (elementCount['水'] >= 3 && wealthElement === '火') {
    warnings.push('水旺克火（财星），财务容易被意外消耗，建议购买保险。')
  }

  if (warnings.length === 0) {
    warnings.push('命局财运平稳，保持稳健理财即可，无需过度担忧。')
  }

  return warnings
}

/** 简化忌神推算：克用神者为忌 */
function getJiShen(useGodElement: FiveElement): FiveElement {
  const map: Record<FiveElement, FiveElement> = {
    '木': '金', '火': '水', '土': '木', '金': '火', '水': '土',
  }
  return map[useGodElement]
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}
