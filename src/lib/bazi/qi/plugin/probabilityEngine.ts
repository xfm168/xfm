/**
 * P3.3 ProbabilityEngine — 概率推演引擎
 *
 * 将传统命理的"一定/不可能"转为概率分析。
 * 汇聚所有模块输出，计算各人生领域的概率分数。
 *
 * 六大人生维度：
 *   1. 事业概率 (career)
 *   2. 财富概率 (wealth)
 *   3. 婚姻概率 (marriage)
 *   4. 健康概率 (health)
 *   5. 学业概率 (study)
 *   6. 贵人运概率 (patron)
 *
 * 原则：
 *   - 所有维度输出 0-100 概率分 + 置信度 + 风险等级
 *   - Plugin 方式接入，不修改 Kernel
 *   - 古籍引用贯穿始终
 */

import type { FiveElement } from '../../types'

// ─── 类型定义 ───

export type RiskLevel = '极低' | '低' | '中' | '高' | '极高'

export interface ProbabilityDimension {
  /** 维度名称，如"事业"、"婚姻"、"财富"、"健康"、"学业"、"贵人运" */
  name: string
  /** 0-100 概率分 */
  score: number
  /** 0-100 置信度（依据多少维度的数据支撑） */
  confidence: number
  /** 风险等级 */
  riskLevel: RiskLevel
  /** 利好因素 */
  positiveFactors: string[]
  /** 风险因素 */
  negativeFactors: string[]
  /** 建议 */
  advice: string
}

export interface ProbabilityResult {
  /** 各维度概率分析 */
  dimensions: ProbabilityDimension[]
  /** 综合人生评分 0-100 */
  overallScore: number
  /** 综合置信度 */
  overallConfidence: number
  /** 综合风险 */
  overallRisk: RiskLevel
  /** 人生阶段判断 */
  lifePhase: string
  /** 最佳年龄区间 */
  peakAge: string
  /** 需谨慎的年龄区间 */
  cautionAge: string
  /** 总评 */
  summary: string
  /** 古籍引用 */
  classicalRef: string
}

export interface ProbabilityContext {
  /** 日主五行 */
  dayElement: FiveElement
  /** 日主旺衰结果 */
  strengthResult: import('./dayMasterStrengthEngine').DayMasterStrengthResult
  /** 调候结果 */
  climateResult: import('./climateAdjustmentEngine').ClimateAdjustmentResult
  /** 病药结果 */
  diseaseResult: import('./diseaseMedicineEngine').DiseaseMedicineResult
  /** 通关结果 */
  tongGuanResult: import('./tongGuanEngine').TongGuanResult
  /** 喜用神结果 */
  useGodResult: import('./useGodEngine').UseGodResult
  /** 格局校验结果 */
  patternResult: import('./patternValidator').PatternValidationResult
  /** 神煞结果 */
  shenShaResult: import('./shenShaEngine').ShenShaResult
  /** 事业结果 */
  careerResult: import('./careerEngine').CareerResult
  /** 财富结果 */
  wealthResult: import('./wealthEngine').WealthResult
  /** 婚姻结果 */
  marriageResult: import('./marriageEngine').MarriageResult
  /** 健康结果 */
  healthResult: import('./healthEngine').HealthResult
  /** 大运修正结果（可选） */
  luckResult?: import('./luckModifierEngine').LuckModifierResult
  /** 动态喜用神结果（可选） */
  dynamicUseGod?: import('./dynamicUseGod').DynamicUseGodResult
}

// ─── 工具函数 ───

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return '极低'
  if (score >= 60) return '低'
  if (score >= 40) return '中'
  if (score >= 20) return '高'
  return '极高'
}

/** 判断神煞列表中是否包含指定神煞 */
function hasShenSha(names: string[]): boolean {
  return names.length > 0
}

/** 从神煞结果中查找指定名称的神煞是否存在 */
function findShenSha(
  shenShaList: { name: string; category: string }[],
  targets: string[],
): boolean {
  return shenShaList.some((s) => targets.includes(s.name))
}

/** 判断日主旺衰是否为"身旺"（Strong / VeryStrong） */
function isStrongDayMaster(
  strengthResult: ProbabilityContext['strengthResult'],
): boolean {
  return (
    strengthResult.strengthLevel === 'Strong' ||
    strengthResult.strengthLevel === 'VeryStrong'
  )
}

/** 判断日主旺衰是否为"身弱"（VeryWeak / Weak） */
function isWeakDayMaster(
  strengthResult: ProbabilityContext['strengthResult'],
): boolean {
  return (
    strengthResult.strengthLevel === 'VeryWeak' ||
    strengthResult.strengthLevel === 'Weak'
  )
}

/** 判断日主旺衰是否为"中和"（Balanced） */
function isBalancedDayMaster(
  strengthResult: ProbabilityContext['strengthResult'],
): boolean {
  return strengthResult.strengthLevel === 'Balanced'
}

/** 获取旺衰平衡度（0-100，中和为100） */
function getStrengthBalance(
  strengthResult: ProbabilityContext['strengthResult'],
): number {
  // strengthScore 50 左右为中和，越偏离越不平衡
  return 100 - Math.abs(strengthResult.strengthScore - 50)
}

// ─── 五行方位映射（事业方位用） ───

const ELEMENT_DIRECTION: Record<FiveElement, string> = {
  '木': '东方',
  '火': '南方',
  '土': '中央',
  '金': '西方',
  '水': '北方',
}

// 五行对应季节（用于最佳年龄推算）
const ELEMENT_SEASON: Record<FiveElement, string> = {
  '木': '春季（寅卯月）',
  '火': '夏季（巳午月）',
  '金': '秋季（申酉月）',
  '水': '冬季（亥子月）',
  '土': '四季交替（辰戌丑未月）',
}

// ─── 五行生克关系 ───

/** 我克者为财 */
const WEALTH_OF: Record<FiveElement, FiveElement> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
}

/** 生我者为印 */
const PRINT_OF: Record<FiveElement, FiveElement> = {
  '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
}

// ─── 置信度计算 ───

function calculateConfidence(ctx: ProbabilityContext): number {
  const modules = [
    ctx.strengthResult,
    ctx.climateResult,
    ctx.diseaseResult,
    ctx.tongGuanResult,
    ctx.useGodResult,
    ctx.patternResult,
    ctx.shenShaResult,
    ctx.careerResult,
    ctx.wealthResult,
    ctx.marriageResult,
    ctx.healthResult,
    ctx.luckResult,
    ctx.dynamicUseGod,
  ]

  let validCount = 0
  for (const mod of modules) {
    if (mod != null) validCount++
  }

  // 13个模块全部有效 → 95%，每少一个 -5%
  const totalModules = 13
  const confidence = 95 - (totalModules - validCount) * 5
  return clamp(confidence, 20, 95)
}

// ─── ① 事业概率 ───

function calculateCareerProbability(ctx: ProbabilityContext): ProbabilityDimension {
  const { patternResult, careerResult, useGodResult, shenShaResult, strengthResult } = ctx
  const positiveFactors: string[] = []
  const negativeFactors: string[] = []

  // 基础分计算
  const patternScore = patternResult?.totalScore ?? 50
  const managementScore = careerResult?.managementScore ?? 50
  const entrepreneurshipScore = careerResult?.entrepreneurshipScore ?? 50
  const stabilityScore = careerResult?.stabilityScore ?? 50
  const balanceDegree = getStrengthBalance(strengthResult)

  let baseScore =
    patternScore * 0.30 +
    managementScore * 0.25 +
    entrepreneurshipScore * 0.20 +
    stabilityScore * 0.15 +
    balanceDegree * 0.10

  // 修正：用神在事业方位
  if (useGodResult) {
    const useGodDirection = ELEMENT_DIRECTION[useGodResult.yongShen]
    // 用神五行对应的方位有利事业
    positiveFactors.push(`用神${useGodResult.yongShen}方位（${useGodDirection}）利于事业发展`)
    baseScore += 5

    // 忌神在事业方位
    const jiDirection = ELEMENT_DIRECTION[useGodResult.jiShen]
    if (useGodDirection === jiDirection) {
      negativeFactors.push(`忌神${useGodResult.jiShen}与用神同方位，事业有阻碍`)
    } else {
      baseScore -= 5 // 忌神在其他方位仍扣分
    }
  }

  // 神煞修正
  const shenShaList = shenShaResult?.shenShaList ?? []
  const hasJiangXing = findShenSha(shenShaList, ['将星'])
  const hasTianYi = findShenSha(shenShaList, ['天乙贵人'])

  if (hasJiangXing) {
    baseScore += 3
    positiveFactors.push('命带将星，有领导统帅之才')
  }
  if (hasTianYi) {
    baseScore += 3
    positiveFactors.push('命带天乙贵人，事业多得贵人提携')
  }

  // 利好/风险因素
  if (patternScore >= 75) {
    positiveFactors.push(`格局评分${patternScore}分，格局上等，事业天花板高`)
  } else if (patternScore < 45) {
    negativeFactors.push(`格局评分${patternScore}分，格局破格，事业多波折`)
  }

  if (managementScore >= 70) {
    positiveFactors.push(`管理能力${managementScore}分，适合走管理路线`)
  }

  if (entrepreneurshipScore >= 70) {
    positiveFactors.push(`创业能力${entrepreneurshipScore}分，具备创业潜质`)
  } else if (entrepreneurshipScore < 40) {
    negativeFactors.push(`创业能力${entrepreneurshipScore}分，创业风险较大`)
  }

  if (isStrongDayMaster(strengthResult)) {
    positiveFactors.push('日主身旺，精力充沛，能担事业重任')
  } else if (isWeakDayMaster(strengthResult)) {
    negativeFactors.push('日主身弱，事业需借外力扶持')
  }

  const score = clamp(Math.round(baseScore), 0, 100)
  const confidence = calculateConfidence(ctx)
  const riskLevel = getRiskLevel(score)

  const advice = score >= 70
    ? '事业运势良好，宜积极进取，把握机遇。适合在用神方位发展事业，可大胆拓展。'
    : score >= 50
      ? '事业运中等，宜稳扎稳打。建议在用神方位择业，不宜冒进。多培养管理能力和专业技能。'
      : '事业运偏弱，需加倍努力。建议寻求贵人帮助，选择稳定方向发展。忌贪大求全，宜脚踏实地。'

  return {
    name: '事业',
    score,
    confidence,
    riskLevel,
    positiveFactors,
    negativeFactors,
    advice,
  }
}

// ─── ② 财富概率 ───

function calculateWealthProbability(ctx: ProbabilityContext): ProbabilityDimension {
  const {
    wealthResult, patternResult, useGodResult,
    tongGuanResult, climateResult, strengthResult,
  } = ctx
  const positiveFactors: string[] = []
  const negativeFactors: string[] = []

  // 基础分
  const wealthScore = wealthResult?.wealthScore ?? 50
  const patternScore = patternResult?.totalScore ?? 50

  // 身旺担财：身旺时财星能发挥，身弱时财多为忌
  let canBearWealth = 50
  if (isStrongDayMaster(strengthResult)) {
    canBearWealth = 80
    positiveFactors.push('日主身旺，能担财帛，求财顺利')
  } else if (isWeakDayMaster(strengthResult)) {
    canBearWealth = 30
    negativeFactors.push('日主身弱，财多为忌，不宜盲目求财')
  } else {
    canBearWealth = 65
    positiveFactors.push('日主中和，财运平稳')
  }

  // 通关顺畅度
  const tongGuanScore = tongGuanResult?.hasTongGuan ? 80 : tongGuanResult?.hasBattle ? 30 : 60

  // 调候完成度
  const climateScore = climateResult?.climateScore ?? 50

  let baseScore =
    wealthScore * 0.40 +
    (patternScore * 0.20) + // 格局贵气
    canBearWealth * 0.20 +
    tongGuanScore * 0.10 +
    climateScore * 0.10

  // 修正
  if (wealthResult) {
    if (wealthResult.caiKu && wealthResult.caiKu !== '无') {
      baseScore += 5
      positiveFactors.push(`命带财库（${wealthResult.caiKu}），聚财能力强`)
    }
    if (wealthResult.leakageRisk && wealthResult.leakageRisk.includes('漏财')) {
      baseScore -= 5
      negativeFactors.push('命局有漏财之象，宜注意理财')
    }
    if (wealthResult.pianCai && wealthResult.pianCai.strength === '旺') {
      baseScore += 3
      positiveFactors.push('偏财旺，有意外之财或投资获利机会')
    }
  }

  if (patternScore >= 75) {
    positiveFactors.push(`格局评分${patternScore}分，贵气足，财运有保障`)
  } else if (patternScore < 45) {
    negativeFactors.push(`格局评分偏低，求财需更多努力`)
  }

  if (tongGuanResult?.hasTongGuan) {
    positiveFactors.push('命局通关顺畅，财路通达')
  } else if (tongGuanResult?.hasBattle) {
    negativeFactors.push('命局五行交战，财路有阻碍')
  }

  if (climateResult && climateResult.climateScore >= 70) {
    positiveFactors.push('调候适中，求财环境佳')
  }

  const score = clamp(Math.round(baseScore), 0, 100)
  const confidence = calculateConfidence(ctx)
  const riskLevel = getRiskLevel(score)

  const advice = score >= 70
    ? '财运良好，善于把握财机。可适度投资理财，但须防财库漏财。用神方位利求财。'
    : score >= 50
      ? '财运中等，正财为主。宜稳健理财，不宜投机冒险。培养聚财习惯，避免漏财。'
      : '财运偏弱，求财多艰辛。宜先培补自身（印比），提升能力后再图发展。忌借贷投机。'

  return {
    name: '财富',
    score,
    confidence,
    riskLevel,
    positiveFactors,
    negativeFactors,
    advice,
  }
}

// ─── ③ 婚姻概率 ───

function calculateMarriageProbability(ctx: ProbabilityContext): ProbabilityDimension {
  const {
    marriageResult, patternResult, shenShaResult,
    tongGuanResult, climateResult,
  } = ctx
  const positiveFactors: string[] = []
  const negativeFactors: string[] = []

  // 基础分
  const marriageScore = marriageResult?.marriageScore ?? 50
  const patternScore = patternResult?.totalScore ?? 50

  // 格局清纯度（格局越高越清纯）
  const purityScore = patternResult?.isPoGe ? 30 : clamp(patternScore * 0.8, 30, 100)

  // 日支生克（从婚姻结果中提取）
  let branchRelationScore = 60
  if (marriageResult) {
    if (marriageResult.marriageQuality.includes('佳') || marriageResult.marriageQuality.includes('好')) {
      branchRelationScore = 80
    } else if (marriageResult.marriageQuality.includes('差') || marriageResult.marriageQuality.includes('不顺')) {
      branchRelationScore = 35
    }
  }

  // 桃花
  const shenShaList = shenShaResult?.shenShaList ?? []
  const hasPeachBlossom = findShenSha(shenShaList, ['桃花', '咸池'])
  const peachBlossomScore = hasPeachBlossom ? 80 : 50

  // 通关
  const tongGuanScore = tongGuanResult?.hasTongGuan ? 80 : tongGuanResult?.hasBattle ? 30 : 60

  // 调候
  const climateScore = climateResult?.climateScore ?? 50

  let baseScore =
    marriageScore * 0.40 +
    purityScore * 0.20 +
    branchRelationScore * 0.15 +
    peachBlossomScore * 0.10 +
    tongGuanScore * 0.10 +
    climateScore * 0.05

  // 修正
  if (marriageResult) {
    // 日支逢冲
    if (marriageResult.riskFactors?.some((r: string) => r.includes('冲'))) {
      baseScore -= 10
      negativeFactors.push('日支逢冲，配偶宫不稳，婚姻需经营')
    }
  }

  // 红鸾天喜
  const hasHongLuan = findShenSha(shenShaList, ['红鸾', '天喜'])
  if (hasHongLuan) {
    baseScore += 5
    positiveFactors.push('命带红鸾天喜，婚姻缘分深厚')
  }

  // 孤辰寡宿
  const hasGuChen = findShenSha(shenShaList, ['孤辰', '寡宿'])
  if (hasGuChen) {
    baseScore -= 5
    negativeFactors.push('命带孤辰寡宿，婚姻中需防孤独感')
  }

  // 利好/风险因素
  if (marriageScore >= 70) {
    positiveFactors.push(`婚姻评分${marriageScore}分，婚姻质量较佳`)
  } else if (marriageScore < 40) {
    negativeFactors.push(`婚姻评分${marriageScore}分，婚姻多有波折`)
  }

  if (patternScore >= 75) {
    positiveFactors.push('格局清纯，感情纯粹，少纠葛')
  }

  if (hasPeachBlossom) {
    positiveFactors.push('命带桃花，异性缘佳')
  }

  if (marriageResult?.spouseFeatures?.length) {
    positiveFactors.push(`配偶特征：${marriageResult.spouseFeatures.join('、')}`)
  }

  const score = clamp(Math.round(baseScore), 0, 100)
  const confidence = calculateConfidence(ctx)
  const riskLevel = getRiskLevel(score)

  const advice = score >= 70
    ? '婚姻运势良好，夫妻和睦。红鸾天喜入命，缘分深厚。宜珍惜伴侣，用心经营。'
    : score >= 50
      ? '婚姻运中等，有波折但可化解。配偶宫需注意维护，多沟通理解。逢冲之年需格外谨慎。'
      : '婚姻运偏弱，需多付出努力。配偶宫逢冲，宜晚婚或找生肖相合之人。遇红鸾流年方宜婚配。'

  return {
    name: '婚姻',
    score,
    confidence,
    riskLevel,
    positiveFactors,
    negativeFactors,
    advice,
  }
}

// ─── ④ 健康概率 ───

function calculateHealthProbability(ctx: ProbabilityContext): ProbabilityDimension {
  const {
    healthResult, climateResult, diseaseResult,
    tongGuanResult, strengthResult, shenShaResult,
  } = ctx
  const positiveFactors: string[] = []
  const negativeFactors: string[] = []

  // 最弱脏腑 risk
  let weakestOrganRisk = 30
  if (healthResult?.organs?.length) {
    weakestOrganRisk = Math.max(...healthResult.organs.map((o) => o.risk))
    const weakest = healthResult.organs.reduce((a, b) => a.risk > b.risk ? a : b)
    if (weakestOrganRisk >= 60) {
      negativeFactors.push(`${weakest.organ}（${weakest.element}）风险较高，需重点关注`)
    }
  }

  // 调候不适度
  const climateDiscomfort = climateResult?.needsAdjustment ? (100 - (climateResult.climateScore ?? 50)) : 10

  // 五行偏枯
  let wuxingBias = 30
  if (diseaseResult?.diseases?.length) {
    const hasPianHu = diseaseResult.diseases.some((d) => d.name === '五行偏枯')
    if (hasPianHu) {
      wuxingBias = 70
      negativeFactors.push('五行偏枯，先天体质有偏，需后天调理')
    } else {
      // 根据疾病严重程度
      wuxingBias = clamp(diseaseResult.diseases.reduce((sum, d) => sum + d.severity * 10, 0), 10, 90)
    }
  }

  // 身弱
  const weakScore = isWeakDayMaster(strengthResult) ? 60 : 20

  // 地支刑冲（从通关结果中间接获取）
  const xingChongScore = tongGuanResult?.hasBattle ? clamp(tongGuanResult.riskLevel * 15, 0, 80) : 10
  if (tongGuanResult?.hasBattle) {
    negativeFactors.push('命局地支有冲克，影响气血运行')
  }

  // 基础分 = 100 - 各项扣分
  let baseScore =
    100 -
    weakestOrganRisk * 0.40 -
    climateDiscomfort * 0.20 -
    wuxingBias * 0.20 -
    weakScore * 0.10 -
    xingChongScore * 0.10

  // 修正
  const shenShaList = shenShaResult?.shenShaList ?? []
  const hasTianShe = findShenSha(shenShaList, ['天赦'])
  if (hasTianShe) {
    baseScore += 3
    positiveFactors.push('命带天赦，逢凶化吉，健康有天然庇护')
  }

  // 病药有方
  if (diseaseResult?.medicines?.length) {
    baseScore += 5
    positiveFactors.push(`命局有药可医（${diseaseResult.medicines.map((m) => m.name).join('、')}），健康可调理`)
  }

  if (climateResult && climateResult.climateScore >= 70) {
    positiveFactors.push('调候适中，四时之气调和，体质先天较好')
  }

  if (isStrongDayMaster(strengthResult)) {
    positiveFactors.push('日主身旺，先天体质较好，抗病力强')
  } else if (isWeakDayMaster(strengthResult)) {
    negativeFactors.push('日主身弱，先天抗病力不足，需注意养生')
  }

  if (healthResult?.overallAdvice) {
    positiveFactors.push(healthResult.overallAdvice)
  }

  const score = clamp(Math.round(baseScore), 0, 100)
  const confidence = calculateConfidence(ctx)
  const riskLevel = getRiskLevel(score)

  const advice = score >= 70
    ? '健康状况良好，先天体质佳。但仍需注意日常养生，关注命局所指的薄弱脏腑。'
    : score >= 50
      ? '健康运势中等，有薄弱环节需关注。宜按季节调养，注意命局所指脏腑的保健。病有药方可治。'
      : '健康需特别关注。命局有先天不足，宜注重养生保健。重点防范命局所指疾病方向，定期体检。'

  return {
    name: '健康',
    score,
    confidence,
    riskLevel,
    positiveFactors,
    negativeFactors,
    advice,
  }
}

// ─── ⑤ 学业概率 ───

function calculateStudyProbability(ctx: ProbabilityContext): ProbabilityDimension {
  const {
    shenShaResult, useGodResult, strengthResult,
    patternResult, climateResult,
  } = ctx
  const positiveFactors: string[] = []
  const negativeFactors: string[] = []

  // 文昌
  const shenShaList = shenShaResult?.shenShaList ?? []
  const hasWenChang = findShenSha(shenShaList, ['文昌'])
  const wenChangScore = hasWenChang ? 20 : 5

  if (hasWenChang) {
    positiveFactors.push('命带文昌星，聪明好学，利于读书考试')
  } else {
    negativeFactors.push('命局无文昌，学业需更多后天努力')
  }

  // 印星力量（用神为印星时学业佳）
  let yinXingScore = 50
  if (useGodResult) {
    const dayElement = ctx.dayElement
    const yinXing = PRINT_OF[dayElement]
    // 印星为用神或喜神时，印星力量强
    if (useGodResult.yongShen === yinXing) {
      yinXingScore = 90
      positiveFactors.push(`印星${yinXing}为用神，学业得天助，记忆力理解力佳`)
    } else if (useGodResult.xiShen === yinXing) {
      yinXingScore = 75
      positiveFactors.push(`印星${yinXing}为喜神，学业有助力`)
    } else if (useGodResult.jiShen === yinXing) {
      yinXingScore = 30
      negativeFactors.push(`印星${yinXing}为忌神，学习方式需调整`)
    }
  }

  // 身旺利于学业发挥
  const strengthScore = isStrongDayMaster(strengthResult) ? 80
    : isWeakDayMaster(strengthResult) ? 35
      : 70

  if (isBalancedDayMaster(strengthResult)) {
    positiveFactors.push('日主中和，精力适中，利于长期学习')
  }

  // 格局贵气
  const patternScore = patternResult?.totalScore ?? 50
  const guqiScore = patternScore

  if (patternScore >= 75 && patternResult?.rank) {
    positiveFactors.push('格局' + patternResult.rank + '，学有所成概率高')
  }

  // 调候
  const climateScore = climateResult?.climateScore ?? 50

  // 华盖（华盖利学术）
  const hasHuaGai = findShenSha(shenShaList, ['华盖'])
  const huaGaiScore = hasHuaGai ? 10 : 0

  if (hasHuaGai) {
    positiveFactors.push('命带华盖，利学术研究，适合深造')
  }

  // 基础分
  let baseScore =
    wenChangScore + // 文昌 0-20
    yinXingScore * 0.30 + // 印星力量 0-30
    strengthScore * 0.15 + // 身旺 0-15
    guqiScore * 0.15 + // 格局贵气 0-15
    climateScore * 0.10 + // 调候 0-10
    huaGaiScore // 华盖 0-10

  // 修正
  const hasTianYi = findShenSha(shenShaList, ['天乙贵人'])
  if (hasTianYi) {
    baseScore += 5
    positiveFactors.push('命带天乙贵人，学业有贵人相助')
  }

  const hasXueTang = findShenSha(shenShaList, ['学堂'])
  if (hasXueTang) {
    baseScore += 5
    positiveFactors.push('命带学堂，学业运佳，利于升学')
  }

  const score = clamp(Math.round(baseScore), 0, 100)
  const confidence = calculateConfidence(ctx)
  const riskLevel = getRiskLevel(score)

  const advice = score >= 70
    ? '学业运势优良，利于考试升学。文昌或学堂入命，天资聪颖。宜选择与印星五行相关的专业方向。'
    : score >= 50
      ? '学业运中等，需后天努力补足。建议选择适合自己的学习方法，利用印星五行方位增强学习效果。'
      : '学业运偏弱，需加倍用功。命局无文昌学堂，建议寻求良师益友帮助，选择实用性强的专业方向。'

  return {
    name: '学业',
    score,
    confidence,
    riskLevel,
    positiveFactors,
    negativeFactors,
    advice,
  }
}

// ─── ⑥ 贵人运概率 ───

function calculatePatronProbability(ctx: ProbabilityContext): ProbabilityDimension {
  const {
    shenShaResult, useGodResult, strengthResult,
    patternResult, tongGuanResult,
  } = ctx
  const positiveFactors: string[] = []
  const negativeFactors: string[] = []

  // 天乙贵人
  const shenShaList = shenShaResult?.shenShaList ?? []
  const hasTianYi = findShenSha(shenShaList, ['天乙贵人'])
  const tianYiScore = hasTianYi ? 25 : 5

  if (hasTianYi) {
    positiveFactors.push('命带天乙贵人，一生多得贵人相助')
  } else {
    negativeFactors.push('命局无天乙贵人，贵人运需后天培养')
  }

  // 天德月德
  const hasTianDe = findShenSha(shenShaList, ['天德'])
  const hasYueDe = findShenSha(shenShaList, ['月德'])
  const deScore = (hasTianDe ? 10 : 0) + (hasYueDe ? 10 : 0)

  if (hasTianDe) {
    positiveFactors.push('命带天德，心地仁慈，易得人缘')
  }
  if (hasYueDe) {
    positiveFactors.push('命带月德，品德高尚，受人尊敬')
  }

  // 印星力量
  let yinXingScore = 50
  if (useGodResult) {
    const yinXing = PRINT_OF[ctx.dayElement]
    if (useGodResult.yongShen === yinXing) {
      yinXingScore = 90
      positiveFactors.push(`印星${yinXing}为用神，贵人来自长辈、师长`)
    } else if (useGodResult.xiShen === yinXing) {
      yinXingScore = 70
    } else {
      yinXingScore = 40
    }
  }

  // 格局贵气
  const patternScore = patternResult?.totalScore ?? 50
  const guqiScore = patternScore

  if (patternScore >= 75 && patternResult?.rank) {
    positiveFactors.push('格局' + patternResult.rank + '，自带贵气，人脉广')
  }

  // 身中和
  const balanceScore = isBalancedDayMaster(strengthResult) ? 85
    : isStrongDayMaster(strengthResult) ? 60
      : 40

  if (isBalancedDayMaster(strengthResult)) {
    positiveFactors.push('日主中和，处事平和，人缘好')
  }

  // 通关
  const tongGuanScore = tongGuanResult?.hasTongGuan ? 80 : tongGuanResult?.hasBattle ? 30 : 60

  // 基础分
  let baseScore =
    tianYiScore + // 天乙贵人 0-25
    deScore + // 天德月德 0-20
    yinXingScore * 0.20 + // 印星 0-20
    guqiScore * 0.15 + // 格局贵气 0-15
    balanceScore * 0.10 + // 身中和 0-10
    tongGuanScore * 0.10 // 通关 0-10

  // 修正
  const hasYiMa = findShenSha(shenShaList, ['驿马'])
  if (hasYiMa) {
    baseScore -= 3
    negativeFactors.push('命带驿马，奔波走动多，贵人多为远方之人')
  }

  if (findShenSha(shenShaList, ['孤辰', '寡宿'])) {
    baseScore -= 5
    negativeFactors.push('命带孤辰寡宿，贵人运稍弱，宜主动结交善缘')
  }

  const score = clamp(Math.round(baseScore), 0, 100)
  const confidence = calculateConfidence(ctx)
  const riskLevel = getRiskLevel(score)

  const advice = score >= 70
    ? '贵人运极佳，一生多得贵人相助。天乙贵人在命，逢凶化吉。宜广结善缘，善用贵人资源。'
    : score >= 50
      ? '贵人运中等，有贵人但需自己把握。建议主动与人交往，在社会活动中结交良师益友。'
      : '贵人运偏弱，需靠自身努力。命局少贵人星，宜以德服人、以诚待人，后天培养人脉关系。'

  return {
    name: '贵人运',
    score,
    confidence,
    riskLevel,
    positiveFactors,
    negativeFactors,
    advice,
  }
}

// ─── 人生阶段判断 ───

function determineLifePhase(ctx: ProbabilityContext): string {
  const { strengthResult, patternResult } = ctx
  const isStrong = isStrongDayMaster(strengthResult)
  const isWeak = isWeakDayMaster(strengthResult)
  const patternScore = patternResult?.totalScore ?? 50
  const isHighPattern = patternScore >= 70
  const isLowPattern = patternScore < 45

  if (isStrong && isHighPattern) {
    return '中年发运，35-55为巅峰'
  } else if (isWeak && !isLowPattern && !isHighPattern) {
    return '先苦后甜，中年渐佳'
  } else if (isStrong && isLowPattern) {
    return '需防骄奢，宜守不宜攻'
  } else if (isWeak && isLowPattern) {
    return '需借外力，贵人扶助'
  } else if (isBalancedDayMaster(strengthResult) && isHighPattern) {
    return '一生平稳，少年即显才华'
  } else if (isBalancedDayMaster(strengthResult) && isLowPattern) {
    return '需选对方向，专注一域可成'
  } else if (isWeak && isHighPattern) {
    return '格局虽高需身弱扶持，中年后方可展志'
  } else {
    // 身旺+格局中等
    return '稳中求进，厚积薄发'
  }
}

// ─── 最佳/谨慎年龄区间 ───

function determineAgeRanges(ctx: ProbabilityContext): { peakAge: string; cautionAge: string } {
  const { useGodResult, luckResult, dynamicUseGod } = ctx

  // 如果有大运结果，基于大运推算
  if (luckResult) {
    if (luckResult.luckEffect === '大吉' || luckResult.luckEffect === '吉') {
      return {
        peakAge: '当前大运为吉运，正处于有利时期',
        cautionAge: '大运转换前后需特别注意（约每十年交替期）',
      }
    } else if (luckResult.luckEffect === '凶' || luckResult.luckEffect === '大凶') {
      return {
        peakAge: '大运不利时暂缓，待吉运到来再发力',
        cautionAge: '当前大运为凶运，凡事谨慎，宜守不宜攻',
      }
    }
  }

  // 无大运时，基于用神五行推算
  if (useGodResult) {
    const yongShen = useGodResult.yongShen
    const season = ELEMENT_SEASON[yongShen]

    let peakAge: string
    let cautionAge: string

    switch (yongShen) {
      case '木':
        peakAge = '春季（寅卯月）出生的年份和月份最有利，约每5-6年逢木旺之时'
        cautionAge = '秋季（申酉月）金克木时需谨慎'
        break
      case '火':
        peakAge = '夏季（巳午月）出生的年份和月份最有利，约每5-6年逢火旺之时'
        cautionAge = '冬季（亥子月）水克火时需谨慎'
        break
      case '金':
        peakAge = '秋季（申酉月）出生的年份和月份最有利，约每5-6年逢金旺之时'
        cautionAge = '春季（寅卯月）火克金时需谨慎'
        break
      case '水':
        peakAge = '冬季（亥子月）出生的年份和月份最有利，约每5-6年逢水旺之时'
        cautionAge = '夏季（巳午月）土克水时需谨慎'
        break
      case '土':
        peakAge = '四季交替（辰戌丑未月）最有利，约每3-4年逢土旺之时'
        cautionAge = '春季（寅卯月）木克土时需谨慎'
        break
      default:
        peakAge = '需综合大运判断'
        cautionAge = '忌神五行旺相之年需谨慎'
    }

    // 结合动态用神微调
    if (dynamicUseGod) {
      const stage = dynamicUseGod.stage
      const stageNote: Record<string, string> = {
        '少年': '当前为少年学习期，重在积累',
        '青年': '当前为青年奋斗期，重在拼搏',
        '中年': '当前为中年事业期，重在经营',
        '晚年': '当前为晚年份享期，重在守成',
      }
      peakAge += `；${stageNote[stage] ?? ''}`
    }

    return { peakAge, cautionAge }
  }

  return {
    peakAge: '无明确用神数据，需结合大运综合判断',
    cautionAge: '无明确忌神数据，建议凡事谨慎为上',
  }
}

// ─── 古籍引用选择 ───

function selectClassicalRef(ctx: ProbabilityContext): string {
  const { patternResult, strengthResult } = ctx
  const patternScore = patternResult?.totalScore ?? 50
  const isStrong = isStrongDayMaster(strengthResult)

  if (patternScore >= 80) {
    return '《子平真诠》："格局清纯者，一生顺遂，富贵可期。格局高低，关乎一生穷通。"'
  } else if (patternScore >= 60) {
    return '《滴天髓》："命不可先定，运有穷通。知命而不认命，方为智者。"'
  } else if (isStrong) {
    return '《滴天髓》："强众而敌寡者，势在去寡；强寡而敌众者，势在成众。"'
  } else {
    return '《子平真诠》："用神有力，虽格局稍逊亦可有成。用神无力，虽格局高亦多波折。"'
  }
}

// ─── 综合人生评分 ───

function calculateOverallScore(dimensions: ProbabilityDimension[]): number {
  if (dimensions.length === 0) return 50

  // 加权平均：事业(20%) + 财富(20%) + 婚姻(15%) + 健康(20%) + 学业(10%) + 贵人运(15%)
  const weights: Record<string, number> = {
    '事业': 0.20,
    '财富': 0.20,
    '婚姻': 0.15,
    '健康': 0.20,
    '学业': 0.10,
    '贵人运': 0.15,
  }

  let totalWeight = 0
  let weightedSum = 0

  for (const dim of dimensions) {
    const w = weights[dim.name] ?? 0.15
    weightedSum += dim.score * w
    totalWeight += w
  }

  return clamp(Math.round(weightedSum / totalWeight), 0, 100)
}

// ─── 总评生成 ───

function generateSummary(
  overallScore: number,
  dimensions: ProbabilityDimension[],
  lifePhase: string,
): string {
  const strongest = dimensions.reduce((a, b) => a.score > b.score ? a : b)
  const weakest = dimensions.reduce((a, b) => a.score < b.score ? a : b)

  const scoreDesc = overallScore >= 80 ? '人生综合运势优良'
    : overallScore >= 60 ? '人生综合运势良好'
      : overallScore >= 40 ? '人生综合运势中等'
        : '人生综合运势偏弱，需后天努力弥补'

  return [
    `${scoreDesc}，综合评分${overallScore}分。`,
    `最强领域为"${strongest.name}"（${strongest.score}分），`,
    `最需关注的领域为"${weakest.name}"（${weakest.score}分）。`,
    `人生阶段：${lifePhase}。`,
    `建议：发扬优势领域之长，补足弱势领域之短，顺势而为，方可趋吉避凶。`,
  ].join('')
}

// ─── 核心函数：概率推演 ───

export function calculateProbability(context: ProbabilityContext): ProbabilityResult {
  // 计算六大维度
  const careerDim = calculateCareerProbability(context)
  const wealthDim = calculateWealthProbability(context)
  const marriageDim = calculateMarriageProbability(context)
  const healthDim = calculateHealthProbability(context)
  const studyDim = calculateStudyProbability(context)
  const patronDim = calculatePatronProbability(context)

  const dimensions: ProbabilityDimension[] = [
    careerDim,
    wealthDim,
    marriageDim,
    healthDim,
    studyDim,
    patronDim,
  ]

  // 综合评分
  const overallScore = calculateOverallScore(dimensions)
  const overallConfidence = calculateConfidence(context)
  const overallRisk = getRiskLevel(overallScore)

  // 人生阶段
  const lifePhase = determineLifePhase(context)

  // 最佳/谨慎年龄
  const { peakAge, cautionAge } = determineAgeRanges(context)

  // 古籍引用
  const classicalRef = selectClassicalRef(context)

  // 总评
  const summary = generateSummary(overallScore, dimensions, lifePhase)

  return {
    dimensions,
    overallScore,
    overallConfidence,
    overallRisk,
    lifePhase,
    peakAge,
    cautionAge,
    summary,
    classicalRef,
  }
}

// ─── 辅助导出（方便测试和调试） ───

export {
  clamp,
  getRiskLevel,
  calculateConfidence,
  calculateCareerProbability,
  calculateWealthProbability,
  calculateMarriageProbability,
  calculateHealthProbability,
  calculateStudyProbability,
  calculatePatronProbability,
  determineLifePhase,
  determineAgeRanges,
  calculateOverallScore,
  generateSummary,
  selectClassicalRef,
}
