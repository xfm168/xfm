/**
 * P3.5 EventPredictionEngine — 人生事件推演引擎
 *
 * 覆盖15类人生事件：升学、毕业、就业、创业、升职、投资、买房、
 * 结婚、生育、疾病、官非、破财、搬迁、出国、重大转折。
 *
 * 古籍依据：
 *   《滴天髓》："命不可先定，运有穷通。"
 *   《子平真诠》："格局高低，关乎一生穷通。"
 *   《三命通会》："大运者，人生之枢纽也。十年一变，主宰阶段性运势。"
 *
 * 原则：
 *   - Plugin 方式接入，不修改 Kernel
 *   - 概率分值 0-100 连续分布
 *   - 古籍引用贯穿始终
 */

import type { ProbabilityResult } from './probabilityEngine'
import type { TimelineResult, StageScore } from './timelineEngine'
import type { ShenShaResult } from './shenShaEngine'
import type { PatternValidationResult } from './patternValidator'
import type { UseGodResult } from './useGodEngine'
import type { DiseaseMedicineResult } from './diseaseMedicineEngine'
import type { CareerResult } from './careerEngine'
import type { WealthResult } from './wealthEngine'
import type { MarriageResult } from './marriageEngine'
import type { HealthResult } from './healthEngine'

// ─── 类型定义 ───

export type EventType =
  | '升学' | '毕业' | '就业' | '创业' | '升职'
  | '投资' | '买房' | '结婚' | '生育' | '疾病'
  | '官非' | '破财' | '搬迁' | '出国' | '重大转折'

export type ImpactLevel = '高' | '中' | '低'

export interface PredictedEvent {
  /** 事件类型 */
  type: EventType
  /** 发生概率 0-100 */
  probability: number
  /** 时间窗口，如 "21-30岁" 或 "45-55岁" */
  timeWindow: string
  /** 影响等级 */
  impactLevel: ImpactLevel
  /** 影响因素 */
  factors: string[]
  /** 建议 */
  suggestion: string
  /** 古籍引用 */
  classicalRef?: string
}

export interface EventPredictionResult {
  /** 全部15个事件 */
  events: PredictedEvent[]
  /** 概率>=50的积极事件 */
  positiveEvents: PredictedEvent[]
  /** 概率>=30的风险事件 */
  riskEvents: PredictedEvent[]
  /** 概率最高的事件 */
  topEvent: PredictedEvent
  /** 概率>=60的风险事件（需警惕） */
  warningEvents: PredictedEvent[]
  /** 总评 */
  summary: string
  /** 古籍引用 */
  classicalRef: string
}

export interface EventContext {
  /** 日主天干 */
  dayGan: string
  /** 日主五行 */
  dayElement: string
  /** 概率引擎结果 */
  probabilityResult: ProbabilityResult
  /** 时间轴引擎结果 */
  timelineResult: TimelineResult
  /** 神煞引擎结果（可选） */
  shenShaResult?: ShenShaResult
  /** 格局校验结果（可选） */
  patternResult?: PatternValidationResult
  /** 喜用神结果（可选） */
  useGodResult?: UseGodResult
  /** 病药引擎结果（可选） */
  diseaseResult?: DiseaseMedicineResult
  /** 大运列表，如 ['壬申','癸未',...] */
  daYun?: string[]
  /** 事业引擎结果（可选，用于更精确的创业/升职预测） */
  careerResult?: CareerResult
  /** 财富引擎结果（可选，用于更精确的投资/买房预测） */
  wealthResult?: WealthResult
  /** 婚姻引擎结果（可选，用于更精确的结婚预测） */
  marriageResult?: MarriageResult
  /** 健康引擎结果（可选，用于更精确的疾病预测） */
  healthResult?: HealthResult
}

// ─── 常量与工具 ───

/** 生我者为印 */
const PRINT_OF: Record<string, string> = {
  '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
}

/** 我克者为财 */
const WEALTH_OF: Record<string, string> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
}

/** 克我者为官杀 */
const OFFICIAL_OF: Record<string, string> = {
  '木': '金', '火': '水', '土': '木', '金': '火', '水': '土',
}

/** 我生者为食伤 */
const OUTPUT_OF: Record<string, string> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** 从概率结果中提取指定维度分数 */
function getDimensionScore(result: ProbabilityResult, name: string): number {
  const dim = result.dimensions.find((d) => d.name === name)
  return dim ? dim.score : 50
}

/** 从时间轴结果中提取指定维度的阶段平均分 */
function getTimelineAvgScore(result: TimelineResult, key: keyof StageScore): number {
  if (!result.stages || result.stages.length === 0) return 50
  const scores = result.stages.map((s) => (s.score[key] as number) ?? 50)
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

/** 检查神煞列表中是否包含指定神煞 */
function hasShenSha(result: ShenShaResult | undefined, names: string[]): boolean {
  if (!result || !result.shenShaList) return false
  return result.shenShaList.some((s) => names.includes(s.name))
}

/** 获取指定神煞的出现次数 */
function getShenShaCount(result: ShenShaResult | undefined, names: string[]): number {
  if (!result || !result.shenShaList) return 0
  return result.shenShaList.filter((s) => names.includes(s.name)).length
}

/** 获取凶神数量（粗略估计） */
function getXiongShenCount(result: ShenShaResult | undefined): number {
  if (!result) return 0
  return result.xiongShenCount ?? 0
}

/** 判断日主是否身旺 */
function isStrongBody(context: EventContext): boolean {
  const useGod = context.useGodResult
  const dayElement = context.dayElement
  if (!useGod || !dayElement) return false
  const printElement = PRINT_OF[dayElement] || ''
  // 身旺喜食伤财官，身弱喜印比
  // 若用神为印或比劫（同五行），则身弱
  if (useGod.yongShen === printElement || useGod.yongShen === dayElement) {
    return false
  }
  return true
}

/** 判断日主是否身弱 */
function isWeakBody(context: EventContext): boolean {
  return !isStrongBody(context)
}

/** 获取影响等级 */
function getImpactLevel(score: number): ImpactLevel {
  if (score >= 80) return '高'
  if (score >= 50) return '中'
  return '低'
}

/** 获取偏财分数 */
function getPianCaiScore(context: EventContext): number {
  if (context.wealthResult && context.wealthResult.pianCai) {
    const strength = context.wealthResult.pianCai.strength
    if (strength === '强') return 80
    if (strength === '中') return 60
    if (strength === '弱') return 40
  }
  // 默认取财富分的70%
  return getDimensionScore(context.probabilityResult, '财富') * 0.7
}

/** 获取创业分数 */
function getEntrepreneurshipScore(context: EventContext): number {
  if (context.careerResult) {
    return context.careerResult.entrepreneurshipScore ?? 50
  }
  // 用事业分与偏财分综合估计
  const career = getDimensionScore(context.probabilityResult, '事业')
  const wealth = getDimensionScore(context.probabilityResult, '财富')
  return (career * 0.6 + wealth * 0.4)
}

/** 获取管理分数 */
function getManagementScore(context: EventContext): number {
  if (context.careerResult) {
    return context.careerResult.managementScore ?? 50
  }
  return getDimensionScore(context.probabilityResult, '事业')
}

/** 获取稳定度分数 */
function getStabilityScore(context: EventContext): number {
  if (context.careerResult) {
    return context.careerResult.stabilityScore ?? 50
  }
  return 50
}

/** 获取桃花状况评分 */
function getPeachBlossomScore(context: EventContext): number {
  if (context.marriageResult) {
    const pb = context.marriageResult.peachBlossom
    if (pb === '旺') return 80
    if (pb === '有') return 60
    if (pb === '弱') return 40
    if (pb === '无') return 20
  }
  // 通过神煞判断
  const shenSha = context.shenShaResult
  if (hasShenSha(shenSha, ['桃花', '红鸾', '天喜'])) return 70
  return 40
}

/** 获取最弱脏腑风险分 */
function getWeakOrganRisk(context: EventContext): number {
  if (context.healthResult && context.healthResult.organs) {
    const organs = context.healthResult.organs
    const maxRisk = Math.max(...organs.map((o) => o.risk ?? 0))
    return maxRisk * 10 // risk 1-5 → 10-50
  }
  return 30
}

/** 五行偏枯程度（0-100） */
function getWuXingPianKu(context: EventContext): number {
  // 从概率结果的综合风险推断
  const overall = context.probabilityResult.overallScore
  // 综合分越低，偏枯越严重
  return clamp(100 - overall, 0, 100)
}

/** 判断命局水元素是否偏多（用于出国运） */
function isWaterDominant(context: EventContext): boolean {
  const useGod = context.useGodResult
  if (useGod && useGod.scores) {
    return (useGod.scores['水'] ?? 50) >= 70
  }
  return context.dayElement === '水'
}

/** 判断是否有财库 */
function hasCaiKu(context: EventContext): boolean {
  if (context.wealthResult && context.wealthResult.caiKu) {
    return context.wealthResult.caiKu !== '无'
  }
  return false
}

// ─── 事件预测函数 ───

/** 1. 升学 */
function predictEducation(context: EventContext): PredictedEvent {
  const studyScore = getDimensionScore(context.probabilityResult, '学业')
  const patternScore = context.patternResult?.totalScore ?? 50
  const strongBonus = isStrongBody(context) ? 70 : 40
  const shenSha = context.shenShaResult

  let base = studyScore * 0.40 + patternScore * 0.20 + strongBonus * 0.15 + 50 * 0.15
  const factors: string[] = [`学业基础分${Math.round(studyScore)}`]

  if (hasShenSha(shenSha, ['文昌'])) {
    base += 15
    factors.push('文昌入命，利于科名')
  }
  if (hasShenSha(shenSha, ['学堂'])) {
    base += 10
    factors.push('学堂贵人，学业顺遂')
  }
  if (hasShenSha(shenSha, ['华盖'])) {
    base += 5
    factors.push('华盖星照，聪慧好学')
  }

  const probability = clamp(Math.round(base), 0, 100)
  factors.push(`身旺程度：${isStrongBody(context) ? '身旺' : '身弱'}`)

  return {
    type: '升学',
    probability,
    timeWindow: '7-18岁',
    impactLevel: getImpactLevel(probability),
    factors,
    suggestion: probability >= 50 ? '把握学业黄金期，厚积而薄发' : '学业需加倍努力，寻找适合的学习方法',
    classicalRef: '《渊海子平》："少年重印，学业为先。"',
  }
}

/** 2. 毕业 */
function predictGraduation(context: EventContext, eduEvent: PredictedEvent): PredictedEvent {
  const studyScore = getDimensionScore(context.probabilityResult, '学业')
  const patternScore = context.patternResult?.totalScore ?? 50

  // 年龄因素：学业阶段默认取中高分
  const ageFactor = 70

  let base = studyScore * 0.50 + ageFactor * 0.30 + patternScore * 0.20
  const factors: string[] = [`学业基础分${Math.round(studyScore)}`]

  // 升学概率>50则毕业概率自动>=60
  if (eduEvent.probability > 50) {
    base = Math.max(base, 60)
    factors.push('升学运佳，毕业顺利')
  }

  const probability = clamp(Math.round(base), 0, 100)

  return {
    type: '毕业',
    probability,
    timeWindow: '18-25岁（大学） / 22-30岁（研究生）',
    impactLevel: getImpactLevel(probability),
    factors,
    suggestion: '完成学业是人生重要里程碑，珍惜校园时光',
    classicalRef: '《滴天髓》："命不可先定，运有穷通。"',
  }
}

/** 3. 就业 */
function predictEmployment(context: EventContext): PredictedEvent {
  const careerScore = getDimensionScore(context.probabilityResult, '事业')
  const ageFactor = 65 // 20-30岁就业窗口
  const strongBonus = isStrongBody(context) ? 70 : 45

  let base = careerScore * 0.50 + ageFactor * 0.30 + strongBonus * 0.20
  const factors: string[] = [`事业基础分${Math.round(careerScore)}`]

  if (isStrongBody(context)) {
    factors.push('身旺能担事，职场有竞争力')
  } else {
    factors.push('身弱宜稳扎稳打，选择适合岗位')
  }

  const probability = clamp(Math.round(base), 0, 100)

  return {
    type: '就业',
    probability,
    timeWindow: '20-30岁',
    impactLevel: getImpactLevel(probability),
    factors,
    suggestion: probability >= 50 ? '把握求职黄金期，顺势而为' : '就业需耐心准备，提升核心竞争力',
    classicalRef: '《三命通会》："青年重食伤，奋斗拼搏期。"',
  }
}

/** 4. 创业 */
function predictEntrepreneurship(context: EventContext): PredictedEvent {
  const entScore = getEntrepreneurshipScore(context)
  const wealthScore = getDimensionScore(context.probabilityResult, '财富')
  const strongBonus = isStrongBody(context) ? 75 : 45
  const patternScore = context.patternResult?.totalScore ?? 50
  const shenSha = context.shenShaResult

  let base = entScore * 0.40 + wealthScore * 0.25 + strongBonus * 0.20 + patternScore * 0.15
  const factors: string[] = [
    `创业潜力分${Math.round(entScore)}`,
    `财富基础分${Math.round(wealthScore)}`,
  ]

  if (entScore > 60) {
    base += 15
    factors.push('创业潜质突出')
  }
  if (hasShenSha(shenSha, ['驿马'])) {
    base += 10
    factors.push('驿马星动，宜动中求财')
  }
  if (hasShenSha(shenSha, ['将星'])) {
    base += 10
    factors.push('将星入命，有领导魄力')
  }

  const probability = clamp(Math.round(base), 0, 100)

  return {
    type: '创业',
    probability,
    timeWindow: '25-45岁',
    impactLevel: getImpactLevel(probability),
    factors,
    suggestion: probability >= 50 ? '创业时机成熟，把握机遇' : '创业需谨慎评估，可先积累经验与资源',
    classicalRef: '《滴天髓》："财气通门户，无人不富。"',
  }
}

/** 5. 升职 */
function predictPromotion(context: EventContext): PredictedEvent {
  const mgmtScore = getManagementScore(context)
  const careerScore = getDimensionScore(context.probabilityResult, '事业')
  const patternScore = context.patternResult?.totalScore ?? 50
  const strongBonus = isStrongBody(context) ? 70 : 45

  let base = mgmtScore * 0.40 + careerScore * 0.30 + patternScore * 0.20 + strongBonus * 0.10
  const factors: string[] = [
    `管理能力分${Math.round(mgmtScore)}`,
    `事业基础分${Math.round(careerScore)}`,
  ]

  if (mgmtScore > 70) {
    base += 10
    factors.push('管理才能出众')
  }

  const probability = clamp(Math.round(base), 0, 100)

  return {
    type: '升职',
    probability,
    timeWindow: '30-50岁',
    impactLevel: getImpactLevel(probability),
    factors,
    suggestion: probability >= 50 ? '事业上升期，积极进取争取更高平台' : '稳扎稳打，等待时机成熟',
    classicalRef: '《子平真诠》："格局高低，关乎一生穷通。"',
  }
}

/** 6. 投资 */
function predictInvestment(context: EventContext): PredictedEvent {
  const pianCaiScore = getPianCaiScore(context)
  const wealthScore = getDimensionScore(context.probabilityResult, '财富')
  const strongBonus = isStrongBody(context) ? 75 : 40
  const patternScore = context.patternResult?.totalScore ?? 50
  const shenSha = context.shenShaResult

  let base = pianCaiScore * 0.40 + wealthScore * 0.30 + strongBonus * 0.20 + patternScore * 0.10
  const factors: string[] = [
    `偏财分${Math.round(pianCaiScore)}`,
    `财富基础分${Math.round(wealthScore)}`,
  ]

  if (context.wealthResult && context.wealthResult.pianCai?.strength === '强') {
    base += 15
    factors.push('偏财有力，投资运佳')
  }
  if (hasShenSha(shenSha, ['劫煞'])) {
    base -= 10
    factors.push('劫煞临身，投资需防破耗')
  }
  if (hasShenSha(shenSha, ['羊刃'])) {
    base -= 5
    factors.push('羊刃当值，决策宜稳重')
  }

  const probability = clamp(Math.round(base), 0, 100)

  return {
    type: '投资',
    probability,
    timeWindow: '30-55岁',
    impactLevel: getImpactLevel(probability),
    factors,
    suggestion: probability >= 50 ? '投资运不错，可适度进取' : '投资需谨慎，以保守稳健为主',
    classicalRef: '《滴天髓》："财为养命之源，不可无也。"',
  }
}

/** 7. 买房 */
function predictHousePurchase(context: EventContext): PredictedEvent {
  const wealthScore = getDimensionScore(context.probabilityResult, '财富')
  const familyScore = getTimelineAvgScore(context.timelineResult, 'family')
  const ageFactor = 65
  const stabilityScore = getStabilityScore(context)

  let base = wealthScore * 0.40 + familyScore * 0.30 + ageFactor * 0.20 + stabilityScore * 0.10
  const factors: string[] = [
    `财富基础分${Math.round(wealthScore)}`,
    `家庭运势分${Math.round(familyScore)}`,
  ]

  if (hasCaiKu(context)) {
    base += 10
    factors.push('命带财库，聚财能力强')
  }

  const probability = clamp(Math.round(base), 0, 100)

  return {
    type: '买房',
    probability,
    timeWindow: '28-45岁',
    impactLevel: getImpactLevel(probability),
    factors,
    suggestion: probability >= 50 ? '置业时机较好，可规划购房' : '购房需量力而行，做好财务规划',
    classicalRef: '《三命通会》："有财有库，发则能存。"',
  }
}

/** 8. 结婚 */
function predictMarriage(context: EventContext): PredictedEvent {
  const marriageScore = getDimensionScore(context.probabilityResult, '婚姻')
  const peachScore = getPeachBlossomScore(context)
  const ageFactor = 70
  const strongBonus = isStrongBody(context) ? 65 : 50
  const shenSha = context.shenShaResult

  let base = marriageScore * 0.50 + peachScore * 0.20 + ageFactor * 0.20 + strongBonus * 0.10
  const factors: string[] = [
    `婚姻基础分${Math.round(marriageScore)}`,
    `桃花运势${Math.round(peachScore)}`,
  ]

  if (hasShenSha(shenSha, ['桃花'])) {
    base += 10
    factors.push('桃花入命，异性缘佳')
  }
  if (hasShenSha(shenSha, ['红鸾'])) {
    base += 10
    factors.push('红鸾星动，婚缘将至')
  }
  if (hasShenSha(shenSha, ['天喜'])) {
    base += 10
    factors.push('天喜照临，喜庆临门')
  }
  if (hasShenSha(shenSha, ['孤辰', '寡宿'])) {
    base -= 15
    factors.push('孤辰寡宿，婚姻宜主动争取')
  }
  if (context.marriageResult?.riskFactors?.some((r) => r.includes('冲'))) {
    base -= 10
    factors.push('日支逢冲，婚姻需用心经营')
  }

  const probability = clamp(Math.round(base), 0, 100)

  return {
    type: '结婚',
    probability,
    timeWindow: '22-35岁',
    impactLevel: getImpactLevel(probability),
    factors,
    suggestion: probability >= 50 ? '婚缘较好，珍惜良缘' : '婚姻宜顺其自然，不可强求',
    classicalRef: '《渊海子平》："男以财为妻，女以官为夫。"',
  }
}

/** 9. 生育 */
function predictChildbirth(context: EventContext): PredictedEvent {
  const familyScore = getTimelineAvgScore(context.timelineResult, 'family')
  const marriageScore = getDimensionScore(context.probabilityResult, '婚姻')
  const healthScore = getDimensionScore(context.probabilityResult, '健康')
  const ageFactor = 65

  const base = familyScore * 0.40 + marriageScore * 0.30 + healthScore * 0.20 + ageFactor * 0.10
  const factors: string[] = [
    `家庭运势分${Math.round(familyScore)}`,
    `婚姻基础分${Math.round(marriageScore)}`,
    `健康状况分${Math.round(healthScore)}`,
  ]

  const probability = clamp(Math.round(base), 0, 100)

  return {
    type: '生育',
    probability,
    timeWindow: '25-40岁',
    impactLevel: getImpactLevel(probability),
    factors,
    suggestion: probability >= 50 ? '生育运势平稳，可适时规划' : '生育宜调养身心，做好充分准备',
    classicalRef: '《三命通会》："子女缘深浅，看食伤旺衰。"',
  }
}

/** 10. 搬迁 */
function predictRelocation(context: EventContext): PredictedEvent {
  const yiMaScore = hasShenSha(context.shenShaResult, ['驿马']) ? 80 : 30
  const careerChange = getDimensionScore(context.probabilityResult, '事业')
  const familyScore = getTimelineAvgScore(context.timelineResult, 'family')
  const ageFactor = 60

  let base = yiMaScore * 0.30 + careerChange * 0.25 + familyScore * 0.25 + ageFactor * 0.20
  const factors: string[] = [
    `事业变动分${Math.round(careerChange)}`,
    `家庭运势分${Math.round(familyScore)}`,
  ]

  if (hasShenSha(context.shenShaResult, ['驿马'])) {
    base += 25
    factors.push('驿马临命，多动之象')
  }

  const probability = clamp(Math.round(base), 0, 100)

  return {
    type: '搬迁',
    probability,
    timeWindow: '20-50岁',
    impactLevel: getImpactLevel(probability),
    factors,
    suggestion: probability >= 50 ? '搬迁运较旺，宜把握时机择吉而居' : '搬迁宜稳重，非必要不轻易变动',
    classicalRef: '《滴天髓》："动则生变，变则通。"',
  }
}

/** 11. 出国 */
function predictAbroad(context: EventContext): PredictedEvent {
  const yiMaScore = hasShenSha(context.shenShaResult, ['驿马']) ? 75 : 30
  const studyScore = getDimensionScore(context.probabilityResult, '学业')
  const careerScore = getDimensionScore(context.probabilityResult, '事业')
  const waterBonus = isWaterDominant(context) ? 70 : 40
  const ageFactor = 55

  let base = yiMaScore * 0.25 + studyScore * 0.25 + careerScore * 0.20 + waterBonus * 0.20 + ageFactor * 0.10
  const factors: string[] = [
    `学业基础分${Math.round(studyScore)}`,
    `事业变动分${Math.round(careerScore)}`,
  ]

  if (isWaterDominant(context)) {
    factors.push('命局水旺，利远行流动')
  }
  if (hasShenSha(context.shenShaResult, ['驿马'])) {
    base += 20
    factors.push('驿马入命，远行有象')
  }

  const probability = clamp(Math.round(base), 0, 100)

  return {
    type: '出国',
    probability,
    timeWindow: '18-40岁',
    impactLevel: getImpactLevel(probability),
    factors,
    suggestion: probability >= 50 ? '出国运佳，可把握留学或发展机会' : '出国需充分准备，量力而行',
    classicalRef: '《穷通宝鉴》："水主智，亦主流动远行。"',
  }
}

/** 12. 疾病（风险事件） */
function predictDisease(context: EventContext): PredictedEvent {
  const healthScore = getDimensionScore(context.probabilityResult, '健康')
  const weakOrganRisk = getWeakOrganRisk(context)
  const wuXingPianKu = getWuXingPianKu(context)
  const weakBodyBonus = isWeakBody(context) ? 30 : 10

  let base = (100 - healthScore) * 0.40 + weakOrganRisk * 0.30 + wuXingPianKu * 0.20 + weakBodyBonus * 0.10
  const factors: string[] = [
    `健康基础分${Math.round(healthScore)}（风险${Math.round(100 - healthScore)}）`,
    `脏腑薄弱环节风险${Math.round(weakOrganRisk)}`,
  ]

  if (context.diseaseResult && context.diseaseResult.hasDisease && context.diseaseResult.medicines.length > 0) {
    base -= 10
    factors.push('病药有制，可化解部分健康风险')
  }
  if (isWeakBody(context)) {
    factors.push('身弱抗病力相对不足')
  }
  if (wuXingPianKu > 50) {
    factors.push('五行偏枯，需注意平衡调养')
  }

  const probability = clamp(Math.round(base), 0, 100)

  return {
    type: '疾病',
    probability,
    timeWindow: '任意年龄',
    impactLevel: getImpactLevel(probability),
    factors,
    suggestion: '养生防病，定期体检，调和作息',
    classicalRef: '《黄帝内经》："上工治未病，不治已病。"',
  }
}

/** 13. 官非（风险事件） */
function predictLawsuit(context: EventContext): PredictedEvent {
  const xiongShenCount = getXiongShenCount(context.shenShaResult)
  const xiongShenBonus = Math.min(xiongShenCount * 8, 30)

  let base = xiongShenBonus
  const factors: string[] = []

  // 官杀混杂
  if (context.diseaseResult?.diseases?.some((d) => d.name === '官杀混杂')) {
    base += 15
    factors.push('官杀混杂，易惹是非')
  }
  // 伤官见官
  if (context.diseaseResult?.diseases?.some((d) => d.name === '食伤过旺')) {
    base += 15
    factors.push('伤官见官，口舌官非之虑')
  }
  // 格局破
  if (context.patternResult?.isPoGe) {
    base += 10
    factors.push('格局有破，行事需谨')
  }

  if (hasShenSha(context.shenShaResult, ['劫煞'])) {
    base += 10
    factors.push('劫煞临身，防小人暗算')
  }
  if (hasShenSha(context.shenShaResult, ['灾煞'])) {
    base += 10
    factors.push('灾煞当值，需谨慎避险')
  }
  if (hasShenSha(context.shenShaResult, ['亡神'])) {
    base += 5
    factors.push('亡神入命，官司牢狱之虞')
  }

  // 天德月德化解
  if (hasShenSha(context.shenShaResult, ['天德'])) {
    base -= 10
    factors.push('天德贵人，逢凶化吉')
  }
  if (hasShenSha(context.shenShaResult, ['月德'])) {
    base -= 10
    factors.push('月德贵人，可解厄难')
  }

  if (factors.length === 0) {
    factors.push('凶神数量' + xiongShenCount)
  }

  const probability = clamp(Math.round(base), 0, 100)

  return {
    type: '官非',
    probability,
    timeWindow: '任意年龄',
    impactLevel: getImpactLevel(probability),
    factors,
    suggestion: '遵纪守法，谨慎签约，远离是非之地',
    classicalRef: '《渊海子平》："官非牢狱，看官杀与刑冲。"',
  }
}

/** 14. 破财（风险事件） */
function predictFinancialLoss(context: EventContext): PredictedEvent {
  const wealthScore = getDimensionScore(context.probabilityResult, '财富')
  const shenSha = context.shenShaResult

  let base = (100 - wealthScore) * 0.30
  const factors: string[] = [`财富基础分${Math.round(wealthScore)}（风险${Math.round(100 - wealthScore)}）`]

  // 偏财无力
  if (context.wealthResult && context.wealthResult.pianCai?.strength === '弱') {
    base += 20
    factors.push('偏财无力，投资易损')
  }
  // 身弱财多
  if (isWeakBody(context) && wealthScore > 60) {
    base += 20
    factors.push('身弱财多，富屋贫人')
  }
  // 凶神
  const xiongCount = getXiongShenCount(shenSha)
  if (xiongCount > 0) {
    base += Math.min(xiongCount * 3, 15)
    factors.push(`凶神${xiongCount}个，破耗难免`)
  }
  // 羊刃
  if (hasShenSha(shenSha, ['羊刃'])) {
    base += 10
    factors.push('羊刃当值，易有破耗')
  }
  // 破财煞（泛指凶煞带来的破财）
  if (hasShenSha(shenSha, ['劫煞', '灾煞'])) {
    base += 5
    factors.push('煞星临财，需防意外损失')
  }

  // 财库有则减
  if (hasCaiKu(context)) {
    base -= 10
    factors.push('命带财库，能守财聚财')
  }
  // 财多无根（偏财强但身弱）
  if (context.wealthResult?.pianCai?.strength === '强' && isWeakBody(context)) {
    base += 10
    factors.push('财多无根，易来易去')
  }

  const probability = clamp(Math.round(base), 0, 100)

  return {
    type: '破财',
    probability,
    timeWindow: '任意年龄',
    impactLevel: getImpactLevel(probability),
    factors,
    suggestion: '谨慎理财，量入为出，避免高风险投资',
    classicalRef: '《滴天髓》："财多身弱，富屋贫人。"',
  }
}

/** 15. 重大转折 */
function predictMajorTurning(context: EventContext): PredictedEvent {
  let base = 0
  const factors: string[] = []

  // 格局变化可能性
  if (context.patternResult) {
    if (context.patternResult.isPoGe || (context.patternResult.defects && context.patternResult.defects.length > 0)) {
      base += 30
      factors.push('格局有变动之象')
    } else {
      base += 15
      factors.push('格局平稳，变化较缓')
    }
  } else {
    base += 20
  }

  // 大运变化
  const daYunCount = context.daYun?.length ?? 0
  if (daYunCount >= 2) {
    base += 25
    factors.push(`大运更替${daYunCount}步，人生阶段转换`)
  } else {
    base += 15
  }

  // 冲合
  if (context.marriageResult?.riskFactors?.some((r) => r.includes('冲'))) {
    base += 20
    factors.push('命局有冲合，变动之象')
  } else {
    base += 10
  }

  // 年龄段
  base += 15
  factors.push('人生关键年龄段')

  // 特殊格局
  if (context.patternResult?.isZhenGe || context.patternResult?.starLevel === 5) {
    base += 10
    factors.push('特殊格局，人生轨迹或有不同')
  } else {
    base += 5
  }

  if (hasShenSha(context.shenShaResult, ['驿马'])) {
    base += 10
    factors.push('驿马星动，变动频繁')
  }
  if (hasShenSha(context.shenShaResult, ['红鸾'])) {
    base += 5
    factors.push('红鸾星动，人生喜事转折')
  }

  const probability = clamp(Math.round(base), 0, 100)

  return {
    type: '重大转折',
    probability,
    timeWindow: '28-50岁',
    impactLevel: getImpactLevel(probability),
    factors,
    suggestion: probability >= 50 ? '人生转折期，顺势而为，把握机遇' : '人生相对平稳，稳中求进',
    classicalRef: '《滴天髓》："命不可先定，运有穷通。"',
  }
}

// ─── 核心函数 ───

/**
 * 人生事件推演引擎主入口
 *
 * 基于概率引擎、时间轴引擎及其他子引擎的输出，
 * 推演15类人生事件的发生概率、时间窗口与影响等级。
 */
export function predictEvents(context: EventContext): EventPredictionResult {
  // 计算全部15个事件
  const eduEvent = predictEducation(context)
  const gradEvent = predictGraduation(context, eduEvent)
  const empEvent = predictEmployment(context)
  const entEvent = predictEntrepreneurship(context)
  const promoEvent = predictPromotion(context)
  const investEvent = predictInvestment(context)
  const houseEvent = predictHousePurchase(context)
  const marryEvent = predictMarriage(context)
  const birthEvent = predictChildbirth(context)
  const diseaseEvent = predictDisease(context)
  const lawsuitEvent = predictLawsuit(context)
  const lossEvent = predictFinancialLoss(context)
  const moveEvent = predictRelocation(context)
  const abroadEvent = predictAbroad(context)
  const turningEvent = predictMajorTurning(context)

  const allEvents: PredictedEvent[] = [
    eduEvent,
    gradEvent,
    empEvent,
    entEvent,
    promoEvent,
    investEvent,
    houseEvent,
    marryEvent,
    birthEvent,
    diseaseEvent,
    lawsuitEvent,
    lossEvent,
    moveEvent,
    abroadEvent,
    turningEvent,
  ]

  // 按概率降序排列
  allEvents.sort((a, b) => b.probability - a.probability)

  // 分类
  const positiveEvents = allEvents.filter(
    (e) =>
      !['疾病', '官非', '破财'].includes(e.type) && e.probability >= 50,
  )

  const riskEvents = allEvents.filter(
    (e) => ['疾病', '官非', '破财'].includes(e.type) && e.probability >= 30,
  )

  const warningEvents = allEvents.filter(
    (e) => ['疾病', '官非', '破财'].includes(e.type) && e.probability >= 60,
  )

  const topEvent = allEvents[0]

  // 生成总评
  const summary = generateSummary(allEvents, positiveEvents, warningEvents, topEvent)

  return {
    events: allEvents,
    positiveEvents,
    riskEvents,
    topEvent,
    warningEvents,
    summary,
    classicalRef:
      '《滴天髓》："命不可先定，运有穷通。"《子平真诠》："格局高低，关乎一生穷通。"',
  }
}

/** 生成总评 */
function generateSummary(
  allEvents: PredictedEvent[],
  positiveEvents: PredictedEvent[],
  warningEvents: PredictedEvent[],
  topEvent: PredictedEvent,
): string {
  const parts: string[] = []

  parts.push(`此生概率最高的人生事件为「${topEvent.type}」，概率${topEvent.probability}%。`)

  if (positiveEvents.length > 0) {
    const names = positiveEvents.map((e) => `${e.type}(${e.probability}%)`).join('、')
    parts.push(`积极事件包括：${names}。`)
  } else {
    parts.push('积极事件较少，宜稳扎稳打，厚积薄发。')
  }

  if (warningEvents.length > 0) {
    const names = warningEvents.map((e) => e.type).join('、')
    parts.push(`需重点警惕的风险事件：${names}，建议提前防范。`)
  } else {
    parts.push('重大风险事件概率可控，保持平常心即可。')
  }

  // 统计时间窗口
  const timeWindows = allEvents
    .filter((e) => e.probability >= 40 && e.timeWindow !== '任意年龄')
    .map((e) => `${e.type}(${e.timeWindow})`)
  if (timeWindows.length > 0) {
    parts.push(`关键时间窗口：${timeWindows.slice(0, 4).join('、')}。`)
  }

  parts.push('人生运势起伏乃常态，知命者不立于危墙之下，顺势而为方为上策。')

  return parts.join('')
}

// ─── 默认导出 ───

export default predictEvents
