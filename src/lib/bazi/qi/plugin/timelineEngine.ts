/**
 * TimelineEngine — P3.4 人生时间轴引擎
 *
 * 古籍依据（源自《滴天髓》《三命通会》《渊海子平》《穷通宝鉴》）：
 *   《滴天髓》云："命不可先定，运有穷通。"
 *   《三命通会》云："大运者，人生之枢纽也。十年一变，主宰阶段性运势。"
 *   《穷通宝鉴》以月令论用神，隐含"时令不同、所需不同"的思想。
 *   《渊海子平》云："少年重印，青年重食伤，中年重财官，晚年重印比。"
 *
 * 核心功能：
 *   1. 自动生成人生7个阶段的六维评分（事业/财富/婚姻/健康/家庭/学习）
 *   2. 结合大运流年输出变化趋势
 *   3. 基于人生四阶段理论分配权重
 *   4. 输出趋势图数据（可直接用于 ECharts 等图表库）
 *
 * 七阶段划分：
 *   少年: 0-10, 11-20  — 学习成长期，偏重印星
 *   青年: 21-30        — 奋斗拼搏期，偏重食伤
 *   壮年: 31-40        — 事业巅峰前期，偏重财官
 *   中年: 41-50        — 综合实力体现
 *   中晚年: 51-60      — 健康权重上升，家庭重要
 *   晚年: 61+          — 健康为首要，财富守成
 *
 * 原则：
 *   - Plugin 方式接入，不修改 Kernel
 *   - 所有算法引用古籍来源
 *   - 概率分值 0-100 连续分布
 */

import type { FiveElement } from '../../types'
import { STEM_ELEMENT, BRANCH_ELEMENT, GENERATE, OVERCOME, getStemElement, getBranchElement } from '../../../core'

// ─── 类型定义 ───

export type TimelineAgeRange = '0-10' | '11-20' | '21-30' | '31-40' | '41-50' | '51-60' | '61+'

export interface StageScore {
  /** 事业 0-100 */
  career: number
  /** 财富 0-100 */
  wealth: number
  /** 婚姻 0-100 */
  marriage: number
  /** 健康 0-100 */
  health: number
  /** 家庭 0-100 */
  family: number
  /** 学习 0-100 */
  study: number
  /** 综合 0-100 */
  overall: number
}

export interface DaYunInfo {
  /** 大运名称如 "壬申" */
  name: string
  /** 起运年龄 */
  ageStart: number
  /** 结束年龄 */
  ageEnd: number
  /** 五行 */
  element: string
  /** 吉平凶 */
  effect: '吉' | '平' | '凶'
  /** 修正分 -20到+20 */
  score: number
  /** 描述 */
  description: string
}

export interface TimelineStage {
  /** 年龄段 */
  ageRange: TimelineAgeRange
  /** 六维评分 */
  score: StageScore
  /** 趋势 */
  trend: '上升' | '平稳' | '下降' | '峰值' | '谷底'
  /** 描述 */
  description: string
  /** 关键事件预测 */
  keyEvents: string[]
  /** 建议 */
  advice: string
  /** 对应大运（如果有） */
  daYun?: DaYunInfo
  /** 置信度 0-100 */
  confidence: number
}

export interface TimelineResult {
  /** 7个阶段 */
  stages: TimelineStage[]
  /** 最佳阶段 */
  bestStage: TimelineAgeRange
  /** 最需注意阶段 */
  worstStage: TimelineAgeRange
  /** 巅峰年龄 */
  peakAge: string
  /** 谨慎年龄 */
  cautionAge: string
  /** 整体趋势 */
  overallTrend: '上升型' | '平稳型' | '下降型' | '先抑后扬' | '先扬后抑' | '波浪型'
  /** 总评 */
  summary: string
  /** 古籍引用 */
  classicalRef: string
  /** 趋势图数据 */
  chart: {
    ages: string[]
    career: number[]
    wealth: number[]
    marriage: number[]
    health: number[]
    overall: number[]
  }
}

export interface TimelineContext {
  /** 日主天干 */
  dayGan: string
  /** 日主五行 */
  dayElement: string
  /** 出生年份（如1990），用于推算大运流年 */
  birthYear: number
  /** 性别，影响大运顺逆 */
  gender: '男' | '女'
  /** 日主旺衰结果 */
  strengthResult: any
  /** 格局校验结果 */
  patternResult: any
  /** 喜用神结果 */
  useGodResult: any
  /** 概率引擎的原始输出 */
  probabilityResult: any
  /** 神煞结果 */
  shenShaResult?: any
  /** 大运列表如 ['壬申','癸未','甲申',...] */
  daYun?: string[]
  /** 起运年龄 */
  startDaYunAge?: number
  /** 大运修正函数 */
  luckModifierFn?: (
    originalScore: number,
    dayElement: string,
    dayGan: string,
    useGodElement: string,
    jiShen: string,
    jiElement: string,
    luckGan: string,
    luckZhi: string,
  ) => any
  /** 动态喜用神函数 */
  dynamicUseGodFn?: (
    dayElement: string,
    strengthScore: number,
    useGod: string,
    xiShen: string,
    jiShen: string,
    age: number,
  ) => any
}

// ─── 常量 ───

/** 七阶段定义 */
const STAGES: TimelineAgeRange[] = ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61+']

/** 各阶段标签（中文） */
const STAGE_LABELS: Record<TimelineAgeRange, string> = {
  '0-10': '少年早期',
  '11-20': '少年晚期',
  '21-30': '青年期',
  '31-40': '壮年期',
  '41-50': '中年期',
  '51-60': '中晚年',
  '61+': '晚年期',
}

/** 各年龄段基础权重 */
interface StageWeights {
  career: number
  wealth: number
  marriage: number
  health: number
  family: number
  study: number
}

const STAGE_WEIGHTS: Record<TimelineAgeRange, StageWeights> = {
  '0-10':  { career: 0.10, wealth: 0.05, marriage: 0,    health: 0.25, family: 0.30, study: 0.30 },
  '11-20': { career: 0.10, wealth: 0.05, marriage: 0,    health: 0.25, family: 0.30, study: 0.30 },
  '21-30': { career: 0.25, wealth: 0.15, marriage: 0.20, health: 0.15, family: 0.10, study: 0.15 },
  '31-40': { career: 0.30, wealth: 0.25, marriage: 0.20, health: 0.10, family: 0.10, study: 0.05 },
  '41-50': { career: 0.25, wealth: 0.25, marriage: 0.15, health: 0.15, family: 0.15, study: 0.05 },
  '51-60': { career: 0.15, wealth: 0.15, marriage: 0.10, health: 0.25, family: 0.20, study: 0.15 },
  '61+':   { career: 0.05, wealth: 0.10, marriage: 0.05, health: 0.35, family: 0.25, study: 0.20 },
}

/** 各阶段侧重十神（用于无大运时推算） */
const STAGE_FOCUS_SHISHEN: Record<TimelineAgeRange, string> = {
  '0-10':  '印星',
  '11-20': '印星',
  '21-30': '食伤',
  '31-40': '财官',
  '41-50': '财官',
  '51-60': '比印',
  '61+':   '比印',
}

/** 各阶段关键事件 */
const STAGE_KEY_EVENTS: Record<TimelineAgeRange, string[]> = {
  '0-10':  ['启蒙教育关键期', '家庭环境影响性格', '健康需特别关注'],
  '11-20': ['学业冲刺阶段', '性格定型期', '身体发育重要期'],
  '21-30': ['适宜恋爱结婚', '适合考取资格证书', '开始事业积累'],
  '31-40': ['事业晋升关键期', '财运上升期', '家庭建设期'],
  '41-50': ['事业巅峰期', '需注意健康', '子女教育关键期'],
  '51-60': ['财富保值期', '健康体检重要', '家庭关系调整'],
  '61+':   ['养生保健为要', '传承规划', '心态调整期'],
}

/** 各阶段建议模板 */
const STAGE_ADVICE_TEMPLATES: Record<TimelineAgeRange, string[]> = {
  '0-10':  [
    '注重教育培养，打好学习基础。',
    '营造温馨家庭环境，培养良好品德。',
    '关注身体健康，预防少儿常见疾病。',
  ],
  '11-20': [
    '学业为重，争取升学机会。',
    '注意心理健康，培养独立人格。',
    '适度锻炼，增强体质。',
  ],
  '21-30': [
    '把握事业起点，积累经验和人脉。',
    '婚姻宜选择志同道合之伴侣。',
    '理财从早开始，培养储蓄习惯。',
  ],
  '31-40': [
    '事业全力以赴，争取晋升突破。',
    '家庭与事业平衡，避免顾此失彼。',
    '定期体检，关注亚健康信号。',
  ],
  '41-50': [
    '善用经验优势，巩固事业地位。',
    '注重养生，预防慢性疾病。',
    '关注子女发展，维护家庭和谐。',
  ],
  '51-60': [
    '合理规划退休生活，确保财务稳健。',
    '坚持锻炼，保持活力。',
    '经营好家庭关系，享受天伦之乐。',
  ],
  '61+': [
    '养生保健为第一要务。',
    '保持学习，让精神充实。',
    '调整心态，安享晚年。',
  ],
}

/** 十神 → 五行关系映射（保留，core 中无此映射） */
const SHISHEN_ELEMENT_MAP: Record<string, string> = {
  '比肩': '比劫', '劫财': '比劫',
  '食神': '食伤', '伤官': '食伤',
  '偏财': '财星', '正财': '财星',
  '偏官': '官杀', '正官': '官杀',
  '偏印': '印星', '正印': '印星',
}

// ─── 工具函数 ───

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** 判断五行关系：生、克、比和 */
function parseDaYunGanZhi(daYunStr: string): { gan: string; zhi: string } | null {
  if (!daYunStr || daYunStr.length < 2) return null
  return {
    gan: daYunStr[0],
    zhi: daYunStr[1],
  }
}

/** 判断五行关系：生、克、比和 */
function getElementRelation(a: FiveElement, b: FiveElement): '生' | '克' | '比和' | '受生' | '受克' {
  if (a === b) return '比和'
  if (GENERATE[a] === b) return '生'
  if (OVERCOME[a] === b) return '克'
  if (GENERATE[b] === a) return '受生'
  if (OVERCOME[b] === a) return '受克'
  return '比和'
}

/** 判断某大运对日主的吉凶效应 */
function evaluateDaYunEffect(
  daYunGan: string,
  daYunZhi: string,
  dayElement: FiveElement,
  useGodElement: string,
  jiShenElement: string,
): { effect: '吉' | '平' | '凶'; score: number; description: string } {
  const ganElement = getStemElement(daYunGan)
  const zhiElement = getBranchElement(daYunZhi)

  let totalScore = 0
  let reasons: string[] = []

  // 天干与用神关系
  const ganToUseGod = getElementRelation(ganElement, useGodElement as FiveElement)
  if (ganToUseGod === '生' || ganToUseGod === '比和') {
    totalScore += 8
    reasons.push(`大运天干${daYunGan}(${ganElement})生扶用神`)
  } else if (ganToUseGod === '克') {
    totalScore -= 8
    reasons.push(`大运天干${daYunGan}(${ganElement})克制用神`)
  }

  // 天干与日主关系
  const ganToDay = getElementRelation(ganElement, dayElement)
  if (ganToDay === '生' || ganToDay === '比和') {
    totalScore += 4
  } else if (ganToDay === '克') {
    totalScore -= 4
  }

  // 地支与用神关系
  const zhiToUseGod = getElementRelation(zhiElement, useGodElement as FiveElement)
  if (zhiToUseGod === '生' || zhiToUseGod === '比和') {
    totalScore += 7
    reasons.push(`大运地支${daYunZhi}(${zhiElement})助益用神`)
  } else if (zhiToUseGod === '克') {
    totalScore -= 7
    reasons.push(`大运地支${daYunZhi}(${zhiElement})克制用神`)
  }

  // 地支与日主关系
  const zhiToDay = getElementRelation(zhiElement, dayElement)
  if (zhiToDay === '生' || zhiToDay === '比和') {
    totalScore += 3
  } else if (zhiToDay === '克') {
    totalScore -= 3
  }

  // 天干地支是否与忌神同气
  if (ganElement === jiShenElement) {
    totalScore -= 6
    reasons.push(`大运天干${daYunGan}为忌神`)
  }
  if (zhiElement === jiShenElement) {
    totalScore -= 5
    reasons.push(`大运地支${daYunZhi}为忌神`)
  }

  totalScore = clamp(totalScore, -20, 20)

  const effect: '吉' | '平' | '凶' = totalScore >= 5 ? '吉' : totalScore <= -5 ? '凶' : '平'
  const description = reasons.length > 0
    ? reasons.join('；') + `。综合评分：${totalScore > 0 ? '+' : ''}${totalScore}`
    : `大运${daYunGan}${daYunZhi}对命局影响平平，综合评分：${totalScore}`

  return { effect, score: totalScore, description }
}

// ─── 从 probabilityResult 提取各维度基础分 ───

function extractDimensionScores(probabilityResult: any): {
  career: number
  wealth: number
  marriage: number
  health: number
  family: number
  study: number
} {
  const dims = probabilityResult?.dimensions || []

  const findScore = (keywords: string[]): number => {
    for (const dim of dims) {
      for (const kw of keywords) {
        if (dim.name && dim.name.includes(kw)) {
          return dim.score || 50
        }
      }
    }
    return 50 // 默认中值
  }

  return {
    career:   findScore(['事业']),
    wealth:   findScore(['财富', '财运']),
    marriage: findScore(['婚姻']),
    health:   findScore(['健康']),
    family:   findScore(['贵人运', '家庭']),
    study:    findScore(['学业']),
  }
}

// ─── 计算阶段基础分（加权） ───

function calculateStageBaseScore(
  ageRange: TimelineAgeRange,
  dimScores: { career: number; wealth: number; marriage: number; health: number; family: number; study: number },
  strengthScore: number,
): StageScore {
  const weights = STAGE_WEIGHTS[ageRange]

  // 少年阶段婚姻为0，财富偏低
  let adjustedMarriage = dimScores.marriage
  if (weights.marriage === 0) {
    adjustedMarriage = 0
  }

  let adjustedWealth = dimScores.wealth
  if (ageRange === '0-10' || ageRange === '11-20') {
    // 少年不发财运，财富评分自然偏低
    adjustedWealth = dimScores.wealth * 0.4
  }

  // 身旺身弱对各维度的影响
  const strengthFactor = strengthScore / 100
  let strengthModifier = 0
  if (strengthFactor > 0.7) {
    // 身旺：学习能力强，但可能固执
    strengthModifier = 3
  } else if (strengthFactor < 0.3) {
    // 身弱：需要更多外部助力
    strengthModifier = -3
  }

  // 加权计算各维度阶段分
  // 晚年(61+)事业基础分降低，健康基础分提高
  const isLateStage = ageRange === '61+'
  const careerBase = isLateStage ? 25 : 40
  const healthBase = isLateStage ? 45 : 35
  const wealthBase = isLateStage ? 25 : 35

  const career   = clamp(dimScores.career * 0.6 + careerBase + strengthModifier, 0, 100)
  const wealth   = clamp(adjustedWealth * 0.6 + wealthBase + strengthModifier, 0, 100)
  const marriage = clamp(adjustedMarriage * 0.6 + 40, 0, 100)
  const health   = clamp(dimScores.health * 0.6 + healthBase, 0, 100)
  const family   = clamp(dimScores.family * 0.6 + 35 + strengthModifier, 0, 100)
  const study    = clamp(dimScores.study * 0.6 + 35 + (strengthFactor > 0.5 ? 5 : -2), 0, 100)

  // 按阶段权重计算综合分
  const totalWeight = weights.career + weights.wealth + weights.marriage + weights.health + weights.family + weights.study
  const overall = totalWeight > 0
    ? clamp(
        (career * weights.career + wealth * weights.wealth + marriage * weights.marriage +
         health * weights.health + family * weights.family + study * weights.study) / totalWeight,
        0, 100,
      )
    : 50

  return {
    career: Math.round(career),
    wealth: Math.round(wealth),
    marriage: Math.round(marriage),
    health: Math.round(health),
    family: Math.round(family),
    study: Math.round(study),
    overall: Math.round(overall),
  }
}

// ─── 无大运时基于用神推算阶段修正 ───

function calculateNoDaYunModifier(
  ageRange: TimelineAgeRange,
  dayElement: FiveElement,
  useGodElement: string,
  strengthScore: number,
): number {
  const focusShiShen = STAGE_FOCUS_SHISHEN[ageRange]

  // 十神到五行的粗略映射
  const shiShenToElement: Record<string, FiveElement> = {
    '印星': dayElement === '木' ? '水' : dayElement === '火' ? '木' : dayElement === '土' ? '火' : dayElement === '金' ? '土' : '金',
    '食伤': dayElement === '木' ? '火' : dayElement === '火' ? '土' : dayElement === '土' ? '金' : dayElement === '金' ? '水' : '木',
    '财官': dayElement === '木' ? '土' : dayElement === '火' ? '金' : dayElement === '土' ? '水' : dayElement === '金' ? '木' : '火',
    '比印': dayElement,
  }

  const focusElement = shiShenToElement[focusShiShen] || dayElement

  // 判断侧重五行与用神的关系
  const relation = getElementRelation(focusElement, useGodElement as FiveElement)

  let modifier = 0
  if (relation === '生' || relation === '比和') {
    modifier = 8 // 侧重十神为用神所喜
  } else if (relation === '受生') {
    modifier = 4 // 用神生侧重十神
  } else if (relation === '克') {
    modifier = -6 // 侧重十神与用神相克
  } else if (relation === '受克') {
    modifier = -3
  }

  // 身旺时，食伤泄秀加分
  if (strengthScore > 60 && focusShiShen === '食伤') {
    modifier += 4
  }

  // 身弱时，印星生扶加分
  if (strengthScore < 40 && focusShiShen === '印星') {
    modifier += 4
  }

  return clamp(modifier, -15, 15)
}

// ─── 生成大运信息并映射到阶段 ───

function mapDaYunToStages(
  daYunList: string[],
  startAge: number,
  dayElement: FiveElement,
  useGodElement: string,
  jiShenElement: string,
): Map<TimelineAgeRange, DaYunInfo> {
  const daYunMap = new Map<TimelineAgeRange, DaYunInfo>()

  daYunList.forEach((dyStr, index) => {
    const ageStart = startAge + index * 10
    const ageEnd = ageStart + 10

    // 将大运映射到覆盖的阶段
    const coveredStages = STAGES.filter(stage => {
      const [s, e] = stage === '61+' ? [61, 120] : stage.split('-').map(Number)
      return ageStart < e && ageEnd > s
    })

    if (coveredStages.length === 0) return

    const parsed = parseDaYunGanZhi(dyStr)
    if (!parsed) return

    const { gan, zhi } = parsed
    const ganElem = getStemElement(gan)
    const zhiElem = getBranchElement(zhi)

    const { effect, score, description } = evaluateDaYunEffect(
      gan, zhi, dayElement, useGodElement, jiShenElement,
    )

    const daYunInfo: DaYunInfo = {
      name: dyStr,
      ageStart,
      ageEnd,
      element: `${ganElem}/${zhiElem}`,
      effect,
      score,
      description,
    }

    // 每个被覆盖的阶段都记录这个大运（优先取覆盖最多的阶段）
    coveredStages.forEach(stage => {
      if (!daYunMap.has(stage)) {
        daYunMap.set(stage, daYunInfo)
      }
    })
  })

  return daYunMap
}

// ─── 应用大运修正到阶段分 ───

function applyDaYunModifier(baseScore: StageScore, daYunInfo: DaYunInfo, ageRange: TimelineAgeRange): StageScore {
  const mod = daYunInfo.score // -20 到 +20
  const weights = STAGE_WEIGHTS[ageRange]

  // 大运修正影响事业和财富最显著，健康和家庭次之
  // 权重为0的维度不修正（如少年婚姻应为0）
  return {
    career:   clamp(baseScore.career + mod * 0.35, 0, 100),
    wealth:   clamp(baseScore.wealth + mod * 0.30, 0, 100),
    marriage: weights.marriage === 0 ? 0 : clamp(baseScore.marriage + mod * 0.20, 0, 100),
    health:   clamp(baseScore.health + mod * 0.15, 0, 100),
    family:   clamp(baseScore.family + mod * 0.20, 0, 100),
    study:    clamp(baseScore.study + mod * 0.10, 0, 100),
    overall:   clamp(baseScore.overall + mod * 0.25, 0, 100),
  }
}

// ─── 判断趋势 ───

function judgeTrend(scores: number[]): '上升' | '平稳' | '下降' | '峰值' | '谷底' {
  if (scores.length < 3) return '平稳'

  const current = scores[scores.length - 1]
  const prev = scores[scores.length - 2]
  const prevPrev = scores[scores.length - 3] || prev

  const diff = current - prev
  const diffPrev = prev - prevPrev

  if (current >= Math.max(...scores) - 3 && current >= prev) return '峰值'
  if (current <= Math.min(...scores) + 3 && current <= prev) return '谷底'
  if (diff > 5) return '上升'
  if (diff < -5) return '下降'
  return '平稳'
}

// ─── 判断整体趋势 ───

function judgeOverallTrend(stages: TimelineStage[]): '上升型' | '平稳型' | '下降型' | '先抑后扬' | '先扬后抑' | '波浪型' {
  const overalls = stages.map(s => s.score.overall)
  if (overalls.length < 7) return '平稳型'

  const firstHalf = overalls.slice(0, 3)
  const secondHalf = overalls.slice(4)
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

  // 计算波动幅度
  const max = Math.max(...overalls)
  const min = Math.min(...overalls)
  const amplitude = max - min

  // 波动型判断：波峰波谷交替出现
  let alternating = 0
  for (let i = 1; i < overalls.length - 1; i++) {
    if ((overalls[i] > overalls[i - 1] && overalls[i] > overalls[i + 1]) ||
        (overalls[i] < overalls[i - 1] && overalls[i] < overalls[i + 1])) {
      alternating++
    }
  }
  if (alternating >= 4 || amplitude > 30) return '波浪型'

  // 上升型
  if (avgSecond - avgFirst > 8) return '上升型'

  // 下降型
  if (avgFirst - avgSecond > 8) return '下降型'

  // 先抑后扬：前半段低后半段高
  if (avgSecond > avgFirst + 5 && overalls[0] < overalls[overalls.length - 1]) return '先抑后扬'

  // 先扬后抑：前半段高后半段低
  if (avgFirst > avgSecond + 5 && overalls[0] > overalls[overalls.length - 1]) return '先扬后抑'

  return '平稳型'
}

// ─── 生成阶段描述 ───

function generateStageDescription(
  ageRange: TimelineAgeRange,
  score: StageScore,
  trend: string,
  daYunInfo?: DaYunInfo,
): string {
  const label = STAGE_LABELS[ageRange]
  const overallDesc = score.overall >= 70 ? '运势较好' : score.overall >= 50 ? '运势平稳' : '运势偏弱'
  const trendDesc = trend === '上升' ? '呈上升趋势' : trend === '下降' ? '呈下降趋势' : trend === '峰值' ? '达到峰值' : trend === '谷底' ? '处于谷底' : '保持平稳'

  let desc = `${label}（${ageRange}岁），${overallDesc}，${trendDesc}。`

  if (daYunInfo) {
    desc += `大运"${daYunInfo.name}"${daYunInfo.effect}，${daYunInfo.effect === '吉' ? '助运有力' : daYunInfo.effect === '凶' ? '需谨慎应对' : '影响平稳'}。`
  }

  // 按阶段特征补充
  if (ageRange === '0-10' || ageRange === '11-20') {
    desc += `学业评分${score.study}，${score.study >= 60 ? '学习成绩良好' : '需加强引导'}。`
  } else if (ageRange === '21-30') {
    desc += `事业评分${score.career}，婚姻评分${score.marriage}，${score.career >= 60 ? '事业起步顺利' : '事业需踏实积累'}。`
  } else if (ageRange === '31-40') {
    desc += `事业评分${score.career}，财富评分${score.wealth}，${score.career >= 60 ? '正值事业上升期' : '需把握机遇'}。`
  } else if (ageRange === '41-50') {
    desc += `健康评分${score.health}，${score.health >= 60 ? '身体状况尚可' : '需格外关注健康'}。`
  } else if (ageRange === '51-60') {
    desc += `家庭评分${score.family}，健康评分${score.health}，${score.health >= 60 ? '身体状况良好' : '需定期体检'}。`
  } else {
    desc += `健康评分${score.health}，${score.health >= 60 ? '可安享晚年' : '需注重养生'}。`
  }

  return desc
}

// ─── 核心函数：生成人生时间轴 ───

export function generateTimeline(context: TimelineContext): TimelineResult {
  const {
    dayGan,
    dayElement,
    birthYear,
    gender,
    strengthResult,
    patternResult,
    useGodResult,
    probabilityResult,
    daYun,
    startDaYunAge,
    luckModifierFn,
    dynamicUseGodFn,
  } = context

  const dayElementFE = dayElement as FiveElement

  // 提取用神和忌神五行
  const useGodElement = useGodResult?.useGod || useGodResult?.xiShen || dayElement
  const jiShenElement = useGodResult?.jiShen || ''
  const xiShenElement = useGodResult?.xiShen || ''

  // 提取日主旺衰分
  const strengthScore = strengthResult?.strengthScore ?? 50

  // 提取概率引擎的各维度基础分
  const dimScores = extractDimensionScores(probabilityResult)

  // 映射大运到各阶段
  const daYunMap = (daYun && daYun.length > 0 && startDaYunAge !== undefined)
    ? mapDaYunToStages(daYun, startDaYunAge, dayElementFE, useGodElement, jiShenElement)
    : new Map<TimelineAgeRange, DaYunInfo>()

  // ── 生成7个阶段 ──
  const stages: TimelineStage[] = STAGES.map((ageRange, index) => {
    // 1. 计算阶段基础分
    let stageScore = calculateStageBaseScore(ageRange, dimScores, strengthScore)

    // 2. 动态喜用神修正（如果提供了函数）
    if (dynamicUseGodFn) {
      const midAge = ageRange === '61+' ? 70 : parseInt(ageRange.split('-')[0]) + 5
      try {
        const dynResult = dynamicUseGodFn(dayElement, strengthScore, useGodElement, xiShenElement, jiShenElement, midAge)
        if (dynResult) {
          // 动态喜用神微调（权重约5%）
          const dynModifier = dynResult.currentUseGod === useGodElement ? 5 : -3
          stageScore = {
            career:   clamp(stageScore.career + dynModifier * 0.3, 0, 100),
            wealth:   clamp(stageScore.wealth + dynModifier * 0.3, 0, 100),
            marriage: clamp(stageScore.marriage + dynModifier * 0.2, 0, 100),
            health:   clamp(stageScore.health + dynModifier * 0.1, 0, 100),
            family:   clamp(stageScore.family + dynModifier * 0.2, 0, 100),
            study:    clamp(stageScore.study + dynModifier * 0.2, 0, 100),
            overall:   clamp(stageScore.overall + dynModifier * 0.25, 0, 100),
          }
        }
      } catch {
        // 动态喜用神计算失败时忽略
      }
    }

    // 3. 大运修正
    const dyInfo = daYunMap.get(ageRange)
    if (dyInfo) {
      // 如果有 luckModifierFn，使用它获取更精确的修正
      if (luckModifierFn) {
        try {
          const luckResult = luckModifierFn(
            stageScore.overall, dayElement, dayGan, useGodElement,
            jiShenElement, jiShenElement, dyInfo.name[0], dyInfo.name[1],
          )
          if (luckResult) {
            const luckChange = luckResult.luckChange ?? luckResult.modifiedScore - luckResult.originalScore ?? 0
            const luckMod = clamp(luckChange * 0.3, -10, 10)
            stageScore = {
              career:   clamp(stageScore.career + luckMod, 0, 100),
              wealth:   clamp(stageScore.wealth + luckMod, 0, 100),
              marriage: clamp(stageScore.marriage + luckMod * 0.8, 0, 100),
              health:   clamp(stageScore.health + luckMod * 0.6, 0, 100),
              family:   clamp(stageScore.family + luckMod * 0.7, 0, 100),
              study:    clamp(stageScore.study + luckMod * 0.5, 0, 100),
              overall:   clamp(stageScore.overall + luckMod, 0, 100),
            }
          }
        } catch {
          // 修正函数失败时使用默认大运修正
          stageScore = applyDaYunModifier(stageScore, dyInfo, ageRange)
        }
      } else {
        // 无修正函数时使用默认大运修正
        stageScore = applyDaYunModifier(stageScore, dyInfo, ageRange)
      }
    } else if (!daYun || daYun.length === 0) {
      // 4. 无大运时的用神推算修正
      const noDaYunMod = calculateNoDaYunModifier(ageRange, dayElementFE, useGodElement, strengthScore)
      const stageWeights = STAGE_WEIGHTS[ageRange]
      stageScore = {
        career:   clamp(stageScore.career + noDaYunMod * 0.35, 0, 100),
        wealth:   clamp(stageScore.wealth + noDaYunMod * 0.30, 0, 100),
        marriage: stageWeights.marriage === 0 ? 0 : clamp(stageScore.marriage + noDaYunMod * 0.20, 0, 100),
        health:   clamp(stageScore.health + noDaYunMod * 0.15, 0, 100),
        family:   clamp(stageScore.family + noDaYunMod * 0.20, 0, 100),
        study:    clamp(stageScore.study + noDaYunMod * 0.10, 0, 100),
        overall:   clamp(stageScore.overall + noDaYunMod * 0.25, 0, 100),
      }
    }

    // 重新取整
    stageScore = {
      career:   Math.round(stageScore.career),
      wealth:   Math.round(stageScore.wealth),
      marriage: Math.round(stageScore.marriage),
      health:   Math.round(stageScore.health),
      family:   Math.round(stageScore.family),
      study:    Math.round(stageScore.study),
      overall:   Math.round(stageScore.overall),
    }

    // 5. 判断趋势（需要前几个阶段的 overall）
    const prevOveralls = [] as number[]
    for (let j = 0; j < index; j++) {
      // 此处会在下方第二次遍历时修正，先估算
      prevOveralls.push(50 + (j - 3) * 2)
    }
    // 注意：趋势判断将在所有阶段计算完成后统一更新

    // 6. 置信度计算
    let confidence = 60 // 基础置信度
    if (dyInfo) confidence += 15 // 有大运增加置信度
    if (probabilityResult?.overallConfidence) {
      confidence = Math.round(confidence * 0.5 + probabilityResult.overallConfidence * 0.5)
    }
    if (patternResult?.totalScore) {
      confidence += Math.round((patternResult.totalScore - 50) * 0.1)
    }
    confidence = clamp(confidence, 20, 95)

    // 7. 选择关键事件和建议
    const keyEvents = [...STAGE_KEY_EVENTS[ageRange]]

    // 根据分数调整关键事件
    if (ageRange === '21-30' && stageScore.marriage >= 60) {
      keyEvents.push('婚姻缘分较好，宜把握良缘')
    }
    if (ageRange === '31-40' && stageScore.career >= 65) {
      keyEvents.push('事业有突破性发展机会')
    }
    if (stageScore.health <= 40) {
      keyEvents.push('健康方面需格外注意')
    }

    // 选择建议
    const adviceTemplates = STAGE_ADVICE_TEMPLATES[ageRange]
    const adviceIdx = Math.min(
      Math.floor((100 - stageScore.overall) / 30),
      adviceTemplates.length - 1,
    )
    let advice = adviceTemplates[adviceIdx]

    // 大运相关建议
    if (dyInfo) {
      if (dyInfo.effect === '吉') {
        advice += '当前大运有利，宜积极进取。'
      } else if (dyInfo.effect === '凶') {
        advice += '当前大运偏弱，宜守不宜攻，蓄势待发。'
      }
    }

    const stage: TimelineStage = {
      ageRange,
      score: stageScore,
      trend: '平稳', // 先设默认值，后续统一更新
      description: '',
      keyEvents,
      advice,
      daYun: dyInfo || undefined,
      confidence,
    }

    return stage
  })

  // ── 统一更新趋势 ──
  const overallScores = stages.map(s => s.score.overall)
  stages.forEach((stage, index) => {
    // 用前面阶段的 overall 做局部趋势判断
    const localScores = overallScores.slice(Math.max(0, index - 2), index + 1)
    stage.trend = judgeTrend(localScores)
    stage.description = generateStageDescription(stage.ageRange, stage.score, stage.trend, stage.daYun)
  })

  // ── 确定最佳/最差阶段 ──
  let bestIdx = 0
  let worstIdx = 0
  stages.forEach((stage, idx) => {
    if (stage.score.overall > stages[bestIdx].score.overall) bestIdx = idx
    if (stage.score.overall < stages[worstIdx].score.overall) worstIdx = idx
  })

  // ── 巅峰/谨慎年龄 ──
  const peakAge = STAGE_LABELS[stages[bestIdx].ageRange] + `（${stages[bestIdx].ageRange}岁）`
  const cautionAge = STAGE_LABELS[stages[worstIdx].ageRange] + `（${stages[worstIdx].ageRange}岁）`

  // ── 整体趋势 ──
  const overallTrend = judgeOverallTrend(stages)

  // ── 总评 ──
  const bestScore = stages[bestIdx].score.overall
  const worstScore = stages[worstIdx].score.overall
  const avgScore = Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length)

  const currentAge = new Date().getFullYear() - birthYear
  let currentStageStr = ''
  for (const s of stages) {
    const [sMin] = s.ageRange === '61+' ? [61] : s.ageRange.split('-').map(Number)
    const sMax = s.ageRange === '61+' ? 120 : parseInt(s.ageRange.split('-')[1])
    if (currentAge >= sMin && currentAge <= sMax) {
      currentStageStr = `当前处于${STAGE_LABELS[s.ageRange]}，运势评分${s.score.overall}。`
      break
    }
  }

  const hasDaYun = daYun && daYun.length > 0
  let summary = `命主${dayGan}${dayElement}日主，${gender === '男' ? '乾造' : '坤造'}。`
  summary += `综合人生评分${avgScore}分，最佳阶段在${STAGE_LABELS[stages[bestIdx].ageRange]}（${bestScore}分），`
  summary += `最需注意${STAGE_LABELS[stages[worstIdx].ageRange]}（${worstScore}分）。`
  summary += `整体走势呈"${overallTrend}"。`
  if (currentStageStr) summary += currentStageStr
  if (hasDaYun && startDaYunAge !== undefined) {
    summary += `${startDaYunAge}岁起运，${daYun!.length}步大运。`
  }
  summary += `格局评分${patternResult?.totalScore ?? '未定'}，旺衰分${strengthScore}。`

  // ── 古籍引用 ──
  let classicalRef = ''
  if (overallTrend === '上升型' || overallTrend === '先抑后扬') {
    classicalRef = '《滴天髓》云："命不可先定，运有穷通。"晚年得运者，福报绵长。'
  } else if (overallTrend === '下降型' || overallTrend === '先扬后抑') {
    classicalRef = '《三命通会》云："少年运好，老年不发，需早修福报。"先富后贫者，宜守成知足。'
  } else if (overallTrend === '波浪型') {
    classicalRef = '《渊海子平》云："人生运势，如波浪起伏。顺境时不骄，逆境时不馁。"'
  } else {
    classicalRef = '《滴天髓》云："命不可先定，运有穷通。"《三命通会》云："大运者，人生之枢纽也。十年一变，主宰阶段性运势。"'
  }

  // ── 趋势图数据 ──
  const chart = {
    ages: STAGES.map(s => `${s}岁`),
    career:    stages.map(s => s.score.career),
    wealth:    stages.map(s => s.score.wealth),
    marriage:  stages.map(s => s.score.marriage),
    health:    stages.map(s => s.score.health),
    overall:    stages.map(s => s.score.overall),
  }

  return {
    stages,
    bestStage: stages[bestIdx].ageRange,
    worstStage: stages[worstIdx].ageRange,
    peakAge,
    cautionAge,
    overallTrend,
    summary,
    classicalRef,
    chart,
  }
}
