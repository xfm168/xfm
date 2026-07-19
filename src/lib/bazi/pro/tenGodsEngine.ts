/**
 * H3 Module 3: Professional Ten Gods Engine — 主引擎
 *
 * 数据流：
 *   ProfessionalFourPillarsResult
 *       │
 *       ▼
 *   十神透藏分析（天干 + 藏干 → 十神映射）
 *       │
 *       ▼
 *   旺相休囚死 + 得令/得地/得势
 *       │
 *       ▼
 *   十神力量统计 + 评分
 *       │
 *       ▼
 *   十神关系网络（生克链）
 *       │
 *       ▼
 *   十神组合匹配（规则库）
 *       │
 *       ▼
 *   TenGodEngineOutput (JSON)
 */

import type {
  HeavenlyStem, EarthlyBranch, FiveElement,
  ShenShi, WuXingWangShuai,
} from '@/lib/core/types/base'
import { CANG_GAN } from '@/lib/core/constants/canggan'
import { WANG_SHUAI_TABLE, GENERATE, OVERCOME, BE_OVERCOME, BE_GENERATE } from '@/lib/core/constants/wuxing'
import type { ProfessionalFourPillarsResult, DerivationStep } from './types'
import { createChain } from './types'
import type { ProfessionalConfig } from './config'
import { CLASSIC_CONFIG } from './config'
import type {
  TenGodDetail, TenGodOccurrence, TouCangAnalysis,
  FiveElementPower, TenGodRelation, TenGodRelationNetwork,
  TenGodCombination, TenGodEngineOutput, PillarPosition,
  PowerBreakdown, TenGodState, PatternCandidate, ExecutionMetadata,
} from './tenGodsTypes'
import {
  TEN_GODS, TEN_GOD_CATEGORY, TEN_GOD_NATURE,
  TEN_GOD_SHENG_KE_CHAIN,
  TEN_GOD_RELATION_RULES, TEN_GOD_COMBINATION_RULES,
  generateTenGodExplain,
} from './tenGodsDatabase'
import { getShenShi, getStemElement, getBranchElement, calculateFiveElementCount } from './helpers'

export const TEN_GODS_ENGINE_VERSION = '3.1.0'
export const TEN_GODS_CACHE_VERSION = '3.1.0'

// ─── Step 1: 十神透藏分析 ───

/** 柱标签 */
const PILLAR_LABELS = ['年', '月', '日', '时'] as const
const LAYER_LABELS = ['本气', '中气', '余气'] as const
const LAYER_KEYS: ('ben' | 'zhong' | 'yao')[] = ['ben', 'zhong', 'yao']

function analyzeTouCang(
  yearGan: HeavenlyStem, yearZhi: EarthlyBranch,
  monthGan: HeavenlyStem, monthZhi: EarthlyBranch,
  dayGan: HeavenlyStem, dayZhi: EarthlyBranch,
  hourGan: HeavenlyStem, hourZhi: EarthlyBranch,
): TouCangAnalysis {
  const occurrences: TenGodOccurrence[] = []
  const touGanList: ShenShi[] = []
  const cangGanList: ShenShi[] = []

  const gans = [yearGan, monthGan, dayGan, hourGan]
  const zhis = [yearZhi, monthZhi, dayZhi, hourZhi]

  for (let i = 0; i < 4; i++) {
    // 天干 → 十神
    const ganShenShi = getShenShi(dayGan, gans[i])
    if (ganShenShi && ganShenShi !== '未知') {
      const ssName = ganShenShi as ShenShi
      const pos: PillarPosition = `${PILLAR_LABELS[i]}干`
      occurrences.push({
        name: ssName,
        category: TEN_GOD_CATEGORY[ssName],
        nature: TEN_GOD_NATURE[ssName],
        position: pos,
        stem: gans[i],
        layer: '天干',
      })
      touGanList.push(ssName)
    }

    // 藏干 → 十神
    const cg = CANG_GAN[zhis[i]]
    for (let j = 0; j < LAYER_KEYS.length; j++) {
      const hidden = cg[LAYER_KEYS[j]]
      if (!hidden) continue
      const hiddenShenShi = getShenShi(dayGan, hidden)
      if (hiddenShenShi && hiddenShenShi !== '未知') {
        const ssName2 = hiddenShenShi as ShenShi
        const pos: PillarPosition = `${PILLAR_LABELS[i]}支${LAYER_LABELS[j]}` as PillarPosition
        occurrences.push({
          name: ssName2,
          category: TEN_GOD_CATEGORY[ssName2],
          nature: TEN_GOD_NATURE[ssName2],
          position: pos,
          branch: zhis[i],
          layer: LAYER_LABELS[j] as '本气' | '中气' | '余气',
        })
        cangGanList.push(ssName2)
      }
    }
  }

  return {
    occurrences,
    touGanList,
    cangGanList,
    dayGanShenShi: '比肩',
    monthGanShenShi: (getShenShi(dayGan, monthGan) || '比肩') as ShenShi,
    hourGanShenShi: (getShenShi(dayGan, hourGan) || '比肩') as ShenShi,
  }
}

// ─── Step 2: 十神力量统计 + 旺相休囚死 + 得令得地得势 ───

function analyzeTenGodDetails(
  touCang: TouCangAnalysis,
  dayGan: HeavenlyStem,
  monthZhi: EarthlyBranch,
): TenGodDetail[] {
  const dayElement = getStemElement(dayGan)
  const monthElement = getBranchElement(monthZhi)

  // 五行→十神映射（从日主角度）
  const elementToShenShi: Record<string, ShenShi[]> = {
    [dayElement]: ['比肩', '劫财'],
  }

  // 我生
  const woSheng = GENERATE[dayElement]
  const woKe = OVERCOME[dayElement]
  const keWo = BE_OVERCOME[dayElement]
  const shengWo = BE_GENERATE[dayElement]

  // 我生 → 食伤
  elementToShenShi[woSheng] = ['食神', '伤官']

  // 我克 → 财星
  elementToShenShi[woKe] = ['偏财', '正财']

  // 克我 → 官杀
  elementToShenShi[keWo] = ['偏官', '正官']

  // 生我 → 印星
  elementToShenShi[shengWo] = ['偏印', '正印']

  // 收集每个十神的出现统计
  const stats: Record<string, { count: number; touGan: number; benGan: number; zhongGan: number; yaoGan: number; positions: PillarPosition[] }> = {}
  for (const ss of TEN_GODS) {
    stats[ss] = { count: 0, touGan: 0, benGan: 0, zhongGan: 0, yaoGan: 0, positions: [] }
  }

  for (const occ of touCang.occurrences) {
    const s = stats[occ.name]
    if (!s) continue
    s.count++
    s.positions.push(occ.position)
    if (occ.layer === '天干') s.touGan++
    else if (occ.layer === '本气') s.benGan++
    else if (occ.layer === '中气') s.zhongGan++
    else if (occ.layer === '余气') s.yaoGan++
  }

  // 检查有根
  const zhis = [touCang.occurrences.find(o => o.position.startsWith('年'))?.branch,
    touCang.occurrences.find(o => o.position.startsWith('月'))?.branch,
    touCang.occurrences.find(o => o.position.startsWith('日'))?.branch,
    touCang.occurrences.find(o => o.position.startsWith('时'))?.branch,
  ].filter(Boolean) as EarthlyBranch[]

  // 月支本气对应的十神
  const monthBenGan = CANG_GAN[monthZhi].ben
  const monthBenShenShi = (getShenShi(dayGan, monthBenGan) || '比肩') as ShenShi

  // 构建每个十神的五行映射
  const shenShiToElement: Partial<Record<ShenShi, FiveElement>> = {}
  for (const [elem, ssList] of Object.entries(elementToShenShi)) {
    for (const ss of ssList) {
      shenShiToElement[ss] = elem as FiveElement
    }
  }

  // 构建结果
  const details: TenGodDetail[] = TEN_GODS.map(name => {
    const s = stats[name]
    const cangGan = s.benGan + s.zhongGan + s.yaoGan

    // ─── 力量来源拆分（Power Breakdown）───
    const elem = shenShiToElement[name] ?? dayElement
    const wangShuai: WuXingWangShuai = WANG_SHUAI_TABLE[monthElement]?.[elem] ?? '休'

    // 得令
    const deLing = (monthBenShenShi === name)

    // 得地
    const deDi = cangGan > 0

    // 得势
    const deShi = s.touGan >= 2 || s.count >= 3

    // 有根
    const youGen = zhis.some(zhi => {
      const branchElem = getBranchElement(zhi)
      return branchElem === elem
    })

    // 力量来源贡献分计算
    const bd_deLing = deLing ? 35 : 0
    const bd_deDi = deDi ? Math.min(20, cangGan * 10) : 0
    const bd_deShi = deShi ? 18 : 0
    const bd_youGen = youGen ? 12 : 0
    const bd_touGan = Math.min(15, s.touGan * 8)
    const bd_shengFu = wangShuai === '旺' || wangShuai === '相' ? 6 : 0
    const bd_heHua = 0 // 合化后续由关系网络补充
    const bd_xiuZheng = wangShuai === '死' || wangShuai === '囚' ? -5 : 0

    const powerBreakdown: PowerBreakdown = {
      deLing: bd_deLing,
      deDi: bd_deDi,
      deShi: bd_deShi,
      youGen: bd_youGen,
      touGan: bd_touGan,
      shengFu: bd_shengFu,
      heHua: bd_heHua,
      xiuZheng: bd_xiuZheng,
    }

    // 力量值 = 来源拆分总和，标准化到 0-100
    const rawBreakdown = bd_deLing + bd_deDi + bd_deShi + bd_youGen + bd_touGan + bd_shengFu + bd_heHua + bd_xiuZheng
    const maxBreakdown = 100
    const power = Math.min(100, Math.max(0, Math.round(rawBreakdown / maxBreakdown * 100)))

    // ─── 十神状态 ───
    let state: TenGodState = 'active'
    if (s.count === 0) {
      state = 'hidden'
    } else if (s.touGan === 0 && cangGan > 0) {
      state = 'hidden'
    } else if (wangShuai === '囚' || wangShuai === '死') {
      state = s.count > 0 ? 'suppressed' : 'hidden'
    }
    // damaged/transformed 后续由关系网络补充判断

    // ─── 评分可信度 ───
    // 因素：出现次数、透干数、得令+得地+得势多重确认、旺相
    let conf = 30
    conf += Math.min(20, s.count * 5)       // 出现次数
    conf += Math.min(15, s.touGan * 5)       // 透干加分
    if (deLing) conf += 10                    // 得令加分
    if (deDi) conf += 10                      // 得地加分
    if (deShi) conf += 5                      // 得势加分
    if (wangShuai === '旺' || wangShuai === '相') conf += 10
    const confidence = Math.min(100, Math.max(0, conf))

    // 力量评分
    const strengthScore = power

    // 吉凶评分
    const nature = TEN_GOD_NATURE[name]
    let auspiciousScore = 50
    if (nature === '吉' && power > 30) auspiciousScore = Math.min(100, 50 + power)
    if (nature === '凶' && power > 30) auspiciousScore = Math.max(0, 50 - power)
    if (nature === '中性') auspiciousScore = 50

    // 平衡评分（与理想值30的偏差）
    const balanceScore = Math.max(0, 100 - Math.abs(power - 30) * 2)

    return {
      name,
      category: TEN_GOD_CATEGORY[name],
      nature,
      element: elem,
      count: s.count,
      touGan: s.touGan,
      cangGan,
      benGan: s.benGan,
      zhongGan: s.zhongGan,
      yaoGan: s.yaoGan,
      power,
      wangShuai,
      deLing,
      deDi,
      deShi,
      youGen,
      positions: s.positions,
      strengthScore,
      auspiciousScore,
      balanceScore,
      powerBreakdown,
      state,
      confidence,
    }
  })

  return details
}

// ─── Step 3: 五行力量分析 ───

function analyzeFiveElementPower(
  pillars: ProfessionalFourPillarsResult['sixLines'],
  dayMasterElement: FiveElement,
  monthZhi: EarthlyBranch,
): FiveElementPower[] {
  const counts = calculateFiveElementCount(pillars)
  const monthElement = getBranchElement(monthZhi)
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (['木', '火', '土', '金', '水'] as FiveElement[]).map(elem => {
    const rawCount = counts[elem]
    const percentage = total > 0 ? (rawCount / total) * 100 : 0
    const wangShuai: WuXingWangShuai = WANG_SHUAI_TABLE[monthElement]?.[elem] ?? '休'
    const deLing = monthElement === elem
    const score = Math.round(percentage)
    return { element: elem, rawCount, percentage: Math.round(percentage * 10) / 10, wangShuai, deLing, score }
  })
}

// ─── Step 4: 十神关系网络 ───

function analyzeRelationNetwork(
  details: TenGodDetail[],
  touCang: TouCangAnalysis,
): TenGodRelationNetwork {
  const hitDetails: Record<string, TenGodDetail> = {}
  for (const d of details) {
    if (d.count > 0) hitDetails[d.name] = d
  }

  const relations: TenGodRelation[] = []

  for (const [from, to, type] of TEN_GOD_SHENG_KE_CHAIN) {
    const fromDetail = hitDetails[from]
    const toDetail = hitDetails[to]
    if (!fromDetail || !toDetail) continue

    const strength = Math.round((fromDetail.power + toDetail.power) / 2)
    const typeLabel = type === '生' ? `${from}生${to}` : `${from}克${to}`
    const reason = type === '生' ? `${from}（${fromDetail.element}）生${to}（${toDetail.element}）` : `${from}（${fromDetail.element}）克${to}（${toDetail.element}）`

    relations.push({
      from, to, type,
      description: typeLabel,
      strength,
      direction: 'forward',
      reason,
    })

    // 补充反向关系
    if (type === '生') {
      relations.push({
        from: to, to: from, type: '泄',
        description: `${to}泄${from}`,
        strength: Math.round(strength * 0.7),
        direction: 'forward',
        reason: `${to}被${from}所生，故泄${to}之气`,
      })
    }
    if (type === '克') {
      relations.push({
        from: to, to: from, type: '耗',
        description: `${to}耗${from}`,
        strength: Math.round(strength * 0.5),
        direction: 'forward',
        reason: `${to}被${from}所克，故耗${from}之力`,
      })
    }
  }

  // 生克链描述
  const chainParts: string[] = []
  chainParts.push('比劫 → 生 → 食伤 → 生 → 财星 → 生 → 官杀 → 生 → 印星 → 生 → 比劫')
  chainParts.push('比劫 ─克→ 财星 | 食伤 ─克→ 官杀 | 财星 ─克→ 印星 | 官杀 ─克→ 比劫 | 印星 ─克→ 食伤')
  chainParts.push('扩展：食伤 ─泄→ 比劫 | 财星 ─耗→ 食伤 | 官杀 ─耗→ 财星 | 印星 ─泄→ 官杀 | 比劫 ─耗→ 印星')

  // 核心关系（力量最高的前5条）
  const coreRelations = [...relations].sort((a, b) => b.strength - a.strength).slice(0, 5)

  const harmonyRelations = relations.filter(r => r.type === '生')
  const conflictRelations = relations.filter(r => r.type === '克')

  return {
    relations,
    shengKeChain: chainParts.join('\n'),
    coreRelations,
    conflictRelations,
    harmonyRelations,
  }
}

// ─── Step 5: 十神组合匹配 ───

function analyzeCombinations(
  details: TenGodDetail[],
): TenGodCombination[] {
  const detailMap: Record<string, TenGodDetail> = {}
  for (const d of details) {
    detailMap[d.name] = d
  }

  return TEN_GOD_COMBINATION_RULES.map(rule => {
    // 检查涉及的十神是否都存在且有一定力量
    const allHit = rule.involvedShenShi.every(ss => {
      const d = detailMap[ss]
      return d && d.power > 20
    })

    return {
      ...rule,
      hit: allHit,
    }
  })
}

// ─── 缓存 ───

const engineCache = new Map<string, TenGodEngineOutput>()

function buildCacheKey(dayMaster: HeavenlyStem, sixLinesStr: string, gender: string): string {
  return `tg-v${TEN_GODS_CACHE_VERSION}-${dayMaster}-${sixLinesStr}-${gender}`
}

export function clearTenGodsCache(): void {
  engineCache.clear()
}

export function getTenGodsCacheSize(): number {
  return engineCache.size
}

// ─── 主引擎入口 ───

export interface TenGodsEngineOptions {
  gender: string
  config?: ProfessionalConfig
}

export function calculateTenGods(
  pillars: ProfessionalFourPillarsResult,
  options: TenGodsEngineOptions,
): TenGodEngineOutput {
  const engineStart = Date.now()
  const { gender, config = CLASSIC_CONFIG } = options

  const { sixLines, dayMaster, dayMasterElement, dayMasterYinYang } = pillars
  const { year, month, day, hour } = sixLines

  // 缓存检查
  const cacheKey = buildCacheKey(dayMaster, `${year.gan}${year.zhi}${month.gan}${month.zhi}${day.gan}${day.zhi}${hour.gan}${hour.zhi}`, gender)
  const cached = engineCache.get(cacheKey)
  if (cached) return { ...cached, computeTimeMs: 0 }

  const allSteps: DerivationStep[] = []
  const warnings: string[] = []

  // Step 1: 透藏分析
  const touCang = analyzeTouCang(year.gan, year.zhi, month.gan, month.zhi, day.gan, day.zhi, hour.gan, hour.zhi)

  allSteps.push({
    id: 'tg-toucang',
    name: '十神透藏分析',
    input: { dayMaster },
    output: { touGanCount: touCang.touGanList.length, cangGanCount: touCang.cangGanList.length, total: touCang.occurrences.length },
    confidence: 1.0,
    algorithmVersion: config.algorithmVersion,
    source: config.defaultSource,
    timestamp: Date.now(),
  })

  // Step 2: 十神力量 + 旺相休囚死
  const details = analyzeTenGodDetails(touCang, dayMaster, month.zhi)

  allSteps.push({
    id: 'tg-details',
    name: '十神力量统计',
    input: { dayMaster, monthZhi: month.zhi },
    output: { items: details.filter(d => d.count > 0).map(d => ({ name: d.name, power: d.power, wangShuai: d.wangShuai })) },
    confidence: 0.95,
    algorithmVersion: config.algorithmVersion,
    source: config.defaultSource,
    timestamp: Date.now(),
  })

  // Step 3: 五行力量
  const fiveElementPower = analyzeFiveElementPower(sixLines, dayMasterElement, month.zhi)

  // Step 4: 关系网络
  const relationNetwork = analyzeRelationNetwork(details, touCang)

  allSteps.push({
    id: 'tg-relations',
    name: '十神关系网络',
    input: { hitCount: details.filter(d => d.count > 0).length },
    output: { harmonyCount: relationNetwork.harmonyRelations.length, conflictCount: relationNetwork.conflictRelations.length },
    confidence: 0.90,
    algorithmVersion: config.algorithmVersion,
    source: config.defaultSource,
    timestamp: Date.now(),
  })

  // Step 5: 组合匹配
  const combinations = analyzeCombinations(details)

  // Step 6: 关系规则匹配
  const detailMap: Record<string, TenGodDetail> = {}
  for (const d of details) detailMap[d.name] = d
  const hitRules = TEN_GOD_RELATION_RULES.filter(r => r.check(detailMap))
  if (hitRules.length > 0) {
    for (const r of hitRules) {
      if (!r.auspicious) warnings.push('MULTI_RULE_CONFLICT')
    }
  }

  // FORMULA_OUT_OF_RANGE: 检查是否有十神力量评分超出合理范围
  const outOfRangeDetails = details.filter(d => d.count > 0 && (d.power < 5 || d.power > 95))
  if (outOfRangeDetails.length > 0) {
    warnings.push('FORMULA_OUT_OF_RANGE')
  }

  // LOW_CONFIDENCE: 检查主力十神的平均置信度
  const activeDetails = details.filter(d => d.count > 0)
  if (activeDetails.length > 0) {
    const avgConfidence = activeDetails.reduce((s, d) => s + d.confidence, 0) / activeDetails.length
    if (avgConfidence < 50) {
      warnings.push('LOW_CONFIDENCE')
    }
  }

  allSteps.push({
    id: 'tg-rules',
    name: '十神关系规则匹配',
    input: { ruleCount: TEN_GOD_RELATION_RULES.length },
    output: { hitRules: hitRules.map(r => r.name) },
    confidence: 0.90,
    algorithmVersion: config.algorithmVersion,
    source: config.defaultSource,
    timestamp: Date.now(),
  })

  // Step 7: 排序
  const sortedByPower = [...details].sort((a, b) => b.power - a.power).map(d => d.name)
  const dominantShenShi = details.filter(d => d.power > 70).map(d => d.name)
  const primaryShenShi = details.filter(d => d.power > 40 && d.power <= 70).map(d => d.name)
  const secondaryShenShi = details.filter(d => d.power > 20 && d.power <= 40).map(d => d.name)
  const tertiaryShenShi = details.filter(d => d.power <= 20).map(d => d.name)

  // Step 8: 总体评分
  const overallAuspiciousScore = Math.round(
    details.reduce((sum, d) => sum + d.auspiciousScore * (d.count > 0 ? 1 : 0.3), 0) / 10
  )
  const overallBalanceScore = Math.round(
    details.filter(d => d.count > 0).reduce((sum, d) => sum + d.balanceScore, 0) /
    Math.max(1, details.filter(d => d.count > 0).length)
  )

  const computeTimeMs = Date.now() - engineStart

  // Step 9: 候选格局提取（供 Module4 复用）
  const hitCombinations = combinations.filter(c => c.hit)
  const possiblePatterns: PatternCandidate[] = hitCombinations.map(c => ({
    name: c.name,
    confidence: c.confidence,
    involvedShenShi: c.involvedShenShi,
    reference: c.reference,
  }))

  // Step 10: 执行元数据
  const executionMetadata: ExecutionMetadata = {
    executionTime: computeTimeMs,
    ruleCount: TEN_GOD_RELATION_RULES.length + TEN_GOD_COMBINATION_RULES.length,
    matchedRules: hitRules.length + hitCombinations.length,
  }

  const output: TenGodEngineOutput = {
    version: TEN_GODS_ENGINE_VERSION,
    dayMaster,
    dayMasterElement,
    dayMasterYinYang,
    details,
    touCang,
    fiveElementPower,
    relationNetwork,
    combinations,
    sortedByPower,
    dominantShenShi,
    primaryShenShi,
    secondaryShenShi,
    tertiaryShenShi,
    overallAuspiciousScore,
    overallBalanceScore,
    warnings,
    computeTimeMs,
    executionMetadata,
    possiblePatterns,
    cacheVersion: TEN_GODS_CACHE_VERSION,
    derivation: createChain(allSteps, computeTimeMs, {
      engineVersion: TEN_GODS_ENGINE_VERSION,
      algorithmVersion: config.algorithmVersion,
      warnings,
    }),
  }

  engineCache.set(cacheKey, output)
  return output
}
