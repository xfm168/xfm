/**
 * HealthEngine — P2-3.7 健康引擎
 *
 * 基于日主五行、旺衰、气候类型、五行分布、地支分析健康状况。
 *
 * 核心思路：
 *   1. 五行脏腑对应：木→肝胆、火→心脏小肠、土→脾胃、金→肺大肠、水→肾脏膀胱
 *   2. 命局五行偏缺或过旺的五行对应脏腑为健康薄弱环节
 *   3. 克日主的五行所代表的脏腑需重点关注（克我者=疾病入侵方向）
 *   4. 气候类型影响：寒命多肾虚，燥命多肺燥，湿命多脾胃问题
 *   5. 地支刑冲合害影响具体脏腑（如卯酉冲→肝肺交战）
 *   6. 身弱则整体抗病力差；身旺则需防亢盛之疾
 *
 * Plugin 接入，不修改 Kernel。
 */

import type { FiveElement, EarthlyBranch } from '../../types'
import { BRANCH_ELEMENT, GENERATE, OVERCOME } from '../../../core'

// ─── 类型定义 ───

export interface OrganHealth {
  organ: string
  element: string
  risk: number
  symptoms: string[]
  advice: string
}

export interface HealthResult {
  organs: OrganHealth[]
  constitutionType: string
  weakOrgan: string
  overallAdvice: string
  seasonalAdvice: string
  classicalRef: string
}

// ─── 五行脏腑对应 ───

const ORGAN_MAP: Record<FiveElement, { organ: string; pair: string }> = {
  '木': { organ: '肝', pair: '胆' },
  '火': { organ: '心', pair: '小肠' },
  '土': { organ: '脾', pair: '胃' },
  '金': { organ: '肺', pair: '大肠' },
  '水': { organ: '肾', pair: '膀胱' },
}

// ─── 五行脏腑对应 ───

const BRANCH_CLASH: Record<string, { target: string; element1: FiveElement; element2: FiveElement }> = {
  '子': { target: '午', element1: '水', element2: '火' },
  '午': { target: '子', element1: '火', element2: '水' },
  '卯': { target: '酉', element1: '木', element2: '金' },
  '酉': { target: '卯', element1: '金', element2: '木' },
  '寅': { target: '申', element1: '木', element2: '金' },
  '申': { target: '寅', element1: '金', element2: '木' },
  '巳': { target: '亥', element1: '火', element2: '水' },
  '亥': { target: '巳', element1: '水', element2: '火' },
  '辰': { target: '戌', element1: '土', element2: '土' },
  '戌': { target: '辰', element1: '土', element2: '土' },
  '丑': { target: '未', element1: '土', element2: '土' },
  '未': { target: '丑', element1: '土', element2: '土' },
}

// ─── 各脏腑常见症状库 ───

const SYMPTOMS_MAP: Record<FiveElement, { excess: string[]; deficient: string[] }> = {
  '木': {
    excess: ['肝火上炎、头痛目赤、口苦易怒、失眠多梦'],
    deficient: ['肝血不足、视物模糊、爪甲脆薄、肢体麻木、月经不调'],
  },
  '火': {
    excess: ['心烦气躁、口舌生疮、面红目赤、小便短赤'],
    deficient: ['心血不足、心悸怔忡、面色无华、健忘多梦'],
  },
  '土': {
    excess: ['胃热炽盛、口臭便秘、食欲亢进、身体沉重'],
    deficient: ['脾胃虚弱、食欲不振、腹胀便溏、面色萎黄、四肢乏力'],
  },
  '金': {
    excess: ['肺气上逆、咳嗽气喘、鼻塞咽痛、皮肤干燥'],
    deficient: ['肺气不足、气短懒言、声音低微、自汗易感冒'],
  },
  '水': {
    excess: ['肾阳亢奋、耳鸣耳聋、腰膝酸软、头晕目眩'],
    deficient: ['肾精不足、腰膝酸软、畏寒肢冷、耳鸣脱发、夜尿频多'],
  },
}

// ─── 各脏腑养生建议 ───

const ADVICE_MAP: Record<FiveElement, string> = {
  '木': '养肝之法在于"静"与"舒"。《黄帝内经》云："肝主疏泄，喜条达而恶抑郁。"宜保持心情舒畅，避免郁闷恼怒。饮食上多吃绿色蔬菜、酸味食物（如山楂、乌梅），春季尤重养肝。早睡早起（23点前入睡利于肝胆修复），适当运动疏肝理气。',
  '火': '养心之法在于"平"与"静"。《黄帝内经》云："心者，君主之官，神明出焉。"宜避免过度兴奋与剧烈情绪波动。饮食上宜清淡，多吃红色食物（如红枣、莲子），夏季尤重养心。午时（11-13点）小憩片刻可养心神。',
  '土': '养脾之法在于"温"与"节"。《黄帝内经》云："脾胃者，仓廪之官，五味出焉。"宜饮食规律、细嚼慢咽，忌生冷油腻。饮食上多吃黄色食物（如南瓜、小米），长夏（夏末秋初）尤重养脾。适当散步助消化，避免思虑过度。',
  '金': '养肺之法在于"润"与"清"。《黄帝内经》云："肺者，相傅之官，治节出焉。"宜远离烟尘、保持空气清新。饮食上多吃白色食物（如百合、雪梨），秋季尤重养肺。深呼吸练习可增强肺活量，避免悲忧伤肺。',
  '水': '养肾之法在于"藏"与"暖"。《黄帝内经》云："肾者，作强之官，技巧出焉。"宜避免过度劳累、节制房事、注意腰腹保暖。饮食上多吃黑色食物（如黑豆、黑芝麻），冬季尤重养肾。每晚温水泡脚可温补肾阳。',
}

// ─── 体质类型判定 ───

const CONSTITUTION_MAP: Record<FiveElement, string> = {
  '木': '木型体质——《黄帝内经》描述为："木形之人，其色苍，其身小，其头小，其肩背直，其身直。"性格特点为有才华、善思虑、少力多忧。',
  '火': '火型体质——"火形之人，其色赤，其脊背宽广，颜面瘦削，有气魄。"性格特点为热情有礼、性急气盛、精力充沛。',
  '土': '土型体质——"土形之人，其色黄，其面圆头大，肩背丰厚，腹大。"性格特点为稳重踏实、宽容厚道、耐心好。',
  '金': '金型体质——"金形之人，其色白，其面方，其头小，其肩背小。"性格特点为义气果断、清洁肃穆、自律性强。',
  '水': '水型体质——"水形之人，其色黑，其面不平，大头广颐。"性格特点为智慧灵活、善于变通、耐力持久。',
}

// ─── 古籍引用 ───

const CLASSICAL_REFS: Record<FiveElement, string> = {
  '木': '《黄帝内经·素问》云："东方生风，风生木，木生酸，酸生肝。"肝属木，与胆相表里，主疏泄、藏血。木日主之人需特别关注肝胆健康，保持情志舒畅。',
  '火': '《黄帝内经·素问》云："南方生热，热生火，火生苦，苦生心。"心属火，与小肠相表里，主神明、主血脉。火日主之人需特别关注心脏健康，避免过劳。',
  '土': '《黄帝内经·素问》云："中央生湿，湿生土，土生甘，甘生脾。"脾属土，与胃相表里，主运化、主肌肉。土日主之人需特别关注脾胃健康，饮食有节。',
  '金': '《黄帝内经·素问》云："西方生燥，燥生金，金生辛，辛生肺。"肺属金，与大肠相表里，主气、主皮毛。金日主之人需特别关注呼吸系统，防燥护肺。',
  '水': '《黄帝内经·素问》云："北方生寒，寒生水，水生咸，咸生肾。"肾属水，与膀胱相表里，主藏精、主骨。水日主之人需特别关注肾脏健康，注意保暖。',
}

// ─── 核心引擎 ───

export function analyzeHealth(
  dayElement: FiveElement,
  strengthLevel: string,
  climateType: string,
  elementCount: Record<FiveElement, number>,
  allZhi: EarthlyBranch[],
): HealthResult {
  const isStrong = strengthLevel.includes('Strong') || strengthLevel === '极旺' || strengthLevel === '偏旺'
  const isWeak = strengthLevel.includes('Weak') || strengthLevel === '极弱' || strengthLevel === '偏弱'
  const isBalanced = !isStrong && !isWeak

  // ─── 1. 分析各脏腑健康风险 ───
  const organs: OrganHealth[] = []

  let highestRisk = 0
  let weakOrganName = ''

  for (const element of ALL_ELEMENTS) {
    const { organ, pair } = ORGAN_MAP[element]
    const count = elementCount[element] || 0

    // 风险评估
    let risk = 30 // 基础风险

    // 五行缺失风险
    if (count === 0) {
      risk += 25
    } else if (count === 1) {
      risk += 10
    }
    // 五行过旺风险（亢盛致病）
    if (count >= 4) {
      risk += 15
    } else if (count >= 3) {
      risk += 8
    }

    // 克日主的五行对应脏腑风险增加（疾病入侵方向）
    const keElement = OVERCOME[dayElement]
    if (element === keElement) {
      risk += 12
    }

    // 日主所克（财星）的五行脏腑也会因消耗而受影响
    const caiElement = OVERCOME[dayElement]
    // 简化：日主过旺则泄耗（食伤）对应脏腑受压
    if (element === GENERATE[dayElement] && isStrong) {
      risk += 5
    }

    // 身弱整体抗病力下降
    if (isWeak) risk += 8

    // 气候类型加成
    risk += climateRiskBonus(element, climateType)

    // 地支冲克加成
    risk += clashRiskBonus(element, allZhi)

    risk = clamp(risk, 0, 100)

    // 判断是过旺还是不足
    const isExcess = count >= 3
    const isDeficient = count <= 1

    const symptoms = isExcess
      ? SYMPTOMS_MAP[element].excess
      : isDeficient
        ? SYMPTOMS_MAP[element].deficient
        : ['基本正常，偶有不适']

    // 个性化建议
    const advice = buildOrganAdvice(element, isExcess, isDeficient, isStrong, isWeak)

    organs.push({
      organ: `${organ}（${pair}）`,
      element,
      risk,
      symptoms,
      advice,
    })

    if (risk > highestRisk) {
      highestRisk = risk
      weakOrganName = `${organ}（${pair}）`
    }
  }

  // 按风险降序排列
  organs.sort((a, b) => b.risk - a.risk)

  // ─── 2. 体质类型 ───
  const constitutionType = CONSTITUTION_MAP[dayElement]

  // ─── 3. 总体养生建议 ───
  const overallAdvice = buildOverallAdvice(dayElement, isStrong, isWeak, isBalanced, climateType, elementCount)

  // ─── 4. 四季养生 ───
  const seasonalAdvice = buildSeasonalAdvice(dayElement, climateType, elementCount)

  // ─── 5. 古籍引用 ───
  const classicalRef = CLASSICAL_REFS[dayElement]

  return {
    organs,
    constitutionType,
    weakOrgan: weakOrganName,
    overallAdvice,
    seasonalAdvice,
    classicalRef,
  }
}

// ─── 辅助函数 ───

function climateRiskBonus(element: FiveElement, climateType: string): number {
  // 寒命：水旺火弱 → 肾受寒、心不足
  // 燥命：金旺木弱 → 肺燥、肝血不足
  // 湿命：土旺水弱 → 脾湿困、肾气不足
  let bonus = 0
  if (climateType === '寒') {
    if (element === '水') bonus += 8
    if (element === '火') bonus += 10
  }
  if (climateType === '燥') {
    if (element === '金') bonus += 8
    if (element === '木') bonus += 10
  }
  if (climateType === '湿') {
    if (element === '土') bonus += 10
    if (element === '水') bonus += 5
  }
  return bonus
}

function clashRiskBonus(element: FiveElement, allZhi: EarthlyBranch[]): number {
  let bonus = 0
  const zhiSet = new Set(allZhi)

  for (const zhi of allZhi) {
    const clash = BRANCH_CLASH[zhi]
    if (clash && zhiSet.has(clash.target as EarthlyBranch)) {
      // 冲涉及的两个五行都受影响
      if (clash.element1 === element || clash.element2 === element) {
        bonus += 5
      }
    }
  }

  return bonus
}

function buildOrganAdvice(
  element: FiveElement,
  isExcess: boolean,
  isDeficient: boolean,
  isStrong: boolean,
  isWeak: boolean,
): string {
  const baseAdvice = ADVICE_MAP[element]

  let prefix = ''
  if (isExcess) {
    prefix = `${element}气过旺，${ORGAN_MAP[element].organ}系统处于亢奋状态，容易上火发炎。`
  } else if (isDeficient) {
    prefix = `${element}气不足，${ORGAN_MAP[element].organ}系统功能偏弱，需重点补养。`
  } else {
    prefix = `${element}气基本平衡，${ORGAN_MAP[element].organ}系统状况良好，保持日常养护即可。`
  }

  if (isWeak) {
    prefix += '身弱之人整体气血偏虚，养生的重点在于补益和保暖。'
  }
  if (isStrong) {
    prefix += '身旺之人阳气充沛，但需防亢盛伤阴，养生的重点在于清降和滋阴。'
  }

  return `${prefix}${baseAdvice}`
}

function buildOverallAdvice(
  dayElement: FiveElement,
  isStrong: boolean,
  isWeak: boolean,
  isBalanced: boolean,
  climateType: string,
  elementCount: Record<FiveElement, number>,
): string {
  const parts: string[] = []

  parts.push(`日主属${dayElement}，${CONSTITUTION_MAP[dayElement].split('——')[0]}，`)

  // 最弱的五行（缺失或最少的）
  let minCount = Infinity
  let weakest: FiveElement = '木'
  for (const el of ALL_ELEMENTS) {
    const c = elementCount[el] || 0
    if (c < minCount) {
      minCount = c
      weakest = el
    }
  }
  if (minCount === 0) {
    parts.push(`命局缺${weakest}，${ORGAN_MAP[weakest].organ}系统为先天薄弱环节，需后天重点养护。`)
  } else {
    parts.push(`命局${weakest}气最少（${minCount}个），${ORGAN_MAP[weakest].organ}系统相对薄弱，需适当补益。`)
  }

  if (isWeak) {
    parts.push('身弱之人抗病力偏弱，养生应以补气养血为核心，规律作息、适度运动、避免过劳。')
  } else if (isStrong) {
    parts.push('身旺之人精力旺盛但易亢奋过度，养生应以滋阴降火为核心，避免熬夜、节制饮食。')
  } else {
    parts.push('身中和之人体质较为平衡，养生重在维持，顺应四时变化调整即可。')
  }

  if (climateType === '寒') {
    parts.push('命局偏寒，畏寒体质，需注意保暖，忌食生冷，适合温补养生。')
  } else if (climateType === '燥') {
    parts.push('命局偏燥，阴液不足，需注意滋阴润燥，多饮水，忌辛辣燥热。')
  } else if (climateType === '湿') {
    parts.push('命局偏湿，湿气偏重，需注意祛湿健脾，忌食甜腻，适当运动发汗。')
  }

  return parts.join('')
}

function buildSeasonalAdvice(
  dayElement: FiveElement,
  climateType: string,
  elementCount: Record<FiveElement, number>,
): string {
  const advices: string[] = []

  // 找到最弱的五行
  let minCount = Infinity
  let weakest: FiveElement = '木'
  for (const el of ALL_ELEMENTS) {
    const c = elementCount[el] || 0
    if (c < minCount) {
      minCount = c
      weakest = el
    }
  }

  // 五行与四季对应
  const seasonAdvice: Partial<Record<FiveElement, string>> = {
    '木': '春季（立春-立夏）是肝气最旺之时，也是养肝的黄金季节。宜早睡早起、踏青舒展、多食绿色蔬菜。春季忌大怒，保持心态平和。',
    '火': '夏季（立夏-立秋）是心气最旺之时，也是养心的关键季节。宜午休养心、清淡饮食、多食红色果蔬。夏季忌大喜大悲，避免暑热伤津。',
    '土': '长夏（夏末秋初）是脾气最旺之时，也是养脾的好时机。宜饮食规律、少食生冷、多食黄色谷物。长夏忌过度思虑，适当休息。',
    '金': '秋季（立秋-立冬）是肺气最旺之时，也是养肺的最佳季节。宜早睡早起、润燥防干、多食白色果蔬。秋季忌悲忧伤肺，保持乐观。',
    '水': '冬季（立冬-立春）是肾气最旺之时，也是养肾的重要季节。宜早睡晚起、保暖御寒、多食黑色食物。冬季忌过度劳累，节制房事以藏精。',
  }

  // 最弱五行的对应季节需重点养护
  advices.push(`最需关注的季节：${weakest}行对应季节需重点养护。${seasonAdvice[weakest] || ''}`)

  // 日主五行的对应季节
  if (weakest !== dayElement) {
    advices.push(`日主${dayElement}行对应季节为平缓期：${seasonAdvice[dayElement] || ''}`)
  }

  // 寒命冬季养生、燥命秋季养生
  if (climateType === '寒') {
    advices.push('命局偏寒者冬季尤重养肾防寒，可适当进补温阳食物如羊肉、生姜、桂圆。坚持每晚温水泡脚，注意腰腹部保暖。')
  }
  if (climateType === '燥') {
    advices.push('命局偏燥者秋季尤重养肺润燥，可多食梨、百合、银耳等润肺之品。保持室内湿度，避免皮肤干燥。')
  }

  return advices.join('\n')
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}
