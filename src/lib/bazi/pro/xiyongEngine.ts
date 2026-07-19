/**
 * H3 Module 5: Professional XiYong Engine — 喜用神引擎核心
 *
 * 基于四柱（Module 1）、十神（Module 3）、格局（Module 4）的综合数据，
 * 输出喜神、用神、忌神、仇神、闲神，以及调候分析、扶抑分析、多流派喜用神。
 *
 * 算法来源：
 * - 扶抑法：徐子平《渊海子平》
 * - 调候法：任铁樵《穷通宝鉴》
 * - 病药法：任铁樵《滴天髓阐微》
 * - 格局用神：沈孝瞻《子平真诠》
 */

import type { HeavenlyStem, EarthlyBranch, FiveElement, ShenShi } from '@/lib/core/types/base'
import { WANG_SHUAI_TABLE } from '@/lib/core/constants/wuxing'
import { CANG_GAN } from '@/lib/core/constants/canggan'

import type { ProfessionalFourPillarsResult, DerivationStep } from './types'
import { createChain, createTreeNode } from './types'

import type { ProfessionalConfig } from './config'
import { CLASSIC_CONFIG } from './config'

import type { TenGodEngineOutput } from './tenGodsTypes'

import type {
  PatternEngineOutput,
  PatternSchool,
  SchoolConfig,
} from './patternTypes'
import { DEFAULT_SCHOOL_CONFIG } from './patternTypes'

import type {
  XiYongEngineOptions, XiYongEngineOutput,
  StrengthResult, StrengthDimensionScores, StrengthLevel,
  XiYongGroupResult, XiYongShenItem, ShenRole,
  ClimateAnalysis, ClimateType,
  FuYiAnalysis, FuYiMethodResult, FuYiMethod,
  XiYongSchoolResult, XiYongConflictResult,
  XiYongScoreDetail, XiYongExplainOutput,
  XiYongExecutionMetadata,
  XiYongKnowledgeEntry,
} from './xiyongTypes'
import { getStrengthLevel, getElementRelation } from './xiyongTypes'

import type { XiYongContext as DBXiYongContext } from './xiyongDatabase'
import {
  XIYONG_KB, CLIMATE_RULES, FUYI_RULES,
  getXiYongKnowledge, getClimateRule, getAllClimateRules, getAllFuYiRules,
} from './xiyongDatabase'

import {
  getShenShi, getStemElement, getBranchElement, calculateFiveElementCount,
  FIVE_ELEMENT_SHENG, FIVE_ELEMENT_KE, FIVE_ELEMENT_BE_SHENG, FIVE_ELEMENT_BE_KE,
} from './helpers'

// ─── 版本号 ───

export const XIYONG_ENGINE_VERSION = '5.0.0'
export const XIYONG_CACHE_VERSION = '5.0.0'

// ─── 缓存 ───

const cache = new Map<string, XiYongEngineOutput>()

// ─── 内部类型 ───

/** 强弱判定上下文，从四柱/十神/格局中提取的中间数据 */
interface StrengthContext {
  /** 日主天干 */
  dayMaster: HeavenlyStem
  /** 日主五行 */
  dayMasterElement: FiveElement
  /** 月令地支 */
  monthBranch: EarthlyBranch
  /** 月令五行 */
  monthElement: FiveElement
  /** 四柱天干 */
  stems: [HeavenlyStem, HeavenlyStem, HeavenlyStem, HeavenlyStem]
  /** 四柱地支 */
  branches: [EarthlyBranch, EarthlyBranch, EarthlyBranch, EarthlyBranch]
  /** 藏干表（从 pillars.cangGanMap 或 CANG_GAN） */
  cangGan: typeof CANG_GAN
  /** 五行统计（加权计数） */
  fiveElementCount: Record<FiveElement, number>
  /** 五行总量 */
  totalElementCount: number
  /** 日主旺相休囚死 */
  dayMasterWangShuai: '旺' | '相' | '休' | '囚' | '死'
  /** 十神详情列表 */
  tenGodDetails: TenGodEngineOutput['details']
  /** 五行力量分布（十神引擎输出） */
  fiveElementPower: TenGodEngineOutput['fiveElementPower']
  /** 格局输出 */
  patternOutput: PatternEngineOutput
  /** 配置 */
  config: ProfessionalConfig
}

// ─── 五行常量 ───

const ALL_ELEMENTS: FiveElement[] = ['木', '火', '土', '金', '水']

/** 旺相休囚死对应基础分 */
const WANG_SHUAI_SCORE: Record<string, number> = {
  '旺': 100, '相': 80, '休': 50, '囚': 30, '死': 10,
}

// ─── 辅助：获取十神对应五行 ───

/** 根据十神名称和日主五行，推断该十神对应的五行 */
function tenGodToElement(tenGodName: string, dayMasterElement: FiveElement): FiveElement | null {
  const map: Record<string, FiveElement | null> = {
    '比肩': dayMasterElement,
    '劫财': dayMasterElement,
    '食神': FIVE_ELEMENT_SHENG[dayMasterElement],
    '伤官': FIVE_ELEMENT_SHENG[dayMasterElement],
    '偏财': FIVE_ELEMENT_KE[dayMasterElement],
    '正财': FIVE_ELEMENT_KE[dayMasterElement],
    '偏官': FIVE_ELEMENT_BE_KE[dayMasterElement],
    '正官': FIVE_ELEMENT_BE_KE[dayMasterElement],
    '偏印': FIVE_ELEMENT_BE_SHENG[dayMasterElement],
    '正印': FIVE_ELEMENT_BE_SHENG[dayMasterElement],
  }
  return map[tenGodName] ?? null
}

// ─── 1. buildStrengthContext ───

/**
 * 构建强弱判定上下文
 *
 * 从 ProfessionalFourPillarsResult + TenGodEngineOutput + PatternEngineOutput
 * 提取所有需要的数据，供后续各函数使用。
 *
 * @param pillars 四柱结果（Module 1）
 * @param tenGodOutput 十神结果（Module 3）
 * @param patternOutput 格局结果（Module 4）
 * @param config 专业配置
 * @param steps 推导步骤（追加）
 * @returns 强弱判定上下文
 */
export function buildStrengthContext(
  pillars: ProfessionalFourPillarsResult,
  tenGodOutput: TenGodEngineOutput,
  patternOutput: PatternEngineOutput,
  config: ProfessionalConfig,
  steps: DerivationStep[],
): StrengthContext {
  const dayMaster = pillars.dayMaster
  const dayMasterElement = pillars.dayMasterElement
  const monthBranch = pillars.sixLines.month.zhi
  const monthElement = getBranchElement(monthBranch)
  const dayMasterWangShuai = WANG_SHUAI_TABLE[monthElement][dayMasterElement]

  const stems: [HeavenlyStem, HeavenlyStem, HeavenlyStem, HeavenlyStem] = [
    pillars.sixLines.year.gan,
    pillars.sixLines.month.gan,
    pillars.sixLines.day.gan,
    pillars.sixLines.hour.gan,
  ]
  const branches: [EarthlyBranch, EarthlyBranch, EarthlyBranch, EarthlyBranch] = [
    pillars.sixLines.year.zhi,
    pillars.sixLines.month.zhi,
    pillars.sixLines.day.zhi,
    pillars.sixLines.hour.zhi,
  ]

  const fiveElementCount = calculateFiveElementCount(pillars.sixLines)
  const totalElementCount = ALL_ELEMENTS.reduce((sum, e) => sum + fiveElementCount[e], 0)

  const step = createTreeNode({
    id: 'xiyong-build-context',
    name: '构建强弱判定上下文',
    input: {
      dayMaster,
      dayMasterElement,
      monthBranch,
      monthElement,
    },
    output: {
      dayMasterWangShuai,
      totalElementCount,
      fiveElementCount,
    },
    confidence: 1.0,
    ruleDescription: '从四柱、十神、格局输出中提取日主五行、月令、藏干、五行统计等数据',
    source: '渊海子平',
  })
  steps.push(step)

  return {
    dayMaster,
    dayMasterElement,
    monthBranch,
    monthElement,
    stems,
    branches,
    cangGan: CANG_GAN,
    fiveElementCount,
    totalElementCount,
    dayMasterWangShuai,
    tenGodDetails: tenGodOutput.details,
    fiveElementPower: tenGodOutput.fiveElementPower,
    patternOutput,
    config,
  }
}

// ─── 2. determineStrength ───

/**
 * 日主强弱判定
 *
 * 综合 7 个维度加权评分，得出日主强弱 0-100 分。
 *
 * 权重：
 * - deLing（月令得令）×0.25
 * - deDi（通根得地）×0.20
 * - deShi（天干帮扶）×0.15
 * - tenGodPower（十神力量）×0.15
 * - fiveElementBalance（五行平衡）×0.15
 * - patternBonus（格局辅助）×0.05
 * - shenShaBonus（神煞辅助）×0.05
 *
 * 算法来源：《渊海子平》论旺衰、《滴天髓》论强弱
 *
 * @param ctx 强弱判定上下文
 * @param steps 推导步骤
 * @returns 日主强弱判定结果
 */
export function determineStrength(
  ctx: StrengthContext,
  steps: DerivationStep[],
): StrengthResult {
  const { dayMasterElement, dayMasterWangShuai, branches, stems, fiveElementCount, totalElementCount } = ctx

  // ─── 维度 1: deLing 月令得令 ───
  // 古籍依据：《渊海子平》"月令为提纲，看日主于月令是否得令"
  const deLing: number = WANG_SHUAI_SCORE[dayMasterWangShuai] ?? 50

  // ─── 维度 2: deDi 通根得地 ───
  // 古籍依据：《渊海子平》"得地者，日主之五行在地支藏干中有根"
  const { benWeight = 0.6, zhongWeight = 0.3, yaoWeight = 0.1 } = CLASSIC_CONFIG.hiddenStem
  let deDiRaw = 0
  for (const branch of branches) {
    const cg = CANG_GAN[branch]
    const benElement = getStemElement(cg.ben)
    const zhongElement = cg.zhong ? getStemElement(cg.zhong) : null
    const yaoElement = cg.yao ? getStemElement(cg.yao) : null

    if (benElement === dayMasterElement) deDiRaw += benWeight
    if (zhongElement === dayMasterElement) deDiRaw += zhongWeight
    if (yaoElement === dayMasterElement) deDiRaw += yaoWeight
  }
  // 地支藏干最大理论值 = 4 × (benWeight + zhongWeight + yaoWeight) = 4.0
  const deDi = Math.min(100, (deDiRaw / 4.0) * 100)

  // ─── 维度 3: deShi 天干帮扶 ───
  // 古籍依据：《滴天髓》"天干帮扶，同类相助"
  let deShiCount = 0
  for (const stem of stems) {
    if (getStemElement(stem) === dayMasterElement) {
      deShiCount += 1
    }
  }
  // 天干最大 4 个，含日干本身，故最大帮扶 = 3（其他 3 干）
  const deShi = Math.min(100, (deShiCount / 3) * 100)

  // ─── 维度 4: tenGodPower 十神力量 ───
  // 古籍依据：《渊海子平》论十神旺衰
  let tenGodPower = 0
  for (const detail of ctx.tenGodDetails) {
    // 印星（正印/偏印）和比劫（比肩/劫财）帮扶日主
    if (detail.category === '印星' || detail.category === '比劫') {
      tenGodPower += detail.power
    }
  }
  // 印星最多 2 种 × 100 = 200，比劫最多 2 种 × 100 = 200，最大 400
  const tenGodPowerNormalized = Math.min(100, (tenGodPower / 400) * 100)

  // ─── 维度 5: fiveElementBalance 五行平衡 ───
  // 古籍依据：《滴天髓》"五行平衡为贵"
  const dayMasterRatio = totalElementCount > 0
    ? (fiveElementCount[dayMasterElement] / totalElementCount) * 100
    : 20
  // 理想占比 20%，偏差越大分越低
  const deviation = Math.abs(dayMasterRatio - 20)
  const fiveElementBalance = Math.max(0, 100 - deviation * 5)

  // ─── 维度 6: patternBonus 格局辅助 ───
  // 古籍依据：《子平真诠》论格局用神
  let patternBonus = 50
  const primaryPattern = ctx.patternOutput.primaryPattern
  if (primaryPattern) {
    const favorablePatterns: string[] = [
      '正印格', '偏印格', '建禄格', '月刃格', '专旺格',
    ]
    const unfavorablePatterns: string[] = [
      '七杀格', '正财格', '偏财格', '伤官格',
    ]
    if (favorablePatterns.includes(primaryPattern.name)) {
      patternBonus = 80
    } else if (unfavorablePatterns.includes(primaryPattern.name)) {
      patternBonus = 30
    }
  }

  // ─── 维度 7: shenShaBonus 神煞辅助（预留接口）───
  const shenShaBonus = 5

  // ─── 加权计算 ───
  const dimensionScores: StrengthDimensionScores = {
    deLing,
    deDi,
    deShi,
    tenGodPower: tenGodPowerNormalized,
    fiveElementBalance,
    patternBonus,
    shenShaBonus,
  }

  const strengthScore = Math.round(
    deLing * 0.25 +
    deDi * 0.20 +
    deShi * 0.15 +
    tenGodPowerNormalized * 0.15 +
    fiveElementBalance * 0.15 +
    patternBonus * 0.05 +
    shenShaBonus * 0.05,
  )

  const strengthLevel: StrengthLevel = getStrengthLevel(strengthScore)

  // 可信度：基于各维度一致性
  const scores = [deLing, deDi, deShi, tenGodPowerNormalized, fiveElementBalance, patternBonus]
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length
  const confidence = Math.round(Math.max(30, Math.min(95, 100 - Math.sqrt(variance))))

  const step = createTreeNode({
    id: 'xiyong-determine-strength',
    name: '日主强弱判定',
    input: {
      dayMasterElement,
      dayMasterWangShuai,
    },
    output: {
      strengthScore,
      strengthLevel,
      dimensionScores,
      confidence,
    },
    confidence: confidence / 100,
    ruleDescription: '综合得令、得地、得势、十神力量、五行平衡、格局辅助、神煞辅助七维度加权',
    source: '渊海子平',
  })
  steps.push(step)

  return {
    strengthScore,
    strengthLevel,
    confidence,
    dimensionScores,
  }
}

// ─── 3. determineXiYongGroup ───

/**
 * 确定喜用神分组
 *
 * 基于日主强弱和五行力量分布，将五行分配为：
 * 喜神（XiShen）、用神（YongShen）、忌神（JiShen）、仇神（EnemyShen）、闲神（NeutralShen）
 *
 * 算法来源：
 * - 身弱扶抑：《渊海子平》
 * - 身强抑之：《滴天髓》
 * - 从格/专旺：《子平真诠》
 *
 * @param ctx 强弱判定上下文
 * @param strengthResult 强弱判定结果
 * @param steps 推导步骤
 * @returns 喜用神分组结果
 */
export function determineXiYongGroup(
  ctx: StrengthContext,
  strengthResult: StrengthResult,
  steps: DerivationStep[],
): XiYongGroupResult {
  const { dayMasterElement, fiveElementCount, totalElementCount, tenGodDetails } = ctx
  const { strengthLevel } = strengthResult

  // 根据强弱等级确定分组策略
  type GroupStrategy = 'weak' | 'strong' | 'balanced' | 'extreme-weak' | 'extreme-strong'
  let strategy: GroupStrategy
  switch (strengthLevel) {
    case '极弱':
      strategy = 'extreme-weak'
      break
    case '偏弱':
      strategy = 'weak'
      break
    case '中和':
      strategy = 'balanced'
      break
    case '偏强':
      strategy = 'strong'
      break
    case '极强':
      strategy = 'extreme-strong'
      break
  }

  // 确定喜用五行集合
  const xiYongElements: Set<FiveElement> = new Set()
  const jiElements: Set<FiveElement> = new Set()
  const enemyElements: Set<FiveElement> = new Set()
  let classicalReference = ''
  let strategyReason = ''

  switch (strategy) {
    case 'weak':
      // 身弱：印（生我）和比劫（同我）为喜用，克泄耗为忌
      xiYongElements.add(FIVE_ELEMENT_BE_SHENG[dayMasterElement])   // 印星
      xiYongElements.add(dayMasterElement)               // 比劫
      jiElements.add(FIVE_ELEMENT_BE_KE[dayMasterElement])            // 官杀
      jiElements.add(FIVE_ELEMENT_SHENG[dayMasterElement])         // 食伤
      jiElements.add(FIVE_ELEMENT_KE[dayMasterElement])            // 财星
      classicalReference = '《渊海子平》"身弱宜扶，印比为用"'
      strategyReason = '日主偏弱，需印星生扶、比劫帮扶'
      break

    case 'strong':
      // 身强：财官食伤（我克、克我、我生）为喜用，印比为忌
      xiYongElements.add(FIVE_ELEMENT_KE[dayMasterElement])        // 财星
      xiYongElements.add(FIVE_ELEMENT_BE_KE[dayMasterElement])        // 官杀
      xiYongElements.add(FIVE_ELEMENT_SHENG[dayMasterElement])     // 食伤
      jiElements.add(FIVE_ELEMENT_BE_SHENG[dayMasterElement])          // 印星
      jiElements.add(dayMasterElement)                    // 比劫
      classicalReference = '《滴天髓》"身强宜抑，财官食伤为用"'
      strategyReason = '日主偏强，需财星耗、官杀克、食伤泄'
      break

    case 'balanced':
      // 身中和：取格局用神
      {
        const primaryPattern = ctx.patternOutput.primaryPattern
        if (primaryPattern) {
          // 根据格局类型推荐用神
          const patternXiYongMap: Record<string, FiveElement[]> = {
            '正官格': [FIVE_ELEMENT_BE_KE[dayMasterElement]],
            '七杀格': [FIVE_ELEMENT_BE_SHENG[dayMasterElement]],
            '正印格': [dayMasterElement, FIVE_ELEMENT_SHENG[dayMasterElement]],
            '偏印格': [dayMasterElement, FIVE_ELEMENT_SHENG[dayMasterElement]],
            '正财格': [FIVE_ELEMENT_KE[dayMasterElement], FIVE_ELEMENT_SHENG[dayMasterElement]],
            '偏财格': [FIVE_ELEMENT_KE[dayMasterElement], FIVE_ELEMENT_SHENG[dayMasterElement]],
            '食神格': [FIVE_ELEMENT_SHENG[dayMasterElement], FIVE_ELEMENT_KE[dayMasterElement]],
            '伤官格': [FIVE_ELEMENT_SHENG[dayMasterElement], FIVE_ELEMENT_KE[dayMasterElement]],
            '建禄格': [FIVE_ELEMENT_SHENG[dayMasterElement], FIVE_ELEMENT_KE[dayMasterElement]],
            '月刃格': [FIVE_ELEMENT_SHENG[dayMasterElement], FIVE_ELEMENT_KE[dayMasterElement]],
          }
          const mapped = patternXiYongMap[primaryPattern.name]
          if (mapped) {
            for (const e of mapped) xiYongElements.add(e)
          }
          classicalReference = '《子平真诠》"中和之命，以格局用神为喜用"'
          strategyReason = `日主中和，取${primaryPattern.name}用神`
        } else {
          // 无格局时取生我者
          xiYongElements.add(FIVE_ELEMENT_BE_SHENG[dayMasterElement])
          classicalReference = '《渊海子平》"无格可取，以印星为用"'
          strategyReason = '日主中和，无明确格局，取印星为用'
        }
      }
      break

    case 'extreme-weak':
      // 极弱：可能从格，从格五行为喜
      xiYongElements.add(FIVE_ELEMENT_BE_KE[dayMasterElement])        // 官杀
      xiYongElements.add(FIVE_ELEMENT_KE[dayMasterElement])        // 财星
      xiYongElements.add(FIVE_ELEMENT_SHENG[dayMasterElement])     // 食伤
      jiElements.add(FIVE_ELEMENT_BE_SHENG[dayMasterElement])          // 印星
      jiElements.add(dayMasterElement)                    // 比劫
      classicalReference = '《子平真诠》"极弱从势，不可扶抑"'
      strategyReason = '日主极弱，可能从格，宜顺势从之'
      break

    case 'extreme-strong':
      // 极强：专旺，泄耗五行为喜
      xiYongElements.add(FIVE_ELEMENT_SHENG[dayMasterElement])     // 食伤
      xiYongElements.add(FIVE_ELEMENT_KE[dayMasterElement])        // 财星
      jiElements.add(FIVE_ELEMENT_BE_SHENG[dayMasterElement])          // 印星
      jiElements.add(dayMasterElement)                    // 比劫
      classicalReference = '《子平真诠》"专旺之局，顺其势而泄之"'
      strategyReason = '日主极强，专旺之局，宜泄耗'
      break
  }

  // 仇神：喜神/用神的克制五行
  for (const e of xiYongElements) {
    const keElement = FIVE_ELEMENT_BE_KE[e]
    if (keElement !== dayMasterElement && !xiYongElements.has(keElement)) {
      enemyElements.add(keElement)
    }
  }

  // 构建每个五行的喜用神条目
  const xiShen: XiYongShenItem[] = []
  const yongShen: XiYongShenItem[] = []
  const jiShen: XiYongShenItem[] = []
  const enemyShen: XiYongShenItem[] = []
  const neutralShen: XiYongShenItem[] = []

  // 收集涉及的十神
  function getInvolvedShenShi(element: FiveElement): ShenShi[] {
    const result: ShenShi[] = []
    for (const detail of tenGodDetails) {
      if (detail.element === element) {
        result.push(detail.name)
      }
    }
    return result
  }

  let priority = 1
  // 用神：直接调节平衡的五行（第一个喜用五行）
  for (const element of xiYongElements) {
    const item: XiYongShenItem = {
      element,
      role: priority === 1 ? '用神' : '喜神',
      priority,
      score: totalElementCount > 0
        ? Math.round((fiveElementCount[element] / totalElementCount) * 100)
        : 20,
      source: strategy,
      reason: strategyReason,
      classicalReference,
      confidence: strengthResult.confidence,
      involvedShenShi: getInvolvedShenShi(element),
    }
    if (item.role === '用神') {
      yongShen.push(item)
    } else {
      xiShen.push(item)
    }
    priority++
  }

  // 忌神
  priority = 1
  for (const element of jiElements) {
    const relation = getElementRelation(dayMasterElement, element)
    const item: XiYongShenItem = {
      element,
      role: '忌神',
      priority,
      score: totalElementCount > 0
        ? Math.round((fiveElementCount[element] / totalElementCount) * 100)
        : 20,
      source: strategy,
      reason: `${element}为日主之${relation}，加剧失衡`,
      classicalReference: classicalReference,
      confidence: strengthResult.confidence,
      involvedShenShi: getInvolvedShenShi(element),
    }
    jiShen.push(item)
    priority++
  }

  // 仇神
  priority = 1
  for (const element of enemyElements) {
    const item: XiYongShenItem = {
      element,
      role: '仇神',
      priority,
      score: totalElementCount > 0
        ? Math.round((fiveElementCount[element] / totalElementCount) * 100)
        : 20,
      source: strategy,
      reason: `${element}克制喜用神，间接不利日主`,
      classicalReference: '《渊海子平》"仇神者，克喜用之神"',
      confidence: Math.max(30, strengthResult.confidence - 15),
      involvedShenShi: getInvolvedShenShi(element),
    }
    enemyShen.push(item)
    priority++
  }

  // 闲神：其余五行
  const assigned = new Set<FiveElement>([
    ...xiYongElements, ...jiElements, ...enemyElements,
  ])
  priority = 1
  for (const element of ALL_ELEMENTS) {
    if (!assigned.has(element)) {
      const item: XiYongShenItem = {
        element,
        role: '闲神',
        priority,
        score: totalElementCount > 0
          ? Math.round((fiveElementCount[element] / totalElementCount) * 100)
          : 20,
        source: strategy,
        reason: `${element}与日主无直接利害关系`,
        classicalReference: '《渊海子平》"闲神者，无关于喜忌"',
        confidence: 50,
        involvedShenShi: getInvolvedShenShi(element),
      }
      neutralShen.push(item)
      priority++
    }
  }

  const step = createTreeNode({
    id: 'xiyong-determine-group',
    name: '确定喜用神分组',
    input: {
      strengthLevel,
      strategy,
    },
    output: {
      xiShen: xiShen.map(i => `${i.element}(${i.role})`),
      yongShen: yongShen.map(i => `${i.element}(${i.role})`),
      jiShen: jiShen.map(i => `${i.element}(${i.role})`),
      enemyShen: enemyShen.map(i => `${i.element}(${i.role})`),
      neutralShen: neutralShen.map(i => `${i.element}(${i.role})`),
    },
    confidence: strengthResult.confidence / 100,
    ruleDescription: `根据日主${strengthLevel}，采用${strategy}策略分配喜用神`,
    source: classicalReference.replace(/[《》""]/g, ''),
  })
  steps.push(step)

  return { xiShen, yongShen, jiShen, enemyShen, neutralShen }
}

// ─── 4. determineClimate ───

/**
 * 调候分析
 *
 * 根据月令地支判断调候需求。
 * 调候法源于《穷通宝鉴》（任铁樵注），以寒暖燥湿论五行调候。
 *
 * @param monthBranch 月令地支
 * @param ctx 强弱判定上下文
 * @param steps 推导步骤
 * @returns 调候分析结果
 */
export function determineClimate(
  monthBranch: EarthlyBranch,
  ctx: StrengthContext,
  steps: DerivationStep[],
): ClimateAnalysis {
  // 查询调候规则
  const rule = getClimateRule(monthBranch)

  let climateType: ClimateType = '平'
  let climateScore = 0
  let climateNeed: FiveElement[] = []
  let climateSolution: string[] = []
  let classicalReference = '《穷通宝鉴》'

  if (rule) {
    climateType = rule.climateType as ClimateType
    climateScore = rule.score
    climateNeed = rule.needElement
    climateSolution = [rule.solution]
    classicalReference = rule.reference
  } else {
    // 无特定规则时的默认推算
    // 冬月（亥子丑）偏寒，夏月（巳午未）偏燥
    const winterBranches: EarthlyBranch[] = ['亥', '子', '丑']
    const summerBranches: EarthlyBranch[] = ['巳', '午', '未']
    const springBranches: EarthlyBranch[] = ['寅', '卯', '辰']
    const autumnBranches: EarthlyBranch[] = ['申', '酉', '戌']

    if (winterBranches.includes(monthBranch)) {
      climateType = '寒'
      climateScore = 60
      climateNeed = ['火']
      climateSolution = ['以火调候，温暖命局']
      classicalReference = '《穷通宝鉴》"冬月生人，以火调候为急"'
    } else if (summerBranches.includes(monthBranch)) {
      climateType = '燥'
      climateScore = 60
      climateNeed = ['水']
      climateSolution = ['以水调候，润泽命局']
      classicalReference = '《穷通宝鉴》"夏月生人，以水调候为急"'
    } else if (springBranches.includes(monthBranch)) {
      climateType = '湿'
      climateScore = 30
      climateNeed = []
      climateSolution = ['春月木旺，寒湿渐退，调候次之']
      classicalReference = '《穷通宝鉴》"春月余寒未消，兼顾调候"'
    } else if (autumnBranches.includes(monthBranch)) {
      climateType = '暖'
      climateScore = 30
      climateNeed = []
      climateSolution = ['秋月金旺，燥气渐生，调候次之']
      classicalReference = '《穷通宝鉴》"秋月余燥未消，兼顾调候"'
    }
  }

  const step = createTreeNode({
    id: 'xiyong-determine-climate',
    name: '调候分析',
    input: { monthBranch, dayMasterElement: ctx.dayMasterElement },
    output: { climateType, climateScore, climateNeed, climateSolution },
    confidence: 0.85,
    ruleDescription: `月令${monthBranch}，调候${climateType}，需求${climateNeed.join('、') || '无'}`,
    source: '穷通宝鉴',
  })
  steps.push(step)

  return {
    climateType,
    climateScore,
    climateNeed,
    climateSolution,
    classicalReference,
    confidence: 85,
  }
}

// ─── 5. evaluateFuYiMethods ───

/**
 * 扶抑分析
 *
 * 遍历扶抑规则库，评估各方法（扶抑法/调候法/病药法/通关法/专旺法/从格法）
 * 的适用性和推荐喜用神。
 *
 * 算法来源：
 * - 扶抑法：《渊海子平》
 * - 调候法：《穷通宝鉴》
 * - 病药法：《滴天髓》
 * - 通关法：《子平真诠》
 * - 专旺法/从格法：《子平真诠》
 *
 * @param ctx 强弱判定上下文
 * @param strengthResult 强弱判定结果
 * @param climateAnalysis 调候分析结果
 * @param steps 推导步骤
 * @returns 扶抑分析结果
 */
export function evaluateFuYiMethods(
  ctx: StrengthContext,
  strengthResult: StrengthResult,
  climateAnalysis: ClimateAnalysis,
  steps: DerivationStep[],
): FuYiAnalysis {
  const allRules = getAllFuYiRules()
  const methods: FuYiMethodResult[] = []

  for (const rule of allRules) {
    // 检查是否适用
    // 构建适配器：将 StrengthContext 转为数据库 XiYongContext 格式
    const dbContext: DBXiYongContext = {
      dayMasterElement: ctx.dayMasterElement,
      strengthScore: 50, // will be refined by strengthResult
      strengthLevel: '中和',
      fiveElementPower: Object.fromEntries(
        ctx.fiveElementPower.map(p => [p.element, p.percentage])
      ),
      tenGodDetails: ctx.tenGodDetails,
      primaryPattern: ctx.patternOutput.primaryPattern,
      monthBranch: ctx.monthBranch,
      dayMaster: ctx.dayMaster,
    }
    let applicable = false
    if (typeof rule.applicable === 'function') {
      applicable = rule.applicable(dbContext)
    }

    if (!applicable) continue

    // 获取该方法推荐的喜用神
    const recommendedXi = typeof rule.determineXiShen === 'function'
      ? rule.determineXiShen(dbContext) : []
    const recommendedYong = typeof rule.determineYongShen === 'function'
      ? rule.determineYongShen(dbContext) : []

    const methodResult: FuYiMethodResult = {
      method: rule.method as FuYiMethod,
      score: 50,
      confidence: 70,
      recommendedElements: recommendedXi,
      recommendedYongShen: recommendedYong,
      reason: rule.description,
      classicalReference: rule.reference,
    }
    methods.push(methodResult)
  }

  // 如果规则库为空，使用内置默认逻辑
  if (methods.length === 0) {
    methods.push(...buildDefaultFuYiMethods(ctx, strengthResult, climateAnalysis))
  }

  // 确定主方法（得分最高）
  let primaryMethod: FuYiMethod = '扶抑法'
  let overallScore = 0
  if (methods.length > 0) {
    const best = methods.reduce((prev, curr) => curr.score > prev.score ? curr : prev, methods[0])
    primaryMethod = best.method
    overallScore = Math.round(
      methods.reduce((sum, m) => sum + m.score * (m.confidence / 100), 0) / methods.length,
    )
  }

  const step = createTreeNode({
    id: 'xiyong-evaluate-fuyi',
    name: '扶抑分析',
    input: {
      strengthLevel: strengthResult.strengthLevel,
      climateType: climateAnalysis.climateType,
      ruleCount: allRules.length,
    },
    output: {
      evaluatedMethods: methods.length,
      primaryMethod,
      overallScore,
    },
    confidence: 0.8,
    ruleDescription: `评估${methods.length}种扶抑方法，最终采用${primaryMethod}`,
    source: '渊海子平',
  })
  steps.push(step)

  return { methods, primaryMethod, overallScore }
}

/**
 * 内置默认扶抑方法（当规则库为空时的后备逻辑）
 */
function buildDefaultFuYiMethods(
  ctx: StrengthContext,
  strengthResult: StrengthResult,
  climateAnalysis: ClimateAnalysis,
): FuYiMethodResult[] {
  const { dayMasterElement, fiveElementCount, totalElementCount } = ctx
  const results: FuYiMethodResult[] = []

  // 扶抑法
  {
    const isWeak = ['偏弱', '极弱'].includes(strengthResult.strengthLevel)
    const elements: FiveElement[] = isWeak
      ? [FIVE_ELEMENT_BE_SHENG[dayMasterElement], dayMasterElement]
      : [FIVE_ELEMENT_KE[dayMasterElement], FIVE_ELEMENT_BE_KE[dayMasterElement], FIVE_ELEMENT_SHENG[dayMasterElement]]
    const yong: FiveElement[] = isWeak
      ? [FIVE_ELEMENT_BE_SHENG[dayMasterElement]]
      : [FIVE_ELEMENT_SHENG[dayMasterElement]]
    results.push({
      method: '扶抑法',
      score: 75,
      confidence: 85,
      recommendedElements: elements,
      recommendedYongShen: yong,
      reason: isWeak ? '身弱扶之，以印比帮扶' : '身强抑之，以财官食伤克泄耗',
      classicalReference: '《渊海子平》"扶抑者，扶其弱而抑其强"',
    })
  }

  // 调候法
  if (climateAnalysis.climateScore >= 40) {
    results.push({
      method: '调候法',
      score: climateAnalysis.climateScore,
      confidence: climateAnalysis.confidence,
      recommendedElements: climateAnalysis.climateNeed,
      recommendedYongShen: climateAnalysis.climateNeed.slice(0, 1),
      reason: climateAnalysis.climateSolution[0] ?? '需要调候',
      classicalReference: climateAnalysis.classicalReference,
    })
  }

  // 病药法
  {
    // 找出最旺的五行（病），最弱的为药
    let maxElement: FiveElement = dayMasterElement
    let maxCount = 0
    for (const e of ALL_ELEMENTS) {
      if (fiveElementCount[e] > maxCount) {
        maxCount = fiveElementCount[e]
        maxElement = e
      }
    }
    // 药：克制最旺五行的五行
    const medicine = FIVE_ELEMENT_BE_KE[maxElement]
    results.push({
      method: '病药法',
      score: 60,
      confidence: 65,
      recommendedElements: [medicine],
      recommendedYongShen: [medicine],
      reason: `命局${maxElement}偏旺为病，以${medicine}克之为药`,
      classicalReference: '《滴天髓》"有病方为贵，无伤不是奇"',
    })
  }

  // 通关法
  {
    // 检查是否有两行严重相克需要通关
    const pairs: Array<[FiveElement, FiveElement, FiveElement]> = [
      [dayMasterElement, FIVE_ELEMENT_BE_KE[dayMasterElement], FIVE_ELEMENT_SHENG[dayMasterElement]],
    ]
    for (const [a, , bridge] of pairs) {
      if (fiveElementCount[a] > 0 && fiveElementCount[FIVE_ELEMENT_BE_KE[a]] > 0) {
        results.push({
          method: '通关法',
          score: 55,
          confidence: 60,
          recommendedElements: [bridge],
          recommendedYongShen: [bridge],
          reason: `${a}与${FIVE_ELEMENT_BE_KE[a]}相克，以${bridge}通关化解`,
          classicalReference: '《子平真诠》"通关者，两行相克，以通关之神化之"',
        })
        break
      }
    }
  }

  // 专旺法
  if (strengthResult.strengthLevel === '极强') {
    results.push({
      method: '专旺法',
      score: 70,
      confidence: 75,
      recommendedElements: [FIVE_ELEMENT_SHENG[dayMasterElement], FIVE_ELEMENT_KE[dayMasterElement]],
      recommendedYongShen: [FIVE_ELEMENT_SHENG[dayMasterElement]],
      reason: '日主极强，专旺之局，顺其势泄之',
      classicalReference: '《子平真诠》"专旺格，不可逆势，宜顺泄"',
    })
  }

  // 从格法
  if (strengthResult.strengthLevel === '极弱') {
    results.push({
      method: '从格法',
      score: 65,
      confidence: 70,
      recommendedElements: [FIVE_ELEMENT_KE[dayMasterElement], FIVE_ELEMENT_BE_KE[dayMasterElement]],
      recommendedYongShen: [FIVE_ELEMENT_BE_KE[dayMasterElement]],
      reason: '日主极弱，从势而行',
      classicalReference: '《子平真诠》"从格者，日主无根，从之不可逆"',
    })
  }

  return results
}

// ─── 6. evaluateSchools ───

/**
 * 多流派喜用神
 *
 * 每个启用的流派独立计算喜用神（使用不同策略权重）。
 *
 * 流派策略：
 * - 子平：侧重扶抑法（权重 0.5）
 * - 滴天髓：侧重病药法（权重 0.5）
 * - 子平真诠：侧重格局用神（权重 0.5）
 * - 穷通宝鉴：侧重调候法（权重 0.5）
 *
 * @param ctx 强弱判定上下文
 * @param strengthResult 强弱判定结果
 * @param xiYongGroup 喜用神分组
 * @param climateAnalysis 调候分析
 * @param fuYiAnalysis 扶抑分析
 * @param schoolConfigs 流派配置
 * @param steps 推导步骤
 * @returns 多流派喜用神结果
 */
export function evaluateSchools(
  ctx: StrengthContext,
  strengthResult: StrengthResult,
  xiYongGroup: XiYongGroupResult,
  climateAnalysis: ClimateAnalysis,
  fuYiAnalysis: FuYiAnalysis,
  schoolConfigs: SchoolConfig[],
  steps: DerivationStep[],
): XiYongSchoolResult[] {
  const results: XiYongSchoolResult[] = []

  for (const sc of schoolConfigs) {
    if (!sc.enabled) {
      results.push({
        school: sc.name,
        enabled: false,
        xiShen: [],
        yongShen: [],
        jiShen: [],
        score: 0,
        weight: sc.weight,
        weightedScore: 0,
        reason: '该流派未启用',
        reference: '',
      })
      continue
    }

    let xiShen: FiveElement[] = []
    let yongShen: FiveElement[] = []
    let jiShen: FiveElement[] = []
    let score = 50
    let reason = ''
    let reference = ''

    switch (sc.name) {
      case '子平':
        // 子平派：侧重扶抑法
        {
          const fuYiMethod = fuYiAnalysis.methods.find(m => m.method === '扶抑法')
          if (fuYiMethod) {
            xiShen = [...fuYiMethod.recommendedElements]
            yongShen = [...fuYiMethod.recommendedYongShen]
            score = fuYiMethod.score
            reason = fuYiMethod.reason
            reference = fuYiMethod.classicalReference
          } else {
            xiShen = xiYongGroup.xiShen.map(i => i.element)
            yongShen = xiYongGroup.yongShen.map(i => i.element)
            score = 60
            reason = '子平派以扶抑法为主'
            reference = '《渊海子平》'
          }
          jiShen = xiYongGroup.jiShen.map(i => i.element)
        }
        break

      case '滴天髓':
        // 滴天髓派：侧重病药法
        {
          const bingYao = fuYiAnalysis.methods.find(m => m.method === '病药法')
          if (bingYao) {
            xiShen = [...bingYao.recommendedElements]
            yongShen = [...bingYao.recommendedYongShen]
            score = bingYao.score
            reason = bingYao.reason
            reference = bingYao.classicalReference
          } else {
            xiShen = xiYongGroup.xiShen.map(i => i.element)
            yongShen = xiYongGroup.yongShen.map(i => i.element)
            score = 55
            reason = '滴天髓派以病药法为主'
            reference = '《滴天髓》'
          }
          jiShen = xiYongGroup.jiShen.map(i => i.element)
        }
        break

      case '子平真诠':
        // 子平真诠派：侧重格局用神
        {
          const primaryPattern = ctx.patternOutput.primaryPattern
          if (primaryPattern) {
            // 根据格局类型推导喜用
            const pName = primaryPattern.name
            const dayMasterElement = ctx.dayMasterElement
            const patternXiYong: Record<string, { xi: FiveElement[]; yong: FiveElement[] }> = {
              '正官格': { xi: [FIVE_ELEMENT_BE_KE[dayMasterElement]], yong: [FIVE_ELEMENT_BE_KE[dayMasterElement]] },
              '七杀格': { xi: [FIVE_ELEMENT_BE_SHENG[dayMasterElement], FIVE_ELEMENT_SHENG[dayMasterElement]], yong: [FIVE_ELEMENT_BE_SHENG[dayMasterElement]] },
              '正印格': { xi: [dayMasterElement], yong: [FIVE_ELEMENT_BE_SHENG[dayMasterElement]] },
              '偏印格': { xi: [dayMasterElement], yong: [FIVE_ELEMENT_BE_SHENG[dayMasterElement]] },
              '正财格': { xi: [FIVE_ELEMENT_KE[dayMasterElement]], yong: [FIVE_ELEMENT_KE[dayMasterElement]] },
              '偏财格': { xi: [FIVE_ELEMENT_KE[dayMasterElement]], yong: [FIVE_ELEMENT_KE[dayMasterElement]] },
              '食神格': { xi: [FIVE_ELEMENT_SHENG[dayMasterElement]], yong: [FIVE_ELEMENT_SHENG[dayMasterElement]] },
              '伤官格': { xi: [FIVE_ELEMENT_SHENG[dayMasterElement]], yong: [FIVE_ELEMENT_SHENG[dayMasterElement]] },
              '建禄格': { xi: [FIVE_ELEMENT_SHENG[dayMasterElement], FIVE_ELEMENT_KE[dayMasterElement]], yong: [FIVE_ELEMENT_SHENG[dayMasterElement]] },
              '月刃格': { xi: [FIVE_ELEMENT_SHENG[dayMasterElement], FIVE_ELEMENT_KE[dayMasterElement]], yong: [FIVE_ELEMENT_SHENG[dayMasterElement]] },
            }
            const mapped = patternXiYong[pName]
            if (mapped) {
              xiShen = mapped.xi
              yongShen = mapped.yong
            }
            score = primaryPattern.formScore
            reason = `子平真诠派以${pName}格局用神为喜用`
            reference = '《子平真诠》'
          } else {
            xiShen = xiYongGroup.xiShen.map(i => i.element)
            yongShen = xiYongGroup.yongShen.map(i => i.element)
            score = 45
            reason = '未识别格局，退化为通用分析'
            reference = '《子平真诠》'
          }
          jiShen = xiYongGroup.jiShen.map(i => i.element)
        }
        break

      case '穷通宝鉴':
        // 穷通宝鉴派：侧重调候法
        {
          const tiaoHou = fuYiAnalysis.methods.find(m => m.method === '调候法')
          if (tiaoHou) {
            xiShen = [...tiaoHou.recommendedElements]
            yongShen = [...tiaoHou.recommendedYongShen]
            score = tiaoHou.score
            reason = tiaoHou.reason
            reference = tiaoHou.classicalReference
          } else if (climateAnalysis.climateNeed.length > 0) {
            xiShen = [...climateAnalysis.climateNeed]
            yongShen = climateAnalysis.climateNeed.slice(0, 1)
            score = climateAnalysis.climateScore
            reason = climateAnalysis.climateSolution[0] ?? '调候优先'
            reference = climateAnalysis.classicalReference
          } else {
            xiShen = xiYongGroup.xiShen.map(i => i.element)
            yongShen = xiYongGroup.yongShen.map(i => i.element)
            score = 40
            reason = '调候需求不显著'
            reference = '《穷通宝鉴》'
          }
          jiShen = xiYongGroup.jiShen.map(i => i.element)
        }
        break
    }

    results.push({
      school: sc.name,
      enabled: true,
      xiShen,
      yongShen,
      jiShen,
      score,
      weight: sc.weight,
      weightedScore: Math.round(score * sc.weight),
      reason,
      reference,
    })
  }

  const step = createTreeNode({
    id: 'xiyong-evaluate-schools',
    name: '多流派喜用神评估',
    input: {
      enabledSchools: schoolConfigs.filter(sc => sc.enabled).map(sc => sc.name),
    },
    output: {
      schoolCount: results.length,
      schoolScores: results.map(r => ({ school: r.school, score: r.score })),
    },
    confidence: 0.8,
    ruleDescription: `评估${results.filter(r => r.enabled).length}个启用流派`,
    source: '子平真诠',
  })
  steps.push(step)

  return results
}

// ─── 7. resolveConflicts ───

/**
 * 冲突解析
 *
 * 检查各流派推荐的喜用神是否一致。
 * 如不一致则采用加权综合方式，以加权评分高低排序推荐。
 *
 * 算法来源：《渊海子平》"众法不一，取其最善"
 *
 * @param schoolResults 多流派喜用神结果
 * @param steps 推导步骤
 * @returns 冲突解析结果
 */
export function resolveConflicts(
  schoolResults: XiYongSchoolResult[],
  steps: DerivationStep[],
): XiYongConflictResult {
  const enabledSchools = schoolResults.filter(s => s.enabled)

  // 收集所有流派推荐的喜神和用神
  const xiShenVotes = new Map<FiveElement, number>()
  const yongShenVotes = new Map<FiveElement, number>()

  for (const school of enabledSchools) {
    for (const e of school.xiShen) {
      xiShenVotes.set(e, (xiShenVotes.get(e) ?? 0) + school.weightedScore)
    }
    for (const e of school.yongShen) {
      yongShenVotes.set(e, (yongShenVotes.get(e) ?? 0) + school.weightedScore)
    }
  }

  // 按加权分数排序
  const recommendedXiShen = [...xiShenVotes.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([e]) => e)
  const recommendedYongShen = [...yongShenVotes.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([e]) => e)

  // 检查是否存在冲突
  // 冲突定义：各流派推荐的喜神/用神不完全一致
  const allXiSets = enabledSchools.map(s => new Set(s.xiShen))
  const allYongSets = enabledSchools.map(s => new Set(s.yongShen))
  const xiConsistent = allXiSets.length <= 1 || allXiSets.every(s => {
    const first = allXiSets[0]
    return s.size === first.size && [...first].every(e => s.has(e))
  })
  const yongConsistent = allYongSets.length <= 1 || allYongSets.every(s => {
    const first = allYongSets[0]
    return s.size === first.size && [...first].every(e => s.has(e))
  })
  const hasConflict = !xiConsistent || !yongConsistent

  let conflictDescription = ''
  let resolutionMethod: XiYongConflictResult['resolutionMethod'] = 'weighted'

  if (hasConflict) {
    const differences: string[] = []
    if (!xiConsistent) {
      const uniqueXi = new Set<FiveElement>()
      for (const set of allXiSets) {
        for (const e of set) uniqueXi.add(e)
      }
      differences.push(`喜神分歧：${[...uniqueXi].join('、')}`)
    }
    if (!yongConsistent) {
      const uniqueYong = new Set<FiveElement>()
      for (const set of allYongSets) {
        for (const e of set) uniqueYong.add(e)
      }
      differences.push(`用神分歧：${[...uniqueYong].join('、')}`)
    }
    conflictDescription = differences.join('；') + '。采用加权综合方式推荐。'
    resolutionMethod = 'weighted'
  } else {
    conflictDescription = '各流派喜用神推荐一致'
    resolutionMethod = 'majority'
  }

  // 综合可信度
  const overallConfidence = enabledSchools.length > 0
    ? Math.round(enabledSchools.reduce((s, r) => s + r.score, 0) / enabledSchools.length)
    : 0

  const step = createTreeNode({
    id: 'xiyong-resolve-conflicts',
    name: '流派冲突解析',
    input: {
      schoolCount: enabledSchools.length,
    },
    output: {
      hasConflict,
      resolutionMethod,
      recommendedXiShen,
      recommendedYongShen,
      overallConfidence,
    },
    confidence: hasConflict ? 0.7 : 0.95,
    ruleDescription: hasConflict
      ? `流派存在分歧，采用${resolutionMethod}方式综合`
      : '各流派喜用神一致',
    source: '渊海子平',
  })
  steps.push(step)

  return {
    schoolComparisons: enabledSchools,
    hasConflict,
    conflictDescription,
    recommendedXiShen,
    recommendedYongShen,
    overallConfidence,
    resolutionMethod,
  }
}

// ─── 8. calculateXiYongScoreDetail ───

/**
 * 评分明细
 *
 * 按权重计算喜用神综合评分：
 * - 日主强弱 30%
 * - 格局影响 20%
 * - 十神配合 15%
 * - 五行平衡 15%
 * - 调候需求 10%
 * - 神煞辅助 5%
 * - 冲突修正 5%
 *
 * @param ctx 强弱判定上下文
 * @param strengthResult 强弱判定结果
 * @param climateAnalysis 调候分析
 * @param fuYiAnalysis 扶抑分析
 * @param conflictResult 冲突解析
 * @param steps 推导步骤
 * @returns 评分明细
 */
export function calculateXiYongScoreDetail(
  ctx: StrengthContext,
  strengthResult: StrengthResult,
  climateAnalysis: ClimateAnalysis,
  fuYiAnalysis: FuYiAnalysis,
  conflictResult: XiYongConflictResult,
  steps: DerivationStep[],
): XiYongScoreDetail {
  // 日主强弱 30%
  const dayMasterStrength = Math.round(strengthResult.strengthScore * 0.30)

  // 格局影响 20%
  const primaryPattern = ctx.patternOutput.primaryPattern
  const patternInfluence = primaryPattern
    ? Math.round(primaryPattern.formScore * 0.20)
    : Math.round(50 * 0.20)

  // 十神配合 15% — 基于十神引擎的平衡评分
  const tenGodBalance = ctx.tenGodDetails.length > 0
    ? ctx.tenGodDetails.reduce((s, d) => s + d.balanceScore, 0) / ctx.tenGodDetails.length
    : 50
  const tenGodHarmony = Math.round(tenGodBalance * 0.15)

  // 五行平衡 15% — 基于强弱判定中的五行平衡维度
  const fiveElementBalance = Math.round(strengthResult.dimensionScores.fiveElementBalance * 0.15)

  // 调候需求 10% — 调候越平越好（低分=好=不需要调候）
  const climateNeed = Math.round((100 - climateAnalysis.climateScore) * 0.10)

  // 神煞辅助 5% — 预留
  const shenShaAssist = Math.round(80 * 0.05) // 固定80分 × 5%

  // 冲突修正 5% — 无冲突=100，有冲突=按可信度
  const conflictAdjustment = conflictResult.hasConflict
    ? Math.round(conflictResult.overallConfidence * 0.05)
    : Math.round(100 * 0.05)

  const totalScore = dayMasterStrength + patternInfluence + tenGodHarmony +
    fiveElementBalance + climateNeed + shenShaAssist + conflictAdjustment

  const dimensionSources: Record<string, string> = {
    dayMasterStrength: `日主${strengthResult.strengthLevel}（${strengthResult.strengthScore}分）× 30% — 《渊海子平》`,
    patternInfluence: primaryPattern
      ? `${primaryPattern.name}成格度${primaryPattern.formScore} × 20% — 《子平真诠》`
      : '未识别格局，取中值 × 20%',
    tenGodHarmony: `十神平衡度${Math.round(tenGodBalance)} × 15% — 《渊海子平》`,
    fiveElementBalance: `五行平衡${strengthResult.dimensionScores.fiveElementBalance} × 15% — 《滴天髓》`,
    climateNeed: `调候评分${climateAnalysis.climateScore} × 10% — 《穷通宝鉴》`,
    shenShaAssist: '神煞辅助（预留接口）× 5%',
    conflictAdjustment: conflictResult.hasConflict
      ? `冲突可信度${conflictResult.overallConfidence} × 5%`
      : '无冲突 × 5%',
  }

  const step = createTreeNode({
    id: 'xiyong-score-detail',
    name: '喜用神评分明细',
    input: {},
    output: {
      totalScore,
      dayMasterStrength,
      patternInfluence,
      tenGodHarmony,
      fiveElementBalance,
      climateNeed,
      shenShaAssist,
      conflictAdjustment,
    },
    confidence: 0.85,
    ruleDescription: '按七维度加权计算喜用神综合评分',
    source: '渊海子平',
  })
  steps.push(step)

  return {
    dayMasterStrength,
    patternInfluence,
    tenGodHarmony,
    fiveElementBalance,
    climateNeed,
    shenShaAssist,
    conflictAdjustment,
    totalScore,
    dimensionSources,
  }
}

// ─── 9. calculateXiYong — 主引擎入口 ───

/**
 * 喜用神引擎主入口
 *
 * 完整流程：
 * 1. 缓存检查
 * 2. 构建上下文
 * 3. 判定日主强弱
 * 4. 调候分析
 * 5. 扶抑分析
 * 6. 确定喜用神分组
 * 7. 多流派喜用神
 * 8. 冲突解析
 * 9. 评分明细
 * 10. 组装输出
 * 11. 写入缓存
 * 12. 返回结果
 *
 * @param pillars 四柱结果（Module 1）
 * @param tenGodOutput 十神结果（Module 3）
 * @param patternOutput 格局结果（Module 4）
 * @param options 引擎选项
 * @returns 喜用神引擎输出
 */
export function calculateXiYong(
  pillars: ProfessionalFourPillarsResult,
  tenGodOutput: TenGodEngineOutput,
  patternOutput: PatternEngineOutput,
  options: XiYongEngineOptions,
): XiYongEngineOutput {
  const startTime = performance.now()
  const config = options.config ?? CLASSIC_CONFIG
  const schoolConfig = options.schoolConfig ?? DEFAULT_SCHOOL_CONFIG
  const steps: DerivationStep[] = []
  const warnings: string[] = []

  // ─── 1. 缓存检查 ───
  const cacheKey = `${XIYONG_CACHE_VERSION}:${pillars.dayMaster}:${pillars.sixLines.year.gan}${pillars.sixLines.year.zhi}:${pillars.sixLines.month.gan}${pillars.sixLines.month.zhi}:${pillars.sixLines.day.gan}${pillars.sixLines.day.zhi}:${pillars.sixLines.hour.gan}${pillars.sixLines.hour.zhi}`
  const cached = cache.get(cacheKey)
  if (cached) {
    return cached
  }

  // ─── 2. 构建上下文 ───
  const ctx = buildStrengthContext(pillars, tenGodOutput, patternOutput, config, steps)

  // ─── 3. 判定日主强弱 ───
  const strengthResult = determineStrength(ctx, steps)

  // ─── 4. 调候分析 ───
  const climateAnalysis = determineClimate(ctx.monthBranch, ctx, steps)

  // ─── 5. 扶抑分析 ───
  const fuYiAnalysis = evaluateFuYiMethods(ctx, strengthResult, climateAnalysis, steps)

  // ─── 6. 确定喜用神分组 ───
  const xiYongGroup = determineXiYongGroup(ctx, strengthResult, steps)

  // ─── 7. 多流派喜用神 ───
  const schoolResults = evaluateSchools(
    ctx, strengthResult, xiYongGroup, climateAnalysis, fuYiAnalysis,
    schoolConfig, steps,
  )

  // ─── 8. 冲突解析 ───
  const conflictResult = resolveConflicts(schoolResults, steps)

  // MULTI_RULE_CONFLICT: 流派喜用神存在冲突
  if (conflictResult.hasConflict) {
    warnings.push('MULTI_RULE_CONFLICT')
  }

  // LOW_CONFIDENCE: 总体可信度过低
  if (strengthResult.confidence < 50) {
    warnings.push('LOW_CONFIDENCE')
  }

  // ─── 9. 评分明细 ───
  const scoreDetail = calculateXiYongScoreDetail(
    ctx, strengthResult, climateAnalysis, fuYiAnalysis, conflictResult, steps,
  )

  // ─── 10. 组装输出 ───
  const endTime = performance.now()
  const computeTimeMs = Math.round((endTime - startTime) * 100) / 100

  // 主喜神/用神/忌神
  const primaryXiShen: FiveElement | null = conflictResult.recommendedXiShen[0] ?? null
  const primaryYongShen: FiveElement | null = conflictResult.recommendedYongShen[0] ?? null
  const primaryJiShen: FiveElement | null = xiYongGroup.jiShen[0]?.element ?? null

  // 总体可信度
  const overallConfidence = Math.round(
    (strengthResult.confidence * 0.35 +
     climateAnalysis.confidence * 0.10 +
     fuYiAnalysis.overallScore * 0.15 +
     conflictResult.overallConfidence * 0.20 +
     (patternOutput.overallConfidence * 0.20)),
  )

  const derivation = createChain(steps, computeTimeMs, {
    engineVersion: XIYONG_ENGINE_VERSION,
    algorithmVersion: 'v5.0-xiyong',
    warnings,
  })

  const output: XiYongEngineOutput = {
    version: XIYONG_ENGINE_VERSION,
    dayMaster: pillars.dayMaster,
    dayMasterElement: pillars.dayMasterElement,
    strength: strengthResult,
    xiYongGroup,
    climateAnalysis,
    fuYiAnalysis,
    schoolResults,
    conflictResult,
    scoreDetail,
    overallXiYongScore: scoreDetail.totalScore,
    overallConfidence,
    primaryXiShen,
    primaryYongShen,
    primaryJiShen,
    schoolConfig,
    warnings,
    computeTimeMs,
    executionMetadata: {
      executionTime: computeTimeMs,
      ruleCount: steps.length,
      matchedRules: steps.filter(s => s.confidence >= 0.5).length,
      evaluatedSchools: schoolConfig.filter(sc => sc.enabled).length,
      fuYiMethods: fuYiAnalysis.methods.length,
      climateScore: climateAnalysis.climateScore,
    },
    cacheVersion: XIYONG_CACHE_VERSION,
    derivation,
  }

  // ─── 11. 写入缓存 ───
  cache.set(cacheKey, output)

  // ─── 12. 返回结果 ───
  return output
}

// ─── 10. generateXiYongExplain ───

/**
 * 喜用神 AI 解释生成
 *
 * 从知识库获取喜用神的详细解释数据，包括：
 * 古籍依据、现代解释、事业/财富/婚姻/健康建议等。
 *
 * @param item 喜用神条目
 * @returns 结构化解释输出
 */
export function generateXiYongExplain(item: XiYongShenItem): XiYongExplainOutput {
  // 尝试从知识库获取
  let kbEntry = getXiYongKnowledge(item.element)

  // 如果知识库无数据，使用内置默认解释
  const defaultExplain: XiYongExplainOutput = {
    element: item.element,
    role: item.role,
    classicalBasis: item.classicalReference ? [item.classicalReference] : [],
    modernInterpretation: '',
    career: [],
    wealth: [],
    marriage: [],
    health: [],
    risks: [],
    suggestions: [],
    keywords: [],
    tags: [],
    aiSummary: '',
  }

  if (!kbEntry) {
    kbEntry = {
      element: item.element,
      keywords: [`${item.element}`, `${item.role}`, '喜用神'],
      classicalBasis: item.classicalReference ? [item.classicalReference] : [],
      modernInterpretation: `${item.element}作为${item.role}，${item.reason}`,
      career: generateCareerAdvice(item.element, item.role),
      wealth: generateWealthAdvice(item.element, item.role),
      marriage: generateMarriageAdvice(item.element, item.role),
      health: generateHealthAdvice(item.element, item.role),
      risks: generateRisks(item.element, item.role),
      suggestions: generateSuggestions(item.element, item.role),
      tags: [item.role, item.element, '命理分析'],
    }
  }

  // 构建综合建议
  const careerAdvice = kbEntry.career.length > 0 ? kbEntry.career : defaultExplain.career
  const wealthAdvice = kbEntry.wealth.length > 0 ? kbEntry.wealth : defaultExplain.wealth
  const marriageAdvice = kbEntry.marriage.length > 0 ? kbEntry.marriage : defaultExplain.marriage
  const healthAdvice = kbEntry.health.length > 0 ? kbEntry.health : defaultExplain.health
  const riskList = kbEntry.risks.length > 0 ? kbEntry.risks : defaultExplain.risks
  const suggestionList = kbEntry.suggestions.length > 0 ? kbEntry.suggestions : defaultExplain.suggestions

  const aiSummary = buildAiSummary(item, kbEntry)

  return {
    element: item.element,
    role: item.role,
    classicalBasis: kbEntry.classicalBasis.length > 0 ? kbEntry.classicalBasis : defaultExplain.classicalBasis,
    modernInterpretation: kbEntry.modernInterpretation || defaultExplain.modernInterpretation,
    career: careerAdvice,
    wealth: wealthAdvice,
    marriage: marriageAdvice,
    health: healthAdvice,
    risks: riskList,
    suggestions: suggestionList,
    keywords: kbEntry.keywords,
    tags: kbEntry.tags,
    aiSummary,
  }
}

/** 内置事业建议 */
function generateCareerAdvice(element: FiveElement, role: ShenRole): string[] {
  const careerMap: Record<FiveElement, string[]> = {
    '木': ['教育培训', '文学创作', '农业林业', '行政管理'],
    '火': ['电子科技', '文化传媒', '餐饮服务', '能源行业'],
    '土': ['房地产', '建筑工程', '农业种植', '矿业资源'],
    '金': ['金融投资', '法律司法', '机械制造', '医疗器械'],
    '水': ['物流运输', '旅游服务', '咨询顾问', '水产养殖'],
  }
  if (role === '忌神' || role === '仇神') {
    return careerMap[element].map(c => `避免从事${c}相关行业`)
  }
  return careerMap[element].map(c => `适合从事${c}相关行业`)
}

/** 内置财富建议 */
function generateWealthAdvice(element: FiveElement, role: ShenRole): string[] {
  if (role === '喜神' || role === '用神') {
    return [
      `${element}为${role}，财运有助`,
      `可向${element}方位求财`,
      `宜用${element}色系物品`,
    ]
  }
  return [
    `${element}为${role}，需谨慎理财`,
    `避免${element}方位的冲动投资`,
  ]
}

/** 内置婚姻建议 */
function generateMarriageAdvice(element: FiveElement, role: ShenRole): string[] {
  if (role === '喜神' || role === '用神') {
    return [
      `配偶五行宜${element}`,
      `婚姻宫若有${element}则婚姻顺遂`,
    ]
  }
  return [
    `配偶五行忌${element}`,
    `婚姻中需注意${element}相关方面的摩擦`,
  ]
}

/** 内置健康建议 */
function generateHealthAdvice(element: FiveElement, role: ShenRole): string[] {
  const organMap: Record<FiveElement, string> = {
    '木': '肝胆',
    '火': '心脏小肠',
    '土': '脾胃',
    '金': '肺大肠',
    '水': '肾膀胱',
  }
  if (role === '忌神' || role === '仇神') {
    return [`注意${organMap[element]}方面的健康问题`]
  }
  return [`${organMap[element]}功能较好，但仍需保养`]
}

/** 内置风险提示 */
function generateRisks(element: FiveElement, role: ShenRole): string[] {
  if (role === '忌神' || role === '仇神') {
    return [`${element}过旺可能带来相关方面的不利影响`]
  }
  return []
}

/** 内置调整建议 */
function generateSuggestions(element: FiveElement, role: ShenRole): string[] {
  if (role === '喜神' || role === '用神') {
    return [
      `生活中可多接触${element}属性的事物`,
      `方位上可多在${element}方位活动`,
    ]
  }
  return [`应减少${element}属性事物的接触`]
}

/** 构建 AI 总结 */
function buildAiSummary(item: XiYongShenItem, kb: { modernInterpretation: string }): string {
  const parts: string[] = []
  parts.push(`${item.element}在此命局中为${item.role}。`)
  if (item.reason) {
    parts.push(item.reason)
  }
  if (kb.modernInterpretation) {
    parts.push(kb.modernInterpretation)
  }
  if (item.confidence >= 80) {
    parts.push(`判定可信度较高（${item.confidence}%）。`)
  } else if (item.confidence >= 60) {
    parts.push(`判定可信度中等（${item.confidence}%），建议参考其他维度的分析。`)
  } else {
    parts.push(`判定可信度较低（${item.confidence}%），仅供参考。`)
  }
  return parts.join('')
}

// ─── 11. 缓存管理 ───

/**
 * 清空喜用神引擎缓存
 */
export function clearXiYongCache(): void {
  cache.clear()
}

/**
 * 获取当前缓存条目数
 */
export function getXiYongCacheSize(): number {
  return cache.size
}