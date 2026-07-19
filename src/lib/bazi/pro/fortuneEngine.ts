/**
 * Module 6: 大运流年引擎 — 核心引擎
 *
 * 基于模块 1（四柱）、模块 3（十神）、模块 4（格局）、模块 5（喜用神）的
 * 综合数据，计算大运、流年、事件检测、多维评分与 AI 解释。
 *
 * 严格模式：禁止 any，禁止 @ts-ignore
 *
 * 典籍来源：
 * 《三命通会》明·万民英 — 大运起法、流年看法
 * 《滴天髓》明·京图 / 清·任铁樵注 — 大运流年吉凶判断
 * 《渊海子平》宋·徐升 — 大运与原局关系
 * 《子平真诠》清·沈孝瞻 — 大运喜忌
 */

import type { HeavenlyStem, EarthlyBranch, FiveElement, ShenShi } from '@/lib/core/types/base'
import { HEAVENLY_STEMS } from '@/lib/core/constants/stem'
import { EARTHLY_BRANCHES } from '@/lib/core/constants/branch'
import { CANG_GAN } from '@/lib/core/constants/canggan'
import type { ProfessionalFourPillarsResult, DerivationStep } from './types'
import { createChain, createTreeNode } from './types'
import type { ProfessionalConfig } from './config'
import { CLASSIC_CONFIG } from './config'
import type { TenGodEngineOutput } from './tenGodsTypes'
import type { PatternEngineOutput } from './patternTypes'
import type { XiYongEngineOutput } from './xiyongTypes'
import type {
  FortuneEngineOptions, FortuneEngineOutput,
  QiYunInfo, DaYunStep, LiuNianInfo, RelationInfo,
  FortuneEvent, FortuneScores,
  FortuneExplainOutput, FortuneExecutionMetadata,
} from './fortuneTypes'
import { detectRelations, FORTUNE_EVENT_RULES, getEventKB } from './fortuneDatabase'
import {
  getShenShi, getStemElement, getNaYin, getChangSheng, clamp,
} from './helpers'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const FORTUNE_ENGINE_VERSION = '6.0.0'
export const FORTUNE_CACHE_VERSION = '6.0.0'

// ═══════════════════════════════════════════
// 2. 缓存
// ═══════════════════════════════════════════

const fortuneCache = new Map<string, FortuneEngineOutput>()

// ═══════════════════════════════════════════
// 3. 内部工具函数
// ═══════════════════════════════════════════

/** 合并多个 RelationInfo 为一个综合关系 */
function mergeRelationInfo(...infos: RelationInfo[]): RelationInfo {
  return {
    chong: infos.flatMap((i) => i.chong),
    xing: infos.flatMap((i) => i.xing),
    hai: infos.flatMap((i) => i.hai),
    po: infos.flatMap((i) => i.po),
    he: infos.flatMap((i) => i.he),
    sanHe: infos.flatMap((i) => i.sanHe),
    sanHui: infos.flatMap((i) => i.sanHui),
    liuHe: infos.flatMap((i) => i.liuHe),
    ganChong: infos.flatMap((i) => i.ganChong),
    ganHe: infos.flatMap((i) => i.ganHe),
    fuYin: infos.flatMap((i) => i.fuYin),
    fanYin: infos.flatMap((i) => i.fanYin),
  }
}

/** 检查触发条件是否匹配当前状态 */
function checkTriggerMatch(
  trigger: string,
  shenShi: string,
  daYunShenShi: string,
  relations: RelationInfo,
  xiYongInfluence: string,
): boolean {
  // 检查十神名称是否出现在触发条件中
  if (trigger.includes(shenShi)) return true
  if (trigger.includes(daYunShenShi)) return true

  // 检查关系关键词
  if (relations.chong.length > 0 && /冲/.test(trigger)) return true
  if (relations.he.length > 0 && /合/.test(trigger)) return true
  if (relations.xing.length > 0 && /刑/.test(trigger)) return true
  if (relations.hai.length > 0 && /害/.test(trigger)) return true
  if (relations.ganChong.length > 0 && /冲/.test(trigger)) return true
  if (relations.ganHe.length > 0 && /合/.test(trigger)) return true

  // 检查喜用神关键词
  if (/喜用/.test(trigger) && xiYongInfluence === 'positive') return true
  if (/忌/.test(trigger) && xiYongInfluence === 'negative') return true

  // 检查十神关键词在触发条件中的出现
  const shenShiKeywords = [
    '正官', '七杀', '正印', '偏印', '正财', '偏财',
    '食神', '伤官', '比肩', '劫财', '比劫',
    '财星', '官星', '印星', '食伤',
  ]
  for (const kw of shenShiKeywords) {
    if (trigger.includes(kw) && (shenShi.includes(kw) || daYunShenShi.includes(kw))) {
      return true
    }
  }

  // 检查旺衰关键词
  if (/旺/.test(trigger) && relations.he.length > 0) return true
  if (/身旺/.test(trigger) && (shenShi === '比肩' || shenShi === '劫财')) return true
  if (/身弱/.test(trigger) && (shenShi === '正财' || shenShi === '七杀')) return true

  return false
}

/** 计算事件影响分值 */
function calcEventDelta(events: FortuneEvent[]): number {
  return events.reduce((sum, e) => {
    return e.opportunity
      ? sum + e.probability * 0.15
      : sum - e.probability * 0.15
  }, 0)
}

/** 计算喜用神关系信息 */
function buildXiYongRelationInfo(
  element: FiveElement,
  xiYongOutput: XiYongEngineOutput,
): import('./fortuneTypes').XiYongRelationInfo {
  const xiElements = xiYongOutput.xiYongGroup.xiShen.map((s) => s.element)
  const yongElements = xiYongOutput.xiYongGroup.yongShen.map((s) => s.element)
  const jiElements = xiYongOutput.xiYongGroup.jiShen.map((s) => s.element)

  const isXiShen = xiElements.includes(element)
  const isYongShen = yongElements.includes(element)
  const isJiShen = jiElements.includes(element)

  let influence: 'positive' | 'negative' | 'neutral' = 'neutral'
  if (isXiShen || isYongShen) influence = 'positive'
  else if (isJiShen) influence = 'negative'

  const descriptionParts: string[] = []
  if (isXiShen) descriptionParts.push(`为喜神${element}`)
  if (isYongShen) descriptionParts.push(`为用神${element}`)
  if (isJiShen) descriptionParts.push(`为忌神${element}`)
  if (descriptionParts.length === 0) descriptionParts.push(`${element}为闲神/仇神`)

  return {
    isXiShen,
    isYongShen,
    isJiShen,
    element,
    influence,
    description: descriptionParts.join('，'),
  }
}

/** 计算大运/流年五行力量分布 */
function buildFiveElementPower(
  gan: HeavenlyStem,
  zhi: EarthlyBranch,
): Record<string, number> {
  const ganElement = getStemElement(gan)
  const cangGanInfo = CANG_GAN[zhi]
  const benElement = getStemElement(cangGanInfo.ben)
  const zhongElement = cangGanInfo.zhong ? getStemElement(cangGanInfo.zhong) : null
  const yaoElement = cangGanInfo.yao ? getStemElement(cangGanInfo.yao) : null

  const power: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  const { benWeight = 0.6, zhongWeight = 0.3, yaoWeight = 0.1 } = CLASSIC_CONFIG.hiddenStem
  power[ganElement] += 100  // 天干权重固定100
  power[benElement] += Math.round(benWeight * 100)  // 60
  if (zhongElement) power[zhongElement] += Math.round(zhongWeight * 100)  // 30
  if (yaoElement) power[yaoElement] += Math.round(yaoWeight * 100)  // 10

  return power
}

/** 计算单柱运势评分 */
function calculatePillarFortuneScore(
  xiYongInfluence: 'positive' | 'negative' | 'neutral',
  changSheng: string,
  shenShi: ShenShi,
  relations: RelationInfo,
): number {
  let score = 50

  // 喜用神影响（权重最高）
  if (xiYongInfluence === 'positive') score += 20
  else if (xiYongInfluence === 'negative') score -= 20

  // 十二长生阶段
  const goodStages = ['长生', '帝旺', '临官', '冠带']
  const badStages = ['死', '绝', '墓', '病']
  if (goodStages.includes(changSheng)) score += 10
  else if (badStages.includes(changSheng)) score -= 10

  // 十神性质
  const favorableShenShi: ShenShi[] = ['正官', '正印', '正财', '食神']
  const unfavorableShenShi: ShenShi[] = ['偏官', '劫财']
  if (favorableShenShi.includes(shenShi)) score += 8
  else if (unfavorableShenShi.includes(shenShi)) score -= 5

  // 关系加减分
  const negativeCount = relations.chong.length + relations.xing.length +
    relations.hai.length + relations.fanYin.length + relations.ganChong.length
  const positiveCount = relations.he.length + relations.ganHe.length + relations.liuHe.length

  score += positiveCount * 5
  score -= negativeCount * 5

  return clamp(Math.round(score), 0, 100)
}

// ═══════════════════════════════════════════
// 4. 大运干支生成
// ═══════════════════════════════════════════

/**
 * 生成大运干支序列
 *
 * 算法：
 * - 顺行（阳男/阴女）：天干地支各从月干月支的下一个开始，每步 +1
 * - 逆行（阴男/阳女）：天干地支各从月干月支的上一个开始，每步 -1
 *
 * @param dayGan  月干（作为天干推演起点）
 * @param monthZhi  月支（作为地支推演起点）
 * @param isShun  是否顺行
 * @param steps  步数
 * @returns 大运干支数组
 */
export function generateDaYunGanZhi(
  dayGan: HeavenlyStem,
  monthZhi: EarthlyBranch,
  isShun: boolean,
  steps: number,
): Array<{ gan: HeavenlyStem; zhi: EarthlyBranch }> {
  const stemIdx = HEAVENLY_STEMS.indexOf(dayGan)
  const branchIdx = EARTHLY_BRANCHES.indexOf(monthZhi)

  const result: Array<{ gan: HeavenlyStem; zhi: EarthlyBranch }> = []

  for (let i = 1; i <= steps; i++) {
    const offset = isShun ? i : -i
    const gan = HEAVENLY_STEMS[((stemIdx + offset) % 10 + 10) % 10]
    const zhi = EARTHLY_BRANCHES[((branchIdx + offset) % 12 + 12) % 12]
    result.push({ gan, zhi })
  }

  return result
}

// ═══════════════════════════════════════════
// 5. 起运信息计算
// ═══════════════════════════════════════════

/**
 * 计算起运信息
 *
 * 起运方向：阳男/阴女顺行，阴男/阳女逆行
 * 起运年龄：简化计算，经典算法默认 5 岁
 *
 * @param birthDate  出生日期
 * @param dayMaster  日主天干
 * @param gender  性别（'male' | 'female'）
 * @param options  选项
 * @returns 起运信息
 */
export function calculateQiYunInfo(
  birthDate: Date,
  dayMaster: HeavenlyStem,
  gender: string,
  options: { algorithm?: 'classic' | 'modern'; config?: ProfessionalConfig },
): QiYunInfo {
  const dayGanIdx = HEAVENLY_STEMS.indexOf(dayMaster)
  const isYang = dayGanIdx % 2 === 0
  const isMale = gender === 'male'
  const isShun = (isYang && isMale) || (!isYang && !isMale)

  const birthYear = birthDate.getFullYear()
  const algorithm = options.algorithm ?? 'classic'

  // 起运年龄：经典算法默认 5 岁；现代算法按简化公式
  const startAge = algorithm === 'classic'
    ? 5
    : (Math.abs(new Date().getFullYear() - birthYear) % 7) + 3

  const startYear = birthYear + startAge
  const startDate = `${startYear}-01-01`

  return {
    startAge,
    startYear,
    startDate,
    isShun,
    algorithm,
    fromTerm: '',
    toTerm: '',
    confidence: 80,
  }
}

// ═══════════════════════════════════════════
// 6. 流年干支计算
// ═══════════════════════════════════════════

/**
 * 计算指定公历年份的流年干支
 *
 * 公式：年干 = HEAVENLY_STEMS[(year - 4) % 10]
 *       年支 = EARTHLY_BRANCHES[(year - 4) % 12]
 *
 * @param year  公历年份
 * @returns 流年干支
 */
export function calculateLiuNianGanZhi(
  year: number,
): { gan: HeavenlyStem; zhi: EarthlyBranch } {
  const gan = HEAVENLY_STEMS[((year - 4) % 10 + 10) % 10]
  const zhi = EARTHLY_BRANCHES[((year - 4) % 12 + 12) % 12]
  return { gan, zhi }
}

// ═══════════════════════════════════════════
// 7. 构建大运步骤详情
// ═══════════════════════════════════════════

/**
 * 构建单步大运的完整信息
 *
 * 包括：十神、纳音、长生、五行力量、与原局关系、与格局关系、与喜用神关系
 */
function buildDaYunStep(
  index: number,
  startAge: number,
  endAge: number,
  startYear: number,
  endYear: number,
  ganZhi: { gan: HeavenlyStem; zhi: EarthlyBranch },
  dayMaster: HeavenlyStem,
  pillars: ProfessionalFourPillarsResult,
  patternOutput: PatternEngineOutput,
  xiYongOutput: XiYongEngineOutput,
  traceSteps: DerivationStep[],
  config: ProfessionalConfig,
): DaYunStep {
  // ── 十神 ──
  const shenShi = getShenShi(dayMaster, ganZhi.gan) as ShenShi

  // ── 纳音 ──
  const naYin = getNaYin(ganZhi.gan, ganZhi.zhi)

  // ── 十二长生 ──
  const changSheng = getChangSheng(dayMaster, ganZhi.zhi)

  // ── 神煞（暂留空，由独立神煞模块填充） ──
  const shenSha: string[] = []

  // ── 五行力量：天干 100 + 地支藏干（本气 60、中气 30、余气 10） ──
  const fiveElementPower = buildFiveElementPower(ganZhi.gan, ganZhi.zhi)

  // ── 与原局四柱关系 ──
  const yearRel = detectRelations(
    ganZhi.gan, ganZhi.zhi,
    pillars.sixLines.year.gan, pillars.sixLines.year.zhi,
  )
  const monthRel = detectRelations(
    ganZhi.gan, ganZhi.zhi,
    pillars.sixLines.month.gan, pillars.sixLines.month.zhi,
  )
  const dayRel = detectRelations(
    ganZhi.gan, ganZhi.zhi,
    pillars.sixLines.day.gan, pillars.sixLines.day.zhi,
  )
  const hourRel = detectRelations(
    ganZhi.gan, ganZhi.zhi,
    pillars.sixLines.hour.gan, pillars.sixLines.hour.zhi,
  )
  const originalRelations = mergeRelationInfo(yearRel, monthRel, dayRel, hourRel)

  // ── 与格局关系 ──
  const patternRelations: string[] = []
  if (patternOutput.primaryPattern) {
    const pp = patternOutput.primaryPattern
    if (pp.risks.some(r => r.includes(shenShi))) {
      patternRelations.push(
        `${ganZhi.gan}${ganZhi.zhi}大运引动${pp.name}格局用神${shenShi}`,
      )
    }
    const daYunElement = getStemElement(ganZhi.gan)
    const xiYongInfo = buildXiYongRelationInfo(daYunElement, xiYongOutput)
    if (xiYongInfo.influence === 'positive') {
      patternRelations.push(
        `${ganZhi.gan}${ganZhi.zhi}大运喜用到位，助益${pp.name}格局`,
      )
    } else if (xiYongInfo.influence === 'negative') {
      patternRelations.push(
        `${ganZhi.gan}${ganZhi.zhi}大运忌神到位，不利${pp.name}格局`,
      )
    }
  }

  // ── 与喜用神关系 ──
  const daYunElement = getStemElement(ganZhi.gan)
  const xiYongRelations = buildXiYongRelationInfo(daYunElement, xiYongOutput)

  // ── 总运势评分 ──
  const fortuneScore = calculatePillarFortuneScore(
    xiYongRelations.influence, changSheng, shenShi, originalRelations,
  )

  // ── 推导链步骤 ──
  const step = createTreeNode({
    id: `dayun-step-${index}`,
    name: `大运第${index + 1}步`,
    input: {
      ganZhi: `${ganZhi.gan}${ganZhi.zhi}`,
      index,
      startAge,
      endAge,
    },
    output: {
      shenShi,
      naYin,
      changSheng,
      xiYongInfluence: xiYongRelations.influence,
      fortuneScore,
    },
    confidence: 0.8,
    ruleDescription: `大运${ganZhi.gan}${ganZhi.zhi}：${shenShi}主事，${naYin}，${changSheng}`,
    source: '三命通会',
    algorithmVersion: config.algorithmVersion,
  })
  traceSteps.push(step)

  return {
    index,
    startAge,
    endAge,
    startYear,
    endYear,
    ganZhi,
    naYin,
    shenShi,
    changSheng,
    shenSha,
    fiveElementPower,
    originalRelations,
    patternRelations,
    xiYongRelations,
    fortuneScore,
  }
}

// ═══════════════════════════════════════════
// 8. 构建流年详情
// ═══════════════════════════════════════════

/**
 * 构建单年流年的完整信息
 *
 * 包括：十神、长生、五行力量、与原局关系、与当前大运关系、三层综合关系
 */
function buildLiuNianInfo(
  year: number,
  ganZhi: { gan: HeavenlyStem; zhi: EarthlyBranch },
  dayMaster: HeavenlyStem,
  pillars: ProfessionalFourPillarsResult,
  currentDaYun: DaYunStep,
  xiYongOutput: XiYongEngineOutput,
  traceSteps: DerivationStep[],
  config: ProfessionalConfig,
): LiuNianInfo {
  // ── 十神 ──
  const shenShi = getShenShi(dayMaster, ganZhi.gan) as ShenShi

  // ── 十二长生 ──
  const changSheng = getChangSheng(dayMaster, ganZhi.zhi)

  // ── 神煞（暂留空） ──
  const shenSha: string[] = []

  // ── 五行力量 ──
  const fiveElementPower = buildFiveElementPower(ganZhi.gan, ganZhi.zhi)

  // ── 与原局四柱关系 ──
  const yearRel = detectRelations(
    ganZhi.gan, ganZhi.zhi,
    pillars.sixLines.year.gan, pillars.sixLines.year.zhi,
  )
  const monthRel = detectRelations(
    ganZhi.gan, ganZhi.zhi,
    pillars.sixLines.month.gan, pillars.sixLines.month.zhi,
  )
  const dayRel = detectRelations(
    ganZhi.gan, ganZhi.zhi,
    pillars.sixLines.day.gan, pillars.sixLines.day.zhi,
  )
  const hourRel = detectRelations(
    ganZhi.gan, ganZhi.zhi,
    pillars.sixLines.hour.gan, pillars.sixLines.hour.zhi,
  )
  const originalRelations = mergeRelationInfo(yearRel, monthRel, dayRel, hourRel)

  // ── 与当前大运关系 ──
  const daYunRelations = detectRelations(
    ganZhi.gan, ganZhi.zhi,
    currentDaYun.ganZhi.gan, currentDaYun.ganZhi.zhi,
  )

  // ── 三层综合关系：原局 + 大运 + 流年 ──
  const overallRelations = mergeRelationInfo(originalRelations, daYunRelations)

  // ── 吉凶评分 ──
  const liuNianElement = getStemElement(ganZhi.gan)
  const xiYongInfo = buildXiYongRelationInfo(liuNianElement, xiYongOutput)
  const luckScore = calculatePillarFortuneScore(
    xiYongInfo.influence, changSheng, shenShi, overallRelations,
  )

  // ── 推导链步骤 ──
  const step = createTreeNode({
    id: `liunian-${year}`,
    name: `流年${year}年`,
    input: {
      year,
      ganZhi: `${ganZhi.gan}${ganZhi.zhi}`,
      daYunGanZhi: `${currentDaYun.ganZhi.gan}${currentDaYun.ganZhi.zhi}`,
    },
    output: {
      shenShi,
      changSheng,
      luckScore,
      xiYongInfluence: xiYongInfo.influence,
    },
    confidence: 0.75,
    ruleDescription: `${year}年${ganZhi.gan}${ganZhi.zhi}：${shenShi}主事，${changSheng}`,
    source: '滴天髓',
    algorithmVersion: config.algorithmVersion,
  })
  traceSteps.push(step)

  return {
    year,
    ganZhi,
    shenShi,
    changSheng,
    shenSha,
    fiveElementPower,
    originalRelations,
    daYunRelations,
    overallRelations,
    luckScore,
  }
}

// ═══════════════════════════════════════════
// 9. 事件检测
// ═══════════════════════════════════════════

/**
 * 基于流年/大运的十神和关系，检测可能发生的事件
 *
 * 对 15 种事件类型的规则逐一匹配：
 * 1. 流年十神是否命中事件关键词
 * 2. 冲合刑害关系是否触发事件
 * 3. 计算每个事件的 probability / reasons / confidence
 */
export function detectEvents(
  liuNian: LiuNianInfo,
  daYun: DaYunStep,
  dayMaster: HeavenlyStem,
  gender: string,
  traceSteps: DerivationStep[],
): FortuneEvent[] {
  const events: FortuneEvent[] = []

  // 当前喜用神影响方向
  const xiYongInfluence = daYun.xiYongRelations.influence
  const genderLabel = gender === 'male' ? '男命' : '女命'

  for (const rule of FORTUNE_EVENT_RULES) {
    let positiveMatchCount = 0
    let negativeMatchCount = 0
    const matchedReasons: string[] = []

    // 检查正向触发条件
    for (const trigger of rule.positiveTriggers) {
      const matched = checkTriggerMatch(
        trigger,
        liuNian.shenShi,
        daYun.shenShi,
        liuNian.overallRelations,
        xiYongInfluence,
      )
      if (matched) {
        positiveMatchCount++
        matchedReasons.push(trigger)
      }
    }

    // 检查负向触发条件
    for (const trigger of rule.negativeTriggers) {
      const matched = checkTriggerMatch(
        trigger,
        liuNian.shenShi,
        daYun.shenShi,
        liuNian.overallRelations,
        xiYongInfluence,
      )
      if (matched) {
        negativeMatchCount++
        matchedReasons.push(trigger)
      }
    }

    // 只有命中至少一个条件才生成事件
    if (positiveMatchCount > 0 || negativeMatchCount > 0) {
      const netScore = positiveMatchCount - negativeMatchCount
      const probability = clamp(50 + netScore * 15, 5, 95)
      const confidence = clamp(40 + (positiveMatchCount + negativeMatchCount) * 10, 20, 90)
      const isOpportunity = netScore > 0

      let severity: 'high' | 'medium' | 'low' = 'low'
      if (negativeMatchCount >= 2) severity = 'high'
      else if (negativeMatchCount >= 1) severity = 'medium'

      // 推导链步骤
      const traceStep = createTreeNode({
        id: `event-${rule.type}-${liuNian.year}`,
        name: `事件检测: ${rule.type}`,
        input: {
          eventType: rule.type,
          year: liuNian.year,
          dayMaster,
          shenShi: liuNian.shenShi,
          daYunShenShi: daYun.shenShi,
          xiYongInfluence,
          gender: genderLabel,
        },
        output: {
          probability: Math.round(probability),
          confidence: Math.round(confidence),
          opportunity: isOpportunity,
          severity,
          matchedTriggers: matchedReasons,
        },
        confidence: confidence / 100,
        ruleDescription: rule.classicalReference,
        source: 'Expert System',
        algorithmVersion: 'v1.0-classic',
      })
      traceSteps.push(traceStep)

      // 构建事件推导链
      const eventChain = createChain([traceStep], 0, {
        engineVersion: FORTUNE_ENGINE_VERSION,
      })

      events.push({
        type: rule.type,
        probability: Math.round(probability),
        reasons: matchedReasons,
        traceChain: eventChain,
        confidence: Math.round(confidence),
        year: liuNian.year,
        severity,
        opportunity: isOpportunity,
      })
    }
  }

  return events
}

// ═══════════════════════════════════════════
// 10. 多维评分
// ═══════════════════════════════════════════

/**
 * 计算流年/大运的多维度运势评分
 *
 * 九个维度：总运势、吉凶、事业、财运、人际关系、健康、学业、机遇、风险
 * 所有评分 0-100
 */
export function calculateFortuneScores(
  liuNian: LiuNianInfo,
  events: FortuneEvent[],
  daYun: DaYunStep,
): FortuneScores {
  // 基础分：流年吉凶 40% + 大运总评分 30% + 基线 30
  const baseScore = liuNian.luckScore * 0.4 + daYun.fortuneScore * 0.3 + 30

  // 事件影响
  const positiveEvents = events.filter((e) => e.opportunity)
  const negativeEvents = events.filter((e) => !e.opportunity)

  const positiveImpact = positiveEvents.reduce(
    (sum, e) => sum + e.probability * 0.15, 0,
  )
  const negativeImpact = negativeEvents.reduce(
    (sum, e) => sum + e.probability * 0.15, 0,
  )

  // 关系影响
  const chongCount = liuNian.overallRelations.chong.length +
    liuNian.overallRelations.ganChong.length
  const heCount = liuNian.overallRelations.he.length +
    liuNian.overallRelations.ganHe.length
  const xingCount = liuNian.overallRelations.xing.length
  const haiCount = liuNian.overallRelations.hai.length
  const relationDelta = (heCount * 3) - (chongCount * 4 + xingCount * 3 + haiCount * 2)

  const fortuneScore = clamp(
    Math.round(baseScore + positiveImpact - negativeImpact + relationDelta),
    0, 100,
  )
  const luckScore = clamp(Math.round(liuNian.luckScore), 0, 100)

  // 分维度事件筛选
  const careerEvents = events.filter(
    (e) => e.type === '事业' || e.type === '升迁' || e.type === '创业',
  )
  const wealthEvents = events.filter(
    (e) => e.type === '财运' || e.type === '投资' || e.type === '破财',
  )
  const relationEvents = events.filter(
    (e) => e.type === '婚姻' || e.type === '恋爱',
  )
  const healthEvents = events.filter(
    (e) => e.type === '疾病',
  )
  const studyEvents = events.filter(
    (e) => e.type === '考试',
  )

  // 十神对维度的加成
  const careerShenShiBonus =
    (liuNian.shenShi === '正官' || liuNian.shenShi === '偏官') ? 5 : 0
  const wealthShenShiBonus =
    (liuNian.shenShi === '正财' || liuNian.shenShi === '偏财') ? 5 : 0
  const studyShenShiBonus =
    (liuNian.shenShi === '正印' || liuNian.shenShi === '偏印') ? 5 : 0

  return {
    fortuneScore,
    luckScore,
    careerScore: clamp(
      Math.round(baseScore + calcEventDelta(careerEvents) + careerShenShiBonus),
      0, 100,
    ),
    wealthScore: clamp(
      Math.round(baseScore + calcEventDelta(wealthEvents) + wealthShenShiBonus),
      0, 100,
    ),
    relationshipScore: clamp(
      Math.round(baseScore + calcEventDelta(relationEvents)),
      0, 100,
    ),
    healthScore: clamp(
      Math.round(baseScore + calcEventDelta(healthEvents) - chongCount * 3 - xingCount * 2),
      0, 100,
    ),
    studyScore: clamp(
      Math.round(baseScore + calcEventDelta(studyEvents) + studyShenShiBonus),
      0, 100,
    ),
    opportunityScore: clamp(
      Math.round(50 + positiveImpact * 2),
      0, 100,
    ),
    riskScore: clamp(
      Math.round(50 + negativeImpact * 2),
      0, 100,
    ),
  }
}

// ═══════════════════════════════════════════
// 11. AI 解释生成
// ═══════════════════════════════════════════

/**
 * 生成流年运势的结构化 AI 解释
 *
 * 包括：古籍依据、白话解释、风险提示、机遇提示、建议、调整方案
 */
export function generateFortuneExplain(
  liuNian: LiuNianInfo,
  events: FortuneEvent[],
  scores: FortuneScores,
): FortuneExplainOutput {
  const yearGanZhi = liuNian.ganZhi.gan + liuNian.ganZhi.zhi

  const classicalBasis: string[] = []
  const risks: string[] = []
  const opportunities: string[] = []
  const suggestions: string[] = []
  const adjustments: string[] = []

  for (const event of events) {
    const kb = getEventKB(event.type)
    if (kb) {
      classicalBasis.push(...kb.classicalBasis)
      if (!event.opportunity) {
        risks.push(...kb.riskIndicators.slice(0, 2))
        adjustments.push(...kb.suggestions.filter(
          (s) => /避免|不宜|谨慎|防范/.test(s),
        ).slice(0, 2))
      } else {
        opportunities.push(...kb.opportunityIndicators.slice(0, 2))
        suggestions.push(...kb.suggestions.filter(
          (s) => /宜|适合|积极|抓住/.test(s),
        ).slice(0, 2))
      }
    }
  }

  // 去重
  const uniqueClassicalBasis = [...new Set(classicalBasis)]
  const uniqueRisks = [...new Set(risks)]
  const uniqueOpportunities = [...new Set(opportunities)]
  const uniqueSuggestions = [...new Set(suggestions)]
  const uniqueAdjustments = [...new Set(adjustments)]

  // 综合建议（基于评分）
  if (scores.healthScore < 40) {
    uniqueSuggestions.push('本年健康评分偏低，建议定期体检，注意作息规律')
    uniqueAdjustments.push('宜往喜用神方位调养，避免煞气方位')
  }
  if (scores.careerScore > 70) {
    uniqueSuggestions.push('本年事业运旺盛，适合争取晋升或承担重要项目')
  }
  if (scores.wealthScore < 40) {
    uniqueSuggestions.push('本年财运偏弱，宜保守理财，避免大额投资')
    uniqueAdjustments.push('可佩戴喜用五行之饰品以补财运')
  }

  // 白话解释
  const positiveCount = events.filter((e) => e.opportunity).length
  const negativeCount = events.filter((e) => !e.opportunity).length
  const explanationParts: string[] = [
    `${liuNian.year}年${yearGanZhi}，${liuNian.shenShi}主事。`,
    `流年十二长生为${liuNian.changSheng}。`,
  ]
  if (liuNian.overallRelations.chong.length > 0) {
    explanationParts.push(`原局有冲：${liuNian.overallRelations.chong.join('、')}。`)
  }
  if (liuNian.overallRelations.he.length > 0) {
    explanationParts.push(`流年有合：${liuNian.overallRelations.he.join('、')}。`)
  }
  if (positiveCount > 0) {
    explanationParts.push(`有利事件${positiveCount}项。`)
  }
  if (negativeCount > 0) {
    explanationParts.push(`需注意事件${negativeCount}项。`)
  }
  explanationParts.push(`综合运势评分${scores.fortuneScore}分。`)

  return {
    year: liuNian.year,
    yearGanZhi,
    classicalBasis: uniqueClassicalBasis,
    plainExplanation: explanationParts.join(''),
    risks: uniqueRisks,
    opportunities: uniqueOpportunities,
    suggestions: uniqueSuggestions,
    adjustments: uniqueAdjustments,
    events,
    scores,
  }
}

// ═══════════════════════════════════════════
// 12. 主引擎入口
// ═══════════════════════════════════════════

/**
 * 大运流年引擎 — 主入口
 *
 * 完整流程：
 * 1. 缓存检查
 * 2. 起运信息 → QiYunInfo
 * 3. 生成大运干支 → DaYunStep[]
 * 4. 生成流年干支 → LiuNianInfo[]
 * 5. 事件检测 → FortuneEvent[]
 * 6. 多维评分 → FortuneScores
 * 7. 组装输出 → FortuneEngineOutput
 * 8. 写入缓存
 * 9. 返回结果
 */
export function calculateFortune(
  pillars: ProfessionalFourPillarsResult,
  tenGodOutput: TenGodEngineOutput,
  patternOutput: PatternEngineOutput,
  xiYongOutput: XiYongEngineOutput,
  options: FortuneEngineOptions,
): FortuneEngineOutput {
  const startTime = Date.now()
  const traceSteps: DerivationStep[] = []
  const warnings: string[] = []

  const config = options.config ?? CLASSIC_CONFIG
  const daYunStepCount = options.daYunSteps ?? 8
  const algorithm = options.algorithm ?? 'classic'

  // ── 1. 缓存检查 ──
  const cacheKey = [
    FORTUNE_CACHE_VERSION,
    pillars.dayMaster,
    pillars.sixLines.year.gan, pillars.sixLines.year.zhi,
    pillars.sixLines.month.gan, pillars.sixLines.month.zhi,
    pillars.sixLines.day.gan, pillars.sixLines.day.zhi,
    pillars.sixLines.hour.gan, pillars.sixLines.hour.zhi,
    options.gender,
  ].join(':')

  const cached = fortuneCache.get(cacheKey)
  if (cached) {
    // CACHE_MISS 不适用于缓存命中
    return cached
  }
  // 缓存未命中
  warnings.push('CACHE_MISS')

  // ── 2. 起运信息 ──
  const qiYunInfo = calculateQiYunInfo(
    options.birthDate, pillars.dayMaster, options.gender,
    { algorithm, config },
  )
  traceSteps.push(createTreeNode({
    id: 'fortune-qiyun',
    name: '起运信息计算',
    input: {
      birthDate: options.birthDate.toISOString(),
      dayMaster: pillars.dayMaster,
      gender: options.gender,
      algorithm,
      dominantShenShi: tenGodOutput.dominantShenShi,
    },
    output: {
      isShun: qiYunInfo.isShun,
      startAge: qiYunInfo.startAge,
      startYear: qiYunInfo.startYear,
      confidence: qiYunInfo.confidence,
    },
    confidence: qiYunInfo.confidence / 100,
    ruleDescription: '阳男阴女顺行，阴男阳女逆行',
    source: '三命通会',
    algorithmVersion: config.algorithmVersion,
  }))

  // ── 3. 生成大运干支 ──
  const monthGan = pillars.sixLines.month.gan
  const monthZhi = pillars.sixLines.month.zhi
  const daYunGanZhiList = generateDaYunGanZhi(monthGan, monthZhi, qiYunInfo.isShun, daYunStepCount)

  // ── 4. 构建大运步骤 ──
  const daYunSteps: DaYunStep[] = []
  for (let i = 0; i < daYunGanZhiList.length; i++) {
    const startAge = qiYunInfo.startAge + i * 10
    const endAge = startAge + 9
    const startYear = qiYunInfo.startYear + i * 10
    const endYear = startYear + 9

    const step = buildDaYunStep(
      i, startAge, endAge, startYear, endYear,
      daYunGanZhiList[i],
      pillars.dayMaster, pillars, patternOutput, xiYongOutput,
      traceSteps, config,
    )
    daYunSteps.push(step)
  }

  // ── 5. 生成流年干支并构建详情 ──
  const totalYears = daYunStepCount * 10
  const liuNianStartYear = qiYunInfo.startYear
  const liuNianEndYear = liuNianStartYear + totalYears - 1
  const liuNianYears: LiuNianInfo[] = []
  let shenShaChecks = 0

  for (let year = liuNianStartYear; year <= liuNianEndYear; year++) {
    const ganZhi = calculateLiuNianGanZhi(year)

    // 查找当前年份所属大运
    const currentDaYun = daYunSteps.find(
      (dy) => year >= dy.startYear && year <= dy.endYear,
    ) ?? daYunSteps[0]

    const liuNian = buildLiuNianInfo(
      year, ganZhi,
      pillars.dayMaster, pillars, currentDaYun,
      xiYongOutput,
      traceSteps, config,
    )
    liuNianYears.push(liuNian)
    shenShaChecks += 4 // 四柱关系检测
  }

  // ── 6. 事件检测 ──
  const allEvents: FortuneEvent[] = []
  let rulesApplied = 0

  for (const liuNian of liuNianYears) {
    const currentDaYun = daYunSteps.find(
      (dy) => liuNian.year >= dy.startYear && liuNian.year <= dy.endYear,
    ) ?? daYunSteps[0]

    const yearEvents = detectEvents(
      liuNian, currentDaYun,
      pillars.dayMaster, options.gender,
      traceSteps,
    )
    allEvents.push(...yearEvents)
    rulesApplied += yearEvents.length
  }

  // ── 7. 多维评分（基于当前年份或最新年份） ──
  const currentYear = new Date().getFullYear()
  const currentLiuNian = liuNianYears.find((ln) => ln.year === currentYear)
    ?? liuNianYears[liuNianYears.length - 1]
  const currentDaYun = daYunSteps.find(
    (dy) => currentYear >= dy.startYear && currentYear <= dy.endYear,
  ) ?? daYunSteps[daYunSteps.length - 1]

  const currentEvents = allEvents.filter((e) => e.year === currentYear)
  const scores = calculateFortuneScores(currentLiuNian, currentEvents, currentDaYun)

  // ── 8. 组装输出 ──
  const computeTimeMs = Date.now() - startTime

  // PERFORMANCE_DEGRADED: 流年计算量大时发出性能警告
  if (liuNianYears.length > 50) {
    warnings.push('PERFORMANCE_DEGRADED')
  }

  const derivation = createChain(traceSteps, computeTimeMs, {
    engineVersion: FORTUNE_ENGINE_VERSION,
    algorithmVersion: config.algorithmVersion,
    warnings,
  })

  const executionMetadata: FortuneExecutionMetadata = {
    executionTime: computeTimeMs,
    daYunSteps: daYunStepCount,
    liuNianYears: liuNianYears.length,
    eventsDetected: allEvents.length,
    rulesApplied,
    shenShaChecks,
  }

  const output: FortuneEngineOutput = {
    version: FORTUNE_ENGINE_VERSION,
    dayMaster: pillars.dayMaster,
    dayMasterElement: pillars.dayMasterElement,
    qiYunInfo,
    daYunSteps,
    liuNianYears,
    events: allEvents,
    scores,
    warnings,
    computeTimeMs,
    executionMetadata,
    cacheVersion: FORTUNE_CACHE_VERSION,
    derivation,
  }

  // ── 9. 写入缓存 ──
  fortuneCache.set(cacheKey, output)

  return output
}

// ─── 缓存管理 ───

export function clearFortuneCache(): void { fortuneCache.clear() }
export function getFortuneCacheSize(): number { return fortuneCache.size }