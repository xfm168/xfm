/**
 * 综合评分引擎 — 玄风门 V4.1 八字模块
 *
 * 10 维度雷达评分系统，基于命盘结构、十神组合、神煞、
 * 五行平衡等多维度数据综合计算。
 */

import type {
  BaZiChart,
  FiveElement,
  HeavenlyStem,
  EarthlyBranch,
  ShenShi,
  FiveElementCount,
} from './types'
import type { CareerAnalysisResult } from './careerAnalysis'
import type { MarriageAnalysisResult } from './marriageAnalysis'
import type { WealthAnalysisResult } from './wealthAnalysis'
import type { HealthAnalysisResult } from './healthAnalysis'
import {
  getStemElement,
  getBranchElement,
  isGenerating,
  isOvercoming,
  isSameElement,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
} from '@/lib/core'
import { checkTaohua } from './shensha/taohua'
import { checkHongluan } from './shensha/hongluan'
import { checkWenchang } from './shensha/wenchang'

// ========== 类型定义 ==========

export type ScoreLevel = '极佳' | '优秀' | '良好' | '一般' | '较差'

export interface ScoreDimension {
  /** 维度名称 */
  name: string
  /** 0-100 分 */
  score: number
  /** 1-5 星 */
  stars: number
  /** 等级 */
  level: ScoreLevel
  /** 50-100 字说明 */
  description: string
}

export interface ComprehensiveScoreResult {
  dimensions: ScoreDimension[]
  /** 0-100 综合评分 */
  overallScore: number
  /** 综合等级 */
  overallLevel: ScoreLevel
  /** 10 维度分数，用于雷达图 */
  radarData: number[]
}

// ========== 常量表 ==========

/** 天乙贵人查法 */
const TIANYI_MAP: Record<number, number[]> = {
  0: [1, 7], 4: [1, 7], 6: [1, 7],
  1: [0, 8], 5: [0, 8],
  2: [11, 9], 3: [11, 9],
  8: [3, 5], 9: [3, 5],
  7: [6, 2],
}

/** 天德贵人查法（以月支地支序号为 key，值可能为天干或地支） */
const TIANDE_MAP: Record<number, string | null> = {
  0: null, 1: '丁', 2: '申', 3: '壬', 4: '辛', 5: '亥',
  6: '甲', 7: '癸', 8: '寅', 9: '丙', 10: '乙', 11: '巳',
}

/** 月德贵人查法（以月支地支序号为 key） */
const YUEDE_MAP: Record<number, HeavenlyStem | null> = {
  0: null, 1: '丙', 2: '甲', 3: '壬', 4: '庚', 5: '戊',
  6: null, 7: '丙', 8: '甲', 9: '壬', 10: '庚', 11: '戊',
}

/** 月支序号（寅=0 对应正月） */
const MONTH_BRANCH_ORDER: EarthlyBranch[] = [
  '寅', '卯', '辰', '巳', '午', '未',
  '申', '酉', '戌', '亥', '子', '丑',
]

/** 五行相生链 */
const WUXING_SHENG: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

/** 五行相克链 */
const WUXING_KE: Record<FiveElement, FiveElement> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
}

/** 地支六冲 */
const LIU_CHONG: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

/** 十神中与食伤相关的 */
const SHI_SHANG: ShenShi[] = ['食神', '伤官']
/** 十神中与财星相关的 */
const CAI_XING: ShenShi[] = ['正财', '偏财']
/** 十神中与官杀相关的 */
const GUAN_SHA: ShenShi[] = ['正官', '偏官']
/** 十神中与印星相关的 */
const YIN_XING: ShenShi[] = ['正印', '偏印']
/** 十神中与比劫相关的 */
const BI_JIE: ShenShi[] = ['比肩', '劫财']

/** 维度权重：命局 20%，其余各 8.9%（≈ 8.889%） */
const DIMENSION_WEIGHTS: Record<string, number> = {
  '命局': 0.20,
  '事业': 0.089,
  '财富': 0.089,
  '婚姻': 0.089,
  '健康': 0.089,
  '学业': 0.089,
  '贵人': 0.089,
  '子女': 0.089,
  '父母': 0.089,
  '晚年': 0.089,
}

// ========== 工具函数 ==========

/** 分数转等级 */
function scoreToLevel(score: number): ScoreLevel {
  if (score >= 90) return '极佳'
  if (score >= 75) return '优秀'
  if (score >= 60) return '良好'
  if (score >= 40) return '一般'
  return '较差'
}

/** 分数转星级 */
function scoreToStars(score: number): number {
  if (score >= 90) return 5
  if (score >= 75) return 4
  if (score >= 60) return 3
  if (score >= 40) return 2
  return 1
}

/** 五行平衡度 (0-100)，越均衡越高 */
function calcWuxingBalance(counts: FiveElementCount): number {
  const vals = Object.values(counts) as number[]
  const total = vals.reduce((s, v) => s + v, 0)
  if (total === 0) return 50
  const avg = total / 5
  const variance = vals.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / 5
  // 方差越小越平衡，用指数映射到 0-100
  const maxVariance = Math.pow(total, 2) / 5
  const normalized = 1 - variance / (maxVariance || 1)
  return Math.round(Math.pow(normalized, 0.6) * 100)
}

/** 获取四柱中所有天干 */
function getAllStems(chart: BaZiChart): HeavenlyStem[] {
  const sl = chart.sixLines
  return [sl.year.gan, sl.month.gan, sl.day.gan, sl.hour.gan]
}

/** 获取四柱中所有地支 */
function getAllBranches(chart: BaZiChart): EarthlyBranch[] {
  const sl = chart.sixLines
  return [sl.year.zhi, sl.month.zhi, sl.day.zhi, sl.hour.zhi]
}

/** 检查地支是否构成六冲 */
function hasChong(a: EarthlyBranch, b: EarthlyBranch): boolean {
  return LIU_CHONG.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
}

/** 统计某十神在四柱中出现的次数 */
function countShenShiInChart(chart: BaZiChart, targets: ShenShi[]): number {
  const dm = chart.dayMaster
  let count = 0
  const allGan = getAllStems(chart)
  for (const gan of allGan) {
    const ss = dm.relatedShens[gan]
    if (ss && targets.includes(ss)) count++
  }
  // 也检查地支藏干
  const allZhi = getAllBranches(chart)
  for (const zhi of allZhi) {
    const cg = chart.cangGan[zhi]
    if (cg) {
      for (const hidden of [cg.ben, cg.zhong, cg.yao]) {
        if (hidden) {
          const ss = dm.relatedShens[hidden]
          if (ss && targets.includes(ss)) count++
        }
      }
    }
  }
  return count
}

/** 检查某五行在四柱天干中是否有出现 */
function hasElementInStems(chart: BaZiChart, element: FiveElement): boolean {
  return getAllStems(chart).some(g => getStemElement(g) === element)
}

/** 检查某五行在四柱地支中是否有出现 */
function hasElementInBranches(chart: BaZiChart, element: FiveElement): boolean {
  return getAllBranches(chart).some(z => getBranchElement(z) === element)
}

/** 检查喜用神五行是否在命盘中有力量 */
function xiYongHasPower(chart: BaZiChart): { xi: boolean; yong: boolean } {
  const xys = chart.xiYongShen
  const allElems: FiveElement[] = []
  const allGan = getAllStems(chart)
  const allZhi = getAllBranches(chart)
  for (const g of allGan) allElems.push(getStemElement(g))
  for (const z of allZhi) allElems.push(getBranchElement(z))

  const xiElem = xys.happiness ? parseElement(xys.happiness) : null
  const yongElem = xys.usage ? parseElement(xys.usage) : null

  return {
    xi: xiElem ? allElems.includes(xiElem) : false,
    yong: yongElem ? allElems.includes(yongElem) : false,
  }
}

/** 尝试从喜/用神字符串解析出五行 */
function parseElement(str: string): FiveElement | null {
  const elems: FiveElement[] = ['木', '火', '土', '金', '水']
  for (const e of elems) {
    if (str.includes(e)) return e
  }
  return null
}

/** 约束分数到 0-100 */
function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)))
}

// ========== 10 个维度评分函数 ==========

/**
 * 1. 命局评分
 * 基于 overallScore + 格局成格度 + 五行平衡度
 */
function scoreMingJu(chart: BaZiChart): number {
  // 基础分：命盘 overallScore（已含格局判断）
  let base = chart.overallScore * 0.5

  // 五行平衡度
  const balance = calcWuxingBalance(chart.fiveElementCount)
  base += balance * 0.25

  // 日主强弱适中加分
  const strength = chart.dayMaster.strengthScore
  // strength 通常在 0-100，50 附近为中和
  const strengthBalance = 100 - Math.abs(strength - 50) * 2
  base += strengthBalance * 0.15

  // 喜用神有力加分
  const xyp = xiYongHasPower(chart)
  const xiYongBonus = (xyp.yong ? 10 : 0) + (xyp.xi ? 5 : 0)
  base += xiYongBonus * 0.1

  return clamp(base)
}

/**
 * 2. 事业评分
 * 有 careerResult 从中提取；否则根据十神组合推算
 */
function scoreCareer(chart: BaZiChart, careerResult?: CareerAnalysisResult): { score: number; desc: string } {
  if (careerResult) {
    return { score: clamp(careerResult.score), desc: careerResult.summary.slice(0, 100) }
  }

  // 无 careerResult，基于十神推算
  let score = 50
  const dm = chart.dayMaster
  const dayElement = dm.dayGanElement

  // 正官/七杀有力 → 事业心强
  const guanCount = countShenShiInChart(chart, GUAN_SHA)
  score += guanCount * 8

  // 食伤有力 → 创造力
  const shiShangCount = countShenShiInChart(chart, SHI_SHANG)
  score += shiShangCount * 5

  // 正印有力 → 学识支撑
  const yinCount = countShenShiInChart(chart, YIN_XING)
  score += yinCount * 5

  // 日主太弱无帮扶 → 事业辛苦
  if (dm.strengthScore < 30) {
    score -= 10
  }

  // 比劫过旺 → 竞争激烈
  const biJieCount = countShenShiInChart(chart, BI_JIE)
  if (biJieCount >= 4) score -= 8

  const descriptions = [
    '命局官杀有力，事业心强，适合管理或创业道路。',
    '食伤吐秀，才华出众，创意型事业发展潜力大。',
    '印星为用，学识渊博，宜走专业或文化路线。',
    '日主偏弱，事业需贵人相助，宜合作不宜独闯。',
    '比劫旺盛，竞争意识强，但需防合伙纷争。',
  ]
  const desc = guanCount > 0 ? descriptions[0]
    : shiShangCount > 0 ? descriptions[1]
    : yinCount > 0 ? descriptions[2]
    : dm.strengthScore < 30 ? descriptions[3]
    : biJieCount >= 4 ? descriptions[4]
    : '事业运势中平，需结合大运流年综合判断发展方向。'

  return { score: clamp(score), desc }
}

/**
 * 3. 财富评分
 * 有 wealthResult 从中提取；否则根据正财偏财推算
 */
function scoreWealth(chart: BaZiChart, wealthResult?: WealthAnalysisResult): { score: number; desc: string } {
  if (wealthResult) {
    return { score: clamp(wealthResult.score), desc: wealthResult.summary.slice(0, 100) }
  }

  let score = 50
  const dm = chart.dayMaster

  // 正财/偏财数量
  const caiCount = countShenShiInChart(chart, CAI_XING)
  score += caiCount * 10

  // 财星为喜用神则加分
  const xys = chart.xiYongShen
  const dayElement = dm.dayGanElement
  const caiElement = WUXING_KE[dayElement] // 我克者为财
  if (caiElement === xys.bestElement) {
    score += 15
  } else if (xys.avoidedElements?.includes(caiElement)) {
    score -= 12
  }

  // 食伤生财
  const shiShangCount = countShenShiInChart(chart, SHI_SHANG)
  if (caiCount > 0 && shiShangCount > 0) {
    score += 8
  }

  // 比劫过旺劫财
  const biJieCount = countShenShiInChart(chart, BI_JIE)
  if (biJieCount >= 3) {
    score -= 10
  }

  // 日主弱财多 → 财多身弱
  if (dm.strengthScore < 35 && caiCount >= 2) {
    score -= 8
  }

  const descriptions = [
    '财星得力且为喜用，财运亨通，善理财投资。',
    '食伤生财格局，靠才华技能致富，收入稳定。',
    '比劫较旺，财来财去，需注重储蓄和理财规划。',
    '财多身弱，虽见财而不易守，宜稳健不宜冒进。',
    '财星不显，正财运平平，需靠大运流年催动。',
  ]
  const desc = caiCount >= 2 && caiElement === xys.bestElement ? descriptions[0]
    : caiCount > 0 && shiShangCount > 0 ? descriptions[1]
    : biJieCount >= 3 ? descriptions[2]
    : dm.strengthScore < 35 && caiCount >= 2 ? descriptions[3]
    : descriptions[4]

  return { score: clamp(score), desc }
}

/**
 * 4. 婚姻评分
 * 有 marriageResult 从中提取；否则根据日支+桃花+红鸾推算
 */
function scoreMarriage(chart: BaZiChart, marriageResult?: MarriageAnalysisResult): { score: number; desc: string } {
  if (marriageResult) {
    return { score: clamp(marriageResult.score), desc: marriageResult.summary.slice(0, 100) }
  }

  let score = 55
  const dayZhi = chart.sixLines.day.zhi
  const monthZhi = chart.sixLines.month.zhi

  // 日支（配偶宫）质量
  const dayZhiElement = getBranchElement(dayZhi)
  const dayGanElement = chart.dayMaster.dayGanElement
  // 配偶宫五行与日主相生/相合为佳
  if (isGenerating(dayZhiElement, dayGanElement) || isSameElement(dayZhiElement, dayGanElement)) {
    score += 12
  } else if (isOvercoming(dayZhiElement, dayGanElement)) {
    score -= 8
  }

  // 配偶宫不被冲
  const allZhi = getAllBranches(chart)
  const hasChongOnDayZhi = allZhi.some(z => z !== dayZhi && hasChong(z, dayZhi))
  if (hasChongOnDayZhi) {
    score -= 15
  } else {
    score += 5
  }

  // 桃花检查
  const taoHua = checkTaohua(chart.sixLines, chart.dayMaster.dayGan, chart.birthInfo.gender)
  if (taoHua.length > 0) {
    const inDayOrMonth = taoHua.some(t => t.inPosition && (t.position.includes('日') || t.position.includes('月')))
    score += inDayOrMonth ? 8 : 3
  }

  // 红鸾检查
  const hongLuan = checkHongluan(chart.sixLines, chart.dayMaster.dayGan, chart.birthInfo.gender)
  if (hongLuan.length > 0) {
    score += 5
  }

  // 正官/正财在日柱 → 男女婚姻均佳
  const dayGanSS = chart.dayMaster.relatedShens[chart.sixLines.day.gan]
  const dayZhiCG = chart.cangGan[dayZhi]
  const dayZhiBenSS = dayZhiCG ? chart.dayMaster.relatedShens[dayZhiCG.ben] : null
  if (dayGanSS === '正官' || dayGanSS === '正财' || dayZhiBenSS === '正官' || dayZhiBenSS === '正财') {
    score += 8
  }

  const descriptions = [
    '配偶宫稳固且有桃花红鸾加持，婚姻美满。',
    '配偶宫无冲无害，婚姻关系平稳，家庭和谐。',
    '配偶宫受冲，婚姻需经营，注意沟通与包容。',
    '日支与日主五行相克，夫妻性格有差异，需磨合。',
    '婚姻宫位欠佳，宜晚婚，择偶需谨慎选择。',
  ]
  const desc = !hasChongOnDayZhi && taoHua.length > 0 ? descriptions[0]
    : !hasChongOnDayZhi ? descriptions[1]
    : hasChongOnDayZhi && score < 50 ? descriptions[2]
    : isOvercoming(dayZhiElement, dayGanElement) ? descriptions[3]
    : descriptions[4]

  return { score: clamp(score), desc }
}

/**
 * 5. 健康评分
 * 有 healthResult 从中提取；否则根据五行缺失推算
 */
function scoreHealth(chart: BaZiChart, healthResult?: HealthAnalysisResult): { score: number; desc: string } {
  if (healthResult) {
    return { score: clamp(healthResult.score), desc: healthResult.summary.slice(0, 100) }
  }

  let score = 60
  const counts = chart.fiveElementCount
  const allElems: FiveElement[] = ['木', '火', '土', '金', '水']

  // 五行缺数
  const missingCount = allElems.filter(e => counts[e] === 0).length
  score -= missingCount * 10

  // 五行极弱（<=1）也视为健康隐患
  const weakCount = allElems.filter(e => counts[e] > 0 && counts[e] <= 1).length
  score -= weakCount * 3

  // 日主强弱适中 → 身体底子好
  const strength = chart.dayMaster.strengthScore
  if (strength >= 40 && strength <= 70) {
    score += 10
  } else if (strength < 25 || strength > 85) {
    score -= 8
  }

  // 忌神过旺 → 健康风险
  const xys = chart.xiYongShen
  if (xys.enemyElements) {
    for (const enemy of xys.enemyElements) {
      if (counts[enemy] >= 3) {
        score -= 8
      }
    }
  }

  const descriptions = [
    '五行均衡流通，身体底子好，少病少灾。',
    '五行偶有缺失但不严重，注意相应脏腑保养。',
    '五行偏缺较明显，需重点关注缺失五行对应脏腑。',
    '忌神过旺，对应脏腑易出问题，需定期体检。',
    '五行严重失衡，健康需格外重视，养生为要。',
  ]
  const desc = missingCount === 0 && score >= 70 ? descriptions[0]
    : missingCount <= 1 ? descriptions[1]
    : missingCount <= 2 ? descriptions[2]
    : xys.enemyElements?.some(e => counts[e] >= 3) ? descriptions[3]
    : descriptions[4]

  return { score: clamp(score), desc }
}

/**
 * 6. 学业评分
 * 根据文昌+印星+官杀+日主强弱推算
 */
function scoreStudy(chart: BaZiChart): { score: number; desc: string } {
  let score = 45
  const dm = chart.dayMaster

  // 文昌星
  const wenchang = checkWenchang(chart.sixLines, dm.dayGan, chart.birthInfo.gender)
  if (wenchang.length > 0) {
    const inImportantPos = wenchang.some(w => w.inPosition && (w.position.includes('日') || w.position.includes('月')))
    score += inImportantPos ? 15 : 8
  }

  // 印星（正印+偏印）数量
  const yinCount = countShenShiInChart(chart, YIN_XING)
  score += yinCount * 8

  // 官杀 → 约束力、自律
  const guanCount = countShenShiInChart(chart, GUAN_SHA)
  score += guanCount * 4

  // 食伤 → 理解力、表达力
  const ssCount = countShenShiInChart(chart, SHI_SHANG)
  score += ssCount * 3

  // 印星为喜用神
  const xys = chart.xiYongShen
  const dayElement = dm.dayGanElement
  const yinElement = WUXING_SHENG[dayElement] // 生我者为印
  if (yinElement === xys.bestElement) {
    score += 12
  }

  // 日主过弱 → 精力不足
  if (dm.strengthScore < 25) {
    score -= 10
  }

  const descriptions = [
    '文昌入命且印星为用，聪明好学，学业运势极佳。',
    '印星有力配合官杀，自律性强，适合深造和考试。',
    '食伤吐秀，理解力和表达力出众，文科优势明显。',
    '文昌不显，学业需加倍努力，贵在坚持和积累。',
    '印星受冲或日主偏弱，学习效率一般，需改善方法。',
  ]
  const desc = wenchang.length > 0 && yinElement === xys.bestElement ? descriptions[0]
    : yinCount >= 2 && guanCount >= 1 ? descriptions[1]
    : ssCount >= 2 ? descriptions[2]
    : wenchang.length === 0 ? descriptions[3]
    : descriptions[4]

  return { score: clamp(score), desc }
}

/**
 * 7. 贵人评分
 * 根据天乙贵人+天德月德+正印推算
 */
function scoreNobleHelp(chart: BaZiChart): { score: number; desc: string } {
  let score = 40
  const dm = chart.dayMaster
  const allZhi = getAllBranches(chart)
  const allGan = getAllStems(chart)
  const monthZhiIdx = MONTH_BRANCH_ORDER.indexOf(chart.sixLines.month.zhi)

  // 天乙贵人
  const dayGanIdx = HEAVENLY_STEMS.indexOf(dm.dayGan)
  const tianyiZhiIndices = TIANYI_MAP[dayGanIdx] || []
  const tianyiZhis = tianyiZhiIndices.map(idx => EARTHLY_BRANCHES[idx])
  const hasTianyi = allZhi.some(z => tianyiZhis.includes(z))
  const tianyiCount = allZhi.filter(z => tianyiZhis.includes(z)).length
  score += hasTianyi ? 15 + tianyiCount * 5 : 0

  // 天德贵人（值可能为天干或地支，需同时检查）
  if (monthZhiIdx >= 0) {
    const tiande = TIANDE_MAP[monthZhiIdx]
    if (tiande) {
      if (allZhi.includes(tiande as EarthlyBranch) || allGan.includes(tiande as HeavenlyStem)) {
        score += 10
      }
    }
  }

  // 月德贵人
  if (monthZhiIdx >= 0) {
    const yuedeGan = YUEDE_MAP[monthZhiIdx]
    if (yuedeGan && allGan.includes(yuedeGan)) {
      score += 10
    }
  }

  // 正印 → 贵人星
  const zhengYinCount = countShenShiInChart(chart, ['正印'])
  score += zhengYinCount * 6

  // 正官 → 管辖贵人
  const zhengGuanCount = countShenShiInChart(chart, ['正官'])
  score += zhengGuanCount * 4

  const descriptions = [
    '天乙、天德、月德齐聚，贵人多助，逢凶化吉。',
    '天乙贵人在命，一生多得长辈上司提携。',
    '天德或月德入命，品德端正，常遇贵人相助。',
    '正印为用且有力，学业和事业中常有贵人指引。',
    '贵人星不显，需主动结交良师益友，积累人脉。',
  ]
  const tiandeInChart = monthZhiIdx >= 0 && TIANDE_MAP[monthZhiIdx]
    && (allZhi.includes(TIANDE_MAP[monthZhiIdx]! as EarthlyBranch) || allGan.includes(TIANDE_MAP[monthZhiIdx]! as HeavenlyStem))
  const desc = hasTianyi && tiandeInChart ? descriptions[0]
    : hasTianyi ? descriptions[1]
    : monthZhiIdx >= 0 && (TIANDE_MAP[monthZhiIdx] || YUEDE_MAP[monthZhiIdx]) ? descriptions[2]
    : zhengYinCount > 0 ? descriptions[3]
    : descriptions[4]

  return { score: clamp(score), desc }
}

/**
 * 8. 子女评分
 * 根据时柱+食伤+子女宫推算
 */
function scoreChildren(chart: BaZiChart): { score: number; desc: string } {
  let score = 48
  const dm = chart.dayMaster
  const hourZhi = chart.sixLines.hour.zhi
  const hourGan = chart.sixLines.hour.gan

  // 时柱（子女宫）质量
  const hourZhiElement = getBranchElement(hourZhi)
  const dayElement = dm.dayGanElement
  // 时柱五行生扶日主 → 子女孝顺
  if (isGenerating(hourZhiElement, dayElement)) {
    score += 12
  } else if (isSameElement(hourZhiElement, dayElement)) {
    score += 8
  } else if (isOvercoming(hourZhiElement, dayElement)) {
    score -= 8
  }

  // 食伤（子女星）数量
  const shiShangCount = countShenShiInChart(chart, SHI_SHANG)
  score += shiShangCount * 8

  // 食伤为喜用 → 子女有出息
  const xys = chart.xiYongShen
  const shiShangElement = WUXING_SHENG[dayElement] // 我生者为食伤
  if (shiShangElement === xys.bestElement) {
    score += 10
  } else if (xys.avoidedElements?.includes(shiShangElement)) {
    score -= 8
  }

  // 时柱不被冲
  const allZhi = getAllBranches(chart)
  const hasChongOnHour = allZhi.some(z => z !== hourZhi && hasChong(z, hourZhi))
  if (hasChongOnHour) {
    score -= 10
  }

  // 时柱十神为食神/伤官 → 子女星坐子女宫
  const hourGanSS = dm.relatedShens[hourGan]
  if (hourGanSS === '食神' || hourGanSS === '伤官') {
    score += 10
  }

  const descriptions = [
    '时柱食伤坐镇且为喜用，子女聪明孝顺，晚年有依靠。',
    '子女宫稳固，食伤有力，子女缘厚，教育宜因材施教。',
    '食伤不显但时柱无冲，子女运势平稳，中晚年添福。',
    '时柱受冲或食伤受克，子女缘薄，需多花时间陪伴。',
    '子女星弱且忌神入子女宫，子女教育需格外用心。',
  ]
  const desc = shiShangCount >= 2 && shiShangElement === xys.bestElement && !hasChongOnHour ? descriptions[0]
    : shiShangCount > 0 && !hasChongOnHour ? descriptions[1]
    : !hasChongOnHour ? descriptions[2]
    : hasChongOnHour && shiShangCount === 0 ? descriptions[3]
    : descriptions[4]

  return { score: clamp(score), desc }
}

/**
 * 9. 父母评分
 * 根据年柱+月柱+财星印星推算
 */
function scoreParents(chart: BaZiChart): { score: number; desc: string } {
  let score = 50
  const dm = chart.dayMaster
  const yearZhi = chart.sixLines.year.zhi
  const monthZhi = chart.sixLines.month.zhi
  const yearGan = chart.sixLines.year.gan
  const dayElement = dm.dayGanElement

  // 年柱（祖业宫）质量
  const yearZhiElement = getBranchElement(yearZhi)
  // 年柱生扶日主 → 祖上庇荫
  if (isGenerating(yearZhiElement, dayElement)) {
    score += 10
  }

  // 月柱（父母宫）质量
  const monthZhiElement = getBranchElement(monthZhi)
  if (isGenerating(monthZhiElement, dayElement) || isSameElement(monthZhiElement, dayElement)) {
    score += 10
  } else if (isOvercoming(monthZhiElement, dayElement)) {
    score -= 8
  }

  // 印星（父母星）数量
  const yinCount = countShenShiInChart(chart, YIN_XING)
  score += yinCount * 6

  // 财星（父星/妻星）数量
  const caiCount = countShenShiInChart(chart, CAI_XING)
  score += caiCount * 3

  // 年月柱不被冲
  const allZhi = getAllBranches(chart)
  const hasChongOnYear = allZhi.some(z => z !== yearZhi && hasChong(z, yearZhi))
  const hasChongOnMonth = allZhi.some(z => z !== monthZhi && hasChong(z, monthZhi))
  if (hasChongOnYear) score -= 10
  if (hasChongOnMonth) score -= 8

  // 印星为喜用
  const xys = chart.xiYongShen
  const yinElement = WUXING_SHENG[dayElement]
  if (yinElement === xys.bestElement) {
    score += 8
  }

  const descriptions = [
    '年月柱稳固，印星有力，父母健康，家庭背景良好。',
    '印星得力且年月无冲，父母缘厚，能得家庭支持。',
    '年月柱略有冲克，父母关系或家庭环境有波动。',
    '印星偏弱，年少时家庭助力有限，需自立自强。',
    '年月冲克明显，与父母缘薄或少年离家发展。',
  ]
  const desc = !hasChongOnYear && !hasChongOnMonth && yinCount >= 2 ? descriptions[0]
    : !hasChongOnYear && !hasChongOnMonth ? descriptions[1]
    : (hasChongOnYear || hasChongOnMonth) && yinCount > 0 ? descriptions[2]
    : yinCount === 0 ? descriptions[3]
    : descriptions[4]

  return { score: clamp(score), desc }
}

/**
 * 10. 晚年评分
 * 根据时柱+大运后期+五行平衡推算
 */
function scoreLaterLife(chart: BaZiChart): { score: number; desc: string } {
  let score = 48
  const dm = chart.dayMaster
  const hourZhi = chart.sixLines.hour.zhi
  const hourGan = chart.sixLines.hour.gan
  const dayElement = dm.dayGanElement
  const hourZhiElement = getBranchElement(hourZhi)

  // 时柱（晚年宫）五行生扶日主
  if (isGenerating(hourZhiElement, dayElement)) {
    score += 15
  } else if (isSameElement(hourZhiElement, dayElement)) {
    score += 10
  } else if (isOvercoming(hourZhiElement, dayElement)) {
    score -= 12
  }

  // 时柱天干为喜用
  const xys = chart.xiYongShen
  const hourGanElement = getStemElement(hourGan)
  if (hourGanElement === xys.bestElement) {
    score += 12
  } else if (xys.avoidedElements?.includes(hourGanElement)) {
    score -= 8
  }

  // 时柱不被冲
  const allZhi = getAllBranches(chart)
  const hasChongOnHour = allZhi.some(z => z !== hourZhi && hasChong(z, hourZhi))
  if (hasChongOnHour) {
    score -= 12
  } else {
    score += 5
  }

  // 五行平衡 → 晚年安稳
  const balance = calcWuxingBalance(chart.fiveElementCount)
  score += balance * 0.2

  // 日主偏弱 → 晚年需养生
  if (dm.strengthScore < 30) {
    score -= 8
  }

  // 正印在时柱 → 晚年有福
  const hourGanSS = dm.relatedShens[hourGan]
  if (hourGanSS === '正印' || hourGanSS === '食神') {
    score += 10
  }

  const descriptions = [
    '时柱喜用得力且无冲克，晚年富足安康，福寿绵长。',
    '时柱五行生扶日主，晚年生活稳定，子女孝顺。',
    '时柱平顺，晚年运势中等，注重养生可享清福。',
    '时柱受冲或忌神入宫，晚年需防健康问题和孤独。',
    '时柱欠佳，晚年宜早做规划，储蓄和健康并重。',
  ]
  const desc = hourGanElement === xys.bestElement && !hasChongOnHour && (hourGanSS === '正印' || hourGanSS === '食神') ? descriptions[0]
    : !hasChongOnHour && isGenerating(hourZhiElement, dayElement) ? descriptions[1]
    : !hasChongOnHour ? descriptions[2]
    : hasChongOnHour ? descriptions[3]
    : descriptions[4]

  return { score: clamp(score), desc }
}

// ========== 主函数 ==========

/**
 * 综合评分引擎
 *
 * @param chart - 八字命盘
 * @param careerResult - 事业分析结果（可选）
 * @param marriageResult - 婚姻分析结果（可选）
 * @param wealthResult - 财富分析结果（可选）
 * @param healthResult - 健康分析结果（可选）
 * @returns 综合评分结果
 */
export function calculateComprehensiveScore(
  chart: BaZiChart,
  careerResult?: CareerAnalysisResult,
  marriageResult?: MarriageAnalysisResult,
  wealthResult?: WealthAnalysisResult,
  healthResult?: HealthAnalysisResult,
): ComprehensiveScoreResult {
  // 1. 命局
  const mingJuScore = scoreMingJu(chart)
  const mingJuDesc = chart.analysis.overall
    ? chart.analysis.overall.slice(0, 100)
    : '命局格局与五行平衡的综合评估。'

  // 2. 事业
  const career = scoreCareer(chart, careerResult)

  // 3. 财富
  const wealth = scoreWealth(chart, wealthResult)

  // 4. 婚姻
  const marriage = scoreMarriage(chart, marriageResult)

  // 5. 健康
  const health = scoreHealth(chart, healthResult)

  // 6. 学业
  const study = scoreStudy(chart)

  // 7. 贵人
  const noble = scoreNobleHelp(chart)

  // 8. 子女
  const children = scoreChildren(chart)

  // 9. 父母
  const parents = scoreParents(chart)

  // 10. 晚年
  const laterLife = scoreLaterLife(chart)

  // 构建维度数组
  const dimensionData: { name: string; score: number; desc: string }[] = [
    { name: '命局', score: mingJuScore, desc: mingJuDesc },
    { name: '事业', score: career.score, desc: career.desc },
    { name: '财富', score: wealth.score, desc: wealth.desc },
    { name: '婚姻', score: marriage.score, desc: marriage.desc },
    { name: '健康', score: health.score, desc: health.desc },
    { name: '学业', score: study.score, desc: study.desc },
    { name: '贵人', score: noble.score, desc: noble.desc },
    { name: '子女', score: children.score, desc: children.desc },
    { name: '父母', score: parents.score, desc: parents.desc },
    { name: '晚年', score: laterLife.score, desc: laterLife.desc },
  ]

  const dimensions: ScoreDimension[] = dimensionData.map(d => ({
    name: d.name,
    score: d.score,
    stars: scoreToStars(d.score),
    level: scoreToLevel(d.score),
    description: d.desc,
  }))

  // 加权平均
  let overallScore = 0
  for (const dim of dimensionData) {
    overallScore += dim.score * (DIMENSION_WEIGHTS[dim.name] ?? 0.089)
  }
  overallScore = clamp(overallScore)

  return {
    dimensions,
    overallScore,
    overallLevel: scoreToLevel(overallScore),
    radarData: dimensions.map(d => d.score),
  }
}