/**
 * MarriageEngine — P2-3.7 婚姻引擎
 *
 * 基于日主五行、旺衰、用神、格局、日支（配偶宫）分析婚姻感情。
 *
 * 核心思路：
 *   1. 日支为配偶宫，日支五行与日主五行的生克关系决定婚姻基调
 *   2. 男命以财星（我克者）为妻，女命以官杀（克我者）为夫
 *   3. 身旺配偶星受制→配偶有压力；身弱配偶星为忌→婚姻不顺
 *   4. 桃花查法：寅午戌见卯，亥卯未见子，申子辰见酉，巳酉丑见午
 *   5. 日支逢冲（子午冲、卯酉冲等）→婚姻不稳
 *   6. 用神在配偶宫→婚姻助运；忌神在配偶宫→婚姻拖累
 *
 * Plugin 接入，不修改 Kernel。
 */

import type { FiveElement, HeavenlyStem, EarthlyBranch } from '../../types'
import { STEM_ELEMENT, BRANCH_ELEMENT, GENERATE, OVERCOME } from '../../../core'

// ─── 类型定义 ───

export interface MarriageResult {
  marriageQuality: string
  marriageScore: number
  spouseFeatures: string[]
  lovePattern: string
  marriageTiming: string
  riskFactors: string[]
  peachBlossom: string
  classicalRef: string
}

// ─── 天干阴阳 ───

const STEM_YINYANG: Record<HeavenlyStem, '阳' | '阴'> = {
  '甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴',
  '戊': '阳', '己': '阴', '庚': '阳', '辛': '阴',
  '壬': '阳', '癸': '阴',
}

// ─── 六冲 ───

const LIU_CHONG: Record<string, string> = {
  '子': '午', '午': '子',
  '卯': '酉', '酉': '卯',
  '寅': '申', '申': '寅',
  '巳': '亥', '亥': '巳',
  '辰': '戌', '戌': '辰',
  '丑': '未', '未': '丑',
}

// ─── 桃花查法 ───

const TAO_HUA_MAP: Record<string, string> = {
  '寅': '卯', '午': '卯', '戌': '卯',
  '申': '酉', '子': '酉', '辰': '酉',
  '亥': '子', '卯': '子', '未': '子',
  '巳': '午', '酉': '午', '丑': '午',
}

// ─── 地支配偶宫特征 ───

const SPOUSE_PALACE_TRAITS: Partial<Record<EarthlyBranch, string[]>> = {
  '子': ['聪明灵活', '善于沟通', '有文采'],
  '丑': ['勤劳朴实', '踏实稳重', '善于持家'],
  '寅': ['有进取心', '性格直率', '有冒险精神'],
  '卯': ['温柔体贴', '有艺术气质', '善解人意'],
  '辰': ['稳重有城府', '多才多艺', '善于规划'],
  '巳': ['聪明能干', '热情开朗', '有主见'],
  '午': ['热情大方', '有领导力', '善于表达'],
  '未': ['温和善良', '有包容心', '重视家庭'],
  '申': ['果断灵活', '口才好', '适应力强'],
  '酉': ['注重形象', '有审美', '细心严谨'],
  '戌': ['忠诚可靠', '有责任心', '重视承诺'],
  '亥': ['智慧深沉', '想象力丰富', '感情内敛'],
}

// ─── 日支五行与日主关系 → 婚姻基调 ───

const ALL_ELEMENTS: FiveElement[] = ['木', '火', '土', '金', '水']

const PALACE_RELATION_LABEL: Record<string, string> = {
  '生': '配偶关爱命主，婚姻中有被呵护的感觉。',
  '克': '配偶对命主有约束力，婚姻中有一定的压力但也意味着成长。',
  '同': '夫妻志趣相投，性格相似，容易互相理解。',
  '泄': '命主对配偶付出较多，婚姻中主动性强。',
  '耗': '配偶消耗命主精力，需注意平衡付出与收获。',
}

// ─── 古籍引用 ───

const CLASSICAL_REFS: Record<FiveElement, string> = {
  '木': '《三命通会》云："木命主人仁慈好施，婚姻宜配水火之命。"木日主配偶星为土，配土命之人可成家立业。',
  '火': '《三命通会》云："火命主人热情有礼，婚姻宜配木水之命。"火日主配偶星为金，配金命之人刚柔并济。',
  '土': '《三命通会》云："土命主人厚重守信，婚姻宜配火金之命。"土日主配偶星为水，配水命之人沉稳灵动互补。',
  '金': '《三命通会》云："金命主人义气果断，婚姻宜配土木之命。"金日主配偶星为木，配木命之人刚柔互补。',
  '水': '《三命通会》云："水命主人智慧圆融，婚姻宜配金木之命。"水日主配偶星为火，配火命之人水火既济。',
}

// ─── 核心引擎 ───

export function analyzeMarriage(
  dayElement: FiveElement,
  dayGan: HeavenlyStem,
  strengthLevel: string,
  useGodElement: FiveElement,
  geJuName: string,
  elementCount: Record<FiveElement, number>,
  allZhi: EarthlyBranch[],
): MarriageResult {
  const isMale = STEM_YINYANG[dayGan] === '阳'
  const isStrong = strengthLevel.includes('Strong') || strengthLevel === '极旺' || strengthLevel === '偏旺'
  const isWeak = strengthLevel.includes('Weak') || strengthLevel === '极弱' || strengthLevel === '偏弱'
  const isBalanced = !isStrong && !isWeak

  // ─── 1. 配偶宫分析（日支） ───
  const dayZhi = allZhi[2] // 日支是第三个地支
  const palaceElement = dayZhi ? BRANCH_ELEMENT[dayZhi] : null
  const palaceRelation = palaceElement ? getElementRelation(dayElement, palaceElement) : '同'

  // ─── 2. 配偶星 ───
  // 男命以财星为妻星，女命以官杀为夫星
  const spouseElement = isMale ? OVERCOME[dayElement] : getKeElement(dayElement)
  const spouseCount = spouseElement ? (elementCount[spouseElement] || 0) : 0

  // ─── 3. 婚姻评分 ───
  let marriageScore = 50

  // 配偶宫与用神关系
  if (palaceElement === useGodElement) marriageScore += 15
  // 配偶星为用神
  if (spouseElement === useGodElement) marriageScore += 10
  // 身中和最佳
  if (isBalanced) marriageScore += 10
  // 配偶星数量适中（1-2个最佳）
  if (spouseCount >= 1 && spouseCount <= 2) marriageScore += 8
  if (spouseCount === 0) marriageScore -= 5
  if (spouseCount >= 4) marriageScore -= 8 // 过多则感情复杂

  // 配偶宫逢冲
  if (dayZhi && LIU_CHONG[dayZhi] && allZhi.includes(LIU_CHONG[dayZhi] as EarthlyBranch)) {
    marriageScore -= 12
  }

  marriageScore = clamp(marriageScore, 0, 100)

  // ─── 4. 婚姻质量 ───
  let marriageQuality: string
  if (marriageScore >= 80) marriageQuality = '佳'
  else if (marriageScore >= 55) marriageQuality = '中'
  else marriageQuality = '差'

  // ─── 5. 配偶特点 ───
  const spouseFeatures = buildSpouseFeatures(
    dayZhi, palaceElement, palaceRelation, spouseElement, isMale,
  )

  // ─── 6. 恋爱模式 ───
  const lovePattern = buildLovePattern(
    dayElement, isStrong, isWeak, isBalanced, palaceRelation,
  )

  // ─── 7. 结婚时间建议 ───
  const marriageTiming = buildMarriageTiming(
    dayElement, isStrong, isWeak, useGodElement,
  )

  // ─── 8. 风险因素 ───
  const riskFactors = buildRiskFactors(
    dayZhi, palaceElement, spouseElement, spouseCount,
    isStrong, isWeak, useGodElement, elementCount, allZhi, dayElement,
  )

  // ─── 9. 桃花状态 ───
  const peachBlossom = analyzePeachBlossom(allZhi)

  // ─── 10. 古籍引用 ───
  const classicalRef = CLASSICAL_REFS[dayElement]

  return {
    marriageQuality,
    marriageScore,
    spouseFeatures,
    lovePattern,
    marriageTiming,
    riskFactors,
    peachBlossom,
    classicalRef,
  }
}

// ─── 辅助函数 ───

function getElementRelation(self: FiveElement, other: FiveElement): string {
  if (other === self) return '同'
  if (GENERATE[other] === self) return '生'   // other 生 self
  if (OVERCOME[other] === self) return '克'   // other 克 self
  if (GENERATE[self] === other) return '泄'   // self 生 other
  return '耗'                                 // self 克 other
}

/** 获取克日主的五行（官杀） */
function getKeElement(dayElement: FiveElement): FiveElement {
  const map: Record<FiveElement, FiveElement> = {
    '木': '金', '火': '水', '土': '木', '金': '火', '水': '土',
  }
  return map[dayElement]
}

function buildSpouseFeatures(
  dayZhi: EarthlyBranch | undefined,
  palaceElement: FiveElement | null,
  palaceRelation: string,
  spouseElement: FiveElement | undefined,
  isMale: boolean,
): string[] {
  const features: string[] = []

  // 配偶宫地支特征
  if (dayZhi && SPOUSE_PALACE_TRAITS[dayZhi]) {
    features.push(...SPOUSE_PALACE_TRAITS[dayZhi].slice(0, 2))
  }

  // 配偶星五行特征
  if (spouseElement) {
    const elementTraits: Partial<Record<FiveElement, string>> = {
      '木': `${isMale ? '妻子' : '丈夫'}有${palaceElement === '木' ? '温和善良' : '上进心强'}的特质`,
      '火': `${isMale ? '妻子' : '丈夫'}性格${isMale ? '热情大方' : '果断有力'}`,
      '土': `${isMale ? '妻子' : '丈夫'}为人${isMale ? '踏实稳重' : '忠诚可靠'}`,
      '金': `${isMale ? '妻子' : '丈夫'}行事${isMale ? '细心严谨' : '义气果断'}`,
      '水': `${isMale ? '妻子' : '丈夫'}思维${isMale ? '灵活善变' : '深沉智慧'}`,
    }
    const trait = elementTraits[spouseElement]
    if (trait) features.push(trait)
  }

  // 配偶宫与日主关系
  if (palaceRelation) {
    const relTrait = PALACE_RELATION_LABEL[palaceRelation]
    if (relTrait) features.push(relTrait)
  }

  return features.slice(0, 5)
}

function buildLovePattern(
  dayElement: FiveElement,
  isStrong: boolean,
  isWeak: boolean,
  isBalanced: boolean,
  palaceRelation: string,
): string {
  if (isStrong) {
    if (palaceRelation === '克') {
      return `${dayElement}日主身旺，配偶宫来克，感情中容易吸引有主见、有魄力的伴侣。恋爱模式偏向热烈主动，但不免有争执。建议在激情中保持理性。`
    }
    return `${dayElement}日主身旺，精力充沛，感情中主动性强。恋爱模式偏向主动追求，但需注意给伴侣留出空间。`
  }
  if (isWeak) {
    if (palaceRelation === '生') {
      return `${dayElement}日主身弱，配偶宫生扶，感情中容易得到伴侣的关爱和照顾。恋爱模式偏向被动接受，适合温柔体贴的伴侣。`
    }
    return `${dayElement}日主身弱，感情中较为被动谨慎。恋爱模式偏向慢热型，需要时间建立信任，一旦认定便十分专一。`
  }

  // 中和
  if (palaceRelation === '同') {
    return `${dayElement}日主中和，配偶宫与日主同气，感情中容易找到志趣相投的伴侣。恋爱模式偏向平等对话、共同成长。`
  }
  return `${dayElement}日主中和，感情观理性务实。恋爱模式偏向互相尊重、稳步推进，不急不躁水到渠成。`
}

function buildMarriageTiming(
  dayElement: FiveElement,
  isStrong: boolean,
  isWeak: boolean,
  useGodElement: FiveElement,
): string {
  // 基于用神五行推断有利婚配年份的五行
  if (isWeak) {
    return `身弱之命宜在印比大运或流年成婚（生我者和同我者五行旺的年份），此时自身有根基，婚姻更稳固。建议25-32岁之间，待事业稍有基础后步入婚姻。`
  }
  if (isStrong) {
    return `身旺之命宜在财星或食伤大运流年成婚（${OVERCOME[dayElement]}、${GENERATE[dayElement]}五行旺的年份），此时配偶星到位，感情成熟。建议23-30岁之间，感情水到渠成。`
  }
  return `日主${dayElement}中和，婚期较为灵活，以感情成熟、事业稳定为宜。建议在${useGodElement}五行旺的年份（大运或流年逢之），婚姻最为顺遂。`
}

function buildRiskFactors(
  dayZhi: EarthlyBranch | undefined,
  palaceElement: FiveElement | null,
  spouseElement: FiveElement | undefined,
  spouseCount: number,
  isStrong: boolean,
  isWeak: boolean,
  useGodElement: FiveElement,
  elementCount: Record<FiveElement, number>,
  allZhi: EarthlyBranch[],
  dayElement: FiveElement,
): string[] {
  const risks: string[] = []

  // 日支逢冲
  if (dayZhi && LIU_CHONG[dayZhi] && allZhi.includes(LIU_CHONG[dayZhi] as EarthlyBranch)) {
    risks.push(`日支${dayZhi}与${LIU_CHONG[dayZhi]}相冲，配偶宫不稳，婚姻中容易出现外部干扰或住址变动。`)
  }

  // 配偶星过多
  if (spouseCount >= 4) {
    risks.push(`配偶星过旺（${spouseElement}气${spouseCount}个），异性缘过旺反成困扰，婚后需特别注意与异性保持距离。`)
  }

  // 配偶星缺失
  if (spouseCount === 0) {
    risks.push(`命局不见配偶星（${spouseElement}），感情缘分偏薄，婚姻可能来得较晚，需主动拓展社交圈。`)
  }

  // 身旺克配偶星
  if (isStrong && spouseElement && (elementCount[spouseElement] || 0) <= 1) {
    risks.push(`身旺而配偶星弱，婚后可能对配偶要求过高，需学会包容与欣赏。`)
  }

  // 配偶宫坐忌神
  if (palaceElement && palaceElement !== useGodElement) {
    // 简化：如果配偶宫五行在命局中过旺且非用神
    if ((elementCount[palaceElement] || 0) >= 3) {
      risks.push(`配偶宫坐${palaceElement}气且偏旺，配偶可能性格强势，婚姻中需注意沟通方式。`)
    }
  }

  // 伤官见官（女命尤忌）
  const shiShangElement = GENERATE[dayElement]
  const dayKeElement = getKeElement(dayElement)
  if (elementCount[shiShangElement] >= 2 && spouseElement === dayKeElement) {
    risks.push(`食伤旺而见官杀（${shiShangElement}克${spouseElement}），婚后容易因言语伤感情，需注意沟通分寸。`)
  }

  if (risks.length === 0) {
    risks.push('命局婚姻宫位安稳，无明显风险因素，保持正常经营即可。')
  }

  return risks
}

function analyzePeachBlossom(allZhi: EarthlyBranch[]): string {
  // 检查四柱中是否有桃花
  for (const zhi of allZhi) {
    const taohuaSources = Object.keys(TAO_HUA_MAP).filter(k => TAO_HUA_MAP[k] === zhi)
    for (const src of taohuaSources) {
      if (allZhi.includes(src as EarthlyBranch)) {
        const isYear = allZhi[0] === src
        const source = isYear ? '年支' : '其他柱'
        return `命带桃花（${source}${src}见${zhi}），异性缘旺，人缘好，在感情方面有天然的吸引力。《三命通会》云："咸池又名桃花，主人风流倜傥，艺术天赋。"桃花为中性神煞，为喜用则利感情，为忌神则需防桃花劫。`
      }
    }
  }
  return '命局不带桃花，感情缘分适中，异性缘不特别旺盛也不特别平淡。感情之事需主动经营。'
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}
