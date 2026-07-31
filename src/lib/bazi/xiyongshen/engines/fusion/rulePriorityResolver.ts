/**
 * RulePriorityResolver - 规则优先级矩阵（动态，非固定 Weight）
 *
 * 核心思想：
 *   不是固定 Balance 0.25 / Climate 0.20 / Pattern 0.10
 *   而是先判断"命局到底谁最有发言权"：
 *     冬火     → Climate >>> Pattern >>> Balance
 *     身旺极旺 → Balance >>> Pattern >>> Climate
 *     病药格   → Medicine >>> Balance >>> Climate
 *     金木大战 → Bridge >>> Pattern >>> Balance
 *
 * 输入：SubEngineResults + SubEngineInput（命局信息）
 * 输出：RulePriorityMatrix（各引擎动态 priority 和为 1）
 */

import type { Wuxing } from '../../types'
import type { SubEngineInput, SubEngineResult } from '../types'
import type {
  RulePriorityMatrix, RulePriorityEntry, MingjuPatternType, SchoolProfile,
} from './types'
import { getEngineWeight } from './schoolProfile'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']

/** 引擎名列表 */
const ENGINE_NAMES = [
  'StrengthEngine', 'PatternEngine', 'ClimateEngine', 'BalanceEngine',
  'MedicineEngine', 'BridgeEngine', 'SeasonEngine',
] as const

/** Rule Gate / Rule Kill 触发前，先做命局特征识别 → 算优先级矩阵 */
export class RulePriorityResolver {
  /**
   * 生成 RulePriorityMatrix
   */
  resolve(
    input: SubEngineInput,
    subResults: SubEngineResult[],
    profile: SchoolProfile,
  ): RulePriorityMatrix {
    // Step 1: 识别命局特征（可多个）
    const detectedPatterns = this.detectMingjuPatterns(input, subResults)
    const patternSummary = this.summarizePatterns(detectedPatterns)

    // Step 2: 计算每个引擎的基础调整因子（基于命局特征）
    const rawEntries: RulePriorityEntry[] = ENGINE_NAMES.map(name => {
      const baseWeight = getEngineWeight(profile, name)
      const { adjustmentFactor, reason, sourcePattern } = this.calculateAdjustment(
        name, detectedPatterns, input, subResults, profile,
      )
      return {
        engineName: name,
        priority: 0, // 归一化后填充
        baseWeight,
        adjustmentFactor,
        reason,
        sourcePattern,
      }
    })

    // Step 3: 计算 priority = baseWeight × adjustmentFactor，再归一化到和为 1
    const unnormalized = rawEntries.map(e => e.baseWeight * e.adjustmentFactor)
    const sum = unnormalized.reduce((a, b) => a + b, 0)
    const entries: RulePriorityEntry[] = rawEntries.map((e, i) => ({
      ...e,
      priority: sum > 0 ? Number((unnormalized[i] / sum).toFixed(4)) : 0,
    }))

    // Step 4: 快速索引
    const byEngine: Record<string, RulePriorityEntry> = {}
    for (const e of entries) {
      byEngine[e.engineName] = e
    }

    return {
      detectedPatterns,
      patternSummary,
      entries,
      byEngine,
      generatedAt: Date.now(),
    }
  }

  // ============================================================
  // 命局特征识别（核心算法）
  // ============================================================

  /** 识别命局特征 */
  private detectMingjuPatterns(
    input: SubEngineInput,
    subResults: SubEngineResult[],
  ): MingjuPatternType[] {
    const patterns: MingjuPatternType[] = []

    const bazi = input.bazi ?? {}
    const month = bazi.month ?? ''
    const dayMaster = bazi.dayMaster ?? ''

    // --- 1. 调候优先类 ---
    // 冬火（冬天出生的火日主）
    if (['寅月', '卯月'].includes(month) === false) {
      const winterMonths = ['亥月', '子月', '丑月']
      if (winterMonths.includes(month) && ['丙', '丁'].includes(dayMaster)) {
        patterns.push('winter_fire')
      }
    }
    // 夏水（夏天出生的水日主）
    const summerMonths = ['巳月', '午月', '未月']
    if (summerMonths.includes(month) && ['壬', '癸'].includes(dayMaster)) {
      patterns.push('summer_water')
    }
    // 也通过 ClimateEngine 结果确认：如果 ClimateEngine confidence 极高
    const climateResult = subResults.find(r => r.engineName === 'ClimateEngine')
    if (climateResult && climateResult.applicable && climateResult.confidence >= 0.9) {
      if (!patterns.includes('winter_fire') && !patterns.includes('summer_water')) {
        // 高置信度调候也作为弱特征
        if (winterMonths.includes(month) || summerMonths.includes(month)) {
          patterns.push('winter_fire') // 作为一般调候优先类
        }
      }
    }

    // --- 2. 扶抑优先类 ---
    const balanceResult = subResults.find(r => r.engineName === 'BalanceEngine')
    if (balanceResult && balanceResult.applicable) {
      const strengthScore = balanceResult.scores[dayMasterToWuxing(dayMaster)] ?? 0
      // 身旺极旺 / 身弱极弱
      if (strengthScore >= 2.5) patterns.push('extreme_strong')
      if (strengthScore <= -2.5) patterns.push('extreme_weak')
    }

    // --- 3. 病药优先类 ---
    const medicineResult = subResults.find(r => r.engineName === 'MedicineEngine')
    if (medicineResult && medicineResult.applicable && medicineResult.confidence >= 0.8) {
      // 病药特征：有明确的"病"和"药"，Evidence >= 4
      const evidenceCount = medicineResult.evidence.filter(e => e.satisfied).length
      if (evidenceCount >= 3) {
        patterns.push('medicine_pattern')
      }
    }

    // --- 4. 通关优先类 ---
    const bridgeResult = subResults.find(r => r.engineName === 'BridgeEngine')
    if (bridgeResult && bridgeResult.applicable && bridgeResult.confidence >= 0.8) {
      const blockingEvidence = bridgeResult.evidence.filter(e =>
        e.step.includes('阻塞') || e.step.includes('战') || e.satisfied,
      )
      if (blockingEvidence.length >= 2) {
        patterns.push('bridge_war')
      }
    }

    // --- 5. 格局优先类 ---
    const patternResult = subResults.find(r => r.engineName === 'PatternEngine')
    if (patternResult && patternResult.applicable && patternResult.confidence >= 0.85) {
      // 特殊格局：如从格、化气格、专旺格
      const specialPatternKeywords = ['从', '专旺', '化气', '曲直', '炎上', '稼穑', '从革', '润下']
      const hasSpecial = patternResult.evidence.some(e =>
        specialPatternKeywords.some(k => e.text.includes(k)),
      ) || (patternResult.summary ?? '').includes('从')
      if (hasSpecial) {
        patterns.push('special_pattern')
      }
    }

    // --- 6. 中和（没有明显特征） ---
    if (patterns.length === 0) {
      patterns.push('balanced')
    }

    return patterns
  }

  /** 命局特征摘要（中文） */
  private summarizePatterns(patterns: MingjuPatternType[]): string {
    const map: Record<MingjuPatternType, string> = {
      winter_fire: '冬火调候优先',
      summer_water: '夏水调候优先',
      extreme_strong: '身旺极旺（扶抑优先）',
      extreme_weak: '身弱极弱（扶抑优先）',
      medicine_pattern: '病药格（病药优先）',
      bridge_war: '两神交战（通关优先）',
      special_pattern: '特殊格局（格局优先）',
      balanced: '中和命局（均衡权衡）',
    }
    return patterns.map(p => map[p]).join(' + ')
  }

  // ============================================================
  // 基于命局特征，计算各引擎的动态调整因子
  // ============================================================

  /**
   * 计算某引擎的 adjustmentFactor（相对倍率）
   *   1.0  = 保持不变
   *   1.5+ = 提升优先级（feature 命中）
   *   0.5- = 降低优先级（不重要）
   */
  private calculateAdjustment(
    engineName: string,
    patterns: MingjuPatternType[],
    input: SubEngineInput,
    subResults: SubEngineResult[],
    profile: SchoolProfile,
  ): { adjustmentFactor: number; reason: string; sourcePattern?: MingjuPatternType } {
    let factor = 1.0
    let reason = '默认权重，无特殊调优'
    let sourcePattern: MingjuPatternType | undefined

    const subResult = subResults.find(r => r.engineName === engineName)
    const applicableBoost = subResult?.applicable ? 1.0 : 0.2

    const hasPattern = (p: MingjuPatternType) => patterns.includes(p)

    // --- ClimateEngine / SeasonEngine：调候优先场景 ---
    if (engineName === 'ClimateEngine' || engineName === 'SeasonEngine') {
      if (hasPattern('winter_fire')) {
        factor = 2.2
        reason = '冬火：调候为急，《穷通宝鉴》以调候用神为第一要义'
        sourcePattern = 'winter_fire'
      } else if (hasPattern('summer_water')) {
        factor = 2.1
        reason = '夏水：调候优先，防炎上干涸'
        sourcePattern = 'summer_water'
      } else if (hasPattern('balanced')) {
        factor = 1.0
        reason = '中和命局，调候为辅'
      }
    }

    // --- BalanceEngine：扶抑优先场景 ---
    if (engineName === 'BalanceEngine') {
      if (hasPattern('extreme_strong')) {
        factor = 2.3
        reason = '身旺极旺，扶抑法（克泄耗）为第一优先级'
        sourcePattern = 'extreme_strong'
      } else if (hasPattern('extreme_weak')) {
        factor = 2.3
        reason = '身弱极弱，扶抑法（生扶比劫印枭）为第一优先级'
        sourcePattern = 'extreme_weak'
      } else if (hasPattern('winter_fire')) {
        factor = 0.6
        reason = '冬火调候优先，扶抑退居次要'
      }
    }

    // --- MedicineEngine：病药优先场景 ---
    if (engineName === 'MedicineEngine') {
      if (hasPattern('medicine_pattern')) {
        factor = 2.0
        reason = '病药格：有病方为贵，无伤不是奇，药到病除为用'
        sourcePattern = 'medicine_pattern'
      } else if (hasPattern('winter_fire')) {
        factor = 0.7
        reason = '冬火调候优先，病药体系退居次要'
      }
    }

    // --- BridgeEngine：通关优先场景 ---
    if (engineName === 'BridgeEngine') {
      if (hasPattern('bridge_war')) {
        factor = 2.4
        reason = '两神交战，通关为要，《滴天髓》"关内有织女，关外有牛郎，此关若通也，相邀入洞房"'
        sourcePattern = 'bridge_war'
      }
    }

    // --- PatternEngine：格局优先场景 ---
    if (engineName === 'PatternEngine') {
      if (hasPattern('special_pattern')) {
        factor = 2.5
        reason = '特殊格局（从格/专旺/化气），格局取用为宗'
        sourcePattern = 'special_pattern'
      } else if (hasPattern('balanced')) {
        factor = 1.3
        reason = '中和命局，格局为辅，提升格局权重'
      }
    }

    // 引擎自身不适用 → 显著降权（但保留最低值，避免被完全无视）
    factor *= applicableBoost

    // 使用流派配置的 enginePriorities 作为软加权（再乘 0.8~1.2）
    const prio = profile.enginePriorities[engineName] ?? 3
    factor *= 0.8 + (prio / 5) * 0.4

    return {
      adjustmentFactor: Number(factor.toFixed(4)),
      reason,
      sourcePattern,
    }
  }
}

/** 辅助：日主天干 → 五行 */
function dayMasterToWuxing(dayMaster: string): Wuxing {
  const map: Record<string, Wuxing> = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水',
  }
  return map[dayMaster] ?? '土'
}

/** 全局默认实例 */
export const globalRulePriorityResolver = new RulePriorityResolver()
